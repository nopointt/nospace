import { describe, test, expect, mock, afterEach } from "bun:test"
import { RagService } from "../src/services/rag"
import { buildContext } from "../src/services/rag/context"
import { rewriteQuery } from "../src/services/rag/rewriter"
import type { HybridSearchResult } from "../src/services/vectorstore/types"
import type { EmbedderService } from "../src/services/embedder"
import type { VectorStoreService } from "../src/services/vectorstore"

// --- buildContext ---

describe("buildContext", () => {
  const makeResult = (id: string, content: string, score: number): HybridSearchResult => ({
    id,
    score,
    source: "both",
    metadata: { documentId: "d1", chunkIndex: 0, content },
  })

  test("builds context from results", () => {
    const results = [
      makeResult("c1", "First chunk content", 0.9),
      makeResult("c2", "Second chunk content", 0.8),
    ]

    const { context, sources } = buildContext(results)

    expect(context).toContain("First chunk content")
    expect(context).toContain("Second chunk content")
    expect(context).toContain("[Source 1]")
    expect(context).toContain("[Source 2]")
    expect(sources.length).toBe(2)
    expect(sources[0].chunkId).toBe("c1")
    expect(sources[1].chunkId).toBe("c2")
  })

  test("respects maxTokens budget", () => {
    const results = [
      makeResult("c1", Array(100).fill("word").join(" "), 0.9),
      makeResult("c2", Array(100).fill("word").join(" "), 0.8),
      makeResult("c3", Array(100).fill("word").join(" "), 0.7),
    ]

    const { sources } = buildContext(results, 150)

    // Should include first chunk (100 tokens) but stop before third
    expect(sources.length).toBeLessThanOrEqual(2)
  })

  test("returns empty for no results", () => {
    const { context, sources } = buildContext([])

    expect(context).toBe("")
    expect(sources).toEqual([])
  })

  test("preserves source metadata", () => {
    const results: HybridSearchResult[] = [
      {
        id: "chunk-42",
        score: 0.95,
        source: "vector",
        metadata: { documentId: "doc-7", chunkIndex: 3, content: "important" },
      },
    ]

    const { sources } = buildContext(results)

    expect(sources[0].chunkId).toBe("chunk-42")
    expect(sources[0].documentId).toBe("doc-7")
    expect(sources[0].score).toBe(0.95)
    expect(sources[0].source).toBe("vector")
  })

  test("includes at least one chunk even if over budget", () => {
    const results = [
      makeResult("c1", Array(5000).fill("word").join(" "), 0.9),
    ]

    const { sources } = buildContext(results, 100)

    expect(sources.length).toBe(1)
  })
})

// --- rewriteQuery ---

describe("rewriteQuery", () => {
  function createMockAi(response: string) {
    return {
      run: mock(async () => ({ response })),
      toMarkdown: mock(async () => []),
    } as unknown as Ai
  }

  test("returns original query + variants", async () => {
    const ai = createMockAi("Alternative phrasing one\nAnother way to ask\nThird variant")
    const variants = await rewriteQuery("test query", 3, ai)

    expect(variants[0]).toBe("test query")
    expect(variants.length).toBeGreaterThan(1)
    expect(variants.length).toBeLessThanOrEqual(4)
  })

  test("returns only original when count is 0", async () => {
    const ai = createMockAi("")
    const variants = await rewriteQuery("test query", 0, ai)

    expect(variants).toEqual(["test query"])
    expect(ai.run).not.toHaveBeenCalled()
  })

  test("handles empty AI response", async () => {
    const ai = createMockAi("")
    const variants = await rewriteQuery("test query", 3, ai)

    expect(variants).toEqual(["test query"])
  })

  test("filters out overly long variants", async () => {
    const longLine = "x".repeat(600)
    const ai = createMockAi(`Good variant\n${longLine}\nAnother good one`)
    const variants = await rewriteQuery("test query", 3, ai)

    expect(variants).not.toContain(longLine)
  })
})

// --- RagService ---

