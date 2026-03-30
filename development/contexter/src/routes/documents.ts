import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth, canAccessDocument } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const documents = new Hono<AppEnv>()

interface ChunkRow {
  chunk_index: number
  content: string
  token_count: number | null
}

/**
 * DELETE /api/documents
 * P2-002: Frontend Settings page calls this to delete all data.
 */
documents.delete("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)
  if (!auth.isOwner) return c.json({ error: "Forbidden." }, 403)

  // Collect R2 keys before deleting DB rows
  const r2Keys = await sql<{ r2_key: string }[]>`SELECT r2_key FROM documents WHERE user_id = ${auth.userId}`

  const result = await sql`DELETE FROM documents WHERE user_id = ${auth.userId}`

  // Async R2 cleanup (non-blocking, best-effort)
  if (r2Keys.length > 0) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
    Promise.all(r2Keys.map(({ r2_key }) =>
      env.storage.send(new DeleteObjectCommand({ Bucket: env.storageBucket, Key: r2_key })).catch(() => {})
    )).catch(() => {})
  }

  return c.json({ success: true, deleted: result.count })
})

/**
 * GET /api/documents/:documentId/content
 * Returns document metadata + all chunks ordered by chunk_index.
 * Auth required (Bearer token or ?token= param).
 */
documents.get("/:documentId/content", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const documentId = c.req.param("documentId")
  if (!canAccessDocument(auth, documentId)) return c.json({ error: "Access denied." }, 403)

  const [doc] = await sql<{
    id: string
    name: string
    mime_type: string
    size: number
    status: string
    created_at: string
  }[]>`
    SELECT id, name, mime_type, size, status, created_at
    FROM documents WHERE id = ${documentId} AND user_id = ${auth.userId}
  `

  if (!doc) return c.json({ error: "Document not found." }, 404)

  const chunks = (await sql<ChunkRow[]>`
    SELECT chunk_index, content, token_count
    FROM chunks WHERE document_id = ${documentId} AND user_id = ${auth.userId}
    ORDER BY chunk_index ASC
  `).map((row: ChunkRow) => ({
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
