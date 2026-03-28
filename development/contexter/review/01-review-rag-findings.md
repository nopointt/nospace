I have now read every file in scope. Let me proceed with the systematic review against each checklist item.

---

## RAG Pipeline Architecture Review -- Contexter

---

### 1. Data Flow Integrity

#### Pipeline Flow vs. Documentation

The documented flow (shared context) is: `classify -> route -> retrieve -> rank -> answer -> cite -> verify -> confidence -> abstention`. The actual implementation in `queryStandard()` (lines 72-172 of `rag/index.ts`) follows this sequence faithfully:

1. `classifyQueryEnhancement()` -- gate (called in `query()` line 60)
2. `classifyQuery()` -- adaptive alpha (line 77)
3. `rewriteQuery()` + `generateHyde()` in parallel (lines 80-88)
4. `embedBatch()` (line 90)
5. `fetchResults()` -- vectorStore.search with CC fusion (line 95)
6. HyDE additive results (lines 98-112)
7. `rankResults()` -- reranker (line 115)
8. `resolveParents()` (line 117)
9. `buildContext()` (line 118)
10. `generateAnswer()` (line 124)
11. `parseGroundingJson()` (line 136)
12. `buildCitations()` (line 138)
13. `verifyClaimsNli()` + `computeFaithfulnessNli()` in parallel (lines 142-145)
14. `assembleConfidence()` (line 148)
15. Abstention check (lines 150-154)

Flow matches the documented architecture.

#### `RagAnswer` Consistency Across Paths

Comparing `queryStandard`, `queryDecomposed`, and `queryStream`:

---

### [MEDIUM] -- queryDecomposed omits NLI citation verification

**File:** `src/services/rag/index.ts:236`
**Category:** correctness
**Description:** In `queryDecomposed()`, citations are built via `buildCitations(cleanAnswer, allSources)` at line 236 but are never passed through `verifyClaimsNli()`. The standard path runs NLI verification on every citation (lines 142-144), but the decomposed path skips this entirely. Citations returned from the decomposed path will never have `nliScore` or `nliVerified` fields populated, creating inconsistent data for downstream consumers (API responses, evaluation).
**Recommendation:** After building citations in the decomposed path, run `verifyClaimsNli()` the same way as in `queryStandard()`. This can run in parallel with `computeFaithfulnessNli()` which is already called at line 228:
```typescript
const rawCitations = buildCitations(cleanAnswer, allSources)
const [{ verifiedCitations }, _] = await Promise.all([
  this.verifyClaimsNli(rawCitations, allSources, cleanAnswer),
  // wholeFaithfulness already computed above
])
```

---

### [MEDIUM] -- queryDecomposed reports zero for all latency and embedding metrics

**File:** `src/services/rag/index.ts:244-252`
**Category:** maintainability
**Description:** The decomposed path hardcodes `retrievalLatencyMs: 0`, `generationLatencyMs: 0`, `embeddingL2NormMean: 0`, and `embeddingTokens: 0` in the return object (lines 244-252). The standard path carefully instruments all four of these. For any observability or monitoring that relies on `RagAnswer` fields, the decomposed path produces meaningless data. The `embeddingTokens: 0` is acknowledged with a TODO comment (line 244) but the latency and L2 norm fields are silently zeroed with no comment.
**Recommendation:** Instrument the decomposed path: wrap the main computation in timing calls (`Date.now()` at start/end), and accumulate embedding token counts from sub-answer embedding calls. If this is intentionally deferred, add explicit TODO comments for each zeroed field.

---

### [HIGH] -- buildAnswerMessages double-wraps context when context is non-empty