describe("RagService", () => {
  function createMockDeps() {
    const ai = {
      run: mock(async (model: string, params: any) => {
        if (model.includes("llama-3.1-8b")) {
          const content = params?.messages?.[1]?.content || ""
          if (content.includes("Context:") && content.includes("[Source")) {
            return { response: "Based on the context, the answer is 42." }
          }
          // Query rewrite
          return { response: "Rephrased query one\nRephrased query two" }
        }
        return { response: "" }
      }),
      toMarkdown: mock(async () => []),
    } as unknown as Ai

    const embedder = {
      embed: mock(async () => ({
        vector: Array(1024).fill(0.1),
        dimensions: 1024,
        tokenCount: 5,
      })),
      embedBatch: mock(async (texts: string[]) => ({
        embeddings: texts.map(() => ({
          vector: Array(1024).fill(0.1),
          dimensions: 1024,
          tokenCount: 5,
        })),
        totalTokens: texts.length * 5,
      })),
      embedQuery: mock(async () => ({
        vector: Array(1024).fill(0.1),
        dimensions: 1024,
        tokenCount: 5,
      })),
    } as unknown as EmbedderService

    const vectorStore = {
      search: mock(async () => [
        {
          id: "c1",
          score: 0.03,
          source: "both" as const,
          metadata: { documentId: "d1", chunkIndex: 0, content: "The answer to everything is 42." },
        },
        {
          id: "c2",
          score: 0.02,
          source: "vector" as const,
          metadata: { documentId: "d1", chunkIndex: 1, content: "Additional context about the answer." },
        },
      ]),
      searchVector: mock(async () => []),
      searchFts: mock(async () => []),
      index: mock(async () => {}),
      initialize: mock(async () => {}),
      deleteByDocument: mock(async () => {}),
    } as unknown as VectorStoreService

    return { ai, embedder, vectorStore }
  }

  test("full pipeline: query → rewrite → embed → search → context → answer", async () => {
    const deps = createMockDeps()
    const service = new RagService(deps)

    const result = await service.query({ query: "What is the answer?" })

    expect(result.answer).toContain("42")
    expect(result.sources.length).toBeGreaterThan(0)
    expect(result.queryVariants.length).toBeGreaterThan(1) // original + rewrites
    expect(result.tokenUsage.embeddingTokens).toBeGreaterThan(0)
  })

  test("sources contain correct metadata", async () => {
    const deps = createMockDeps()
    const service = new RagService(deps)

    const result = await service.query({ query: "test" })

    expect(result.sources[0].chunkId).toBe("c1")
    expect(result.sources[0].documentId).toBe("d1")
    expect(result.sources[0].content).toContain("42")
    expect(result.sources[0].source).toBe("both")
  })

  test("calls embedder with retrieval.query task", async () => {
    const deps = createMockDeps()
    const service = new RagService(deps)

    await service.query({ query: "test" })

    expect(deps.embedder.embedBatch).toHaveBeenCalledTimes(1)
    const callArgs = (deps.embedder.embedBatch as any).mock.calls[0]
    expect(callArgs[1]).toEqual({ task: "retrieval.query" })
  })

  test("deduplicates results across query variants", async () => {
    const deps = createMockDeps()
    // Make vectorStore return same IDs for different queries
    deps.vectorStore.search = mock(async () => [
      {
        id: "c1",
        score: 0.03,
        source: "both" as const,
        metadata: { documentId: "d1", chunkIndex: 0, content: "Same chunk" },
      },
    ]) as any

    const service = new RagService(deps)
    const result = await service.query({ query: "test" })

    // c1 should appear only once in sources despite multiple search calls
    const c1Count = result.sources.filter((s) => s.chunkId === "c1").length
    expect(c1Count).toBe(1)
  })

  test("handles empty search results gracefully", async () => {
    const deps = createMockDeps()
    deps.vectorStore.search = mock(async () => []) as any

    const service = new RagService(deps)
    const result = await service.query({ query: "unknown topic" })

    expect(result.answer).toContain("don't have enough information")
    expect(result.sources).toEqual([])
  })

  test("respects custom config", async () => {
    const deps = createMockDeps()
    const service = new RagService({
      ...deps,
      config: {
        queryRewriteCount: 0,
        maxContextTokens: 50,
        systemPrompt: "Custom system prompt.",
      },
    })

    const result = await service.query({ query: "test" })

    // With rewriteCount=0, only original query
    expect(result.queryVariants).toEqual(["test"])
  })

  test("passes topK to vector store", async () => {
    const deps = createMockDeps()
    const service = new RagService(deps)

    await service.query({ query: "test", topK: 5 })

    const searchCalls = (deps.vectorStore.search as any).mock.calls
    for (const call of searchCalls) {
      expect(call[2].topK).toBe(5)
    }
  })

  test("tokenUsage tracks all stages", async () => {
    const deps = createMockDeps()
    const service = new RagService(deps)

    const result = await service.query({ query: "test" })

    expect(result.tokenUsage.embeddingTokens).toBeGreaterThan(0)
    expect(result.tokenUsage.llmPromptTokens).toBeGreaterThan(0)
    expect(result.tokenUsage.llmCompletionTokens).toBeGreaterThan(0)
  })
})
