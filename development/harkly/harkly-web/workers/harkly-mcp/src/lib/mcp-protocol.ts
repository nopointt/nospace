import { z } from "zod";
import type { Env } from "./types";
import { hybridSearch } from "./search";

/**
 * MCP JSON-RPC protocol handler for Cloudflare Workers.
 * Implements MCP spec 2025-06-18 (Streamable HTTP transport).
 *
 * Supported methods:
 * - initialize → server capabilities
 * - tools/list → tool definitions
 * - tools/call → execute tool
 * - ping → pong
 */

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// ── Tool Definitions ────────────────────────────────────────

const TOOLS: ToolDefinition[] = [
  {
    name: "search_knowledge",
    description: "Semantic + full-text hybrid search across knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query", minLength: 1, maxLength: 500 },
        limit: { type: "number", description: "Max results (1-50)", default: 10 },
        kbId: { type: "string", description: "Scope to specific knowledge base" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_document",
    description: "Get a document with its chunks",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Document ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_projects",
    description: "List user's knowledge bases",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_sources",
    description: "List sources in a knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        kbId: { type: "string", description: "Knowledge base ID" },
      },
      required: ["kbId"],
    },
  },
  {
    name: "get_schema",
    description: "Get schema fields for a knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        kbId: { type: "string", description: "Knowledge base ID" },
      },
      required: ["kbId"],
    },
  },
  {
    name: "list_extractions",
    description: "List extracted structured data from a knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        kbId: { type: "string", description: "Knowledge base ID" },
        schemaId: { type: "string", description: "Filter by schema ID" },
      },
      required: ["kbId"],
    },
  },
];

// ── Request Handler ─────────────────────────────────────────

export async function handleMcpRequest(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  let body: JsonRpcRequest;
  try {
    body = await request.json() as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return jsonRpcError(body.id ?? null, -32600, "Invalid request");
  }

  switch (body.method) {
    case "initialize":
      return handleInitialize(body.id);

    case "notifications/initialized":
      return jsonRpcResult(body.id, {});

    case "ping":
      return jsonRpcResult(body.id, {});

    case "tools/list":
      return handleToolsList(body.id);

    case "tools/call":
      return handleToolsCall(body.id, body.params ?? {}, env, userId);

    default:
      return jsonRpcError(body.id, -32601, `Method not found: ${body.method}`);
  }
}

// ── Method Handlers ─────────────────────────────────────────

function handleInitialize(id: string | number): Response {
  return jsonRpcResult(id, {
    protocolVersion: "2025-06-18",
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: "harkly-mcp",
      version: "0.1.0",
    },
  });
}

function handleToolsList(id: string | number): Response {
  return jsonRpcResult(id, {
    tools: TOOLS,
  });
}

async function handleToolsCall(
  id: string | number,
  params: Record<string, unknown>,
  env: Env,
  userId: string,
): Promise<Response> {
  const toolName = params.name as string;
  const args = (params.arguments ?? {}) as Record<string, unknown>;

  try {
    const result = await executeTool(toolName, args, env, userId);
    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(result) }],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool execution failed";
    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    });
  }
}

// ── Tool Execution ──────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  env: Env,
  userId: string,
): Promise<unknown> {
  switch (name) {
    case "search_knowledge":
      return hybridSearch(
        args.query as string,
        userId,
        env,
        { kbId: args.kbId as string | undefined, limit: (args.limit as number) ?? 10 },
      );

    case "get_document": {
      const source = await env.KB_DB.prepare(
        "SELECT id, title, type, status, created_at FROM sources WHERE id = ? AND tenant_id = ?",
      ).bind(args.id, userId).first();
      if (!source) return { error: "Document not found" };
      const chunks = await env.KB_DB.prepare(
        "SELECT id, content, chunk_index FROM document_chunks WHERE source_id = ? ORDER BY chunk_index ASC",
      ).bind(args.id).all();
      return { document: source, chunks: chunks.results };
    }

    case "list_projects": {
      const result = await env.KB_DB.prepare(
        "SELECT id, title, description, created_at FROM projects WHERE tenant_id = ?",
      ).bind(userId).all();
      return { projects: result.results };
    }

    case "list_sources": {
      const result = await env.KB_DB.prepare(
        "SELECT id, title, type, status, created_at FROM sources WHERE project_id = ? AND tenant_id = ?",
      ).bind(args.kbId, userId).all();
      return { sources: result.results };
    }

    case "get_schema": {
      const schemas = await env.KB_DB.prepare(
        "SELECT id, name, status FROM project_schemas WHERE project_id = ? AND tenant_id = ?",
      ).bind(args.kbId, userId).all();
      const fields = schemas.results.length > 0
        ? await env.KB_DB.prepare(
            "SELECT id, name, type, description, required FROM schema_fields WHERE schema_id = ?",
          ).bind(schemas.results[0].id).all()
        : { results: [] };
      return { schemas: schemas.results, fields: fields.results };
    }

    case "list_extractions": {
      let sql = "SELECT id, data, confidence, source_chunk_id, created_at FROM extracted_entities WHERE project_id = ? AND tenant_id = ?";
      const params: unknown[] = [args.kbId, userId];
      if (args.schemaId) {
        sql += " AND schema_id = ?";
        params.push(args.schemaId);
      }
      sql += " ORDER BY created_at DESC LIMIT 100";
      const result = await env.KB_DB.prepare(sql).bind(...params).all();
      return { extractions: result.results, total: result.results.length };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── JSON-RPC Helpers ────────────────────────────────────────

function jsonRpcResult(id: string | number | null, result: unknown): Response {
  return Response.json({
    jsonrpc: "2.0",
    id,
    result,
  }, {
    headers: { "Content-Type": "application/json" },
  });
}

function jsonRpcError(id: string | number | null, code: number, message: string): Response {
  return Response.json({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  }, {
    status: code === -32700 || code === -32600 ? 400 : 200,
    headers: { "Content-Type": "application/json" },
  });
}