**File:** `src/services/rag/index.ts:486`
**Category:** correctness
**Description:** `buildAnswerMessages()` on line 486 checks `if (context.length > 0)` and uses the raw `context` parameter. But when `context.length === 0`, it falls back to `this.buildFullContext(context)` which prepends `docsMeta`. This is logically inverted: when there IS context, `docsMeta` is not prepended; when there is NO context, `docsMeta` is prepended. However, the caller `generateAnswer()` (line 457) already calls `buildFullContext(context)` and passes its result as the `context` argument to `buildAnswerMessages()`. This means `buildAnswerMessages` receives the ALREADY-processed full context (with docsMeta). The `else` branch on line 486 would call `buildFullContext("")` on an already-full-context string -- but this path is only reached when the already-built fullContext is empty, so `buildFullContext("")` just returns `docsMeta` alone, which is correct-ish but confusing. The real bug is that `queryStream()` (line 278) calls `this.buildAnswerMessages(input.query, context)` with the RAW context from `buildContext()`, NOT the pre-processed `buildFullContext()` result. This means streaming queries NEVER include `docsMeta` in the prompt when context is non-empty.
**Recommendation:** Normalize the contract: `buildAnswerMessages` should always call `buildFullContext(context)` internally, or callers should always pass pre-processed context. Currently `generateAnswer()` pre-processes but `queryStream()` does not.

---

### 2. Feature Interaction Correctness

---

### [HIGH] -- HyDE search sends empty FTS text, defeating the fusion alpha weighting

**File:** `src/services/rag/index.ts:103`
**Category:** correctness
**Description:** When HyDE results are fetched (line 101-106), the FTS text argument is passed as `""` (empty string). Looking at the `VectorStoreService.search()` implementation, it runs both `vector.search()` and `fts.search()` in parallel, then fuses them via `convexCombinationFusion()`. An empty FTS query will produce zero FTS results, which means the CC fusion for HyDE will only have vector scores. The `alpha` parameter is passed (line 105), but with no FTS results to fuse, the fusion degenerates to vector-only regardless of alpha. While the comment says "No FTS for HyDE -- synthetic passage, not a real query", this contradicts passing `alpha` to the search call. The alpha parameter is meaningless when one side produces no results.
**Recommendation:** Either (a) use the original query text for FTS in HyDE search to actually leverage the fusion, or (b) use `vectorStore.searchVector()` directly instead of the hybrid `search()` to avoid the unnecessary FTS call and the misleading alpha parameter. Option (b) is cleaner and avoids a wasted FTS query to Postgres.

---

### [LOW] -- Grounding JSON line with citation markers would create false citations if parse fails

**File:** `src/services/rag/index.ts:136-138`
**Category:** correctness
**Description:** The order of `parseGroundingJson()` then `buildCitations()` (lines 136-138) is correct -- the JSON line is stripped before citation parsing runs. However, if the LLM includes `[N]` markers within the grounding JSON line (e.g., `{"grounding":"high","supported_claims":3,"total_claims":3} [1][2]`) and the JSON parse SUCCEEDS, the line is stripped properly. But if the JSON line contains valid bracket-number patterns AND the parse fails (falls through to the catch block returning `rawAnswer` unchanged), those false markers would survive into `buildCitations()`. This is a theoretical edge case given the current prompt design.
**Recommendation:** No action needed unless observed in production. The risk is negligible given the JSON-only-last-line parsing approach.

---

### [MEDIUM] -- decomposition sub-answer prompt lacks grounding JSON instruction

**File:** `src/services/rag/decomposition.ts:109-114`
**Category:** correctness
**Description:** In `answerSubQuestions()` (line 109), the LLM prompt for each sub-question is a minimal "Answer this question based on the provided context" message with no system prompt. The `DEFAULT_SYSTEM_PROMPT` (types.ts:82-99) includes the grounding JSON instruction, but it is NOT included in sub-question answering. This means sub-answers do not produce grounding JSON. Then `synthesizeAnswers()` (line 129) uses yet another prompt without grounding JSON instruction. The synthesized answer IS then passed through `parseGroundingJson()` (index.ts:224), but since the synthesis prompt has no grounding instruction, the LLM will never produce a grounding JSON line. Therefore, `groundingScore` will always be `undefined` for decomposed queries, causing the confidence score to fall back to Tier 1 only (line 199 of confidence.ts) -- unless NLI is available, in which case it jumps to `0.30 * t1 + 0.50 * faithfulness` (line 193), skipping the 0.20 grounding weight entirely.
**Recommendation:** Add the grounding JSON instruction to the synthesis prompt in `synthesizeAnswers()`, similar to `DEFAULT_SYSTEM_PROMPT`. This ensures Tier 2 signals are available for the decomposed path.

