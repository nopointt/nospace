# Shared Context — Contexter Code Review

> This context block is included in every reviewer prompt. Do not repeat — reference as "see shared context".

## Project

Contexter = RAG-as-a-service. Any file → API endpoint with knowledge base. MCP-native.
Solo founder project, pre-launch. No real users yet. Production deployed on Hetzner.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Bun 1.x (oven/bun:1-alpine) |
| API | Hono 4.x |
| DB | PostgreSQL 16 + pgvector 0.8.2 |
| FTS | tsvector + GIN (english + russian) |
| Vector | pgvector HNSW (512d cosine) |
| ORM | Drizzle ORM (postgresql driver, raw SQL tagged templates) |
| Cache | Redis 7 (ioredis) |
| Queue | BullMQ 5.x (Redis-backed) |
| Embeddings | Jina v4 (512d, MRL truncated from 1024) |
| LLM (rewrite) | Groq llama-3.1-8b-instant |
| LLM (answer) | Groq llama-3.3-70b-versatile |
| LLM fallback | DeepInfra (OpenAI-compatible) |
| NLI | HHEM-2.1-Open (Python sidecar, localhost:8765) |
| Reranker | Jina Reranker v3 |
| Parser | Docling (IBM, Docker container) |
| OCR | Tesseract (local) + Mistral OCR (cloud fallback) |
| Resilience | cockatiel v3 (circuit breakers, bulkhead) |
| Reverse proxy | Caddy (TLS, CF origin cert) |
| Monitoring | Netdata |
| Server | Hetzner CAX11 (2 ARM vCPU, 4GB RAM, Helsinki) |

## Source Layout

```
src/
  index.ts                     — entry point, Hono app, BullMQ worker, Bun server
  types/env.ts                 — Env interface (all env vars)
  db/schema.ts                 — Drizzle schema (users, documents, chunks, jobs, shares, subscriptions, payments, feedback, eval_*)
  db/connection.ts             — postgres connection
  routes/                      — 17 Hono route modules
    auth.ts, auth-social.ts, oauth.ts, billing.ts, dev.ts, documents.ts,
    feedback.ts, health.ts, maintenance.ts, mcp-remote.ts, metrics.ts,
    pipeline.ts, query.ts, retry.ts, status.ts, upload.ts, webhooks.ts
  services/
    auth.ts                    — resolveAuth(), token validation
    billing.ts                 — NOWPayments crypto billing
    llm.ts                     — LlmService (Groq primary, DeepInfra fallback, streaming)
    nli.ts                     — NLI sidecar client (HHEM-2.1-Open)
    reranker.ts                — Jina Reranker v3
    resilience.ts              — cockatiel circuit breakers (Jina, Groq)
    pipeline.ts                — document processing pipeline
    queue.ts                   — BullMQ queue/worker setup
    feedback-decay.ts          — daily feedback score decay (BullMQ cron)
    rag/
      index.ts                 — RagService: query(), queryStandard(), queryDecomposed(), queryStream()
      types.ts                 — RagAnswer, RagQuery, RagConfig, RagStreamEvent, ConfidenceResult, etc.
      classifier.ts            — classifyQueryEnhancement() for HyDE/decomposition gating
      hyde.ts                  — generateHyde() — hypothetical document embeddings
      decomposition.ts         — decomposeQuery(), answerSubQuestions(), synthesizeAnswers()
      confidence.ts            — Tier 1-3 confidence scoring, parseGroundingJson(), computeFaithfulnessNli()
      citations.ts             — parseCitationMarkers(), buildCitations(), splitIntoClaims(), NLI verification helpers
      context.ts               — buildContext() with document-level diversity cap
      rewriter.ts              — rewriteQuery() — 3 query paraphrases via LLM
    vectorstore/
      index.ts                 — VectorStoreService: search(), fetchParentsForChildren()
      types.ts                 — HybridSearchResult, SearchOptions, FUSION_ALPHA constants
      hybrid.ts                — convexCombinationFusion() (replaced RRF this session)
      classifier.ts            — classifyQuery() for adaptive alpha (code/keyword/semantic/default)
      fts.ts                   — FtsService: websearch_to_tsquery (english || russian)
      vector.ts                — VectorService: pgvector cosine search
    embedder/
      index.ts                 — EmbedderService: embed(), embedBatch() (Jina v4 API)
      cache.ts                 — CachedEmbedderService (Redis, 30d TTL)
      dedup.ts                 — findNearDuplicate() (cosine > 0.98)
      types.ts                 — JINA_DIMENSIONS=512, JINA_MODEL, EmbedderOptions
    chunker/
      index.ts                 — ChunkerService orchestrator
      hierarchical.ts          — heading-aware parent/child splitting
      semantic.ts              — semantic boundary detection
      contextual.ts            — LLM-generated context prefixes
      table.ts, timestamp.ts   — specialized chunk strategies
      tokenizer.ts             — BPE cl100k_base (gpt-tokenizer, with sync fallback)
      types.ts                 — ChunkResult, ChunkMetadata
    parsers/                   — Docling, Mistral OCR, audio (Whisper), video (ffmpeg), YouTube
    evaluation/
      proxy.ts                 — 10 proxy metrics (zero LLM cost)
      llm-eval.ts              — RAGAS LLM eval (faithfulness, relevancy)
      drift.ts                 — embedding drift detection (random projection + MMD)
    mcp/                       — MCP Streamable HTTP server (12 tools)
evaluation/                    — canary.ts, run-eval.ts, generate-synthetic.ts, golden/
services/nli-sidecar/          — Python FastAPI (HHEM-2.1-Open), Dockerfile
monitoring/                    — Netdata collector + alert rules
drizzle-pg/                    — 12 migrations (0000–0011)
docker-compose.yml             — 7 services (app, postgres, redis, caddy, docling, netdata, nli-sidecar)
```

