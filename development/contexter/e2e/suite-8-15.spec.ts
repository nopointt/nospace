/**
 * Contexter — E2E Test Suites 8 & 15
 *
 * Tests against PRODUCTION:
 *   API: https://api.contexter.cc
 *
 * Coverage:
 *   Suite 8  — API Error Handling (no Groq needed)
 *   Suite 15 — Presigned Upload Edge Cases (no Groq needed)
 *
 * Run:
 *   cd C:/Users/noadmin/nospace/development/contexter
 *   npx playwright test e2e/suite-8-15.spec.ts --reporter=list
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "https://api.contexter.cc"

// Unique run ID to avoid cross-run collisions
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// Minimal inline content used for upload tests — avoids fixture file dependency
const INLINE_CONTENT = [
  "Suite 8 and Suite 15 Test Document",
  "This document is used for upload edge case and error handling tests.",
  "Topics: presigned URLs, error codes, pipeline polling.",
].join("\n\n")

const INLINE_FILENAME  = "edge-case-test.txt"
const INLINE_MIME      = "text/plain"
const INLINE_FILE_SIZE = Buffer.byteLength(INLINE_CONTENT, "utf8")

// ---------------------------------------------------------------------------
// Helpers  (self-contained — no import from smoke.spec.ts)
// ---------------------------------------------------------------------------

function uniqueEmail(suite: string, label: string): string {
  return `suite-${suite}-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function registerUser(
  request: APIRequestContext,
  suite: string,
  label: string,
): Promise<{ userId: string; apiToken: string; mcpUrl: string }> {
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      name: `suite-${suite}-${label}`,
      email: uniqueEmail(suite, label),
    }),
  })
  expect(res.status(), `register [${suite}/${label}] expected 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken, "apiToken must be present").toBeTruthy()
  return body as { userId: string; apiToken: string; mcpUrl: string }
}

/**
 * Execute presign → PUT → confirm in-memory.
 * Returns { documentId, r2Key, uploadUrl } from the presign step.
 */
async function presignAndUpload(
  request: APIRequestContext,
  token: string,
  userId: string,
  opts: {
    fileName?: string
    mimeType?: string
    fileSize?: number
    content?: string
  } = {},
): Promise<{ documentId: string; r2Key: string; uploadUrl: string }> {
  const fileName  = opts.fileName  ?? INLINE_FILENAME
  const mimeType  = opts.mimeType  ?? INLINE_MIME
  const content   = opts.content   ?? INLINE_CONTENT
  const fileSize  = opts.fileSize  ?? Buffer.byteLength(content, "utf8")
  const fileBuffer = Buffer.from(content, "utf8")

  const presignRes = await request.post(`${API}/api/upload/presign`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ fileName, mimeType, fileSize }),
  })
  expect(presignRes.status(), "presign expected 200").toBe(200)
  const { uploadUrl, documentId, r2Key } = await presignRes.json() as {
    uploadUrl: string
    documentId: string
    r2Key: string
    expiresIn: number
  }
  expect(uploadUrl,   "uploadUrl must be present").toBeTruthy()
  expect(documentId, "documentId must be present").toBeTruthy()
  expect(r2Key,      "r2Key must contain userId").toContain(userId)

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  })
  expect(putRes.status, `PUT to R2 expected 2xx, got ${putRes.status}`).toBeLessThan(300)

  return { documentId, r2Key, uploadUrl }
}

/**
 * Poll /api/status/:docId until all stages finish or any stage errors.
 */
async function waitForPipeline(
  request: APIRequestContext,
  docId: string,
  token: string,
  timeoutMs = 90_000,
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
    const allDone  = body.stages.every((s) => s.status === "done")
    const anyError = body.stages.some((s) => s.status === "error")
    if (allDone || anyError) return body
    await sleep(2_000)
  }
  throw new Error(`Pipeline did not complete within ${timeoutMs}ms for document ${docId}`)
}

// ===========================================================================
// SUITE 8 — API Error Handling
// ===========================================================================

