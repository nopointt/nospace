import { describe, test, expect, mock, afterEach } from "bun:test"
import { EmbedderService } from "../src/services/embedder"

const MOCK_VECTOR = Array(1024).fill(0).map((_, i) => Math.sin(i) * 0.1)

function mockJinaResponse(count: number, dimensions: number = 1024) {
  return {
    data: Array(count)
      .fill(null)
      .map((_, i) => ({
        embedding: Array(dimensions).fill(0).map((_, j) => Math.sin(i + j) * 0.1),
        index: i,
        tokens: 10,
      })),
    usage: {
      total_tokens: count * 10,
      prompt_tokens: count * 10,
    },
  }
}

let originalFetch: typeof globalThis.fetch

function setMockFetch(responseBody: unknown, status: number = 200) {
  originalFetch = globalThis.fetch
  globalThis.fetch = mock(async (url: any, init: any) => {
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  }) as typeof fetch
}

function restoreFetch() {
  if (originalFetch) globalThis.fetch = originalFetch
}

describe("EmbedderService", () => {
  afterEach(() => restoreFetch())

  test("embed() returns single vector with correct dimensions", async () => {
    setMockFetch(mockJinaResponse(1))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    const result = await service.embed("hello world")

    expect(result.vector.length).toBe(1024)
    expect(result.dimensions).toBe(1024)
    expect(result.tokenCount).toBe(10)
  })

  test("embed() sends correct request body", async () => {
    setMockFetch(mockJinaResponse(1))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    await service.embed("hello world")

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const callArgs = (globalThis.fetch as any).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)

    expect(body.model).toBe("jina-embeddings-v4")
    expect(body.dimensions).toBe(1024)
    expect(body.truncate_dim).toBe(1024)
    expect(body.task).toBe("retrieval.passage")
    expect(body.input).toEqual([{ text: "hello world" }])
  })

  test("embed() sends auth header", async () => {
    setMockFetch(mockJinaResponse(1))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "my-secret-key")

    await service.embed("test")

    const callArgs = (globalThis.fetch as any).mock.calls[0]
    expect(callArgs[1].headers.Authorization).toBe("Bearer my-secret-key")
  })

  test("embedQuery() uses retrieval.query task", async () => {
    setMockFetch(mockJinaResponse(1))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    await service.embedQuery("search query")

    const callArgs = (globalThis.fetch as any).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.task).toBe("retrieval.query")
  })

  test("embedBatch() handles multiple texts", async () => {
    setMockFetch(mockJinaResponse(3))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    const result = await service.embedBatch(["one", "two", "three"])

    expect(result.embeddings.length).toBe(3)
    expect(result.totalTokens).toBe(30)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test("embedBatch() splits into sub-batches when exceeding max", async () => {
    // 100 texts, max batch is 64 → should make 2 API calls
    const texts = Array(100).fill("word")

    let callCount = 0
    originalFetch = globalThis.fetch
    globalThis.fetch = mock(async () => {
      callCount++
      const batchSize = callCount === 1 ? 64 : 36
      return new Response(JSON.stringify(mockJinaResponse(batchSize)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")
    const result = await service.embedBatch(texts)

    expect(result.embeddings.length).toBe(100)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test("embedBatch() returns empty for empty input", async () => {
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    const result = await service.embedBatch([])

    expect(result.embeddings).toEqual([])
    expect(result.totalTokens).toBe(0)
  })

  test("embed() with custom dimensions", async () => {
    setMockFetch(mockJinaResponse(1, 512))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    const result = await service.embed("test", { dimensions: 512 })

    expect(result.vector.length).toBe(512)
    expect(result.dimensions).toBe(512)

    const callArgs = (globalThis.fetch as any).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.dimensions).toBe(512)
    expect(body.truncate_dim).toBe(512)
  })

  test("throws on API error", async () => {
    setMockFetch({ error: "Unauthorized" }, 401)
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "bad-key")

    await expect(service.embed("test")).rejects.toThrow("Jina API error 401")
  })

  test("throws on server error", async () => {
    setMockFetch({ error: "Internal server error" }, 500)
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    await expect(service.embed("test")).rejects.toThrow("Jina API error 500")
  })

  test("vectors contain numeric values", async () => {
    setMockFetch(mockJinaResponse(1))
    const service = new EmbedderService("https://api.jina.ai/v1/embeddings", "test-key")

    const result = await service.embed("test")

    for (const val of result.vector) {
      expect(typeof val).toBe("number")
      expect(Number.isFinite(val)).toBe(true)
    }
  })
})
