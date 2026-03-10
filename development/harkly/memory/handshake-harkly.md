# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-10 by Assistant

---

## Где мы сейчас

Лендинг задеплоен на **harkly-saas.vercel.app** и доступен без авторизации (middleware fix). Waitlist собирает Telegram @username + роль. Следующий шаг — G3 Backend Build (Стадия 5).

## Продуктовая архитектура (важно!)

**Floor Architecture (6 этажей):**
- Floor 0 — Scratchpad: глобальный холст, Omnibar, PICOT Framing Studio
- Floor 1 — Sources: коннекторы (Twitter, Reddit, upload), API keys
- Floor 2 — Raw: скрининг корпуса (Include/Exclude/Maybe)
- Floor 3 — Insights: NLP граф сущностей, тематики, цитаты
- Floor 4 — Artifacts: Empathy Map, Fact Pack, Journey Map, Evidence Map
- Floor 5 — Stakeholders: Presentation, Brief, Report

**5 методологических школ Harkly автоматизирует:**
- Academic/Cochrane–PRISMA: PICO-фрейм, скрининг, PRISMA-flow
- IDEO/Design Thinking: Empathy Map, Customer Journey, Personas
- McKinsey: Issue Tree, Fact Pack, Triangulation
- MIT AI Lab: Research Notebook, Weak Signals, граф связей
- Consumer Intelligence: агрегация OSINT-источников

---

## Следующий приоритет

1. **Стадия 5 — G3 Backend Build** — AI-провайдеры, frame/synthesis API, corpus ingestion
2. **SQL миграции E4 + E6** — применить в Supabase (блокируют backend features)
3. **Тестовая инфраструктура** — zero coverage, критический долг

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Текущий контекст проекта | `harkly/memory/current-context-harkly.md` |
| Архитектура спека (Floor 0-5) | `branches/saas-v1/Harkly Architecture Spec.md` |
| Лендинг (весь) | `harkly-saas/src/app/page.tsx` |
| Middleware (публичные роуты) | `harkly-saas/src/middleware.ts` |
| Prisma schema | `harkly-saas/prisma/schema.prisma` |
| Waitlist API | `harkly-saas/src/app/api/waitlist/route.ts` |
| Auth helper | `harkly-saas/src/lib/api-auth.ts` |

---

## Открытые вопросы

- [ ] Проверить glass card CTA в браузере (была синей, исправлено через `background: none`)
- [ ] Применить SQL миграции E4 + E6 в Supabase перед Backend Build
- [ ] Нужен ли кастомный домен для лендинга (сейчас vercel.app)?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-10 (s17)` Лендинг задеплоен: waitlist→telegram, middleware public routes, tsconfig GSAP fix, harkly-saas.vercel.app live. | следующее: Стадия 5 G3 Backend Build
`2026-03-09 (s16)` Gallery cards rewrite (outcome-focused, distinct angles), CTA glass redesign, AccentBtn glass, hero Urbanist, stats block removed. | следующее: деплой
`2026-03-09 (s14-15)` Landing page: dark navy theme, 3D cube hero, SocialProof GSAP Draggable, GhostScrollGallery 4-panel (300vh each). | следующее: gallery content
`2026-03-09 (s13)` April Dunford positioning brief + landing copy (RU) написаны. | следующее: Next.js реализация
`2026-03-09 (s11-12)` Research: LinkedIn Patchright scraper, Reddit JSON API, 100 sources → market-positioning-brief.md. | следующее: landing page
`2026-03-08 (s10)` Canvas workspace redesign: Inter, axiom дизайн-система, Floor architecture зафиксирована. | следующее: лендинг
