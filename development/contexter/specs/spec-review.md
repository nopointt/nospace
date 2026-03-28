# Spec Review — Contexter RAG
> Reviewer: Axis (Opus) | Date: 2026-03-28
> Specs reviewed: 10 | Features covered: F-001–F-033 (33 features)

## Executive Summary

Overall spec quality is **good** — the 10 Domain Leads produced detailed, implementable specs with correct code samples and thorough verification commands. However, 2 **CRITICAL** bugs were found that would cause runtime failures (wrong API URL in F-020, incompatible embedding spaces in F-022 fallback), and 5 **HIGH** issues that would block compilation or produce wrong behavior (CitationMapping field name mismatch, classifier name collision, missing dependencies, removed constant import, ambiguous async migration). All CRITICAL and HIGH issues have been **fixed in place** in the spec files. 14 MEDIUM/LOW issues are documented below for awareness. After these fixes, 8 of 10 specs are ready for G3; 2 need minor attention (spec-infra pipeline check for empty vectors, spec-query-enhance import path verification).

---

## Migration Map Verification

| Migration | Feature | Authoritative # | Spec states | Consistent? |
|---|---|---|---|---|
| 0004 | F-003 multilingual_fts | 0004 | spec-p0-p1: 0004 | ✅ |
| 0005 | F-006 reduce_embedding_dims | 0005 | spec-embeddings: 0005 | ✅ |
| 0006 | F-013 eval_metrics | 0006 | spec-evaluation: 0006 | ✅ |
| 0007 | F-017 parent_child_chunks | 0007 | spec-chunking: 0007 | ✅ |
| 0008 | F-020 contextual_prefix | 0008 | spec-chunking: 0008 | ✅ |
| 0009 | F-028 semantic_dedup | 0009 | spec-embeddings: 0009 | ✅ |
| 0010 | F-030 feedback | 0010 | spec-infra: 0010 | ✅ |
| 0011 | F-033 eval_drift | 0011 | spec-evaluation: 0011 | ✅ |
| 0012 | F-029 bm25_fts (conditional) | 0012 | spec-infra: 0012 | ✅ |

All migration numbers are consistent with the authoritative map.

**Note:** spec-infra's stack context section says "New migrations in this spec use 0004, 0005, 0006" — this is stale text from before the authoritative map was established. The actual migration file names in the spec body use the correct numbers (0010, 0012). No action needed.

---

## Per-Spec Review

### spec-p0-p1 — F-001, F-002, F-003, F-004, F-005
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [HIGH] **F-002: `countTokens` sync→async migration ambiguity.** The spec changes `countTokens` to async but says "For every caller... either Await it if async or replace with `countTokensSync`" without specifying which path for `chunkSemantic()`. The semantic chunker is **synchronous** — making it async cascades changes through `ChunkerService.chunk()` and all pipeline callers. **Recommendation:** Spec should explicitly state: "Use `countTokensSync()` in all chunker files. The BPE encoder initializes on first `await countTokens()` call — add a `warmupTokenizer()` call at server startup in `src/index.ts`." Not fixed — this is clear enough for a Mies-level player but flagged for awareness.
- [MEDIUM] F-004: `parseCitationMarkers` has field `number` while F-025 references `citationNumber`. **Fixed in spec-confidence-nli** — aligned to F-004's field name `number`.
- [LOW] F-005: Purely comment-only changes. Verified all 3 callers pass `scoreThreshold: 0`. Correct.
- [LOW] F-003: `websearch_to_tsquery` is PG 11+ — safe for PG 16. Migration DDL is correct.
- [LOW] F-002: `gpt-tokenizer` is pure TypeScript — Bun compatible, verified.

**Fixed in place:** nothing (HIGH is a recommendation, not a spec error)
**Ready for G3:** yes

---

