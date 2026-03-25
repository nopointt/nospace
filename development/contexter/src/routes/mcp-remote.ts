import { Hono } from "hono"
import type { Env } from "../types/env"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { resolveAuth, type AuthContext } from "../services/auth"
import { runPipelineAsync, createPendingJobs } from "../services/pipeline"

export const mcpRemote = new Hono<{ Bindings: Env }>()

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
    description: "Upload a file to the knowledge base. The file must be base64-encoded. Supported formats: PDF, DOCX, XLSX, PPTX, CSV, JSON, TXT, MD, images (PNG/JPG/WebP), audio (MP3/WAV/OGG).",
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
  const authCtx = await resolveAuth(c.env.DB, c.req.raw)

  let body: JsonRpcRequest | JsonRpcRequest[]
  try {
    body = await c.req.json()
  } catch {
    return jsonRpcError(null, -32700, "Parse error")
  }

  // Check Accept header — client may want JSON or SSE
  const accept = c.req.header("Accept") ?? ""
  const wantsSse = accept.includes("text/event-stream")

  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = []
    for (const req of body) {
      const res = await handleRequest(req, c.env, authCtx, c.executionCtx)
      if (res) responses.push(res)
    }
    if (wantsSse) return sseResponse(responses, null)
    return c.json(responses)
  }

  const response = await handleRequest(body, c.env, authCtx, c.executionCtx)

  // Notifications (no id) don't get responses
  if (!response) return c.body(null, 202)

  // Generate session ID on initialize
  const sessionId = body.method === "initialize"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : c.req.header("Mcp-Session-Id") ?? null

  if (wantsSse) return sseResponse(response, sessionId)

  // Plain JSON fallback (for simple clients like curl)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-transform",
    "Access-Control-Allow-Origin": "*",
  }
  if (sessionId) headers["Mcp-Session-Id"] = sessionId
  return new Response(JSON.stringify(response), { headers })
})

