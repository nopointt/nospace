/**
 * Tests for src/lib/pipeline/process-source.ts — processSource
 *
 * processSource uses drizzle-orm/d1 which compiles down to D1Database.prepare()
 * calls. We mock the D1Database at the SQL statement level.
 *
 * Strategy:
 *   - Mock all external modules (drizzle, text-extractor, embedder, id-utils)
 *   - Provide a D1Database whose prepare().bind().first() / .all() / .run()
 *     return canned responses matching what drizzle expects.
 *   - For the happy path we bypass drizzle entirely by mocking the drizzle module.
 *
 * Covers:
 * - throws when source not found in DB
 * - happy path: status transitions pending → processing → processed
 * - happy path: R2 fetch, text extraction, document insert, chunk insert, vectorize upsert
 * - throws when r2Key is missing on source record
 * - throws when R2 object not found
 * - on error: status is set to "failed" with errorMessage, then error is re-thrown
 * - file type routing delegated to extractText mock
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock drizzle-orm/d1 before importing processSource ───────────────────────
// drizzle() returns a db object whose select/update/insert chains ultimately
// call D1. We mock the entire drizzle module to return a controllable db object.

const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbInsert = vi.fn();

const mockDb = {
  select: mockDbSelect,
  update: mockDbUpdate,
  insert: mockDbInsert,
};

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => mockDb),
}));

// ── Mock pipeline sub-modules ────────────────────────────────────────────────

vi.mock("~/lib/pipeline/text-extractor", () => ({
  extractText: vi.fn().mockResolvedValue("Extracted text content from file."),
}));

vi.mock("~/lib/pipeline/embedder", () => ({
  embedChunks: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
}));

vi.mock("~/lib/pipeline/id-utils", () => ({
  generateId: vi.fn().mockReturnValue("mock-generated-id"),
  ensureSafeId: vi.fn().mockImplementation((id: string) => id),
}));

// ── Now import the module under test ─────────────────────────────────────────

import { processSource } from "~/lib/pipeline/process-source";
import { extractText } from "~/lib/pipeline/text-extractor";
import { embedChunks } from "~/lib/pipeline/embedder";
import { createMockR2Bucket, createMockVectorize, createMockAi } from "../mocks/cf-env";

// ── Shared source record fixture ──────────────────────────────────────────────

function makeSource(overrides: Record<string, unknown> = {}) {
  return {
    id: "source-1",
    projectId: "project-1",
    tenantId: "tenant-1",
    type: "text",
    title: "Test Document",
    r2Key: "uploads/test.txt",
    mimeType: "text/plain",
    status: "pending",
    ...overrides,
  };
}

// ── Select chain builder ──────────────────────────────────────────────────────
// drizzle's select chain: db.select().from(table).where(...).limit(1) → [row]

function makeSelectChain(returnValue: unknown[]) {
  const limit = vi.fn().mockResolvedValue(returnValue);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

// ── Update chain builder ─────────────────────────────────────────────────────
// drizzle's update chain: db.update(table).set({...}).where(...)

function makeUpdateChain() {
  const where = vi.fn().mockResolvedValue({ rowsAffected: 1 });
  const set = vi.fn().mockReturnValue({ where });
  return { set, where };
}

// ── Insert chain builder ─────────────────────────────────────────────────────
// drizzle's insert chain: db.insert(table).values({...})

function makeInsertChain() {
  return { values: vi.fn().mockResolvedValue({ rowsAffected: 1 }) };
}

// ── Env factory ───────────────────────────────────────────────────────────────

function makeEnv(r2Override?: ReturnType<typeof createMockR2Bucket>) {
  const r2 = r2Override ?? createMockR2Bucket();
  const r2Object = {
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    text: vi.fn().mockResolvedValue("Extracted text content from file."),
  };
  // Default: R2 returns a valid object
  (r2.get as ReturnType<typeof vi.fn>).mockResolvedValue(r2Object);

  return {
    KB_DB: {} as any, // drizzle() is mocked, so raw D1 mock is unused
    HARKLY_R2: r2,
    VECTORIZE_INDEX: createMockVectorize(),
    AI: createMockAi(),
  };
}

// ── beforeEach: reset all drizzle mock chains ─────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default select: returns one source record
  const selectChain = makeSelectChain([makeSource()]);
  mockDbSelect.mockReturnValue(selectChain);

  // Default update: succeeds
  mockDbUpdate.mockReturnValue(makeUpdateChain());

  // Default insert: succeeds
  mockDbInsert.mockReturnValue(makeInsertChain());
});

// ── Source not found ──────────────────────────────────────────────────────────

describe("processSource — source not found", () => {
  it("throws 'Source not found' when DB returns empty array", async () => {
    mockDbSelect.mockReturnValue(makeSelectChain([]));

    const env = makeEnv();
    await expect(processSource(env as any, "missing-id")).rejects.toThrow(
      "Source not found: missing-id",
    );
  });

  it("does not attempt R2 fetch when source is missing", async () => {
    mockDbSelect.mockReturnValue(makeSelectChain([]));

    const env = makeEnv();
    try {
      await processSource(env as any, "missing-id");
    } catch {
      // expected
    }
    expect(env.HARKLY_R2.get).not.toHaveBeenCalled();
  });
});

// ── Missing r2Key ─────────────────────────────────────────────────────────────

describe("processSource — missing r2Key", () => {
  it("throws 'Source has no R2 key' and marks source as failed", async () => {
    const sourceWithoutKey = makeSource({ r2Key: null });
    mockDbSelect.mockReturnValue(makeSelectChain([sourceWithoutKey]));

    const updateChain = makeUpdateChain();
    mockDbUpdate.mockReturnValue(updateChain);

    const env = makeEnv();
    await expect(processSource(env as any, "source-1")).rejects.toThrow(
      "Source has no R2 key",
    );

    // The error handler should have called update to set status: "failed"
    expect(mockDbUpdate).toHaveBeenCalled();
  });
});

// ── R2 object not found ───────────────────────────────────────────────────────

describe("processSource — R2 object not found", () => {
  it("throws when R2 returns null for r2Key", async () => {
    // Build env first (makeEnv sets up a default r2Object), then override .get
    const env = makeEnv();
    (env.HARKLY_R2.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(processSource(env as any, "source-1")).rejects.toThrow(
      "R2 object not found",
    );
  });

  it("marks source as failed when R2 object is missing", async () => {
    const env = makeEnv();
    (env.HARKLY_R2.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    try {
      await processSource(env as any, "source-1");
    } catch {
      // expected
    }

    // update() should have been called at least twice:
    // once to set "processing", once to set "failed"
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
  });
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe("processSource — happy path", () => {
  it("calls extractText with the r2Object and mimeType from source", async () => {
    const env = makeEnv();
    await processSource(env as any, "source-1");
    expect(extractText).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.any(Function) }),
      "text/plain",
    );
  });

  it("calls embedChunks with AI binding and chunk texts", async () => {
    const env = makeEnv();
    await processSource(env as any, "source-1");
    expect(embedChunks).toHaveBeenCalledWith(
      env.AI,
      expect.any(Array),
    );
  });

  it("calls VECTORIZE_INDEX.upsert when embeddings are present", async () => {
    const env = makeEnv();
    await processSource(env as any, "source-1");
    expect(env.VECTORIZE_INDEX.upsert).toHaveBeenCalled();
  });

  it("update is called to set status=processing then status=processed", async () => {
    const setCalls: Record<string, unknown>[] = [];
    const updateChain = {
      set: vi.fn().mockImplementation((values: Record<string, unknown>) => {
        setCalls.push(values);
        return { where: vi.fn().mockResolvedValue({ rowsAffected: 1 }) };
      }),
    };
    mockDbUpdate.mockReturnValue(updateChain);

    const env = makeEnv();
    await processSource(env as any, "source-1");

    const statuses = setCalls.map((c) => c.status);
    expect(statuses).toContain("processing");
    expect(statuses).toContain("processed");
  });

  it("inserts a document record", async () => {
    const env = makeEnv();
    await processSource(env as any, "source-1");
    expect(mockDbInsert).toHaveBeenCalled();
  });
});

// ── Error handling / status=failed ───────────────────────────────────────────

describe("processSource — error handling", () => {
  it("sets status=failed with errorMessage when embedChunks throws", async () => {
    vi.mocked(embedChunks).mockRejectedValueOnce(new Error("AI service unavailable"));

    const setCalls: Record<string, unknown>[] = [];
    const updateChain = {
      set: vi.fn().mockImplementation((values: Record<string, unknown>) => {
        setCalls.push(values);
        return { where: vi.fn().mockResolvedValue({ rowsAffected: 1 }) };
      }),
    };
    mockDbUpdate.mockReturnValue(updateChain);

    const env = makeEnv();
    await expect(processSource(env as any, "source-1")).rejects.toThrow(
      "AI service unavailable",
    );

    const failedCall = setCalls.find((c) => c.status === "failed");
    expect(failedCall).toBeDefined();
    expect(failedCall!.errorMessage).toBe("AI service unavailable");
  });

  it("re-throws the original error after marking as failed", async () => {
    vi.mocked(embedChunks).mockRejectedValueOnce(new Error("network timeout"));

    const env = makeEnv();
    await expect(processSource(env as any, "source-1")).rejects.toThrow(
      "network timeout",
    );
  });
});
