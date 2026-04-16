---
# contexter-roadmap.md — Contexter Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-04-17 (session 244 — CTX-11 Analytics opened as separate epic per D-31)
---

## Current Focus: MLP COMPLETE

**Scope:** Full pipeline + frontend SPA + production deploy on Hetzner. Demo for Artem (CPO ProxyMarket).
**Status:** MLP ready. All critical fixes applied, backups configured, security hardened.

---

## Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| CTX-01 | MVP Pipeline + API + Frontend | ✅ MLP COMPLETE (2026-03-27) | `contexter-mvp.md` |
| CTX-02 | Design System + Pencil Screens | ✅ DONE | — |
| CTX-03 | Frontend (SolidJS SPA) | ✅ DEPLOYED (CF Pages, contexter.cc) | — |
| **CTX-04** | **Auth (OAuth: Google + Email, Telegram deferred)** | **🔶 IN PROGRESS** | `contexter-auth.md` |
| **CTX-10** | **GTM Launch — 100 supporters × $10, all free channels, EN global** | **🔶 IN PROGRESS** | `contexter-gtm-launch.md` |
| **CTX-12** | **Supporters Backend — tokens, ranking, LemonSqueezy webhooks, dashboard** | **✅ COMPLETE (2026-04-12)** | `contexter-supporters-backend.md` |
| **CTX-13** | **Reddit GTM — organic presence, warmup, directory submissions, launch posts** | **🔶 IN PROGRESS** | `contexter-reddit-gtm.md` |
| **CTX-11** | **Analytics — PostHog EU + attribution + MCP telemetry + GoAccess + dashboards** | **🔶 IN PROGRESS (2026-04-17)** | `contexter-analytics.md` |
| CTX-05 | Benchmarks + Pricing + Billing | ⬜ PLANNED | — |
| CTX-09 | UI/UX Polish (design system, responsive, a11y, pipeline indicator) | ✅ COMPLETE (2026-03-30) | `contexter-uiux-polish.md` |
| CTX-06 | Production Migration (CF Workers → Hetzner) | ✅ CLOSED (2026-03-27) | `contexter-migration.md` |
| CTX-07 | Production Hardening | ✅ MLP COMPLETE (2026-03-27) | `contexter-production.md` |

## MLP Summary (achieved 2026-03-27)

| What | Status |
|---|---|
| Hetzner CAX11 (PG+pgvector+Redis+Caddy+Docling+Bun) | Deployed |
| Frontend SPA on CF Pages (contexter.cc) | Deployed |
| 15 file formats (PDF, DOCX, audio, video, images) | Working |
| 12 MCP tools (Streamable HTTP) | Working |
| OAuth 2.1 + PKCE S256 | Implemented |
| 92-issue audit → 70+ fixed | Applied |
| pg_dump daily backup → R2 | Configured |
| Non-root containers + security_opt | Configured |
| CF Origin Certificate (valid 2041) | Deployed |
| BullMQ job queue (retry/backoff) | Running |
| Netdata monitoring | Running |
| Rate limiting (registration/upload/query) | Active |
| Structured JSON logging | Active |

## Migration Summary (CTX-06, completed 2026-03-27)

| From | To |
|---|---|
| CF Workers | Bun on Hetzner CAX11 (€4.72/mo) |
| D1 (SQLite) | PostgreSQL 16 + pgvector 0.8.2 |
| FTS5 | tsvector + GIN |
| CF Vectorize | pgvector HNSW |
| CF KV | Redis 7 (BullMQ queue) |
| Workers AI toMarkdown | Docling (IBM) |
| Workers AI LLM | Groq Llama 3.1 8B |
| waitUntil() | BullMQ (retry/backoff/dead letter) |
| No video | ffmpeg (audio extraction → Whisper) |
| No monitoring | Netdata + structured JSON logging |

## Post-MLP Backlog (deferred, not blocking)

### From CTX-01
- Pipeline progress UI (4-stage visual bar)
- Document viewer content empty for some docs
- ConnectionModal UX improvements
- Responsive mobile/tablet

### From CTX-07
- P2-003: Batch chunk INSERT (perf optimization)
- P2-004: Parallel embed batches (perf optimization)
- NEW-024: HNSW index tuning (at scale)
- NEW-025: Upload streaming to R2 (at scale)

### From CTX-08
- F-029: BM25 conditional (blocked: needs PG 17+, current: 16.13)
- Direct upload 415 bug (resolveMimeType for multipart)
- PDF 22K→1 chunk bug (BPE encoder not loaded in some cases)
- Rotate 54 API tokens (security, deferred — no evidence of leak)

### Brand & Design (deferred)
- Create Contexter brand guidelines document (brand-guidelines.md) — TOV, writing rules, messaging framework
- Create Contexter design guidelines (project-specific adaptations from tLOS Bauhaus system) — currently inherits tLOS defaults

## Prod Roadmap

| Phase | What | Status |
|---|---|---|
| MLP | Hetzner + CF Pages, all formats, MCP, frontend SPA, security hardened | **✅ DONE** |
| Pricing model | Usage-based per-GB, credit system, 6 tiers | **decided** |
| Production stack | Hetzner CAX21 + pgvector + Jina + Docling | **deployed** |
| **MCP Pivot** | **Groq removed from query path. MCP search_knowledge = chunks + instruction. Chat UI removed.** | **✅ DONE (2026-03-31)** |
| **Stress Testing** | **k6 infra, 6 runs, 118 VUs / 11 RPS / 14 min. Infra scaled for 100 concurrent.** | **✅ DONE (2026-03-31)** |
| GTM Strategy | Pre-launch QA Phases 1-4 complete. | ✅ CTX-08 closed |
| Auth | Google OAuth done. Email auth done. Telegram deferred. | ✅ (CTX-04, waves 1-5 deployed) |
| **GTM Launch** | **100 supporters × $10 in 7 days. All free channels. EN global.** | **🔶 IN PROGRESS (CTX-10, deadline 2026-04-08)** |
| Billing | NOWPayments crypto ($9/$29/$79). Card payments blocked (no KYB). | after GTM launch |
| Benchmarks | k6 stress test done. 100 concurrent OK. 500 registered target. | after billing |
