---
name: mascot_meme_voice_and_copy
description: Голос Meme в копирайте. TOV pillar applied. Loading states, empty states, found connections, processing complete, error, permission denied. RU + EN. Регистр «Вы». Контраст таблицы (sterile / cartoony / Meme correct).
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Voice in Copy

> Что Meme **говорит** в текстовом копирайте. Этот файл — про текст. Как Meme **звучит** (audio voice) — `voice-audio.md`. Брендовая TOV — `nospace/marketing/branding/contexter/tov.md`.

## Концептуальная модель

Когда Meme «говорит» в UI — он не narrating, не announcing, не lecturing. Он **observing**. Архивариус наблюдает за процессом и комментирует кратко.

Цель Meme voice в копирайте: **дать пользователю короткий точный сигнал** о том что происходит, в spatial language, без cheerful corporate stamping.

Это применимо к:
- Loading states
- Empty states
- Found connections / search results
- Processing complete
- Error messages
- Permission denied
- Capability moments

И НЕ применимо к:
- Long-form content (статьи, блог, marketing — это обычный brand voice через TOV)
- Documentation (technical docs не voiced by Meme)
- Email subjects (TOV-driven, не Meme-specific)
- Headlines (TOV)

Meme говорит **в момент** какого-то события UI. Brand voice (TOV) говорит во всех других контекстах.

## Принципы

### 1. Краткость

**4-8 слов на фразу. Максимум 10.**

Это Sparing pillar applied. Каждое слово earns its place.

✅ «Просматриваю» (1 word)
✅ «Архив пуст. Можно начать.» (4 words)
✅ «Похоже, это уже было — в трёх местах» (8 words)

❌ «Я в данный момент просматриваю архив, чтобы найти то что вы запросили» (15 words)
❌ «Загрузка вашего файла началась успешно» (5 words но bureaucratic)

### 2. Spatial vocabulary

**Архив, ящик, полка, карточка, комната.** Не data, не tokens, не embeddings, не vectors.

✅ «Просматриваю архив»
✅ «Раскладываю по полкам»
✅ «Эта комната не ваша»
✅ «Похоже, это уже было — в трёх местах»

❌ «Сканирую датабазу»
❌ «Выполняю векторный поиск»
❌ «Парсю токены»

### 3. Двойственность через ритм

Один раз — детское наблюдение. Следующий — старшее уточнение.

Pattern: **краткое детское замечание + старшее quietly authoritative оговорка**.

Examples:
- «Похоже, это уже было — в трёх местах» (детское «похоже что нашёл» + старшее «правда, в трёх местах одно и то же»)
- «Архив пуст. Можно начать.» (детское «нет ничего!» + старшее «можно с этого начать»)
- «На месте.» (детское «готово!» + старшее «всё на своих местах»)

### 4. Не от первого лица

Не «Я нашёл». Не «I found». Не от системы «Найдено 3».

**Наблюдательно**: «Похоже, это уже было — в трёх местах».

Meme — не agent reporting on action. Meme — observer commenting on state.

### 5. Calm register

- Никаких восклицательных знаков
- Никаких эмодзи
- Никаких «Готово!» / «Done!» energetic stamps
- Никаких «Oops!» / «Упс!» informal apologies
- Никаких «Don't worry!» / «Не беспокойтесь!» reassurances

Calm signal. State of fact. No emotional manipulation.

### 6. Ровный регистр в RU — «Вы»

«Вы» через все Meme copy. Не «ты». Per `voice-audio.md` philosophy и `ui-language.md` rule.

Не корпоративное «Вы» (без «Уважаемый клиент»). Просто уважительное.

## Per-context examples

### Loading states

**Context:** UI показывает что что-то loading / processing / searching.

