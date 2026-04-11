---
# ctx-12-w4-spec.md — CTX-12 Wave 4 Master Spec
> Epic: CTX-12 Supporters Backend
> Wave: 4 — Tasks submission + Admin review + Referrals + Quarterly Rev Share + Notifications
> Author: Axis (Orchestrator, Opus)
> Mode: Autonomous G3 (Sonnet Player + Sonnet Coach)
> Precedent: W1 (10 commits) + W2 (10 commits) + W3 (5 commits) all deployed to prod
---

## Context (inlined per C7)

### Stack reminder
- Hono + Bun + PostgreSQL 16 (prod) / 17 (local `contexter_dev`)
- BullMQ + Redis for queues/crons
- Drizzle migrations in `drizzle-pg/` (latest: 0015_supporters.sql)
- Better-auth + legacy `/api/auth/register`
- Resend for email (private helper in `src/auth/index.ts`, DO NOT touch)

### Production DB identity
- Prod DB: `contexter` (user `contexter`)
- Prod SSH: `root@46.62.220.214`, container `contexter-postgres-1`
- Prod CF Pages frontend: https://contexter.cc
- Prod API: https://api.contexter.cc

### Local dev DB (for verify)
- DB: `contexter_dev` (owner cx_user)
- psql: `"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev`
- Has: stub `users (id text PK, email text UNIQUE, name text, created_at)` + W1 tables `supporters`, `supporter_transactions`, `supporter_tasks`

### W1+W2+W3 decisions still locked
- D-AUTO-02: 1 USD = 1 token, `tokensFromCents = Math.floor(cents/100)`, unlimited PWYW
- D-AUTO-03: Tiebreak `(tokens DESC, joined_at ASC)`
- D-51: Tier thresholds diamond≤10, gold≤30, silver≤60, bronze≤100
- D-52: Tier multipliers diamond 2x, gold 1.5x, silver 1.25x, bronze 1x, pending 1x
- D-54: Task cap max 50 tokens/month
- D-55: Rev share activates at $10K/month MRR
- D-56: No rev share during freeze
- D-57: Tokens = loyalty points, non-transferable
- D-62: LS variant IDs — Supporter 1516645, Starter 1516676, Pro 1516706

### New locked W4 decisions
- **D-AUTO-W4-01**: Rev share distribution — weighted by D-52 tier multipliers, equal within tier, pending/frozen/quarantined/exiting excluded
- **D-AUTO-W4-02**: Task types + amounts — `bug_report`(10), `referral_signup`(3), `referral_paid`(5), `social_share`(2), `review`(5). Global 50 tokens/month cap, NO per-category limits
- **D-AUTO-W4-03**: Admin check via `ADMIN_USER_IDS` env (comma-separated). nopoint single admin
- **D-AUTO-W4-04**: Notifications = email only via new `src/services/notifications.ts`. Resend helper in auth/index.ts NOT touched
- **D-AUTO-W4-05**: Referral tracking via new `supporter_referrals` table (additive). No `users.referred_by` column
- **D-AUTO-W4-06**: Rev share cron runs quarterly. If MRR < $10K/month equivalent (last 30-day SUM < 1_000_000 cents) — log skip, no distribution

### Existing infrastructure (inlined references)

**BullMQ maintenance queue pattern** (src/routes/maintenance.ts):
```ts
queue.add(
  "quarterly-revshare",
  {},
  { repeat: { pattern: "0 5 1 1,4,7,10 *" }, jobId: "quarterly-revshare-cron" }
).catch((err) => console.error("...", err instanceof Error ? err.message : String(err)))

// In the worker dispatch:
if (job.name === "quarterly-revshare") {
  await runQuarterlyRevShare(sql, env)
  return
}
```
- Cron pattern `0 5 1 1,4,7,10 *` = 05:00 UTC on 1st of Jan/Apr/Jul/Oct
- Existing repeat jobs in prod: daily-retention, weekly-drift-check, weekly-supporters-ranking

**Hono route pattern** (from src/routes/billing.ts + src/routes/supporters.ts):
```ts
import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }
export const supporters = new Hono<AppEnv>()

supporters.post("/tasks", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)
  // ...
})
```

**Rate limit pattern** (src/services/rate-limit.ts):
```ts
import { checkRateLimit, getClientIp } from "../services/rate-limit"

const ip = getClientIp(c)
const rl = await checkRateLimit(
  redis,
  `task_submit:${auth.userId}`,
  10,         // max 10 submissions
  3600,       // per 1 hour
  ip,
  env.RATE_LIMIT_WHITELIST_IPS
)
if (!rl.allowed) return c.json({ error: "rate_limited", retryAfter: 3600 }, 429)
```

**Existing supporters.ts exports** (DO NOT break):
- Types: `SupporterTier`, `SupporterStatus`, `TransactionType`, `SourceType`, `RecordTransactionInput`
- `recordTransaction(sql, input): Promise<string | null>` — idempotent
- `creditTokens(sql, userId, tokens, joinedAt?): Promise<void>`
- `creditTokensWithMultiplier(sql, userId, baseTokens): Promise<{baseTokens, multiplier, creditedTokens}>`
- `creditTokensWithQuarantineCheck(sql, userId, tokens, joinedAt?)`
- `tokensFromCents(cents): bigint`
- `matchEmailToUser(sql, email): Promise<string | null>`
- `reclaimUnmatchedForEmail(sql, userId, email): Promise<bigint>`
- `matchSupporter(sql, {email, customDataUserId})`
- `LS_VARIANTS`, `variantToKind`, `TIER_THRESHOLDS`, `rankToTier`, `TIER_MULTIPLIERS`, `genId`

**TransactionType** (already supports all W4 needs):
```ts
export type TransactionType =
  | "purchase"
  | "subscription_payment"
  | "task"                  // ← W4 use
  | "referral"              // ← W4 use
  | "revshare"              // ← W4 use
  | "adjustment"
```

**SourceType** (already supports):
```ts
export type SourceType =
  | "lemonsqueezy_order"
  | "lemonsqueezy_subscription"
  | "task"                  // ← W4 use
  | "referral"              // ← W4 use
  | "manual"                // ← W4 admin adjustments
```

**Resend email pattern** (reference only, do NOT import from auth/index.ts):
```ts
await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "Contexter <noreply@contexter.cc>",
    to: [email],
    subject: "...",
    html: "...",
  }),
  signal: AbortSignal.timeout(10_000),
})
```

**supporter_tasks table** (already in prod from W1):
```
id TEXT PK
user_id TEXT NOT NULL FK users(id) ON DELETE CASCADE
task_type TEXT NOT NULL
amount_tokens BIGINT NOT NULL
status TEXT NOT NULL DEFAULT 'pending'
description TEXT
reviewer_id TEXT FK users(id) ON DELETE SET NULL
reviewed_at TIMESTAMP WITH TIME ZONE
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
```
- Indexes: user_id, status

---

## Scope

