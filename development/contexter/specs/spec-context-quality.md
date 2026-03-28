# Spec: Context Quality — F-008, F-010
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

---

## Stack context

- Runtime: Bun on Hetzner CAX11 (ARM64, 4 GB RAM)
- API: Hono
- DB: PostgreSQL 16 + pgvector
- Embeddings: Jina v4 (`jina-embeddings-v4`, 1024-dim)
- Source root: `src/`
- Key env var already wired: `JINA_API_KEY` (confirmed in `src/types/env.ts` and `src/index.ts`)

---

## F-008: MMR context diversity

### Current state

`rag/context.ts` — `buildContext` is a greedy linear pass:

```typescript
// lines 17–33 of context.ts
for (const result of results) {
  const chunkTokens = estimateTokens(result.metadata.content)
  if (currentTokens + chunkTokens > maxTokens && parts.length > 0) {
    break
  }
  parts.push(`[Source ${parts.length + 1}]\n${result.metadata.content}`)
  sources.push({ ... })
  currentTokens += chunkTokens
}
```

The caller (`rag/index.ts` line 75) passes `allResults` sorted by descending RRF score:

```typescript
allResults.sort((a, b) => b.score - a.score)
const { context, sources } = buildContext(allResults, this.config.maxContextTokens)
```

**Problem:** Top-K chunks from the same document always have consecutive high RRF scores (they all matched the query). The greedy loop fills the token budget with 3–5 chunks from the same document before reaching other documents. Result: semantically redundant context, fewer unique sources.

**Key fact — embeddings at assembly time:** `HybridSearchResult` does **not** carry a `vector` field — only `id`, `score`, `source`, and `metadata` (which contains `content`, `documentId`, `userId`, `chunkIndex`). Cosine-similarity-based MMR requires embeddings. Since they are not available at context assembly time without an extra API call, the implementation uses the **document-level cap fallback** (see F-008 plan note: "captures ~60% of diversity benefit at zero cost").

### Implementation

#### Constants — add to `rag/types.ts`

```typescript
export const MMR_MAX_CHUNKS_PER_DOCUMENT = 3
```

#### Rewrite `buildContext` in `rag/context.ts`

Replace the existing function entirely. New signature is backwards-compatible (same parameters, same return type).

**Algorithm (document-level cap fallback):**

1. Iterate `results` in score order (caller already sorts descending — do not re-sort inside `buildContext`).
2. Maintain a `Map<string, number>` of `documentId → chunksSelected`.
3. For each candidate chunk:
   a. If `documentId` already has `MMR_MAX_CHUNKS_PER_DOCUMENT` chunks selected → skip (diversity cap).
   b. If adding `chunkTokens` would exceed `maxTokens` and at least one chunk is already selected → stop.
   c. Otherwise → include, increment the doc counter, accumulate tokens.
4. Return `{ context, sources }` as before.

**Full replacement for `rag/context.ts`:**

```typescript
import type { HybridSearchResult } from "../vectorstore/types"
import type { RagSource } from "./types"
import { DEFAULT_MAX_CONTEXT_TOKENS, MMR_MAX_CHUNKS_PER_DOCUMENT } from "./types"

/**
 * Build context string from search results using document-level diversity cap.
 *
 * F-008: MMR fallback — no embeddings available at assembly time, so we apply
 * maxChunksPerDocument=3 cap as a proxy for diversity. Captures ~60% of
 * full MMR benefit at zero cost.
 *
 * Results must be pre-sorted by descending score (RRF or reranker score).
 */
export function buildContext(
  results: HybridSearchResult[],
  maxTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): { context: string; sources: RagSource[] } {
  const sources: RagSource[] = []
  const parts: string[] = []
  let currentTokens = 0
  const docChunkCount = new Map<string, number>()

  for (const result of results) {
    const docId = result.metadata.documentId
    const docCount = docChunkCount.get(docId) ?? 0

    // Diversity cap: skip if this document already contributed MMR_MAX_CHUNKS_PER_DOCUMENT chunks
    if (docCount >= MMR_MAX_CHUNKS_PER_DOCUMENT) {
      continue
    }

    const chunkTokens = estimateTokens(result.metadata.content)

    // Token budget: stop if adding this chunk would overflow (only after at least one chunk selected)
    if (currentTokens + chunkTokens > maxTokens && parts.length > 0) {
      break
    }

    parts.push(`[Source ${parts.length + 1}]\n${result.metadata.content}`)
    sources.push({
      chunkId: result.id,
      documentId: docId,
      content: result.metadata.content,
      score: result.score,
      source: result.source,
    })
    currentTokens += chunkTokens
    docChunkCount.set(docId, docCount + 1)
  }

  return {
    context: parts.join("\n\n"),
    sources,
  }
}

/**
 * Token estimation: ~1.3 tokens per word (English average).
 * P4-005: previous multiplier of 1.0 undercounted by ~30%.
 * F-002 (BPE tokenizer) will replace this when implemented.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.3)
}
```

