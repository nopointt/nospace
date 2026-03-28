All fixes are in. I cannot run the build because the Bash tool is denied in this session. Here is a full summary of what was done.

---

## Summary

All 15 fixes applied across 9 files. Bash is denied in this session — the build step needs to be run manually:

```
cd C:/Users/noadmin/nospace/development/contexter && bun build --target=bun --outdir=dist --entry-point src/index.ts
```

### Files changed

**`src/services/chunker/semantic.ts`**
- FIX 1: Import changed to `countTokensSync`, all 5 `countTokens(` calls replaced
- FIX 11: `getOverlapText` now uses BPE-based char-proportion calculation instead of word tokenizer

**`src/services/chunker/table.ts`**
- FIX 1: Import changed to `countTokensSync`, all `countTokens(` calls replaced

**`src/services/chunker/timestamp.ts`**
- FIX 1: Import changed to `countTokensSync`, all `countTokens(` calls replaced

**`src/services/embedder/index.ts`**
- FIX 2: Null guard added after `embedBatch` in `embed()` — throws with explicit message on empty response
- FIX 3: Retry condition changed from `attempt < maxRetries` to `attempt < maxRetries - 1` — eliminates sleep on final attempt before throw

**`src/services/vectorstore/fts.ts`**
- FIX 4: `sanitizeFtsQuery` updated to preserve `"`, `'`, `-`, `|`, `(`, `)` operators; docstring updated from `plainto_tsquery` to `websearch_to_tsquery`

**`src/services/vectorstore/hybrid.ts`**
- FIX 5: Explicit comment added to single-element normalization case explaining promotion-by-design

**`src/services/vectorstore/index.ts`**
- FIX 6: Length mismatch guard added at top of `fetchParentsForChildren`
- FIX 9: In-place `result.score` mutation replaced with immutable `.map()` + new sort + filter
- FIX 12: JSDoc updated from "Reciprocal Rank Fusion" to "Convex Combination Fusion (CC)"

**`src/services/vectorstore/classifier.ts`**
- FIX 7: Empty string early-return added at top of `classifyQuery`
- FIX 8: Parens pattern tightened to `/\w+\s*\([^)]*\)/`; brackets pattern tightened to `/\w+\[[\w\d:,]+\]/`

**`src/services/vectorstore/types.ts`**
- FIX 13: `RRF_K` JSDoc expanded with "ONLY used by confidence.ts" and backward-compat context

**`src/services/chunker/contextual.ts`**
- FIX 14: `documentText` truncated to 12000 chars (`~3000 tokens`) before sending to Groq

**`src/services/embedder/dedup.ts`**
- FIX 15: Comment added documenting that the HNSW index is global, user scoping is a post-filter, and the multi-tenant scale caveat

**`drizzle-pg/0005_reduce_embedding_dims.sql`**
- FIX 10: `USING NULL` clause removed — column already NULL from the preceding `UPDATE`, so the cast is a no-op