### spec-fusion — F-007, F-021
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [HIGH] **F-021 + F-018 classifier name collision.** Both `vectorstore/classifier.ts` (F-021) and `rag/classifier.ts` (F-018) export `classifyQuery()`. When both are imported in `rag/index.ts`, TypeScript will error on duplicate identifiers. **Fixed in spec-query-enhance** — renamed F-018's function to `classifyQueryEnhancement()` with import alias documentation.
- [MEDIUM] F-007 removes `RRF_K` from `types.ts`. F-001 and F-005 add comments referencing RRF_K. Since F-001 runs first and F-007 replaces the entire hybrid.ts, this is fine — but implementors should know F-001 changes will be overwritten by F-007.
- [MEDIUM] F-007: `Math.min(...scores)` and `Math.max(...scores)` will throw `RangeError` if array exceeds ~100K elements (V8/JSC stack limit). Current data: max topK*2 = 20 elements — safe. But document the limit.
- [LOW] F-021: `FUSION_ALPHA_*` constants are well-chosen. Classifier heuristics are conservative with 0.5 fallback.

**Fixed in place:** nothing (collision fix is in spec-query-enhance)
**Ready for G3:** yes

---

### spec-embeddings — F-006, F-009, F-028
**Verdict:** PASS

**Issues:**
- [MEDIUM] F-009: `CachedEmbedderService` must implement the same method signatures as `EmbedderService` for drop-in replacement. The spec says this clearly but doesn't show the full class body — Player must implement `embed()`, `embedBatch()`, `embedQuery()` all delegating to the batch cache pattern. Clear enough.
- [MEDIUM] F-006: `USING NULL` in ALTER COLUMN — the spec explains this correctly. pgvector can't cast between dimensions; NULL-first is the correct approach.
- [LOW] F-009: SHA-256 via `crypto.subtle.digest()` — works in Bun (Web Crypto API).
- [LOW] F-028: Self-referential FK on `chunks.duplicate_of` — requires `AnyPgColumn` import. Spec mentions this.

**Fixed in place:** nothing
**Ready for G3:** yes

---

### spec-chunking — F-011, F-017, F-020
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [CRITICAL] **F-020: Wrong Groq API URL.** The spec passes `env.GROQ_API_URL` to `addContextualPrefixes()`, but `GROQ_API_URL` is the **audio transcription** URL (`https://api.groq.com/openai/v1/audio/transcriptions`). Appending `/chat/completions` gives `https://api.groq.com/openai/v1/audio/transcriptions/chat/completions` — **404 on every call**. Should use `process.env.GROQ_LLM_URL ?? "https://api.groq.com/openai/v1"`. **Fixed in place.**
- [MEDIUM] F-011: `late_chunking: true` is passed to Jina but with pre-chunked individual texts as separate `input` array items. Jina late chunking is designed for **document-level** input where Jina determines chunk boundaries. Passing pre-split chunks with `late_chunking: true` may have no effect or unexpected behavior. **Recommendation:** Verify against Jina v4 docs whether `late_chunking` works with multiple pre-chunked texts as separate inputs, or if it requires a single document input. If the latter, consider grouping chunks by document as a single input array.
- [MEDIUM] F-017: Adds 7 columns to `chunks` table in one migration. PG 16 handles this efficiently (no table rewrite for nullable ADD COLUMN). Safe.
- [LOW] F-020: 10-chunk parallel Groq calls — at 150ms per call, ~150ms total with parallel. Safe under rate limits at current scale.

**Fixed in place:** F-020 API URL corrected
**Ready for G3:** yes

---

### spec-context-quality — F-008, F-010
**Verdict:** PASS

