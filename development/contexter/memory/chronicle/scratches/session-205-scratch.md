# session-scratch.md
> Active · Axis · 2026-03-28 · session e329bace · epic: contexter-gtm

<!-- ENTRY:2026-03-28:CLOSE:205:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — session 205 CLOSE [Axis]

**Decisions:**
- CC fusion (Convex Combination) replaces RRF — scores now in [0,1], alpha adaptive per query type
- BPE tokenizer (gpt-tokenizer cl100k_base) replaces whitespace counting
- FTS multilingual: english + russian websearch_to_tsquery
- Embedding dims reduced 1024→512 (code done, migration pending deploy)
- NLI sidecar: HHEM-2.1-Open, Python FastAPI, non-root, async model load, pinned deps
- 5-domain professional review conducted (RAG, API, Data, Infra, Security)
- 2 CRITICAL findings debunked as false positives (countTokensSync already used, embed() already guarded)
- mode: "auto" on Agent tool enables subagent writes without permission prompts

**Files changed (key — ~60 files total):**
- `src/services/rag/` — classifier.ts, hyde.ts, decomposition.ts, confidence.ts (NEW); index.ts heavily modified
- `src/services/vectorstore/hybrid.ts` — full rewrite (RRF→CC)
- `src/services/vectorstore/classifier.ts` — adaptive alpha
- `src/services/vectorstore/fts.ts` — websearch_to_tsquery multilingual
- `src/services/chunker/tokenizer.ts` — BPE cl100k_base
- `src/services/llm.ts` — chatStream passthrough fallback, extractContextPassthrough
- `src/services/nli.ts` — NLI client with health coalesce
- `src/services/evaluation/drift.ts` — projection matrix persistence fix
- `src/services/embedder/index.ts` — jinaRateLimiter wiring, null guard, retry fix
- `src/db/schema.ts` — vector(512), evalDriftBaseline.projectionMatrix
- `src/index.ts` — Hono onError, Redis error handler, SIGTERM redis.quit
- `src/routes/auth.ts` — email re-registration → 409 (was returning token)
- `src/routes/query.ts` — SSE event: field, cancel handler, error sanitization
- `src/routes/mcp-remote.ts` — tools/list auth, rename sanitize, storage limits, magic-byte validation
- `src/routes/documents.ts`, `status.ts` — share token delete protection
- `docker-compose.yml` — mem limits all services, Netdata port closed, PG/Redis healthchecks
- `services/nli-sidecar/` — non-root, async load, torch CPU pinned
- `review/` — 18 files (prompts, findings, fix plans, coverage matrix)

**Completed:**
- 32/33 RAG features (F-001–F-028, F-030–F-033)
- 78/102 review findings fixed
- All 8 CRITICAL + all HIGH security findings closed
- NLI Python sidecar created
- Drift detection + canary queries (F-033)
- Full 5-domain professional code review with domain expert agents

**Opened:**
- ~12 MEDIUM/LOW review fixes remaining (decomposition NLI wiring, parser circuit breakers, pipeline dedup, etc.)
- Deploy to production (migrations 0004-0011, re-embed on 512d, NLI sidecar build)
- F-029 BM25 (blocked: PG 17+)

**Notes:**
- Production server still runs old code — deploy needed
- Migrations 0004 (FTS multilingual) and 0005 (512d) require re-indexing
- NLI sidecar needs Docker build on server (ARM64, ~600MB model download on first run)
- Docker total memory ~4.7GB nominal for 7 services on 4GB host — tight but limits prevent OOM cascade
- Review findings + fix plans permanently saved in `review/` directory (18 files, 134K chars)
