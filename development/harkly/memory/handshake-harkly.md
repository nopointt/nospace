# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-01 by Assistant

---

## Где мы сейчас

**Pre-launch, GTM phase started.** Desktop MVP работает. Cold outreach стратегия определена: ниша H-06 (мобильные игры / Steam), data-first подход с silicon persona как gift в первом сообщении. Шаблоны и план готовы — нужен первый реальный анализ и отправка.

---

## Следующий приоритет

1. **Silicon Persona MD — разработать шаблон формата** — ключевой продукт для lead magnet. Что входит: behavioral profile, pain clusters, quotes, PMF questions. Без шаблона нельзя отправить gift.
2. **Первый тестовый анализ H-06** — выбрать 5 Steam-игр (Mixed рейтинг), вытащить отзывы через Steam JSON API, кластеризовать через Qwen CLI, записать главный инсайт.
3. **Отправить 15 outreach сообщений** — персонализированный шаблон D (с реальными кластерами + silicon persona), Twitter/TG фаундерам игровых студий.
4. **Созвон с CPO ProxyMarket** (HARKLY-03) — nopoint организует. Перед созвоном отправить product-brief-v2.md.

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Состояние проекта | development/harkly/memory/current-context-harkly.md |
| Конституция проекта | development/harkly/rules/harkly-constitution.md |
| Гипотезы ниш (10 штук) | development/harkly/branches/landing-coldoutreach/hypotheses.md |
| H-06 оффер + шаблоны | development/harkly/branches/landing-coldoutreach/mobile-games-offer.md |
| OSINT+CX исследование | development/harkly/branches/landing-coldoutreach/osint-cx-research.md |
| Product Brief (для CPO) | docs/harkly/product-brief-v2.md |

---

## Ключевые инсайты сессии (2026-03-01)

- **Silicon Persona** = portable MD файл синтетического клиента → кидается в любой LLM → PMF тестирование без юзер-интервью. Это и lead magnet, и самостоятельный продукт.
- **Data-first cold outreach** даёт 12–18% reply rate vs 3–5% generic (Belkins 2025, 16.5M emails)
- **Steam JSON API** полностью бесплатный: `store.steampowered.com/appreviews/{appid}?json=1`
- **hiQ v. LinkedIn** прецедент: публичный скрапинг юридически чист в США
- **Конкуренты**: Wonderflow $30K/год — mid-market окно ($1.5–3K/мес) свободно
- **Qwen CLI** работает как внешний агент для тяжёлых задач (исследования, анализ)

---

## Открытые вопросы

- [ ] Формат Silicon Persona MD — что входит? Как структурировать?
- [ ] Какую конкретно Steam-игру берём для первого демо-анализа?
- [ ] Silicon Persona — отдельный продукт или только lead magnet для Harkly?
- [ ] Web SaaS стек: Cloudflare Workers + D1 или PostgreSQL-RU?
- [ ] CPO ProxyMarket созвон — когда?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда. Не нужен полный episodic log для рутинной работы.
Формат: `[дата] что сделано | что следующее`

`[2026-03-01] OSINT research (Qwen), 10 ниш гипотез, H-06 оффер+шаблоны, silicon persona концепт | Silicon Persona MD шаблон + первый Steam анализ`
