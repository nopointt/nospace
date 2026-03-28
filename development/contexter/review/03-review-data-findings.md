Now I have all the information needed. Let me compile the comprehensive review.

---

# Code Review: Contexter — Data Layer, Search Algorithms, and Embedding Pipeline

---

### [CRITICAL] — async `countTokens` called synchronously in three chunker functions

**File:** `src/services/chunker/semantic.ts:87`, `src/services/chunker/table.ts:37`, `src/services/chunker/timestamp.ts:22`
**Category:** correctness
**Description:** `countTokens` is declared as `async function countTokens(text: string): Promise<number>` in `tokenizer.ts:25`. All three chunker functions (`chunkSemantic`, `chunkTable`, `chunkTimestamp`) are declared synchronous (return type `Chunk[]`) and call `countTokens(...)` without `await`, assigning the result to variables used in numeric comparisons (`paraTokens`, `rowTokens`, `segTokens`, `currentTokenCount`).

In JavaScript/TypeScript, calling an async function without `await` returns a `Promise<number>` object, not a number. All arithmetic with a Promise produces `NaN`, and all comparisons such as `currentTokenCount + paraTokens > maxTokens` evaluate as `NaN > 500` which is always `false`. The practical effect: every chunk boundary check is silently skipped, so every document becomes a single chunk regardless of size. The `tokenCount` fields stored in `Chunk` objects also become `Promise<number>` stored as object references, causing corrupted data in the DB.

`hierarchical.ts` correctly imports and uses `countTokensSync` — but this protection does not extend to the three other chunker files.

**Recommendation:** Either convert all three functions to async (and propagate `await` throughout) or make `countTokens` call `countTokensSync` internally once the encoder is loaded. The cleanest fix with minimal churn: rename the unsafe pattern. In `semantic.ts`:

```typescript
// Replace:
const paraTokens = countTokens(para.text)
// With:
const paraTokens = countTokensSync(para.text)
```

Apply the same substitution at every `countTokens(...)` call in `table.ts` and `timestamp.ts`. Since `hierarchical.ts` calls `chunkSemantic` (which runs before the encoder is initialized), ensure `getEncoder()` is warm-started during app startup (e.g., call `await countTokens("")` once during initialization) so `countTokensSync` never falls back to the word-count approximation.

---

### [CRITICAL] — `embed()` dereferences index 0 without null-guard on empty API response

**File:** `src/services/embedder/index.ts:21`
**Category:** reliability
**Description:** `embed()` calls `embedBatch([text], options)` and then returns `result.embeddings[0]` with no null guard. If the Jina API returns an empty `data` array (malformed response, upstream bug, or empty input slipping through), `result.embeddings[0]` is `undefined` and the function returns `undefined` typed as `EmbeddingResult`. Every downstream caller that then accesses `.vector` will throw a runtime TypeError, crashing the request with no informative error.

`CachedEmbedderService.embed()` at `cache.ts:21` handles this correctly with an explicit throw. The base `EmbedderService.embed()` does not.

**Recommendation:**

```typescript
async embed(text: string, options: EmbedderOptions = {}): Promise<EmbeddingResult> {
  const result = await this.embedBatch([text], options)
  const first = result.embeddings[0]
  if (!first) throw new Error("EmbedderService.embed: empty embedding response from Jina API")
  return first
}
```

---

### [HIGH] — Retry condition `attempt < maxRetries` is always true, masking the off-by-one

**File:** `src/services/embedder/index.ts:108`
**Category:** correctness
**Description:** The loop runs `for (let attempt = 0; attempt < maxRetries; attempt++)` with `maxRetries = 3` (attempts 0, 1, 2). The retry guard on line 108 is `attempt < maxRetries`, which evaluates `0 < 3`, `1 < 3`, `2 < 3` — all true. This means the condition never filters. On attempt 2 (the last iteration), the code sleeps, increments attempt to 3, exits the loop, and falls to the `throw` at line 134. The effective behavior is correct (3 attempts total), but the guard is a dead branch: it never rejects a retry. If `maxRetries` is ever increased and the intent was to allow the last attempt to propagate without sleep, this logic silently sleeps unnecessarily on the final attempt. The correct guard for "don't sleep after last attempt" is `attempt < maxRetries - 1`.

