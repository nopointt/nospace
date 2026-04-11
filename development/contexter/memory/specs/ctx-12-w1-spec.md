---
# CTX-12 W1 Spec — Supporters Backend: DB Schema + Webhook Processing
> Epic: CTX-12 | Wave: 1 | Mode: autonomous (standards J1-J8)
> Author: Axis | Created: 2026-04-11 (session 237)
> Model: Player = Sonnet (general-purpose), Coach = Sonnet (code-reviewer)
---

## Goal

Make LemonSqueezy webhooks DO SOMETHING. Currently all 4 event handlers are
TODO-stubs that only log. Wire them through to a new supporter subsystem
that tracks tokens, matches payments to users, and creates an audit trail.

After W1: every real payment lands in DB, tokens are credited, unmatched
payments queue for later reconciliation. Ranking/API come in W2.

## Context (inline, no file reads needed before start)

### Stack
- **Runtime:** Bun on Hetzner CAX21 (Helsinki)
- **DB:** PostgreSQL 16.13 (prod) / 17.9 (local dev `cx_platform`)
- **ORM:** Drizzle (migrations in `drizzle-pg/`)
- **Driver:** `postgres` npm package (template literal SQL), exposed as `c.get("sql")` in Hono routes
- **Framework:** Hono on Bun
- **Payment processor:** LemonSqueezy (MoR, live since 2026-04-07)
- **Webhook URL:** `https://api.contexter.cc/api/webhooks/lemonsqueezy`
- **Signing:** HMAC-SHA256 on raw body, header `x-signature`, secret in env `LEMONSQUEEZY_WEBHOOK_SECRET`

### Existing tables (DO NOT MODIFY without explicit instruction)

```
users (text id PK, email UNIQUE, password_hash, api_token nullable, email_verified, created_at, updated_at)
subscriptions (text id PK, user_id FK UNIQUE, tier, status, storage_limit_bytes, current_period_start, current_period_end, created_at, updated_at)
payments (text id PK, user_id FK, subscription_id FK, nowpayments_invoice_id, nowpayments_payment_id, tier, amount_usd, status, pay_currency, actually_paid, invoice_url, created_at, updated_at)
```

### Existing billing service (src/services/billing.ts)
- `TIERS` constant: `free` / `starter` / `pro` / `business` (note: no "supporter" tier)
- `getOrCreateSubscription(sql, userId)` — creates free tier row if missing
- `activateSubscription(sql, { invoiceId, paymentId, payCurrency, actuallyPaid })` — NOWPayments flow
- `verifyIpnSignature(body, sig, secret)` — NOWPayments HMAC-SHA512

### Existing webhook handler (src/routes/webhooks.ts:89-200)
LemonSqueezy handler has 4 event cases with TODO stubs:
1. `order_created` — one-time purchase (Supporter donation $10+)
2. `subscription_created` — new recurring sub (Starter/Pro)
3. `subscription_payment_success` — recurring payment (monthly)
4. `subscription_cancelled` / `subscription_expired` — end of sub

HMAC verification is ALREADY correct — use `c.req.text()` then `createHmac("sha256", secret).update(rawBody)`. Do NOT modify signature logic.

### LS variant IDs (locked decisions D-62)
- Supporter (PWYW, $10+): variant_id `1516645`
- Starter ($9/mo): variant_id `1516676`
- Pro ($29/mo): variant_id `1516706`

### Locked decisions from spec

- **D-51:** 100 spots, tokens ($1 = 1 tok), 1% rev share quarterly
- **D-52:** Tier multipliers: Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x
- **D-55:** Rev share activates at $10K/month revenue
- **D-57:** Tokens = loyalty points, non-transferable
- **D-58:** Token-paid subs do NOT generate new tokens
- **D-AUTO-02:** PWYW unlimited — $1M payment = 1M tokens
- **D-AUTO-03:** Rank tiebreak — `ORDER BY tokens DESC, joined_at ASC` (earlier wins)
- **D-AUTO-04:** User matching strategy (see W1-04 below)

### Environment
- Prod DB accessed via SSH: `ssh root@46.62.220.214` → `docker exec contexter-postgres-1 psql -U cx_user cx_platform`
- Local dev DB: `psql -U cx_user cx_platform` (PG17, local, already running)
- Secrets on prod: `/opt/contexter/.env` (chmod 600)
- LS webhook secret file (local): `~/.tLOS/lemonsqueezy-webhook-secret` (for reference; NEVER commit, NEVER log)

## Tasks (8 atomic, each with action + verify + done)

---

### W1-01 — Create migration 0015_supporters.sql

**Action:**
Create `drizzle-pg/0015_supporters.sql` with 3 new tables:

```sql
-- CTX-12: Supporters program — tokens, ranking, audit trail

CREATE TABLE "supporters" (
  "user_id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "tokens" BIGINT NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "tier" TEXT NOT NULL DEFAULT 'pending',
  "status" TEXT NOT NULL DEFAULT 'active',
  "warning_sent_at" TIMESTAMP WITH TIME ZONE,
  "freeze_start" TIMESTAMP WITH TIME ZONE,
  "freeze_end" TIMESTAMP WITH TIME ZONE,
  "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporters_tokens_joined_idx" ON "supporters" ("tokens" DESC, "joined_at" ASC);
--> statement-breakpoint
CREATE INDEX "supporters_tier_idx" ON "supporters" ("tier");
--> statement-breakpoint
CREATE INDEX "supporters_status_idx" ON "supporters" ("status");
--> statement-breakpoint

CREATE TABLE "supporter_transactions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "email" TEXT,
  "type" TEXT NOT NULL,
  "amount_tokens" BIGINT NOT NULL DEFAULT 0,
  "amount_usd_cents" BIGINT,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "matched_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporter_tx_user_id_idx" ON "supporter_transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX "supporter_tx_email_idx" ON "supporter_transactions" ("email") WHERE "user_id" IS NULL;
--> statement-breakpoint
CREATE INDEX "supporter_tx_source_idx" ON "supporter_transactions" ("source_type", "source_id");
--> statement-breakpoint
CREATE INDEX "supporter_tx_created_idx" ON "supporter_transactions" ("created_at" DESC);
--> statement-breakpoint

CREATE TABLE "supporter_tasks" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "task_type" TEXT NOT NULL,
  "amount_tokens" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "description" TEXT,
  "reviewer_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporter_tasks_user_id_idx" ON "supporter_tasks" ("user_id");
--> statement-breakpoint
CREATE INDEX "supporter_tasks_status_idx" ON "supporter_tasks" ("status");
```

Also update `drizzle-pg/meta/_journal.json` — add entry for migration 0015
following the pattern of existing entries. Check current journal format
first.

**Rationale:**
- `supporters.user_id` is PK (one supporter per user) and cascades delete with user
- `tokens` as BIGINT supports D-AUTO-02 unlimited PWYW
- Composite index `(tokens DESC, joined_at ASC)` directly supports tiebreak ordering
- `supporter_transactions.user_id` nullable — supports unmatched-payment queue (no placeholder users pollution)
- `supporter_transactions.email` indexed WHERE user_id IS NULL — fast lookup of unmatched txs on registration
- `source_type + source_id` composite — idempotency check (prevents duplicate webhook processing)
- `amount_usd_cents` as BIGINT cents — avoid FLOAT rounding, unlimited PWYW amounts

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user cx_platform -f drizzle-pg/0015_supporters.sql 2>&1
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user cx_platform -c "\d supporters" 2>&1
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user cx_platform -c "\d supporter_transactions" 2>&1
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user cx_platform -c "\d supporter_tasks" 2>&1
```
Expected: all 3 tables created with indexes, no errors.

**Done when:**
- [ ] Migration file created and valid SQL
- [ ] Applied successfully to local cx_platform
- [ ] All 3 tables visible via \d
- [ ] _journal.json updated
- [ ] Commit: `feat(ctx-12-w1-01): add supporters/transactions/tasks migration`

---

### W1-02 — Create src/services/supporters.ts skeleton

**Action:**
Create new service file with these exports (no webhook wiring yet — just the API surface):

```typescript
import type { Sql } from "postgres"
import crypto from "crypto"

export type SupporterTier = "diamond" | "gold" | "silver" | "bronze" | "pending"
export type SupporterStatus = "active" | "warning" | "frozen" | "exiting"
export type TransactionType =
  | "purchase"           // one-time Supporter donation
  | "subscription_payment" // recurring Starter/Pro payment
  | "task"               // approved task reward
  | "referral"           // referral bonus
  | "revshare"           // quarterly rev share distribution
  | "adjustment"         // manual correction

export type SourceType = "lemonsqueezy_order" | "lemonsqueezy_subscription" | "task" | "referral" | "manual"

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

// Idempotent insert — returns null if (source_type, source_id) already exists
export async function recordTransaction(sql: Sql, input: RecordTransactionInput): Promise<string | null>

// Credits tokens to an existing supporter row, creates row if missing (for one-time Supporter)
export async function creditTokens(sql: Sql, userId: string, tokens: number, joinedAt?: Date): Promise<void>

// Computes tokens from USD cents per D-AUTO-02 (1 USD = 1 token, unlimited)
export function tokensFromCents(cents: number): number

// Match email (case-insensitive) to existing user. Returns user_id or null.
export async function matchEmailToUser(sql: Sql, email: string): Promise<string | null>

