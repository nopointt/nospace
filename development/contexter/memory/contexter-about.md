---
# contexter-about.md — Contexter Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-04-17 (session 244 — CTX-11 Analytics opened, copy audit applied 8 commits, pricing tier section clarified, supported formats section corrected for 308 alpha)
---

## Identity

Contexter = RAG-as-a-service. Any context → API endpoint with knowledge base. MCP-native.
Team: nopoint (founder). Evolved from Harkly MVP data layer into standalone product.

## Tech Stack (Production — Hetzner)

| Layer | Technology |
|---|---|
| Runtime | Bun 1.3 (oven/bun:1-alpine + ffmpeg) |
| Frontend | SolidJS 1.9 + Vite 8 (static SPA, CF Pages, project: contexter-web) |
| API | Hono on Bun (Hetzner CAX11) |
| CSS | Tailwind CSS 4 (@theme tokens) |
| ORM | Drizzle ORM (postgresql) |
| Server | Hetzner CAX11 (2 ARM vCPU, 4GB RAM, Helsinki) |
| Metadata DB | PostgreSQL 16.13 + pgvector 0.8.2 |
| Full-text search | PostgreSQL tsvector + GIN index |
| Vector store | pgvector (512 dims MRL, cosine, HNSW index, ef_search=64) |
| File storage | CF R2 (S3 API from Hetzner, bucket: contexter-files, EEUR) |
| Cache/sessions | Redis 7 (with password, BullMQ queue) |
| Embeddings | Jina v4 (jina-embeddings-v4, 512 dims via MRL, late chunking) |
| Transcription | Groq Whisper Large v3 API |
| RAG answer | Groq Llama 3.3 70B (answer) + Llama 3.1 8B (rewrite) |
| LLM fallback | NVIDIA NIM (configured, active). DeepInfra (NOT configured, planned for paid users) |
| Reranker | Jina Reranker (Cross-encoder via JINA_API_KEY) |
| Embedding cache | Redis (CachedEmbedderService, SHA-256 content keys, no TTL) |
| Circuit breakers | cockatiel v3: jinaPolicy, groqLlmPolicy, groqWhisperPolicy, doclingPolicy (all 4 wired) |
| Content filter | 22 regex patterns, 5 categories, flag-not-block (metadata.injectionRiskScore) |
| Anomaly detection | L2 norm outlier check after embed (metadata.embeddingAnomalyDetected) |
| OCR fallback | Mistral OCR API (default-off, OCR_CLOUD_FALLBACK_ENABLED) |
| NLI | Python sidecar for hallucination detection (code exists, container NOT deployed) |
| User auth | Custom token-based (register → 64-char hex apiToken). Google OAuth. OAuth 2.1 + PKCE (S256) |
| MCP server | Streamable HTTP (JSON-RPC on /sse, 12 tools) |
| Document parsing | Docling (IBM, MIT, Docker container, 1536MB RAM) |
| Video processing | ffmpeg (extract audio → segment → Whisper) |
| Job queue | BullMQ (Redis, retry 3x, exponential backoff 1/2/4 min) |
| Reverse proxy | Caddy (tls internal, behind CF proxy, CF origin cert valid 2041) |
| Monitoring | Netdata (Docker, port 19999, 5 custom alerts → Telegram) |
| Deploy | ops/deploy.sh (SCP → Docker build COPY → restart → health check → Telegram) |

## Key Paths

| Resource | Path |
|---|---|
| Project root | `nospace/development/contexter/` |
| Source code | `src/` |
| Services | `src/services/` (parsers/, chunker/, embedder/, vectorstore/, rag/, mcp/, evaluation/, auth, billing, content-filter, feedback-decay, llm, nli, pipeline, queue, rate-limit, reranker, resilience, supporters, supporters-ranking, supporters-revshare, supporters-lifecycle, notifications) |
| Routes | `src/routes/` (auth, auth-social, billing, dev, documents, feedback, health, maintenance, mcp-remote, metrics, oauth, pipeline, query, retry, status, upload, webhooks) — 17 files |
| Eval scripts | `evaluation/` (run-eval.ts, run-eval-chunking.ts, canary.ts, generate-synthetic.ts, generate-dataset.ts, check-stale.ts, compare.ts, types.ts, metrics/) — 10 files |
| Frontend | `web/` (SolidJS SPA, pages: Landing, Hero, Dashboard, DocumentViewer, Upload, ApiPage, Settings, Login, Register, ForgotPassword, ResetPassword, VerifyEmail, Privacy, Terms) |
| Ops | `ops/` (deploy.sh, deploy-web.sh, rollback.sh, Dockerfile, netdata/) |
| k6 load tests | `k6/` (setup.js, scenario-1-queries.js, scenario-2-uploads.js, scenario-3-mixed.js, smoke.js, capacity-model.ts, deepinfra-model.ts) |
| PG migrations | `drizzle-pg/` (0000–0017, 18 files; 0015 supporters W1, 0016 supporter_referrals W4, 0017 antiabuse W5-04 — 0017 on dev only NOT yet prod) |
| Tests | `tests/` (chunker, embedder, content-filter, parsers, rag, vectorstore — 6 files, 1682 lines) |
| Memory | `memory/` |
| Co-founder docs | `docs/artem/` (29 files MD+HTML, index.html, convert.ts) |
| Research | `nospace/docs/research/` (GTM, competitors, Reddit guide) |