**Recommendation:** Change line 108 to:
```typescript
if ([429, 500, 502, 503].includes(response.status) && attempt < maxRetries - 1) {
```
Or restructure as a standard retry-with-delay loop where sleep only occurs between attempts.

---

### [HIGH] — `sanitizeFtsQuery` strips all punctuation, destroying `websearch_to_tsquery` operator syntax

**File:** `src/services/vectorstore/fts.ts:89-94`
**Category:** correctness
**Description:** The function docstring says "Sanitize user query for PostgreSQL `plainto_tsquery`" but the actual SQL uses `websearch_to_tsquery`. This is not just a documentation mismatch — it is a behavioral regression.

`websearch_to_tsquery` understands operators: `"phrase search"` (double quotes), `-excluded` (minus), `OR` (keyword), and `AND` (implied). The sanitizer strips all characters not matching `\p{L}\p{N}\s`, which removes double quotes, hyphens, and any punctuation. A user query like `"exact phrase" -noise` is reduced to `exact phrase noise`, losing the phrase-match semantics and the exclusion. The docstring explicitly names `plainto_tsquery`, which does not support these operators, so the sanitizer was likely written for the old implementation and not updated.

Additionally, stripping punctuation before `websearch_to_tsquery` means queries containing only punctuation (e.g., `"..."`) become empty strings and correctly return `[]` — that part is fine. But the loss of quote and minus operators is a regression against the stated feature.

**Recommendation:** Update the docstring to reference `websearch_to_tsquery`. If preserving operator syntax is desired, use a targeted sanitizer that keeps `"`, `-`, `|`, `(`, `)` while still escaping only characters that could break the tsquery parser:

```typescript
function sanitizeFtsQuery(query: string): string {
  // Preserve websearch_to_tsquery operators: quotes, minus, pipe, parens
  return query
    .replace(/[^\p{L}\p{N}\s"'\-|()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}
```

At minimum, fix the docstring to avoid misleading future maintainers.

---

### [HIGH] — tsvector `GENERATED ALWAYS AS` mismatch: migration 0004 uses `||` union, FTS query computes `||` on tsquery — structurally correct but semantically inconsistent

**File:** `drizzle-pg/0004_multilingual_fts.sql:5-8`, `src/services/vectorstore/fts.ts:45`
**Category:** correctness
**Description:** Migration 0004 defines the `tsv` column as:
```sql
to_tsvector('english', content) || to_tsvector('russian', content)
```
This is correct: the stored `tsv` is the union of English and Russian lexemes. The `@@` match operator in `fts.ts` then uses:
```sql
tsv @@ (websearch_to_tsquery('english', $1) || websearch_to_tsquery('russian', $1))
```
The `||` on tsquery is the tsquery OR operator. This is valid PostgreSQL and performs a union match, so a document matching either language configuration will be returned.

However, `ts_rank(tsv, query)` where `query` is a tsquery `OR` expression will compute rank based on the combined query. This is slightly suboptimal compared to computing rank separately per language and taking the max, but is functionally correct. No bug, but worth noting as a known quality tradeoff.

The real issue: migration 0001 creates a GIN index with name `chunks_tsv_idx`, then migration 0004 drops the column but does NOT explicitly drop the old index before recreating it with the same name. `ALTER TABLE chunks DROP COLUMN IF EXISTS tsv` will implicitly drop the GIN index because it was defined on that column. Then `CREATE INDEX chunks_tsv_idx` recreates it. This chain is safe in PostgreSQL because dropping a column drops all associated indexes. But the migration does not document this dependency, creating maintainability risk if someone runs only 0004 on a fresh DB where the column never existed — `DROP COLUMN IF EXISTS` handles this gracefully. Chain is safe.

