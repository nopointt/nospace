# Spec: Fusion — F-007, F-021
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

---

## Stack context

`hybrid.ts` currently implements Reciprocal Rank Fusion (RRF) with a hardcoded `K=60` constant. RRF computes rank-based scores in the range `~0.016–0.033` (two-list max is `2/(60+1) ≈ 0.0328`), completely discarding score magnitude from pgvector cosine similarity and PostgreSQL `ts_rank`. F-007 replaces RRF with Convex Combination (CC) fusion: both result lists are min-max normalized to `[0, 1]` independently, then blended as `score = alpha * norm_vector + (1-alpha) * norm_fts`. This produces scores in the semantically meaningful `[0, 1]` range. F-021 adds a zero-cost heuristic classifier that selects `alpha` per query based on query characteristics (keyword vs. semantic vs. code), replacing the static `alpha=0.5`. F-021 strictly depends on F-007 and must be implemented after it.

---

## F-007: Convex Combination fusion (replace RRF)

### Current state

`vectorstore/hybrid.ts` (full file, 63 lines):

```
import { RRF_K } from "./types"        // RRF_K = 60

export function reciprocalRankFusion(
  vectorResults: SearchResult[],
  ftsResults: SearchResult[],
  topK: number = 10
): HybridSearchResult[] {
  // ranks only — score magnitude discarded
  const rrfScore = 1 / (RRF_K + rank + 1)   // max value ≈ 0.016
  ...
  return fused.filter(...)   // NOTE: filter removed in F-001; topK slice only
}
```

`vectorstore/types.ts` line 35:
```
export const RRF_K = 60
```

`vectorstore/index.ts` line 58:
```
const fused = reciprocalRankFusion(vectorResults, ftsResults, topK)
return fused.filter((r) => r.score >= threshold)
```

The call site in `index.ts` passes `vectorResults` and `ftsResults` (both pre-fetched as `topK * 2` candidates) and applies a threshold filter post-fusion.

### Implementation

**Step 1 — Add constants to `vectorstore/types.ts`**

Remove `RRF_K` and add:

```typescript
// Remove this line:
// export const RRF_K = 60

// Add these:
export const FUSION_ALPHA = 0.5          // default weight for vector channel (0=FTS-only, 1=vector-only)
export const FUSION_ALPHA_KEYWORD = 0.3  // short keyword queries — favor FTS
export const FUSION_ALPHA_SEMANTIC = 0.7 // long semantic queries — favor vector
export const FUSION_ALPHA_CODE = 0.2     // code/API queries — strongly favor FTS
```

Keep `DEFAULT_TOP_K`, `DEFAULT_SCORE_THRESHOLD`, and all interfaces unchanged.

**Step 2 — Rewrite `vectorstore/hybrid.ts` completely**

Replace the entire file with the following:

