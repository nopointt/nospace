# Bug Report — Session 179: Auth + Canvas Pipeline Fix

> Date: 2026-03-20
> Severity: CRITICAL (полная блокировка user flow)
> Goal: увидеть канвас в браузере
> Result: ✅ RESOLVED — полный flow работает: register → login → create KB → canvas

---

## 1. Описание проблемы

**Симптом:** ни один пользователь не мог пройти flow дальше landing page. Регистрация, логин, создание KB, открытие канваса — всё падало. На скриншотах: "Error | Uncaught Client Exception".

**Масштаб:** 5 багов в цепочке, каждый блокировал следующий шаг. Без починки всех 5 — канвас недоступен.

---

## 2. Хронология поиска и решения

### Bug #1: BETTER_AUTH_SECRET не передаётся в wrangler pages dev

**Как нашли:** Playwright тест показал что `/register` остаётся на той же странице с ошибкой. Проверили API напрямую:
```
curl -X POST /api/auth/sign-up/email → 500 "BETTER_AUTH_SECRET is required"
```

**Диагностика:** Проверили debug endpoint `/api/auth/debug-env` → `SECRET_defined: false`. На проде секрет задан через `wrangler pages secret put`, но для локального dev через `wrangler pages dev` нужен `.dev.vars` файл.

**Что не работало:** Ничего — фикс был очевиден после диагностики.

**Решение:** Создали `.dev.vars` с `BETTER_AUTH_SECRET=...`, добавили в `.gitignore`.

**Время:** ~5 минут.

---

### Bug #2: Nitro body corruption — "Bad escaped character in JSON at position 55"

**Как нашли:** После фикса секрета — `500 Internal Server Error` с пустым телом. В wrangler logs:
```
Better Auth: Bad escaped character in JSON at position 55
at async getBody$1 (nitro.mjs)
```

**Диагностика путь (что пробовали):**

1. **Гипотеза: `toSolidStartHandler` нужен вместо `auth.handler(event.request)`**
   - Прочитали better-auth docs для SolidStart
   - Прочитали исходник `toSolidStartHandler` в `node_modules`
   - **Результат:** `toSolidStartHandler` делает ровно то же — `auth.handler(event.request)`. Тупик.

2. **Гипотеза: Nitro потребляет body stream до того как better-auth его прочитает**
   - WebSearch: "better-auth Nitro cloudflare pages request body consumed"
   - Нашли похожие issues, но без прямого решения
   - **Анализ стека:** ошибка в Nitro's `getBody$1` — Nitro пытается перехватить `request.json()` через свой polyfill

3. **Попытка: `request.clone()`** — не помогло, Nitro перехватывает до clone

4. **Решение:** `buildCleanRequest()` — читаем body как raw text из оригинального request, создаём новый Request с чистым body:
   ```ts
   const bodyText = await original.text();
   return new Request(original.url, { method, headers: original.headers, body: bodyText });
   ```

**Время:** ~25 минут (основная часть на исследование toSolidStartHandler — тупик).

---

### Bug #3: D1_TYPE_ERROR — Date и boolean объекты в D1

**Как нашли:** После фикса body parsing — новая ошибка:
```
422 UNPROCESSABLE_ENTITY: "Failed to create user" / FAILED_TO_CREATE_USER
```
В wrangler logs:
```
D1_TYPE_ERROR: Type 'object' not supported for value 'Fri Mar 20 2026 07:45:23 GMT+0300'
```

**Диагностика:**
- better-auth через Drizzle передаёт `Date` объекты в `created_at`/`updated_at` и `boolean` в `email_verified`
- D1 (SQLite) принимает только примитивы: `string | number | null | ArrayBuffer`
- WebSearch подтвердил: known issue с better-auth + D1

**Что не работало:** Нет — решение было прямым.

**Решение:** `wrapD1()` Proxy на D1Database, перехватывает `.prepare().bind()`:
```ts
if (v instanceof Date) return v.toISOString();
if (typeof v === "boolean") return v ? 1 : 0;
```

**Время:** ~10 минут.

---

### Bug #4: event.context undefined в API routes — auth-guard crash

**Как нашли:** Auth работает, но `/api/kb` → 500:
```
TypeError: Cannot read properties of undefined (reading 'userId')
```

