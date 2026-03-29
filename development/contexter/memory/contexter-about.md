---
# contexter-about.md — Contexter Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-29 (session 208 — presigned R2 upload, GROQ_LLM_URL, DB migrations 0005-0011, pipeline crash blocker)
---

## Identity

Contexter = RAG-as-a-service. Any context → API endpoint with knowledge base. MCP-native.
Team: nopoint (founder). Evolved from Harkly MVP data layer into standalone product.

## Tech Stack (Production — Hetzner)

| Layer | Technology |
|---|---|
| Runtime | Bun (oven/bun:1-alpine + ffmpeg) |
| Frontend | SolidJS 1.9 + Vite 8 (static SPA, CF Pages) |
| API | Hono on Bun (Hetzner CAX11) |
| CSS | Tailwind CSS 4 (@theme tokens) |
| ORM | Drizzle ORM (postgresql) |
| Server | Hetzner CAX11 (2 ARM vCPU, 4GB RAM, Helsinki) |
| Metadata DB | PostgreSQL 16 + pgvector 0.8.2 |
| Full-text search | PostgreSQL tsvector + GIN index |
| Vector store | pgvector (512 dims MRL, cosine, HNSW index) |
| File storage | CF R2 (S3 API from Hetzner) |
| Cache/sessions | Redis 7 (with password, BullMQ queue) |
| Embeddings | Jina v4 API (truncate_dim=1024) |
| Transcription | Groq Whisper Large v3 API |
| RAG answer | Groq Llama 3.1 70B (answer) + 8B (rewrite) |
| LLM fallback | DeepInfra (optional, DEEPINFRA_API_KEY) |
| Reranker | Cross-encoder (RerankerService, optional) |
| Embedding cache | Redis (CachedEmbedderService, SHA-256 keys) |
| Circuit breakers | cockatiel v3 (groqLlmPolicy, embeddingPolicy) |
| OCR fallback | Mistral OCR API (default-off, OCR_CLOUD_FALLBACK_ENABLED) |
| User auth | Custom token-based (register → apiToken). OAuth 2.1 + PKCE (S256) |
| MCP server | Streamable HTTP (JSON-RPC on /sse, 12 tools) |
| Document parsing | Docling (IBM, MIT, Docker container) |
| Video processing | ffmpeg (extract audio → Whisper) |
| Job queue | BullMQ (Redis, retry 3x, exponential backoff) |
| Reverse proxy | Caddy (tls internal, behind CF proxy) |
| Monitoring | Netdata (Docker, port 19999) |
| Deploy | SCP + docker compose restart |

## Legacy Stack (CF Workers — deprecated, kept as fallback)

| Layer | Technology |
|---|---|
| API | Hono on CF Workers (`contexter.nopoint.workers.dev`) |
| DB | CF D1 (SQLite) |
| FTS | D1 FTS5 |
| Vectors | CF Vectorize |
| Cache | CF KV |
| Parsing | Workers AI toMarkdown |
| LLM | Workers AI Llama 3.1 8B |

## Key Paths

| Resource | Path |
|---|---|
| Project root | `nospace/development/contexter/` |
| Source code | `development/contexter/src/` |
| Services | `src/services/` (parsers, chunker, embedder, vectorstore, rag, auth, pipeline, llm, reranker, resilience, feedback-decay, evaluation/) |
| Routes | `src/routes/` (upload, query, status, auth, dev, mcp-remote, health, retry, documents, pipeline, oauth, feedback, metrics, maintenance) |
| Eval scripts | `evaluation/` (run-eval.ts, generate-synthetic.ts, check-stale.ts) |
| Frontend | `development/contexter/web/` (SolidJS SPA) |
| Dockerfile | `development/contexter/Dockerfile` (bun + ffmpeg) |
| PG migrations | `development/contexter/drizzle-pg/` (0000–0010, 11 files) |
| Memory | `development/contexter/memory/` |

## Deployed

| Resource | URL |
|---|---|
| **API (production)** | **https://api.contexter.cc** |
| **Frontend** | **https://contexter.cc** (CF Pages) |
| Health | https://api.contexter.cc/health |
| MCP endpoint | https://api.contexter.cc/sse?token={TOKEN} |
| Monitoring | http://46.62.220.214:19999 (Netdata) |
| Legacy API | https://contexter.nopoint.workers.dev (CF Workers, deprecated) |
| GitHub | https://github.com/nopointt/contexter (monorepo nospace) |

## Server (Hetzner)

