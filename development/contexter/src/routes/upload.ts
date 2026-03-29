import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { fileTypeFromBuffer } from "file-type"
import { runPipelineAsync, createPendingJobs } from "../services/pipeline"
import { getPipelineQueue } from "../services/queue"
import { resolveAuth } from "../services/auth"
import { getOrCreateSubscription, getUserStorageUsed } from "../services/billing"

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

  // Storage limit check — enforce tier limits
  const sub = await getOrCreateSubscription(sql, auth.userId)
  if (sub) {
    const storageUsed = await getUserStorageUsed(sql, auth.userId)
    const storageLimit = Number(sub.storage_limit_bytes ?? 1073741824)
    if (storageUsed >= storageLimit) {
      return c.json({
        error: "Storage limit reached. Upgrade your plan to upload more files.",
        storageUsed,
        storageLimit,
        tier: sub.tier,
        upgradeUrl: "/api/billing",
      }, 403)
    }
  }

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
  if (file.size > 200 * 1024 * 1024) return c.json({ error: "File exceeds 200 MB limit." }, 413)

  // NEW-011: sanitize file name before using in R2 key
  const safeFileName = sanitizeFileName(file.name)

  const mimeType = resolveMimeType(file.type, safeFileName)
  console.log(JSON.stringify({ event: "upload_debug", fileName: safeFileName, fileType: file.type, resolvedMime: mimeType, allowed: ALLOWED_MIME_TYPES.has(mimeType) }))
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

  // NEW-014: Enqueue pipeline job — if both BullMQ and direct fallback fail, rollback document row
  let enqueued = false
  try {
    const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
    await queue.add("process", { documentId, userId: auth.userId, fileName: safeFileName, mimeType, fileSize: file.size, r2Key, jobIds })
    enqueued = true
  } catch (qErr) {
    console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
    try {
      runPipelineAsync(documentId, { file: buffer, fileName: safeFileName, mimeType, fileSize: file.size }, env, sql, auth.userId, jobIds)
        .catch(console.error)
      enqueued = true
    } catch (directErr) {
      console.error("Direct pipeline fallback also failed:", directErr instanceof Error ? directErr.message : String(directErr))
    }
  }

  if (!enqueued) {
    try {
      await sql`DELETE FROM documents WHERE id = ${documentId}`
      console.error(`Rolled back document ${documentId} — both enqueue paths failed`)
    } catch (rollbackErr) {
      console.error("Rollback failed for document:", documentId, rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr))
    }
    return c.json({ error: "Failed to start processing pipeline. Please retry." }, 503)
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
    maxFileSize: "200 MB (direct upload)",
    maxFileSizePresigned: "unlimited (presigned)",
    presignEndpoint: "/api/upload/presign",
  })
})

const PRESIGN_EXPIRES_IN = 900 // 15 minutes

upload.post("/presign", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized. Provide token via Bearer header or ?token= param." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  // Storage quota check
  const sub = await getOrCreateSubscription(sql, auth.userId)
  if (sub) {
    const storageUsed = await getUserStorageUsed(sql, auth.userId)
    const storageLimit = Number(sub.storage_limit_bytes ?? 1073741824)
    if (storageUsed >= storageLimit) {
      return c.json({
        error: "Storage limit reached. Upgrade your plan to upload more files.",
        storageUsed,
        storageLimit,
        tier: sub.tier,
        upgradeUrl: "/api/billing",
      }, 403)
    }
  }

  // Rate limit: 20 presign requests per hour (shared bucket with direct upload)
  const uploadRateKey = `rate:upload:${auth.userId}`
  try {
    const count = await redis.incr(uploadRateKey)
    if (count === 1) await redis.expire(uploadRateKey, 3600)
    if (count > 20) {
      return c.json({ error: "Upload rate limit exceeded. Maximum 20 uploads per hour." }, 429)
    }
  } catch (e) {
    console.error("Redis upload rate limit check failed, allowing presign:", e instanceof Error ? e.message : String(e))
  }

  let body: { fileName?: unknown; mimeType?: unknown; fileSize?: unknown } = {}
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  const { fileName, mimeType, fileSize } = body
  if (typeof fileName !== "string" || !fileName.trim()) {
    return c.json({ error: "fileName is required." }, 400)
  }
  if (typeof mimeType !== "string" || !mimeType.trim()) {
    return c.json({ error: "mimeType is required." }, 400)
  }
  if (typeof fileSize !== "number" || fileSize <= 0) {
    return c.json({ error: "fileSize must be a positive number." }, 400)
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return c.json({ error: `Unsupported MIME type: ${mimeType}` }, 415)
  }

  const safeFileName = sanitizeFileName(fileName)
  const documentId = crypto.randomUUID().slice(0, 16)
  const r2Key = `${auth.userId}/${documentId}/${safeFileName}`

  const cmd = new PutObjectCommand({
    Bucket: env.storageBucket,
    Key: r2Key,
    ContentType: mimeType,
  })

  const uploadUrl = await getSignedUrl(env.storage, cmd, { expiresIn: PRESIGN_EXPIRES_IN })

  return c.json({ uploadUrl, documentId, r2Key, expiresIn: PRESIGN_EXPIRES_IN }, 200)
})