**IN SCOPE for W4 (6 atomic tasks):**
- W4-01: `POST /api/supporters/tasks` — submit task (auth, rate-limit, task_type whitelist, store pending)
- W4-02: Admin review endpoints — `GET /api/supporters/admin/tasks` + `POST /api/supporters/admin/tasks/:id/approve` + `POST /api/supporters/admin/tasks/:id/reject`
- W4-03: Task cap enforcement — check monthly approved-task SUM ≤ 50 before approval
- W4-04: Referral tracking — new migration `0016_supporter_referrals.sql`, `POST /api/supporters/referral` to submit referral code, first-payment trigger in `subscription_payment_success` webhook
- W4-05: Quarterly rev share — new `src/services/supporters-revshare.ts` with `runQuarterlyRevShare(sql, env)`, wired to `quarterly-revshare` cron in maintenance queue
- W4-06: Email notifications — new `src/services/notifications.ts` with Resend wrapper. Notifications for: task approved, task rejected, rev share distributed. NO Telegram. No best-effort retry — fire-and-forget.

**OUT OF SCOPE (do NOT touch):**
- W5 legal/polish, token expiry, anti-abuse patterns beyond rate limit
- Better-auth internals, `src/auth/index.ts` (read-only reference)
- Existing email verification / password reset flows
- Frontend — no `web/` changes in W4 (frontend task submission UI = W5 or follow-up)
- Telegram bot for notifications (defer)
- Per-category task limits (D-54 is global 50/month)
- `ops/deploy*.sh`
- NOWPayments billing (`src/services/billing.ts`) — only read-only reference for TIERS constant if needed
- Any file outside `src/services/`, `src/routes/`, `src/types/`, `src/index.ts`, `scripts/`, `drizzle-pg/`

---

## Hard constraints (J3 CRITICAL)

