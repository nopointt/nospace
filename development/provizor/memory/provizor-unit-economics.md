---
# provizor-unit-economics.md — APT-13 Unit Economics
> Layer: L3 | Epic: APT-13 | Status: 🔶 IN PROGRESS
> Created: 2026-04-04 (session 231)
> Last updated: 2026-04-04 (session 5 — V2 full build, 16 tasks, date range picker, closeaxis safety rules)
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
- [x] DEEP-4: UX Review Analysis (12 reviews, 30+ sources, pain taxonomy) → `provizor-deep-ux-reviews.md`
- [x] DEEP-5: Global Unit Economics Services (top 10, positioning matrix) → `provizor-deep-global-unit-economics.md`
- [x] SmartApteka 2025 presentation analyzed (28 slides, all modules mapped)

### Phase 1: Build Demo ✅ BUILT (V2 complete, pending deploy)

V1 (DEPRECATED): `apps/demo/` — light theme, 15 files
V2 (ОСНОВНОЙ): `apps/v2/` — dark navy theme, 17 source files, 2537 lines, 516ms build

4 секции:
- [x] Hero: CIS Profitability % (F-18) + таблица turnover→profitability
- [x] P&L Calculator (F-01..F-08) + waterfall chart + RAG indicators
- [x] KZ Markup Checker (F-17) + регрессивная шкала + сценарии блендированной маржи (F-39)
- [x] Channel Margin Comparison (F-27..F-30) + unprofitable channel flag
- [x] Roadmap page — 6 фаз, визуальный для не-технического партнёра

Инфра:
- [x] `formulas.ts` — pure functions F-01..F-18, F-17, F-27..F-30, F-39
- [x] `benchmarks.ts` — RAG thresholds из DEEP-0 section 6E
- [x] `format.ts` + `chart-helpers.ts` — formatting utilities
- [x] Предзаполнение бенчмарками (Алматы avg 17.5M₸/мес)
- [x] V2 full build: 6 pages, 9 metric cards, charts, summaries, CSV export
- [x] Date range picker (6 presets), pharmacy switcher, action menus
- [x] Horizontal scroll, pagination, column customize
- [ ] Visual review + polish с nopoint
- [ ] Deploy на Hetzner (static через Caddy)
- [ ] Custom date range input (пока placeholder)

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

## Key Research Findings (DEEP-4: UX Reviews + DEEP-5: Global)

- **Confirmed white spaces (0 of 7 competitors):** multichannel margin, CIS Profitability, per-SKU channel profitability
- **Top pain:** техподдержка не отвечает → касса встаёт (Опора, SmartApteka). Lock-in (не дают данные).
- **Analytics gap:** руководители не видят данных, нет дефектуры, скидки незаметно съедают маржу (30%→26%)
- **Hidden losses:** 4,755 партий без сроков на 13M₽, дефектура = 43% уходят к конкуренту
- **What works:** автозаказ, real-time KPI (+20% чек), облако, быстрый перевод
- **Anti-patterns:** lock-in, 1С yellow UI, ТП 9-18, лишние шаги
- **Global positioning:** Provizor = GrowthFactor mindset + TrueProfit UX + pharmacy domain + KZ regulatory
- **TrueProfit = UI reference:** dark theme, sidebar, metric cards with deltas, combo charts, P&L by period, product analytics table
- **SmartApteka analyzed (28 slides):** ERP для операций, не analytics. Windows desktop, 1С-style. Наш уровень = dashboard для владельца.

## V2 Decision

V1 (`apps/demo/`) остаётся как есть. V2 = новый проект from scratch, TrueProfit-inspired.
Reference: `STATE.md` → V2 Direction section (полная спека + пути к скринам).

## Blockers

- ✅ V2 build — completed (session 5)
- Deploy на Hetzner
- ✅ Tight deadline (встреча Алимхан) — V2 ready

## AC

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | SEED ресёрч завершён, файл в docs/research/ | File exists |
| AC-2 | DEEP ресёрч завершён, формулы определены | File exists |
| AC-3 | Сервис задеплоен на Hetzner | URL accessible |
| AC-4 | UI показывает P&L, маржу, ключевые метрики | Screenshot |
| AC-5 | Roadmap в визуальном формате | File exists |
