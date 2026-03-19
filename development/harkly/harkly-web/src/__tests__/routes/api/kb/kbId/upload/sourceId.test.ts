/**
 * Tests: PUT /api/kb/[kbId]/upload/[sourceId]  (finalize / proxy upload)
 * Route: src/routes/api/kb/[kbId]/upload/[sourceId].ts
 *
 * NOTE: This route has NO requireAuth call — known security gap.
 * Tests document the current (unauthenticated) behavior.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { createMockR2Bucket } from "~/__tests__/mocks/cf-env";
import { TEST_TENANT_ID } from "../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockSelectChain = {
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};

const mockUpdateChain = {
  set: vi.fn(),
  where: vi.fn(),
};

const mockInsertChain = {
  values: vi.fn().mockResolvedValue({ success: true }),
};

const mockDb: any = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};

vi.mock("~/lib/db", () => ({
  getBindings: vi.fn((event: any) => event.context.bindings),
  createKbDb: vi.fn(() => mockDb),
}));

// No auth mock needed — route does not call requireAuth (known gap)

import { PUT } from "~/routes/api/kb/[kbId]/upload/[sourceId]";

const SOURCE_ROW = {
  id: "src-001",
  projectId: "kb-001",
  tenantId: TEST_TENANT_ID,
  r2Key: `${TEST_TENANT_ID}/kb-001/src-001.pdf`,
  mimeType: "application/pdf",
  status: "pending",
};

function makeEvent(params: Record<string, string>, bodyBytes?: ArrayBuffer) {
  const r2 = createMockR2Bucket();
  const event = createMockEvent({
    params: { kbId: "kb-001", sourceId: "src-001", ...params },
    env: { HARKLY_R2: r2 },
    request: {
      method: "PUT",
      url: "https://harkly.local/api/kb/kb-001/upload/src-001",
      body: bodyBytes ? Buffer.from(bodyBytes) : Buffer.from("fake-pdf-bytes"),
      headers: { "Content-Type": "application/pdf" },
    },
  });
  return { event, r2 };
}

function setupSelectReturns(rows: any[]) {
  const chain = { ...mockSelectChain };
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  // Simulate drizzle limit(1) then awaiting returns array
  chain.limit = vi.fn().mockResolvedValue(rows);
  mockDb.select.mockReturnValue(chain);
  return chain;
}

function setupUpdateChain() {
  const chain = { ...mockUpdateChain };
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  mockDb.update.mockReturnValue(chain);
  return chain;
}

// ── PUT /api/kb/[kbId]/upload/[sourceId] ─────────────────────────────────────

describe("PUT /api/kb/[kbId]/upload/[sourceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertChain.values = vi.fn().mockResolvedValue({ success: true });
    mockDb.insert.mockReturnValue(mockInsertChain);
    setupUpdateChain();
  });

  it("returns 200 with sourceId, jobId, runId, status=queued on success", async () => {
    setupSelectReturns([SOURCE_ROW]);
    const { event } = makeEvent({});

    const response = await PUT(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.sourceId).toBe("src-001");
    expect(body.data.jobId).toBeDefined();
    expect(body.data.runId).toBeDefined();
    expect(body.data.status).toBe("queued");
  });

  it("returns 404 when source not found", async () => {
    setupSelectReturns([]); // empty — source not found
    const { event } = makeEvent({});

    const response = await PUT(event as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 400 when source has no r2Key", async () => {
    setupSelectReturns([{ ...SOURCE_ROW, r2Key: null }]);
    const { event } = makeEvent({});

    const response = await PUT(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/r2/i);
  });

  it("stores the file in R2 using the source r2Key", async () => {
    setupSelectReturns([SOURCE_ROW]);
    const { event, r2 } = makeEvent({});

    await PUT(event as any);

    expect(r2.put).toHaveBeenCalledTimes(1);
    const [key] = r2.put.mock.calls[0];
    expect(key).toBe(SOURCE_ROW.r2Key);
  });

  it("sends a message to INGEST_QUEUE with sourceId", async () => {
    setupSelectReturns([SOURCE_ROW]);
    const { event } = makeEvent({});

    await PUT(event as any);

    const queue = event.context.bindings.INGEST_QUEUE;
    expect(queue.send).toHaveBeenCalledWith({ sourceId: "src-001" });
  });

  it("documents the missing-auth gap — no 401 without token", async () => {
    // This route does NOT call requireAuth. Any caller gets through.
    // This test documents the known gap so it becomes visible in CI.
    setupSelectReturns([SOURCE_ROW]);
    const { event } = makeEvent({});
    // No userId in context
    const response = await PUT(event as any);

    // Route succeeds even without auth — documenting the gap
    expect(response.status).toBe(200);
  });

  it("inserts an ingestRun and an ingestJob into D1", async () => {
    setupSelectReturns([SOURCE_ROW]);
    const { event } = makeEvent({});

    await PUT(event as any);

    // insert is called twice: once for ingestRun, once for ingestJob
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});
