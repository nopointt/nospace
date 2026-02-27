# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии. Заменяет полный /startgsession для работы внутри проекта.
> Updated: 2026-02-27 by Assistant

---

## Где мы сейчас

**Pre-launch.** Desktop MVP работает. Docs готовы для CPO встречи.
Web-платформа SaaS — в разработке, target 1 апреля 2026.

---

## Следующий приоритет

1. **Созвон с CPO ProxyMarket** (HARKLY-03) — nopoint организует. Перед созвоном: отправить product-brief-v2.md.
2. **Web-платформа** (HARKLY-05) — нужно архитектурное решение по стеку и старт разработки.
3. **Silicon sampling** — эксперименты продолжаются. Следующий кейс: свой продукт или по запросу.

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Состояние проекта | development/harkly/memory/current-context-harkly.md |
| Product Brief (для партнёров) | docs/harkly/product-brief-v2.md |
| Финансовая модель | docs/harkly/economics/results.md |
| CPO звонок | docs/harkly/explanation/call-scenario-proxymarket.md |
| Partnership | docs/harkly/explanation/partnership-scenarios.md |
| Silicon sampling | docs/harkly/experiments/silicon_conses_1.md |
| Исходники desktop | development/harkly/src/desktop/ |

---

## Открытые вопросы

- [ ] Data residency: RU-юрисдикция vs Cloudflare — нужно юристы ProxyMarket
- [ ] Calibration data для Prediction Layer — уточнить на CPO звонке
- [ ] Web SaaS стек: Cloudflare Workers + D1 или PostgreSQL-RU?
- [ ] prd-horizon-1.md (Comet задача) — актуально или закрыто через product-brief-v2.md?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда. Не нужен полный episodic log для рутинной работы.
Формат: `[дата] что сделано | что следующее`
