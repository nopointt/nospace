/**
 * Scenario 3: Mixed Workload
 *
 * Realistic traffic mix: 50% queries + 30% document list + 20% health checks.
 * Uploads excluded — rate limit 20/hr makes sustained upload mix unrealistic.
 *
 * Run:
 *   k6 run --env API_TOKEN=<token> k6/scenario-3-mixed.js
 *
 * Stages:
 *   1. Ramp to 5 VUs (30s)
 *   2. Sustain 10 VUs (3m) — main measurement window
 *   3. Ramp down (30s)
 */

import http from "k6/http"
import { check, sleep, group } from "k6"
import { Rate, Trend } from "k6/metrics"

const queryErrors = new Rate("query_errors")
const listErrors = new Rate("list_errors")
const healthErrors = new Rate("health_errors")
const queryLatency = new Trend("query_latency", true)
const listLatency = new Trend("list_latency", true)

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "3m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<8000"],
    http_req_failed: ["rate<0.10"],
    query_errors: ["rate<0.10"],
    list_errors: ["rate<0.05"],
    health_errors: ["rate<0.01"],
  },
}

const API = __ENV.API_URL || "https://api.contexter.cc"
const TOKEN = __ENV.API_TOKEN

if (!TOKEN) {
  throw new Error("API_TOKEN env var is required. Run setup.js first.")
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
}

const queries = [
  "What is Contexter?",
  "What file formats are supported?",
  "How does the pipeline work?",
  "What are the pricing tiers?",
  "How does chunking work?",
  "What is hybrid search?",
  "How does reranking work?",
  "What LLM models are used?",
]

function doQuery() {
  const query = queries[Math.floor(Math.random() * queries.length)]
  const res = http.post(
    `${API}/api/query`,
    JSON.stringify({ query }),
    { headers, timeout: "30s" }
  )
  queryErrors.add(res.status !== 200)
  if (res.status === 200) queryLatency.add(res.timings.duration)
  check(res, { "query: status 200": (r) => r.status === 200 })
}

function doList() {
  const res = http.get(`${API}/api/status`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: "10s",
  })
  listErrors.add(res.status !== 200)
  if (res.status === 200) listLatency.add(res.timings.duration)
  check(res, { "list: status 200": (r) => r.status === 200 })
}

function doHealth() {
  const res = http.get(`${API}/health`, { timeout: "5s" })
  healthErrors.add(res.status !== 200)
  check(res, { "health: status 200": (r) => r.status === 200 })
}

export default function () {
  const roll = Math.random()

  if (roll < 0.50) {
    group("query", doQuery)
  } else if (roll < 0.80) {
    group("list", doList)
  } else {
    group("health", doHealth)
  }

  sleep(1 + Math.random() * 2)
}