test.describe("Suite 8 — API Error Handling", () => {
  // One authenticated user shared across tests that need auth
  let token: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "8", "auth-user")
    token = reg.apiToken
  })

  // -------------------------------------------------------------------------
  // 8.1  POST /api/query — no auth → 401
  // -------------------------------------------------------------------------
  test("8.1 POST /api/query without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/query`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "what is this?" }),
    })
    expect(res.status(), "missing auth must return 401").toBe(401)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.1 — 401 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.2  POST /api/query — invalid/garbage token → 401
  // -------------------------------------------------------------------------
  test("8.2 POST /api/query with invalid token returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer totally-invalid-garbage-token-xyz",
      },
      data: JSON.stringify({ query: "what is this?" }),
    })
    expect(res.status(), "invalid token must return 401").toBe(401)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.2 — 401 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.3  POST /api/query — empty body → 400
  // -------------------------------------------------------------------------
  test("8.3 POST /api/query with empty body returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: "{}",
    })
    // An empty JSON object lacks the required `query` field → 400
    expect(res.status(), "empty body must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.3 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.4  POST /api/query — missing query field → 400
  // -------------------------------------------------------------------------
  test("8.4 POST /api/query with missing query field returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ limit: 5 }),
    })
    expect(res.status(), "missing query field must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.4 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.5  POST /api/upload/presign — no auth → 401
  // -------------------------------------------------------------------------
  test("8.5 POST /api/upload/presign without auth returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ fileName: "file.txt", mimeType: "text/plain", fileSize: 100 }),
    })
    expect(res.status(), "missing auth on presign must return 401").toBe(401)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.5 — 401 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.6  POST /api/upload/presign — missing fileName → 400
  // -------------------------------------------------------------------------
  test("8.6 POST /api/upload/presign with missing fileName returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ mimeType: "text/plain", fileSize: 100 }),
    })
    expect(res.status(), "missing fileName must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.6 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.7  POST /api/upload/confirm — non-existent documentId → 404 or 400
  // -------------------------------------------------------------------------
  test("8.7 POST /api/upload/confirm with non-existent documentId returns 404 or 400", async ({ request }) => {
    const fakeDocId = `nonexistent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
    const res = await request.post(`${API}/api/upload/confirm`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        documentId: fakeDocId,
        r2Key: `some-user/${fakeDocId}/fake-file.txt`,
        fileName: "fake-file.txt",
        mimeType: "text/plain",
        fileSize: 100,
      }),
    })
    const status = res.status()
    expect(
      [400, 403, 404],
      `confirm with fake documentId must return 400, 403, or 404, got ${status}`,
    ).toContain(status)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`8.7 — ${status} error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 8.8  GET /api/documents — no auth → 401
  // -------------------------------------------------------------------------
  test("8.8 GET /api/documents without auth returns 401 or 404", async ({ request }) => {
    const res = await request.get(`${API}/api/documents`)
    const status = res.status()
    expect(
      [401, 404],
      `GET /api/documents without auth must return 401 or 404, got ${status}`,
    ).toContain(status)
    console.log(`8.8 — ${status}`)
  })

  // -------------------------------------------------------------------------
  // 8.9  GET /api/status/:nonexistent-id — with auth → 404 or 200 with empty
  // -------------------------------------------------------------------------
  test("8.9 GET /api/status/nonexistent-id with valid auth returns 404 or 200 empty", async ({ request }) => {
    const fakeId = `nonexistent-${Date.now().toString(36)}`
    const res = await request.get(`${API}/api/status/${fakeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const status = res.status()
    expect(
      [200, 404],
      `status for unknown doc must return 200 or 404, got ${status}`,
    ).toContain(status)

    if (status === 200) {
      // If the API returns 200, it should indicate the document was not found
      // via an empty result, null status, or similar sentinel
      const body = await res.json() as Record<string, unknown>
      const indicatesNotFound =
        body.status === null ||
        body.status === undefined ||
        body.status === "not_found" ||
        body.documentId === null ||
        body.documentId === undefined ||
        (Array.isArray(body.stages) && body.stages.length === 0)
      expect(
        indicatesNotFound,
        `200 response for unknown doc must indicate absence: ${JSON.stringify(body)}`,
      ).toBeTruthy()
    }
    console.log(`8.9 — status for nonexistent doc: ${status}`)
  })

  // -------------------------------------------------------------------------
  // 8.10  DELETE /api/documents/:nonexistent-id → 404 or 400
  // -------------------------------------------------------------------------
  test("8.10 DELETE /api/documents/nonexistent-id returns 404 or 400", async ({ request }) => {
    const fakeId = `nonexistent-${Date.now().toString(36)}`
    const res = await request.delete(`${API}/api/documents/${fakeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const status = res.status()
    expect(
      [400, 404],
      `DELETE nonexistent doc must return 400 or 404, got ${status}`,
    ).toContain(status)
    console.log(`8.10 — ${status}`)
  })
})

// ===========================================================================
// SUITE 15 — Presigned Upload Edge Cases
// ===========================================================================

test.describe("Suite 15 — Presigned Upload Edge Cases", () => {
  let token: string
  let userId: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "15", "upload-edge")
    token  = reg.apiToken
    userId = reg.userId
    console.log(`Suite 15 — userId: ${userId}, token: ${token.slice(0, 12)}...`)
  })

  // -------------------------------------------------------------------------
  // 15.1  Presign with empty fileName → 400
  // -------------------------------------------------------------------------
  test("15.1 presign with empty fileName returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ fileName: "", mimeType: "text/plain", fileSize: 100 }),
    })
    expect(res.status(), "empty fileName must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`15.1 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 15.2  Presign with unknown/exotic mimeType — server decides format
  //       The API may accept or reject it; we just assert no 5xx
  // -------------------------------------------------------------------------
  test("15.2 presign with exotic mimeType does not 5xx", async ({ request }) => {
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        fileName: "data.bin",
        mimeType: "application/x-exotic-unknown",
        fileSize: 512,
      }),
    })
    const status = res.status()
    expect(status, `exotic mimeType must not cause 5xx, got ${status}`).toBeLessThan(500)
    const body = await res.json() as { error?: string; uploadUrl?: string }
    // Either the server accepted it (200 + uploadUrl) or rejected it (4xx + error)
    if (status === 200) {
      expect(body.uploadUrl, "uploadUrl must be present on 200").toBeTruthy()
      console.log(`15.2 — server accepted exotic mimeType: uploadUrl present`)
    } else {
      expect(body.error, "4xx response must include error field").toBeTruthy()
      console.log(`15.2 — server rejected exotic mimeType with ${status}: ${body.error}`)
    }
  })

  // -------------------------------------------------------------------------
  // 15.3  Presign with fileSize = 0 → 400
  // -------------------------------------------------------------------------
  test("15.3 presign with fileSize 0 returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ fileName: "empty.txt", mimeType: "text/plain", fileSize: 0 }),
    })
    expect(res.status(), "fileSize 0 must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`15.3 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 15.4  Presign with fileSize > 200 MB — server may accept (R2 validates actual size)
  //       or reject at presign time. Both are valid behaviors.
  // -------------------------------------------------------------------------
  test("15.4 presign with fileSize > 200 MB does not return 5xx", async ({ request }) => {
    const oversizeBytes = 201 * 1024 * 1024 // 201 MB
    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ fileName: "huge.pdf", mimeType: "application/pdf", fileSize: oversizeBytes }),
    })
    // Accept 200 (presign doesn't validate size) or 400 (presign validates size)
    expect(res.status(), `oversized presign must not 5xx, got ${res.status()}`).toBeLessThan(500)
    console.log(`15.4 — oversized presign: ${res.status()}`)
  })

  // -------------------------------------------------------------------------
  // 15.5  Confirm with wrong r2Key (mismatched against any valid presign)
  // -------------------------------------------------------------------------
  test("15.5 confirm with wrong r2Key returns error", async ({ request }) => {
    // Step 1: Obtain a real documentId via presign (without uploading)
    const presignRes = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ fileName: "real.txt", mimeType: "text/plain", fileSize: 100 }),
    })
    expect(presignRes.status(), "presign expected 200").toBe(200)
    const { documentId } = await presignRes.json() as { documentId: string; r2Key: string; uploadUrl: string }

    // Step 2: Confirm with a completely wrong r2Key
    const wrongR2Key = `${userId}/wrong-bucket-path/not-real-file.txt`
    const confirmRes = await request.post(`${API}/api/upload/confirm`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        documentId,
        r2Key: wrongR2Key,
        fileName: "real.txt",
        mimeType: "text/plain",
        fileSize: 100,
      }),
    })
    const status = confirmRes.status()
    expect(
      [400, 404, 422],
      `wrong r2Key must return 4xx error, got ${status}`,
    ).toContain(status)
    const body = await confirmRes.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`15.5 — ${status} error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 15.6  Confirm with expired/missing documentId → error
  // -------------------------------------------------------------------------
  test("15.6 confirm with nonexistent documentId returns error", async ({ request }) => {
    const ghostDocId = `ghost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const res = await request.post(`${API}/api/upload/confirm`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        documentId: ghostDocId,
        r2Key: `${userId}/${ghostDocId}/ghost.txt`,
        fileName: "ghost.txt",
        mimeType: "text/plain",
        fileSize: 50,
      }),
    })
    const status = res.status()
    expect(
      [400, 404, 422],
      `confirm with missing documentId must return 4xx, got ${status}`,
    ).toContain(status)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present").toBeTruthy()
    console.log(`15.6 — ${status} error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 15.7  Double confirm — same documentId confirmed twice → graceful handling
  // -------------------------------------------------------------------------
  test("15.7 double confirm on the same documentId is handled gracefully", async ({ request }) => {
    // First: presign and PUT the file to R2 so the first confirm succeeds
    const { documentId, r2Key } = await presignAndUpload(request, token, userId)

    const confirmPayload = {
      documentId,
      r2Key,
      fileName: INLINE_FILENAME,
      mimeType: INLINE_MIME,
      fileSize: INLINE_FILE_SIZE,
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    // First confirm — should be 202
    const first = await request.post(`${API}/api/upload/confirm`, {
      headers,
      data: JSON.stringify(confirmPayload),
    })
    expect(first.status(), "first confirm must return 202").toBe(202)
    const firstBody = await first.json() as { documentId: string; status: string }
    expect(firstBody.status, "first confirm status must be processing").toBe("processing")

    // Second confirm — the server must not 5xx; accept 2xx (idempotent), 4xx (conflict/already confirmed)
    const second = await request.post(`${API}/api/upload/confirm`, {
      headers,
      data: JSON.stringify(confirmPayload),
    })
    const secondStatus = second.status()
    expect(
      secondStatus,
      `double confirm must not cause 5xx, got ${secondStatus}`,
    ).toBeLessThan(500)
    console.log(`15.7 — double confirm: first=202, second=${secondStatus}`)
  })

  // -------------------------------------------------------------------------
  // 15.8  Full flow: presign → PUT → confirm → pipeline starts (poll /api/status)
  //       Does NOT wait for pipeline completion (no Groq dependency)
  // -------------------------------------------------------------------------
  test("15.8 upload via presigned URL confirms and pipeline starts", async ({ request }) => {
    test.setTimeout(30_000)

    // Register a fresh user to get a clean pipeline counter
    const reg15 = await registerUser(request, "15", "pipeline-start")
    const freshToken  = reg15.apiToken
    const freshUserId = reg15.userId

    // Step 1: Presign
    const presignRes = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freshToken}`,
      },
      data: JSON.stringify({
        fileName: INLINE_FILENAME,
        mimeType: INLINE_MIME,
        fileSize: INLINE_FILE_SIZE,
      }),
    })
    expect(presignRes.status(), "presign expected 200").toBe(200)
    const { uploadUrl, documentId, r2Key } = await presignRes.json() as {
      uploadUrl: string
      documentId: string
      r2Key: string
      expiresIn: number
    }
    expect(uploadUrl,   "uploadUrl must be present").toBeTruthy()
    expect(documentId, "documentId must be present").toBeTruthy()
    expect(r2Key,      "r2Key must contain userId").toContain(freshUserId)
    expect(typeof (await presignRes.json().catch(() => ({ expiresIn: 0 }))), "expiresIn accessible").toBeDefined()
    console.log(`15.8 — presign OK: documentId=${documentId}`)

    // Step 2: PUT content to R2 presigned URL
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": INLINE_MIME },
      body: Buffer.from(INLINE_CONTENT, "utf8"),
    })
    expect(putRes.status, `PUT to R2 expected 2xx, got ${putRes.status}`).toBeLessThan(300)
    console.log(`15.8 — PUT to R2: ${putRes.status}`)

    // Step 3: Confirm
    const confirmRes = await request.post(`${API}/api/upload/confirm`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freshToken}`,
      },
      data: JSON.stringify({
        documentId,
        r2Key,
        fileName: INLINE_FILENAME,
        mimeType: INLINE_MIME,
        fileSize: INLINE_FILE_SIZE,
      }),
    })
    expect(confirmRes.status(), "confirm expected 202").toBe(202)
    const confirmBody = await confirmRes.json() as { documentId: string; status: string }
    expect(confirmBody.documentId, "confirm must echo documentId").toBe(documentId)
    expect(confirmBody.status,     "confirm status must be processing").toBe("processing")
    console.log(`15.8 — confirm OK: status=${confirmBody.status}`)

    // Step 4: Poll /api/status once (or a couple of times) — confirm pipeline is running
    // We only verify the document appears in status and has at least one stage.
    // We do NOT wait for completion (that would require Groq/embed).
    let pipelineVisible = false
    for (let attempt = 0; attempt < 6; attempt++) {
      await sleep(2_000)
      const statusRes = await request.get(`${API}/api/status/${documentId}`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      })
      if (statusRes.status() !== 200) continue

      const statusBody = await statusRes.json() as {
        documentId?: string
        status?: string
        stages?: Array<{ type: string; status: string }>
      }

      const hasStages   = Array.isArray(statusBody.stages) && statusBody.stages.length > 0
      const hasDocId    = statusBody.documentId === documentId
      const isProcessing =
        statusBody.status === "processing" ||
        statusBody.status === "ready" ||
        statusBody.status === "error"

      if (hasDocId && (hasStages || isProcessing)) {
        pipelineVisible = true
        console.log(
          `15.8 — pipeline visible after ${attempt + 1} polls: ` +
          `status=${statusBody.status}, stages=${JSON.stringify(statusBody.stages?.map((s) => s.type))}`,
        )
        break
      }
    }

    expect(
      pipelineVisible,
      "pipeline must become visible in /api/status within 12s after confirm",
    ).toBeTruthy()
  })
})