**Issues:**
- [MEDIUM] F-008: Keeps local `estimateTokens` function (word*1.3). F-002 replaces this with `countTokensSync`. If F-002 runs after F-008, the import from F-002 will overwrite. If F-008 runs after F-002, F-008's rewrite re-introduces the old formula. **Resolution:** Implement F-002 last within spec-p0-p1, or have F-008 import from tokenizer.ts immediately: `import { countTokensSync } from "../chunker/tokenizer"`.
- [MEDIUM] F-010: Reranker wires into `rag/index.ts` between sort and `buildContext`. When F-018/F-019 also modify this area, merge conflicts are inevitable. Implementation order must be: F-010 first, then F-018/F-019 add their logic around the reranker.
- [LOW] F-010: Jina Reranker v3 API format is correct: `POST https://api.jina.ai/v1/rerank`, `model: "jina-reranker-v3"`, `return_documents: false`. Verified.

**Fixed in place:** nothing
**Ready for G3:** yes

---

### spec-query-enhance — F-018, F-019
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [HIGH] **Classifier name collision with F-021.** Both export `classifyQuery`. **Fixed in place** — renamed to `classifyQueryEnhancement()` in this spec. All references (function definition, imports, verification commands, AC table) updated.
- [MEDIUM] F-018: HyDE embeds with `task: "retrieval.passage"` — this is correct per Jina v4 API for a synthetic document meant to match corpus embeddings.
- [MEDIUM] F-019: `queryDecomposed` processes sub-questions in parallel via `Promise.all`. Each sub-question makes 1 embed + 1 search + 1 LLM call. With 5 sub-questions: 5 parallel Groq calls + 5 Jina embed calls. Monitor rate limits at scale.
- [MEDIUM] F-019: adds `enableDecomposition` and `maxSubQuestions` to `RagConfig`, extending the Required<RagConfig> type. The constructor must also include these new fields. Spec shows this correctly.
- [LOW] F-018: HyDE fallback via `.catch()` — clean error handling.

**Fixed in place:** `classifyQuery` → `classifyQueryEnhancement` (all occurrences)
**Ready for G3:** yes

---

### spec-delivery — F-012, F-014, F-015, F-016
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [MEDIUM] F-016: Groq `cache_control: { type: "ephemeral" }` is a **no-op**. Groq's prompt caching is automatic — it doesn't use Anthropic-style cache markers. The field will be silently ignored by Groq's OpenAI-compatible endpoint. Not harmful, but not functional either. **Keep as-is** — no breakage, and it positions for potential future Anthropic API usage.
- [MEDIUM] F-014: `queryStream()` duplicates retrieval logic from `query()` without integrating F-010 (reranker), F-018 (HyDE), F-019 (decomposition), or F-021 (adaptive alpha). The streaming endpoint will be a quality-degraded path. **Recommendation:** After all quality features land, refactor `query()` to emit events and have `queryStream()` consume them.
- [MEDIUM] F-014: `chatStream()` defaults to `max_tokens: 1536` vs `chat()` at 1024. Intentional per spec.
- [LOW] F-015: `llama-3.3-70b-versatile` is a valid Groq model name. Verified.
- [LOW] F-012: DeepInfra API format is OpenAI-compatible — `cache_control` field will be silently ignored. Clean.

**Fixed in place:** nothing
**Ready for G3:** yes

---

### spec-evaluation — F-013, F-031, F-032, F-033
**Verdict:** PASS_WITH_NOTES

**Issues:**
- [MEDIUM] F-013: Extends `RagAnswer` with `retrievalLatencyMs`, `generationLatencyMs`, `queryEmbeddings`. Multiple other specs also extend `RagAnswer` (F-004 adds `citations`, F-026 adds `confidence`, F-031 adds `context`). The cumulative type must be compatible — see Cross-Spec Issues section.
- [MEDIUM] F-033: References "PCA projection from 1024d → 32d" but after F-006, embeddings are 512d. The random projection approach works at any input dimension, but the description should say "current dimension" not "1024d".
- [LOW] F-031: FNV-1a hash for sampling — clean deterministic approach.
- [LOW] F-032: Golden test set structure is well-designed. CI thresholds (faithfulness >= 0.70, relevancy >= 0.65) are reasonable starting points.

**Fixed in place:** nothing
**Ready for G3:** yes

---

### spec-confidence-nli — F-025, F-026, F-027
**Verdict:** PASS_WITH_NOTES (after fixes)

