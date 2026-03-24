import { Hono } from "hono"
import type { Env } from "../types/env"
import { resolveAuth, canAccessDocument } from "../services/auth"
import { resumePipelineFromStage } from "../services/pipeline"
import type { StageType } from "../services/pipeline"

export const retry = new Hono<{ Bindings: Env }>()

const VALID_STAGES: readonly string[] = ["parse", "chunk", "embed", "index"]

interface JobRow {
  id: string
  type: string
  status: string
}

/**
 * POST /api/retry/:documentId
 * Resume pipeline from the first failed stage.
 * Optionally accepts { stage: "embed" } to force retry from a specific stage.
 */
retry.post("/:documentId", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  // Verify document exists and belongs to user
  const doc = await c.env.DB.prepare(
    "SELECT id, status FROM documents WHERE id = ? AND user_id = ?"
  ).bind(documentId, auth.userId).first<{ id: string; status: string }>()

  if (!doc) return c.json({ error: "Document not found." }, 404)

  // Only allow retry on errored documents
  if (doc.status !== "error") {
    return c.json({ error: `Cannot retry: document status is "${doc.status}", expected "error".` }, 409)
  }

  // Get all jobs for this document
  const jobsResult = await c.env.DB.prepare(
    "SELECT id, type, status FROM jobs WHERE document_id = ? ORDER BY CASE type WHEN 'parse' THEN 1 WHEN 'chunk' THEN 2 WHEN 'embed' THEN 3 WHEN 'index' THEN 4 ELSE 5 END"
  ).bind(documentId).all<JobRow>()

  const jobs = jobsResult.results ?? []
  if (jobs.length === 0) {
    return c.json({ error: "No job records found for this document." }, 404)
  }

  // Determine which stage to retry from
  let retryFromStage: StageType | null = null

  // Check if body specifies a stage
  try {
    const body = await c.req.json<{ stage?: string }>()
    if (body.stage && VALID_STAGES.includes(body.stage)) {
      retryFromStage = body.stage as StageType
    }
  } catch {
    // No body or invalid JSON -- find first failed stage automatically
  }

  // If no explicit stage, find the first failed one
  if (!retryFromStage) {
    const failedJob = jobs.find((j) => j.status === "error")
    if (!failedJob) {
      return c.json({ error: "No failed stage found to retry." }, 409)
    }
    retryFromStage = failedJob.type as StageType
  }

  // Build jobIds map from existing jobs
  const jobIds: Record<string, string> = {}
  for (const job of jobs) {
    jobIds[job.type] = job.id
  }

  // Ensure all 4 stages have job rows (create missing ones)
  for (const stageType of VALID_STAGES) {
    if (!jobIds[stageType]) {
      const jobId = `${documentId}-${stageType}`
      jobIds[stageType] = jobId
      await c.env.DB.prepare(
        "INSERT OR REPLACE INTO jobs (id, document_id, user_id, type, status, progress, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', 0, datetime('now'), datetime('now'))"
      ).bind(jobId, documentId, auth.userId, stageType).run()
    }
  }

  // Run retry in background
  c.executionCtx.waitUntil(
    resumePipelineFromStage(
      documentId,
      retryFromStage,
      c.env,
      auth.userId,
      jobIds as Record<StageType, string>
    )
  )

  return c.json({
    documentId,
    status: "processing",
    retryFromStage,
    message: `Retrying pipeline from stage "${retryFromStage}". Poll /api/status/${documentId} for progress.`,
  }, 202)
})
