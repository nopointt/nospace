/**
 * CTX-12 Supporters public/private API (W2-04..W2-06).
 *
 *  GET  /api/supporters        — public top-100 leaderboard, no PII
 *  GET  /api/supporters/me     — authenticated self status
 *  POST /api/supporters/freeze — activate 30-day freeze (1x per calendar year)
 *
 * Privacy decision (Axis, this wave): public endpoint NEVER exposes
 * user_id or email. displayName = users.name if set, else
 * "Anonymous Supporter".
 *
 * Freeze rules (D-53/D-56):
 *  - 1 freeze per UTC calendar year
 *  - 30-day duration (W5 may evolve this)
 *  - status='frozen' causes runSupportersRanking to skip the row, so
 *    the rank at freeze time is preserved
 *  - existing supporters only (no new signups via freeze)
 */

import { Hono } from "hono"
import type { Context } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { checkRateLimit, getClientIp } from "../services/rate-limit"
import {
  TIER_THRESHOLDS,
  TASK_TOKEN_AMOUNTS,
  requireActiveSupporter,
  submitTask,
  isAdmin,
  checkTaskCapForUser,
  recordTransaction,
  creditTokens,
  genId,
  type SupporterTier,
} from "../services/supporters"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const supporters = new Hono<AppEnv>()

// --- Public leaderboard (W2-04) ----------------------------------------

supporters.get("/", async (c) => {
  const sql = c.get("sql")
  const rows = await sql<{
    tokens: string
    rank: number | null
    tier: SupporterTier
    status: string
    joined_at: Date
    name: string | null
  }[]>`
    SELECT s.tokens::text, s.rank, s.tier, s.status, s.joined_at, u.name
    FROM supporters s
    JOIN users u ON u.id = s.user_id
    WHERE s.status IN ('active', 'warning')
    ORDER BY s.tokens DESC, s.joined_at ASC
    LIMIT 100
  `
  return c.json({
    supporters: rows.map((r, i) => ({
      rank: r.rank ?? i + 1,
      tier: r.tier,
      tokens: Number(r.tokens),
      displayName: r.name ?? "Anonymous Supporter",
      joinedAt: r.joined_at,
      status: r.status,
    })),
    totalCount: rows.length,
    thresholds: TIER_THRESHOLDS,
  })
})

// --- Authenticated self status (W2-05) ---------------------------------

supporters.get("/me", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const rows = await sql<{
    tokens: string
    rank: number | null
    tier: SupporterTier
    status: string
    warning_sent_at: Date | null
    freeze_start: Date | null
    freeze_end: Date | null
    joined_at: Date
  }[]>`
    SELECT tokens::text, rank, tier, status,
           warning_sent_at, freeze_start, freeze_end, joined_at
    FROM supporters
    WHERE user_id = ${auth.userId}
    LIMIT 1
  `
  const first = rows[0]
  if (!first) {
    return c.json({ isSupporter: false })
  }
  return c.json({
    isSupporter: true,
    rank: first.rank,
    tier: first.tier,
    tokens: Number(first.tokens),
    status: first.status,
    warningSentAt: first.warning_sent_at,
    freezeStart: first.freeze_start,
    freezeEnd: first.freeze_end,
    joinedAt: first.joined_at,
  })
})

// --- Annual freeze (W2-06) ---------------------------------------------

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
  const row = rows[0]
  if (!row) return c.json({ error: "not_a_supporter" }, 403)
  if (row.status === "frozen") return c.json({ error: "already_frozen" }, 409)

  // Annual check — one freeze per UTC calendar year (not rolling 365d)
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
  const updated = result[0]
  if (!updated) {
    return c.json({ error: "freeze_failed" }, 500)
  }
  console.log(JSON.stringify({ event: "supporter_freeze_activated", user_id: auth.userId }))
  return c.json({
    ok: true,
    freezeStart: updated.freeze_start,
    freezeEnd: updated.freeze_end,
  })
})

