import { Hono } from "hono"
import type { Env } from "../types/env"
import { resolveAuth } from "../services/auth"

export const pipeline = new Hono<{ Bindings: Env }>()

const STUCK_THRESHOLD_MINUTES = 5

/**
 * GET /api/pipeline/health
 * Returns counts of stuck jobs (running > 5 min) and pending jobs per stage.
 * Requires auth.
 */
pipeline.get("/health", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const stuckResult = await c.env.DB.prepare(
    `SELECT type, COUNT(*) as count
     FROM jobs
     WHERE status = 'running'
       AND updated_at < datetime('now', '-${STUCK_THRESHOLD_MINUTES} minutes')
     GROUP BY type`
  ).all<{ type: string; count: number }>()

  const pendingResult = await c.env.DB.prepare(
    `SELECT type, COUNT(*) as count
     FROM jobs
     WHERE status = 'pending'
     GROUP BY type`
  ).all<{ type: string; count: number }>()

  const stuckByStage = Object.fromEntries(
    (stuckResult.results ?? []).map((r) => [r.type, r.count])
  )

  const pendingByStage = Object.fromEntries(
    (pendingResult.results ?? []).map((r) => [r.type, r.count])
  )

  const totalStuck = (stuckResult.results ?? []).reduce((sum, r) => sum + r.count, 0)

  // Surface the actual stuck documents for operator visibility
  const stuckDocsResult = await c.env.DB.prepare(
    `SELECT j.document_id, j.type as stuck_stage, j.updated_at as stuck_since
     FROM jobs j
     WHERE j.status = 'running'
       AND j.updated_at < datetime('now', '-${STUCK_THRESHOLD_MINUTES} minutes')
     ORDER BY j.updated_at ASC
     LIMIT 50`
  ).all<{ document_id: string; stuck_stage: string; stuck_since: string }>()

  return c.json({
    healthy: totalStuck === 0,
    stuckThresholdMinutes: STUCK_THRESHOLD_MINUTES,
    totalStuck,
    stuckByStage,
    pendingByStage,
    stuckDocuments: stuckDocsResult.results ?? [],
  })
})
