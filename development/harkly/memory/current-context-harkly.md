---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-08 by Assistant (session 4)
---

## Project Phase

**PIVOT — saas-v1 активна.** Harkly сменил направление: больше не CX-платформа для Steam-игр, теперь — **desk research automation SaaS** для CX/UX/Research Ops профессионалов. Первичная аудитория: RU + СНГ (домен harkly.ru). Технический стек зафиксирован. Ведётся подготовка к запуску Opus для business design.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-11 | **saas-v1** — desk research automation SaaS | **🔥 active** — Research Foundation (Стадия 0): enemy.md написан, hero.md требует веб-исследования | Sonnet + nopoint |
| HARKLY-06 | Cold outreach Steam indie games | **⏸ on-hold** — 12 email-вариантов готовы, Brevo не настроен, warmup не начат | nopoint |
| HARKLY-08 | Instagram — контент и аккаунт | **in-progress** — аудитория и воронка решены | nopoint |
| HARKLY-05 | cx-platform Layer 1 (Steam/CX) | **⏸ archived** — код на GitHub, не деплоен, приоритет снят | — |
| HARKLY-03 | ProxyMarket partnership | **on-hold** — юр. блокер | nopoint |

## saas-v1 — Дорожная карта (6 стадий)

| Стадия | Название | Статус |
|---|---|---|
| 0 | Research Foundation | **🔥 в процессе** — enemy.md ✅ (домен-знания), hero.md ❌ нужно веб-исследование |
| 1 | Business Design (Opus) | **🔒 после Стадии 0** — промпт готов, нужно добавить hero/enemy/competitives |
| 2 | Spec Lock | 🔒 после Стадии 1 |
| 3 | Product Design | 🔒 после Стадии 1 |
| 4 | Infrastructure Setup | ⏳ nopoint делает параллельно |
| 5 | MVP Build (G3) | 🔒 после Стадии 3+4 |
| 6 | Beta Launch | 🔒 после Стадии 5 |

## Product State — saas-v1

| Компонент | Статус | Заметки |
|---|---|---|
| Spine-процесс (гипотеза) | ✅ задокументирован | Framing → Planning → Ingestion → Extraction → Synthesis → Notebook. Opus может изменить. |
| Layer 1 архитектура | ✅ задокументирована | 6 модулей: Framing Studio, Source Planner, Corpus Ingest, Evidence Extractor, Insight Canvas, Signals & Notebook |
| enemy.md | ⚠️ v0 из домен-знания | Написан структурно. Требует веб-исследования (50+ страниц) для валидации |
| hero.md | ❌ не написан | Нужно веб-исследование (r/UXResearch, surveys, LinkedIn) → ICP Card формат |
| opus_business_brief_prompt.md | ⚠️ требует обновления | Стек обновлён ✅. Нужно добавить в список чтения: hero.md + enemy.md + competitives.md + инструкция "spine = гипотеза" |
| competitives.md | ✅ готов | Детальный teardown 6 кластеров конкурентов. Добавить в Opus. |
| Opus business brief (результат) | ❌ | После Стадии 0 + обновления промпта |
| Инфраструктура | ❌ | Vercel / YC PG / Supabase / Modal — аккаунты не настроены |

## Технический стек — saas-v1 (финальный)

| Слой | Технология |
|---|---|
| Runtime | Bun |
| Framework | Next.js 14 App Router + shadcn/ui |
| ORM | Prisma (2 datasource: YC PG + Supabase) |
| Auth + PII (152-ФЗ) | Yandex Cloud Managed PG (ru-central1) |
| Analytics DB | Supabase (публичные данные) |
| Deploy | Vercel |
| Python pipeline | Modal.com |
| Парсинг fallback | ZenRows |
| Домен | harkly.ru |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| hero.md — нет веб-исследования | 2026-03-08 | Запустить агент в новой сессии. Писать из веб-данных (r/UXResearch, surveys). Сохранить в файл напрямую. |
| enemy.md — только домен-знание | 2026-03-08 | Агент остановлен из-за лимитов контекста. Перезапустить → agent должен ПИСАТЬ в файл, не возвращать в контекст |
| opus_business_brief_prompt.md не обновлён | 2026-03-08 | Добавить: hero.md, enemy.md, competitives.md + spine-инструкцию |
| Инфраструктура не настроена | 2026-03-08 | nopoint: создать аккаунты Vercel / YC / Supabase / Modal |
| Email sender не настроен (HARKLY-06) | 2026-03-07 | Brevo: SPF/DKIM/DMARC + domain warmup 3 нед. |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Полный roadmap saas-v1 | `.claude/plans/eager-juggling-flame.md` | ✅ 6 стадий задокументированы |
| Layer 1 архитектура | `branches/saas-v1/harkly_layer1_architecture.md` | ✅ |
| 5 методологических школ | `branches/saas-v1/methodology_schools_detailed.md` | ✅ |
| Jobs matrix | `branches/saas-v1/jobs_matrix_automation.md` | ✅ |
| Конкурентный teardown | `branches/saas-v1/competitives.md` | ✅ → добавить в Opus |
| Opus business brief промпт | `branches/saas-v1/opus_business_brief_prompt.md` | ⚠️ нужно обновить |
| UI brief (черновик) | `branches/saas-v1/harkly_ui_brief.md` | ✅ |
| Enemy Statement v0 | `branches/saas-v1/enemy.md` | ⚠️ v0 из домен-знания |
| Branch spec | `branches/saas-v1/spec.md` | ⚠️ AC пусто |
| Cold Outreach Strategy | `branches/cx_osint_pipeline/outreach_strategy.md` | ✅ Draft |

## Ключевые решения этой сессии (2026-03-08)

- **Продуктовый пивот** подтверждён и задокументирован: Harkly = desk research automation SaaS
- **Домен**: harkly.ru — первичная аудитория RU + СНГ
- **Враг переопределён**: не "парадигма опросов", а **фрагментация workflow** (4-8 несвязанных инструментов)
- **hero/enemy формат**: ICP Card + Enemy Statement. Источник: реальное веб-исследование
- **Spine = гипотеза**: Opus может предложить улучшения
- **Opus запуск**: через Claude Code (`claude --model claude-opus-4-6`) + Read tool для файлов
- **Продуктовое видение синхронизировано** с nopoint