**Recommendation:** Add a comment to migration 0004 explicitly noting that the old GIN index is dropped implicitly with the column. No code change required, documentation only.

---

### [HIGH] — Single-element `minmaxNormalize` returns `[1.0]` — incorrect for absent-channel fusion

**File:** `src/services/vectorstore/hybrid.ts:13`
**Category:** correctness
**Description:** When exactly one result exists in a channel (e.g., vector search returns a single result), `minmaxNormalize([score])` returns `[1.0]`. This normalized score of 1.0 is then used in the CC formula: `alpha * 1.0 + (1-alpha) * 0.0` = `alpha`. For the default alpha of 0.5, a single vector result with any raw cosine score — even 0.01 — receives a fused score of 0.5. This is mathematically consistent (a single entry is maximally ranked within its channel) but can be surprising: a result with cosine similarity 0.01 that happens to be the only vector result gets promoted to 0.5 fused score.

This is a design choice, not a bug per se, but it becomes a real problem in practice: for small knowledge bases or niche queries where only one chunk passes the pgvector ordering, that chunk is guaranteed to be ranked as if it had the top possible score in its channel. Combined with `DEFAULT_SCORE_THRESHOLD = 0`, this means every query returns results regardless of true semantic relevance.

**Recommendation:** Document this property explicitly in `minmaxNormalize`. Consider clamping the fused output: if `normVec < QUALITY_FLOOR` (e.g., 0.1) and the raw cosine score is below a minimum threshold (e.g., 0.3), exclude the result. Alternatively, apply the raw score as a quality gate before normalization in `convexCombinationFusion`, using a pre-normalization threshold on cosine distance.

---

### [HIGH] — `fetchParentsForChildren` uses parallel `unnest` on two arrays — fragile if lengths differ

**File:** `src/services/vectorstore/index.ts:145-148`
**Category:** reliability
**Description:** The SQL uses:
```sql
SELECT unnest($1::text[]) AS child_id, unnest($2::float8[]) AS score
```
In PostgreSQL, parallel `unnest` of two arrays of different lengths is valid as of PG 10+ (it extends the shorter array with NULLs). However, the function signature accepts `childIds: string[]` and `childScores: number[]` independently. If the caller ever passes arrays of different lengths (length mismatch due to a bug in the caller), the query silently succeeds with some `score` values being NULL, and `MAX(hits.score)` becomes NULL for those parents, causing silent data quality degradation rather than a clear error.

PostgreSQL 10+ defines behavior for parallel `unnest` with mismatched lengths as "pad shorter with NULL" — this is documented behavior but relies on the caller always maintaining alignment. There is no assertion or length check.

**Recommendation:** Add a guard before the SQL call:
```typescript
if (childIds.length !== childScores.length) {
  throw new Error(`fetchParentsForChildren: length mismatch — ids=${childIds.length} scores=${childScores.length}`)
}
```
Alternatively, use `unnest(ARRAY[...] :: record[])` syntax to pass pairs atomically.

---

### [MEDIUM] — FTS `sanitizeFtsQuery` passes cleaned text to `websearch_to_tsquery` but comment still references old function

**File:** `src/services/vectorstore/fts.ts:86`
**Category:** maintainability
**Description:** The JSDoc comment on `sanitizeFtsQuery` reads: "Sanitize user query for PostgreSQL `plainto_tsquery`." This is incorrect — the function is used exclusively with `websearch_to_tsquery`. The mismatch means future developers reading the code will assume `plainto_tsquery` semantics (no operators) and may make incorrect modifications to either the sanitizer or the SQL.

**Recommendation:** Update the docstring to: "Sanitize user query for PostgreSQL `websearch_to_tsquery`."

---

### [MEDIUM] — `classifyQuery` empty-string edge case falls through to `keyword` via `wordCount=0, !hasQuestionWord`

