---
# harkly-about.md — Harkly Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-19 (session 172 — 18.1-18.3 code complete)
---

## Identity

Harkly = data intelligence platform. Any data → structured DB → MCP → any LLM + spatial canvas.
Team: nopoint (founder) + Артём (co-founder, roles TBD).

## Tech Stack (MVP)

| Layer | Technology | Where |
|---|---|---|
| Runtime | Bun | local dev |
| Framework | SolidStart 1.3.x + SolidJS 1.9.x | Cloudflare Pages |
| CSS | Tailwind CSS 4 (`@tailwindcss/vite`) | — |
| ORM | Drizzle ORM 0.45.x (sqlite dialect) | — |
| Database | Cloudflare D1 (2 DBs: AUTH_DB + KB_DB) | CF edge |
| Vector search | Cloudflare Vectorize (1024-dim, cosine) | CF edge |
| Full-text search | D1 FTS5 virtual table + BM25 | CF edge |
| File storage | Cloudflare R2 (presigned uploads via aws4fetch) | CF edge |
| Queue | Cloudflare Queues + D1 job table | CF edge |
| Auth (user) | better-auth + better-auth-cloudflare (D1 adapter) | CF Pages Worker |
| Auth (MCP) | @cloudflare/workers-oauth-provider (OAuth 2.1 + PKCE) | CF Worker |
| MCP server | @cyanheads/mcp-ts-core (Streamable HTTP, MCP 2025-06-18) | CF Worker |
| AI — extraction | instructor-js + Zod (TOOLS/JSON_SCHEMA mode) | CF Workers AI / Groq / NIM |
| AI — embeddings | Workers AI `@cf/baai/bge-large-en-v1.5` (free, 1024-dim) | CF edge |
| AI — transcription | Groq Whisper Large v3 Turbo ($0.04/hr) | Groq API |
| AI — schema discovery | Workers AI Llama 3.3 70B / Groq / NIM fallback | — |
| Deploy | Cloudflare Pages (web) | `harkly.pages.dev` |

## Key Paths

| Resource | Path |
|---|---|
| Project root | `nospace/development/harkly/` |
| Frontend source (canonical) | `development/harkly/harkly-shell/src/` (77 SolidJS files, porting to web) |
| MVP project | `development/harkly/harkly-web/` (53 src files, SolidStart 1.3.2 + CF Pages) |
| Branch specs | `development/harkly/branches/` |
| Epics log | `development/harkly/memory/epics-log-harkly.md` |
| Decisions log | `development/harkly/memory/decisions-harkly.md` |
| Marketing domain | `nospace/marketing/` |
| Brand TOV | `development/harkly/brand/tov.md` |
| Brand Values | `development/harkly/brand/values.md` |
| Brand Bible | `development/harkly/brand/brand-bible.md` |
| Content pipeline agents | `development/harkly/brand/agents/` |
| Idea Hub | `development/harkly/brand/ideas/hub.json` |
| Research Briefs | `development/harkly/brand/ideas/briefs/` |
| MVP research (9 files) | `nospace/docs/research/harkly-research-*.md` + `harkly-eval-*.md` |
| MVP specs (5 files) | `nospace/docs/research/harkly-mvp-*.md` |

## Legacy (deprecated, do not use)

| Resource | Path | Status |
|---|---|---|
| harkly-saas (Next.js/Vercel) | `development/harkly/harkly-saas/` | DEPRECATED — stack replaced |
| Landing page | `harkly-saas.vercel.app` | Legacy landing, still live |
| Waitlist API | `POST /api/waitlist { telegram, role }` | Still on Vercel |
| Old architecture docs | `architecture/harkly-product-architecture-en.md`, `harkly-spine-process-ru.md`, `harkly-cjm-spine-flow.md` | Historical reference, superseded by MVP docs |

## Auth Architecture (MVP)

Three-layer design on Cloudflare:
1. **workers-oauth-provider** (outermost) — OAuth 2.1 server, PKCE, dynamic client registration, KV token storage
2. **better-auth** (user identity) — signup/login/session, D1 adapter, per-request instantiation
3. **mcp-ts-template** (MCP protocol) — Streamable HTTP, Zod tool builder, scope-based access

## Canvas Architecture

Port from harkly-shell (Tauri SolidJS) → web SolidStart. 77 existing files:
- `Space.tsx` — infinite canvas with transform matrix (pan/zoom)
- `useViewport.ts`, `useFloor.ts`, `useSnap.ts` — spatial hooks
- `frameRegistry.tsx` — 25+ frame types
- `Omnibar.tsx` + panels — primary input (hidden in MVP, polished v1.1)
- `components/frames/harkly/` — 7 Harkly-specific frames (Insights, Notebook, RawData, etc.)
- Source of truth for UI design: `nospace/design/harkly/harkly-ui.pen`

## Compliance

- **152-ФЗ plan** (deferred): personal data → RU hosting when needed. Currently: Cloudflare (pre-launch, no real users).

## Active L3 (single source of truth)

