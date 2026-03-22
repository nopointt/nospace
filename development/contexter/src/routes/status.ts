import { Hono } from "hono"
import type { Env } from "../types/env"
import { resolveAuth, canAccessDocument } from "../services/auth"

export const status = new Hono<{ Bindings: Env }>()

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

  return c.json({
    documentId: doc.id, fileName: doc.name, mimeType: doc.mime_type, fileSize: doc.size,
    status: doc.status, error: doc.error_message, chunks: chunkCount?.count ?? 0,
    createdAt: doc.created_at, updatedAt: doc.updated_at,
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