**File:** `src/services/vectorstore/classifier.ts:67`
**Category:** correctness
**Description:** When `query` is an empty string or whitespace-only: `trimmed = ""`, `words = []`, `wordCount = 0`, `hasQuestionWord = false`. Rule 2 matches: `wordCount <= 3 && !hasQuestionWord` → returns `{ queryType: "keyword", alpha: 0.3 }`. The caller (vectorstore search) then passes this alpha to CC fusion. The empty string will produce an empty FTS result (sanitizeFtsQuery returns `""` and `fts.search` returns `[]`). Vector search proceeds normally with the query embedding. This is not catastrophic but the classification of empty query as "keyword" (alpha=0.3, favor FTS) is misleading since FTS will return nothing.

More importantly, the RAG pipeline should validate that query is non-empty before calling classify, but there is no guard in `classifyQuery` itself.

**Recommendation:** Add an early return for empty queries:
```typescript
if (wordCount === 0) {
  return { queryType: "default", alpha: FUSION_ALPHA, wordCount: 0 }
}
```

---

### [MEDIUM] — `CODE_PATTERNS` regex `/\([^)]*\)/` matches many non-code natural language queries

**File:** `src/services/vectorstore/classifier.ts:29`
**Category:** correctness
**Description:** The pattern `/\([^)]*\)/` matches any parenthesized expression, including common English phrases like "What is the difference (in practice) between X and Y?" or "How does X work (simplified)?". These semantic natural language queries would be classified as `code` (alpha=0.2, strong FTS bias), severely degrading vector search quality.

Similarly, `/\[[^\]]*\]/` matches any bracketed content including academic citations `[1]`, Unicode characters, and legal/regulatory references like `[Section 5.2]`.

**Recommendation:** Tighten the parenthesis and bracket patterns to require code-like content inside:
- Instead of `/\([^)]*\)/` use `/\w+\s*\([^)]*\)/` (function call: identifier followed by parens)
- Instead of `/\[[^\]]*\]/` use `/\w+\[[\d:]+\]/` (array indexing only)

This reduces false positive code classification for parenthesized natural language.

---

### [MEDIUM] — `convexCombinationFusion` mutates `result.score` after sorting in `VectorStoreService.search`

**File:** `src/services/vectorstore/index.ts:84-88`
**Category:** correctness
**Description:** After `convexCombinationFusion` returns a sorted slice, `search()` applies feedback score multipliers by mutating `result.score` in place and then calls `fused.sort(...)` again. This mutation modifies the array elements returned by `convexCombinationFusion`. While the array itself is a new allocation (not shared), the `metadata` objects inside each `HybridSearchResult` are shallow-copied references pointing back to the original `vectorResults[i].metadata`. Mutation of `score` on the fused result objects is fine, but if any caller retains a reference to the intermediate fused array (not currently the case but a fragile assumption), they would observe modified scores.

More concretely: the coding style guidelines for this project mandate immutability (`ALWAYS create new objects, NEVER mutate existing ones`). The in-place mutation at line 84-88 violates this principle.

**Recommendation:** Apply feedback scores immutably:
```typescript
const adjusted = fused.map((r) => ({
  ...r,
  score: r.score * (scoreMap.get(r.id) ?? 1.0),
}))
adjusted.sort((a, b) => b.score - a.score)
return adjusted.filter((r) => r.score >= threshold)
```

---

### [MEDIUM] — Migration 0005 `ALTER COLUMN ... TYPE vector(512) USING NULL` is invalid PostgreSQL syntax

