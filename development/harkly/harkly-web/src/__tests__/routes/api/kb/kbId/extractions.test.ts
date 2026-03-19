/**
 * Tests: GET /api/kb/[kbId]/extractions
 * Route: src/routes/api/kb/[kbId]/extractions.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
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

import { GET } from "~/routes/api/kb/[kbId]/extractions";

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.orderBy = vi.fn().mockReturnValue(c);
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

const ENTITY_ROWS = [
  {
    id: "ent-1",
    projectId: "kb-001",
    tenantId: TEST_TENANT_ID,
    schemaId: "schema-001",
    entityType: "Invoice",
    data: JSON.stringify({ amount: 500, vendor: "Acme" }),
    confidence: 0.75,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ent-2",
    projectId: "kb-001",
    tenantId: TEST_TENANT_ID,
    schemaId: "schema-001",
    entityType: "Invoice",
    data: JSON.stringify({ amount: 300, vendor: "Beta" }),
    confidence: 0.9,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

function makeAuthEvent(url: string, kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId },
    request: { method: "GET", url },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb/[kbId]/extractions ────────────────────────────────────────────

describe("GET /api/kb/[kbId]/extractions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with entity rows as JSON", async () => {
    mockDb.select.mockReturnValue(selectChain(ENTITY_ROWS));

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/extractions");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe("ent-1");
  });

  it("returns 200 with empty array when no entities", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/extractions");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it("filters by schemaId when provided as query param", async () => {
    const chain = selectChain(ENTITY_ROWS);
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent(
      "https://harkly.local/api/kb/kb-001/extractions?schemaId=schema-001",
    );
    await GET(event as any);

    // where() should have been called with the additional schemaId condition
    expect(chain.where).toHaveBeenCalledTimes(1);
  });

  it("returns CSV when format=csv is requested", async () => {
    mockDb.select.mockReturnValue(selectChain(ENTITY_ROWS));

    const event = makeAuthEvent(
      "https://harkly.local/api/kb/kb-001/extractions?format=csv",
    );
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    const text = await response.text();
    expect(text).toContain("amount");
    expect(text).toContain("vendor");
  });

  it("returns 404 for CSV export when no rows exist", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeAuthEvent(
      "https://harkly.local/api/kb/kb-001/extractions?format=csv",
    );
    const response = await GET(event as any);

    expect(response.status).toBe(404);
  });

  it("CSV includes id and confidence columns", async () => {
    mockDb.select.mockReturnValue(selectChain(ENTITY_ROWS));

    const event = makeAuthEvent(
      "https://harkly.local/api/kb/kb-001/extractions?format=csv",
    );
    const response = await GET(event as any);
    const text = await response.text();

    const headerLine = text.split("\n")[0];
    expect(headerLine).toContain("id");
    expect(headerLine).toContain("confidence");
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: { method: "GET", url: "https://harkly.local/api/kb/kb-001/extractions" },
    });
    const response = await GET(event as any);

    expect(response.status).toBe(401);
  });

  it("propagates D1 errors", async () => {
    const chain = selectChain([]);
    chain.all = vi.fn().mockRejectedValue(new Error("DB timeout"));
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/extractions");
    await expect(GET(event as any)).rejects.toThrow("DB timeout");
  });
});
