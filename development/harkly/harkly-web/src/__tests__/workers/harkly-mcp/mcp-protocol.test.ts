/**
 * Tests for workers/harkly-mcp/src/lib/mcp-protocol.ts
 *
 * Covers:
 * - handleMcpRequest: malformed JSON → parse error -32700
 * - handleMcpRequest: missing method field → invalid request -32600
 * - handleMcpRequest: wrong jsonrpc version → invalid request -32600
 * - handleMcpRequest: method=initialize → server capabilities response
 * - handleMcpRequest: method=ping → empty result
 * - handleMcpRequest: method=notifications/initialized → empty result
 * - handleMcpRequest: method=tools/list → all 6 tool definitions
 * - handleMcpRequest: method=tools/call with unknown tool → isError response
 * - handleMcpRequest: tools/call search_knowledge → calls hybridSearch
 * - handleMcpRequest: tools/call get_document → found document with chunks
 * - handleMcpRequest: tools/call get_document → not found returns error object
 * - handleMcpRequest: tools/call list_projects → returns projects array
 * - handleMcpRequest: tools/call list_sources → returns sources array
 * - handleMcpRequest: tools/call get_schema → no schemas case
 * - handleMcpRequest: tools/call get_schema → schema with fields
 * - handleMcpRequest: tools/call list_extractions → with schemaId filter
 * - handleMcpRequest: tools/call list_extractions → without schemaId
 * - handleMcpRequest: unknown method → -32601 method not found
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMcpRequest } from "../../../../workers/harkly-mcp/src/lib/mcp-protocol";
import { createMockD1Database, createMockVectorize, createMockAi } from "../../mocks/cf-env";
import type { MockD1Database } from "../../mocks/cf-env";

// Minimal Env for mcp-protocol tests
interface WorkerEnv {
  KB_DB: MockD1Database;
  VECTORIZE_INDEX: ReturnType<typeof createMockVectorize>;
  AI: ReturnType<typeof createMockAi>;
  [key: string]: unknown;
}

function makeEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    KB_DB: overrides.KB_DB ?? createMockD1Database(),
    VECTORIZE_INDEX: overrides.VECTORIZE_INDEX ?? createMockVectorize(),
    AI: overrides.AI ?? createMockAi(),
  };
}

function makeRequest(body: unknown, method = "POST"): Request {
  return new Request("https://mcp.harkly.io/mcp", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeMalformedRequest(): Request {
  return new Request("https://mcp.harkly.io/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{{not json}}",
  });
}

async function parseJsonResponse(res: Response) {
  return res.json() as Promise<any>;
}

// ── Parse / Validation errors ──────────────────────────────────────────────

describe("handleMcpRequest — parse error", () => {
  it("returns -32700 for malformed JSON body", async () => {
    const env = makeEnv();
    const res = await handleMcpRequest(makeMalformedRequest(), env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(res.status).toBe(400);
    expect(json.error.code).toBe(-32700);
    expect(json.error.message).toBe("Parse error");
    expect(json.id).toBeNull();
  });
});

describe("handleMcpRequest — invalid request", () => {
  it("returns -32600 when jsonrpc version is wrong", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "1.0", id: 1, method: "ping" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(res.status).toBe(400);
    expect(json.error.code).toBe(-32600);
  });

  it("returns -32600 when method field is missing", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 2 });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(json.error.code).toBe(-32600);
  });
});

// ── Standard protocol methods ──────────────────────────────────────────────

describe("handleMcpRequest — initialize", () => {
  it("returns protocolVersion, capabilities, and serverInfo", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 1, method: "initialize" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.jsonrpc).toBe("2.0");
    expect(json.id).toBe(1);
    expect(json.result.protocolVersion).toBe("2025-06-18");
    expect(json.result.capabilities.tools).toBeDefined();
    expect(json.result.serverInfo.name).toBe("harkly-mcp");
    expect(json.result.serverInfo.version).toBe("0.1.0");
  });
});

describe("handleMcpRequest — ping", () => {
  it("returns empty result object", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: "ping-1", method: "ping" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.id).toBe("ping-1");
    expect(json.result).toEqual({});
  });
});

describe("handleMcpRequest — notifications/initialized", () => {
  it("returns empty result without error", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 5, method: "notifications/initialized" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(json.result).toEqual({});
    expect(json.error).toBeUndefined();
  });
});

describe("handleMcpRequest — tools/list", () => {
  it("returns all 6 tool definitions", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.result.tools).toHaveLength(6);
    const names = json.result.tools.map((t: any) => t.name);
    expect(names).toContain("search_knowledge");
    expect(names).toContain("get_document");
    expect(names).toContain("list_projects");
    expect(names).toContain("list_sources");
    expect(names).toContain("get_schema");
    expect(names).toContain("list_extractions");
  });

  it("each tool definition has name, description, and inputSchema", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 3, method: "tools/list" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    for (const tool of json.result.tools) {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });
});

describe("handleMcpRequest — unknown method", () => {
  it("returns -32601 method not found", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 99, method: "nonexistent/method" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.error.code).toBe(-32601);
    expect(json.error.message).toContain("nonexistent/method");
    expect(json.id).toBe(99);
  });
});

// ── tools/call dispatch ────────────────────────────────────────────────────

describe("handleMcpRequest — tools/call with unknown tool", () => {
  it("returns isError=true with error content for unknown tool name", async () => {
    const env = makeEnv();
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: { name: "nonexistent_tool", arguments: {} },
    });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.result.isError).toBe(true);
    const content = JSON.parse(json.result.content[0].text);
    expect(content.error).toContain("nonexistent_tool");
  });
});

describe("handleMcpRequest — tools/call: search_knowledge", () => {
  it("dispatches to hybridSearch and returns content array", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: { name: "search_knowledge", arguments: { query: "test query", limit: 5 } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.error).toBeUndefined();
    expect(json.result.content).toHaveLength(1);
    expect(json.result.content[0].type).toBe("text");
    const data = JSON.parse(json.result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("handleMcpRequest — tools/call: get_document — found", () => {
  it("returns document with chunks when source exists", async () => {
    const sourceRow = { id: "doc-1", title: "My Doc", type: "pdf", status: "ready", created_at: "2024-01-01" };
    const chunkRows = [
      { id: "ch-1", content: "Chunk one", chunk_index: 0 },
      { id: "ch-2", content: "Chunk two", chunk_index: 1 },
    ];

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      const stmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(() => {
          if (currentCall === 1) return Promise.resolve(sourceRow);
          return Promise.resolve(null);
        }),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 2) {
            return Promise.resolve({ results: chunkRows, success: true, meta: {} });
          }
          return Promise.resolve({ results: [], success: true, meta: {} });
        }),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
      return stmt;
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: { name: "get_document", arguments: { id: "doc-1" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);

    expect(json.error).toBeUndefined();
    const data = JSON.parse(json.result.content[0].text);
    expect(data.document.id).toBe("doc-1");
    expect(data.document.title).toBe("My Doc");
    expect(data.chunks).toHaveLength(2);
  });
});

describe("handleMcpRequest — tools/call: get_document — not found", () => {
  it("returns error object in content when source not found", async () => {
    const db = createMockD1Database();
    // first() returns null → document not found
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    };
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue(stmt);

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: { name: "get_document", arguments: { id: "ghost-doc" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.error).toBe("Document not found");
  });
});

describe("handleMcpRequest — tools/call: list_projects", () => {
  it("returns projects array from DB", async () => {
    const projects = [
      { id: "kb-1", title: "KB One", description: "Desc 1", created_at: "2024-01-01" },
      { id: "kb-2", title: "KB Two", description: "Desc 2", created_at: "2024-01-02" },
    ];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: projects, success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: { name: "list_projects", arguments: {} },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.projects).toHaveLength(2);
    expect(data.projects[0].id).toBe("kb-1");
  });
});

describe("handleMcpRequest — tools/call: list_sources", () => {
  it("returns sources for given kbId", async () => {
    const sources = [
      { id: "src-1", title: "Source 1", type: "pdf", status: "ready", created_at: "2024-01-01" },
    ];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: sources, success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 15,
      method: "tools/call",
      params: { name: "list_sources", arguments: { kbId: "kb-1" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.sources).toHaveLength(1);
    expect(data.sources[0].id).toBe("src-1");
  });
});

describe("handleMcpRequest — tools/call: get_schema — no schemas", () => {
  it("returns empty schemas and empty fields when no schemas exist", async () => {
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 16,
      method: "tools/call",
      params: { name: "get_schema", arguments: { kbId: "kb-1" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.schemas).toEqual([]);
    expect(data.fields).toEqual([]);
  });
});

describe("handleMcpRequest — tools/call: get_schema — with schemas and fields", () => {
  it("fetches fields when schema exists", async () => {
    const schemaRows = [{ id: "schema-1", name: "Person", status: "active" }];
    const fieldRows = [
      { id: "f-1", name: "name", type: "string", description: "Full name", required: true },
      { id: "f-2", name: "age", type: "number", description: "Age", required: false },
    ];

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            return Promise.resolve({ results: schemaRows, success: true, meta: {} });
          }
          return Promise.resolve({ results: fieldRows, success: true, meta: {} });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 17,
      method: "tools/call",
      params: { name: "get_schema", arguments: { kbId: "kb-1" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.schemas).toHaveLength(1);
    expect(data.schemas[0].id).toBe("schema-1");
    expect(data.fields).toHaveLength(2);
    expect(data.fields[0].name).toBe("name");
  });
});

describe("handleMcpRequest — tools/call: list_extractions without schemaId", () => {
  it("returns all extractions without schema filter", async () => {
    const extractions = [
      { id: "e-1", data: "{}", confidence: 0.9, source_chunk_id: "ch-1", created_at: "2024-01-01" },
    ];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: extractions, success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 18,
      method: "tools/call",
      params: { name: "list_extractions", arguments: { kbId: "kb-1" } },
    });

    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    const data = JSON.parse(json.result.content[0].text);
    expect(data.extractions).toHaveLength(1);
    expect(data.total).toBe(1);
  });
});

describe("handleMcpRequest — tools/call: list_extractions with schemaId", () => {
  it("includes schemaId in bind parameters when provided", async () => {
    const db = createMockD1Database();
    const bindSpy = vi.fn().mockReturnThis();
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      bind: bindSpy,
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db });
    const req = makeRequest({
      jsonrpc: "2.0",
      id: 19,
      method: "tools/call",
      params: { name: "list_extractions", arguments: { kbId: "kb-1", schemaId: "schema-99" } },
    });

    await handleMcpRequest(req, env as any, "user-1");

    const allBindArgs = bindSpy.mock.calls.flat();
    expect(allBindArgs).toContain("schema-99");
  });
});

describe("handleMcpRequest — response structure", () => {
  it("always has jsonrpc: '2.0' field", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: 100, method: "ping" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(json.jsonrpc).toBe("2.0");
  });

  it("id is echoed from request", async () => {
    const env = makeEnv();
    const req = makeRequest({ jsonrpc: "2.0", id: "string-id-42", method: "ping" });
    const res = await handleMcpRequest(req, env as any, "user-1");
    const json = await parseJsonResponse(res);
    expect(json.id).toBe("string-id-42");
  });
});
