---
# contexter-roadmap.md — Contexter Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-03-27 (session 193 — Hetzner migration complete, production hardening 93% done)
---

## Current Focus: MLP Closure

**Scope:** Full pipeline + frontend SPA + production deploy on Hetzner. Demo for Artem (CPO ProxyMarket).
**Status:** ~95% MLP ready. Remaining: VITE_API_URL deploy, batch INSERT perf, containers non-root, pg_dump backup.

---

## Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **CTX-01** | **MVP Pipeline + API + Frontend** | **🔶 IN PROGRESS** (remaining: RAG quality tuning, pipeline progress UI) | `contexter-mvp.md` |
| CTX-02 | Design System + Pencil Screens | ✅ DONE | — |
| CTX-03 | Frontend (SolidJS SPA) | ✅ DEPLOYED (CF Pages, contexter.cc) | — |
| CTX-04 | Auth (OAuth: Google/Telegram/Yandex) | 🔜 NEXT | — |
| CTX-05 | Benchmarks + Pricing + Billing | ⬜ PLANNED | — |
| CTX-06 | Production Migration (CF Workers → Hetzner) | ✅ CLOSED (2026-03-27) | `contexter-migration.md` |
| **CTX-07** | **Production Hardening** | **🔶 IN PROGRESS** (92 issues found, ~85 fixed) | `contexter-production.md` |

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

Data migrated: 4 real users, 29 documents, 155 chunks (re-embedded with Jina v4).

## Production Hardening Summary (CTX-07, in progress)

12-agent parallel audit → 92 issues found → Architect spec (1140 lines) → 6 Work Packages → ~85 fixes applied.
Remaining: ~7 items (verified status pending from verification agent).

## Prod Roadmap

| Phase | What | Status |
|---|---|---|
| MLP | Hetzner + CF Pages, all formats, MCP, frontend SPA, security hardened | **~95% done** |
| Pricing model | Usage-based per-GB, credit system, 6 tiers | **decided** |
| Production stack | Hetzner CAX11 + pgvector + Groq + Docling | **deployed** |
| **MLP closure** | **Remaining fixes + VITE_API_URL + backup + final QA** | **🔶 IN PROGRESS** |
| Billing | LemonSqueezy integration, prepaid + usage | next |
| Auth | OAuth (Google/Telegram/Yandex) | next sprint |
| Benchmarks | Latency, cost per doc, cost per query, throughput | after billing |
