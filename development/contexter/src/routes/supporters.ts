/**
 * CTX-12 Supporters router (F-02 split: public + tasks here,
 * admin → supporters-admin.ts, referral → supporters-referral.ts).
 *
 *  GET  /              — public top-100 leaderboard, no PII
 *  GET  /me            — authenticated self status
 *  POST /freeze        — activate 30-day freeze (1x per calendar year)
 *  POST /tasks         — submit task for review
 *  /admin/*            — mounted from supporters-admin.ts
 *  /referral           — mounted from supporters-referral.ts
 */

import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { createHash } from "node:crypto"
import { resolveAuth } from "../services/auth"
import { checkRateLimit, getClientIp } from "../services/rate-limit"
import {
  TIER_THRESHOLDS,
  TASK_TOKEN_AMOUNTS,
  requireActiveSupporter,
  submitTask,
  type SupporterTier,
} from "../services/supporters"
import { supportersAdmin } from "./supporters-admin"
import { supportersReferral } from "./supporters-referral"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

// W5-04: device hash for referral anti-abuse (exported for referral route + tests).
export function computeDeviceHash(
  userAgent: string | null | undefined,
  acceptLanguage: string | null | undefined,
): string | null {
  const ua = (userAgent ?? "").trim()
  const al = (acceptLanguage ?? "").trim()
  if (!ua && !al) return null
  const h = createHash("sha256")
  h.update(ua)
  h.update("|")
  h.update(al)
  return h.digest("hex").slice(0, 32)
}

export const supporters = new Hono<AppEnv>()

// Mount sub-routers
supporters.route("/admin", supportersAdmin)
supporters.route("/referral", supportersReferral)

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

  const result = await sql<{ freeze_start: Date; freeze_end: Date }[]>`
    UPDATE supporters
    SET status = 'frozen',
        freeze_start = NOW(),
        freeze_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE user_id = ${auth.userId}
      AND status != 'frozen'
      AND (
        freeze_start IS NULL
        OR EXTRACT(YEAR FROM freeze_start AT TIME ZONE 'UTC')
           < EXTRACT(YEAR FROM NOW() AT TIME ZONE 'UTC')
      )
    RETURNING freeze_start, freeze_end
  `
  const updated = result[0]

  if (!updated) {
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
    if (row.status === "frozen") {
      return c.json(
        { error: "already_frozen", code: "already_frozen" },
        409,
      )
    }
    return c.json(
      { error: "already_frozen_this_year", code: "freeze_year_used" },
      409,
    )
  }

  console.log(JSON.stringify({ event: "supporter_freeze_activated", user_id: auth.userId }))
  return c.json({
    ok: true,
    freezeStart: updated.freeze_start,
    freezeEnd: updated.freeze_end,
  })
})

// --- W4-01: Submit a task for review ----------------------------------

supporters.post("/tasks", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")

  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) {
    return c.json({ error: "unauthorized" }, 401)
  }

  const gate = await requireActiveSupporter(sql, auth.userId)
  if (!gate.ok) {
    return c.json({ error: "not_a_supporter", reason: gate.reason }, 403)
  }

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
