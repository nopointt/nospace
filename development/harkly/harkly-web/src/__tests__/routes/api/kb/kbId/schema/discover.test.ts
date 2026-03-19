/**
 * Tests: POST /api/kb/[kbId]/schema/discover
 * Route: src/routes/api/kb/[kbId]/schema/discover.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { createMockAi } from "~/__tests__/mocks/cf-env";
import { TEST_TENANT_ID } from "../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
  insert: vi.fn(),
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

import { POST } from "~/routes/api/kb/[kbId]/schema/discover";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.limit = vi.fn().mockReturnValue(c);
  c.orderBy = vi.fn().mockReturnValue(c);
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

function insertChain() {
  return { values: vi.fn().mockResolvedValue({ success: true }) };
}

const CHUNKS = [
  { id: "c1", projectId: "kb-001", content: "Invoice from Acme Corp. Amount: $500. Date: 2026-01-15.", chunkIndex: 0 },
  { id: "c2", projectId: "kb-001", content: "Contract between parties. Signed on 2026-02-01.", chunkIndex: 1 },
];

const AI_FIELDS = [
  { name: "amount", type: "number", description: "Invoice amount", required: true },
  { name: "vendor", type: "string", description: "Vendor name", required: true },
  { name: "date", type: "date", description: "Document date", required: false },
];

const STORED_FIELDS = AI_FIELDS.map((f, i) => ({
  id: `sf-${i}`,
  schemaId: "new-schema-id",
  ...f,
  sortOrder: i,
  required: f.required ? 1 : 0,
  enumValues: null,
}));

function makeAuthEvent(kbId = "kb-001") {
  const ai = createMockAi();
  ai.run.mockResolvedValue({ response: JSON.stringify(AI_FIELDS) });

  const event = createMockEvent({
    params: { kbId },
    env: { AI: ai },
    request: {
      method: "POST",
      url: `https://harkly.local/api/kb/${kbId}/schema/discover`,
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── POST /api/kb/[kbId]/schema/discover ──────────────────────────────────────

describe("POST /api/kb/[kbId]/schema/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with schema id, name, status=draft, and fields array", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain(CHUNKS))         // sample chunks
      .mockReturnValueOnce(selectChain(STORED_FIELDS)); // stored fields after insert

    mockDb.insert.mockReturnValue(insertChain());

    const event = makeAuthEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Обнаруженная схема");
    expect(body.data.status).toBe("draft");
    expect(Array.isArray(body.data.fields)).toBe(true);
  });

  it("returns 400 when no document chunks exist in the KB", async () => {
    mockDb.select.mockReturnValueOnce(selectChain([]));

    const event = makeAuthEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/документ/i);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: { method: "POST", url: "https://harkly.local/api/kb/kb-001/schema/discover" },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(401);
  });

  it("returns 500 when AI returns unparseable JSON", async () => {
    const ai = createMockAi();
    ai.run.mockResolvedValue({ response: "I cannot determine the schema here" });

    mockDb.select.mockReturnValueOnce(selectChain(CHUNKS));

    const event = makeAuthEvent();
    (event.context.bindings as any).AI = ai;
    (event.context.cloudflare.env as any).AI = ai;
    (event.nativeEvent.context.cloudflare.env as any).AI = ai;

    const response = await POST(event as any);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/AI/i);
  });

  it("returns 500 when AI returns an empty array", async () => {
    const ai = createMockAi();
    ai.run.mockResolvedValue({ response: "[]" });

    mockDb.select.mockReturnValueOnce(selectChain(CHUNKS));

    const event = makeAuthEvent();
    (event.context.bindings as any).AI = ai;
    (event.context.cloudflare.env as any).AI = ai;
    (event.nativeEvent.context.cloudflare.env as any).AI = ai;

    const response = await POST(event as any);

    expect(response.status).toBe(500);
  });

  it("inserts a schema row and one field row per AI field", async () => {
    const ins = insertChain();
    mockDb.insert.mockReturnValue(ins);

    mockDb.select
      .mockReturnValueOnce(selectChain(CHUNKS))
      .mockReturnValueOnce(selectChain(STORED_FIELDS));

    const event = makeAuthEvent();
    const response = await POST(event as any);

    // 1 schema insert + N field inserts (N = AI_FIELDS.length)
    expect(mockDb.insert).toHaveBeenCalledTimes(1 + AI_FIELDS.length);
    expect(response.status).toBe(200);
  });

  it("strips markdown fences from AI response before parsing", async () => {
    const ai = createMockAi();
    ai.run.mockResolvedValue({
      response: "```json\n" + JSON.stringify(AI_FIELDS) + "\n```",
    });

    mockDb.select
      .mockReturnValueOnce(selectChain(CHUNKS))
      .mockReturnValueOnce(selectChain(STORED_FIELDS));
    mockDb.insert.mockReturnValue(insertChain());

    const event = makeAuthEvent();
    (event.context.bindings as any).AI = ai;
    (event.context.cloudflare.env as any).AI = ai;
    (event.nativeEvent.context.cloudflare.env as any).AI = ai;

    const response = await POST(event as any);

    expect(response.status).toBe(200);
  });
});