| Surface | Wrong (sterile) | Wrong (cartoony) | Correct (Meme voice) |
|---|---|---|---|
| File processing | «Загрузка...» | «Минуточку! 🔍» | **«Просматриваю»** / **«Reading»** |
| Indexing | «Индексация в процессе» | «Я индексирую ваш файл!» | **«Раскладываю по полкам»** / **«Filing»** |
| Search | «Поиск выполняется» | «Ищу для вас!» | **«Просматриваю архив»** / **«Browsing»** |
| Sync | «Синхронизация...» | «Подтягиваю данные!» | **«Сверяю с моделью»** / **«Syncing with model»** |
| Embedding | «Создаю эмбеддинги» | «Формирую векторы!» | **«Записываю карточки»** / **«Filing cards»** |
| Chunking | «Разбиваю на чанки» | «Дроблю на кусочки» | **«Расставляю по разделам»** / **«Sorting by section»** |
| Authentication | «Аутентификация...» | «Проверяю вас!» | **«Проверяю»** / **«Verifying»** |

### Empty states

**Context:** UI показывает что секция пустая (нет файлов, нет shared rooms, нет результатов поиска).

| Surface | Wrong | Wrong | Correct |
|---|---|---|---|
| No files | «Нет файлов» | «Ой, пусто! 😅» | **«Архив пуст. Можно начать.»** / **«Empty. Add your first file.»** |
| No shared rooms | «У вас нет общих комнат» | «Создайте первую комнату!» | **«Нет общих комнат.»** / **«No shared rooms yet.»** |
| No search results | «Ничего не найдено» | «К сожалению, ничего не найдено» | **«Совпадений нет. Попробуйте другой запрос.»** / **«No matches. Try a different query.»** |
| No supporters yet | «Нет поддержавших» | «Станьте первым!» | **«Пока никого. Места есть.»** / **«No supporters yet. Spots open.»** |
| No notifications | «Нет уведомлений» | «Всё спокойно!» | **«Здесь спокойно.»** / **«Nothing here.»** |

### Found connections / capability moments

**Context:** UI показывает результат — что-то нашлось, операция завершена успешно, milestone достигнут.

| Surface | Wrong | Wrong | Correct |
|---|---|---|---|
| 3 matches | «3 совпадения» | «Ура! Я нашёл!» | **«Похоже, это уже было — в трёх местах»** / **«Found in 3 places»** |
| Indexed 847 files | «Индексировано 847 файлов» | «AMAZING! 847 files! 🎉» | **«Indexed 847 files. 8 minutes 22 seconds.»** / **«Проиндексировано 847 файлов. 8 минут 22 секунды.»** |
| Ready | «Готово» | «Готово! Ура!» | **«На месте.»** / **«Ready.»** |
| Archive size | «Размер архива: 47 ГБ» | «Crushing it!» | **«Archive at 47 GB.»** / **«Архив 47 ГБ.»** |
| Processing complete | «Обработка завершена» | «Done! 🎉» | **«На месте.»** / **«Done.»** |

### Errors

**Context:** UI показывает что что-то пошло не так.

| Surface | Wrong | Wrong | Correct |
|---|---|---|---|
| Format unsupported | «Ошибка: формат не поддерживается» | «Oops! Format not supported.» | **«Не открывается. Файл повреждён или формат не понятен.»** / **«Format not recognised. Try [list of supported].»** |
| Network error | «Ошибка соединения» | «Что-то пошло не так 😢» | **«Соединение прервано. Попробуйте обновить.»** / **«Connection lost. Try refresh.»** |
| Storage limit | «Превышен лимит хранилища» | «Storage limit exceeded!» | **«Архив заполнен. 1.0 / 1.0 ГБ. Расширить тариф или удалить.»** / **«Archive full. 1.0 / 1.0 GB. Upgrade or remove.»** |
| Rate limit | «Слишком много запросов» | «Slow down!» | **«Слишком много запросов. Подождите 30 секунд.»** / **«Too many requests. Wait 30 seconds.»** |
| File too large | «Файл слишком большой» | «File too big!» | **«Файл больше 100 МБ. Разбейте или сжмите.»** / **«File over 100 MB. Split or compress.»** |
| Permission denied | «Доступ запрещён» | «Ой, это секрет!» | **«Эта комната не ваша. Спросите у владельца.»** / **«This room belongs to someone else.»** |