---

### [MEDIUM] -- assembleConfidence groundingScore === 0.0 check uses strict equality on float

**File:** `src/services/rag/confidence.ts:150`
**Category:** correctness
**Description:** Line 150 checks `if (groundingScore === 0.0)` for the "none" grounding hard override. The grounding map on line 70 maps `"none"` to `0.0`. Because this value is set via `map[parsed.grounding]`, it will indeed be exactly `0.0` (not a float arithmetic result). However, if any future code path computes a grounding score via arithmetic that is approximately zero but not exactly `0.0`, this check would miss it. More importantly, when `groundingScore` is `undefined` (parse failed or decomposed path), `undefined === 0.0` is `false`, which is correct behavior.
**Recommendation:** Consider using `groundingScore !== undefined && groundingScore <= 0.0` for robustness, or document that the value is always one of the four discrete map values.

---

### 3. Edge Cases

---

### [HIGH] -- Empty query string flows through entire pipeline unchecked

**File:** `src/services/rag/index.ts:59`
**Category:** correctness
**Description:** The `query()` method (line 59) accepts `input.query` without any validation. An empty string `""` would: (1) pass through `classifyQueryEnhancement("")` which returns `shouldHyde: false, shouldDecompose: false`; (2) enter `queryStandard`; (3) be sent to `rewriteQuery("", 3, llm)` which will ask the LLM to rewrite an empty query; (4) the empty string and its "rewrites" would be embedded and searched. This wastes LLM and embedding API calls on garbage input and may produce unpredictable results. While input validation may be the responsibility of the route layer (noted as out of scope for this review), the `RagService` itself should defend against empty/whitespace queries at its boundary.
**Recommendation:** Add a guard at the top of `query()`:
```typescript
if (!input.query || input.query.trim().length === 0) {
  return { answer: "Please provide a question.", sources: [], citations: [], ... }
}
```

---

### [MEDIUM] -- LLM returns empty string in generateAnswer, but confidence still computes on stale sources

**File:** `src/services/rag/index.ts:124-148`
**Category:** correctness
**Description:** If the LLM returns an empty string in `generateAnswer()` (the `LlmService` returns `response: ""` on empty choices, llm.ts:203), the `rawAnswer` is `""`. Then `parseGroundingJson("")` returns `{ answer: "", groundingScore: undefined }`. `buildCitations("", sources)` returns `[]`. `computeFaithfulnessNli(context, "")` sends an empty hypothesis to the NLI sidecar, which would produce a score for the empty string against the context -- semantically meaningless. `assembleConfidence()` then runs on real sources with a potentially non-undefined faithfulness score for an empty answer. The final `confidence.level` might not be "insufficient" if retrieval scores were high, resulting in an empty answer being returned to the user without abstention.
**Recommendation:** After `generateAnswer()`, check if `rawAnswer.trim()` is empty and short-circuit to the abstention path, or treat empty LLM output as an error condition.

---

### [MEDIUM] -- NLI faithfulness computed on truncated context may miss key supporting evidence

**File:** `src/services/rag/confidence.ts:97-98`
**Category:** correctness
**Description:** `computeFaithfulnessNli()` truncates context to 1500 characters and answer to 500 characters (lines 97-98) to stay within the T5-base 2K token limit. But `DEFAULT_MAX_CONTEXT_TOKENS` is 3000 tokens (types.ts:80), meaning the actual context passed to the LLM for answer generation can be much longer. When the context is truncated, the NLI score only measures faithfulness against the first ~375 tokens of context, potentially missing key supporting evidence from later chunks. If the LLM draws its answer primarily from chunks positioned after the truncation point, the NLI score will be artificially low, potentially triggering false abstention (the 0.2 threshold on confidence.ts:161).
**Recommendation:** Consider splitting the answer into claims (using `splitIntoClaims()` from citations.ts) and scoring each claim against all source chunks individually, taking the max NLI score per claim. Alternatively, increase truncation limits if the T5-base model can handle it, or document the limitation clearly.

---

### [LOW] -- rewriteQuery returns original + variants, could exceed expected count

