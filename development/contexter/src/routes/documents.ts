import { Hono } from "hono"
import type { Env } from "../types/env"
import { resolveAuth, canAccessDocument } from "../services/auth"

export const documents = new Hono<{ Bindings: Env }>()

interface ChunkRow {
  chunk_index: number
  content: string
  token_count: number | null
}

/**
 * GET /api/documents/:documentId/content
 * Returns document metadata + all chunks ordered by chunk_index.
 * Auth required (Bearer token or ?token= param).
 */
documents.get("/:documentId/content", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  const doc = await c.env.DB.prepare(
    "SELECT id, name, mime_type, size, status, created_at FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(documentId, auth.userId)
    .first<{
      id: string
      name: string
      mime_type: string
      size: number
      status: string
      created_at: string
    }>()

  if (!doc) return c.json({ error: "Document not found." }, 404)

  const chunksResult = await c.env.DB.prepare(
    "SELECT chunk_index, content, token_count FROM chunks WHERE document_id = ? AND user_id = ? ORDER BY chunk_index ASC"
  )
    .bind(documentId, auth.userId)
    .all<ChunkRow>()

  const chunks = (chunksResult.results ?? []).map((row: ChunkRow) => ({
    index: row.chunk_index,
    content: row.content,
    tokenCount: row.token_count ?? null,
  }))

  return c.json({
    documentId: doc.id,
    fileName: doc.name,
    mimeType: doc.mime_type,
    fileSize: doc.size,
    status: doc.status,
    createdAt: doc.created_at,
    chunkCount: chunks.length,
    chunks,
  })
})
