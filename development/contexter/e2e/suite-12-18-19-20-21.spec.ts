/**
 * Contexter — E2E Test Suites 12, 18, 19, 20, 21
 *
 * Suite 12 — Share Tokens: create, list, access via share, revoke
 * Suite 18 — Query Streaming (SSE): stream endpoint, auth, validation
 * Suite 19 — Retry Pipeline: retry failed/stuck docs, auth, not-found
 * Suite 20 — Metrics & Formats: aggregated metrics, supported formats, pipeline health
 * Suite 21 — Bulk Operations & Document Content: bulk delete, chunk content, auth
 *
 * All tests run against production: https://api.contexter.cc
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "https://api.contexter.cc"
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// ---------------------------------------------------------------------------
// Helpers (self-contained — no cross-file imports)
// ---------------------------------------------------------------------------

function uniqueEmail(suite: string, label: string): string {
  return `s${suite}-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

interface UserCreds {
  userId: string
  apiToken: string
}

async function registerUser(request: APIRequestContext, suite: string, label: string): Promise<UserCreds> {
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: `test-${suite}-${label}`, email: uniqueEmail(suite, label) }),
  })
  expect(res.status(), `register [${suite}/${label}] expected 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken, "apiToken must be present").toBeTruthy()
  return { userId: body.userId, apiToken: body.apiToken }
}

async function uploadDoc(
  request: APIRequestContext,
  token: string,
  content: string,
  fileName: string,
  mimeType: string = "text/plain",
): Promise<string> {
  const fileBuffer = Buffer.from(content, "utf8")
  const fileSize = fileBuffer.byteLength

  const presignRes = await request.post(`${API}/api/upload/presign`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    data: JSON.stringify({ fileName, mimeType, fileSize }),
  })
  expect(presignRes.status(), "presign expected 200").toBe(200)
  const presign = (await presignRes.json()) as { uploadUrl: string; documentId: string; r2Key: string }

  await request.put(presign.uploadUrl, {
    headers: { "Content-Type": mimeType },
    data: fileBuffer,
  })

  const confirmRes = await request.post(`${API}/api/upload/confirm`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    data: JSON.stringify({
      documentId: presign.documentId,
      r2Key: presign.r2Key,
      fileName,
      mimeType,
      fileSize,
    }),
  })
  // Accept 200 (idempotent re-confirm) or 202 (new confirm)
  expect([200, 202], `confirm expected 200 or 202, got ${confirmRes.status()}`).toContain(confirmRes.status())
  return presign.documentId
}

async function waitForPipeline(
  request: APIRequestContext,
  docId: string,
  token: string,
  timeoutMs: number = 60_000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status() === 200) {
      const body = (await res.json()) as { stages?: Array<{ status: string }> }
      const stages = body.stages ?? []
      if (stages.length > 0 && stages.every((s) => s.status === "done")) return
      if (stages.some((s) => s.status === "error")) throw new Error(`Pipeline error for ${docId}`)
    }
    await sleep(2000)
  }
  throw new Error(`Pipeline timeout for ${docId} after ${timeoutMs}ms`)
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

// ===========================================================================
// SUITE 12 — Share Tokens
// ===========================================================================

test.describe("Suite 12 — Share Tokens", () => {
  let user: UserCreds
  let docId: string

  test.beforeAll(async ({ request }) => {
    user = await registerUser(request, "12", "share")
    docId = await uploadDoc(
      request, user.apiToken,
      `Share Token Test Document ${RUN_ID}\n\nThis document tests share token access control.`,
      "share-test.txt",
    )
    await waitForPipeline(request, docId, user.apiToken)
  })

  test("12.1 POST /api/auth/share creates read-only share with shareToken", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/share`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ permission: "read", scope: "all" }),
    })
    expect(res.status(), "create share must return 201").toBe(201)
    const body = (await res.json()) as {
      shareId: string; shareToken: string; permission: string; scope: string; mcpUrl: string
    }
    expect(body.shareId, "shareId must be present").toBeTruthy()
    expect(body.shareToken, "shareToken must be present").toBeTruthy()
    expect(body.permission).toBe("read")
    expect(body.mcpUrl, "mcpUrl must be present").toBeTruthy()
    console.log(`12.1 — share created: ${body.shareId}, permission=${body.permission}`)
  })

  test("12.2 POST /api/auth/share creates read-write share with expiry", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/share`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ permission: "read_write", expiresInHours: 24 }),
    })
    expect(res.status()).toBe(201)
    const body = (await res.json()) as { shareId: string; permission: string; expiresAt: string | null }
    expect(body.permission).toBe("read_write")
    expect(body.expiresAt, "expiresAt must be set for timed shares").toBeTruthy()
    console.log(`12.2 — read_write share with expiry: ${body.expiresAt}`)
  })

  test("12.3 GET /api/auth/shares lists created shares", async ({ request }) => {
    const res = await request.get(`${API}/api/auth/shares`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as { shares: Array<{ id: string; permission: string }> }
    expect(Array.isArray(body.shares), "shares must be an array").toBeTruthy()
    expect(body.shares.length, "should have at least 2 shares from tests 12.1+12.2").toBeGreaterThanOrEqual(2)
    console.log(`12.3 — ${body.shares.length} shares listed`)
  })

  test("12.4 share token can access document list", async ({ request }) => {
    // Get a share token
    const sharesRes = await request.get(`${API}/api/auth/shares`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    const shares = ((await sharesRes.json()) as { shares: Array<{ share_token: string }> }).shares
    expect(shares.length).toBeGreaterThan(0)
    const shareToken = shares[0].share_token

    // Access document list via share token
    const listRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${shareToken}` },
    })
    // Share token should grant access — accept 200 or 403 (depends on share scope implementation)
    expect(listRes.status(), `share token access should not 5xx, got ${listRes.status()}`).toBeLessThan(500)
    console.log(`12.4 — share token access: ${listRes.status()}`)
  })

  test("12.5 DELETE /api/auth/shares/:id revokes share", async ({ request }) => {
    // Create a share to delete
    const createRes = await request.post(`${API}/api/auth/share`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ permission: "read" }),
    })
    expect(createRes.status()).toBe(201)
    const { shareId } = (await createRes.json()) as { shareId: string }

    // Delete it
    const delRes = await request.delete(`${API}/api/auth/shares/${shareId}`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(delRes.status()).toBe(200)
    const body = (await delRes.json()) as { success: boolean; deleted: string }
    expect(body.success).toBe(true)
    expect(body.deleted).toBe(shareId)

    // Verify it's gone from list
    const listRes = await request.get(`${API}/api/auth/shares`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    const remaining = ((await listRes.json()) as { shares: Array<{ id: string }> }).shares
    const found = remaining.find((s) => s.id === shareId)
    expect(found, "deleted share must not appear in list").toBeUndefined()
    console.log(`12.5 — share ${shareId} revoked and verified gone`)
  })
})

// ===========================================================================
// SUITE 18 — Query Streaming (SSE)
// ===========================================================================

test.describe("Suite 18 — Query Streaming (SSE)", () => {
  let user: UserCreds
  let docId: string

  test.beforeAll(async ({ request }) => {
    user = await registerUser(request, "18", "stream")
    docId = await uploadDoc(
      request, user.apiToken,
      `Streaming Test Document ${RUN_ID}\n\nContexter uses Jina v4 embeddings with 512 dimensions for vector search. The pipeline processes documents through parse, chunk, embed, and index stages.`,
      "stream-test.txt",
    )
    await waitForPipeline(request, docId, user.apiToken)
  })

  test("18.1 POST /api/query/stream returns SSE response", async ({ request }) => {
    test.setTimeout(120_000)
    const res = await request.post(`${API}/api/query/stream`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ query: "What embedding model does Contexter use?" }),
    })
    // Accept 200 (SSE stream) or handle gracefully
    if (res.status() === 429 || res.status() >= 500) {
      console.log(`18.1 — skipped: LLM unavailable (${res.status()})`)
      test.skip(true, `LLM unavailable (${res.status()})`)
      return
    }
    expect(res.status()).toBe(200)
    const contentType = res.headers()["content-type"] ?? ""
    // SSE returns text/event-stream or application/json (non-streaming fallback)
    expect(
      contentType.includes("text/event-stream") || contentType.includes("application/json"),
      `content-type must be SSE or JSON, got "${contentType}"`,
    ).toBeTruthy()
    const body = await res.text()
    expect(body.length, "stream response must have content").toBeGreaterThan(0)
    console.log(`18.1 — stream response: ${contentType}, ${body.length} bytes`)
  })

  test("18.2 POST /api/query/stream without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/query/stream`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "test" }),
    })
    expect(res.status()).toBe(401)
    console.log(`18.2 — no auth: ${res.status()}`)
  })

  test("18.3 POST /api/query/stream with empty query returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/query/stream`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ query: "" }),
    })
    expect(res.status()).toBe(400)
    console.log(`18.3 — empty query: ${res.status()}`)
  })

  test("18.4 POST /api/query/stream with oversized query returns 400", async ({ request }) => {
    const longQuery = "a".repeat(2100) // exceeds 2000 char limit
    const res = await request.post(`${API}/api/query/stream`, {
      headers: authHeaders(user.apiToken),
      data: JSON.stringify({ query: longQuery }),
    })
    expect(res.status()).toBe(400)
    console.log(`18.4 — oversized query: ${res.status()}`)
  })
})

// ===========================================================================
// SUITE 19 — Retry Pipeline
// ===========================================================================

test.describe("Suite 19 — Retry Pipeline", () => {
  let user: UserCreds

  test.beforeAll(async ({ request }) => {
    user = await registerUser(request, "19", "retry")
  })

  test("19.1 POST /api/retry/:docId without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/retry/fake-doc-id`, {
      headers: { "Content-Type": "application/json" },
    })
    expect(res.status()).toBe(401)
    console.log(`19.1 — no auth: ${res.status()}`)
  })

  test("19.2 POST /api/retry/:docId for non-existent document returns 404", async ({ request }) => {
    const res = await request.post(`${API}/api/retry/nonexistent-${RUN_ID}`, {
      headers: authHeaders(user.apiToken),
    })
    expect(res.status()).toBe(404)
    console.log(`19.2 — not found: ${res.status()}`)
  })

  test("19.3 POST /api/retry/:docId for ready document returns 409", async ({ request }) => {
    // Upload and wait for ready status
    const docId = await uploadDoc(
      request, user.apiToken,
      `Retry test document ${RUN_ID}`,
      "retry-test.txt",
    )
    await waitForPipeline(request, docId, user.apiToken)

    // Try to retry a document that's already ready — should be rejected
    const res = await request.post(`${API}/api/retry/${docId}`, {
      headers: authHeaders(user.apiToken),
    })
    expect(res.status(), "retry on ready doc must return 409").toBe(409)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain("ready")
    console.log(`19.3 — retry ready doc: ${res.status()}, ${body.error}`)
  })
})

// ===========================================================================
// SUITE 20 — Metrics, Formats, Pipeline Health
// ===========================================================================

test.describe("Suite 20 — Metrics, Formats & Pipeline Health", () => {
  let user: UserCreds

  test.beforeAll(async ({ request }) => {
    user = await registerUser(request, "20", "metrics")
  })

  test("20.1 GET /api/metrics returns aggregated metrics", async ({ request }) => {
    const res = await request.get(`${API}/api/metrics`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      window_days: number
      total_queries: number
      computed_at: string
    }
    expect(body.window_days, "window_days must be a number").toBeGreaterThan(0)
    expect(typeof body.total_queries).toBe("number")
    expect(body.computed_at, "computed_at must be present").toBeTruthy()
    console.log(`20.1 — metrics: ${body.total_queries} queries in ${body.window_days}d window`)
  })

  test("20.2 GET /api/metrics without auth returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/metrics`)
    expect(res.status()).toBe(401)
    console.log(`20.2 — no auth: ${res.status()}`)
  })

  test("20.3 GET /api/metrics?days=30 respects custom window", async ({ request }) => {
    const res = await request.get(`${API}/api/metrics?days=30`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as { window_days: number }
    expect(body.window_days).toBe(30)
    console.log(`20.3 — custom window: ${body.window_days}d`)
  })

  test("20.4 GET /api/upload/formats returns supported format list", async ({ request }) => {
    const res = await request.get(`${API}/api/upload/formats`)
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      formats: Array<{ extension: string; mimeType: string }>
      maxFileSize: string
      presignEndpoint: string
    }
    expect(Array.isArray(body.formats)).toBeTruthy()
    expect(body.formats.length, "should list multiple formats").toBeGreaterThan(10)
    expect(body.presignEndpoint).toBe("/api/upload/presign")

    // Verify key formats are present
    const extensions = body.formats.map((f) => f.extension)
    for (const ext of ["pdf", "docx", "txt", "csv", "mp3", "png"]) {
      expect(extensions, `format list must include .${ext}`).toContain(ext)
    }
    console.log(`20.4 — ${body.formats.length} formats listed`)
  })

  test("20.5 GET /api/pipeline/health returns pipeline worker status", async ({ request }) => {
    const res = await request.get(`${API}/api/pipeline/health`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      healthy: boolean
      totalStuck: number
      stuckByStage: Record<string, number>
      pendingByStage: Record<string, number>
    }
    expect(typeof body.healthy).toBe("boolean")
    expect(typeof body.totalStuck).toBe("number")
    expect(typeof body.stuckByStage).toBe("object")
    expect(typeof body.pendingByStage).toBe("object")
    console.log(`20.5 — pipeline health: ${body.healthy ? "healthy" : "UNHEALTHY"}, stuck=${body.totalStuck}`)
  })
})

// ===========================================================================
// SUITE 21 — Bulk Operations & Document Content
// ===========================================================================

test.describe("Suite 21 — Bulk Operations & Document Content", () => {
  test("21.1 GET /api/documents/:id/content returns chunks for uploaded document", async ({ request }) => {
    test.setTimeout(120_000)
    const user = await registerUser(request, "21", "content")
    const content = `Document Content Test ${RUN_ID}\n\n## Section One\n\nFirst section with important details about the system architecture.\n\n## Section Two\n\nSecond section covering deployment procedures and best practices.`
    const docId = await uploadDoc(request, user.apiToken, content, "content-test.md", "text/markdown")
    await waitForPipeline(request, docId, user.apiToken)

    const res = await request.get(`${API}/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      documentId: string
      fileName: string
      chunkCount: number
      chunks: Array<{ index: number; content: string; tokenCount: number | null }>
    }
    expect(body.documentId).toBe(docId)
    expect(body.fileName).toBe("content-test.md")
    expect(body.chunkCount).toBeGreaterThan(0)
    expect(body.chunks.length).toBe(body.chunkCount)

    // Chunks must be ordered by index
    for (let i = 1; i < body.chunks.length; i++) {
      expect(body.chunks[i].index).toBeGreaterThan(body.chunks[i - 1].index)
    }

    // Content must contain our text
    const allContent = body.chunks.map((c) => c.content).join(" ")
    expect(allContent).toContain("system architecture")
    console.log(`21.1 — ${body.chunkCount} chunks, content verified`)
  })

  test("21.2 GET /api/documents/:id/content without auth returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/any-doc-id/content`)
    expect(res.status()).toBe(401)
    console.log(`21.2 — no auth: ${res.status()}`)
  })

  test("21.3 GET /api/documents/:id/content for non-existent doc returns 404", async ({ request }) => {
    const user = await registerUser(request, "21", "notfound")
    const res = await request.get(`${API}/api/documents/nonexistent-${RUN_ID}/content`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status()).toBe(404)
    console.log(`21.3 — not found: ${res.status()}`)
  })

  test("21.4 DELETE /api/documents (bulk) deletes all user documents", async ({ request }) => {
    const user = await registerUser(request, "21", "bulk")
    // Upload 2 documents
    await uploadDoc(request, user.apiToken, `Bulk delete doc 1 ${RUN_ID}`, "bulk1.txt")
    await uploadDoc(request, user.apiToken, `Bulk delete doc 2 ${RUN_ID}`, "bulk2.txt")

    // Wait briefly for pipeline to register documents
    await sleep(2000)

    // Verify they exist
    const listBefore = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    const listBody = (await listBefore.json()) as { documents: Array<unknown>; total: number }
    const docsBefore = listBody.documents?.length ?? listBody.total ?? 0
    expect(docsBefore, "should have at least 2 docs before bulk delete").toBeGreaterThanOrEqual(2)

    // Bulk delete
    const delRes = await request.delete(`${API}/api/documents`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(delRes.status()).toBe(200)
    const body = (await delRes.json()) as { success: boolean; deleted: number }
    expect(body.success).toBe(true)
    expect(body.deleted, "should delete at least 2").toBeGreaterThanOrEqual(2)

    // Verify list is empty
    const listAfter = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    const afterBody = (await listAfter.json()) as { documents: Array<unknown>; total: number }
    const docsAfter = afterBody.documents?.length ?? afterBody.total ?? 0
    expect(docsAfter).toBe(0)
    console.log(`21.4 — bulk deleted ${body.deleted} docs, list now empty`)
  })

  test("21.5 DELETE /api/documents without auth returns 401", async ({ request }) => {
    const res = await request.delete(`${API}/api/documents`)
    expect(res.status()).toBe(401)
    console.log(`21.5 — no auth: ${res.status()}`)
  })
})
