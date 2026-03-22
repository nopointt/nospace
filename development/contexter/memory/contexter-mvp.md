---
# contexter-mvp.md — CTX-01 MVP Pipeline
> Layer: L3 | Epic: CTX-01 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-22 (session 183)
---

## Goal

Full pipeline: any file → parse → chunk → embed → index → MCP endpoint + RAG query. Deployed on CF Workers. Connected to Claude.ai.

## Status: 95% complete

All pipeline stages working. Deployed. MCP connected. Auth + sharing working. Remaining: quality tuning.

## Remaining Tasks

- [ ] RAG query rewriter: preserve domain terms (e.g. "телос" → not "тело")
- [ ] FTS5 prod DB needs clean reset (corrupt from early testing)
- [ ] toMarkdown quality assessment on all 12 formats
- [ ] Large file handling (>25MB audio needs chunking)
- [x] Design system: 45/45 screen states designed in Pencil
- [x] JTBD analysis + design audit (32 criteria)
- [x] Workspace consciousness skills updated for contexter
- [ ] CTX-03: Frontend implementation (SolidJS SPA) — use 45 screen states as spec

## Blockers

- CF Vectorize not available in local dev (remote only)
- Video keyframe extraction impossible in CF Workers (demo: audio only)

## Acceptance Criteria

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Upload file via API → get documentId | ✅ |
| AC-2 | Pipeline: parse → chunk → embed → index | ✅ |
| AC-3 | Query returns answer with sources | ✅ |
| AC-4 | MCP endpoint works with Claude.ai Connector | ✅ |
| AC-5 | User isolation (token-based) | ✅ |
| AC-6 | Share link (read-only access) | ✅ |
| AC-7 | 12 file formats supported | ✅ |
| AC-8 | 128+ unit tests passing | ✅ |
| AC-9 | RAG quality acceptable for demo | ⬜ |
