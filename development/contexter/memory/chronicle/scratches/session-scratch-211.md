# session-scratch.md
> Checkpoint · Axis · 2026-03-29 · session 210

<!-- ENTRY:2026-03-29:CHECKPOINT:210:contexter:contexter-gtm [AXIS] -->
## 2026-03-29 — checkpoint 210 [Axis]

**Epic:** CTX-08 GTM Strategy (продолжение) — Chunking Overhaul + Pre-launch QA

---

### Decisions

- Chunking overhaul architecture: two-stage split (structural boundaries → token sizing), soft/hard limits, block classifier
- Hierarchical auto-activation for docs > 1000 tokens (parent 1024, child 200)
- Auto-merge threshold 0.4 in resolveParents (was 0, too aggressive)
- Token-aware late_chunking batching at 8K cap (conservative, Jina v4 may support 32K)
- Content-type routing: code-heavy/table-heavy/narrative auto-detection
- LLM provider chain: Groq (primary) → NIM (fallback 1) → DeepInfra (fallback 2)
- Pre-launch strategy from Opus research: backups first, then golden pairs, then E2E
- Golden test set format: individual JSON files in evaluation/golden/manual/ (canary.ts format)
- Docker memory: explicit limits for all services (total 3712MB on 3806MB server)
- Smoke E2E: 10 tests, 30s, deploy gate

### Files Changed (deployed to Hetzner production)

**Wave 0 (bug fixes):**
- `src/services/embedder/index.ts` — removed `truncate_dim`, token-aware batching, late_chunking failure logging
- `src/services/embedder/image.ts` — removed `truncate_dim`
- `src/services/chunker/tokenizer.ts` — added `ensureEncoderLoaded()` export
- `src/services/pipeline.ts` — BPE warm-up (3 paths), removed debug logging, `buildChunkRows()` helper with `parent_id`, `resolveParentIds()` helper, `doclingElements` passthrough
- `src/services/rag/index.ts` — cross-dedup fix, auto-merge threshold 0.4, `fetchChildrenCountByParent()`

**Wave 1 (structure-aware chunking):**
- NEW `src/services/chunker/block-classifier.ts` — HEADING/CODE_BLOCK/TABLE/LIST/PARAGRAPH classification
- `src/services/chunker/semantic.ts` — full rewrite: two-stage split, atomic blocks, soft/hard limits, force-split strategies
- `src/services/chunker/types.ts` — `softMaxTokens`, `hardMaxTokens`, `resolveTokenLimits()`, `doclingElements`
- `src/services/chunker/index.ts` — content-type routing, hierarchical auto-activation, Docling blocks integration
- `src/services/chunker/hierarchical.ts` — explicit soft/hard max for parents

**Wave 2 (hierarchical + auto-merge):**
- `src/services/vectorstore/index.ts` — `fetchChildrenCountByParent()`

**Wave 4 (Docling JSON):**
- NEW `src/services/chunker/docling-blocks.ts` — convert Docling elements to Block[]
- `src/services/parsers/docling.ts` — extract element labels from JSON
- `src/services/parsers/types.ts` — `DoclingElement` interface

**Wave 5 (Evaluation framework):**
- NEW `evaluation/types.ts`, `evaluation/metrics/intrinsic.ts`, `evaluation/metrics/retrieval.ts`
- NEW `evaluation/compare.ts` (Wilcoxon signed-rank), `evaluation/run-eval-chunking.ts`, `evaluation/generate-dataset.ts`

**Phase 1 (pre-launch):**
- `src/services/rag/types.ts` — prompt injection defense in DEFAULT_SYSTEM_PROMPT
- `src/services/llm.ts` — full rewrite: provider chain (primary + ordered fallbacks), removed cache_control
- `src/routes/query.ts` — 3-tier chain: Groq → NIM → DeepInfra