upload.post("/confirm", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized. Provide token via Bearer header or ?token= param." }, 401)
  if (auth.permission !== "read_write") return c.json({ error: "Write access required." }, 403)

  let body: { documentId?: unknown; r2Key?: unknown; fileName?: unknown; mimeType?: unknown; fileSize?: unknown } = {}
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  const { documentId, r2Key, fileName, mimeType, fileSize } = body
  if (typeof documentId !== "string" || !documentId.trim()) {
    return c.json({ error: "documentId is required." }, 400)
  }
  if (typeof r2Key !== "string" || !r2Key.trim()) {
    return c.json({ error: "r2Key is required." }, 400)
  }
  if (typeof fileName !== "string" || !fileName.trim()) {
    return c.json({ error: "fileName is required." }, 400)
  }
  if (typeof mimeType !== "string" || !mimeType.trim()) {
    return c.json({ error: "mimeType is required." }, 400)
  }
  if (typeof fileSize !== "number" || fileSize <= 0) {
    return c.json({ error: "fileSize must be a positive number." }, 400)
  }

  // Ownership check: r2Key must start with userId
  if (!r2Key.startsWith(`${auth.userId}/`)) {
    return c.json({ error: "Forbidden." }, 403)
  }

  // Verify object exists in R2 and check size
  let actualSize: number
  try {
    const headCmd = new HeadObjectCommand({ Bucket: env.storageBucket, Key: r2Key })
    const headRes = await env.storage.send(headCmd)
    actualSize = headRes.ContentLength ?? 0
  } catch {
    return c.json({ error: "File not found in storage. Upload the file before calling confirm." }, 404)
  }

  // Verify size matches within ±10%
  const tolerance = fileSize * 0.1
  if (Math.abs(actualSize - fileSize) > tolerance) {
    return c.json({
      error: `File size mismatch. Expected ~${fileSize} bytes, found ${actualSize} bytes.`,
    }, 422)
  }

  // Magic bytes validation: fetch first 64 bytes
  const safeFileName = sanitizeFileName(fileName)
  const resolvedMime = resolveMimeType(mimeType, safeFileName)
  if (!ALLOWED_MIME_TYPES.has(resolvedMime)) {
    return c.json({ error: `Unsupported MIME type: ${resolvedMime}` }, 415)
  }

  try {
    const getCmd = new GetObjectCommand({
      Bucket: env.storageBucket,
      Key: r2Key,
      Range: "bytes=0-63",
    })
    const getRes = await env.storage.send(getCmd)
    if (getRes.Body) {
      const bytes = await getRes.Body.transformToByteArray()
      const magicError = await validateMimeTypeByMagicBytes(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, resolvedMime)
      if (magicError) {
        return c.json({ error: magicError }, 415)
      }
    }
  } catch (e) {
    console.error("Magic bytes check failed, proceeding:", e instanceof Error ? e.message : String(e))
  }

  // Check if document already confirmed (idempotent: double confirm returns existing status)
  const [existingDoc] = await sql`SELECT id, status FROM documents WHERE id = ${documentId}`
  if (existingDoc) {
    return c.json({ documentId, status: existingDoc.status }, 200)
  }

  // Insert document row
  await sql`
    INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status)
    VALUES (${documentId}, ${auth.userId}, ${safeFileName}, ${resolvedMime}, ${fileSize}, ${r2Key}, ${"processing"})
  `

  const jobIds = await createPendingJobs(sql, documentId, auth.userId)

  // Enqueue pipeline job
  let enqueued = false
  try {
    const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
    await queue.add("process", { documentId, userId: auth.userId, fileName: safeFileName, mimeType: resolvedMime, fileSize, r2Key, jobIds })
    enqueued = true
  } catch (qErr) {
    console.error("BullMQ enqueue failed on confirm:", qErr instanceof Error ? qErr.message : String(qErr))
  }

  if (!enqueued) {
    try {
      await sql`DELETE FROM documents WHERE id = ${documentId}`
    } catch (rollbackErr) {
      console.error("Rollback failed for document:", documentId, rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr))
    }
    return c.json({ error: "Failed to start processing pipeline. Please retry." }, 503)
  }

  return c.json({ documentId, status: "processing" }, 202)
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
