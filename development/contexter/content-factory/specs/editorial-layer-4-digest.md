# Editorial Layer 4 — News Digest Genre Spec

> Date: 2026-04-25 | Owner: Axis | Status: v1 LOCKED
> Position in pipeline: **Layer 4** (after L1 local pattern check, L2 self-check pass, L3 external factcheck-agent)
> Scope: news digest жанр only. Article / commentary / essay specs — следующими итерациями (same framework).
> Source research: `docs/research/news-digest-genre-seed-research.md` + 4 DEEPs (Money Stuff / Import AI / Big news day / Meduza russian).

---

## What this layer enforces

Existing 3 layers cover **truth (L1+L3), voice (L1+L2), micro-structural guardrails (L2: em-dashes, lowercase, length window)**.

Layer 4 enforces **жанровая макроструктура**: lede formula, depth hierarchy, transition mechanics, closing valve, mode selection (scattered vs meta-thesis vs single-story vs monothematic). Без этого слоя digest проходит факт-чек и tone, но читается «разрозненно» — три параллельных трека без сквозной thread.

---

## Pre-write decision tree (mode selection)

Перед написанием digest определи **mode** по составу дня:

```
Сколько concurrent stories of comparable significance?
│
├─ 1 story дominates (2x impact других) → MODE C: Single-story takeover
│   Allocation: 70-90% lead. Прочее = "также сегодня" sidebar.
│   Opener: explicit ("сегодняшняя главная история — X").
│   Closing valve: maintain.
│   Example: Fortune Data Sheet "all DeepSeek edition", Brew Markets, Platformer.
│
├─ 2-3 stories near-equal:
│   ├─ Genuine meta-thesis есть (causal/structural connection — НЕ forced) → MODE A: Meta-thesis frame
│   │   Opener: 2-3 предложения называют shared frame.
│   │   Distribution: 45/30/25 (НЕ equal 33/33/33).
│   │   Stories = evidence для thesis, не parallel tracks.
│   │
│   └─ Meta-thesis нет → MODE B: Acknowledged parallel tracks
│       Opener: explicit ("три значимых развития сегодня").
│       Один story назначается anchor (по impact).
│       Distribution: 45/30/25.
│       Никакого forced threading.
│
└─ Story consumes >60% бюджета даже одна → MODE D: Monothematic
    Single section, essay format.
    Closing valve OPTIONAL (omit only when дefensible — signal: "Сегодня только об этом").
    Example: Money Stuff на FTX/SVB days.
```

**Test для meta-thesis:** можно ли назвать структурный паттерн в 2 предложениях БЕЗ натяжки? Если "это всё про AI" — натяжка. Если "это всё про кто контролирует AI стек через какой механизм" — реальная thesis.

**Default при сомнении:** MODE B (parallel tracks acknowledged). Better honest fragmentation than fake thread.

---

## Mandatory components

### 1. Opener (lede)

3 типа допустимы:

**Type A — Aphorism / provocation** (6-15 слов).
Asserts фрейм о ситуации читателя. Functions как challenge или invitation в complicity. НЕ предсказывает что в items.
- Import AI: *"You are your LLM history" / "My agents are working. Are yours?"*
- Adapted RU: *"Сегодня вышло три больших релиза. Выбирай в кого целиться."*

**Type B — Open philosophical question** (1-2 предложения).
Названивает uncertainty, которую items сами по себе делают relevant. Не отвечает на вопрос.
- Import AI: *"What if the timelines are correct? What if we're wrong?"*
- Adapted RU: *"Что если контролировать AI стек важнее чем строить лучшую модель?"*

**Type C — Plain boilerplate** (~50% issues допустимо).
Когда нет провокации — нет смысла её придумывать. Items сами несут вес. **Не failure** — neutral default. Import AI делает так в половине issues за 10 лет.

**Запрещённые ledes:**
- Calqued "Yesterday X happened" — английский news template, не русский lede pattern
- "TL;DR" — англицизм, заменяй на `Коротко` или `В двух словах` (если нужно вообще)
- "By the way / к слову" — chatty/blog-y, не press-y
- Multi-paragraph sprawling intro — opener должен умещаться в одно скан-движение глаз

