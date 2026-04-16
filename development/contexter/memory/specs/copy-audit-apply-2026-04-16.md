# Copy Audit Apply Spec — 2026-04-16

> Source: `docs/research/contexter-copy-audit-2026-04-16.md` (Sonnet re-audit, 24 files scanned)
> Scope: full apply — jargon sweep + landing copy + hardcoded i18n + weak toasts + CTAs + Settings placeholder
> Expected: 6 atomic commits, ~35 point edits total
> Player: gropius | Coach: breuer | Both Sonnet

---

## Context (Pre-Inline)

### Contexter project state
- Frontend: SolidJS 1.9 + Vite 8 on CF Pages (`contexter-web`, `contexter.cc`)
- i18n architecture: `web/src/lib/i18n.ts` + `web/src/lib/translations/ru.ts` (canonical Russian translations)
- Most UI strings go through `t("key.path")` calls
- All work is in: `web/src/lib/translations/ru.ts`, `web/src/components/Hero.tsx`, `web/src/pages/Upload.tsx`, `web/src/pages/Settings.tsx`

### Locked decisions (from STATE.md)
- **D-30:** Copy audit MUST be applied before public launch (blocker)
- **D-AXIS-01 (243):** Copy audit scope primarily `ru.ts` (frontend мигрирован на i18n), apply = 6 atomic commits
- **Не трогаем:** `supporters.*` «токены» (intentional loyalty brand language), MCP в реальных menu navigation paths Claude Desktop / Cursor (proper nouns)

---

## Phase Zero (MANDATORY — Player MUST complete before touching files)

### P0.1 — Files to load
Read (in this order):
1. `web/src/lib/translations/ru.ts` — full file, understand structure
2. `web/src/components/Hero.tsx` — focus on lines 657-664 (Connect section) and stage error map (~592-594, ~574)
3. `web/src/pages/Upload.tsx` — focus on lines 601, 700-705, stage error map 592-594
4. `web/src/pages/Settings.tsx` — focus on line 147
5. `docs/research/contexter-copy-audit-2026-04-16.md` — full audit reference

### P0.2 — Broad research
Verify that every i18n key referenced in this spec EXISTS in `ru.ts`. Make a table in Phase Zero report:
- Keys already present: list them
- Keys to create: list them (Commit 3 requires 3 new `hero.connect*` keys, Commit 6 requires `settings.namePlaceholder` key)

### P0.3 — Understanding check
After P0.1+P0.2, Player MUST write a Phase Zero summary in commit message of FIRST commit OR as a comment in `session-scratch.md`, containing:
1. Exact line numbers of hardcoded strings in Hero.tsx and Upload.tsx (verify against actual file)
2. Count of keys that need to be created (new) vs modified (existing)
3. Any discrepancies found between audit file and actual code
4. Any edge cases (e.g., key used in multiple places)

If Phase Zero reveals discrepancy from spec — STOP, escalate to Orchestrator. Do NOT guess or proceed.

### P0.4 — Main task
After Phase Zero report written → proceed to Task 1.

---

## Commits (execute in order — dependencies linear)

### Commit 1: `fix(contexter/ui): copy audit — jargon sweep in ru.ts`

**File:** `web/src/lib/translations/ru.ts` only.

**Action — edit these keys (exact old→new replacement):**

| i18n key | Old value | New value |
|---|---|---|
| `upload.chunksLabel` | `Чанки` | `Фрагменты` |
| `upload.tokensLabel` | `Токены` | `Слова / знаки` |
| `pipeline.embed` | `векторизация` | `обработка` |
| `pipeline.embedShort` | `вектор.` | `обр.` |
| `toast.urlAdded` | `URL добавлен` | `Ссылка добавлена, обрабатываем...` |
| `toast.youtubeAdded` | `YouTube URL добавлен` | `YouTube-видео добавлено, обрабатываем...` |
| `api.saveToken` | `Сохраните токен, он больше не будет показан` | `Сохраните ключ доступа — он больше не появится` |
| `api.tokenCreated` | `Токен создан` | `Новый ключ создан` |
| `api.tokenRevoked` | `Токен отозван` | `Доступ отозван` |
| `conn.copyToken` | `Скопировать токен` | `Скопировать ключ` |
| `conn.yourToken` | `ВАШ_ТОКЕН` | `ВАШ_КЛЮЧ` |
| `conn.claudeDesktop.s3.detail` | `Иконка молотка в чате = MCP работает` | `Иконка молотка в чате = Contexter подключён` |
| `conn.antigravity.s3.detail` | `MCP-сервер появится в списке инструментов` | `Contexter появится в списке инструментов` |
| `conn.otherSub` | `Любая программа с поддержкой MCP` | `Любой ИИ-клиент с поддержкой MCP` |

