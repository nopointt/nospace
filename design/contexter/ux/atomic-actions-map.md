# Contexter — Atomic User Actions Map
> Каждое действие пользователя → реакция экрана → результирующее состояние
> Источники: ui-ux-pro-max (UX guidelines), Bauhaus RAG, design system Contexter

---

## Flow 1 — Первый визит (Hero/Landing)

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 1.1 | Открывает URL | — | Загрузка страницы, skeleton → контент | `hero:loaded` |
| 1.2 | Наводит на "get started" | кнопка nav | bg-surface → accent hover (80ms) | `hero:cta-hover` |
| 1.3 | Кликает "get started" | кнопка nav | Scroll до drop zone, пульс border | `hero:drop-focus` |
| 1.4 | Наводит на "docs" | nav link | text-tertiary → text-primary (80ms) | — |
| 1.5 | Наводит на "pricing" | nav link | text-tertiary → text-primary (80ms) | — |
| 1.6 | Скроллит вниз | страница | Плавный scroll, nav sticky | `hero:scrolled` |

---

## Flow 2 — Загрузка файла (Drop Zone)

### 2a — Drag & Drop

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 2.1 | Перетаскивает файл НА страницу | window | Drop zone: border dashed → solid accent, bg-canvas → bg-surface, иконка scale up | `drop:drag-over` |
| 2.2 | Уводит файл ОТ страницы | window | Drop zone возвращается в idle | `drop:idle` |
| 2.3 | Отпускает файл В drop zone | drop zone | Flash accent border, файл появляется в списке ниже, pipeline запускается | `upload:processing` |
| 2.4 | Отпускает файл ВНЕ drop zone | window | Ничего, browser default prevented | `drop:idle` |
| 2.5 | Перетаскивает несколько файлов | drop zone | Счётчик "3 файла" в drop zone, все добавляются в очередь | `upload:batch-processing` |

### 2b — Click to Browse

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 2.6 | Кликает drop zone | drop zone area | Системный file picker открывается | `drop:picker-open` |
| 2.7 | Выбирает файл в picker | file picker | Picker закрывается, файл в списке, pipeline запуск | `upload:processing` |
| 2.8 | Отменяет picker | file picker | Ничего не меняется | `drop:idle` |

### 2c — Paste Text (Ctrl+V)

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 2.9 | Нажимает Ctrl+V с текстом в буфере | window | Toast: "текст вставлен · N символов", создаётся документ "вставленный текст · [дата]", pipeline запуск | `upload:processing` |
| 2.10 | Нажимает Ctrl+V с URL в буфере | window | Система определяет URL → если YouTube: парсинг субтитров. Если другой URL: парсинг страницы. Toast: "ссылка распознана" | `upload:processing` |
| 2.11 | Нажимает Ctrl+V пустой буфер | window | Ничего не происходит | — |

### 2d — Paste URL

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 2.12 | Вставляет YouTube URL | drop zone | Иконка YouTube + "загрузка субтитров..." badge processing | `upload:youtube-processing` |
| 2.13 | Вставляет обычный URL | drop zone | Иконка link + "парсинг страницы..." badge processing | `upload:url-processing` |

---

## Flow 3 — Pipeline Processing

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 3.1 | — (автоматически) | pipeline indicator | Стадии последовательно: parse ● → chunk ● → embed ● → index ●. Каждая стадия: pending → active (accent пульс) → done (black) | `upload:stage-N` |
| 3.2 | — (parse завершён) | extraction preview | Превью текста появляется справа, fade-in 250ms | `upload:parse-done` |
| 3.3 | — (chunk завершён) | stats | "N чанков" обновляется | `upload:chunk-done` |
| 3.4 | — (embed завершён) | stats | "N векторов" обновляется | `upload:embed-done` |
| 3.5 | — (index завершён) | document row | Badge: processing → ready (зелёный). Весь pipeline = done | `upload:complete` |
| 3.6 | — (ошибка на стадии) | pipeline indicator + error | Стадия: active → error (красный). Error card inline: "ошибка: [описание]" + "повторить" кнопка | `upload:error` |
| 3.7 | Кликает "повторить" | error card | Pipeline перезапускается с failed стадии | `upload:retrying` |