**File:** `drizzle-pg/0005_reduce_embedding_dims.sql:13`
**Category:** correctness
**Description:** The migration contains:
```sql
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(512) USING NULL;
```
The `USING` clause in `ALTER COLUMN TYPE` specifies an expression to compute the new value from the old value. `USING NULL` is syntactically valid (NULL is a valid expression) and will set all rows to NULL, but this is semantically redundant with the `UPDATE chunks SET embedding = NULL` on line 9 that already nulled all embeddings. More importantly, on a fresh database (migrations run 0000–0011 in sequence), the column is `vector(1024)` from migration 0000. `USING NULL` means the conversion expression is NULL, which is a cast to `vector(512)` of NULL — this works. But on a running production database this migration was already applied with live data. The correct idiomatic form would be `USING embedding::vector(512)` if retaining values, or simply omit `USING` entirely since all values are already NULL:
```sql
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(512);
```
Without `USING`, PostgreSQL uses the implicit cast when values are non-NULL. Since all embeddings are already NULL, this is equivalent. The current form `USING NULL` is technically correct but misleading — it reads as if the USING clause is doing meaningful work when it is not.

**Recommendation:** Replace line 13 with:
```sql
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(512);
```

---

### [MEDIUM] — `chunkSemantic` is synchronous but `countTokens` is async — TypeScript does not catch this without `strict` type checking

**File:** `src/services/chunker/semantic.ts:72`, `src/services/chunker/table.ts:9`, `src/services/chunker/timestamp.ts:2`
**Category:** correctness
**Description:** This is a supporting observation for the CRITICAL finding above. TypeScript will only report a type error for unresolved Promises in comparisons (`Promise<number> > number`) if `@typescript-eslint/no-floating-promises` or strict comparison rules are enabled. If the TypeScript config does not enforce `noImplicitAny` or the ESLint rules are absent, the async/sync confusion compiles silently. The presence of this bug suggests the tsconfig or lint rules are not catching unresolved Promise comparisons.

**Recommendation:** Add `@typescript-eslint/no-floating-promises` and `@typescript-eslint/await-thenable` ESLint rules to the project. Also verify `tsconfig.json` has `"strict": true`. These would have caught the CRITICAL bug at compile time.

---

### [MEDIUM] — Duplicate computation of tsquery expression in FTS search query

**File:** `src/services/vectorstore/fts.ts:45-49`, `57-61`
**Category:** performance
**Description:** Each branch of the FTS search query computes the tsquery expression twice: once in the `ts_rank(...)` call and once in the `WHERE tsv @@ (...)` clause. PostgreSQL's query planner may or may not deduplicate this. The idiomatic pattern uses a CTE or `plainto_tsquery` aliasing to compute the query once:

```sql
WITH q AS (
  SELECT websearch_to_tsquery('english', $1) || websearch_to_tsquery('russian', $1) AS tsq
)
SELECT id, ..., ts_rank(tsv, q.tsq, 1) as score
FROM chunks, q
WHERE tsv @@ q.tsq ...
```

With only `topK*2 = ~20` rows being retrieved, this is not a performance bottleneck today. However, `websearch_to_tsquery` is called four times per query (two branches × two occurrences each). On high query volumes this is wasteful.

**Recommendation:** Refactor using a CTE or lateral join to compute the tsquery once per query execution.

---

### [MEDIUM] — `getOverlapText` in `semantic.ts` uses `tokenize` (whitespace words) not BPE tokens for overlap calculation

**File:** `src/services/chunker/semantic.ts:170-176`
**Category:** correctness
**Description:** `getOverlapText` calls `tokenize(text)` from `tokenizer.ts:44`, which returns whitespace-split words (not BPE tokens). The overlap parameter (`DEFAULT_OVERLAP = 100`) is defined in terms of tokens, but the actual overlap calculation uses word count. For code content where a single identifier can be 3-5 BPE tokens, the whitespace-word overlap will be significantly shorter than the intended 100-token overlap. For CJK text where one character is one token, whitespace tokenization produces zero words and overlap would be skipped entirely.

This inconsistency means the semantic chunker's overlap behavior varies significantly by content type.

