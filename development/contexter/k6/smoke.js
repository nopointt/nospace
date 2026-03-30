/**
 * k6 Smoke Test — minimal load to verify API is responding.
 * Run before each deploy as a quick sanity check (~1 min).
 *
 * Run:
 *   k6 run --env API_TOKEN=<token> k6/smoke.js
 */

import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<10000"],
    http_req_failed: ["rate<0.05"],
  },
}

const API = __ENV.API_URL || "https://api.contexter.cc"
const TOKEN = __ENV.API_TOKEN

if (!TOKEN) {
  throw new Error("API_TOKEN env var is required.")
}

export default function () {
  // Health check
  const healthRes = http.get(`${API}/health`, { timeout: "5s" })
  check(healthRes, { "health: 200": (r) => r.status === 200 })

  sleep(1)

  // Query
  const queryRes = http.post(
    `${API}/api/query`,
    JSON.stringify({ query: "What is Contexter?" }),
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: "30s",
    }
  )
  check(queryRes, {
    "query: 200": (r) => r.status === 200,
    "query: has answer": (r) => {
      try {
        return JSON.parse(r.body).answer.length > 0
      } catch {
        return false
      }
    },
  })

  sleep(2)

  // Document list
  const listRes = http.get(`${API}/api/status`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: "10s",
  })
  check(listRes, { "list: 200": (r) => r.status === 200 })

  sleep(1)
}
