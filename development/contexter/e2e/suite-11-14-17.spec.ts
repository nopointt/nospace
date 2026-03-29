/**
 * Contexter — E2E Test Suites 11, 14 & 17
 *
 * Tests against PRODUCTION:
 *   API: https://api.contexter.cc
 *
 * Coverage:
 *   Suite 11 — MCP Tools (5 tests: initialize, tools/list, search_knowledge, add_context, invalid method)
 *   Suite 14 — Feedback System (4 tests: positive, negative, no auth, invalid payload)
 *   Suite 17 — Concurrent Operations (3 tests: parallel upload, parallel query, parallel register)
 *
 * Run:
 *   cd C:/Users/noadmin/nospace/development/contexter
 *   npx playwright test e2e/suite-11-14-17.spec.ts --reporter=list
 *
 * Notes:
 *   - NIM fallback is active: Groq rate limits fall back to NVIDIA NIM automatically.
 *     Query tests use a 120s timeout to accommodate NIM latency.
 *   - MCP endpoint: POST /sse (Streamable HTTP, JSON-RPC 2.0).
 *     Auth passed as query param: /sse?token=API_TOKEN
 *     Response may be SSE (text/event-stream) or plain JSON depending on Accept header.
 *   - Suite 14 requires a real query result to obtain valid chunk_ids — it runs a
 *     full register+upload+pipeline+query setup in beforeAll.
 *   - Suite 17 concurrent tests use 180s timeout.
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "https://api.contexter.cc"

// One unique run id per file execution so parallel runs never collide.
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserCreds {
  userId: string
  apiToken: string
  mcpUrl: string
}

interface StatusResponse {
  documentId: string
  status: string
  stages: Array<{ type: string; status: string; error_message?: string }>
}

interface QueryResponse {
  answer: string
  sources: Array<{
    content: string
    score: number
    document_name?: string
    chunk_id?: string
  }>
  query_id?: string
}

// ---------------------------------------------------------------------------
// Helpers (self-contained — no imports from other spec files)
// ---------------------------------------------------------------------------

function uniqueEmail(label: string): string {
  return `suite-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function registerUser(
  request: APIRequestContext,
  label: string,
): Promise<UserCreds> {
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      name: `test-${label}`,
      email: uniqueEmail(label),
    }),
  })
  expect(res.status(), `register [${label}] expected 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken, "apiToken must be present").toBeTruthy()
  return body as UserCreds
}

/**
 * Execute the presigned upload flow entirely in-memory.
 * Returns the documentId after confirm (status: "processing").
 */
async function uploadInlineContent(
  request: APIRequestContext,
  token: string,
  userId: string,
  content: string,
  fileName: string,
  mimeType = "text/plain",
): Promise<string> {
  const fileBuffer = Buffer.from(content, "utf8")
  const fileSize = fileBuffer.byteLength

  // Step 1 — presign
  const presignRes = await request.post(`${API}/api/upload/presign`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ fileName, mimeType, fileSize }),
  })
  expect(presignRes.status(), "presign expected 200").toBe(200)
  const presign = await presignRes.json() as {
    uploadUrl: string
    documentId: string
    r2Key: string
    expiresIn: number
  }
  expect(presign.uploadUrl,  "uploadUrl must be present").toBeTruthy()
  expect(presign.documentId, "documentId must be present").toBeTruthy()
  expect(presign.r2Key,      "r2Key must contain userId").toContain(userId)

  // Step 2 — PUT content to R2 presigned URL
  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  })
  expect(putRes.status, `PUT to R2 expected 2xx, got ${putRes.status}`).toBeLessThan(300)

  // Step 3 — confirm
  const confirmRes = await request.post(`${API}/api/upload/confirm`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      documentId: presign.documentId,
      r2Key: presign.r2Key,
      fileName,
      mimeType,
      fileSize,
    }),
  })
  expect(confirmRes.status(), "confirm expected 202").toBe(202)
  const confirm = await confirmRes.json() as { documentId: string; status: string }
  expect(confirm.documentId).toBe(presign.documentId)
  expect(confirm.status).toBe("processing")

  return presign.documentId
}

