# HARKLY PROJECT CONSTITUTION
> Inherits from: `rules/global-constitution.md`
> Authority: nopoint (CEO). Architect approval required for amendments.
> Scope: all code and decisions under `development/harkly/`

---

## § 1 — Product Identity

**Harkly** — платформа CX Intelligence: автоматический сбор и анализ публичных отзывов из любых источников + предсказание реакции аудитории (silicon sampling).

**Core value proposition:**
- CX Analysis: сбор отзывов с публичных источников + NLP + Behavioral Taxonomy
- CX Prediction: silicon sampling — синтетические консьюмеры, калиброванные на реальных данных
- White-label B2B: агентства, бренды, enterprise — любой рынок, любой сегмент
- Без привязки к вертикали: анализируем любой CX где есть публичные отзывы

## § 2 — Web2 Exception (CEO Decision — 2026-02-23)

> **harkly является Web2 проектом** — явное исключение из `global-constitution.md § 2 Zero-Web2`.

Обоснование: harkly — B2B SaaS-продукт. Целевая аудитория (агентства, бренды) работает в традиционной Web2-среде. Web3-подход снизит UX и замедлит time-to-market.

Разрешенные Web2-паттерны в harkly:
- REST API (Express / Node.js)
- Centralized auth (Supabase Auth + JWT)
- Managed database (Supabase PostgreSQL)
- Managed queue (BullMQ + Upstash Redis)
- Managed hosting (Render.com)

## § 3 — Module Structure

```
development/harkly/
├── src/
│   ├── desktop/   — Electron MVP (основной рабочий код, TypeScript + React)
│   └── api/       — Web API модуль (Express + Supabase + BullMQ, следующий этап)
├── branches/      — Ветки разработки (spec → scratchpad → commit-summary)
├── rules/         — Этот файл
└── docs/          — Ссылка на /docs/harkly/
```

## § 4 — Tech Stack

| Layer | Desktop (current) | API (next) |
|---|---|---|
| Runtime | Electron + Node.js | Node.js (Docker) |
| Frontend | React + Vite + TailwindCSS | Next.js (TBD) |
| Scraping | Puppeteer + Stealth | Puppeteer + Stealth |
| Storage | JSON file-based | Supabase PostgreSQL |
| Queue | — | BullMQ + Upstash Redis |
| Auth | — | Supabase Auth + JWT |
| Deploy | Local | Render.com |

## § 5 — Execution Standards

- Код НЕ мутирует существующие объекты (immutable patterns)
- Файлы ≤ 800 строк, функции ≤ 50 строк
- Все парсеры изолированы — один файл, одна площадка
- Секреты только через `.env` — никаких хардкодов
- PR обязателен для слияния в `main` (агенты не пушат напрямую)

## § 6 — Data Sources Priority

| Source | Status | Complexity |
|---|---|---|
| Otzovik.ru | ✅ Working | Low |
| Irecommend.ru | ✅ Working | Low |
| Wildberries | ⏳ Planned | High |
| Ozon | ⏳ Planned | High |
| Яндекс.Маркет | ⏳ Planned | High |

## § 7 — Investor Context

Текущая стадия: **seed / MVP validation**
Целевые инвестиции: $3,000–5,000 (first round)
Модель возврата: процент от прибыли (equity-lite / revenue share)
Deliverable для инвестора: живой продукт + 3 UX/UI сценария + roadmap
