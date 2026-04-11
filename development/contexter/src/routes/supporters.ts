/**
 * CTX-12 Supporters public/private API (W2-04..W2-06).
 *
 *  GET  /api/supporters        — public top-100 leaderboard, no PII
 *
 * Privacy decision (Axis, this wave): public endpoint NEVER exposes
 * user_id or email. displayName = users.name if set, else
 * "Anonymous Supporter".
 */

import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
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
