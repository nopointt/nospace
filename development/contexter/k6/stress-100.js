/**
 * Contexter Stress Test — 100 Concurrent Users (MCP Scenario)
 *
 * Prerequisites:
 *   1. Run: bun run k6/stress-setup.js  (creates k6/fixtures/users.json)
 *   2. Ensure k6/fixtures/ has test files (PDF, audio, video, etc.)
 *
 * Run:
 *   k6 run k6/stress-100.js
 *   k6 run --out json=results.json k6/stress-100.js
 *
 * Scenarios:
 *   A. mcp_search     — 50 VUs, MCP JSON-RPC search_knowledge (no Groq, Jina+PG only)
 *   B. mcp_tools      — 10 VUs, MCP list_documents, get_stats
 *   C. light_uploads  — 20 VUs, text/md/csv uploads via presigned flow
 *   D. heavy_uploads  — 15 VUs, PDF/DOCX/XLSX via presigned flow + pipeline poll
 *   E. media_uploads  —  5 VUs, audio/video via presigned flow + pipeline poll
 *
 * Total: 100 VUs at peak
 */

import http from "k6/http"
import { check, sleep, group } from "k6"
import { SharedArray } from "k6/data"
import { Rate, Trend, Counter } from "k6/metrics"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API = __ENV.API_URL || "https://api.contexter.cc"
const MCP = `${API}/sse`

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const users = new SharedArray("users", function () {
  return JSON.parse(open("./fixtures/users.json"))
})

// Binary fixtures
const SMALL_PDF   = open("./fixtures/small.pdf", "b")
const MEDIUM_PDF  = open("./fixtures/medium.pdf", "b")
const DOCX_FILE   = open("./fixtures/document.docx", "b")
const XLSX_FILE   = open("./fixtures/data.xlsx", "b")
const PHOTO_FILE  = open("./fixtures/photo.jpg", "b")
const SHORT_AUDIO = open("./fixtures/speech-short.mp3", "b")
const LONG_AUDIO  = open("./fixtures/speech-long.mp3", "b")
const OGG_AUDIO   = open("./fixtures/speech.ogg", "b")
const VIDEO_FILE  = open("./fixtures/clip.mp4", "b")
const MD_FILE     = open("./fixtures/article.md")
const CSV_FILE    = open("./fixtures/data.csv")

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

// MCP search
const mcpSearchErrors    = new Rate("mcp_search_errors")
const mcpSearchDuration  = new Trend("mcp_search_duration_ms", true)

// MCP tools
const mcpToolErrors      = new Rate("mcp_tool_errors")
const mcpToolDuration    = new Trend("mcp_tool_duration_ms", true)

// Uploads
const uploadErrors       = new Rate("upload_errors")
const uploadDuration     = new Trend("upload_duration_ms", true)
const rateLimited        = new Counter("rate_limited_count")

// Pipeline
const pipelineComplete   = new Counter("pipeline_completions")
const pipelineFailed     = new Counter("pipeline_failures")
const pipelineDuration   = new Trend("pipeline_duration_ms", true)