**Verify (MUST pass before commit):**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
# Expected: "built in Xs" success

grep -E "Чанки|Токены.*=|векторизация|YouTube URL добавлен|Сохраните токен|Токен создан|Токен отозван|Скопировать токен|ВАШ_ТОКЕН|MCP работает|MCP-сервер появится|Любая программа" src/lib/translations/ru.ts | grep -v "supporters\." 
# Expected: 0 matches (outside supporters.* namespace)
```

**Done when:**
- [ ] All 14 replacements applied exactly as specified
- [ ] `bun run build` success
- [ ] Grep shows no residual jargon outside supporters namespace
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 1/6`

---

### Commit 2: `fix(contexter/ui): copy audit — landing public copy (Prio-0)`

**File:** `web/src/lib/translations/ru.ts` only.

**Action — replace these keys (Prio-0 public-facing Landing):**

| i18n key | Old value | New value |
|---|---|---|
| `landing.feat1.title` | `Мультимодальный поиск по всему` | `Поиск по всем файлам сразу` |
| `landing.feat1.desc` | (contains `Мультимодальный поиск (текст, фото, аудио, видео + полнотекстовый)`) | replace `Мультимодальный поиск` → `поиск по всему` in the description text |
| `landing.feat3.desc` | `Никакой настройки, никаких API-ключей, никакого кода.` | `Никакой настройки, никаких ключей, никакого кода.` |
| `landing.pricing.free.f4` | `Мультимодальный поиск` | `Поиск по всем форматам` |
| `landing.pricing.free.f5` | `MCP-подключение` | `Подключение к нейросети` |
| `landing.pricing.starter.f4` | `Мультимодальный поиск` | `Поиск по всем форматам` |
| `landing.pricing.starter.f5` | `MCP-подключение` | `Подключение к нейросети` |
| `landing.pricing.pro.f4` | `Мультимодальный поиск` | `Поиск по всем форматам` |
| `landing.pricing.pro.f5` | `MCP-подключение` | `Подключение к нейросети` |
| `landing.pricing.pro.f7` | `Доступ к API` | `Прямой доступ для разработчиков` |
| `landing.pricing.business` | `Нужен бизнес-тариф или self-hosting?` | `Нужен корпоративный тариф или собственный сервер?` |
| `roadmap.now.f2` | `MCP-сервер — работает с ChatGPT, Claude, Gemini, Cursor` | `Подключение ко всем нейросетям` |
| `roadmap.now.f3` | `Мультимодальный поиск (текст, фото, аудио, видео + полнотекстовый)` | `Поиск по тексту, фото, аудио и видео` |
| `roadmap.now.f4` | `Обработка: распознавание → разбивка → векторизация → индексация` | `Автоматическая обработка файлов` |
| `roadmap.q2.f1` | (contains `Public RAG — публикуйте документы для всех. Платные документы покупаются через Contexter. Агенты могут покупать сами...`) | `Публичная база знаний — публикуйте документы для всех. Другие могут покупать доступ через Contexter.` |
| `landing.prelaunch.limit2` | `Пайплайн: обработка может замедляться при высокой нагрузке` | `Обработка файлов: может замедляться при высокой нагрузке` |

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -cE "Мультимодальный|MCP-подключение|MCP-сервер|Public RAG|self-hosting|Доступ к API|Пайплайн" src/lib/translations/ru.ts
# Expected: 0 for these landing/pricing/roadmap contexts
```

**Done when:**
- [ ] All 16 landing/pricing/roadmap keys replaced
- [ ] Build passes
- [ ] No residual jargon in `landing.*` / `roadmap.*` / `pricing.*` namespace
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 2/6`

---

