/**
 * CTX-12 Supporters service.
 *
 * Tracks tokens, ranks, tiers, and audit trail for the Supporters program.
 * Webhook handlers call these functions to credit tokens on LemonSqueezy
 * events. User registration calls reclaimUnmatchedForEmail to claim any
 * pending tokens paid before sign-up (see D-AUTO-04).
 *
 * Locked decisions:
 *  D-51  — tier thresholds (10/30/60/100)
 *  D-AUTO-02 — PWYW unlimited, 1 USD cent / 100 = 1 token, BIGINT (no FLOAT)
 *  D-AUTO-03 — tiebreak by (tokens DESC, joined_at ASC)
 *  D-AUTO-04 — user matching: custom_data.user_id → email → unmatched queue
 */

import type { Sql } from "postgres"
import crypto from "crypto"

// --- Types -------------------------------------------------------------

export type SupporterTier = "diamond" | "gold" | "silver" | "bronze" | "pending"

export type SupporterStatus = "active" | "warning" | "frozen" | "exiting"

export type TransactionType =
  | "purchase"              // one-time Supporter donation
  | "subscription_payment"  // recurring Starter/Pro payment
  | "task"                  // approved task reward
  | "referral"              // referral bonus
  | "revshare"              // quarterly rev share distribution
  | "adjustment"            // manual correction

export type SourceType =
  | "lemonsqueezy_order"
  | "lemonsqueezy_subscription"
  | "task"
  | "referral"
  | "manual"

export interface RecordTransactionInput {
  userId: string | null
  email: string | null
  type: TransactionType
  amountTokens: number
  amountUsdCents: number | null
  sourceType: SourceType
  sourceId: string | null
  metadata?: Record<string, unknown>
}

// --- LemonSqueezy variant mapping (D-62) -------------------------------

export const LS_VARIANTS = {
  supporter: "1516645",
  starter: "1516676",
  pro: "1516706",
} as const

export type LsVariantKind = "supporter" | "starter" | "pro" | "unknown"

export function variantToKind(variantId: string | number | null | undefined): LsVariantKind {
  const v = String(variantId ?? "")
  if (v === LS_VARIANTS.supporter) return "supporter"
  if (v === LS_VARIANTS.starter) return "starter"
  if (v === LS_VARIANTS.pro) return "pro"
  return "unknown"
}

// --- Tier thresholds (D-51) --------------------------------------------
//
// Ranks are 1-indexed leaderboard positions (NOT token counts). The
// actual rank is computed by the W2 ranking job; this module only maps
// rank → tier name.

export const TIER_THRESHOLDS = {
  diamond: { maxRank: 10 },
  gold: { maxRank: 30 },
  silver: { maxRank: 60 },
  bronze: { maxRank: 100 },
} as const

export function rankToTier(rank: number | null): SupporterTier {
  if (rank === null || !Number.isFinite(rank) || rank < 1) return "pending"
  if (rank <= TIER_THRESHOLDS.diamond.maxRank) return "diamond"
  if (rank <= TIER_THRESHOLDS.gold.maxRank) return "gold"
  if (rank <= TIER_THRESHOLDS.silver.maxRank) return "silver"
  if (rank <= TIER_THRESHOLDS.bronze.maxRank) return "bronze"
  return "pending"
}

// --- Helpers -----------------------------------------------------------

export function genId(): string {
  return crypto.randomBytes(12).toString("hex")
}

/**
 * Convert USD cents to tokens per D-AUTO-02 (1 USD = 1 token, unlimited).
 * Rounds down (generous to Contexter on partial dollars).
 */
export function tokensFromCents(cents: number): number {
  if (!Number.isFinite(cents) || cents < 0) return 0
  return Math.floor(cents / 100)
}

// --- Transactions ------------------------------------------------------

/**
 * Idempotent insert into supporter_transactions.
 *
 * Returns new row id, or null if a row with the same (source_type, source_id)
 * already exists. Idempotency check is a pre-SELECT (race-safe-enough for
 * webhook processing — LS does not issue duplicates concurrently in practice).
 * Callers MUST treat null as "already processed, no-op".
 */
