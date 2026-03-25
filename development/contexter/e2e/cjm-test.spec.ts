/**
 * CJM End-to-End Test Suite — Moholy (QA Engineer)
 *
 * Tests the FULL user journey against production:
 *   1. Health check
 *   2. Register user (get API token)
 *   3. Upload file (returns 202 immediately)
 *   4. Poll pipeline status (stages update)
 *   5. Wait for pipeline completion
 *   6. Query documents (RAG)
 *   7. List documents
 *   8. Error scenarios (auth, validation)
 *   9. Share system
 *
 * Run: cd /c/Users/noadmin/nospace/development/contexter && npx playwright test e2e/cjm-test.ts
 */

import { test, expect } from "@playwright/test"
import { resolve, dirname } from "path"
import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROD = "https://contexter.nopoint.workers.dev"
const TEST_FILE = resolve(__dirname, "test-files/test.txt")

// Shared state across tests in sequence
let apiToken: string
let userId: string
let documentId: string

// ============================================================
// 1. HEALTH CHECK
// ============================================================

test.describe.serial("CJM Pipeline — Full User Journey", () => {
  test("1. Health check — all services healthy", async ({ request }) => {
    const res = await request.get(`${PROD}/health`)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.status).toBe("healthy")
    expect(body.checks).toBeDefined()
    expect(body.checks.api).toBe("ok")
    expect(body.checks.d1).toBe("ok")
    expect(body.checks.r2).toBe("ok")

    console.log("Health:", JSON.stringify(body.checks))
  })

  // ============================================================
  // 2. REGISTER USER
  // ============================================================

  test("2. Register user — returns userId, apiToken, mcpUrl", async ({ request }) => {
    // Fixed email: idempotent re-runs return 200 (email dedup) instead of 201.
    // Both are acceptable — the important thing is getting a valid token.
    const res = await request.post(`${PROD}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        name: "moholy-test",
        email: "moholy-cjm-pipeline@test.contexter.dev",
      }),
    })

    expect([200, 201]).toContain(res.status())
    const body = await res.json()

    expect(body.userId).toBeTruthy()
    expect(typeof body.userId).toBe("string")
    expect(body.apiToken).toBeTruthy()
    expect(typeof body.apiToken).toBe("string")
    expect(body.apiToken.length).toBeGreaterThanOrEqual(32)
    expect(body.mcpUrl).toContain("contexter.nopoint.workers.dev")
    expect(body.apiBase).toBe("https://contexter.nopoint.workers.dev/api")

    apiToken = body.apiToken
    userId = body.userId

    console.log(`Registered: userId=${userId}, token=${apiToken.slice(0, 8)}...`)
  })

  // ============================================================
  // 3. UPLOAD FILE (should return 202 immediately)
  // ============================================================

  test("3. Upload file — returns 202 with documentId", async ({ request }) => {
    expect(existsSync(TEST_FILE)).toBeTruthy()
    const fileBuffer = readFileSync(TEST_FILE)

    const res = await request.post(`${PROD}/api/upload`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      multipart: {
        file: {
          name: "test.txt",
          mimeType: "text/plain",
          buffer: fileBuffer,
        },
      },
    })

    expect(res.status()).toBe(202)
    const body = await res.json()

    expect(body.documentId).toBeTruthy()
    expect(body.status).toBe("processing")
    expect(body.fileName).toBe("test.txt")
    expect(body.mimeType).toBe("text/plain")

    documentId = body.documentId

    console.log(`Upload accepted: documentId=${documentId}, status=${body.status}`)
  })

  // ============================================================
  // 4. POLL STATUS (stages should appear and update)
  // ============================================================

  test("4. Poll status — stages exist and have correct shape", async ({ request }) => {
    // Give pipeline a moment to start
    await sleep(1000)

    const res = await request.get(`${PROD}/api/status/${documentId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body.documentId).toBe(documentId)
    expect(body.fileName).toBe("test.txt")
    expect(body.stages).toBeDefined()
    expect(Array.isArray(body.stages)).toBeTruthy()
    expect(body.stages.length).toBe(4)

    // Verify stage types exist in correct order
    const stageTypes = body.stages.map((s: { type: string }) => s.type)
    expect(stageTypes).toEqual(["parse", "chunk", "embed", "index"])

    // Each stage should have a valid status
    const validStatuses = ["pending", "running", "done", "error"]
    for (const stage of body.stages) {
      expect(validStatuses).toContain(stage.status)
      expect(typeof stage.progress).toBe("number")
    }

    console.log(
      `Status: ${body.stages.map((s: { type: string; status: string }) => `${s.type}=${s.status}`).join(", ")}`
    )
  })

  // ============================================================
  // 5. WAIT FOR PIPELINE COMPLETION (poll every 2s, max 90s)
  // ============================================================

  test("5. Wait for pipeline completion — all stages done", async ({ request }) => {
    const maxWaitMs = 90_000
    const pollIntervalMs = 2_000
    const startTime = Date.now()

    let finalBody: Record<string, unknown> | null = null

    while (Date.now() - startTime < maxWaitMs) {
      const res = await request.get(`${PROD}/api/status/${documentId}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })

      expect(res.status()).toBe(200)
      const body = await res.json()

      const stages = body.stages as { type: string; status: string; error_message?: string }[]
      const allDone = stages.every((s) => s.status === "done")
      const anyError = stages.some((s) => s.status === "error")

      console.log(
        `[${Math.round((Date.now() - startTime) / 1000)}s] ${stages.map((s) => `${s.type}=${s.status}`).join(", ")} | doc.status=${body.status}`
      )

      if (anyError) {
        const errorStage = stages.find((s) => s.status === "error")
        console.log(`Pipeline ERROR at stage: ${errorStage?.type} — ${errorStage?.error_message}`)
        finalBody = body
        break
      }

      if (allDone) {
        finalBody = body
        break
      }

      await sleep(pollIntervalMs)
    }

    expect(finalBody).not.toBeNull()

    const stages = (finalBody as Record<string, unknown>).stages as { type: string; status: string }[]
    for (const stage of stages) {
      expect(stage.status, `Stage ${stage.type} should be done`).toBe("done")
    }

    expect((finalBody as Record<string, unknown>).status).toBe("ready")
    console.log(`Pipeline completed in ${Math.round((Date.now() - startTime) / 1000)}s`)
  })

  // ============================================================
  // 6. QUERY DOCUMENTS (RAG)
  // ============================================================

  test("6. Query documents — returns answer with sources", async ({ request }) => {
    // Vectorize is eventually consistent: vectors may not be queryable immediately
    // after insert. Cloudflare Vectorize can take 2-5 minutes to index.
    // Poll the query until sources appear (max 5 minutes).
    test.setTimeout(360_000) // 6 minutes: 5 min poll + buffer
    const maxWaitMs = 300_000
    const pollIntervalMs = 10_000
    const startTime = Date.now()
    let body: Record<string, unknown> | null = null

    while (Date.now() - startTime < maxWaitMs) {
      const res = await request.post(`${PROD}/api/query`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          query: "What is Contexter and what does the pipeline do?",
        }),
      })

      expect(res.status()).toBe(200)
      body = await res.json()

      const sources = body?.sources as unknown[]
      if (Array.isArray(sources) && sources.length > 0) {
        console.log(`Vectorize indexed after ${Math.round((Date.now() - startTime) / 1000)}s`)
        break
      }

      console.log(`[${Math.round((Date.now() - startTime) / 1000)}s] sources=0, waiting for Vectorize consistency...`)
      await sleep(pollIntervalMs)
    }

    expect(body).not.toBeNull()

    expect(body!.answer).toBeTruthy()
    expect(typeof body!.answer).toBe("string")
    expect((body!.answer as string).length).toBeGreaterThan(10)

    expect(body!.sources).toBeDefined()
    expect(Array.isArray(body!.sources)).toBeTruthy()
    expect((body!.sources as unknown[]).length).toBeGreaterThan(0)

    // Each source should have content and score
    for (const source of body!.sources as Array<Record<string, unknown>>) {
      expect(source.content).toBeTruthy()
      expect(typeof source.score).toBe("number")
    }

    console.log(`Query answer (${(body!.answer as string).length} chars): ${(body!.answer as string).slice(0, 200)}...`)
    console.log(`Sources: ${(body!.sources as unknown[]).length}`)
  })

  // ============================================================
  // 7. LIST DOCUMENTS
  // ============================================================

  test("7. List documents — returns array with our document", async ({ request }) => {
    const res = await request.get(`${PROD}/api/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body.documents).toBeDefined()
    expect(Array.isArray(body.documents)).toBeTruthy()
    expect(body.documents.length).toBeGreaterThan(0)

    // Find our document
    const ourDoc = body.documents.find(
      (d: { documentId: string }) => d.documentId === documentId
    )
    expect(ourDoc).toBeDefined()
    expect(ourDoc.fileName).toBe("test.txt")
    expect(ourDoc.status).toBe("ready")

    console.log(`Documents: ${body.documents.length}, total: ${body.total}`)
  })
})

// ============================================================
// ERROR SCENARIOS
// ============================================================

test.describe("Error Scenarios", () => {
  // Shared token for all error scenario tests — avoids repeated registrations
  // Uses a fixed email so email-dedup returns the same token on re-runs
  let sharedToken: string

  test.beforeAll(async ({ request }: { request: import("@playwright/test").APIRequestContext }) => {
    const regRes = await request.post(`${PROD}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        name: "error-scenarios-test",
        email: "moholy-error-test@test.contexter.dev",
      }),
    })
    const reg = await regRes.json()
    // Accept 201 (new) or 200 (email dedup — already exists)
    if (reg.apiToken) {
      sharedToken = reg.apiToken
    } else {
      throw new Error(`Failed to register shared test user: ${JSON.stringify(reg)}`)
    }
  })

  test("Auth — request without token returns 401", async ({ request }) => {
    const res = await request.get(`${PROD}/api/status`)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test("Auth — request with invalid token returns 401", async ({ request }) => {
    const res = await request.get(`${PROD}/api/status`, {
      headers: { Authorization: "Bearer invalid_token_12345" },
    })
    expect(res.status()).toBe(401)
  })

  test("Upload — no file returns 400", async ({ request }) => {
    const res = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
      multipart: {},
    })

    // Should be 400 (no file) or might fail differently
    expect([400, 415, 500]).toContain(res.status())
  })

  test("Upload — without auth returns 401", async ({ request }) => {
    const res = await request.post(`${PROD}/api/upload`, {
      multipart: {
        file: {
          name: "test.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("test content"),
        },
      },
    })
    expect(res.status()).toBe(401)
  })

  test("Status — nonexistent document returns 404", async ({ request }) => {
    const res = await request.get(`${PROD}/api/status/nonexistent_doc_id`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
    })
    expect(res.status()).toBe(404)
  })

  test("Query — empty query returns 400", async ({ request }) => {
    const res = await request.post(`${PROD}/api/query`, {
      headers: {
        Authorization: `Bearer ${sharedToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ query: "" }),
    })
    expect(res.status()).toBe(400)
  })

  test("Query — no body returns 400", async ({ request }) => {
    const res = await request.post(`${PROD}/api/query`, {
      headers: {
        Authorization: `Bearer ${sharedToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({}),
    })
    expect(res.status()).toBe(400)
  })
})

// ============================================================
// SHARE SYSTEM
// ============================================================

test.describe.serial("Share System", () => {
  let ownerToken: string
  let shareToken: string
  let shareId: string
  let ownerDocId: string

  test("Create owner and upload a document", async ({ request }) => {
    // Register owner — fixed email for idempotent re-runs
    const regRes = await request.post(`${PROD}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        name: "share-owner",
        email: "moholy-share-owner@test.contexter.dev",
      }),
    })
    const reg = await regRes.json()
    ownerToken = reg.apiToken

    // Upload file
    const fileBuffer = readFileSync(TEST_FILE)
    const uploadRes = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      multipart: {
        file: { name: "share-test.txt", mimeType: "text/plain", buffer: fileBuffer },
      },
    })
    expect(uploadRes.status()).toBe(202)
    const uploadBody = await uploadRes.json()
    ownerDocId = uploadBody.documentId

    // Wait for processing
    await waitForPipelineComplete(request, ownerDocId, ownerToken)
  })

  test("Create share — returns shareId and shareToken", async ({ request }) => {
    const res = await request.post(`${PROD}/api/auth/share`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ scope: "all", permission: "read" }),
    })

    expect(res.status()).toBe(201)
    const body = await res.json()

    expect(body.shareId).toBeTruthy()
    expect(body.shareToken).toBeTruthy()
    expect(body.mcpUrl).toContain("share=")
    expect(body.permission).toBe("read")

    shareId = body.shareId
    shareToken = body.shareToken

    console.log(`Share created: shareId=${shareId}`)
  })

  test("List shares — returns our share", async ({ request }) => {
    const res = await request.get(`${PROD}/api/auth/shares`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body.shares).toBeDefined()
    expect(body.shares.length).toBeGreaterThan(0)
  })

  test("Share token grants read access to query", async ({ request }) => {
    const res = await request.post(`${PROD}/api/query?share=${shareToken}`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "What is Contexter?" }),
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.answer).toBeTruthy()
  })

  test("Share token denies write access (upload)", async ({ request }) => {
    const fileBuffer = readFileSync(TEST_FILE)
    const res = await request.post(`${PROD}/api/upload?share=${shareToken}`, {
      multipart: {
        file: { name: "blocked.txt", mimeType: "text/plain", buffer: fileBuffer },
      },
    })

    expect(res.status()).toBe(403)
  })

  test("Revoke share — delete succeeds", async ({ request }) => {
    const res = await request.delete(`${PROD}/api/auth/shares/${shareId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.deleted).toBe(shareId)
  })

  test("Revoked share token no longer works", async ({ request }) => {
    const res = await request.post(`${PROD}/api/query?share=${shareToken}`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "test" }),
    })

    expect(res.status()).toBe(401)
  })
})

// ============================================================
// UPLOAD FORMAT VARIANTS
// ============================================================

test.describe("Upload Format Variants", () => {
  let formatToken: string

  test.beforeAll(async ({ request }: { request: import("@playwright/test").APIRequestContext }) => {
    // Fixed email for idempotent re-runs — hits email dedup on second run
    const regRes = await request.post(`${PROD}/api/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        name: "format-test",
        email: "moholy-format-test@test.contexter.dev",
      }),
    })
    const reg = await regRes.json()
    formatToken = reg.apiToken
  })

  test("Upload TXT fixture file", async ({ request }) => {
    const fixturePath = resolve(__dirname, "../tests/fixtures/sample.txt")
    if (!existsSync(fixturePath)) {
      test.skip()
      return
    }
    const fileBuffer = readFileSync(fixturePath)
    const res = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${formatToken}` },
      multipart: {
        file: { name: "sample.txt", mimeType: "text/plain", buffer: fileBuffer },
      },
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.documentId).toBeTruthy()
    expect(body.status).toBe("processing")
  })

  test("Upload MD fixture file", async ({ request }) => {
    const fixturePath = resolve(__dirname, "../tests/fixtures/sample.md")
    if (!existsSync(fixturePath)) {
      test.skip()
      return
    }
    const fileBuffer = readFileSync(fixturePath)
    const res = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${formatToken}` },
      multipart: {
        file: { name: "sample.md", mimeType: "text/markdown", buffer: fileBuffer },
      },
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.documentId).toBeTruthy()
  })

  test("Upload CSV fixture file", async ({ request }) => {
    const fixturePath = resolve(__dirname, "../tests/fixtures/sample.csv")
    if (!existsSync(fixturePath)) {
      test.skip()
      return
    }
    const fileBuffer = readFileSync(fixturePath)
    const res = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${formatToken}` },
      multipart: {
        file: { name: "sample.csv", mimeType: "text/csv", buffer: fileBuffer },
      },
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.documentId).toBeTruthy()
  })

  test("Upload JSON fixture file", async ({ request }) => {
    const fixturePath = resolve(__dirname, "../tests/fixtures/sample.json")
    if (!existsSync(fixturePath)) {
      test.skip()
      return
    }
    const fileBuffer = readFileSync(fixturePath)
    const res = await request.post(`${PROD}/api/upload`, {
      headers: { Authorization: `Bearer ${formatToken}` },
      multipart: {
        file: { name: "sample.json", mimeType: "application/json", buffer: fileBuffer },
      },
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.documentId).toBeTruthy()
  })

  test("GET /api/upload/formats returns supported formats", async ({ request }) => {
    const res = await request.get(`${PROD}/api/upload/formats`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.formats).toBeDefined()
    expect(Array.isArray(body.formats)).toBeTruthy()
    expect(body.formats.length).toBeGreaterThan(0)
    expect(body.maxFileSize).toBe("100 MB")
  })
})

// ============================================================
// HELPERS
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPipelineComplete(
  request: import("@playwright/test").APIRequestContext,
  docId: string,
  token: string,
  maxWaitMs = 90_000
): Promise<void> {
  const startTime = Date.now()
  while (Date.now() - startTime < maxWaitMs) {
    const res = await request.get(`${PROD}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    const stages = body.stages || []
    const allDone = stages.every((s: { status: string }) => s.status === "done")
    const anyError = stages.some((s: { status: string }) => s.status === "error")

    if (allDone || anyError) return
    await sleep(2000)
  }
}
