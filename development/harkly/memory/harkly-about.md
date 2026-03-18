---
# harkly-about.md — Harkly Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-14
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
| Brand Values | `nospace/marketing/branding/values.md` |
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

## Canvas Architecture

- `Canvas.tsx` — infinite canvas (pan + zoom, CSS transform)
- `CanvasFrame.tsx` — draggable/resizable frame, `data-canvas-frame`
- `FrameContentRouter.tsx` — routes `frame.module` → React component
- `useCanvasState.ts` — Zustand store with localStorage persist
- `ChatPanel.tsx` — floating chat (3 positions: left/center/right)
- `AgentStatusBar.tsx` — active agent status

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
| `memory/session-scratch.md` (L4) | Axis — write during session, clear on close |

## Open APIs & Data Sources

→ [nospace/docs/research/open-apis/index.md](../../../../docs/research/open-apis/index.md) — available APIs for ingestion layer (social, news, business, text analysis)

**Priority APIs for MVP ingestion:**
- Reddit API (OAuth) — UC-2/UC-3 primary source
- Hacker News Algolia API (no auth) — UC-3 tech signal
- NewsAPI / The Guardian (apiKey) — UC-3 news coverage
- Rss2Json (no auth) — forum/blog RSS to JSON
- Scrapling (Python lib) — unstructured scraping targets (App Store, forums)

## Navigation

| Need | File |
|---|---|
| Roadmap | [harkly-roadmap.md](harkly-roadmap.md) (L2) |
| Chronicle index | `memory/chronicle/index.md` |
| Architecture spec | `branches/feat-saas-v1/Harkly Architecture Spec.md` |
| Report catalog (Steam era) | `memory/report-catalog.md` |
| SemComp algorithms | `memory/semcomp-registry.md` |
| Cold outreach research | `memory/cold-outreach-research.md` + `cold-outreach-funnel-research.md` |
