import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { LlmService } from "../services/llm"
import { resolveAuth, type AuthContext } from "../services/auth"
import { runPipelineAsync, createPendingJobs } from "../services/pipeline"
import { getPipelineQueue } from "../services/queue"
import { fileTypeFromBuffer } from "file-type"
import { getOrCreateSubscription, getUserStorageUsed } from "../services/billing"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const mcpRemote = new Hono<AppEnv>()

const SERVER_INFO = {
  name: "contexter",
  version: "0.1.0",
}

const TOOLS = [
  {
    name: "search_knowledge",
    description: "Search the Contexter knowledge base using natural language. Returns relevant document chunks with sources and an AI-generated answer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query in natural language" },
        topK: { type: "number", description: "Number of results to return (default 5, max 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_documents",
    description: "List all documents in the Contexter knowledge base with their processing status.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_document",
    description: "Get details and status of a specific document by its ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "add_context",
    description: "Add text content to the knowledge base. Use this to save notes, conversations, research, or any text data for later retrieval.",
    inputSchema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "Text content to add to the knowledge base" },
        title: { type: "string", description: "Title or name for this content (optional, default: auto-generated)" },
      },
      required: ["content"],
    },
  },
  {
    name: "upload_document",
    description: "Upload a file to the knowledge base. The file must be base64-encoded. Supported formats: PDF, DOCX, XLSX, PPTX, ODS, ODT, CSV, JSON, TXT, MD, HTML, XML, SVG, images (PNG/JPG/WebP), audio (MP3/WAV/M4A/OGG), video (MP4/MOV/WebM), YouTube URL.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fileName: { type: "string", description: "File name with extension (e.g. 'report.pdf')" },
        contentBase64: { type: "string", description: "File content encoded as base64 string" },
        mimeType: { type: "string", description: "MIME type (optional, auto-detected from extension)" },
      },
      required: ["fileName", "contentBase64"],
    },
  },
  {
    name: "delete_document",
    description: "Delete a document from the knowledge base. Removes the file, all chunks, embeddings, and metadata permanently.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID to delete" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "get_document_content",
    description: "Get the full text content of a document — all chunks with their text. Use this to read what's inside a specific document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "ask_about_document",
    description: "Ask a question about a specific document. Searches only within that document's chunks, not the entire knowledge base.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID to search within" },
        question: { type: "string", description: "Question about the document" },
      },
      required: ["documentId", "question"],
    },
  },
  {
    name: "get_stats",
    description: "Get knowledge base statistics: total documents, chunks, storage used, and processing status breakdown.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "create_share",
    description: "Create a share link for your knowledge base. Others can search your documents using the share link without needing your API token.",
    inputSchema: {
      type: "object" as const,
      properties: {
        permission: { type: "string", description: "Access level: 'read' (search only) or 'read_write' (search + upload). Default: 'read'" },
        expiresInHours: { type: "number", description: "Link expiration in hours (optional, default: never)" },
      },
    },
  },
  {
    name: "summarize_document",
    description: "Generate a concise summary of a document using AI. Works best with text documents, PDFs, and markdown.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID to summarize" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "rename_document",
    description: "Rename a document in the knowledge base.",
    inputSchema: {
      type: "object" as const,
      properties: {
        documentId: { type: "string", description: "Document ID" },
        newName: { type: "string", description: "New name for the document" },
      },
      required: ["documentId", "newName"],
    },
  },
]

/**
 * MCP Streamable HTTP endpoint.
 * POST responses wrapped in SSE format per spec.
 * Session ID generated on initialize.
 */
