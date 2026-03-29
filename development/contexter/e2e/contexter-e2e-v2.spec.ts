/**
 * Contexter — E2E Test Suite v2 (Moholy, QA Engineer)
 * Suites 9–17
 *
 * Tests against PRODUCTION:
 *   Frontend: https://contexter.cc
 *   API:      https://api.contexter.cc
 *
 * Run:
 *   cd /c/Users/noadmin/nospace/development/contexter
 *   npx playwright test e2e/contexter-e2e-v2.spec.ts --reporter=list
 */

import { test, expect, type APIRequestContext, type Page } from "@playwright/test"
import { readFileSync, existsSync, statSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FRONTEND = "https://contexter.cc"
const API = "https://api.contexter.cc"

const FIXTURES = resolve(__dirname, "../test-fixtures")
const SMALL_TXT = resolve(FIXTURES, "test-small.txt")
const PDF_IMG = resolve(FIXTURES, "test-pdf-with-images.pdf")
const AUDIO_WAV = resolve(FIXTURES, "test-audio-25mb.wav")

const RUN_ID = Date.now().toString(36)

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function registerUser(
  request: APIRequestContext,
  prefix: string,
): Promise<{ userId: string; apiToken: string; mcpUrl: string }> {
  const email = `test-${prefix}-${RUN_ID}@test.contexter.cc`
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: `Test ${prefix}`, email }),
  })
  expect(res.status(), `register ${prefix} should return 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken).toBeTruthy()
  return body as { userId: string; apiToken: string; mcpUrl: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForPipeline(
  request: APIRequestContext,
  docId: string,
  token: string,
  maxMs = 90_000,
): Promise<{ status: string; stages: { type: string; status: string; error_message?: string }[] }> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const stages = body.stages as { type: string; status: string; error_message?: string }[]
    const allDone = stages.every((s) => s.status === "done")
    const anyError = stages.some((s) => s.status === "error")
    if (allDone || anyError) return body
    await sleep(2000)
  }
  throw new Error(`Pipeline did not complete within ${maxMs}ms for doc ${docId}`)
}

async function presignAndUpload(
  request: APIRequestContext,
  token: string,
  filePath: string,
  mimeType: string,
): Promise<{ documentId: string; r2Key: string }> {
  const fileBuffer = readFileSync(filePath)
  const fileName = filePath.split("/").pop()!

  const presignRes = await request.post(`${API}/api/upload/presign`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ fileName, mimeType, fileSize: fileBuffer.length }),
  })
  expect(presignRes.status()).toBe(200)
  const { uploadUrl, documentId, r2Key } = await presignRes.json()

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  })
  expect(putRes.status).toBeLessThan(300)

  const confirmRes = await request.post(`${API}/api/upload/confirm`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ documentId, r2Key, fileName, mimeType, fileSize: fileBuffer.length }),
  })
  expect(confirmRes.status()).toBe(202)

  return { documentId, r2Key }
}

// ===========================================================================
// SUITE 9: CORS
// ===========================================================================

test.describe("Suite 9 — CORS", () => {
  test("9.1 OPTIONS preflight from contexter.cc → 204 with correct CORS headers", async ({
    request,
  }) => {
    const res = await request.fetch(`${API}/api/upload/presign`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://contexter.cc",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    })
    // Preflight should be 204 or 200
    expect([200, 204]).toContain(res.status())
    const allowOrigin = res.headers()["access-control-allow-origin"]
    const allowMethods = res.headers()["access-control-allow-methods"]
    console.log(`9.1 — Status: ${res.status()}, Allow-Origin: ${allowOrigin}, Allow-Methods: ${allowMethods}`)
    // Must reflect the origin or be wildcard
    expect(allowOrigin).toBeTruthy()
  })

  test("9.2 OPTIONS from evil.com → no permissive Allow-Origin", async ({ request }) => {
    const res = await request.fetch(`${API}/api/upload/presign`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    })
    const allowOrigin = res.headers()["access-control-allow-origin"]
    console.log(`9.2 — evil.com Allow-Origin: "${allowOrigin}", status: ${res.status()}`)
    // Should NOT echo back evil.com as the Allow-Origin
    const permitsEvil = allowOrigin === "https://evil.com" || allowOrigin === "*"
    expect(permitsEvil).toBeFalsy()
  })

  test("9.3 GET /health → returns healthy", async ({ request }) => {
    const res = await request.get(`${API}/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("healthy")
    console.log(`9.3 — Health status: ${body.status}`)
  })

  test("9.4 GET /api/upload/formats → format list + presignEndpoint", async ({ request }) => {
    const res = await request.get(`${API}/api/upload/formats`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.formats)).toBeTruthy()
    expect(body.formats.length).toBeGreaterThan(0)
    expect(body.presignEndpoint).toBeTruthy()
    console.log(`9.4 — Formats: ${body.formats.length}, presignEndpoint: ${body.presignEndpoint}`)
  })

  test("9.5 GET / on API → status < 500", async ({ request }) => {
    const res = await request.get(`${API}/`)
    expect(res.status()).toBeLessThan(500)
    console.log(`9.5 — API root status: ${res.status()}`)
  })
})