- NO destructive SQL — new migration 0016 is CREATE only, no ALTER/DROP
- NO `DROP`, `TRUNCATE`, `DELETE` without explicit WHERE on single row
- NO force push, NO `--no-verify`, NO `git add -A`
- NO secret logging (no API keys, webhook secrets, passwords, user emails in logs)
- NO auth/billing mechanic changes beyond scope (read `resolveAuth`, call it; do NOT modify it)
- NO user email in log lines (use user_id instead — PII protection)
- Immutability (H1), files <800 lines, functions <50 lines, explicit types
- Error handling explicit — no silent swallow except where notification failure is non-fatal (email send fail should not block task approval)
- Rate limit checked on POST endpoints (W4-01, W4-04)
- Admin check via `isAdmin(userId, env)` helper, 403 if not admin
- Referral self-loop prevention: user cannot refer themselves
- Referral duplicate prevention: a user can only be referred once (UNIQUE constraint on referred_id)
- Idempotency on rev share cron — run once per quarter, idempotent via transaction source_id `revshare:${quarter}:${userId}`
- MRR calculation excludes cancelled/refunded payments (but W1 doesn't distinguish — acceptable for now, all `lemonsqueezy_subscription`/`payment:%` rows count)

---

## Phase Zero for Wave 4 (J7 MANDATORY)

Before any code, Player MUST:
1. Read `memory/specs/ctx-12-w4-spec.md` (this file, fully)
2. Read `memory/ctx-12-autonomous-report.md` (Phase Zero findings for W1/W2/W3, deployed state)
3. Read these files fully:
   - `src/services/supporters.ts` (421 lines, W1+W2 surface — know every export)
   - `src/services/supporters-ranking.ts` (W2-01 pattern for how to wire a cron handler)
   - `src/services/rate-limit.ts` (checkRateLimit + getClientIp)
   - `src/routes/supporters.ts` (W2 routes — extend this file for /tasks, /referral, OR create separate files)
   - `src/routes/maintenance.ts` (existing cron schedule — extend for quarterly-revshare)
   - `src/routes/webhooks.ts` (to add referral first-payment trigger to subscription_payment_success)
   - `src/auth/index.ts` lines 130-160 ONLY (Resend POST reference — do NOT edit)
   - `src/types/env.ts` (add ADMIN_USER_IDS type)
   - `src/index.ts` (plumb ADMIN_USER_IDS env reader, mount new routes if Player chooses separate files)
   - `drizzle-pg/0015_supporters.sql` (reference schema for supporter_tasks)
4. Report Phase Zero understanding checklist:
   - List all existing exports from supporters.ts you'll call
   - Confirm rate limit fail-open behavior
   - Confirm BullMQ maintenance queue dispatch pattern
   - List the new files you'll create vs modify
   - Any ambiguity → STOP with NEEDS_CONTEXT

Phase Zero output is written by Player into the autonomous report at `memory/ctx-12-autonomous-report.md` BEFORE W4-01 code.

---

## Tasks

### W4-01 — POST /api/supporters/tasks submit endpoint

**Action:**

1. Add to `src/services/supporters.ts` (extending existing file):
   ```ts
   export type TaskType =
     | "bug_report"
     | "referral_signup"
     | "referral_paid"
     | "social_share"
     | "review"

   export const TASK_TOKEN_AMOUNTS: Record<TaskType, number> = {
     bug_report: 10,
     referral_signup: 3,
     referral_paid: 5,
     social_share: 2,
     review: 5,
   }

   export const MONTHLY_TASK_CAP = 50  // D-54
   ```

2. Add a new function `submitTask(sql, userId, taskType, description)` in supporters.ts:
   - Validate taskType in TASK_TOKEN_AMOUNTS keys (runtime check + type narrow)
   - Validate description (optional, max 1000 chars, trim)
   - INSERT into supporter_tasks with id (genId()), status='pending', amount_tokens from TASK_TOKEN_AMOUNTS
   - Return `{id, taskType, amountTokens, status}` or throw on validation failure

3. In `src/routes/supporters.ts`, add route `POST /tasks`:
   - Auth: `resolveAuth` → 401 if null or not isOwner
   - Rate limit: `checkRateLimit(redis, "task_submit:${userId}", 10, 3600, ip, env.RATE_LIMIT_WHITELIST_IPS)` → 429 if not allowed (with `retryAfter` in body)
   - Parse JSON body: `{taskType: string, description?: string}` — 400 on parse error
   - Validate taskType against `TASK_TOKEN_AMOUNTS` keys, 400 if invalid
   - Call `submitTask(sql, auth.userId, taskType, description)`
   - Return 201 with `{taskId, taskType, amountTokens, status: "pending", message: "Task submitted for review"}`
   - Log: `console.log(JSON.stringify({event: "task_submitted", user_id: auth.userId, task_type, task_id}))` — no description in log (PII)

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts src/routes/supporters.ts 2>&1 | tail -5
# Expected: 0 new errors
```

Manual SQL test:
```bash
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev <<'SQL'
INSERT INTO users (id, email) VALUES ('w401-test', 'w401@test.com') ON CONFLICT DO NOTHING;
-- Simulate submitTask via direct INSERT
INSERT INTO supporter_tasks (id, user_id, task_type, amount_tokens, status, description)
  VALUES ('t-w401-1', 'w401-test', 'bug_report', 10, 'pending', 'Found UI bug');
SELECT id, task_type, amount_tokens, status FROM supporter_tasks WHERE user_id='w401-test';
-- Cleanup
DELETE FROM supporter_tasks WHERE user_id='w401-test';
DELETE FROM users WHERE id='w401-test';
SQL
```

**Done when:**
- [ ] `TaskType`, `TASK_TOKEN_AMOUNTS`, `MONTHLY_TASK_CAP` exported from supporters.ts
- [ ] `submitTask` function exported, validates taskType + description
- [ ] `POST /api/supporters/tasks` wired in routes/supporters.ts
- [ ] 401 / 429 / 400 / 201 flow tested
- [ ] Log line does NOT contain description or email (PII)
- [ ] tsc clean

**Commit:** `feat(ctx12-w4-01): POST /api/supporters/tasks submit endpoint`

---

### W4-02 — Admin review endpoints + isAdmin helper

**Action:**

1. Add to `src/types/env.ts`:
   ```ts
   export interface Env {
     // ... existing
     ADMIN_USER_IDS?: string  // comma-separated user IDs with admin access
   }
   ```

2. Add to `src/index.ts` env reader (find where RESEND_API_KEY is plumbed, ~line 113):
   ```ts
   ADMIN_USER_IDS: process.env.ADMIN_USER_IDS ?? "",
   ```

3. Add new helper `isAdmin(userId, env)` in `src/services/supporters.ts` (keeps W4 isolated to one service file):
   ```ts
   export function isAdmin(userId: string, env: Env): boolean {
     const raw = env.ADMIN_USER_IDS ?? ""
     if (!raw) return false
     const allowlist = raw.split(",").map((s) => s.trim()).filter(Boolean)
     return allowlist.includes(userId)
   }
   ```

4. In `src/routes/supporters.ts`, add 3 admin endpoints:

   **GET /admin/tasks** — list pending tasks for review
   - Auth + isAdmin check (403 if not admin)
   - Optional query: `?status=pending|approved|rejected` (default pending), `?limit=50`
   - SELECT from supporter_tasks ORDER BY created_at ASC LIMIT
   - JOIN users for submitter name (display only, not email)
   - Return `{tasks: [...], count}`

   **POST /admin/tasks/:id/approve**
   - Auth + isAdmin
   - Parse `:id` from URL
   - In a transaction:
     1. SELECT the task row FOR UPDATE — 404 if missing, 409 if status != 'pending'
     2. Check monthly cap (W4-03 covers this in detail, but wire the call here): `checkTaskCapForUser(tx, task.user_id, task.amount_tokens)` → returns `{allowed, already, remaining}`. If not allowed → rollback transaction, return 409 `{error: "monthly_cap_exceeded", already, cap: 50}`
     3. UPDATE supporter_tasks SET status='approved', reviewer_id=auth.userId, reviewed_at=NOW() WHERE id=?
     4. Record transaction: `recordTransaction(tx, {userId: task.user_id, email: null, type: 'task', amountTokens: task.amount_tokens, amountUsdCents: null, sourceType: 'task', sourceId: task.id, metadata: {task_type: task.task_type}})`
     5. Credit tokens: `creditTokens(tx as unknown as Sql, task.user_id, task.amount_tokens)`
     6. Send email notification (W4-06 `sendTaskApprovedEmail(env, userEmail, taskType, amount)` — non-blocking, try/catch swallow)
   - Return 200 `{ok: true, taskId, creditedTokens}`

   **POST /admin/tasks/:id/reject**
   - Auth + isAdmin
   - Parse body `{reason?: string}` (optional reason string, max 500 chars)
   - In a transaction: SELECT FOR UPDATE, 404/409 checks, UPDATE status='rejected', reviewer_id, reviewed_at, append reason to description or store in a metadata JSONB (supporter_tasks has no metadata column — append to description: `description || "\n\nRejected: " || reason`)
   - No token credit, no transaction row created
   - Send email notification `sendTaskRejectedEmail(env, userEmail, taskType, reason)` — non-blocking
   - Return 200 `{ok: true, taskId}`

5. Error handling: all admin endpoints return structured JSON errors, log event with admin user_id.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts src/routes/supporters.ts src/types/env.ts src/index.ts 2>&1 | tail -5
# Expected: 0 new errors
```

Integration test (W4-06 covers it):
```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev ADMIN_USER_IDS=test-admin bun run scripts/test-ctx-12-w4.ts 2>&1 | tail -20
```

**Done when:**
- [ ] `Env` interface extended with `ADMIN_USER_IDS`
- [ ] `index.ts` plumbs the env var
- [ ] `isAdmin(userId, env)` helper exported from supporters.ts
- [ ] 3 admin endpoints registered
- [ ] 401 (unauth), 403 (not admin), 404 (missing task), 409 (wrong status / cap exceeded) flows all correct
- [ ] Approve path: transactional, records tx, credits tokens, sends email
- [ ] Reject path: transactional, stores reason, sends email
- [ ] Admin action logs include admin user_id
- [ ] tsc clean

**Commit:** `feat(ctx12-w4-02): admin task review endpoints + isAdmin helper`

---

### W4-03 — Monthly task cap enforcement

**Action:**

Add function `checkTaskCapForUser(sql, userId, requestedTokens)` to `src/services/supporters.ts`:

```ts
export async function checkTaskCapForUser(
  sql: Sql,
  userId: string,
  requestedTokens: number
): Promise<{ allowed: boolean; already: number; remaining: number; cap: number }> {
  const rows = await sql<{ sum: string | null }[]>`
    SELECT COALESCE(SUM(amount_tokens), 0)::text AS sum
    FROM supporter_tasks
    WHERE user_id = ${userId}
      AND status = 'approved'
      AND reviewed_at >= date_trunc('month', NOW())
  `
  const already = Number(rows[0].sum ?? '0')
  const remaining = Math.max(0, MONTHLY_TASK_CAP - already)
  const allowed = requestedTokens <= remaining
  return { allowed, already, remaining, cap: MONTHLY_TASK_CAP }
}
```

- Uses `date_trunc('month', NOW())` for calendar month boundary
- Counts only `status='approved'` and `reviewed_at` (not created_at, so rejected/pending tasks don't count)
- Cap is on the credit action, not the submission — users can submit many tasks in a month, admin approves up to 50 tokens worth

**Wire in `src/routes/supporters.ts` admin approve endpoint** (from W4-02):
```ts
const cap = await checkTaskCapForUser(tx as unknown as Sql, task.user_id, Number(task.amount_tokens))
if (!cap.allowed) {
  return 409 { error: "monthly_cap_exceeded", already: cap.already, remaining: cap.remaining, cap: cap.cap }
}
```

- The cap check runs INSIDE the approve transaction, so concurrent approve calls for the same user can't both pass the cap check. Use `pg_advisory_xact_lock(hashtext('task_cap:' || userId))` at the start of the transaction to serialize cap checks per user (same pattern as W2-08 spending cap).

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts 2>&1 | tail -5
# Expected: 0 new errors
```

Runtime test in `scripts/test-ctx-12-w4.ts` (W4-06):
- Seed user with 45 tokens already approved this month
- Call approve on task worth 10 tokens → should return 409 with `already=45, remaining=5`
- Approve task worth 5 tokens → should succeed, `already=50, remaining=0`
- Approve another task worth 1 token → 409

**Done when:**
- [ ] `checkTaskCapForUser` exported, returns explicit shape
- [ ] Uses calendar month boundary
- [ ] Wired into W4-02 approve endpoint under advisory lock
- [ ] Rejected tasks do NOT count against cap
- [ ] tsc clean

**Commit:** `feat(ctx12-w4-03): monthly task cap enforcement with advisory lock`

---

### W4-04 — Referral tracking

**Action:**

1. **New migration** `drizzle-pg/0016_supporter_referrals.sql`:
   ```sql
   -- CTX-12 W4-04: Supporter referral tracking

   CREATE TABLE "supporter_referrals" (
     "id" TEXT PRIMARY KEY,
     "referrer_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
     "referred_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
     "code" TEXT NOT NULL,
     "signup_credited_at" TIMESTAMP WITH TIME ZONE,
     "payment_credited_at" TIMESTAMP WITH TIME ZONE,
     "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
     CONSTRAINT "supporter_referrals_referred_unique" UNIQUE ("referred_id"),
     CONSTRAINT "supporter_referrals_no_self" CHECK ("referrer_id" != "referred_id")
   );
   --> statement-breakpoint
   CREATE INDEX "supporter_referrals_referrer_idx" ON "supporter_referrals" ("referrer_id");
   --> statement-breakpoint
   CREATE INDEX "supporter_referrals_code_idx" ON "supporter_referrals" ("code");
   --> statement-breakpoint
   CREATE INDEX "supporter_referrals_pending_payment_idx" ON "supporter_referrals" ("referrer_id") WHERE "payment_credited_at" IS NULL;
   ```
   Also update `drizzle-pg/meta/_journal.json` to add idx:2.

2. **Referral code generation** in `src/services/supporters.ts`:
   ```ts
   export function generateReferralCode(userId: string): string {
     // Deterministic 8-char code from userId (base32 of first 5 bytes of SHA-256)
     // For simplicity: use userId itself as the code (users already have text ids)
     // Trade-off: referral code = userId exposes user id. Alternative: new random code table.
     // Decision for W4: referrer's userId IS their referral code (matches LS custom_data.user_id convention).
     return userId
   }
   ```
   **Decision** (D-AUTO-W4-07, new): Referral code = referrer userId. This keeps the flow simple, matches W1 `matchSupporter` primary path (custom_data.user_id), and avoids a separate referral_code column. Trade-off: user ids are exposed when shared — acceptable because user ids are already used in URLs via LS custom_data.

3. **Endpoint `POST /api/supporters/referral`** in routes/supporters.ts:
   - Auth required
   - Rate limit: `referral_submit:${userId}` 5/hour + `referral_submit_ip:${ip}` 20/hour (double-gate IP + user)
   - Parse body `{code: string}` — referrer's userId
   - Validation:
     - code must be a non-empty string, max 128 chars
     - code != auth.userId (self-loop — 400 `cannot_refer_self`)
     - code must be an existing user: `SELECT id FROM users WHERE id = ${code}` → 404 `invalid_code` if not found
     - auth.userId must not already be referred: `SELECT 1 FROM supporter_referrals WHERE referred_id = ${auth.userId}` → 409 `already_referred` if exists
   - INSERT new referral row with id (genId()), referrer_id=code, referred_id=auth.userId, code=code, signup_credited_at=NULL (credit on first payment only, per D-52 `referral_signup` is 3 tokens immediately on signup verification — decision: credit 3 tokens immediately as `referral_signup`, 5 more on first payment as `referral_paid`)
   - Immediately credit 3 tokens to referrer via `recordTransaction` (type='referral', sourceType='referral', sourceId='signup:${referralId}') + `creditTokens`
   - Set signup_credited_at=NOW()
   - Return 201 `{ok: true, referralId, signupReward: 3}`

4. **First-payment trigger** in `src/routes/webhooks.ts` `subscription_payment_success` handler:
   - After the cap-check + creditTokensWithMultiplier (W2-08) succeeds
   - Check if this userId has a pending referral: `SELECT id, referrer_id FROM supporter_referrals WHERE referred_id = ${userId} AND payment_credited_at IS NULL LIMIT 1`
   - If found:
     - UPDATE supporter_referrals SET payment_credited_at = NOW() WHERE id = ?
     - Record transaction for referrer: `recordTransaction({userId: referrer_id, type: 'referral', amountTokens: 5, sourceType: 'referral', sourceId: 'paid:${referralId}', ...})`
     - Credit tokens: `creditTokens(sql, referrer_id, 5)`
     - Send email to referrer: `sendReferralPaidEmail(env, referrerEmail, 5)` (non-blocking)
     - Log `referral_paid_credited`
   - All INSIDE the same webhook handler transaction (so if the outer transaction rolls back, referral credit rolls back too)

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && "/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev -f drizzle-pg/0016_supporter_referrals.sql 2>&1 | tail -5
# Expected: CREATE TABLE, CREATE INDEX ×3

"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev -c '\d supporter_referrals' 2>&1 | head -20
# Expected: all columns + indexes + constraints present

cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts src/routes/supporters.ts src/routes/webhooks.ts 2>&1 | tail -5
# Expected: 0 new errors
```

**Done when:**
- [ ] Migration 0016 applied to contexter_dev
- [ ] Self-loop prevented (CHECK constraint + code validation)
- [ ] Duplicate referred_id prevented (UNIQUE constraint)
- [ ] Signup reward 3 tokens credited immediately
- [ ] First-payment trigger wires paid reward 5 tokens
- [ ] Rate limit double-gated (user + IP)
- [ ] tsc clean

**Commit:** `feat(ctx12-w4-04): supporter_referrals migration + tracking + first-payment trigger`

---

### W4-05 — Quarterly rev share

**Action:**

1. **New file** `src/services/supporters-revshare.ts`:
   ```ts
   import type { Sql } from "postgres"
   import type { Env } from "../types/env"
   import { creditTokens, recordTransaction, TIER_MULTIPLIERS, type SupporterTier } from "./supporters"

   const REV_SHARE_PERCENT = 1          // 1% of quarterly revenue (D-51)
   const MRR_GATE_CENTS = 1_000_000n     // $10,000 MRR gate (D-55)

   export async function runQuarterlyRevShare(sql: Sql, env: Env): Promise<void> {
     const started = Date.now()

     // Step 1: Compute MRR = last 30 days subscription payment SUM (cents)
     const mrrRows = await sql<{ sum: string | null }[]>`
       SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
       FROM supporter_transactions
       WHERE source_type = 'lemonsqueezy_subscription'
         AND source_id LIKE 'payment:%'
         AND created_at >= NOW() - INTERVAL '30 days'
     `
     const mrrCents = BigInt(mrrRows[0].sum ?? '0')
     if (mrrCents < MRR_GATE_CENTS) {
       console.log(JSON.stringify({
         event: "revshare_skipped_below_gate",
         mrr_cents: mrrCents.toString(),
         gate_cents: MRR_GATE_CENTS.toString(),
         duration_ms: Date.now() - started,
       }))
       return
     }

     // Step 2: Compute quarter boundaries + revenue
     const quarterStart = previousQuarterStart()   // Date object
     const quarterEnd = previousQuarterEnd()       // Date object
     const quarterLabel = `${quarterStart.getUTCFullYear()}Q${Math.floor(quarterStart.getUTCMonth()/3)+1}`

     const qRows = await sql<{ sum: string | null }[]>`
       SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
       FROM supporter_transactions
       WHERE source_type = 'lemonsqueezy_subscription'
         AND source_id LIKE 'payment:%'
         AND created_at >= ${quarterStart}
         AND created_at < ${quarterEnd}
     `
     const quarterRevenueCents = BigInt(qRows[0].sum ?? '0')
     const poolCents = (quarterRevenueCents * BigInt(REV_SHARE_PERCENT)) / 100n

     if (poolCents === 0n) {
       console.log(JSON.stringify({ event: "revshare_zero_pool", quarter: quarterLabel }))
       return
     }

     // Step 3: Fetch eligible supporters (active|warning, exclude pending/frozen/quarantined/exiting)
     const supporters = await sql<{ user_id: string; tier: SupporterTier }[]>`
       SELECT user_id, tier
       FROM supporters
       WHERE status IN ('active', 'warning')
         AND tier IN ('diamond', 'gold', 'silver', 'bronze')
     `

     // Step 4: Calculate weighted distribution
     //   weight per supporter = multiplier.num / multiplier.den
     //   Normalize to BigInt units: multiply by common denominator (4 = LCM of 1,2,4)
     //   diamond=8 units (2.0*4), gold=6 (1.5*4), silver=5 (1.25*4), bronze=4 (1.0*4)
     const TIER_UNITS: Record<SupporterTier, bigint> = {
       diamond: 8n,
       gold: 6n,
       silver: 5n,
       bronze: 4n,
       pending: 0n,  // excluded
     }
     let totalUnits = 0n
     for (const s of supporters) totalUnits += TIER_UNITS[s.tier]
     if (totalUnits === 0n) {
       console.log(JSON.stringify({ event: "revshare_no_eligible_supporters", quarter: quarterLabel }))
       return
     }

     // Step 5: Distribute pool — each supporter gets (poolCents * units / totalUnits) cents
     //   Convert cents → tokens at 1:1 with floor
     let distributed = 0
     let skipped = 0
     for (const s of supporters) {
       const shareCents = (poolCents * TIER_UNITS[s.tier]) / totalUnits
       const shareTokens = Number(shareCents / 100n)   // $1 = 1 token
       if (shareTokens === 0) { skipped++; continue }

       // Idempotency: recordTransaction with source_id `revshare:${quarterLabel}:${userId}`
       // If cron re-runs for the same quarter, the second call returns null (duplicate) and we skip
       const txId = await recordTransaction(sql, {
         userId: s.user_id,
         email: null,
         type: 'revshare',
         amountTokens: shareTokens,
         amountUsdCents: Number(shareCents),
         sourceType: 'manual',  // no dedicated source_type, 'manual' + source_id prefix
         sourceId: `revshare:${quarterLabel}:${s.user_id}`,
         metadata: { quarter: quarterLabel, tier: s.tier, pool_cents: poolCents.toString() },
       })
       if (!txId) { skipped++; continue }  // already distributed for this quarter

       await creditTokens(sql, s.user_id, shareTokens)
       distributed++

       // Notification fire-and-forget (W4-06)
       // Email lookup happens in sendRevShareEmail itself
     }

     console.log(JSON.stringify({
       event: "revshare_distributed",
       quarter: quarterLabel,
       mrr_cents: mrrCents.toString(),
       quarter_revenue_cents: quarterRevenueCents.toString(),
       pool_cents: poolCents.toString(),
       eligible: supporters.length,
       distributed,
       skipped,
       duration_ms: Date.now() - started,
     }))
   }

   function previousQuarterStart(): Date {
     const now = new Date()
     const q = Math.floor(now.getUTCMonth() / 3)  // 0-3
     const prevQ = q === 0 ? 3 : q - 1
     const year = q === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
     return new Date(Date.UTC(year, prevQ * 3, 1, 0, 0, 0, 0))
   }
   function previousQuarterEnd(): Date {
     const now = new Date()
     const q = Math.floor(now.getUTCMonth() / 3)
     const year = q === 0 ? now.getUTCFullYear() : now.getUTCFullYear()
     const startMonth = q * 3  // current quarter start = previous quarter end (exclusive)
     return new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0))
   }
   ```

2. Wire into `src/routes/maintenance.ts`:
   - Import: `import { runQuarterlyRevShare } from "../services/supporters-revshare"`
   - In `startMaintenanceWorker`, after weekly-supporters-ranking schedule:
     ```ts
     queue.add(
       "quarterly-revshare",
       {},
       { repeat: { pattern: "0 5 1 1,4,7,10 *" }, jobId: "quarterly-revshare-cron" }
     ).catch((err) =>
       console.error("Failed to schedule quarterly-revshare job:", err instanceof Error ? err.message : String(err))
     )
     ```
   - Worker dispatch branch:
     ```ts
     if (job.name === "quarterly-revshare") {
       await runQuarterlyRevShare(sql, env)  // env not currently in scope — pipe through
       return
     }
     ```
   - **BLOCKER CHECK**: `startMaintenanceWorker(redisUrl, sql)` currently does NOT receive `env`. Player must either:
     - (a) Extend signature to `startMaintenanceWorker(redisUrl, sql, env)` and update the single caller in `src/index.ts`. ADDITIVE, safe per J2.
     - (b) Read ADMIN_USER_IDS / RESEND_API_KEY from `process.env` directly inside `supporters-revshare.ts`. Fine but less clean.
     - **Choose (a)** — more hygienic, single caller site.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters-revshare.ts src/routes/maintenance.ts 2>&1 | tail -5
# Expected: 0 new errors

# Runtime smoke test (empty data — should log revshare_skipped_below_gate)
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev bun -e "
  import postgres from 'postgres';
  import { runQuarterlyRevShare } from './src/services/supporters-revshare';
  const sql = postgres({host:'localhost',database:'contexter_dev',username:'cx_user',password:''});
  const env = { RESEND_API_KEY: '' } as any;
  await runQuarterlyRevShare(sql, env);
  await sql.end();
" 2>&1 | tail -5
# Expected: JSON log revshare_skipped_below_gate (because empty dev db has 0 revenue)
```

**Done when:**
- [ ] `supporters-revshare.ts` exists with `runQuarterlyRevShare` export
- [ ] MRR gate check correct ($10K = 1_000_000 cents from last 30 days)
- [ ] Pool = 1% of quarter revenue (last calendar quarter, not rolling 90 days)
- [ ] Weighted distribution: diamond 8u, gold 6u, silver 5u, bronze 4u, pending excluded
- [ ] Idempotency via `revshare:${quarter}:${userId}` source_id
- [ ] Frozen/quarantined/exiting excluded
- [ ] maintenance.ts schedules + dispatches quarterly-revshare job
- [ ] `startMaintenanceWorker` signature extended to accept `env`
- [ ] `src/index.ts` passes env to `startMaintenanceWorker`
- [ ] tsc clean

**Commit:** `feat(ctx12-w4-05): quarterly rev share cron with MRR gate`

---

### W4-06 — Email notifications + integration test

**Action (part 1 — notifications service):**

New file `src/services/notifications.ts`:
```ts
import type { Env } from "../types/env"

interface EmailMessage {
  to: string
  subject: string
  html: string
}

async function sendEmail(env: Env, msg: EmailMessage): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(JSON.stringify({ event: "notification_skipped_no_resend_key" }))
    return
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contexter <noreply@contexter.cc>",
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(JSON.stringify({
        event: "notification_send_failed",
        status: res.status,
      }))
      return
    }
    console.log(JSON.stringify({
      event: "notification_sent",
      subject: msg.subject,
      // DO NOT log msg.to (PII)
    }))
  } catch (e) {
    console.error(JSON.stringify({
      event: "notification_send_error",
      error: e instanceof Error ? e.message : String(e),
    }))
  }
}

