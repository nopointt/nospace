import { Hono } from "hono"
import type { Env } from "../types/env"
import { runPipeline } from "../services/pipeline"
import { resolveAuth } from "../services/auth"

export const upload = new Hono<{ Bindings: Env }>()

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  json: "application/json",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  xml: "text/xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/x-m4a",
  ogg: "audio/ogg",
}

upload.post("/", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized. Provide token via Bearer header or ?token= param." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  const formData = await c.req.formData()
  const file = formData.get("file") as File | null

  if (!file) return c.json({ error: "No file provided." }, 400)
  if (file.size === 0) return c.json({ error: "File is empty." }, 400)
  if (file.size > 100 * 1024 * 1024) return c.json({ error: "File exceeds 100 MB limit." }, 413)

  const mimeType = resolveMimeType(file.type, file.name)
  if (mimeType === "application/octet-stream") {
    return c.json({ error: `Unsupported file type: ${file.name}` }, 415)
  }

  const documentId = crypto.randomUUID().slice(0, 8)
  const buffer = await file.arrayBuffer()
  const r2Key = `${auth.userId}/${documentId}/${file.name}`

  await c.env.STORAGE.put(r2Key, buffer, {
    customMetadata: { fileName: file.name, mimeType, documentId, userId: auth.userId },
  })

  await c.env.DB.prepare(
    "INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(documentId, auth.userId, file.name, mimeType, file.size, r2Key, "processing").run()

  try {
    const result = await runPipeline(documentId, { file: buffer, fileName: file.name, mimeType, fileSize: file.size }, c.env, auth.userId)
    const allDone = result.stages.every((s) => s.status === "done")
    const errorMsg = result.stages.find((s) => s.status === "error")?.error ?? null

    await c.env.DB.prepare(
      "UPDATE documents SET status = ?, error_message = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(allDone ? "ready" : "error", errorMsg, documentId).run()

    return c.json({
      documentId, status: allDone ? "ready" : "error", fileName: file.name, fileSize: file.size, mimeType,
      pipeline: result.stages.map((s) => ({ stage: s.stage, status: s.status, durationMs: s.durationMs, error: s.error })),
    }, allDone ? 201 : 207)
  } catch (e) {
    await c.env.DB.prepare(
      "UPDATE documents SET status = 'error', error_message = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(e instanceof Error ? e.message : String(e), documentId).run()
    return c.json({ documentId, status: "error", error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

upload.get("/formats", (c) => {
  return c.json({
    formats: Object.entries(MIME_MAP).map(([ext, mime]) => ({ extension: ext, mimeType: mime })),
    maxFileSize: "100 MB",
  })
})

function resolveMimeType(provided: string, fileName: string): string {
  if (provided && provided !== "application/octet-stream") return provided
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return MIME_MAP[ext] ?? "application/octet-stream"
}
