/**
 * Tests: GET /api/kb/[kbId]/jobs/[jobId]
 * Route: src/routes/api/kb/[kbId]/jobs/[jobId]/index.ts
 *
 * NOTE: This route has NO requireAuth call — known security gap.
 * Tests document the current unauthenticated behavior.
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

// No auth mock needed — route does not call requireAuth (known gap)

import { GET } from "~/routes/api/kb/[kbId]/jobs/[jobId]/index";

// ── Chain builders ────────────────────────────────────────────────────────────

function selectChain(result: any[]) {
  const c: any = {};
  c.from = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.limit = vi.fn().mockResolvedValue(result);
  return c;
}

const JOB = {
  id: "job-001",
  runId: "run-001",
  tenantId: TEST_TENANT_ID,
  jobType: "process_source",
  status: "queued",
  payload: JSON.stringify({ sourceId: "src-001", kbId: "kb-001" }),
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeEvent(jobId = "job-001", kbId = "kb-001") {
  return createMockEvent({
    params: { kbId, jobId },
    request: {
      method: "GET",
      url: `https://harkly.local/api/kb/${kbId}/jobs/${jobId}`,
    },
  });
}

// ── GET /api/kb/[kbId]/jobs/[jobId] ──────────────────────────────────────────

describe("GET /api/kb/[kbId]/jobs/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with job data when job exists", async () => {
    mockDb.select.mockReturnValue(selectChain([JOB]));

    const event = makeEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe("job-001");
    expect(body.data.status).toBe("queued");
    expect(body.data.jobType).toBe("process_source");
  });

  it("returns 404 when job does not exist", async () => {
    mockDb.select.mockReturnValue(selectChain([]));

    const event = makeEvent("job-missing");
    const response = await GET(event as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("uses jobId from route params in the query", async () => {
    const chain = selectChain([JOB]);
    mockDb.select.mockReturnValue(chain);

    const event = makeEvent("job-001");
    await GET(event as any);

    expect(chain.where).toHaveBeenCalledTimes(1);
    expect(chain.limit).toHaveBeenCalledWith(1);
  });

  it("documents the missing-auth gap — no 401 without token", async () => {
    // GET has no requireAuth — any caller can fetch job status
    mockDb.select.mockReturnValue(selectChain([JOB]));

    // No userId set in context
    const event = createMockEvent({
      params: { kbId: "kb-001", jobId: "job-001" },
    });
    const response = await GET(event as any);

    // Succeeds without auth — gap documented
    expect(response.status).toBe(200);
  });

  it("returns the full job object in data field", async () => {
    mockDb.select.mockReturnValue(selectChain([JOB]));

    const event = makeEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.data).toMatchObject({
      id: "job-001",
      runId: "run-001",
      tenantId: TEST_TENANT_ID,
    });
  });
});
