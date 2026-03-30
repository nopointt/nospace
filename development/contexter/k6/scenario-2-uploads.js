/**
 * Scenario 2: Concurrent Uploads
 *
 * Tests pipeline saturation: Docling container, BullMQ, R2 storage.
 * Uses small .txt files to isolate upload route from heavy parsing.
 *
 * Run:
 *   k6 run --env API_TOKEN=<token> k6/scenario-2-uploads.js
 *
 * Stages:
 *   1. Ramp to 3 VUs (30s) — warm-up
 *   2. Sustain 5 VUs (2m) — steady state
 *   3. Spike to 10 VUs (30s) — stress (should hit BullMQ concurrency)
 *   4. Sustain spike (1m)
 *   5. Ramp down (30s)
 *
 * Expected bottlenecks:
 *   - Rate limit: 20 uploads/user/hour
 *   - Docling: single-threaded, 1280MB RAM
 *   - BullMQ: default concurrency
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend, Counter } from "k6/metrics"

const uploadErrorRate = new Rate("upload_errors")
const uploadDuration = new Trend("upload_duration", true)
const rateLimited = new Counter("rate_limited")

export const options = {
  stages: [
    { duration: "30s", target: 3 },
    { duration: "2m", target: 5 },
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<10000"],  // p95 < 10s for uploads
    upload_errors: ["rate<0.15"],         // < 15% error rate (rate limits expected)
  },
}

const API = __ENV.API_URL || "https://api.contexter.cc"
const TOKEN = __ENV.API_TOKEN

if (!TOKEN) {
  throw new Error("API_TOKEN env var is required. Run setup.js first.")
}

// Generate unique small text files for each upload
function generateTestFile(vuId, iter) {
  const content = `# Load Test Document ${vuId}-${iter}
Generated at: ${new Date().toISOString()}
VU: ${vuId}, Iteration: ${iter}

This is a small test document for k6 load testing of the Contexter upload pipeline.
It contains enough text to be meaningful but is small enough to isolate upload performance
from parsing bottlenecks.

## Sample Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.

## Key Facts

- Fact 1: This document was created for load testing purposes.
- Fact 2: Upload performance depends on R2 storage latency and BullMQ queue depth.
- Fact 3: The pipeline processes this through parse → chunk → embed → index stages.
`
  return content
}

export default function () {
  const content = generateTestFile(__VU, __ITER)
  const fileName = `k6-upload-${__VU}-${__ITER}-${Date.now()}.txt`
  const mimeType = "text/plain"
  const fileSize = content.length

  // Step 1: Presign
  const presignRes = http.post(
    `${API}/api/upload/presign`,
    JSON.stringify({ fileName, mimeType, fileSize }),
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: "10s",
    }
  )

  if (presignRes.status === 429) {
    rateLimited.add(1)
    uploadErrorRate.add(false)
    check(presignRes, { "presign: rate limited (expected)": () => true })
    sleep(5 + Math.random() * 5)
    return
  }

  if (presignRes.status !== 200) {
    uploadErrorRate.add(true)
    check(presignRes, { "presign: status 200": (r) => r.status === 200 })
    sleep(3)
    return
  }

  let presign
  try {
    presign = JSON.parse(presignRes.body)
  } catch {
    uploadErrorRate.add(true)
    return
  }

  // Step 2: PUT to R2
  const putRes = http.put(presign.uploadUrl, content, {
    headers: { "Content-Type": mimeType },
    timeout: "15s",
  })

  if (putRes.status !== 200) {
    uploadErrorRate.add(true)
    check(putRes, { "r2 put: status 200": (r) => r.status === 200 })
    sleep(3)
    return
  }

  // Step 3: Confirm
  const confirmRes = http.post(
    `${API}/api/upload/confirm`,
    JSON.stringify({
      documentId: presign.documentId,
      r2Key: presign.r2Key,
      fileName,
      mimeType,
      fileSize,
    }),
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: "10s",
    }
  )

  const isOk = confirmRes.status === 200 || confirmRes.status === 202
  uploadErrorRate.add(!isOk)
  if (isOk) uploadDuration.add(presignRes.timings.duration + putRes.timings.duration + confirmRes.timings.duration)

  check(confirmRes, {
    "confirm: status 200 or 202": (r) => r.status === 200 || r.status === 202,
    "confirm: has document id": () => !!presign.documentId,
  })

  // Longer sleep for uploads — realistic + avoid rate limits
  sleep(3 + Math.random() * 5)
}
