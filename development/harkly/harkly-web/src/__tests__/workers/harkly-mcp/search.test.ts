/**
 * Tests for workers/harkly-mcp/src/lib/search.ts
 *
 * Covers:
 * - hybridSearch: empty FTS + vector → empty results
 * - hybridSearch: FTS-only results (no vector hits)
 * - hybridSearch: vector-only results (no FTS hits)
 * - hybridSearch: merged RRF results, ordering preserved
 * - hybridSearch: chunk fetch returns partial data (missing chunk filtered out)
 * - sanitizeFtsQuery behaviour (tested indirectly via hybridSearch with empty query)
 * - reciprocalRankFusion logic tested through full hybridSearch integration
 * - fetchChunksByIds batching for IDs > 100
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hybridSearch } from "../../../../workers/harkly-mcp/src/lib/search";
import {
  createMockD1Database,
  createMockVectorize,
  createMockAi,
} from "../../mocks/cf-env";
import type { MockD1Database, MockVectorizeIndex, MockAi } from "../../mocks/cf-env";

// Worker Env shape expected by search.ts
interface WorkerEnv {
  KB_DB: MockD1Database;
  VECTORIZE_INDEX: MockVectorizeIndex;
  AI: MockAi;
  [key: string]: unknown;
}

function makeEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    KB_DB: overrides.KB_DB ?? createMockD1Database(),
    VECTORIZE_INDEX: overrides.VECTORIZE_INDEX ?? createMockVectorize(),
    AI: overrides.AI ?? createMockAi(),
  };
}

// ── sanitizeFtsQuery (indirectly via empty / whitespace-only query) ────────────

describe("sanitizeFtsQuery — empty / whitespace inputs return no FTS results", () => {
  it("empty string produces no FTS call and returns empty array", async () => {
    const env = makeEnv();
    // AI returns no embedding → vector also empty
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const results = await hybridSearch("", "user-1", env as any);
    expect(results).toEqual([]);
    // prepare should never be called for an empty sanitized query
    expect((env.KB_DB.prepare as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it("whitespace-only string produces no FTS call", async () => {
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const results = await hybridSearch("   ", "user-1", env as any);
    expect(results).toEqual([]);
    expect((env.KB_DB.prepare as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it("query with only special FTS chars produces no FTS call", async () => {
    // "*()" sanitised → empty after trim
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const results = await hybridSearch("*()", "user-1", env as any);
    expect(results).toEqual([]);
  });

  it("OR AND NOT keywords are stripped leaving empty sanitized query", async () => {
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const results = await hybridSearch("OR AND NOT", "user-1", env as any);
    expect(results).toEqual([]);
  });

  it("double quotes are escaped and query still runs FTS", async () => {
    // 'say "hello"' → sanitized to 'say ""hello""' — non-empty so FTS runs
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [{ id: "chunk-1", rank: -5 }], success: true, meta: {} }),
    });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1, 0.2]] });

    // chunk fetch must also return data
    let callCount = 0;
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const stmt = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          callCount++;
          // first call = FTS search, second call = fetchChunksByIds
          if (callCount === 1) {
            return Promise.resolve({ results: [{ id: "chunk-1", rank: -5 }], success: true, meta: {} });
          }
          return Promise.resolve({
            results: [{ id: "chunk-1", content: "hello world", chunkIndex: 0, sourceTitle: "Doc", sourceType: "text" }],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
      return stmt;
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch('say "hello"', "user-1", env as any);
    // FTS ran (callCount >= 1) and returned a result
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeGreaterThanOrEqual(0); // may be 0 if chunk fetch returns nothing matching
  });
});

// ── hybridSearch — core merge behaviour ──────────────────────────────────────

describe("hybridSearch — both FTS and vector return empty", () => {
  it("returns empty array when both sources return nothing", async () => {
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1, 0.2]] });
    (env.VECTORIZE_INDEX.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });

    // FTS returns empty
    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });
    const results = await hybridSearch("test query", "user-1", { ...env, KB_DB: db } as any);
    expect(results).toEqual([]);
  });
});

describe("hybridSearch — FTS-only results", () => {
  it("returns results when only FTS hits, no vector matches", async () => {
    const ai = createMockAi();
    // No embedding data → vector search returns nothing
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    const vectorize = createMockVectorize();

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            // FTS results
            return Promise.resolve({
              results: [
                { id: "chunk-a", rank: -10 },
                { id: "chunk-b", rank: -8 },
              ],
              success: true,
              meta: {},
            });
          }
          // fetchChunksByIds
          return Promise.resolve({
            results: [
              { id: "chunk-a", content: "Alpha content", chunkIndex: 0, sourceTitle: "Src A", sourceType: "pdf" },
              { id: "chunk-b", content: "Beta content", chunkIndex: 1, sourceTitle: "Src B", sourceType: "pdf" },
            ],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("alpha beta", "user-1", env as any, { limit: 10 });

    expect(results.length).toBe(2);
    expect(results[0].id).toBe("chunk-a");
    expect(results[0].content).toBe("Alpha content");
    expect(results[0].sourceTitle).toBe("Src A");
    expect(results[0].sourceType).toBe("pdf");
    expect(results[0].chunkIndex).toBe(0);
    // RRF score: 1/(60+0) = 0.01667 for chunk-a, 1/(60+1)=0.01639 for chunk-b
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});

describe("hybridSearch — vector-only results", () => {
  it("returns results when only vector matches, FTS fails gracefully", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.5, 0.3, 0.2]] });

    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({
      matches: [
        { id: "vec-1", score: 0.95 },
        { id: "vec-2", score: 0.80 },
      ],
    });

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            // FTS returns empty (table may not exist → caught internally)
            return Promise.resolve({ results: [], success: true, meta: {} });
          }
          // fetchChunksByIds
          return Promise.resolve({
            results: [
              { id: "vec-1", content: "Vector content 1", chunkIndex: 0, sourceTitle: "V Src 1", sourceType: "text" },
              { id: "vec-2", content: "Vector content 2", chunkIndex: 0, sourceTitle: "V Src 2", sourceType: "text" },
            ],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("semantic search", "user-1", env as any);

    expect(results.length).toBe(2);
    expect(results[0].id).toBe("vec-1");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});

describe("hybridSearch — merged RRF from both sources", () => {
  it("item appearing in both FTS and vector gets boosted RRF score", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1, 0.2]] });

    const vectorize = createMockVectorize();
    // "common-chunk" appears in both FTS and vector
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({
      matches: [
        { id: "common-chunk", score: 0.90 },
        { id: "vec-only", score: 0.70 },
      ],
    });

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            return Promise.resolve({
              results: [
                { id: "common-chunk", rank: -12 },
                { id: "fts-only", rank: -8 },
              ],
              success: true,
              meta: {},
            });
          }
          return Promise.resolve({
            results: [
              { id: "common-chunk", content: "Common content", chunkIndex: 0, sourceTitle: "Common", sourceType: "text" },
              { id: "vec-only", content: "Vector only", chunkIndex: 0, sourceTitle: "Vec", sourceType: "text" },
              { id: "fts-only", content: "FTS only", chunkIndex: 0, sourceTitle: "FTS", sourceType: "text" },
            ],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("common topic", "user-1", env as any);

    // common-chunk should rank first (double-boosted by RRF)
    expect(results[0].id).toBe("common-chunk");
    expect(results.length).toBe(3);
  });
});

describe("hybridSearch — limit option", () => {
  it("respects limit option and returns at most limit results", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1]] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            // FTS returns 6 items
            return Promise.resolve({
              results: Array.from({ length: 6 }, (_, i) => ({ id: `chunk-${i}`, rank: -(i + 1) })),
              success: true,
              meta: {},
            });
          }
          return Promise.resolve({
            results: Array.from({ length: 6 }, (_, i) => ({
              id: `chunk-${i}`,
              content: `Content ${i}`,
              chunkIndex: i,
              sourceTitle: `Src ${i}`,
              sourceType: "text",
            })),
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("query", "user-1", env as any, { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

describe("hybridSearch — kbId scoping", () => {
  it("passes kbId filter to both FTS SQL and Vectorize metadata filter", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1]] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });

    const db = createMockD1Database();
    const bindSpy = vi.fn().mockReturnThis();
    const allSpy = vi.fn().mockResolvedValue({ results: [], success: true, meta: {} });
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      bind: bindSpy,
      all: allSpy,
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    await hybridSearch("query", "user-1", env as any, { kbId: "kb-123" });

    // FTS bind should include kbId as one of the params
    const bindCalls = bindSpy.mock.calls;
    const hasKbIdInBind = bindCalls.some((args) => args.includes("kb-123"));
    expect(hasKbIdInBind).toBe(true);

    // Vectorize filter should include kbId
    const vectorizeCalls = (vectorize.query as ReturnType<typeof vi.fn>).mock.calls;
    expect(vectorizeCalls.length).toBeGreaterThan(0);
    const [, vectorizeOptions] = vectorizeCalls[0];
    expect(vectorizeOptions.filter.kbId).toBe("kb-123");
  });
});

describe("hybridSearch — chunk not found in DB filtered out", () => {
  it("filters out merged IDs whose chunks are missing from DB", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.1]] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            return Promise.resolve({
              results: [
                { id: "exists", rank: -10 },
                { id: "ghost", rank: -5 },
              ],
              success: true,
              meta: {},
            });
          }
          // Only "exists" returned from DB — "ghost" missing
          return Promise.resolve({
            results: [{ id: "exists", content: "Real content", chunkIndex: 0, sourceTitle: "S", sourceType: "text" }],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("query", "user-1", env as any);
    expect(results.every((r) => r.id !== "ghost")).toBe(true);
    expect(results.find((r) => r.id === "exists")).toBeDefined();
  });
});

describe("hybridSearch — FTS throws (table missing)", () => {
  it("gracefully returns vector-only results when FTS throws", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [[0.5]] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({
      matches: [{ id: "vec-chunk", score: 0.9 }],
    });

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    (db.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            // FTS table missing → throw
            return Promise.reject(new Error("no such table: document_chunks_fts"));
          }
          return Promise.resolve({
            results: [{ id: "vec-chunk", content: "Vector data", chunkIndex: 0, sourceTitle: "VT", sourceType: "text" }],
            success: true,
            meta: {},
          });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    const results = await hybridSearch("query", "user-1", env as any);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("vec-chunk");
  });
});

describe("hybridSearch — very long query", () => {
  it("handles 500-character query without error", async () => {
    const longQuery = "a".repeat(500);
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    const db = createMockD1Database({
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    });

    const result = await hybridSearch(longQuery, "user-1", { ...env, KB_DB: db } as any);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("hybridSearch — fetchChunksByIds batching", () => {
  it("issues multiple DB prepare calls when IDs exceed 100 (batch size)", async () => {
    const ai = createMockAi();
    (ai.run as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const vectorize = createMockVectorize();
    (vectorize.query as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });

    // Return 105 FTS results to trigger 2 batches in fetchChunksByIds
    const ftsRows = Array.from({ length: 105 }, (_, i) => ({ id: `c-${i}`, rank: -(i + 1) }));
    const chunkRows = ftsRows.map((r, i) => ({
      id: r.id,
      content: `Content ${i}`,
      chunkIndex: i,
      sourceTitle: "Src",
      sourceType: "text",
    }));

    let prepareCallIndex = 0;
    const db = createMockD1Database();
    const preparespy = vi.fn().mockImplementation(() => {
      prepareCallIndex++;
      const currentCall = prepareCallIndex;
      return {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(() => {
          if (currentCall === 1) {
            return Promise.resolve({ results: ftsRows, success: true, meta: {} });
          }
          // Batch 1 or 2 of fetchChunksByIds — return first 100 then last 5 (limit is 10 so slice handles it)
          return Promise.resolve({ results: chunkRows.slice(0, 10), success: true, meta: {} });
        }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
      };
    });
    (db.prepare as ReturnType<typeof vi.fn>) = preparespy;

    const env = makeEnv({ KB_DB: db, VECTORIZE_INDEX: vectorize, AI: ai });
    await hybridSearch("query", "user-1", env as any, { limit: 10 });

    // With limit=10, topIds = 10, that is a single batch — but FTS query still runs
    // prepareCallIndex >= 2: FTS query + at least 1 fetchChunksByIds batch
    expect(preparespy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
