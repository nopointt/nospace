#!/usr/bin/env bun
/**
 * F-032: Stale pair detector
 * Flags golden pairs where the API no longer retrieves expected_sources.
 * Sets "reviewed": false on stale pairs (writes back to file).
 *
 * Usage:
 *   bun run evaluation/check-stale.ts --api-url http://localhost:3000 --token $EVAL_TOKEN
 */

import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

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
  sources: { documentId: string }[]
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

function loadPairsWithPaths(dir: string): { pair: GoldenPair; filePath: string }[] {
  const result: { pair: GoldenPair; filePath: string }[] = []
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  } catch {
    return result
  }
  for (const file of files) {
    const filePath = join(dir, file)
    try {
      const raw = readFileSync(filePath, "utf8")
      const pair = JSON.parse(raw) as GoldenPair
      result.push({ pair, filePath })
    } catch {
      console.warn(`Skipping malformed file: ${file}`)
    }
  }
  return result
}

async function main(): Promise<void> {
  const dirs = ["evaluation/golden/manual", "evaluation/golden/synthetic"]
  const allItems = dirs.flatMap(loadPairsWithPaths)

  const withExpected = allItems.filter(
    ({ pair }) => pair.reviewed && pair.expected_sources && pair.expected_sources.length > 0,
  )

  if (withExpected.length === 0) {
    console.log("No reviewed pairs with expected_sources to check.")
    return
  }

  console.log(`Checking ${withExpected.length} pairs with expected_sources...`)

  let staleCount = 0

  for (const { pair, filePath } of withExpected) {
    process.stdout.write(`  ${pair.id}: `)

    let response: QueryResponse
    try {
      response = await callApi(pair.question)
    } catch (e) {
      console.log(`API error — skipping: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }

    const returnedIds = new Set(response.sources.map((s) => s.documentId))
    const missing = (pair.expected_sources ?? []).filter((id) => !returnedIds.has(id))

    if (missing.length > 0) {
      console.log(`STALE (missing sources: ${missing.join(", ")})`)
      const updated: GoldenPair = { ...pair, reviewed: false }
      writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n", "utf8")
      staleCount++
    } else {
      console.log("ok")
    }
  }

  console.log(`\nDone. ${staleCount} pair(s) marked stale (reviewed: false).`)
  if (staleCount > 0) {
    console.log("Re-verify stale pairs and set \"reviewed\": true before next CI run.")
  }
}

main().catch((e) => {
  console.error("check-stale failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
