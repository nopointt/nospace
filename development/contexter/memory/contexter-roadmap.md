---
# contexter-roadmap.md — Contexter Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-03-21
---

## Current Focus: Demo MVP on CF Workers

**MVP scope:** Upload any file → parse → chunk → embed → index → MCP endpoint + RAG query. 3-screen web UI (hero, upload+pipeline, dashboard).

---

## Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **CTX-01** | **MVP Pipeline + API** | **🔶 IN PROGRESS** | `contexter-mvp.md` |
| CTX-02 | Design System + 3 Screens | 🔶 IN PROGRESS | — |
| CTX-03 | Frontend (SolidJS static SPA) | 🔜 NEXT | — |
| CTX-04 | Auth (better-auth 1.5 full) | ⬜ PLANNED | — |
| CTX-05 | Benchmarks + Pricing | ⬜ PLANNED | — |
| CTX-06 | Production (VPS, ffmpeg, full video) | ⬜ PLANNED | — |

## CTX-01 Sub-Tasks

| Task | Status |
|---|---|
| Scaffold (Hono + D1 + R2 + KV + Vectorize + AI) | ✅ DONE |
| Parsers (toMarkdown, audio, youtube, pdf-visual) | ✅ DONE |
| Chunking (semantic, table, timestamp) | ✅ DONE |
| Embedding (Jina v4, batch, query) | ✅ DONE |
| Vector Store (Vectorize + FTS5 + RRF) | ✅ DONE |
| MCP Gateway (tools, routing) | ✅ DONE |
| RAG Query (rewrite → search → context → LLM) | ✅ DONE |
| Pipeline integration | ✅ DONE |
| Dev UI | ✅ DONE |
| Deploy to CF Workers | ✅ DONE |
| MCP remote endpoint (/sse) | ✅ DONE |
| Claude.ai Connector — verified | ✅ DONE |
| User isolation + sharing | ✅ DONE |
| API endpoints (upload, query, status, auth) | ✅ DONE |
| 128 unit tests | ✅ DONE |
| RAG quality tuning | ⬜ TODO |
| FTS5 prod DB clean reset | ⬜ TODO |

## CTX-02 Sub-Tasks

| Task | Status |
|---|---|
| Design system MD docs (12 files) | ✅ DONE |
| Pencil frames (14 frames) | ✅ DONE (needs quality rework) |
| Rework visualization (world-class quality) | ⬜ TODO |
| Hero screen design | ⬜ TODO |
| Upload + Pipeline screen design | ⬜ TODO |
| Dashboard screen design | ⬜ TODO |

---

## Prod Roadmap (future)

| Phase | What | When |
|---|---|---|
| Demo MVP | CF Workers, all formats, MCP, 3 screens | now |
| Benchmarks | Latency, cost per doc, cost per query, throughput | after MVP |
| Pricing | Usage-based, per-document or per-query | after benchmarks |
| Prod | VPS (ffmpeg, yt-dlp, full video), Qdrant (2048 dims) | after pricing |