export async function sendTaskApprovedEmail(
  env: Env,
  email: string,
  taskType: string,
  amountTokens: number,
): Promise<void> {
  await sendEmail(env, {
    to: email,
    subject: "Your Contexter task was approved",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Task approved 🎉</h2>
      <p>Your <strong>${taskType.replace(/_/g, ' ')}</strong> task has been reviewed and approved.</p>
      <p><strong>${amountTokens} tokens</strong> have been credited to your supporter account.</p>
      <p><a href="https://contexter.cc/dashboard">View your supporter status →</a></p>
    </div>`,
  })
}

export async function sendTaskRejectedEmail(
  env: Env,
  email: string,
  taskType: string,
  reason: string,
): Promise<void> {
  const safeReason = reason.replace(/[<>]/g, '').slice(0, 500)  // naive XSS guard
  await sendEmail(env, {
    to: email,
    subject: "Your Contexter task was not approved",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Task not approved</h2>
      <p>Your <strong>${taskType.replace(/_/g, ' ')}</strong> task was reviewed and could not be approved.</p>
      <p><em>Reason:</em> ${safeReason}</p>
      <p>You can submit new tasks anytime from your dashboard.</p>
    </div>`,
  })
}

export async function sendReferralPaidEmail(
  env: Env,
  email: string,
  amountTokens: number,
): Promise<void> {
  await sendEmail(env, {
    to: email,
    subject: "Your referral made their first payment 🎉",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Referral rewarded</h2>
      <p>A user you referred has made their first payment.</p>
      <p><strong>${amountTokens} tokens</strong> have been added to your supporter account.</p>
    </div>`,
  })
}

export async function sendRevShareEmail(
  env: Env,
  email: string,
  quarter: string,
  tokens: number,
  poolCents: bigint,
): Promise<void> {
  const poolUsd = Number(poolCents / 100n)
  await sendEmail(env, {
    to: email,
    subject: `Rev share for ${quarter}`,
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Quarterly rev share distributed</h2>
      <p>Your share of ${quarter} revenue: <strong>${tokens} tokens</strong></p>
      <p>Total pool: $${poolUsd}</p>
    </div>`,
  })
}
```

**Action (part 2 — wire into W4-02 approve/reject, W4-04 first-payment, W4-05 rev share):**
- W4-02 approve: after token credit, lookup user email and call `sendTaskApprovedEmail(env, email, taskType, amountTokens)`
- W4-02 reject: after status update, lookup email and call `sendTaskRejectedEmail(env, email, taskType, reason)`
- W4-04 first-payment trigger: after credit, lookup referrer email and call `sendReferralPaidEmail(env, referrerEmail, 5)`
- W4-05 in distribute loop: after credit, lookup email and call `sendRevShareEmail(env, email, quarterLabel, shareTokens, poolCents)`

All email calls are fire-and-forget (no await blocking, or await in try/catch that swallows).

**Action (part 3 — integration test):**

New file `scripts/test-ctx-12-w4.ts` — standalone Bun, ~20 assertions:
1. TASK_TOKEN_AMOUNTS constant shape
2. `submitTask` validates task_type, throws on invalid
3. `submitTask` stores row with status='pending'
4. `submitTask` rejects description > 1000 chars
5. `isAdmin('nopoint-id', {ADMIN_USER_IDS: 'nopoint-id'})` returns true
6. `isAdmin('other', {ADMIN_USER_IDS: 'nopoint-id'})` returns false
7. `isAdmin('x', {ADMIN_USER_IDS: ''})` returns false (no admins configured)
8. `checkTaskCapForUser` with 0 already → allowed, remaining=50
9. `checkTaskCapForUser` with 45 already for 10 tokens → NOT allowed, remaining=5
10. `checkTaskCapForUser` only counts approved + reviewed_at current month (not created_at)
11. Referral self-loop rejected (CHECK constraint triggers)
12. Referral duplicate referred rejected (UNIQUE triggers)
13. Signup referral credits 3 tokens to referrer immediately
14. First-payment referral trigger credits 5 tokens to referrer
15. Rev share MRR < $10K skips distribution
16. Rev share MRR ≥ $10K distributes by weighted tier
17. Rev share idempotency: running twice for same quarter no double-credit
18. Rev share excludes frozen/quarantined/exiting
19. Rev share zero-pool (quarter revenue 0) logs and skips
20. Notification sendEmail gracefully handles missing RESEND_API_KEY (warns, returns)

Each assertion seeds w4test_ prefixed data, cleans up at end.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev ADMIN_USER_IDS=w4test-admin bun run scripts/test-ctx-12-w4.ts 2>&1 | tail -30
# Expected: 20/20 PASS
```

