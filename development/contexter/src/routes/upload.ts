import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { fileTypeFromBuffer } from "file-type"
import { runPipelineAsync, createPendingJobs } from "../services/pipeline"
import { getPipelineQueue } from "../services/queue"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const upload = new Hono<AppEnv>()

/**
 * NEW-011: Sanitize file names before using in R2 storage keys.
 * Prevents path traversal attacks and key collisions.
 */
function sanitizeFileName(name: string): string {
  // Remove path traversal sequences
  let safe = name.replace(/\.\.[/\\]/g, "").replace(/^[/\\]+/, "")
  // Replace directory separators
  safe = safe.replace(/[/\\]/g, "-")
  // Strip null bytes and control characters
  safe = safe.replace(/[\x00-\x1f\x7f]/g, "")
  // Trim whitespace
  safe = safe.trim()
  // Fallback if name becomes empty
  if (!safe) safe = "untitled"
  return safe
}

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
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
}

/**
 * QA-001: Allowlist of MIME types the pipeline can actually parse.
 * Prevents client-supplied unknown MIME types (e.g. chemical/x-xyz) from being
 * accepted and then silently failing in the pipeline worker.
 */
const ALLOWED_MIME_TYPES = new Set([
  ...Object.values(MIME_MAP),
  // ODS — ZIP-based spreadsheet handled by DoclingParser
  "application/vnd.oasis.opendocument.spreadsheet",
  // ODT — text document handled by TextParser
  "application/vnd.oasis.opendocument.text",
  // YouTube URLs processed as text/plain internally
  "text/plain",
])

upload.post("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized. Provide token via Bearer header or ?token= param." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  // NEW-004: per-user upload rate limit — max 20 uploads per hour
  const uploadRateKey = `rate:upload:${auth.userId}`
  try {
    const count = await redis.incr(uploadRateKey)
    if (count === 1) await redis.expire(uploadRateKey, 3600)
    if (count > 20) {
      return c.json({ error: "Upload rate limit exceeded. Maximum 20 uploads per hour." }, 429)
    }
  } catch (e) {
    console.error("Redis upload rate limit check failed, allowing upload:", e instanceof Error ? e.message : String(e))
  }

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
    const buffer = await blob.arrayBuffer()
    const virtualFile = new File([blob], "pasted-text.txt", { type: "text/plain" })

    // P3-013: use 16-char documentId
    const documentId = crypto.randomUUID().slice(0, 16)
    const r2Key = `${auth.userId}/${documentId}/pasted-text.txt`
    await env.storage.send(new PutObjectCommand({
      Bucket: env.storageBucket,
      Key: r2Key,
      Body: Buffer.from(buffer),
      ContentType: "text/plain",
    }))
    await sql`
      INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status)
      VALUES (${documentId}, ${auth.userId}, ${"pasted-text.txt"}, ${"text/plain"}, ${blob.size}, ${r2Key}, 'processing')
    `
    const jobIds = await createPendingJobs(sql, documentId, auth.userId)
    try {
      const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
      await queue.add("process", { documentId, userId: auth.userId, fileName: "pasted-text.txt", mimeType: "text/plain", fileSize: blob.size, r2Key, jobIds })
    } catch (qErr) {
      console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
      runPipelineAsync(documentId, { file: await virtualFile.arrayBuffer(), fileName: "pasted-text.txt", mimeType: "text/plain", fileSize: blob.size }, env, sql, auth.userId, jobIds).catch(console.error)
    }
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

  // NEW-011: sanitize file name before using in R2 key
  const safeFileName = sanitizeFileName(file.name)

  const mimeType = resolveMimeType(file.type, safeFileName)
  if (mimeType === "application/octet-stream" || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return c.json({ error: `Unsupported file type: ${safeFileName}` }, 415)
  }

  // P3-013: use 16-char documentId — 8-char was only ~4 billion values
  const documentId = crypto.randomUUID().slice(0, 16)
  const buffer = await file.arrayBuffer()

  // P1-012: Validate MIME type using magic bytes
  const magicByteError = await validateMimeTypeByMagicBytes(buffer, mimeType)
  if (magicByteError) {
    return c.json({ error: magicByteError }, 415)
  }

  const r2Key = `${auth.userId}/${documentId}/${safeFileName}`

  // Store file in S3
  await env.storage.send(new PutObjectCommand({
    Bucket: env.storageBucket,
    Key: r2Key,
    Body: Buffer.from(buffer),
    ContentType: mimeType,
    Metadata: { fileName: safeFileName, mimeType, documentId, userId: auth.userId },
  }))

  // Insert document row
  await sql`
    INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status)
    VALUES (${documentId}, ${auth.userId}, ${safeFileName}, ${mimeType}, ${file.size}, ${r2Key}, ${"processing"})
  `

  // Create 4 pending job rows (parse, chunk, embed, index)
  const jobIds = await createPendingJobs(sql, documentId, auth.userId)

  // Enqueue pipeline job — response returns immediately
  try {
    const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
    await queue.add("process", { documentId, userId: auth.userId, fileName: safeFileName, mimeType, fileSize: file.size, r2Key, jobIds })
  } catch (qErr) {
    console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
    runPipelineAsync(documentId, { file: buffer, fileName: safeFileName, mimeType, fileSize: file.size }, env, sql, auth.userId, jobIds).catch(console.error)
  }

  return c.json({
    documentId,
    status: "processing",
    message: "Pipeline started. Poll /api/status/" + documentId + " for progress.",
    fileName: safeFileName,
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

/**
 * P1-012: Validate file MIME type using magic bytes (file content signature).
 * Returns validation error string if validation fails, null if passes.
 * Text formats (txt, csv, json, md, html, xml, svg) have no magic bytes — accepted as-is.
 * Binary formats must match the detected MIME type against ALLOWED_MIME_TYPES.
 */
async function validateMimeTypeByMagicBytes(buffer: ArrayBuffer, claimedMime: string): Promise<string | null> {
  const uint8 = new Uint8Array(buffer)
  const detected = await fileTypeFromBuffer(uint8)

  // file-type returns undefined for text-based formats — that's OK
  if (!detected) {
    return null
  }

  // Binary format detected — verify it's in our allowed list
  if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
    return `File content validation failed. Detected format: ${detected.mime} is not supported.`
  }

  return null
}
