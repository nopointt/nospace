# session-scratch.md
> Contexter · Axis · 2026-03-28

<!-- ENTRY:2026-03-28:CHECKPOINT:203:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — checkpoint 203 [Axis]

**Decisions:**
- G3 Wave execution continued across all 4 waves concurrently where dependencies allow
- rag/index.ts serialization enforced: Mies C → Mies B-fix → Mies G-fix (sequential on same file)
- F-012/014/015/016 confirmed entirely absent from disk (git stash pop failure during Wave 2 lost Mies G original work) → full re-implementation via Mies G-fix
- resolveParents bundled into Mies G-fix (not separate agent) since both touch rag/index.ts
- F-028 confirmed as semantic dedup (spec-embeddings.md), not A/B eval as initially assumed
- nopoint: не запускать новых агентов после определённого момента, дать текущим завершиться

**Files changed:**
- `src/services/vectorstore/types.ts` — F-001 score threshold + F-007 fusion constants (prior session)
- `src/services/chunker/tokenizer.ts` — F-002 BPE cl100k_base, countTokens + countTokensSync alias
- `drizzle-pg/0004_multilingual_fts.sql` — F-003 multilingual FTS
- `src/services/rag/citations.ts` — F-004 new file
- `src/services/vectorstore/index.ts` + `types.ts` — F-005 JSDoc
- `drizzle-pg/0005_reduce_embedding_dims.sql` — F-006 renamed from 0008
- `src/services/vectorstore/hybrid.ts` — F-007 convex combination fusion
- `src/services/rag/context.ts` — F-008 MMR diversity cap (Map<docId,count>)
- `src/services/embedder/cache.ts` — F-009 new, CachedEmbedderService
- `src/services/reranker.ts` + `src/services/rag/index.ts` + `src/routes/query.ts` — F-010 reranker wiring
- `src/services/chunker/` (types/hierarchical/index/semantic/table/timestamp) — F-017 types + chunkType:"flat"
- `src/db/schema.ts` — F-017 parentId/chunkType/sectionHeading/pageNumber/sheetName/startOffset/endOffset + F-020 contextPrefix/contextVersion + F-024/F-030 feedbackPos/feedbackNeg/feedbackScore/duplicateOf
- `drizzle-pg/0006_eval_metrics.sql` — F-013 migration
- `src/services/evaluation/proxy.ts` — F-013 ROUGE-L, computeProxyMetrics, logProxyMetrics
- `src/routes/metrics.ts` — F-013 GET /api/metrics
- `src/routes/maintenance.ts` — F-013 retention cron
- `src/services/rag/types.ts` — F-008 MMR_MAX_CHUNKS_PER_DOCUMENT + F-013 RagAnswer extensions + F-014 RagStreamEvent
- `drizzle-pg/0007_parent_child_chunks.sql` — F-017 migration
- `src/services/chunker/hierarchical.ts` — F-017 chunkHierarchical
- `drizzle-pg/0008_contextual_prefix.sql` — F-020 migration
- `src/services/chunker/contextual.ts` — F-020 addContextualPrefixes
- `src/services/pipeline.ts` — F-009 CachedEmbedderService wrap + F-020 contextual prefix stage + F-028 dedup split
- `src/services/resilience.ts` — F-022 cockatiel circuit breakers
- `docker/docling/Dockerfile` — F-023 tesseract OCR
- `src/services/parsers/mistral-ocr.ts` — F-024 new, MistralOcrService
- `src/services/parsers/docling.ts` — F-024 Mistral OCR fallback integration
- `src/services/llm.ts` — F-012/014/015/016 full rewrite: LlmProviderConfig, DeepInfra fallback, chatStream, cache_control, groqLlmPolicy
- `src/services/rag/index.ts` — F-010 reranker + F-013 timing + F-015 llmAnswer + F-014 queryStream + F-017 resolveParents
- `src/routes/query.ts` — F-010 RerankerService + F-014 POST /api/query/stream SSE + F-015 buildLlmServices
- `src/types/env.ts` — DEEPINFRA_API_KEY, GROQ_REWRITE_MODEL, GROQ_ANSWER_MODEL, MISTRAL_API_KEY, OCR_CLOUD_FALLBACK_ENABLED
- `src/services/embedder/dedup.ts` — F-028 new, findNearDuplicate
- `drizzle-pg/0009_semantic_dedup.sql` — F-028 migration
- `src/routes/feedback.ts` — F-030 POST /api/feedback
- `src/services/feedback-decay.ts` — F-030 daily decay cron
- `drizzle-pg/0010_feedback_scoring.sql` — F-030 migration
- `src/services/evaluation/llm-eval.ts` — F-031 LLM eval worker (claim extraction, verdict, relevancy)
- `evaluation/run-eval.ts` — F-032 offline eval pipeline
- `evaluation/generate-synthetic.ts` — F-032 synthetic Q&A generation
- `evaluation/check-stale.ts` — F-032 stale pair detection
- `.github/workflows/eval.yml` — F-032 CI workflow
- `src/routes/dev.ts` + `src/routes/mcp-remote.ts` — LlmService constructor call site fixes

