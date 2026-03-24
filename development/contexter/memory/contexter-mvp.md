---
# contexter-mvp.md — CTX-01 MVP Pipeline
> Layer: L3 | Epic: CTX-01 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-24 (session 187)
---

## Goal

Full pipeline: any file → parse → chunk → embed → index → MCP endpoint + RAG query. Deployed on CF Workers + CF Pages. Connected to Claude.ai. Frontend SPA for demo.

## Status: ~90% complete (MLP stage)

Backend fully async. Frontend deployed. 62/62 E2E tests pass. Remaining: visual polish, auth UX, document viewer.

## Completed This Session (2026-03-24)

- [x] Frontend SPA: SolidJS + Vite + Tailwind CSS 4 (10 components, 5 pages)
- [x] CSS @layer base fix (root cause of visual issues)
- [x] Async pipeline: waitUntil() + jobs table stage tracking
- [x] Status API returns stages[] from jobs table
- [x] Retry endpoint: POST /api/retry/:documentId
- [x] Race condition fix in status endpoint (derived status)
- [x] User isolation: Vectorize filter + FTS5 JOIN by userId
- [x] API contract adapter: camelCase↔snake_case mapping
- [x] Nav: unified menu for all pages (auth-aware)
- [x] Frontend deployed: https://contexter-web.pages.dev
- [x] Backend deployed: https://contexter.nopoint.workers.dev
- [x] E2E tests: 62/62 PASS (Moholy)
- [x] Pencil design recovery: 141/199 ops, 31 nodes, 11 components
- [x] Bauhaus G3 Team: 7 permanent Eidolons created

## Remaining Tasks

- [ ] Document viewer: click doc → see formatted content
- [ ] Hero copy: creative AI chat listing (Claude/ChatGPT/Cursor badges)
- [ ] Auth UX: seamless login (auto-detect best method)
- [ ] OAuth providers: Google + Telegram + Yandex
- [ ] RAG quality tuning (query rewriter, domain terms)
- [ ] FTS5 prod DB clean reset
- [ ] toMarkdown quality per format
- [ ] Large file handling (>25MB audio)
- [ ] Breuer/Albers verification passes (visual + design audit)
- [ ] Missing Pencil screens (~16 states)
- [ ] Responsive: mobile/tablet (desktop-only now)
- [ ] CF Pages custom domain

## Blockers

- CF Vectorize not available in local dev (remote only)
- Video keyframe extraction impossible in CF Workers
- MCP tools (Pencil) only accessible from main Axis context, not subagents

## Acceptance Criteria

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Upload file via API → get documentId | ✅ |
| AC-2 | Pipeline: parse → chunk → embed → index (async) | ✅ |
| AC-3 | Query returns answer with sources | ✅ |
| AC-4 | MCP endpoint works with Claude.ai Connector | ✅ |
| AC-5 | User isolation (Vectorize + FTS5 filter) | ✅ |
| AC-6 | Share link (read-only access) | ✅ |
| AC-7 | 12 file formats supported | ✅ |
| AC-8 | 128+ unit tests + 62 E2E tests | ✅ |
| AC-9 | RAG quality acceptable for demo | ⬜ |
| AC-10 | Frontend SPA deployed on CF Pages | ✅ |
| AC-11 | Pipeline stage tracking (real-time) | ✅ |
| AC-12 | Document viewer (click → see content) | ⬜ |
