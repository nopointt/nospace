import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env } from "../lib/types";
import { hybridSearch } from "../lib/search";

interface ToolContext {
  userId: string;
  env: Env;
}

/**
 * Register all 6 MCP tools on the server.
 * Each tool receives the authenticated userId for multi-tenant D1 queries.
 */
export function registerTools(server: McpServer, ctx: ToolContext): void {
  const { userId, env } = ctx;

  // ── search_knowledge ──────────────────────────────────────
  server.tool(
    "search_knowledge",
    "Semantic + full-text hybrid search across knowledge base",
    {
      query: z.string().min(1).max(500).describe("Search query"),
      limit: z.number().int().min(1).max(50).default(10).describe("Max results"),
      kbId: z.string().optional().describe("Scope to specific knowledge base"),
    },
    async (input) => {
      const results = await hybridSearch(input.query, userId, env, {
        kbId: input.kbId,
        limit: input.limit,
      });
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ results, total: results.length }),
        }],
      };
    },
  );

  // ── get_document ──────────────────────────────────────────
  server.tool(
    "get_document",
    "Get a document with its chunks",
    {
      id: z.string().describe("Document ID"),
    },
    async (input) => {
      // Fetch source with tenant check
      const source = await env.KB_DB.prepare(
        "SELECT id, title, type, status, created_at FROM sources WHERE id = ? AND tenant_id = ?",
      )
        .bind(input.id, userId)
        .first();

      if (!source) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Document not found" }) }] };
      }

      // Fetch chunks
      const chunks = await env.KB_DB.prepare(
        "SELECT id, content, chunk_index FROM document_chunks WHERE source_id = ? ORDER BY chunk_index ASC",
      )
        .bind(input.id)
        .all();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ document: source, chunks: chunks.results }),
        }],
      };
    },
  );

  // ── list_projects ─────────────────────────────────────────
  server.tool(
    "list_projects",
    "List user's knowledge bases",
    {},
    async () => {
      const result = await env.KB_DB.prepare(
        "SELECT id, title, description, created_at FROM projects WHERE tenant_id = ?",
      )
        .bind(userId)
        .all();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ projects: result.results }),
        }],
      };
    },
  );

  // ── list_sources ──────────────────────────────────────────
  server.tool(
    "list_sources",
    "List sources in a knowledge base",
    {
      kbId: z.string().describe("Knowledge base ID"),
    },
    async (input) => {
      const result = await env.KB_DB.prepare(
        "SELECT id, title, type, status, created_at FROM sources WHERE project_id = ? AND tenant_id = ?",
      )
        .bind(input.kbId, userId)
        .all();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ sources: result.results }),
        }],
      };
    },
  );

  // ── get_schema ────────────────────────────────────────────
  server.tool(
    "get_schema",
    "Get schema fields for a knowledge base",
    {
      kbId: z.string().describe("Knowledge base ID"),
    },
    async (input) => {
      const schemas = await env.KB_DB.prepare(
        "SELECT id, name, status FROM project_schemas WHERE project_id = ? AND tenant_id = ?",
      )
        .bind(input.kbId, userId)
        .all();

      const fields = schemas.results.length > 0
        ? await env.KB_DB.prepare(
            "SELECT id, name, type, description, required FROM schema_fields WHERE schema_id = ?",
          )
            .bind(schemas.results[0].id)
            .all()
        : { results: [] };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ schemas: schemas.results, fields: fields.results }),
        }],
      };
    },
  );

  // ── list_extractions ──────────────────────────────────────
  server.tool(
    "list_extractions",
    "List extracted structured data from a knowledge base",
    {
      kbId: z.string().describe("Knowledge base ID"),
      schemaId: z.string().optional().describe("Filter by schema ID"),
    },
    async (input) => {
      let sql = "SELECT id, data, confidence, source_chunk_id, created_at FROM extracted_entities WHERE project_id = ? AND tenant_id = ?";
      const params: unknown[] = [input.kbId, userId];

      if (input.schemaId) {
        sql += " AND schema_id = ?";
        params.push(input.schemaId);
      }

      sql += " ORDER BY created_at DESC LIMIT 100";

      const result = await env.KB_DB.prepare(sql).bind(...params).all();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ extractions: result.results, total: result.results.length }),
        }],
      };
    },
  );
}
