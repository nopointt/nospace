#!/usr/bin/env bun
/**
 * Wave 5 — Chunking evaluation runner.
 *
 * Evaluates two chunking strategies (A and B) across Layer 1 (intrinsic) and
 * Layer 2 (retrieval) metrics, then runs a Wilcoxon signed-rank comparison.
 *
 * Usage:
 *   bun run evaluation/run-eval-chunking.ts \
 *     --dataset evaluation/dataset/eval.json \
 *     --strategyA default \
 *     --strategyB structure-aware \
 *     [--k 5] \
 *     [--jina-key <key>] \
 *     [--mock-embedder]  # use random embedder (offline/CI)
 *
 * Output:
 *   evaluation/results/chunking-eval-{timestamp}.json  — full machine-readable report
 *   Human-readable table printed to stdout.
 *
 * Environment:
 *   JINA_API_KEY — Jina v4 embeddings API key (overridden by --jina-key).
 *                  Ignored when --mock-embedder is set.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import type { EvalDataset, EvalChunk, MetricResult, ComparisonResult, EmbedFn } from "./types"
import type { ChunkingResult } from "./types"
import { ChunkerService } from "../src/services/chunker/index"
import { ensureEncoderLoaded } from "../src/services/chunker/tokenizer"
import { computeIntrinsicMetrics } from "./metrics/intrinsic"
import { computeRetrievalMetrics } from "./metrics/retrieval"
import { compareStrategies } from "./compare"

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function argValue(flag: string, fallback: string): string {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : fallback
}

function argFlag(flag: string): boolean {
  return args.includes(flag)
}

const datasetPath = argValue("--dataset", "evaluation/dataset/eval.json")
const strategyAName = argValue("--strategyA", "default")
const strategyBName = argValue("--strategyB", "structure-aware")
const k = parseInt(argValue("--k", "5"), 10)
const jinaKey = argValue("--jina-key", process.env.JINA_API_KEY ?? "")
const useMockEmbedder = argFlag("--mock-embedder")

// ─── Embedder factory ─────────────────────────────────────────────────────────

/**
 * Create a Jina v4 embedder that calls api.jina.ai/v1/embeddings.
 * Produces 1024-dimensional vectors (task="retrieval.passage").
 */
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
        task: "retrieval.passage",
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

    // Sort by index (API may reorder) and return embeddings
    const sorted = [...data.data].sort((a, b) => a.index - b.index)
    return sorted.map((d) => d.embedding)
  }
}

/**
 * Mock embedder for offline / CI use.
 * Returns deterministic pseudo-random unit vectors using the text's char sum as seed.
 * Consistent for the same text across calls within one process.
 */
function createMockEmbedder(dims: number = 64): EmbedFn {
  const cache = new Map<string, number[]>()

  return async (texts: string[]): Promise<number[][]> => {
    return texts.map((text) => {
      const cached = cache.get(text)
      if (cached) return cached

      // Deterministic seeded pseudo-random via LCG from char sum
      let seed = 0
      for (let i = 0; i < text.length; i++) seed = (seed + text.charCodeAt(i)) | 0

      const vec: number[] = new Array(dims)
      let norm = 0
      for (let i = 0; i < dims; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0
        vec[i] = seed / 2147483648
        norm += vec[i]! * vec[i]!
      }
      // Normalise to unit length
      const mag = Math.sqrt(norm)
      for (let i = 0; i < dims; i++) vec[i] = vec[i]! / mag

      cache.set(text, vec)
      return vec
    })
  }
}

// ─── Strategy router ──────────────────────────────────────────────────────────

/**
 * Map strategy name strings to ChunkerService option sets.
 * Add new named strategies here as the chunker evolves.
 */