### Commit 3: `fix(contexter/ui): Hero.tsx — i18n hardcoded Connect section`

**Files:** `web/src/components/Hero.tsx` + `web/src/lib/translations/ru.ts`

**Action:**

1. In `ru.ts` under `hero.*` namespace, ADD three new keys:
   - `hero.connectTitle`: `"Подключите нейросеть"`
   - `hero.connectDesc`: `"Откройте ChatGPT, Claude, Gemini, Perplexity или Cursor — и спросите по вашим файлам. Займёт 2 минуты."`
   - `hero.connectCta`: `"Подключить"`

2. In `Hero.tsx` lines ~657-664 (Connect section), replace hardcoded English:
   - `Connect your AI` → `{t("hero.connectTitle")}`
   - `Link ChatGPT, Claude, Gemini, Perplexity, or Cursor to your knowledge base. Takes 2 minutes.` → `{t("hero.connectDesc")}`
   - `Connect` (button label on line ~664) → `{t("hero.connectCta")}`

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -cE "Connect your AI|Link ChatGPT, Claude, Gemini, Perplexity, or Cursor" src/components/Hero.tsx
# Expected: 0
grep -c "hero.connectTitle\|hero.connectDesc\|hero.connectCta" src/lib/translations/ru.ts
# Expected: 3 (all three new keys exist)
```

**Done when:**
- [ ] 3 new keys added to ru.ts under hero namespace
- [ ] 3 hardcoded English strings replaced with t() calls in Hero.tsx
- [ ] Build passes
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 3/6`

---

### Commit 4: `fix(contexter/ui): Upload.tsx — wire existing i18n keys`

**File:** `web/src/pages/Upload.tsx` only. (Keys already exist in ru.ts.)

**Action — replace hardcoded English with existing i18n keys:**

1. Line ~601 (Retry button):
   - `Retry` → `{t("common.retry")}` (verify key exists; if not, use `{t("upload.retry")}` — whichever is canonical in ru.ts)

2. Lines ~700-705 (status messages shown when upload state is N/A):
   - `Waiting for parsing...` → `{t("upload.waitingParse")}`
   - `Extraction error` → `{t("upload.extractError")}`
   - `Upload not started` → `{t("upload.notStarted")}`
   - `Preview unavailable` → `{t("upload.previewUnavailable")}`

3. Stage error map ~lines 592-594 (English `parsing`/`chunking`/`vectorizing`/`saving`):
   - Replace map values with `t("upload.stageError.parse")`, `t("upload.stageError.chunk")`, `t("upload.stageError.embed")`, `t("upload.stageError.index")`
   - If stage keys don't exist under `upload.stageError`, verify under `upload.*` or `pipeline.*` — use whichever is canonical

**Also: check `Hero.tsx` for same stage error map** (line ~574 per audit) — if present, apply same wiring in Hero.tsx. If it's the same map duplicated, consider this part of Commit 4 (same concern).

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -cE "\"Retry\"|\"Waiting for parsing|\"Extraction error|\"Upload not started|\"Preview unavailable|parsing\"|chunking\"|vectorizing\"|saving\"" src/pages/Upload.tsx src/components/Hero.tsx
# Expected: 0 (all wired to t())
```

**Done when:**
- [ ] All 5 hardcoded English strings in Upload.tsx replaced with t()
- [ ] Stage error map in Upload.tsx (and Hero.tsx if present) wired to t()
- [ ] Build passes
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 4/6`

**Edge case:** If a referenced key (e.g., `upload.waitingParse`) does not exist in ru.ts, STOP and add it with sensible Russian value. Note addition in commit message.

---

### Commit 5: `fix(contexter/ui): ru.ts — strengthen weak error toasts`

**File:** `web/src/lib/translations/ru.ts` only.

**Action:**

