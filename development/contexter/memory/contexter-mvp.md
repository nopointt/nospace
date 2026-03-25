---
# contexter-mvp.md — CTX-01 MVP Pipeline
> Layer: L3 | Epic: CTX-01 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-25 (session 190)
---

## Goal

Full pipeline: any file → parse → chunk → embed → index → MCP endpoint + RAG query. Deployed on CF Workers + CF Pages. Connected to ChatGPT/Claude/Perplexity/Cursor. Frontend SPA for demo.

## Status: ~95% complete (MLP stage)

Backend fully async + OAuth 2.1. Frontend deployed with interactive blob cluster, connection modal, document viewer. 26/26 E2E tests pass. 4 full audits applied. Remaining: document viewer content fix, pipeline progress UI, responsive.

## Completed Session 190 (2026-03-25)

- [x] 4 full audits: Gropius visual, Copy dejargon, UX flow, Schlemmer API — ALL applied
- [x] Silicon Sampling: 20 personas × 5 tasks = 100 simulated interactions
- [x] SVG blob cluster: goo filter, proximity gradient, floating, parallax, wobble, real logos
- [x] Pre-qualification ConnectionModal ("какую нейросеть используете?")
- [x] DocumentModal popup (click doc → see content inline)
- [x] "выбрать файлы" button in drop zone
- [x] Pipeline stages translated to Russian
- [x] Trust footer (Cloudflare Europe, no AI training, delete anytime)
- [x] Elevated post-upload query section
- [x] Registration security: rate limit 5/hour + email dedup + input validation
- [x] Pipeline error handling: stage timeouts (25s parse, 5s chunk, 25s embed, 20s index)
- [x] Pipeline health endpoint: GET /api/pipeline/health
- [x] Vectorize post-query userId filtering (critical bug: CF ignores non-indexed metadata)
- [x] OAuth 2.1 server: /authorize + /token + PKCE + consent page (for Perplexity)
- [x] Dynamic Client Registration: POST /register (RFC 7591)
- [x] Favicon: blue [] SVG
- [x] 401 auto-logout on frontend
- [x] E2E 26/26 pass (Moholy rerun + 4 bug fixes)
- [x] Copy: full dejargon (MCP→подключение, чанки→фрагменты, 28+ text edits)
- [x] Nav: onLogin prop, correct routes, settings link
- [x] Document content endpoint: GET /api/documents/:id/content

## Remaining Tasks

- [ ] Document viewer: content shows empty for some docs (backend data issue)
- [ ] Pipeline progress UI: 4-stage progress bar (dots + lines, not text labels)
- [ ] Perplexity OAuth e2e verification (consent page works, full flow untested)
- [ ] Responsive: mobile/tablet (deferred to after Artem usability test)
- [ ] Google + Telegram OAuth (deferred)
- [ ] RAG quality tuning (query rewriter, domain terms)
- [ ] CF Pages custom domain

## Blockers

- CF Vectorize metadata filtering not available → using post-query filter
- Video keyframe extraction impossible in CF Workers
- Perplexity requires full OAuth 2.1 (implemented but untested e2e)

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
| AC-8 | 26/26 E2E tests pass | ✅ |
| AC-9 | RAG quality acceptable for demo | ⬜ |
| AC-10 | Frontend SPA deployed on CF Pages | ✅ |
| AC-11 | Pipeline stage tracking (real-time) | ✅ |
| AC-12 | Document viewer (click → see content) | 🔶 (popup works, content empty for some docs) |
| AC-13 | OAuth 2.1 for Perplexity | 🔶 (implemented, needs e2e test) |
| AC-14 | Interactive blob cluster (hero) | ✅ |
| AC-15 | Connection pre-qualification | ✅ |