## RAG Pipeline Flow

```
query → classifyQueryEnhancement (HyDE/decompose gate)
  ├─ shouldDecompose → decompose → N sub-queries → parallel retrieve+answer → synthesize
  └─ standard path:
       ├─ rewriteQuery (3 paraphrases, 8B)
       ├─ generateHyde (if shouldHyde, parallel with rewrite)
       ├─ classifyQuery → alpha (adaptive fusion weight)
       ├─ embedBatch (Jina v4, 512d)
       ├─ vectorStore.search (CC fusion: alpha*vec + (1-alpha)*fts) × 4 variants + HyDE
       ├─ rankResults (Jina Reranker v3, optional)
       ├─ resolveParents (child→parent content)
       ├─ buildContext (diversity cap, token budget)
       ├─ generateAnswer (70B, with grounding JSON instruction)
       ├─ parseGroundingJson (strip LLM self-assessment)
       ├─ buildCitations ([N] markers → sources)
       ├─ verifyClaimsNli (per-citation NLI, best-effort)
       ├─ computeFaithfulnessNli (whole-answer NLI, best-effort)
       ├─ assembleConfidence (Tier1 retrieval + Tier2 grounding + Tier3 faithfulness)
       └─ abstention if confidence.level === "insufficient"
```

## What Changed This Session

32/33 RAG quality features implemented. Key changes:
- F-001: RRF score threshold 0.3→0 (was filtering ALL results)
- F-002: BPE tokenizer (gpt-tokenizer cl100k_base)
- F-003: FTS multilingual (english+russian websearch_to_tsquery)
- F-006: Embedding dims 1024→512 (code only, migration pending)
- F-007: CC fusion replacing RRF (full hybrid.ts rewrite)
- F-018: HyDE (classifier.ts + hyde.ts)
- F-019: Query decomposition (decomposition.ts)
- F-021: Adaptive alpha wiring (classifier → search → CC fusion)
- F-025: NLI citation verification (nli.ts + sidecar)
- F-026: Confidence scoring Tier 1+2 (confidence.ts)
- F-027: NLI faithfulness Tier 3
- F-033: Drift detection + canary queries

## Output Format (mandatory for all reviewers)

For each finding:
```
### [SEVERITY] — Short title

**File:** `path/to/file.ts:line`
**Category:** [correctness | performance | security | maintainability | reliability]
**Description:** What the issue is and why it matters.
**Recommendation:** Specific fix, with code if applicable.
```

Severity levels:
- **CRITICAL** — Will cause runtime failures, data loss, or security breach in production
- **HIGH** — Incorrect behavior under realistic conditions, or significant performance issue
- **MEDIUM** — Edge case bug, code smell that increases future bug risk, or missing validation
- **LOW** — Style, naming, minor optimization, documentation gap

End with a summary table:
```
| # | Severity | File | Title |
|---|---|---|---|
```