```typescript
import type { SearchResult, HybridSearchResult } from "./types"
import { FUSION_ALPHA } from "./types"

/**
 * Min-max normalize an array of scores to [0, 1].
 * Edge cases:
 *   - Empty array → return [].
 *   - Single element → return [1.0] (perfect score for uncontested result).
 *   - All scores identical → return array filled with 0.5 (equal weight, avoid 0/0).
 */
function minmaxNormalize(scores: number[]): number[] {
  if (scores.length === 0) return []
  if (scores.length === 1) return [1.0]

  const min = Math.min(...scores)
  const max = Math.max(...scores)

  if (max === min) {
    // All scores identical — assign equal weight rather than 0.0
    return scores.map(() => 0.5)
  }

  return scores.map((s) => (s - min) / (max - min))
}

/**
 * Convex Combination fusion: merges pgvector cosine and FTS ts_rank results
 * into a single ranked list preserving score magnitude.
 *
 * Formula: fused_score = alpha * norm_vector + (1 - alpha) * norm_fts
 *
 * Where norm_vector and norm_fts are min-max normalized to [0, 1].
 * Results appearing in only one list receive 0.0 for the missing channel.
 *
 * @param vectorResults  Results from pgvector cosine search (pre-fetched topK*2).
 * @param ftsResults     Results from PostgreSQL ts_rank FTS search (pre-fetched topK*2).
 * @param topK           Number of results to return.
 * @param alpha          Weight for vector channel. Default: FUSION_ALPHA (0.5).
 *                       Pass from F-021 adaptive classifier to override per query.
 */
export function convexCombinationFusion(
  vectorResults: SearchResult[],
  ftsResults: SearchResult[],
  topK: number = 10,
  alpha: number = FUSION_ALPHA
): HybridSearchResult[] {
  // Edge case: both lists empty
  if (vectorResults.length === 0 && ftsResults.length === 0) {
    return []
  }

  // Edge case: one list empty — normalize the non-empty list and return it
  if (vectorResults.length === 0) {
    const normFts = minmaxNormalize(ftsResults.map((r) => r.score))
    return ftsResults
      .map((r, i) => ({
        id: r.id,
        score: (1 - alpha) * normFts[i],
        source: "fts" as HybridSearchResult["source"],
        metadata: r.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  if (ftsResults.length === 0) {
    const normVec = minmaxNormalize(vectorResults.map((r) => r.score))
    return vectorResults
      .map((r, i) => ({
        id: r.id,
        score: alpha * normVec[i],
        source: "vector" as HybridSearchResult["source"],
        metadata: r.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // Normalize each list independently
  const normVec = minmaxNormalize(vectorResults.map((r) => r.score))
  const normFts = minmaxNormalize(ftsResults.map((r) => r.score))

  // Build lookup maps: id → normalized score
  const vecMap = new Map<string, { normScore: number; metadata: SearchResult["metadata"] }>()
  for (let i = 0; i < vectorResults.length; i++) {
    vecMap.set(vectorResults[i].id, {
      normScore: normVec[i],
      metadata: vectorResults[i].metadata,
    })
  }

  const ftsMap = new Map<string, { normScore: number; metadata: SearchResult["metadata"] }>()
  for (let i = 0; i < ftsResults.length; i++) {
    ftsMap.set(ftsResults[i].id, {
      normScore: normFts[i],
      metadata: ftsResults[i].metadata,
    })
  }

  // Union of all IDs
  const allIds = new Set<string>([...vecMap.keys(), ...ftsMap.keys()])

  const fused: HybridSearchResult[] = []

  for (const id of allIds) {
    const vec = vecMap.get(id)
    const fts = ftsMap.get(id)

    // Missing channel contributes 0.0 (not penalized by normalization range,
    // but absent from that retrieval path)
    const vecScore = vec?.normScore ?? 0.0
    const ftsScore = fts?.normScore ?? 0.0

    const combinedScore = alpha * vecScore + (1 - alpha) * ftsScore

    // Determine source
    let source: HybridSearchResult["source"]
    if (vec && fts) source = "both"
    else if (vec) source = "vector"
    else source = "fts"

    // Prefer vector metadata (has documentId, chunkIndex, content)
    const metadata = (vec?.metadata ?? fts?.metadata)!

    fused.push({ id, score: combinedScore, source, metadata })
  }

  return fused.sort((a, b) => b.score - a.score).slice(0, topK)
}
```

**Step 3 — Update `vectorstore/index.ts`**

3a. Update the import at the top — replace `reciprocalRankFusion` with `convexCombinationFusion`:

```typescript
// Before:
import { reciprocalRankFusion } from "./hybrid"

// After:
import { convexCombinationFusion } from "./hybrid"
```

3b. Update the re-export line:

```typescript
// Before:
export { reciprocalRankFusion } from "./hybrid"

// After:
export { convexCombinationFusion } from "./hybrid"
```

3c. Update the `search` method signature to accept optional `alpha` and pass it through:

