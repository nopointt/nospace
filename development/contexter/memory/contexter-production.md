---
# contexter-production.md — CTX-07 Production Hardening
> Layer: L3 | Epic: CTX-07 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-27 (session 193 CLOSE — 85/92 issues fixed, 17/17 routes verified, MLP ~95%)
---

## Goal

Full production hardening of Contexter on Hetzner. Fix migration bugs, test all endpoints, resolve deferred tasks, achieve production-grade reliability.

## Context

CTX-06 (migration) deployed Contexter on Hetzner CAX11 with PG/pgvector/Redis/Caddy/Docling. Infrastructure works, health endpoint responds. First functional test (upload) hit R2 S3 403 error. This epic covers: fixing all bugs, testing every endpoint, resolving deferred work.

## Infrastructure (deployed)

| Component | Status |
|---|---|
| Hetzner CAX11 (46.62.220.214) | ✅ Running |
| PostgreSQL 16 + pgvector 0.8.2 | ✅ Healthy |
| Redis 7 | ✅ Healthy |
| Caddy (reverse proxy) | ✅ Running |
| Docling (document parser) | ✅ Running |
| Bun + Hono app | ✅ Running |
| SSL Full (CF → Hetzner) | ✅ Configured |
| `api.contexter.cc` → Hetzner | ✅ DNS |
| `contexter.cc` → CF Pages | ✅ DNS |

## Bug Fixes (migration)

- [ ] R2 S3 AccessDenied on PutObject — fix auth (use CF Global Key or fix R2 token)
- [ ] Verify all 12 route files compile clean (TS strict null checks)
- [ ] Test registration endpoint
- [ ] Test file upload (text + multipart)
- [ ] Test pipeline (parse → chunk → embed → index)
- [ ] Test query (hybrid search: pgvector + tsvector)
- [ ] Test MCP endpoint (/sse)
- [ ] Test OAuth 2.1 flow
- [ ] Test document viewer
- [ ] Test retry endpoint
- [ ] Test share links
- [ ] Test delete document

## Deferred Tasks (from CTX-01)

- [ ] Document viewer: content empty for some docs (backend data issue)
- [ ] Pipeline progress UI: 4-stage progress bar
- [ ] Perplexity OAuth e2e verification
- [ ] RAG quality tuning (query rewriter, domain terms)
- [ ] ConnectionModal popup UX improvements

## Deferred Tasks (from CTX-06 migration)

- [ ] Vectorize metadata bug → now solved by pgvector native filtering (verify)
- [ ] Video processing (ffmpeg on VPS) — Docling may handle this
- [ ] BullMQ job queue (replace fire-and-forget with proper retry/backoff)
- [ ] Data migration: D1 → PG (existing users + documents)
- [ ] Frontend: update API base URL to api.contexter.cc
- [ ] E2E tests: adapt for new stack
- [ ] Monitoring: Netdata setup

## Production Requirements

- [ ] pg_dump cron backup to R2
- [ ] Proper error logging (not just console.error)
- [ ] Rate limiting on all endpoints (Redis-based)
- [ ] CF SSL mode Full verified working
- [ ] Response times < 500ms for API endpoints
- [ ] Docling parse quality verification (compare with Workers AI toMarkdown)

## Blockers

- R2 S3 403 — must fix before any file upload testing

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | All API endpoints return correct responses | Manual test each endpoint |
| AC-2 | Upload + pipeline works end-to-end | Upload PDF → query → get answer |
| AC-3 | pgvector user isolation works | Upload as user A, query as user B → no results |
| AC-4 | tsvector FTS works | Text search returns ranked results |
| AC-5 | MCP endpoint works with Claude.ai | Connect via MCP URL |
| AC-6 | OAuth 2.1 works with Perplexity | Full authorization flow |
| AC-7 | Docling parses PDF/DOCX correctly | Upload complex PDF → verify markdown quality |
| AC-8 | No 5xx errors under normal usage | Monitor logs for 1 hour |
| AC-9 | Frontend works on contexter.cc | Open in browser, full flow |