**No changes to `rag/index.ts` for F-008** — the caller already sorts `allResults` descending before calling `buildContext`. The new implementation is a drop-in replacement.

### Files changed

| File | Change |
|---|---|
| `src/services/rag/types.ts` | Add `export const MMR_MAX_CHUNKS_PER_DOCUMENT = 3` |
| `src/services/rag/context.ts` | Full rewrite — replace `buildContext` with diversity-capped version |

### Verification

**1. Unit check — diversity is applied:**
```bash
# Start the server locally
cd /path/to/contexter && bun run src/index.ts &

# Upload a document that has multiple pages/sections (any PDF or long text with repeated terminology)
# Then query it — observe sources in response: should see documentId spread across results, not all same doc

curl -s -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "your repeated keyword", "topK": 10}' \
  | jq '.sources | group_by(.documentId) | map({doc: .[0].documentId, count: length})'
```

Expected: no single documentId appears more than 3 times in the sources array.

**2. Regression check — response still has sources:**
```bash
curl -s -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "any query matching your KB"}' \
  | jq '.sources | length'
```

Expected: integer > 0 (not 0, not error).

---

## F-010: Jina Reranker v3

### Current state

In `rag/index.ts`, after collecting results from all query variants and deduplicating:

```typescript
// lines 65–74 of rag/index.ts
for (const result of results) {
  if (!seenIds.has(result.id)) {
    seenIds.add(result.id)
    allResults.push(result)
  }
}

allResults.sort((a, b) => b.score - a.score)   // ← reranker replaces this sort
const { context, sources } = buildContext(allResults, this.config.maxContextTokens)
```

There is no reranking step. The final ordering is pure RRF score. The Jina Reranker v3 cross-encoder must be inserted here — after dedup, before `buildContext`.

**Dependency note:** The plan lists F-007 (CC fusion / score-based fusion) as a prerequisite because better fusion candidates improve reranker input. However F-010 is independently implementable: it works on any candidate list regardless of how fusion was done. The reranker will still improve over raw RRF ordering. Implement F-010 standalone; when F-007 lands, the reranker automatically benefits.

### Implementation

#### Step 1 — New file: `src/services/reranker.ts`

This is a self-contained module. `RagService` will instantiate it.