**Mode-specific opener requirements:**
- MODE A → Type A или B + meta-thesis statement (1-2 предложения)
- MODE B → Type A + explicit acknowledgment ("три значимых развития")
- MODE C → Type A + dominant-story statement
- MODE D → Type A + "Сегодня только об этом" signal

### 2. Section header grammar

**Hard rule (Money Stuff model):** headers = declarative noun phrases, не sentences. Hard pivot, body opens cold, NEVER backward-reference.

**CORRECT:**
- "DeepSeek v4"
- "Anthropic под давлением"
- "Рынок нервничает из-за context windows"
- "Происходит всякое"

**WRONG:**
- "Почему DeepSeek v4 меняет правила игры" (sentence, not noun phrase)
- "Как мы видели в первой истории..." (backward-reference)
- "Далее рассмотрим..." (forward-reference)
- "При этом стоит отметить..." (transition phrase masquerading as header)

**Recurring vocabulary patterns** (используй макс 1 раз на issue):
- `Рынок нервничает из-за X` — для market anxiety / adoption fear (адаптация Money Stuff "People are worried about X")
- `Что не случилось` — для negative signals (отсутствие активности — тоже data)
- `Под капотом` — для builder-watch / technical detail block

### 3. Per-item template (Import AI lived formula)

**2 mandatory + 3 optional** (не rigid 5-part).

```markdown
## [Bold headline — noun phrase, 2-5 слов]

*[italicized sub-header — 1 предложение контекста]*

[Context paragraph: где сигнал всплыл (HN/Reddit/arxiv/...), что делает его non-obvious. 100-200 слов.]

**Почему это важно:** [2-4 предложения — implications для builders. RAG/MCP/AI-infra angle если есть. 50-150 слов.]

[Optional: **Что проверяли / Что нашли / Оговорки** — если evidence есть, см. ниже]

**Источник:** [English title или Russian] — [URL] · [date]
```

**Optional labels (add when evidence justifies):**
- `**Что проверяли:**` — если benchmark / experiment, что измеряли
- `**Что нашли:**` — direct quote ≤125 chars OR specific number
- `**Оговорки:**` — если result overstated / contested / needs nuance

**Item length:** 300-600 слов. На 3-4 items = 1200-1600w body, fits 1500-2500w cap c room для opener + closer.

**Цитаты:** прямые цитаты ≤125 chars (Import AI rule), inline или blockquote. Источник указывается отдельной строкой `> source: [URL] by [author], [date]`.

### 4. Depth distribution by mode

| Mode | Story 1 | Story 2 | Story 3 | Closing valve | Total |
|---|---|---|---|---|---|
| **A — Meta-thesis** | 40-45% | 30-35% | 20-25% | 4-8% | 1500-2500w |
| **B — Parallel tracks** | 45-50% | 25-30% | 15-20% | 4-8% | 1500-2500w |
| **C — Single takeover** | 70-85% | 5-15% (sidebar) | — | 4-8% | 1500-2500w |
| **D — Monothematic** | 90-100% | — | — | 0-5% (optional) | 1500-3500w |

**ЗАПРЕЩЕНО:** equal distribution 33/33/33. Никогда. Newspaper front-page tradition (банner headline rule) + 6 confirmed digest exemplars подтверждают: даже на multi-big-story дне читателя ведут от winner к secondary, никогда не равномерно.

**Sub-section "Также / Ещё":** внутри section >250 слов можно добавить sub-header `**Также:**` для secondary item на ту же тему (Money Stuff "Also" pattern, 72% of issues). Создаёт two-tier структуру внутри section без отдельной section.

### 5. Closing valve (chaos valve)

**Universal rule:** every digest ends with gear-change section. **NEVER cut**, даже на big-news-day (там валва нужнее всего — readers более загружены analysis).

**3 опции (rotate / выбирай по мере подходящему):**

**Опция 1 (default): «Происходит всякое»** — Money Stuff Things Happen calque
Format: 8-15 items, 1-2 предложения each, no analysis.
Register degrades: items 1-4 semi-serious → 5-8+ absurdist / lighter.
Stable header: `Происходит всякое` (literal calque preserves casual-ironic register).
Word budget: 4-12% of issue.
Когда: normal day, big-news-day. Skip только в MODE D monothematic с явным signal.

