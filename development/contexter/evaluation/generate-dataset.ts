#!/usr/bin/env bun
/**
 * Wave 5 — Eval dataset generator.
 *
 * Reads documents from a directory, generates QA pairs with ground-truth
 * character offsets using Groq Llama 8B, deduplicates by embedding similarity,
 * and outputs an EvalDataset JSON matching evaluation/types.ts.
 *
 * Usage:
 *   bun run evaluation/generate-dataset.ts \
 *     --docs-dir evaluation/dataset/docs/ \
 *     --output evaluation/dataset/eval.json \
 *     [--pairs-per-doc 5] \
 *     [--similarity-threshold 0.7] \
 *     [--jina-key <key>] \
 *     [--mock-embedder]
 *
 * Supported doc formats: .md .txt .json (content field extracted from JSON)
 *
 * Environment:
 *   GROQ_API_KEY — required for QA generation.
 *   JINA_API_KEY — required for dedup embeddings (unless --mock-embedder).
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs"
import { join, extname, basename } from "path"
import type { EvalDataset, EvalDocument, EvalQuery, EmbedFn } from "./types"

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function argValue(flag: string, fallback: string): string {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : fallback
}

function argFlag(flag: string): boolean {
  return args.includes(flag)
}

const docsDir = argValue("--docs-dir", "evaluation/dataset/docs/")
const outputPath = argValue("--output", "evaluation/dataset/eval.json")
const pairsPerDoc = parseInt(argValue("--pairs-per-doc", "5"), 10)
const similarityThreshold = parseFloat(argValue("--similarity-threshold", "0.7"))
const jinaKey = argValue("--jina-key", process.env.JINA_API_KEY ?? "")
const useMockEmbedder = argFlag("--mock-embedder")
const groqKey = process.env.GROQ_API_KEY ?? ""

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.1-8b-instant"

// ─── Validation ───────────────────────────────────────────────────────────────

if (!groqKey) {
  console.error("FATAL: GROQ_API_KEY not set in environment.")
  process.exit(1)
}

if (!useMockEmbedder && !jinaKey) {
  console.error(
    "FATAL: Jina API key required for deduplication.\n" +
    "  Pass --jina-key <key> or set JINA_API_KEY, or use --mock-embedder for offline mode.",
  )
  process.exit(1)
}

// ─── Document loader ──────────────────────────────────────────────────────────

/** Supported source formats mapped from file extension. */
const EXT_TO_FORMAT: Record<string, string> = {
  ".md": "markdown",
  ".txt": "plaintext",
  ".json": "json",
}

/**
 * Load all supported documents from a directory (non-recursive).
 * JSON files are expected to have a top-level "content" string field.
 */
function loadDocuments(dir: string): EvalDocument[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => {
      const ext = extname(f).toLowerCase()
      return Object.hasOwn(EXT_TO_FORMAT, ext)
    })
  } catch (e) {
    console.error(`FATAL: Cannot read docs directory "${dir}": ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }

  if (files.length === 0) {
    console.error(`FATAL: No supported documents found in "${dir}". Supported: .md .txt .json`)
    process.exit(1)
  }

  const docs: EvalDocument[] = []

  for (const file of files) {
    const filePath = join(dir, file)

    // Skip directories
    try {
      if (statSync(filePath).isDirectory()) continue
    } catch {
      continue
    }

    const ext = extname(file).toLowerCase()
    const sourceFormat = EXT_TO_FORMAT[ext] ?? "plaintext"
    const id = basename(file, ext)

    let content: string
    try {
      const raw = readFileSync(filePath, "utf8")
      if (ext === ".json") {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        if (typeof parsed.content !== "string") {
          console.warn(`  Skipping ${file}: JSON does not have a string "content" field.`)
          continue
        }
        content = parsed.content
      } else {
        content = raw
      }
    } catch (e) {
      console.warn(`  Skipping ${file}: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }

    if (content.trim().length === 0) {
      console.warn(`  Skipping ${file}: empty content.`)
      continue
    }

    docs.push({ id, content, sourceFormat })
  }

  return docs
}

