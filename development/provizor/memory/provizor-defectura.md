---
# provizor-defectura.md — APT-10 Дефектура и оборачиваемость
> Layer: L3 | Epic: APT-10 | Status: ✅ COMPLETE
> Created: 2026-04-04 (session 6)
> Last updated: 2026-04-05 (session 6 — ALL DONE: Дефектура + Оборачиваемость + Deploy)
> Research: DEEP-6 (metrics), DEEP-7 (turnover), DEEP-8 (cases)
---

## Goal

Добавить страницы "Дефектура" и "Оборачиваемость" в V2 dashboard + deploy. Dashboard = all-in-one сервис, каждый модуль = страница.

## Scope

### 1. Страница "Дефектура" в sidebar

Новая страница в V2 dashboard с mock-данными. По ресёрчу (DEEP-6, 7, 8):

**Hero-метрики (4 cards):**
- Defectura Rate % (F-21) — бенчмарк: Green < 3%, Yellow 3-7%, Red > 7%
- Упущенная выручка ₸ (F-22) — Lost Revenue = Σ(days_OOS × avg_daily_units × price)
- Fill Rate % (F-23) — цель 94-97% (верифицировано: экономически обоснованный компромисс)
- Recurrent Misses — кол-во SKU с 3+ пропусками за 30 дней

**Таблица журнала дефектуры:**
- Поля (из DEEP-0 + КЗ регуляция): дата, МНН + торговое наименование, аптека, кол-во запросов, источник (walk-in/phone/whatsapp/halyk/wolt), предложена замена (да/нет), статус (заказано/нет)
- Фильтры: аптека, период, категория, источник
- Pagination + CSV export

**"Рецидивисты" — топ SKU:**
- Таблица: SKU, кол-во пропусков за 30 дней, упущенная выручка, последний раз в наличии
- Сортировка по упущенной выручке (F-22)
- Визуальные флаги: красный = группа A (zero defectura неприемлема)

**Тренд-график:**
- Defectura Rate % по дням/неделям (line chart)
- Fill Rate % overlaid
- По аптекам или сеть целиком (pharmacy switcher работает)

**Insights/Рекомендации:**
- "43% покупателей уходят к конкуренту при дефектуре" (AMRA & ELMA, HIGH confidence)
- "Журнал дефектуры обязателен по закону КЗ (приказ КР ДСМ-15)"
- Actionable: "Аптека N — defectura rate X% (RED). Топ-3 позиции: ..."

### 2. Страница "Оборачиваемость" в sidebar

Отдельная страница рядом с дефектурой. По DEEP-7:

**Hero-метрики (4 cards):**
- DOI (дни запаса) — бенчмарк для КЗ: Green < 35, Yellow 35-55, Red > 55
- Inventory Turnover Ratio (раз/год) — бенчмарк: Green > 14×, Yellow 9-14×, Red < 9×
- Dead Stock % — бенчмарк: Green < 5%, Yellow 5-15%, Red > 15%
- GMROI — бенчмарк: Green > $3, Yellow $2-3, Red < $2

**Таблица по аптекам:**
- Аптека, DOI, ITR, Dead Stock %, Expiry Risk Value, GMROI
- RAG-индикаторы на каждой ячейке
- Сортировка по любой колонке

**ABC/XYZ матрица (визуальная):**
- 9 ячеек (AX, AY, AZ, BX, BY, BZ, CX, CY, CZ)
- Количество SKU и % выручки в каждой
- Цветовая кодировка: AX = зелёный (стабильный хит), CZ = красный (непредсказуемый хвост)

**Expiry risk:**
- Таблица: SKU, срок годности, остаток, стоимость, дней до просрочки
- Горизонты: 30/60/90 дней (как из DEEP-7)
- Суммарный Expiry Risk Value

### 3. Deploy V2 на Hetzner

- Static build через Caddy
- URL setup
- SSL certificate
- Smoke test

## Key Decisions

- D-01: Dashboard = all-in-one — каждый модуль = страница в sidebar
- D-02: Дефектура и Оборачиваемость = отдельные страницы (не sub-tabs)
- D-03: Mock-данные для демо, реальные данные после 1С интеграции (APT-03)
- D-04: Бенчмарки DOI для КЗ = 35 дней green (поправка на длинные lead times 7-21 дней)
- D-05: Журнал дефектуры обязателен по закону КЗ — это selling point для Алимхана

## Research Base

| File | Content | Lines |
|---|---|---|
| `provizor-deep-defectura-metrics.md` | DEEP-6: метрики, технологии, трекинг OOS | 580 |
| `provizor-deep-turnover-optimization.md` | DEEP-7: оборачиваемость, DOI, ABC/XYZ | 775 |
| `provizor-deep-defectura-cases.md` | DEEP-8: кейсы, логика, человеческий фактор | 597 |

**Key findings from research:**
- Журнал дефектуры обязателен по закону и в РФ (НАП 647н) и в КЗ (приказ КР ДСМ-15)
- 43% покупателей уходят к конкуренту при OOS (HIGH confidence, 2 независимых источника)
- 98.9% фармацевтов регулярно сталкиваются с дефектурой
- КЗ: ~50% дефектуры экономическая, 86% импорт = системный риск
- Лучший кейс СНГ: оборачиваемость 33→18 дней (-45%) через TOC
- Лучший глобал: Aversi 332 аптеки → +11% LFL, 98% SKU availability
- КЗ: публичных кейсов = 0 — мы первые
- Заведующая тратит 3-4 часа/день на ручные заказы
- DOI для КЗ: Green < 35 дней (vs 25 в US, поправка на lead times 7-21 дней)
- Safety stock с VEN: Vital → 99.5% SL, Essential → 97%, Normal → 94%

## Mock Data Requirements

**defectura_log mock (15-20 записей):**
- Разные аптеки (1-5), разные даты (последние 30 дней)
- Микс источников: walk-in 60%, phone 15%, whatsapp 15%, halyk 10%
- Микс категорий: анальгетики, антибиотики, кардио, диабет, витамины
- Некоторые с заменой предложенной, некоторые без

**turnover mock (per pharmacy):**
- DOI по каждой аптеке (из существующего PharmacyData.daysOfInventory)
- Dead stock %: 8-18% (реалистично для КЗ)
- Expiry risk: 5-10 SKU с истекающим через 30-90 дней

**ABC/XYZ mock:**
- Распределение существующих 15 SKU по матрице
- A (80% revenue): 3-4 SKU, B (15%): 4-5 SKU, C (5%): 6-7 SKU
- X (stable): 5 SKU, Y (variable): 6 SKU, Z (unpredictable): 4 SKU

## AC

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | Страница "Дефектура" в sidebar, 4 hero cards + таблица + рецидивисты + тренд | Screenshot |
| AC-2 | Страница "Оборачиваемость" в sidebar, 4 cards + таблица + ABC/XYZ + expiry | Screenshot |
| AC-3 | Pharmacy switcher работает на обеих страницах | Manual test |
| AC-4 | V2 задеплоен на Hetzner | `curl -s -o /dev/null -w "%{http_code}" https://URL` → 200 |
| AC-5 | Build passes, no TS errors | `npx vite build` → success |

## Blockers

- ✅ Нет — всё выполнено

## Completion Notes

- Deployed: https://provizor.contexter.cc
- Build: 593 modules, 510ms, 0 TS errors
- Дефектура: 4 defects found and fixed during Coach review
- Оборачиваемость: ABC/XYZ distribution corrected to 80/15/5
- All AC criteria met (AC-1 through AC-5)