---

## Flow 4 — Upload Edge Cases

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 4.1 | Загружает неподдерживаемый формат | drop zone | Error inline: "формат .exe не поддерживается" + список поддерживаемых | `upload:format-error` |
| 4.2 | Загружает файл >100 MB | drop zone | Error inline: "файл превышает лимит 100 мб. разбейте на части." | `upload:size-error` |
| 4.3 | Загружает при нет сети | drop zone | Error inline: "нет подключения к интернету. проверьте соединение." | `upload:network-error` |
| 4.4 | Достигает rate limit (Jina API) | pipeline | Warning (жёлтый): "лимит api. обработка продолжится через N секунд." Pipeline paused, auto-retry | `upload:rate-limited` |
| 4.5 | Загружает пустой файл | drop zone | Error inline: "файл пустой. загрузите файл с содержимым." | `upload:empty-error` |
| 4.6 | Загружает дубликат | drop zone | Warning: "файл уже загружен. загрузить повторно?" + да/нет | `upload:duplicate-warning` |

---

## Flow 5 — Dashboard: Documents

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 5.1 | Открывает /dashboard | — | Загрузка: skeleton таблица → данные. Stats считаются. | `dash:loaded` |
| 5.2 | Наводит на строку таблицы | table row | bg-canvas → interactive-hover (80ms) | `dash:row-hover` |
| 5.3 | Кликает строку документа | table row | Правая панель: переключается на детали документа (чанки, метаданные, превью). Left border accent на выбранной строке | `dash:doc-selected` |
| 5.4 | Наводит на badge статуса | badge | Tooltip: "обработан [дата] · [время]" | — |
| 5.5 | — (нет документов) | table area | Empty state: "документов пока нет.\nзагрузите первый файл." + кнопка "загрузить" | `dash:empty` |
| 5.6 | Кликает "загрузить" в empty state | кнопка | Переход на hero/upload flow или модальный drop zone | `upload:idle` |

---

## Flow 6 — Dashboard: Document Details

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 6.1 | Выбрал документ (5.3) | right panel | Показывает: имя, тип, размер, дата, чанки (count), pipeline timing | `doc-detail:overview` |
| 6.2 | Кликает "чанки" tab | tab | Список чанков: chunk #1, #2... с превью текста (первые 2 строки) | `doc-detail:chunks` |
| 6.3 | Кликает конкретный чанк | chunk row | Раскрывается полный текст чанка + metadata (tokens, embedding dim) | `doc-detail:chunk-expanded` |
| 6.4 | Кликает "удалить документ" | danger button | Confirm dialog: "удалить [имя]? чанки и векторы будут удалены." + отмена/удалить | `doc-detail:delete-confirm` |
| 6.5 | Подтверждает удаление | confirm button | Документ исчезает из таблицы (fade-out 250ms), stats обновляются, правая панель → empty | `dash:doc-deleted` |
| 6.6 | Отменяет удаление | cancel button | Dialog закрывается | `doc-detail:overview` |

---

## Flow 7 — Dashboard: Query Panel

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 7.1 | Кликает input запроса | query input | Border: default → accent (2px). Placeholder исчезает | `query:focused` |
| 7.2 | Вводит текст запроса | query input | Текст появляется, кнопка "спросить" активируется (ghost → primary) | `query:typing` |
| 7.3 | Нажимает Enter / кнопку | input / button | Input disabled, skeleton answer появляется. Запрос отправляется | `query:loading` |
| 7.4 | — (ответ получен) | answer area | Skeleton → текст ответа (fade-in 250ms). Источники появляются ниже с scores | `query:answered` |
| 7.5 | Кликает на источник | source row | Расширяется: показывает полный текст чанка + документ-origin + score breakdown | `query:source-expanded` |
| 7.6 | Отправляет пустой запрос | input | Ничего, кнопка disabled | — |
| 7.7 | — (ошибка при запросе) | answer area | Error card: "не удалось получить ответ. повторите запрос." | `query:error` |
| 7.8 | — (нет релевантных источников) | answer area | "по вашему запросу ничего не найдено. попробуйте переформулировать." | `query:no-results` |

