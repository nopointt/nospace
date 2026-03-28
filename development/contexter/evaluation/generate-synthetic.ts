#!/usr/bin/env bun
/**
 * F-032: Synthetic Q&A pair generator
 * Pulls random chunks from PostgreSQL, calls Groq to generate question + expected_answer.
 *
 * Usage:
 *   bun run evaluation/generate-synthetic.ts --count 30 --output evaluation/golden/synthetic/
 *
 * Requires: DATABASE_URL + GROQ_API_KEY in env
 */

import postgres from "postgres"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { LlmService } from "../src/services/llm"

// --- Parse CLI args ---
const args = process.argv.slice(2)
function argValue(flag: string, fallback: string): string {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : fallback
}

const count = Math.min(parseInt(argValue("--count", "30"), 10), 100)
const outputDir = argValue("--output", "evaluation/golden/synthetic/")

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not set")
  process.exit(1)
}
if (!process.env.GROQ_API_KEY) {
  console.error("FATAL: GROQ_API_KEY not set")
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { max: 2 })
const llm = new LlmService({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
})

interface Chunk {
  id: string
  document_id: string
  content: string
}

interface SyntheticPair {
  id: string
  question: string
  expected_answer: string
  expected_sources: string[]
  tags: string[]
  added_by: "synthetic"
  added_at: string
  reviewed: false
}

async function generatePairFromChunk(
  chunk: Chunk,
  index: number,
): Promise<SyntheticPair | null> {
  const resp = await llm.chat(
    [
      {
        role: "system",
        content:
          "You are a test data generator for a retrieval-augmented generation system. Given a text chunk from a knowledge base, generate a realistic question that a user might ask whose answer is contained in this chunk. Also generate the ideal answer to that question based solely on the chunk content. Output only valid JSON.",
      },
      {
        role: "user",
        content: `Text chunk:\n${chunk.content}\n\nGenerate a JSON object with keys "question" and "expected_answer". The question should be natural, specific, and answerable from this chunk. The answer should be accurate and complete based on the chunk.`,
      },
    ],
    512,
  )

  let question = ""
  let expected_answer = ""
  try {
    const parsed = JSON.parse(resp.response) as { question?: unknown; expected_answer?: unknown }
    if (typeof parsed?.question !== "string" || typeof parsed?.expected_answer !== "string") {
      throw new Error("missing question or expected_answer")
    }
    question = parsed.question.trim()
    expected_answer = parsed.expected_answer.trim()
  } catch (e) {
    console.warn(`Chunk ${chunk.id}: parse failed — ${e instanceof Error ? e.message : String(e)}`)
    return null
  }

  const paddedIndex = String(index + 1).padStart(3, "0")
  return {
    id: `gs-${paddedIndex}`,
    question,
    expected_answer,
    expected_sources: [chunk.document_id],
    tags: ["synthetic"],
    added_by: "synthetic",
    added_at: new Date().toISOString().slice(0, 10),
    reviewed: false,
  }
}

async function main(): Promise<void> {
  console.log(`Fetching ${count} random chunks from database...`)

  const chunks = await sql<Chunk[]>`
    SELECT id, document_id, content
    FROM chunks
    WHERE embedding IS NOT NULL
    ORDER BY RANDOM()
    LIMIT ${count}
  `

  if (chunks.length === 0) {
    console.error("No chunks found — ensure the knowledge base has processed documents.")
    await sql.end()
    process.exit(1)
  }

  console.log(`Generating ${chunks.length} synthetic pairs via Groq...`)
  mkdirSync(outputDir, { recursive: true })

  let written = 0
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    process.stdout.write(`  [${i + 1}/${chunks.length}] chunk ${chunk.id}... `)

    const pair = await generatePairFromChunk(chunk, i)
    if (!pair) {
      console.log("skipped")
      continue
    }

    const fileName = `${pair.id.replace("gs-", "")}.json`
    const filePath = join(outputDir, fileName)
    writeFileSync(filePath, JSON.stringify(pair, null, 2) + "\n", "utf8")
    written++
    console.log("ok")
  }

  await sql.end()
  console.log(`\nDone. ${written} files written to ${outputDir}`)
  console.log("Set \"reviewed\": true in each file after human verification.")
}

main().catch((e) => {
  console.error("generate-synthetic failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
