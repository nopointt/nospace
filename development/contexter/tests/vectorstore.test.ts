import { describe, test, expect, mock } from "bun:test"
import { reciprocalRankFusion } from "../src/services/vectorstore/hybrid"
import { VectorService } from "../src/services/vectorstore/vector"
import { FtsService } from "../src/services/vectorstore/fts"
import { VectorStoreService } from "../src/services/vectorstore"
import type { SearchResult, VectorRecord } from "../src/services/vectorstore/types"
import { RRF_K } from "../src/services/vectorstore/types"

// --- Reciprocal Rank Fusion ---

describe("reciprocalRankFusion", () => {
  const makeResult = (id: string, score: number): SearchResult => ({
    id,
    score,
    metadata: { documentId: "doc1", chunkIndex: 0, content: `content of ${id}` },
  })

  test("merges vector and FTS results", () => {
    const vector: SearchResult[] = [makeResult("a", 0.9), makeResult("b", 0.8)]
    const fts: SearchResult[] = [makeResult("b", 5.0), makeResult("c", 3.0)]

    const fused = reciprocalRankFusion(vector, fts)

    expect(fused.length).toBe(3)
    // "b" appears in both → highest score
    const bResult = fused.find((r) => r.id === "b")
    expect(bResult).toBeDefined()
    expect(bResult!.source).toBe("both")
    expect(bResult!.score).toBeGreaterThan(fused.find((r) => r.id === "a")!.score)
  })

  test("items in both lists score higher than single-source", () => {
    const vector: SearchResult[] = [makeResult("shared", 0.9), makeResult("vec-only", 0.8)]
    const fts: SearchResult[] = [makeResult("shared", 5.0), makeResult("fts-only", 3.0)]

    const fused = reciprocalRankFusion(vector, fts)

    const sharedScore = fused.find((r) => r.id === "shared")!.score
    const vecOnlyScore = fused.find((r) => r.id === "vec-only")!.score
    const ftsOnlyScore = fused.find((r) => r.id === "fts-only")!.score

    expect(sharedScore).toBeGreaterThan(vecOnlyScore)
    expect(sharedScore).toBeGreaterThan(ftsOnlyScore)
  })

  test("respects topK limit", () => {
    const vector = Array(20).fill(null).map((_, i) => makeResult(`v${i}`, 1 - i * 0.01))
    const fts = Array(20).fill(null).map((_, i) => makeResult(`f${i}`, 20 - i))

    const fused = reciprocalRankFusion(vector, fts, 5)

    expect(fused.length).toBe(5)
  })

  test("handles empty vector results", () => {
    const fts: SearchResult[] = [makeResult("a", 5.0), makeResult("b", 3.0)]

    const fused = reciprocalRankFusion([], fts)

    expect(fused.length).toBe(2)
    expect(fused[0].source).toBe("fts")
  })

  test("handles empty FTS results", () => {
    const vector: SearchResult[] = [makeResult("a", 0.9)]

    const fused = reciprocalRankFusion(vector, [])

    expect(fused.length).toBe(1)
    expect(fused[0].source).toBe("vector")
  })

  test("handles both empty", () => {
    const fused = reciprocalRankFusion([], [])
    expect(fused).toEqual([])
  })

  test("RRF scores are correct formula", () => {
    const vector: SearchResult[] = [makeResult("a", 0.9)] // rank 0
    const fts: SearchResult[] = [] // not present

    const fused = reciprocalRankFusion(vector, fts)

    // RRF score for rank 0: 1 / (60 + 0 + 1) = 1/61
    expect(fused[0].score).toBeCloseTo(1 / (RRF_K + 1), 10)
  })

  test("preserves metadata", () => {
    const vector: SearchResult[] = [
      {
        id: "chunk-42",
        score: 0.95,
        metadata: { documentId: "doc-7", chunkIndex: 3, content: "important text" },
      },
    ]

    const fused = reciprocalRankFusion(vector, [])

    expect(fused[0].metadata.documentId).toBe("doc-7")
    expect(fused[0].metadata.chunkIndex).toBe(3)
    expect(fused[0].metadata.content).toBe("important text")
  })
})

