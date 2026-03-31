# STATE — Contexter

## Position
- **Phase:** MCP-only pivot complete. Stress tested for 100 concurrent.
- **Status:** Backend MCP-native (no Groq in query path). Frontend chat removed. Infra scaled for 500 registered / 100 concurrent.
- **Last session:** 2026-03-31 (Axis, session 220 — stress test + MCP pivot)
- **Sessions total:** 220

## Key Completions
- MCP-only pivot: Groq removed from query path, search_knowledge returns chunks + instruction
- Stress testing: k6 infrastructure, 6 test runs, 118 VUs / 11 RPS sustained 14 min
- Infra scaling: PG pool 100, BullMQ 4, app 1536m, PG 1536m, Docling 3072m
- YouTube audio fallback: yt-dlp + Whisper when no captions
- Deploy script fix: docker-compose.yml sync + REDIS_PASSWORD check
- Presign MIME bug fix: .md and other text files now resolve correctly
- Docker volume fix: named external volumes prevent data loss on compose changes

## Active Decisions
- D-01: Best RAG in the world — no shortcuts, category-defining quality
- D-02: Hetzner CAX21 (API) + CF Pages (frontend SPA)
- D-03: MCP-native (Streamable HTTP, 12 tools) — PRIMARY query path
- D-04: Swiss/Bauhaus design, Inter primary, JetBrains Mono code only
- D-05: Jina v4 embeddings (512d MRL, late chunking)
- D-06: Groq ONLY in pipeline (contextual prefix 8B + Whisper). NOT in query path.
- D-07: better-auth v1.5.6 + Google OAuth + OAuth 2.1 PKCE
- D-08: Docling from registry image (quay.io), 3GB RAM
- D-09: /api/query archived — MCP search_knowledge is the query interface
- D-10: Chat UI removed from frontend — Contexter = pipeline + MCP, not chatbot

## Blockers
- YouTube yt-dlp audio fallback needs end-to-end verification
- Pipeline failures under heavy load = external API rate limits (Jina reranker 2 concurrent, Groq 6K TPM free tier)
- Groq paid tier needed for contextual prefix at scale

## Deferred
- Mobile UX (research done, implementation pending)
- NLI hallucination detection container NOT deployed (code exists)
- DeepInfra key not configured (blocks paid user LLM fallback)

## Metrics
- Sessions: 220
- MCP search p50: 110ms (was 7.6s with Groq — 66x improvement)
- Stress test: 118 VUs, 11 RPS, 14 min sustained, 4.9% error rate
- Pipeline: 160 completions / 210 failures under 100 concurrent (external API limits)
- GitHub: github.com/nopointt/contexter
- Deployed: contexter.cc + api.contexter.cc
- Server: Hetzner CAX21 (Helsinki), 100 concurrent comfortable
