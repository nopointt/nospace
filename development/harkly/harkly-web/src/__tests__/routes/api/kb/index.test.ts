/**
 * Tests: GET /api/kb  and  POST /api/kb
 * Route: src/routes/api/kb/index.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb = {
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

// Drizzle chains: select().from().where().all()
function buildSelectChain(result: any[]) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.all = vi.fn().mockResolvedValue(result);
  return chain;
}

function buildInsertChain(success = true) {
  const chain: any = {};
  chain.values = vi.fn().mockResolvedValue({ success });
  return chain;
}

// Import route handlers AFTER mocks
import { GET, POST } from "~/routes/api/kb/index";

function makeAuthEvent(overrides: any = {}) {
  const event = createMockEvent(overrides);
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb ───────────────────────────────────────────────────────────────

describe("GET /api/kb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with data array on success", async () => {
    const rows = [
      { id: "kb-1", title: "My KB", tenantId: TEST_TENANT_ID },
      { id: "kb-2", title: "Another KB", tenantId: TEST_TENANT_ID },
    ];
    const chain = buildSelectChain(rows);
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(rows);
  });

  it("returns 200 with empty array when no KBs exist", async () => {
    const chain = buildSelectChain([]);
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent(); // no userId in context
    const response = await GET(event as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("propagates D1 errors as thrown exceptions", async () => {
    const chain = buildSelectChain([]);
    chain.all = vi.fn().mockRejectedValue(new Error("D1 failure"));
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent();
    await expect(GET(event as any)).rejects.toThrow("D1 failure");
  });
});

// ── POST /api/kb ──────────────────────────────────────────────────────────────

describe("POST /api/kb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates KB and returns 201 with id and title", async () => {
    const chain = buildInsertChain(true);
    mockDb.insert.mockReturnValue(chain);

    const event = makeAuthEvent({
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb",
        body: JSON.stringify({ title: "New Knowledge Base" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.title).toBe("New Knowledge Base");
  });

  it("returns 400 when title is missing", async () => {
    const event = makeAuthEvent({
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb",
        body: JSON.stringify({ description: "no title here" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Название/);
  });

  it("returns 400 when title is whitespace-only", async () => {
    const event = makeAuthEvent({
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb",
        body: JSON.stringify({ title: "   " }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb",
        body: JSON.stringify({ title: "Test" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(401);
  });

  it("trims title before inserting into DB and accepts optional description", async () => {
    const chain = buildInsertChain(true);
    mockDb.insert.mockReturnValue(chain);

    const event = makeAuthEvent({
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb",
        body: JSON.stringify({ title: "  Trimmed Title  ", description: "A description" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(201);
    // Route returns the raw title in the response body (trimming only applied to DB insert)
    const body = await response.json();
    expect(body.data.id).toBeDefined();
    // Verify the DB insert used the trimmed value
    const inserted = chain.values.mock.calls[0][0];
    expect(inserted.title).toBe("Trimmed Title");
    expect(inserted.description).toBe("A description");
  });
});
