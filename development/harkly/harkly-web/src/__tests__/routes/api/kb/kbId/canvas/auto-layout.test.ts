/**
 * Tests: POST /api/kb/[kbId]/canvas/auto-layout
 * Route: src/routes/api/kb/[kbId]/canvas/auto-layout.ts
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

// Mock entity-mapper so we test the route in isolation, not the layout algorithm
vi.mock("~/lib/canvas/entity-mapper", () => ({
  mapEntitiesToFrames: vi.fn(({ sources, schemas, entities }) => {
    // Simple stub: return one frame per source/schema/entity group
    const frames: any[] = [];
    sources.forEach((s: any) => frames.push({ id: `source-${s.id}`, module: "source-card", title: s.title, x: 0, y: 0, width: 320, height: 200, floor: 2, frameData: null }));
    schemas.forEach((sc: any) => frames.push({ id: `schema-${sc.id}`, module: "panel", title: sc.name, x: 0, y: 0, width: 320, height: 400, floor: 0, frameData: null }));
    return frames;
  }),
}));

import { POST } from "~/routes/api/kb/[kbId]/canvas/auto-layout";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

const SOURCES = [
  { id: "src-1", title: "doc.pdf", type: "pdf", status: "ready", projectId: "kb-001", tenantId: TEST_TENANT_ID },
];

const SCHEMAS = [
  { id: "schema-1", name: "Invoice", status: "confirmed", projectId: "kb-001", tenantId: TEST_TENANT_ID },
];

const ENTITIES = [
  { id: "ent-1", entityType: "Invoice", data: "{}", schemaId: "schema-1", projectId: "kb-001", tenantId: TEST_TENANT_ID },
];

function makeAuthEvent(kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId },
    request: {
      method: "POST",
      url: `https://harkly.local/api/kb/${kbId}/canvas/auto-layout`,
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── POST /api/kb/[kbId]/canvas/auto-layout ───────────────────────────────────

describe("POST /api/kb/[kbId]/canvas/auto-layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with frames array", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain(SOURCES))
      .mockReturnValueOnce(selectChain(SCHEMAS))
      .mockReturnValueOnce(selectChain(ENTITIES));

    const event = makeAuthEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data.frames)).toBe(true);
  });

  it("returns frames for sources and schemas from mapEntitiesToFrames", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain(SOURCES))
      .mockReturnValueOnce(selectChain(SCHEMAS))
      .mockReturnValueOnce(selectChain(ENTITIES));

    const event = makeAuthEvent();
    const response = await POST(event as any);

    const body = await response.json();
    // Our stub creates 1 frame per source + 1 per schema = 2 frames
    expect(body.data.frames).toHaveLength(2);
    expect(body.data.frames[0].module).toBe("source-card");
    expect(body.data.frames[1].module).toBe("panel");
  });

  it("returns 200 with empty frames when KB has no data", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain([]))  // no sources
      .mockReturnValueOnce(selectChain([]))  // no schemas
      .mockReturnValueOnce(selectChain([])); // no entities

    const event = makeAuthEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.frames).toEqual([]);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb/kb-001/canvas/auto-layout",
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(401);
  });

  it("queries sources, schemas, and entities with tenant isolation", async () => {
    const sourcesChain = selectChain(SOURCES);
    const schemasChain = selectChain(SCHEMAS);
    const entitiesChain = selectChain(ENTITIES);

    mockDb.select
      .mockReturnValueOnce(sourcesChain)
      .mockReturnValueOnce(schemasChain)
      .mockReturnValueOnce(entitiesChain);

    const event = makeAuthEvent();
    await POST(event as any);

    // All three selects must apply .where() for tenant isolation
    expect(sourcesChain.where).toHaveBeenCalledTimes(1);
    expect(schemasChain.where).toHaveBeenCalledTimes(1);
    expect(entitiesChain.where).toHaveBeenCalledTimes(1);
  });

  it("propagates D1 errors", async () => {
    const chain = selectChain([]);
    chain.all = vi.fn().mockRejectedValue(new Error("D1 read error"));
    mockDb.select.mockReturnValue(chain);

    const event = makeAuthEvent();
    await expect(POST(event as any)).rejects.toThrow("D1 read error");
  });
});