```typescript
/**
 * Jina Reranker v3 — cross-encoder post-fusion reranking.
 * F-010: insert after dedup+sort, before buildContext.
 *
 * API: POST https://api.jina.ai/v1/rerank
 * Auth: Bearer token from JINA_API_KEY (same key as embeddings)
 * Latency: ~188ms per call
 * Cost: $0.02 / 1K searches
 */

export interface RerankerConfig {
  apiKey: string
  enabled?: boolean          // default: true; set false to disable at runtime
  timeoutMs?: number         // default: 3000
  minCandidates?: number     // default: 2; skip rerank if fewer candidates
}

export interface RerankCandidate {
  id: string
  text: string
  originalScore: number
}

export interface RerankResult {
  id: string
  relevanceScore: number     // cross-encoder score from Jina, range 0–1
  originalScore: number      // preserved for fallback / debugging
}

// --- Jina API wire types ---

interface JinaRerankRequest {
  model: string
  query: string
  documents: string[]
  top_n: number
  return_documents: false    // we already have the texts; saves response size
}

interface JinaRerankResponseResult {
  index: number
  relevance_score: number
  document?: { text: string }  // present only if return_documents: true
}

interface JinaRerankResponse {
  results: JinaRerankResponseResult[]
  usage: {
    total_tokens: number
    prompt_tokens: number
  }
}

// --- Constants ---

const JINA_RERANK_URL = "https://api.jina.ai/v1/rerank"
const JINA_RERANK_MODEL = "jina-reranker-v3"

export const RERANK_ENABLED = true
export const RERANK_TIMEOUT_MS = 3000
export const RERANK_MIN_CANDIDATES = 2

// --- RerankerService ---

export class RerankerService {
  private apiKey: string
  private enabled: boolean
  private timeoutMs: number
  private minCandidates: number

  constructor(config: RerankerConfig) {
    this.apiKey = config.apiKey
    this.enabled = config.enabled ?? RERANK_ENABLED
    this.timeoutMs = config.timeoutMs ?? RERANK_TIMEOUT_MS
    this.minCandidates = config.minCandidates ?? RERANK_MIN_CANDIDATES
  }

  /**
   * Rerank candidates by relevance to query.
   * Returns results sorted by descending relevanceScore.
   * On any error or if disabled: returns candidates sorted by originalScore (fallback).
   */
  async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    // Passthrough: disabled or too few candidates
    if (!this.enabled || candidates.length < this.minCandidates) {
      return this.fallbackSort(candidates)
    }

    const requestBody: JinaRerankRequest = {
      model: JINA_RERANK_MODEL,
      query,
      documents: candidates.map((c) => c.text),
      top_n: candidates.length,  // rerank all candidates; caller controls final topK
      return_documents: false,
    }

    let response: Response
    try {
      response = await fetch(JINA_RERANK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[reranker] API call failed (fallback to RRF order): ${msg}`)
      return this.fallbackSort(candidates)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.warn(`[reranker] API error ${response.status} (fallback to RRF order): ${errorText}`)
      return this.fallbackSort(candidates)
    }

    let json: JinaRerankResponse
    try {
      json = (await response.json()) as JinaRerankResponse
    } catch (e) {
      console.warn(`[reranker] Response parse failed (fallback to RRF order): ${e}`)
      return this.fallbackSort(candidates)
    }

    // Map index positions back to candidate ids
    const reranked = json.results.map((r) => ({
      id: candidates[r.index].id,
      relevanceScore: r.relevance_score,
      originalScore: candidates[r.index].originalScore,
    }))

    // Sort descending by cross-encoder score
    return reranked.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private fallbackSort(candidates: RerankCandidate[]): RerankResult[] {
    return [...candidates]
      .sort((a, b) => b.originalScore - a.originalScore)
      .map((c) => ({
        id: c.id,
        relevanceScore: c.originalScore,  // use RRF score as proxy
        originalScore: c.originalScore,
      }))
  }
}
```

#### Step 2 — Widen retrieval in `rag/index.ts`

Currently `topK` defaults to 10 (from caller) and each variant fetches `topK` results. To give the reranker a meaningful candidate pool, widen vector/FTS retrieval to `topK * 2`.

In `RagService.query`, change the search call:

```typescript
// BEFORE (line 58–62 of rag/index.ts):
const results = await this.vectorStore.search(
  queryEmbeddings.embeddings[i].vector,
  queryVariants[i],
  {
    topK: input.topK ?? 10,
    ...
  }
)

// AFTER:
const requestedTopK = input.topK ?? 10
const fetchTopK = requestedTopK * 2   // widen for reranker
const results = await this.vectorStore.search(
  queryEmbeddings.embeddings[i].vector,
  queryVariants[i],
  {
    topK: fetchTopK,
    scoreThreshold: input.scoreThreshold ?? 0,
    userId: input.userId,
  }
)
```

#### Step 3 — Wire reranker into `RagService`

**Add to `RagServiceDeps` interface:**

```typescript
export interface RagServiceDeps {
  llm: LlmService
  embedder: EmbedderService
  vectorStore: VectorStoreService
  reranker?: RerankerService     // optional — graceful degradation if not provided
  config?: RagConfig
  docsMeta?: string
}
```

**Add to `RagService` constructor** (store as private field):

```typescript
private reranker: RerankerService | null

// in constructor:
this.reranker = deps.reranker ?? null
```

**Replace the sort+buildContext block** in `RagService.query`:

```typescript
// BEFORE (lines 73–75 of rag/index.ts):
allResults.sort((a, b) => b.score - a.score)
const { context, sources } = buildContext(allResults, this.config.maxContextTokens)

// AFTER:
let orderedResults: HybridSearchResult[]

if (this.reranker !== null) {
  const candidates: RerankCandidate[] = allResults.map((r) => ({
    id: r.id,
    text: r.metadata.content,
    originalScore: r.score,
  }))
  const reranked = await this.reranker.rerank(input.query, candidates)

  // Rebuild HybridSearchResult array in reranked order, updating score to relevanceScore
  const resultById = new Map(allResults.map((r) => [r.id, r]))
  orderedResults = reranked
    .map((r) => {
      const original = resultById.get(r.id)
      if (!original) return null
      return { ...original, score: r.relevanceScore }
    })
    .filter((r): r is HybridSearchResult => r !== null)
} else {
  // Fallback: original RRF sort
  orderedResults = [...allResults].sort((a, b) => b.score - a.score)
}

