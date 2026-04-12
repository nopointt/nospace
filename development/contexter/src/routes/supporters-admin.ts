/**
 * CTX-12 Supporters admin routes (extracted from supporters.ts — F-02).
 *
 *  GET  /admin/tasks                — list tasks by status
 *  POST /admin/tasks/:id/approve    — approve + credit tokens
 *  POST /admin/tasks/:id/reject     — reject with reason
 */

import { Hono } from "hono"
import type { Context } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import {
  TASK_TOKEN_AMOUNTS,
  requireActiveSupporter,
  isAdmin,
  checkTaskCapForUser,
  recordTransaction,
  creditTokens,
} from "../services/supporters"
import {
  sendTaskApprovedEmail,
  sendTaskRejectedEmail,
} from "../services/notifications"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

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

export const supportersAdmin = new Hono<AppEnv>()

// GET /admin/tasks?status=pending|approved|rejected&limit=50
supportersAdmin.get("/tasks", async (c) => {
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
supportersAdmin.post("/tasks/:id/approve", async (c) => {
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

    const fetchRows = await tx<Array<{ user_id: string }>>`
      SELECT user_id FROM supporter_tasks WHERE id = ${taskId} LIMIT 1
    `
    if (fetchRows.length === 0) {
      return { ok: false, code: 404, err: "task_not_found" } as ApproveResult
    }
    const userIdForLock = fetchRows[0]!.user_id

    await tx`SELECT pg_advisory_xact_lock(hashtext(${`task_cap:${userIdForLock}`}))`

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

    const supGate = await requireActiveSupporter(tx, task.user_id)
    if (!supGate.ok) {
      return { ok: false, code: 409, err: "not_a_supporter" } as ApproveResult
    }

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

    await tx`
      UPDATE supporter_tasks
      SET status = 'approved',
          reviewer_id = ${gate.auth.userId},
          reviewed_at = NOW()
      WHERE id = ${taskId}
    `

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

  try {
    const emailRows = await sql<{ email: string | null }[]>`
      SELECT email FROM users WHERE id = ${result.userId} LIMIT 1
    `
    const email = emailRows[0]?.email ?? null
    if (email) {
      sendTaskApprovedEmail(env, email, result.taskType, result.creditedTokens)
        .catch((e) => console.error(JSON.stringify({
          event: "task_approve_email_error",
          task_id: result.taskId,
          error: e instanceof Error ? e.message : String(e),
        })))
    }
  } catch (e) {
    console.error(JSON.stringify({
      event: "task_approve_email_lookup_error",
      task_id: result.taskId,
      error: e instanceof Error ? e.message : String(e),
    }))
  }

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
supportersAdmin.post("/tasks/:id/reject", async (c) => {
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
    | { ok: true; taskId: string; userId: string; taskType: string }
    | { ok: false; code: 404 | 409; err: string }

  const result: RejectResult = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    const taskRows = await tx<Array<{
      id: string
      user_id: string
      task_type: string
      status: string
      description: string | null
    }>>`
      SELECT id, user_id, task_type, status, description FROM supporter_tasks
      WHERE id = ${taskId} FOR UPDATE
    `
    if (taskRows.length === 0) {
      return { ok: false, code: 404, err: "task_not_found" } as RejectResult
    }
    const task = taskRows[0]!
    if (task.status !== "pending") {
      return { ok: false, code: 409, err: "not_pending" } as RejectResult
    }

    await tx`
      UPDATE supporter_tasks
      SET status = 'rejected',
          reviewer_id = ${gate.auth.userId},
          reviewed_at = NOW(),
          description = COALESCE(description, '') || E'\n\nRejected: ' || ${reason}
      WHERE id = ${taskId}
    `

    return {
      ok: true,
      taskId,
      userId: task.user_id,
      taskType: task.task_type,
    } as RejectResult
  })

  if (!result.ok) return c.json({ error: result.err }, result.code)

  try {
    const emailRows = await sql<{ email: string | null }[]>`
      SELECT email FROM users WHERE id = ${result.userId} LIMIT 1
    `
    const email = emailRows[0]?.email ?? null
    if (email) {
      sendTaskRejectedEmail(env, email, result.taskType, reason)
        .catch((e) => console.error(JSON.stringify({
          event: "task_reject_email_error",
          task_id: result.taskId,
          error: e instanceof Error ? e.message : String(e),
        })))
    }
  } catch (e) {
    console.error(JSON.stringify({
      event: "task_reject_email_lookup_error",
      task_id: result.taskId,
      error: e instanceof Error ? e.message : String(e),
    }))
  }

  console.log(JSON.stringify({
    event: "task_rejected",
    admin_user_id: gate.auth.userId,
    task_id: result.taskId,
    reason_len: reason.length,
  }))

  return c.json({ ok: true, taskId: result.taskId })
})