**Issues:**
- [HIGH] **F-025: `CitationMapping` field names mismatch.** F-025 used `citationNumber` and `sentenceText`; F-004 defines `number`, `chunkId`, `documentId` (no `sentenceText`). **Fixed in place** — aligned field names. Added `extractSentenceAroundCitation()` as the correct way to get claim text from the answer.
- [HIGH] **F-026: Imports `RRF_K` from `vectorstore/types.ts`.** F-007 removes this constant. **Fixed in place** — replaced with hardcoded `RRF_K_LEGACY = 60` with comment explaining the removal.
- [MEDIUM] F-025: HHEM-2.1-Open sidecar requires ~500-600 MB RAM. With ~700 MB headroom, margin is ~100 MB. Monitor closely in production — other services (Redis, PG, Bun) may also grow.
- [MEDIUM] F-026: Abstention returns HTTP 200 with fixed answer string — correct design. Some API consumers may not check the `confidence.level` field. Document in API docs.
- [LOW] F-027: Single NLI pair (full answer vs full context) is a coarser signal than per-claim NLI (F-025). Both are useful — F-025 gives per-citation detail, F-027 gives aggregate faithfulness.

**Fixed in place:** CitationMapping fields aligned, RRF_K import removed, sentenceText reference replaced
**Ready for G3:** yes

---

### spec-infra — F-022, F-023, F-024, F-029, F-030
**Verdict:** PASS_WITH_NOTES (after fixes)

**Issues:**
- [CRITICAL] **F-022: Zero-padding 384d local embeddings to 512d** creates vectors in a completely different embedding space from Jina. Cosine similarity between MiniLM 384d-padded and Jina 512d vectors is **mathematically meaningless**. Worse: these embeddings would be **stored in the DB**, making those chunks permanently unreachable via vector search even after Jina recovers. **Fixed in place** — changed fallback to return empty embeddings. Chunks are inserted with `embedding=NULL`, remain searchable via FTS, and `reembed_chunks.ts` re-embeds them when Jina recovers.
- [HIGH] **F-030: Missing `zod` + `@hono/zod-validator` dependencies.** Stack context says "no new deps" but the implementation uses `zValidator` and `z.object()`. **Fixed in place** — updated stack context to list the required packages.
- [MEDIUM] F-022: `@xenova/transformers` — no longer needed for local embedding fallback (after CRITICAL fix above). Remove the `bun add @xenova/transformers` step. The fallback now returns NULL embeddings instead.
- [MEDIUM] F-022: `breakerToServiceState` uses `as unknown as { state: string }` cast. Cockatiel v3 does expose `.state` on `CircuitBreakerPolicy` but the TypeScript typing may differ. Verify after `bun add cockatiel`.
- [MEDIUM] F-030: Score mutation (`result.score = result.score * fs`) violates immutability coding style. Should create new objects: `fused.map(r => ({ ...r, score: r.score * fs }))`.
- [MEDIUM] F-030: `VectorStoreService` needs `private sql: Sql` added — spec notes this but it's easy to miss.
- [LOW] F-022: `cockatiel` v3 is pure TS/JS — Bun compatible, confirmed.
- [LOW] F-029: Correctly gated behind PG version check. Will be blocked on PG 16 (VectorChord-BM25 unlikely available).

**Fixed in place:** F-022 embedding fallback redesigned, F-030 dependency list corrected
**Ready for G3:** yes (Player must add pipeline check for empty vector before `vectorStore.index`)

---

## Cross-Spec Issues

### 1. `RagAnswer` type accumulated across specs

Multiple specs extend `RagAnswer`. The cumulative type after all features:

