import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedChunks } from "~/lib/pipeline/embedder";
import { createMockAi } from "~//__tests__/mocks/cf-env";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEmbedding(dim = 4): number[] {
  return Array.from({ length: dim }, (_, i) => i * 0.1);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("embedChunks", () => {
  // Speed up tests by patching setTimeout so batch delay doesn't block
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("when chunks fit in a single batch (≤10)", () => {
    it("should return embeddings matching the AI response data", async () => {
      const mockAi = createMockAi();
      const embeddings = [makeEmbedding(), makeEmbedding(), makeEmbedding()];
      vi.mocked(mockAi.run).mockResolvedValue({ data: embeddings } as any);

      const promise = embedChunks(mockAi as any, ["chunk1", "chunk2", "chunk3"]);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockAi.run).toHaveBeenCalledOnce();
      expect(mockAi.run).toHaveBeenCalledWith("@cf/baai/bge-large-en-v1.5", {
        text: ["chunk1", "chunk2", "chunk3"],
      });
      expect(result).toEqual(embeddings);
    });

    it("should return an empty array when chunks array is empty", async () => {
      const mockAi = createMockAi();
      const promise = embedChunks(mockAi as any, []);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockAi.run).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should return an empty array when AI returns no data property", async () => {
      const mockAi = createMockAi();
      vi.mocked(mockAi.run).mockResolvedValue({} as any); // no .data

      const promise = embedChunks(mockAi as any, ["chunk1"]);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual([]);
    });

    it("should handle AI returning empty data array", async () => {
      const mockAi = createMockAi();
      vi.mocked(mockAi.run).mockResolvedValue({ data: [] } as any);

      const promise = embedChunks(mockAi as any, ["chunk1"]);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual([]);
    });
  });

  describe("batch splitting (more than 10 chunks)", () => {
    it("should split 15 chunks into two batches of 10 and 5", async () => {
      const mockAi = createMockAi();
      const batch1Embeddings = Array.from({ length: 10 }, () => makeEmbedding());
      const batch2Embeddings = Array.from({ length: 5 }, () => makeEmbedding());

      vi.mocked(mockAi.run)
        .mockResolvedValueOnce({ data: batch1Embeddings } as any)
        .mockResolvedValueOnce({ data: batch2Embeddings } as any);

      const chunks = Array.from({ length: 15 }, (_, i) => `chunk ${i}`);
      const promise = embedChunks(mockAi as any, chunks);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockAi.run).toHaveBeenCalledTimes(2);
      // First call should receive exactly 10 chunks
      expect(mockAi.run).toHaveBeenNthCalledWith(1, "@cf/baai/bge-large-en-v1.5", {
        text: chunks.slice(0, 10),
      });
      // Second call should receive the remaining 5
      expect(mockAi.run).toHaveBeenNthCalledWith(2, "@cf/baai/bge-large-en-v1.5", {
        text: chunks.slice(10),
      });
      // Combined result should have 15 embeddings
      expect(result).toHaveLength(15);
      expect(result).toEqual([...batch1Embeddings, ...batch2Embeddings]);
    });

    it("should split exactly 10 chunks into a single batch with no delay", async () => {
      const mockAi = createMockAi();
      const embeddings = Array.from({ length: 10 }, () => makeEmbedding());
      vi.mocked(mockAi.run).mockResolvedValue({ data: embeddings } as any);

      const chunks = Array.from({ length: 10 }, (_, i) => `chunk ${i}`);
      const promise = embedChunks(mockAi as any, chunks);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockAi.run).toHaveBeenCalledOnce();
      expect(result).toHaveLength(10);
    });

    it("should correctly aggregate embeddings across 3 batches (25 chunks)", async () => {
      const mockAi = createMockAi();
      const b1 = Array.from({ length: 10 }, () => makeEmbedding());
      const b2 = Array.from({ length: 10 }, () => makeEmbedding());
      const b3 = Array.from({ length: 5 }, () => makeEmbedding());

      vi.mocked(mockAi.run)
        .mockResolvedValueOnce({ data: b1 } as any)
        .mockResolvedValueOnce({ data: b2 } as any)
        .mockResolvedValueOnce({ data: b3 } as any);

      const chunks = Array.from({ length: 25 }, (_, i) => `chunk ${i}`);
      const promise = embedChunks(mockAi as any, chunks);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockAi.run).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(25);
    });
  });

  describe("partial AI response handling", () => {
    it("should skip batches where AI returns undefined data", async () => {
      const mockAi = createMockAi();
      const b2 = [makeEmbedding()];

      vi.mocked(mockAi.run)
        .mockResolvedValueOnce({ data: undefined } as any) // batch 1 — no data
        .mockResolvedValueOnce({ data: b2 } as any);       // batch 2 — ok

      const chunks = Array.from({ length: 11 }, (_, i) => `chunk ${i}`);
      const promise = embedChunks(mockAi as any, chunks);
      await vi.runAllTimersAsync();
      const result = await promise;

      // Only the second batch's embeddings should appear
      expect(result).toHaveLength(1);
      expect(result).toEqual(b2);
    });
  });
});
