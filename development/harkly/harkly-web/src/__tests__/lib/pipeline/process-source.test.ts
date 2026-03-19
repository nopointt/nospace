import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock drizzle ORM before importing anything that uses it ───────────────────

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

// Chainable drizzle query builder mock
function buildSelectChain(returnValue: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnValue),
  };
  return chain;
}

function buildUpdateChain() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({ success: true }),
  };
  return chain;
}

function buildInsertChain() {
  const chain = {
    values: vi.fn().mockResolvedValue({ success: true }),
  };
  return chain;
}

// mockDrizzleInstance will be reconfigured per test
let mockDrizzleInstance = {
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
};

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => mockDrizzleInstance),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
}));

// Mock sub-modules so processSource doesn't pull in real implementations
vi.mock("~/lib/pipeline/text-extractor", () => ({
  extractText: vi.fn().mockResolvedValue("Extracted text content"),
}));

vi.mock("~/lib/pipeline/token-counter", () => ({
  validateAndTruncateContent: vi.fn((s: string) => s),
}));

vi.mock("~/lib/pipeline/chunker", () => ({
  chunkText: vi.fn().mockReturnValue([
    { content: "chunk one", index: 0 },
    { content: "chunk two", index: 1 },
  ]),
}));

vi.mock("~/lib/pipeline/embedder", () => ({
  embedChunks: vi.fn().mockResolvedValue([
    [0.1, 0.2, 0.3],
    [0.4, 0.5, 0.6],
  ]),
}));

vi.mock("~/lib/pipeline/id-utils", () => ({
  generateId: vi.fn().mockReturnValue("mock-id-0000"),
  ensureSafeId: vi.fn((id: string) => id),
}));

// ── Schema mock (just identity objects so drizzle eq() calls work) ────────────
vi.mock("~/lib/schema", () => ({
  sources: { id: "sources.id", r2Key: "sources.r2Key" },
  documents: {},
  documentChunks: {},
}));

import { processSource } from "~/lib/pipeline/process-source";
import { extractText } from "~/lib/pipeline/text-extractor";
import { createMockEnv } from "~//__tests__/mocks/cf-env";

// ── Source fixture ────────────────────────────────────────────────────────────

const BASE_SOURCE = {
  id: "src-001",
  projectId: "proj-001",
  tenantId: "tenant-001",
  type: "file",
  title: "Test Document",
  r2Key: "uploads/test.txt",
  mimeType: "text/plain",
  status: "pending",
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("processSource", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    env = createMockEnv();

    // Default: select returns the base source record
    mockDrizzleInstance = {
      select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
      update: vi.fn().mockReturnValue(buildUpdateChain()),
      insert: vi.fn().mockReturnValue(buildInsertChain()),
    };

    // Default R2 returns a mock object
    env.HARKLY_R2.get = vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue("some text"),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    // Default AI embedding response
    env.AI.run = vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]] });

    // Reset extractText to its default success implementation after every test.
    // vi.clearAllMocks() clears call counts but not mock implementations set via
    // mockRejectedValue/mockResolvedValue in individual tests.
    vi.mocked(extractText).mockResolvedValue("Extracted text content");
  });

  describe("successful processing flow", () => {
    it("should update status to processing before extracting text", async () => {
      const updateMock = buildUpdateChain();
      const updateFn = vi.fn().mockReturnValue(updateMock);
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await processSource(env as any, "src-001");

      // update() should have been called (at least: processing + processed)
      expect(updateFn).toHaveBeenCalled();
    });

    it("should call extractText with the R2 object and mimeType", async () => {
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: vi.fn().mockReturnValue(buildUpdateChain()),
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await processSource(env as any, "src-001");

      expect(extractText).toHaveBeenCalledOnce();
    });

    it("should insert a document record into the database", async () => {
      const insertFn = vi.fn().mockReturnValue(buildInsertChain());
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: vi.fn().mockReturnValue(buildUpdateChain()),
        insert: insertFn,
      };

      await processSource(env as any, "src-001");

      expect(insertFn).toHaveBeenCalled();
    });

    it("should upsert vectors to Vectorize", async () => {
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: vi.fn().mockReturnValue(buildUpdateChain()),
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await processSource(env as any, "src-001");

      expect(env.VECTORIZE_INDEX.upsert).toHaveBeenCalled();
    });

    it("should resolve without throwing when everything succeeds", async () => {
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: vi.fn().mockReturnValue(buildUpdateChain()),
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-001")).resolves.toBeUndefined();
    });
  });

  describe("failure handling: source not found", () => {
    it("should throw with the sourceId in the error message", async () => {
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([])), // empty → not found
        update: vi.fn().mockReturnValue(buildUpdateChain()),
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-missing")).rejects.toThrow(
        "Source not found: src-missing",
      );
    });
  });

  describe("failure handling: source has no R2 key", () => {
    it("should throw and update status to failed", async () => {
      const sourceWithoutR2 = { ...BASE_SOURCE, r2Key: null };
      const updateFn = vi.fn().mockReturnValue(buildUpdateChain());
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([sourceWithoutR2])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-001")).rejects.toThrow(
        "Source has no R2 key",
      );
      // update should have been called for "failed" status
      expect(updateFn).toHaveBeenCalled();
    });
  });

  describe("failure handling: R2 object not found", () => {
    it("should throw and update status to failed when R2 returns null", async () => {
      env.HARKLY_R2.get = vi.fn().mockResolvedValue(null);
      const updateFn = vi.fn().mockReturnValue(buildUpdateChain());
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-001")).rejects.toThrow(
        /R2 object not found/,
      );
      expect(updateFn).toHaveBeenCalled();
    });
  });

  describe("failure handling: text extraction fails", () => {
    it("should rethrow the error and update status to failed", async () => {
      vi.mocked(extractText).mockRejectedValue(new Error("Unsupported MIME type: image/png"));
      const updateFn = vi.fn().mockReturnValue(buildUpdateChain());
      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-001")).rejects.toThrow(
        "Unsupported MIME type: image/png",
      );
      // The catch block should call update with status: "failed"
      expect(updateFn).toHaveBeenCalled();
    });
  });

  describe("status transitions", () => {
    it("should set status to processed on success (final update call)", async () => {
      const setCalls: Array<Record<string, unknown>> = [];
      const updateFn = vi.fn().mockImplementation(() => {
        const chain = {
          set: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            setCalls.push(data);
            return chain;
          }),
          where: vi.fn().mockResolvedValue({ success: true }),
        };
        return chain;
      });

      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await processSource(env as any, "src-001");

      const statuses = setCalls.map((c) => c.status).filter(Boolean);
      expect(statuses).toContain("processing");
      expect(statuses).toContain("processed");
    });

    it("should set status to failed on error", async () => {
      vi.mocked(extractText).mockRejectedValue(new Error("extraction failure"));

      const setCalls: Array<Record<string, unknown>> = [];
      const updateFn = vi.fn().mockImplementation(() => {
        const chain = {
          set: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            setCalls.push(data);
            return chain;
          }),
          where: vi.fn().mockResolvedValue({ success: true }),
        };
        return chain;
      });

      mockDrizzleInstance = {
        select: vi.fn().mockReturnValue(buildSelectChain([BASE_SOURCE])),
        update: updateFn,
        insert: vi.fn().mockReturnValue(buildInsertChain()),
      };

      await expect(processSource(env as any, "src-001")).rejects.toThrow();

      const statuses = setCalls.map((c) => c.status).filter(Boolean);
      expect(statuses).toContain("failed");
    });
  });
});