**Диагностика:**
- `requireAuth(event)` делает `event.context.userId` без optional chaining
- `event.context` = `undefined` в API routes после build (middleware не прокидывает контекст на CF Pages)
- Middleware пишет в `event.context.bindings` и `event.context.userId`, но в production build context объект другой

**Что не работало:**
- Первая версия sync → поломала бы все 17 callers. Нужна была обратная совместимость.

**Решение:** `requireAuth()` стала `async`:
1. Сначала проверяет `event.context?.userId` (middleware path)
2. Fallback: читает сессию напрямую через `auth.api.getSession({ headers })`
3. Если нет сессии → throw 401 Response
4. Обновили все 17 call sites: `requireAuth(event)` → `await requireAuth(event)`

**Время:** ~15 минут (включая обновление 14 файлов).

---

### Bug #5: Drizzle column name mismatch — createdAt vs created_at

**Как нашли:** Auth и auth-guard работают, но POST `/api/kb` → 500:
```
D1_ERROR: table projects has no column named createdAt: SQLITE_ERROR
```

**Диагностика:**
- Schema в `core.ts`: `const timestamp = () => text().notNull().default(...)` — без explicit column name
- Drizzle без explicit name берёт JS property name: `createdAt` → column `createdAt`
- Но в SQL migration: `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
- **Тот же баг во всех 5 schema файлах** (core, extraction, canvas, observability, pipeline)

**Решение:**
```ts
// Было:
const timestamp = () => text().notNull().default(sql`(datetime('now'))`);

// Стало:
const createdAt = () => text("created_at").notNull().default(sql`(datetime('now'))`);
const updatedAt = () => text("updated_at").notNull().default(sql`(datetime('now'))`);
```

**Время:** ~10 минут (включая фикс всех 5 файлов).

---

### Бонус: Login redirect на landing вместо dashboard

**Симптом:** после успешного логина URL = `/`, видна landing page а не dashboard.

**Причина:** `routes/index.tsx` (landing) и `routes/(protected)/index.tsx` (dashboard) оба маппятся на `/`. Landing wins.

**Решение:** login redirect `/` → `/kb` + landing page проверяет session → redirect на `/kb`.

---

## 3. Итоговые изменения

| Файл | Что изменено |
|---|---|
| `.dev.vars` | NEW — секрет для local dev |
| `.gitignore` | Добавлен `.dev.vars` |
| `src/lib/auth.ts` | `wrapD1()` Proxy для Date/boolean → primitives |
| `src/routes/api/auth/[...auth].ts` | `buildCleanRequest()` для обхода Nitro body corruption |
| `src/lib/auth-guard.ts` | `requireAuth()` → async, fallback на прямое чтение сессии |
| `src/lib/request-body.ts` | NEW — `readJsonBody()` helper для POST routes |
| `src/routes/api/kb/index.ts` | Использует `readJsonBody()` + `await requireAuth()` |
| `src/lib/schema/core.ts` | `timestamp()` → `createdAt()`/`updatedAt()` с explicit column names |
| `src/lib/schema/extraction.ts` | То же |
| `src/lib/schema/canvas.ts` | То же |
| `src/lib/schema/observability.ts` | То же |
| `src/lib/schema/pipeline.ts` | То же |
| `src/routes/login.tsx` | Redirect `/` → `/kb` |
| `src/routes/index.tsx` | Auth check → redirect `/kb` if logged in |
| 14 API route files | `requireAuth(event)` → `await requireAuth(event)` |

---

## 4. Корневые причины

Все 5 багов — следствие **одной корневой проблемы**: SolidStart + Nitro + Cloudflare Pages — это стек из 3 абстракций поверх workerd runtime, каждая со своими assumptions:

| Слой | Assumption | Реальность на CF Pages |
|---|---|---|
| **Nitro** | Request body stream можно читать многократно | body consumed после первого read |
| **Drizzle ORM** | Column name = JS property name | D1 migration = snake_case, но Drizzle генерирует camelCase |
| **better-auth** | DB принимает Date/boolean | D1 принимает только примитивы |
| **SolidStart middleware** | `event.context` доступен в route handlers | В production build context может быть undefined |
| **SolidStart routing** | Route groups не конфликтуют | `(protected)/index.tsx` и `index.tsx` на один URL |

---

## 5. Регламенты для предотвращения

### R1. Обязательный Local Smoke Test перед каждым CODE COMPLETE

**Правило:** sub-epic не получает статус CODE COMPLETE до прохождения:
```bash
bun run build && npx wrangler pages dev dist --port 8788 --local
# Playwright: register → login → create → use feature
```

**Почему:** 4 из 5 багов проявляются ТОЛЬКО в production build + wrangler. `vinxi dev` (dev server) использует другой путь для bindings и body parsing.

### R2. `.dev.vars` в checklist для CF Pages проектов

**Правило:** при настройке проекта на CF Pages — сразу создавать `.dev.vars` с тестовыми секретами и добавлять в `.gitignore`.

**Почему:** `wrangler pages dev` не видит secrets, заданные через `wrangler pages secret put`. Без `.dev.vars` все API с секретами падают молча.

### R3. Drizzle schema: всегда explicit column name

**Правило:** в Drizzle schema для D1 ВСЕГДА указывать column name:
```ts
// WRONG:
createdAt: text().notNull()