// --- VectorService (mocked Vectorize) ---

describe("VectorService", () => {
  function createMockIndex() {
    return {
      insert: mock(async () => ({ ids: [], count: 0, errors: [] })),
      query: mock(async () => ({
        matches: [
          { id: "c1", score: 0.95, metadata: { documentId: "d1", chunkIndex: 0, content: "hello" } },
          { id: "c2", score: 0.80, metadata: { documentId: "d1", chunkIndex: 1, content: "world" } },
        ],
      })),
      deleteByIds: mock(async () => ({ ids: [], count: 0, errors: [] })),
      getByIds: mock(async () => []),
      describe: mock(async () => ({ dimensions: 1024, vectorsCount: 0 })),
      upsert: mock(async () => ({ ids: [], count: 0, errors: [] })),
    } as unknown as VectorizeIndex
  }

  test("insert sends vectors to index", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    const records: VectorRecord[] = [
      { id: "c1", vector: [0.1, 0.2], metadata: { documentId: "d1", chunkIndex: 0, content: "test" } },
    ]

    await service.insert(records)

    expect(mockIndex.insert).toHaveBeenCalledTimes(1)
  })

  test("insert truncates metadata content to 1000 chars", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    const longContent = "x".repeat(2000)
    await service.insert([
      { id: "c1", vector: [0.1], metadata: { documentId: "d1", chunkIndex: 0, content: longContent } },
    ])

    const callArgs = (mockIndex.insert as any).mock.calls[0][0]
    expect(callArgs[0].metadata.content.length).toBe(1000)
  })

  test("search returns results with correct shape", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    const results = await service.search([0.1, 0.2], 10)

    expect(results.length).toBe(2)
    expect(results[0].id).toBe("c1")
    expect(results[0].score).toBe(0.95)
    expect(results[0].metadata.documentId).toBe("d1")
    expect(results[0].metadata.content).toBe("hello")
  })

  test("deleteByIds calls index", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    await service.deleteByIds(["c1", "c2"])

    expect(mockIndex.deleteByIds).toHaveBeenCalledTimes(1)
  })

  test("deleteByIds skips empty array", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    await service.deleteByIds([])

    expect(mockIndex.deleteByIds).toHaveBeenCalledTimes(0)
  })

  test("insert batches at 1000", async () => {
    const mockIndex = createMockIndex()
    const service = new VectorService(mockIndex)

    const records = Array(1500).fill(null).map((_, i) => ({
      id: `c${i}`,
      vector: [0.1],
      metadata: { documentId: "d1", chunkIndex: i, content: "t" },
    }))

    await service.insert(records)

    expect(mockIndex.insert).toHaveBeenCalledTimes(2)
  })
})

// --- FtsService (mocked D1) ---

describe("FtsService", () => {
  function createMockDb() {
    const mockStmt = {
      bind: mock(function(this: any) { return this }),
      run: mock(async () => ({ success: true })),
      all: mock(async () => ({
        results: [
          { id: "c1", document_id: "d1", content: "matching text", chunk_index: 0, rank: -5.2 },
          { id: "c2", document_id: "d1", content: "another match", chunk_index: 1, rank: -3.1 },
        ],
      })),
      first: mock(async () => null),
    }

    return {
      prepare: mock(() => mockStmt),
      batch: mock(async (stmts: any[]) => stmts.map(() => ({ success: true }))),
    } as unknown as D1Database
  }

  test("search returns results with inverted rank as score", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    const results = await service.search("matching text")

    expect(results.length).toBe(2)
    expect(results[0].id).toBe("c1")
    expect(results[0].score).toBe(5.2) // inverted from -5.2
    expect(results[0].metadata.documentId).toBe("d1")
    expect(results[0].metadata.content).toBe("matching text")
  })

  test("search sanitizes FTS operators", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    await service.search("hello AND world OR NOT test")

    const bindArgs = (mockDb.prepare as any).mock.results[0].value.bind.mock.calls[0]
    const sanitized = bindArgs[0]
    expect(sanitized).not.toContain("AND")
    expect(sanitized).not.toContain("OR")
    expect(sanitized).not.toContain("NOT")
  })

  test("search returns empty for empty query", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    const results = await service.search("   ")

    expect(results).toEqual([])
  })

  test("search returns empty for special chars only", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    const results = await service.search("@#$%^&*()")

    expect(results).toEqual([])
  })

  test("insert calls db with correct params", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    await service.insert("c1", "d1", "hello world", 0)

    expect(mockDb.prepare).toHaveBeenCalled()
  })

  test("initialize creates FTS5 table and triggers", async () => {
    const mockDb = createMockDb()
    const service = new FtsService(mockDb)

    await service.initialize()

    expect(mockDb.batch).toHaveBeenCalledTimes(1)
  })
})

