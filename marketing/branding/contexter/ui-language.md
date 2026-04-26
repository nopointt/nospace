---
name: contexter_ui_language
description: Contexter UI is bilingual — EN primary, RU secondary. «Вы» in Russian. Lowercase labels. Spatial vocabulary.
type: project
---

UI-копирайт Контекстера — **двуязычный**: EN primary, RU secondary. Лендинг полностью bilingual. Web app переключается по выбору пользователя.

## Why bilingual

- Глобальный рынок: EN primary, RU secondary (per brand-voice reglament).
- Контекстер начался от русскоязычного основателя (nopoint). Русские пользователи — заметная часть первых supporters.
- Маркетинг через Telegram (RU) + HN/Reddit/Twitter (EN) требует обе версии без halfasing.

## Russian register

**«Вы»** во всём публичном контенте. Без исключений.

- Не «ты» — это product про контроль и приватность; «Вы» сигнализирует уважение к границам.
- Не корпоративное «Вы» (без «уважаемый клиент»). Просто уважительное.
- Восклицательные знаки: никогда в product UI. Никогда в маркетинговых заголовках. Никогда в email-subjects. Максимум один в capability moments (например, «Indexed 847 files. Done!» — но и тут лучше без).

## English register

- "you" — never "u", never "ya'll", never "y'all".
- Active voice. Present tense.
- American spelling (organize, color), unless quoting British source.
- No "we" in product copy. Contexter speaks AS the archive, not as a company team. (Founder voice in occasional long-form is permitted.)

## Lowercase везде

UI labels — lowercase. Кнопки, секции, fields, navigation.

Examples:

- `open archive` (not `Open Archive`)
- `share with team` (not `Share with Team`)
- `private` (not `Private`)
- `general settings` (not `General Settings`)

Заголовки страниц — sentence case (первая буква предложения).
Заголовки blog/content — lowercase (consistent с Bayer universal alphabet, Zeitschrift PROSE pattern).

Acronyms — uppercase: `RAG`, `MCP`, `LLM`, `API`, `AI`, `URL`, `R2`.
Brand names — proper case: `Contexter`, `Meme`, `Public RAG`, `Shared Rooms`.

## Translation glossary (key terms)

| EN | RU |
|---|---|
| Archive | Архив |
| Memory layer | Слой памяти |
| Public RAG | Публичный RAG |
| Shared Room | Общая комната |
| Private | Приватный (state) / приватная (комната) |
| Drawer | Ящик |
| Shelf | Полка |
| Card | Карточка |
| Index | Индекс / индексировать |
| Chunk | Чанк (loanword, аудитория знает) |
| Vector | Вектор |
| Embedding | Эмбеддинг (loanword, аудитория знает) |
| Permission / access | Доступ |
| Visible to | Видна (видно) кому |
| Source | Источник |
| Search | Поиск |
| Find | Найти |
| Open | Открыть |
| Share | Поделиться |
| Move | Переместить |
| Tag | Метка / тег |
| Folder | Папка |
| Settings | Настройки |
| Account | Аккаунт |
| Subscription | Подписка |
| Upload | Загрузить |
| Download | Скачать |
| Export | Экспорт |
| Import | Импорт |
| Delete | Удалить |
| Restore | Восстановить |
| Empty | Пусто / пуст / пуста (per gender) |
| Loading | Просматриваю (Meme voice) / Загрузка (system voice) |
| Error | Ошибка / Не получилось (more direct in RU) |
| Owner | Владелец |
| Member | Участник |

## Anglicisms — when to keep, when to translate

**Keep (loanword in audience vocabulary):**
- chunk, embedding, vector, RAG, MCP, LLM, API, JSON, URL
- chat, prompt, model, agent
- public, private, shared (как technical states)

**Translate (clean Russian equivalent exists):**
- Settings → Настройки (не "сеттинги")
- Source → Источник (не "сорс")
- Memory → Память (не "мемори")
- Archive → Архив
- Folder → Папка
- Tag → Метка (default; "тег" допустимо)
- Search → Поиск
- Account → Аккаунт (loanword — устоялось)
- Subscription → Подписка
- Sign in / Log in → Войти
- Sign up → Зарегистрироваться

