# session-scratch.md
> Axis session 193 · 2026-03-27

<!-- ENTRY:[2026-03-27]:CHECKPOINT:192:contexter:contexter-production [AXIS] -->
## 2026-03-27 — checkpoint 192 [Axis]

**Decisions:**
- Hetzner CAX11 (€3.99/mo) instead of CAX41 — sized for 100 users
- pgvector instead of Qdrant — simpler stack, hybrid search in one query
- R2 stays as file storage (S3 API from Hetzner) — cheapest at scale
- Docling from start (best quality first, optimize later)
- Domain: contexter.cc (CF Registrar), api.contexter.cc → Hetzner, contexter.cc → CF Pages
- CTX-06 (migration) CLOSED, CTX-07 (production hardening) created

**Files changed:**
- `src/db/schema.ts` — sqliteTable → pgTable + pgvector + timestamp
- `src/db/connection.ts` — NEW, postgres.js + Drizzle PG
- `src/types/env.ts` — CF bindings → PG/Redis/S3/Groq types
- `src/services/llm.ts` — NEW, Groq LLM adapter with 429 retry
- `src/services/parsers/docling.ts` — NEW, Docling + TextParser
- `src/services/parsers/utils.ts` — NEW, shared streamToBuffer
- `src/services/parsers/index.ts` — ToMarkdown → Docling
- `src/services/vectorstore/vector.ts` — Vectorize → pgvector SQL
- `src/services/vectorstore/fts.ts` — FTS5 → tsvector SQL
- `src/services/vectorstore/index.ts` — config → {sql}
- `src/services/auth.ts` — D1 → postgres.js, expires_at Date handling, JSON.parse try/catch
- `src/services/rag/index.ts` — Workers AI → LlmService
- `src/services/rag/rewriter.ts` — Workers AI → LlmService
- `src/services/pipeline.ts` — full rewrite: PG + pgvector + S3 + safe buffer
- `src/routes/*` (11 files) — all CF bindings → PG/Redis/S3/Groq
- `src/index.ts` — Bun entry point, DI middleware, logging, CORS allowlist, env validation
- `drizzle.config.ts` — sqlite → postgresql
- `drizzle-pg/` — 2 PG migration files (NEW directory)
- `web/src/` — 8 frontend files: hardcoded URLs → API_BASE, mobile responsive, error parsing

**Server (46.62.220.214):**
- Docker: PG+pgvector, Redis (with password), Caddy, Docling, Bun app
- PG tuned: shared_buffers=512MB, work_mem=32MB, NVMe optimized, 15 indexes
- ufw enabled (22/80/443), .env chmod 600
- Docling: shared models, 1 worker, OMP_THREADS=2
- Docker log rotation (10m × 5 per service)

**Completed:**
- Phase 1+2: Docker stack + schema migration + deploy
- Phase 3+4: Service adapters + route migration (all 63 CF bindings replaced)
- 12-agent parallel audit (2 Opus + 7 Sonnet + 3 Haiku) → 92 issues found
- Architect spec (1140 lines) + Architect review (32 additions)
- WP-1 through WP-6: all 6 work packages applied (60+ fixes)
- E2E smoke test: 10/10 pass (health, register, upload, pipeline, query, MCP, OAuth, CORS, dev blocked, security)

**In progress:**
- BullMQ job queue (replace fire-and-forget pipeline)
- Data migration D1 → PG (existing users/documents)
- Video processing (ffmpeg)

**Opened:**
- BullMQ implementation — critical for prod reliability
- D1 → PG data migration — existing users can't access data on new stack
- ffmpeg video processing — deferred from CTX-01
- Frontend deploy with VITE_API_URL env var on CF Pages
- Docling parse quality comparison vs Workers AI toMarkdown
- Monitoring dashboard (Netdata)

**Notes:**
- R2 token was initially read-only (403 on PutObject) — recreated via CF API with Read+Write
- Docling uses 1GB RAM at idle — on 4GB server this is tight under load
- Security audit found token leak on duplicate registration — fixed
- CORS changed from wildcard to allowlist — MCP clients may need CORS exemption

<!-- ENTRY:[2026-03-27]:CLOSE:193:contexter:contexter-production [AXIS] -->
## 2026-03-27 — сессия 193 CLOSE [Axis]

**Decisions:**
- Hetzner CAX11 €4.72/mo (not CAX41) — pgvector (not Qdrant) — Docling (not pdf-parse) — R2 stays
- Domain: contexter.cc + api.contexter.cc
- 12-agent audit → Architect spec → 6 Work Packages → systematic production hardening
- MLP Definition of Done: 7 pillars (core workflow, UX, security, reliability, observability, performance, trust)
- BullMQ for pipeline reliability, not fire-and-forget
- Containers non-root (app uid=1000, redis uid=999)

**Files changed (50+ files total):**
- `src/` — full migration: 15 services + 11 routes + entry point + types + schema + connection
- `src/services/queue.ts` — NEW, BullMQ job queue
- `src/services/parsers/video.ts` — NEW, ffmpeg video parser
- `src/services/parsers/utils.ts` — NEW, shared streamToBuffer
- `src/services/llm.ts` — NEW, Groq LLM adapter
- `src/services/parsers/docling.ts` — NEW, Docling parser
- `web/src/` — 8 frontend files (API URLs, error parsing, mobile, delete handler)
- `drizzle-pg/` — NEW, 2 PG migration files
- `Dockerfile` — NEW, bun + ffmpeg
- `memory/` — L1, L2, L3 updated; ctx07-production-spec.md (1140 lines); ctx07-verified-status.md; contexter-mlp-final.md

**Server (46.62.220.214):**
- 7 Docker containers: app, postgres, redis, caddy, docling, netdata + build image
- PG: 15 indexes, shared_buffers=512MB, HNSW ef_search=64
- Security: ufw, redis password, .env 600, non-root containers, CORS allowlist, rate limits
- Observability: structured JSON logging, request ID, Caddy access logs, Docker log rotation
- D1 data migrated: 4 real users, 29 docs, 155 chunks re-embedded

**Completed:**
- Full CF Workers → Hetzner migration (63 CF bindings)
- 12-agent parallel audit (92 issues)
- Architect spec + review (1140 lines, 92 issues)
- WP-1 through WP-6 (85+ fixes)
- BullMQ job queue with retry/backoff/dead letter
- Video processing (ffmpeg + Whisper)
- Netdata monitoring dashboard
- D1 → PG data migration (re-embedded all chunks)
- VITE_API_URL set + frontend redeployed
- MIME magic byte validation (file-type)
- Batch INSERT + parallel embed + db cleanup
- Containers non-root + deploy
- Final E2E: 17/17 routes verified
- Opus verifier: 85/92 issues confirmed fixed

**Opened (remaining for MLP):**
- P3-007: Caddy self-signed → Let's Encrypt (CF Full works, not blocking)
- NEW-007: Zip bomb protection (partial — Docling 2GB limit)
- NEW-014: Upload + job creation not transactional
- ~10 P3/P4 polish items (see ctx07-verified-status.md)
- pg_dump backup cron not set up
- Frontend redeploy needed after web/ code changes

**Notes:**
- 35+ agents used this session (2 Opus architects, 12 auditors, 10+ G3 players, 3 QA)
- Rate limit works well — blocked our own test registrations from same IP
- Docling 1GB RAM idle on 4GB server — monitor under concurrent load
- Total session: ~5 hours, from bare Hetzner to production-ready MLP
