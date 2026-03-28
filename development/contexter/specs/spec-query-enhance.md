# Spec: Query Enhancement — F-018, F-019
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

---

## Stack context

**Current query pipeline** (as of audit date):

```
rag/index.ts  RagService.query()
  │
  ├─ 1. rewriteQuery(query, 3, llm)          → [original, v1, v2, v3]  (rewriter.ts)
  │       └─ 1 LLM call, llama-3.1-8b-instant, max_tokens=256
  │
  ├─ 2. embedder.embedBatch([v0,v1,v2,v3])   → 4 embedding vectors     (Jina v4, retrieval.query task)
  │
  ├─ 3. vectorStore.search(vec_i, text_i)    → for each of 4 variants  (vectorstore/index.ts)
  │       └─ parallel pgvector cosine + tsvector FTS → RRF K=60 → HybridSearchResult[]
  │
  ├─ 4. Deduplicate by id, sort by score descending
  │
  ├─ 5. buildContext(allResults, maxTokens)  → context string + sources[]  (context.ts)
  │       └─ token estimation: word_count * 1.3, budget = 3000 tokens
  │
  └─ 6. llm.chat([system, user])             → answer string           (llm.ts)
          └─ 1 LLM call, max_tokens=1024
```

**Key types:**
- `RagQuery`: `{ query, userId?, topK?, scoreThreshold? }`
- `RagAnswer`: `{ answer, sources[], queryVariants[], tokenUsage{embeddingTokens, llmPromptTokens, llmCompletionTokens} }`
- `HybridSearchResult`: `{ id, score, source: "vector"|"fts"|"both", metadata{documentId, userId?, chunkIndex, content} }`
- `LlmService.chat(messages, maxTokens)` returns `{ response, promptTokens, completionTokens }`
- `EmbedderService.embedBatch(texts, options)` returns `{ embeddings[{vector, dimensions, tokenCount}], totalTokens }`

**Current state of relevant subsystems:**
- `vectorstore/hybrid.ts` — `reciprocalRankFusion(vectorResults, ftsResults, topK)`: standard RRF, equal weight per list, score = sum(1/(K+rank+1)). No weighting coefficients.
- `vectorstore/index.ts` — `search()` calls `Promise.all([vector.search, fts.search])` then fuses. `DEFAULT_SCORE_THRESHOLD = 0.3` (known bug F-001: filters everything since RRF max ≈ 0.033; assume fixed before this spec lands, or handle in implementation).
- There is no `rag/classifier.ts`, no `rag/hyde.ts`, no `rag/decomposition.ts` — all three are new files.

---

## F-018: HyDE (Hypothetical Document Embeddings)

### Current state

`rewriteQuery()` in `rag/rewriter.ts` generates 3 query paraphrases via a single LLM call. Each paraphrase stays in "question space" — it is still a query, just worded differently. All 4 embeddings (original + 3 variants) are encoded with `task: "retrieval.query"`, which means they all live in the query side of Jina v4's asymmetric embedding space. Documents are encoded with `task: "retrieval.passage"`. This cross-space comparison is the query-document asymmetry: queries and documents occupy structurally different regions of the embedding manifold.

There is no mechanism to generate a "document space" probe. There is no query classifier to decide when a probe is useful. HyDE adds exactly this: a hypothetical document (passage-like text) that the LLM generates as if it were the answer, embedded with `task: "retrieval.passage"` — the same task used for the actual corpus.

### Implementation

#### New file: `src/services/rag/classifier.ts`

This file is shared between F-018 (HyDE gate) and F-019 (decomposition gate). It contains one exported function and one helper.