// ─── Groq LLM call ────────────────────────────────────────────────────────────

interface GroqMessage { role: "system" | "user" | "assistant"; content: string }

async function groqChat(messages: GroqMessage[], maxTokens: number = 1024): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Groq API error ${response.status}: ${text.slice(0, 300)}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }

  return data.choices[0]?.message.content ?? ""
}

// ─── QA pair generation ───────────────────────────────────────────────────────

interface RawQAPair {
  query: string
  relevantExcerpt: string
}

/**
 * Ask the LLM to generate N QA pairs from a document excerpt.
 * Each pair must include the verbatim relevant excerpt (for offset lookup).
 *
 * We send up to 4000 characters of content to stay within Llama 8B's
 * comfortable window while leaving room for the response.
 */
async function generateQAPairs(
  docContent: string,
  count: number,
): Promise<RawQAPair[]> {
  const excerpt = docContent.slice(0, 4000)

  const systemPrompt =
    "You are a dataset generator for RAG system evaluation. " +
    "Given a document, generate realistic user queries and their ground-truth answers. " +
    "For each pair, include the verbatim excerpt from the document that answers the query. " +
    "Output only a JSON array, no markdown. Each element must have exactly: " +
    '"query" (string) and "relevantExcerpt" (string, verbatim text from document).'

  const userPrompt =
    `Document:\n${excerpt}\n\n` +
    `Generate ${count} QA pairs as a JSON array. ` +
    "Each 'relevantExcerpt' must be a verbatim quote from the document (not paraphrased). " +
    "Queries should be diverse, specific, and genuinely answerable from the text."

  const raw = await groqChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    1200,
  )

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`LLM returned non-array: ${cleaned.slice(0, 200)}`)
  }

  const pairs: RawQAPair[] = []
  for (const item of parsed) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).query === "string" &&
      typeof (item as Record<string, unknown>).relevantExcerpt === "string"
    ) {
      const q = ((item as Record<string, unknown>).query as string).trim()
      const e = ((item as Record<string, unknown>).relevantExcerpt as string).trim()
      if (q.length > 0 && e.length > 0) {
        pairs.push({ query: q, relevantExcerpt: e })
      }
    }
  }

  return pairs
}

// ─── Character offset finder ─────────────────────────────────────────────────

/**
 * Find the character offsets of an excerpt in a document.
 * Returns the first occurrence.  Returns null if not found (LLM hallucinated).
 */
function findOffsets(
  docContent: string,
  excerpt: string,
): { start: number; end: number } | null {
  const idx = docContent.indexOf(excerpt)
  if (idx === -1) return null
  return { start: idx, end: idx + excerpt.length }
}

// ─── Embedder factory ─────────────────────────────────────────────────────────