mcpRemote.post("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const authCtx = await resolveAuth(sql, c.req.raw)

  // P2-017 / P1-005: extract real client IP for rate limiting
  const clientIp = c.req.header("CF-Connecting-IP")
    ?? c.req.header("X-Real-IP")
    ?? c.req.header("X-Forwarded-For")?.split(",")[0]?.trim()
    ?? "unknown"

  let body: JsonRpcRequest | JsonRpcRequest[]
  try {
    body = await c.req.json()
  } catch {
    return jsonRpcError(null, -32700, "Parse error")
  }

  // Check Accept header — client may want JSON or SSE
  const accept = c.req.header("Accept") ?? ""
  const wantsSse = accept.includes("text/event-stream")

  // P3-006: extract request origin for CORS header in SSE responses
  const requestOrigin = c.req.header("Origin") ?? undefined

  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = []
    for (const req of body) {
      const res = await handleRequest(req, sql, env, redis, authCtx, clientIp)
      if (res) responses.push(res)
    }
    if (wantsSse) return sseResponse(responses, null, requestOrigin)
    return c.json(responses)
  }

  const response = await handleRequest(body, sql, env, redis, authCtx, clientIp)

  // Notifications (no id) don't get responses
  if (!response) return c.body(null, 202)

  // Generate session ID on initialize
  const sessionId = body.method === "initialize"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : c.req.header("Mcp-Session-Id") ?? null

  if (wantsSse) return sseResponse(response, sessionId, requestOrigin)

  // Plain JSON fallback (for simple clients like curl)
  // P3-006: only set ACAO for known browser origins
  const allowOrigin = requestOrigin && SSE_CORS_ORIGINS.includes(requestOrigin) ? requestOrigin : undefined
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-transform",
  }
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin
  if (sessionId) headers["Mcp-Session-Id"] = sessionId
  return new Response(JSON.stringify(response), { headers })
})

// GET — redirect OAuth authorization requests; otherwise 405
mcpRemote.get("/", (c) => {
  const env = c.get("env")
  const q = c.req.query()
  // Perplexity and other OAuth clients hit /sse with OAuth params
  if (q.client_id || q.response_type) {
    const dest = new URL(`${env.BASE_URL}/authorize`)
    for (const [k, v] of Object.entries(q)) {
      dest.searchParams.set(k, v)
    }
    return c.redirect(dest.toString(), 302)
  }
  return c.text("Method Not Allowed", 405)
})

// DELETE — stateless server, no session termination needed
mcpRemote.delete("/", (c) => {
  return c.text("Method Not Allowed", 405)
})

async function handleRequest(
  req: JsonRpcRequest,
  sql: Sql,
  env: Env,
  redis: Redis,
  authCtx: AuthContext | null,
  clientIp: string = "unknown"
): Promise<JsonRpcResponse | null> {
  if (req.jsonrpc !== "2.0") {
    return makeError(req.id, -32600, "Invalid Request: jsonrpc must be '2.0'")
  }

  switch (req.method) {
    case "initialize":
      return makeResult(req.id, {
        protocolVersion: "2025-03-26",
        capabilities: {
          tools: {},
        },
        serverInfo: SERVER_INFO,
      })

    case "notifications/initialized":
      return null // notification, no response

    case "tools/list":
      if (!authCtx) return makeError(req.id, -32600, "Authentication required")
      return makeResult(req.id, { tools: TOOLS })

    case "tools/call":
      if (!authCtx) return makeError(req.id, -32600, "Unauthorized: provide ?token= or ?share= in the MCP server URL")
      return handleToolCall(req, sql, env, redis, authCtx)

    case "client/register":
      return handleClientRegister(req, redis, clientIp)

    case "ping":
      return makeResult(req.id, {})

    default:
      return makeError(req.id, -32601, `Method not found: ${req.method}`)
  }
}