// --- VectorStoreService (integration) ---

describe("VectorStoreService", () => {
  function createMockConfig() {
    const mockStmt = {
      bind: mock(function(this: any) { return this }),
      run: mock(async () => ({ success: true })),
      all: mock(async () => ({
        results: [
          { id: "c1", document_id: "d1", content: "fts match", chunk_index: 0, rank: -5.0 },
        ],
      })),
      first: mock(async () => null),
    }

    const db = {
      prepare: mock(() => mockStmt),
      batch: mock(async (stmts: any[]) => stmts.map(() => ({ success: true }))),
    } as unknown as D1Database

    const vectorIndex = {
      insert: mock(async () => ({ ids: [], count: 0, errors: [] })),
      query: mock(async () => ({
        matches: [
          { id: "c1", score: 0.9, metadata: { documentId: "d1", chunkIndex: 0, content: "vec match" } },
          { id: "c3", score: 0.7, metadata: { documentId: "d1", chunkIndex: 2, content: "vec only" } },
        ],
      })),
      deleteByIds: mock(async () => ({ ids: [], count: 0, errors: [] })),
      getByIds: mock(async () => []),
      describe: mock(async () => ({ dimensions: 1024, vectorsCount: 0 })),
      upsert: mock(async () => ({ ids: [], count: 0, errors: [] })),
    } as unknown as VectorizeIndex

    return { db, vectorIndex }
  }

  test("search returns hybrid results with RRF", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    const results = await service.search([0.1, 0.2], "test query", { scoreThreshold: 0 })

    expect(results.length).toBeGreaterThan(0)
    // c1 appears in both vector and FTS → should be "both"
    const c1 = results.find((r) => r.id === "c1")
    expect(c1).toBeDefined()
    expect(c1!.source).toBe("both")
  })

  test("search runs vector and FTS in parallel", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    await service.search([0.1], "query")

    expect(config.vectorIndex.query).toHaveBeenCalledTimes(1)
    expect(config.db.prepare).toHaveBeenCalled()
  })

  test("index inserts into both Vectorize and FTS", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    const records: VectorRecord[] = [
      { id: "c1", vector: [0.1], metadata: { documentId: "d1", chunkIndex: 0, content: "test" } },
    ]

    await service.index(records)

    expect(config.vectorIndex.insert).toHaveBeenCalledTimes(1)
  })

  test("searchVector returns vector-only results", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    const results = await service.searchVector([0.1], 5)

    expect(results.length).toBe(2)
    expect(config.vectorIndex.query).toHaveBeenCalledTimes(1)
  })

  test("searchFts returns FTS-only results", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    const results = await service.searchFts("test query", 5)

    expect(results.length).toBe(1)
    expect(results[0].metadata.content).toBe("fts match")
  })

  test("deleteByDocument calls both stores", async () => {
    const config = createMockConfig()
    const service = new VectorStoreService(config)

    await service.deleteByDocument("d1", ["c1", "c2"])

    expect(config.vectorIndex.deleteByIds).toHaveBeenCalledTimes(1)
    expect(config.db.prepare).toHaveBeenCalled()
  })
})