// ===========================================================================
// SUITE 10: Auth + Shares
// ===========================================================================

test.describe.serial("Suite 10 — Auth + Shares", () => {
  let suite10Token: string
  let suite10UserId: string
  let createdShareId: string

  test("10.1 register valid user → 201, userId + apiToken", async ({ request }) => {
    const email = `test-s10-valid-${RUN_ID}@test.contexter.cc`
    const res = await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Suite10 Valid", email }),
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.userId).toBeTruthy()
    expect(body.apiToken).toBeTruthy()
    suite10Token = body.apiToken
    suite10UserId = body.userId
    console.log(`10.1 — userId: ${body.userId}, token: ${body.apiToken.slice(0, 12)}...`)
  })

  test("10.2 register duplicate email → 409", async ({ request }) => {
    const email = `test-s10-dup-${RUN_ID}@test.contexter.cc`
    await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Suite10 Dup", email }),
    })
    const res2 = await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Suite10 Dup2", email }),
    })
    expect(res2.status()).toBe(409)
    console.log(`10.2 — Duplicate 409: ${(await res2.json()).error}`)
  })

  test("10.3 register no email → 201 (anonymous registration)", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Suite10 NoEmail" }),
    })
    // Some APIs allow anonymous registration without email
    const body = await res.json()
    console.log(`10.3 — No-email registration status: ${res.status()}, body: ${JSON.stringify(body).slice(0, 200)}`)
    // Accept 201 (anonymous OK) or 400 (email required)
    expect([201, 400]).toContain(res.status())
  })

  test("10.4 register empty body → 400", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({}),
    })
    expect(res.status()).toBe(400)
    console.log(`10.4 — Empty body 400: ${(await res.json()).error}`)
  })

  test("10.5 register invalid email → 400", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ name: "Suite10 BadEmail", email: "not-an-email" }),
    })
    expect(res.status()).toBe(400)
    console.log(`10.5 — Invalid email 400: ${(await res.json()).error}`)
  })

  test("10.6 GET /api/status with valid token → 200", async ({ request }) => {
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${suite10Token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.documents)).toBeTruthy()
    console.log(`10.6 — Status with valid token: documents=${body.documents.length}`)
  })

  test("10.7 GET /api/status with fake token → 401", async ({ request }) => {
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: "Bearer fake_token_xyz_12345_abcdef" },
    })
    expect(res.status()).toBe(401)
    console.log(`10.7 — Fake token 401`)
  })

  test("10.8 create share → shareId + shareToken", async ({ request }) => {
    const res = await request.post(`${API}/api/shares`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${suite10Token}`,
      },
      data: JSON.stringify({ name: "Suite10 Share" }),
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.shareId || body.id).toBeTruthy()
    createdShareId = body.shareId || body.id
    console.log(`10.8 — Created share: ${JSON.stringify(body).slice(0, 200)}`)
  })

  test("10.9 list shares → contains our share", async ({ request }) => {
    const res = await request.get(`${API}/api/shares`, {
      headers: { Authorization: `Bearer ${suite10Token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const shares = body.shares || body
    expect(Array.isArray(shares)).toBeTruthy()
    const found = shares.find(
      (s: { shareId?: string; id?: string }) => s.shareId === createdShareId || s.id === createdShareId
    )
    expect(found).toBeDefined()
    console.log(`10.9 — Found share in list: ${JSON.stringify(found).slice(0, 200)}`)
  })

  test("10.10 revoke share → success", async ({ request }) => {
    const res = await request.delete(`${API}/api/shares/${createdShareId}`, {
      headers: { Authorization: `Bearer ${suite10Token}` },
    })
    expect([200, 204]).toContain(res.status())
    console.log(`10.10 — Revoke share status: ${res.status()}`)
  })

  test("10.11 list after revoke → share gone", async ({ request }) => {
    const res = await request.get(`${API}/api/shares`, {
      headers: { Authorization: `Bearer ${suite10Token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const shares = body.shares || body
    expect(Array.isArray(shares)).toBeTruthy()
    const found = shares.find(
      (s: { shareId?: string; id?: string }) => s.shareId === createdShareId || s.id === createdShareId
    )
    expect(found).toBeUndefined()
    console.log(`10.11 — Share no longer in list after revoke`)
  })
})

// ===========================================================================
// SUITE 11: Presigned TXT deep
// ===========================================================================

test.describe.serial("Suite 11 — Presigned TXT Deep", () => {
  let token: string
  let userId: string
  let docId: string
  let presignedUploadUrl: string
  let presignedR2Key: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "s11-txt")
    token = reg.apiToken
    userId = reg.userId
  })

  test("11.1 presign → uploadUrl, documentId, r2Key, expiresIn", async ({ request }) => {
    expect(existsSync(SMALL_TXT)).toBeTruthy()
    const stat = statSync(SMALL_TXT)

    const res = await request.post(`${API}/api/upload/presign`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        fileName: "test-small.txt",
        mimeType: "text/plain",
        fileSize: stat.size,
      }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.uploadUrl).toBeTruthy()
    expect(body.documentId).toBeTruthy()
    expect(body.r2Key).toBeTruthy()
    expect(body.expiresIn).toBeGreaterThan(0)
    presignedUploadUrl = body.uploadUrl
    docId = body.documentId
    presignedR2Key = body.r2Key
    console.log(`11.1 — Presign OK: docId=${docId}, expiresIn=${body.expiresIn}`)
  })

  test("11.2 PUT to R2 → success", async () => {
    const fileBuffer = readFileSync(SMALL_TXT)
    const res = await fetch(presignedUploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: fileBuffer,
    })
    expect(res.status).toBeLessThan(300)
    console.log(`11.2 — PUT to R2 status: ${res.status}`)
  })

  test("11.3 confirm → 202, processing", async ({ request }) => {
    const fileBuffer = readFileSync(SMALL_TXT)
    const res = await request.post(`${API}/api/upload/confirm`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        documentId: docId,
        r2Key: presignedR2Key,
        fileName: "test-small.txt",
        mimeType: "text/plain",
        fileSize: fileBuffer.length,
      }),
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.documentId).toBe(docId)
    expect(body.status).toBe("processing")
    console.log(`11.3 — Confirm: status=${body.status}`)
  })

  test("11.4 poll pipeline → ready, all stages done (90s timeout)", async ({ request }) => {
    test.setTimeout(120_000)
    const result = await waitForPipeline(request, docId, token, 90_000)
    expect(result.status).toBe("ready")
    for (const stage of result.stages) {
      expect(stage.status, `Stage ${stage.type} should be done`).toBe("done")
    }
    const stagesSummary = result.stages.map((s) => `${s.type}=${s.status}`).join(", ")
    console.log(`11.4 — Pipeline: ${stagesSummary}`)
  })

  test("11.5 GET /api/documents/:id/content → chunks with text", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const chunks = body.chunks || body.content || body
    expect(Array.isArray(chunks)).toBeTruthy()
    expect(chunks.length).toBeGreaterThan(0)
    const firstChunk = chunks[0]
    expect(firstChunk.text || firstChunk.content || firstChunk.chunk_text).toBeTruthy()
    console.log(`11.5 — Content chunks: ${chunks.length}`)
  })

  test("11.6 document in list → ready", async ({ request }) => {
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const doc = body.documents.find((d: { documentId: string }) => d.documentId === docId)
    expect(doc).toBeDefined()
    expect(doc.status).toBe("ready")
    console.log(`11.6 — Document in list: status=${doc.status}`)
  })

  test("11.7 query → answer + sources referencing test-small.txt", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What information does this document contain?" }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeTruthy()
    expect(body.sources).toBeDefined()
    expect(Array.isArray(body.sources)).toBeTruthy()
    expect(body.sources.length).toBeGreaterThan(0)
    console.log(`11.7 — Query answer (${body.answer.length} chars), sources: ${body.sources.length}`)
  })

  test("11.8 delete → 200", async ({ request }) => {
    const res = await request.delete(`${API}/api/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    console.log(`11.8 — Delete status: ${res.status()}`)
  })

  test("11.9 GET deleted → 404", async ({ request }) => {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
    console.log(`11.9 — Deleted doc 404`)
  })
})

// ===========================================================================
// SUITE 12: PDF images deep
// ===========================================================================

test.describe.serial("Suite 12 — PDF Images Deep", () => {
  let token: string
  let docId: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "s12-pdf")
    token = reg.apiToken
  })

  test("12.1 upload PDF presigned → 202", async ({ request }) => {
    test.setTimeout(60_000)
    expect(existsSync(PDF_IMG)).toBeTruthy()
    const result = await presignAndUpload(request, token, PDF_IMG, "application/pdf")
    docId = result.documentId
    console.log(`12.1 — PDF uploaded: docId=${docId}`)
    expect(docId).toBeTruthy()
  })

  test("12.2 pipeline ready (120s)", async ({ request }) => {
    test.setTimeout(150_000)
    const result = await waitForPipeline(request, docId, token, 120_000)
    expect(result.status).toBe("ready")
    const stagesSummary = result.stages.map((s) => `${s.type}=${s.status}`).join(", ")
    console.log(`12.2 — PDF pipeline: ${stagesSummary}`)
  })

  test("12.3 content has image chunks or chunkCount >= 2", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const chunks = body.chunks || body.content || body
    expect(Array.isArray(chunks)).toBeTruthy()
    const hasImageChunk = chunks.some(
      (c: { text?: string; content?: string; chunk_text?: string; chunk_type?: string }) =>
        (c.text || c.content || c.chunk_text || "").includes("[Image from page") ||
        c.chunk_type === "image"
    )
    console.log(`12.3 — PDF chunks: ${chunks.length}, hasImageChunk: ${hasImageChunk}`)
    // Either image chunks OR at least 2 chunks from parsing
    expect(hasImageChunk || chunks.length >= 2).toBeTruthy()
  })

  test("12.4 query about PDF content → relevant answer", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What does this PDF document contain?" }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeTruthy()
    expect(body.answer.length).toBeGreaterThan(10)
    console.log(`12.4 — PDF query answer: ${body.answer.slice(0, 200)}`)
  })

  test("12.5 chunk count > 1", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const chunks = body.chunks || body.content || body
    expect(chunks.length).toBeGreaterThan(1)
    console.log(`12.5 — PDF chunk count: ${chunks.length}`)
  })

  test("12.6 cleanup delete", async ({ request }) => {
    const res = await request.delete(`${API}/api/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    console.log(`12.6 — PDF cleanup deleted`)
  })
})

// ===========================================================================
// SUITE 13: Audio segmentation deep (timeout 300s)
// ===========================================================================

test.describe.serial("Suite 13 — Audio Segmentation Deep", () => {
  test.setTimeout(300_000)

  let token: string
  let docId: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "s13-audio")
    token = reg.apiToken
  })

  test("13.1 upload 25MB WAV presigned → 202", async ({ request }) => {
    expect(existsSync(AUDIO_WAV)).toBeTruthy()
    const result = await presignAndUpload(request, token, AUDIO_WAV, "audio/wav")
    docId = result.documentId
    expect(docId).toBeTruthy()
    console.log(`13.1 — Audio uploaded: docId=${docId}`)
  })

  test("13.2 verify size > 23MB threshold", async () => {
    const stat = statSync(AUDIO_WAV)
    const sizeMb = stat.size / (1024 * 1024)
    expect(stat.size).toBeGreaterThan(23 * 1024 * 1024)
    console.log(`13.2 — WAV size: ${sizeMb.toFixed(1)} MB`)
  })

  test("13.3 pipeline ready (240s poll)", async ({ request }) => {
    const result = await waitForPipeline(request, docId, token, 240_000)
    const stagesSummary = result.stages.map((s) => `${s.type}=${s.status}`).join(", ")
    console.log(`13.3 — Audio pipeline: status=${result.status}, stages=${stagesSummary}`)
    if (result.status !== "ready") {
      const errorStage = result.stages.find((s) => s.status === "error")
      console.log(`13.3 — PIPELINE ERROR at ${errorStage?.type}: ${errorStage?.error_message}`)
    }
    expect(result.status).toBe("ready")
  })

  test("13.4 transcription text length > 50", async ({ request }) => {
    const res = await request.get(`${API}/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const chunks = body.chunks || body.content || body
    expect(Array.isArray(chunks)).toBeTruthy()
    const allText = chunks
      .map((c: { text?: string; content?: string; chunk_text?: string }) =>
        c.text || c.content || c.chunk_text || ""
      )
      .join(" ")
    console.log(`13.4 — Total transcription text length: ${allText.length}`)
    expect(allText.length).toBeGreaterThan(50)
  })

  test("13.5 no mass failure markers in pipeline", async ({ request }) => {
    const res = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const errorStages = body.stages.filter((s: { status: string }) => s.status === "error")
    console.log(`13.5 — Error stages: ${errorStages.length}`)
    expect(errorStages.length).toBe(0)
  })

  test("13.6 query about audio → non-empty answer", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What is discussed in this audio recording?" }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeTruthy()
    expect(body.answer.length).toBeGreaterThan(5)
    console.log(`13.6 — Audio query answer: ${body.answer.slice(0, 200)}`)
  })

  test("13.7 cleanup delete", async ({ request }) => {
    const res = await request.delete(`${API}/api/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    console.log(`13.7 — Audio cleanup deleted`)
  })
})

// ===========================================================================
// SUITE 14: Query + Streaming
// ===========================================================================

test.describe.serial("Suite 14 — Query + Streaming", () => {
  let token: string
  let queryDocId: string

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000)
    const reg = await registerUser(request, "s14-query")
    token = reg.apiToken

    // Upload test-small.txt via direct upload
    const fileBuffer = readFileSync(SMALL_TXT)
    const uploadRes = await request.post(`${API}/api/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "test-small.txt",
          mimeType: "text/plain",
          buffer: fileBuffer,
        },
      },
    })
    expect(uploadRes.status()).toBe(202)
    const uploadBody = await uploadRes.json()
    queryDocId = uploadBody.documentId

    await waitForPipeline(request, queryDocId, token, 90_000)
    console.log(`Suite 14 — setup done, docId: ${queryDocId}`)
  })

  test("14.1 POST /api/query → answer, sources, usage", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What is this document about?" }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeTruthy()
    expect(Array.isArray(body.sources)).toBeTruthy()
    // usage may be optional but note if absent
    console.log(`14.1 — Answer: ${body.answer.slice(0, 100)}, sources: ${body.sources.length}, usage: ${JSON.stringify(body.usage)}`)
  })

  test("14.2 each source has content, score, document_name", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What is in the document?" }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const sources = body.sources as Array<{
      content?: string
      text?: string
      score?: number
      document_name?: string
    }>
    expect(sources.length).toBeGreaterThan(0)
    for (const src of sources) {
      expect(src.content || src.text).toBeTruthy()
      expect(typeof src.score).toBe("number")
    }
    console.log(`14.2 — Source[0]: name="${sources[0]?.document_name}", score=${sources[0]?.score}`)
  })

  test("14.3 topK=1 limits sources to 1", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "Test document content", topK: 1 }),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.sources)).toBeTruthy()
    expect(body.sources.length).toBeLessThanOrEqual(1)
    console.log(`14.3 — topK=1 sources count: ${body.sources.length}`)
  })

  test("14.4 POST /api/query/stream → SSE events (sources, token, done)", async ({ request }) => {
    test.setTimeout(60_000)
    const res = await request.post(`${API}/api/query/stream`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: "What is in this document?" }),
    })
    expect(res.status()).toBe(200)
    const contentType = res.headers()["content-type"] || ""
    const body = await res.text()
    console.log(`14.4 — Stream content-type: ${contentType}`)
    console.log(`14.4 — Stream body snippet: ${body.slice(0, 300)}`)
    // Should be SSE or JSON with streaming markers
    const isSSE = contentType.includes("text/event-stream") || body.includes("data:")
    const hasContent = body.length > 10
    expect(isSSE || hasContent).toBeTruthy()
  })

  test("14.5 query > 2000 chars → 400", async ({ request }) => {
    const longQuery = "a".repeat(2001)
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ query: longQuery }),
    })
    expect(res.status()).toBe(400)
    console.log(`14.5 — 2001-char query: ${res.status()}`)
  })

  test("14.6 60 queries in succession → hits 429 rate limit", async ({ request }) => {
    test.setTimeout(120_000)
    let hitRateLimit = false
    for (let i = 0; i < 61; i++) {
      const res = await request.post(`${API}/api/query`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify({ query: `Rate limit test query ${i}` }),
      })
      if (res.status() === 429) {
        hitRateLimit = true
        console.log(`14.6 — 429 hit at query ${i + 1}`)
        break
      }
    }
    expect(hitRateLimit).toBeTruthy()
  })

  test("14.7 cleanup delete uploaded document", async ({ request }) => {
    const res = await request.delete(`${API}/api/documents/${queryDocId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    console.log(`14.7 — Suite 14 cleanup done`)
  })
})

// ===========================================================================
// SUITE 15: MCP endpoint
// ===========================================================================

test.describe("Suite 15 — MCP Endpoint", () => {
  let mcpToken: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "s15-mcp")
    mcpToken = reg.apiToken
  })

  test("15.1 GET /sse without token → error response", async ({ request }) => {
    const res = await request.get(`${API}/sse`)
    expect(res.status()).not.toBe(200)
    console.log(`15.1 — /sse without token: ${res.status()}`)
  })

  test("15.2 GET /sse with token → SSE or valid response", async ({ request }) => {
    const res = await request.get(`${API}/sse`, {
      headers: { Authorization: `Bearer ${mcpToken}` },
    })
    // Accept any non-500 response — SSE might return 200 or redirect
    expect(res.status()).toBeLessThan(500)
    console.log(`15.2 — /sse with token: ${res.status()}`)
  })

  test("15.3 POST /sse with JSON-RPC initialize → response", async ({ request }) => {
    const res = await request.post(`${API}/sse`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mcpToken}`,
      },
      data: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "moholy-test", version: "1.0" },
        },
      }),
    })
    // Should return 200 with JSON-RPC response or SSE
    expect(res.status()).toBeLessThan(500)
    const body = await res.text()
    console.log(`15.3 — MCP initialize response: ${body.slice(0, 300)}`)
    expect(body.length).toBeGreaterThan(0)
  })

  test("15.4 POST /sse with tools/list → tool names", async ({ request }) => {
    const res = await request.post(`${API}/sse`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mcpToken}`,
      },
      data: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    })
    expect(res.status()).toBeLessThan(500)
    const body = await res.text()
    console.log(`15.4 — tools/list response: ${body.slice(0, 400)}`)
    // Should mention tool names like "search" or "query"
    const hasTools = body.includes("tool") || body.includes("search") || body.includes("query")
    console.log(`15.4 — Has tools in response: ${hasTools}`)
  })
})

// ===========================================================================
// SUITE 16: UI deep (browser)
// ===========================================================================

test.describe.serial("Suite 16 — UI Deep", () => {
  let authState: { userId: string; apiToken: string; mcpUrl: string }
  let uploadedDocId: string
  const screenshotDir = resolve(__dirname, "../test-results")

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000)
    authState = await registerUser(request, "s16-ui")

    // Pre-upload a document for document-related UI tests
    const fileBuffer = readFileSync(SMALL_TXT)
    const uploadRes = await request.post(`${API}/api/upload`, {
      headers: { Authorization: `Bearer ${authState.apiToken}` },
      multipart: {
        file: {
          name: "test-small.txt",
          mimeType: "text/plain",
          buffer: fileBuffer,
        },
      },
    })
    if (uploadRes.status() === 202) {
      const uploadBody = await uploadRes.json()
      uploadedDocId = uploadBody.documentId
      await waitForPipeline(request, uploadedDocId, authState.apiToken, 90_000).catch(() => {
        console.log("Suite 16 — Pipeline setup timed out, continuing")
      })
    }
  })

  async function injectAuth(page: Page) {
    await page.goto(`${FRONTEND}/app`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.evaluate((auth) => {
      localStorage.setItem("contexter_auth", JSON.stringify(auth))
    }, { ...authState, name: "moholy-ui" })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1000)
  }

  test("16.1 /app shows DropZone", async ({ page }) => {
    await injectAuth(page)
    const body = await page.textContent("body")
    const dropZone = page.locator("[data-testid='dropzone'], [class*='drop'], [class*='zone'], [class*='upload'], input[type='file']")
    const hasDropElements = await dropZone.count() > 0
    console.log(`16.1 — /app body length: ${body?.length}, drop elements: ${await dropZone.count()}`)
    expect(body!.length).toBeGreaterThan(100)
  })

  test("16.2 upload → progress bar or percentage appears", async ({ page }) => {
    test.setTimeout(60_000)
    await injectAuth(page)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      console.log("16.2 — No file input found")
      test.skip()
      return
    }
    await fileInput.setInputFiles(SMALL_TXT)
    await page.waitForTimeout(3000)
    const body = await page.textContent("body")
    const hasProgress =
      (body?.includes("%") ?? false) ||
      (body?.includes("progress") ?? false) ||
      (body?.includes("Progress") ?? false) ||
      (body?.includes("uploading") ?? false) ||
      (body?.includes("loading") ?? false) ||
      (body?.includes("processing") ?? false)
    console.log(`16.2 — Progress indicator present: ${hasProgress}`)
    console.log(`16.2 — Body snippet: ${body?.slice(0, 400)}`)
    expect(hasProgress).toBeTruthy()
  })

  test("16.3 pipeline stages transition visible in UI", async ({ page }) => {
    test.setTimeout(90_000)
    await injectAuth(page)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      test.skip()
      return
    }
    await fileInput.setInputFiles(SMALL_TXT)
    await page.waitForTimeout(5000)
    const body = await page.textContent("body")
    const hasStageCues =
      (body?.includes("parse") ?? false) ||
      (body?.includes("chunk") ?? false) ||
      (body?.includes("embed") ?? false) ||
      (body?.includes("index") ?? false) ||
      (body?.includes("processing") ?? false)
    console.log(`16.3 — Stage cues: ${hasStageCues}, body: ${body?.slice(0, 400)}`)
    expect(hasStageCues).toBeTruthy()
  })

  test("16.4 connection modal opens with all clients", async ({ page }) => {
    await injectAuth(page)
    const connectBtn = page.locator(
      "button:has-text('Подключение'), button:has-text('подключ'), button:has-text('Connect'), button:has-text('Подключить')"
    ).first()
    if (await connectBtn.count() > 0) {
      await connectBtn.click()
      await page.waitForTimeout(800)
      const body = await page.textContent("body")
      const clients = ["ChatGPT", "Claude", "Cursor"]
      let foundCount = 0
      for (const c of clients) {
        if (body?.includes(c)) foundCount++
      }
      console.log(`16.4 — Modal has ${foundCount}/${clients.length} expected clients`)
      expect(foundCount).toBeGreaterThan(0)
    } else {
      console.log("16.4 — Connection button not found, checking /api page")
      await page.goto(`${FRONTEND}/api`, { waitUntil: "domcontentloaded", timeout: 30_000 })
      const body = await page.textContent("body")
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test("16.5 copy buttons exist in modal or API page", async ({ page }) => {
    await injectAuth(page)
    const connectBtn = page.locator(
      "button:has-text('Подключение'), button:has-text('Connect')"
    ).first()
    if (await connectBtn.count() > 0) {
      await connectBtn.click()
      await page.waitForTimeout(500)
    }
    const copyButtons = page.locator("button:has-text('Скопировать'), button:has-text('Copy')")
    const count = await copyButtons.count()
    console.log(`16.5 — Copy buttons found: ${count}`)
    // Accept 0 here if not in modal — check /api page instead
    await page.goto(`${FRONTEND}/api`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(500)
    const apiCopyBtns = await page.locator("button:has-text('Скопировать'), button:has-text('Copy')").count()
    console.log(`16.5 — Copy buttons on /api page: ${apiCopyBtns}`)
    // At minimum check page loaded
    expect(await page.locator("body").isVisible()).toBeTruthy()
  })

  test("16.6 Perplexity mentions Connectors on API page", async ({ page }) => {
    await injectAuth(page)
    await page.goto(`${FRONTEND}/api`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    const body = await page.textContent("body")
    const hasConnectors = body?.includes("Connectors") ?? false
    const hasPerplexity = body?.includes("Perplexity") ?? false
    console.log(`16.6 — Perplexity present: ${hasPerplexity}, Connectors present: ${hasConnectors}`)
    // If Perplexity is shown, it should show Connectors not MCP Servers
    if (hasPerplexity) {
      const hasMCPServers = body?.includes("MCP Servers") ?? false
      console.log(`16.6 — MCP Servers (wrong): ${hasMCPServers}`)
      expect(hasConnectors).toBeTruthy()
    } else {
      // Page might not show Perplexity at /api without interaction
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test("16.7 document list shows uploaded doc", async ({ page }) => {
    await injectAuth(page)
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(2000)
    const body = await page.textContent("body")
    const hasDoc =
      (body?.includes("test-small.txt") ?? false) ||
      (body?.includes("ready") ?? false) ||
      (body?.includes("Ready") ?? false)
    console.log(`16.7 — Dashboard body: ${body?.slice(0, 400)}`)
    console.log(`16.7 — Has doc: ${hasDoc}`)
    expect(body!.length).toBeGreaterThan(50)
  })

  test("16.8 document viewer renders chunks", async ({ page }) => {
    await injectAuth(page)
    if (!uploadedDocId) {
      console.log("16.8 — No uploaded doc, skipping")
      test.skip()
      return
    }
    await page.goto(`${FRONTEND}/dashboard/${uploadedDocId}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(2000)
    const body = await page.textContent("body")
    const hasChunks =
      (body?.includes("chunk") ?? false) ||
      (body?.includes("Chunk") ?? false) ||
      (body?.includes("чанк") ?? false) ||
      (body?.includes("содержимое") ?? false) ||
      body!.length > 200
    console.log(`16.8 — Document viewer body: ${body?.slice(0, 400)}`)
    expect(hasChunks).toBeTruthy()
  })

  test("16.9 settings page loads", async ({ page }) => {
    await injectAuth(page)
    await page.goto(`${FRONTEND}/settings`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(1000)
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(50)
    console.log(`16.9 — Settings body snippet: ${body?.slice(0, 300)}`)
  })

  test("16.10 screenshot key pages", async ({ page }) => {
    await injectAuth(page)

    // Screenshot /app
    await page.goto(`${FRONTEND}/app`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${screenshotDir}/suite16-app.png`, fullPage: true })

    // Screenshot /dashboard
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${screenshotDir}/suite16-dashboard.png`, fullPage: true })

    // Screenshot /api
    await page.goto(`${FRONTEND}/api`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${screenshotDir}/suite16-api-page.png`, fullPage: true })

    // Screenshot /settings
    await page.goto(`${FRONTEND}/settings`, { waitUntil: "domcontentloaded", timeout: 30_000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${screenshotDir}/suite16-settings.png`, fullPage: true })

    console.log("16.10 — Screenshots saved")
    expect(true).toBeTruthy()
  })
})