// RIGHT:
createdAt: text("created_at").notNull()
```

**Почему:** JS camelCase ≠ SQL snake_case. Drizzle не конвертирует автоматически (нет `casing: "snake_case"` для D1 dialect).

### R4. D1 Type Safety: Proxy wrapper для любого ORM → D1

**Правило:** при использовании ORM с D1 — всегда оборачивать D1Database в Proxy, конвертирующий Date → ISO string и boolean → 0/1.

**Почему:** D1 — не полный SQLite. Bind parameters принимают только `string | number | null | ArrayBuffer`. Ни один ORM (Drizzle, Prisma, Knex) не знает об этом ограничении.

### R5. Body reading на CF Pages: никогда event.request.json() напрямую

**Правило:** на CF Pages (SolidStart + Nitro) НЕ использовать `event.request.json()` в API routes. Использовать helper `readJsonBody(event)` который:
1. Пытается `request.text()` + `JSON.parse()`
2. Fallback на clone
3. Возвращает null если всё failed

**Почему:** Nitro перехватывает body stream через `getBody$1`, которая может corrupted данные при повторном чтении.

---

## 6. Методология поиска багов — что работало, что нет

### Что работало хорошо:

1. **Playwright как smoke test** — сразу показал ГДЕ ломается (не нужно угадывать)
2. **Debug endpoint** (`/api/auth/debug-env`) — мгновенная диагностика env bindings
3. **Wrangler logs** (`tail -20 /tmp/wrangler.log | grep ERROR`) — точный стек ошибки
4. **curl для API** — изоляция backend от frontend (не путать SSR crash и API error)
5. **Скриншоты Playwright** — визуальное подтверждение каждого шага
6. **Google First** — быстро подтвердил known issues (D1 + Date, better-auth + CF)

### Что НЕ работало / отнимало время:

1. **Исследование `toSolidStartHandler`** (~15 мин впустую) — казалось логичным, но source code показал что это no-op wrapper. **Lesson:** читать source code ДО гугления.
2. **`request.clone()` attempt** — не помогло, Nitro перехватывает до clone. **Lesson:** при Nitro body issues — создавать новый Request из raw text, не клонировать.
3. **Попытка fix через один баг** — каждый фикс открывал следующий баг в цепочке. **Lesson:** при цепочке багов — фиксить + тестировать после каждого, не пытаться пофиксить всё сразу.

### Рекомендуемый порядок при багах на CF Pages + SolidStart:

```
1. Playwright screenshot → ГДЕ ломается?
2. curl к API → backend или frontend?
3. wrangler logs → точная ошибка?
4. Google → known issue?
5. source code (node_modules) → как фреймворк работает?
6. Fix → rebuild → test → следующий баг
```

---

## 7. Метрики

| Метрика | Значение |
|---|---|
| Багов найдено | 5 + 1 routing |
| Файлов изменено | ~25 |
| Время на диагностику | ~40 мин |
| Время на фиксы | ~25 мин |
| Rebuild+test циклов | 6 |
| Тупиковых путей | 2 (toSolidStartHandler, request.clone) |