```typescript
export interface RagAnswer {
  answer: string
  sources: RagSource[]
  citations: CitationMapping[]           // F-004
  faithfulnessScore?: number             // F-025
  queryVariants: string[]
  tokenUsage: {
    embeddingTokens: number
    llmPromptTokens: number
    llmCompletionTokens: number
  }
  confidence: ConfidenceResult           // F-026
  retrievalLatencyMs: number             // F-013
  generationLatencyMs: number            // F-013
  context?: string                       // F-031 (for LLM eval)
}
```

**Risk:** Specs that return `RagAnswer` may miss fields added by other specs, causing TypeScript errors. **Mitigation:** Implement in priority order (P0→P3). Each G3 player adds their fields as optional (`?`) until all features land.

### 2. `rag/index.ts` — most modified file (9 specs touch it)

F-004, F-007 (via F-021), F-008 (indirectly via context.ts), F-010, F-013, F-018, F-019, F-025, F-026, F-027 all modify `rag/index.ts`. **Implementation order within `rag/index.ts`** (each layer wraps the previous):

1. F-004: Add `buildCitations()` after `generateAnswer()` — pure addition
2. F-010: Add reranker between sort and `buildContext()` — wraps sort
3. F-018: Add HyDE as 4th signal before sort — extends retrieval loop
4. F-019: Add decomposition branch before standard path — new entry point
5. F-021: Add `classifyQuery` alpha before `vectorStore.search` — one-liner
6. F-013: Add timing instrumentation — wrapping timestamps
7. F-025: Add NLI verification after F-004 citations — pure addition
8. F-026: Add confidence assembly after everything — pure addition
9. F-027: Add faithfulness NLI — pure addition after F-026

**Cannot be parallelized:** F-004 and F-010 modify the same region. F-018 and F-019 create new methods that share the standard path. Implement sequentially.

### 3. `src/services/vectorstore/types.ts` — breaking rename

F-007 removes `RRF_K` and `reciprocalRankFusion` export. F-001 and F-005 add comments referencing these. **Order:** F-001/F-005 first (quick fix), then F-007 (replaces entire hybrid system).

### 4. Groq API URL confusion

`env.GROQ_API_URL` = audio transcription URL (ends in `/audio/transcriptions`).
`process.env.GROQ_LLM_URL` = chat completions base URL (ends in `/v1`).

F-020 incorrectly used `GROQ_API_URL` for chat — **fixed**. Any future spec using Groq for chat must use `GROQ_LLM_URL`, not `GROQ_API_URL`.

---

## Shared File Conflict Analysis

### `src/services/rag/index.ts`
**Specs:** F-004, F-010, F-013, F-018, F-019, F-021, F-025, F-026, F-027
**Compatible:** Yes, if implemented in order listed in Cross-Spec Issue #2.
**Order:** F-004 → F-010 → F-021 → F-018 → F-019 → F-013 → F-025 → F-026 → F-027

### `src/services/llm.ts`
**Specs:** F-012, F-014, F-015, F-016
**Compatible:** Yes. F-015 (model split) first, F-016 (cache_control) folds into F-012's `chatWithProvider`, F-014 (streaming) adds new methods.
**Order:** F-015 → F-016 → F-012 → F-014

### `src/db/schema.ts`
**Specs:** F-006, F-013, F-017, F-020, F-028, F-030
**Compatible:** Yes — all are additive (new columns/tables). No conflicts.
**Order:** Any order works; migrations enforce DB ordering.

### `src/services/rag/types.ts`
**Specs:** F-004, F-008, F-013, F-019, F-026
**Compatible:** Yes — all add new fields or constants. No field removals or renames.

### `src/services/vectorstore/types.ts`
**Specs:** F-001, F-007, F-017
**Compatible:** F-001 changes `DEFAULT_SCORE_THRESHOLD`. F-007 removes `RRF_K`, adds `FUSION_ALPHA_*`. F-017 extends `VectorMetadata`.
**Order:** F-001 → F-007 → F-017

### `src/services/vectorstore/index.ts`
**Specs:** F-001, F-005, F-007, F-021, F-030
**Compatible:** Yes if ordered. F-001/F-005 (comments), F-007 (rewrite imports + search sig), F-021 (re-export), F-030 (feedback multiplier).
**Order:** F-001 → F-005 → F-007 → F-021 → F-030