| i18n key | Old value | New value |
|---|---|---|
| `toast.uploadError` | `Ошибка загрузки` | `Не удалось загрузить файл — попробуйте ещё раз` |
| `register.failed` | `Не удалось создать аккаунт` | `Не удалось создать аккаунт — попробуйте ещё раз` |
| `forgot.sendFailed` | `Не удалось отправить письмо` | `Не удалось отправить письмо — попробуйте ещё раз` |
| `reset.failed` | `Не удалось сбросить пароль` | `Не удалось изменить пароль — попробуйте ещё раз` |

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -E "uploadError|register\.failed|forgot\.sendFailed|reset\.failed" src/lib/translations/ru.ts | grep -c "попробуйте ещё раз"
# Expected: ≥4 (each key now contains the retry prompt)
```

**Done when:**
- [ ] All 4 error toasts now end with `— попробуйте ещё раз`
- [ ] Build passes
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 5/6`

---

### Commit 6: `fix(contexter/ui): ru.ts — CTA labels + Settings placeholder`

**Files:** `web/src/lib/translations/ru.ts` + `web/src/pages/Settings.tsx`

**Action:**

1. In `ru.ts`:
   - `landing.pricing.starter.cta`: `Начать` → `Подключить Starter`
   - `landing.pricing.pro.cta`: `Начать` → `Подключить Pro`
   - ADD new key `settings.namePlaceholder`: `"Введите имя..."` (under `settings.*` namespace)

2. In `Settings.tsx` line ~147:
   - Hardcoded `Set your name...` → `{t("settings.namePlaceholder")}`

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -c "Set your name" src/pages/Settings.tsx
# Expected: 0
grep -c "settings.namePlaceholder" src/lib/translations/ru.ts
# Expected: 1
grep -E "starter\.cta|pro\.cta" src/lib/translations/ru.ts | grep -E "Подключить Starter|Подключить Pro" | wc -l
# Expected: 2
```

**Done when:**
- [ ] Pricing CTAs now specific (`Подключить Starter` / `Подключить Pro`)
- [ ] `settings.namePlaceholder` key added to ru.ts
- [ ] Settings.tsx line 147 wired to t() call
- [ ] Build passes
- [ ] Atomic commit with trailer `GSD-Task: CTX-10-W1-01 / Commit 6/6`

---

## Acceptance Criteria

| ID | Criterion | Verify |
|---|---|---|
| AC-1 | 6 atomic commits on `main` with `GSD-Task: CTX-10-W1-01 / Commit N/6` trailers | `git log --oneline -6 \| grep "GSD-Task: CTX-10-W1-01"` → 6 lines |
| AC-2 | Build passes after every commit | `bun run build` exit code 0, zero errors |
| AC-3 | No residual listed jargon in `landing.*`, `pricing.*`, `roadmap.*`, `upload.*`, `pipeline.*`, `api.*`, `conn.*`, `toast.*` namespaces | automated grep (per commit verify) |
| AC-4 | All weak error toasts now carry "попробуйте ещё раз" | grep |
| AC-5 | No hardcoded English user-facing strings in Hero.tsx / Upload.tsx / Settings.tsx | grep |
| AC-6 | 4 new i18n keys added: `hero.connectTitle/Desc/Cta`, `settings.namePlaceholder` | grep in ru.ts |
| AC-7 | `supporters.*` "токены" NOT touched (intentional loyalty brand) | `git diff HEAD~6 -- src/lib/translations/ru.ts` shows no changes in supporters namespace |

---

## Out of Scope (do NOT touch)

- `supporters.*` keys (intentional loyalty brand — "токены" = points)
- MCP in menu navigation paths (Claude Desktop real menu "MCP Servers", Cursor `mcp.json` file path) — proper nouns
- `docview.tokens` / `docmodal.tokens` chunk metadata — developer context, deferred
- ApiPage.tsx hardcoded `YOUR TOKEN` label + `base url:` — developer section, acceptable
- Any backend / DB / API code — this spec is UI text only

---

## Escalation

- If Phase Zero reveals code state differs from audit → STOP, report, wait
- If Coach POST-REVIEW rejects 3 times → escalate to Orchestrator
- If verify command fails after commit → immediate revert + escalate (do NOT push broken state)
- If a referenced i18n key doesn't exist → add with sensible Russian value, note in commit message, do NOT guess silently

---

## Git

Branch: `main` (per H7 git workflow — direct commits ok on this repo)
Commits: 6, each atomic, each with `GSD-Task: CTX-10-W1-01 / Commit N/6` trailer
Push: after Coach POST-REVIEW passes. Do NOT push until Coach signs off.
