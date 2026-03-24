---
# contexter-roadmap.md — Contexter Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-03-24
---

## Current Focus: MLP (Minimum Lovable Product)

**Scope:** Full pipeline + frontend SPA + production deploy. Demo for Artem (CPO ProxyMarket).

---

## Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **CTX-01** | **MVP Pipeline + API + Frontend** | **🔶 IN PROGRESS** | `contexter-mvp.md` |
| CTX-02 | Design System + Pencil Screens | ✅ DONE (12 docs + 31 recovered nodes) | — |
| **CTX-03** | **Frontend (SolidJS SPA)** | **✅ DEPLOYED** | — |
| CTX-04 | Auth (OAuth: Google/Telegram/Yandex) | 🔜 NEXT | — |
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
| User isolation (Vectorize + FTS5) | ✅ DONE |
| API endpoints (upload, query, status, auth, retry) | ✅ DONE |
| 128 unit tests + 62 E2E tests | ✅ DONE |
| Async pipeline (waitUntil + jobs table) | ✅ DONE |
| Stage tracking (real-time status API) | ✅ DONE |
| RAG quality tuning | ⬜ TODO |

## CTX-02 Sub-Tasks

| Task | Status |
|---|---|
| Design system MD docs (12 files) | ✅ DONE |
| Pencil recovery (141/199 ops, 31 nodes, 11 components) | ✅ DONE |
| Design audit criteria (51 criteria) | ✅ DONE |
| Atomic actions map (10 flows, 45 states, 174 actions) | ✅ DONE |
| Stage 1 responsive research (6 reports, 300+ sources) | ✅ DONE |
| Missing Pencil screens (~16 states) | ⬜ TODO |
| Responsive: mobile/tablet | ⬜ TODO |

## CTX-03 Sub-Tasks

| Task | Status |
|---|---|
| Scaffold (SolidJS + Vite + Tailwind CSS 4) | ✅ DONE |
| Design tokens (@theme, 26 variables) | ✅ DONE |
| 10 components (Button, Input, Badge, Pipeline, etc.) | ✅ DONE |
| 5 pages (Hero, Dashboard, ApiPage, Settings, Upload) | ✅ DONE |
| API integration (lib/api.ts, lib/store.ts) | ✅ DONE |
| CSS @layer fix | ✅ DONE |
| Deploy to CF Pages (contexter-web.pages.dev) | ✅ DONE |
| Document viewer (click → see content) | ⬜ TODO |
| Hero copy (AI chat badges) | ⬜ TODO |
| Seamless auth UX | ⬜ TODO |
| Breuer/Albers verification | ⬜ TODO |

---

## Prod Roadmap (future)

| Phase | What | When |
|---|---|---|
| MLP | CF Workers + CF Pages, all formats, MCP, frontend SPA | **NOW — deployed** |
| Auth | OAuth (Google/Telegram/Yandex) | next sprint |
| Benchmarks | Latency, cost per doc, cost per query, throughput | after auth |
| Pricing | Usage-based, per-document or per-query | after benchmarks |
| Prod | VPS (ffmpeg, yt-dlp, full video), Qdrant (2048 dims) | after pricing |
