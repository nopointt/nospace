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
import type { Env } from "../types/env"

// --- Types -------------------------------------------------------------

export type SupporterTier = "diamond" | "gold" | "silver" | "bronze" | "pending"

export type SupporterStatus = "active" | "warning" | "quarantined" | "frozen" | "exiting"

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

// --- Tier multipliers (D-52 accelerating earn rate) --------------------
//
// Applied ONLY to subscription_payment_success in W2. Order-created PWYW
// and reclaim paths credit at the base 1:1 rate (see W2-03 spec).
//
// Integer-math form so we never touch floats: creditedTokens = base * num / den
// with floor truncation on integer division.

export const TIER_MULTIPLIERS: Record<SupporterTier, { num: bigint; den: bigint }> = {
  diamond: { num: 2n, den: 1n },
  gold: { num: 3n, den: 2n },
  silver: { num: 5n, den: 4n },
  bronze: { num: 1n, den: 1n },
  pending: { num: 1n, den: 1n },
}

// --- Helpers -----------------------------------------------------------

export function genId(): string {
  return crypto.randomBytes(12).toString("hex")
}

// --- W4-01: Supporter gate + task submission ---------------------------
//
// ADD-1 (spec addendum): Token-earning endpoints (tasks, referrals) MUST
// gate on an existing supporters row. Otherwise creditTokens would create
// a phantom supporters row for non-supporters, bypassing the 100-spot cap.
//
// BB-06: SupporterStatus is now properly widened to include "quarantined",
// so the gate result carries the full typed status directly.

export type SupporterGateResult =
  | { ok: true; tier: SupporterTier; status: SupporterStatus }
  | { ok: false; reason: "not_found" | "exiting" }

export async function requireActiveSupporter(
  sql: Sql,
  userId: string,
): Promise<SupporterGateResult> {
  const rows = await sql<{ tier: SupporterTier; status: SupporterStatus }[]>`
    SELECT tier, status FROM supporters WHERE user_id = ${userId} LIMIT 1
  `
  if (rows.length === 0) return { ok: false, reason: "not_found" }
  const first = rows[0]!
  if (first.status === "exiting") return { ok: false, reason: "exiting" }
  return { ok: true, tier: first.tier, status: first.status }
}

// --- W4-01: Task constants ---------------------------------------------

export type TaskType =
  | "bug_report"
  | "referral_signup"
  | "referral_paid"
  | "social_share"
  | "review"

// Token rewards per task type (locked by spec W4-01).
export const TASK_TOKEN_AMOUNTS: Record<TaskType, number> = {
  bug_report: 10,
  referral_signup: 3,
  referral_paid: 5,
  social_share: 2,
  review: 5,
}

// D-54: monthly cap enforced by W4-03 on approval, not submission.
export const MONTHLY_TASK_CAP = 50

/**
 * Insert a pending supporter_tasks row for a user.
 *
 * Validation-only helper: does NOT enforce the supporter gate (ADD-1) —
 * callers (HTTP route) must call requireActiveSupporter first. Does NOT
 * credit tokens — credit happens on admin approval (W4-02).
 *
 * Throws on invalid input so the caller can map to HTTP 400:
 *  - "invalid_task_type" — taskType not in TASK_TOKEN_AMOUNTS
 *  - "description_too_long" — trimmed description exceeds 1000 chars
 */
export async function submitTask(
  sql: Sql,
  userId: string,
  taskType: string,
  description?: string,
): Promise<{ id: string; taskType: TaskType; amountTokens: number; status: "pending" }> {
  if (!(taskType in TASK_TOKEN_AMOUNTS)) {
    throw new Error("invalid_task_type")
  }
  const typedTaskType = taskType as TaskType
  const amountTokens = TASK_TOKEN_AMOUNTS[typedTaskType]

  let desc: string | null = null
  if (description !== undefined && description !== null) {
    const trimmed = String(description).trim()
    if (trimmed.length > 1000) throw new Error("description_too_long")
    desc = trimmed.length > 0 ? trimmed : null
  }

  const id = genId()
  await sql`
    INSERT INTO supporter_tasks (id, user_id, task_type, amount_tokens, status, description)
    VALUES (${id}, ${userId}, ${typedTaskType}, ${amountTokens}, 'pending', ${desc})
  `
  return { id, taskType: typedTaskType, amountTokens, status: "pending" }
}

// --- W4-02: Admin allowlist check --------------------------------------
//
// Reads Env.ADMIN_USER_IDS (comma-separated) and returns whether the given
// user id is on the allowlist. D-AUTO-W4-03: nopoint is currently the sole
// admin; this helper is cheap enough to call on every admin request (no
// caching needed, string ops only).

export function isAdmin(userId: string, env: Env): boolean {
  const raw = env.ADMIN_USER_IDS ?? ""
  if (!raw) return false
  const allowlist = raw.split(",").map((s) => s.trim()).filter(Boolean)
  return allowlist.includes(userId)
}

// --- W4-03: Monthly task cap check -------------------------------------
//
// Returns the current month's approved-task token total for the user and
// whether `requestedTokens` more would stay within MONTHLY_TASK_CAP.
//
// Counting rules (spec §W4-03):
//  - Only status='approved' rows count (rejected/pending do not).
//  - Window is the current calendar month (UTC via date_trunc).
//  - Cap is evaluated on the credit action, not the submission: users may
//    submit many tasks in a month, admin approves up to 50 tokens worth.
//
// MUST be called inside a transaction that already holds
// pg_advisory_xact_lock(hashtext('task_cap:' || userId)) to serialize
// concurrent approvals for the same user (see ADD-2).

