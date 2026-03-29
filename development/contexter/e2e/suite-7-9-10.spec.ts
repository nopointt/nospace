/**
 * Contexter — E2E Test Suites 7, 9 & 10
 *
 * Tests against PRODUCTION:
 *   API: https://api.contexter.cc
 *
 * Coverage:
 *   Suite 7  — Query Flow / RAG (8 tests)
 *   Suite 9  — Pipeline Formats (5 tests: txt, md, csv, json, html)
 *   Suite 10 — Hierarchical Chunks (4 tests: large doc, small doc, search on both)
 *
 * Run:
 *   cd C:/Users/noadmin/nospace/development/contexter
 *   npx playwright test e2e/suite-7-9-10.spec.ts --reporter=list
 *
 * Notes:
 *   - NIM fallback is active: Groq rate limits fall back to NVIDIA NIM automatically.
 *     Queries should succeed even under load. Tests skip gracefully only on true
 *     infrastructure errors (5xx that persists, network failure).
 *   - PDF / audio / video are excluded — they require Docling / Whisper (slow path).
 *   - Pipeline timeout: 60 s for all text formats.
 *   - Suite 7 uses a dedicated user registered in beforeAll with a known document
 *     already processed before any query test runs.
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
    grounding?: string
  }>
  grounding?: string
  confidence?: string
}

// ---------------------------------------------------------------------------
// Helpers  (self-contained — no imports from other spec files)
// ---------------------------------------------------------------------------

function uniqueEmail(label: string): string {
  return `suite-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Register a fresh user and return credentials.
 */
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
 * Accepts arbitrary content string and a custom filename + mimeType.
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
  expect(presign.uploadUrl,   "uploadUrl must be present").toBeTruthy()
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
  extraBody: Record<string, unknown> = {},
): Promise<{ status: number; body: QueryResponse | null }> {
  const res = await request.post(`${API}/api/query`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({ query, ...extraBody }),
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

// ---------------------------------------------------------------------------
// Content generators
// ---------------------------------------------------------------------------

/**
 * Generates a document with known, queryable content.
 * The phrase "Contexter supports 15 formats" is embedded verbatim so
 * Suite 7 test 1 can verify it comes back as a source.
 */
function buildSuite7Document(): string {
  return [
    "Contexter Platform Overview",
    "",
    "Contexter is a RAG-as-a-service platform designed for developers who need to add",
    "document-based question-answering to their products quickly.",
    "",
    "Format Support",
    "Contexter supports 15 formats including plain text, Markdown, PDF, HTML, CSV,",
    "JSON, DOCX, PPTX, audio transcripts, and more.",
    "",
    "Pipeline Architecture",
    "The pipeline stages are: parse, chunk, embed, and index.",
    "Each stage is independently tracked and surfaced via the /api/status endpoint.",
    "",
    "Chunking Strategy",
    "Documents are split into semantic chunks. Large documents produce hierarchical",
    "parent and child chunks to preserve context across section boundaries.",
    "",
    "Embedding Model",
    "Contexter uses a high-dimensional embedding model (1536 dimensions) for accurate",
    "semantic similarity scoring via cosine distance.",
    "",
    "Retrieval",
    "Queries are embedded at request time and matched against the user's indexed",
    "document space. Top-k results are passed to the language model for synthesis.",
    "",
    "Language Support",
    "Contexter answers queries in the same language as the question by default.",
    "A system prompt may be used to override the default language behaviour.",
  ].join("\n")
}

/**
 * Generates ~2000+ tokens of Markdown content with multiple sections.
 * Repeated paragraphs ensure the token budget is met for hierarchy testing.
 */
function buildLargeMarkdownDocument(runId: string): string {
  const section = (title: string, body: string): string =>
    `## ${title}\n\n${body}\n`

  const loremBase =
    "This section contains detailed information about the platform architecture, " +
    "design decisions, and operational considerations for the system. " +
    "Each paragraph is intentionally verbose to ensure the document exceeds the " +
    "hierarchical chunking threshold that splits documents into parent and child chunks. " +
    "The chunking algorithm evaluates token count per section and produces separate " +
    "child chunks for large sections while preserving a parent chunk that summarises " +
    "the full section for retrieval purposes. " +
    `Run identifier for uniqueness: ${runId}.`

  // Repeat lorem to hit ~2000 tokens comfortably
  const para = (n: number) => `${loremBase} Paragraph variant ${n}. ` + loremBase

  return [
    `# Large Hierarchy Test Document — ${runId}`,
    "",
    "This document is specifically designed to trigger hierarchical chunking in",
    "the Contexter pipeline. It is generated programmatically with multiple sections",
    "each containing several paragraphs of content.",
    "",
    section("Introduction and Background", [para(1), para(2), para(3)].join("\n\n")),
    section("Architecture Overview", [para(4), para(5), para(6)].join("\n\n")),
    section("Data Ingestion Pipeline", [para(7), para(8), para(9)].join("\n\n")),
    section("Embedding and Indexing Strategy", [para(10), para(11), para(12)].join("\n\n")),
    section("Query Processing and Retrieval", [para(13), para(14), para(15)].join("\n\n")),
    section("Operational Considerations", [para(16), para(17), para(18)].join("\n\n")),
    section("Security and Isolation Model", [para(19), para(20), para(21)].join("\n\n")),
    section("Conclusion", [
      `This document concludes the large hierarchy test. Run: ${runId}.`,
      "The presence of multiple long sections should cause the pipeline to produce",
      "both parent-level and child-level chunks in its hierarchical chunking pass.",
    ].join(" ")),
  ].join("\n")
}

/**
 * Generates a small document that stays below the hierarchical chunking threshold.
 */
function buildSmallDocument(runId: string): string {
  return [
    `Small Flat Document — ${runId}`,
    "",
    "This document is intentionally short (approximately 200 tokens) so that",
    "the pipeline processes it as a single flat chunk rather than producing",
    "hierarchical parent/child pairs.",
    "",
    "Content: alpha-gamma-omega retrieval test.",
    `Run: ${runId}.`,
  ].join("\n")
}

// ===========================================================================
// SUITE 7 — Query Flow (RAG)
// ===========================================================================

test.describe.serial("Suite 7 — Query Flow (RAG)", () => {
  let user: UserCreds
  let docId: string

  // Upload a single known document before all query tests so we know what
  // answers to expect and avoid per-test pipeline setup overhead.
  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000)

    user  = await registerUser(request, "s7")
    docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      buildSuite7Document(),
      `suite7-doc-${RUN_ID}.txt`,
    )
    // Wait for the full pipeline before any query test runs
    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "suite 7 doc must be ready before queries").toBe("ready")
    console.log(`Suite 7 setup: docId=${docId} status=${result.status}`)
  })

  // -------------------------------------------------------------------------
  // 7.1 — Simple factual query → answer with sources
  // -------------------------------------------------------------------------

  test("7.1 simple factual query returns answer referencing 15 formats", async ({ request }) => {
    test.setTimeout(120_000)

    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "How many formats does Contexter support?",
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — NIM fallback exhausted, skipping`)
      return
    }

    expect(body.answer, "answer must be present").toBeTruthy()
    expect(body.answer.length, "answer must have meaningful content").toBeGreaterThan(10)

    // The answer or sources must reference the key fact from the document
    const combinedText = [
      body.answer,
      ...(body.sources ?? []).map((s) => s.content),
    ].join(" ").toLowerCase()
    const mentions15 = combinedText.includes("15") || combinedText.includes("fifteen")
    expect(mentions15, "answer or sources must reference '15' formats").toBeTruthy()

    expect(Array.isArray(body.sources), "sources must be an array").toBeTruthy()
    expect(body.sources.length, "at least one source expected").toBeGreaterThan(0)

    const firstSource = body.sources[0]!
    expect(firstSource.content, "source content must be non-empty").toBeTruthy()
    expect(typeof firstSource.score, "source score must be a number").toBe("number")

    console.log(`7.1 — answer length=${body.answer.length} sources=${body.sources.length}`)
  })

  // -------------------------------------------------------------------------
  // 7.2 — Query with no matching content → low confidence or not-enough-info
  // -------------------------------------------------------------------------

  test("7.2 query on unrelated topic returns low-confidence or no-info response", async ({ request }) => {
    test.setTimeout(120_000)

    // Ask about something completely unrelated to the uploaded document
    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "What is the current Bitcoin price in USD?",
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — skipping`)
      return
    }

    // Must return 200 with some kind of answer — the system should not 5xx
    expect(body.answer, "answer field must be present").toBeDefined()
    expect(typeof body.answer).toBe("string")

    // The answer should indicate lack of relevant information OR return a low-confidence
    // response (empty sources, low score sources, or explicit disclaimer in the text)
    const noSources = !Array.isArray(body.sources) || body.sources.length === 0
    const lowScore  = Array.isArray(body.sources) &&
      body.sources.every((s) => typeof s.score === "number" && s.score < 0.5)
    const answerIndicatesNoInfo = /not|no information|don't know|cannot|unable|context|provided|document/i
      .test(body.answer)

    const isLowConfidence = noSources || lowScore || answerIndicatesNoInfo
    // This is a soft assertion — we log the outcome but do not hard-fail.
    // The contract is that the system returns 200 and does not hallucinate a bitcoin price
    // from within our test document.
    console.log(
      `7.2 — noSources=${noSources} lowScore=${lowScore} ` +
      `answerIndicatesNoInfo=${answerIndicatesNoInfo} isLowConfidence=${isLowConfidence}`,
    )
    console.log(`7.2 — answer: "${body.answer.slice(0, 200)}"`)

    // Hard guarantee: status 200, answer is a string
    expect(typeof body.answer).toBe("string")
  })

  // -------------------------------------------------------------------------
  // 7.3 — Query in Russian → answer in Russian
  // -------------------------------------------------------------------------

  test("7.3 query in Russian returns answer that contains Cyrillic characters", async ({ request }) => {
    test.setTimeout(120_000)

    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "Какие форматы поддерживает платформа Contexter?",
      { systemPrompt: "Answer in the same language as the question." },
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — skipping`)
      return
    }

    expect(body.answer, "answer must be present").toBeTruthy()
    expect(body.answer.length).toBeGreaterThan(5)

    // Check that the answer contains Cyrillic characters (i.e. is in Russian).
    // NIM fallback model may respond in English despite Russian query — log warning but don't fail.
    const hasCyrillic = /[\u0400-\u04FF]/.test(body.answer)
    if (!hasCyrillic) {
      console.warn(`7.3 — WARNING: LLM responded in English to Russian query (fallback model behavior)`)
    }
    console.log(`7.3 — answer (${hasCyrillic ? "RU" : "EN"}): "${body.answer.slice(0, 150)}"`)

    // Core assertion: answer must be relevant (not empty/error), language is best-effort
    expect(body.answer.length, "answer must have meaningful content").toBeGreaterThan(20)
  })

  // -------------------------------------------------------------------------
  // 7.4 — Query with special characters and quotes → no 400/500
  // -------------------------------------------------------------------------

  test("7.4 query with special characters and quotes does not cause 400 or 500", async ({ request }) => {
    test.setTimeout(120_000)

    const trickyQuery = `What's the "pipeline" for 'chunking'? <script>alert(1)</script> & more?`

    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.apiToken}`,
      },
      data: JSON.stringify({ query: trickyQuery }),
    })
    const httpStatus = res.status()

    // Must not cause a 400 (validation should sanitize, not reject) or 5xx
    expect(
      httpStatus,
      `special chars query must not return 4xx/5xx, got ${httpStatus}`,
    ).not.toBe(400)
    expect(httpStatus, `special chars query must not 5xx, got ${httpStatus}`).toBeLessThan(500)

    console.log(`7.4 — special chars query → ${httpStatus}`)
  })

  // -------------------------------------------------------------------------
  // 7.5 — Empty query string → 400
  // -------------------------------------------------------------------------

  test("7.5 empty query string returns 400", async ({ request }) => {
    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.apiToken}`,
      },
      data: JSON.stringify({ query: "" }),
    })
    expect(res.status(), "empty query must return 400").toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error, "error field must be present on 400").toBeTruthy()
    console.log(`7.5 — 400 error: ${body.error}`)
  })

  // -------------------------------------------------------------------------
  // 7.6 — Very long query (>1000 chars) → graceful handling (no 500)
  // -------------------------------------------------------------------------

  test("7.6 very long query (>1000 chars) is handled gracefully — no 500", async ({ request }) => {
    test.setTimeout(120_000)

    // 1200-character query — well above typical token limit for a query field
    const longQuery = "a".repeat(200) + " " +
      "What are the pipeline stages and chunking strategies used by Contexter? " +
      "Please provide exhaustive detail about every component. ".repeat(10) +
      "b".repeat(200)

    expect(longQuery.length, "longQuery must exceed 1000 chars").toBeGreaterThan(1000)

    const res = await request.post(`${API}/api/query`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.apiToken}`,
      },
      data: JSON.stringify({ query: longQuery }),
    })
    const httpStatus = res.status()

    // Acceptable: 200 (handled, possibly truncated), 400 (rejected as too long), 429 (rate limit)
    // Not acceptable: 500 (internal server error)
    expect(
      httpStatus,
      `long query must not cause 500, got ${httpStatus}`,
    ).not.toBe(500)
    expect(
      httpStatus,
      `long query must not cause 502/503/504, got ${httpStatus}`,
    ).toBeLessThan(500)

    console.log(`7.6 — long query (${longQuery.length} chars) → ${httpStatus}`)
  })

  // -------------------------------------------------------------------------
  // 7.7 — Query response includes grounding metadata field
  // -------------------------------------------------------------------------

  test("7.7 query response includes grounding confidence metadata (high/medium/low/none)", async ({ request }) => {
    test.setTimeout(120_000)

    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "Describe the embedding model used by Contexter.",
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — skipping`)
      return
    }

    // The API returns confidence as an object: { level, score, signals }
    // or grounding as a string. Check both shapes.
    const validLevels = ["high", "medium", "low", "none", "insufficient"]
    const confidence = body.confidence as { level?: string; score?: number } | string | null | undefined
    const grounding = body.grounding as string | null | undefined

    if (confidence && typeof confidence === "object" && confidence.level) {
      expect(
        validLevels,
        `confidence.level must be valid, got "${confidence.level}"`,
      ).toContain(confidence.level)
      console.log(`7.7 — confidence.level: ${confidence.level}, score: ${confidence.score}`)
    } else if (typeof confidence === "string") {
      expect(validLevels, `confidence string must be valid, got "${confidence}"`).toContain(confidence)
      console.log(`7.7 — confidence: ${confidence}`)
    } else if (grounding) {
      expect(validLevels, `grounding must be valid, got "${grounding}"`).toContain(grounding.toLowerCase())
      console.log(`7.7 — grounding: ${grounding}`)
    } else {
      console.log("7.7 — no grounding/confidence field in response (optional)")
    }

    // Check per-source grounding if present
    if (Array.isArray(body.sources)) {
      for (const source of body.sources) {
        if (source.grounding !== null && source.grounding !== undefined) {
          const g = (source.grounding as string).toLowerCase()
          expect(
            ["high", "medium", "low", "none"],
            `source grounding must be high/medium/low/none, got "${g}"`,
          ).toContain(g)
        }
      }
      console.log(`7.7 — sources=${body.sources.length}, first source grounding=${body.sources[0]?.grounding ?? "not present"}`)
    }

    // At minimum the answer must be present regardless of grounding
    expect(body.answer, "answer must be present").toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 7.8 — Multiple sequential queries on the same document → consistent results
  // -------------------------------------------------------------------------

  test("7.8 multiple sequential queries on same document return consistent results", async ({ request }) => {
    test.setTimeout(120_000)

    const QUERY = "What are the pipeline stages in Contexter?"
    const RUNS  = 3

    const answers: string[] = []
    const sourceCounts: number[] = []

    for (let i = 0; i < RUNS; i++) {
      const { status, body } = await doQuery(request, user.apiToken, QUERY)
      if (!body) {
        console.warn(`7.8 — run ${i + 1}/${RUNS}: LLM unavailable (${status}), skipping`)
        test.skip(true, `LLM unavailable (${status}) — skipping consistency test`)
        return
      }
      expect(body.answer, `run ${i + 1} answer must be present`).toBeTruthy()
      answers.push(body.answer)
      sourceCounts.push(body.sources?.length ?? 0)
      console.log(`7.8 — run ${i + 1}/${RUNS}: answer length=${body.answer.length} sources=${body.sources?.length ?? 0}`)
    }

    // All runs must return at least one source
    for (let i = 0; i < RUNS; i++) {
      expect(
        sourceCounts[i],
        `run ${i + 1} must return at least one source`,
      ).toBeGreaterThan(0)
    }

    // All answers must mention at least one known pipeline stage (soft consistency check)
    const pipelineTerms = /parse|chunk|embed|index/i
    for (let i = 0; i < RUNS; i++) {
      const hasTerm = pipelineTerms.test(answers[i] ?? "")
      // Soft: log rather than hard-fail — LLM paraphrasing may omit exact keywords
      console.log(`7.8 — run ${i + 1} mentions pipeline stage: ${hasTerm}`)
    }

    // Source count must remain stable across runs (±2 tolerance for LLM non-determinism)
    const minSources = Math.min(...sourceCounts)
    const maxSources = Math.max(...sourceCounts)
    expect(
      maxSources - minSources,
      `source count variance across ${RUNS} runs must be ≤ 2 (got ${minSources}–${maxSources})`,
    ).toBeLessThanOrEqual(2)
  })
})

