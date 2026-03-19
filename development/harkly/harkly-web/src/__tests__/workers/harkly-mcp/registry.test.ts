/**
 * Tests for workers/harkly-mcp/src/tools/registry.ts
 *
 * Strategy: registerTools() calls server.tool() 6 times.
 * We create a mock McpServer that captures tool registrations,
 * then invoke the captured handlers with mock env + context.
 *
 * Covers:
 * - registerTools: registers exactly 6 tools
 * - registerTools: each tool has correct name and description
 * - tool handlers: search_knowledge returns content array
 * - tool handlers: get_document found
 * - tool handlers: get_document not found returns error object
 * - tool handlers: list_projects returns projects
 * - tool handlers: list_sources returns sources
 * - tool handlers: get_schema empty
 * - tool handlers: get_schema with fields
 * - tool handlers: list_extractions without schemaId
 * - tool handlers: list_extractions with schemaId
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTools } from "../../../../workers/harkly-mcp/src/tools/registry";
import { createMockD1Database, createMockVectorize, createMockAi } from "../../mocks/cf-env";
import type { MockD1Database } from "../../mocks/cf-env";

// ── Mock McpServer ────────────────────────────────────────────────────────────

interface CapturedTool {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  handler: (input: any) => Promise<any>;
}

function createMockMcpServer() {
  const tools: CapturedTool[] = [];
  const server = {
    tool: vi.fn().mockImplementation(
      (name: string, description: string, schema: Record<string, unknown>, handler: (input: any) => Promise<any>) => {
        tools.push({ name, description, schema, handler });
      },
    ),
    _tools: tools,
  };
  return server;
}

// ── Env factory ──────────────────────────────────────────────────────────────

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

// ── registerTools — registration assertions ──────────────────────────────────

describe("registerTools — tool registration", () => {
  it("registers exactly 6 tools", () => {
    const server = createMockMcpServer();
    const env = makeEnv();
    registerTools(server as any, { userId: "user-1", env: env as any });
    expect(server._tools).toHaveLength(6);
  });

  it("registers tools with correct names", () => {
    const server = createMockMcpServer();
    const env = makeEnv();
    registerTools(server as any, { userId: "user-1", env: env as any });
    const names = server._tools.map((t) => t.name);
    expect(names).toContain("search_knowledge");
    expect(names).toContain("get_document");
    expect(names).toContain("list_projects");
    expect(names).toContain("list_sources");
    expect(names).toContain("get_schema");
    expect(names).toContain("list_extractions");
  });

  it("each tool has a non-empty description", () => {
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv() as any });
    for (const tool of server._tools) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it("search_knowledge schema has query, limit, kbId parameters", () => {
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv() as any });
    const tool = server._tools.find((t) => t.name === "search_knowledge")!;
    expect(tool.schema).toHaveProperty("query");
    expect(tool.schema).toHaveProperty("limit");
    expect(tool.schema).toHaveProperty("kbId");
  });

  it("get_document schema requires id parameter", () => {
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv() as any });
    const tool = server._tools.find((t) => t.name === "get_document")!;
    expect(tool.schema).toHaveProperty("id");
  });

  it("list_sources schema requires kbId", () => {
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv() as any });
    const tool = server._tools.find((t) => t.name === "list_sources")!;
    expect(tool.schema).toHaveProperty("kbId");
  });

  it("list_extractions schema has kbId and optional schemaId", () => {
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv() as any });
    const tool = server._tools.find((t) => t.name === "list_extractions")!;
    expect(tool.schema).toHaveProperty("kbId");
    expect(tool.schema).toHaveProperty("schemaId");
  });
});

// ── Tool handlers — execution ────────────────────────────────────────────────

describe("registerTools — search_knowledge handler", () => {
  it("returns content array with text type", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: env as any });

    const tool = server._tools.find((t) => t.name === "search_knowledge")!;
    const result = await tool.handler({ query: "test", limit: 5 });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.total).toBe("number");
  });
});

describe("registerTools — get_document handler", () => {
  it("returns document and chunks when source found", async () => {
    const sourceRow = { id: "doc-reg-1", title: "Registry Doc", type: "pdf", status: "ready", created_at: "2024-01-01" };
    const chunkRows = [{ id: "ch-r-1", content: "Chunk content", chunk_index: 0 }];

    let callIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callIndex++;
      const current = callIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(() =>
          current === 1 ? Promise.resolve(sourceRow) : Promise.resolve(null),
        ),
        all: vi.fn().mockImplementation(() =>
          Promise.resolve({ results: current === 2 ? chunkRows : [], success: true, meta: {} }),
        ),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "get_document")!;
    const result = await tool.handler({ id: "doc-reg-1" });

    const data = JSON.parse(result.content[0].text);
    expect(data.document.id).toBe("doc-reg-1");
    expect(data.chunks).toHaveLength(1);
  });

  it("returns error message when source not found", async () => {
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "get_document")!;
    const result = await tool.handler({ id: "ghost" });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe("Document not found");
  });
});

describe("registerTools — list_projects handler", () => {
  it("returns projects from DB", async () => {
    const projects = [
      { id: "p-1", title: "Project Alpha", description: "Alpha", created_at: "2024-01-01" },
      { id: "p-2", title: "Project Beta", description: "Beta", created_at: "2024-01-02" },
    ];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: projects, success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "list_projects")!;
    const result = await tool.handler({});

    const data = JSON.parse(result.content[0].text);
    expect(data.projects).toHaveLength(2);
    expect(data.projects[0].title).toBe("Project Alpha");
  });

  it("passes userId as tenantId filter to DB", async () => {
    const db = createMockD1Database();
    const bindSpy = vi.fn().mockReturnThis();
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      bind: bindSpy,
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "tenant-42", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "list_projects")!;
    await tool.handler({});

    const allBindArgs = bindSpy.mock.calls.flat();
    expect(allBindArgs).toContain("tenant-42");
  });
});

describe("registerTools — list_sources handler", () => {
  it("returns sources for the given kbId", async () => {
    const sources = [{ id: "s-1", title: "Source One", type: "text", status: "ready", created_at: "2024-01-01" }];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: sources, success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "list_sources")!;
    const result = await tool.handler({ kbId: "kb-xyz" });

    const data = JSON.parse(result.content[0].text);
    expect(data.sources).toHaveLength(1);
    expect(data.sources[0].id).toBe("s-1");
  });
});

describe("registerTools — get_schema handler", () => {
  it("returns empty schemas and fields when no schemas exist", async () => {
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "get_schema")!;
    const result = await tool.handler({ kbId: "kb-1" });

    const data = JSON.parse(result.content[0].text);
    expect(data.schemas).toEqual([]);
    expect(data.fields).toEqual([]);
  });

  it("fetches fields when schemas exist", async () => {
    const schemaRows = [{ id: "sch-1", name: "Entity", status: "active" }];
    const fieldRows = [{ id: "fld-1", name: "title", type: "string", description: "Title", required: true }];

    let callIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callIndex++;
      const current = callIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() =>
          Promise.resolve({
            results: current === 1 ? schemaRows : fieldRows,
            success: true,
            meta: {},
          }),
        ),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "get_schema")!;
    const result = await tool.handler({ kbId: "kb-1" });

    const data = JSON.parse(result.content[0].text);
    expect(data.schemas[0].id).toBe("sch-1");
    expect(data.fields[0].name).toBe("title");
  });
});

describe("registerTools — list_extractions handler", () => {
  it("returns all extractions without schemaId filter", async () => {
    const rows = [
      { id: "ext-1", data: "{}", confidence: 0.95, source_chunk_id: "ch-1", created_at: "2024-01-01" },
      { id: "ext-2", data: "{}", confidence: 0.80, source_chunk_id: "ch-2", created_at: "2024-01-02" },
    ];
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: rows, success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "list_extractions")!;
    const result = await tool.handler({ kbId: "kb-1" });

    const data = JSON.parse(result.content[0].text);
    expect(data.extractions).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it("includes schemaId in bind call when provided", async () => {
    const db = createMockD1Database();
    const bindSpy = vi.fn().mockReturnThis();
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      bind: bindSpy,
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    });

    const server = createMockMcpServer();
    registerTools(server as any, { userId: "user-1", env: makeEnv({ KB_DB: db }) as any });

    const tool = server._tools.find((t) => t.name === "list_extractions")!;
    await tool.handler({ kbId: "kb-1", schemaId: "sch-filter" });

    const allBindArgs = bindSpy.mock.calls.flat();
    expect(allBindArgs).toContain("sch-filter");
  });
});