**Recommendation:** Replace `tokenize(text)` with BPE-aware overlap: use `countTokensSync` to measure the overlap size and take the last N characters corresponding to approximately `overlapTokens` BPE tokens. A pragmatic approximation: `const overlapChars = Math.floor(text.length * (overlapTokens / countTokensSync(text)))`.

---

### [MEDIUM] — `table.ts` non-table chunks get `tokenCount: countTokens(part.text)` stored as a Promise

**File:** `src/services/chunker/table.ts:20`
**Category:** correctness
**Description:** This is a specific instance of the CRITICAL async/sync issue. `countTokens(part.text)` returns `Promise<number>`. At line 20, this Promise is assigned directly to the `tokenCount` field of type `number`. TypeScript accepts this without error only if the type definition allows it or if type-checking is not strict. The stored `tokenCount` in the chunk will be `[object Promise]` when serialized, causing corrupted values in the database's `token_count` column for table-chunked documents.

**Recommendation:** Same as the CRITICAL fix: replace all `countTokens(...)` with `countTokensSync(...)` in `table.ts` and `timestamp.ts`.

---

### [LOW] — `VectorStoreService` JSDoc says "Reciprocal Rank Fusion" but implementation uses Convex Combination

**File:** `src/services/vectorstore/index.ts:22`
**Category:** maintainability
**Description:** The class-level JSDoc comment at line 22 reads: "merges results with Reciprocal Rank Fusion." The implementation was rewritten to use Convex Combination Fusion (F-007). The comment is stale.

**Recommendation:** Update the JSDoc:
```typescript
 * Internally delegates to {@link VectorService} (pgvector) and {@link FtsService}
 * (tsvector), then merges results with Convex Combination Fusion (CC, F-007).
```

---

### [LOW] — `RRF_K` constant exported from `types.ts` with `@deprecated` but still referenced in downstream code

**File:** `src/services/vectorstore/types.ts:72`
**Category:** maintainability
**Description:** `RRF_K = 60` is marked deprecated with comment "kept for confidence.ts legacy normalization only." This creates long-term maintenance debt — deprecated constants tend to remain indefinitely. If `confidence.ts` is the only consumer, it should be moved there or replaced with a local constant.

**Recommendation:** Move `RRF_K` to `src/services/rag/confidence.ts` as a local constant and remove the export from `types.ts`.

---

### [LOW] — `contextual.ts` sends full `documentText` in every Groq request — potential large prompt for big documents

**File:** `src/services/chunker/contextual.ts:93`
**Category:** performance
**Description:** The Groq prompt includes `<document>\n${documentText}\n</document>` in full for every chunk in every batch of 10. For a large document (e.g., a 50-page PDF with 100+ chunks), this sends the entire document text to Groq 10+ times. The `max_tokens: 150` output is well-bounded, but input tokens are unbounded. Groq's `llama-3.1-8b-instant` context window is 128K tokens, so very large documents may hit this limit.

**Recommendation:** Truncate `documentText` to the first N tokens (e.g., 4000 tokens / ~3000 words) for the contextual prefix prompt. The document summary is sufficient context for the 2-3 sentence prefix; the full document is not necessary.

---

### [LOW] — `dedup.ts` missing index on `(user_id, embedding)` — sequential scan risk

**File:** `src/services/embedder/dedup.ts:20-28`
**Category:** performance
**Description:** `findNearDuplicate` executes an HNSW approximate nearest-neighbor search filtered by `user_id AND embedding IS NOT NULL AND duplicate_of IS NULL`. The HNSW index (`chunks_embedding_idx` from migration 0005) is an unfiltered global index. PostgreSQL cannot use HNSW for queries with a `WHERE user_id = $1` filter directly — it will do a full HNSW scan and then post-filter, or fall back to sequential scan for small user datasets.

For multi-tenant deployments with many users this is acceptable (the HNSW ANN scan is fast globally and PostgreSQL can use bitmap intersection). For a single user with millions of chunks, performance degrades. This is a known pgvector limitation.

