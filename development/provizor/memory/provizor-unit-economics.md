---
# provizor-unit-economics.md — APT-13 Unit Economics
> Layer: L3 | Epic: APT-13 | Status: 🔶 IN PROGRESS
> Created: 2026-04-04 (session 231)
> Last updated: 2026-04-04 (session 231 — research complete, ready for Phase 0 build)
> Deadline: 2026-04-05 (встреча с Алимханом)
---

## Goal

Построить финмодель аптечной сети. Внутренний сервис (не Google Sheets) — фундамент для будущей админки. Показать Алимхану на встрече 05.04.

## Deliverables для встречи

1. **Unit Economics сервис** — веб-интерфейс с расчётами, таблицами, графиками
2. **Roadmap проекта** — визуальный, понятный для не-технического партнёра
3. **Telegram-бот MVP** (если успеем) — минимальный бот, conversational UX

## Key Decisions

- D-01: Внутренний сервис, не Google Sheets — Claude делает юнит-экономику, не nopoint вручную
- D-02: Сервис = фундамент будущей админки (Pharmacist Dashboard, APT-14)
- D-03: Недостающие данные — из ресёрча (бенчмарки по аптечному рынку КЗ)
- D-04: Стек = React 19 + TailAdmin + Recharts (ecosystem advantage для dashboard)
- D-05: Hero metric = CIS Profitability % (F-18), не Gross Margin
- D-06: Мультиканальная маржа = confirmed white space (0 из 6 конкурентов)

## Known Data (per ONE pharmacy)

| Метрика | Значение | Источник |
|---|---|---|
| Оффлайн трафик | 200 входящих/день → 70-150 продаж | nopoint |
| Halyk Market | ~43 продажи/день (~960/мес) | nopoint |
| Wolt Apteka | ? | нет данных |
| iTeka WhatsApp | ~30 обращений/день | nopoint |
| Наценка | +30% к себестоимости | nopoint |
| Ассортимент | 6-7К позиций | nopoint |
| Аптек в сети | 5 | nopoint |
| Работает | ~3 года | nopoint |
| Ревизия | раз в месяц, вручную | nopoint |
| Динамика цен | ~раз в неделю | nopoint |
| Себестоимость волатильность | 100-500 тенге | nopoint |
| Сроки годности | 6 мес — 2 года | nopoint |

## Missing Data (from research)

- Средний чек аптеки в КЗ
- Типичная структура расходов аптеки (аренда, ЗП, коммуналка)
- Комиссии агрегаторов (Halyk Market, Wolt)
- Типичный % списаний (просрочка + воровство)
- Оборачиваемость склада (benchmark)
- Конверсия обращений в продажи (iTeka WhatsApp)
- Средняя зарплата фармацевта в КЗ
- Аренда аптечного помещения в КЗ

## Phases

### Phase 0: Research ✅ COMPLETE

- [x] SEED 1: Frameworks, Metrics & Formulas → `provizor-seed-ue-frameworks.md`
- [x] SEED 2: Analytics Tools & Ready Models → `provizor-seed-analytics-tools.md`
- [x] SEED 3: Business Logic & Decision-Making → `provizor-seed-business-logic.md`
- [x] DEEP-0: Complete Formula Model (40 формул, 12 таблиц PG, UI hierarchy) → `provizor-deep-ue-model.md`
- [x] DEEP-1: KZ Price Regulation Impact Modeling → `provizor-deep-kz-regulation.md`
- [x] DEEP-3: Competitive Audit (InfoApteka_Prof + SmartApteka) → `provizor-deep-competitive-audit.md`

### Phase 1: Build Demo (NEXT — for 2026-04-05 meeting)

Стек: React 19 + Vite + Tailwind CSS 4 + TailAdmin + Recharts. Статический SPA, без бэкенда.

4 секции:
- [ ] Hero: CIS Profitability % (F-18) + таблица turnover→profitability
- [ ] P&L Calculator (F-01..F-08) + waterfall chart + RAG indicators
- [ ] KZ Markup Checker (F-17) + регрессивная шкала + сценарии блендированной маржи (F-39)
- [ ] Channel Margin Comparison (F-27..F-30) + unprofitable SKU flag

Инфра:
- [ ] `formulas.ts` — pure functions F-01..F-18, F-17, F-27..F-30, F-39
- [ ] `benchmarks.ts` — RAG thresholds из DEEP-0 section 6E
- [ ] Предзаполнение бенчмарками (Алматы avg 17.5M₸/мес)
- [ ] Deploy на Hetzner (static через Caddy)

### Phase 2: Production MVP (2-4 weeks after meeting)

- [ ] PostgreSQL schema (12 таблиц из DEEP-0 section 6C)
- [ ] Hono API backend
- [ ] Manual CSV import из 1С
- [ ] Dashboard: Level 0 + Level 1 (hero + 7 cards + alerts)
- [ ] Per-pharmacy comparison table

### Phase 3: Full Product (4-8 weeks)

- [ ] 1С OData live sync (hourly)
- [ ] ABC/XYZ classification engine
- [ ] Defectura log
- [ ] Channel margin analysis (SKU-level)
- [ ] Expiry risk alerts

### Phase 4: Telegram Bot MVP

- [ ] Минимальный бот — conversational UX, знает ассортимент
- [ ] Интеграция с данными сервиса

## Blockers

- Нет точных данных по расходам (аренда, ЗП) — ресёрч бенчмарки
- Стек сервиса не определён
- Tight deadline (1 день)

## AC

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | SEED ресёрч завершён, файл в docs/research/ | File exists |
| AC-2 | DEEP ресёрч завершён, формулы определены | File exists |
| AC-3 | Сервис задеплоен на Hetzner | URL accessible |
| AC-4 | UI показывает P&L, маржу, ключевые метрики | Screenshot |
| AC-5 | Roadmap в визуальном формате | File exists |
