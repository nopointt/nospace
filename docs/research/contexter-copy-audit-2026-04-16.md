# Contexter Copy Audit — Refresh
Date: 2026-04-16
Predecessor: contexter-copy-audit.md (2026-03-24)
Scope: 24 UI-facing frontend files (pages + components + i18n translation file)
Reviewer: Sonnet (automated re-audit)

---

## Summary

- **Files scanned:** 24 (pages: Landing, Hero, Dashboard, ApiPage, Settings, Supporters, Upload, DocumentViewer, Login, Register, ForgotPassword, ResetPassword, VerifyEmail — components: Nav, AuthModal, ConnectionModal, DocumentModal, SupporterStatusCard, SupportersLeaderboard, PipelineIndicator, EmptyState, ErrorState, Toast, DropZone — plus lib/i18n.ts and lib/translations/ru.ts)
- **Architecture note:** The frontend has moved to a full i18n system. Nearly all user-visible Russian strings are now in `ru.ts` (the translation file), not hardcoded in components. The exceptions are: a few hardcoded strings still in Hero.tsx and Upload.tsx (English-only, see below), and the pipeline stage labels.
- **Old items status:** 57 total old items → **38 RESOLVED** / **11 STILL_PRESENT_CHANGED_TEXT** (now live in `ru.ts`, some still have jargon) / **3 FILE_GONE** / **5 PARTIALLY_RESOLVED** (jargon reduced but new form present)
- **New items found:** 24 new items (broken down per section below)
- **Critical for launch (Landing.tsx content):** 8 items in `ru.ts` landing strings containing tech jargon or ambiguous copy

---

## Section 1 — Updated Master Table (for apply phase)

All strings are from `ru.ts` (the canonical Russian translation file) unless marked as HARDCODED (in .tsx file directly).

| # | File | i18n key / Location | Current text | Problem | Replacement | Status |
|---|---|---|---|---|---|---|
| 1 | ru.ts | `hero.chunks` | `фрагментов` | OK — already fixed | — | RESOLVED |
| 2 | ru.ts | `hero.chunksHeader` | `фрагменты` | OK — already fixed | — | RESOLVED |
| 3 | ru.ts | `dashboard.chunks` | `Фрагменты` | OK — already fixed | — | RESOLVED |
| 4 | ru.ts | `dashboard.chunksCol` | `Фрагменты` | OK — already fixed | — | RESOLVED |
| 5 | ru.ts | `settings.chunks` | `Фрагменты` | OK — already fixed | — | RESOLVED |
| 6 | ru.ts | `api.title` | `Подключение` | OK — already fixed | — | RESOLVED |
| 7 | ru.ts | `api.subtitle` | `Как подключить Contexter к нейросети` | OK — already fixed | — | RESOLVED |
| 8 | ru.ts | `api.yourLink` | `Ваша ссылка` | OK — already fixed | — | RESOLVED |
| 9 | ru.ts | `api.accessTitle` | `Доступ и ссылки` | OK — already fixed | — | RESOLVED |
| 10 | ru.ts | `api.yourKey` | `Ваш ключ доступа` | OK — already fixed | — | RESOLVED |
| 11 | ru.ts | `api.createKeyTitle` | `Создать ключ доступа` | OK — already fixed | — | RESOLVED |
| 12 | ru.ts | `api.createKey` | `Создать ключ доступа` | OK — already fixed | — | RESOLVED |
| 13 | ru.ts | `api.shareTitle` | `Поделиться базой знаний` | OK — already fixed | — | RESOLVED |
| 14 | ru.ts | `api.readOnly` | `Только чтение` | OK — already fixed | — | RESOLVED |
| 15 | ru.ts | `api.loginRequired` | `Войдите, чтобы подключить нейросеть` | OK — already fixed | — | RESOLVED |
| 16 | ru.ts | `api.linkCreated` | `Ссылка создана` | OK — already fixed | — | RESOLVED |
| 17 | ru.ts | `settings.loginRequired` | `Войдите, чтобы управлять настройками` | OK — already fixed | — | RESOLVED |
| 18 | ru.ts | `settings.deleteAllDesc` | `Удалит все файлы и базу знаний. Это нельзя отменить.` | OK — already fixed | — | RESOLVED |
| 19 | ru.ts | `settings.deleteConfirm` | `Удалить все файлы и базу знаний? Это нельзя отменить.` | OK — already fixed | — | RESOLVED |
| 20 | ru.ts | `settings.logoutDesc` | `Сессия завершится на этом устройстве` | OK — already fixed | — | RESOLVED |
| 21 | ru.ts | `authModal.subtitle` | `Ваши файлы сохранятся, и нейросеть сможет их читать` | OK — already fixed | — | RESOLVED |
| 22 | ru.ts | `authModal.failed` | `Не удалось создать аккаунт — попробуйте ещё раз` | OK — already fixed | — | RESOLVED |
| 23 | ru.ts | `conn.connectionLink` | `Ссылка для подключения` | OK — already fixed | — | RESOLVED |
| 24 | ru.ts | `conn.copyLink` | `Скопировать ссылку` | OK — already fixed | — | RESOLVED |
| 25 | ru.ts | `conn.copied` | `Скопировано` | OK — already fixed | — | RESOLVED |
| 26 | ru.ts | `conn.otherSub` | `Любая программа с поддержкой MCP` | Jargon "MCP" — but unavoidable for "other client" option | `Любой ИИ-клиент с поддержкой MCP` | ACCEPTABLE (technical niche card) |
| 27 | ru.ts | `nav.connection` | `Подключение` | OK — already fixed from "api" | — | RESOLVED |