**Recommendation:** Document this known behavior. For future scaling, consider a partial index per user or pgvector's `ef_search` parameter tuning.

---

## Summary Table

| # | Severity | File | Title |
|---|---|---|---|
| 1 | CRITICAL | `src/services/chunker/semantic.ts:87`, `table.ts:37`, `timestamp.ts:22` | async `countTokens` called synchronously — all token counts are Promises |
| 2 | CRITICAL | `src/services/embedder/index.ts:21` | `embed()` returns `undefined` without null-guard on empty API response |
| 3 | HIGH | `src/services/embedder/index.ts:108` | Retry guard `attempt < maxRetries` is always true — dead branch |
| 4 | HIGH | `src/services/vectorstore/fts.ts:89` | `sanitizeFtsQuery` strips `websearch_to_tsquery` operators (quotes, minus) |
| 5 | HIGH | `src/services/vectorstore/hybrid.ts:13` | Single-element normalization returns 1.0 — low-relevance results promoted artificially |
| 6 | HIGH | `src/services/vectorstore/index.ts:145` | Parallel `unnest` on two arrays — silent corruption if lengths differ |
| 7 | MEDIUM | `src/services/vectorstore/fts.ts:86` | Docstring says `plainto_tsquery` but code uses `websearch_to_tsquery` |
| 8 | MEDIUM | `src/services/vectorstore/classifier.ts:67` | Empty-string query classified as "keyword" — misleading alpha for no-content query |
| 9 | MEDIUM | `src/services/vectorstore/classifier.ts:29` | Parenthesis/bracket CODE pattern produces false positives on natural language |
| 10 | MEDIUM | `src/services/vectorstore/index.ts:84` | `result.score` mutated in-place after sort — violates immutability principle |
| 11 | MEDIUM | `drizzle-pg/0005_reduce_embedding_dims.sql:13` | `ALTER COLUMN TYPE ... USING NULL` is misleading and redundant |
| 12 | MEDIUM | `src/services/chunker/semantic.ts:72`, `table.ts:9`, `timestamp.ts:2` | No ESLint/tsconfig guard catching unresolved Promise in arithmetic |
| 13 | MEDIUM | `src/services/vectorstore/fts.ts:45-49` | tsquery expression computed four times per query — redundant computation |
| 14 | MEDIUM | `src/services/chunker/semantic.ts:170` | Overlap calculation uses whitespace words, not BPE tokens |
| 15 | LOW | `src/services/vectorstore/index.ts:22` | Stale JSDoc mentions RRF after CC fusion rewrite |
| 16 | LOW | `src/services/vectorstore/types.ts:72` | Deprecated `RRF_K` export should be localized to its only consumer |
| 17 | LOW | `src/services/chunker/contextual.ts:93` | Full document text sent in every Groq prefix request — unbounded input tokens |
| 18 | LOW | `src/services/embedder/dedup.ts:20` | HNSW dedup index not user-scoped — post-filter scan at scale |

---

**Priority action plan:**

The two CRITICAL items must be addressed before any document ingestion can be trusted. The async/sync confusion in the chunker (finding #1) means every document currently being ingested has incorrect token counts stored and chunk boundaries are not enforced — every document becomes a single oversized chunk. Finding #2 is a latent crash on any Jina API anomaly. HIGH items #3 and #4 affect retry reliability and FTS search quality respectively and should be addressed in the same pass.

Relevant files for the fixes:
- `/C:/Users/noadmin/nospace/development/contexter/src/services/chunker/semantic.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/chunker/table.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/chunker/timestamp.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/chunker/tokenizer.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/embedder/index.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/vectorstore/fts.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/vectorstore/index.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/vectorstore/hybrid.ts`
- `/C:/Users/noadmin/nospace/development/contexter/src/services/vectorstore/classifier.ts`
- `/C:/Users/noadmin/nospace/development/contexter/drizzle-pg/0005_reduce_embedding_dims.sql`