async function handleToolCall(
  req: JsonRpcRequest,
  sql: Sql,
  env: Env,
  redis: Redis,
  authCtx: AuthContext
): Promise<JsonRpcResponse> {
  const toolName = req.params?.name as string
  const args = (req.params?.arguments ?? {}) as Record<string, unknown>

  try {
    switch (toolName) {
      case "search_knowledge": {
        // Enforce query length limit — 2000 chars max
        const rawQuery = (args.query as string) ?? ""
        if (rawQuery.length > 2000) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Query exceeds 2000 character limit." }],
            isError: true,
          })
        }
        if (!rawQuery.trim()) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Query is required." }],
            isError: true,
          })
        }

        // NEW-005: per-user rate limit — max 60 queries per minute
        const queryRateKey = `rate:query:${authCtx.userId}`
        try {
          const count = await redis.incr(queryRateKey)
          if (count === 1) await redis.expire(queryRateKey, 60)
          if (count > 60) {
            return makeResult(req.id, {
              content: [{ type: "text", text: "Query rate limit exceeded. Maximum 60 queries per minute." }],
              isError: true,
            })
          }
        } catch (e) {
          console.error("Redis rate limit check failed for search_knowledge:", e instanceof Error ? e.message : String(e))
        }

        const embedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
        const vectorStore = new VectorStoreService({ sql })
        await vectorStore.initialize()
        const llm = new LlmService({ apiKey: env.GROQ_API_KEY, model: env.GROQ_LLM_MODEL ?? "llama-3.1-8b-instant" })
        const rag = new RagService({ llm, embedder, vectorStore })

        // P1-003: pass userId to scope search to this user's documents only
        const result = await rag.query({
          query: rawQuery,
          topK: Math.min((args.topK as number) ?? 5, 20),
          scoreThreshold: 0,
          userId: authCtx.userId,
        })

        // Filter sources by share scope (if using share token with limited scope)
        const filteredSources = authCtx.scope === "all"
          ? result.sources
          : result.sources.filter((s) => (authCtx.scope as string[]).includes(s.documentId))

        let text = `**Answer:** ${result.answer}\n\n`
        if (filteredSources.length > 0) {
          text += `**Sources (${filteredSources.length}):**\n`
          for (const src of filteredSources) {
            text += `- [${src.documentId}] ${src.content.slice(0, 200)}\n`
          }
        }

        return makeResult(req.id, {
          content: [{ type: "text", text }],
        })
      }

      case "list_documents": {
        const docs = await sql<{ id: string; name: string; mime_type: string; size: number; status: string; created_at: string }[]>`
          SELECT id, name, mime_type, size, status, created_at
          FROM documents WHERE user_id = ${authCtx.userId} ORDER BY created_at DESC LIMIT 100
        `

        const list = docs
          .map((d) => `- **${d.name}** (${d.mime_type}, ${(d.size / 1024).toFixed(1)} KB) — ${d.status} — ID: ${d.id}`)
          .join("\n")

        return makeResult(req.id, {
          content: [{ type: "text", text: list || "No documents in knowledge base." }],
        })
      }

      case "get_document": {
        const [doc] = await sql<{ id: string; name: string; mime_type: string; size: number; status: string; error_message: string | null; created_at: string }[]>`
          SELECT id, name, mime_type, size, status, error_message, created_at
          FROM documents WHERE id = ${args.documentId as string} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${args.documentId}` }],
            isError: true,
          })
        }

        // P1-008: COUNT(*) returns bigint — cast to int
        const [chunks] = await sql<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM chunks WHERE document_id = ${doc.id}
        `

        const text = `**${doc.name}**\n- Type: ${doc.mime_type}\n- Size: ${(doc.size / 1024).toFixed(1)} KB\n- Status: ${doc.status}\n- Chunks: ${chunks?.count ?? 0}\n- Created: ${doc.created_at}${doc.error_message ? `\n- Error: ${doc.error_message}` : ""}`

        return makeResult(req.id, {
          content: [{ type: "text", text }],
        })
      }

      case "add_context": {
        if (authCtx.permission !== "read_write") {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Write access required. Share tokens with read-only access cannot add content." }],
            isError: true,
          })
        }

        // NEW-004: per-user upload rate limit — max 20 uploads per hour
        if (await checkUploadRateLimit(redis, authCtx.userId)) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Upload rate limit exceeded. Maximum 20 uploads per hour." }],
            isError: true,
          })
        }

        // Storage limit check — enforce tier limits
        const ctxSub = await getOrCreateSubscription(sql, authCtx.userId)
        if (ctxSub) {
          const storageUsed = await getUserStorageUsed(sql, authCtx.userId)
          const storageLimit = Number(ctxSub.storage_limit_bytes ?? 1073741824)
          if (storageUsed >= storageLimit) {
            return makeResult(req.id, {
              content: [{ type: "text", text: `Storage limit reached (${(storageUsed / 1024 / 1024).toFixed(1)} MB / ${(storageLimit / 1024 / 1024).toFixed(1)} MB). Upgrade your plan to add more content.` }],
              isError: true,
            })
          }
        }

        const content = (args.content as string ?? "").trim()
        if (!content) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "content is required and must not be empty" }],
            isError: true,
          })
        }

        if (content.length > 10 * 1024 * 1024) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "content exceeds 10 MB limit" }],
            isError: true,
          })
        }

        // NEW-011: sanitize title before using in R2 key
        const rawTitle = (args.title as string ?? "").trim() || `context-${new Date().toISOString().slice(0, 16).replace("T", "-")}.txt`
        const title = sanitizeFileName(rawTitle)
        const blob = new Blob([content], { type: "text/plain" })
        const buffer = await blob.arrayBuffer()

        // P3-013: use 16-char documentId
        const documentId = crypto.randomUUID().slice(0, 16)
        const r2Key = `${authCtx.userId}/${documentId}/${title}`

        await env.storage.send(new PutObjectCommand({
          Bucket: env.storageBucket,
          Key: r2Key,
          Body: Buffer.from(buffer),
          ContentType: "text/plain",
        }))
        await sql`
          INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status)
          VALUES (${documentId}, ${authCtx.userId}, ${title}, ${"text/plain"}, ${blob.size}, ${r2Key}, 'processing')
        `

        const jobIds = await createPendingJobs(sql, documentId, authCtx.userId)
        try {
          const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
          await queue.add("process", { documentId, userId: authCtx.userId, fileName: title, mimeType: "text/plain", fileSize: blob.size, r2Key, jobIds })
        } catch (qErr) {
          console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
          runPipelineAsync(documentId, { file: buffer, fileName: title, mimeType: "text/plain", fileSize: blob.size }, env, sql, authCtx.userId, jobIds).catch(console.error)
        }

        return makeResult(req.id, {
          content: [{ type: "text", text: `Added "${title}" to knowledge base (${(blob.size / 1024).toFixed(1)} KB). Document ID: ${documentId}. Processing started — content will be searchable shortly.` }],
        })
      }

      case "upload_document": {
        if (authCtx.permission !== "read_write") {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Write access required. Share tokens with read-only access cannot upload files." }],
            isError: true,
          })
        }

        // NEW-004: per-user upload rate limit — max 20 uploads per hour
        if (await checkUploadRateLimit(redis, authCtx.userId)) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Upload rate limit exceeded. Maximum 20 uploads per hour." }],
            isError: true,
          })
        }

        // Storage limit check — enforce tier limits
        const uploadSub = await getOrCreateSubscription(sql, authCtx.userId)
        if (uploadSub) {
          const storageUsed = await getUserStorageUsed(sql, authCtx.userId)
          const storageLimit = Number(uploadSub.storage_limit_bytes ?? 1073741824)
          if (storageUsed >= storageLimit) {
            return makeResult(req.id, {
              content: [{ type: "text", text: `Storage limit reached (${(storageUsed / 1024 / 1024).toFixed(1)} MB / ${(storageLimit / 1024 / 1024).toFixed(1)} MB). Upgrade your plan to upload more files.` }],
              isError: true,
            })
          }
        }

        // NEW-011: sanitize fileName before using in R2 key
        const rawFileName = (args.fileName as string ?? "").trim()
        const fileName = sanitizeFileName(rawFileName)
        const contentBase64 = (args.contentBase64 as string ?? "").trim()

        if (!fileName) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "fileName is required" }],
            isError: true,
          })
        }
        if (!contentBase64) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "contentBase64 is required" }],
            isError: true,
          })
        }

        let buffer: ArrayBuffer
        try {
          const binary = atob(contentBase64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          buffer = bytes.buffer
        } catch {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Invalid base64 content" }],
            isError: true,
          })
        }

        if (buffer.byteLength > 100 * 1024 * 1024) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "File exceeds 100 MB limit" }],
            isError: true,
          })
        }

        // Magic byte validation — detect actual file type from binary content
        const uint8 = new Uint8Array(buffer)
        const detectedType = await fileTypeFromBuffer(uint8)
        if (detectedType) {
          const ALLOWED_BINARY_MIMES = new Set([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/png", "image/jpeg", "image/webp",
            "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/ogg",
            "video/mp4", "video/quicktime", "video/webm",
          ])
          if (!ALLOWED_BINARY_MIMES.has(detectedType.mime)) {
            return makeResult(req.id, {
              content: [{ type: "text", text: `File content validation failed. Detected format: ${detectedType.mime} is not supported.` }],
              isError: true,
            })
          }
        }

        const MIME_MAP: Record<string, string> = {
          pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          csv: "text/csv", json: "application/json", txt: "text/plain", md: "text/markdown",
          png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml",
          mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/x-m4a", ogg: "audio/ogg",
          mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
        }

        const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
        const mimeType = (args.mimeType as string) || MIME_MAP[ext] || "application/octet-stream"
        if (mimeType === "application/octet-stream") {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Unsupported file type: ${fileName}. Supported: ${Object.keys(MIME_MAP).join(", ")}` }],
            isError: true,
          })
        }

        // P3-013: use 16-char documentId
        const documentId = crypto.randomUUID().slice(0, 16)
        const r2Key = `${authCtx.userId}/${documentId}/${fileName}`

        await env.storage.send(new PutObjectCommand({
          Bucket: env.storageBucket,
          Key: r2Key,
          Body: Buffer.from(buffer),
          ContentType: mimeType,
          Metadata: { fileName, mimeType, documentId, userId: authCtx.userId },
        }))
        await sql`
          INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status)
          VALUES (${documentId}, ${authCtx.userId}, ${fileName}, ${mimeType}, ${buffer.byteLength}, ${r2Key}, 'processing')
        `

        const jobIds = await createPendingJobs(sql, documentId, authCtx.userId)
        try {
          const queue = getPipelineQueue(process.env.REDIS_URL ?? "redis://localhost:6379")
          await queue.add("process", { documentId, userId: authCtx.userId, fileName, mimeType, fileSize: buffer.byteLength, r2Key, jobIds })
        } catch (qErr) {
          console.error("BullMQ enqueue failed, falling back to direct run:", qErr instanceof Error ? qErr.message : String(qErr))
          runPipelineAsync(documentId, { file: buffer, fileName, mimeType, fileSize: buffer.byteLength }, env, sql, authCtx.userId, jobIds).catch(console.error)
        }

        return makeResult(req.id, {
          content: [{ type: "text", text: `Uploaded "${fileName}" (${(buffer.byteLength / 1024).toFixed(1)} KB, ${mimeType}). Document ID: ${documentId}. Pipeline started — content will be searchable shortly.` }],
        })
      }

      case "delete_document": {
        if (authCtx.permission !== "read_write") {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Write access required." }],
            isError: true,
          })
        }
        const docId = args.documentId as string
        if (!docId) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId is required" }],
            isError: true,
          })
        }

        const [doc] = await sql<{ id: string; name: string; r2_key: string }[]>`
          SELECT id, name, r2_key FROM documents WHERE id = ${docId} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        // Delete from S3
        await env.storage.send(new DeleteObjectCommand({
          Bucket: env.storageBucket,
          Key: doc.r2_key,
        }))

        // Null out embeddings for all chunks (replaces VECTOR_INDEX.deleteByIds)
        const chunkIds = (await sql<{ id: string }[]>`
          SELECT id FROM chunks WHERE document_id = ${docId}
        `).map((c) => c.id)

        if (chunkIds.length > 0) {
          await sql`UPDATE chunks SET embedding = NULL WHERE id = ANY(${chunkIds})`
        }

        // Delete document row (chunks and jobs cascade)
        await sql`DELETE FROM documents WHERE id = ${docId}`

        return makeResult(req.id, {
          content: [{ type: "text", text: `Deleted "${doc.name}" (${docId}). File, chunks, and embeddings removed.` }],
        })
      }

      case "get_document_content": {
        const docId = args.documentId as string
        if (!docId) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId is required" }],
            isError: true,
          })
        }

        const [doc] = await sql<{ id: string; name: string; status: string }[]>`
          SELECT id, name, status FROM documents WHERE id = ${docId} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        if (doc.status !== "ready") {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document "${doc.name}" is still ${doc.status}. Content not available yet.` }],
          })
        }

        const chunks = await sql<{ content: string; chunk_index: number; token_count: number | null }[]>`
          SELECT content, chunk_index, token_count FROM chunks WHERE document_id = ${docId} ORDER BY chunk_index
        `

        const fullText = chunks.map((c) => c.content).join("\n\n")
        const chunkCount = chunks.length

        return makeResult(req.id, {
          content: [{ type: "text", text: `**${doc.name}** (${chunkCount} chunks)\n\n${fullText}` }],
        })
      }

      case "ask_about_document": {
        const docId = args.documentId as string
        const question = (args.question as string ?? "").trim()
        if (!docId || !question) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId and question are required" }],
            isError: true,
          })
        }

        const [doc] = await sql<{ id: string; name: string; status: string }[]>`
          SELECT id, name, status FROM documents WHERE id = ${docId} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        // Get all chunks for this document
        const chunks = await sql<{ content: string }[]>`
          SELECT content FROM chunks WHERE document_id = ${docId} ORDER BY chunk_index
        `

        const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")

        // Ask LLM with document context
        const llm = new LlmService({ apiKey: env.GROQ_API_KEY, model: env.GROQ_LLM_MODEL ?? "llama-3.1-8b-instant" })
        const answer = await llm.chat([
          { role: "system", content: `Answer the question using ONLY the provided document context. Document: "${doc.name}". If the answer is not in the context, say so. Answer in the user's language.` },
          { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
        ], 1024)

        return makeResult(req.id, {
          content: [{ type: "text", text: `**${doc.name}** — ${question}\n\n${answer.response ?? "No answer generated."}` }],
        })
      }

      case "get_stats": {
        // P1-008: COUNT(*) returns bigint — cast to int
        const docsByStatus = await sql<{ status: string; cnt: number }[]>`
          SELECT status, COUNT(*)::int as cnt FROM documents WHERE user_id = ${authCtx.userId} GROUP BY status
        `

        const [chunkCount] = await sql<{ cnt: number }[]>`
          SELECT COUNT(*)::int as cnt FROM chunks WHERE user_id = ${authCtx.userId}
        `

        const [totalSize] = await sql<{ total: number }[]>`
          SELECT COALESCE(SUM(size), 0) as total FROM documents WHERE user_id = ${authCtx.userId}
        `

        const statusMap: Record<string, number> = {}
        let totalDocs = 0
        for (const row of docsByStatus) {
          statusMap[row.status] = row.cnt
          totalDocs += row.cnt
        }

        const sizeMB = ((totalSize?.total ?? 0) / 1024 / 1024).toFixed(2)
        const text = [
          `**Knowledge Base Statistics**`,
          `- Documents: ${totalDocs} (ready: ${statusMap.ready ?? 0}, processing: ${statusMap.processing ?? 0}, error: ${statusMap.error ?? 0})`,
          `- Chunks: ${chunkCount?.cnt ?? 0}`,
          `- Storage: ${sizeMB} MB`,
        ].join("\n")

        return makeResult(req.id, {
          content: [{ type: "text", text }],
        })
      }

      case "create_share": {
        if (authCtx.permission !== "read_write") {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Write access required to create shares." }],
            isError: true,
          })
        }

        const permission = (args.permission as string) === "read_write" ? "read_write" : "read"
        const expiresInHours = args.expiresInHours as number | undefined
        // P3-013: use 16-char IDs
        const shareId = crypto.randomUUID().slice(0, 16)
        const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 32) + crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        const expiresAt = expiresInHours
          ? new Date(Date.now() + expiresInHours * 3600_000).toISOString()
          : null

        await sql`
          INSERT INTO shares (id, owner_id, share_token, scope, permission, expires_at)
          VALUES (${shareId}, ${authCtx.userId}, ${shareToken}, 'all', ${permission}, ${expiresAt})
        `

        const shareUrl = `${env.BASE_URL}/sse?share=${shareToken}`

        return makeResult(req.id, {
          content: [{ type: "text", text: `**Share link created**\n- URL: ${shareUrl}\n- Permission: ${permission}\n- Expires: ${expiresAt ?? "never"}\n\nAnyone with this URL can connect via MCP and ${permission === "read_write" ? "search + upload" : "search only"}.` }],
        })
      }

      case "summarize_document": {
        const docId = args.documentId as string
        if (!docId) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId is required" }],
            isError: true,
          })
        }

        const [doc] = await sql<{ id: string; name: string; status: string }[]>`
          SELECT id, name, status FROM documents WHERE id = ${docId} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }
        if (doc.status !== "ready") {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document "${doc.name}" is still ${doc.status}.` }],
          })
        }

        const chunks = await sql<{ content: string }[]>`
          SELECT content FROM chunks WHERE document_id = ${docId} ORDER BY chunk_index
        `

        const fullText = chunks.map((c) => c.content).join("\n\n")
        // Truncate to ~6000 tokens for LLM context
        const truncated = fullText.slice(0, 24000)

        const llm = new LlmService({ apiKey: env.GROQ_API_KEY, model: env.GROQ_LLM_MODEL ?? "llama-3.1-8b-instant" })
        const summary = await llm.chat([
          { role: "system", content: "Create a concise summary of the document. Include key points, main topics, and important details. Answer in the same language as the document." },
          { role: "user", content: truncated },
        ], 1024)

        return makeResult(req.id, {
          content: [{ type: "text", text: `**Summary: ${doc.name}**\n\n${summary.response ?? "Could not generate summary."}` }],
        })
      }

      case "rename_document": {
        if (authCtx.permission !== "read_write") {
          return makeResult(req.id, {
            content: [{ type: "text", text: "Write access required." }],
            isError: true,
          })
        }
        const docId = args.documentId as string
        const rawNewName = (args.newName as string ?? "").trim()
        if (!docId || !rawNewName) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId and newName are required" }],
            isError: true,
          })
        }

        const newName = sanitizeFileName(rawNewName)
        if (newName.length > 255) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "newName exceeds 255 character limit" }],
            isError: true,
          })
        }

        const [doc] = await sql<{ id: string; name: string }[]>`
          SELECT id, name FROM documents WHERE id = ${docId} AND user_id = ${authCtx.userId}
        `

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        await sql`
          UPDATE documents SET name = ${newName}, updated_at = NOW() WHERE id = ${docId}
        `

        return makeResult(req.id, {
          content: [{ type: "text", text: `Renamed "${doc.name}" to "${newName}"` }],
        })
      }

      default:
        return makeResult(req.id, {
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
          isError: true,
        })
    }
  } catch (e) {
    // Sanitize error — don't leak internal API details
    const raw = e instanceof Error ? e.message : String(e)
    const sanitized = raw.includes("Jina API") ? "ошибка обработки запроса — попробуйте позже"
      : raw.includes("Unauthorized") ? "ошибка авторизации — проверьте токен"
      : `ошибка: ${raw.slice(0, 200)}`
    return makeResult(req.id, {
      content: [{ type: "text", text: sanitized }],
      isError: true,
    })
  }
}