**Опция 2: «Пробую завтра»** — Import AI Tech Tales analog для daily cadence
Format: 1-3 предложения. Личный голос. Action-directed.
Template: *"Один инструмент / подход из сегодняшних сигналов, который я попробую завтра: [X]. Потому что [Y]."*
Word budget: 1-3% of issue.
Когда: дни когда есть конкретный actionable item. Заменяет Things Happen или дополняет.

**Опция 3: «Шапито»** — Meduza canonical Russian-native chaos valve
Format: 3-7 lighter AI/tech curio items с em-dash bullets.
Stable header: `Шапито` (Meduza canonical, Russian readers parse это как entertainment block).
Когда: альтернатива «Происходит всякое». Более radical genre-shift.

**Запрещено в closing valve:**
- New analysis. Если item требует анализа — он получает свою section.
- Anything off-topic far from AI/RAG/MCP — Money Stuff может прыгнуть на "Startup Alcohol Culture" потому что domain = "Money Stuff" maximally broad. Наш domain focused — items adjacent to AI/tech, не pure non-sequiturs.

---

## Russian-specific overrides (Meduza DEEP findings)

### Rubric grid (use verbatim из Russian-canonical vocabulary)

```
ГЛАВНОЕ ЗА ДЕНЬ        (lead block, или ГЛАВНОЕ К ВЕЧЕРУ для evening)
— [story 1]
— [story 2]
— [story 3]

ПОЧЕМУ ЭТО ВАЖНО       (synthesis paragraph if MODE A meta-thesis)

ЧТО ДАЛЬШЕ             (1-3 forward-looking bullets — opt for big-news-day)

ПРОИСХОДИТ ВСЯКОЕ      (closing valve — Money Stuff calque) 
   или ШАПИТО          (Meduza canonical alternative)
```

Все headers — что Russian reader уже видел в serious press (BBC Russian + The Bell + Meduza source-confirmed).

### Telegram-native typography (если distribute через Telegram)

- **Em-dash + space** (`— `) для bullets. Markdown bullets (`*`, `-`, `•`) НЕ rendering cleanly в Telegram.
- **Bold для sub-headlines** внутри bullet
- **Italic для quoted speech**
- В blog-post format (Astro) — `---` divider между items

### Russian word-count inflation в bullet format

~10-15%, не 30% (em-dashes сжимают плотно). Token budget не нужно massively expand vs English.

### 7 anti-patterns (запрещено)

1. ❌ `TL;DR:` → ✅ `Коротко` или `В двух словах` (или ничего)
2. ❌ Markdown bullets `• `, `* `, `- ` → ✅ em-dash `— ` (Telegram), `---` divider (blog)
3. ❌ "К слову" / "By the way" между bullets → ✅ просто em-dash, без teasers
4. ❌ Calqued "Why it matters:" с двоеточием inline → ✅ `**Почему это важно:**` отдельной строкой, болд label
5. ❌ "Вчера X произошло" lede → ✅ single-fact declarative или concept-question
6. ❌ "AI-инструменты" англицизм → ✅ `инструменты на основе ИИ` или `ИИ-инструменты` без дефиса в зависимости от style guide
7. ❌ Foreign-agent disclaimer ironically — либо ты iNoag-tagged outlet, либо нет

### Bridge phrases — usage matrix

| Где | Можно | Нельзя |
|---|---|---|
| Внутри одного bullet/parameters paragraph | ✅ `при этом`, `тем временем`, `в то же время`, `однако`, `впрочем`, `к тому же`, `напомним`, `что важно` | — |
| Между bullets / sections | — | ❌ inline `тем временем / при этом / к слову` — overwritten для Russian reader |

Russian transitional connectives = paragraph-level cohesion device, **не** digest-level. English-trained writer добавляет "тем временем" между unrelated bullets → производит overwritten copy.

### Англицизмы — usage matrix

**Default: replace англицизм с русским если clean equivalent exists.** Англицизм allowed только когда:

| Категория | Примеры (keep as-is) |
|---|---|
| Proper noun / brand / protocol | MCP, API, GCP, AWS, TPU, GPU, NPU, SDK, Hugging Face, GitHub, Reddit |
| Specific technical term без clean Russian | VRAM, MoE / mixture of experts, MRL, HNSW |
| Industry-standard term | frontend, backend, agent, token, embedding, prompt |
| Established financial term | equity, credits (контекст cloud-credits-as-equity) |