## Deployed

| Resource | URL |
|---|---|
| **API (production)** | **https://api.contexter.cc** |
| **Frontend** | **https://contexter.cc** (CF Pages, project: contexter-web) |
| Privacy Policy | https://contexter.cc/privacy |
| Terms of Service | https://contexter.cc/terms |
| Health | https://api.contexter.cc/health |
| Circuit breakers | https://api.contexter.cc/health/circuits |
| MCP endpoint | https://api.contexter.cc/sse?token={TOKEN} |
| Monitoring | http://46.62.220.214:19999 (Netdata) |
| CDN (R2 public) | https://cdn.contexter.cc |
| Co-founder hub | https://cdn.contexter.cc/public/artem/index.html |
| Demo video | https://cdn.contexter.cc/public/contexter-screencast.mp4 |

## Server (Hetzner)

| Resource | Value |
|---|---|
| IP | 46.62.220.214 |
| SSH | root@46.62.220.214 (ed25519 key) |
| Plan | CAX21 (4 ARM vCPU, 8GB RAM, 40GB NVMe) |
| Cost | €6.99/mo + €0.73/mo IPv4 = €7.72/mo |
| Location | Helsinki, Finland |
| Docker services | app (1536m), postgres (1536m), redis (384m), caddy (128m), docling (3072m), netdata (256m) — 6 running |
| Config | /opt/contexter/ (docker-compose.yml, Caddyfile, .env, Dockerfile) |
| App code | /opt/contexter/app/ (baked into Docker image via COPY, no bind mount) |
| Cron jobs | backup.sh (daily 3:00), health-check.sh (*/5 min), wal-upload.sh (hourly) |

## Deploy

| What | Command | How |
|---|---|---|
| **Backend (API)** | `bash ops/deploy.sh` | SCP → `docker compose build --no-cache` → restart → health check → Telegram alert |
| **Backend hotfix** | `bash ops/deploy.sh --skip-tests` | Same but skips pre-deploy tests |
| **Frontend (SPA)** | `bash ops/deploy-web.sh` | `bun build` → `wrangler pages deploy --project-name=contexter-web` → verify |
| **Rollback API** | `bash ops/rollback.sh` | Stop → restore compose backup → rebuild → verify |
| **Rollback API+DB** | `bash ops/rollback.sh --db` | Same + restore latest pg_dump from R2 |

Key: Dockerfile uses COPY (code baked into image). No bind mount. Build fails if file missing → deploy aborts → production untouched.

## Monitoring & Alerts

| What | How | Where |
|---|---|---|
| Health check | cron */5 min → Telegram on failure/recovery | `/opt/contexter/health-check.sh` |
| Netdata alerts | disk >80%, CPU >80% 5m, container down, OOM, swap >50% → Telegram | `/etc/netdata/health.d/contexter.conf` (Docker volume) |
| Netdata dashboard | http://46.62.220.214:19999 | Browser |
| PG backup | daily 3:00 UTC → local + R2 offsite, 7-day retention | `/opt/contexter/backup.sh` |
| WAL archiving | archive_mode=on, archive_timeout=300s (5 min RPO) | PG → `/opt/contexter/wal-archive/` → hourly R2 |
| Drift detection | weekly Monday 3:00 UTC, MMD threshold 0.05, baseline 500 embeddings | BullMQ maintenance queue |
| Eval metrics aggregation | daily 2:00 UTC | BullMQ maintenance queue |

## Security

| Feature | Status |
|---|---|
| Prompt injection defense (system prompt) | ✅ Active |
| Content filter (upload scan, 22 patterns, flag-not-block) | ✅ Active (metadata.injectionRiskScore) |
| Semantic anomaly detection (L2 norm outliers after embed) | ✅ Active (metadata.embeddingAnomalyDetected) |
| Rate limiting (60 QPM query, 20/hr upload, 20/hr register) | ✅ Active (fail-open on Redis down) |
| CORS restricted (contexter.cc only) | ✅ Active |
| HTTPS (Caddy + CF proxy, origin cert valid 2041) | ✅ Active |
| Cross-user data isolation | ✅ Tested (9/9 PASS) |
| Circuit breakers (Jina/Groq LLM/Whisper/Docling) | ✅ All 4 wired + /health/circuits |
| GDPR account deletion | ✅ DELETE /api/auth/account (cascading + R2 cleanup) |
| .gitignore credentials | ✅ import.sql, d1-*.json, ops/netdata/, k6/k6-env.json |

