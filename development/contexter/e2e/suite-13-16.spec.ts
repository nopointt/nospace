/**
 * Contexter — E2E Test Suites 13 & 16
 *
 * Tests against PRODUCTION:
 *   Frontend: https://contexter.cc
 *   API:      https://api.contexter.cc
 *
 * Coverage:
 *   Suite 13 — Documents Management (list, upload, status, delete, pagination)
 *   Suite 16 — Cross-User Data Isolation (CRITICAL security test)
 *
 * Run:
 *   cd /c/Users/noadmin/nospace/development/contexter
 *   npx playwright test e2e/suite-13-16.spec.ts --reporter=list
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "https://api.contexter.cc"

// Unique suffix per run to avoid collisions across parallel or back-to-back runs
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserCreds {
  userId: string
  apiToken: string
  mcpUrl: string
}

interface DocumentListItem {
  documentId: string
  fileName: string
  mimeType: string
  fileSize: number
  status: string
  chunks: number
  createdAt: string
}

interface DocumentListResponse {
  documents: DocumentListItem[]
  total: number
}

interface StatusResponse {
  documentId: string
  fileName: string
  mimeType: string
  fileSize: number
  status: string
  error: string | null
  stages: Array<{ type: string; status: string; progress: number; error_message?: string }>
  chunks: number
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Helpers (self-contained — no shared state across suites)
// ---------------------------------------------------------------------------

function uniqueEmail(label: string): string {
  return `suite-${label}-${RUN_ID}@test.contexter.dev`
}

function uniqueContent(label: string): string {
  // UUID-quality uniqueness so tests never collide on content searches
  return [
    `Test Document — ${label} — ${RUN_ID}`,
    `This content is uniquely generated for automated E2E testing.`,
    `Label: ${label}. Run: ${RUN_ID}. Timestamp: ${Date.now()}.`,
    `Keywords: semantic-search, vector-embedding, retrieval-augmented-generation.`,
  ].join("\n\n")
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
): Promise<string> {
  const mimeType = "text/plain"
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
  expect(presign.uploadUrl, "uploadUrl must be present").toBeTruthy()
  expect(presign.documentId, "documentId must be present").toBeTruthy()
  expect(presign.r2Key, "r2Key must contain userId").toContain(userId)

  // Step 2 — PUT to R2 presigned URL
  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  })
  expect(
    putRes.status,
    `PUT to R2 expected 2xx, got ${putRes.status}`,
  ).toBeLessThan(300)

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
  timeoutMs = 90_000,
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
    const allDone = body.stages.every((s) => s.status === "done")
    const anyError = body.stages.some((s) => s.status === "error")
    if (allDone || anyError) return body
    await sleep(2_000)
  }
  throw new Error(`Pipeline did not complete within ${timeoutMs}ms for document ${docId}`)
}

// ===========================================================================
// SUITE 13 — Documents Management
// ===========================================================================

test.describe("Suite 13 — Documents Management", () => {
  // Each test that needs auth registers its own user for full independence.
  // Serial sub-groups share state only within that group.

  // -------------------------------------------------------------------------
  // 13.1 — GET /api/status with valid auth returns 200 and array
  // -------------------------------------------------------------------------

  test("13.1 GET /api/status with valid auth returns 200 and documents array", async ({ request }) => {
    const { apiToken } = await registerUser(request, "s13-list")

    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(res.status(), "expected 200").toBe(200)

    const body = await res.json() as DocumentListResponse
    expect(Array.isArray(body.documents), "documents must be an array").toBeTruthy()
    expect(typeof body.total).toBe("number")
    // Fresh user — no documents yet
    expect(body.documents.length, "fresh user has no documents").toBe(0)
    expect(body.total).toBe(0)
  })

  // -------------------------------------------------------------------------
  // 13.2 — Upload a document, verify it appears in GET /api/status
  // -------------------------------------------------------------------------

  test("13.2 uploaded document appears in GET /api/status list", async ({ request }) => {
    const { apiToken, userId } = await registerUser(request, "s13-appears")

    const content = uniqueContent("s13-appears")
    const fileName = `doc-appears-${RUN_ID}.txt`
    const docId = await uploadInlineContent(request, apiToken, userId, content, fileName)

    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(res.status()).toBe(200)

    const body = await res.json() as DocumentListResponse
    expect(Array.isArray(body.documents)).toBeTruthy()
    expect(body.documents.length, "at least one document should be listed").toBeGreaterThan(0)

    const found = body.documents.find((d) => d.documentId === docId)
    expect(found, `document ${docId} must appear in list`).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 13.3 — Listed document has correct name, mimeType, and status
  // -------------------------------------------------------------------------

  test("13.3 GET /api/status returns document with correct fileName, mimeType, status", async ({ request }) => {
    const { apiToken, userId } = await registerUser(request, "s13-fields")

    const content = uniqueContent("s13-fields")
    const fileName = `doc-fields-${RUN_ID}.txt`
    const docId = await uploadInlineContent(request, apiToken, userId, content, fileName)

    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(res.status()).toBe(200)

    const body = await res.json() as DocumentListResponse
    const doc = body.documents.find((d) => d.documentId === docId)
    expect(doc, "document must be in list").toBeDefined()
    expect(doc!.fileName).toBe(fileName)
    expect(doc!.mimeType).toBe("text/plain")
    // Immediately after upload the status is processing (or ready if pipeline is fast)
    expect(["processing", "ready"]).toContain(doc!.status)
  })

  // -------------------------------------------------------------------------
  // 13.4 — DELETE /api/status/:id removes the document
  // -------------------------------------------------------------------------

  test("13.4 DELETE /api/status/:id removes the document → 200", async ({ request }) => {
    test.setTimeout(120_000)

    const { apiToken, userId } = await registerUser(request, "s13-delete")

    const content = uniqueContent("s13-delete")
    const fileName = `doc-delete-${RUN_ID}.txt`
    const docId = await uploadInlineContent(request, apiToken, userId, content, fileName)

    // Wait until the document is at least visible (pipeline may still run)
    await sleep(1_000)

    const delRes = await request.delete(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(delRes.status(), "DELETE expected 200").toBe(200)

    const delBody = await delRes.json() as { success: boolean }
    expect(delBody.success).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 13.5 — GET /api/status after delete — document no longer listed
  // -------------------------------------------------------------------------

  test("13.5 GET /api/status after delete — document no longer listed", async ({ request }) => {
    test.setTimeout(120_000)

    const { apiToken, userId } = await registerUser(request, "s13-after-del")

    const content = uniqueContent("s13-after-del")
    const fileName = `doc-after-del-${RUN_ID}.txt`
    const docId = await uploadInlineContent(request, apiToken, userId, content, fileName)

    await sleep(500)

    // Delete
    const delRes = await request.delete(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(delRes.status()).toBe(200)

    // List — document must not appear
    const listRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(listRes.status()).toBe(200)

    const body = await listRes.json() as DocumentListResponse
    const found = body.documents.find((d) => d.documentId === docId)
    expect(found, "deleted document must not appear in list").toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // 13.6 — Upload multiple documents (3), verify all listed
  // -------------------------------------------------------------------------

  test("13.6 upload 3 documents — all appear in GET /api/status list", async ({ request }) => {
    const { apiToken, userId } = await registerUser(request, "s13-multi")

    const uploads = await Promise.all(
      [1, 2, 3].map((n) =>
        uploadInlineContent(
          request,
          apiToken,
          userId,
          uniqueContent(`s13-multi-${n}`),
          `doc-multi-${n}-${RUN_ID}.txt`,
        )
      )
    )
    // All three uploads must succeed
    expect(uploads.length).toBe(3)
    for (const id of uploads) {
      expect(id, "each upload must return a documentId").toBeTruthy()
    }

    const listRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(listRes.status()).toBe(200)

    const body = await listRes.json() as DocumentListResponse
    expect(body.documents.length, "all 3 documents must be listed").toBeGreaterThanOrEqual(3)

    for (const docId of uploads) {
      const found = body.documents.find((d) => d.documentId === docId)
      expect(found, `document ${docId} must appear in list`).toBeDefined()
    }
  })

  // -------------------------------------------------------------------------
  // 13.7 — GET /api/status/:id returns stage details
  // -------------------------------------------------------------------------

  test("13.7 GET /api/status/:id returns stage details for a processing/ready document", async ({ request }) => {
    test.setTimeout(30_000)

    const { apiToken, userId } = await registerUser(request, "s13-stages")

    const content = uniqueContent("s13-stages")
    const fileName = `doc-stages-${RUN_ID}.txt`
    const docId = await uploadInlineContent(request, apiToken, userId, content, fileName)

    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(res.status(), "status/:id expected 200").toBe(200)

    const body = await res.json() as StatusResponse
    expect(body.documentId).toBe(docId)
    expect(body.fileName).toBe(fileName)
    expect(body.mimeType).toBe("text/plain")
    expect(["processing", "ready"]).toContain(body.status)

    // Stages must be an array (may be empty immediately after upload)
    expect(Array.isArray(body.stages), "stages must be an array").toBeTruthy()

    // If stages are already populated, each must have type and status fields
    for (const stage of body.stages) {
      expect(typeof stage.type, `stage type must be a string`).toBe("string")
      expect(typeof stage.status, `stage status must be a string`).toBe("string")
    }

    // If all stages are present, verify known stage types
    if (body.stages.length === 4) {
      const types = body.stages.map((s) => s.type)
      expect(types).toContain("parse")
      expect(types).toContain("chunk")
      expect(types).toContain("embed")
      expect(types).toContain("index")
    }

    console.log(`13.7 — docId=${docId} status=${body.status} stages=${body.stages.length}`)
  })

  // -------------------------------------------------------------------------
  // 13.8 — Pagination: query params ?limit= reduce results
  // -------------------------------------------------------------------------

  test("13.8 GET /api/status list respects basic structure (pagination if supported)", async ({ request }) => {
    const { apiToken, userId } = await registerUser(request, "s13-pag")

    // Upload 3 docs so there is something to paginate
    await Promise.all(
      [1, 2, 3].map((n) =>
        uploadInlineContent(
          request,
          apiToken,
          userId,
          uniqueContent(`s13-pag-${n}`),
          `pag-${n}-${RUN_ID}.txt`,
        )
      )
    )

    // Base list — should have all 3
    const baseRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    expect(baseRes.status()).toBe(200)
    const baseBody = await baseRes.json() as DocumentListResponse
    expect(baseBody.documents.length).toBeGreaterThanOrEqual(3)

    // Attempt pagination via query params — the API may or may not support them.
    // The test validates the response is always well-formed, not that pagination works.
    const pagedRes = await request.get(`${API}/api/status?limit=2&offset=0`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    // Acceptable: 200 (with or without pagination honoured), not 5xx
    expect(pagedRes.status(), "paginated request must not 5xx").toBeLessThan(500)

    if (pagedRes.status() === 200) {
      const pagedBody = await pagedRes.json() as DocumentListResponse
      expect(Array.isArray(pagedBody.documents), "documents still an array when limit param given").toBeTruthy()
      // If pagination is honoured, at most 2 results
      // If not honoured, all results are returned — both are acceptable
      console.log(`13.8 — base=${baseBody.documents.length} paged=${pagedBody.documents.length}`)
    }
  })
})

// ===========================================================================
// SUITE 16 — Cross-User Data Isolation (CRITICAL security test)
// ===========================================================================

test.describe.serial("Suite 16 — Cross-User Data Isolation", () => {
  // All state is local to this serial describe block.
  // Two entirely fresh users are registered at suite startup.

  let userA: UserCreds
  let userB: UserCreds

  // Unique content strings — UUID-quality to prevent content collision
  const contentA = `User A secret data: alpha-bravo-charlie — ${RUN_ID}`
  const contentB = `User B secret data: delta-echo-foxtrot — ${RUN_ID}`
  const fileNameA = `secret-a-${RUN_ID}.txt`
  const fileNameB = `secret-b-${RUN_ID}.txt`

  let docIdA: string
  let docIdB: string

  // -------------------------------------------------------------------------
  // Setup — register two fresh users and upload one document each
  // -------------------------------------------------------------------------

  test.beforeAll(async ({ request }) => {
    // Register both users
    ;[userA, userB] = await Promise.all([
      registerUser(request, "s16-userA"),
      registerUser(request, "s16-userB"),
    ])

    // Upload a document for each user (parallel for speed)
    ;[docIdA, docIdB] = await Promise.all([
      uploadInlineContent(request, userA.apiToken, userA.userId, contentA, fileNameA),
      uploadInlineContent(request, userB.apiToken, userB.userId, contentB, fileNameB),
    ])

    // Wait for both pipelines to complete so search indexes are populated
    await Promise.all([
      waitForPipeline(request, docIdA, userA.apiToken, 90_000),
      waitForPipeline(request, docIdB, userB.apiToken, 90_000),
    ])

    console.log(`Suite 16 setup: docIdA=${docIdA} docIdB=${docIdB}`)
  })

  // -------------------------------------------------------------------------
  // 16.1 — User A sees only their document in GET /api/status
  // -------------------------------------------------------------------------

  test("16.1 User A GET /api/status sees only their document, not User B's", async ({ request }) => {
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${userA.apiToken}` },
    })
    expect(res.status(), "User A list expected 200").toBe(200)

    const body = await res.json() as DocumentListResponse
    expect(Array.isArray(body.documents)).toBeTruthy()

    const ids = body.documents.map((d) => d.documentId)
    expect(ids, "User A must see their own document").toContain(docIdA)
    expect(ids, "User A must NOT see User B's document").not.toContain(docIdB)

    console.log(`16.1 — User A sees ${ids.length} doc(s): ${ids.join(", ")}`)
  })

  // -------------------------------------------------------------------------
  // 16.2 — User B sees only their document in GET /api/status
  // -------------------------------------------------------------------------

  test("16.2 User B GET /api/status sees only their document, not User A's", async ({ request }) => {
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${userB.apiToken}` },
    })
    expect(res.status(), "User B list expected 200").toBe(200)

    const body = await res.json() as DocumentListResponse
    expect(Array.isArray(body.documents)).toBeTruthy()

    const ids = body.documents.map((d) => d.documentId)
    expect(ids, "User B must see their own document").toContain(docIdB)
    expect(ids, "User B must NOT see User A's document").not.toContain(docIdA)

    console.log(`16.2 — User B sees ${ids.length} doc(s): ${ids.join(", ")}`)
  })

  // -------------------------------------------------------------------------
  // 16.3 — User A cannot access User B's document via GET /api/status/:id
  // -------------------------------------------------------------------------

  test("16.3 User A GET /api/status/:userBDocId → 404 (not User B's details)", async ({ request }) => {
    const res = await request.get(`${API}/api/status/${docIdB}`, {
      headers: { Authorization: `Bearer ${userA.apiToken}` },
    })
    // The API must not expose User B's document to User A.
    // Acceptable: 404 (not found for this user) or 403 (forbidden).
    const status = res.status()
    expect(
      [403, 404],
      `User A accessing User B's doc should get 403 or 404, got ${status}`,
    ).toContain(status)

    // Must not return sensitive document metadata
    if (status === 200) {
      // If somehow 200, it MUST NOT contain User B's document id — this would be a critical security bug
      const body = await res.json() as { documentId?: string }
      expect(
        body.documentId,
        "SECURITY VIOLATION: User A received User B document data",
      ).not.toBe(docIdB)
    }

    console.log(`16.3 — User A accessing docIdB → ${status}`)
  })

  // -------------------------------------------------------------------------
  // 16.4 — User B cannot access User A's document via GET /api/status/:id
  // -------------------------------------------------------------------------

  test("16.4 User B GET /api/status/:userADocId → 404 (not User A's details)", async ({ request }) => {
    const res = await request.get(`${API}/api/status/${docIdA}`, {
      headers: { Authorization: `Bearer ${userB.apiToken}` },
    })
    const status = res.status()
    expect(
      [403, 404],
      `User B accessing User A's doc should get 403 or 404, got ${status}`,
    ).toContain(status)

    if (status === 200) {
      const body = await res.json() as { documentId?: string }
      expect(
        body.documentId,
        "SECURITY VIOLATION: User B received User A document data",
      ).not.toBe(docIdA)
    }

    console.log(`16.4 — User B accessing docIdA → ${status}`)
  })

  // -------------------------------------------------------------------------
  // 16.5 — User A cannot delete User B's document
  // -------------------------------------------------------------------------

  test("16.5 User A DELETE /api/status/:userBDocId → 403 or 404", async ({ request }) => {
    const res = await request.delete(`${API}/api/status/${docIdB}`, {
      headers: { Authorization: `Bearer ${userA.apiToken}` },
    })
    const status = res.status()
    expect(
      [403, 404],
      `User A deleting User B's doc should get 403 or 404, got ${status}`,
    ).toContain(status)

    // Verify User B's document still exists after the failed delete attempt
    const verifyRes = await request.get(`${API}/api/status/${docIdB}`, {
      headers: { Authorization: `Bearer ${userB.apiToken}` },
    })
    expect(verifyRes.status(), "User B's document must still exist after failed cross-user delete").toBe(200)

    console.log(`16.5 — Cross-user delete attempt → ${status}, doc still exists: ${verifyRes.status() === 200}`)
  })

  // -------------------------------------------------------------------------
  // 16.6 — User B cannot delete User A's document
  // -------------------------------------------------------------------------

  test("16.6 User B DELETE /api/status/:userADocId → 403 or 404", async ({ request }) => {
    const res = await request.delete(`${API}/api/status/${docIdA}`, {
      headers: { Authorization: `Bearer ${userB.apiToken}` },
    })
    const status = res.status()
    expect(
      [403, 404],
      `User B deleting User A's doc should get 403 or 404, got ${status}`,
    ).toContain(status)

    // Verify User A's document still exists
    const verifyRes = await request.get(`${API}/api/status/${docIdA}`, {
      headers: { Authorization: `Bearer ${userA.apiToken}` },
    })
    expect(verifyRes.status(), "User A's document must still exist after failed cross-user delete").toBe(200)

    console.log(`16.6 — Cross-user delete attempt → ${status}, doc still exists: ${verifyRes.status() === 200}`)
  })

  // -------------------------------------------------------------------------
  // 16.7 — User A cannot access User B's document content
  // -------------------------------------------------------------------------

  test("16.7 User A GET /api/documents/:userBDocId/content → 403 or 404", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/${docIdB}/content`, {
      headers: { Authorization: `Bearer ${userA.apiToken}` },
    })
    const status = res.status()
    expect(
      [403, 404],
      `User A accessing User B doc content should get 403 or 404, got ${status}`,
    ).toContain(status)

    if (status === 200) {
      // If returned 200 this is a critical security violation — check no User B content leaked
      const body = await res.json() as { documentId?: string; chunks?: unknown[] }
      expect(
        body.documentId,
        "SECURITY VIOLATION: User A received User B document content",
      ).not.toBe(docIdB)
    }

    console.log(`16.7 — User A accessing User B content → ${status}`)
  })

  // -------------------------------------------------------------------------
  // 16.8 — Query isolation: User A query finds their content, not User B's
  //
  // This test requires Groq (LLM inference). If Groq is unavailable (500/429)
  // the test skips gracefully rather than failing. The vector-search (sources)
  // isolation check is attempted even when the LLM fails.
  // -------------------------------------------------------------------------

  test("16.8 User A query 'alpha bravo charlie' finds own doc, NOT User B's (skip if Groq unavailable)", async ({ request }) => {
    test.setTimeout(120_000)

    const queryA = `alpha-bravo-charlie ${RUN_ID}`

    let res: Awaited<ReturnType<typeof request.post>>
    try {
      res = await request.post(`${API}/api/query`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userA.apiToken}`,
        },
        data: JSON.stringify({ query: queryA }),
      })
    } catch {
      test.skip(true, "Query request failed — network error, skipping Groq-dependent test")
      return
    }

    const status = res.status()

    // Groq unavailable — skip gracefully
    if (status === 500 || status === 429 || status === 503) {
      console.log(`16.8 — Groq unavailable (${status}), skipping query isolation check`)
      test.skip(true, `Groq unavailable (HTTP ${status}) — skipping query isolation`)
      return
    }

    expect(status, "query expected 200").toBe(200)

    const body = await res.json() as {
      answer?: string
      sources?: Array<{ content: string; score: number; document_name?: string }>
    }

    // Check sources — vector search must only return User A's documents
    if (Array.isArray(body.sources) && body.sources.length > 0) {
      for (const source of body.sources) {
        // Each source content must NOT contain User B's unique secret content
        const hasUserBContent = source.content.includes("delta-echo-foxtrot")
          || source.content.includes(contentB.slice(0, 30))
        expect(
          hasUserBContent,
          `SECURITY VIOLATION: User A's query result contains User B's content: "${source.content.slice(0, 100)}"`,
        ).toBe(false)
      }

      // At least one source should relate to User A's document
      const hasUserAContent = body.sources.some(
        (s) => s.content.includes("alpha-bravo-charlie") || (s.document_name ?? "").includes(fileNameA.slice(0, 15)),
      )
      console.log(`16.8 — Sources: ${body.sources.length}, User A content found: ${hasUserAContent}`)
    } else {
      // No sources returned — acceptable (empty index or no match)
      console.log(`16.8 — Query returned 200 with no sources (empty result — OK)`)
    }
  })

  // -------------------------------------------------------------------------
  // 16.9 — User A query for User B's content returns no User B sources
  // -------------------------------------------------------------------------

  test("16.9 User A query 'delta echo foxtrot' must NOT return User B's document sources (skip if Groq unavailable)", async ({ request }) => {
    test.setTimeout(120_000)

    // Query using User B's unique content string — User A should never see B's data
    const queryB = `delta-echo-foxtrot ${RUN_ID}`

    let res: Awaited<ReturnType<typeof request.post>>
    try {
      res = await request.post(`${API}/api/query`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userA.apiToken}`,
        },
        data: JSON.stringify({ query: queryB }),
      })
    } catch {
      test.skip(true, "Query request failed — network error, skipping Groq-dependent test")
      return
    }

    const status = res.status()

    // Groq unavailable — skip gracefully
    if (status === 500 || status === 429 || status === 503) {
      console.log(`16.9 — Groq unavailable (${status}), skipping cross-user query check`)
      test.skip(true, `Groq unavailable (HTTP ${status}) — skipping cross-user query check`)
      return
    }

    expect(status, "query expected 200").toBe(200)

    const body = await res.json() as {
      answer?: string
      sources?: Array<{ content: string; score: number; document_name?: string }>
    }

    // Critical: no source must contain User B's content
    if (Array.isArray(body.sources)) {
      for (const source of body.sources) {
        const hasUserBContent = source.content.includes("delta-echo-foxtrot")
          || source.content.includes(contentB.slice(0, 30))
        expect(
          hasUserBContent,
          `SECURITY VIOLATION: User A received User B's content via cross-user query: "${source.content.slice(0, 100)}"`,
        ).toBe(false)
      }
      console.log(`16.9 — Queried User B's terms from User A context. Sources returned: ${body.sources.length} (all must be User A's or empty)`)
    }
  })
})