**File:** `src/services/rag/rewriter.ts:30`
**Category:** maintainability
**Description:** `rewriteQuery()` returns `[query, ...variants]` (line 30), so if `count=3` and the LLM returns 3 variants, the output is 4 strings (original + 3). The caller (`queryStandard`) embeds all of them and searches for all of them. The function name and the `queryRewriteCount` config suggest the count controls total variants, but actually the count controls only the LLM-generated alternatives; the original is always prepended. This is not a bug -- it is beneficial to always include the original query -- but the naming is misleading.
**Recommendation:** Rename the parameter to `alternativeCount` or document clearly that the returned array has `count + 1` elements (original + N alternatives).

---

### 4. Type Consistency

---

### [MEDIUM] -- queryStream does not populate confidence, citations, or faithfulnessScore

**File:** `src/services/rag/index.ts:256-301`
**Category:** correctness
**Description:** `queryStream()` yields `RagStreamEvent` objects, which is a discriminated union type. The `sources` event includes `sources` and `queryVariants`. The `done` event includes token counts. But confidence scoring, citation extraction, and NLI verification are entirely absent from the streaming path. This is likely intentional (streaming prioritizes time-to-first-token), but it means streaming consumers cannot know if the answer is trustworthy. There is no documentation of this limitation in the type definitions or code comments. The `RagStreamEvent` type (types.ts:73-77) has no fields for confidence or citations, confirming this is by design, but consumers may expect parity with the non-streaming path.
**Recommendation:** Add a code comment in `queryStream()` explaining that confidence/citations are intentionally omitted in the streaming path and why. Consider adding a post-stream `"metadata"` event type that could include confidence scoring computed after streaming completes.

---

### [MEDIUM] -- RagAnswer.context field never populated in queryStandard or queryDecomposed

**File:** `src/services/rag/types.ts:45`
**Category:** correctness
**Description:** The `RagAnswer` interface includes `context?: string` (line 45) with the comment "F-031: assembled context string for LLM evaluation -- populated by rag/index.ts". However, neither `queryStandard()` (returns at line 156) nor `queryDecomposed()` (returns at line 239) includes `context` in their return objects. The field is always `undefined`. If `context` is needed for F-031 LLM evaluation, it must be populated somewhere downstream (likely in the route layer), but the comment specifically says "populated by rag/index.ts".
**Recommendation:** Either populate the `context` field in the return objects of both `queryStandard()` and `queryDecomposed()`, or update the comment to reflect where it is actually populated.

---

### 5. Performance on ARM 4GB

---

### [MEDIUM] -- fetchResults runs query variant searches sequentially

**File:** `src/services/rag/index.ts:430-448`
**Category:** performance
**Description:** In `fetchResults()` (lines 430-448), the `for` loop iterates over `queryVariants` and awaits each `vectorStore.search()` call sequentially. With `queryRewriteCount=3`, this is 4 sequential hybrid searches (original + 3 rewrites). Each hybrid search involves a Postgres vector query + FTS query (parallelized within `VectorStoreService.search()`), but the 4 variant searches are serial relative to each other. On ARM hardware with limited CPU, the serial latency of 4 round-trips to Postgres adds up.
**Recommendation:** Run all variant searches in parallel using `Promise.all()`:
```typescript
const searchPromises = queryVariants.map((variant, i) =>
  this.deps.vectorStore.search(embeddings[i]!.vector, variant, options, alpha)
)
const searchResults = await Promise.all(searchPromises)
// then merge/dedup
```
This should significantly reduce retrieval latency at the cost of brief concurrent load on Postgres, which is acceptable for 4 parallel queries.

---

### [LOW] -- allResults array in fetchResults grows unbounded per variant

**File:** `src/services/rag/index.ts:427`
**Category:** performance
**Description:** `fetchResults()` accumulates all deduplicated results from all query variants into `allResults`. With 4 variants and `fetchTopK = 20` (for `topK=10`), the worst case is 80 unique results. This is not truly unbounded, but worth noting: if `topK` is set to a large value by the caller (there is no upper bound validation on `input.topK`), `fetchTopK` doubles it, and 4 variants multiply it further. For `topK=100`, this could yield up to 800 results, each containing chunk content strings, before reranking trims it down.
**Recommendation:** Consider adding a cap on `input.topK` (e.g., max 50) at the RagService boundary to prevent memory pressure from unreasonably large values.