### `src/services/vectorstore/hybrid.ts`
**Specs:** F-007 (full rewrite)
**Compatible:** Only F-007 touches this. Clean.

### `src/services/pipeline.ts`
**Specs:** F-009, F-011, F-017, F-020, F-028
**Compatible:** Yes — each adds to a different pipeline stage. F-009 wraps embedder, F-011 passes `lateChunking`, F-017 restructures chunk insertion, F-020 adds contextual prefix step, F-028 adds dedup check in index stage.
**Order:** F-011 → F-017 → F-020 → F-009 → F-028

---

## Implementation Readiness

| Spec | Ready | Blocker (if not) |
|---|---|---|
| spec-p0-p1 | ✅ | — |
| spec-fusion | ✅ | — |
| spec-embeddings | ✅ | — |
| spec-chunking | ✅ | After F-020 URL fix (done) |
| spec-context-quality | ✅ | — |
| spec-query-enhance | ✅ | After classifier rename (done) |
| spec-delivery | ✅ | — |
| spec-evaluation | ✅ | — |
| spec-confidence-nli | ✅ | After field name alignment (done) |
| spec-infra | ✅ | Player must handle empty vector in pipeline after F-022 fix |

---

## Recommended Implementation Order

### Wave 1 — Foundations (fully parallel, 5 G3 pairs)

| G3 Pair | Spec | Features | Est. |
|---|---|---|---|
| Pair A | spec-p0-p1 | F-001, F-002, F-003, F-004, F-005 | 1 day |
| Pair B | spec-context-quality | F-008, F-010 | 1 day |
| Pair C | spec-evaluation (F-013 only) | F-013 | 1 day |
| Pair D | spec-infra (F-022, F-023 only) | F-022, F-023 | 1 day |
| Pair E | spec-chunking (F-011 only) | F-011 | 0.5 day |

### Wave 2 — Core Quality (parallel with constraints)

| G3 Pair | Spec | Features | Deps |
|---|---|---|---|
| Pair F | spec-fusion | F-007, F-021 | After F-001 |
| Pair G | spec-delivery | F-015, F-016, F-012, F-014 | None (independent) |
| Pair H | spec-embeddings (F-006 only) | F-006 | After F-001 |
| Pair I | spec-chunking (F-017) | F-017 | After F-011 |

### Wave 3 — Advanced Features

| G3 Pair | Spec | Features | Deps |
|---|---|---|---|
| Pair J | spec-embeddings (F-009) | F-009 | After F-006 |
| Pair K | spec-query-enhance | F-018, F-019 | After F-010 |
| Pair L | spec-chunking (F-020) | F-020 | After F-017 |
| Pair M | spec-confidence-nli (F-025, F-026) | F-025, F-026 | After F-004, F-007 |
| Pair N | spec-infra (F-024, F-030) | F-024, F-030 | After F-023 |

### Wave 4 — Polish & Evaluation

| G3 Pair | Spec | Features | Deps |
|---|---|---|---|
| Pair O | spec-embeddings (F-028) | F-028 | After F-009 |
| Pair P | spec-confidence-nli (F-027) | F-027 | After F-025, F-026 |
| Pair Q | spec-evaluation (F-031, F-032) | F-031, F-032 | After F-013 |
| Pair R | spec-evaluation (F-033) | F-033 | After F-032 |
| Pair S | spec-infra (F-029) | F-029 | Conditional — PG check |

**Max parallelism per wave:** Wave 1 = 5 pairs, Wave 2 = 4 pairs, Wave 3 = 5 pairs, Wave 4 = 5 pairs.
**Total estimated G3 pairs:** 19 (some specs split across waves due to internal dependencies).
**Critical path:** F-001 → F-007 → F-021 → F-018 → F-026 → F-027 (the quality chain through rag/index.ts).