// P2-018 + P1-005: validate redirect_uris (HTTPS only) and rate-limit client registration
async function handleClientRegister(req: JsonRpcRequest, redis: Redis, clientIp: string): Promise<JsonRpcResponse> {
  // P1-005: rate limit — max 10 client registrations per IP per hour
  const rateLimitKey = `rate:client_reg:${clientIp}`
  try {
    const count = await redis.incr(rateLimitKey)
    if (count === 1) await redis.expire(rateLimitKey, 3600)
    if (count > 10) {
      return makeError(req.id, -32000, "rate_limit_exceeded: too many client registrations from this IP")
    }
  } catch (e) {
    console.error("Redis rate limit check failed for client/register:", e instanceof Error ? e.message : String(e))
  }

  const clientName = (req.params?.client_name as string | undefined) ?? "unknown"
  const redirectUrisRaw = (req.params?.redirect_uris as string[] | undefined) ?? []

  // P2-018: validate redirect_uris — only HTTPS allowed (localhost for dev tools)
  for (const uri of redirectUrisRaw) {
    try {
      const parsed = new URL(uri)
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return makeError(req.id, -32602, `invalid_redirect_uri: only HTTPS redirect URIs allowed: ${uri}`)
      }
    } catch {
      return makeError(req.id, -32602, `invalid_redirect_uri: invalid URI: ${uri}`)
    }
  }

  const clientId = `contexter-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
  const clientSecret = crypto.randomUUID().replace(/-/g, "")

  // Store in Redis for 24h
  try {
    await redis.set(
      `oauth_client:${clientId}`,
      JSON.stringify({ clientId, clientSecret, clientName, redirectUris: redirectUrisRaw }),
      "EX",
      86400
    )
  } catch (e) {
    console.error("Redis set failed for client/register:", e instanceof Error ? e.message : String(e))
    return makeError(req.id, -32000, "server_error: failed to register client")
  }

  return makeResult(req.id, {
    client_id: clientId,
    client_secret: clientSecret,
    client_name: clientName,
    redirect_uris: redirectUrisRaw,
  })
}

// --- Security helpers ---

/**
 * NEW-011: Sanitize file names used in R2 storage keys.
 * Strips path traversal sequences and replaces / \ with -.
 * Prevents key collisions and path traversal in S3 keys.
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

/**
 * NEW-004: Apply per-user upload rate limit (max 20 uploads per hour).
 * Returns true if the request should be blocked.
 */
async function checkUploadRateLimit(redis: Redis, userId: string): Promise<boolean> {
  const key = `rate:upload:${userId}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 3600)
    return count > 20
  } catch (e) {
    console.error("Redis upload rate limit check failed, allowing upload:", e instanceof Error ? e.message : String(e))
    return false // fail-open
  }
}