---

### 6. Immutability

---

### [HIGH] -- allResults.push() mutates a local array that leaks into HyDE dedup logic

**File:** `src/services/rag/index.ts:95-111`
**Category:** correctness
**Description:** In `queryStandard()`, `allResults` is returned from `fetchResults()` (line 95) and then mutated with `.push()` in the HyDE deduplication loop (lines 107-111). While `allResults` is a local variable within `fetchResults()` and its caller `queryStandard()`, the mutation pattern is fragile. If `fetchResults()` were ever changed to cache or reuse its return value, this push would corrupt shared state. Currently this is safe because `fetchResults()` creates a fresh array each call, but the mutation violates the project's immutability coding style guideline.
**Recommendation:** Instead of mutating `allResults`, create a new array:
```typescript
const hydeUnique = hydeSearchResults.filter(r => !seenIds.has(r.id))
const allResultsWithHyde = [...allResults, ...hydeUnique]
```

---

### [MEDIUM] -- VectorStoreService.search mutates fused result scores in-place

**File:** `src/services/vectorstore/index.ts:84-85`
**Category:** correctness
**Description:** In `VectorStoreService.search()` (lines 84-85 of vectorstore/index.ts), the `fused` array's `result.score` is mutated in-place: `result.score = result.score * fs`. The `fused` array comes from `convexCombinationFusion()` which is a context-only file, but the mutation pattern means any reference to these objects held elsewhere would see modified scores. This is in the context-only file so not directly in review scope, but it affects the `HybridSearchResult` objects that flow into the RAG pipeline.
**Recommendation:** This is noted for awareness; the VectorStoreService reviewer should address the in-place mutation.

---

### Additional Findings

---

### [HIGH] -- Decomposition sub-question search does not use adaptive alpha

**File:** `src/services/rag/decomposition.ts:92-96`
**Category:** correctness
**Description:** In `answerSubQuestions()` (lines 92-96), each sub-question's `vectorStore.search()` call does not pass an `alpha` parameter. Looking at the `VectorStoreService.search()` signature, the fourth argument `alpha?` defaults to `undefined`, which means CC fusion falls back to the default `FUSION_ALPHA` (0.5). In contrast, the standard path calls `classifyQuery()` to determine the optimal alpha per query. Sub-questions in the decomposed path are independently focused queries that could benefit from adaptive alpha classification, but they always use the default alpha. This inconsistency means decomposed queries may have worse retrieval quality for code-heavy or keyword-heavy sub-questions.
**Recommendation:** Call `classifyQuery(subQuestion)` for each sub-question before the search call and pass the resulting alpha. This adds negligible overhead (the classifier is pure heuristic, no LLM call).

---

### [LOW] -- synthesizeAnswers prompt does not instruct LLM to produce citation markers

**File:** `src/services/rag/decomposition.ts:138-150`
**Category:** correctness
**Description:** The synthesis prompt (lines 138-150) instructs the LLM to "Cite which aspects come from which sub-answers", but does not instruct it to use `[N]` citation markers matching source indices. The standard path's `DEFAULT_SYSTEM_PROMPT` instructs "Cite relevant parts of the context in your answer", and sources are labeled `[Source N]` in the context (context.ts:40). But the decomposed path's synthesized answer is then passed to `buildCitations()` which looks for `[N]` markers. Since the synthesis prompt does not produce `[N]` markers, `buildCitations()` will return empty citations for most decomposed answers, making the citation system non-functional for the decomposed path.
**Recommendation:** Either update the synthesis prompt to include source labeling and `[N]` marker instructions, or acknowledge that citations are best-effort empty for decomposed queries.

---

### [MEDIUM] -- computeFaithfulnessNli uses character-based truncation, not token-based

