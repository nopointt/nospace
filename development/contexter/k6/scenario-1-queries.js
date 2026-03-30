/**
 * Scenario 1: Concurrent Queries
 *
 * The most common load pattern — users querying their knowledge base.
 * Tests: Groq TPM limits, pgvector search latency, PostgreSQL pool.
 *
 * Run:
 *   k6 run --env API_TOKEN=<token> k6/scenario-1-queries.js
 *   k6 run --env API_TOKEN=<token> --env API_URL=https://api.contexter.cc k6/scenario-1-queries.js
 *
 * Stages:
 *   1. Ramp to 5 VUs (30s) — warm-up
 *   2. Sustain 10 VUs (2m) — steady state
 *   3. Spike to 20 VUs (30s) — stress
 *   4. Sustain spike (1m) — sustained stress
 *   5. Ramp down (30s) — cooldown
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend } from "k6/metrics"

// Custom metrics
const queryErrorRate = new Rate("query_errors")
const queryDuration = new Trend("query_duration", true)
const emptyAnswerRate = new Rate("empty_answers")

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "2m", target: 10 },
    { duration: "30s", target: 20 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<8000"],  // p95 < 8s (SLO from research)
    http_req_failed: ["rate<0.10"],     // < 10% error rate
    query_errors: ["rate<0.10"],
    empty_answers: ["rate<0.20"],       // < 20% empty answers (SLO)
  },
}

const API = __ENV.API_URL || "https://api.contexter.cc"
const TOKEN = __ENV.API_TOKEN

if (!TOKEN) {
  throw new Error("API_TOKEN env var is required. Run setup.js first.")
}

// Diverse queries to avoid caching effects
const queries = [
  "What is Contexter?",
  "What file formats does Contexter support?",
  "How does the pipeline work?",
  "What are the pricing tiers?",
  "How does chunking work?",
  "What is MCP integration?",
  "How does hybrid search work?",
  "What LLM providers are used?",
  "How does hallucination detection work?",
  "What is confidence scoring?",
]

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)]

  const res = http.post(
    `${API}/api/query`,
    JSON.stringify({ query }),
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: "30s",
    }
  )

  const isOk = res.status === 200
  let hasAnswer = false

  if (isOk) {
    try {
      const body = JSON.parse(res.body)
      hasAnswer = body.answer && body.answer.length > 0
    } catch {
      // JSON parse failed
    }
  }

  queryErrorRate.add(!isOk)
  emptyAnswerRate.add(isOk && !hasAnswer)
  if (isOk) queryDuration.add(res.timings.duration)

  check(res, {
    "status is 200": (r) => r.status === 200,
    "has answer": () => hasAnswer,
    "latency < 8s": (r) => r.timings.duration < 8000,
  })

  // Random sleep 1-3s between queries (realistic user behavior)
  sleep(1 + Math.random() * 2)
}