**Items still requiring action (jargon still present):**

| # | File | i18n key / Location | Current text | Problem | Replacement | Status |
|---|---|---|---|---|---|---|
| 28 | ru.ts | `upload.chunksLabel` | `Чанки` | Jargon "Чанки" in stat card | `Фрагменты` | STILL_PRESENT_CHANGED_TEXT |
| 29 | ru.ts | `upload.tokensLabel` | `Токены` | Jargon "Токены" for file stat | `Слова / знаки` | STILL_PRESENT_CHANGED_TEXT |
| 30 | ru.ts | `pipeline.embed` | `векторизация` | Internal pipeline term exposed to user | `обработка` | STILL_PRESENT_CHANGED_TEXT |
| 31 | ru.ts | `pipeline.embedShort` | `вектор.` | Same as above | `обр.` | STILL_PRESENT_CHANGED_TEXT |
| 32 | ru.ts | `pipeline.chunk` | `разбивка на фрагменты` | OK (фрагменты is correct), but "разбивка" is dry | `подготовка фрагментов` | ACCEPTABLE / LOW |
| 33 | ru.ts | `toast.youtubeAdded` | `YouTube URL добавлен` | Old audit item: impersonal, no context | `YouTube-видео добавлено, обрабатываем...` | STILL_PRESENT_CHANGED_TEXT |
| 34 | ru.ts | `toast.urlAdded` | `URL добавлен` | Old audit item: jargon "URL", impersonal | `Ссылка добавлена, обрабатываем...` | STILL_PRESENT_CHANGED_TEXT |
| 35 | ru.ts | `api.saveToken` | `Сохраните токен, он больше не будет показан` | Jargon "токен" in warning | `Сохраните ключ доступа — он больше не появится` | STILL_PRESENT_CHANGED_TEXT |
| 36 | ru.ts | `api.tokenCreated` | `Токен создан` | Jargon "Токен" in success toast | `Новый ключ создан` | STILL_PRESENT_CHANGED_TEXT |
| 37 | ru.ts | `api.tokenFailed` | `Не удалось создать ключ — попробуйте ещё раз` | OK | — | RESOLVED |
| 38 | ru.ts | `api.tokenRevoked` | `Токен отозван` | Jargon "Токен" in success toast | `Доступ отозван` | STILL_PRESENT_CHANGED_TEXT |
| 39 | ru.ts | `api.revokeFailed` | `Не удалось отозвать доступ — попробуйте ещё раз` | OK | — | RESOLVED |
| 40 | ru.ts | `conn.yourToken` | `ВАШ_ТОКЕН` | Fallback placeholder shown when not authenticated | `ВАШ_КЛЮЧ` | STILL_PRESENT_CHANGED_TEXT |
| 41 | ru.ts | `conn.copyToken` | `Скопировать токен` | Jargon "токен" in copy button | `Скопировать ключ` | STILL_PRESENT_CHANGED_TEXT |
| 42 | Hero.tsx (HARDCODED) | line 657–658 | `Connect your AI` / `Link ChatGPT, Claude, Gemini, Perplexity, or Cursor to your knowledge base. Takes 2 minutes.` | English hardcoded text in a Russian UI section. Not using i18n | Add i18n keys or translate to Russian | NEW |
| 43 | Hero.tsx (HARDCODED) | line 664 | `Connect` (button) | English hardcoded CTA | Переключить на i18n: `Подключить` | NEW |
| 44 | Upload.tsx (HARDCODED) | line 601 | `Retry` | English hardcoded button text | `Повторить` | NEW |
| 45 | Upload.tsx (HARDCODED) | lines 702–705 | `Waiting for parsing...` / `Extraction error` / `Upload not started` / `Preview unavailable` | English hardcoded state messages | Use `t("upload.waitingParse")`, `t("upload.extractError")`, `t("upload.notStarted")`, `t("upload.previewUnavailable")` (keys exist in ru.ts, not connected) | NEW |