**File:** `src/services/rag/confidence.ts:97`
**Category:** correctness
**Description:** Line 97 truncates context to 1500 characters with the comment "1 token ~ 4 chars". This approximation is very rough -- for English text, BPE tokenizers average ~3.5-4 chars/token, but for code or non-Latin scripts (Russian is explicitly supported), the ratio can be 2-3 chars/token. Since the project explicitly supports Russian (FTS uses both English and Russian parsers, system prompt says "Answer in the same language as the question"), Russian text at ~2.5 chars/token would produce ~600 tokens from 1500 characters, well within the T5-base limit. But code snippets with many short tokens could exceed it. The `countTokensSync()` function from the chunker's tokenizer module is available and would give accurate counts.
**Recommendation:** Use `countTokensSync()` for accurate truncation instead of character-based approximation, or increase the character limit to 2500 to provide a larger safety margin.

---

### [LOW] -- classifyQueryEnhancement regex for "compare" overlaps with comparison words signal

**File:** `src/services/rag/classifier.ts:29`
**Category:** maintainability
**Description:** In the HyDE signals section, `hasQuestionWords` regex (line 29) includes `compare` and `summarize`. In the decomposition signals section, `hasComparisonWords` regex (line 48) includes `compar` (prefix match) and `similar`. A query like "compare X and Y" would trigger both `hasQuestionWords` (+1 to HyDE) and `hasComparisonWords` (+1 to decomposition) plus `hasConjunction` (due to "and"). This is likely intentional (a comparison query benefits from both HyDE and decomposition), but since `shouldDecompose` takes priority in `query()` (line 63), the HyDE score is computed but never used for comparison queries. No functional bug, just a clarity note.
**Recommendation:** No action needed. The priority logic is correct.

---

## Summary Table

| # | Severity | File | Title |
|---|---|---|---|
| 1 | HIGH | `src/services/rag/index.ts:486` | buildAnswerMessages double-wraps context; queryStream never includes docsMeta |
| 2 | HIGH | `src/services/rag/index.ts:103` | HyDE search sends empty FTS text, wasting a Postgres query and making alpha meaningless |
| 3 | HIGH | `src/services/rag/index.ts:59` | Empty query string flows through entire pipeline unchecked |
| 4 | HIGH | `src/services/rag/index.ts:95-111` | allResults.push() mutates array, violating immutability convention |
| 5 | HIGH | `src/services/rag/decomposition.ts:92-96` | Decomposition sub-question search does not use adaptive alpha |
| 6 | MEDIUM | `src/services/rag/index.ts:236` | queryDecomposed omits NLI citation verification |
| 7 | MEDIUM | `src/services/rag/index.ts:244-252` | queryDecomposed reports zero for all latency and embedding metrics |
| 8 | MEDIUM | `src/services/rag/decomposition.ts:109-114` | Decomposition sub-answer prompt lacks grounding JSON instruction |
| 9 | MEDIUM | `src/services/rag/confidence.ts:150` | groundingScore === 0.0 check uses strict equality on float |
| 10 | MEDIUM | `src/services/rag/index.ts:124-148` | LLM empty string response bypasses abstention logic |
| 11 | MEDIUM | `src/services/rag/confidence.ts:97-98` | NLI faithfulness truncates context to 1500 chars, may miss supporting evidence |
| 12 | MEDIUM | `src/services/rag/index.ts:256-301` | queryStream omits confidence/citations with no documentation |
| 13 | MEDIUM | `src/services/rag/types.ts:45` | RagAnswer.context field declared but never populated |
| 14 | MEDIUM | `src/services/rag/index.ts:430-448` | fetchResults runs query variant searches sequentially |
| 15 | MEDIUM | `src/services/rag/confidence.ts:97` | computeFaithfulnessNli uses char-based truncation, not token-based |
| 16 | LOW | `src/services/rag/index.ts:427` | allResults can grow large with high topK (no upper bound) |
| 17 | LOW | `src/services/rag/rewriter.ts:30` | rewriteQuery returns count+1 elements; naming misleading |
| 18 | LOW | `src/services/rag/decomposition.ts:138-150` | Synthesis prompt does not instruct LLM to produce [N] citation markers |
| 19 | LOW | `src/services/rag/classifier.ts:29` | HyDE and decomposition regex signals overlap on "compare" |