| Resource | Value |
|---|---|
| IP | 46.62.220.214 |
| SSH | root@46.62.220.214 (ed25519 key) |
| Plan | CAX11 (2 ARM vCPU, 4GB RAM, 40GB NVMe) |
| Cost | €3.99/mo + €0.73/mo IPv4 = €4.72/mo |
| Location | Helsinki, Finland |
| Docker services | app, postgres, redis, caddy, docling, netdata (6 total) |
| Config | /opt/contexter/ (docker-compose.yml, Caddyfile, .env, Dockerfile) |
| App code | /opt/contexter/app/ |

## CF Resources

| Resource | ID/Name |
|---|---|
| Account ID | 4710622840b4d1605ba24d6a0d965bda |
| Zone (contexter.cc) | fed8fa9deb10ab0e414ab739da428c03 |
| R2 Bucket | contexter-files (EEUR) |
| D1 Database (legacy) | contexter-db (26e9545b-9d18-48fc-93b7-4493d505a318) |
| Domain | contexter.cc (CF Registrar, auto-renew 2027-03-27) |

## API Keys

| Key | Location |
|---|---|
| Jina | `~/.tLOS/jina-key` |
| Groq | `~/.tLOS/groq-key` |
| R2 S3 credentials | `~/.tLOS/r2-credentials` |
| CF Global API Key | `~/.tLOS/cf-global-key` |
| CF API Token (limited) | `~/.tLOS/cf-api-token` |
| NOWPayments API Key | `~/.tLOS/nowpayments-api-key` |
| NOWPayments IPN Secret | `~/.tLOS/nowpayments-ipn-secret` |
| Google OAuth Client ID | `~/.tLOS/google-client-id` |
| Google OAuth Client Secret | `~/.tLOS/google-client-secret` |
| Telegram Bot Token | `~/.tLOS/telegram-bot-token` (@contexterrbot) |
| Server .env (all secrets) | `/opt/contexter/.env` (chmod 600) |

## Pipeline

```
file → parse (Docling/MistralOCR/TextParser/AudioParser/VideoParser) → chunk (hierarchical/semantic/table/timestamp) → contextual prefix (Groq) → dedup check (pgvector 0.98) → embed (Jina v4, CachedEmbedderService) → index (pgvector + tsvector)
query → rewrite (Groq 8B) → embed → search (tsvector ∥ pgvector → convex fusion) → rerank (CrossEncoder) → MMR diversity → resolveParents → context → Groq 70B → answer (SSE stream)
eval: proxy metrics (ROUGE-L) + LLM eval (RAGAS: claim→verdict→relevancy) + offline eval pipeline
```

Job queue: BullMQ (Redis) → 3 retries, 1/5/15 min backoff, dead letter after 3 failures.

## Supported Formats (15)

PDF, DOCX, XLSX, PPTX, ODS, CSV, JSON, TXT, MD, HTML, Images (PNG/JPG/WebP/SVG), Audio (MP3/WAV/M4A/OGG), Video (MP4/MOV/WebM → audio extraction), YouTube URL (subtitles)

## PG Schema (8 tables)

users (+ telegram_id, google_id, avatar_url), documents, chunks (+ parentId/chunkType/sectionHeading/pageNumber/contextPrefix/duplicateOf/feedbackPos/feedbackNeg/feedbackScore), jobs, shares, subscriptions, payments, feedback
eval_metrics + eval_metrics_daily_agg (proxy evaluation tables)

15 indexes: PK + unique + btree (user_id, document_id, status) + GIN (tsv) + HNSW (embedding cosine)

PG tuned: shared_buffers=512MB, work_mem=32MB, random_page_cost=1.1, effective_io_concurrency=200, hnsw.ef_search=64

## Active L3

| Epic | File | Status |
|---|---|---|
| CTX-01 MVP Pipeline | [contexter-mvp.md](contexter-mvp.md) | ✅ MLP COMPLETE (2026-03-27) |
| CTX-06 Production Migration | [contexter-migration.md](contexter-migration.md) | ✅ CLOSED |
| CTX-07 Production Hardening | [contexter-production.md](contexter-production.md) | ✅ MLP COMPLETE (2026-03-27) |

| **CTX-08 GTM Strategy** | [contexter-gtm.md](contexter-gtm.md) | 🔶 IN PROGRESS |

## Write Authority

| File | Owner |
|---|---|
| `memory/contexter-about.md` (L1) | Axis — structural changes |
| `memory/contexter-roadmap.md` (L2) | Axis — epic/stage status |
| `memory/contexter-mvp.md` (L3) | Axis — task tracking |
| `memory/contexter-production.md` (L3) | Axis — task tracking |
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