```typescript
export interface QueryClassification {
  hydeScore: number        // 0–4: how much HyDE is likely to help
  complexityScore: number  // 0–6: how complex the query is for decomposition
  shouldHyde: boolean      // hydeScore >= HYDE_THRESHOLD (2)
  shouldDecompose: boolean // complexityScore >= COMPLEXITY_THRESHOLD (2)
}

export const HYDE_THRESHOLD = 2
export const COMPLEXITY_THRESHOLD = 2

// NOTE: This is rag/classifier.ts — NOT the same as vectorstore/classifier.ts (F-021).
// F-021 exports classifyQuery() for fusion alpha selection.
// This file exports classifyQueryEnhancement() for HyDE/decomposition gating.
// If both are needed in rag/index.ts, import with distinct names:
//   import { classifyQuery as classifyFusionAlpha } from "../vectorstore/classifier"
//   import { classifyQueryEnhancement } from "./classifier"
export function classifyQueryEnhancement(query: string): QueryClassification {
  const lower = query.toLowerCase()
  const words = query.trim().split(/\s+/)
  const wordCount = words.length

  // --- HyDE signals (does the query benefit from a document-space probe?) ---
  // Signal 1: length > 10 words → suggests open-ended, not keyword lookup
  const longQuery = wordCount > 10 ? 1 : 0
  // Signal 2: question words → open-ended explanatory queries
  const hasQuestionWords = /\b(how|why|what is|what are|explain|describe|compare|summarize|overview|difference)\b/.test(lower) ? 1 : 0
  // Signal 3: not a short proper-noun lookup (short + capitalized = known-item search)
  const isKnownItemSearch = wordCount <= 5 && /[A-Z]/.test(query) ? 1 : 0
  // Signal 4: not quoted (quoted = exact match intent)
  const isQuotedExact = /^["'].*["']$/.test(query.trim()) ? 1 : 0
  // Signal 5: not code/API syntax
  const isCodeSyntax = /[.()[\]{}<>]|->|::/.test(query) ? 1 : 0

  const hydeScore = longQuery + hasQuestionWords - isKnownItemSearch - isQuotedExact - isCodeSyntax
  // Clamp to 0–4 range (negatives become 0)
  const hydeClamped = Math.max(0, Math.min(4, hydeScore))

  // --- Decomposition signals (is the query multi-part?) ---
  // Signal 1: conjunctions / comparisons
  const hasConjunction = /\b(and|or|but|versus|vs\.?|compared? to|in contrast)\b/.test(lower) ? 1 : 0
  // Signal 2: multiple question marks
  const hasMultipleQuestions = (query.match(/\?/g) ?? []).length > 1 ? 1 : 0
  // Signal 3: comparison words
  const hasComparisonWords = /\b(compar|differ|similar|between|both|each|respective)\b/.test(lower) ? 1 : 0
  // Signal 4: temporal ranges
  const hasTemporalRange = /\b(Q[1-4].*Q[1-4]|before.*after|from.*to|trend|over time|year.over.year|month.over.month)\b/i.test(query) ? 1 : 0
  // Signal 5: 2+ distinct entities (capitalized words or quoted terms)
  const entities = (query.match(/\b[A-Z][a-zA-Z]+\b|"[^"]+"/g) ?? [])
  const hasMultipleEntities = new Set(entities).size >= 2 ? 1 : 0
  // Signal 6: long query (> 20 words) suggests multi-part
  const veryLongQuery = wordCount > 20 ? 1 : 0

  const complexityScore = hasConjunction + hasMultipleQuestions + hasComparisonWords + hasTemporalRange + hasMultipleEntities + veryLongQuery

  return {
    hydeScore: hydeClamped,
    complexityScore,
    shouldHyde: hydeClamped >= HYDE_THRESHOLD,
    shouldDecompose: complexityScore >= COMPLEXITY_THRESHOLD,
  }
}
```

**Rules:**
- No LLM calls. Pure regex/heuristics. O(1) per query.
- `shouldHyde` and `shouldDecompose` are independent — a query can trigger both, either, or neither.
- Conservative defaults: score must reach threshold 2 (not 1) to trigger enhancement.

---

#### New file: `src/services/rag/hyde.ts`