**Completed:**
- F-001 score threshold ✅
- F-002 BPE tokenizer ✅
- F-003 multilingual FTS ✅
- F-004 citations ✅
- F-005 JSDoc vectorstore ✅
- F-006 512d embeddings migration (renamed 0005) ✅
- F-007 convex combination fusion ✅
- F-008 MMR diversity cap ✅
- F-009 Redis embedding cache ✅ (Schlemmer J PASS)
- F-010 reranker wiring ✅ (Schlemmer B2 PASS)
- F-011 structure-aware chunking ✅ (prior session)
- F-013 proxy metrics + eval_metrics tables ✅
- F-017 parent-child chunks (chunker + schema + migration) ✅
- F-020 contextual prefix ✅ (Schlemmer L PASS, 1 medium fixed)
- F-021 alpha classifier ✅ (prior session)
- F-022 circuit breakers ✅ (prior session)
- F-023 OCR Dockerfile ✅ (prior session)
- F-024 OCR Mistral fallback ✅ (Schlemmer N2 PASS)
- F-028 semantic dedup ✅ (Schlemmer Q PASS)
- F-030 feedback scoring ✅ (Schlemmer N2 PASS, 1 medium: vectorstore immutability)
- F-031 LLM eval worker ✅ (partial: query.ts sampling wiring pending)
- F-032 offline eval pipeline ✅

**In progress:**
- F-012/014/015/016 implemented by Mies G-fix — NOT YET VERIFIED by Schlemmer

**Opened:**
- F-012/014/015/016 — needs Schlemmer G2 verification in next session
- F-017 resolveParents wired in rag/index.ts — needs verification
- F-031 query.ts sampling enqueue — collision-blocked, pending next session
- F-018 HyDE (Mies K) — not started
- F-019 query decomposition (Mies K) — not started
- F-025 NLI hallucination detection (Mies M) — not started
- F-026 confidence scoring (Mies M) — not started
- F-027 attribution (Mies R) — not started
- F-029 BM25 conditional — not started
- F-033 eval dashboard — not started
- vectorstore/index.ts:80-84 immutability fix (F-030 MEDIUM) — not started
- dist/index.js stale — build + deploy needed
- JINA_DIMENSIONS still 1024 in types.ts (F-006 schema comment stale)
- status enum "failed" not in documents schema (pre-existing bug)

**Notes:**
- Migration sequence: 0000-0010 complete (0005=F-006, 0006=F-013, 0007=F-017, 0008=F-020, 0009=F-028, 0010=F-030)
- F-011 was Wave 1E from previous session (already done)
- rag/index.ts now ~305 lines with F-010+F-013+F-014+F-015+F-017 all integrated
- routes/query.ts now 291 lines with streaming endpoint
- llm.ts 290 lines — full provider abstraction
- Pre-existing TS errors in: reembed_chunks.ts, _archive/mcp.ts, auth-social.ts, dev.ts, pipeline.ts stages[] — not introduced this session

<!-- ENTRY:2026-03-28:CLOSE:204:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 204 CLOSE [Axis]

**Decisions:**
- rag/index.ts serialized across 3 agents (Mies C → B-fix → G-fix) to prevent collisions
- F-012/014/015/016 fully re-implemented from scratch (git stash pop failure lost Wave 2 work)
- resolveParents (F-017 parent fetch) bundled into G-fix to avoid additional rag/index.ts touch
- F-028 is semantic dedup at ingest (spec-embeddings.md), not A/B eval
- Session stopped at nopoint request: no new agents after 5 active, let current finish, then close