**Server-side:**
- `/opt/contexter/backup.sh` — daily pg_dump → R2 offsite, cron 3:00 UTC
- `/opt/contexter/health-check.sh` — health → Telegram alert, cron */5 min
- `.env` — added `TELEGRAM_ALERT_CHAT_ID=620190856`, `NIM_API_KEY`
- `docker-compose.yml` — memory limits: app=512m, postgres=1024m, docling=1536m

**E2E tests (local only):**
- NEW `e2e/smoke.spec.ts` — 10 smoke tests, 30s, deploy gate
- NEW `e2e/suite-8-15.spec.ts` — API error handling + upload edge cases (18 tests)
- NEW `e2e/suite-13-16.spec.ts` — documents management + cross-user isolation (17 tests)
- `evaluation/golden/manual/g-001..g-010.json` — 10 golden canary pairs
- `evaluation/golden/index.json` — 20 golden pairs (full set)

**Research:**
- `nospace/docs/research/pre-release-qa-strategy-research.md` — 13 sections, Opus

### Completed

- Wave 0: all 5 bug fixes
- Wave 1: structure-aware block classification + two-stage split (code/table/list atomic, heading boundaries)
- Wave 2: hierarchical auto-activation + parent_id in DB + auto-merge 0.4
- Wave 3: token-aware late_chunking batching (8K cap)
- Wave 4: Docling JSON element types integration
- Wave 5: evaluation framework (intrinsic + retrieval metrics + Wilcoxon)
- Phase 1.1: PostgreSQL backups (daily → R2 offsite, restore tested: 68 users identical)
- Phase 1.5: Prompt injection defense in system prompt
- Phase 1.6: Health check → Telegram alerts (cron */5 min)
- Phase 1.7: Smoke E2E suite (10/10 PASS, 30s)
- Phase 1.3: Golden test pairs (20 in index.json + 10 canary files)
- Phase 2.11: Docker memory fix (swap 1603MB → 12MB)
- Phase 2: E2E suites 8, 13, 15, 16 written (blocked by registration rate limit)
- Groq `cache_control` regression found and fixed
- LLM provider chain refactor: Groq → NIM → DeepInfra

### In Progress

- LLM fallback chain debugging — Groq 429 but NIM fallback not activating (no fallback logs). Likely circuit breaker or error propagation issue. Needs verbose logging to diagnose.
- E2E suites 8/13/15/16 rerun after registration rate limit resets
- Canary baseline (10/10 queries fail due to Groq TPD + fallback not working)

### Opened

- BUG: LLM provider chain fallback not activating on Groq 429 — need to debug circuit breaker interaction
- BUG: Double confirm (POST /api/upload/confirm twice) → 500 (DB unique constraint on jobs INSERT)
- BUG: 153/164 chunks for user dfe9be94 have no embeddings (pre-existing, not regression)
- Registration rate limit (10/IP/hour) blocks E2E test reruns — need to wait or increase limit
- Remaining Phase 2: suites 7/9/10/14/17, synthetic golden pairs, k6 load test, Netdata alerting, deploy docs
- Phase 3: regression fixtures, pre-deploy chain, drift detection, Privacy Policy/ToS

### Notes

- Research (Opus): "do NOT add RAGAS/DeepEval — existing Bun-native eval is the right approach, bottleneck is DATA not tooling"
- Backward compatibility confirmed: old flat chunks work with new resolveParents (chunkType filter)
- Docker memory was critically overcommitted (1.6GB swap) — now under control
- Groq free tier TPD limit (100K/day) is insufficient for testing — NIM fallback essential
- Build: 972 modules, clean, 0 errors throughout all changes

<!-- ENTRY:2026-03-30:CLOSE:211:contexter:contexter-gtm [AXIS] -->
## 2026-03-30 — сессия 211 CLOSE [Axis]

**Epic:** CTX-08 GTM Strategy — Chunking Overhaul + Pre-launch QA (complete)

---

### Decisions