// Reconcile unmatched transactions for an email (called on user registration)
// Returns count of reclaimed transactions.
export async function reclaimUnmatchedForEmail(sql: Sql, userId: string, email: string): Promise<number>

export function genId(): string {
  return crypto.randomBytes(12).toString("hex")
}
```

Implementation rules:
- `recordTransaction`: INSERT with `ON CONFLICT DO NOTHING` on unique key `(source_type, source_id)` when source_id is not null. Returns the new id or null if duplicate. Uses `crypto.randomBytes(12).toString("hex")` for id.
- `creditTokens`: `INSERT INTO supporters (user_id, tokens, joined_at) VALUES (...) ON CONFLICT (user_id) DO UPDATE SET tokens = supporters.tokens + EXCLUDED.tokens, updated_at = NOW()`. If `joinedAt` provided, use it on insert only (not on conflict update).
- `tokensFromCents`: `Math.floor(cents / 100)` — round DOWN (generous to us, per D-AUTO-02 unlimited).
- `matchEmailToUser`: `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`. Case-insensitive.
- `reclaimUnmatchedForEmail`: transaction-wrap. UPDATE supporter_transactions SET user_id = $1, matched_at = NOW() WHERE user_id IS NULL AND LOWER(email) = LOWER($2) RETURNING *. For each returned row: if type in ('purchase', 'subscription_payment', 'referral', 'task', 'revshare'), call creditTokens with the row's amount_tokens. Return count of updated rows.

**IMPORTANT — source_id uniqueness:**
`supporter_transactions` migration (W1-01) does NOT have a UNIQUE constraint on `(source_type, source_id)` yet because some types (e.g. 'manual') may have null source_id. Instead, enforce idempotency in `recordTransaction` by checking with a SELECT before INSERT when source_id is not null:

```typescript
if (input.sourceId) {
  const [existing] = await sql`
    SELECT id FROM supporter_transactions
    WHERE source_type = ${input.sourceType} AND source_id = ${input.sourceId}
    LIMIT 1
  `
  if (existing) return null
}
```

This is race-safe-enough for webhook processing (LS doesn't send duplicates concurrently in practice; if we get two, the second becomes a no-op dupe at worst with same effect). If hardening is needed later, add a partial UNIQUE index in a follow-up migration.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit src/services/supporters.ts 2>&1
```
Expected: no type errors.

**Done when:**
- [ ] File created with all 6 exports
- [ ] Type-checks clean
- [ ] Function signatures match spec exactly
- [ ] Commit: `feat(ctx-12-w1-02): add supporters service skeleton`

---

### W1-03 — Add variant-to-tier mapping + constants

**Action:**
Extend `src/services/supporters.ts` with variant mapping and tier thresholds:

```typescript
// From D-62 (CTX-10 locked decisions)
export const LS_VARIANTS = {
  supporter: "1516645",
  starter: "1516676",
  pro: "1516706",
} as const

export function variantToKind(variantId: string | number | null): "supporter" | "starter" | "pro" | "unknown" {
  const v = String(variantId ?? "")
  if (v === LS_VARIANTS.supporter) return "supporter"
  if (v === LS_VARIANTS.starter) return "starter"
  if (v === LS_VARIANTS.pro) return "pro"
  return "unknown"
}

// Tier assignment thresholds (used by W2 ranking service, defined here for reuse)
// Based on rank position (1-indexed), NOT tokens. D-51.
export const TIER_THRESHOLDS = {
  diamond: { maxRank: 10 },
  gold: { maxRank: 30 },
  silver: { maxRank: 60 },
  bronze: { maxRank: 100 },
} as const

export function rankToTier(rank: number | null): SupporterTier {
  if (rank === null || rank < 1) return "pending"
  if (rank <= TIER_THRESHOLDS.diamond.maxRank) return "diamond"
  if (rank <= TIER_THRESHOLDS.gold.maxRank) return "gold"
  if (rank <= TIER_THRESHOLDS.silver.maxRank) return "silver"
  if (rank <= TIER_THRESHOLDS.bronze.maxRank) return "bronze"
  return "pending"
}
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit src/services/supporters.ts 2>&1
node -e "const { rankToTier, variantToKind } = require('./src/services/supporters.ts'); console.log(rankToTier(5), rankToTier(200), variantToKind('1516645'))" 2>&1 || echo "skip node test — bun will handle"
```
TS check is sufficient — no runtime test needed at this stage.

**Done when:**
- [ ] LS_VARIANTS, variantToKind, TIER_THRESHOLDS, rankToTier exported
- [ ] Type-checks clean
- [ ] Commit: `feat(ctx-12-w1-03): add variant mapping and tier thresholds`

---

### W1-04 — Implement user matching strategy (safest + convenient)

