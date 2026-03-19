/**
 * Tests: POST /api/kb/[kbId]/extract
 * Route: src/routes/api/kb/[kbId]/extract.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { createMockAi } from "~/__tests__/mocks/cf-env";
import { TEST_TENANT_ID } from "../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

vi.mock("~/lib/db", () => ({
  getBindings: vi.fn((event: any) => event.context.bindings),
  createKbDb: vi.fn(() => mockDb),
}));

vi.mock("~/lib/auth-guard", () => ({
  requireAuth: vi.fn((event: any) => {
    const userId = (event.context as any).userId;
    if (!userId) throw Response.json({ error: "Необходима авторизация" }, { status: 401 });
    return userId;
  }),
}));

import { POST } from "~/routes/api/kb/[kbId]/extract";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.orderBy = vi.fn().mockReturnValue(c);
  c.limit = vi.fn().mockResolvedValue(result); // drizzle limit returns thenable
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

function updateChain() {
  const c: any = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  return c;
}

function insertChain() {
  return { values: vi.fn().mockResolvedValue({ success: true }) };
}

const CONFIRMED_SCHEMA = {
  id: "schema-001",
  name: "Invoice",
  status: "confirmed",
  projectId: "kb-001",
  tenantId: TEST_TENANT_ID,
};

const FIELDS = [
  { id: "f1", schemaId: "schema-001", name: "amount", type: "number", description: "Total amount", required: 1, sortOrder: 0 },
];

const DOCUMENTS = [
  { id: "doc-001", projectId: "kb-001", tenantId: TEST_TENANT_ID },
];

const CHUNKS = [
  { id: "chunk-001", documentId: "doc-001", content: "Invoice total: $500", chunkIndex: 0 },
];

function makeAuthEvent(body: Record<string, any>, kbId = "kb-001") {
  const ai = createMockAi();
  ai.run.mockResolvedValue({ response: JSON.stringify({ amount: 500 }) });

  const event = createMockEvent({
    params: { kbId },
    env: { AI: ai },
    request: {
      method: "POST",
      url: `https://harkly.local/api/kb/${kbId}/extract`,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── POST /api/kb/[kbId]/extract ───────────────────────────────────────────────

describe("POST /api/kb/[kbId]/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue(insertChain());
    mockDb.update.mockReturnValue(updateChain());
  });

  it("returns 200 with runId and completion stats on success", async () => {
    // Mock select calls in order: schema lookup, fields, documents, chunks (per doc)
    mockDb.select
      .mockReturnValueOnce(selectChain([CONFIRMED_SCHEMA])) // schema verify
      .mockReturnValueOnce(selectChain(FIELDS))              // fields
      .mockReturnValueOnce(selectChain(DOCUMENTS))           // documents
      .mockReturnValueOnce(selectChain(CHUNKS));             // chunks for doc-001

    const event = makeAuthEvent({ schemaId: "schema-001" });
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.runId).toBeDefined();
    expect(body.data.status).toBe("completed");
    expect(body.data.totalItems).toBe(1);
  });

  it("returns 400 when schemaId is missing", async () => {
    const event = makeAuthEvent({});
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/schemaId/);
  });

  it("returns 400 when schema is not found or not confirmed", async () => {
    mockDb.select.mockReturnValueOnce(selectChain([])); // no schema found

    const event = makeAuthEvent({ schemaId: "schema-missing" });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/не найдена|не подтверждена/i);
  });

  it("returns 400 when there are no documents to process", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain([CONFIRMED_SCHEMA]))
      .mockReturnValueOnce(selectChain(FIELDS))
      .mockReturnValueOnce(selectChain([])); // no documents

    const event = makeAuthEvent({ schemaId: "schema-001" });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/документ/i);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb/kb-001/extract",
        body: JSON.stringify({ schemaId: "schema-001" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(401);
  });

  it("calls AI for each chunk", async () => {
    const ai = createMockAi();
    ai.run.mockResolvedValue({ response: JSON.stringify({ amount: 100 }) });

    const twoChunks = [
      { id: "c1", documentId: "doc-001", content: "chunk one text", chunkIndex: 0 },
      { id: "c2", documentId: "doc-001", content: "chunk two text", chunkIndex: 1 },
    ];

    mockDb.select
      .mockReturnValueOnce(selectChain([CONFIRMED_SCHEMA]))
      .mockReturnValueOnce(selectChain(FIELDS))
      .mockReturnValueOnce(selectChain(DOCUMENTS))
      .mockReturnValueOnce(selectChain(twoChunks));

    const event = makeAuthEvent({ schemaId: "schema-001" });
    // Inject the AI mock
    (event.context.bindings as any).AI = ai;
    (event.context.cloudflare.env as any).AI = ai;
    (event.nativeEvent.context.cloudflare.env as any).AI = ai;

    await POST(event as any);

    expect(ai.run).toHaveBeenCalledTimes(2);
  });

  it("skips chunks where AI returns unparseable JSON", async () => {
    const ai = createMockAi();
    ai.run.mockResolvedValue({ response: "not-valid-json" });

    mockDb.select
      .mockReturnValueOnce(selectChain([CONFIRMED_SCHEMA]))
      .mockReturnValueOnce(selectChain(FIELDS))
      .mockReturnValueOnce(selectChain(DOCUMENTS))
      .mockReturnValueOnce(selectChain(CHUNKS));

    const event = makeAuthEvent({ schemaId: "schema-001" });
    (event.context.bindings as any).AI = ai;
    (event.context.cloudflare.env as any).AI = ai;
    (event.nativeEvent.context.cloudflare.env as any).AI = ai;

    const response = await POST(event as any);

    // Should still complete — unparseable chunks are skipped gracefully
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe("completed");
  });
});