// --- JSON-RPC helpers ---

interface JsonRpcRequest {
  jsonrpc: string
  method: string
  params?: Record<string, unknown>
  id?: string | number | null
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

function makeResult(id: string | number | null | undefined, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function makeError(id: string | number | null | undefined, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }
}

// P3-006: MCP SSE endpoints serve non-browser MCP clients — they connect via token in query params,
// not via browser cross-origin requests. Restricting to specific origins would break MCP clients
// (Claude Desktop, Perplexity, etc.) that connect directly. We keep the SSE CORS origin as the
// configured domain list but note that MCP tool clients are not browser-origin requests.
// For the plain JSON fallback path (curl, direct clients) we also restrict.
const SSE_CORS_ORIGINS = ["https://contexter.cc", "https://www.contexter.cc"]

function sseResponse(data: JsonRpcResponse | JsonRpcResponse[], sessionId: string | null, requestOrigin?: string): Response {
  const items = Array.isArray(data) ? data : [data]
  const body = items.map((item) => `event: message\ndata: ${JSON.stringify(item)}\n\n`).join("")
  // Allow the request origin if it's in the allowlist, otherwise omit ACAO header
  // MCP clients (non-browser) don't send Origin headers so this doesn't affect them
  const allowOrigin = requestOrigin && SSE_CORS_ORIGINS.includes(requestOrigin) ? requestOrigin : undefined
  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  }
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin
  if (sessionId) headers["Mcp-Session-Id"] = sessionId
  return new Response(body, { headers })
}

function jsonRpcError(id: string | number | null, code: number, message: string): Response {
  const body = { jsonrpc: "2.0" as const, id, error: { code, message } }
  return new Response(`event: message\ndata: ${JSON.stringify(body)}\n\n`, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  })
}
