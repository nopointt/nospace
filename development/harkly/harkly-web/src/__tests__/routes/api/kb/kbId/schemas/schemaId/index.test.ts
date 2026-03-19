/**
 * Tests: GET /api/kb/[kbId]/schemas/[schemaId]
 *        PUT /api/kb/[kbId]/schemas/[schemaId]
 * Route: src/routes/api/kb/[kbId]/schemas/[schemaId]/index.ts
 *
 * NOTE: Neither GET nor PUT calls requireAuth — known security gap.
 * Tests document the current unauthenticated behavior.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb: any = {
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
};

vi.mock("~/lib/db", () => ({
  getBindings: vi.fn((event: any) => event.context.bindings),
  createKbDb: vi.fn(() => mockDb),
}));

import { GET, PUT } from "~/routes/api/kb/[kbId]/schemas/[schemaId]/index";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.orderBy = vi.fn().mockReturnValue(c);
  c.limit = vi.fn().mockResolvedValue(result);
  c.all = vi.fn().mockResolvedValue(result);
  return c;
}

function updateChain() {
  const c: any = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  return c;
}

function deleteChain() {
  return { where: vi.fn().mockResolvedValue({ rowsAffected: 1 }) };
}

function insertChain() {
  return { values: vi.fn().mockResolvedValue({ success: true }) };
}

const SCHEMA = {
  id: "schema-001",
  name: "Invoice",
  status: "draft",
  projectId: "kb-001",
  tenantId: TEST_TENANT_ID,
};

const FIELDS = [
  { id: "f1", schemaId: "schema-001", name: "amount", type: "number", sortOrder: 0 },
  { id: "f2", schemaId: "schema-001", name: "vendor", type: "string", sortOrder: 1 },
];

function makeEvent(method: string, body?: any, schemaId = "schema-001", kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId, schemaId },
    request: {
      method,
      url: `https://harkly.local/api/kb/${kbId}/schemas/${schemaId}`,
      ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── GET /api/kb/[kbId]/schemas/[schemaId] ────────────────────────────────────

describe("GET /api/kb/[kbId]/schemas/[schemaId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with schema and its fields", async () => {
    mockDb.select
      .mockReturnValueOnce(selectChain([SCHEMA])) // schema lookup
      .mockReturnValueOnce(selectChain(FIELDS));  // fields lookup

    const event = makeEvent("GET");
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe("schema-001");
    expect(body.data.fields).toHaveLength(2);
    expect(body.data.fields[0].name).toBe("amount");
  });

  it("returns 404 when schema not found", async () => {
    mockDb.select.mockReturnValueOnce(selectChain([]));

    const event = makeEvent("GET");
    const response = await GET(event as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("documents the missing-auth gap — no 401 without token", async () => {
    // GET has no requireAuth — any caller can fetch schema details
    mockDb.select
      .mockReturnValueOnce(selectChain([SCHEMA]))
      .mockReturnValueOnce(selectChain(FIELDS));

    const event = createMockEvent({ params: { kbId: "kb-001", schemaId: "schema-001" } });
    const response = await GET(event as any);

    // Succeeds without auth — gap documented
    expect(response.status).toBe(200);
  });
});

// ── PUT /api/kb/[kbId]/schemas/[schemaId] ────────────────────────────────────

describe("PUT /api/kb/[kbId]/schemas/[schemaId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnValue(updateChain());
    mockDb.delete.mockReturnValue(deleteChain());
    mockDb.insert.mockReturnValue(insertChain());
  });

  it("returns 200 with fieldsCount on success", async () => {
    const newFields = [
      { name: "amount", type: "number", description: "Total", required: true },
      { name: "vendor", type: "string" },
    ];

    const event = makeEvent("PUT", { fields: newFields });
    const response = await PUT(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.schemaId).toBe("schema-001");
    expect(body.data.fieldsCount).toBe(2);
  });

  it("updates schema name when name is provided", async () => {
    const upd = updateChain();
    mockDb.update.mockReturnValue(upd);

    const event = makeEvent("PUT", { fields: [], name: "Updated Name" });
    await PUT(event as any);

    expect(mockDb.update).toHaveBeenCalled();
    expect(upd.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Name" }),
    );
  });

  it("deletes existing fields before inserting new ones", async () => {
    const del = deleteChain();
    mockDb.delete.mockReturnValue(del);

    const event = makeEvent("PUT", {
      fields: [{ name: "f1", type: "string" }],
    });
    await PUT(event as any);

    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(del.where).toHaveBeenCalledTimes(1);
  });

  it("inserts one row per field", async () => {
    const ins = insertChain();
    mockDb.insert.mockReturnValue(ins);

    const event = makeEvent("PUT", {
      fields: [
        { name: "f1", type: "string" },
        { name: "f2", type: "number" },
        { name: "f3", type: "boolean" },
      ],
    });
    await PUT(event as any);

    // delete once, insert 3 times
    expect(mockDb.insert).toHaveBeenCalledTimes(3);
  });

  it("serializes enumValues as JSON string", async () => {
    const ins = insertChain();
    mockDb.insert.mockReturnValue(ins);

    const event = makeEvent("PUT", {
      fields: [{ name: "status", type: "enum", enumValues: ["active", "inactive"] }],
    });
    await PUT(event as any);

    const inserted = ins.values.mock.calls[0][0];
    expect(inserted.enumValues).toBe(JSON.stringify(["active", "inactive"]));
  });

  it("documents the missing-auth gap — no 401 without token", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001", schemaId: "schema-001" },
      request: {
        method: "PUT",
        url: "https://harkly.local/api/kb/kb-001/schemas/schema-001",
        body: JSON.stringify({ fields: [] }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await PUT(event as any);

    // Succeeds without auth — gap documented
    expect(response.status).toBe(200);
  });
});