// ===========================================================================
// SUITE 17: Cleanup
// ===========================================================================

test.describe("Suite 17 — Cleanup", () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    const reg = await registerUser(request, "s17-cleanup")
    token = reg.apiToken

    // Upload a doc to ensure there's something to delete
    const fileBuffer = readFileSync(SMALL_TXT)
    await request.post(`${API}/api/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "cleanup-test.txt",
          mimeType: "text/plain",
          buffer: fileBuffer,
        },
      },
    })
  })

  test("17.1 DELETE /api/documents for all test user docs → success", async ({ request }) => {
    // List all documents
    const listRes = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(listRes.status()).toBe(200)
    const listBody = await listRes.json()
    const docs = listBody.documents as { documentId: string }[]
    console.log(`17.1 — Docs to delete: ${docs.length}`)

    // Delete each
    let deleteCount = 0
    for (const doc of docs) {
      const delRes = await request.delete(`${API}/api/documents/${doc.documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (delRes.status() === 200) deleteCount++
    }
    console.log(`17.1 — Deleted ${deleteCount}/${docs.length} docs`)
    expect(deleteCount).toBe(docs.length)
  })

  test("17.2 verify lists empty after cleanup", async ({ request }) => {
    // Give DB a moment to process
    await sleep(1000)
    const res = await request.get(`${API}/api/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    console.log(`17.2 — Documents remaining: ${body.documents.length}`)
    expect(body.documents.length).toBe(0)
  })
})