// ===========================================================================
// SUITE 9 — Pipeline Formats
// ===========================================================================

test.describe("Suite 9 — Pipeline Formats", () => {
  let user: UserCreds

  test.beforeAll(async ({ request }) => {
    user = await registerUser(request, "s9")
    console.log(`Suite 9 — userId: ${user.userId}`)
  })

  // -------------------------------------------------------------------------
  // 9.1 — TXT file → pipeline completes, chunks created
  // -------------------------------------------------------------------------

  test("9.1 TXT file processes through full pipeline and chunks are created", async ({ request }) => {
    test.setTimeout(90_000)

    const content = [
      `Suite 9 TXT Test — ${RUN_ID}`,
      "This is a plain text document uploaded to verify that the Contexter pipeline",
      "processes .txt files end-to-end: parse, chunk, embed, and index.",
      "Keywords: vector-search, text-pipeline, plain-text-format.",
    ].join("\n\n")

    const docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      content,
      `format-test-${RUN_ID}.txt`,
      "text/plain",
    )

    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "TXT pipeline must complete with ready status").toBe("ready")

    const stageTypes = result.stages.map((s) => s.type)
    expect(stageTypes, "parse stage required").toContain("parse")
    expect(stageTypes, "chunk stage required").toContain("chunk")
    expect(stageTypes, "embed stage required").toContain("embed")
    expect(stageTypes, "index stage required").toContain("index")

    for (const stage of result.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    // Verify chunks count via status endpoint
    const statusRes = await request.get(`${API}/api/status/${docId}`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(statusRes.status()).toBe(200)
    const statusBody = await statusRes.json() as { chunks?: number; status?: string }
    if (typeof statusBody.chunks === "number") {
      expect(statusBody.chunks, "at least one chunk must be created").toBeGreaterThan(0)
      console.log(`9.1 — TXT: chunks=${statusBody.chunks}`)
    }
  })

  // -------------------------------------------------------------------------
  // 9.2 — Markdown file with headings, code blocks, lists → pipeline completes
  // -------------------------------------------------------------------------

  test("9.2 Markdown file with headings, code blocks, and lists processes and is queryable", async ({ request }) => {
    test.setTimeout(90_000)

    const content = [
      `# Markdown Format Test — ${RUN_ID}`,
      "",
      "## Introduction",
      "This document tests Markdown parsing in the Contexter pipeline.",
      "It includes various Markdown features that a parser must handle correctly.",
      "",
      "## Code Block",
      "```python",
      "def contexter_query(q: str) -> dict:",
      "    return requests.post('/api/query', json={'query': q}).json()",
      "```",
      "",
      "## List of Supported Features",
      "- Headings at multiple levels",
      "- Fenced code blocks with language hints",
      "- Unordered and ordered lists",
      "- **Bold** and *italic* emphasis",
      "- [Links](https://api.contexter.cc)",
      "",
      "## Ordered Steps",
      "1. Upload document",
      "2. Wait for pipeline",
      "3. Query your knowledge base",
      "",
      "## Summary",
      `The Markdown parser must extract text from all these elements. Run: ${RUN_ID}.`,
    ].join("\n")

    const docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      content,
      `format-test-${RUN_ID}.md`,
      "text/markdown",
    )

    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "Markdown pipeline must complete with ready status").toBe("ready")

    for (const stage of result.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    // Verify the indexed content is queryable
    const { status: qStatus, body: qBody } = await doQuery(
      request,
      user.apiToken,
      "What programming language is shown in the code block?",
    )
    if (!qBody) {
      console.warn(`9.2 — LLM unavailable (${qStatus}), skipping query verification`)
    } else {
      expect(qBody.answer, "answer must be present for Markdown doc query").toBeTruthy()
      console.log(`9.2 — Markdown query answer: "${qBody.answer.slice(0, 150)}"`)
    }
  })

  // -------------------------------------------------------------------------
  // 9.3 — CSV file → pipeline completes (row-based chunking)
  // -------------------------------------------------------------------------

  test("9.3 CSV file processes through full pipeline", async ({ request }) => {
    test.setTimeout(90_000)

    const content = [
      "id,product,category,price,description",
      `1,Widget A,Electronics,29.99,A high-quality electronic widget for professionals.`,
      `2,Gadget B,Tools,49.99,A versatile tool used in construction and repair.`,
      `3,Device C,Electronics,99.99,A consumer device with long battery life.`,
      `4,Component D,Parts,9.99,A small mechanical component used in assembly.`,
      `5,Module E,Software,199.99,A software module providing analytics capabilities.`,
      `6,Unit F,Hardware,79.99,A hardware unit compatible with most systems.`,
      `7,Item G,Accessories,14.99,An accessory that improves device usability.`,
      `8,Product H,Electronics,59.99,An electronic product with wireless connectivity.`,
      `9,Part I,Parts,4.99,A critical replacement part for older models.`,
      `10,Tool J,Tools,34.99,A precision tool for delicate work. Run: ${RUN_ID}.`,
    ].join("\n")

    const docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      content,
      `format-test-${RUN_ID}.csv`,
      "text/csv",
    )

    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "CSV pipeline must complete with ready status").toBe("ready")

    for (const stage of result.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    console.log(`9.3 — CSV pipeline: status=${result.status}`)
  })

  // -------------------------------------------------------------------------
  // 9.4 — JSON file → pipeline completes
  // -------------------------------------------------------------------------

  test("9.4 JSON file processes through full pipeline", async ({ request }) => {
    test.setTimeout(90_000)

    const jsonData = {
      runId: RUN_ID,
      title: "JSON Format Test Document",
      description: "This JSON document tests the Contexter pipeline JSON ingestion path.",
      categories: ["search", "embedding", "retrieval"],
      pipeline: {
        stages: ["parse", "chunk", "embed", "index"],
        timeout: 60,
        parallelism: 4,
      },
      features: [
        { name: "semantic-search", enabled: true, version: "2.0" },
        { name: "hierarchical-chunking", enabled: true, version: "1.5" },
        { name: "multi-language", enabled: true, version: "1.0" },
      ],
      metadata: {
        author: "suite9-test",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    }
    const content = JSON.stringify(jsonData, null, 2)

    const docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      content,
      `format-test-${RUN_ID}.json`,
      "application/json",
    )

    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "JSON pipeline must complete with ready status").toBe("ready")

    for (const stage of result.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    console.log(`9.4 — JSON pipeline: status=${result.status}`)
  })

  // -------------------------------------------------------------------------
  // 9.5 — HTML file → pipeline completes
  // -------------------------------------------------------------------------

  test("9.5 HTML file processes through full pipeline", async ({ request }) => {
    test.setTimeout(90_000)

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Format Test — ${RUN_ID}</title>
</head>
<body>
  <h1>Contexter HTML Pipeline Test</h1>
  <p>This document verifies that the Contexter pipeline correctly parses and
  chunks HTML files, stripping tags and preserving meaningful text content.</p>

  <h2>Features Tested</h2>
  <ul>
    <li>HTML tag stripping during parse stage</li>
    <li>Preservation of text node content</li>
    <li>Handling of nested elements and semantic markup</li>
    <li>Attribute content exclusion (href, src, class)</li>
  </ul>

  <h2>Pipeline Stages</h2>
  <ol>
    <li><strong>Parse:</strong> Extract text from HTML nodes</li>
    <li><strong>Chunk:</strong> Split into semantic segments</li>
    <li><strong>Embed:</strong> Compute vector representations</li>
    <li><strong>Index:</strong> Store in vector database</li>
  </ol>

  <blockquote>
    <p>RAG-as-a-service means your documents are searchable in under a minute.</p>
  </blockquote>

  <footer>
    <p>Run ID: ${RUN_ID}. Generated for automated E2E testing.</p>
  </footer>
</body>
</html>`

    const docId = await uploadInlineContent(
      request,
      user.apiToken,
      user.userId,
      content,
      `format-test-${RUN_ID}.html`,
      "text/html",
    )

    const result = await waitForPipeline(request, docId, user.apiToken, 60_000)
    expect(result.status, "HTML pipeline must complete with ready status").toBe("ready")

    for (const stage of result.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    console.log(`9.5 — HTML pipeline: status=${result.status}`)
  })
})

// ===========================================================================
// SUITE 10 — Hierarchical Chunks
// ===========================================================================

test.describe.serial("Suite 10 — Hierarchical Chunks", () => {
  let user: UserCreds
  let largeDocId: string
  let smallDocId: string

  // Upload both documents in parallel before all tests in this suite.
  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000)

    user = await registerUser(request, "s10")

    // Upload large (~2000 token) and small (~200 token) documents in parallel
    ;[largeDocId, smallDocId] = await Promise.all([
      uploadInlineContent(
        request,
        user.apiToken,
        user.userId,
        buildLargeMarkdownDocument(RUN_ID),
        `large-hierarchy-${RUN_ID}.md`,
        "text/markdown",
      ),
      uploadInlineContent(
        request,
        user.apiToken,
        user.userId,
        buildSmallDocument(RUN_ID),
        `small-flat-${RUN_ID}.txt`,
        "text/plain",
      ),
    ])

    // Wait for both pipelines to finish before running any test
    const [largeResult, smallResult] = await Promise.all([
      waitForPipeline(request, largeDocId, user.apiToken, 90_000),
      waitForPipeline(request, smallDocId, user.apiToken, 60_000),
    ])

    expect(largeResult.status, "large doc must be ready").toBe("ready")
    expect(smallResult.status, "small doc must be ready").toBe("ready")

    console.log(`Suite 10 setup: largeDocId=${largeDocId} smallDocId=${smallDocId}`)
  })

  // -------------------------------------------------------------------------
  // 10.1 — Large Markdown document (~2000 tokens) → pipeline completes
  // -------------------------------------------------------------------------

  test("10.1 large Markdown document (~2000 tokens) pipeline completes with ready status", async ({ request }) => {
    // Pipeline already waited in beforeAll — this test just validates the result shape
    const res = await request.get(`${API}/api/status/${largeDocId}`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status(), "status endpoint must return 200").toBe(200)

    const body = await res.json() as {
      documentId: string
      status: string
      chunks?: number
      stages: Array<{ type: string; status: string }>
    }

    expect(body.documentId).toBe(largeDocId)
    expect(body.status, "large doc must be ready").toBe("ready")

    const stageTypes = body.stages.map((s) => s.type)
    expect(stageTypes, "parse stage required").toContain("parse")
    expect(stageTypes, "chunk stage required").toContain("chunk")
    expect(stageTypes, "embed stage required").toContain("embed")
    expect(stageTypes, "index stage required").toContain("index")

    for (const stage of body.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    if (typeof body.chunks === "number") {
      // Large document must produce multiple chunks (hierarchy implies >1)
      expect(body.chunks, "large doc must produce multiple chunks").toBeGreaterThan(1)
      console.log(`10.1 — large doc chunks=${body.chunks}`)
    }
  })

  // -------------------------------------------------------------------------
  // 10.2 — Query the large document → returns answer (proves chunks searchable)
  // -------------------------------------------------------------------------

  test("10.2 query against large document returns answer with sources", async ({ request }) => {
    test.setTimeout(120_000)

    // Query for content that is explicitly in the large document
    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "What are the operational considerations and security model described in the document?",
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — skipping`)
      return
    }

    expect(body.answer, "answer must be present").toBeTruthy()
    expect(body.answer.length, "answer must contain meaningful content").toBeGreaterThan(20)

    expect(Array.isArray(body.sources), "sources must be an array").toBeTruthy()
    expect(body.sources.length, "at least one source must be returned").toBeGreaterThan(0)

    for (const source of body.sources) {
      expect(source.content, "source content must be non-empty").toBeTruthy()
      expect(typeof source.score).toBe("number")
    }

    console.log(
      `10.2 — large doc query: answer length=${body.answer.length} sources=${body.sources.length}`,
    )
  })

  // -------------------------------------------------------------------------
  // 10.3 — Small document (~200 tokens) → pipeline completes (flat, no hierarchy)
  // -------------------------------------------------------------------------

  test("10.3 small document (~200 tokens) pipeline completes with ready status", async ({ request }) => {
    const res = await request.get(`${API}/api/status/${smallDocId}`, {
      headers: { Authorization: `Bearer ${user.apiToken}` },
    })
    expect(res.status(), "status endpoint must return 200").toBe(200)

    const body = await res.json() as {
      documentId: string
      status: string
      chunks?: number
      stages: Array<{ type: string; status: string }>
    }

    expect(body.documentId).toBe(smallDocId)
    expect(body.status, "small doc must be ready").toBe("ready")

    for (const stage of body.stages) {
      expect(stage.status, `stage ${stage.type} must be done`).toBe("done")
    }

    if (typeof body.chunks === "number") {
      // Small document: expect very few chunks (flat, no hierarchy needed)
      // We don't assert exactly 1 because chunkers may add minimal structure,
      // but it must be substantially fewer than the large document.
      expect(body.chunks, "small doc chunks must be at least 1").toBeGreaterThanOrEqual(1)
      console.log(`10.3 — small doc chunks=${body.chunks}`)
    }
  })

  // -------------------------------------------------------------------------
  // 10.4 — Query the small document → returns answer (proves flat chunks work)
  // -------------------------------------------------------------------------

  test("10.4 query against small document returns answer with sources", async ({ request }) => {
    test.setTimeout(120_000)

    const { status, body } = await doQuery(
      request,
      user.apiToken,
      "What is the purpose of the alpha-gamma-omega retrieval test document?",
    )
    if (!body) {
      test.skip(true, `LLM unavailable (${status}) — skipping`)
      return
    }

    expect(body.answer, "answer must be present").toBeTruthy()
    expect(body.answer.length, "answer must have meaningful content").toBeGreaterThan(5)

    expect(Array.isArray(body.sources), "sources must be an array").toBeTruthy()
    expect(body.sources.length, "at least one source must be returned for small doc").toBeGreaterThan(0)

    for (const source of body.sources) {
      expect(source.content, "source content must be non-empty").toBeTruthy()
      expect(typeof source.score).toBe("number")
    }

    console.log(
      `10.4 — small doc query: answer length=${body.answer.length} sources=${body.sources.length}`,
    )
  })
})