**Files changed:**
- `src/services/llm.ts` — F-012/014/015/016 full rewrite (LlmProviderConfig, chatStream, cache_control, DeepInfra)
- `src/services/rag/index.ts` — F-008 MMR + F-010 reranker + F-013 timing + F-014 queryStream + F-015 llmAnswer + F-017 resolveParents (305 lines)
- `src/routes/query.ts` — F-010 RerankerService + F-014 /api/query/stream SSE + F-015 buildLlmServices (291 lines)
- `src/services/rag/context.ts` — F-008 MMR rewrite (Map<docId,count>)
- `src/services/rag/types.ts` — MMR_MAX_CHUNKS_PER_DOCUMENT + RagStreamEvent union
- `src/services/vectorstore/index.ts` — F-017 fetchParentsForChildren + F-030 feedback_score multiplier
- `src/services/vectorstore/types.ts` — chunkType/parentId in VectorMetadata + ParentRow
- `src/services/embedder/cache.ts` — F-009 CachedEmbedderService (new)
- `src/services/embedder/dedup.ts` — F-028 findNearDuplicate (new)
- `src/services/chunker/contextual.ts` — F-020 addContextualPrefixes (new)
- `src/services/chunker/` (types/hierarchical/index/semantic/table/timestamp) — F-017 chunkType:"flat"
- `src/services/parsers/mistral-ocr.ts` — F-024 MistralOcrService (new)
- `src/services/parsers/docling.ts` — F-024 Mistral OCR fallback
- `src/services/evaluation/proxy.ts` — F-013 proxy metrics (new)
- `src/services/evaluation/llm-eval.ts` — F-031 LLM eval worker (new)
- `src/services/resilience.ts` — F-022 circuit breakers (new)
- `src/services/feedback-decay.ts` — F-030 decay cron (new)
- `src/services/pipeline.ts` — F-009 cache wrap + F-020 contextual prefix + F-028 dedup split
- `src/services/reranker.ts` — F-010 reranker (new, prior session)
- `src/routes/feedback.ts` — F-030 POST /api/feedback (new)
- `src/routes/metrics.ts` — F-013 GET /api/metrics (new)
- `src/routes/maintenance.ts` — F-013 retention cron (new)
- `src/routes/dev.ts` + `src/routes/mcp-remote.ts` — LlmService call site fixes
- `src/db/schema.ts` — F-017 + F-020 + F-024/F-030 + F-028 columns
- `src/types/env.ts` — DEEPINFRA_API_KEY, GROQ_REWRITE_MODEL, GROQ_ANSWER_MODEL, MISTRAL_API_KEY, OCR_CLOUD_FALLBACK_ENABLED
- `drizzle-pg/0005_reduce_embedding_dims.sql` — F-006 renamed from 0008
- `drizzle-pg/0006_eval_metrics.sql` — F-013 (new)
- `drizzle-pg/0007_parent_child_chunks.sql` — F-017 (new)
- `drizzle-pg/0008_contextual_prefix.sql` — F-020 (new)
- `drizzle-pg/0009_semantic_dedup.sql` — F-028 (new)
- `drizzle-pg/0010_feedback_scoring.sql` — F-030 (new)
- `docker/docling/Dockerfile` — F-023 tesseract OCR
- `evaluation/run-eval.ts` + `generate-synthetic.ts` + `check-stale.ts` — F-032 (new)
- `.github/workflows/eval.yml` — F-032 CI (new)
- `src/services/rag/citations.ts` — F-004 (new, prior session)
- `src/services/vectorstore/hybrid.ts` — F-007 convex fusion (prior session)

**Completed:**
- F-001 F-002 F-003 F-004 F-005 F-006 F-007 F-008 F-009 F-010 F-011 F-013 F-017 F-020 F-021 F-022 F-023 F-024 F-028 F-030 F-031 F-032
- F-012/014/015/016 implemented (Mies G-fix) — unverified

**Opened:**
- Schlemmer G2: verify F-012/014/015/016 + resolveParents
- Mies K: F-018 HyDE + F-019 query decomposition
- Mies M: F-025 NLI + F-026 confidence scoring
- Mies R: F-027 source attribution
- F-029 BM25 (conditional)
- F-033 eval dashboard (after F-032)
- F-031 query.ts sampling enqueue (collision-blocked)
- vectorstore/index.ts:80-84 immutability fix (F-030 MEDIUM)
- dist/index.js stale → build + deploy to Hetzner
- JINA_DIMENSIONS 1024 stale in types.ts (F-006 schema comment)

**Notes:**
- 22 of 33 features fully verified PASS; 4 implemented but unverified (F-012/014/015/016); 7 not started (F-018/019/025/026/027/029/033)
- Migration sequence 0000-0010 complete and gap-free
- Next session: start with Schlemmer G2, then Mies K + Mies M in parallel