**Done when:**
- [ ] `src/services/notifications.ts` exists with 4 exports
- [ ] All 4 notification call sites wired (approve, reject, referral paid, rev share)
- [ ] Email failures never block core operations (try/catch swallow)
- [ ] PII protection: `msg.to` never logged
- [ ] XSS guard on reject reason
- [ ] Integration test 20/20 PASS
- [ ] tsc clean

**Commit:** `test(ctx12-w4-06): notifications service + W4 integration test`

---

## Post-W4 Deploy Plan (Axis, manual per D-AUTO-08)

1. pg_dump backup: `/root/backups/ctx12-w4-pre-YYYYMMDD-HHMMSS.dump`
2. SCP files (unique filenames to avoid W2 name collision issue):
   - `src/services/supporters.ts` (modified — use unique scp name like `w4-supporters.ts`)
   - `src/services/supporters-revshare.ts` (new)
   - `src/services/notifications.ts` (new)
   - `src/routes/supporters.ts` (modified)
   - `src/routes/maintenance.ts` (modified)
   - `src/routes/webhooks.ts` (modified)
   - `src/types/env.ts` (modified)
   - `src/index.ts` (modified)
   - `drizzle-pg/0016_supporter_referrals.sql` (new)
   - `drizzle-pg/meta/_journal.json` (modified)
   - `scripts/test-ctx-12-w4.ts` (new)
