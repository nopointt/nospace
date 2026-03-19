---
# harkly-mvp-session-context.md — Контекст сессии: что обсуждалось но не вошло в MVP
> Created: 2026-03-18 | Session: Axis · планирование MVP
> Цель: сохранить полный контекст сессии для будущих решений
---

## Интервью (2026-03-18)

### Профиль респондента
- UX/CX ресёрчер, делает глубинные интервью
- Ушла в декрет, но продолжила бы пользоваться инструментом
- Не искала решения активно — единственный инструмент который встречала, слышала про него несколько раз

### Дословные заметки nopoint
- загрузить свои интервью - прикольно
- минус в том — из интернета инфа просто не нужна
- инфа из интернета нерелевантна, заказчик приходит за глубинными исследованиями, нужна тулза для своих интервью
- записи аудио и видео тексты в фигме
- было удобно когда даешь аудио в прогу и на основе интервью
- уже была похожая тулза не подошел формат, он выдавал как текст но надо было нормально
- фри приложение — узнала — использовала в 1-2 исследовании, продолжала бы пользоваться, но ушла в декрет. надо было руками форматировать и все равно осталась бы
- заплатила бы 10 долларов за то что он уже сейчас делает
- чтобы заплатила 50 баксов — форматирование нормальное, нормализировал и фильтровал данные, маппинг данных. нормально работал с цифрами
- пред решения были еще хуже — анализировала текстовые записи — кидала в чат гпт — отдавал выводы. чату гпт просто было недостаточно данных
- решений мало и не сильно искала — это был единственный который встречала. и несколько раз слышала только про него
- надо кнопочку вообще не использовать интернет данные
- бесит в чат гпт — что он галюцинирует
- говорила про ноутбук лм

### Ключевые инсайты из интервью
1. **Интернет-данные не нужны** — заказчик приходит со СВОИМИ интервью
2. **Сырой текст недостаточно** — нужно нормальное форматирование и структура
3. **ChatGPT галлюцинирует** — бесит, недостаточно данных для grounded ответов
4. **$10 WTP** за транскрибацию, **$50 WTP** за маппинг+нормализацию+фильтрацию+цифры
5. **Мало решений на рынке** — не искала активно, слышала только про одно
6. **Zero hallucination mode** — кнопка "не использовать интернет данные"

---

## Эволюция концепции (ход сессии)

### Шаг 1: nopoint принёс заметки интервью
Исходная формулировка: "тулза для своих интервью, загрузить аудио/видео/текст"

### Шаг 2: идея с NotebookLM + Figma
nopoint: "тупо натянуть функционал ноутбук лм на фигму и настроить нормально иишку"
- От NotebookLM: загрузка своих данных, grounded ответы
- От Figma: только infinite canvas (у Harkly уже лучше)
- Строим в Tauri + SolidJS (не Figma plugin)

### Шаг 3: Spine остаётся, вход меняется
nopoint: "по сути тот же спайн процесс который уже сейчас есть просто не со сторонними источниками а с пользовательскими данными"
- F1 Sources = upload вместо интернет-коннекторов
- Остальной pipeline (нормализация → extraction → synthesis) без изменений

### Шаг 4: Маппинг = killer feature
nopoint: "нужно еще нормальный маппинг сделать — это будет главная фишка мвп"
Аналогия с SQLite из ideas_inbox: как SQLite заменяет grep по плоским файлам — Harkly заменяет "кинуть в ChatGPT". Маппинг = структурирование данных в базу, не AI-саммари.

### Шаг 5: MCP + любая LLM
nopoint: "потом ты просто берешь mcp настраиваешь с чат гпт или клод или любой ллмкой и общаешься"
- Harkly = data layer, не чат
- MCP Server отдаёт данные → юзер подключает свою LLM
- Zero vendor lock-in

### Шаг 6: LLM неважна, настройка важна
nopoint: "я считаю не так сильно важна ллм как ее настройка"
- LLM = commodity
- Ценность = structured data + правильная конфигурация LLM для работы с ними
- Harkly продаёт настройку, не модель

