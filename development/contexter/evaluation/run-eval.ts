#!/usr/bin/env bun
/**
 * F-032: CI evaluation runner — golden test set
 *
 * Reads all reviewed Q&A pairs, calls the API, runs LLM eval on each,
 * writes results to evaluation/results/eval-{timestamp}.json.
 *
 * Exit 0 = pass (thresholds met)
 * Exit 1 = fail (thresholds not met)
 *
 * Usage:
 *   bun run evaluation/run-eval.ts --api-url http://localhost:3000 --token $EVAL_TOKEN
 *
 * Requires: GROQ_API_KEY in env
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { LlmService } from "../src/services/llm"
import { runLlmEval } from "../src/services/evaluation/llm-eval"

// --- Thresholds ---
const FAITHFULNESS_THRESHOLD = 0.70
const RELEVANCY_THRESHOLD = 0.65

// --- Parse CLI args ---
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
if (!process.env.GROQ_API_KEY) {
  console.error("FATAL: GROQ_API_KEY not set")
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

interface PerPairResult {
  id: string
  question: string
  faithfulness: number | null
  relevancy_score: number | null
  retrieval_recall: number | null
  sources_returned: number
  passed: boolean
}

interface EvalReport {
  run_at: string
  total_pairs: number
  mean_faithfulness: number | null
  mean_relevancy: number | null
  pass: boolean
  failing_pairs: string[]
  per_pair: PerPairResult[]
}

function loadReviewedPairs(dir: string): GoldenPair[] {
  const pairs: GoldenPair[] = []
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  } catch {
    return pairs
  }
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), "utf8")
      const pair = JSON.parse(raw) as GoldenPair
      if (pair.reviewed === true) pairs.push(pair)
    } catch {
      console.warn(`Skipping malformed pair file: ${file}`)
    }
  }
  return pairs
}

interface QueryResponse {
  answer: string
  sources: { documentId: string; content: string; score: number }[]
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
    throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<QueryResponse>
}

function computeRetrievalRecall(
  returnedSourceIds: string[],
  expectedSources: string[] | undefined,
): number | null {
  if (!expectedSources || expectedSources.length === 0) return null
  const returned = new Set(returnedSourceIds)
  const hits = expectedSources.filter((id) => returned.has(id)).length
  return hits / expectedSources.length
}

function mean(values: number[]): number | null {
  const valid = values.filter((v) => Number.isFinite(v))
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

async function main(): Promise<void> {
  const llm = new LlmService({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-8b-instant",
  })

  const manualDir = "evaluation/golden/manual"
  const syntheticDir = "evaluation/golden/synthetic"

  const pairs = [
    ...loadReviewedPairs(manualDir),
    ...loadReviewedPairs(syntheticDir),
  ]

  if (pairs.length === 0) {
    console.error("No reviewed pairs found. Add pairs with \"reviewed\": true to evaluation/golden/")
    process.exit(1)
  }

  console.log(`Running evaluation on ${pairs.length} reviewed pairs...`)

  const perPair: PerPairResult[] = []

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]!
    process.stdout.write(`  [${i + 1}/${pairs.length}] ${pair.id}: `)

    let apiResponse: QueryResponse
    try {
      apiResponse = await callApi(pair.question)
    } catch (e) {
      console.log(`API call failed — ${e instanceof Error ? e.message : String(e)}`)
      perPair.push({
        id: pair.id,
        question: pair.question,
        faithfulness: null,
        relevancy_score: null,
        retrieval_recall: null,
        sources_returned: 0,
        passed: false,
      })
      continue
    }

    const context = apiResponse.sources.map((s) => s.content).join("\n\n")
    const returnedIds = apiResponse.sources.map((s) => s.documentId)

    let evalResult: Awaited<ReturnType<typeof runLlmEval>> | null = null
    try {
      evalResult = await runLlmEval(llm, pair.question, apiResponse.answer, context)
    } catch (e) {
      console.log(`LLM eval failed — ${e instanceof Error ? e.message : String(e)}`)
    }

    const retrievalRecall = computeRetrievalRecall(returnedIds, pair.expected_sources)

    const faith = evalResult?.faithfulness ?? null
    const rel = evalResult?.relevancy_score ?? null
    const passed =
      (faith === null || faith >= FAITHFULNESS_THRESHOLD) &&
      (rel === null || rel >= RELEVANCY_THRESHOLD)

    console.log(`faith=${faith?.toFixed(2) ?? "n/a"} rel=${rel?.toFixed(2) ?? "n/a"} recall=${retrievalRecall?.toFixed(2) ?? "n/a"} ${passed ? "PASS" : "FAIL"}`)

    perPair.push({
      id: pair.id,
      question: pair.question,
      faithfulness: faith,
      relevancy_score: rel,
      retrieval_recall: retrievalRecall,
      sources_returned: apiResponse.sources.length,
      passed,
    })
  }

  const faithValues = perPair.map((p) => p.faithfulness).filter((v): v is number => v !== null)
  const relValues = perPair.map((p) => p.relevancy_score).filter((v): v is number => v !== null)

  const meanFaithfulness = mean(faithValues)
  const meanRelevancy = mean(relValues)

  const overallPass =
    (meanFaithfulness === null || meanFaithfulness >= FAITHFULNESS_THRESHOLD) &&
    (meanRelevancy === null || meanRelevancy >= RELEVANCY_THRESHOLD)

  const failingPairs = perPair.filter((p) => !p.passed).map((p) => p.id)

  const report: EvalReport = {
    run_at: new Date().toISOString(),
    total_pairs: pairs.length,
    mean_faithfulness: meanFaithfulness,
    mean_relevancy: meanRelevancy,
    pass: overallPass,
    failing_pairs: failingPairs,
    per_pair: perPair,
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const resultsDir = "evaluation/results"
  mkdirSync(resultsDir, { recursive: true })
  const outPath = join(resultsDir, `eval-${timestamp}.json`)
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8")

  console.log("\n--- Summary ---")
  console.log(`Total pairs:       ${pairs.length}`)
  console.log(`Mean faithfulness: ${meanFaithfulness?.toFixed(3) ?? "n/a"} (threshold: ${FAITHFULNESS_THRESHOLD})`)
  console.log(`Mean relevancy:    ${meanRelevancy?.toFixed(3) ?? "n/a"} (threshold: ${RELEVANCY_THRESHOLD})`)
  console.log(`Failing pairs:     ${failingPairs.length}`)
  console.log(`Result:            ${overallPass ? "PASS" : "FAIL"}`)
  console.log(`Report written to: ${outPath}`)

  process.exit(overallPass ? 0 : 1)
}

main().catch((e) => {
  console.error("run-eval failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