```typescript
import type { LlmService } from "../llm"
import type { EmbedderService } from "../embedder"

export interface HydeResult {
  hypotheticalDoc: string
  vector: number[]
  tokenCount: number
}

/**
 * HyDE: generate a hypothetical passage that would answer the query,
 * then embed it with retrieval.passage task (same as corpus documents).
 * This places the probe in document space rather than query space.
 */
export async function generateHyde(
  query: string,
  llm: LlmService,
  embedder: EmbedderService
): Promise<HydeResult> {
  const prompt = `Given the following question, write a short passage (3-5 sentences) that would appear in a knowledge base article answering this question. Write as if you are the author of the source document, not as someone answering a question. Include relevant technical terms and context.

Question: ${query}

Passage:`

  const llmResult = await llm.chat(
    [{ role: "user", content: prompt }],
    200  // 3-5 sentences ≈ 100-200 tokens; cap prevents runaway generation
  )

  const hypotheticalDoc = llmResult.response.trim()

  // CRITICAL: embed with retrieval.passage (not retrieval.query).
  // This places the vector in the same manifold region as corpus documents.
  const embedResult = await embedder.embed(hypotheticalDoc, { task: "retrieval.passage" })

  return {
    hypotheticalDoc,
    vector: embedResult.vector,
    tokenCount: embedResult.tokenCount,
  }
}
```

**Notes:**
- Temperature is not directly exposed by `LlmService.chat()`. The Groq API call in `llm.ts` does not pass `temperature` today. Do not add temperature parameter to `LlmService` for this spec — use model default (Llama 3.1 8B default is 1.0, which provides sufficient diversity for a single document).
- If `llmResult.response` is empty (content filtering or empty choices), `hypotheticalDoc` will be `""`. The caller handles this gracefully (see below).

---

#### Modified file: `src/services/rag/index.ts`

The `query()` method is replaced with this logic:

```typescript
async query(input: RagQuery): Promise<RagAnswer> {
  const { shouldHyde, shouldDecompose } = classifyQueryEnhancement(input.query)

  // F-019: complex path takes priority — decompose first, then sub-queries each use HyDE internally
  if (shouldDecompose) {
    return this.queryDecomposed(input)
  }

  // F-018 + standard path
  return this.queryStandard(input, shouldHyde)
}
```

**Standard path (HyDE-enhanced):**

```typescript
private async queryStandard(input: RagQuery, useHyde: boolean): Promise<RagAnswer> {
  // Run rewrite and HyDE in parallel (zero serial latency increase)
  const [queryVariants, hydeResult] = await Promise.all([
    rewriteQuery(input.query, this.config.queryRewriteCount, this.llm),
    useHyde
      ? generateHyde(input.query, this.llm, this.embedder).catch((err) => {
          console.warn("HyDE generation failed, proceeding with query variants only:", err.message)
          return null
        })
      : Promise.resolve(null),
  ])

  // Embed all query variants
  const queryEmbeddings = await this.embedder.embedBatch(queryVariants, { task: "retrieval.query" })

  // Collect all retrieval signals
  const allResults: HybridSearchResult[] = []
  const seenIds = new Set<string>()

  const searchOptions = {
    topK: input.topK ?? 10,
    scoreThreshold: input.scoreThreshold ?? 0,
    userId: input.userId,
  }

  // Search with each query variant (existing behavior)
  for (let i = 0; i < queryVariants.length; i++) {
    const results = await this.vectorStore.search(
      queryEmbeddings.embeddings[i].vector,
      queryVariants[i],
      searchOptions
    )
    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        allResults.push(result)
      }
    }
  }

  // F-018: HyDE as 4th additive signal (not replacement for any variant)
  // hydeResult.vector is in passage space; pass empty string for FTS (vector-only search)
  if (hydeResult !== null && hydeResult.hypotheticalDoc.length > 0) {
    const hydeResults = await this.vectorStore.search(
      hydeResult.vector,
      "",  // No FTS for HyDE doc — it's a synthetic passage, not a real query
      searchOptions
    )
    for (const result of hydeResults) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        allResults.push(result)
      }
    }
  }

  allResults.sort((a, b) => b.score - a.score)

  const { context, sources } = buildContext(allResults, this.config.maxContextTokens)
  const { answer, promptTokens, completionTokens } = await this.generateAnswer(input.query, context)

  const embeddingTokens = queryEmbeddings.totalTokens + (hydeResult?.tokenCount ?? 0)

  return {
    answer,
    sources,
    queryVariants,
    tokenUsage: {
      embeddingTokens,
      llmPromptTokens: promptTokens,
      llmCompletionTokens: completionTokens,
    },
  }
}
```