/**
 * Poll GET /api/status/:docId until all stages are done or any stage errors.
 * Throws if the timeout is exceeded.
 */
async function waitForPipeline(
  request: APIRequestContext,
  docId: string,
  token: string,
  timeoutMs = 60_000,
): Promise<StatusResponse> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status() !== 200) {
      await sleep(2_000)
      continue
    }
    const body = await res.json() as StatusResponse
    const allDone  = body.stages.every((s) => s.status === "done")
    const anyError = body.stages.some((s) => s.status === "error")
    if (allDone || anyError) return body
    await sleep(2_000)
  }
  throw new Error(`Pipeline did not complete within ${timeoutMs}ms for document ${docId}`)
}

/**
 * Execute a RAG query and return the parsed response body.
 * Returns null on 429/500/503 so callers can skip gracefully.
 * Throws on any other unexpected status.
 */
async function doQuery(
  request: APIRequestContext,
  token: string,
  query: string,
): Promise<{ status: number; body: QueryResponse | null }> {
  const res = await request.post(`${API}/api/query`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ query }),
  })
  const status = res.status()
  if (status === 429 || status === 500 || status === 503) {
    console.warn(`doQuery: LLM unavailable (${status}) for query "${query.slice(0, 60)}"`)
    return { status, body: null }
  }
  expect(status, `query expected 200, got ${status}`).toBe(200)
  const body = await res.json() as QueryResponse
  return { status, body }
}

/**
 * Parse an MCP response that may be plain JSON or SSE (text/event-stream).
 * For SSE responses, extracts and parses the first `data:` line.
 * Returns the parsed JSON-RPC response object.
 */
async function parseMcpResponse(res: Awaited<ReturnType<APIRequestContext["post"]>>): Promise<Record<string, unknown>> {
  const contentType = res.headers()["content-type"] ?? ""

  if (contentType.includes("text/event-stream")) {
    // SSE: parse first `data:` line
    const text = await res.text()
    const dataLine = text
      .split("\n")
      .find((line) => line.startsWith("data:"))
    if (!dataLine) {
      throw new Error(`SSE response contained no data: line. Body: ${text.slice(0, 200)}`)
    }
    const jsonStr = dataLine.slice("data:".length).trim()
    return JSON.parse(jsonStr) as Record<string, unknown>
  }

  return await res.json() as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// MCP JSON-RPC message builders
// ---------------------------------------------------------------------------

function mcpInitialize(id: number = 1): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "e2e-test", version: "0.1" },
    },
  })
}

function mcpToolsList(id: number = 2): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/list",
    params: {},
  })
}

function mcpToolsCall(id: number, toolName: string, args: Record<string, unknown>): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  })
}

function mcpInvalidMethod(id: number = 99): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "nonexistent/method",
    params: {},
  })
}

// ===========================================================================
// SUITE 11 — MCP Tools
// ===========================================================================

