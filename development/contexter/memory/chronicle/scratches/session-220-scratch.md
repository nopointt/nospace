# session-scratch.md
> Placeholder · Axis · 2026-03-31 · session 219
> Active epic: contexter-auth (CTX-04)

<!-- ENTRY:2026-03-31:CLOSE:220:contexter:contexter-auth [AXIS] -->
## 2026-03-31 — сессия 220 CLOSE [Axis]

**Decisions:**
- D-01: Groq removed from MCP query path — search_knowledge returns chunks + system instruction, no LLM answer generation
- D-02: Chat UI removed from frontend (Dashboard + Hero)
- D-03: /api/query endpoint archived (moved to src/routes/archive/)
- D-04: Infra configs for 500 registered / 100 concurrent: PG pool 100, BullMQ 4, app 1536m, PG 1536m, Redis 384m, Docling 3072m
- D-05: YouTube fallback: no captions → yt-dlp audio download → Whisper transcription

**Files changed:**
- `src/routes/query.ts` → archived to `src/routes/archive/query.ts`
- `src/index.ts` → removed query route import/mount, PG pool 100
- `src/routes/mcp-remote.ts` → search_knowledge/ask_about_document/summarize_document rewritten: direct embed→search→rerank, no Groq
- `src/services/resilience.ts` → bulkheads raised (Jina 10/20, Groq 10/20, Whisper 2/5, Docling 2/5)
- `src/services/queue.ts` → BullMQ concurrency 4
- `src/services/embedder/index.ts` → embed timeout 30s→10s
- `src/routes/upload.ts` → presign resolveMimeType fix, YouTube URL detection in text upload
- `src/services/parsers/youtube.ts` → audio fallback via yt-dlp + AudioParser
- `src/services/parsers/index.ts` → YouTubeParser constructor with Groq args
- `ops/Dockerfile` → added python3, yt-dlp, nodejs
- `ops/deploy.sh` → docker-compose.yml sync + REDIS_PASSWORD check
- `docker-compose.yml` → RAM limits, Docling from registry, Caddy certs mount, named external volumes
- `web/src/pages/Dashboard.tsx` → removed query panel (ВОПРОС/ОТВЕТ/ИСТОЧНИКИ)
- `web/src/pages/Hero.tsx` → removed query input + results
- `web/src/lib/api.ts` → removed query() export
- `k6/stress-setup.js` — new: registers 110 test users with seed docs
- `k6/stress-100.js` — new: MCP stress test (5 scenarios, 100 VUs)
- `k6/fixtures/` — new: 12 test files (PDF, audio, video, images, docs)

**Completed:**
- Architecture analysis for 10K/1K concurrent users
- Stress test infrastructure (k6, fixtures, user pool)
- 6 stress test runs with progressive fixes
- MCP-only pivot (Groq removed from query path)
- Chat UI removed from frontend
- Infra scaling for 100 concurrent
- Deploy script fix (docker-compose.yml sync)
- Presign MIME type resolution bug fix (.md files)
- YouTube audio fallback (yt-dlp)
- Docker volume naming fix (pg_data, redis_data)
- Frontend deployed to CF Pages

**Opened:**
- YouTube yt-dlp audio fallback needs verification (nodejs added, not tested end-to-end)
- Pipeline failures under heavy load (263/210) — external API rate limits (Jina reranker 2 concurrent, Groq 6K TPM free tier)
- Stress test pipeline_failures threshold still fails (external API limits, not architecture)
- Groq paid tier needed for production contextual prefix at scale

**Notes:**
- MCP search p50=110ms (was 7.6s with Groq) — 66x improvement
- Server can sustain 118 VUs / 11 RPS / 14 minutes without abort
- Remaining bottleneck is external API rate limits, not our architecture
- Docker volumes: must use `external: true` with `name:` to prevent volume recreation on compose changes