**HyDE as 4th additive signal — clarification:**

HyDE is NOT a replacement for any of the 3 query variants. It is a 4th independent retrieval signal. The result set is deduplicated by chunk ID using `seenIds`. Deduplication means:
- If a chunk was already found via query variants, the HyDE search result for that same chunk is skipped.
- If a chunk is found ONLY via HyDE, it is added to the pool.
- All chunks then go through the same score-sorted merge (no RRF re-fusion at this stage — dedup-then-sort, as in the current implementation). This is correct: the per-variant RRF fusion already happened inside `vectorStore.search()`; the outer merge is a simple union with deduplication by ID.

Note: a proper multi-signal RRF across all 4 retrieval lists would require refactoring `vectorStore.search()` to accept multiple vectors. This spec does NOT do that — the current dedup-union approach is preserved. The HyDE vector gets a fresh `vectorStore.search()` call with its own internal RRF, and the resulting chunks are added to the shared pool if not already seen. This is the lowest-risk integration path.

**Fallback:** If `generateHyde()` throws (Groq timeout, API error, content filtering), the `.catch()` converts the error to `null`. The pipeline continues with 3 query variants only — identical to current behavior before F-018.

---

### Files changed

| File | Change |
|---|---|
| `src/services/rag/classifier.ts` | **New.** Query classifier shared by F-018 and F-019 |
| `src/services/rag/hyde.ts` | **New.** HyDE document generation + embedding |
| `src/services/rag/index.ts` | **Modified.** `query()` branches via classifier; new `queryStandard()` private method |

No schema changes. No new environment variables. No new dependencies.

---

### Verification

**Check 1: HyDE is skipped for short keyword queries**

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Redis config"}' | jq '.queryVariants | length'
# Expected: 4 (original + 3 variants, no HyDE debug output)
```

**Check 2: HyDE is triggered for long explanatory queries**

Add a temporary `console.log("HyDE generated:", hydeResult?.hypotheticalDoc?.slice(0, 80))` in `queryStandard()`. Then:

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How does the authentication flow work and what tokens are involved?"}' | jq '.'
# Expected server log: "HyDE generated: <first 80 chars of hypothetical passage>"
```

**Check 3: HyDE fallback on LLM error**

Temporarily inject an error in `generateHyde()` (e.g., throw new Error("test")). Confirm the request still returns a valid answer (not a 500). Remove injection after test.

**Check 4: classifier unit test**

```typescript
import { classifyQueryEnhancement } from "./classifier"

const short = classifyQueryEnhancement("Redis config")
console.assert(short.shouldHyde === false, "short keyword query should NOT hyde")
console.assert(short.shouldDecompose === false, "short keyword query should NOT decompose")

const long = classifyQuery("How does the authentication flow work and what tokens are involved in the process?")
console.assert(long.shouldHyde === true, "long explanatory query SHOULD hyde")

const complex = classifyQuery("Compare Q1 and Q3 revenue and explain the trend between them")
console.assert(complex.shouldDecompose === true, "multi-part query SHOULD decompose")
console.assert(complex.shouldHyde === true, "multi-part query also SHOULD hyde (both flags can be true)")
```