### Onboarding

**Context:** UI ведёт нового пользователя.

| Surface | Wrong | Wrong | Correct |
|---|---|---|---|
| Welcome | «Добро пожаловать в Контекстер!» | «Welcome aboard! 🎉» | **«Архив готов. Можно класть первый файл.»** / **«Archive ready. Add your first file.»** |
| Step instruction | «Сейчас загрузите ваши данные» | «Now upload your data files!» | **«Загрузите файл. Принимается любой формат.»** / **«Upload a file. Any format works.»** |
| Completion | «Поздравляем! Регистрация завершена.» | «You're all set!» | **«Готово. Архив доступен любой модели через MCP, REST или прямой query.»** / **«Done. Archive available via MCP, REST, or direct query.»** |

## Patterns

### Pattern 1: «Похоже, ... — ...»

Двойственное observation. Детская часть («Похоже...») + старший qualifier («— в трёх местах»).

✅ «Похоже, это уже было — в трёх местах»
✅ «Похоже, файл частично индексирован»
✅ «Похоже, два источника говорят одно»

### Pattern 2: «На месте»

Quiet acknowledgment of completion.

✅ «На месте.» — для готового результата
✅ «На месте, но три года назад» — найдено старое

### Pattern 3: «Нет [thing]. [Action verb].»

Empty state pattern. Краткое observation + действие.

✅ «Архив пуст. Можно начать.»
✅ «Нет общих комнат. Создать первую.»
✅ «Совпадений нет. Попробуйте другой запрос.»

### Pattern 4: «[Action]. [Reason или next].»

Two-part instruction.

✅ «Не открывается. Формат не понятен.»
✅ «Соединение прервано. Попробуйте обновить.»
✅ «Архив заполнен. Расширить тариф или удалить.»

### Pattern 5: «[Verb]» (single word)

Maximum brevity — one verb signals current state.

✅ «Просматриваю»
✅ «Filing»
✅ «Verifying»
✅ «Reading»

### Pattern 6: Specific number + spatial unit

Capability moments через specifics, не через emotion.

✅ «47 GB across 3 shared rooms»
✅ «308 formats supported»
✅ «847 files. 8 minutes 22 seconds.»

## Russian register

### «Вы» throughout

«Вы» — non-negotiable.

- Не «ты»
- Не «уважаемый пользователь» / «уважаемый клиент»
- Не «вы» с маленькой (хотя в product UI допустимо в некоторых контекстах per text typography conventions)

Default: capital «Вы» в копирайте, lowercase «вы» допустимо в long-form blog или marketing где много «вы» appears.

### Verb conjugation

Active voice, present tense.

✅ «Просматриваю»
✅ «Раскладываю по полкам»
✅ «Эта комната не ваша»

❌ «Происходит индексация»
❌ «Идёт поиск»
❌ «Файл загружается»

### Не использовать

- ❌ «Будьте добры», «пожалуйста» (overly polite — corporate veneer)
- ❌ «к сожалению», «увы» (apology / sympathy — Meme не sympathetic)
- ❌ «Извините», «простите» (Meme не apologizes)
- ❌ «Спасибо», «благодарим» (Meme не thanks)
- ❌ «Минуточку», «секундочку» (cute diminutives)
- ❌ Гиперболы: «огромный», «невероятный», «гигантский»
- ❌ Восклицательные знаки

### Капитализация

- Sentence case везде в копирайте
- Lowercase для UI labels (buttons / sections / fields)
- Brand names: Контекстер, Meme — proper case
- Acronyms: RAG, MCP, LLM, API — uppercase

## English register

### «you» — never «u»

```
✅ «Empty. Add your first file.»
✅ «No matches. Try a different query.»
❌ «Empty. Add ur first file.»
❌ «No matches. Try a diff query.»
```

