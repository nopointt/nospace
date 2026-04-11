---
# ctx-12-w2-spec.md — CTX-12 Wave 2 Master Spec
> Epic: CTX-12 Supporters Backend
> Wave: 2 — Ranking Engine + Public/Private API + Freeze + Quarantine + Spending Cap
> Author: Axis (Orchestrator)
> Mode: Autonomous G3 (Sonnet Player + Sonnet Coach)
> Precedent: Wave 1 (commits 9f29f24..13d6011) deployed to prod 2026-04-11 14:59 UTC
---

## Context (inlined per C7 pre-inline rule)

### Stack reminder
- Hono + Bun + PostgreSQL 16 (prod) / 17 (local `contexter_dev`)
- BullMQ + Redis for queues/crons
- Drizzle migrations in `drizzle-pg/`
- Better-auth + legacy `/api/auth/register` for auth

### Production DB identity (CORRECTED from W1)
- Prod DB: `contexter` (NOT `cx_platform`)
- Prod user: `contexter`
- SSH: `root@46.62.220.214`, container `contexter-postgres-1`
- W1 tables `supporters`, `supporter_transactions`, `supporter_tasks` already live on prod

### Local dev DB (for verify)
- DB: `contexter_dev` (owner cx_user)
- psql: `"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev`
- Has stub `users (id text PK, email text UNIQUE)` + full W1 tables (apply 0015 again if you need a clean slate)

### W1 decisions still locked
- D-AUTO-02: 1 USD = 1 token via `tokensFromCents = Math.floor(cents/100)`, unlimited PWYW, BIGINT tokens
- D-AUTO-03: Tiebreak `(tokens DESC, joined_at ASC)` — earliest contributor wins ties
- D-51: Tier thresholds diamond≤10, gold≤30, silver≤60, bronze≤100
- D-52: **Accelerating earn** — Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x (Pending 1x)
- D-53: Soft demotion — 30-day warning → Bronze → 30 days → exit (implement in W5)
- D-54: Task cap max 50 tokens/month (W4, not here)
- D-55: Rev share activates at $10K/month (W4)
- D-56: No rev share during freeze
- D-57: Tokens = loyalty points, non-transferable
- D-58: Token-paid subs don't generate tokens (already enforced in W1 W1-06 note)

### BullMQ cron pattern (inlined from src/routes/maintenance.ts)
```ts
queue.add(
  "weekly-supporters-ranking",
  {},
  { repeat: { pattern: "0 4 * * 1" }, jobId: "weekly-supporters-ranking-cron" }
)
```
- Idempotent: BullMQ dedupes repeat jobs by jobId
- Pattern: `0 4 * * 1` = Monday 04:00 UTC
- Worker already handles job dispatching by `job.name` — add a new branch

### Hono route pattern (inlined from src/routes/billing.ts)
```ts
import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const supporters = new Hono<AppEnv>()

supporters.get("/me", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)
  // ... use auth.userId
})
```
- Auth: `const auth = await resolveAuth(sql, c.req.raw); if (!auth || !auth.isOwner) return c.json({error:"unauthorized"}, 401)`
- Mount in `src/index.ts` after line 267 (`app.route("/api/webhooks", webhooks)`):
  ```ts
  app.route("/api/supporters", supporters)
  ```
- Import at top of index.ts: `import { supporters } from "./routes/supporters"`

### Existing supporters.ts exports (from W1, DO NOT break these)
- Types: `SupporterTier`, `SupporterStatus`, `TransactionType`, `SourceType`
- `recordTransaction(sql, input): Promise<string | null>` — idempotent, returns tx id or null on duplicate
- `creditTokens(sql, userId, tokens: bigint, joinedAt?: Date): Promise<void>` — ON CONFLICT upsert
- `tokensFromCents(cents: number): bigint`
- `matchEmailToUser(sql, email): Promise<string | null>`
- `reclaimUnmatchedForEmail(sql, userId, email): Promise<bigint>` — returns total tokens reclaimed
- `matchSupporter(sql, {email, customDataUserId}): Promise<{userId: string | null}>`
- `LS_VARIANTS`, `variantToKind`, `TIER_THRESHOLDS`, `rankToTier`, `genId`