Run: `bun run -e "$(cat verify_classifier.ts)"` or inline as a `/dev` test endpoint.

---

## F-019: Query decomposition

### Current state

`rewriteQuery()` generates 3 paraphrases of the same question. For a query like "Compare Q1 and Q3 revenue and explain the trend", it generates 3 differently-worded versions of the same compound question. All 3 versions search the same broad semantic region. The pipeline generates a single context window from all retrieved chunks and produces one answer. There is no mechanism to:
1. Detect that the query has multiple independent sub-parts requiring separate retrieval.
2. Retrieve targeted context for each sub-part independently.
3. Generate individual sub-answers and synthesize them.

Multi-part queries currently yield incomplete answers because a single retrieval pass rarely covers all required aspects, especially when they live in disjoint document regions.

### Implementation

#### Reuses: `src/services/rag/classifier.ts` (from F-018)

`shouldDecompose` is `complexityScore >= COMPLEXITY_THRESHOLD` (2). The complexity signals are defined in the classifier spec above. No changes to `classifier.ts` needed for F-019 — it was designed for both features.

---

#### New file: `src/services/rag/decomposition.ts`

```typescript
import type { LlmService } from "../llm"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { RagConfig } from "./types"
import { buildContext } from "./context"

export interface SubAnswer {
  subQuestion: string
  answer: string
  sources: import("./types").RagSource[]
}

export interface DecompositionConfig {
  maxSubQuestions: number       // default: 5
  complexityThreshold: number  // default: 2 (matches COMPLEXITY_THRESHOLD in classifier)
}

export const DEFAULT_DECOMPOSITION_CONFIG: DecompositionConfig = {
  maxSubQuestions: 5,
  complexityThreshold: 2,
}

/**
 * Step 1: LLM decomposes the complex query into 2–maxSubQuestions independent sub-questions.
 * Returns parsed sub-questions array. Returns [originalQuery] on parse failure (safe fallback).
 */
export async function decomposeQuery(
  query: string,
  llm: LlmService,
  maxSubQuestions: number = DEFAULT_DECOMPOSITION_CONFIG.maxSubQuestions
): Promise<string[]> {
  const prompt = `You are a search query decomposer for a knowledge base. Break down the complex question into 2-5 independent sub-questions that together cover the full information need.

Rules:
- Each sub-question must be answerable independently from a knowledge base
- Keep ALL proper nouns, brand names, product names, and technical terms EXACTLY as they appear
- If the original question compares entities, create one sub-question per entity
- If the original question asks about a time range, create one sub-question per time period
- If the question asks "explain why" or "explain the trend", add a sub-question specifically for the causal/explanatory aspect
- Do NOT decompose further than necessary -- 2-3 sub-questions is typical, 5 is the maximum
- Return ONLY the sub-questions as a JSON array of strings, no explanations