---

## Flow 8 — API & Подключение

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 8.1 | Кликает tab "api" в nav | nav | Контент меняется на API page | `api:overview` |
| 8.2 | Видит API endpoint | code block | Показывает: POST URL, curl пример, token. Кнопка "скопировать" | `api:overview` |
| 8.3 | Кликает "скопировать" | copy button | Текст скопирован, кнопка: "скопировать" → "скопировано ✓" (2s) → "скопировать" | `api:copied` |
| 8.4 | Кликает "создать токен" | button | Новый токен генерируется, показывается один раз. Warning: "сохраните токен, он больше не будет показан" | `api:token-created` |
| 8.5 | Кликает "создать ссылку для шеринга" | button | Share URL генерируется. Scope selector: все документы / выбранные. Read-only badge | `api:share-created` |
| 8.6 | Кликает "удалить токен" | danger link | Confirm: "отозвать доступ?" → токен удалён | `api:token-revoked` |

---

## Flow 9 — Настройки

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 9.1 | Кликает tab "настройки" | nav | Settings page: профиль, лимиты, danger zone | `settings:overview` |
| 9.2 | Видит usage stats | info block | Документов: N/лимит, чанков: N/лимит, запросов: N/день | `settings:overview` |
| 9.3 | Кликает "удалить все данные" | danger button | Confirm: "удалить ВСЕ документы, чанки и векторы? это необратимо." | `settings:delete-all-confirm` |
| 9.4 | Подтверждает удаление всего | confirm | Все данные удалены, redirect на dashboard empty state | `dash:empty` |

---

## Flow 10 — Auth (First Time)

| # | Действие | Элемент | Реакция экрана | Состояние |
|---|---|---|---|---|
| 10.1 | Первый upload без auth | drop zone | После upload: modal "создайте аккаунт чтобы сохранить" + email input + "продолжить" | `auth:register-prompt` |
| 10.2 | Вводит email | input | Валидация inline. Кнопка активируется | `auth:email-entered` |
| 10.3 | Кликает "продолжить" | button | Magic link отправлен. "Проверьте почту — мы отправили ссылку." | `auth:magic-link-sent` |
| 10.4 | Переходит по magic link | email link | Auto-login, redirect на dashboard с загруженным файлом | `dash:loaded` |
| 10.5 | Возвращается на сайт (уже auth) | — | Auto-login по cookie/token, dashboard | `dash:loaded` |

---

## Screen States Summary

| Экран | Состояния |
|---|---|
| **Hero** | `loaded`, `scrolled`, `drop-focus`, `cta-hover` |
| **Drop Zone** | `idle`, `drag-over`, `picker-open`, `format-error`, `size-error`, `network-error`, `empty-error`, `duplicate-warning` |
| **Upload** | `processing`, `batch-processing`, `youtube-processing`, `url-processing`, `stage-N`, `parse-done`, `chunk-done`, `embed-done`, `complete`, `error`, `retrying`, `rate-limited` |
| **Dashboard** | `loaded`, `empty`, `row-hover`, `doc-selected`, `doc-deleted` |
| **Document Detail** | `overview`, `chunks`, `chunk-expanded`, `delete-confirm` |
| **Query** | `focused`, `typing`, `loading`, `answered`, `source-expanded`, `error`, `no-results` |
| **API** | `overview`, `copied`, `token-created`, `share-created`, `token-revoked` |
| **Settings** | `overview`, `delete-all-confirm` |
| **Auth** | `register-prompt`, `email-entered`, `magic-link-sent` |

**Итого: 9 экранов, ~45 уникальных состояний**