**Never translate:**
- Brand names: Contexter, Meme, Public RAG, Shared Rooms
- Product names of integrations: Claude, ChatGPT, Gemini, Perplexity, Pinecone, R2, pgvector
- Established AI/dev terms: RAG, MCP, LLM, API, IDE

## Capitalisation rules

| Element | EN | RU |
|---|---|---|
| Sentence | Sentence case | Sentence case |
| UI button | lowercase | lowercase |
| UI section header | lowercase | lowercase |
| Page title | Sentence case | Sentence case |
| Brand name | Proper case (Contexter, Meme) | Proper case (Контекстер, Мем) |
| Acronym | UPPERCASE (RAG, MCP, LLM) | UPPERCASE (RAG, MCP, LLM) |
| Email subject | Sentence case | Sentence case |
| Blog post title | lowercase | lowercase |
| Blog section header | lowercase | lowercase |
| Help article title | Sentence case | Sentence case |

## Exclamation marks

| Surface | Allowed |
|---|---|
| Product UI | NEVER |
| Marketing headlines | NEVER |
| Email subjects | NEVER |
| Error messages | NEVER |
| Onboarding steps | NEVER |
| Help/support | NEVER |
| Capability moments (e.g. milestone reached) | Maximum 1, only if absolutely earned |
| Founder long-form post (LinkedIn / blog) | Sparingly, when authentic |

## Em-dashes

EN body: 0 em-dashes. Use period or colon instead. Em-dash is the strongest AI marker — strip it.
RU body: тире разрешено как редкий элемент — но не злоупотреблять.

## Punctuation

- EN: American — period inside quotes ("done."), Oxford comma optional but consistent.
- RU: тире вместо запятой когда уместно («контекст — это память»). Кавычки «ёлочки» в literary contexts; "лапки" в technical/code.

## Numbers

- "32 files" / "32 файла" — not "thirty-two files".
- Specific decimals: "47 GB" / "47 ГБ".
- Time: "2 minutes 8 seconds" / "2 минуты 8 секунд".
- Percentages: "80%" / "80 %" (RU — пробел).

## Pronouns

- EN: "you", "your" throughout. "We" — only in occasional founder content. "Contexter" speaks as itself, not as team.
- RU: «Вы», «ваш». «Мы» — только в occasional founder content.

## When user is wrong (graceful)

If the user types a typo, an invalid file, or a wrong query:

EN:
- "Format not recognised. Try [list of supported]."
- "No matches in this archive. Try a different query."

RU:
- «Не открывается. Формат не понятен. Поддерживаются: [list].»
- «Совпадений нет. Попробуйте другой запрос.»

NEVER:
- "Oops!" / "Ой!" / "Упс!"
- "Something went wrong" / "Что-то пошло не так"
- "Please try again later" / "Пожалуйста, попробуйте позже"
- "Don't worry" / "Не беспокойтесь"

## When showing capability (calm pride)

EN:
- "Indexed 847 files. 8 minutes 22 seconds."
- "Archive ready. 47 GB across 3 shared rooms."
- "Available formats: 308."

RU:
- «Проиндексировано 847 файлов. 8 минут 22 секунды.»
- «Архив готов. 47 ГБ в 3 общих комнатах.»
- «Поддерживаются 308 форматов.»

Никаких «AMAZING!» / «WOW!» / «🎉🎉🎉».

## Domain-specific terminology

- "Context" — keep precise. Контекстер — это слой контекста, не platform / database / tool.
- "Memory" — это что хранится. Не AI который запоминает.
- "Sovereign" / "ownership" — used sparingly, in positioning copy specifically.
- "Layer" — категориальный термин Контекстера. «Слой контекста».
- "Surface" — UI plane (light / dark theme). «Поверхность».
- "Polus" / "пол" — Bauhaus concept (Weiß-polus / Gelb-polus). Used in design docs, not user-facing copy.