### Шаг 7: Шире чем qualitative research
nopoint: "не инструмент для качественных исследований — смотри шире"
- Аудитория NotebookLM: студенты 43%, преподаватели 26%, аналитики, юристы, журналисты
- Harkly = платформа для работы со СВОИМИ данными, не только интервью

### Шаг 8: Fallback на open-source
nopoint: "мсп это единственный белый путь — можем сделать фоллбек на опенсорс модель через лучшего по цене провайдера"
- Primary: MCP (юзер подключает свою LLM)
- Fallback: Groq/NIM Llama 3.3 70B (для юзеров без подписки)

---

## Что не вошло в MVP (но обсуждалось / есть в архитектуре)

### Data Marketplace (ideas_inbox 2026-03-18)
- "данные лежат мёртвым грузом — у каждого PM горы неиспользованных транскриптов"
- Юзер помечает датасет как публичный → другие покупают доступ за кредиты
- Сетевой эффект, UGC data layer, моат
- **v2** — после того как база юзеров появится

### Интернет-коннекторы (старый F1)
- Telegram, HN, Reddit, Google Trends — весь OSINT pipeline
- Вырезаны из MVP: интервью показало что интернет-данные не нужны
- Могут вернуться как опциональные источники в v2

### Артефакты (empathy map, journey map, fact pack)
- nopoint: "артефакты изи же добавить — это просто один промпт"
- Каждый артефакт = один промпт + один фрейм на канвасе
- Добавляются инкрементально после MVP

### Spatial interface — не валидирован
- Из интервью spatial не запрашивался
- Респондент говорила про форматирование, маппинг, цифры — не про канвас
- Canvas = наше видение и дифференциатор, но НЕ валидированная потребность
- Для MVP канвас опционален — MCP + structured DB работают без него

### HARKLY-16: Claude Code CLI integration
- Модель: юзер ставит Claude Code → логинится → Harkly интегрируется с локальным инстансом
- **УБИТА** (февраль 2026): Anthropic запретил consumer OAuth в third-party
- Альтернативы: MCP Server (белый путь) или Claude Partner Network
- Черновик письма в Anthropic: `memory/anthropic-claudecode-inquiry.md`

### Коллаборация
- Шеринг проектов с командой
- Real-time совместная работа на канвасе
- **v2** — MVP = single-user

### Кросс-проектный анализ
- Паттерны через несколько проектов
- Knowledge graph через все исследования
- **v2/v3** — требует зрелой базы данных

### Audio Overview / подкасты
- Фича NotebookLM (генерация подкастов из документов)
- Не наш фокус — мы про structured data, не entertainment

### PICOT / advanced frameworks
- В Framing Studio (F0) есть JTBD, SPICE, PEO, Issue Tree, FINER
- Для MVP маппинг универсальный — фреймворки как overlay позже

### MCP user flow — обсуждение UX проблемы
Обсудили конкретный flow для юзера:
1. Регается в Harkly → загружает данные → Harkly маппит
2. Нажимает "Подключить к Claude" → получает Remote MCP URL
3. Копирует URL → вставляет в настройки Claude Desktop / ChatGPT
4. Открывает Claude → спрашивает → Claude через MCP дёргает Harkly → grounded ответ

**Проблема:** это flow для технически подкованных. Обычный PM-ресёрчер должен установить Claude Desktop, найти настройки MCP, вставить URL — фрагментированный опыт в двух окнах. nopoint принял как данность для MVP: "для нашего мвп мсп это единственный белый путь".

### Spatial interface — прямой вопрос nopoint
nopoint спросил: "а спатиал интерфейс нужен людям из исследования?"
Axis ответил честно: **нет, из этого интервью не валидирован**. Респондент говорила про форматирование, маппинг, цифры — ни слова про канвас. Canvas = наш дифференциатор и видение, но не доказанная потребность. nopoint принял к сведению.

### Итерации понимания "маппинга" (важно для контекста)
Axis несколько раз неправильно понимал что nopoint имеет в виду под "маппингом":