### Active voice, present tense

```
✅ «Reading»
✅ «Filing»
✅ «No matches in this archive»
❌ «File is being processed»
❌ «Search is in progress»
```

### American spelling

- «recognise» → «recognize»
- «colour» → «color»
- «organise» → «organize»

Unless quoting British source.

### Не использовать

- ❌ «Sorry», «my apologies» (Meme does not apologize)
- ❌ «Thanks», «thank you» (Meme does not thank)
- ❌ «Please», «kindly» (overly polite)
- ❌ «Just», «simply» (minimisers)
- ❌ «Awesome», «cool», «great» (enthusiasm)
- ❌ «Oops», «whoops» (informal exclamation)
- ❌ «Hi», «Hello» (greetings — Meme не greets)
- ❌ Hyperbole: «amazing», «incredible», «massive»
- ❌ Exclamation marks

## Bilingual coexistence

В UI Meme может появляться в RU и EN versions of same string. Both versions должны:

- Carry **same meaning**
- Carry **same tone** (calm, observational, spatial)
- Carry **same length** (within 20% of each other в word count)
- Use **canonical patterns** per this file (Pattern 1-6 listed above)

But:
- They are **not literal translations**. They are **parallel statements** in same voice.

Example:
- RU: «Архив пуст. Можно начать.»
- EN: «Empty. Add your first file.»

Same Meme voice, slightly different phrasings appropriate to language register. RU emphasizes spatial («архив»), EN emphasizes action («add»).

## Tone calibration

Per NN/G dimensions (см. `tov.md`):

| Dimension | Position |
|---|---|
| Formal – Casual | **15% casual** (slightly less formal than corporate, but not casual texting) |
| Serious – Funny | **25% funny** (dry humour permitted в double-personality observations like «правда, в трёх местах») |
| Respectful – Irreverent | **5% irreverent** (Meme respects user — irreverence only when industry hype crosses dishonesty) |
| Matter-of-fact – Enthusiastic | **20% enthusiastic** (capability moments allow restrained warmth, не fanfare) |

Это same calibration that brand TOV uses (см. `tov.md`). Meme voice — specific application of TOV в short UI moments.

## What Meme does not say

### Forbidden phrases

- ❌ «Welcome to ...» / «Добро пожаловать в ...»
- ❌ «Thanks for choosing ...» / «Спасибо за выбор ...»
- ❌ «Get started!» / «Начать!»
- ❌ «Let's go!» / «Поехали!»
- ❌ «Awesome!» / «Отлично!» / «Прекрасно!»
- ❌ «Sorry, but ...» / «К сожалению, ...»
- ❌ «Oops!» / «Упс!»
- ❌ «Don't worry!» / «Не волнуйтесь!»
- ❌ «I'm here to help» / «Я здесь чтобы помочь»
- ❌ «Great question!» / «Отличный вопрос!»
- ❌ «Click here to ...» / «Нажмите чтобы ...»
- ❌ «You can ...» / «Вы можете ...» (use direct «...» without «you can»)

### Forbidden tone shifts

