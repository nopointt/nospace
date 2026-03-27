---
# contexter-roadmap.md — Contexter Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-03-27 (session 194 — MLP complete, CTX-01+CTX-07 closed)
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
| **CTX-04** | **Auth (OAuth: Google/Telegram/Yandex)** | **🔜 NEXT** | — |
| CTX-05 | Benchmarks + Pricing + Billing | ⬜ PLANNED | — |
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
- RAG quality tuning (query rewriter, domain terms)
- Document viewer content empty for some docs
- ConnectionModal UX improvements
- Responsive mobile/tablet

### From CTX-07
- P2-003: Batch chunk INSERT (perf optimization)
- P2-004: Parallel embed batches (perf optimization)
- NEW-024: HNSW index tuning (at scale)
- NEW-025: Upload streaming to R2 (at scale)
- NEW-027: Error aggregation/alerting
- NEW-028: Pipeline latency metrics (p50/p95/p99)
- NEW-029: Groq/Jina API call logging

## Prod Roadmap

| Phase | What | Status |
|---|---|---|
| MLP | Hetzner + CF Pages, all formats, MCP, frontend SPA, security hardened | **✅ DONE** |
| Pricing model | Usage-based per-GB, credit system, 6 tiers | **decided** |
| Production stack | Hetzner CAX11 + pgvector + Groq + Docling | **deployed** |
| **GTM Strategy** | **Positioning, messaging, copy, competitive analysis** | **🔶 IN PROGRESS (CTX-08)** |
| Auth | OAuth (Google/Telegram/Yandex), magic link, proper login | 🔜 NEXT (CTX-04) |
| Billing | LemonSqueezy integration, prepaid + usage | after auth |
| Benchmarks | Latency, cost per doc, cost per query, throughput | after billing |