// ---------------------------------------------------------------------------
// Options — 5 parallel scenarios, 100 VUs at peak
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    mcp_search: {
      executor: "ramping-vus",
      exec: "mcpSearchScenario",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 8 },
        { duration: "3m",  target: 25 },
        { duration: "5m",  target: 50 },
        { duration: "2m",  target: 60 },
        { duration: "2m",  target: 0 },
      ],
    },
    mcp_tools: {
      executor: "ramping-vus",
      exec: "mcpToolsScenario",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 2 },
        { duration: "3m",  target: 5 },
        { duration: "5m",  target: 10 },
        { duration: "2m",  target: 10 },
        { duration: "2m",  target: 0 },
      ],
    },
    light_uploads: {
      executor: "ramping-vus",
      exec: "lightUploadScenario",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 3 },
        { duration: "3m",  target: 10 },
        { duration: "5m",  target: 20 },
        { duration: "2m",  target: 25 },
        { duration: "2m",  target: 0 },
      ],
    },
    heavy_uploads: {
      executor: "ramping-vus",
      exec: "heavyUploadScenario",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 2 },
        { duration: "3m",  target: 8 },
        { duration: "5m",  target: 15 },
        { duration: "2m",  target: 18 },
        { duration: "2m",  target: 0 },
      ],
    },
    media_uploads: {
      executor: "ramping-vus",
      exec: "mediaUploadScenario",
      startVUs: 0,
      stages: [
        { duration: "3m",  target: 1 },
        { duration: "4m",  target: 3 },
        { duration: "5m",  target: 5 },
        { duration: "2m",  target: 5 },
        { duration: "0s",  target: 0 },
      ],
    },
  },

  thresholds: {
    // MCP search SLOs (no Groq — should be fast)
    "mcp_search_duration_ms":    ["p(95)<3000", "p(99)<5000"],
    "mcp_search_errors":         ["rate<0.05"],

    // MCP tools SLOs
    "mcp_tool_duration_ms":      ["p(95)<1000"],
    "mcp_tool_errors":           ["rate<0.05"],

    // Upload SLOs
    "upload_errors":             ["rate<0.15"],
    "upload_duration_ms":        ["p(95)<5000"],

    // Pipeline SLOs
    "pipeline_duration_ms":      ["p(95)<180000"],
    "pipeline_failures":         ["count<20"],

    // Overall
    "http_req_failed":           ["rate<0.20"],
    "http_req_duration{name:health}":    ["p(95)<2000"],
    "http_req_duration{name:presign}":   ["p(95)<2000"],
    "http_req_duration{name:confirm}":   ["p(95)<2000"],
    "http_req_duration{name:poll}":      ["p(95)<1000"],
    "http_req_duration{name:mcp_search}": ["p(95)<5000"],
    "http_req_duration{name:mcp_tool}":  ["p(95)<2000"],
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUser() {
  return users[__VU % users.length]
}

function thinkTime(minSec, maxSec) {
  sleep(minSec + Math.random() * (maxSec - minSec))
}

const QUERIES = [
  "What is Contexter?",
  "How does the RAG pipeline work?",
  "What file formats are supported?",
  "How does hybrid search combine vector and text matching?",
  "How does chunking work for large documents?",
  "What is contextual prefix generation?",
  "How does reranking improve search quality?",
  "What is MCP integration?",
  "How does deduplication work?",
  "How does confidence scoring work?",
  "What security measures protect against prompt injection?",
  "How does the circuit breaker pattern work?",
  "What is late chunking in Jina embeddings?",
  "How are documents processed after upload?",
  "What vector dimensions are used for embeddings?",
]

/**
 * Send MCP JSON-RPC request. Returns parsed result or null on error.
 */
function mcpCall(token, method, params, tag) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: __VU * 10000 + __ITER,
    method: method,
    params: params || {},
  })

  const res = http.post(`${MCP}?token=${token}`, body, {
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    timeout: "15s",
    tags: { name: tag },
  })

  return res
}

/**
 * Presigned upload flow: presign → PUT to R2 → confirm.
 */
function presignedUpload(token, fileName, mimeType, fileData) {
  const fileSize = typeof fileData === "string" ? fileData.length : fileData.byteLength || fileData.length

  const presignRes = http.post(
    `${API}/api/upload/presign`,
    JSON.stringify({ fileName, mimeType, fileSize }),
    {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: "10s",
      tags: { name: "presign" },
    }
  )

  if (presignRes.status === 429) {
    rateLimited.add(1)
    return null
  }
  if (presignRes.status !== 200) {
    uploadErrors.add(true)
    return null
  }

  let presign
  try { presign = JSON.parse(presignRes.body) } catch { uploadErrors.add(true); return null }

  const putRes = http.put(presign.uploadUrl, fileData, {
    headers: { "Content-Type": mimeType },
    timeout: "60s",
    tags: { name: "r2_put" },
  })

  if (putRes.status >= 300) { uploadErrors.add(true); return null }

  const confirmRes = http.post(
    `${API}/api/upload/confirm`,
    JSON.stringify({
      documentId: presign.documentId,
      r2Key: presign.r2Key,
      fileName, mimeType, fileSize,
    }),
    {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: "10s",
      tags: { name: "confirm" },
    }
  )

  if (confirmRes.status !== 200 && confirmRes.status !== 202) { uploadErrors.add(true); return null }

  uploadErrors.add(false)
  uploadDuration.add(presignRes.timings.duration + putRes.timings.duration + confirmRes.timings.duration)
  return presign.documentId
}

/**
 * Poll pipeline status until ready/error or timeout.
 */
