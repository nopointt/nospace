import { describe, test, expect } from "bun:test"
import { McpService, TOOL_NAMES } from "../src/services/mcp"
import app from "../src/index"

// --- McpService: tool registration ---

describe("McpService — tool registration", () => {
  const service = new McpService()

  test("registers all 3 tools", () => {
    const tools = service.getTools()
    expect(tools.length).toBe(3)
  })

  test("registers search_knowledge", () => {
    const tools = service.getTools()
    const names = tools.map((t) => t.name)
    expect(names).toContain(TOOL_NAMES.SEARCH_KNOWLEDGE)
  })

  test("registers get_document", () => {
    const tools = service.getTools()
    const names = tools.map((t) => t.name)
    expect(names).toContain(TOOL_NAMES.GET_DOCUMENT)
  })

  test("registers list_documents", () => {
    const tools = service.getTools()
    const names = tools.map((t) => t.name)
    expect(names).toContain(TOOL_NAMES.LIST_DOCUMENTS)
  })

  test("each tool has name, description, and inputSchema", () => {
    for (const tool of service.getTools()) {
      expect(typeof tool.name).toBe("string")
      expect(typeof tool.description).toBe("string")
      expect(typeof tool.inputSchema).toBe("object")
    }
  })
})

// --- McpService: handleToolCall routing ---

describe("McpService — handleToolCall routing", () => {
  const service = new McpService()

  test("routes search_knowledge correctly", () => {
    const result = service.handleToolCall(TOOL_NAMES.SEARCH_KNOWLEDGE, { query: "machine learning" })
    expect(result).toHaveProperty("results")
    expect(result).toHaveProperty("total")
  })

  test("routes get_document correctly", () => {
    const result = service.handleToolCall(TOOL_NAMES.GET_DOCUMENT, { documentId: "doc-123" })
    expect(result).toHaveProperty("id")
    expect(result).toHaveProperty("name")
    expect(result).toHaveProperty("content")
    expect(result).toHaveProperty("metadata")
  })

  test("routes list_documents correctly", () => {
    const result = service.handleToolCall(TOOL_NAMES.LIST_DOCUMENTS, {})
    expect(result).toHaveProperty("documents")
    expect(result).toHaveProperty("total")
  })

  test("throws on unknown tool name", () => {
    expect(() => service.handleToolCall("nonexistent_tool", {})).toThrow("Unknown MCP tool: nonexistent_tool")
  })
})

// --- searchKnowledge: output shape ---

describe("searchKnowledge — output shape", () => {
  const service = new McpService()

  test("returns results array and total", () => {
    const result = service.handleToolCall(TOOL_NAMES.SEARCH_KNOWLEDGE, { query: "test query" }) as {
      results: Array<{ id: string; content: string; score: number }>
      total: number
    }
    expect(Array.isArray(result.results)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  test("each result has id, content, and score", () => {
    const result = service.handleToolCall(TOOL_NAMES.SEARCH_KNOWLEDGE, { query: "api design", limit: 2 }) as {
      results: Array<{ id: string; content: string; score: number }>
      total: number
    }
    for (const item of result.results) {
      expect(typeof item.id).toBe("string")
      expect(typeof item.content).toBe("string")
      expect(typeof item.score).toBe("number")
    }
  })

  test("respects limit parameter", () => {
    const result = service.handleToolCall(TOOL_NAMES.SEARCH_KNOWLEDGE, { query: "limit test", limit: 1 }) as {
      results: Array<unknown>
      total: number
    }
    expect(result.results.length).toBeLessThanOrEqual(1)
  })
})

// --- getDocument: output shape ---

describe("getDocument — output shape", () => {
  const service = new McpService()

  test("returns id matching the requested documentId", () => {
    const result = service.handleToolCall(TOOL_NAMES.GET_DOCUMENT, { documentId: "doc-abc" }) as {
      id: string
      name: string
      content: string
      metadata: Record<string, unknown>
    }
    expect(result.id).toBe("doc-abc")
  })

  test("returns name, content, and metadata fields", () => {
    const result = service.handleToolCall(TOOL_NAMES.GET_DOCUMENT, { documentId: "doc-xyz" }) as {
      id: string
      name: string
      content: string
      metadata: Record<string, unknown>
    }
    expect(typeof result.name).toBe("string")
    expect(typeof result.content).toBe("string")
    expect(typeof result.metadata).toBe("object")
  })
})

// --- listDocuments: output shape ---

describe("listDocuments — output shape", () => {
  const service = new McpService()

  test("returns documents array and total", () => {
    const result = service.handleToolCall(TOOL_NAMES.LIST_DOCUMENTS, {}) as {
      documents: Array<{ id: string; name: string; status: string; createdAt: string }>
      total: number
    }
    expect(Array.isArray(result.documents)).toBe(true)
    expect(typeof result.total).toBe("number")
    expect(result.total).toBe(result.documents.length)
  })

  test("each document has id, name, status, and createdAt", () => {
    const result = service.handleToolCall(TOOL_NAMES.LIST_DOCUMENTS, {}) as {
      documents: Array<{ id: string; name: string; status: string; createdAt: string }>
      total: number
    }
    for (const doc of result.documents) {
      expect(typeof doc.id).toBe("string")
      expect(typeof doc.name).toBe("string")
      expect(typeof doc.status).toBe("string")
      expect(typeof doc.createdAt).toBe("string")
    }
  })
})

// --- HTTP route: GET /mcp/tools ---

describe("GET /mcp/tools", () => {
  test("returns 200 with tools array and total", async () => {
    const res = await app.request("/mcp/tools")
    expect(res.status).toBe(200)

    const body = (await res.json()) as { tools: Array<{ name: string }>; total: number }
    expect(Array.isArray(body.tools)).toBe(true)
    expect(typeof body.total).toBe("number")
    expect(body.total).toBe(3)
  })

  test("tool list includes all 3 tool names", async () => {
    const res = await app.request("/mcp/tools")
    const body = (await res.json()) as { tools: Array<{ name: string }> }
    const names = body.tools.map((t) => t.name)

    expect(names).toContain(TOOL_NAMES.SEARCH_KNOWLEDGE)
    expect(names).toContain(TOOL_NAMES.GET_DOCUMENT)
    expect(names).toContain(TOOL_NAMES.LIST_DOCUMENTS)
  })
})

// --- HTTP route: POST /mcp ---

describe("POST /mcp", () => {
  test("returns 200 for valid search_knowledge call", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: TOOL_NAMES.SEARCH_KNOWLEDGE, input: { query: "hello" } }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { tool: string; result: unknown }
    expect(body.tool).toBe(TOOL_NAMES.SEARCH_KNOWLEDGE)
    expect(body.result).toHaveProperty("results")
  })

  test("returns 404 for unknown tool", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "does_not_exist", input: {} }),
    })
    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: string }
    expect(typeof body.error).toBe("string")
  })

  test("returns 400 for missing tool field", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: {} }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 200 for list_documents with empty input", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: TOOL_NAMES.LIST_DOCUMENTS, input: {} }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { result: { documents: unknown[]; total: number } }
    expect(body.result).toHaveProperty("documents")
  })
})