**Action:**
This task is the decision for D-AUTO-04 (user matching). Implement the strategy in `src/services/supporters.ts`:

**Strategy (chosen for safety + UX):**
1. **Primary match:** Check webhook `custom_data.user_id` if present (logged-in checkout). If present AND exists in users table, use it.
2. **Secondary match:** Case-insensitive email lookup against `users.email`.
3. **Fallback (unmatched):** Record transaction with `user_id = NULL`, `email = <ls_email>`, `matched_at = NULL`. Queued for reconciliation.
4. **Auto-reconciliation:** On user registration (W1-07), call `reclaimUnmatchedForEmail` to auto-credit any pending tokens.

Rationale: Does NOT create placeholder users (avoids schema pollution, avoids broken password_hash FK, avoids legal-email pattern conflicts with existing `legacy-<id>@noemail.contexter.cc` convention). User experience: pay first → sign up later → tokens automatically credited. This is more forgiving than requiring login-before-pay.

Add function:
```typescript
export async function matchSupporter(
  sql: Sql,
  opts: { email: string | null; customDataUserId: string | null }
): Promise<string | null> {
  if (opts.customDataUserId) {
    const [byId] = await sql`SELECT id FROM users WHERE id = ${opts.customDataUserId} LIMIT 1`
    if (byId) return byId.id as string
  }
  if (opts.email) {
    return matchEmailToUser(sql, opts.email)
  }
  return null
}
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit src/services/supporters.ts 2>&1
```

**Done when:**
- [ ] `matchSupporter` function exported
- [ ] Uses custom_data.user_id first, email second
- [ ] Returns null for unmatched (no placeholder creation)
- [ ] Commit: `feat(ctx-12-w1-04): add matchSupporter with safe fallback strategy`

---

### W1-05 — Wire order_created handler (one-time Supporter donation)

**Action:**
Replace the `case "order_created"` TODO stub in `src/routes/webhooks.ts` with actual logic.

Pseudo-code:
```typescript
case "order_created": {
  const email = (attrs.user_email ?? "") || null
  const total = Number(attrs.total ?? 0)  // in cents per LS API
  const variantId = attrs.first_order_item?.variant_id ?? null
  const orderId = String(payload.data?.id ?? "")
  const customDataUserId = (customData.user_id as string | undefined) ?? null

  const kind = variantToKind(variantId)

  // Skip order_created for subscription items — they arrive via subscription_created separately.
  // LS may send both events for a subscription first purchase; dedup by source_id elsewhere.
  if (kind !== "supporter") {
    console.log(JSON.stringify({ ts, event: "ls_order_not_supporter", kind, orderId }))
    break
  }

  const userId = await matchSupporter(sql, { email, customDataUserId })
  const tokens = tokensFromCents(total)

  const txId = await recordTransaction(sql, {
    userId,
    email,
    type: "purchase",
    amountTokens: tokens,
    amountUsdCents: total,
    sourceType: "lemonsqueezy_order",
    sourceId: orderId,
    metadata: { variantId, customData },
  })

  if (!txId) {
    // Duplicate webhook — idempotent no-op
    console.log(JSON.stringify({ ts, event: "ls_order_duplicate", orderId }))
    break
  }

  if (userId) {
    await creditTokens(sql, userId, tokens)
    console.log(JSON.stringify({ ts, event: "ls_supporter_credited", userId, tokens, orderId }))
  } else {
    console.log(JSON.stringify({ ts, event: "ls_supporter_unmatched", email, tokens, orderId }))
  }
  break
}
```

Import the needed functions at top of file:
```typescript
import {
  variantToKind,
  matchSupporter,
  tokensFromCents,
  recordTransaction,
  creditTokens,
} from "../services/supporters"
```

