/**
 * Shared types for the Wave 5 chunking evaluation framework.
 *
 * Layer 1 — Intrinsic metrics (chunk quality, no retrieval needed)
 * Layer 2 — Retrieval metrics (search quality, requires embedder)
 * Layer 3 — E2E metrics (answer quality, handled by existing run-eval.ts / RAGAS)
 */

// ─── Evaluation dataset ───────────────────────────────────────────────────────

/** A document used as input for chunking evaluation. */
export interface EvalDocument {
  /** Unique document identifier. */
  id: string
  /** Full text content. */
  content: string
  /** Source format hint (e.g. "markdown", "plaintext", "csv"). */
  sourceFormat: string
}

/**
 * A ground-truth query paired with the exact excerpt that answers it.
 * Character offsets reference positions in the corresponding EvalDocument.
 */
export interface EvalQuery {
  /** Unique query identifier. */
  id: string
  /** Natural-language query string. */
  query: string
  /** The verbatim excerpt from the document that answers the query. */
  relevantExcerpt: string
  /** Inclusive start character offset within documentId.content. */
  relevantStartChar: number
  /** Exclusive end character offset within documentId.content. */
  relevantEndChar: number
  /** References EvalDocument.id. */
  documentId: string
}

/** Complete evaluation dataset consumed by run-eval-chunking.ts. */
export interface EvalDataset {
  documents: EvalDocument[]
  queries: EvalQuery[]
}

// ─── Chunking result ──────────────────────────────────────────────────────────

/** A single chunk produced by the chunker during evaluation. */
export interface EvalChunk {
  /** Text content of the chunk. */
  content: string
  /** BPE token count (cl100k_base). */
  tokenCount: number
  /** Inclusive start character offset in the source document. */
  startOffset: number
  /** Exclusive end character offset in the source document. */
  endOffset: number
  /** Strategy-specific metadata (sectionHeading, type, etc.). */
  metadata: Record<string, unknown>
}

/** The full output of running one chunking strategy over one document. */
export interface ChunkingResult {
  /** Identifier of the document that was chunked. */
  documentId: string
  /** Chunking strategy label (e.g. "default", "structure-aware", "hierarchical"). */
  strategy: string
  /** All chunks produced — both parent and child chunks if hierarchical. */
  chunks: EvalChunk[]
}

// ─── Metric results ───────────────────────────────────────────────────────────

/** Result of computing one named metric. */
export interface MetricResult {
  /** Metric name (e.g. "SizeCompliance", "TokenIoU@5", "Recall@5"). */
  name: string
  /** Aggregated scalar value (0–1 for ratio metrics). */
  value: number
  /**
   * Optional per-item or per-chunk breakdown.
   * Key is chunk index / query id, value is the per-item score.
   */
  details?: Record<string, number>
}

/** Aggregated metrics for one strategy across all documents/queries. */
export interface StrategyMetrics {
  strategy: string
  layer1: MetricResult[]
  layer2: MetricResult[]
}

// ─── A/B comparison ───────────────────────────────────────────────────────────

/** Paired Wilcoxon signed-rank test result for one metric. */
export interface ComparisonResult {
  /** The metric that was compared. */
  metricName: string
  /** Median per-query score for strategy A. */
  medianA: number
  /** Median per-query score for strategy B. */
  medianB: number
  /** Median(B) − Median(A). Positive means B is better. */
  medianDiff: number
  /**
   * Two-sided p-value from the Wilcoxon signed-rank test.
   * Approximated via normal distribution for n > 10, exact for n ≤ 10.
   */
  pValue: number
  /** True when pValue < 0.05. */
  significant: boolean
}

// ─── Embedder interface ───────────────────────────────────────────────────────

/**
 * Injectable embedding function.
 * Returns a normalised float vector for each input string.
 * Allows mocking in offline tests.
 */
export type EmbedFn = (texts: string[]) => Promise<number[][]>
