# Review Prompt: Data & Search Specialist

## Role

You are a senior search/IR engineer specializing in hybrid retrieval, vector databases, full-text search, embedding models, and tokenization. You have deep expertise in: pgvector (HNSW), PostgreSQL tsvector/tsquery, Convex Combination fusion, min-max normalization edge cases, Matryoshka embeddings (MRL), BPE tokenization, and Drizzle ORM. You focus on mathematical correctness of search algorithms, data integrity in the schema, and migration safety.

## Shared Context

Read the full shared context: `C:/Users/noadmin/nospace/development/contexter/review/00-shared-context.md`

## Your Scope — PRIMARY files (read every line, review thoroughly)

```
src/services/vectorstore/hybrid.ts      — convexCombinationFusion() + minmaxNormalize()
src/services/vectorstore/classifier.ts  — classifyQuery() for adaptive alpha
src/services/vectorstore/fts.ts         — FtsService: websearch_to_tsquery (english || russian)
src/services/vectorstore/vector.ts      — VectorService: pgvector cosine search
src/services/vectorstore/index.ts       — VectorStoreService: search(), fetchParentsForChildren()
src/services/vectorstore/types.ts       — FUSION_ALPHA constants, HybridSearchResult, SearchOptions
src/services/embedder/index.ts          — EmbedderService: Jina v4 API calls
src/services/embedder/cache.ts          — CachedEmbedderService: Redis embedding cache
src/services/embedder/dedup.ts          — findNearDuplicate(): cosine > 0.98
src/services/embedder/types.ts          — JINA_DIMENSIONS=512
src/services/chunker/tokenizer.ts       — BPE cl100k_base (gpt-tokenizer)
src/services/chunker/hierarchical.ts    — heading-aware parent/child splitting
src/services/chunker/contextual.ts      — LLM-generated context prefixes
src/services/chunker/semantic.ts        — semantic boundary detection
src/services/chunker/types.ts           — ChunkResult, ChunkMetadata
src/db/schema.ts                        — Drizzle schema (vector(512), all tables)
drizzle-pg/0000–0011                    — all 12 migrations (review chain integrity)
```

## Review Checklist

### 1. Convex Combination Fusion (hybrid.ts)
- Is minmaxNormalize mathematically correct?
  - Empty array → []
  - Single element → [1.0]
  - All identical → [0.5] (not 0/0 NaN)
  - Normal case → values in [0, 1]
- Is `Math.min(...scores)` / `Math.max(...scores)` safe? (Stack overflow if >100K elements? Current max: topK*2 = ~40, so safe. But is this documented?)
- CC formula: `score = alpha * normVec + (1-alpha) * normFts`. Is it applied correctly?
- Missing channel (only vector OR only FTS): is 0.0 assigned for the absent channel? Is this the correct behavior or should absent = 0.5?
- Does the function preserve the `source` field correctly ("vector" / "fts" / "both")?
- When both maps have the same ID, is metadata preference correct (vector preferred)?

### 2. Adaptive Alpha Classifier (vectorstore/classifier.ts)
- Are FUSION_ALPHA constants imported correctly from types.ts?
- Does the classifier cover all query types reasonably?
- Are there false positives? E.g., "Compare Python and Java" — contains brackets-like patterns? `[` in "Java"? No, that specific string doesn't. But what about "array[0]"? That's code → alpha 0.2. Correct.
- Edge: empty string query → what happens? (split produces [], wordCount=0, falls through to keyword with alpha=0.3)
- Edge: single character query → wordCount=1, no question word → keyword (alpha=0.3). Reasonable.

### 3. FTS Multilingual (fts.ts)
- `websearch_to_tsquery('english', ...) || websearch_to_tsquery('russian', ...)` — is this valid PG syntax?
- Does `||` on tsquery produce correct union (OR) behavior?
- Does ts_rank with normalization flag `1` work correctly with the combined tsquery?
- Does `sanitizeFtsQuery` properly handle adversarial input? (SQL injection via tsquery operators?)
- What happens with CJK characters? (`'simple'` would have handled them — do english/russian configs drop CJK entirely?)
- Empty query after sanitization → returns [] early. Good.

### 4. Embedding Dimensions
- Is JINA_DIMENSIONS=512 used consistently everywhere? (embedder, schema, dedup, drift detection)
- schema.ts says vector(512) — matches JINA_DIMENSIONS?
- Does the Jina API call send `truncate_dim: 512`?
- Is the HNSW index in migration 0005 built for 512d?
- Cache key in cache.ts — does it include dimensions to avoid cross-dimension cache poisoning?

### 5. BPE Tokenizer (tokenizer.ts)
- Is lazy loading correct? (getEncoder is called once, cached in _encode)
- Is the fallback safe? (if gpt-tokenizer fails to import, uses word_count * 1.4)
- countTokensSync() — is it safe to call before first async countTokens()? (Returns word_count * 1.4 — documented?)
- Does the chunker use countTokens (async) or countTokensSync (sync)? Is this consistent with how chunking is called (BullMQ worker = async context)?

### 6. Schema & Migration Chain
- Do migrations 0000–0011 form a consistent chain? (No conflicts, no duplicate table creates)
- Migration 0004 drops and recreates tsv — does this invalidate the GIN index from 0001?
- Migration 0005 drops HNSW index, changes column to vector(512), rebuilds — is the SQL correct?
- Are all schema.ts table definitions aligned with what migrations create? (No orphan tables, no missing columns)
- Is the `duplicate_of` column used in dedup.ts present in the chunks table schema?

### 7. Embedding Cache (cache.ts)
- What's the cache key format? Does it include model + dimensions to avoid cache pollution?
- TTL_PASSAGE (30d) vs TTL_QUERY (4h) — are these applied to the right operations?
- What happens on Redis failure — does embedding fall back to API call?
- Is batch caching efficient? (MGET for lookup, individual SET for misses, or pipeline?)

## NOT in scope
- RAG pipeline flow (Reviewer 1)
- HTTP routes and error handling (Reviewer 2)
- Circuit breaker configuration (Reviewer 4)
- Auth and input validation (Reviewer 5)
