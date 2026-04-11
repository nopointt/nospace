/**
 * CTX-12 Supporters public/private API (W2-04..W2-06).
 *
 *  GET  /api/supporters        — public top-100 leaderboard, no PII
 *  GET  /api/supporters/me     — authenticated self status
 *
 * Privacy decision (Axis, this wave): public endpoint NEVER exposes
 * user_id or email. displayName = users.name if set, else
 * "Anonymous Supporter".
 */

import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { TIER_THRESHOLDS, type SupporterTier } from "../services/supporters"

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
