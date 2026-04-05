# Contexter — Co-Founder Briefing

> Для: Артём (GTM & Marketing)
> Дата: 2026-04-05
> Автор: nopoint (founder, product & engineering)
> Статус продукта: **Production-ready, 0 маркетинга**

## Как пользоваться этим пакетом

Этот briefing — часть пакета из 28 файлов. Полный индекс: [INDEX.md](https://cdn.contexter.cc/public/artem/INDEX.md)

Все файлы доступны по прямым ссылкам:
```
https://cdn.contexter.cc/public/artem/{filename}.md
```

Например:
- https://cdn.contexter.cc/public/artem/contexter-financial-model.md
- https://cdn.contexter.cc/public/artem/contexter-gtm-market-landscape.md
- https://cdn.contexter.cc/public/artem/contexter-gtm-v2-nontechnical-pain.md

Можно скормить любой файл в ChatGPT/Claude по ссылке для глубокого анализа.

---

## 1. Что такое Contexter

**Contexter = постоянная память для всех твоих AI.**

Загрузи любой файл (PDF, DOCX, аудио, видео — 23 формата) → Contexter разбирает, индексирует, хранит → все твои AI (ChatGPT, Claude, Cursor, Perplexity и др.) получают доступ к этим знаниям через единое подключение.

**Проблема, которую решаем:** Сегодня каждый AI-чат начинается с нуля. Люди вручную копируют контекст из чата в чат, теряют месяцы накопленных знаний при сбоях, не могут использовать одну базу знаний в разных AI-инструментах.

**Как работает:**
```
Файл → загрузка → парсинг → индексация → API/MCP endpoint
                                              ↓
                              ChatGPT / Claude / Cursor / любой AI
```

**Демо-видео:** https://cdn.contexter.cc/public/contexter-screencast.mp4

---

## 2. Рыночная возможность

### Размер рынка

| Метрика | Значение |
|---|---|
| TAM (RAG market 2026) | $2.76–3.33B |
| SAM (managed RAG APIs) | $400–800M |
| SOM (реалистичный) | $20–50M |
| CAGR | 38–49% до 2030 |

### Почему сейчас

- **MCP стал стандартом.** 17K+ серверов, 97M+ загрузок SDK/мес (март 2026). Рост 80x за 5 месяцев.
- **Категория активируется.** Anthropic и Google одновременно выпустили инструменты импорта памяти (март 2026). Mem0 поднял $24M (ноябрь 2025).
- **Консолидация началась.** Carbon AI закрывается, Trieve куплен Mintlify, Nuclia куплена Progress Software за $50M. Окно для новых игроков сужается — **12–18 месяцев** максимум.

### Сигналы спроса

- ChatGPT memory wipe (февраль 2025) — 300+ тредов жалоб, grief language
- Пользователи описывают потерю контекста как **потерю близкого человека**: *"It feels like losing a beloved relative"*, *"Two years worth of memories gone"*
- Cursor/Claude пользователи тратят **15–30 минут в день** на повторное объяснение контекста AI

---

## 3. Конкурентный ландшафт

### Прямые конкуренты (RAG-as-a-Service)

| Продукт | Funding | Цена | Слабость vs Contexter |
|---|---|---|---|
| **Ragie** | $5.5M seed | $100–500/мес | Cloud-only, $250/коннектор, 20x дороже |
| **Supermemory** | $3M seed | $0–399/мес | Silent retrieval failures, fake open-source (MIT но self-host = enterprise agreement) |
| **Graphlit** | $3.56M | $49–999/мес | 0 независимых отзывов, opaque pricing |
| **Morphik** (YC X25) | ~$500K | $59–799/мес | Нужен GPU для self-host, команда 2 человека |
| **Vectorize** | $3.6M | $99–399/мес | Нет аудио/видео, "barebone UI" (G2) |
| **Langbase** | неизв. | $100–250/мес | 50 MB cap на $250/мес (!), ~6 форматов, нет аудио/видео |
| **Vectara** | $73.5M | Enterprise | Только enterprise, без developer tier |

### Косвенные конкуренты

- **AI-чаты** (ChatGPT, Claude, Gemini) — walled garden, нет API, нет persistence
- **Workspace AI** (Notion AI, Obsidian) — locked в свою экосистему
- **Enterprise Search** (Glean — $7.2B valuation) — $10–30/user/мес, enterprise sales cycle
- **DIY RAG** (LangChain + Pinecone + ...) — 7 компонентов собирать самому

### Главный конкурент — **copy-paste**

~95% людей, использующих AI сегодня, вручную копируют контекст. Это привычка, которую мы заменяем.

---

## 4. White Space — почему Contexter выигрывает

**Структурный белый квадрант: "работает со всеми AI + понятен не-разработчикам" = пусто.**

| Преимущество | Детали |
|---|---|
| **Self-hosted** | Единственный продукт, где self-hosting = основной режим. Все конкуренты — cloud-only. |
| **Фиксированная цена** | €7.72/мес за сервер. Конкуренты: токены × страницы × коннекторы = непредсказуемые счета. |
| **23 формата** | Включая аудио и видео. Langbase: ~6 форматов. Vectorize: нет аудио/видео. |
| **MCP-native** | Одно подключение = все AI-клиенты видят твои документы. |
| **Data sovereignty** | Данные на твоём сервере. GDPR, healthcare, air-gapped — автоматически. |
| **20x дешевле Ragie** | Функционально идентичный продукт, $5/мес vs $100/мес. |

**Позиционирование:** *"One memory. Every AI."* — контекст-хранилище, которое ты контролируешь.

---

## 5. Боли пользователей (реальные цитаты)

### Категория A: Потеря памяти AI (самая эмоциональная)

> *"Two years worth of memories gone. Only an empty memories box."* — OpenAI Forum, Plus subscriber

> *"It feels like losing a beloved relative, as they were a part of the customs through my saved memories."* — OpenAI Forum

> *"I've lost a year and a half of memories... feels more like Memento."* — OpenAI Forum

### Категория B: Фрагментация между инструментами

> *"I explain my architecture to Cursor in the morning and in the afternoon, I have to explain it all again."* — Cursor Forum

> *"We plan out a whole feature, then I come back a week later and have no record of what we decided."* — Cursor Forum

### Категория C: Безмолвная потеря данных

> *"After a few weeks of adding information to ChatGPT memory, it just cleared on its own."* — OpenAI Forum

**Вывод:** Боль категории A (потеря накопленного контекста) вызывает grief language и готовность платить. Это наш главный messaging hook.

---

## 6. Финансовая модель

### Unit Economics

| Метрика | Значение |
|---|---|
| Инфраструктура | €7.72/мес (Hetzner CAX21) |
| Break-even (месячный) | Месяц 3 |
| Cash positive (накопительно) | Месяц 4 ($858) |
| Max cash deficit | ~$971 (месяц 2) |
| Gross margin | 68.5% |
| ARPU (платящий) | $22.54 |
| LTV (12 мес) | $270.48 |
| CAC | $0 (organic) |

### Рост (10K пользователей, 40% conversion)

| Метрика | Значение |
|---|---|
| MRR | $90,168 |
| ARR | $1,082,021 |
| EBITDA margin | 67.7% |
| Годовой cash | $212,715 |

### Сценарии

| Сценарий | Conversion | MRR |
|---|---|---|
| Base (10K users, 40%) | 4,000 платящих | $90K |
| Conservative (20%) | 2,000 платящих | $45K — всё ещё profitable |
| Ambitious (50K users) | 20,000 платящих | $450K |

**Ключевое:** Капитально-эффективный бизнес. Максимальные инвестиции до прибыльности — менее $1,000. Внешнее финансирование не требуется.

---

## 7. Pricing

| План | Цена | Что входит |
|---|---|---|
| **Free** | $0 | Ограниченные загрузки и запросы |
| **Starter** | $9/мес | Расширенные лимиты |
| **Pro** | $29/мес | Полный доступ |

**Первая цель: 100 Founding Supporters × $10** = $1,000. Framing: "Founding Supporter" (не donation), счётчик "X/100 spots".

---

## 8. Текущее состояние продукта

### Что готово

- API: production, Hetzner Helsinki, все системы healthy
- Frontend: https://contexter.cc (SolidJS SPA, CF Pages)
- Auth: email + password + Google OAuth
- Pipeline: 23 формата, парсинг, индексация, поиск
- MCP: 12 tools, Streamable HTTP, работает в Claude, ChatGPT, Cursor, Perplexity
- Security: rate limiting, content filter, circuit breakers, CORS, HTTPS
- Legal: Privacy Policy + Terms of Service (English, GDPR)
- Monitoring: Netdata + health checks + Telegram alerts
- Backups: daily PG dump → R2, WAL archiving (5 min RPO)

### Метрики

| Метрика | Значение |
|---|---|
| Реальных юзеров | 2 |
| Документов | 26 |
| MCP search p50 | 110ms |
| GitHub | github.com/nopointt/contexter |

### Что НЕ готово (блокеры GTM)

- **Copy audit:** 50+ случаев технического жаргона на лендинге (убивает конверсию non-tech)
- **LemonSqueezy:** одобрение pending (без этого — только крипта, -93% конверсии)
- **Social accounts:** 0 аккаунтов, 0 присутствие
- **Reddit:** u/Cute_Baseball2875, karma=1, нужен warmup
- **Analytics:** не установлена (Plausible/Umami)
- **OG теги:** нет social preview

---

## 9. GTM Plan — что нужно сделать

### Каналы (приоритет)

| # | Канал | Потенциал | Почему |
|---|---|---|---|
| 1 | **Hacker News** (Show HN) | 10–30K визитов, 3–5x конверсия | Dev tools → HN аудитория = наша ЦА |
| 2 | **Reddit** (r/ChatGPT, r/ClaudeAI) | Прямая ЦА | "I built X" формат, нужен karma warmup |
| 3 | **Product Hunt** | 800–1K визитов | Только ~10% featured, но бренд-value |
| 4 | **MCP Directories** (7+) | SEO + discovery | Glama, Smithery, PulseMCP, mcp.so — submit forms |
| 5 | **GitHub Awesome lists** | Long-tail | awesome-mcp, awesome-rag PRs |
| 6 | **IndieHackers** | Средний | Build in public narrative |
| 7 | **Dev.to / Hashnode** | SEO | "I built an AI memory that works with every LLM" |
| 8 | **X/Twitter** | Slow burn | Build in public, milestone posts |

### Оптимальная последовательность

| День | Действие |
|---|---|
| D-14 | PR в Official MCP Registry |
| D-7 | PH Teaser page, submit MCP directories |
| D-3 | BetaList, TAAFT, SaaSHub, создать X account |
| **Day 0 (Вт)** | **Product Hunt launch** — весь день на комментарии |
| **Day 1 (Ср)** | **Show HN** — 8–9 AM PT |
| **Day 2 (Чт)** | Reddit + IndieHackers, cross-post результаты |

### Messaging

**Запрещённые слова** (non-tech аудитория): RAG, embeddings, vector, MCP, API, tokens, chunks

**Разрешённые замены:** remembers, knows, memory, your stuff, all your AIs, uploads, connect

**Hero:** *"One memory. Every AI."*

**Pain hook:** *"Your AI doesn't know your stuff. You paste context manually into every chat. That's broken. Contexter fixes it."*

**Founding Supporter framing:** *"Your $10 covers 3 days of server costs"* — конкретика > абстракция.

### Viral паттерн

**Единственный must-have asset:** 30–60 сек screencast: "Загружаю 200-страничный PDF → спрашиваю ChatGPT → он знает ответ". Это единственный ролик, который нужно шарить everywhere.

---

## 10. Design Identity

- Стиль: Bauhaus + Swiss typography
- Лого: `con[text]er` — "text" выделен синим (#1E3EA0)
- Шрифт: JetBrains Mono (единственный, везде)
- Цвета: чёрный #0A0A0A, белый #FAFAFA, accent #1E3EA0
- Принцип: *"A well-typeset technical document that happens to be interactive"*

---

## 11. Что нужно от co-founder (Marketing/GTM)

1. **Стратегия каналов** — выбрать 3 приоритетных, расписать execution plan
2. **Copy** — переписать лендинг без жаргона (copy audit готов, 50+ замен)
3. **Social presence** — создать и прогреть аккаунты (X, Reddit, IndieHackers)
4. **Launch coordination** — день запуска = все каналы одновременно
5. **Content** — статьи, threads, "I built X" посты
6. **Founding Supporters** — стратегия привлечения первых 100 × $10
7. **Metrics** — настроить аналитику, отслеживать конверсию

### Revenue share модель

По договорённости — % от LTV привлечённых пользователей.

---

## Ссылки

| Ресурс | URL |
|---|---|
| Продукт | https://contexter.cc |
| API | https://api.contexter.cc |
| GitHub | https://github.com/nopointt/contexter |
| Демо-видео | https://cdn.contexter.cc/public/contexter-screencast.mp4 |
| Health check | https://api.contexter.cc/health |

---

*Документ подготовлен на основе 25+ research файлов (рынок, конкуренты, боли, позиционирование, финмодель, launch mechanics). Полная база: `nospace/docs/research/contexter-*`*
