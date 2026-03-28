#!/usr/bin/env bun
/**
 * F-033: Deployment canary — gates deployment based on RAG quality signals.
 *
 * Reads first 10 reviewed golden pairs (oldest by added_at),
 * calls POST /api/query for each, compares against 7-day rolling baseline.
 *
 * Exit 0 = canary passed
 * Exit 1 = canary failed → roll back deployment
 *
 * Usage:
 *   bun run evaluation/canary.ts --api-url http://localhost:3000 --token $EVAL_TOKEN
 */

import { readdirSync, readFileSync } from "fs"
import { join } from "path"

// --- Fail conditions ---
const RETRIEVAL_SCORE_FLOOR_RATIO = 0.70  // current must be >= 70% of 7d rolling avg
const MAX_EMPTY_ANSWERS = 2               // out of 10
const CANARY_PAIR_COUNT = 10

// --- CLI args ---
const args = process.argv.slice(2)
function argValue(flag: string, fallback: string): string {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : fallback
}

const apiUrl = argValue("--api-url", "http://localhost:3000")
const token = argValue("--token", process.env.EVAL_TOKEN ?? "")

if (!token) {
  console.error("FATAL: --token or EVAL_TOKEN env var required")
  process.exit(1)
}

interface GoldenPair {
  id: string
  question: string
  expected_answer: string
  expected_sources?: string[]
  tags: string[]
  added_by: string
  added_at: string
  reviewed: boolean
}

interface QueryResponse {
  answer: string
  sources: { documentId: string; content: string; score: number }[]
}

interface CanaryResult {
  pairId: string
  question: string
  sourcesReturned: number
  retrievalScoreMean: number | null
  answerLength: number
  emptyAnswer: boolean
}

function loadReviewedPairs(dir: string): GoldenPair[] {
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  } catch {
    return []
  }
  const pairs: GoldenPair[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), "utf8")
      const pair = JSON.parse(raw) as GoldenPair
      if (pair.reviewed === true) pairs.push(pair)
    } catch {
      console.warn(`canary: skipping malformed pair file: ${file}`)
    }
  }
  return pairs
}

async function callApi(question: string): Promise<QueryResponse> {
  const res = await fetch(`${apiUrl}/api/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: question }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<QueryResponse>
}

function mean(values: number[]): number | null {
  const valid = values.filter((v) => Number.isFinite(v))
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

async function fetchRollingBaseline(): Promise<number | null> {
  // Query the API's /api/metrics endpoint for 7d rolling average if available
  // Falls back to null (disables ratio check) when endpoint unavailable
  try {
    const res = await fetch(`${apiUrl}/api/metrics`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as Record<string, unknown>
    const val = data["retrieval_score_mean_7d"]
    return typeof val === "number" ? val : null
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const manualDir = "evaluation/golden/manual"
  const syntheticDir = "evaluation/golden/synthetic"

  const allPairs = [
    ...loadReviewedPairs(manualDir),
    ...loadReviewedPairs(syntheticDir),
  ].sort((a, b) => a.added_at.localeCompare(b.added_at))

  if (allPairs.length < CANARY_PAIR_COUNT) {
    console.log(
      `canary: only ${allPairs.length} reviewed pairs found (need ${CANARY_PAIR_COUNT}). ` +
      "Skipping canary checks — not enough data."
    )
    console.log("canary: PASS (insufficient data — skipped)")
    process.exit(0)
  }

  const canaryPairs = allPairs.slice(0, CANARY_PAIR_COUNT)
  const rollingBaseline = await fetchRollingBaseline()

  console.log(`canary: running ${CANARY_PAIR_COUNT} queries against ${apiUrl}`)
  if (rollingBaseline !== null) {
    console.log(`canary: 7d rolling baseline retrieval_score_mean = ${rollingBaseline.toFixed(4)}`)
  } else {
    console.log("canary: no rolling baseline available — ratio check disabled")
  }

  const results: CanaryResult[] = []
  const failures: string[] = []

  for (let i = 0; i < canaryPairs.length; i++) {
    const pair = canaryPairs[i]!
    process.stdout.write(`  [${i + 1}/${CANARY_PAIR_COUNT}] ${pair.id}: `)

    let response: QueryResponse
    try {
      response = await callApi(pair.question)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`FAIL (api_error: ${msg})`)
      failures.push(`${pair.id}: api_error`)
      results.push({
        pairId: pair.id,
        question: pair.question,
        sourcesReturned: 0,
        retrievalScoreMean: null,
        answerLength: 0,
        emptyAnswer: true,
      })
      continue
    }

    const scores = response.sources.map((s) => s.score)
    const retrievalScoreMean = mean(scores)
    const emptyAnswer = response.answer.trim().length === 0
    const sourcesReturned = response.sources.length

    if (sourcesReturned === 0) {
      failures.push(`${pair.id}: zero_sources`)
    }

    console.log(
      `sources=${sourcesReturned} score=${retrievalScoreMean?.toFixed(4) ?? "n/a"} ` +
      `answer_len=${response.answer.length} ${emptyAnswer ? "EMPTY" : "ok"}`
    )

    results.push({
      pairId: pair.id,
      question: pair.question,
      sourcesReturned,
      retrievalScoreMean,
      answerLength: response.answer.length,
      emptyAnswer,
    })
  }

  // --- Fail condition 1: any query returns 0 sources ---
  const zeroSourceQueries = results.filter((r) => r.sourcesReturned === 0)
  if (zeroSourceQueries.length > 0) {
    console.error(
      `canary: FAIL — ${zeroSourceQueries.length} query/queries returned 0 sources: ` +
      zeroSourceQueries.map((r) => r.pairId).join(", ")
    )
    process.exit(1)
  }

  // --- Fail condition 2: mean retrieval_score < 70% of rolling baseline ---
  const currentScores = results
    .map((r) => r.retrievalScoreMean)
    .filter((v): v is number => v !== null)
  const currentMean = mean(currentScores)

  if (rollingBaseline !== null && currentMean !== null) {
    const floor = rollingBaseline * RETRIEVAL_SCORE_FLOOR_RATIO
    if (currentMean < floor) {
      console.error(
        `canary: FAIL — mean retrieval_score ${currentMean.toFixed(4)} is below ` +
        `70% of 7d baseline (${floor.toFixed(4)})`
      )
      process.exit(1)
    }
  }

  // --- Fail condition 3: more than 2/10 queries return empty answers ---
  const emptyAnswerCount = results.filter((r) => r.emptyAnswer).length
  if (emptyAnswerCount > MAX_EMPTY_ANSWERS) {
    console.error(
      `canary: FAIL — ${emptyAnswerCount}/10 queries returned empty answers ` +
      `(threshold: max ${MAX_EMPTY_ANSWERS})`
    )
    process.exit(1)
  }

  console.log("")
  console.log("--- Canary Summary ---")
  console.log(`Queries run:         ${results.length}`)
  console.log(`Zero-source queries: ${zeroSourceQueries.length}`)
  console.log(`Empty answers:       ${emptyAnswerCount}/${CANARY_PAIR_COUNT}`)
  console.log(`Mean retrieval score: ${currentMean?.toFixed(4) ?? "n/a"}`)
  if (rollingBaseline !== null) {
    console.log(`7d rolling baseline:  ${rollingBaseline.toFixed(4)}`)
    console.log(`Floor (70%):          ${(rollingBaseline * RETRIEVAL_SCORE_FLOOR_RATIO).toFixed(4)}`)
  }
  console.log("canary: PASS")
  process.exit(0)
}

main().catch((e) => {
  console.error("canary: fatal error:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
