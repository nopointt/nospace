---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-08 by Assistant (session 6)
---

## Project Phase

**Стадия 3 — G3 Frontend Build ЗАВЕРШЕНА.** Все эпики Layer 1 (E0→E6) реализованы.
Следующий шаг: **Стадия 4 — Tech Debt Analysis** + применить SQL миграции в Supabase.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
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
| 4 | Tech Debt Analysis | 🔥 следующий |
| 5 | G3 Backend Build | 🔒 после Стадий 3+4 |
| 6 | Manual Testing + Beta | 🔒 |

## Product State — saas-v1 Frontend

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
| ORM | Prisma 7 (adapter-pg) | — |
| Auth + DB | Supabase (itkzskhsjcfokvrdtjlv) | US |
| CI/CD | GitHub Actions | — |
| Repo | `harkly-saas` | `nospace/development/harkly/harkly-saas/` |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| SQL миграция E3 не применена | 2026-03-08 | Supabase Dashboard → SQL Editor: `ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS extraction_total INTEGER NOT NULL DEFAULT 0, extraction_done INTEGER NOT NULL DEFAULT 0; ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_processed BOOLEAN NOT NULL DEFAULT false; ALTER TABLE extractions ADD COLUMN IF NOT EXISTS annotation TEXT;` |
| SQL миграция E4 не применена | 2026-03-08 | Supabase Dashboard → SQL Editor: `prisma/migrations/e4_artifacts.sql` |
| SQL миграция E6 не применена | 2026-03-08 | Supabase Dashboard → SQL Editor: `prisma/migrations/e6_share.sql` |
| prisma migrate dev зависает | 2026-03-08 | Использовать `prisma db push` с DIRECT_URL или SQL напрямую |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Полный roadmap saas-v1 | `.claude/plans/eager-juggling-flame.md` | ✅ |
| Opus business brief | `branches/saas-v1/opus_business_brief.md` | ✅ |
| Спеки E0-E6 | `branches/saas-v1/specs/` | ✅ DoR 100% |
| Prisma schema | `harkly-saas/prisma/schema.prisma` | ✅ все модели (E0-E6) |
| Seed data | `harkly-saas/prisma/seed.ts` | ✅ 12 corpus + 40 extractions + 3 artifacts + 5 notes + 1 sharelink |
| E6 Share migration | `harkly-saas/prisma/migrations/e6_share.sql` | ⚠️ применить в Supabase |
| E4 Artifacts migration | `harkly-saas/prisma/migrations/e4_artifacts.sql` | ⚠️ применить в Supabase |
| Epics log | `harkly/memory/epics-log-harkly.md` | ✅ E0-E6 залогированы |
| Token Counter | `nospace/tools/token-counter/count.ts` | ✅ |

## Ключевые решения (session 6)

- **Все эпики E0-E6 завершены** — Стадия 3 закрыта
- **fflate** для ZIP export (in-memory, no temp files)
- **Public /share/[token]** — вне `/app/*`, middleware не трогает
- **Parallel subagent pattern** — 2 Qwen одновременно работает стабильно на всех эпиках