---

## Scope

**IN SCOPE for W2 (8 atomic tasks):**
- W2-01: Weekly ranking cron job (BullMQ maintenance queue extension)
- W2-02: Tier auto-assign during ranking (uses rankToTier from W1-03)
- W2-03: Accelerating earn rate — extend `creditTokens` with tier multiplier lookup
- W2-04: `GET /api/supporters` — public leaderboard
- W2-05: `GET /api/supporters/me` — authenticated self status
- W2-06: `POST /api/supporters/freeze` — activate freeze (annual check)
- W2-07: 101st-person quarantine — when rank would exceed 100, store in quarantine with 30-day expiry
- W2-08: Spending cap — max 500 tokens/month from subscription_payment_success

**OUT OF SCOPE (do NOT touch):**
- W3 frontend — do not touch `web/` at all
- W4 task submission, admin review, rev share math
- W5 legal/polish, token expiry, anti-abuse
- Better-auth email/password reclaim hook (still J3 auth-mechanic guard; deferred to W5)
- `cx_platform` DB on local or the foreign project entirely
- `ops/deploy.sh` — Axis handles manual deploy after G3 passes

---

## Hard constraints (same as W1 — standards J3 absolute)

- NO destructive SQL without pg_dump — backup before any ALTER/DELETE
- NO `DROP`, `TRUNCATE`, `DELETE` without WHERE on single row
- NO force push, NO `--no-verify`, NO `git add -A`
- NO secret logging
- NO auth mechanic changes beyond what's declared in this spec
- NO file/node deletion (G1 absolute)
- NO architectural decisions — escalate if the spec is ambiguous
- Immutability (H1), files <800 lines, functions <50 lines, explicit types, error handling, no silent swallow
- Coach 3 iteration max → self-fix → defer

---

## Phase Zero for Wave 2 (J7 MANDATORY)