export async function recordTransaction(
  sql: Sql,
  input: RecordTransactionInput,
): Promise<string | null> {
  if (input.sourceId) {
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM supporter_transactions
      WHERE source_type = ${input.sourceType} AND source_id = ${input.sourceId}
      LIMIT 1
    `
    if (existing.length > 0) return null
  }

  const id = genId()
  const metadata = input.metadata ?? {}
  const matchedAt = input.userId ? new Date() : null

  await sql`
    INSERT INTO supporter_transactions
      (id, user_id, email, type, amount_tokens, amount_usd_cents,
       source_type, source_id, metadata, matched_at)
    VALUES
      (${id}, ${input.userId}, ${input.email}, ${input.type},
       ${input.amountTokens}, ${input.amountUsdCents},
       ${input.sourceType}, ${input.sourceId},
       ${sql.json(metadata as never)}, ${matchedAt})
  `
  return id
}

// --- Supporter row operations ------------------------------------------

/**
 * Credit tokens to a supporter. Creates the row on first credit.
 *
 * On insert, uses joinedAt if provided (for backdated reclaims), otherwise
 * NOW(). On conflict, increments tokens and stamps updated_at — joined_at
 * is never overwritten.
 */
export async function creditTokens(
  sql: Sql,
  userId: string,
  tokens: number,
  joinedAt?: Date,
): Promise<void> {
  if (tokens <= 0) return

  const joinedAtValue = joinedAt ?? new Date()

  await sql`
    INSERT INTO supporters (user_id, tokens, joined_at)
    VALUES (${userId}, ${tokens}, ${joinedAtValue})
    ON CONFLICT (user_id) DO UPDATE
      SET tokens = supporters.tokens + EXCLUDED.tokens,
          updated_at = NOW()
  `
}

// --- Matching ----------------------------------------------------------

/**
 * Case-insensitive email lookup in users table. Returns user_id or null.
 */
export async function matchEmailToUser(
  sql: Sql,
  email: string,
): Promise<string | null> {
  const rows = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `
  const first = rows[0]
  return first ? first.id : null
}

/**
 * Match a LemonSqueezy webhook to a user per D-AUTO-04.
 *
 * Order:
 *  1. custom_data.user_id (logged-in checkout) — validated against users table
 *  2. case-insensitive email lookup
 *  3. null (unmatched — caller must queue tx with user_id NULL)
 *
 * Never creates a placeholder user. Safe for webhook idempotency.
 */
export async function matchSupporter(
  sql: Sql,
  opts: { email: string | null; customDataUserId: string | null },
): Promise<string | null> {
  if (opts.customDataUserId) {
    const byId = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE id = ${opts.customDataUserId} LIMIT 1
    `
    const first = byId[0]
    if (first) return first.id
  }
  if (opts.email) {
    return matchEmailToUser(sql, opts.email)
  }
  return null
}

/**
 * Reclaim queued unmatched transactions for an email on user registration.
 *
 * 1. Finds all supporter_transactions rows with user_id IS NULL matching the
 *    email (case-insensitive). Ordered by created_at ASC so the earliest
 *    payment defines the supporter's joined_at.
 * 2. Updates them to point at the new user_id and stamps matched_at.
 * 3. For each row whose type earns tokens (purchase/subscription_payment/
 *    referral/task/revshare), calls creditTokens with the row's
 *    amount_tokens. Per-row calls keep future creditTokens side effects
 *    (tier auto-assign, audit logging) in sync with the reclaim path.
 *
 * Returns total tokens credited (sum of amount_tokens across earning rows).
 * Transaction-wrapped so partial reclaims never happen.
 */
export async function reclaimUnmatchedForEmail(
  sql: Sql,
  userId: string,
  email: string,
): Promise<number> {
  const result = await sql.begin(async (txRaw) => {
    // postgres TransactionSql is Omit<Sql, ...> which drops the call
    // signature in TS; runtime is identical. Cast matches billing.ts pattern.
    const tx = txRaw as unknown as Sql

    const updated = await tx<
      {
        id: string
        type: string
        amount_tokens: string | number
        created_at: Date | string
      }[]
    >`
      UPDATE supporter_transactions
      SET user_id = ${userId}, matched_at = NOW()
      WHERE user_id IS NULL AND LOWER(email) = LOWER(${email})
      RETURNING id, type, amount_tokens, created_at
    `

    if (updated.length === 0) return 0

    const creditingTypes: ReadonlyArray<TransactionType> = [
      "purchase",
      "subscription_payment",
      "referral",
      "task",
      "revshare",
    ]

    // Earliest created_at across matched rows defines supporter.joined_at
    // on first-insert (later increments leave joined_at untouched).
    let earliest: Date | null = null
    for (const row of updated) {
      const ts = row.created_at instanceof Date
        ? row.created_at
        : new Date(row.created_at)
      if (earliest === null || ts.getTime() < earliest.getTime()) {
        earliest = ts
      }
    }
    const joinedAt = earliest ?? new Date()

    let totalTokens = 0
    for (const row of updated) {
      const type = row.type as TransactionType
      if (!creditingTypes.includes(type)) continue
      const amount = Number(row.amount_tokens)
      if (!Number.isFinite(amount) || amount <= 0) continue
      await creditTokens(tx, userId, amount, joinedAt)
      totalTokens += amount
    }

    return totalTokens
  })
  return result as unknown as number
}
