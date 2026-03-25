import { Hono } from "hono"
import type { Env } from "../types/env"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { resolveAuth, type AuthContext } from "../services/auth"

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
      const res = await handleRequest(req, c.env, authCtx)
      if (res) responses.push(res)
    }
    if (wantsSse) return sseResponse(responses, null)
    return c.json(responses)
  }

  const response = await handleRequest(body, c.env, authCtx)

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

async function handleRequest(req: JsonRpcRequest, env: Env, authCtx: AuthContext | null): Promise<JsonRpcResponse | null> {
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
      return handleToolCall(req, env, authCtx)

    case "client/register":
      return handleClientRegister(req, env)

    case "ping":
      return makeResult(req.id, {})

    default:
      return makeError(req.id, -32601, `Method not found: ${req.method}`)
  }
}

async function handleToolCall(req: JsonRpcRequest, env: Env, authCtx: AuthContext): Promise<JsonRpcResponse> {
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

