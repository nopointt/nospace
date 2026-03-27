import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth, canAccessDocument } from "../services/auth"
import { resumePipelineFromStage } from "../services/pipeline"
import type { StageType } from "../services/pipeline"
import { getPipelineQueue } from "../services/queue"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const retry = new Hono<AppEnv>()

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
  const sql = c.get("sql")
  const env = c.get("env")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  // Verify document exists and belongs to user
  const [doc] = await sql<{ id: string; status: string; name: string; mime_type: string; size: number; r2_key: string }[]>`
    SELECT id, status, name, mime_type, size, r2_key FROM documents WHERE id = ${documentId} AND user_id = ${auth.userId}
  `

  if (!doc) return c.json({ error: "Document not found." }, 404)

  // Allow retry on errored or stuck-processing documents.
  // "processing" can mean a stuck job when the pipeline worker was killed without
  // writing an error (e.g. timeout before our stage timeout fired).
  if (doc.status !== "error" && doc.status !== "processing") {
    return c.json({ error: `Cannot retry: document status is "${doc.status}", expected "error" or "processing".` }, 409)
  }

  // Get all jobs for this document
  const jobs = await sql<JobRow[]>`
    SELECT id, type, status FROM jobs WHERE document_id = ${documentId}
    ORDER BY CASE type WHEN 'parse' THEN 1 WHEN 'chunk' THEN 2 WHEN 'embed' THEN 3 WHEN 'index' THEN 4 ELSE 5 END
  `

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

  // If no explicit stage, find the first failed or stuck-running stage
  if (!retryFromStage) {
    const failedJob = jobs.find((j) => j.status === "error") ?? jobs.find((j) => j.status === "running")
    if (!failedJob) {
      return c.json({ error: "No failed or stuck stage found to retry." }, 409)
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
      await sql`
        INSERT INTO jobs (id, document_id, user_id, type, status, progress, created_at, updated_at)
        VALUES (${jobId}, ${documentId}, ${auth.userId}, ${stageType}, 'pending', 0, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'pending', progress = 0, updated_at = NOW()
      `
    }
  }

  // Enqueue retry job
  try {
    const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
    await queue.add("process", {
      documentId,
      userId: auth.userId,
      fileName: doc.name,
      mimeType: doc.mime_type,
      fileSize: doc.size,
      r2Key: doc.r2_key,
      fromStage: retryFromStage,
      jobIds: jobIds as Record<StageType, string>,
    })
  } catch (qErr) {
    console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
    resumePipelineFromStage(
      documentId,
      retryFromStage,
      env,
      sql,
      auth.userId,
      jobIds as Record<StageType, string>
    ).catch(console.error)
  }

  return c.json({
    documentId,
    status: "processing",
    retryFromStage,
    message: `Retrying pipeline from stage "${retryFromStage}". Poll /api/status/${documentId} for progress.`,
  }, 202)
})