1. **Попытка 1 (Axis):** маппинг = AI автоматически тегает сущности, темы, сентимент → structured knowledge layer. **nopoint: "не то"**
2. **Попытка 2 (nopoint указал на ideas_inbox):** nopoint сослался на идею SQLite из ideas_inbox (2026-03-17) — аналогия: как SQLite заменяет grep по плоским файлам, так Harkly заменяет "кинуть в ChatGPT". Маппинг = **структурирование данных в queryable базу**, не AI-саммари и не RAG-чат.
3. **Финальное понимание:** маппинг = превращение сырых неструктурированных данных (аудио, текст, PDF) в **нормальную базу данных** с таблицами, фильтрацией, сортировкой, пересечениями. Как database schema, не как knowledge graph.

### Anthropic February 2026 — ban consumer OAuth
Из LLM integration research: в феврале 2026 Anthropic запретил использование OAuth токенов consumer подписок (Free/Pro/Max) в любых third-party продуктах, включая Agent SDK. Это убивает модель из HARKLY-16 (юзер ставит Claude Code → Harkly интегрируется с локальным инстансом).

Белые альтернативы:
- **MCP Server** — Harkly выступает MCP-сервером, юзер подключает из своего Claude Desktop
- **Claude Partner Network** — подать заявку на claude.com/partners
- **Claude Marketplace** — waitlist на claude.com/marketplace-partners

### LLM integration research — ключевые находки
13 провайдеров исследованы. Стратегия: "MCP-first, BYOK-fallback, Local-supported":
- **MCP** работает с 6+ клиентами, ToS-safe для всех провайдеров
- **BYOK** (user enters API key): Tier 1 (Anthropic/OpenAI/Google) юридически мутно но Cursor/Windsurf так делают. Tier 2 (Mistral/Groq/Together/Fireworks) — ок
- **Local** (Ollama, LM Studio) — zero risk, максимальная приватность
- **DeepSeek** — privacy red flag (data stored in China)
- **OpenAI Apps SDK** — strong path, built on MCP, open-source, App Directory

### Fallback провайдеры — сравнение
| Провайдер | Модель | Цена input/output за 1M | Уже в стеке |
|---|---|---|---|
| Groq | Llama 3.3 70B | $0.59 / $0.79 | ✅ (Whisper) |
| Together AI | Llama 3.3 70B | ~$0.60 / $0.60 | нет |
| Fireworks | Llama 3.3 70B | ~$0.90 / $0.90 | нет |
| NVIDIA NIM | Llama 3.3 70B | уже есть ключ | ✅ |

Groq или NIM — логичнее, оба уже в стеке.

### NotebookLM — ключевые слабости (из исследования)
- **Trustpilot 2.8/5** (67% — 1 звезда)
- **G2 4.8/5** (профессиональная аудитория довольна grounding)
- **13% галлюцинаций** (vs 40% у ChatGPT)
- **Февраль 2026 regression:** Gemini 3.1 "полностью сломало RAG и grounding"
- **Нет spatial interface** — всё линейно
- **Нет фильтрации/нормализации** — ключевая боль исследователей
- **Нет работы с цифрами** — "not good at analyzing or finding statistics"
- **Изолированные ноутбуки** — не "разговаривают" друг с другом
- **Слабый экспорт** — цитаты не сохраняются
- **Interpretive overconfidence** — превращает мнения в "факты"
- **Data Tables не интерактивны** — нельзя редактировать, URL не кликабельны
- **Рынок:** 180% рост юзербазы, 14% market share в educational AI, "триополия" с ChatGPT и Perplexity

### NotebookLM — демография (широкая аудитория, не только ресёрчеры)
- 64% — возраст 18-34
- 43% студенты, 26% преподаватели, 18% исследователи
- Gen Z: 56%, Millennials: 32%
- Доступен в 150+ странах
- 72% используют минимум 3 раза в неделю