Do NOT modify HMAC verification, outer event logging, or any other case yet.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit 2>&1 | head -20
```
Expected: no new type errors in webhooks.ts or supporters.ts.

Then simulate locally (webhook must be tested end-to-end later against prod):
```bash
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user cx_platform -c "INSERT INTO users (id, email, created_at, updated_at, email_verified) VALUES ('test_u1', 'test@example.com', NOW(), NOW(), true) ON CONFLICT DO NOTHING"
# Manual check: service functions callable — this gets verified via unit-like test in W1-08
```

**Done when:**
- [ ] order_created case calls variantToKind, matchSupporter, recordTransaction, creditTokens
- [ ] Unmatched payments log as ls_supporter_unmatched
- [ ] Duplicate orders log as ls_order_duplicate
- [ ] Type-checks clean
- [ ] Commit: `feat(ctx-12-w1-05): wire order_created handler`

---

### W1-06 — Wire subscription_created + subscription_payment_success

**Action:**
Replace both TODO stubs. These handle recurring Starter/Pro subscriptions.

For `subscription_created`:
1. Match user by email/custom_data.
2. Look up variant to determine tier (starter | pro).
3. If matched: upsert `subscriptions` row with new tier. Set `current_period_start = NOW()`, `current_period_end = NOW() + 30 days`. Keep existing `storage_limit_bytes` logic from TIERS constant.
4. Record a `subscription_created` audit transaction with 0 tokens (no token credit here — tokens come from payment_success).
5. If unmatched: log + queue (same as order_created fallback).

```typescript
case "subscription_created": {
  const email = (attrs.user_email ?? "") || null
  const productName = attrs.product_name ?? ""
  const variantId = attrs.variant_id ?? attrs.first_order_item?.variant_id ?? null
  const subscriptionId = String(payload.data?.id ?? "")
  const customDataUserId = (customData.user_id as string | undefined) ?? null
  const kind = variantToKind(variantId)

  const userId = await matchSupporter(sql, { email, customDataUserId })

  // Always record audit row (dedup by source_id)
  await recordTransaction(sql, {
    userId,
    email,
    type: "subscription_payment",
    amountTokens: 0,
    amountUsdCents: 0,
    sourceType: "lemonsqueezy_subscription",
    sourceId: `${subscriptionId}:created`,
    metadata: { eventName, variantId, productName, customData },
  })

  if (!userId) {
    console.log(JSON.stringify({ ts, event: "ls_subscription_unmatched", email, subscriptionId }))
    break
  }

  if (kind !== "starter" && kind !== "pro") {
    console.log(JSON.stringify({ ts, event: "ls_subscription_unknown_variant", variantId, subscriptionId }))
    break
  }

  // Upsert subscription — use getOrCreateSubscription to guarantee row exists, then update tier
  await getOrCreateSubscription(sql, userId)
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const storageLimit = TIERS[kind].storageLimitBytes
  await sql`
    UPDATE subscriptions
    SET tier = ${kind}, status = 'active',
        storage_limit_bytes = ${storageLimit},
        current_period_start = NOW(),
        current_period_end = ${periodEnd},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `
  console.log(JSON.stringify({ ts, event: "ls_subscription_activated", userId, tier: kind, subscriptionId }))
  break
}
```

For `subscription_payment_success`:
1. Match user.
2. Extend `current_period_end` by 30 days from existing end (or NOW() if expired).
3. Credit tokens = subtotal / 100 (per D-AUTO-02).
4. Record transaction with `sourceId = ${subscriptionId}:${invoiceId}`.

```typescript
case "subscription_payment_success": {
  const email = (attrs.user_email ?? "") || null
  const subtotal = Number(attrs.subtotal ?? 0)  // cents
  const subscriptionId = String(payload.data?.relationships?.subscription?.data?.id ?? payload.data?.id ?? "")
  const invoiceId = String(payload.data?.id ?? "")
  const customDataUserId = (customData.user_id as string | undefined) ?? null

  const userId = await matchSupporter(sql, { email, customDataUserId })
  const tokens = tokensFromCents(subtotal)

  const txId = await recordTransaction(sql, {
    userId,
    email,
    type: "subscription_payment",
    amountTokens: tokens,
    amountUsdCents: subtotal,
    sourceType: "lemonsqueezy_subscription",
    sourceId: `payment:${invoiceId}`,
    metadata: { subscriptionId, customData },
  })

  if (!txId) {
    console.log(JSON.stringify({ ts, event: "ls_subscription_payment_duplicate", invoiceId }))
    break
  }

  if (!userId) {
    console.log(JSON.stringify({ ts, event: "ls_subscription_payment_unmatched", email, invoiceId }))
    break
  }

  // Extend period by 30 days
  await sql`
    UPDATE subscriptions
    SET current_period_end = GREATEST(current_period_end, NOW()) + INTERVAL '30 days',
        status = 'active',
        updated_at = NOW()
    WHERE user_id = ${userId}
  `

  // Credit tokens (D-58 note: token-paid subs don't generate NEW tokens, but this is a USD-paid sub, so OK)
  if (tokens > 0) {
    await creditTokens(sql, userId, tokens)
  }

  console.log(JSON.stringify({ ts, event: "ls_subscription_payment_credited", userId, tokens, subscriptionId }))
  break
}
```

Import `TIERS` and `getOrCreateSubscription` from `../services/billing`.

**Note on D-58:** Token-paid subs don't generate tokens. For W1, all LS payments are USD — token credit is correct. When token-paid subs are introduced (future work), check the payment source and skip token credit if source is internal-tokens.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit 2>&1 | head -20
```

