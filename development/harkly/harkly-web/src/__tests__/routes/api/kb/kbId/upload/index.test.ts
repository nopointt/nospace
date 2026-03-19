/**
 * Tests: POST /api/kb/[kbId]/upload  (initiate upload)
 * Route: src/routes/api/kb/[kbId]/upload/index.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { TEST_TENANT_ID } from "../../../helpers";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDb = {
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

function buildInsertChain() {
  return { values: vi.fn().mockResolvedValue({ success: true }) };
}

import { POST } from "~/routes/api/kb/[kbId]/upload/index";

function makeAuthEvent(body: Record<string, any>, kbId = "kb-001") {
  const event = createMockEvent({
    params: { kbId },
    request: {
      method: "POST",
      url: `https://harkly.local/api/kb/${kbId}/upload`,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    },
  });
  (event.context as any).userId = TEST_TENANT_ID;
  return event;
}

// ── POST /api/kb/[kbId]/upload ────────────────────────────────────────────────

describe("POST /api/kb/[kbId]/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue(buildInsertChain());
  });

  it("returns 200 with sourceId, uploadPath, and r2Key for a PDF", async () => {
    const event = makeAuthEvent({ fileName: "report.pdf", contentType: "application/pdf" });
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.sourceId).toBeDefined();
    expect(body.data.uploadPath).toMatch(/\/api\/kb\/kb-001\/upload\//);
    // r2Key is: tenantId/kbId/ulid.ext — filename is NOT included
    expect(body.data.r2Key).toContain(TEST_TENANT_ID);
    expect(body.data.r2Key).toMatch(/\.pdf$/);
  });

  it("returns 200 with correct type mapping for CSV", async () => {
    const event = makeAuthEvent({ fileName: "data.csv", contentType: "text/csv" });
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.r2Key).toContain(".csv");
  });

  it("returns 200 with audio type for audio/mpeg", async () => {
    const event = makeAuthEvent({ fileName: "interview.mp3", contentType: "audio/mpeg" });
    const response = await POST(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.sourceId).toBeDefined();
  });

  it("returns 400 when fileName is missing", async () => {
    const event = makeAuthEvent({ contentType: "application/pdf" });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when contentType is missing", async () => {
    const event = makeAuthEvent({ fileName: "report.pdf" });
    const response = await POST(event as any);

    expect(response.status).toBe(400);
  });

  it("returns 400 when both fields are missing", async () => {
    const event = makeAuthEvent({});
    const response = await POST(event as any);

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const event = createMockEvent({
      params: { kbId: "kb-001" },
      request: {
        method: "POST",
        url: "https://harkly.local/api/kb/kb-001/upload",
        body: JSON.stringify({ fileName: "f.pdf", contentType: "application/pdf" }),
        headers: { "Content-Type": "application/json" },
      },
    });
    const response = await POST(event as any);

    expect(response.status).toBe(401);
  });

  it("inserts a source row into D1", async () => {
    const insertChain = buildInsertChain();
    mockDb.insert.mockReturnValue(insertChain);

    const event = makeAuthEvent({ fileName: "test.pdf", contentType: "application/pdf" });
    await POST(event as any);

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledTimes(1);
    const inserted = insertChain.values.mock.calls[0][0];
    expect(inserted.tenantId).toBe(TEST_TENANT_ID);
    expect(inserted.projectId).toBe("kb-001");
    expect(inserted.status).toBe("pending");
  });

  it("sets r2Key to tenant/kb/sourceId.ext pattern", async () => {
    const event = makeAuthEvent({ fileName: "slides.docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const response = await POST(event as any);

    const body = await response.json();
    // r2Key should be: tenantId/kbId/sourceId.docx
    expect(body.data.r2Key).toMatch(
      new RegExp(`^${TEST_TENANT_ID}/kb-001/.+\\.docx$`),
    );
  });
});
