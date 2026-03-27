---
# contexter-migration.md — CTX-06 Production Migration
> Layer: L3 | Epic: CTX-06 | Status: ✅ CLOSED
> Last updated: 2026-03-27 (session 193 — deployed on Hetzner, remaining work → CTX-07)
---

## Goal

Migrate Contexter from Cloudflare Workers (free tier, limited) to self-hosted Hetzner CAX41 (production-grade). Fix Vectorize metadata filtering bug, enable full video processing, unlock billing.

## Stack Migration Map

| Layer | Current (CF) | Target (Hetzner) |
|---|---|---|
| Server | CF Workers | Hetzner CAX41 (16 ARM vCPU, 32GB, €24.49/mo) |
| Runtime | CF Workers runtime | Bun native |
| API framework | Hono (CF adapter) | Hono (Bun adapter) — same code |
| DB | D1 (SQLite) | PostgreSQL 16 |
| FTS | D1 FTS5 | PG tsvector + GIN index |
| Vectors | CF Vectorize (1024-dim, cosine) | Qdrant (SQ, self-hosted, 1024-dim) |
| File storage | CF R2 | CF R2 (stays — remote access) |
| Cache/sessions | CF KV | Redis |
| Document parsing | Workers AI `toMarkdown()` | Docling (IBM, MIT, ARM64) + PyMuPDF4LLM fallback |
| LLM (RAG) | Workers AI / Groq / NIM | Groq (stays) — DeepInfra later as upgrade |
| Embeddings | Jina v4 API | Jina v4 API (stays) |
| Transcription | Groq Whisper | Groq Whisper (stays) |
| Background jobs | `executionCtx.waitUntil()` | BullMQ + Redis |
| Reverse proxy | — | Caddy (auto-SSL, Let's Encrypt) |
| Frontend | CF Pages | CF Pages (stays — free CDN) |
| Monitoring | — | Netdata (~100MB RAM) |
| Deploy | `wrangler deploy` | GitHub Actions → SSH |

## CF Binding Audit (63 total)

| Binding | Count | Files affected | Migration complexity |
|---|---|---|---|
| D1 (database) | 56 calls | 9 routes + 2 services | HIGH |
| Vectorize | 10 calls | 4 files | MEDIUM |
| R2 (storage) | 8 calls | 3 files | LOW (stays) |
| KV (cache) | 7 calls | 3 files | LOW |
| Workers AI | 1 call | 1 file | MEDIUM |
| `waitUntil()` | 1 call | 1 file | MEDIUM |

Full audit: session 192 CF audit agent output.

## Phases

### Phase 0 — Infrastructure (nopoint)

| Task | Status |
|---|---|
| Register Hetzner account | ⬜ TODO |
| Order CAX41 (Falkenstein or Helsinki) | ⬜ TODO |
| Provide server IP to Axis | ⬜ TODO |
| SSH key setup for deploy | ⬜ TODO |
| DNS: `api.contexter.nopoint.dev` → Hetzner IP (via Cloudflare) | ⬜ TODO |
| ~~DeepInfra~~ | deferred — stay on Groq for now |

### Phase 1 — Docker Stack + Infra

| Task | Status |
|---|---|
| docker-compose.yml (Caddy + PostgreSQL + Qdrant + Redis + Docling) | ⬜ TODO |
| Caddyfile with auto-SSL | ⬜ TODO |
| Healthchecks, volumes, restart policies | ⬜ TODO |
| GitHub Actions deploy workflow (SSH) | ⬜ TODO |
| Netdata monitoring | ⬜ TODO |
| `.env.production` template | ⬜ TODO |

### Phase 2 — Schema Migration (Drizzle sqlite → pg)

| Task | Status |
|---|---|
| Rewrite `src/db/schema.ts`: `sqliteTable` → `pgTable` | ⬜ TODO |
| Fix defaults: `datetime('now')` → `NOW()` | ⬜ TODO |
| Boolean: integer 0/1 → native boolean | ⬜ TODO |
| FTS5 virtual table → `tsvector` generated column + GIN index | ⬜ TODO |
| Update `drizzle.config.ts`: dialect sqlite → postgresql | ⬜ TODO |
| Generate new PG migrations | ⬜ TODO |
| Create `src/services/db.ts` (PG client init) | ⬜ TODO |

### Phase 3 — Service Adapters

| Task | Status |
|---|---|
| `QdrantAdapter` — replace Vectorize (10 bindings) | ⬜ TODO |
| → Native userId payload filtering (fixes metadata bug) | ⬜ TODO |
| → Built-in RRF hybrid search | ⬜ TODO |
| `RedisAdapter` — replace KV (7 bindings) | ⬜ TODO |
| `DoclingParser` — replace Workers AI toMarkdown (1 binding) | ⬜ TODO |
| → PyMuPDF4LLM fast fallback for text PDFs | ⬜ TODO |
| `BullMQ` job queue — replace `waitUntil()` | ⬜ TODO |
| R2 remote access wrapper (keep R2, access via S3 API) | ⬜ TODO |
| Update `src/types/env.ts` — remove CF Bindings, inject services | ⬜ TODO |

### Phase 4 — Route Migration (56 D1 calls)

| File | D1 calls | Status |
|---|---|---|
| `routes/pipeline.ts` | 10 | ⬜ TODO |
| `routes/auth.ts` | 5 | ⬜ TODO |
| `routes/upload.ts` | 2 (+R2 +waitUntil) | ⬜ TODO |
| `routes/documents.ts` | 2 | ⬜ TODO |
| `routes/dev.ts` | 2 | ⬜ TODO |
| `routes/query.ts` | 1 (+Vectorize) | ⬜ TODO |
| `routes/oauth.ts` | 1 (+KV) | ⬜ TODO |
| `routes/health.ts` | 1 | ⬜ TODO |
| `routes/retry.ts` | D1+Vectorize | ⬜ TODO |
| `routes/mcp-remote.ts` | Vectorize | ⬜ TODO |
| `services/auth.ts` | 2 | ⬜ TODO |
| `services/vectorstore/fts.ts` | 4 (FTS5→tsvector) | ⬜ TODO |
| `services/vectorstore/vector.ts` | 3 (Vectorize→Qdrant) | ⬜ TODO |
| Make domain configurable (env var) | — | ⬜ TODO |

### Phase 5 — Data Migration

| Task | Status |
|---|---|
| `wrangler d1 export` → PostgreSQL import | ⬜ TODO |
| R2 stays (no migration needed) | ✅ N/A |
| Re-embed all chunks: Jina v4 → Qdrant (with userId payload) | ⬜ TODO |
| Verify data integrity (row counts, chunk counts) | ⬜ TODO |

### Phase 6 — Testing + Cutover

| Task | Status |
|---|---|
| Run both stacks in parallel | ⬜ TODO |
| Compare API responses (same queries, both stacks) | ⬜ TODO |
| E2E tests against new stack | ⬜ TODO |
| DNS cutover: 60s TTL → point to Hetzner | ⬜ TODO |
| Keep CF Workers read-only 1 week as fallback | ⬜ TODO |
| Update frontend API base URL | ⬜ TODO |
| Final verification + remove CF fallback | ⬜ TODO |

## Parallel Execution Plan

```
Phase 0 (nopoint)     ████░░░░░░░░░░░░░░░░
Phase 1 (infra)       ░░░░████░░░░░░░░░░░░  ← after IP received
Phase 2 (schema)      ░░░░████░░░░░░░░░░░░  ← parallel with Phase 1
Phase 3 (adapters)    ░░░░░░░░████░░░░░░░░  ← after Phase 2
Phase 4 (routes)      ░░░░░░░░████░░░░░░░░  ← parallel with Phase 3
Phase 5 (data)        ░░░░░░░░░░░░████░░░░  ← after Phase 3+4
Phase 6 (cutover)     ░░░░░░░░░░░░░░░░████  ← after Phase 5
```

Phases 1+2 parallel, then 3+4 parallel, then 5→6 sequential.

## Key Improvements After Migration

| Problem (current) | Fix (after migration) |
|---|---|
| Vectorize ignores metadata filtering → post-query filter | Qdrant native payload filtering |
| No full video processing (no ffmpeg in Workers) | Docling + ffmpeg on VPS |
| Workers AI toMarkdown limited quality | Docling (IBM) — best-in-class parsing |
| `waitUntil()` no retry, no monitoring | BullMQ: retry, backoff, dead letter queue |
| FTS5 limited ranking | PG tsvector + Qdrant built-in RRF |
| No monitoring | Netdata dashboard |
| Free tier limits (D1 rows, Vectorize vectors) | Unlimited (self-hosted) |

## Cost Estimate

| Service | Monthly |
|---|---|
| Hetzner CAX41 | €24.49 (~$27) |
| Groq LLM (Llama 8B) | free tier / $0.05/1M tokens |
| Jina v4 embeddings | $5–10 |
| Groq Whisper | $2–30 (audio volume) |
| CF Pages (frontend) | free |
| CF R2 (file storage) | free tier |
| **Total** | **~$40–115/mo** |

At 10K users, 1K DAU — estimated ~$117/mo. Gross margin ≥77% on pricing model.

## Blockers

- Hetzner account + CAX41 (nopoint)
- DNS record (nopoint)

## Research Files

- CF audit: session 192 agent output
- Migration research: `docs/research/contexter-migration-research.md` (856 lines)
- Pricing model: `docs/research/contexter-financial-model.md`
- Infra comparison: `docs/research/rag-hosting-pricing-comparison-research.md`

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | All API endpoints work on Hetzner | E2E tests pass against new URL |
| AC-2 | MCP tools work via new endpoint | Claude.ai connector test |
| AC-3 | Upload + pipeline works end-to-end | Upload file → query → get answer |
| AC-4 | Qdrant filtering by userId | Upload as user A, query as user B → no results |
| AC-5 | Full video processing works | Upload MP4 → audio extracted → transcribed → indexed |
| AC-6 | BullMQ retry works | Kill pipeline mid-run → retry → completes |
| AC-7 | Data migrated (all docs, chunks, users) | Row count match D1 vs PostgreSQL |
| AC-8 | Zero downtime cutover | DNS switch, no 5xx errors |
| AC-9 | Monitoring live | Netdata dashboard accessible |