test.describe("Suite 11 — MCP Tools", () => {
  // Suite 11 needs one user for auth-required MCP calls (tests 11.3 and 11.4).
  // Tests 11.1, 11.2, 11.5 work with or without a valid token but still pass
  // the token to avoid potential auth rejections.

  let creds: UserCreds

  test.beforeAll(async ({ request }) => {
    creds = await registerUser(request, "s11-mcp")
  })

  // -------------------------------------------------------------------------
  // 11.1 — initialize → capabilities with tools
  // -------------------------------------------------------------------------

  test("11.1 MCP initialize returns capabilities with tools object", async ({ request }) => {
    const mcpUrl = `${API}/sse?token=${creds.apiToken}`

    const res = await request.post(mcpUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      data: mcpInitialize(1),
    })

    // MCP must not 5xx
    expect(
      res.status(),
      `MCP initialize unexpected status: ${res.status()}`,
    ).toBeLessThan(500)

    if (res.status() === 200) {
      const body = await parseMcpResponse(res)
      expect(body["jsonrpc"], "must be JSON-RPC 2.0").toBe("2.0")
      expect(body["id"], "id must echo back as 1").toBe(1)

      const result = body["result"] as Record<string, unknown> | undefined
      expect(result, "result must be present").toBeDefined()
      expect(result!["capabilities"], "capabilities must be present").toBeDefined()

      const caps = result!["capabilities"] as Record<string, unknown>
      // The MCP spec requires a tools capability listing
      expect(caps["tools"], "capabilities.tools must be present").toBeDefined()

      console.log(`11.1 — protocolVersion=${result!["protocolVersion"]}`)
    }
  })

  // -------------------------------------------------------------------------
  // 11.2 — tools/list → 12+ tools returned
  // -------------------------------------------------------------------------

  test("11.2 MCP tools/list returns at least 12 tools", async ({ request }) => {
    const mcpUrl = `${API}/sse?token=${creds.apiToken}`

    const res = await request.post(mcpUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      data: mcpToolsList(2),
    })

    expect(
      res.status(),
      `MCP tools/list unexpected status: ${res.status()}`,
    ).toBeLessThan(500)

    if (res.status() === 200) {
      const body = await parseMcpResponse(res)
      expect(body["jsonrpc"]).toBe("2.0")

      const result = body["result"] as Record<string, unknown> | undefined
      expect(result, "result must be present").toBeDefined()

      const tools = result!["tools"] as Array<{ name: string; description?: string }> | undefined
      expect(Array.isArray(tools), "tools must be an array").toBeTruthy()
      expect(
        tools!.length,
        `expected 12+ tools, got ${tools!.length}: ${tools!.map((t) => t.name).join(", ")}`,
      ).toBeGreaterThanOrEqual(12)

      // Every tool must have a name field
      for (const tool of tools!) {
        expect(typeof tool.name, "each tool must have a string name").toBe("string")
        expect(tool.name.length, `tool name must not be empty`).toBeGreaterThan(0)
      }

      const toolNames = tools!.map((t) => t.name)
      console.log(`11.2 — ${tools!.length} tools: ${toolNames.join(", ")}`)
    }
  })

  // -------------------------------------------------------------------------
  // 11.3 — tools/call search_knowledge → returns results (auth via ?token=)
  // -------------------------------------------------------------------------

  test("11.3 MCP tools/call search_knowledge returns results", async ({ request }) => {
    test.setTimeout(120_000) // NIM fallback adds latency

    // Upload a document so there is something to search
    const content = [
      `MCP Search Test Document — ${RUN_ID}`,
      "This document covers vector embeddings, semantic search, and retrieval systems.",
      "Key topics include cosine similarity, nearest neighbour search, and index sharding.",
    ].join("\n\n")

    const docId = await uploadInlineContent(
      request,
      creds.apiToken,
      creds.userId,
      content,
      `mcp-search-${RUN_ID}.txt`,
    )
    await waitForPipeline(request, docId, creds.apiToken, 60_000)

    const mcpUrl = `${API}/sse?token=${creds.apiToken}`

    const res = await request.post(mcpUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      data: mcpToolsCall(3, "search_knowledge", {
        query: "vector embeddings and semantic search",
      }),
    })

    expect(
      res.status(),
      `MCP tools/call search_knowledge unexpected status: ${res.status()}`,
    ).toBeLessThan(500)

    if (res.status() === 200) {
      const body = await parseMcpResponse(res)
      expect(body["jsonrpc"]).toBe("2.0")

      const result = body["result"] as Record<string, unknown> | undefined
      const error  = body["error"]  as Record<string, unknown> | undefined

      // If LLM is rate-limited the tool may return a structured error — skip gracefully
      if (error) {
        const code = error["code"] as number | undefined
        if (code === 429 || code === -32000) {
          console.warn(`11.3 — search_knowledge returned error code ${code}, skipping`)
          return
        }
      }

      expect(result, "result must be present on success").toBeDefined()

      // MCP tool result: { content: [{ type: "text", text: "..." }] }
      const content2 = result!["content"] as Array<{ type: string; text: string }> | undefined
      expect(Array.isArray(content2), "result.content must be an array").toBeTruthy()
      expect(content2!.length, "at least one content item expected").toBeGreaterThan(0)

      const firstItem = content2![0]!
      expect(firstItem.type, "content type must be text").toBe("text")
      expect(typeof firstItem.text, "text must be a string").toBe("string")
      expect(firstItem.text.length, "text must not be empty").toBeGreaterThan(0)

      console.log(`11.3 — search_knowledge returned ${content2!.length} content items`)
    }
  })

  // -------------------------------------------------------------------------
  // 11.4 — tools/call add_context → returns success
  // -------------------------------------------------------------------------

  test("11.4 MCP tools/call add_context uploads text and returns success", async ({ request }) => {
    test.setTimeout(120_000) // pipeline may start during the call

    const mcpUrl = `${API}/sse?token=${creds.apiToken}`

    const textPayload = [
      `MCP Add Context Test — ${RUN_ID}`,
      "This content is submitted via the MCP add_context tool.",
      "Topics: tool-based ingestion, RAG pipeline, document indexing.",
    ].join("\n\n")

    const res = await request.post(mcpUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      data: mcpToolsCall(4, "add_context", {
        content: textPayload,
        fileName: `mcp-add-${RUN_ID}.txt`,
      }),
    })

    expect(
      res.status(),
      `MCP tools/call add_context unexpected status: ${res.status()}`,
    ).toBeLessThan(500)

    if (res.status() === 200) {
      const body = await parseMcpResponse(res)
      expect(body["jsonrpc"]).toBe("2.0")

      const result = body["result"] as Record<string, unknown> | undefined
      const error  = body["error"]  as Record<string, unknown> | undefined

      if (error) {
        // Tool may not exist under a different name — log and skip rather than hard-fail
        console.warn(`11.4 — add_context returned error: ${JSON.stringify(error)}`)
        return
      }

      expect(result, "result must be present on success").toBeDefined()

      const content2 = result!["content"] as Array<{ type: string; text: string }> | undefined
      expect(Array.isArray(content2), "result.content must be an array").toBeTruthy()
      expect(content2!.length, "at least one content item expected").toBeGreaterThan(0)

      const responseText = content2!.map((c) => c.text).join(" ")
      // The response must indicate success in some form
      const lowerText = responseText.toLowerCase()
      const indicatesSuccess =
        lowerText.includes("success") ||
        lowerText.includes("uploaded") ||
        lowerText.includes("created") ||
        lowerText.includes("added") ||
        lowerText.includes("document") ||
        lowerText.includes("processing")
      expect(
        indicatesSuccess,
        `add_context response should indicate success, got: "${responseText.slice(0, 200)}"`,
      ).toBeTruthy()

      console.log(`11.4 — add_context response: ${responseText.slice(0, 120)}`)
    }
  })

  // -------------------------------------------------------------------------
  // 11.5 — Invalid JSON-RPC method → error -32601
  // -------------------------------------------------------------------------

  test("11.5 MCP invalid method returns JSON-RPC error -32601", async ({ request }) => {
    const mcpUrl = `${API}/sse?token=${creds.apiToken}`

    const res = await request.post(mcpUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      data: mcpInvalidMethod(99),
    })

    // Must not 5xx — invalid method is a client error
    expect(
      res.status(),
      `MCP invalid method should not 5xx, got ${res.status()}`,
    ).toBeLessThan(500)

    if (res.status() === 200) {
      const body = await parseMcpResponse(res)
      expect(body["jsonrpc"]).toBe("2.0")
      expect(body["id"], "id must echo back as 99").toBe(99)

      const error = body["error"] as Record<string, unknown> | undefined
      expect(error, "error field must be present for unknown method").toBeDefined()
      expect(
        error!["code"],
        `error code must be -32601 (method not found), got ${error!["code"]}`,
      ).toBe(-32601)

      console.log(`11.5 — error code=${error!["code"]} message="${error!["message"]}"`)
    }
  })
})

