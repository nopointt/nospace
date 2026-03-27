import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const pipeline = new Hono<AppEnv>()

const STUCK_THRESHOLD_MINUTES = 5

/**
 * GET /api/pipeline/health
 * Returns counts of stuck jobs (running > 5 min) and pending jobs per stage.
 * Requires auth.
 */
pipeline.get("/health", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000)

  // P1-008: COUNT(*) returns bigint in postgres.js — cast to int
  const stuckResult = await sql<{ type: string; count: number }[]>`
    SELECT type, COUNT(*)::int as count
    FROM jobs
    WHERE status = 'running'
      AND updated_at < ${stuckCutoff}
    GROUP BY type
  `

  const pendingResult = await sql<{ type: string; count: number }[]>`
    SELECT type, COUNT(*)::int as count
    FROM jobs
    WHERE status = 'pending'
    GROUP BY type
  `

  const stuckByStage = Object.fromEntries(stuckResult.map((r) => [r.type, r.count]))
  const pendingByStage = Object.fromEntries(pendingResult.map((r) => [r.type, r.count]))
  const totalStuck = stuckResult.reduce((sum, r) => sum + r.count, 0)

  // Surface the actual stuck documents for operator visibility
  const stuckDocuments = await sql<{ document_id: string; stuck_stage: string; stuck_since: string }[]>`
    SELECT j.document_id, j.type as stuck_stage, j.updated_at as stuck_since
    FROM jobs j
    WHERE j.status = 'running'
      AND j.updated_at < ${stuckCutoff}
    ORDER BY j.updated_at ASC
    LIMIT 50
  `

  return c.json({
    healthy: totalStuck === 0,
    stuckThresholdMinutes: STUCK_THRESHOLD_MINUTES,
    totalStuck,
    stuckByStage,
    pendingByStage,
    stuckDocuments,
  })
})