```typescript
async search(
  queryVector: number[],
  queryText: string,
  options: SearchOptions = {},
  alpha?: number   // F-021 passes adaptive alpha here; undefined → CC uses FUSION_ALPHA default
): Promise<HybridSearchResult[]> {
  const topK = options.topK ?? DEFAULT_TOP_K
  const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
  const userId = options.userId

  const [vectorResults, ftsResults] = await Promise.all([
    this.vector.search(queryVector, topK * 2, userId),
    this.fts.search(queryText, topK * 2, userId),
  ])

  const fused = convexCombinationFusion(vectorResults, ftsResults, topK, alpha)
  return fused.filter((r) => r.score >= threshold)
}
```

Note: `DEFAULT_SCORE_THRESHOLD` should be `0` (set in F-001). With CC, scores are in `[0, 1]`, so if a future threshold is desired it will be meaningful (e.g., `0.05` to remove near-zero results). For now 0 is correct.

**Step 4 — No changes needed in `rag/index.ts` for F-007 alone**

`rag/index.ts` already calls `this.vectorStore.search(...)` — the new `alpha` parameter is optional with a default, so the call site is backward-compatible. F-021 will add the `alpha` argument in the next feature.

### Files changed

| File | Change |
|---|---|
| `vectorstore/types.ts` | Remove `RRF_K`, add `FUSION_ALPHA`, `FUSION_ALPHA_KEYWORD`, `FUSION_ALPHA_SEMANTIC`, `FUSION_ALPHA_CODE` |
| `vectorstore/hybrid.ts` | Full rewrite: `reciprocalRankFusion` → `convexCombinationFusion` |
| `vectorstore/index.ts` | Update imports, re-export, add `alpha?` param to `search()` |

### Verification

**V-007-1: Scores are in [0, 1] range (not RRF 0.01–0.03)**

```bash
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "what is this document about", "topK": 5}' \
  | jq '.sources[] | .score'
```

Expected: numbers between `0.0` and `1.0`. Before F-007 the scores would be in the `0.01–0.03` range. If the KB is empty, add a document first.

**V-007-2: Both-source results get higher scores than single-source**

```bash
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "topK": 10}' \
  | jq '[.sources[] | {id: .chunkId, score: .score, source: .source}] | sort_by(-.score)'
```

Expected: results with `"source": "both"` tend to appear higher in the list than results with `"source": "vector"` or `"source": "fts"` only, since they accumulate from both normalized channels.

**V-007-3: Unit test — edge cases**

Run the following TypeScript snippet directly with `bun`:

```bash
bun -e "
import { convexCombinationFusion } from './src/services/vectorstore/hybrid'

// Empty both
const r1 = convexCombinationFusion([], [], 10)
console.assert(r1.length === 0, 'empty both')

// Single vector result
const singleVec = [{ id: 'a', score: 0.9, metadata: { documentId: 'd', chunkIndex: 0, content: 'x' } }]
const r2 = convexCombinationFusion(singleVec, [], 10)
console.assert(r2.length === 1, 'single vec length')
console.assert(r2[0].score > 0, 'single vec score > 0')

// All identical scores
const identical = [
  { id: 'a', score: 0.5, metadata: { documentId: 'd', chunkIndex: 0, content: 'x' } },
  { id: 'b', score: 0.5, metadata: { documentId: 'd', chunkIndex: 1, content: 'y' } },
]
const r3 = convexCombinationFusion(identical, [], 10)
console.assert(r3[0].score === r3[1].score, 'identical scores equal')

console.log('All edge cases passed')
"
```

Expected output: `All edge cases passed`

---

## F-021: Adaptive alpha heuristic

### Current state

No classifier exists in the codebase. The `rag/classifier.ts` file referenced in F-018 does not exist yet — F-021 will create `vectorstore/classifier.ts` (closer to its usage) or `rag/classifier.ts` (for shared use with F-018/F-019). Per the implementation plan, F-021 should create `vectorstore/hybrid.ts` additions and `rag/index.ts` changes. This spec places the classifier in `services/vectorstore/classifier.ts` so it is co-located with the fusion logic it parameterizes.

