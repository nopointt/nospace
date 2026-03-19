/**
 * Tests: GET /api/kb/[kbId]/sources
 * Route: src/routes/api/kb/[kbId]/sources.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb = {
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

function buildSelectChain(result: any[]) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.all = vi.fn().mockResolvedValue(result);
  return chain;
}

import { GET } from "~/routes/api/kb/[kbId]/sources";

function makeAuthEvent(params = {}, overrides: any = {}) {
  const event = createMockEvent({ params: { kbId: "kb-001", ...params }, ...overrides });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb/[kbId]/sources ────────────────────────────────────────────────

describe("GET /api/kb/[kbId]/sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with sources array", async () => {
    const rows = [
      { id: "src-1", title: "doc.pdf", type: "pdf", projectId: "kb-001", tenantId: TEST_TENANT_ID },
      { id: "src-2", title: "data.csv", type: "csv", projectId: "kb-001", tenantId: TEST_TENANT_ID },
    ];
    mockDb.select.mockReturnValue(buildSelectChain(rows));

    const event = makeAuthEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(rows);
  });

  it("returns 200 with empty array when no sources", async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const event = makeAuthEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({ params: { kbId: "kb-001" } });
    const response = await GET(event as any);

    expect(response.status).toBe(401);
  });

  it("uses kbId from route params in the query", async () => {
    const chain = buildSelectChain([]);
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent({ kbId: "kb-specific-id" });
    await GET(event as any);

    // .where() must have been called (filtering by projectId + tenantId)
    expect(chain.where).toHaveBeenCalledTimes(1);
  });

  it("propagates D1 errors", async () => {
    const chain = buildSelectChain([]);
    chain.all = vi.fn().mockRejectedValue(new Error("D1 connection lost"));
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent();
    await expect(GET(event as any)).rejects.toThrow("D1 connection lost");
  });
});
