import { Hono } from "hono"
import type { Env } from "../types/env"
import { runPipelineAsync, createPendingJobs } from "../services/pipeline"
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

  // Guard: text upload via JSON body
  const contentType = c.req.header("Content-Type") ?? ""
  if (contentType.includes("application/json")) {
    let body: { text?: string } = {}
    try { body = await c.req.json() } catch {
      return c.json({ error: "неверный JSON" }, 400)
    }
    if (!body.text || body.text.trim().length === 0) {
      return c.json({ error: "поле text обязательно" }, 400)
    }
    // Handle text upload inline — create a virtual file
    const text = body.text.trim()
    const blob = new Blob([text], { type: "text/plain" })
    const virtualFile = new File([blob], "pasted-text.txt", { type: "text/plain" })

    const documentId = crypto.randomUUID().slice(0, 8)
    const r2Key = `${auth.userId}/${documentId}/pasted-text.txt`
    await c.env.STORAGE.put(r2Key, await virtualFile.arrayBuffer())
    await c.env.DB.prepare(
      "INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status) VALUES (?, ?, ?, ?, ?, ?, 'processing')"
    ).bind(documentId, auth.userId, "pasted-text.txt", "text/plain", blob.size, r2Key).run()
    const jobIds = await createPendingJobs(c.env.DB, documentId, auth.userId)
    c.executionCtx.waitUntil(runPipelineAsync(documentId, { file: await virtualFile.arrayBuffer(), fileName: "pasted-text.txt", mimeType: "text/plain", fileSize: blob.size }, c.env, auth.userId, jobIds))
    return c.json({ documentId, status: "processing" }, 202)
  }

  // Guard: must be multipart
  if (!contentType.includes("multipart/form-data")) {
    return c.json({ error: "загрузите файл через форму (multipart/form-data) или отправьте JSON с полем text" }, 400)
  }

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

  // Store file in R2
  await c.env.STORAGE.put(r2Key, buffer, {
    customMetadata: { fileName: file.name, mimeType, documentId, userId: auth.userId },
  })

  // Insert document row
  await c.env.DB.prepare(
    "INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(documentId, auth.userId, file.name, mimeType, file.size, r2Key, "processing").run()

  // Create 4 pending job rows (parse, chunk, embed, index)
  const jobIds = await createPendingJobs(c.env.DB, documentId, auth.userId)

  // Run pipeline asynchronously -- response returns immediately
  c.executionCtx.waitUntil(
    runPipelineAsync(
      documentId,
      { file: buffer, fileName: file.name, mimeType, fileSize: file.size },
      c.env,
      auth.userId,
      jobIds
    )
  )

  return c.json({
    documentId,
    status: "processing",
    message: "Pipeline started. Poll /api/status/" + documentId + " for progress.",
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  }, 202)
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