After F-007, the call chain is:
```
rag/index.ts → vectorStore.search(vector, text, options, alpha?)
                  → convexCombinationFusion(vecResults, ftsResults, topK, alpha)
```

F-021 adds a step before `vectorStore.search`:
```
rag/index.ts → classifyQuery(queryText) → alpha
             → vectorStore.search(vector, text, options, alpha)
```

**This depends on F-007 being implemented first.** Without the `alpha` parameter in `VectorStoreService.search()`, F-021 has nowhere to inject the adaptive value.

### Implementation

**Step 1 — Create `vectorstore/classifier.ts`**

```typescript
import { FUSION_ALPHA, FUSION_ALPHA_KEYWORD, FUSION_ALPHA_SEMANTIC, FUSION_ALPHA_CODE } from "./types"

/**
 * Query type classification for adaptive alpha selection in CC fusion.
 *
 * Rules (applied in order — first match wins):
 *
 * | Rule | Condition | Alpha | Rationale |
 * |------|-----------|-------|-----------|
 * | CODE | Contains code indicators (backtick, ::, ->, =>, (), {}, [], import/function/class/def/const/var keywords, URL-like patterns, $ prefix) | 0.2 | Code tokens = exact FTS match >> vector similarity |
 * | KEYWORD | No spaces OR word count <= 3 AND no question words | 0.3 | Short keyword = BM25/FTS wins |
 * | SEMANTIC | Word count >= 10 OR contains question words (how, why, what, explain, compare, describe, difference, relationship) | 0.7 | Long natural language = vector wins |
 * | DEFAULT | Everything else | 0.5 | Balanced; conservative to avoid wrong-direction error |
 *
 * Conservative design: when signal is ambiguous, fall through to DEFAULT (0.5).
 * A wrong alpha is at most ~5% worse than 0.5 (Bruch et al. bound), so err toward center.
 */

const QUESTION_WORDS = new Set([
  "how", "why", "what", "when", "where", "which", "who",
  "explain", "compare", "describe", "difference", "differences",
  "relationship", "between", "versus", "vs",
])

const CODE_PATTERNS = [
  /`[^`]+`/,           // backtick identifier
  /::/,                // namespace separator (C++, Rust, PHP)
  /->/,                // pointer/method arrow
  /=>/,                // fat arrow / lambda
  /\([^)]*\)/,         // function call parens
  /\{[^}]*\}/,         // object/block braces
  /\[[^\]]*\]/,        // array brackets
  /^\$/,               // shell variable prefix
  /import\s+/i,        // import statement
  /function\s+\w/i,    // function keyword
  /class\s+\w/i,       // class keyword
  /def\s+\w/i,         // Python def
  /const\s+\w/i,       // const declaration
  /var\s+\w/i,         // var declaration
  /\w+\.\w+\(\)/,      // method call: obj.method()
  /https?:\/\//,       // URL
  /\w+\/\w+\/\w+/,     // path-like pattern
]

export type QueryType = "code" | "keyword" | "semantic" | "default"

export interface ClassifierResult {
  queryType: QueryType
  alpha: number
  wordCount: number
}