3. Apply migration 0016 to prod:
   - `docker exec contexter-postgres-1 psql -U contexter -d contexter -f /tmp/0016_supporter_referrals.sql`
   - Verify: `\d supporter_referrals` → all columns + indexes + constraints
4. Place files into `/opt/contexter/app/...` paths (use scp unique names)
5. Set new env var on prod: `ADMIN_USER_IDS=<nopoint's user id>` in `/opt/contexter/.env` (find prod env file — axis will locate)
6. `docker compose build --no-cache app`
7. `docker compose up -d app` + health check 200
8. Smoke tests:
   - `curl https://api.contexter.cc/health` → 200
   - `curl -X POST https://api.contexter.cc/api/supporters/tasks` (unauth) → 401
   - `curl https://api.contexter.cc/api/supporters/admin/tasks` (unauth) → 401
   - Verify `quarterly-revshare-cron` appears in Redis `bull:maintenance:*` keys (4 schedules total: daily-retention, weekly-drift-check, weekly-supporters-ranking, quarterly-revshare)
9. Check disk after build (< 80% target)

---

## Coach 8-Dimension POST-REVIEW

Standard 8 dims plus W4-specific:
- **Transaction atomicity**: approve/reject/first-payment/rev-share all inside `sql.begin` where needed
- **Advisory lock coverage**: W4-03 task cap check serialized via `pg_advisory_xact_lock(hashtext('task_cap:' || userId))`
- **Idempotency**: rev share source_id dedup, referral UNIQUE on referred_id, approve status='pending' guard
- **PII protection**: no email in logs, XSS guard on rejection reason
- **Admin check**: every admin endpoint returns 403 for non-admins, not 401
- **Rate limit coverage**: POST /tasks + POST /referral rate-limited
- **Email fire-and-forget**: notification failures never block core operations