Before any code, the Player MUST:
1. Read `memory/specs/ctx-12-w2-spec.md` (this file, full)
2. Read `memory/ctx-12-autonomous-report.md` for W1 state
3. Read existing files that will be touched:
   - `src/routes/maintenance.ts` (cron pattern — you'll extend this)
   - `src/services/supporters.ts` (W1 surface)
   - `src/routes/billing.ts` (Hono+auth pattern reference)
   - `src/routes/webhooks.ts` (for W2-08 spending cap hook — extend subscription_payment_success)
   - `src/services/auth.ts` (resolveAuth signature)
   - `src/index.ts` (router mount, worker start)
4. Report understanding checklist before W2-01

Phase Zero findings go into this file under a "Phase Zero report" section the Player appends (the Player writes, not Axis).

---

## Tasks

### W2-01 — Weekly supporters ranking cron

**Action:**

Extend `src/routes/maintenance.ts` to schedule and handle a third repeat job `weekly-supporters-ranking`, cron pattern `0 4 * * 1` (Monday 04:00 UTC, 1h after drift-check Monday 03:00 to avoid overlap).

Add a new function `runSupportersRanking(sql: Sql): Promise<void>` in a new file `src/services/supporters-ranking.ts` (keep ranking logic separate from the HTTP-handler-style supporters.ts).

Algorithm:
```ts
// src/services/supporters-ranking.ts
import type { Sql } from "postgres"
import { rankToTier, type SupporterTier } from "./supporters"

export async function runSupportersRanking(sql: Sql): Promise<void> {
  const started = Date.now()

  // 1. Fetch active supporters ordered by (tokens DESC, joined_at ASC) — uses W1 composite index
  //    Only active, non-quarantined (W2-07 adds quarantined status). W1 status values: 'active','warning','frozen'
  const rows = await sql<{ user_id: string; tokens: string; current_rank: number | null; current_tier: SupporterTier }[]>`
    SELECT user_id, tokens::text, rank AS current_rank, tier AS current_tier
    FROM supporters
    WHERE status IN ('active', 'warning')
    ORDER BY tokens DESC, joined_at ASC
  `

  // 2. Compute new rank (1-based) and new tier via rankToTier
  // 3. Bulk-update only rows where rank or tier changed (skip identical writes)
  let updated = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const newRank = i + 1
    const newTier = rankToTier(newRank)
    if (row.current_rank !== newRank || row.current_tier !== newTier) {
      await sql`
        UPDATE supporters
        SET rank = ${newRank}, tier = ${newTier}, updated_at = NOW()
        WHERE user_id = ${row.user_id}
      `
      updated++
    }
  }

  const duration = Date.now() - started
  console.log(JSON.stringify({
    event: "supporters_ranking_complete",
    total_supporters: rows.length,
    updated,
    duration_ms: duration,
  }))
}
```

Wire it in `src/routes/maintenance.ts`:
- Import: `import { runSupportersRanking } from "../services/supporters-ranking"`
- In `startMaintenanceWorker`, after the drift-check schedule, add:
  ```ts
  queue.add(
    "weekly-supporters-ranking",
    {},
    { repeat: { pattern: "0 4 * * 1" }, jobId: "weekly-supporters-ranking-cron" }
  ).catch((err) =>
    console.error("Failed to schedule weekly-supporters-ranking job:", err instanceof Error ? err.message : String(err))
  )
  ```
- In the worker `async (job: Job)` dispatch, add branch BEFORE the fallback:
  ```ts
  if (job.name === "weekly-supporters-ranking") {
    await runSupportersRanking(sql)
    return
  }
  ```
  (Don't use else-if chain that changes existing behavior — just add a new branch with explicit return.)

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters-ranking.ts src/routes/maintenance.ts 2>&1 | tail -5
# Expected: 0 errors (or only pre-existing warnings unrelated to ranking)
```

And a runtime smoke test (seed 15 supporters, run the function, verify rank/tier assignment):
```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev bun run scripts/test-ctx-12-w2-ranking.ts 2>&1 | tail -10
# (test script built in W2-08 — this verify is enforced at W2-08, not here)
```

For W2-01, the verify is just: tsc clean + manual SQL invocation via bun eval:
```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev bun -e "import postgres from 'postgres'; import {runSupportersRanking} from './src/services/supporters-ranking'; const sql=postgres({host:'localhost',database:'contexter_dev',username:'cx_user',password:''}); await runSupportersRanking(sql); await sql.end();" 2>&1 | tail -5
# Expected: JSON log line with event supporters_ranking_complete
```

**Done when:**
- [ ] `src/services/supporters-ranking.ts` exists with `runSupportersRanking` export
- [ ] `src/routes/maintenance.ts` imports and schedules the new cron + dispatches to the handler
- [ ] tsc clean on both files (or only pre-existing warnings)
- [ ] Manual invocation prints `supporters_ranking_complete` log
- [ ] No other files modified

---

### W2-02 — Tier assignment already handled in W2-01

**Action:** NONE standalone — W2-01's `runSupportersRanking` already calls `rankToTier(newRank)` and writes tier. This task is a VERIFICATION-only task: confirm that after running W2-01 logic against a seeded set, `tier` column matches expected D-51 thresholds.

**Rationale for splitting:** keeps Coach POST-REVIEW explicit about tier correctness; avoids hiding this behind W2-01 commit.

**Verify:**

Create a verify-only script `scripts/verify-ctx-12-w2-02.ts` (small, <50 lines):
```ts
// Seed 15 supporters into contexter_dev with varying tokens
// Run runSupportersRanking(sql)
// Assert: rows 1-10 → diamond, 11-15 → gold
// Cleanup after
```

```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev bun run scripts/verify-ctx-12-w2-02.ts 2>&1 | tail -10
# Expected: "W2-02 tier assignment: PASS"
```

**Done when:**
- [ ] Script exists and outputs PASS
- [ ] Script cleans up its seeded data (DELETE WHERE user_id LIKE 'w202-test-%')

**Commit:** `test(ctx12-w2-02): verify tier assignment after ranking`

---

### W2-03 — Accelerating earn rate

**Action:**

Extend `creditTokens` in `src/services/supporters.ts` to apply tier multiplier — but ONLY when explicitly requested. Existing callers (reclaimUnmatchedForEmail, order_created, subscription_payment_success) must NOT silently change behavior.

Add a new exported function `creditTokensWithMultiplier(sql, userId, baseTokens, opts?)` that:
1. Looks up current `tier` of the user from `supporters` table
2. Multiplies `baseTokens` by the D-52 multiplier:
   - diamond: 2.0 → use integer math: `baseTokens * 2n`
   - gold: `baseTokens * 3n / 2n` (1.5x, truncate)
   - silver: `baseTokens * 5n / 4n` (1.25x, truncate)
   - bronze: `baseTokens * 1n` (1x)
   - pending: `baseTokens * 1n` (1x — first payment creates the supporter)
3. Calls existing `creditTokens` with the multiplied amount
4. Returns `{ baseTokens, multiplier, creditedTokens }`

Add a constant:
```ts
export const TIER_MULTIPLIERS: Record<SupporterTier, { num: bigint; den: bigint }> = {
  diamond: { num: 2n, den: 1n },
  gold:    { num: 3n, den: 2n },
  silver:  { num: 5n, den: 4n },
  bronze:  { num: 1n, den: 1n },
  pending: { num: 1n, den: 1n },
}
```

Wire it into `subscription_payment_success` in `src/routes/webhooks.ts` (replace the current `creditTokens` call for fiat subscription payments):
```ts
// BEFORE (W1 pattern):
await creditTokens(sql, userId, tokensFromCents(subtotalCents))
// AFTER (W2):
await creditTokensWithMultiplier(sql, userId, tokensFromCents(subtotalCents))
```

**Do NOT** apply multiplier to:
- `order_created` one-time Supporter purchase (that's the PWYW — already gets 1:1 value, no tier yet)
- `reclaimUnmatchedForEmail` (historical recovery — apply original rate)

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts src/routes/webhooks.ts 2>&1 | tail -5
# Expected: 0 new errors
```

And in the integration test (extend `scripts/test-ctx-12-w1.ts` or better — create new `scripts/test-ctx-12-w2.ts`):
```ts
// Assert: diamond supporter with $10 sub payment gets 20 tokens credited (10 base × 2.0)
// Assert: silver supporter with $10 payment gets 12 tokens (10 × 1.25 = 12.5, truncate to 12)
// Assert: pending (first-time) gets 10 tokens (no multiplier)
```

**Done when:**
- [ ] `TIER_MULTIPLIERS` constant exported
- [ ] `creditTokensWithMultiplier` function exported, returns {baseTokens, multiplier, creditedTokens}
- [ ] `subscription_payment_success` uses the new function
- [ ] `order_created` and `reclaimUnmatchedForEmail` UNCHANGED
- [ ] tsc clean
- [ ] No other behavior changes

**Commit:** `feat(ctx12-w2-03): tier multiplier for subscription token credit`

---

### W2-04 — GET /api/supporters public leaderboard

**Action:**

Create new file `src/routes/supporters.ts`:

```ts
import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { TIER_THRESHOLDS, type SupporterTier } from "../services/supporters"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }
export const supporters = new Hono<AppEnv>()

// GET /api/supporters — public leaderboard (top 100)
supporters.get("/", async (c) => {
  const sql = c.get("sql")
  const rows = await sql<{
    user_id: string
    tokens: string
    rank: number | null
    tier: SupporterTier
    status: string
    joined_at: Date
    name: string | null
  }[]>`
    SELECT s.user_id, s.tokens::text, s.rank, s.tier, s.status, s.joined_at, u.name
    FROM supporters s
    JOIN users u ON u.id = s.user_id
    WHERE s.status IN ('active', 'warning')
    ORDER BY s.tokens DESC, s.joined_at ASC
    LIMIT 100
  `
  return c.json({
    supporters: rows.map((r, i) => ({
      rank: r.rank ?? i + 1,  // fallback if cron hasn't run yet
      tier: r.tier,
      tokens: Number(r.tokens),  // BigInt → number (safe; max 500M tokens = $500M)
      displayName: r.name ?? "Anonymous Supporter",
      joinedAt: r.joined_at,
      status: r.status,
    })),
    totalCount: rows.length,
    thresholds: TIER_THRESHOLDS,  // so frontend can render tier bands
  })
})
```

Mount in `src/index.ts`:
- Add import near top: `import { supporters as supportersRouter } from "./routes/supporters"`
- After line 267 `app.route("/api/webhooks", webhooks)`, add: `app.route("/api/supporters", supportersRouter)`

**NOTE on naming:** import aliased to `supportersRouter` to avoid clashing with the service module `supporters`.

**Privacy decision (Axis):** Display name = `users.name` if set, else "Anonymous Supporter". Do NOT expose user_id or email publicly. This is D-auto-13 for this wave.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/routes/supporters.ts src/index.ts 2>&1 | tail -5
# Expected: 0 new errors

# Local smoke test after seeding 3 supporters in contexter_dev:
cd C:/Users/noadmin/nospace/development/contexter && bun run src/index.ts &
sleep 2 && curl -s http://localhost:3000/api/supporters | head -c 300 ; kill %1 2>/dev/null
# Expected: JSON with "supporters": [...], "totalCount": 3
```

**Done when:**
- [ ] `src/routes/supporters.ts` exists with public GET
- [ ] Mount in index.ts added
- [ ] Response shape: `{supporters: [{rank,tier,tokens,displayName,joinedAt,status}], totalCount, thresholds}`
- [ ] No user_id or email in response
- [ ] tsc clean

**Commit:** `feat(ctx12-w2-04): public GET /api/supporters leaderboard`

---

### W2-05 — GET /api/supporters/me authenticated self status

**Action:**

Extend `src/routes/supporters.ts` with a `/me` endpoint:

```ts
supporters.get("/me", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const rows = await sql<{
    user_id: string
    tokens: string
    rank: number | null
    tier: SupporterTier
    status: string
    warning_sent_at: Date | null
    freeze_start: Date | null
    freeze_end: Date | null
    joined_at: Date
  }[]>`
    SELECT user_id, tokens::text, rank, tier, status,
           warning_sent_at, freeze_start, freeze_end, joined_at
    FROM supporters
    WHERE user_id = ${auth.userId}
    LIMIT 1
  `
  if (rows.length === 0) {
    return c.json({ isSupporter: false })
  }
  const r = rows[0]
  return c.json({
    isSupporter: true,
    rank: r.rank,
    tier: r.tier,
    tokens: Number(r.tokens),
    status: r.status,
    warningSentAt: r.warning_sent_at,
    freezeStart: r.freeze_start,
    freezeEnd: r.freeze_end,
    joinedAt: r.joined_at,
  })
})
```

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/routes/supporters.ts 2>&1 | tail -5
# Expected: 0 new errors

# Unauth should 401
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/supporters/me
# Expected: 401
```

**Done when:**
- [ ] `/me` endpoint exists
- [ ] 401 when unauth
- [ ] Returns `{isSupporter: false}` if not a supporter
- [ ] Returns full supporter row if supporter
- [ ] tsc clean

**Commit:** `feat(ctx12-w2-05): GET /api/supporters/me authed status`

---

### W2-06 — POST /api/supporters/freeze (annual freeze)

**Action:**

Extend `src/routes/supporters.ts` with a freeze endpoint. Freeze rules per D-53/D-56:
- User can activate freeze 1x per calendar year
- Freeze duration: 30 days (hard-coded for W2; D-53 may evolve in W5)
- During freeze: rank preserved (runSupportersRanking already skips rows WHERE status='frozen')
- Existing supporters only (no new signup via freeze)
- Cannot freeze while already frozen

Action check: SELECT current status + freeze_start. If freeze_start in current calendar year → 409. Else UPDATE status='frozen', freeze_start=NOW(), freeze_end=NOW()+30d.

```ts
supporters.post("/freeze", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const rows = await sql<{
    status: string
    freeze_start: Date | null
  }[]>`
    SELECT status, freeze_start
    FROM supporters
    WHERE user_id = ${auth.userId}
    LIMIT 1
  `
  if (rows.length === 0) return c.json({ error: "not_a_supporter" }, 403)
  const row = rows[0]
  if (row.status === 'frozen') return c.json({ error: "already_frozen" }, 409)

  // Annual check — one freeze per calendar year
  if (row.freeze_start) {
    const thisYear = new Date().getUTCFullYear()
    const freezeYear = new Date(row.freeze_start).getUTCFullYear()
    if (freezeYear === thisYear) {
      return c.json({ error: "freeze_already_used_this_year" }, 409)
    }
  }

  const result = await sql<{ freeze_start: Date; freeze_end: Date }[]>`
    UPDATE supporters
    SET status = 'frozen',
        freeze_start = NOW(),
        freeze_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE user_id = ${auth.userId}
      AND status != 'frozen'
    RETURNING freeze_start, freeze_end
  `
  if (result.length === 0) {
    return c.json({ error: "freeze_failed" }, 500)
  }
  console.log(JSON.stringify({ event: "supporter_freeze_activated", user_id: auth.userId }))
  return c.json({
    ok: true,
    freezeStart: result[0].freeze_start,
    freezeEnd: result[0].freeze_end,
  })
})
```

Also update `runSupportersRanking` in `src/services/supporters-ranking.ts` — the SELECT filters `WHERE status IN ('active', 'warning')` which ALREADY excludes frozen. Good. But add a comment explaining why frozen rows are skipped (their rank stays fixed at the value it had when they froze).

**Verify:**
```bash
# tsc
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/routes/supporters.ts 2>&1 | tail -5
```

Manual SQL test:
```bash
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U cx_user -d contexter_dev <<'SQL'
-- Seed a supporter
INSERT INTO users (id, email, name) VALUES ('w206-test', 'w206@test.com', 'Test') ON CONFLICT DO NOTHING;
INSERT INTO supporters (user_id, tokens, status) VALUES ('w206-test', 100, 'active') ON CONFLICT DO NOTHING;
-- Simulate freeze via direct UPDATE (route requires auth, can't curl-test it here)
UPDATE supporters SET status='frozen', freeze_start=NOW(), freeze_end=NOW()+INTERVAL '30 days' WHERE user_id='w206-test';
SELECT status, freeze_start IS NOT NULL AS has_start, freeze_end IS NOT NULL AS has_end FROM supporters WHERE user_id='w206-test';
-- Cleanup
DELETE FROM supporters WHERE user_id='w206-test';
DELETE FROM users WHERE id='w206-test';
SQL
```

**Done when:**
- [ ] Route POST /freeze exists
- [ ] Annual check logic correct (calendar-year, not rolling)
- [ ] 401/403/409/500 error codes correct
- [ ] Runtime returns {ok, freezeStart, freezeEnd}
- [ ] tsc clean

**Commit:** `feat(ctx12-w2-06): POST /api/supporters/freeze annual freeze`

---

### W2-07 — 101st person quarantine

**Action:**

When a new payment creates a supporter and there are already 100 active supporters, the new entry goes into `status='quarantined'` for 30 days. During quarantine:
- They appear in leaderboard with status='quarantined' (frontend can show badge)
- They are NOT counted in ranking (`runSupportersRanking` filters `status IN ('active','warning')`, already excludes quarantined)
- After 30 days, if their tokens > tokens of current rank #100 → promote to active (displace #100 into quarantine)
- If after 30 days still not enough → demote to 'exited' and refund eligibility flag (W5 handles refund path)

For W2, implement ONLY the intake and the auto-promotion check inside `runSupportersRanking`. Exited/refund = W5.

**Add to `src/services/supporters.ts`** — new function `matchOrQuarantine(sql, userId)`:

Actually: the quarantine check happens at `order_created` time (when credit is about to happen) — modify `creditTokens` or add a wrapper.

Simpler approach: Add a function `creditTokensWithQuarantineCheck(sql, userId, tokens, joinedAt?)` in supporters.ts:
1. Count active+warning supporters: `SELECT COUNT(*) FROM supporters WHERE status IN ('active','warning')`
2. If count ≥ 100 AND userId is NOT already in supporters (new entry) → INSERT with `status='quarantined'`, still credit tokens
3. Else → delegate to existing `creditTokens`

And inside `runSupportersRanking` (from W2-01), AFTER the main rank loop, add a "quarantine promotion sweep":
```ts
// Promote quarantined supporters whose tokens exceed current #100
const q = await sql<{ user_id: string; tokens: string }[]>`
  SELECT user_id, tokens::text FROM supporters WHERE status = 'quarantined'
`
if (q.length > 0) {
  // Find current #100 tokens threshold
  const hundredth = await sql<{ tokens: string }[]>`
    SELECT tokens::text FROM supporters
    WHERE status IN ('active','warning')
    ORDER BY tokens DESC, joined_at ASC
    OFFSET 99 LIMIT 1
  `
  const threshold = hundredth.length > 0 ? BigInt(hundredth[0].tokens) : 0n
  for (const row of q) {
    const qTokens = BigInt(row.tokens)
    if (qTokens > threshold) {
      // Transaction: demote #100 to quarantined, promote this row to active
      await sql.begin(async (tx) => {
        await tx`
          UPDATE supporters
          SET status = 'quarantined', updated_at = NOW()
          WHERE user_id = (
            SELECT user_id FROM supporters
            WHERE status IN ('active','warning')
            ORDER BY tokens DESC, joined_at ASC
            OFFSET 99 LIMIT 1
          )
        `
        await tx`
          UPDATE supporters
          SET status = 'active', updated_at = NOW()
          WHERE user_id = ${row.user_id}
        `
      })
      console.log(JSON.stringify({ event: "supporter_quarantine_promoted", user_id: row.user_id }))
      // Re-run main rank loop to reflect the swap? Simplification: NO — next weekly run will catch it.
    }
  }
}
```

Also: supporter status enum expansion — W1 migration allows any text in `status`. No DDL change needed. Good.

**Verify:**
```bash
# tsc
cd C:/Users/noadmin/nospace/development/contexter && bunx tsc --noEmit src/services/supporters.ts src/services/supporters-ranking.ts 2>&1 | tail -5
```

Runtime test in `scripts/test-ctx-12-w2.ts`:
```ts
// Seed 100 active supporters with tokens = 100..199 (100 at rank 100, 199 at rank 1)
// Call creditTokensWithQuarantineCheck for a new user with 50 tokens → should insert with status='quarantined'
// Assert SELECT status FROM supporters WHERE user_id=... returns 'quarantined'
// Seed a quarantined supporter with 250 tokens (> #100 threshold 100) and run runSupportersRanking
// Assert the 101st is now active, former #100 is now quarantined
```

**Done when:**
- [ ] `creditTokensWithQuarantineCheck` function exported
- [ ] Quarantine intake works (count check → insert with status='quarantined')
- [ ] Promotion sweep in ranking function swaps 101st with #100 when tokens exceed
- [ ] Atomic transaction for swap
- [ ] tsc clean

**Commit:** `feat(ctx12-w2-07): 101st supporter quarantine intake and promotion`

---

### W2-08 — Spending cap + integration test

**Action (part 1: spending cap):**

Modify `subscription_payment_success` in `src/routes/webhooks.ts` to enforce the D-54-style spending cap of **500 tokens/month from subscription payments**.

Before calling `creditTokensWithMultiplier`, count tokens already credited this calendar month from source_type='ls_subscription_payment' for this user:
```ts
const alreadyCredited = await sql<{ sum: string | null }[]>`
  SELECT COALESCE(SUM(amount_tokens), 0)::text AS sum
  FROM supporter_transactions
  WHERE user_id = ${userId}
    AND source_type = 'ls_subscription_payment'
    AND created_at >= date_trunc('month', NOW())
`
const alreadyBigInt = BigInt(alreadyCredited[0].sum ?? '0')
const CAP = 500n
const remaining = CAP > alreadyBigInt ? CAP - alreadyBigInt : 0n
const requested = tokensFromCents(subtotalCents)
const toCredit = remaining < requested ? remaining : requested
if (toCredit === 0n) {
  console.log(JSON.stringify({ event: "ls_subscription_payment_capped", user_id: userId, requested: requested.toString(), already: alreadyBigInt.toString() }))
} else {
  await creditTokensWithMultiplier(sql, userId, toCredit)
}
```

Note: the `toCredit` passed to multiplier is the BASE, multiplier still applies on top. This keeps spending cap on raw subscription spend, not effective tokens after tier bonus.

**Action (part 2: integration test):**

Create `scripts/test-ctx-12-w2.ts` — standalone bun script against contexter_dev with ~15 assertions:
1. TIER_MULTIPLIERS constant correct shape
2. creditTokensWithMultiplier for diamond gives 2x
3. creditTokensWithMultiplier for silver gives 5/4 truncated
4. creditTokensWithMultiplier for pending gives 1x
5. creditTokensWithQuarantineCheck with <100 supporters → inserts active
6. creditTokensWithQuarantineCheck with 100 supporters → inserts quarantined
7. runSupportersRanking on 15 seeded → rank 1-10 = diamond, 11-15 = gold
8. runSupportersRanking skips frozen rows
9. runSupportersRanking promotion sweep — quarantined with higher tokens displaces #100
10. Spending cap: single 300-token sub payment for month → credit 300
11. Spending cap: second 300-token sub payment same month → credit 200 (cap 500 - 300 already)
12. Spending cap: third payment same month → credit 0, logged as capped
13. Order_created path unchanged (no multiplier, no cap)
14. Public leaderboard query shape (run the raw SQL; don't need HTTP)
15. /me query shape (raw SQL)

Use `w2test_` prefix for all seeded data. Cleanup at end.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter && PG_DATABASE=contexter_dev bun run scripts/test-ctx-12-w2.ts 2>&1 | tail -30
# Expected: all 15 PASS, exit 0
```

**Done when:**
- [ ] Spending cap code in webhooks.ts `subscription_payment_success`
- [ ] All 15 assertions in test-ctx-12-w2.ts PASS
- [ ] Script cleans up its seed data
- [ ] tsc clean

**Commit:** `test(ctx12-w2-08): spending cap + W2 integration test`

---

## Post-W2 Deploy Plan (Axis, manual per D-AUTO-08)

Reused W1 deploy learnings:
- Prod DB: `contexter` / user `contexter` (NOT `cx_platform`)
- pg_dump before any DDL (none in W2 — pure code + cron, but dump anyway as safety)
- Files to SCP:
  - `src/services/supporters.ts` (modified)
  - `src/services/supporters-ranking.ts` (new)
  - `src/routes/maintenance.ts` (modified — new cron)
  - `src/routes/supporters.ts` (new)
  - `src/routes/webhooks.ts` (modified — spending cap + multiplier)
  - `src/index.ts` (modified — router mount)
  - `scripts/test-ctx-12-w2.ts` (new)
  - `scripts/verify-ctx-12-w2-02.ts` (new)
- Place into /opt/contexter/app/ paths
- `docker compose build --no-cache app`
- `docker compose up -d app`
- `curl https://api.contexter.cc/health` → 200
- `curl https://api.contexter.cc/api/supporters` → 200 with empty supporters array
- Verify ranking cron scheduled: `ssh root@46.62.220.214 "docker exec contexter-app-1 sh -c 'grep -q weekly-supporters /proc/1/cmdline; echo ok' "` or check app logs for `maintenance_job_completed`
- Check disk after build (< 80% target): `df -h /`

If `df -h /` shows >80% → prune build cache (W1 inherited learning).

---

## Coach 8-Dimension POST-REVIEW

Same 8 dims as W1 spec (Coverage, Decision fidelity, Verification, Scope, Code quality, Idempotency, Security, Atomic commits).

Extra W2-specific checks:
- **Cron idempotency**: `jobId: "weekly-supporters-ranking-cron"` must be set so BullMQ deduplicates on every startup
- **Quarantine atomicity**: swap operation must be transactional
- **Spending cap not double-spent**: cap check must use SELECT+INSERT inside same transaction OR use idempotent recordTransaction gate
- **No privacy leak in public endpoint**: /api/supporters must NOT return user_id or email
- **Auth enforced on /me and /freeze**: test 401 explicitly

## Out of scope repeat (DO NOT let scope creep)

- NO frontend changes in `web/`
- NO new migrations (DB schema already supports status='frozen', 'quarantined' via text column)
- NO better-auth hook
- NO W4 task submission, task review queue
- NO W5 soft demotion timers, token expiry, anti-abuse
- NO ops/deploy.sh edits
- NO changes to HMAC verification in webhooks
- NO rename of W1 types, exports, functions

## End of W2 spec