export function classifyQuery(query: string): ClassifierResult {
  const trimmed = query.trim()
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0)
  const wordCount = words.length
  const lower = trimmed.toLowerCase()
  const lowerWords = new Set(lower.split(/\s+/))

  // Rule 1: CODE — check patterns against original query (preserve case for symbols)
  const isCode = CODE_PATTERNS.some((pattern) => pattern.test(trimmed))
  if (isCode) {
    return { queryType: "code", alpha: FUSION_ALPHA_CODE, wordCount }
  }

  // Rule 2: KEYWORD — no spaces OR very short with no question intent
  const hasQuestionWord = QUESTION_WORDS.has(lowerWords.values().next().value) ||
    [...lowerWords].some((w) => QUESTION_WORDS.has(w))

  if (wordCount <= 3 && !hasQuestionWord) {
    return { queryType: "keyword", alpha: FUSION_ALPHA_KEYWORD, wordCount }
  }

  // Rule 3: SEMANTIC — long query OR explicit question intent
  if (wordCount >= 10 || hasQuestionWord) {
    return { queryType: "semantic", alpha: FUSION_ALPHA_SEMANTIC, wordCount }
  }

  // Rule 4: DEFAULT — 4–9 words, no special signals
  return { queryType: "default", alpha: FUSION_ALPHA, wordCount }
}
```

**Step 2 — Update `vectorstore/index.ts` re-export**

Add export for the classifier so `rag/index.ts` can import it without cross-service path jumps:

```typescript
// Add to existing exports in vectorstore/index.ts:
export { classifyQuery } from "./classifier"
export type { ClassifierResult, QueryType } from "./classifier"
```

**Step 3 — Update `rag/index.ts` to call classifier and pass alpha**

3a. Add import at the top of `rag/index.ts`:

```typescript
import { classifyQuery } from "../vectorstore/classifier"
```

3b. Inside the `query` method, add classifier call before the retrieval loop. The classifier runs once per user query (not once per variant — the original query determines alpha for all variants):

```typescript
async query(input: RagQuery): Promise<RagAnswer> {
  // F-021: classify original query to select fusion alpha
  const { alpha } = classifyQuery(input.query)

  const queryVariants = await rewriteQuery(input.query, this.config.queryRewriteCount, this.llm)

  const queryEmbeddings = await this.embedder.embedBatch(
    queryVariants,
    { task: "retrieval.query" }
  )

  const allResults: HybridSearchResult[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < queryVariants.length; i++) {
    const results = await this.vectorStore.search(
      queryEmbeddings.embeddings[i].vector,
      queryVariants[i],
      {
        topK: input.topK ?? 10,
        scoreThreshold: input.scoreThreshold ?? 0,
        userId: input.userId,
      },
      alpha  // F-021: pass adaptive alpha to CC fusion
    )

    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        allResults.push(result)
      }
    }
  }

  // rest of method unchanged ...
```

The `alpha` from `classifyQuery(input.query)` is captured once per `query()` call and passed uniformly to all variant search calls in the loop. This is correct: all variants represent the same user intent, so the same alpha applies.

**Alpha flow through the system:**

```
User query string
    │
    ▼
classifyQuery(query)          ← rag/index.ts, line added by F-021
    │ returns { alpha }
    ▼
vectorStore.search(..., alpha) ← vectorstore/index.ts search() param added by F-007
    │
    ▼
convexCombinationFusion(vecResults, ftsResults, topK, alpha)
    │                                                   ▲
    │                                                   │
    │                  score = alpha * norm_vec + (1 - alpha) * norm_fts
    ▼
HybridSearchResult[]  (scores in [0, 1])
```

### Files changed

| File | Change |
|---|---|
| `vectorstore/classifier.ts` | **New file** — `classifyQuery()` function + types |
| `vectorstore/index.ts` | Add re-exports for classifier |
| `rag/index.ts` | Import `classifyQuery`, call before loop, pass `alpha` to `vectorStore.search()` |

### Verification

**V-021-1: Classifier routes correctly**

```bash
bun -e "
import { classifyQuery } from './src/services/vectorstore/classifier'

const cases = [
  { q: 'python', expected: 'keyword' },
  { q: 'redis', expected: 'keyword' },
  { q: 'authentication error', expected: 'keyword' },
  { q: 'how does authentication work in this system', expected: 'semantic' },
  { q: 'explain the difference between vector and fts search', expected: 'semantic' },
  { q: 'what is the relationship between chunks and documents', expected: 'semantic' },
  { q: 'import { redis } from \"ioredis\"', expected: 'code' },
  { q: 'const db = new Database()', expected: 'code' },
  { q: 'obj.method()', expected: 'code' },
]

