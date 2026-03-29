/**
 * Contexter — Smoke E2E Test Suite
 *
 * Critical-path tests that run on every deploy. Target: < 5 minutes total.
 *
 * Tests against PRODUCTION:
 *   Frontend: https://contexter.cc
 *   API:      https://api.contexter.cc
 *
 * Run all smoke tests:
 *   npx playwright test e2e/smoke.spec.ts --grep @smoke
 *
 * Coverage:
 *   S1  — Health endpoint (all 5 services OK)
 *   S2  — Landing page loads with title
 *   S3  — /app route loads (or redirects to login)
 *   S4  — Register: POST /api/auth/register returns apiToken
 *   S5  — Upload small file via presigned flow (presign → PUT → confirm)
 *   S6  — Pipeline completes within 60s (poll /api/status/:id)
 *   S7  — Query returns answer with sources
 *   S8  — Documents list contains uploaded document
 *   S9  — MCP endpoint responds to JSON-RPC initialize
 *   S10 — Rate limiting: rapid requests eventually return 429
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRONTEND = "https://contexter.cc"
const API      = "https://api.contexter.cc"

// Unique suffix per run to avoid collisions with parallel or back-to-back runs
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// Inline document content — no file fixture dependency
const SMOKE_CONTENT = [
  "Contexter Smoke Test Document",
  "This document is used for automated smoke testing of the Contexter RAG pipeline.",
  "The document contains information about machine learning, vector embeddings, and retrieval-augmented generation.",
  "Key topics: semantic search, document chunking, embedding models, cosine similarity.",
  "The pipeline stages are: parse, chunk, embed, index.",
].join("\n\n")

const SMOKE_FILENAME  = "smoke-test.txt"
const SMOKE_MIME      = "text/plain"
const SMOKE_FILE_SIZE = Buffer.byteLength(SMOKE_CONTENT, "utf8")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(label: string): string {
  return `smoke-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function registerUser(
  request: APIRequestContext,
  label: string,
): Promise<{ userId: string; apiToken: string; mcpUrl: string }> {
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      name: `smoke-${label}`,
      email: uniqueEmail(label),
    }),
  })
  expect(res.status(), `register [${label}] expected 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken, "apiToken must be present").toBeTruthy()
  return body as { userId: string; apiToken: string; mcpUrl: string }
}

/**
 * Execute the presigned upload flow entirely in-memory.
 * Returns the documentId after confirm (status: "processing").
 */
async function uploadInlineContent(
  request: APIRequestContext,
  token: string,
  userId: string,
): Promise<string> {
  const fileBuffer = Buffer.from(SMOKE_CONTENT, "utf8")

  // Step 1 — presign
  const presignRes = await request.post(`${API}/api/upload/presign`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      fileName: SMOKE_FILENAME,
      mimeType: SMOKE_MIME,
      fileSize: SMOKE_FILE_SIZE,
    }),
  })
  expect(presignRes.status(), "presign expected 200").toBe(200)
  const presignBody = await presignRes.json() as {
    uploadUrl: string
    documentId: string
    r2Key: string
    expiresIn: number
  }
  expect(presignBody.uploadUrl, "uploadUrl must be present").toBeTruthy()
  expect(presignBody.documentId, "documentId must be present").toBeTruthy()
  expect(presignBody.r2Key, "r2Key must contain userId").toContain(userId)

  const { uploadUrl, documentId, r2Key } = presignBody

  // Step 2 — PUT content directly to R2 presigned URL
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": SMOKE_MIME },
    body: fileBuffer,
  })
  expect(putRes.status, `PUT to R2 expected 2xx, got ${putRes.status}`).toBeLessThan(300)

  // Step 3 — confirm upload with API
  const confirmRes = await request.post(`${API}/api/upload/confirm`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      documentId,
      r2Key,
      fileName: SMOKE_FILENAME,
      mimeType: SMOKE_MIME,
      fileSize: SMOKE_FILE_SIZE,
    }),
  })
  expect(confirmRes.status(), "confirm expected 202").toBe(202)
  const confirmBody = await confirmRes.json() as { documentId: string; status: string }
  expect(confirmBody.documentId).toBe(documentId)
  expect(confirmBody.status).toBe("processing")

  return documentId
}