Question: "${query}"`

  const result = await llm.chat([{ role: "user", content: prompt }], 512)

  try {
    // Extract JSON array from response (LLM may add surrounding text)
    const jsonMatch = result.response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("No JSON array found in decomposition response")

    const parsed = JSON.parse(jsonMatch[0]) as unknown[]
    if (!Array.isArray(parsed)) throw new Error("Parsed result is not an array")

    const subQuestions = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, maxSubQuestions)

    if (subQuestions.length < 2) throw new Error("Fewer than 2 sub-questions parsed")

    return subQuestions
  } catch (err) {
    // Fallback: treat entire query as single question (standard path behavior)
    console.warn("Query decomposition parse failed, falling back to original query:", err)
    return [query]
  }
}

/**
 * Step 2: For each sub-question, retrieve context and generate a sub-answer.
 * All sub-questions are processed in parallel.
 */
export async function answerSubQuestions(
  subQuestions: string[],
  llm: LlmService,
  embedder: EmbedderService,
  vectorStore: VectorStoreService,
  ragConfig: Required<RagConfig>,
  searchOptions: { topK: number; scoreThreshold: number; userId?: string }
): Promise<SubAnswer[]> {
  const subAnswerPromises = subQuestions.map(async (subQuestion): Promise<SubAnswer> => {
    // Embed sub-question (single query, no rewriting — each sub-question is already focused)
    const embedResult = await embedder.embed(subQuestion, { task: "retrieval.query" })

    // Retrieve context for this sub-question
    const results = await vectorStore.search(
      embedResult.vector,
      subQuestion,
      searchOptions
    )

    const { context, sources } = buildContext(results, ragConfig.maxContextTokens)

    if (!context || context.length === 0) {
      return {
        subQuestion,
        answer: "No relevant information found for this aspect.",
        sources: [],
      }
    }

    // Generate focused sub-answer
    const llmResult = await llm.chat([
      {
        role: "user",
        content: `Answer this question based on the provided context: ${subQuestion}\n\nContext:\n${context}`,
      },
    ], 512)

    return {
      subQuestion,
      answer: llmResult.response.trim() || "No answer generated.",
      sources,
    }
  })

  return Promise.all(subAnswerPromises)
}

/**
 * Step 3: Synthesize N sub-answers into one final coherent answer.
 */
export async function synthesizeAnswers(
  originalQuery: string,
  subAnswers: SubAnswer[],
  llm: LlmService
): Promise<{ answer: string; promptTokens: number; completionTokens: number }> {
  const subAnswerBlock = subAnswers
    .map((sa) => `Q: ${sa.subQuestion}\nA: ${sa.answer}`)
    .join("\n\n")

  const prompt = `You are synthesizing a comprehensive answer from sub-answers to the original question.

Original question: "${originalQuery}"

Sub-answers:
${subAnswerBlock}

Rules:
- Combine the sub-answers into a single coherent response that fully addresses the original question
- If sub-answers conflict, note the discrepancy
- If any sub-answer says "not enough information", reflect that gap in your final answer
- Answer in the same language as the original question
- Cite which aspects come from which sub-answers`

  const result = await llm.chat([{ role: "user", content: prompt }], 1024)

  return {
    answer: result.response.trim() || "Could not synthesize a final answer.",
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  }
}
```

---

#### Modified file: `src/services/rag/index.ts` — `queryDecomposed()` private method

```typescript
private async queryDecomposed(input: RagQuery): Promise<RagAnswer> {
  const searchOptions = {
    topK: input.topK ?? 10,
    scoreThreshold: input.scoreThreshold ?? 0,
    userId: input.userId,
  }

  // Step 1: Decompose (1 LLM call)
  const subQuestions = await decomposeQuery(
    input.query,
    this.llm,
    this.config.maxSubQuestions  // see config extension below
  )

  // Fallback: if decomposition returned only the original query, run standard path
  if (subQuestions.length === 1 && subQuestions[0] === input.query) {
    return this.queryStandard(input, classifyQuery(input.query).shouldHyde)
  }

  // Step 2: Retrieve + answer each sub-question in parallel (N LLM calls + N embed + N search)
  const subAnswers = await answerSubQuestions(
    subQuestions,
    this.llm,
    this.embedder,
    this.vectorStore,
    this.config,
    searchOptions
  )

  // Step 3: Synthesize (1 LLM call)
  const { answer, promptTokens, completionTokens } = await synthesizeAnswers(
    input.query,
    subAnswers,
    this.llm
  )

  // Collect all sources (deduplicated by chunkId)
  const allSources: import("./types").RagSource[] = []
  const seenSourceIds = new Set<string>()
  for (const sa of subAnswers) {
    for (const src of sa.sources) {
      if (!seenSourceIds.has(src.chunkId)) {
        seenSourceIds.add(src.chunkId)
        allSources.push(src)
      }
    }
  }

  // tokenUsage: only synthesis LLM tokens are tracked in the main counter.
  // Sub-question LLM tokens are not individually tracked in this version.
  return {
    answer,
    sources: allSources,
    queryVariants: subQuestions,  // surface sub-questions as "variants" for observability
    tokenUsage: {
      embeddingTokens: 0,          // TODO: sum from subAnswers when SubAnswer includes tokenCount
      llmPromptTokens: promptTokens,
      llmCompletionTokens: completionTokens,
    },
  }
}
```