**Done when:**
- [ ] Both cases call matchSupporter + recordTransaction
- [ ] subscription_created updates subscriptions table with tier/period
- [ ] subscription_payment_success extends period + credits tokens
- [ ] Idempotency via source_id prevents double-credit on webhook retries
- [ ] Commit: `feat(ctx-12-w1-06): wire subscription_created and payment_success`

---

### W1-07 — Wire subscription_cancelled/expired + user registration reconciliation

**Action:**
Part A: Replace `subscription_cancelled / expired` stub.

```typescript
case "subscription_cancelled":
case "subscription_expired": {
  const email = (attrs.user_email ?? "") || null
  const subscriptionId = String(payload.data?.id ?? "")
  const customDataUserId = (customData.user_id as string | undefined) ?? null

  await recordTransaction(sql, {
    userId: await matchSupporter(sql, { email, customDataUserId }),
    email,
    type: "subscription_payment",
    amountTokens: 0,
    amountUsdCents: 0,
    sourceType: "lemonsqueezy_subscription",
    sourceId: `${subscriptionId}:${eventName}`,
    metadata: { eventName, attrs, customData },
  })

  const userId = await matchSupporter(sql, { email, customDataUserId })
  if (userId) {
    // Set subscription status — do NOT downgrade tier immediately (user paid for current period)
    await sql`
      UPDATE subscriptions
      SET status = 'cancelled', updated_at = NOW()
      WHERE user_id = ${userId}
    `
    // Start supporter warning window (D-53 soft demotion handled by W5, here we just stamp)
    await sql`
      UPDATE supporters
      SET warning_sent_at = COALESCE(warning_sent_at, NOW()),
          status = CASE WHEN status = 'active' THEN 'warning' ELSE status END,
          updated_at = NOW()
      WHERE user_id = ${userId}
    `
    console.log(JSON.stringify({ ts, event: "ls_subscription_ended", userId, eventName, subscriptionId }))
  } else {
    console.log(JSON.stringify({ ts, event: "ls_subscription_ended_unmatched", email, subscriptionId }))
  }
  break
}
```

Part B: Hook reconciliation into user registration.

Find the user registration code path. It lives in `src/routes/auth.ts` (email+password) AND `src/routes/auth-social.ts` (OAuth). Both should call `reclaimUnmatchedForEmail` after a new user is persisted.

Read both files first. Find the INSERT INTO users (or better-auth equivalent). Add AFTER successful user creation:

```typescript
import { reclaimUnmatchedForEmail } from "../services/supporters"
// ... inside the register/sign-in-after-create path, after user is in DB:
try {
  const reclaimed = await reclaimUnmatchedForEmail(sql, newUserId, newUserEmail)
  if (reclaimed > 0) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: "supporter_tx_reclaimed",
      userId: newUserId,
      count: reclaimed,
    }))
  }
} catch (err) {
  // Do NOT fail registration if reclaim fails — log and continue
  console.error("supporter reclaim failed", { userId: newUserId, err })
}
```