| Epic | File | Status |
|---|---|---|
| **HARKLY-18 MVP Data Layer** | [harkly-mvp-data-layer.md](harkly-mvp-data-layer.md) | 🔶 IN PROGRESS |
| — HARKLY-18.1 Scaffold | [harkly-18-1-scaffold.md](harkly-18-1-scaffold.md) | ✅ DONE |
| — HARKLY-18.2 Upload + Process | [harkly-18-2-upload.md](harkly-18-2-upload.md) | ✅ CODE COMPLETE |
| — HARKLY-18.3 Schema + Extract | [harkly-18-3-schema.md](harkly-18-3-schema.md) | ✅ CODE COMPLETE |
| — HARKLY-18.4 MCP + OAuth | [harkly-18-4-mcp.md](harkly-18-4-mcp.md) | ✅ DEPLOYED |
| — HARKLY-18.5 Canvas Port | [harkly-18-5-canvas.md](harkly-18-5-canvas.md) | ✅ CODE COMPLETE |
| HARKLY-15 UI Design (Pencil) | [harkly-design-ui.md](harkly-design-ui.md) | ⏸ PAUSED |
| HARKLY-17 Shell (Tauri + SolidJS) | [harkly-shell-epic.md](harkly-shell-epic.md) | ⏸ PAUSED (v2) |
| HARKLY-14 Content Auto-Writing | [harkly-marketing-content.md](harkly-marketing-content.md) | ⏸ PAUSED |
| HARKLY-05 Backend Build | [harkly-saas-v1.md](harkly-saas-v1.md) | ⏸ PAUSED (superseded by 18) |
| HARKLY-16 Claude CLI Integration | [anthropic-claudecode-inquiry.md](anthropic-claudecode-inquiry.md) | ⏸ PAUSED (MCP path chosen) |
| HARKLY-12 Canvas Redesign | [harkly-canvas-redesign.md](harkly-canvas-redesign.md) | ⏸ PAUSED |
| HARKLY-06 Cold Outreach | [harkly-cold-outreach.md](harkly-cold-outreach.md) | ⏸ PAUSED |

> Full focus: HARKLY-18 MVP Data Layer. All other epics paused until MVP ships.

## G3 Rule

Prompt via file: `cat spec.md`. Axis = Coach, never writes code.
Player subagent: `lead-frontend` (SolidJS) | `lead-backend` (CF Workers)

## Write Authority

| File | Owner |
|---|---|
| `memory/harkly-about.md` (L1) | Axis — structural changes only |
| `memory/harkly-roadmap.md` (L2) | Axis — epic/stage status |
| `memory/harkly-mvp-data-layer.md` (L3) | Axis — task tracking |
| `memory/harkly-18-*.md` (L3 sub-epics) | Axis — task tracking |
| `memory/chronicle/harkly-current.md` | Axis — append only |
| `memory/chronicle/index.md` | Axis — append only |
| `memory/session+{N}-scratch.md` (L4) | Axis — write during session |
| `memory/chronicle/queue/` | Axis — staging queue |
| `memory/chronicle/scratches/` | Axis — archived scratches |

## Open APIs & Data Sources

→ [nospace/docs/research/open-apis/index.md](../../../../docs/research/open-apis/index.md) — APIs for ingestion layer

**Priority connectors (v2+, from F1 research 2026-03-18):**
- P0: Manual upload (files, audio) + YouTube subtitles ← **MVP**
- P1: Telegram channels + Support tickets (Zendesk/Intercom) + vc.ru
- P2: Surveys/NPS exports + marketplace reviews (Ozon/WB)
- P3: YouTube (full, needs server), Habr, Instagram
- P4: Reddit, HN (low RU audience relevance)

## Brand Docs

| Doc | Path |
|---|---|
| Brand Bible | `development/harkly/brand/brand-bible.md` |
| Values | `development/harkly/brand/values.md` |
| Positioning | `development/harkly/brand/positioning.md` |
| Category Manifesto | `development/harkly/brand/category-manifesto.md` |
| TOV | `development/harkly/brand/tov.md` (v3) |

## Design System

**Pencil (source of truth):** `nospace/design/harkly/harkly-ui.pen`
- Color System (DpHtH) · Spacing System (jrVLH) · Typography System (Kf1xa) · Motion System (zqE0U) · Interface Examples (xF6MT) · Component Library (ejLN6, 17 components) · Omnibar/Collapsed (fYZfh) · Omnibar/Expanded (keCtm) — total 19 reusable components

**Docs:** `nospace/design/harkly/`
- `README.md` · `foundations/` · `guidelines/` · `patterns/` · `components/inventory.md`

**Upstream:** tLOS Bauhaus RAG `nospace/design/design_system/` (80 files) + `docs/tLOS/design/bauhaus-code/` (107 extractions) + Qdrant `bauhaus_knowledge` (10,288 vectors)

Берём из tLOS: 5 принципов, spacing scale, typography rules, spatial paradigm. Своё: warm palette, soft corners, light theme, calm density.

## Navigation

| Need | File |
|---|---|
| Roadmap | [harkly-roadmap.md](harkly-roadmap.md) (L2) |
| Design system | `nospace/design/harkly/README.md` |
| Chronicle index | `memory/chronicle/index.md` |
| MVP Architecture | `nospace/docs/research/harkly-mvp-architecture.md` |
| MVP Data Model | `nospace/docs/research/harkly-mvp-data-model.md` |
| MVP API Spec | `nospace/docs/research/harkly-mvp-api-spec.md` |
| MVP Copy Map | `nospace/docs/research/harkly-mvp-copy-map.md` |
| MVP Build Plan | `nospace/docs/research/harkly-mvp-build-plan.md` |
| Old architecture (EN) | `architecture/harkly-product-architecture-en.md` (legacy) |
| Old architecture (RU) | `architecture/harkly-spine-process-ru.md` (legacy) |