### NotebookLM — ценообразование (референс для Harkly)
- Free: $0 (50 источников, 100 ноутбуков, 50 запросов/день)
- Plus: $19.99/мес (300 источников, 500 запросов/день)
- Pro: через Workspace ($14/user/мес)
- Ultra: $249.99/мес (600 источников, воспринимается как "price testing")
- Dovetail: $21,000+/год enterprise
- **Harkly рекомендуемый диапазон:** $29-79/мес за команду (не per-seat)

### Core positioning (не записан формально, но зафиксирован как принцип)
nopoint: "не так сильно важна ллм как ее настройка"
- LLM = commodity (Gemini, Claude, ChatGPT, Llama — всё одно)
- Настройка = ценность: structured data + grounding rules + research-specific prompts + правильный контекст
- NotebookLM лучше ChatGPT не потому что Gemini умнее, а потому что grounding настроен
- Harkly продаёт не LLM, а правильно настроенную работу с данными юзера

### Предыдущая архитектура vs MVP (контраст)
Старый Harkly (Spine flow):
- F0 Framing → F1 Sources (интернет-коннекторы) → F2 Raw → F3 Insights → F4 Artifacts → F5 Notebook
- Фокус на OSINT, скрапинг, API коннекторы
- Сложная архитектура с floor navigation

Новый Harkly (Data Layer):
- Upload → Map → Structured DB → MCP → Any LLM + Canvas
- Фокус на СВОИ данные юзера
- Проще, чище, валидировано интервью

---

## Открытые вопросы (не решены в сессии)

1. **Схема маппинга** — какие именно сущности/связи извлекаем? Фиксированная схема или юзер сам определяет?
2. **БД** — SQLite (offline-first, data sovereignty) vs Supabase PG (облако, коллаборация)?
3. **AI для маппинга** — какой pipeline? Один LLM call на документ или multi-step (NER → classification → linking)?
4. **MCP Server scope** — какие tools/resources отдаёт? query(), search(), get_entity(), get_quotes()?
5. **UX upload** — веб-интерфейс или только десктоп (Tauri)?
6. **Артём** — какая роль в MVP? Кто делает что?
7. **Таймлайн** — когда шипим MVP? (nopoint не озвучивал)

---

## Связанные документы

| Документ | Путь | Содержание |
|---|---|---|
| **MVP spec** | `memory/harkly-mvp-data-layer.md` | Финальный MVP (этот эпик) |
| **NotebookLM research** | `docs/research/notebooklm-research.md` | 631 строка, 18 поисков, 30+ источников. Фичи, отзывы, боли, конкуренты |
| **LLM integration research** | `docs/research/llm-local-integration-research.md` | ToS, MCP, BYOK по 13 провайдерам. MCP = белый путь |
| **Anthropic inquiry** | `memory/anthropic-claudecode-inquiry.md` | HARKLY-16, черновик письма, не отправлен |
| **Ideas inbox** | `nospace/ideas_inbox.md` | Data Marketplace (2026-03-18), SQLite mapping (2026-03-17) |
| **Opus business brief** | `architecture/opus_business_brief.md` | Предыдущая архитектура Spine |
| **Product architecture** | `architecture/harkly-product-architecture-en.md` | Предыдущая архитектура floors/connectors |
| **Spine process** | `architecture/harkly-spine-process-ru.md` | Предыдущая архитектура Spine stages |
| **Harkly design system** | `nospace/design/harkly/` | UI tokens, guidelines, patterns |
| **Pencil mockups** | `nospace/design/harkly/harkly-ui.pen` | F0 done, F1-F5 pending |
| **Framing research** | `docs/research/framing-frameworks-research.md` | JTBD/SPICE/PEO/FINER — 735 строк |
| **F1 connector research** | `docs/research/f1-connector-ux-research.md` | Исследование коннекторов (теперь deprioritized) |
| **OSINT methodology** | `docs/research/osint-content-research-methodology.md` | 512 строк (теперь deprioritized) |
| **Brand bible** | `development/harkly/brand/brand-bible.md` | Бренд Harkly |
| **Values** | `development/harkly/brand/values.md` | 5 ценностей |
| **TOV** | `development/harkly/brand/tov.md` | v3 — 4 pillars |
