/**
 * Tests: GET /api/kb/[kbId]/schemas
 * Route: src/routes/api/kb/[kbId]/schemas/index.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../../helpers";

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

import { GET } from "~/routes/api/kb/[kbId]/schemas/index";

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.orderBy = vi.fn().mockReturnValue(c);
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

const SCHEMA_ROWS = [
  { id: "s1", name: "Invoice", status: "confirmed", projectId: "kb-001", tenantId: TEST_TENANT_ID },
  { id: "s2", name: "Contract", status: "draft", projectId: "kb-001", tenantId: TEST_TENANT_ID },
];

function makeAuthEvent(url: string, kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId },
    request: { method: "GET", url },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb/[kbId]/schemas ────────────────────────────────────────────────

describe("GET /api/kb/[kbId]/schemas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with all schemas", async () => {
    mockDb.select.mockReturnValue(selectChain(SCHEMA_ROWS));

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/schemas");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
  });

  it("returns 200 with empty array when no schemas", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/schemas");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it("filters by status when provided as query param", async () => {
    const chain = selectChain([SCHEMA_ROWS[0]]); // only confirmed
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent(
      "https://harkly.local/api/kb/kb-001/schemas?status=confirmed",
    );
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    // where() is called once (status condition appended to base conditions)
    expect(chain.where).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: { method: "GET", url: "https://harkly.local/api/kb/kb-001/schemas" },
    });
    const response = await GET(event as any);

    expect(response.status).toBe(401);
  });

  it("propagates D1 errors", async () => {
    const chain = selectChain([]);
    chain.all = vi.fn().mockRejectedValue(new Error("D1 timeout"));
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent("https://harkly.local/api/kb/kb-001/schemas");
    await expect(GET(event as any)).rejects.toThrow("D1 timeout");
  });
});
