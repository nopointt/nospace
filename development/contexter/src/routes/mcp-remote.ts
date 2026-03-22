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
 * Handles JSON-RPC 2.0 messages per MCP spec.
 */
mcpRemote.post("/", async (c) => {
  // Resolve auth (token or share param in URL)
  const authCtx = await resolveAuth(c.env.DB, c.req.raw)

  let body: JsonRpcRequest | JsonRpcRequest[]
  try {
    body = await c.req.json()
  } catch {
    return jsonRpcError(null, -32700, "Parse error")
  }

  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = []
    for (const req of body) {
      const res = await handleRequest(req, c.env, authCtx)
      if (res) responses.push(res)
    }
    return c.json(responses)
  }

  const response = await handleRequest(body, c.env, authCtx)

  // Notifications (no id) don't get responses
  if (!response) return c.body(null, 202)

  return c.json(response)
})

// Handle GET for SSE (required by spec, we return method not allowed for now)
mcpRemote.get("/", (c) => {
  return c.text("SSE transport not implemented. Use POST.", 405)
})

// Handle DELETE for session termination
mcpRemote.delete("/", (c) => {
  return c.body(null, 200)
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
    return makeResult(req.id, {
      content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
      isError: true,
    })
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

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