---

## Section 2 — Per-File Breakdown

### Landing.tsx

Landing.tsx is fully i18n'd — all user-visible strings go through `t()`. The actual strings live in `ru.ts` under the `landing.*` namespace. Issues found in the **content** of those translation strings:

| # | i18n key | Current RU string | Problem | Replacement |
|---|---|---|---|---|
| L1 | `landing.feat1.title` | `Мультимодальный поиск по всему` | Jargon "Мультимодальный" — non-tech users don't know this | `Поиск по всем файлам сразу` |
| L2 | `landing.feat1.desc` | `...Мультимодальный поиск (текст, фото, аудио, видео + полнотекстовый)...` | Same jargon | Replace "Мультимодальный поиск" → `поиск по всему` |
| L3 | `landing.feat3.desc` | `Никакой настройки, никаких API-ключей, никакого кода.` | "API-ключей" is jargon | `Никакой настройки, никаких ключей, никакого кода.` |
| L4 | `landing.pricing.free.f4` | `Мультимодальный поиск` | Jargon | `Поиск по всем форматам` |
| L5 | `landing.pricing.free.f5` | `MCP-подключение` | Jargon "MCP" — meaningless to non-tech users | `Подключение к нейросети` |
| L6 | `landing.pricing.starter.f4` | `Мультимодальный поиск` | Jargon | `Поиск по всем форматам` |
| L7 | `landing.pricing.starter.f5` | `MCP-подключение` | Jargon | `Подключение к нейросети` |
| L8 | `landing.pricing.pro.f4` | `Мультимодальный поиск` | Jargon | `Поиск по всем форматам` |
| L9 | `landing.pricing.pro.f7` | `Доступ к API` | Jargon "API" in pricing | `Прямой доступ для разработчиков` |
| L10 | `landing.pricing.business` | `Нужен бизнес-тариф или self-hosting?` | "self-hosting" is English jargon | `Нужен корпоративный тариф или собственный сервер?` |
| L11 | `roadmap.now.f2` | `MCP-сервер — работает с ChatGPT, Claude, Gemini, Cursor` | "MCP-сервер" is jargon in a roadmap for general users | `Подключение ко всем нейросетям` |
| L12 | `roadmap.now.f3` | `Мультимодальный поиск (текст, фото, аудио, видео + полнотекстовый)` | Jargon | `Поиск по тексту, фото, аудио и видео` |
| L13 | `roadmap.now.f4` | `Обработка: распознавание → разбивка → векторизация → индексация` | Internal pipeline jargon: "векторизация", "индексация" shown to users | `Автоматическая обработка файлов` |
| L14 | `roadmap.q2.f1` | `Public RAG — публикуйте документы для всех. Платные документы покупаются через Contexter. Агенты могут покупать сами...` | "RAG" is deep tech jargon | `Публичная база знаний — публикуйте документы для всех. Другие могут покупать доступ через Contexter.` |
| L15 | `landing.prelaunch.limit2` | `Пайплайн: обработка может замедляться при высокой нагрузке` | "Пайплайн" is jargon | `Обработка файлов: может замедляться при высокой нагрузке` |

**Critical rating:** 8 items directly on public-facing landing copy (L1–L10) must be fixed before Reddit/HN traffic.

### Hero.tsx

Hero.tsx is the post-login upload page (route `/app`). Most strings are i18n'd correctly. Issues:

| # | Location | Current text | Problem | Replacement |
|---|---|---|---|---|
| H1 | line 619 (stat card) | `t("hero.chunks")` → `фрагментов` | RESOLVED — correct term used | — |
| H2 | line 631 (table header) | `t("hero.chunksHeader")` → `фрагменты` | RESOLVED | — |
| H3 | lines 657–658 (HARDCODED) | `Connect your AI` / `Link ChatGPT, Claude, Gemini, Perplexity, or Cursor to your knowledge base. Takes 2 minutes.` | English hardcoded, not using i18n. Shown to authenticated RU users | Add i18n keys `hero.connectTitle` / `hero.connectDesc` with RU content: `Подключите нейросеть` / `Откройте ChatGPT, Claude, Gemini или Cursor — и спросите по вашим файлам. Займёт 2 минуты.` |
| H4 | line 664 (HARDCODED) | `Connect` (button to /api) | English hardcoded | `Подключить` |