function pollPipeline(token, documentId, maxWaitSec) {
  const start = Date.now()
  let delay = 3

  while ((Date.now() - start) / 1000 < maxWaitSec) {
    sleep(delay)
    const res = http.get(`${API}/api/status/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: "10s",
      tags: { name: "poll" },
    })

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body)
        if (data.status === "ready") {
          pipelineComplete.add(1)
          pipelineDuration.add(Date.now() - start)
          return true
        }
        if (data.status === "error" || data.status === "failed") {
          pipelineFailed.add(1)
          pipelineDuration.add(Date.now() - start)
          return false
        }
      } catch {}
    }
    delay = Math.min(delay * 1.3, 15)
  }

  pipelineFailed.add(1)
  pipelineDuration.add(Date.now() - start)
  return false
}

// ---------------------------------------------------------------------------
// Scenario A: MCP Search (50 VUs) — no Groq, Jina+PG only
// ---------------------------------------------------------------------------

export function mcpSearchScenario() {
  const user = getUser()
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)]

  const res = mcpCall(user.apiToken, "tools/call", {
    name: "search_knowledge",
    arguments: { query, topK: 5 },
  }, "mcp_search")

  const isOk = res.status === 200
  let hasContent = false

  if (isOk) {
    try {
      const body = JSON.parse(res.body)
      hasContent = body.result?.content?.[0]?.text?.length > 50
    } catch {}
  }

  mcpSearchErrors.add(!isOk)
  if (isOk) mcpSearchDuration.add(res.timings.duration)

  check(res, {
    "mcp_search: 200": (r) => r.status === 200,
    "mcp_search: has sources": () => hasContent,
  })

  // Health check 10% of the time
  if (Math.random() < 0.1) {
    const healthRes = http.get(`${API}/health`, { timeout: "5s", tags: { name: "health" } })
    check(healthRes, { "health: 200": (r) => r.status === 200 })
  }

  thinkTime(2, 5)
}

// ---------------------------------------------------------------------------
// Scenario B: MCP Tools (10 VUs) — list_documents, get_stats
// ---------------------------------------------------------------------------

export function mcpToolsScenario() {
  const user = getUser()

  const tools = ["list_documents", "get_stats"]
  const tool = tools[__ITER % tools.length]

  const res = mcpCall(user.apiToken, "tools/call", {
    name: tool,
    arguments: {},
  }, "mcp_tool")

  const isOk = res.status === 200
  mcpToolErrors.add(!isOk)
  if (isOk) mcpToolDuration.add(res.timings.duration)

  check(res, {
    [`mcp_${tool}: 200`]: (r) => r.status === 200,
  })

  thinkTime(3, 8)
}

// ---------------------------------------------------------------------------
// Scenario C: Light Uploads (20 VUs) — text, md, csv
// ---------------------------------------------------------------------------

export function lightUploadScenario() {
  const user = getUser()
  const suffix = `${__VU}-${__ITER}-${Date.now().toString(36)}`

  const fileTypes = [
    { name: `test-${suffix}.md`,  mime: "text/markdown",  data: MD_FILE },
    { name: `test-${suffix}.csv`, mime: "text/csv",        data: CSV_FILE },
    {
      name: `test-${suffix}.txt`,
      mime: "text/plain",
      data: `Stress test document ${suffix}\n\nGenerated for stress testing.\nTimestamp: ${new Date().toISOString()}\n\nThe quick brown fox jumps over the lazy dog.\n`,
    },
  ]

  const file = fileTypes[__ITER % fileTypes.length]

  group("light_upload", () => {
    const docId = presignedUpload(user.apiToken, file.name, file.mime, file.data)
    if (docId) pollPipeline(user.apiToken, docId, 60)
  })

  thinkTime(3, 8)
}

// ---------------------------------------------------------------------------
// Scenario D: Heavy Uploads (15 VUs) — PDF, DOCX, XLSX, JPG
// ---------------------------------------------------------------------------

export function heavyUploadScenario() {
  const user = getUser()
  const suffix = `${__VU}-${__ITER}-${Date.now().toString(36)}`

  const fileTypes = [
    { name: `test-${suffix}.pdf`,  mime: "application/pdf",   data: SMALL_PDF },
    { name: `test-${suffix}.pdf`,  mime: "application/pdf",   data: MEDIUM_PDF },
    { name: `test-${suffix}.docx`, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", data: DOCX_FILE },
    { name: `test-${suffix}.xlsx`, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data: XLSX_FILE },
    { name: `test-${suffix}.jpg`,  mime: "image/jpeg",        data: PHOTO_FILE },
  ]

  const file = fileTypes[__ITER % fileTypes.length]

  group("heavy_upload", () => {
    const docId = presignedUpload(user.apiToken, file.name, file.mime, file.data)
    if (docId) pollPipeline(user.apiToken, docId, 180)
  })

  thinkTime(5, 15)
}

// ---------------------------------------------------------------------------
// Scenario E: Media Uploads (5 VUs) — audio, video
// ---------------------------------------------------------------------------

export function mediaUploadScenario() {
  const user = getUser()
  const suffix = `${__VU}-${__ITER}-${Date.now().toString(36)}`

  const fileTypes = [
    { name: `test-${suffix}.mp3`, mime: "audio/mpeg",  data: SHORT_AUDIO },
    { name: `test-${suffix}.mp3`, mime: "audio/mpeg",  data: LONG_AUDIO },
    { name: `test-${suffix}.ogg`, mime: "audio/ogg",   data: OGG_AUDIO },
    { name: `test-${suffix}.mp4`, mime: "video/mp4",   data: VIDEO_FILE },
  ]

  const file = fileTypes[__ITER % fileTypes.length]

  group("media_upload", () => {
    const docId = presignedUpload(user.apiToken, file.name, file.mime, file.data)
    if (docId) pollPipeline(user.apiToken, docId, 300)
  })

  thinkTime(10, 30)
}
