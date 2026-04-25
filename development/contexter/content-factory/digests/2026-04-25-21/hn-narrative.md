# evening digest · 2026-04-25 · 21:00 utc · hn

## headline

DeepSeek V4 и OpenAI GPT-5.5/Pro вышли с разницей в полдня - обе с дефолтным 1M контекстом, и тред DeepSeek собрал 1496 комментов с присутствием simonw и antirez.

## top 3 stories

### 1. DeepSeek v4 - 1950p / 1496c / v=58.3 / 33.4h

DeepSeek 24 апреля выложил V4-Pro (1.6T total / 49B active) и V4-Flash (284B / 13B active). 1M context теперь default по всем сервисам. Веса V4-Pro лежат на HuggingFace.

> "nthypes: Model was released and it's amazing. Frontier level (better than Opus 4.6) at a fraction of the cost."
> https://news.ycombinator.com/item?id=47884971 · 2026-04-24

Источник анонса: api-docs.deepseek.com/news/news260424 (verified).

Почему важно: open-weights frontier-level модель с 1M контекстом меняет экономику для self-hosted RAG/агентов. Если бенчмарки подтвердятся - это первый раз за 2026, когда open-source реально догоняет проприетарный фронтир по качеству, а не только по дешевизне. Связанная вторичная: обсуждение technical report (47885014, 158p) и hf weights link.

### 2. Google plans to invest up to $40B in Anthropic - 632p / 622c / v=31.0 / 20.4h

Bloomberg: Google вкладывает $10B сейчас при оценке Anthropic в $350B плюс $30B при достижении performance-таргетов. Большая часть структурирована как cloud credits в обмен на equity.

> "htrp: How much of this goes back to Google as cloud spend?"
> https://news.ycombinator.com/item?id=47892074 · 2026-04-24

Источник: bloomberg.com/news/articles/2026-04-24/google-plans-to-invest-up-to-40-billion-in-anthropic.

Почему важно: comment-to-score ratio 0.98 значит сильный спор, а не пиар. Для нас это сигнал, что Anthropic привязан к Google compute на годы вперёд - это влияет на доступность TPU-инференса для Claude и потенциально на pricing нашей API-зависимости.

### 3. OpenAI releases GPT-5.5 and GPT-5.5 Pro in the API - 243p / 136c / v=13.5 / 18.1h

OpenAI выкатил GPT-5.5 (Chat Completions + Responses) и GPT-5.5 Pro (Responses-only) с 1M context, MCP, web search, computer use, hosted shell, apply patch, Skills.

> "throw03172019: Faster than anticipated because of Deepseek release?"
> https://news.ycombinator.com/item?id=47894000 · 2026-04-24

Источник: developers.openai.com/api/docs/changelog (verified, entry 24 апреля).

Почему важно: MCP теперь native в OpenAI API без отдельного wrapper. Computer use + hosted shell + apply patch на 1M контексте = полный agent-stack из коробки. Для builder-аудитории это снимает причину держать собственный execution layer для большинства tool-using агентов. simonw и swyx в треде - сигнал, что это не маркетинг.

## builder watch

1. **Show HN: Karpathy-style LLM wiki** (47899844, 103p, v=29) - github.com/nex-crm/wuphf. Реализация паттерна, который Karpathy предложил в твите 2039805659525644595: agent memory как plain markdown в Git, без vector DB и embeddings. По-моему это значимая контр-волна - после Stash (47897790, pg_vector + MCP) и MenteDB (47894985, Rust vector store) появляется third option, где "memory" это просто файлы. Для нашего Contexter knowledge layer это прямой архитектурный спор: индекс или нет. Цитата из треда:

   > "clutter55561: Isn't 'memory' just another markdown file that the LLM reads when starting a new session? I keep two files in each project - AGENTS (generic) and PROJECT (duh). All the 'memory' is manually curated in PROJECT, no messy consolidation, no Russian roulette."

2. **Browser Harness RCE** (47890841, 107p) - github.com/browser-use/browser-harness. Запуск выглядит обычным launch, но первый же содержательный коммент:

   > "mattaustin: I submitted a remote code execution to the browser-use about 40 days ago. GHSA-r2x7-6hq9-qp7v. I am a bit stunned by the lack of response."

   Это ai_security сигнал, спрятанный внутри agent-tooling launch. Если кто-то у нас интегрирует browser-use в pipeline - надо проверить advisory до того, как пускать в prod.

## tomorrow

Я не нашёл подтверждённых анонсов на следующие 12h. DeepSeek thread всё ещё на фронтпейдже и продолжит набирать комментарии; ожидаемо появятся бенчмарк-посты от simonw / minimaxir в течение суток (паттерн из прошлых релизов V3.x), но это не подтверждённый план - это extrapolation.

## self-check

- claims requiring web verification:
  - DeepSeek V4 specs (1.6T/49B Pro, 284B/13B Flash, 1M context) - **VERIFIED** через WebFetch api-docs.deepseek.com/news/news260424.
  - OpenAI GPT-5.5 changelog entry 2026-04-24 - **VERIFIED** через WebFetch developers.openai.com/api/docs/changelog.
  - Google $40B / $350B valuation / $10B + $30B split - источник Bloomberg, не запрашивал отдельно (HN-цитата htrp использует те же цифры; consistent с тредом).
  - GHSA-r2x7-6hq9-qp7v (Browser Harness RCE) - claim взят из коммента mattaustin, не проверял CVE базу отдельно. **MEDIUM confidence**, требует follow-up если интегрируем browser-use.
- data >24 часов: DeepSeek headline (33.4h) и DeepSeek-V4 technical report (33.3h) - оба за пределами 24h, но в окне 36h задания "12-24+". Помечено явно.
- numerical facts: все цифры взяты из API/HN-полей (score, comments, velocity, age) или прямых цитат с указанием автора.
- confidence labels:
  - HIGH: DeepSeek V4 release факты (verified), OpenAI GPT-5.5 release факты (verified), Google $40B headline (Bloomberg primary).
  - MEDIUM: интерпретация "OpenAI ускорился из-за DeepSeek" (это коммент, не факт). Browser Harness RCE существует (есть номер GHSA), но не проверен мной в advisory database.
  - LOW: предсказание про завтрашние бенчмарк-посты от simonw/minimaxir.
- forbidden words check: пропущено через стоп-список (leverage, unlock, transform, seamless, journey, revolutionize, game-changing, robust, paradigm, cutting-edge, breakthrough, disruptive, supercharge, synergy, holistic, frictionless, empower, "фундаментальный сдвиг", "беспрецедентный", "критически важно", "Это знаменует") - clean.
- em-dashes: заменены на " - " везде.
- domain concentration: github (3), deepseek+hf (2), bloomberg (1), openai (1), nickyreinert (1), HN-self (1), alash3al (1) - в пределах лимита (max 3 same domain).