## Out of scope repeat (DO NOT let scope creep)

- NO W5 legal/polish, soft demotion, token expiry, anti-abuse beyond W4 rate limits
- NO frontend changes in `web/`
- NO ALTER TABLE on existing tables
- NO auth/better-auth changes
- NO `src/auth/index.ts` edits (read-only reference)
- NO NOWPayments or billing.ts changes
- NO new npm dependencies
- NO Telegram notifications
- NO per-category task limits
- NO refund logic
- NO ops/deploy.sh edits
- Any file outside `src/{services,routes,types}`, `src/index.ts`, `drizzle-pg/`, `scripts/`

---

## Addenda (Axis 2026-04-11, session 239) — gap fixes from spec self-audit

Post-audit addenda closing 5 gaps discovered before Player launch. Player MUST apply these rules on top of the primary spec body.

### ADD-1 — Supporter-only gate for token-earning endpoints (CRITICAL)

**Problem:** `creditTokens` is a pure upsert (supporters.ts:181-187). Calling it with a non-supporter userId creates a phantom supporters row with `tokens=N, joined_at=NOW(), rank=0`. This bypasses the 100-spot cap, promotes non-supporters into the program via task approval or referral.

**Fix:** Gate earning endpoints on existing supporter row.

**Rule:** Tokens exist ONLY for supporters. Only users with a row in `supporters` (status `active`, `warning`, `frozen`, or `quarantined`) can earn tokens via tasks or referrals. Non-supporters attempting to submit tasks or referrals receive 403 `not_a_supporter`.

**Implementation — add to supporters.ts:**
```ts
export type SupporterGateResult =
  | { ok: true; tier: SupporterTier; status: string }
  | { ok: false; reason: "not_found" | "exiting" }

export async function requireActiveSupporter(
  sql: Sql,
  userId: string,
): Promise<SupporterGateResult> {
  const rows = await sql<{ tier: SupporterTier; status: string }[]>`
    SELECT tier, status FROM supporters WHERE user_id = ${userId} LIMIT 1
  `
  if (rows.length === 0) return { ok: false, reason: "not_found" }
  if (rows[0].status === "exiting") return { ok: false, reason: "exiting" }
  return { ok: true, tier: rows[0].tier, status: rows[0].status }
}
```

**Apply in:**
- W4-01 `POST /api/supporters/tasks` — call `requireActiveSupporter(sql, auth.userId)` after auth + rate-limit. If `!ok` → 403 `{error:"not_a_supporter", reason}`.
- W4-04 `POST /api/supporters/referral` — referrer (from `code`) must exist. Also the referred user (auth.userId) can BE a non-supporter here — that's the normal case. Referrers earn tokens; referred users don't automatically become supporters. So the gate applies to the REFERRER: `requireActiveSupporter(sql, code)` BEFORE crediting signup bonus.
- W4-04 first-payment webhook trigger — gate on `requireActiveSupporter(sql, referrer_id)` before crediting referral_paid. If referrer no longer active → skip credit, still mark `payment_credited_at=NOW()` to prevent re-trigger, log `referral_paid_skipped_referrer_inactive`.
- W4-02 admin approve — gate on `requireActiveSupporter(sql, task.user_id)` inside transaction. If referrer got ingested somehow but is now exiting → 409 `referrer_not_active`.

**Note on W4-02 approve gate vs W4-01 submit gate:**
- W4-01 blocks submission for non-supporters (fail fast, no DB row pollution).
- W4-02 re-checks on approval (defensive — user status may have changed between submit and approve).

### ADD-2 — Advisory lock placement in W4-02 approve (EXPLICIT CODE)

**Problem:** W4-02 text says "use advisory lock at start of transaction" but code snippet does not show call order. Player may place it after SELECT FOR UPDATE, losing serialization guarantees.

**Fix:** Advisory lock MUST be the FIRST statement inside `sql.begin`, before any SELECT. Explicit code pattern:

```ts
const result = await sql.begin(async (tx) => {
  // 1) Serialize all concurrent approves for this user (BEFORE any read)
  await tx`SELECT pg_advisory_xact_lock(hashtext('task_cap:' || ${task_user_id_placeholder}))`
  // 2) Re-fetch task row (FOR UPDATE) — row may have changed while waiting for lock
  const taskRows = await tx<TaskRow[]>`
    SELECT id, user_id, task_type, amount_tokens, status, description
    FROM supporter_tasks WHERE id = ${taskId} FOR UPDATE
  `
  if (taskRows.length === 0) return { ok: false, code: 404 }
  const task = taskRows[0]
  if (task.status !== "pending") return { ok: false, code: 409, err: "not_pending" }
  // 3) Supporter gate (ADD-1)
  const gate = await requireActiveSupporter(tx as unknown as Sql, task.user_id)
  if (!gate.ok) return { ok: false, code: 409, err: "not_a_supporter" }
  // 4) Task cap check (already serialized by the advisory lock above)
  const cap = await checkTaskCapForUser(tx as unknown as Sql, task.user_id, Number(task.amount_tokens))
  if (!cap.allowed) return { ok: false, code: 409, err: "monthly_cap_exceeded", already: cap.already, remaining: cap.remaining, cap: cap.cap }
  // 5) UPDATE status
  await tx`UPDATE supporter_tasks SET status='approved', reviewer_id=${adminId}, reviewed_at=NOW() WHERE id=${taskId}`
  // 6) Record transaction (idempotent via source_id)
  await recordTransaction(tx as unknown as Sql, {
    userId: task.user_id, email: null, type: 'task',
    amountTokens: Number(task.amount_tokens), amountUsdCents: null,
    sourceType: 'task', sourceId: task.id,
    metadata: { task_type: task.task_type },
  })
  // 7) Credit
  await creditTokens(tx as unknown as Sql, task.user_id, Number(task.amount_tokens))
  return { ok: true, taskId, creditedTokens: Number(task.amount_tokens), userEmail: null /* fetched outside tx */ }
})
```

Note: advisory lock key `hashtext('task_cap:' || userId)` is the SAME key used by any future cap-related serialization (same scheme as W2-08 spending cap, different prefix).

Email lookup + `sendTaskApprovedEmail` fire-and-forget happen AFTER `sql.begin` returns, in a try/catch that swallows.

### ADD-3 — W4-04 referral signup wrap (transactional)

**Problem:** Spec sequence is: INSERT referral row → credit 3 tokens → UPDATE signup_credited_at=NOW(). If credit fails after INSERT, row is orphaned (signup_credited_at NULL forever, UNIQUE referred_id blocks retry).

**Fix:** Wrap in a transaction. If any step fails → rollback → no partial state.

```ts
const referralId = await sql.begin(async (tx) => {
  // gate: referrer must be active supporter (ADD-1)
  const gate = await requireActiveSupporter(tx as unknown as Sql, code)
  if (!gate.ok) return { error: "referrer_not_active" }
  // gate: referred must not already be referred
  const dup = await tx`SELECT 1 FROM supporter_referrals WHERE referred_id = ${auth.userId} LIMIT 1`
  if (dup.length > 0) return { error: "already_referred" }
  const id = genId("ref_")
  await tx`
    INSERT INTO supporter_referrals (id, referrer_id, referred_id, code, signup_credited_at)
    VALUES (${id}, ${code}, ${auth.userId}, ${code}, NOW())
  `
  const txId = await recordTransaction(tx as unknown as Sql, {
    userId: code, email: null, type: 'referral',
    amountTokens: 3, amountUsdCents: null,
    sourceType: 'referral', sourceId: `signup:${id}`,
    metadata: { referred_id: auth.userId },
  })
  if (!txId) return { error: "duplicate_tx" }  // defensive
  await creditTokens(tx as unknown as Sql, code, 3)
  return { id }
})
```

Endpoint maps errors to HTTP: `referrer_not_active`→409, `already_referred`→409, `duplicate_tx`→409. Note: TASK_TOKEN_AMOUNTS.referral_signup constant (3) SHOULD be used instead of hardcoded `3` — `const SIGNUP_REWARD = TASK_TOKEN_AMOUNTS.referral_signup`.

Similarly W4-04 first-payment trigger MUST use `TASK_TOKEN_AMOUNTS.referral_paid` constant instead of hardcoded `5`.

### ADD-4 — W4-05 revshare loop actually sends emails

**Problem:** Spec comment says "Notification fire-and-forget" but the distribute loop doesn't actually call `sendRevShareEmail`. Dead comment.

**Fix:** Inside the `runQuarterlyRevShare` distribute loop, after `creditTokens` succeeds and before the next iteration:

```ts
// Fire-and-forget notification (outside any future transactional scope;
// intentionally not awaited to keep loop throughput up for 100 supporters)
const emailRows = await sql<{ email: string }[]>`
  SELECT email FROM users WHERE id = ${s.user_id} LIMIT 1
`
const email = emailRows[0]?.email
if (email) {
  sendRevShareEmail(env, email, quarterLabel, shareTokens, poolCents)
    .catch((e) => console.error(JSON.stringify({
      event: "revshare_email_failed",
      user_id: s.user_id,
      error: e instanceof Error ? e.message : String(e),
    })))
}
```

This is best-effort notification; failures logged but distribution continues.

### ADD-5 — Environment propagation hygiene

For W4-02 approve/reject, email lookup queries `users.email` directly inside the HTTP handler AFTER `sql.begin` returns — NOT inside the transaction. Rationale: email is only needed for fire-and-forget notification, not for correctness. Fetch after commit.

For the reject path description concat: use `COALESCE(description, '') || E'\n\nRejected: ' || ${reason}` to avoid NULL propagation on tasks with empty description.

### ADD-6 — SupporterStatus type gap handling

`SupporterStatus` TypeScript type (supporters.ts:23) does NOT include `"quarantined"`, but the DB column accepts it (W2-07). W4 must NOT widen the type (that's W5 deferred bundle). Any W4 code reading status via the typed path will cast to `string`. Use `string` type for status in ADD-1's helper to avoid the type gap bleeding further.

### ADD-7 — Rate limit on task type whitelist

If a malicious user spams invalid `taskType` values, the rate limiter still counts each attempt. That's desired behavior (slow down abusers). Spec is correct as-is. No change.

### ADD-8 — Integration test extension

Test `scripts/test-ctx-12-w4.ts` must add 4 new assertions for the addenda:
- **21**: `requireActiveSupporter` returns `not_found` for user with no supporters row.
- **22**: `requireActiveSupporter` returns `exiting` when status='exiting'.
- **23**: POST /tasks rejected (403) for non-supporter auth user (simulated via direct `submitTask` wrapper + endpoint-layer gate test — OR direct call to `requireActiveSupporter` + assert that submitTask itself doesn't gate, only the route does).
- **24**: Referral signup rolled back cleanly when referrer is inactive (no orphan row).

Total integration assertions: 24 (not 20).

### Wave 4 Done-when (top-level)

All Done-when blocks from primary spec + addenda rules + integration test 24/24 PASS + tsc clean + atomic commits per task.

## End of W4 spec (addenda included)