let pass = 0
for (const c of cases) {
  const result = classifyQuery(c.q)
  const ok = result.queryType === c.expected
  if (!ok) console.error('FAIL:', c.q, '→', result.queryType, 'expected', c.expected)
  else pass++
}
console.log(pass + '/' + cases.length + ' cases passed')
"
```

Expected: `9/9 cases passed`

**V-021-2: Keyword query produces lower alpha (favors FTS)**

```bash
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "redis cache", "topK": 5}' \
  | jq '.sources[] | .score'
```

Expected: scores in `[0, 1]`. Verify the service starts without error (alpha wires through correctly).

**V-021-3: Semantic query produces higher alpha (favors vector)**

```bash
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "how does the caching layer interact with the embedding pipeline", "topK": 5}' \
  | jq '.sources[] | .score'
```

Expected: scores in `[0, 1]`. No 500 errors.

**V-021-4: Add debug logging (optional, remove after verification)**

To confirm alpha is being applied, temporarily add a log to `rag/index.ts` inside `query()`:

```typescript
const { alpha, queryType } = classifyQuery(input.query)
console.log(`[F-021] query="${input.query.slice(0, 40)}" type=${queryType} alpha=${alpha}`)
```

Expected log line for `"redis cache"`: `[F-021] query="redis cache" type=keyword alpha=0.3`
Expected log line for `"how does auth work"`: `[F-021] query="how does auth work" type=semantic alpha=0.7`

Remove the log line after confirming the behavior. Do not commit it.

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | `convexCombinationFusion` is exported from `vectorstore/hybrid.ts`; `reciprocalRankFusion` is removed | `grep -r "reciprocalRankFusion" src/` → 0 results |
| AC-2 | `RRF_K` constant is removed from `types.ts`; `FUSION_ALPHA`, `FUSION_ALPHA_KEYWORD`, `FUSION_ALPHA_SEMANTIC`, `FUSION_ALPHA_CODE` are present | `grep "FUSION_ALPHA" src/services/vectorstore/types.ts` → 4 lines |
| AC-3 | Query scores are in `[0.0, 1.0]` range | V-007-1 curl: `jq '.sources[] | .score'` all values ≤ 1.0 |
| AC-4 | Empty result lists handled (both empty, one empty) | V-007-3 bun edge case test: `All edge cases passed` |
| AC-5 | Single-result list normalized to score > 0 | V-007-3 bun: `single vec score > 0` assertion passes |
| AC-6 | All-identical scores produce equal output scores | V-007-3 bun: `identical scores equal` assertion passes |
| AC-7 | `classifyQuery("redis cache").queryType === "keyword"` | V-021-1: `9/9 cases passed` |
| AC-8 | `classifyQuery("how does auth work").queryType === "semantic"` | V-021-1: included in cases |
| AC-9 | `classifyQuery("import { foo } from 'bar'").queryType === "code"` | V-021-1: included in cases |
| AC-10 | `alpha` flows from `classifyQuery` → `vectorStore.search()` → `convexCombinationFusion()` without type errors | `bun build src/index.ts` (or equivalent) → 0 TypeScript errors |
| AC-11 | No regression: existing `RagService.query()` still returns `answer` + `sources` | V-021-2 and V-021-3 curl: valid JSON response, no 500 |

---

## Implementation order

1. Implement F-007 first (steps 1–4 above).
2. Verify AC-1 through AC-6.
3. Implement F-021 (steps 1–3 above).
4. Verify AC-7 through AC-11.

F-021 cannot be implemented before F-007 because the `alpha` parameter in `VectorStoreService.search()` does not exist until F-007 Step 3 adds it.