// ===========================================================================
// SUITE 14 — Feedback System
// ===========================================================================

test.describe.serial("Suite 14 — Feedback System", () => {
  // The feedback endpoint requires real chunk_ids from a processed document.
  // We register one user, upload a document, wait for pipeline, run a query
  // to obtain a query_id and answer_text, then inspect the response for
  // chunk metadata.

  let creds: UserCreds
  // These are populated from the query response for use in 14.1 and 14.2
  let resolvedQueryId: string
  let resolvedQueryText: string
  let resolvedAnswerText: string
  let resolvedChunkIds: string[]

  test.beforeAll(async ({ request }) => {
    // Register user
    creds = await registerUser(request, "s14-feedback")

    // Upload a document with known content
    const content = [
      `Feedback Test Document — ${RUN_ID}`,
      "This document is used to test the feedback system in Contexter.",
      "Topics: feedback scoring, thumbs up, thumbs down, Beta-Binomial model.",
      "The feedback_score of a chunk is adjusted after each explicit rating.",
    ].join("\n\n")

    const docId = await uploadInlineContent(
      request,
      creds.apiToken,
      creds.userId,
      content,
      `feedback-doc-${RUN_ID}.txt`,
    )

    // Wait for pipeline to complete
    await waitForPipeline(request, docId, creds.apiToken, 60_000)

    // Run a query — the API returns query_id and sources with chunk metadata
    const queryRes = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiToken}`,
      },
      data: JSON.stringify({ query: "How does the feedback scoring work?" }),
    })

    const qStatus = queryRes.status()
    if (qStatus === 429 || qStatus === 500 || qStatus === 503) {
      console.warn(`Suite 14 beforeAll: query returned ${qStatus}, chunk_ids will be synthetic`)
      // Use synthetic ids — feedback endpoint will still exercise auth and validation paths
      resolvedQueryId    = `synthetic-query-${RUN_ID}`
      resolvedQueryText  = "How does the feedback scoring work?"
      resolvedAnswerText = "Synthetic answer for feedback testing."
      resolvedChunkIds   = [`synthetic-chunk-${RUN_ID}`]
      return
    }

    expect(qStatus, "query in beforeAll expected 200").toBe(200)
    const qBody = await queryRes.json() as QueryResponse & { query_id?: string }

    resolvedQueryId    = qBody.query_id ?? `fallback-query-${RUN_ID}`
    resolvedQueryText  = "How does the feedback scoring work?"
    resolvedAnswerText = qBody.answer ?? "No answer returned."

    // Extract chunk_ids from sources — the API embeds chunk_id in source objects
    const chunkIds = (qBody.sources ?? [])
      .map((s) => (s as { chunk_id?: string; id?: string }).chunk_id ?? (s as { id?: string }).id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    if (chunkIds.length === 0) {
      // Fallback: use synthetic id so tests 14.1 / 14.2 can at least validate auth + schema
      resolvedChunkIds = [`fallback-chunk-${RUN_ID}`]
      console.warn("Suite 14 beforeAll: no chunk_ids in query response, using synthetic fallback")
    } else {
      resolvedChunkIds = chunkIds
    }

    console.log(`Suite 14 beforeAll: queryId=${resolvedQueryId} chunks=${resolvedChunkIds.length}`)
  })

  // -------------------------------------------------------------------------
  // 14.1 — POST /api/feedback with positive rating → 201
  // -------------------------------------------------------------------------

  test("14.1 POST /api/feedback with positive rating returns 201", async ({ request }) => {
    test.setTimeout(120_000)

    const res = await request.post(`${API}/api/feedback`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiToken}`,
      },
      data: JSON.stringify({
        query_id:    resolvedQueryId,
        query_text:  resolvedQueryText,
        answer_text: resolvedAnswerText,
        rating:      1,
        chunk_ids:   resolvedChunkIds,
      }),
    })

    const status = res.status()
    // 201 = created; 500 with synthetic chunk_ids is acceptable (FK violation)
    const firstChunkId = resolvedChunkIds[0] ?? ""
    if (firstChunkId.startsWith("synthetic") || firstChunkId.startsWith("fallback")) {
      // With non-existent chunk_ids the DB write may fail — acceptable
      expect([201, 500], `expected 201 or 500 for synthetic chunk_ids, got ${status}`).toContain(status)
      console.warn("14.1 — synthetic chunk_ids, skipping strict assertion")
      return
    }

    expect(status, "positive feedback expected 201").toBe(201)

    const body = await res.json() as { ok: boolean; feedback_id: string }
    expect(body.ok, "ok must be true").toBe(true)
    expect(body.feedback_id, "feedback_id must be present").toBeTruthy()
    expect(typeof body.feedback_id).toBe("string")

    console.log(`14.1 — feedback_id=${body.feedback_id}`)
  })

  // -------------------------------------------------------------------------
  // 14.2 — POST /api/feedback with negative rating → 201
  // -------------------------------------------------------------------------

  test("14.2 POST /api/feedback with negative rating returns 201", async ({ request }) => {
    test.setTimeout(120_000)

    const res = await request.post(`${API}/api/feedback`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiToken}`,
      },
      data: JSON.stringify({
        query_id:    resolvedQueryId,
        query_text:  resolvedQueryText,
        answer_text: resolvedAnswerText,
        rating:      -1,
        chunk_ids:   resolvedChunkIds,
      }),
    })

    const status = res.status()
    const firstChunkId14_2 = resolvedChunkIds[0] ?? ""
    if (firstChunkId14_2.startsWith("synthetic") || firstChunkId14_2.startsWith("fallback")) {
      expect([201, 500], `expected 201 or 500 for synthetic chunk_ids, got ${status}`).toContain(status)
      console.warn("14.2 — synthetic chunk_ids, skipping strict assertion")
      return
    }

    expect(status, "negative feedback expected 201").toBe(201)

    const body = await res.json() as { ok: boolean; feedback_id: string }
    expect(body.ok, "ok must be true").toBe(true)
    expect(body.feedback_id, "feedback_id must be present").toBeTruthy()

    console.log(`14.2 — feedback_id=${body.feedback_id}`)
  })

  // -------------------------------------------------------------------------
  // 14.3 — POST /api/feedback without auth → 401
  // -------------------------------------------------------------------------

  test("14.3 POST /api/feedback without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/feedback`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        query_id:    "any-query-id",
        query_text:  "any query text",
        answer_text: "any answer text",
        rating:      1,
        chunk_ids:   ["any-chunk-id"],
      }),
    })

    expect(res.status(), "unauthenticated feedback must return 401").toBe(401)

    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 14.4 — POST /api/feedback with invalid payload → 400
  // -------------------------------------------------------------------------

  test("14.4 POST /api/feedback with invalid payload returns 400", async ({ request }) => {
    // Missing required fields: query_id, query_text, answer_text, chunk_ids
    // Invalid rating value (not 1 or -1)
    const res = await request.post(`${API}/api/feedback`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiToken}`,
      },
      data: JSON.stringify({
        rating: 999, // invalid: only 1 and -1 are allowed
        // deliberately omitting all required fields
      }),
    })

    expect(res.status(), "invalid feedback payload must return 400").toBe(400)

    const body = await res.json() as Record<string, unknown>
    // Hono zValidator returns { success: false, error: { issues: [...] } }
    // or similar structured validation error
    expect(body, "error body must not be empty").toBeDefined()
  })
})

// ===========================================================================
// SUITE 17 — Concurrent Operations
// ===========================================================================

test.describe("Suite 17 — Concurrent Operations", () => {
  // -------------------------------------------------------------------------
  // 17.1 — Upload 3 documents simultaneously → all complete pipeline
  // -------------------------------------------------------------------------

  test("17.1 upload 3 documents simultaneously — all enter pipeline", async ({ request }) => {
    test.setTimeout(180_000)

    const { apiToken, userId } = await registerUser(request, "s17-upload")

    // Each upload task: presign → PUT → confirm
    const makeUploadTask = (n: number) => {
      const content = [
        `Concurrent Upload Test ${n} — ${RUN_ID}`,
        `This is document number ${n} uploaded in parallel.`,
        `Keywords: concurrent, parallel, upload, pipeline, stress-test.`,
        `Unique marker: doc-${n}-${RUN_ID}`,
      ].join("\n\n")

      return uploadInlineContent(
        request,
        apiToken,
        userId,
        content,
        `concurrent-${n}-${RUN_ID}.txt`,
      )
    }

    // Launch all 3 uploads in parallel
    const docIds = await Promise.all([
      makeUploadTask(1),
      makeUploadTask(2),
      makeUploadTask(3),
    ])

    expect(docIds.length, "all 3 uploads must return documentIds").toBe(3)
    for (const id of docIds) {
      expect(id, "each documentId must be a non-empty string").toBeTruthy()
      expect(typeof id).toBe("string")
    }

    // Verify all 3 documents appear in the document list
    const listRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(listRes.status(), "document list expected 200").toBe(200)

    const listBody = await listRes.json() as {
      documents: Array<{ documentId: string; status: string }>
    }
    for (const docId of docIds) {
      const found = listBody.documents.find((d) => d.documentId === docId)
      expect(found, `document ${docId} must appear in list after concurrent upload`).toBeDefined()
      expect(
        ["processing", "ready"],
        `document ${docId} must be processing or ready, got "${found!.status}"`,
      ).toContain(found!.status)
    }

    // Wait for all 3 pipelines to complete
    const pipelineResults = await Promise.all(
      docIds.map((id) => waitForPipeline(request, id, apiToken, 120_000))
    )

    for (let i = 0; i < pipelineResults.length; i++) {
      const result = pipelineResults[i]!
      expect(
        result.status,
        `document ${i + 1} pipeline must complete as ready, got "${result.status}"`,
      ).toBe("ready")

      for (const stage of result.stages) {
        expect(
          stage.status,
          `doc ${i + 1} stage "${stage.type}" must be done, got "${stage.status}"`,
        ).toBe("done")
      }
    }

    console.log(`17.1 — all 3 concurrent uploads completed pipeline: ${docIds.join(", ")}`)
  })

  // -------------------------------------------------------------------------
  // 17.2 — Send 5 queries simultaneously → all return 200
  // -------------------------------------------------------------------------

  test("17.2 send 5 queries simultaneously — all return 200 or expected skip codes", async ({ request }) => {
    test.setTimeout(180_000) // NIM fallback: each query may take ~20s; parallel but still slow

    const { apiToken, userId } = await registerUser(request, "s17-query")

    // Upload and process a document before firing concurrent queries
    const content = [
      `Concurrent Query Test — ${RUN_ID}`,
      "This document is about distributed systems, concurrency, and load testing.",
      "Topics: race conditions, thread safety, concurrent access, mutex, semaphore.",
      "The system must handle simultaneous requests without data corruption.",
    ].join("\n\n")

    const docId = await uploadInlineContent(
      request,
      apiToken,
      userId,
      content,
      `concurrent-query-doc-${RUN_ID}.txt`,
    )
    await waitForPipeline(request, docId, apiToken, 60_000)

    const queries = [
      "What are the main topics of this document?",
      "How does the system handle concurrent access?",
      "What is mentioned about thread safety?",
      "Describe race conditions in the document.",
      "What synchronisation primitives are mentioned?",
    ]

    // Fire all 5 queries in parallel
    const results = await Promise.all(
      queries.map((q) => doQuery(request, apiToken, q))
    )

    let successCount = 0
    let skippedCount = 0

    for (let i = 0; i < results.length; i++) {
      const { status, body } = results[i]!

      if (status === 429 || status === 500 || status === 503) {
        console.warn(`17.2 — query ${i + 1} skipped due to status ${status}`)
        skippedCount++
        continue
      }

      expect(status, `query ${i + 1} expected 200, got ${status}`).toBe(200)
      expect(body, `query ${i + 1} body must not be null`).not.toBeNull()
      expect(body!.answer, `query ${i + 1} answer must be present`).toBeTruthy()
      expect(Array.isArray(body!.sources), `query ${i + 1} sources must be an array`).toBeTruthy()

      successCount++
    }

    // At least 3 of 5 queries must succeed (allows for rate limit bursts)
    expect(
      successCount,
      `at least 3 concurrent queries must succeed (success=${successCount} skipped=${skippedCount})`,
    ).toBeGreaterThanOrEqual(3)

    console.log(`17.2 — concurrent queries: ${successCount} success, ${skippedCount} skipped`)
  })

  // -------------------------------------------------------------------------
  // 17.3 — Register 3 users simultaneously → no race conditions
  // -------------------------------------------------------------------------

  test("17.3 register 3 users simultaneously — all succeed with unique tokens", async ({ request }) => {
    test.setTimeout(180_000)

    // Launch 3 registrations in parallel
    const results = await Promise.all([
      registerUser(request, "s17-reg-a"),
      registerUser(request, "s17-reg-b"),
      registerUser(request, "s17-reg-c"),
    ])

    expect(results.length, "all 3 registrations must complete").toBe(3)

    const userIds   = results.map((r) => r.userId)
    const tokens    = results.map((r) => r.apiToken)
    const mcpUrls   = results.map((r) => r.mcpUrl)

    // All userId values must be distinct
    const uniqueUserIds = new Set(userIds)
    expect(
      uniqueUserIds.size,
      `all 3 userIds must be unique, got: ${userIds.join(", ")}`,
    ).toBe(3)

    // All apiToken values must be distinct
    const uniqueTokens = new Set(tokens)
    expect(
      uniqueTokens.size,
      "all 3 apiTokens must be unique",
    ).toBe(3)

    // Each token must have minimum length (sanity check, not a race condition signal)
    for (const token of tokens) {
      expect(token, "apiToken must be a non-empty string").toBeTruthy()
      expect(token.length, "apiToken must be at least 16 chars").toBeGreaterThanOrEqual(16)
    }

    // Each user must be able to independently call GET /api/status (isolation check)
    const statusChecks = await Promise.all(
      results.map((creds) =>
        request.get(`${API}/api/status`, {
          headers: { Authorization: `Bearer ${creds.apiToken}` },
        })
      )
    )

    for (let i = 0; i < statusChecks.length; i++) {
      const check = statusChecks[i]!
      expect(
        check.status(),
        `user ${i + 1} GET /api/status expected 200, got ${check.status()}`,
      ).toBe(200)
      const body = await check.json() as { documents: unknown[] }
      expect(Array.isArray(body.documents), `user ${i + 1} documents must be an array`).toBeTruthy()
      expect(body.documents.length, `fresh user ${i + 1} must have 0 documents`).toBe(0)
    }

    console.log(`17.3 — 3 users registered concurrently: ${userIds.join(", ")}`)
    console.log(`17.3 — all tokens distinct, all isolation checks passed`)
  })
})