// GET — redirect OAuth authorization requests; otherwise 405
mcpRemote.get("/", (c) => {
  const q = c.req.query()
  // Perplexity and other OAuth clients hit /sse with OAuth params
  if (q.client_id || q.response_type) {
    const dest = new URL("https://contexter.nopoint.workers.dev/authorize")
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

async function handleRequest(req: JsonRpcRequest, env: Env, authCtx: AuthContext | null, execCtx: ExecutionContext): Promise<JsonRpcResponse | null> {
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
      return makeResult(req.id, { tools: TOOLS })

    case "tools/call":
      if (!authCtx) return makeError(req.id, -32600, "Unauthorized: provide ?token= or ?share= in the MCP server URL")
      return handleToolCall(req, env, authCtx, execCtx)

    case "client/register":
      return handleClientRegister(req, env)

    case "ping":
      return makeResult(req.id, {})

    default:
      return makeError(req.id, -32601, `Method not found: ${req.method}`)
  }
}

async function handleToolCall(req: JsonRpcRequest, env: Env, authCtx: AuthContext, execCtx: ExecutionContext): Promise<JsonRpcResponse> {
  const toolName = req.params?.name as string
  const args = (req.params?.arguments ?? {}) as Record<string, unknown>

  try {
    switch (toolName) {
      case "search_knowledge": {
        const embedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
        const vectorStore = new VectorStoreService({ db: env.DB, vectorIndex: env.VECTOR_INDEX })
        await vectorStore.initialize()
        const rag = new RagService({ ai: env.AI, embedder, vectorStore })

        const result = await rag.query({
          query: args.query as string,
          topK: Math.min((args.topK as number) ?? 5, 20),
          scoreThreshold: 0,
        })

        let text = `**Answer:** ${result.answer}\n\n`
        if (result.sources.length > 0) {
          text += `**Sources (${result.sources.length}):**\n`
          for (const src of result.sources) {
            text += `- [${src.documentId}] ${src.content.slice(0, 200)}\n`
          }
        }

        return makeResult(req.id, {
          content: [{ type: "text", text }],
        })
      }

      case "list_documents": {
        const docs = await env.DB.prepare(
          "SELECT id, name, mime_type, size, status, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
        ).bind(authCtx.userId).all<{ id: string; name: string; mime_type: string; size: number; status: string; created_at: string }>()

        const list = (docs.results ?? [])
          .map((d) => `- **${d.name}** (${d.mime_type}, ${(d.size / 1024).toFixed(1)} KB) — ${d.status} — ID: ${d.id}`)
          .join("\n")

        return makeResult(req.id, {
          content: [{ type: "text", text: list || "No documents in knowledge base." }],
        })
      }

      case "get_document": {
        const doc = await env.DB.prepare(
          "SELECT id, name, mime_type, size, status, error_message, created_at FROM documents WHERE id = ? AND user_id = ?"
        ).bind(args.documentId as string, authCtx.userId).first<{ id: string; name: string; mime_type: string; size: number; status: string; error_message: string | null; created_at: string }>()

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${args.documentId}` }],
            isError: true,
          })
        }

        const chunks = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM chunks WHERE document_id = ?"
        ).bind(doc.id).first<{ count: number }>()

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
        const content = (args.content as string ?? "").trim()
        if (!content) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "content is required and must not be empty" }],
            isError: true,
          })
        }

        const title = (args.title as string ?? "").trim() || `context-${new Date().toISOString().slice(0, 16).replace("T", "-")}.txt`
        const blob = new Blob([content], { type: "text/plain" })
        const buffer = await blob.arrayBuffer()

        const documentId = crypto.randomUUID().slice(0, 8)
        const r2Key = `${authCtx.userId}/${documentId}/${title}`

        await env.STORAGE.put(r2Key, buffer)
        await env.DB.prepare(
          "INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status) VALUES (?, ?, ?, ?, ?, ?, 'processing')"
        ).bind(documentId, authCtx.userId, title, "text/plain", blob.size, r2Key).run()

        const jobIds = await createPendingJobs(env.DB, documentId, authCtx.userId)
        execCtx.waitUntil(runPipelineAsync(documentId, { file: buffer, fileName: title, mimeType: "text/plain", fileSize: blob.size }, env, authCtx.userId, jobIds))

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
        const fileName = (args.fileName as string ?? "").trim()
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

        const MIME_MAP: Record<string, string> = {
          pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          csv: "text/csv", json: "application/json", txt: "text/plain", md: "text/markdown",
          png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml",
          mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/x-m4a", ogg: "audio/ogg",
        }

        const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
        const mimeType = (args.mimeType as string) || MIME_MAP[ext] || "application/octet-stream"
        if (mimeType === "application/octet-stream") {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Unsupported file type: ${fileName}. Supported: ${Object.keys(MIME_MAP).join(", ")}` }],
            isError: true,
          })
        }

        const documentId = crypto.randomUUID().slice(0, 8)
        const r2Key = `${authCtx.userId}/${documentId}/${fileName}`

        await env.STORAGE.put(r2Key, buffer, {
          customMetadata: { fileName, mimeType, documentId, userId: authCtx.userId },
        })
        await env.DB.prepare(
          "INSERT INTO documents (id, user_id, name, mime_type, size, r2_key, status) VALUES (?, ?, ?, ?, ?, ?, 'processing')"
        ).bind(documentId, authCtx.userId, fileName, mimeType, buffer.byteLength, r2Key, "processing").run()

        const jobIds = await createPendingJobs(env.DB, documentId, authCtx.userId)
        execCtx.waitUntil(runPipelineAsync(documentId, { file: buffer, fileName, mimeType, fileSize: buffer.byteLength }, env, authCtx.userId, jobIds))

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

        const doc = await env.DB.prepare(
          "SELECT id, name, r2_key FROM documents WHERE id = ? AND user_id = ?"
        ).bind(docId, authCtx.userId).first<{ id: string; name: string; r2_key: string }>()

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        // Delete from R2, Vectorize, D1 (chunks cascade, jobs cascade)
        await env.STORAGE.delete(doc.r2_key)
        const chunkIds = await env.DB.prepare(
          "SELECT id FROM chunks WHERE document_id = ?"
        ).bind(docId).all<{ id: string }>()
        const vectorIds = (chunkIds.results ?? []).map((c) => c.id)
        if (vectorIds.length > 0) {
          await env.VECTOR_INDEX.deleteByIds(vectorIds)
        }
        await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(docId).run()

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

        const doc = await env.DB.prepare(
          "SELECT id, name, status FROM documents WHERE id = ? AND user_id = ?"
        ).bind(docId, authCtx.userId).first<{ id: string; name: string; status: string }>()

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

        const chunks = await env.DB.prepare(
          "SELECT content, chunk_index, token_count FROM chunks WHERE document_id = ? ORDER BY chunk_index"
        ).bind(docId).all<{ content: string; chunk_index: number; token_count: number | null }>()

        const fullText = (chunks.results ?? []).map((c) => c.content).join("\n\n")
        const chunkCount = chunks.results?.length ?? 0

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

        const doc = await env.DB.prepare(
          "SELECT id, name, status FROM documents WHERE id = ? AND user_id = ?"
        ).bind(docId, authCtx.userId).first<{ id: string; name: string; status: string }>()

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        // Get all chunks for this document
        const chunks = await env.DB.prepare(
          "SELECT content FROM chunks WHERE document_id = ? ORDER BY chunk_index"
        ).bind(docId).all<{ content: string }>()

        const context = (chunks.results ?? []).map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")

        // Ask LLM with document context
        const answer = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
          messages: [
            { role: "system", content: `Answer the question using ONLY the provided document context. Document: "${doc.name}". If the answer is not in the context, say so. Answer in the user's language.` },
            { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
          ],
          max_tokens: 1024,
        }) as { response?: string }

        return makeResult(req.id, {
          content: [{ type: "text", text: `**${doc.name}** — ${question}\n\n${answer.response ?? "No answer generated."}` }],
        })
      }

      case "get_stats": {
        const docs = await env.DB.prepare(
          "SELECT status, COUNT(*) as cnt FROM documents WHERE user_id = ? GROUP BY status"
        ).bind(authCtx.userId).all<{ status: string; cnt: number }>()

        const chunkCount = await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM chunks WHERE user_id = ?"
        ).bind(authCtx.userId).first<{ cnt: number }>()

        const totalSize = await env.DB.prepare(
          "SELECT COALESCE(SUM(size), 0) as total FROM documents WHERE user_id = ?"
        ).bind(authCtx.userId).first<{ total: number }>()

        const statusMap: Record<string, number> = {}
        let totalDocs = 0
        for (const row of (docs.results ?? [])) {
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
        const shareId = crypto.randomUUID().slice(0, 8)
        const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 32) + crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        const expiresAt = expiresInHours
          ? new Date(Date.now() + expiresInHours * 3600_000).toISOString()
          : null

        await env.DB.prepare(
          "INSERT INTO shares (id, owner_id, share_token, scope, permission, expires_at) VALUES (?, ?, ?, 'all', ?, ?)"
        ).bind(shareId, authCtx.userId, shareToken, permission, expiresAt).run()

        const shareUrl = `https://contexter.nopoint.workers.dev/sse?share=${shareToken}`

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

        const doc = await env.DB.prepare(
          "SELECT id, name, status FROM documents WHERE id = ? AND user_id = ?"
        ).bind(docId, authCtx.userId).first<{ id: string; name: string; status: string }>()

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

        const chunks = await env.DB.prepare(
          "SELECT content FROM chunks WHERE document_id = ? ORDER BY chunk_index"
        ).bind(docId).all<{ content: string }>()

        const fullText = (chunks.results ?? []).map((c) => c.content).join("\n\n")
        // Truncate to ~6000 tokens for LLM context
        const truncated = fullText.slice(0, 24000)

        const summary = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
          messages: [
            { role: "system", content: "Create a concise summary of the document. Include key points, main topics, and important details. Answer in the same language as the document." },
            { role: "user", content: truncated },
          ],
          max_tokens: 1024,
        }) as { response?: string }

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
        const newName = (args.newName as string ?? "").trim()
        if (!docId || !newName) {
          return makeResult(req.id, {
            content: [{ type: "text", text: "documentId and newName are required" }],
            isError: true,
          })
        }

        const doc = await env.DB.prepare(
          "SELECT id, name FROM documents WHERE id = ? AND user_id = ?"
        ).bind(docId, authCtx.userId).first<{ id: string; name: string }>()

        if (!doc) {
          return makeResult(req.id, {
            content: [{ type: "text", text: `Document not found: ${docId}` }],
            isError: true,
          })
        }

        await env.DB.prepare(
          "UPDATE documents SET name = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(newName, docId).run()

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

async function handleClientRegister(req: JsonRpcRequest, env: Env): Promise<JsonRpcResponse> {
  const clientName = (req.params?.client_name as string | undefined) ?? "unknown"
  const redirectUris = (req.params?.redirect_uris as string[] | undefined) ?? []

  const clientId = `contexter-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
  const clientSecret = crypto.randomUUID().replace(/-/g, "")

  // Store in KV for 24h — stateless validation optional, but preserves the record
  await env.KV.put(
    `oauth_client:${clientId}`,
    JSON.stringify({ clientId, clientSecret, clientName, redirectUris }),
    { expirationTtl: 86400 }
  )

  return makeResult(req.id, {
    client_id: clientId,
    client_secret: clientSecret,
    client_name: clientName,
    redirect_uris: redirectUris,
  })
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

function sseResponse(data: JsonRpcResponse | JsonRpcResponse[], sessionId: string | null): Response {
  const items = Array.isArray(data) ? data : [data]
  const body = items.map((item) => `event: message\ndata: ${JSON.stringify(item)}\n\n`).join("")
  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  }
  if (sessionId) headers["Mcp-Session-Id"] = sessionId
  return new Response(body, { headers })
}

function jsonRpcError(id: string | number | null, code: number, message: string): Response {
  const body = { jsonrpc: "2.0" as const, id, error: { code, message } }
  return new Response(`event: message\ndata: ${JSON.stringify(body)}\n\n`, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