**Replace всегда** когда есть clean Russian equivalent:

| Англицизм | Russian replacement |
|---|---|
| builder (когда о людях) | разработчик / создатель |
| defaults | настройки по умолчанию / значения по умолчанию |
| lock-in | привязка / зависимость |
| pricing | ценообразование / цены |
| model-agnostic | независимый от модели |
| runtime | во время выполнения |
| persistence | хранение состояния / постоянство данных |
| changelog | журнал изменений |
| release notes | заметки к релизу |
| capacity scaling | масштабирование мощности |
| product quality | качество продукта |
| post-mortem | разбор инцидента |
| velocity | скорость |
| frontier | передовой уровень / передний край |
| self-hosted | самостоятельно развёрнутый / локально размещённый |
| protocol capture | захват протокола |
| hardware independence | аппаратная независимость |
| capital сделка | финансовая сделка |

**Запрещено invent calque** если русское слово существует:
- ❌ «капасити-скейлинг» → ✅ «масштабирование мощности»
- ❌ «эквити-кэптуре» → ✅ «захват через долю» / «equity capture» (если оставляем как термин)

---

### Non-tech reader filter (sub-layer 4.1)

После Layer 4 structural pass запускается non-tech reader filter. Это финальный pass перед publish.

**Тест:** прочитай post как если бы ты был аналитиком / PM / founder без deep technical background. Можно ли пересказать главную идею digest коллеге за минуту?

**Mechanics:**

1. **Identify jargon** — каждый термин который требует technical knowledge для понимания
2. **Triage:**
   - Можно заменить на plain Russian без потери precision → replace
   - Можно объяснить в 1 предложении при первом упоминании → add explanation
   - Term core к story и explanation добавит noise → keep + accept narrowing of audience (mark в self-check)
3. **First-mention explanations** — формат: `[term] — [1-line explanation]`. После первого упоминания используй term без объяснения.

**Examples первое-упоминание объяснений:**

| Term | Explanation pattern |
|---|---|
| TPU | «процессоры Google для обучения нейросетей» |
| MoE / mixture of experts | «архитектура где модель использует разные веса для разных задач» |
| 1M context | «модель помнит миллион токенов одновременно» |
| thinking effort | «параметр глубины рассуждения модели» |
| MCP | «Model Context Protocol — стандарт как агенты подключаются к внешним инструментам» |
| response API / responses API | «API через который агент получает ответы и вызывает инструменты» |
| RAG | «retrieval augmented generation — ИИ ищет в твоих документах перед ответом» |

**Pre-publish self-check questions:**
- [ ] Главная thesis (мета-тезис в lede) понятна без technical knowledge?
- [ ] Каждый jargon term либо заменён, либо имеет first-mention explanation?
- [ ] «Почему это важно» секции читаемы для non-tech reader?
- [ ] Test: PM-коллега за минуту пересказывает суть main story в своих словах?

**Когда фильтр failed:** post слишком embedded в jargon для non-tech audience. Решение: либо переписать accessibility-first, либо declare audience как technical-only (and accept narrowing).

**Default:** filter activated. Digest оптимизирован для **mixed audience** — technical reader получает depth через unwrapped concepts, non-tech reader получает meta-thesis + key takeaways через first-mention explanations.

---

## Voice anchor markers (Money Stuff techniques adapted)

Применять в commentary блоках (не в factual sections):

1. **Principle-first opening, then "Anyway..."** (Levine pattern)
   - Start section с general abstract claim (2-3 предложения)
   - Затем `И вот что:` или `Так вот.` или `Anyway,` followed by block quote из news item
   - Inverts journalism default (news first → analysis), makes interpretive frame primary

2. **Restrained irony via understatement**
   - State absurd things flat declarative sentences
   - Не explain irony. Trust reader.
   - Example: *"OpenAI выкатил gpt-5.5 в API через 24 часа после consumer-релиза. Совпадение, конечно."*