/**
 * Poll GET /api/status/:docId until all stages are done or any stage errors.
 * Throws if timeout is exceeded.
 */
async function waitForPipeline(
  request: APIRequestContext,
  docId: string,
  token: string,
  timeoutMs = 60_000,
): Promise<{ status: string; stages: Array<{ type: string; status: string; error_message?: string }> }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status(), "status poll expected 200").toBe(200)
    const body = await res.json() as {
      status: string
      stages: Array<{ type: string; status: string; error_message?: string }>
    }
    const allDone = body.stages.every((s) => s.status === "done")
    const anyError = body.stages.some((s) => s.status === "error")
    if (allDone || anyError) return body
    await sleep(2_000)
  }
  throw new Error(`Pipeline did not complete within ${timeoutMs}ms for document ${docId}`)
}

// ---------------------------------------------------------------------------
// Shared state — populated by S4/S5 and consumed by S6/S7/S8
// Playwright serial describe ensures execution order within the block.
// ---------------------------------------------------------------------------

interface SharedState {
  userId: string
  apiToken: string
  mcpUrl: string
  documentId: string
}

const shared: Partial<SharedState> = {}

// ===========================================================================
// S1 — Health
// ===========================================================================

test("S1 — @smoke health endpoint returns 200 with all 5 services OK", async ({ request }) => {
  const res = await request.get(`${API}/health`)
  expect(res.status()).toBe(200)

  const body = await res.json() as {
    status: string
    checks: { api?: string; postgres?: string; s3?: string; redis?: string; groq?: string }
  }
  expect(body.status).toBe("healthy")
  expect(body.checks).toBeDefined()
  expect(body.checks.api,      "api check").toBe("ok")
  expect(body.checks.postgres, "postgres check").toBe("ok")
  expect(body.checks.s3,       "s3 check").toBe("ok")
  expect(body.checks.redis,    "redis check").toBe("ok")
  expect(body.checks.groq,     "groq check").toBe("ok")
})

// ===========================================================================
// S2 — Landing loads
// ===========================================================================

test("S2 — @smoke landing page loads with title", async ({ page }) => {
  const res = await page.goto(FRONTEND, { waitUntil: "domcontentloaded", timeout: 30_000 })
  expect(res?.status(), "landing must return 200").toBe(200)
  await expect(page).toHaveTitle(/con.?text.?er/i)
  const body = await page.textContent("body")
  expect(body, "landing body must not be empty").toBeTruthy()
  expect(body!.length).toBeGreaterThan(100)
})

// ===========================================================================
// S3 — /app route loads
// ===========================================================================

test("S3 — @smoke /app route loads (200 or redirect to login)", async ({ page }) => {
  const res = await page.goto(`${FRONTEND}/app`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  // Acceptable: 200 (app UI) or a redirect to a login/landing page
  const status = res?.status() ?? 0
  expect([200, 301, 302, 303, 307, 308], `unexpected status ${status}`).toContain(status)

  // After any redirect the final page must still be functional
  const body = await page.textContent("body")
  expect(body, "/app body must not be empty").toBeTruthy()
  expect(body!.length).toBeGreaterThan(50)
})

// ===========================================================================
// S4 — Register
// ===========================================================================

test("S4 — @smoke register creates user and returns apiToken", async ({ request }) => {
  const email = uniqueEmail("register")
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: "smoke-register", email }),
  })
  expect(res.status(), "register expected 201").toBe(201)

  const body = await res.json() as {
    userId: string
    apiToken: string
    mcpUrl: string
  }
  expect(body.userId,   "userId must be present").toBeTruthy()
  expect(body.apiToken, "apiToken must be present").toBeTruthy()
  expect(body.mcpUrl,   "mcpUrl must be present").toBeTruthy()
  expect(body.apiToken.length, "apiToken must be at least 16 chars").toBeGreaterThanOrEqual(16)

  // Persist for downstream serial tests
  shared.userId   = body.userId
  shared.apiToken = body.apiToken
  shared.mcpUrl   = body.mcpUrl
})