function strategyOptions(name: string): Record<string, unknown> {
  switch (name) {
    case "default":
      return { hierarchical: false }
    case "structure-aware":
      return { hierarchical: false, softMaxTokens: 400, hardMaxTokens: 800, overlap: 80 }
    case "hierarchical":
      return { hierarchical: true }
    case "code-heavy":
      return { hierarchical: false, softMaxTokens: 800, hardMaxTokens: 1500, overlap: 0 }
    case "table-heavy":
      return { hierarchical: false, softMaxTokens: 500, hardMaxTokens: 1000, overlap: 0 }
    default:
      // Unknown strategy: fall through to default options
      console.warn(`[run-eval-chunking] Unknown strategy "${name}" — using default options.`)
      return {}
  }
}

// ─── Chunk one document ───────────────────────────────────────────────────────

function chunkDocument(
  doc: { id: string; content: string; sourceFormat: string },
  strategy: string,
  chunker: ChunkerService,
): ChunkingResult {
  const options = strategyOptions(strategy) as Parameters<ChunkerService["chunk"]>[2]
  const rawChunks = chunker.chunk(doc.content, doc.sourceFormat, options)

  const chunks: EvalChunk[] = rawChunks.map((c) => ({
    content: c.content,
    tokenCount: c.tokenCount,
    startOffset: c.startOffset,
    endOffset: c.endOffset,
    metadata: {
      ...c.metadata,
      chunkType: c.chunkType,
      parentIndex: c.parentIndex,
    },
  }))

  return { documentId: doc.id, strategy, chunks }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function pad(s: string, width: number): string {
  return s.length >= width ? s : s + " ".repeat(width - s.length)
}

function fmt(n: number): string {
  return n.toFixed(4)
}

function printComparisonTable(
  strategyA: string,
  strategyB: string,
  comparisons: ComparisonResult[],
): void {
  const colW = [24, 10, 10, 10, 10, 12]
  const header = [
    "Metric",
    `A (${strategyA.slice(0, 8)})`,
    `B (${strategyB.slice(0, 8)})`,
    "Diff(B-A)",
    "p-value",
    "Significant",
  ]

  const sep = colW.map((w) => "-".repeat(w)).join("  ")
  console.log(sep)
  console.log(header.map((h, i) => pad(h, colW[i]!)).join("  "))
  console.log(sep)

  for (const c of comparisons) {
    const row = [
      c.metricName,
      fmt(c.medianA),
      fmt(c.medianB),
      (c.medianDiff >= 0 ? "+" : "") + fmt(c.medianDiff),
      fmt(c.pValue),
      c.significant ? "YES *" : "no",
    ]
    console.log(row.map((v, i) => pad(v, colW[i]!)).join("  "))
  }

  console.log(sep)
}

// ─── Report type ─────────────────────────────────────────────────────────────

interface ChunkingEvalReport {
  run_at: string
  dataset: string
  strategyA: string
  strategyB: string
  k: number
  documents_evaluated: number
  queries_evaluated: number
  metricsA: MetricResult[]
  metricsB: MetricResult[]
  comparisons: ComparisonResult[]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ── Validate env ───────────────────────────────────────────────────────
  if (!useMockEmbedder && !jinaKey) {
    console.error(
      "FATAL: Jina API key required.\n" +
      "  Pass --jina-key <key> or set JINA_API_KEY, or use --mock-embedder for offline mode.",
    )
    process.exit(1)
  }

  // ── Load dataset ────────────────────────────────────────────────────────
  let dataset: EvalDataset
  try {
    const raw = readFileSync(datasetPath, "utf8")
    dataset = JSON.parse(raw) as EvalDataset
  } catch (e) {
    console.error(
      `FATAL: Could not load dataset from "${datasetPath}": ` +
      (e instanceof Error ? e.message : String(e)),
    )
    process.exit(1)
  }

  console.log(`Dataset: ${dataset.documents.length} documents, ${dataset.queries.length} queries`)
  console.log(`Strategy A: ${strategyAName}`)
  console.log(`Strategy B: ${strategyBName}`)
  console.log(`K: ${k}`)
  console.log(`Embedder: ${useMockEmbedder ? "mock (offline)" : "Jina v3"}`)
  console.log("")

  // ── Prepare services ───────────────────────────────────────────────────
  await ensureEncoderLoaded()
  const chunker = new ChunkerService()

  const embedFn: EmbedFn = useMockEmbedder
    ? createMockEmbedder()
    : createJinaEmbedder(jinaKey)

  // ── Chunk all documents under both strategies ──────────────────────────
  console.log("Chunking documents...")
  const resultsA: ChunkingResult[] = []
  const resultsB: ChunkingResult[] = []

  for (const doc of dataset.documents) {
    resultsA.push(chunkDocument(doc, strategyAName, chunker))
    resultsB.push(chunkDocument(doc, strategyBName, chunker))
  }

  // ── Compute Layer 1 metrics per document, aggregate ───────────────────
  console.log("Computing Layer 1 (intrinsic) metrics...")

  const layer1A: MetricResult[] = []
  const layer1B: MetricResult[] = []

  // Accumulate per-metric details across documents (keyed as docIdx_chunkIdx)
  const layer1Accum = (metrics: MetricResult[], target: MetricResult[], docIdx: number): void => {
    for (const m of metrics) {
      const existing = target.find((t) => t.name === m.name)
      if (!existing) {
        const prefixed: Record<string, number> = {}
        for (const [k, v] of Object.entries(m.details ?? {})) {
          prefixed[`d${docIdx}_${k}`] = v
        }
        target.push({ name: m.name, value: m.value, details: prefixed })
      } else {
        // Accumulate details
        for (const [k, v] of Object.entries(m.details ?? {})) {
          existing.details![`d${docIdx}_${k}`] = v
        }
        // Re-average value
        const vals = Object.values(existing.details!)
        existing.value = vals.reduce((a, b) => a + b, 0) / vals.length
      }
    }
  }

  for (let di = 0; di < dataset.documents.length; di++) {
    const doc = dataset.documents[di]!
    const chunksA = resultsA[di]!.chunks
    const chunksB = resultsB[di]!.chunks

    const metricsForA = await computeIntrinsicMetrics(doc.content, chunksA, embedFn)
    const metricsForB = await computeIntrinsicMetrics(doc.content, chunksB, embedFn)

    layer1Accum(metricsForA, layer1A, di)
    layer1Accum(metricsForB, layer1B, di)

    process.stdout.write(
      `  Doc ${di + 1}/${dataset.documents.length}: ` +
      `A chunks=${chunksA.length} B chunks=${chunksB.length}\n`,
    )
  }

  // ── Compute Layer 2 metrics per document, aggregate ───────────────────
  console.log("Computing Layer 2 (retrieval) metrics...")

  const layer2A: MetricResult[] = []
  const layer2B: MetricResult[] = []

  for (let di = 0; di < dataset.documents.length; di++) {
    const doc = dataset.documents[di]!
    const chunksA = resultsA[di]!.chunks
    const chunksB = resultsB[di]!.chunks

    // Filter queries relevant to this document
    const docQueries = dataset.queries.filter((q) => q.documentId === doc.id)
    if (docQueries.length === 0) continue

    const { metrics: mA } = await computeRetrievalMetrics(docQueries, chunksA, embedFn, k)
    const { metrics: mB } = await computeRetrievalMetrics(docQueries, chunksB, embedFn, k)

    // Accumulate with query-scoped keys
    for (const m of mA) {
      const existing = layer2A.find((t) => t.name === m.name)
      if (!existing) {
        const prefixed: Record<string, number> = {}
        for (const [key, val] of Object.entries(m.details ?? {})) {
          prefixed[`d${di}_${key}`] = val
        }
        layer2A.push({ name: m.name, value: m.value, details: prefixed })
      } else {
        for (const [key, val] of Object.entries(m.details ?? {})) {
          existing.details![`d${di}_${key}`] = val
        }
        const vals = Object.values(existing.details!)
        existing.value = vals.reduce((a, b) => a + b, 0) / vals.length
      }
    }

    for (const m of mB) {
      const existing = layer2B.find((t) => t.name === m.name)
      if (!existing) {
        const prefixed: Record<string, number> = {}
        for (const [key, val] of Object.entries(m.details ?? {})) {
          prefixed[`d${di}_${key}`] = val
        }
        layer2B.push({ name: m.name, value: m.value, details: prefixed })
      } else {
        for (const [key, val] of Object.entries(m.details ?? {})) {
          existing.details![`d${di}_${key}`] = val
        }
        const vals = Object.values(existing.details!)
        existing.value = vals.reduce((a, b) => a + b, 0) / vals.length
      }
    }

    process.stdout.write(`  Doc ${di + 1}: A queries=${docQueries.length} B queries=${docQueries.length}\n`)
  }

  // ── Run A/B comparison ─────────────────────────────────────────────────
  console.log("\nRunning A/B statistical comparison...")

  // Align metric arrays so compareStrategies can pair them
  const alignMetrics = (a: MetricResult[], b: MetricResult[]): [MetricResult[], MetricResult[]] => {
    const names = [...new Set([...a.map((m) => m.name), ...b.map((m) => m.name)])]
    const aligned_a = names.map((n) => a.find((m) => m.name === n) ?? { name: n, value: 0 })
    const aligned_b = names.map((n) => b.find((m) => m.name === n) ?? { name: n, value: 0 })
    return [aligned_a, aligned_b]
  }

  const [alignedL1A, alignedL1B] = alignMetrics(layer1A, layer1B)
  const [alignedL2A, alignedL2B] = alignMetrics(layer2A, layer2B)

  const comparisons = [
    ...compareStrategies(alignedL1A, alignedL1B),
    ...compareStrategies(alignedL2A, alignedL2B),
  ]

  // ── Print results table ────────────────────────────────────────────────
  console.log("\n=== Chunking Evaluation Results ===\n")
  console.log("Layer 1 — Intrinsic Metrics:")
  printComparisonTable(strategyAName, strategyBName, comparisons.filter((c) =>
    ["SizeCompliance", "IntrachunkCohesion", "BlockIntegrity"].includes(c.metricName),
  ))

  console.log("\nLayer 2 — Retrieval Metrics:")
  printComparisonTable(strategyAName, strategyBName, comparisons.filter((c) =>
    c.metricName.startsWith("TokenIoU") ||
    c.metricName.startsWith("Recall") ||
    c.metricName === "MRR",
  ))

  // ── Write JSON report ──────────────────────────────────────────────────
  const report: ChunkingEvalReport = {
    run_at: new Date().toISOString(),
    dataset: datasetPath,
    strategyA: strategyAName,
    strategyB: strategyBName,
    k,
    documents_evaluated: dataset.documents.length,
    queries_evaluated: dataset.queries.length,
    metricsA: [...alignedL1A, ...alignedL2A],
    metricsB: [...alignedL1B, ...alignedL2B],
    comparisons,
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const resultsDir = "evaluation/results"
  mkdirSync(resultsDir, { recursive: true })
  const outPath = join(resultsDir, `chunking-eval-${timestamp}.json`)
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8")

  console.log(`\nReport written to: ${outPath}`)

  // ── Print significant findings ─────────────────────────────────────────
  const significantWins = comparisons.filter((c) => c.significant && c.medianDiff > 0)
  const significantLosses = comparisons.filter((c) => c.significant && c.medianDiff < 0)

  if (significantWins.length > 0) {
    console.log(`\nStrategy B (${strategyBName}) wins significantly on:`)
    for (const c of significantWins) {
      console.log(`  ${c.metricName}: +${fmt(c.medianDiff)} (p=${fmt(c.pValue)})`)
    }
  }

  if (significantLosses.length > 0) {
    console.log(`\nStrategy A (${strategyAName}) wins significantly on:`)
    for (const c of significantLosses) {
      console.log(`  ${c.metricName}: ${fmt(c.medianDiff)} (p=${fmt(c.pValue)})`)
    }
  }

  if (significantWins.length === 0 && significantLosses.length === 0) {
    console.log("\nNo statistically significant differences found (p < 0.05).")
  }
}

main().catch((e) => {
  console.error("run-eval-chunking failed:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