3. **First-person absence**
   - Almost никогда `I think / я думаю`
   - Используй: `it seems / похоже` / `one way to read this / один из способов читать это` / `the interesting thing is / интересно тут вот что`
   - Makes opinions sound like observations

4. **Founder voice markers** (existing reference_contexter_content_voice rule)
   - "для нас как builders / для нас в Contexter / для нашего планирования"
   - "по-моему" only когда genuine opinion, не filler
   - Min 3 markers per digest, concentrated в commentary блоках, not factual

5. **Footnotes — use sparingly** (1-2 на issue максимум)
   - Main text = clean argument
   - Footnote = caveat, technical correction, joke, что иначе сломал бы tone
   - Inline `[1]`, `[2]`, footnotes собираются в конце section

---

## Required structural checks (before publish)

Layer 4 self-check секция должна включать:

- [ ] Mode declared (A/B/C/D) с justification
- [ ] Opener type declared (A/B/C)
- [ ] Если MODE A: meta-thesis statement в opener traceable к 1-2 предложениям
- [ ] Word distribution соответствует mode table (45/30/25 для A/B, 70-85/15 для C, 90-100 для D)
- [ ] НЕ equal 33/33/33
- [ ] Section headers = noun phrases, no sentences, no transitions
- [ ] Per-item template: 2 mandatory labels (`**Почему это важно:**` + `**Источник:**`) present в каждом item
- [ ] Closing valve present (Опция 1/2/3) — НЕ cut on big-news-day
- [ ] No backward-reference transitions между sections
- [ ] No equal-weight parallel structure
- [ ] Russian rubric grid применён если RU output (Главное / Почему важно / Что дальше / Происходит всякое или Шапито)
- [ ] 7 anti-patterns — все cleared
- [ ] Voice anchor markers ≥3 в commentary блоках

---

## Position в pipeline

```
Source signals (HN/Reddit/...)
    ↓
Triangulation (correspondents) → top-N candidates
    ↓
Master post draft
    ↓
Layer 1: contexter-vault check (claims + AI-tells + TOV + logic)
    ↓
Layer 2: inline self-check pass (confidence labels, recency, source-trace, voice markers)
    ↓
Layer 3: factcheck-agent (per-claim WebSearch + verdicts)
    ↓
Layer 4: this spec (mode / opener / hierarchy / valve / Russian overrides)
    ↓
Publish
```

Layer 4 запускается **последним** — после того как L1+L2+L3 всё прошли. Структурные изменения могут потребовать revisit L1+L2 (например, новый opening меняет factual coverage). Iterate если нужно.

---

## Validation plan

**Test:** does adding Layer 4 resolve "разрозненно" feeling?

1. Apply spec to existing master-blog-post-2026-04-25 → produce v2
2. Compare side-by-side: original vs revised
3. Document deltas (mode chosen, opener changed, hierarchy adjusted, valve added, headers reformulated)
4. Track читательскую реакцию post-publish (если v2 идёт в production):
   - "Feels finished" vs "feels cut off" → valve mechanism working
   - "I followed the thread" vs "это были три статьи" → mode selection working
5. После 5-10 production digests с Layer 4 — review: какие checklist items регулярно ловятся, какие никогда. Trim spec если есть dead rules.

---

## Dependencies / next iterations

- **Article spec (Layer 4 / article)** — для long-form blog posts (NOT digest)
- **Commentary spec (Layer 4 / commentary)** — для short opinion pieces
- **Essay spec (Layer 4 / essay)** — для thinking-out-loud format
- Каждый — same framework (mode tree + mandatory components + Russian overrides + anti-patterns + checklist), different details

---

## Sources

- `nospace/docs/research/news-digest-genre-seed-research.md` — landscape, 14 exemplars, 6 cross-cutting patterns
- `nospace/docs/research/news-digest-money-stuff-deep-research.md` — voice + structural vocabulary + Things Happen mechanics
- `nospace/docs/research/news-digest-import-ai-deep-research.md` — per-item template (2+3 не rigid 5-part) + Tech Tales analog
- `nospace/docs/research/news-digest-big-news-day-deep-research.md` — mode decision tree + 25.04 case rewrite
- `nospace/docs/research/news-digest-meduza-russian-deep-research.md` — Russian rubric grid + 7 anti-patterns + em-dash typography