---

#### `RagConfig` extension for decomposition config

In `src/services/rag/types.ts`, add:

```typescript
export interface RagConfig {
  queryRewriteCount?: number
  maxContextTokens?: number
  systemPrompt?: string
  // F-019: decomposition config
  maxSubQuestions?: number       // default: 5
  enableDecomposition?: boolean  // default: true
}

export const DEFAULT_MAX_SUB_QUESTIONS = 5
export const DEFAULT_ENABLE_DECOMPOSITION = true
```

In `RagService` constructor, extend `this.config`:

```typescript
this.config = {
  queryRewriteCount:    deps.config?.queryRewriteCount    ?? DEFAULT_QUERY_REWRITE_COUNT,
  maxContextTokens:     deps.config?.maxContextTokens     ?? DEFAULT_MAX_CONTEXT_TOKENS,
  systemPrompt:         deps.config?.systemPrompt         ?? DEFAULT_SYSTEM_PROMPT,
  maxSubQuestions:      deps.config?.maxSubQuestions      ?? DEFAULT_MAX_SUB_QUESTIONS,
  enableDecomposition:  deps.config?.enableDecomposition  ?? DEFAULT_ENABLE_DECOMPOSITION,
}
```

Update `query()` to respect `enableDecomposition`:

```typescript
async query(input: RagQuery): Promise<RagAnswer> {
  const { shouldHyde, shouldDecompose } = classifyQueryEnhancement(input.query)

  if (this.config.enableDecomposition && shouldDecompose) {
    return this.queryDecomposed(input)
  }

  return this.queryStandard(input, shouldHyde)
}
```

---

### Shared classifier design (F-018 + F-019)

`classifier.ts` is the single file used by both features:

```
classifyQuery(query)
     │
     ├─ hydeScore     (signals: longQuery, questionWords, minus: knownItem, quoted, codeSyntax)
     │       └─ shouldHyde = hydeScore >= 2
     │
     └─ complexityScore (signals: conjunction, multipleQuestions, comparison, temporal, entities, veryLong)
             └─ shouldDecompose = complexityScore >= 2
```

These are independent scores computed in a single function call. A query can score high on both (long multi-part explanatory query), high on one only, or neither. The caller in `index.ts` reads both flags and routes accordingly:
- `shouldDecompose = true` → F-019 path (which internally does NOT call HyDE separately, since each focused sub-question is already short enough to not need it).
- `shouldDecompose = false, shouldHyde = true` → F-018 standard path with HyDE.
- `shouldDecompose = false, shouldHyde = false` → standard path, existing behavior.

---

### Files changed

| File | Change |
|---|---|
| `src/services/rag/classifier.ts` | **New.** Shared classifier (from F-018, no additional changes for F-019) |
| `src/services/rag/decomposition.ts` | **New.** `decomposeQuery`, `answerSubQuestions`, `synthesizeAnswers` |
| `src/services/rag/types.ts` | **Modified.** Add `maxSubQuestions`, `enableDecomposition` to `RagConfig`; add `DEFAULT_MAX_SUB_QUESTIONS`, `DEFAULT_ENABLE_DECOMPOSITION` |
| `src/services/rag/index.ts` | **Modified.** `query()` branches via classifier; `queryDecomposed()` private method; `queryStandard()` private method (refactor of existing logic + HyDE) |
| `src/services/rag/hyde.ts` | **New.** (from F-018, no additional changes for F-019) |

No schema changes. No new environment variables. No new npm packages.

---

### Verification

