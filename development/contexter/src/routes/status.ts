import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth, canAccessDocument } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const status = new Hono<AppEnv>()

interface JobRow {
  type: string
  status: string
  progress: number
  error_message: string | null
}

status.get("/:documentId", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  const [doc] = await sql<{
    id: string; name: string; mime_type: string; size: number; status: string;
    error_message: string | null; created_at: string; updated_at: string
  }[]>`
    SELECT id, name, mime_type, size, status, error_message, created_at, updated_at
    FROM documents WHERE id = ${documentId} AND user_id = ${auth.userId}
  `

  if (!doc) return c.json({ error: "Document not found." }, 404)

  // P1-008: COUNT(*) returns bigint — cast to int
  const [chunkCount] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM chunks WHERE document_id = ${documentId}
  `

  // Query stages from jobs table, ordered by pipeline sequence
  const stages = (await sql<JobRow[]>`
    SELECT type, status, progress, error_message FROM jobs
    WHERE document_id = ${documentId}
    ORDER BY CASE type WHEN 'parse' THEN 1 WHEN 'chunk' THEN 2 WHEN 'embed' THEN 3 WHEN 'index' THEN 4 ELSE 5 END
  `).map((job) => ({
    type: job.type,
    status: job.status,
    progress: job.progress,
    ...(job.error_message ? { error_message: job.error_message } : {}),
  }))

  // Derive effective status from jobs to avoid race condition:
  // pipeline sets all jobs to "done" before updating document.status to "ready"
  let effectiveStatus = doc.status
  if (stages.length === 4 && doc.status === "processing") {
    const allDone = stages.every((s) => s.status === "done")
    const anyError = stages.some((s) => s.status === "error")
    if (allDone) effectiveStatus = "ready"
    else if (anyError) effectiveStatus = "error"
  }

  return c.json({
    documentId: doc.id,
    fileName: doc.name,
    mimeType: doc.mime_type,
    fileSize: doc.size,
    status: effectiveStatus,
    error: doc.error_message,
    stages,
    chunks: chunkCount?.count ?? 0,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  })
})

/**
 * DELETE /api/status/:documentId
 * P2-001: Frontend calls this to delete a document.
 */
status.delete("/:documentId", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)
  if (!auth.isOwner) return c.json({ error: "Forbidden." }, 403)

  const { documentId } = c.req.param()
  const result = await sql`
    DELETE FROM documents WHERE id = ${documentId} AND user_id = ${auth.userId}
    RETURNING id
  `

  if (result.length === 0) return c.json({ error: "Document not found." }, 404)
  return c.json({ success: true })
})

status.get("/", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  // P1-008: COUNT(*) returns bigint — cast to int
  const docs = await sql<{
    id: string; name: string; mime_type: string; size: number; status: string; created_at: string; chunk_count: number
  }[]>`
    SELECT d.id, d.name, d.mime_type, d.size, d.status, d.created_at,
      (SELECT COUNT(*)::int FROM chunks WHERE document_id = d.id) as chunk_count
    FROM documents d
    WHERE d.user_id = ${auth.userId}
    ORDER BY d.created_at DESC LIMIT 100
  `

  return c.json({
    documents: docs.map((d) => ({
      documentId: d.id, fileName: d.name, mimeType: d.mime_type, fileSize: d.size,
      status: d.status, chunks: d.chunk_count ?? 0, createdAt: d.created_at,
    })),
    total: docs.length,
  })
})