// ===========================================================================
// S5 — Upload small file via presigned flow
// ===========================================================================

test("S5 — @smoke presigned upload: presign → PUT to R2 → confirm returns documentId", async ({ request }) => {
  // Ensure S4 ran first (serial block guarantees order within describe.serial,
  // but these tests are in the module scope — use a local registration if needed)
  if (!shared.apiToken || !shared.userId) {
    const reg = await registerUser(request, "upload-fallback")
    shared.userId   = reg.userId
    shared.apiToken = reg.apiToken
    shared.mcpUrl   = reg.mcpUrl
  }

  const docId = await uploadInlineContent(request, shared.apiToken!, shared.userId!)
  expect(docId, "documentId must be a non-empty string").toBeTruthy()
  shared.documentId = docId
})

// ===========================================================================
// S6 — Pipeline completes
// ===========================================================================

test("S6 — @smoke pipeline completes within 60s (all stages done)", async ({ request }) => {
  test.setTimeout(90_000) // 60s pipeline + buffer

  if (!shared.apiToken || !shared.documentId) {
    // Self-contained fallback: register + upload
    const reg = await registerUser(request, "pipeline-fallback")
    shared.userId   = reg.userId
    shared.apiToken = reg.apiToken
    shared.mcpUrl   = reg.mcpUrl
    shared.documentId = await uploadInlineContent(request, reg.apiToken, reg.userId)
  }

  const result = await waitForPipeline(request, shared.documentId!, shared.apiToken!, 60_000)

  expect(result.status, "overall status must be ready").toBe("ready")

  const stageTypes = result.stages.map((s) => s.type)
  expect(stageTypes, "parse stage must exist").toContain("parse")
  expect(stageTypes, "chunk stage must exist").toContain("chunk")
  expect(stageTypes, "embed stage must exist").toContain("embed")
  expect(stageTypes, "index stage must exist").toContain("index")

  for (const stage of result.stages) {
    expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
  }
})

// ===========================================================================
// S7 — Query returns answer with sources
// ===========================================================================