**Check 1: Multi-part query triggers decomposition**

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare the Q1 and Q3 revenue figures and explain what caused the trend between them"}' \
  | jq '{answer_length: (.answer | length), sub_questions: .queryVariants, source_count: (.sources | length)}'
# Expected:
# - queryVariants contains 2-4 sub-questions (NOT paraphrases of the same question)
# - answer_length > 200 (synthesis is substantive)
# - sub-questions are distinct questions, not paraphrases
```

**Check 2: Simple query is NOT decomposed**

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Redis?"}' \
  | jq '.queryVariants | length'
# Expected: 4 (original + 3 rewrites — standard path, no decomposition)
```

**Check 3: Conjunction trigger**

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the authentication and authorization differences in this system?"}' \
  | jq '.queryVariants'
# Expected: array of 2-3 focused sub-questions
# Example expected output:
# ["What is the authentication mechanism in this system?",
#  "What is the authorization mechanism in this system?",
#  "How do authentication and authorization differ in this system?"]
```

**Check 4: Decomposition fallback (bad LLM output)**

Temporarily modify the decomposition prompt to produce non-JSON output. Confirm:
- The `.catch` path in `decomposeQuery` logs a warning
- The request falls back to `queryStandard` and returns a valid answer (no 500)
- `queryVariants` contains 4 items (rewrite path, not decomposition)

**Check 5: Sub-answer synthesis includes all aspects**

Use a KB that contains separate documents about Q1 and Q3 metrics. Send:

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare Q1 and Q3 performance and explain the trend"}' \
  | jq '.answer'
# Expected: answer contains information about BOTH Q1 AND Q3 (not just one)
# This verifies that decomposition retrieved from both document regions.
```

---

## Acceptance Criteria

| ID | Criterion | How to verify |
|---|---|---|
| AC-1 | HyDE is skipped for queries ≤ 5 words with a proper noun | `classifyQueryEnhancement("Redis config").shouldHyde === false` |
| AC-2 | HyDE is triggered for queries > 10 words with question words | `classifyQueryEnhancement("How does the authentication flow work and what tokens are involved?").shouldHyde === true` |
| AC-3 | HyDE generates a passage embedding with `task: "retrieval.passage"` | Inspect `hyde.ts`: `embedder.embed(hypotheticalDoc, { task: "retrieval.passage" })` |
| AC-4 | HyDE failure does not crash the query pipeline | Force-throw in `generateHyde()`, confirm curl returns 200 with answer |
| AC-5 | HyDE result is 4th additive signal — does not replace any of 3 variants | `seenIds` dedup: 3 variants always searched, HyDE adds new chunks only |
| AC-6 | Decomposition is triggered for multi-part queries with score ≥ 2 | `classifyQueryEnhancement("Compare Q1 and Q3 revenue and explain the trend").shouldDecompose === true` |
| AC-7 | Decomposition is skipped for simple queries | `classifyQueryEnhancement("What is Redis?").shouldDecompose === false` |
| AC-8 | `decomposeQuery` returns 2–5 sub-questions for a compound query | `decomposeQuery("Compare Q1 and Q3 revenue...", llm).length` is 2–5 |
| AC-9 | Sub-questions are retrieved in parallel | `answerSubQuestions` uses `Promise.all` — verify in code |
| AC-10 | Synthesis covers all sub-parts | For a 2-entity query, verify both entities appear in the final answer |
| AC-11 | Decomposition fallback to standard path when parse fails | Inject bad JSON from LLM, confirm `queryVariants.length === 4` in response |
| AC-12 | `enableDecomposition: false` in config bypasses F-019 entirely | Construct `RagService` with `enableDecomposition: false`, send complex query, confirm `queryVariants.length === 4` |
| AC-13 | `classifier.ts` exported from `rag/index.ts` barrel | `import { classifyQuery } from "../services/rag"` works |
| AC-14 | No new npm packages required | `bun install` output unchanged; no new entries in `package.json` |
