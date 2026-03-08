---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-08 by Assistant (session 10)
---

## Project Phase

**Стадия 3.5 IN PROGRESS — Canvas Workspace Redesign.**
Design system применён (Inter, gray-100, Tailwind scale). NVIDIA NIM подключён для тестирования чата. Omnibar подключён к workspace. Floor architecture зафиксирована в памяти.
Следующий шаг: **floor navigation + per-floor canvas content**.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-12 | **saas-v1** — Стадия 3.5 Canvas Workspace Redesign | 🔄 IN PROGRESS | Sonnet + nopoint |
| HARKLY-11 | **saas-v1** — Стадия 3 G3 Frontend Build | ✅ DONE — все E0-E6 завершены | Sonnet + nopoint |
| HARKLY-06 | Cold outreach Steam indie games | **⏸ on-hold** | nopoint |
| HARKLY-03 | ProxyMarket partnership | **on-hold** — юр. блокер | nopoint |

## saas-v1 — Дорожная карта (6 стадий)

| Стадия | Название | Статус |
|---|---|---|
| 0 | Research Foundation | ✅ DONE |
| 1 | Business Design (Opus) | ✅ DONE — opus_business_brief.md написан |
| 2 | Spec Lock | ✅ DONE — 8 спек (E0, E0.5, E1-E6), DoR 100% |
| 3 | G3 Frontend Build | ✅ DONE — E0-E6 все завершены |
| 4 | Tech Debt Analysis | ✅ DONE — tech-debt-frontend.md + ux-debt-report.md |
| 3.5 | Canvas Workspace Redesign | 🔄 IN PROGRESS — design system ✅, NVIDIA NIM ✅, floor nav ⬜ |
| 5 | G3 Backend Build | 🔒 — после Стадии 3.5 |
| 6 | Manual Testing + Beta | 🔒 |

## Canvas Workspace — Компоненты (Стадия 3.5)

| Компонент | Статус | Файл |
|---|---|---|
| ChatPanel | ✅ redesigned | `components/chat/ChatPanel.tsx` |
| ChatSettingsBar | ✅ redesigned | `components/chat/ChatSettingsBar.tsx` |
| AgentStatusBar | ✅ redesigned | `components/agents/AgentStatusBar.tsx` |
| FloorBadge | ✅ redesigned | `components/canvas/FloorBadge.tsx` |
| Omnibar | ✅ connected | `components/omnibar/Omnibar.tsx` |
| CanvasToolbar | ✅ existing | `components/canvas/CanvasToolbar.tsx` |
| NVIDIA NIM provider | ✅ connected | `useAgents.ts` + `providers/openai.ts` |
| Floor navigation | ⬜ TODO | — |
| Per-floor canvas content | ⬜ TODO | — |

## Product State — saas-v1 Frontend (E0-E6, legacy routes)

| Компонент | Статус | Маршрут |
|---|---|---|
| E0 Scaffold + Auth | ✅ DONE | `/auth/login`, `/app/dashboard` |
| E1 Framing Studio | ✅ DONE | `/app/projects/[id]/frame` |
| E2 Corpus Triage | ✅ DONE | `/app/projects/[id]/corpus` |
| E3 Evidence Extractor | ✅ DONE | `/app/projects/[id]/extract` |
| E4 Insight Canvas | ✅ DONE | `/app/projects/[id]/canvas` |
| E5 Research Notebook | ✅ DONE | `/app/projects/[id]/notebook` |
| E6 Share + Export | ✅ DONE | `/app/projects/[id]/share` + `/share/[token]` |

## Технический стек — saas-v1

| Слой | Технология | Где |
|---|---|---|
| Runtime | Bun | локально |
| Framework | Next.js 16 App Router + shadcn/ui | Vercel |
| Font | Inter (Google Fonts) | layout.tsx |
| ORM | Prisma 7 (adapter-pg) | — |
| Auth + DB | Supabase (itkzskhsjcfokvrdtjlv) | US |
| AI Provider (test) | NVIDIA NIM (meta/llama-3.3-70b-instruct) | `.env.local` |
| CI/CD | GitHub Actions | — |
| Repo | `harkly-saas` | `nospace/development/harkly/harkly-saas/` |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| prisma migrate dev зависает | 2026-03-08 | Использовать `DATABASE_URL=<DIRECT_URL> bunx prisma db execute --stdin` |
| Zero test coverage | 2026-03-08 | Нужна тестовая инфраструктура (critical debt) |
| SQL миграции E4 + E6 | 2026-03-08 | ⚠️ не применены в Supabase — блокирует backend features |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Полный roadmap saas-v1 | `.claude/plans/eager-juggling-flame.md` | ✅ |
| Opus business brief | `branches/saas-v1/opus_business_brief.md` | ✅ |
| Architecture Spec (Floor 0-5) | `branches/saas-v1/Harkly Architecture Spec.md` | ✅ |
| Methodology schools (5 schools) | `branches/saas-v1/methodology_schools_detailed.md` | ✅ |
| Спеки E0-E6 | `branches/saas-v1/specs/` | ✅ DoR 100% |
| Prisma schema | `harkly-saas/prisma/schema.prisma` | ✅ все модели (E0-E6) |
| E6 Share migration | `harkly-saas/prisma/migrations/e6_share.sql` | ⚠️ применить в Supabase |
| E4 Artifacts migration | `harkly-saas/prisma/migrations/e4_artifacts.sql` | ⚠️ применить в Supabase |
| Epics log | `harkly/memory/epics-log-harkly.md` | ✅ E0-E6 залогированы |

## Ключевые решения (session 10)

- **Inter font** — заменён Geist на Inter (axiom template дизайн-система)
- **Tailwind scale only** — убраны все `text-[Npx]` в canvas-компонентах, только `text-xs / text-sm / text-base`
- **gray-100 borders** — заменены `border-[#D9D9D9]` на `border-gray-100`
- **NVIDIA NIM** — `meta/llama-3.3-70b-instruct` как default agent (`custom` provider, OpenAI-compatible)
- **Omnibar** — подключён к `/app/[workspaceId]` (был built но не импортирован)
- **Floor architecture** — задокументирована в `handshake-harkly.md` (Floor 0-5, 5 методологических школ)
- **useAgents version: 2** — бамп для сброса старого localStorage при смене default provider