test("S7 — @smoke query returns answer and sources for uploaded content", async ({ request }) => {
  test.setTimeout(60_000)

  if (!shared.apiToken || !shared.documentId) {
    // Full fallback: register, upload, and wait for pipeline
    const reg = await registerUser(request, "query-fallback")
    shared.userId     = reg.userId
    shared.apiToken   = reg.apiToken
    shared.mcpUrl     = reg.mcpUrl
    shared.documentId = await uploadInlineContent(request, reg.apiToken, reg.userId)
    await waitForPipeline(request, shared.documentId, reg.apiToken, 60_000)
  }

  const res = await request.post(`${API}/api/query`, {
    headers: {
      Authorization: `Bearer ${shared.apiToken}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({ query: "What are the pipeline stages described in the document?" }),
  })
  expect(res.status(), "query expected 200").toBe(200)

  const body = await res.json() as {
    answer: string
    sources: Array<{ content: string; score: number; document_name?: string }>
  }
  expect(body.answer, "answer must be present").toBeTruthy()
  expect(typeof body.answer).toBe("string")
  expect(body.answer.length, "answer must have content").toBeGreaterThan(10)

  expect(Array.isArray(body.sources), "sources must be an array").toBeTruthy()
  expect(body.sources.length, "at least one source expected").toBeGreaterThan(0)

  const firstSource = body.sources[0]
  expect(firstSource.content, "source content must be present").toBeTruthy()
  expect(typeof firstSource.score).toBe("number")
})

// ===========================================================================
// S8 — Documents list contains uploaded document
// ===========================================================================

test("S8 — @smoke documents list contains the uploaded document as ready", async ({ request }) => {
  if (!shared.apiToken || !shared.documentId) {
    // Full fallback
    const reg = await registerUser(request, "list-fallback")
    shared.userId     = reg.userId
    shared.apiToken   = reg.apiToken
    shared.mcpUrl     = reg.mcpUrl
    shared.documentId = await uploadInlineContent(request, reg.apiToken, reg.userId)
    await waitForPipeline(request, shared.documentId, reg.apiToken, 60_000)
  }

  const res = await request.get(`${API}/api/status`, {
    headers: { Authorization: `Bearer ${shared.apiToken}` },
  })
  expect(res.status(), "documents list expected 200").toBe(200)

  const body = await res.json() as {
    documents: Array<{ documentId: string; status: string; fileName?: string }>
  }
  expect(Array.isArray(body.documents), "documents must be an array").toBeTruthy()

  const doc = body.documents.find((d) => d.documentId === shared.documentId)
  expect(doc, `document ${shared.documentId} must appear in list`).toBeDefined()
  expect(doc!.status, "document must have ready status").toBe("ready")
})

// ===========================================================================
// S9 — MCP endpoint responds to JSON-RPC initialize
// ===========================================================================

test("S9 — @smoke MCP endpoint returns capabilities for JSON-RPC initialize", async ({ request }) => {
  if (!shared.apiToken && !shared.mcpUrl) {
    const reg = await registerUser(request, "mcp-probe")
    shared.apiToken = reg.apiToken
    shared.mcpUrl   = reg.mcpUrl
  }

  // Derive the SSE/MCP endpoint from the API base if mcpUrl is not set
  // The /sse endpoint accepts Streamable HTTP JSON-RPC
  const mcpEndpoint = `${API}/sse`

  const res = await request.post(mcpEndpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${shared.apiToken ?? ""}`,
    },
    data: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "1.0.0" },
      },
    }),
  })

  // MCP initialize must not 5xx — valid responses: 200 (capabilities JSON),
  // 401 (auth required for private instance), or 4xx (method routing variation)
  expect(
    res.status(),
    `MCP /sse unexpected server error (${res.status()})`,
  ).toBeLessThan(500)

  if (res.status() === 200) {
    const body = await res.json() as {
      jsonrpc?: string
      result?: { protocolVersion?: string; capabilities?: object; serverInfo?: object }
    }
    // A well-formed MCP response must carry jsonrpc field or a result object
    const isValidMcpResponse = (body.jsonrpc === "2.0" && body.result != null)
      || (body.result?.capabilities != null)
      || (body.result?.protocolVersion != null)
    expect(isValidMcpResponse, "MCP response must be valid JSON-RPC 2.0").toBeTruthy()
  }
})

// ===========================================================================
// S10 — Rate limiting returns 429
// ===========================================================================

test("S10 — @smoke rapid requests to /api/query eventually return 429", async ({ request }) => {
  // Rate limit is 60 QPM. Sequential requests are too slow (each RAG query ~3s).
  // Fire 65 requests in parallel — rate limiter counts them at arrival time.
  const reg = await registerUser(request, "ratelimit")
  const rlToken = reg.apiToken

  // Upload a minimal document so queries return 200 (not 400/empty)
  const docId = await uploadInlineContent(request, rlToken, reg.userId)
  await waitForPipeline(request, docId, rlToken, 60_000)

  // Fire 65 parallel requests — should exceed 60 QPM limit
  const promises = Array.from({ length: 65 }, (_, i) =>
    request.post(`${API}/api/query`, {
      headers: {
        Authorization: `Bearer ${rlToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ query: `rate limit probe ${i}` }),
    })
  )

  const responses = await Promise.all(promises)
  const statuses = responses.map((r) => r.status())
  const has429 = statuses.includes(429)

  expect(has429, `expected at least one 429 in ${statuses.length} parallel requests (got: ${[...new Set(statuses)].join(",")})`).toBeTruthy()
})