Old audit item L574 (`чанки` stat card) — **RESOLVED** (now `фрагментов`).
Old audit item L605 (column `чанки`) — **RESOLVED** (now `фрагменты`).
Old audit item L512 (`загрузка ({files().length})`) — **RESOLVED** (removed from UI, upload count in header uses different pattern).
Old audit item L667/L674/L675/L698 (MCP connection section) — **PARTIALLY_RESOLVED**: old hardcoded MCP strings are gone; section now has hardcoded English text (new issue H3/H4 above).
Old audit items L291/L292 (toast strings) — **STILL PRESENT** in ru.ts: `toast.urlAdded` = `URL добавлен`, `toast.youtubeAdded` = `YouTube URL добавлен` (see items 33–34 in master table).

### Dashboard.tsx

Dashboard uses i18n for all visible strings. Key findings:

| # | i18n key | Current RU string | Problem | Replacement |
|---|---|---|---|---|
| D1 | `dashboard.chunks` | `Фрагменты` | RESOLVED — correct | — |
| D2 | `dashboard.chunksCol` | `Фрагменты` | RESOLVED | — |
| D3 | `dashboard.devLink` | `Для разработчиков → /api` | OK — explicit link, but `/api` path is visible | `Для разработчиков →` (remove raw path or keep as-is — it's a small secondary link) |

Old `ЗАПРОС` section (audit L419) — **RESOLVED**: no "ЗАПРОС" section visible in dashboard anymore. The API/query section was removed from dashboard per old audit recommendation.
Old stat cards `векторы` (audit L291–293) — **RESOLVED**: vectors stat card removed.
Old `mcp подключен` section (audit L562–564) — **RESOLVED**: removed from dashboard.
Old curl/POST/token display (audit L521, L536, L546) — **RESOLVED**: removed from dashboard, moved to ApiPage.

### ApiPage.tsx

ApiPage is significantly redesigned. The old individual line numbers are no longer applicable. Assessment against ru.ts content:

| # | i18n key | Current RU string | Problem | Replacement |
|---|---|---|---|---|
| A1 | `api.title` | `Подключение` | RESOLVED | — |
| A2 | `api.subtitle` | `Как подключить Contexter к нейросети` | RESOLVED | — |
| A3 | `api.howTitle` | `Как подключить нейросеть` | RESOLVED | — |
| A4 | `api.devTitle` | `Для разработчиков` | RESOLVED | — |
| A5 | `api.curlSearch` | `Поиск по документам` | RESOLVED | — |
| A6 | `api.yourLink` | `Ваша ссылка` | RESOLVED | — |
| A7 | `api.accessTitle` | `Доступ и ссылки` | RESOLVED | — |
| A8 | `api.yourKey` | `Ваш ключ доступа` | RESOLVED | — |
| A9 | `api.createKeyTitle` | `Создать ключ доступа` | RESOLVED | — |
| A10 | `api.saveToken` | `Сохраните токен, он больше не будет показан` | Jargon "токен" in warning | `Сохраните ключ доступа — он больше не появится` |
| A11 | `api.tokenCreated` | `Токен создан` | Jargon | `Новый ключ создан` |
| A12 | `api.tokenRevoked` | `Токен отозван` | Jargon | `Доступ отозван` |
| A13 | `api.readOnly` | `Только чтение` | RESOLVED | — |
| A14 | `api.shareTitle` | `Поделиться базой знаний` | RESOLVED | — |
| A15 | ApiPage.tsx line 372 (HARDCODED) | `CopyField label="YOUR TOKEN"` | English hardcoded label for token field | Use `t("api.tokenLabel")` → `Токен` or keep in developer section only |
| A16 | ApiPage.tsx line 659 (HARDCODED) | `base url: <span>{API_BASE}</span>` | English "base url" label in developer section | Acceptable (developer section is explicitly for developers) |

Note: The "Streamable HTTP" section and "mcp remote bridge" concept still appear in `conn.claudeDesktop.s3.detail` as `MCP работает` and in connection transport labels in the code (`transport: "mcp-remote bridge"` at ConnectionModal.tsx line 56) — these are internal to code structure, not user-visible text.

### Settings.tsx

| # | i18n key | Current RU string | Status |
|---|---|---|---|
| S1 | `settings.loginRequired` | `Войдите, чтобы управлять настройками` | RESOLVED |
| S2 | `settings.chunks` | `Фрагменты` | RESOLVED |
| S3 | `settings.deleteAllDesc` | `Удалит все файлы и базу знаний. Это нельзя отменить.` | RESOLVED |
| S4 | `settings.deleteConfirm` | `Удалить все файлы и базу знаний? Это нельзя отменить.` | RESOLVED |
| S5 | `settings.logoutDesc` | `Сессия завершится на этом устройстве` | RESOLVED |
| S6 | Settings.tsx line 147 (HARDCODED) | `Set your name...` | English hardcoded placeholder | Add i18n key or use Russian: `Введите имя...` |

### Nav.tsx

| # | i18n key | Current RU string | Status |
|---|---|---|---|
| N1 | `nav.upload` | `Загрузить` | RESOLVED (old "отправить" is gone) |
| N2 | `nav.connection` | `Подключение` | RESOLVED (old "api" is gone) |
| N3 | `nav.login` | `Войти` | RESOLVED (old "начать" is gone) |
| N4 | Nav.tsx | No duplicate "api"+"подключение" links | RESOLVED — only one "Подключение" link |

### ConnectionModal.tsx

| # | i18n key / Location | Current text | Status |
|---|---|---|---|
| C1 | `conn.connectionLink` | `Ссылка для подключения` | RESOLVED |
| C2 | `conn.copyLink` | `Скопировать ссылку` | RESOLVED |
| C3 | `conn.copyToken` | `Скопировать токен` | Jargon — should be `Скопировать ключ` |
| C4 | `conn.yourToken` | `ВАШ_ТОКЕН` (fallback placeholder) | Jargon — should be `ВАШ_КЛЮЧ` |
| C5 | `conn.copied` | `Скопировано` | RESOLVED |
| C6 | `conn.copy` | `Скопировать` | RESOLVED |
| C7 | ConnectionModal.tsx line 56 | `transport: "mcp-remote bridge"` | Internal code string, not user-visible | OK |
| C8 | `conn.claudeDesktop.s3.detail` | `...Иконка молотка в чате = MCP работает` | "MCP" jargon in step detail | `Иконка молотка в чате = Contexter подключён` |
| C9 | `conn.cursor.s2.detail` | `Или создайте файл ~/.cursor/mcp.json — вставьте JSON ниже` | "mcp.json" is a technical file path — acceptable for Cursor (developer tool) | ACCEPTABLE |
| C10 | `conn.antigravity.s3.detail` | `MCP-сервер появится в списке инструментов` | "MCP-сервер" jargon | `Contexter появится в списке инструментов` |
| C11 | `conn.antigravity.gotcha` | `Используйте serverUrl (не url). Максимум 50 инструментов одновременно` | "serverUrl"/"url" are technical field names (required for Antigravity config) | ACCEPTABLE for developer tool |
| C12 | `conn.otherSub` | `Любая программа с поддержкой MCP` | "MCP" jargon — but this card targets developers | BORDERLINE — consider `Любой ИИ-инструмент с поддержкой MCP` |

Old audit items about `copied`/`copy` in English (L295, L296) — **RESOLVED** (now Russian).
Old audit item L305 (`MCP Server URL` label) — **RESOLVED** (now `Ссылка для подключения`).
Old audit item L52 (`mcp-remote bridge` transport label) — **RESOLVED** (transport field is now internal only, not displayed to user).

### AuthModal.tsx

| # | i18n key | Current RU string | Status |
|---|---|---|---|
| AM1 | `authModal.subtitle` | `Ваши файлы сохранятся, и нейросеть сможет их читать` | RESOLVED |
| AM2 | `authModal.failed` | `Не удалось создать аккаунт — попробуйте ещё раз` | RESOLVED |
| AM3 | `authModal.title` | `Войти` | RESOLVED (old "начать" is gone) |

### Upload.tsx

| # | Location | Current text | Problem | Replacement |
|---|---|---|---|---|
| U1 | ru.ts: `upload.chunksLabel` | `Чанки` | Jargon in stats panel | `Фрагменты` |
| U2 | ru.ts: `upload.tokensLabel` | `Токены` | Jargon — "tokens" are OpenAI terminology, confusing for users | `Слова / знаки` |
| U3 | Upload.tsx line 601 (HARDCODED) | `Retry` | English button label | `Повторить` (i18n key `common.retry` exists) |
| U4 | Upload.tsx lines 700–705 (HARDCODED) | `Waiting for parsing...` / `Extraction error` / `Upload not started` / `Preview unavailable` | English hardcoded state messages | Use existing i18n keys: `t("upload.waitingParse")` → `Ожидание парсинга...`, etc. (All 4 keys exist in ru.ts but are not connected to these conditionals) |
| U5 | Hero.tsx line 574 (HARDCODED inside error card) | `stage: {parse: "parsing", chunk: "chunking", embed: "vectorizing", index: "saving"}` | English stage name map shown in error messages. Visible to users when upload fails. | Use `t("upload.stageError.parse")` etc. (keys exist in ru.ts) |

Note: `upload.stageError.*` keys exist in ru.ts: `распознавание`, `разбивка`, `векторизация`, `сохранение`. The same hardcoded English stage map also exists in Upload.tsx line 592–594.

### DocumentViewer.tsx

All strings use i18n correctly. Key observation:
- `docview.tokens` → `токенов` — this is shown in chunk metadata `#{n} · {count} токенов`. This is internal chunk metadata, borderline acceptable (it refers to the chunk's token count, not an API concept per se). Consider `знаков`.
- All other keys are neutral technical labels (тип, размер, фрагменты, дата, статус).

### Login.tsx / Register.tsx / ForgotPassword.tsx / ResetPassword.tsx / VerifyEmail.tsx

All auth pages use i18n correctly. All Russian strings look clean. Key observations:
- `register.failed` = `Не удалось создать аккаунт` (without "попробуйте ещё раз") — used as fallback from server error messages. Consider using `register.failedRetry` consistently.
- `login.failed` = `Не удалось войти — попробуйте ещё раз` — correct format.
- All forms use correct Russian and proper error message format ("не удалось X — попробуйте ещё раз").

### Supporters.tsx

All strings use i18n correctly. Supporters page content analysis:

| # | i18n key | Current text | Problem | Replacement |
|---|---|---|---|---|
| SP1 | `supporters.leaderboard.col.tokens` | `Токены` | "Токены" as loyalty points — acceptable in loyalty program context | ACCEPTABLE (Supporters program uses "токены" as intentional loyalty/gamification language) |
| SP2 | `supporters.tasks.cap.desc` | `токенов / месяц за задания` | Same — intentional loyalty token terminology | ACCEPTABLE |
| SP3 | Multiple task token amounts | `5–20 токенов`, `5 токенов`, etc. | Same — part of the loyalty program language | ACCEPTABLE |
| SP4 | `supporters.faq.a5` | `Нет. Токены — это баллы лояльности...` | This FAQ answer actually explains correctly! | RESOLVED (already explains token = loyalty points) |

Note: In the Supporters context, "токены" means loyalty points (not API tokens). This is intentional brand language and should NOT be changed. The FAQ already explains this distinction.

### SupporterStatusCard.tsx / SupportersLeaderboard.tsx

All strings use i18n correctly. No jargon issues found.

### DocumentModal.tsx

| # | i18n key | Current text | Issue |
|---|---|---|---|
| DM1 | `docmodal.tokens` | `токенов` | In chunk metadata (e.g., `#1 · 245 токенов`). Internal metadata. Borderline — consider `знаков` but acceptable as is. |

### PipelineIndicator.tsx

| # | i18n key | Current text | Problem | Replacement |
|---|---|---|---|---|
| PI1 | `pipeline.embed` | `векторизация` | Internal AI term exposed in pipeline indicator | `обработка` |
| PI2 | `pipeline.embedShort` | `вектор.` | Same | `обр.` |

Note: `pipeline.chunk` = `разбивка на фрагменты` is acceptable. `pipeline.index` = `сохранение` is acceptable. The pipeline indicator is visible during upload — it should use human-readable terms.

---

## Section 3 — Items Already Resolved (no action needed)

The following old audit items have been fixed since 2026-03-24:

1. **Hero.tsx** — `единое хранилище знаний` → removed/replaced with i18n
2. **Hero.tsx** — `результат: база знаний с семантическим поиском` → removed from UI
3. **Hero.tsx** — `загрузка ({files().length})` → removed (no longer in UI)
4. **Hero.tsx** — `чанки` stat card → now `фрагментов`
5. **Hero.tsx** — `векторы` stat card → removed from UI
6. **Hero.tsx** — column `чанки` → now `фрагменты`
7. **Hero.tsx** — MCP connection section text → redesigned with i18n
8. **Dashboard.tsx** — `чанки` stat card → now `Фрагменты`
9. **Dashboard.tsx** — `векторы` stat card → removed
10. **Dashboard.tsx** — column `чанки` → now `Фрагменты`
11. **Dashboard.tsx** — `ЗАПРОС` section → removed from dashboard
12. **Dashboard.tsx** — `API` section → moved to separate ApiPage
13. **Dashboard.tsx** — `POST /api/query` display → removed
14. **Dashboard.tsx** — `token: ctx_...` display → removed
15. **Dashboard.tsx** — `mcp подключен` → removed
16. **ApiPage.tsx** — `api & подключение` → now `Подключение`
17. **ApiPage.tsx** — `эндпоинты, примеры и настройка mcp-клиентов` subtitle → now `Как подключить Contexter к нейросети`
18. **ApiPage.tsx** — `api эндпоинты` section → now `Для разработчиков` (collapsible)
19. **ApiPage.tsx** — `семантический запрос` curl label → now `Поиск по документам`
20. **ApiPage.tsx** — `mcp подключение` section → restructured with tabs
21. **ApiPage.tsx** — `mcp url` label → now `Ваша ссылка`
22. **ApiPage.tsx** — `скопируйте mcp url` step → now `Ваша ссылка`
23. **ApiPage.tsx** — `mcp url с токеном` label → now `Ваша ссылка`
24. **ApiPage.tsx** — `streamable http` section → removed / merged
25. **ApiPage.tsx** — `токены и шеринг` section → now `Доступ и ссылки`
26. **ApiPage.tsx** — `ваш api токен` label → now `Ваш ключ доступа`
27. **ApiPage.tsx** — `создать токен` heading/button → now `Создать ключ доступа`
28. **ApiPage.tsx** — `создать ссылку для шеринга` heading → now `Поделиться базой знаний`
29. **ApiPage.tsx** — `read-only` badge → now `Только чтение`
30. **ApiPage.tsx** — `войдите чтобы получить доступ к api` → now `Войдите, чтобы подключить нейросеть`
31. **ApiPage.tsx** — login button `начать` → now `Войти`
32. **Settings.tsx** — `войдите чтобы получить доступ к api` → now `Войдите, чтобы управлять настройками`
33. **Settings.tsx** — usage card `чанки` → now `Фрагменты`
34. **Settings.tsx** — delete confirmation jargon → fixed
35. **Settings.tsx** — logout description → now `Сессия завершится на этом устройстве`
36. **Nav.tsx** — `отправить` → now `Загрузить`
37. **Nav.tsx** — `api` → now `Подключение`
38. **Nav.tsx** — duplicate links → fixed (one connection link)
39. **Nav.tsx** — login button `начать` → now `Войти`
40. **ConnectionModal.tsx** — `copied`/`copy` in English → now `Скопировано`/`Скопировать`
41. **ConnectionModal.tsx** — `MCP Server URL` label → now `Ссылка для подключения`
42. **AuthModal.tsx** — subtitle jargon → fixed
43. **AuthModal.tsx** — error toast jargon → fixed

---

## Section 4 — Jargon Glossary (final cut)

Final dictionary of what must still be replaced project-wide (residual items):

| Russian jargon | Context where still appears | Replacement |
|---|---|---|
| чанки | `upload.chunksLabel` in ru.ts | фрагменты |
| токен (API/key) | `api.saveToken`, `api.tokenCreated`, `api.tokenRevoked`, `conn.copyToken`, `conn.yourToken` | ключ доступа / ключ / доступ |
| векторизация | `pipeline.embed`, `pipeline.embedShort` | обработка / обр. |
| RAG | `roadmap.q2.f1` | (see Landing section) |
| мультимодальный | `landing.feat1.title/desc`, `landing.pricing.*.f4`, `roadmap.now.f3` | поиск по всем форматам / поиск по всему |
| MCP-подключение | `landing.pricing.*.f5`, `roadmap.now.f2` | Подключение к нейросети |
| MCP-сервер | `conn.claudeDesktop.s3.detail`, `conn.antigravity.s3.detail`, `roadmap.now.f2` | Contexter / Contexter подключён |
| пайплайн | `landing.prelaunch.limit2` | обработка файлов |
| self-hosting | `landing.pricing.business` | собственный сервер |
| API (pricing feature) | `landing.pricing.pro.f7` | Прямой доступ для разработчиков |
| токены (Upload stats) | `upload.tokensLabel` | Слова / знаки |
| URL добавлен / YouTube URL добавлен | `toast.urlAdded`, `toast.youtubeAdded` | Ссылка добавлена, обрабатываем... / YouTube-видео добавлено, обрабатываем... |

**Note on "токены" in Supporters context:** The word "токены" as loyalty points in the Supporters program (`supporters.*` keys) is intentional brand language and should NOT be changed. The program's FAQ explains the distinction. Do not apply the above "токен→ключ" rule to Supporters strings.

---

## Section 5 — CTA & Error Toast Rewrites

### CTA Buttons

| Location | i18n key | Current text | Problem | Replacement |
|---|---|---|---|---|
| Nav (unauthenticated) | `nav.login` | `Войти` | OK | — |
| Landing nav CTA | `landing.nav.cta` | `Попробовать бесплатно` | OK — clear and warm | — |
| Pricing free CTA | `landing.pricing.free.cta` | `Начать бесплатно` | OK | — |
| Pricing starter CTA | `landing.pricing.starter.cta` | `Начать` | Vague — doesn't say what happens | `Подключить Starter` |
| Pricing pro CTA | `landing.pricing.pro.cta` | `Начать` | Vague | `Подключить Pro` |
| Hero Connect button | Hero.tsx line 664 (HARDCODED) | `Connect` | English | `Подключить` |
| ApiPage upload button | nav context | via nav | — | — |

### Error Toasts (status summary)

| i18n key | Current text | Status |
|---|---|---|
| `toast.deleteFailed` | `Не удалось удалить — попробуйте ещё раз` | GOOD |
| `toast.docLoadFailed` | `Не удалось загрузить документы` | GOOD |
| `toast.docDeleteFailed` | `Не удалось удалить документ.` | GOOD |
| `toast.uploadError` | `Ошибка загрузки` | WEAK — vague, no action prompt → `Не удалось загрузить файл — попробуйте ещё раз` |
| `login.failed` | `Не удалось войти — попробуйте ещё раз` | GOOD |
| `register.failed` | `Не удалось создать аккаунт` | WEAK (no action prompt) — use `register.failedRetry` consistently |
| `forgot.sendFailed` | `Не удалось отправить письмо` | WEAK → `Не удалось отправить письмо — попробуйте ещё раз` |
| `reset.failed` | `Не удалось сбросить пароль` | WEAK → `Не удалось изменить пароль — попробуйте ещё раз` |
| `api.tokenFailed` | `Не удалось создать ключ — попробуйте ещё раз` | GOOD |
| `api.revokeFailed` | `Не удалось отозвать доступ — попробуйте ещё раз` | GOOD |
| `api.linkFailed` | `Не удалось создать ссылку — попробуйте ещё раз` | GOOD |

---

## Section 6 — Notes

### Files with no user-facing text issues

- **VerifyEmail.tsx** — all strings properly i18n'd, clean Russian
- **ForgotPassword.tsx** — all strings properly i18n'd, clean Russian
- **ResetPassword.tsx** — all strings properly i18n'd, clean Russian
- **Login.tsx** — all strings properly i18n'd, clean Russian
- **SupporterStatusCard.tsx** — all strings via i18n, no issues
- **SupportersLeaderboard.tsx** — all strings via i18n, no issues
- **PipelineIndicator.tsx** — strings via i18n; `pipeline.embed`/`embedShort` need fixing
- **DocumentViewer.tsx** — clean, minor observation about `токенов` label
- **DocumentModal.tsx** — clean, same minor observation

### Architecture observation (critical for apply phase)

The codebase uses a complete i18n system (`lib/i18n.ts` + `lib/translations/ru.ts`). The vast majority of old audit items have been resolved by moving to i18n and rewriting strings in `ru.ts`. **The apply phase for this audit should focus primarily on editing `ru.ts`**, not individual .tsx files. The only .tsx file changes needed are:
1. `Hero.tsx` — add i18n keys for hardcoded "Connect your AI" section (lines 657–664)
2. `Upload.tsx` — replace hardcoded English strings (lines 601, 700–705) with existing i18n keys
3. `Hero.tsx` and `Upload.tsx` — connect existing i18n keys for stage error labels

### Ambiguity notes

1. **"токены" in supporters context** — intentional loyalty program language. Do NOT replace with "ключ". The FAQ explicitly explains this.
2. **MCP in connection instructions** — when giving step-by-step instructions for Claude Desktop or Cursor, "MCP" sometimes appears as a product name (e.g., "MCP Servers" in the app's actual menu). These are unavoidable proper nouns (real UI labels). Only replace in descriptive text, not in exact menu navigation paths.
3. **"векторизация" in pipeline** — users see this live during upload. Replace with "обработка" as it's exposed UI. This is different from internal technical logs.
4. **`docview.tokens` / `docmodal.tokens`** — `токенов` in chunk metadata (`#1 · 245 токенов`) refers to the size of each fragment in tokens. This is developer/power-user context in the document viewer. Low priority but can change to `знаков` if desired.

### Recommended apply order (atomic commits)

1. **ru.ts — jargon sweep** (highest impact, one file, ~15 string changes): `upload.chunksLabel`, `upload.tokensLabel`, `pipeline.embed`, `pipeline.embedShort`, `toast.urlAdded`, `toast.youtubeAdded`, `api.saveToken`, `api.tokenCreated`, `api.tokenRevoked`, `conn.copyToken`, `conn.yourToken`, `conn.claudeDesktop.s3.detail`, `conn.antigravity.s3.detail`
2. **ru.ts — landing copy** (public-facing, ~8 changes): `landing.feat1.title`, `landing.feat3.desc`, `landing.pricing.*.f4`, `landing.pricing.*.f5`, `landing.pricing.pro.f7`, `landing.pricing.business`, `roadmap.now.f2`, `roadmap.now.f3`, `roadmap.now.f4`, `roadmap.q2.f1`, `landing.prelaunch.limit2`
3. **Hero.tsx — hardcoded English** (add i18n keys, 2 strings): Connect section
4. **Upload.tsx — connect existing i18n keys** (4 status strings already in ru.ts, just not wired)
5. **ru.ts — weak error toasts** (low priority): `toast.uploadError`, `register.failed`, `forgot.sendFailed`, `reset.failed`
6. **ru.ts — CTA specificity** (optional): pricing CTAs `Начать` → `Подключить Starter/Pro`
