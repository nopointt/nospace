# BRANCH SPEC — saas-v1
> Tags: [spec, branch, harkly, saas, nextjs, vercel]
> Создана: 2026-03-08
> Статус: 🟡 PLANNING — бизнес-логика и AC в проработке

---

## Task Classification

| Field | Value |
|---|---|
| **GAIA Level** | L2 |
| **Token Budget** | 30 000 токенов |
| **Topology** | Orchestrator-Workers (max 4) |
| **HITL Checkpoint** | Yes — перед деплоем на Vercel + YC |

---

## Definition of Ready (DoR)

```
☑ 1. GAIA Level назначен.
☑ 2. Token Budget зафиксирован.
☐ 3. Problem Statement написан — уточняется в сессии.
☐ 4. Acceptance Criteria — уточняются после обсуждения бизнес-логики.
☐ 5. Verification Gates — уточняются после AC.
☐ 6. Зависимости разрешены.
☐ 7. Секреты/токены выделены (YC, Supabase, Vercel).
☑ 8. Out of Scope определён (ниже).
☐ 9. HITL checkpoint определён точно.
```

---

## Problem Statement

Harkly — CX-исследовательская платформа. Текущий код: Rust Axum backend (cx-platform, G3 #1-5 ✅) + Next.js frontend (cx-platform-web) — неподнятые, недеплоенные, архитектурно устаревшие.

Цель ветки: построить production-ready SaaS на новом стеке (Bun + Next.js 14 App Router + Prisma + Yandex Cloud PG + Supabase + Vercel), задеплоить на публичный URL, закрыть Layer 1 продукта для первых клиентов.

---

## Стек (зафиксирован 2026-03-07)

| Слой | Технология | Хостинг |
|------|-----------|---------|
| Runtime | Bun | локально / Vercel |
| Framework | Next.js 14 App Router + Server Actions | Vercel |
| UI | shadcn/ui + Tailwind CSS | — |
| ORM | Prisma (2 datasource) | — |
| Auth + персданные (152-ФЗ) | Yandex Cloud Managed PostgreSQL (ru-central1) | YC |
| Analytics DB | Supabase | US |
| Python pipeline | Modal.com | US |
| CI/CD | GitHub Actions | — |

**152-ФЗ принцип:**
- Персданные (email, имя, профиль) → YC (ru-central1) ✅
- Аналитика (Steam reviews, отчёты) → Supabase — публичные данные ✅

**Стоимость до 100 клиентов:** ~700₽/мес (только YC PG) + домен ~1 200₽/год

---

## Scope

**In scope:**
- Next.js 14 App Router проект (новый, не адаптация cx-platform-web)
- Auth: register / login / session (JWT или NextAuth) → YC Managed PG
- Create Research: форма запуска анализа (appid + опциональные параметры)
- Dashboard: список исследований пользователя + статус
- Signals table: просмотр результатов анализа
- Prisma schema: users (YC) + research / signals (Supabase)
- Deploy: Vercel (фронт + API routes) + YC PG + Supabase
- GitHub Actions CI

**Out of scope:**
- Rust cx-platform backend (устарел, не используется в этой ветке)
- Electron desktop app
- Silicon Sampling (Layer 2) — отдельная ветка после
- Human Depth Interviews (Layer 3) — отдельная ветка после
- Платёжная интеграция (LemonSqueezy) — после первых клиентов
- Instagram / outreach — параллельный трек, не этот

---

## Бизнес-логика (🟡 в проработке)

> Этот раздел заполняется в ходе сессии с nopoint.
> Вопросы для обсуждения:

**Auth модель:**
- [ ] Как регистрируется пользователь? Email + password? Magic link?
- [ ] Роли: admin / user — нужны ли сейчас?
- [ ] Trialing / paid — различаем уже сейчас или все free?

**Research модель:**
- [ ] Что такое одно "исследование"? (appid + параметры → один job?)
- [ ] Статусы job: pending → running → done / failed?
- [ ] Где хранится результат: Supabase (signals) или файл?
- [ ] Ограничение: сколько исследований на пользователя?

**Pipeline интеграция:**
- [ ] Как Next.js запускает Python pipeline? (Modal webhook? Polling? Background job?)
- [ ] Синхронно или асинхронно?

**Первый клиент flow:**
- [ ] Пользователь регистрируется → вводит Steam appid → видит отчёт?
- [ ] Нужна ли верификация email?

---

## Architecture Notes

- **Новый проект:** `development/harkly/src/saas/` (не cx-platform-web)
- **Prisma multi-datasource:** `db_auth` (YC PG) + `db_analytics` (Supabase)
- **Server Actions** для мутаций (create research, auth) — не отдельный API backend
- **Route handlers** для webhooks (Modal callback)
- Старый Rust cx-platform — заморожен, не удаляется

---

## Dependencies

| Depends On | Type | Status |
|---|---|---|
| Yandex Cloud Managed PG | external | ⏳ нужно создать инстанс |
| Supabase проект | external | ⏳ нужно создать проект |
| Vercel аккаунт | external | ⏳ нужен логин |
| Modal.com аккаунт | external | ⏳ нужен логин |
| Domain (harkly.io / .com) | external | ⏳ не решено |

---

## Acceptance Criteria

> 🟡 Уточняются после обсуждения бизнес-логики

- [ ] TBD

---

## Verification Gates

> 🟡 Уточняются после AC

| Step | Gate Command / Condition | Expected Result |
|---|---|---|
| TBD | — | — |

---

## Definition of Done (DoD)

- [ ] Все Verification Gates: PASS
- [ ] Публичный URL доступен (Vercel)
- [ ] Auth работает (register + login + protected route)
- [ ] Create Research создаёт job в DB
- [ ] Dashboard показывает список исследований
- [ ] `commit-summary.md` написан
- [ ] `current-context-harkly.md` обновлён
