---
# provizor-roadmap.md — Provizor Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-04-05 (session 7 — pivot WhatsApp, APT-02 active, APT-16 paused, APT-17/18 added)
---

## Current Focus: APT-02 WhatsApp Bot MVP

**Scope:** WhatsApp Business API регистрация + бот-фармацевт (наличие, цены, аналоги, диагностика по симптомам, продажа) + клиентская база.

**First step:** Research — Meta docs, мед. тематика опыт, BSP-провайдеры, регистрация WhatsApp Business.

**Previous:** APT-10 (Дефектура + Оборачиваемость) ✅ COMPLETE — deployed at provizor.contexter.cc.
**Previous:** APT-13 (Unit Economics) ✅ COMPLETE — V2 built, 6 pages.
**Parked:** APT-16 (Finmodel Polish) — ⏸ PAUSED (2026-04-05, pivot to WhatsApp bot).
**Next after APT-02:** APT-03 (1С) → APT-04 (RAG) → APT-17 (Voice bot).

---

## Epics

### Meta

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **APT-01** | **Discovery — ресёрч, стек, архитектура, данные** | **🔶 IN PROGRESS** | `provizor-discovery.md` |

### Domain 1: WhatsApp-бот (Care as a Service)

> Telegram депрекейтед (2026-04-05). WhatsApp = единственная платформа.

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| **APT-02** | **WhatsApp Bot MVP — регистрация API, бот-фармацевт, клиентская база** | **🔶 IN PROGRESS** | `provizor-whatsapp-bot.md` | — |
| APT-03 | 1С интеграция — синхронизация ассортимента/цен/остатков, мультитенант (5 аптек) | ⬜ PLANNED | — | APT-02 |
| APT-04 | Pharma RAG + Triage — медбаза, трассировка, диагностика по симптомам, маршрутизация к врачу | ⬜ PLANNED | — | APT-02 |
| APT-05 | Казахский STT — голосовые на казахском (пенсионеры 20%) | ⬜ PLANNED | — | APT-02 |
| APT-06 | Orders & Payments — заказ в боте, Kaspi Pay, ручной курьер | ⬜ PLANNED | — | APT-03 |
| APT-07 | Auto Delivery — авто-вызов курьера | ⬜ PLANNED | — | APT-06 |
| APT-08 | Subscriptions — курсовые препараты, подгузники, проактивные уведомления | ⬜ PLANNED | — | APT-06 |
| APT-09 | Loyalty — бальная система лояльности | ⬜ PLANNED | — | APT-06 |
| **APT-17** | **Voice Bot (ElevenLabs) — голосовой ассистент для телефонных звонков** | ⬜ PLANNED | — | APT-02 |
| APT-18 | Интернет-магазин — каталог препаратов онлайн (задание Алимхана) | ⬜ PLANNED | — | APT-03 |

### Domain 2: Аналитика ассортимента

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| **APT-10** | **Дефектура и оборачиваемость — страницы в dashboard + deploy** | **✅ COMPLETE** | `provizor-defectura.md` | APT-13 |
| APT-11 | Inventory Revision — автоматизация ревизии факт/план (RFID/NFC ресёрч) | ⬜ PLANNED | — | APT-10 |

### Domain 3: Ценообразование

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-12 | Pricing Engine — мониторинг конкурентов (iTeka), госреестры, автоценообразование | ⬜ PLANNED | — | APT-03 |

### Domain 4: Unit-экономика

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-13 | Unit Economics — финмодель, P&L, маржа, кассовые разрывы | ✅ COMPLETE | `provizor-unit-economics.md` | — |
| APT-16 | Finmodel Polish — UX/UI/Code audit | ⏸ PAUSED | `provizor-finmodel-polish.md` | APT-10 |

### Кросс-доменные

| Epic | Description | Status | L3 File | Depends |
|---|---|---|---|---|
| APT-14 | Pharmacist Dashboard — бэк-офис: заказы, статусы, ассортимент, ревизия | ⬜ PLANNED | — | APT-03 |
| APT-15 | SaaS Productization — мультитенант, онбординг, подписка для других аптек | ⬜ PLANNED | — | APT-14 |

## Critical Path

```
APT-02 (NOW) → APT-03 → APT-04 → (APT-05, APT-06, APT-12, APT-17 параллельно)
                          APT-06 → (APT-07, APT-08, APT-09)
                          APT-03 → APT-18 (интернет-магазин, deferred)
                          APT-10 → APT-11
                          All → APT-14 → APT-15
                          APT-16 ⏸ PAUSED
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
