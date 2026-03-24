import { Hono } from "hono"
import type { Env } from "../types/env"
import { resolveAuth, canAccessDocument } from "../services/auth"

export const status = new Hono<{ Bindings: Env }>()

interface JobRow {
  type: string
  status: string
  progress: number
  error_message: string | null
}

status.get("/:documentId", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  const doc = await c.env.DB.prepare(
    "SELECT id, name, mime_type, size, status, error_message, created_at, updated_at FROM documents WHERE id = ? AND user_id = ?"
  ).bind(documentId, auth.userId).first<{
    id: string; name: string; mime_type: string; size: number; status: string;
    error_message: string | null; created_at: string; updated_at: string
  }>()

  if (!doc) return c.json({ error: "Document not found." }, 404)

  const chunkCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM chunks WHERE document_id = ?"
  ).bind(documentId).first<{ count: number }>()

  // Query stages from jobs table, ordered by pipeline sequence
  const jobsResult = await c.env.DB.prepare(
    "SELECT type, status, progress, error_message FROM jobs WHERE document_id = ? ORDER BY CASE type WHEN 'parse' THEN 1 WHEN 'chunk' THEN 2 WHEN 'embed' THEN 3 WHEN 'index' THEN 4 ELSE 5 END"
  ).bind(documentId).all<JobRow>()

  const stages = (jobsResult.results ?? []).map((job) => ({
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

status.get("/", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const docs = await c.env.DB.prepare(
    "SELECT id, name, mime_type, size, status, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  ).bind(auth.userId).all<{
    id: string; name: string; mime_type: string; size: number; status: string; created_at: string
  }>()

  return c.json({
    documents: (docs.results ?? []).map((d) => ({
      documentId: d.id, fileName: d.name, mimeType: d.mime_type, fileSize: d.size,
      status: d.status, createdAt: d.created_at,
    })),
    total: docs.results?.length ?? 0,
  })
})