// --- W4-01: Submit a task for review ----------------------------------
//
// POST /api/supporters/tasks
// Body: { taskType: TaskType, description?: string }
//
// Flow: auth (401) → supporter gate ADD-1 (403) → rate limit 10/hour (429)
//     → JSON parse (400) → validate taskType (400) → submitTask (400/500)
//     → 201 with pending task row.
//
// PII safety: logs carry user_id + task_type + task_id ONLY. No description,
// no email. No token amounts are credited here — approval is W4-02.

supporters.post("/tasks", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")

  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) {
    return c.json({ error: "unauthorized" }, 401)
  }

  // ADD-1: supporter-only gate — prevents phantom supporters row via creditTokens.
  const gate = await requireActiveSupporter(sql, auth.userId)
  if (!gate.ok) {
    return c.json({ error: "not_a_supporter", reason: gate.reason }, 403)
  }

  // Rate limit: 10 submissions per hour per user.
  const ip = getClientIp(c)
  const rl = await checkRateLimit(
    redis,
    `task_submit:${auth.userId}`,
    10,
    3600,
    ip,
    env.RATE_LIMIT_WHITELIST_IPS,
  )
  if (!rl.allowed) {
    return c.json({ error: "rate_limited", retryAfter: 3600 }, 429)
  }

  // Parse + validate body.
  let body: { taskType?: unknown; description?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid_json" }, 400)
  }
  if (typeof body.taskType !== "string") {
    return c.json({ error: "missing_task_type" }, 400)
  }
  if (!(body.taskType in TASK_TOKEN_AMOUNTS)) {
    return c.json({ error: "invalid_task_type" }, 400)
  }
  const description = typeof body.description === "string" ? body.description : undefined

  try {
    const result = await submitTask(sql, auth.userId, body.taskType, description)
    console.log(JSON.stringify({
      event: "task_submitted",
      user_id: auth.userId,
      task_type: result.taskType,
      task_id: result.id,
    }))
    return c.json({
      taskId: result.id,
      taskType: result.taskType,
      amountTokens: result.amountTokens,
      status: "pending",
      message: "Task submitted for review",
    }, 201)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === "description_too_long") {
      return c.json({ error: "description_too_long", max: 1000 }, 400)
    }
    if (msg === "invalid_task_type") {
      return c.json({ error: "invalid_task_type" }, 400)
    }
    console.error(JSON.stringify({
      event: "task_submit_error",
      user_id: auth.userId,
      error: msg,
    }))
    return c.json({ error: "internal_error" }, 500)
  }
})

// --- W4-04: Submit a referral code ------------------------------------
//
// POST /api/supporters/referral
// Body: { code: string }  // referrer's userId (D-AUTO-W4-07)
//
// Flow: auth (401) → double-gated rate limit user+IP (429) → JSON parse (400)
//     → validate code shape (400) → self-loop guard (400) → referrer exists
//     check (404) → tx { ADD-1 referrer gate → duplicate referred check →
//     INSERT referral row → recordTransaction → creditTokens } → 201.
//
// Per ADD-3: INSERT + recordTransaction + creditTokens are wrapped in
// a single transaction so a failure in any step rolls back the row and
// avoids the orphan-with-UNIQUE-blocked-retry race.
//
// PII safety: logs carry referrer_user_id + referred_user_id + referral_id
// + token amount only.