const { context, sources } = buildContext(orderedResults, this.config.maxContextTokens)
```

**Import `RerankCandidate` and `RerankerService` at top of `rag/index.ts`:**

```typescript
import { RerankerService } from "../reranker"
import type { RerankCandidate } from "../reranker"
```

#### Step 4 — Instantiate reranker in `routes/query.ts`

```typescript
// Add import at top:
import { RerankerService } from "../services/reranker"

// In the query handler, after `const llm = new LlmService(...)`:
const reranker = new RerankerService({ apiKey: env.JINA_API_KEY })
const rag = new RagService({ llm, embedder, vectorStore, reranker, docsMeta })
```

No new env var needed — `JINA_API_KEY` is already validated at startup and available on `env`.

#### Optional: env-var override for RERANK_ENABLED

If runtime toggle is needed, add to `src/index.ts` init block:

```typescript
// After existing env validation:
const rerankEnabled = process.env.RERANK_ENABLED !== "false"  // default: true
```

Pass as `enabled: rerankEnabled` to `RerankerService` constructor. This allows disabling without redeploy.

### Files changed

| File | Change |
|---|---|
| `src/services/reranker.ts` | **New file** — full `RerankerService` implementation |
| `src/services/rag/index.ts` | Add `reranker` field to `RagServiceDeps`; widen `fetchTopK = topK * 2`; replace sort with reranker call |
| `src/routes/query.ts` | Instantiate `RerankerService` and pass to `RagService` |

### Verification

**1. Reranker API connectivity:**
```bash
curl -s -X POST https://api.jina.ai/v1/rerank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat ~/.tLOS/jina-key 2>/dev/null || echo $JINA_API_KEY)" \
  -d '{
    "model": "jina-reranker-v3",
    "query": "what is contexter",
    "documents": ["Contexter is a RAG service.", "Unrelated document about cats.", "Knowledge base API for retrieval."],
    "top_n": 3,
    "return_documents": false
  }' | jq '.results | sort_by(-.relevance_score) | .[] | {index, score: .relevance_score}'
```

Expected: index 0 ("Contexter is a RAG service.") and index 2 ("Knowledge base API") score higher than index 1 ("cats"). Reranked order differs from original order (0, 1, 2 becomes something like 0, 2, 1).

**2. End-to-end reranking fires during query:**

Add a temporary log line in `reranker.ts` inside `rerank()` before the fetch:
```typescript
console.log(`[reranker] reranking ${candidates.length} candidates for query: "${query.slice(0, 50)}"`)
```

Then:
```bash
# Run server, observe logs during a query:
curl -s -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "test query", "topK": 5}'
```

Expected log line: `[reranker] reranking N candidates for query: "test query"` where N = 10 (5 * 2 widened, deduplicated).

**3. Fallback path works (reranker disabled):**
```bash
# Set RERANK_ENABLED=false in .env, restart, run query
# Expected: no [reranker] log, sources still returned, no 500 error
RERANK_ENABLED=false bun run src/index.ts &
curl -s -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "test"}' | jq '.sources | length'
```

Expected: sources length > 0, no error.

**4. Fallback on API error:**

Temporarily set `JINA_API_KEY=invalid_key`, run a query. Expected: warning log `[reranker] API error 401 (fallback to RRF order)` and query still returns sources (fallback sort applied).

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | No single document contributes more than 3 chunks to context | `jq '.sources | group_by(.documentId) | map(select(length > 3)) | length == 0'` on query response |
| AC-2 | Sources array is non-empty after F-008 rewrite | `jq '.sources | length > 0'` on any query with matching KB content |
| AC-3 | `buildContext` accepts same parameters as before (no caller changes required) | Inspect function signature in `context.ts` — same `(results, maxTokens?)` |
| AC-4 | Jina Reranker v3 API is called during query with `jina-reranker-v3` model | Observe `[reranker]` log line during query, or capture HTTP traffic |
| AC-5 | Reranked order can differ from RRF order | curl test in Verification §1 shows reranked index ≠ input order |
| AC-6 | Reranker fallback on API error returns valid sources | Set invalid key, query succeeds with warning log (Verification §4) |
| AC-7 | Retrieval widened to `topK * 2` when reranker is active | Add temporary log: `console.log('fetchTopK:', fetchTopK)` — confirm 10 when topK=5 |
| AC-8 | `RERANK_ENABLED=false` disables reranker cleanly | Verification §3 — no reranker call, normal response |
| AC-9 | `RerankCandidate.text` uses chunk content, not chunk id | Code inspection: `text: r.metadata.content` in `rag/index.ts` |
| AC-10 | Scores in sources reflect reranker's relevanceScore after F-010 | `jq '.sources[0].score'` returns float in 0–1 range (cross-encoder score) when reranker enabled |