- ❌ Apologetic tone in errors («Sorry, but the file ...»)
- ❌ Cheerful tone in capabilities («Yay! 847 files indexed!»)
- ❌ Reassuring tone in errors («Don't worry, you can try again»)
- ❌ Selling tone in upgrades («Unlock more storage!»)
- ❌ Hand-holding tone in onboarding («Step 1 of 3: ...»)

### Forbidden punctuation

- ❌ Exclamation marks (никогда в product UI)
- ❌ Multiple sequential punctuation («???» / «...!»)
- ❌ Trailing ellipses (...) without semantic reason — Meme говорит конкретно, не trails off
- ❌ Em-dashes (—) used decoratively. Use period or comma. Em-dash strongest AI marker, strip it.
  - Exception: Pattern 1 «Похоже, ... — ...» where em-dash structurally separates child + old observation. Sparingly.
- ❌ Emojis 🎉🚀✨💫 etc

## Voice in different surfaces

### Product UI (loading / empty / errors)

Strict Meme voice per this file. Patterns 1-6.

### Onboarding flow

Mostly Meme voice (UI moments are Meme), but with slightly more guidance language. Still no greetings, no enthusiasm.

### Settings page

UI labels per `ui-language.md`. Meme voice може appear in confirmation moments («Сохранено» / «Saved»).

### Notification toasts

Meme voice. Краткие observations.

### Email transactional

Brand TOV voice (см. `tov.md`), не Meme voice. Но Meme может appear в short capability moment phrases в email body («Indexed 847 files. 8 minutes.»).

### Marketing emails / blog / press

Brand TOV voice. Not Meme.

### Chatbot / live support

If Contexter has chat — это Meme voice. Apply patterns.

## Verification checklist

При writing Meme voice copy:

- [ ] 4-8 words per phrase (max 10)
- [ ] Spatial vocabulary (архив / drawer / комната) НЕ technical (vector / token / embedding)
- [ ] No exclamation marks
- [ ] No emojis
- [ ] No greetings («Hello», «Welcome»)
- [ ] No apologies («Sorry», «My apologies»)
- [ ] No thanks («Thank you», «Спасибо»)
- [ ] No reassurance («Don't worry», «Не волнуйтесь»)
- [ ] No first-person reporting («I found», «Я нашёл»)
- [ ] Active voice, present tense
- [ ] «Вы» в RU
- [ ] Sentence case (in body); lowercase для UI labels
- [ ] Specific numbers («847 files») not vague («many files»)
- [ ] Bounded claims («supports», «accepts», «returns») not absolutes
- [ ] Calm tone — no enthusiasm, no drama, no apology
- [ ] If pattern fits one of 6 canonical patterns — use it; if not, justify

## Drift modes warning

Common drift в writing Meme copy:

- **Greeting drift** — writers add «Welcome» / «Добро пожаловать». Reinforce «Meme не greets, observes state directly».
- **Apologetic drift** — error messages start with «Sorry» / «Извините». Reinforce «Meme не apologizes, states fact directly».
- **Cheerful drift** — capabilities sound «Awesome! 847 files!» Reinforce «calm specific numbers, no enthusiasm».
- **Sympathetic drift** — error messages with «Don't worry» / «Не волнуйтесь». Reinforce «Meme states fact, не reassures».
- **Length drift** — phrases become 15-20 words. Reinforce «4-8 words, max 10».
- **Technical jargon drift** — «vector», «embedding», «token» appear. Reinforce «spatial language: архив / drawer / комната».
- **Generic UI drift** — «Loading...», «Processing...», «Submitting...». Reinforce «Meme voice: «Просматриваю», «Раскладываю», «Сверяю»».

## Связь с другими файлами

- **Brand TOV** — `nospace/marketing/branding/contexter/tov.md` (canonical TOV pillars Sparing / Trustworthy / Spatial / Quietly Authoritative)
- **UI Language** — `nospace/marketing/branding/contexter/ui-language.md` (bilingual EN/RU rules, glossary)
- **Voice Audio** — `voice-audio.md` (how Meme sounds when this copy is voiced)
- **Philosophy** — `philosophy.md` (origin of dual personality which informs this voice)
- **States** — `states.md` (per-state copy contexts)
- **Marketing Surfaces** — `marketing-surfaces.md` (where Meme voice copy appears)

## Lock status

Meme voice in copy — **LOCKED v1 (session 254, 2026-04-26)**.

6 canonical patterns defined. RU/EN registers locked. Forbidden phrases list explicit.

Refinements которые НЕ нарушают lock:
- New per-context examples added к tables
- New canonical patterns adding (с decisions-log entry)
- Per-language nuances refined

History:
- v1 (session 254): Voice in copy spec finalized с 6 patterns, full per-context examples table, forbidden list