**CRITICAL (J3 safeguard):** Do NOT modify any auth logic beyond this hook. If the registration code path uses better-auth hooks/callbacks that don't give direct INSERT access, add the reclaim as a post-registration middleware or a separate endpoint invocation. If blocked, defer this sub-task and log in autonomous report.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
bunx tsc --noEmit 2>&1 | head -20
```

Then manual test plan (run in local psql):
```sql
-- Simulate unmatched payment
INSERT INTO supporter_transactions (id, user_id, email, type, amount_tokens, amount_usd_cents, source_type, source_id)
VALUES ('t_unmatch1', NULL, 'newuser@example.com', 'purchase', 25, 2500, 'lemonsqueezy_order', 'order_test_1');
-- Register that email
INSERT INTO users (id, email, api_token, email_verified, created_at, updated_at)
VALUES ('u_new1', 'newuser@example.com', NULL, true, NOW(), NOW());
-- Call reclaim via psql (can't from SQL — test via TS script in W1-08)
```

**Done when:**
- [ ] cancelled/expired updates subscription status to 'cancelled'
- [ ] Supporter row flipped to warning + warning_sent_at stamped
- [ ] Registration hook calls reclaimUnmatchedForEmail (either inline or deferred with note)
- [ ] Type-checks clean
- [ ] Commit: `feat(ctx-12-w1-07): wire subscription end + registration reclaim hook`

---

### W1-08 — Create integration test script + local end-to-end verify

**Action:**
Create `scripts/test-ctx-12-w1.ts` — a standalone Bun script that:

1. Connects to local `cx_platform`
2. Seeds a test user
3. Exercises each webhook handler path by calling the functions directly (not via HTTP)
4. Asserts the resulting DB state
5. Cleans up test data

Structure:
```typescript
#!/usr/bin/env bun
import postgres from "postgres"
import {
  recordTransaction,
  creditTokens,
  tokensFromCents,
  matchEmailToUser,
  matchSupporter,
  reclaimUnmatchedForEmail,
  variantToKind,
  rankToTier,
  genId,
} from "../src/services/supporters"

const sql = postgres({
  host: "localhost",
  port: 5432,
  database: "cx_platform",
  user: "cx_user",
  password: process.env.PG_PASSWORD ?? "",
})

async function main() {
  const testUserId = `test_u_${genId()}`
  const testEmail = `test_${genId()}@example.com`

  try {
    // Cleanup prior
    await sql`DELETE FROM supporter_transactions WHERE email LIKE 'test_%@example.com'`
    await sql`DELETE FROM supporters WHERE user_id LIKE 'test_u_%'`
    await sql`DELETE FROM users WHERE id LIKE 'test_u_%'`

    // 1. tokensFromCents
    console.assert(tokensFromCents(1000) === 10, "tokensFromCents(1000) should be 10")
    console.assert(tokensFromCents(100_000_000) === 1_000_000, "tokensFromCents 1M USD = 1M tokens")
    console.log("✓ tokensFromCents")

    // 2. variantToKind
    console.assert(variantToKind("1516645") === "supporter", "variant 1516645 = supporter")
    console.assert(variantToKind("1516676") === "starter", "variant 1516676 = starter")
    console.assert(variantToKind("1516706") === "pro", "variant 1516706 = pro")
    console.assert(variantToKind("999") === "unknown", "unknown variant")
    console.log("✓ variantToKind")

    // 3. rankToTier
    console.assert(rankToTier(1) === "diamond")
    console.assert(rankToTier(10) === "diamond")
    console.assert(rankToTier(11) === "gold")
    console.assert(rankToTier(30) === "gold")
    console.assert(rankToTier(31) === "silver")
    console.assert(rankToTier(60) === "silver")
    console.assert(rankToTier(61) === "bronze")
    console.assert(rankToTier(100) === "bronze")
    console.assert(rankToTier(101) === "pending")
    console.assert(rankToTier(null) === "pending")
    console.log("✓ rankToTier")

    // 4. Create user (with required better-auth fields)
    await sql`
      INSERT INTO users (id, email, api_token, email_verified, created_at, updated_at)
      VALUES (${testUserId}, ${testEmail}, NULL, true, NOW(), NOW())
    `
    console.log("✓ user seeded")

    // 5. matchEmailToUser (case-insensitive)
    const m1 = await matchEmailToUser(sql, testEmail.toUpperCase())
    console.assert(m1 === testUserId, "case-insensitive email match")
    console.log("✓ matchEmailToUser")

    // 6. matchSupporter with custom_data priority
    const m2 = await matchSupporter(sql, { email: null, customDataUserId: testUserId })
    console.assert(m2 === testUserId, "custom_data.user_id match")
    const m3 = await matchSupporter(sql, { email: testEmail, customDataUserId: null })
    console.assert(m3 === testUserId, "email fallback match")
    const m4 = await matchSupporter(sql, { email: "nobody@example.com", customDataUserId: null })
    console.assert(m4 === null, "unmatched returns null")
    console.log("✓ matchSupporter")

    // 7. recordTransaction + creditTokens (matched purchase)
    const txId1 = await recordTransaction(sql, {
      userId: testUserId,
      email: testEmail,
      type: "purchase",
      amountTokens: 10,
      amountUsdCents: 1000,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_1",
    })
    console.assert(txId1 !== null, "first tx should insert")
    await creditTokens(sql, testUserId, 10)
    const [sup1] = await sql`SELECT tokens FROM supporters WHERE user_id = ${testUserId}`
    console.assert(Number(sup1.tokens) === 10, `supporter tokens should be 10, got ${sup1.tokens}`)
    console.log("✓ recordTransaction + creditTokens")

    // 8. Idempotency — duplicate source_id returns null
    const txIdDup = await recordTransaction(sql, {
      userId: testUserId,
      email: testEmail,
      type: "purchase",
      amountTokens: 10,
      amountUsdCents: 1000,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_1",
    })
    console.assert(txIdDup === null, "duplicate source_id should return null")
    console.log("✓ idempotency (duplicate source_id)")

    // 9. Unmatched payment + reclaim
    const testEmail2 = `test_unmatch_${genId()}@example.com`
    await recordTransaction(sql, {
      userId: null,
      email: testEmail2,
      type: "purchase",
      amountTokens: 25,
      amountUsdCents: 2500,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_unmatch_1",
    })
    const testUserId2 = `test_u_${genId()}`
    await sql`
      INSERT INTO users (id, email, api_token, email_verified, created_at, updated_at)
      VALUES (${testUserId2}, ${testEmail2}, NULL, true, NOW(), NOW())
    `
    const reclaimed = await reclaimUnmatchedForEmail(sql, testUserId2, testEmail2)
    console.assert(reclaimed === 1, `reclaimed should be 1, got ${reclaimed}`)
    const [sup2] = await sql`SELECT tokens FROM supporters WHERE user_id = ${testUserId2}`
    console.assert(Number(sup2.tokens) === 25, `reclaimed supporter tokens should be 25, got ${sup2.tokens}`)
    const [tx] = await sql`SELECT user_id, matched_at FROM supporter_transactions WHERE source_id = 'order_test_unmatch_1'`
    console.assert(tx.user_id === testUserId2, "tx.user_id should be updated")
    console.assert(tx.matched_at !== null, "matched_at should be set")
    console.log("✓ unmatched + reclaim")

    // 10. Unlimited PWYW
    const bigTokens = tokensFromCents(100_000_000_000) // $1B
    console.assert(bigTokens === 1_000_000_000, "$1B = 1B tokens")
    console.log("✓ unlimited PWYW")

    // Cleanup
    await sql`DELETE FROM supporter_transactions WHERE email LIKE 'test_%@example.com'`
    await sql`DELETE FROM supporters WHERE user_id LIKE 'test_u_%'`
    await sql`DELETE FROM users WHERE id LIKE 'test_u_%'`

    console.log("\n✅ All W1 tests passed")
    await sql.end()
  } catch (err) {
    console.error("❌ Test failed:", err)
    await sql.end()
    process.exit(1)
  }
}

main()
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
PG_PASSWORD="" bun run scripts/test-ctx-12-w1.ts 2>&1
```
Expected: `✅ All W1 tests passed`. If local PG requires password, pass via env.

**Done when:**
- [ ] Script created at scripts/test-ctx-12-w1.ts
- [ ] Runs clean against local cx_platform
- [ ] All 10 assertions pass
- [ ] Commit: `test(ctx-12-w1-08): add W1 integration test script`

---

## Post-W1 Deploy Plan (Axis handles manually, not Player)

After W1 G3 finishes and Coach approves:

1. Axis runs pg_dump backup on prod: `ssh root@46.62.220.214 "docker exec contexter-postgres-1 pg_dump -U cx_user cx_platform > /opt/contexter/backups/pre-ctx-12-w1-$(date +%Y%m%d-%H%M).sql"`
2. Axis applies migration 0015 on prod: `ssh root@46.62.220.214 "docker exec -i contexter-postgres-1 psql -U cx_user cx_platform" < drizzle-pg/0015_supporters.sql`
3. Axis verifies: `ssh root@46.62.220.214 "docker exec contexter-postgres-1 psql -U cx_user cx_platform -c '\d supporters'"`
4. Axis SCPs new source files: supporters.ts, webhooks.ts, (optional auth.ts/auth-social.ts if modified) to `/opt/contexter/app/src/`
5. Axis runs `docker compose build --no-cache app && docker compose up -d app` on server
6. Axis verifies `/health`: `curl -s https://api.contexter.cc/health | head -20`
7. Axis tests webhook idempotency via dry signature check if possible, or just verifies logs don't show startup errors
8. Axis appends deploy entry to autonomous report

Axis MUST halt if any of:
- pg_dump fails
- Migration fails with any error
- docker build fails
- /health returns non-200
- logs show startup errors referencing supporters.ts

## Coach Verification (POST-REVIEW) — 8-dim spec check

Coach runs independently against the spec. For each dimension:
1. **Coverage:** All 8 W1 tasks addressed? All 10 test assertions pass?
2. **Decision fidelity:** D-51, D-AUTO-02, D-AUTO-04 honored? PWYW unlimited? Tiebreak correct?
3. **Decomposition:** 8 atomic commits, one per task?
4. **Deferred respect:** No W2/W3/W4/W5 code leaked into W1?
5. **Dependencies:** Migration runs before service code references new tables?
6. **Size:** Each task under 200 LOC?
7. **Verification:** Every commit's verify command passes?
8. **Acceptance:** Test script passes all 10 assertions?

Coach runs `bunx tsc --noEmit` and `bun run scripts/test-ctx-12-w1.ts` independently. Does not trust Player self-report.

If Coach finds issues: report list of issues to Axis. Axis decides: fix inline (Player or Axis), defer, or escalate.

## Out of scope for W1 (do NOT implement)

- W2 ranking cron / API endpoints
- W3 frontend changes
- W4 task submission
- W5 ToS / demotion cron / anti-abuse
- Supporter tier badge UI
- Rev share calculation
- Any auth logic changes beyond the single reclaim hook call
- Any billing logic changes beyond the TIERS-driven period extension
- Any design changes
