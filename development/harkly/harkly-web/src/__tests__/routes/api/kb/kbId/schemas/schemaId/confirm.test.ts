/**
 * Tests: POST /api/kb/[kbId]/schemas/[schemaId]/confirm
 * Route: src/routes/api/kb/[kbId]/schemas/[schemaId]/confirm.ts
 *
 * NOTE: This route has NO requireAuth call — known security gap.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
  update: vi.fn(),
};

vi.mock("~/lib/db", () => ({
  getBindings: vi.fn((event: any) => event.context.bindings),
  createKbDb: vi.fn(() => mockDb),
}));

import { POST } from "~/routes/api/kb/[kbId]/schemas/[schemaId]/confirm";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.limit = vi.fn().mockResolvedValue(result);
  return c;
}

function updateChain() {
  const c: any = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  return c;
}

const DRAFT_SCHEMA = {
  id: "schema-001",
  name: "Invoice",
  status: "draft",
  projectId: "kb-001",
  tenantId: TEST_TENANT_ID,
};

const CONFIRMED_SCHEMA = { ...DRAFT_SCHEMA, status: "confirmed" };

function makeEvent(schemaId = "schema-001", kbId = "kb-001") {
  return createMockEvent({
    params: { kbId, schemaId },
    request: {
      method: "POST",
      url: `https://harkly.local/api/kb/${kbId}/schemas/${schemaId}/confirm`,
    },
  });
}

// ── POST /api/kb/[kbId]/schemas/[schemaId]/confirm ───────────────────────────

describe("POST /api/kb/[kbId]/schemas/[schemaId]/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnValue(updateChain());
  });

  it("returns 200 with schemaId and status=confirmed for a draft schema", async () => {
    mockDb.select.mockReturnValue(selectChain([DRAFT_SCHEMA]));

    const event = makeEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.schemaId).toBe("schema-001");
    expect(body.data.status).toBe("confirmed");
  });

  it("returns 404 when schema not found", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 400 when schema is already confirmed", async () => {
    mockDb.select.mockReturnValue(selectChain([CONFIRMED_SCHEMA]));

    const event = makeEvent();
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/already confirmed/i);
  });

  it("calls db.update to set status=confirmed", async () => {
    mockDb.select.mockReturnValue(selectChain([DRAFT_SCHEMA]));
    const upd = updateChain();
    mockDb.update.mockReturnValue(upd);

    const event = makeEvent();
    await POST(event as any);

    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(upd.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" }),
    );
  });

  it("documents the missing-auth gap — no 401 without token", async () => {
    // POST /confirm has no requireAuth — any caller can confirm a schema
    mockDb.select.mockReturnValue(selectChain([DRAFT_SCHEMA]));
    const event = makeEvent();
    const response = await POST(event as any);

    // Succeeds without auth — gap documented
    expect(response.status).toBe(200);
  });

  it("does not call update when schema is not found", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeEvent();
    await POST(event as any);

    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