supporters.post("/referral", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")

  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  // Double-gated rate limit: per-user AND per-IP. Prevents both single-user
  // hammering and IP-level enumeration of valid referrer ids.
  const ip = getClientIp(c)
  const userRl = await checkRateLimit(
    redis,
    `referral_submit:${auth.userId}`,
    5,
    3600,
    ip,
    env.RATE_LIMIT_WHITELIST_IPS,
  )
  if (!userRl.allowed) return c.json({ error: "rate_limited" }, 429)
  const ipRl = await checkRateLimit(
    redis,
    `referral_submit_ip:${ip}`,
    20,
    3600,
    ip,
    env.RATE_LIMIT_WHITELIST_IPS,
  )
  if (!ipRl.allowed) return c.json({ error: "rate_limited" }, 429)

  let body: { code?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid_json" }, 400)
  }
  if (typeof body.code !== "string" || body.code.length === 0 || body.code.length > 128) {
    return c.json({ error: "invalid_code" }, 400)
  }
  const code = body.code
  if (code === auth.userId) return c.json({ error: "cannot_refer_self" }, 400)

  // Verify referrer exists as a user BEFORE entering tx (avoids wasted lock).
  const userRows = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE id = ${code} LIMIT 1
  `
  if (userRows.length === 0) return c.json({ error: "invalid_code" }, 404)

  type ReferralResult =
    | { ok: true; referralId: string; signupReward: number }
    | { ok: false; code: 404 | 409; err: string }

  const SIGNUP_REWARD = TASK_TOKEN_AMOUNTS.referral_signup

  const result: ReferralResult = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    // ADD-1: referrer must be an active supporter (else creditTokens would
    // create a phantom supporters row, bypassing the 100-spot cap).
    const gate = await requireActiveSupporter(tx, code)
    if (!gate.ok) {
      return { ok: false, code: 409, err: "referrer_not_active" } as ReferralResult
    }

    // Duplicate-referral check (UNIQUE on referred_id enforces this anyway,
    // but the explicit check returns a clean 409 instead of a DB error).
    const dup = await tx`
      SELECT 1 FROM supporter_referrals WHERE referred_id = ${auth.userId} LIMIT 1
    `
    if (dup.length > 0) {
      return { ok: false, code: 409, err: "already_referred" } as ReferralResult
    }

    const refId = genId()
    await tx`
      INSERT INTO supporter_referrals (id, referrer_id, referred_id, code, signup_credited_at)
      VALUES (${refId}, ${code}, ${auth.userId}, ${code}, NOW())
    `

    const txId = await recordTransaction(tx, {
      userId: code,
      email: null,
      type: "referral",
      amountTokens: SIGNUP_REWARD,
      amountUsdCents: null,
      sourceType: "referral",
      sourceId: `signup:${refId}`,
      metadata: { referred_id: auth.userId },
    })
    if (!txId) {
      return { ok: false, code: 409, err: "duplicate_tx" } as ReferralResult
    }

    await creditTokens(tx, code, SIGNUP_REWARD)

    return { ok: true, referralId: refId, signupReward: SIGNUP_REWARD } as ReferralResult
  }) as unknown as ReferralResult

  if (!result.ok) return c.json({ error: result.err }, result.code)

  console.log(JSON.stringify({
    event: "referral_signup_credited",
    referrer_user_id: code,
    referred_user_id: auth.userId,
    referral_id: result.referralId,
    tokens: result.signupReward,
  }))

  return c.json({
    ok: true,
    referralId: result.referralId,
    signupReward: result.signupReward,
  }, 201)
})

// --- W4-02: Admin task review endpoints --------------------------------
//
// GET  /api/supporters/admin/tasks          — list tasks by status
// POST /api/supporters/admin/tasks/:id/approve
// POST /api/supporters/admin/tasks/:id/reject
//
// Access gate: authenticated owner + userId on ADMIN_USER_IDS allowlist.
// Approve path runs inside sql.begin with ADD-2 ordering:
//   advisory lock → FOR UPDATE re-fetch → supporter gate → cap check →
//   status update → recordTransaction → creditTokens.
// Email notifications are deferred to W4-06 (TODO comments only).

type AdminGate =
  | { ok: true; auth: { userId: string; isOwner: boolean } }
  | { ok: false; code: 401 | 403; err: "unauthorized" | "not_admin" }

async function requireAdmin(
  c: Context<AppEnv>,
  sql: Sql,
  env: Env,
): Promise<AdminGate> {
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return { ok: false, code: 401, err: "unauthorized" }
  if (!isAdmin(auth.userId, env)) return { ok: false, code: 403, err: "not_admin" }
  return { ok: true, auth: { userId: auth.userId, isOwner: auth.isOwner } }
}

// GET /admin/tasks?status=pending|approved|rejected&limit=50
supporters.get("/admin/tasks", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const gate = await requireAdmin(c, sql, env)
  if (!gate.ok) return c.json({ error: gate.err }, gate.code)

  const status = c.req.query("status") ?? "pending"
  const validStatuses = new Set(["pending", "approved", "rejected"])
  if (!validStatuses.has(status)) {
    return c.json({ error: "invalid_status" }, 400)
  }
  const limitRaw = parseInt(c.req.query("limit") ?? "50", 10)
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 200)

  const rows = await sql<Array<{
    id: string
    user_id: string
    task_type: string
    amount_tokens: string | number
    status: string
    description: string | null
    reviewer_id: string | null
    reviewed_at: Date | null
    created_at: Date
    user_name: string | null
  }>>`
    SELECT t.id, t.user_id, t.task_type, t.amount_tokens, t.status,
           t.description, t.reviewer_id, t.reviewed_at, t.created_at,
           u.name AS user_name
    FROM supporter_tasks t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = ${status}
    ORDER BY t.created_at ASC
    LIMIT ${limit}
  `

  console.log(JSON.stringify({
    event: "admin_tasks_list",
    admin_user_id: gate.auth.userId,
    status,
    count: rows.length,
  }))

  return c.json({
    tasks: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      taskType: r.task_type,
      amountTokens: Number(r.amount_tokens),
      status: r.status,
      description: r.description,
      reviewerId: r.reviewer_id,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
    })),
    count: rows.length,
  })
})

// POST /admin/tasks/:id/approve
supporters.post("/admin/tasks/:id/approve", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const gate = await requireAdmin(c, sql, env)
  if (!gate.ok) return c.json({ error: gate.err }, gate.code)

  const taskId = c.req.param("id")
  if (!taskId) return c.json({ error: "missing_task_id" }, 400)

  type ApproveResult =
    | { ok: true; taskId: string; userId: string; creditedTokens: number; taskType: string }
    | { ok: false; code: 404 | 409; err: string; already?: number; remaining?: number; cap?: number }

  const result: ApproveResult = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    // 1) Quick fetch of user_id to know the advisory-lock key.
    //    This read is intentionally outside the FOR UPDATE so we can take
    //    the lock first (ADD-2) without holding a row lock during the wait.
    const fetchRows = await tx<Array<{ user_id: string }>>`
      SELECT user_id FROM supporter_tasks WHERE id = ${taskId} LIMIT 1
    `
    if (fetchRows.length === 0) {
      return { ok: false, code: 404, err: "task_not_found" } as ApproveResult
    }
    const userIdForLock = fetchRows[0]!.user_id

    // 2) Advisory lock — FIRST real-work statement per ADD-2. Serializes
    //    concurrent approves for the same user so the cap check is safe.
    //    Released automatically on commit/rollback.
    await tx`SELECT pg_advisory_xact_lock(hashtext(${`task_cap:${userIdForLock}`}))`

    // 3) Re-fetch task row FOR UPDATE — row may have changed while waiting.
    const taskRows = await tx<Array<{
      id: string
      user_id: string
      task_type: string
      amount_tokens: string | number
      status: string
    }>>`
      SELECT id, user_id, task_type, amount_tokens, status
      FROM supporter_tasks WHERE id = ${taskId} FOR UPDATE
    `
    if (taskRows.length === 0) {
      return { ok: false, code: 404, err: "task_not_found" } as ApproveResult
    }
    const task = taskRows[0]!
    if (task.status !== "pending") {
      return { ok: false, code: 409, err: "not_pending" } as ApproveResult
    }

    // 4) Supporter gate (ADD-1) — re-check at approval time; user status
    //    may have changed between submit and approve.
    const supGate = await requireActiveSupporter(tx, task.user_id)
    if (!supGate.ok) {
      return { ok: false, code: 409, err: "not_a_supporter" } as ApproveResult
    }

    // 5) Task cap (W4-03), serialized by the advisory lock above.
    const amountTokens = Number(task.amount_tokens)
    const cap = await checkTaskCapForUser(tx, task.user_id, amountTokens)
    if (!cap.allowed) {
      return {
        ok: false,
        code: 409,
        err: "monthly_cap_exceeded",
        already: cap.already,
        remaining: cap.remaining,
        cap: cap.cap,
      } as ApproveResult
    }

    // 6) UPDATE status.
    await tx`
      UPDATE supporter_tasks
      SET status = 'approved',
          reviewer_id = ${gate.auth.userId},
          reviewed_at = NOW()
      WHERE id = ${taskId}
    `

    // 7) Record transaction (idempotent via source_id = task.id).
    await recordTransaction(tx, {
      userId: task.user_id,
      email: null,
      type: "task",
      amountTokens,
      amountUsdCents: null,
      sourceType: "task",
      sourceId: task.id,
      metadata: { task_type: task.task_type },
    })

    // 8) Credit tokens — creates supporter row on first credit (the ADD-1
    //    gate above guarantees the row already exists for approved tasks).
    await creditTokens(tx, task.user_id, amountTokens)

    return {
      ok: true,
      taskId: task.id,
      userId: task.user_id,
      creditedTokens: amountTokens,
      taskType: task.task_type,
    } as ApproveResult
  })

  if (!result.ok) {
    const body: Record<string, unknown> = { error: result.err }
    if (result.err === "monthly_cap_exceeded") {
      body.already = result.already
      body.remaining = result.remaining
      body.cap = result.cap
    }
    return c.json(body, result.code)
  }

  // TODO W4-06: email lookup (outside tx per ADD-5) + fire-and-forget
  //   sendTaskApprovedEmail(env, email, result.taskType, result.creditedTokens)
  //   wrapped in try/catch that swallows. Deferred until notifications
  //   module lands in W4-06.

  console.log(JSON.stringify({
    event: "task_approved",
    admin_user_id: gate.auth.userId,
    task_id: result.taskId,
    user_id: result.userId,
    credited_tokens: result.creditedTokens,
  }))

  return c.json({
    ok: true,
    taskId: result.taskId,
    creditedTokens: result.creditedTokens,
  })
})

// POST /admin/tasks/:id/reject
supporters.post("/admin/tasks/:id/reject", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const gate = await requireAdmin(c, sql, env)
  if (!gate.ok) return c.json({ error: gate.err }, gate.code)

  const taskId = c.req.param("id")
  if (!taskId) return c.json({ error: "missing_task_id" }, 400)

  let body: { reason?: unknown }
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : ""
  const reason = reasonRaw.slice(0, 500)

  type RejectResult =
    | { ok: true; taskId: string }
    | { ok: false; code: 404 | 409; err: string }

  const result: RejectResult = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    const taskRows = await tx<Array<{
      id: string
      status: string
      description: string | null
    }>>`
      SELECT id, status, description FROM supporter_tasks
      WHERE id = ${taskId} FOR UPDATE
    `
    if (taskRows.length === 0) {
      return { ok: false, code: 404, err: "task_not_found" } as RejectResult
    }
    const task = taskRows[0]!
    if (task.status !== "pending") {
      return { ok: false, code: 409, err: "not_pending" } as RejectResult
    }

    // ADD-5: NULL-safe description concat to avoid NULL propagation on
    // tasks submitted without a description.
    await tx`
      UPDATE supporter_tasks
      SET status = 'rejected',
          reviewer_id = ${gate.auth.userId},
          reviewed_at = NOW(),
          description = COALESCE(description, '') || E'\n\nRejected: ' || ${reason}
      WHERE id = ${taskId}
    `

    return { ok: true, taskId } as RejectResult
  })

  if (!result.ok) return c.json({ error: result.err }, result.code)

  // TODO W4-06: email lookup (outside tx per ADD-5) + fire-and-forget
  //   sendTaskRejectedEmail(env, email, taskType, reason)
  //   wrapped in try/catch that swallows. Deferred until notifications
  //   module lands in W4-06.

  console.log(JSON.stringify({
    event: "task_rejected",
    admin_user_id: gate.auth.userId,
    task_id: result.taskId,
    reason_len: reason.length,
  }))

  return c.json({ ok: true, taskId: result.taskId })
})