function createJinaEmbedder(apiKey: string): EmbedFn {
  return async (texts: string[]): Promise<number[][]> => {
    const response = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        task: "retrieval.query",
        input: texts,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Jina API error ${response.status}: ${text.slice(0, 300)}`)
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[]; index: number }>
    }

    return [...data.data].sort((a, b) => a.index - b.index).map((d) => d.embedding)
  }
}

function createMockEmbedder(dims: number = 64): EmbedFn {
  const cache = new Map<string, number[]>()

  return async (texts: string[]): Promise<number[][]> => {
    return texts.map((text) => {
      const cached = cache.get(text)
      if (cached) return cached

      let seed = 0
      for (let i = 0; i < text.length; i++) seed = (seed + text.charCodeAt(i)) | 0

      const vec: number[] = new Array(dims)
      let norm = 0
      for (let i = 0; i < dims; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0
        vec[i] = seed / 2147483648
        norm += vec[i]! * vec[i]!
      }
      const mag = Math.sqrt(norm)
      for (let i = 0; i < dims; i++) vec[i] = vec[i]! / mag

      cache.set(text, vec)
      return vec
    })
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i]! * b[i]!)
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Remove duplicate queries by cosine similarity of their embeddings.
 * Keeps the first occurrence when similarity >= threshold.
 *
 * @param queries         - Candidate queries to deduplicate.
 * @param queryEmbeds     - Per-query embedding (same index as queries).
 * @param threshold       - Similarity above which a query is considered duplicate.
 */
function deduplicateByEmbedding(
  queries: EvalQuery[],
  queryEmbeds: number[][],
  threshold: number,
): EvalQuery[] {
  const kept: number[] = []

  for (let i = 0; i < queries.length; i++) {
    let isDuplicate = false

    for (const j of kept) {
      const sim = cosineSimilarity(queryEmbeds[i]!, queryEmbeds[j]!)
      if (sim >= threshold) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      kept.push(i)
    }
  }

  return kept.map((i) => queries[i]!)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`Loading documents from: ${docsDir}`)
  const docs = loadDocuments(docsDir)
  console.log(`Found ${docs.length} document(s).`)
  console.log("")

  const embedFn: EmbedFn = useMockEmbedder
    ? createMockEmbedder()
    : createJinaEmbedder(jinaKey)

  const allQueries: EvalQuery[] = []
  let globalQueryIdx = 0

  for (let di = 0; di < docs.length; di++) {
    const doc = docs[di]!
    console.log(`[${di + 1}/${docs.length}] Document: ${doc.id} (${doc.content.length} chars)`)

    // ── Generate raw QA pairs via LLM ──────────────────────────────────────
    let rawPairs: RawQAPair[]
    try {
      rawPairs = await generateQAPairs(doc.content, pairsPerDoc)
    } catch (e) {
      console.warn(`  LLM generation failed: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }

    console.log(`  Generated ${rawPairs.length} raw pairs`)

    // ── Resolve offsets and filter hallucinated excerpts ───────────────────
    const resolvedQueries: EvalQuery[] = []

    for (const pair of rawPairs) {
      const offsets = findOffsets(doc.content, pair.relevantExcerpt)
      if (!offsets) {
        console.warn(`  Skipping hallucinated excerpt: "${pair.relevantExcerpt.slice(0, 60)}..."`)
        continue
      }

      const paddedIdx = String(globalQueryIdx + 1).padStart(4, "0")
      resolvedQueries.push({
        id: `q-${paddedIdx}`,
        query: pair.query,
        relevantExcerpt: pair.relevantExcerpt,
        relevantStartChar: offsets.start,
        relevantEndChar: offsets.end,
        documentId: doc.id,
      })
      globalQueryIdx++
    }

    console.log(`  Resolved ${resolvedQueries.length} pairs (offset found)`)

    if (resolvedQueries.length === 0) continue

    // ── Dedup by embedding similarity ──────────────────────────────────────
    let dedupedQueries = resolvedQueries
    if (resolvedQueries.length > 1) {
      const queryTexts = resolvedQueries.map((q) => q.query)
      const queryEmbeds = await embedFn(queryTexts)
      dedupedQueries = deduplicateByEmbedding(resolvedQueries, queryEmbeds, similarityThreshold)
      console.log(`  After dedup (threshold=${similarityThreshold}): ${dedupedQueries.length} pairs`)
    }

    allQueries.push(...dedupedQueries)
    console.log("")
  }

  if (allQueries.length === 0) {
    console.error("No valid QA pairs generated. Check your documents and Groq API key.")
    process.exit(1)
  }

  // ── Build and write dataset ────────────────────────────────────────────
  const dataset: EvalDataset = {
    documents: docs,
    queries: allQueries,
  }

  const outputDir = outputPath.includes("/")
    ? outputPath.slice(0, outputPath.lastIndexOf("/"))
    : "."
  mkdirSync(outputDir, { recursive: true })

  writeFileSync(outputPath, JSON.stringify(dataset, null, 2) + "\n", "utf8")

  console.log(`=== Dataset Generation Complete ===`)
  console.log(`Documents : ${docs.length}`)
  console.log(`Queries   : ${allQueries.length}`)
  console.log(`Output    : ${outputPath}`)
}

main().catch((e) => {
  console.error("generate-dataset failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
