/**
 * Tests: GET /api/kb/[kbId]/canvas
 *        PUT /api/kb/[kbId]/canvas
 * Route: src/routes/api/kb/[kbId]/canvas/index.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
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

import { GET, PUT } from "~/routes/api/kb/[kbId]/canvas/index";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.all = vi.fn().mockResolvedValue(result);
  c.get = vi.fn().mockResolvedValue(result[0] ?? undefined);
  return c;
}

function deleteChain() {
  return { where: vi.fn().mockResolvedValue({ rowsAffected: 1 }) };
}

function insertChain() {
  return { values: vi.fn().mockResolvedValue({ success: true }) };
}

function updateChain() {
  const c: any = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  return c;
}

const FRAMES = [
  {
    id: "frame-001",
    projectId: "kb-001",
    tenantId: TEST_TENANT_ID,
    module: "source-card",
    title: "doc.pdf",
    x: 40,
    y: 40,
    width: 320,
    height: 200,
    zIndex: 0,
    minimized: 0,
    floor: 2,
    frameData: null,
  },
];

const VIEWPORT = {
  id: "vp-001",
  projectId: "kb-001",
  tenantId: TEST_TENANT_ID,
  floor: 0,
  panX: 0,
  panY: 0,
  zoom: 1.0,
};

function makeAuthEvent(method: string, body?: any, kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId },
    request: {
      method,
      url: `https://harkly.local/api/kb/${kbId}/canvas`,
      ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb/[kbId]/canvas ─────────────────────────────────────────────────

describe("GET /api/kb/[kbId]/canvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with frames and viewport", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain(FRAMES))       // canvasFrames
      .mockReturnValueOnce(selectChain([VIEWPORT]));  // canvasViewports

    const event = makeAuthEvent("GET");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.frames).toHaveLength(1);
    expect(body.data.viewport).toEqual(VIEWPORT);
  });

  it("returns null viewport when none exists", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain(FRAMES))
      .mockReturnValueOnce(selectChain([])); // no viewport rows

    const event = makeAuthEvent("GET");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewport).toBeNull();
  });

  it("returns 200 with empty frames and null viewport for fresh canvas", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([]));

    const event = makeAuthEvent("GET");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.frames).toEqual([]);
    expect(body.data.viewport).toBeNull();
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({ params: { kbId: "kb-001" } });
    const response = await GET(event as any);

    expect(response.status).toBe(401);
  });
});

// ── PUT /api/kb/[kbId]/canvas ─────────────────────────────────────────────────

describe("PUT /api/kb/[kbId]/canvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.delete.mockReturnValue(deleteChain());
    mockDb.insert.mockReturnValue(insertChain());
    mockDb.update.mockReturnValue(updateChain());
  });

  it("returns 200 ok:true on success", async () => {
    // For viewport upsert check — no existing viewport
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeAuthEvent("PUT", {
      frames: [{ id: "f1", module: "panel", title: "Schema", x: 0, y: 0, width: 320, height: 400 }],
      viewport: { panX: 10, panY: 20, zoom: 1.5 },
    });
    const response = await PUT(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("deletes existing frames before inserting new ones", async () => {
    mockDb.select.mockReturnValue(selectChain([]));
    const del = deleteChain();
    mockDb.delete.mockReturnValue(del);

    const event = makeAuthEvent("PUT", {
      frames: [{ id: "f1", module: "panel", title: "T", x: 0, y: 0, width: 320, height: 400 }],
    });
    await PUT(event as any);

    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it("skips frame insert when frames array is empty", async () => {
    mockDb.select.mockReturnValue(selectChain([]));
    const ins = insertChain();
    mockDb.insert.mockReturnValue(ins);

    const event = makeAuthEvent("PUT", { frames: [] });
    await PUT(event as any);

    // delete called (to clear), but insert NOT called (empty array)
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("upserts viewport — inserts when none exists", async () => {
    mockDb.select.mockReturnValue(selectChain([])); // no existing viewport
    const ins = insertChain();
    mockDb.insert.mockReturnValue(ins);

    const event = makeAuthEvent("PUT", {
      viewport: { panX: 5, panY: 10, zoom: 2.0 },
    });
    await PUT(event as any);

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    const inserted = ins.values.mock.calls[0][0];
    expect(inserted.panX).toBe(5);
    expect(inserted.zoom).toBe(2.0);
  });

  it("upserts viewport — updates when one exists", async () => {
    mockDb.select.mockReturnValue(selectChain([VIEWPORT])); // existing viewport
    const upd = updateChain();
    mockDb.update.mockReturnValue(upd);

    const event = makeAuthEvent("PUT", {
      viewport: { panX: 100, panY: 200, zoom: 0.5 },
    });
    await PUT(event as any);

    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(upd.set).toHaveBeenCalledWith(
      expect.objectContaining({ panX: 100, panY: 200, zoom: 0.5 }),
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: {
        method: "PUT",
        url: "https://harkly.local/api/kb/kb-001/canvas",
        body: JSON.stringify({ frames: [] }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await PUT(event as any);

    expect(response.status).toBe(401);
  });

  it("handles body with no frames or viewport gracefully", async () => {
    const event = makeAuthEvent("PUT", {});
    const response = await PUT(event as any);

    expect(response.status).toBe(200);
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