## Legal

| Page | URL | Status |
|---|---|---|
| Privacy Policy | https://contexter.cc/privacy | ✅ EN, GDPR, global coverage |
| Terms of Service | https://contexter.cc/terms | ✅ EN, England & Wales, online arbitration |

Jurisdiction: user KZ, billing entity AR (RU citizen), server FI (EU). Contact: nopoint@contexter.cc

## CF Resources

| Resource | ID/Name |
|---|---|
| Account ID | 4710622840b4d1605ba24d6a0d965bda |
| Zone (contexter.cc) | fed8fa9deb10ab0e414ab739da428c03 |
| R2 Bucket | contexter-files (EEUR, r2.dev public access enabled) |
| Pages project | contexter-web (contexter.cc custom domain) |
| R2 CDN domain | cdn.contexter.cc (public access, video + knowledge hub) |
| D1 Database (legacy) | contexter-db (26e9545b-9d18-48fc-93b7-4493d505a318) |
| Domain | contexter.cc (CF Registrar, auto-renew 2027-03-27) |

## API Keys

| Key | Location |
|---|---|
| Jina | `~/.tLOS/jina-key` |
| Groq | `~/.tLOS/groq-key` |
| NIM (NVIDIA) | `~/.tLOS/nim-key` |
| R2 S3 credentials | `~/.tLOS/r2-credentials` |
| CF Global API Key | `~/.tLOS/cf-global-key` |
| CF API Token (limited) | `~/.tLOS/cf-api-token` |
| NOWPayments API Key | `~/.tLOS/nowpayments-api-key` |
| NOWPayments IPN Secret | `~/.tLOS/nowpayments-ipn-secret` |
| Google OAuth Client ID | `~/.tLOS/google-client-id` |
| Google OAuth Client Secret | `~/.tLOS/google-client-secret` |
| Resend (email) | `~/.tLOS/resend-key` |
| Telegram Bot Token | `~/.tLOS/telegram-bot-token` (@contexterrbot) |
| Server .env (all secrets) | `/opt/contexter/.env` (chmod 600) |

## Pipeline

```
upload → content filter (22 patterns, flag-not-block) → parse (Docling/TextParser/AudioParser/VideoParser) → chunk (hierarchical/semantic/table/timestamp, structure-aware block classifier, auto-merge 0.4) → contextual prefix (Groq 8B) → dedup check (pgvector 0.98 cosine) → embed (Jina v4 512d, late chunking, CachedEmbedderService) → anomaly check (L2 norm outliers) → index (pgvector HNSW + tsvector GIN)
MCP query → embed (Jina v4 512d) → hybrid search (tsvector ∥ pgvector → convex fusion α=0.5) → rerank (Jina cross-encoder) → return chunks + system instruction (client LLM generates answer)
NOTE: /api/query archived (2026-03-31). Groq removed from query path. MCP search_knowledge is the primary query interface.
eval: proxy metrics (per-query) + LLM eval (RAGAS: claim→verdict→relevancy) + chunking eval (intrinsic + retrieval + Wilcoxon A/B) + drift detection (MMD)
```

Job queue: BullMQ (Redis) → 3 retries, exponential backoff (1/2/4 min), removeOnComplete 24h, removeOnFail 7 days.

## Supported Formats

**Alpha (launch):** 308 text-only formats registered in `web/src/lib/formats.ts` (14 categories) per D-49. Binary/media (images/audio/video) deferred.

**Full pipeline support (backend-ready, UI-gated):**
- **Documents:** PDF, DOCX, XLSX, PPTX, ODS, ODT
- **Text:** TXT, MD, CSV, JSON, HTML, XML
- **Images:** PNG, JPG/JPEG, WebP, SVG
- **Audio:** MP3, WAV, M4A, OGG
- **Video:** MP4, MOV, WebM
- **URLs:** YouTube (subtitles extraction)

Parsers: DoclingParser (PDF/DOCX/XLSX/PPTX/ODS/HTML/images), TextParser (TXT/MD/CSV/JSON/XML/ODT), AudioParser (audio + segmentation), VideoParser (video → ffmpeg → Whisper), YouTubeParser (subtitles).

## PG Schema (12 tables)