export async function checkTaskCapForUser(
  sql: Sql,
  userId: string,
  requestedTokens: number,
): Promise<{ allowed: boolean; already: number; remaining: number; cap: number }> {
  const rows = await sql<{ sum: string | null }[]>`
    SELECT COALESCE(SUM(amount_tokens), 0)::text AS sum
    FROM supporter_tasks
    WHERE user_id = ${userId}
      AND status = 'approved'
      AND reviewed_at >= date_trunc('month', NOW())
  `
  const already = Number(rows[0]?.sum ?? "0")
  const remaining = Math.max(0, MONTHLY_TASK_CAP - already)
  const allowed = requestedTokens <= remaining
  return { allowed, already, remaining, cap: MONTHLY_TASK_CAP }
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

/**
 * Credit tokens to a supporter with the D-52 tier multiplier applied.
 *
 * Behavior:
 *  1. Looks up the current tier of the user in the supporters table.
 *     If the user has no supporter row, treats tier as 'pending' (1x).
 *  2. Computes credited = floor(baseTokens * num / den) using BigInt math.
 *  3. Delegates to creditTokens with the multiplied amount.
 *
 * Returns {baseTokens, multiplier, creditedTokens} so callers (tests,
 * webhooks) can log the multiplier transparently.
 *
 * NOTE: This function is wired into subscription_payment_success ONLY.
 * Order-created and reclaimUnmatchedForEmail stay at the base 1:1 rate
 * per W2-03 scope (no silent behavior change to W1 paths).
 */
export async function creditTokensWithMultiplier(
  sql: Sql,
  userId: string,
  baseTokens: number,
  joinedAt?: Date,
): Promise<{ baseTokens: number; multiplier: string; creditedTokens: number }> {
  if (baseTokens <= 0) {
    return { baseTokens, multiplier: "1x", creditedTokens: 0 }
  }

  const tierRows = await sql<{ tier: SupporterTier }[]>`
    SELECT tier FROM supporters WHERE user_id = ${userId} LIMIT 1
  `
  const firstTier = tierRows[0]
  const tier: SupporterTier = firstTier ? firstTier.tier : "pending"
  const mult = TIER_MULTIPLIERS[tier]
  const baseBig = BigInt(baseTokens)
  const creditedBig = (baseBig * mult.num) / mult.den
  const credited = Number(creditedBig)
  await creditTokens(sql, userId, credited, joinedAt)
  return {
    baseTokens,
    multiplier: `${mult.num}/${mult.den}`,
    creditedTokens: credited,
  }
}

/**
 * W2-07: Credit tokens to a supporter with quarantine intake check.
 *
 * If the ranked set already has 100 active/warning supporters and this
 * user has no supporter row yet, the new row is created with
 * status='quarantined'. Otherwise delegates to plain creditTokens.
 *
 * Quarantined rows:
 *  - are skipped by runSupportersRanking (filters active/warning only)
 *  - may be promoted to active by the weekly promotion sweep when their
 *    tokens exceed the current rank-100 threshold (W2-01 ranking sweep)
 *
 * BB-02: Returns the full SupporterStatus for existing rows (no longer
 * collapses warning/frozen/exiting into "active"). Callers that only
 * care about the quarantine-gate outcome should treat any non-
 * "quarantined" value as "admitted to ranked set".
 */
export async function creditTokensWithQuarantineCheck(
  sql: Sql,
  userId: string,
  tokens: number,
  joinedAt?: Date,
): Promise<{ status: SupporterStatus; created: boolean }> {
  if (tokens <= 0) {
    return { status: "active", created: false }
  }

  const existingRows = await sql<{ status: SupporterStatus }[]>`
    SELECT status FROM supporters WHERE user_id = ${userId} LIMIT 1
  `
  const existing = existingRows[0]
  if (existing) {
    // Already a supporter — just credit tokens, preserve status.
    await creditTokens(sql, userId, tokens, joinedAt)
    return {
      status: existing.status,
      created: false,
    }
  }

  // New supporter — check count of ranked set.
  const countRows = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM supporters
    WHERE status IN ('active', 'warning')
  `
  const countRow = countRows[0]
  const currentCount = countRow ? Number(countRow.count) : 0
  const shouldQuarantine = currentCount >= 100
  const joinedAtValue = joinedAt ?? new Date()

  if (shouldQuarantine) {
    await sql`
      INSERT INTO supporters (user_id, tokens, status, joined_at)
      VALUES (${userId}, ${tokens}, 'quarantined', ${joinedAtValue})
      ON CONFLICT (user_id) DO UPDATE
        SET tokens = supporters.tokens + EXCLUDED.tokens,
            updated_at = NOW()
    `
    console.log(JSON.stringify({
      event: "supporter_quarantine_intake",
      user_id: userId,
      tokens,
      current_count: currentCount,
    }))
    return { status: "quarantined", created: true }
  }

  await creditTokens(sql, userId, tokens, joinedAtValue)
  return { status: "active", created: true }
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
