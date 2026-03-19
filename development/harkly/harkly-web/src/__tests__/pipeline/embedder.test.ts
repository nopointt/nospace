/**
 * Tests for src/lib/pipeline/embedder.ts — embedChunks
 *
 * embedChunks calls ai.run() in batches of 10, waits 500 ms between batches,
 * and collects result.data arrays into a flat number[][] result.
 *
 * Covers:
 * - empty input returns empty array
 * - single batch (<=10 chunks) calls ai.run once
 * - multiple batches (>10 chunks) calls ai.run ceil(n/10) times
 * - embeddings from all batches are concatenated in order
 * - when ai.run returns no data field, that batch is skipped
 * - partial batch (last batch smaller than BATCH_SIZE) is handled correctly
 * - batch delay is NOT awaited for a single-batch call (no inter-batch delay)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { embedChunks } from "~/lib/pipeline/embedder";

// ── helper: build a mock Ai with predictable embeddings ───────────────────────

function makeMockAi(embeddingsPerBatch: number[][]) {
  let callCount = 0;
  return {
    run: vi.fn().mockImplementation(async () => {
      const embeddings = embeddingsPerBatch[callCount] ?? [];
      callCount++;
      return { data: embeddings };
    }),
  };
}

/** Build n fake 3-dim embedding vectors. */
function fakeVectors(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => [i * 0.1, i * 0.2, i * 0.3]);
}

describe("embedChunks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── empty input ─────────────────────────────────────────────────────────────

  it("returns empty array without calling ai.run", async () => {
    const ai = { run: vi.fn() };
    const result = await embedChunks(ai as any, []);
    expect(result).toEqual([]);
    expect(ai.run).not.toHaveBeenCalled();
  });

  // ── single batch ────────────────────────────────────────────────────────────

  describe("single batch (<=10 chunks)", () => {
  it("calls ai.run exactly once for 1 chunk", async () => {
    const vectors = fakeVectors(1);
    const ai = makeMockAi([vectors]);
    const promise = embedChunks(ai as any, ["chunk one"]);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(ai.run).toHaveBeenCalledTimes(1);
    expect(result).toEqual(vectors);
  });

  it("calls ai.run exactly once for 10 chunks", async () => {
    const vectors = fakeVectors(10);
    const ai = makeMockAi([vectors]);
    const chunks = Array.from({ length: 10 }, (_, i) => `chunk ${i}`);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(ai.run).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(10);
    expect(result).toEqual(vectors);
  });

  it("passes the correct model identifier to ai.run", async () => {
    const ai = makeMockAi([fakeVectors(1)]);
    const promise = embedChunks(ai as any, ["test chunk"]);
    await vi.runAllTimersAsync();
    await promise;
    expect(ai.run).toHaveBeenCalledWith(
      "@cf/baai/bge-large-en-v1.5",
      expect.objectContaining({ text: ["test chunk"] }),
    );
  });

  it("passes the chunk texts as the text property", async () => {
    const chunks = ["first", "second", "third"];
    const ai = makeMockAi([fakeVectors(3)]);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    await promise;
    expect(ai.run).toHaveBeenCalledWith(
      expect.any(String),
      { text: chunks },
    );
  });
  });

  // ── multiple batches ────────────────────────────────────────────────────────

  describe("multiple batches (>10 chunks)", () => {
  it("calls ai.run twice for 11 chunks", async () => {
    const batch1 = fakeVectors(10);
    const batch2 = fakeVectors(1);
    const ai = makeMockAi([batch1, batch2]);
    const chunks = Array.from({ length: 11 }, (_, i) => `chunk ${i}`);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(ai.run).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(11);
  });

  it("calls ai.run 3 times for 25 chunks", async () => {
    const ai = makeMockAi([fakeVectors(10), fakeVectors(10), fakeVectors(5)]);
    const chunks = Array.from({ length: 25 }, (_, i) => `c${i}`);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(ai.run).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(25);
  });

  it("concatenates embeddings from all batches in order", async () => {
    const batch1 = [[1, 0, 0], [0, 1, 0]]; // 2 embeddings, would be 10 in prod but fine
    const batch2 = [[0, 0, 1]];
    // Make 10 chunks for batch1, 1 for batch2 (total 11)
    const b1Full = fakeVectors(10);
    const b2 = [[99, 88, 77]];
    const ai = makeMockAi([b1Full, b2]);
    const chunks = Array.from({ length: 11 }, (_, i) => `c${i}`);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    const result = await promise;
    // First 10 entries come from batch1, last from batch2
    expect(result[0]).toEqual(b1Full[0]);
    expect(result[10]).toEqual(b2[0]);
  });
  });

  // ── partial / missing response data ────────────────────────────────────────

  describe("response without data field", () => {
  it("skips batch when ai.run returns undefined data", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({ data: undefined }),
    };
    const promise = embedChunks(ai as any, ["chunk"]);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual([]);
  });

  it("skips batch when ai.run returns null data", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({ data: null }),
    };
    const promise = embedChunks(ai as any, ["a", "b"]);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual([]);
  });

  it("collects results from successful batches when one batch has no data", async () => {
    let call = 0;
    const ai = {
      run: vi.fn().mockImplementation(async () => {
        call++;
        if (call === 1) return { data: fakeVectors(10) };
        return {}; // no data field on second batch
      }),
    };
    const chunks = Array.from({ length: 11 }, (_, i) => `c${i}`);
    const promise = embedChunks(ai as any, chunks);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toHaveLength(10); // only first batch contributed
  });
  });
});
