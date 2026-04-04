---
# provizor-roadmap.md — Provizor Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-04-04 (session 231 — epics prioritized via ICE)
---

## Current Focus: Unit Economics (APT-13)

**Scope:** Финмодель аптечной сети Алимхана. Выручка, себестоимость, расходы, маржа, кассовые разрывы. Фундамент для всех остальных решений.

**Prioritization:** ICE framework. APT-13 (648) → APT-01 (392) → APT-02 (180).
**Rationale:** Данные есть, код не нужен, результат даёт базу для ценообразования, ассортимента, SaaS pricing.

---

## Epics

### Meta

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **APT-01** | **Discovery — ресёрч, стек, архитектура, данные** | **🔶 IN PROGRESS** | `provizor-discovery.md` |

### Domain 1: Telegram-бот (Care as a Service)

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-02 | Bot MVP — ассортимент, цены, наличие, conversational UX | ⬜ PLANNED | — | APT-01 |
| APT-03 | 1С интеграция — синхронизация ассортимента/цен/остатков, мультитенант (5 аптек) | ⬜ PLANNED | — | APT-02 |
| APT-04 | Pharma RAG + Triage — медбаза, трассировка, анализы клиента, маршрутизация к врачу | ⬜ PLANNED | — | APT-02 |
| APT-05 | Казахский STT — голосовые на казахском (пенсионеры 20%) | ⬜ PLANNED | — | APT-02 |
| APT-06 | Orders & Payments — заказ в боте, Kaspi Pay, ручной курьер | ⬜ PLANNED | — | APT-03 |
| APT-07 | Auto Delivery — авто-вызов курьера | ⬜ PLANNED | — | APT-06 |
| APT-08 | Subscriptions — курсовые препараты, подгузники, проактивные уведомления | ⬜ PLANNED | — | APT-06 |
| APT-09 | Loyalty — бальная система лояльности | ⬜ PLANNED | — | APT-06 |

### Domain 2: Аналитика ассортимента

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-10 | Assortment Analytics MVP — дефектура, упущенная прибыль, оборачиваемость, сроки годности | ⬜ PLANNED | — | APT-03 |
| APT-11 | Inventory Revision — автоматизация ревизии факт/план (RFID/NFC ресёрч) | ⬜ PLANNED | — | APT-10 |

### Domain 3: Ценообразование

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-12 | Pricing Engine — мониторинг конкурентов (iTeka), госреестры, автоценообразование | ⬜ PLANNED | — | APT-03 |

### Domain 4: Unit-экономика

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| **APT-13** | **Unit Economics — финмодель, P&L, маржа, кассовые разрывы** | **🔶 IN PROGRESS** | `provizor-unit-economics.md` | — (данные от Алимхана) |

### Кросс-доменные

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-14 | Pharmacist Dashboard — бэк-офис: заказы, статусы, ассортимент, ревизия | ⬜ PLANNED | — | APT-03 |
| APT-15 | SaaS Productization — мультитенант, онбординг, подписка для других аптек | ⬜ PLANNED | — | APT-14 |

## Critical Path

```
APT-13 (NOW) → APT-01 → APT-02 → APT-03 → (APT-04, APT-05, APT-06, APT-10, APT-12, APT-14 параллельно)
                                              APT-06 → (APT-07, APT-08, APT-09)
                                              APT-10 → APT-11
                                              All → APT-15
```

## Prod Roadmap

| Phase | Epics | Status |
|---|---|---|
| Discovery | APT-01 | 🔶 IN PROGRESS |
| Bot MVP | APT-02, APT-03 | ⬜ PLANNED |
| Intelligence | APT-04, APT-05, APT-10, APT-12 | ⬜ PLANNED |
| Commerce | APT-06, APT-13, APT-14 | ⬜ PLANNED |
| Growth | APT-07, APT-08, APT-09, APT-11 | ⬜ PLANNED |
| Scale | APT-15 | ⬜ PLANNED |
