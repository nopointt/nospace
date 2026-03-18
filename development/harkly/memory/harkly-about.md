---
# harkly-about.md — Harkly Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-18
---

## Identity

Harkly = research SaaS platform. AI-powered qualitative research tool.
Team: nopoint (founder) + Артём (co-founder, roles TBD).

## Tech Stack

| Layer | Technology | Where |
|---|---|---|
| Runtime | Bun | local |
| Framework | Next.js 16 App Router + shadcn/ui | Vercel |
| Font | Inter (Google Fonts) | `layout.tsx` |
| ORM | Prisma 7 (adapter-pg) | — |
| Auth + DB | Supabase (project: itkzskhsjcfokvrdtjlv) | US |
| AI Provider | NVIDIA NIM (meta/llama-3.3-70b-instruct) | `.env.local` |
| CI/CD | GitHub Actions | — |
| Deploy | Vercel | `harkly-saas.vercel.app` |

## Key Paths

| Resource | Path |
|---|---|
| Repo root | `nospace/development/harkly/harkly-saas/` |
| Prisma schema | `harkly-saas/prisma/schema.prisma` |
| App router | `harkly-saas/src/app/` |
| Components | `harkly-saas/src/components/` |
| API routes | `harkly-saas/src/app/api/` |
| Middleware | `harkly-saas/src/middleware.ts` |
| Branch specs | `development/harkly/branches/feat-saas-v1/specs/` |
| Epics log | `development/harkly/memory/epics-log-harkly.md` |
| Decisions log | `development/harkly/memory/decisions-harkly.md` |
| Landing state | `development/harkly/memory/landing-page-state.md` |
| Marketing domain | `nospace/marketing/` (branding, copywriting, campaigns, seo) |
| Brand TOV | `nospace/development/harkly/brand/tov.md` |
| Brand Values | `development/harkly/brand/values.md` |
| Brand Bible | `nospace/development/harkly/brand/brand-bible.md` |
| LinkedIn scraper | `nospace/tools/linkedin-scraper/scrape.ts` |
| Stealth scraping docs | `development/harkly/memory/stealth-scraping-techniques.md` |
| Content pipeline agents | `nospace/development/harkly/brand/agents/` (idea_hub.py ✅, antenna/deep_researcher ⚠️ rework) |
| Idea Hub | `nospace/development/harkly/brand/ideas/hub.json` |
| Research Briefs | `nospace/development/harkly/brand/ideas/briefs/` |

## Live URLs

- Production: **https://harkly-saas.vercel.app**
- Waitlist API: `POST /api/waitlist { telegram, role }`

## Auth & Routing Rules

- Auth guard: `middleware.ts` — PUBLIC_PATHS = `['/', '/share']`
- Protected: all `/app/*` routes
- Supabase: signIn/signUp/signOut — cookies-based

## Prisma / DB Notes

- `prisma migrate dev` зависает с Supabase pooler → use `DATABASE_URL=<DIRECT_URL> bunx prisma db execute --stdin`
- Pending migrations: `e4_artifacts.sql` + `e6_share.sql` — apply in Supabase SQL editor
- Models: workspaces, research_projects, documents, extractions, artifacts, shares

## Canvas Architecture (code will be rewritten from Pencil mockups)

Legacy code references (harkly-saas/, will be replaced):
- `Canvas.tsx`, `CanvasFrame.tsx`, `FrameContentRouter.tsx`, `useCanvasState.ts`
- Source of truth for UI: `nospace/design/harkly/harkly-ui.pen`

## Compliance

- **152-ФЗ plan** (deferred): personal data → Yandex Cloud Managed PG (ru-central1). Currently: Supabase US (pre-launch, no real users).

## Active L3 (single source of truth)

| Epic | File | Status |
|---|---|---|
| HARKLY-15 UI Design (Pencil) | [harkly-design-ui.md](harkly-design-ui.md) | 🔶 IN PROGRESS |
| HARKLY-14 Content Auto-Writing System | [harkly-marketing-content.md](harkly-marketing-content.md) | 🔶 IN PROGRESS |
| Stage 5 G3 Backend Build | [harkly-saas-v1.md](harkly-saas-v1.md) | ⬜ NOT STARTED |
| HARKLY-12 Canvas Workspace Redesign | [harkly-canvas-redesign.md](harkly-canvas-redesign.md) | ⏸ ON-HOLD |
| HARKLY-06 Cold Outreach Steam | [harkly-cold-outreach.md](harkly-cold-outreach.md) | ⏸ ON-HOLD |

> Update this table when epics change. Skills and agents read active L3 from here.

## G3 Rule

Prompt via file: `cat spec.md`. Axis = Coach, never writes code.
Branch specs: `development/harkly/branches/feat-saas-v1/`
Player subagent: `nextjs-developer` (frontend) | `backend-developer` (API/Rust)

## Write Authority

| File | Owner |
|---|---|
| `memory/harkly-about.md` (L1) | Axis — structural changes only |
| `memory/harkly-roadmap.md` (L2) | Axis — epic/stage status |
| `memory/harkly-marketing-content.md` (L3) | Axis — task tracking |
| `memory/harkly-saas-v1.md` (L3) | Axis — task tracking |
| `memory/chronicle/harkly-current.md` | Axis — append only |
| `memory/chronicle/index.md` | Axis — append only |
| `memory/session+{N}-scratch.md` (L4) | Axis — write during session, archive to chronicle/scratches/ on close |
| `memory/chronicle/harkly-current.md` | Axis — append only (queue drain) |
| `memory/chronicle/queue/` | Axis — staging queue for CLOSE entries |
| `memory/chronicle/scratches/` | Axis — archived session scratches |

## Open APIs & Data Sources

→ [nospace/docs/research/open-apis/index.md](../../../../docs/research/open-apis/index.md) — available APIs for ingestion layer (social, news, business, text analysis)

**Priority connectors (from F1 audience research 2026-03-18):**
- P0: Manual upload (files, transcripts) + Telegram channels
- P1: Support tickets (Zendesk/Intercom) + vc.ru
- P2: Surveys/NPS exports + marketplace reviews (Ozon/WB)
- P3: YouTube, Habr
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
- Color System (DpHtH) · Spacing System (jrVLH) · Typography System (Kf1xa) · Motion System (zqE0U) · Interface Examples (xF6MT) · Component Library (ejLN6, 17 components)

**Docs:** `nospace/design/harkly/`
- `README.md` · `foundations/` (philosophy, principles) · `guidelines/` (color, typography, spacing, layout, elevation, motion) · `patterns/` (workspace, composition, interaction, navigation, error-states) · `components/inventory.md`

**Upstream:** tLOS Bauhaus RAG `nospace/design/design_system/` (80 files) + `docs/tLOS/design/bauhaus-code/` (107 extractions) + Qdrant `bauhaus_knowledge` (10,288 vectors)

Берём из tLOS: 5 принципов, spacing scale, typography rules, spatial paradigm. Своё: warm palette, soft corners, light theme, calm density.

## Navigation

| Need | File |
|---|---|
| Roadmap | [harkly-roadmap.md](harkly-roadmap.md) (L2) |
| Design system | `nospace/design/harkly/README.md` |
| Chronicle index | `memory/chronicle/index.md` |
| Architecture (EN) | `architecture/harkly-product-architecture-en.md` |
| Architecture (RU) | `architecture/harkly-spine-process-ru.md` |
| Report catalog (Steam era) | `memory/report-catalog.md` |
| SemComp algorithms | `memory/semcomp-registry.md` |
| Cold outreach research | `memory/cold-outreach-research.md` + `cold-outreach-funnel-research.md` |