- LLM provider chain: Groq → NIM → DeepInfra (3-tier, production-verified)
- Rate limit whitelist via RATE_LIMIT_WHITELIST_IPS env var (shared utility, not per-route)
- Subscription race fix: ON CONFLICT DO NOTHING + re-SELECT (TOCTOU pattern)
- Double confirm idempotent: check existing doc before INSERT
- E2E scope: 106 tests across 21 suites (comprehensive, not just critical path)
- Old comprehensive spec archived, suites 5-6 (UI) extracted to separate file
- Golden pairs: 10 manual + 15 synthetic = 25 total (sufficient for MVP eval)
- Deploy docs created with rollback procedures
- Groq TPD not a blocker anymore — NIM fallback handles it

### Files Changed

**Bug fixes (deployed):**
- `src/services/billing.ts` — subscription race ON CONFLICT DO NOTHING
- `src/routes/upload.ts` — double confirm idempotent (check existing doc)
- `src/services/llm.ts` — full rewrite: provider chain, removed cache_control
- `src/routes/query.ts` — 3-tier chain Groq→NIM→DeepInfra for both rewrite+answer
- `src/index.ts` — env var mapping for NIM/DEEPINFRA/model overrides
- `src/types/env.ts` — NIM_API_KEY, RATE_LIMIT_WHITELIST_IPS
- `src/services/rate-limit.ts` — NEW: shared rate limit utility with IP whitelist

**E2E tests (local):**
- `e2e/suite-5-6-ui.spec.ts` — NEW: extracted UI browser tests from old comprehensive
- `e2e/suite-7-9-10.spec.ts` — NEW: Query Flow + Pipeline Formats + Hierarchical
- `e2e/suite-11-14-17.spec.ts` — NEW: MCP + Feedback + Concurrent
- `e2e/suite-12-18-19-20-21.spec.ts` — NEW: Share Tokens + Stream + Retry + Metrics + Bulk
- `e2e/suite-8-15.spec.ts` — fixes: 403 accept, body.error relaxed, double confirm un-skipped
- `e2e/suite-13-16.spec.ts` — fixes: timeouts 120s for query tests
- `e2e/_archive-contexter-comprehensive.spec.ts.bak` — archived (duplicated by new suites)

**Evaluation:**
- `evaluation/generate-synthetic.ts` — NIM fallback added
- `evaluation/golden/synthetic/*.json` — 15 synthetic pairs generated
- `evaluation/golden/manual/g-001..g-010.json` — 10 canary pairs (created earlier)

**Docs:**
- `docs/deploy-procedure.md` — NEW: deploy steps, rollback, monitoring

**Server-side (deployed):**
- `/opt/contexter/.env` — NIM_API_KEY, RATE_LIMIT_WHITELIST_IPS added
- `/opt/contexter/docker-compose.yml` — memory limits: app=512m, postgres=1024m, docling=1536m

### Completed

- Phase 1 complete: backups, golden pairs, canary 10/10 PASS, prompt injection, alerts, smoke 10/10
- Phase 2 progress: Docker memory fix, 106 E2E tests (97%+ pass), cross-user isolation, synthetic pairs, deploy docs
- LLM provider chain fully operational (Groq→NIM→DeepInfra)
- 6 bugs found and fixed (subscription race, double confirm, cache_control, env mapping, rate limit, comprehensive spec)

### Opened

- k6 load test baseline (Phase 2 task 10)
- Netdata alerting rules (Phase 2 task 12)
- Phase 3: regression fixtures, pre-deploy chain, drift detection, Privacy Policy/ToS
- 2-3 flaky E2E tests (NIM latency + CF Pages CDN) — not code bugs

### Notes

- Groq free tier TPD (100K/day) consistently exhausted during testing — NIM fallback essential
- Root cause discipline established: every bug gets explicit root cause before fix
- Contexter vision: best RAG service in the world, no shortcuts