**Core:** users (+ telegram_id, google_id, avatar_url, email), documents (+ metadata jsonb), chunks (22 columns: content, embedding vector(512), tsv, parent_id, chunk_type, section_heading, page_number, context_prefix, duplicate_of, feedback_pos/neg/score, start/end_offset), jobs (type: parse/chunk/embed/index)
**Auth/Billing:** shares (owner_id, shared_with_id, share_token, scope, permission, expires_at), subscriptions, payments
**Eval:** eval_metrics, eval_metrics_daily_agg, eval_drift_checks, eval_drift_baseline (+ projection_matrix jsonb)
**Feedback:** feedback (user_id, query_id, chunk_ids, rating, comment)

40 indexes: PK (12) + unique (api_token, share_token) + btree (user_id, document_id, status, google_id, telegram_id, chunk_type, duplicate_of, feedback_score, nowpayments_invoice_id, query_id, queried_at, checked_at, date_user) + GIN (tsv) + HNSW (embedding cosine)

PG tuned: shared_buffers=512MB, work_mem=32MB, random_page_cost=1.1, effective_io_concurrency=200, hnsw.ef_search=64. WAL: archive_mode=on, wal_level=replica, archive_timeout=300.

Production data: ~756 users, ~744 documents, ~1281 chunks (as of 2026-03-30).

## Active L3

| Epic | File | Status |
|---|---|---|
| CTX-01 MVP Pipeline | [contexter-mvp.md](contexter-mvp.md) | ✅ MLP COMPLETE (2026-03-27) |
| CTX-06 Production Migration | [contexter-migration.md](contexter-migration.md) | ✅ CLOSED |
| CTX-07 Production Hardening | [contexter-production.md](contexter-production.md) | ✅ MLP COMPLETE (2026-03-27) |
| CTX-08 GTM Strategy | [contexter-gtm.md](contexter-gtm.md) | ✅ CLOSED (2026-03-30, open items → backlog) |
| **CTX-04 Auth** | [contexter-auth.md](contexter-auth.md) | 🔶 IN PROGRESS |
| **CTX-09 UI/UX Polish** | [contexter-uiux-polish.md](contexter-uiux-polish.md) | ✅ COMPLETE (2026-03-30) |
| **CTX-10 GTM Launch** | [contexter-gtm-launch.md](contexter-gtm-launch.md) | 🔶 IN PROGRESS (deadline: 2026-04-08) |
| **CTX-12 Supporters Backend** | [contexter-supporters-backend.md](contexter-supporters-backend.md) | ✅ COMPLETE (2026-04-12, session 240 — all W1-W5 deployed) |
| **CTX-13 Reddit GTM** | [contexter-reddit-gtm.md](contexter-reddit-gtm.md) | 🔶 IN PROGRESS (5-phase Reddit presence strategy) |
| **CTX-11 Analytics** | [contexter-analytics.md](contexter-analytics.md) | 🔶 IN PROGRESS (2026-04-17 session 244, 6 waves, 19 MUST-HAVE MVI, NSM=WAU-A, W1-W3 BEFORE Reddit Phase 3) |

## Write Authority

| File | Owner |
|---|---|
| `memory/contexter-about.md` (L1) | Axis — structural changes |
| `memory/contexter-roadmap.md` (L2) | Axis — epic/stage status |
| `memory/contexter-auth.md` (L3, active) | Axis — CTX-04 Auth epic |
| `memory/contexter-gtm.md` (L3, closed) | Axis — CTX-08 GTM archive |
| `memory/contexter-analytics.md` (L3, active) | Axis — CTX-11 Analytics epic |
| `memory/contexter-reddit-gtm.md` (L3, active) | Axis — CTX-13 Reddit GTM epic |
| `memory/contexter-supporters-backend.md` (L3, closed) | Axis — CTX-12 archive |
| `memory/contexter-backlog.md` (L2.5) | Axis — product backlog (bugs, deferred, open-ended) |
| `memory/chronicle/contexter-current.md` | Axis — append only |
| `memory/chronicle/index.md` | Axis — append only |
| `memory/session-scratch.md` (L4) | Axis — write during session |

## G3 Rule

**Bauhaus Team (7 permanent Eidolons):**
| Name | Role | Pair |
|---|---|---|
| **Gropius** | Frontend Player (SolidJS/Tailwind) | Breuer |
| **Breuer** | Frontend Coach (visual regression) | Gropius |
| **Itten** | Web Designer Player (composition) | Albers |
| **Albers** | Design Coach (token audit) | Itten |
| **Mies** | Backend Player (Hono/PG/pgvector) | Schlemmer |
| **Schlemmer** | Backend Coach (API testing) | Mies |
| **Moholy** | QA Engineer (E2E Playwright) | — |
