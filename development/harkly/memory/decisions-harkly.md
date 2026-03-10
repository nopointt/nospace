# DECISIONS LOG — Harkly
> Append-only. Never overwrite. Add new decisions at the bottom.
> Format: `## [YYYY-MM-DD] — [topic]`

---

## 2026-03-08 — Стек и инфраструктура

- **Runtime:** Bun (не Node)
- **Framework:** Next.js 14 App Router + shadcn/ui → Vercel
- **ORM:** Prisma 7 с двумя datasource (pooler для runtime, direct для migrate)
- **Auth + DB:** Supabase (`itkzskhsjcfokvrdtjlv`, US) — персданные позже в YC PG (152-ФЗ)
- **Repo:** `harkly-saas` на GitHub (`nopointt/harkly-saas`)
- **prisma migrate dev** не работает с Supabase pooler → использовать `prisma db push` или SQL напрямую в Supabase Dashboard

---

## 2026-03-08 — Продуктовая архитектура

- **UI парадигма:** Infinite canvas — один маршрут `/app/[workspaceId]`, Frame компоненты (draggable/resizable)
- **Навигация:** нелинейная для v1 (специалисты не нуждаются в wizard)
- **Dashboard:** `/app/dashboard` — список проектов. ПРОБЛЕМА: dashboard и canvas — разные концепции, нужно объединить после E6 при редизайне
- **Модули v1 (5):** Framing Studio, Corpus Triage, Evidence Extractor, Insight Canvas, Research Notebook
- **Артефакты v1 (3):** Fact Pack, Evidence Map, Empathy Map
- **Фреймы v1 (4):** PICO, HMW, ISSUE_TREE, FREE_FORM

---

## 2026-03-08 — Canvas Shell (E0.5)

- E0.5 был пропущен — E1-E3 построены как route-per-module. ИСПРАВЛЕНО в той же сессии.
- Canvas shell уже существовал (Canvas, CanvasFrame, ChatPanel, AgentStatusBar, providers)
- Недостающее звено = `FrameContentRouter` — маршрутизация `frame.module` → компонент
- `CanvasFrame` получил поле `projectId?: string` для привязки frame к ResearchProject
- `ProjectPicker` — новый компонент, показывает список проектов для привязки к frame
- **ExtractPage** — default export (не named), импортировать как `import ExtractPage from ...`

---

## 2026-03-08 — Multi-agent паттерн

- **Claude = Coach + Orchestrator**, не пишет код напрямую в G3
- **Qwen CLI** (`qwen --approval-mode yolo`) — бесплатный, основной Player
- **OpenCode/MiniMax, OpenCode/Trinity** — бесплатные альтернативы
- Custom subagents (`~/.claude/agents/`) — НЕ доступны через `subagent_type`, только `general-purpose`
- Параллельный паттерн: 2 сабагента одновременно + Claude = работает, ускоряет в 2x

---

## 2026-03-08 — ICP и стратегия

- **Первичный ICP:** Dedicated UX Researchers + Research Ops (специалисты)
- **Стратегия:** методологическое лидерство → специалисты рекомендуют → масс-маркет v2-v3
- **Домен:** harkly.ru (первичная аудитория RU + СНГ)
- **Figma MCP:** подключить ПОСЛЕ E6, дизайн-агент редизайн UI тогда же

---

## 2026-03-08 — E6 Share Architecture

- **ZIP generation:** `fflate` (in-memory, `zipSync`) — нет temp файлов на сервере, Response принимает `zipped.buffer as ArrayBuffer`
- **Public share routes:** `/share/[token]` — вне `/app/*`, middleware (`pathname.startsWith('/app')`) не трогает, no auth required
- **Share URL base:** `https://harkly-saas.vercel.app/share/{token}` (hardcoded в route, менять при смене домена)
- **ShareLink model:** UUID token через `@default(uuid())` в Prisma, Cascade delete при удалении Artifact

---

## 2026-03-08 — Стадия 3 завершена

- **Все Layer 1 эпики (E0-E6):** завершены в одну сессию (2026-03-08)
- **Следующий:** Стадия 4 Tech Debt Analysis — Explore-агент по всему codebase → `specs/tech-debt-frontend.md`
- **Блокер:** 3 SQL миграции (E3, E4, E6) не применены в Supabase → нужно до любого production тестирования

---

## 2026-03-08 — Стадия 4: Tech Debt выводы

- **SQL миграции:** применять через `DATABASE_URL=<DIRECT_URL> bunx prisma db execute --stdin` (psql не нужен)
- **Security hole:** project ownership check отсутствует во всех project-scoped routes → фиксить до beta
- **UX priority #1:** error toasts на все API mutation catch blocks (сейчас silent failures)
- **UX priority #2:** confirmation dialogs на destructive actions (delete note, archive project, bulk exclude)
- **Стадия 4 завершена:** два отчёта в `branches/saas-v1/specs/` — tech-debt-frontend.md + ux-debt-report.md

---

## 2026-03-08 — Стадия 3.5: Figma Design Audit

- **Figma REST API = read-only для canvas:** создавать/редактировать ноды через внешний API невозможно — архитектурное ограничение Figma. Write access только через Figma Plugin API (sandbox внутри Figma app)
- **figma-developer-mcp:** read-only MCP, требует рестарта Claude Code для загрузки инструментов (`mcp__figma__*`)
- **Новая Стадия 3.5:** Figma Design Audit → Frontend Redesign — между Стадией 4 и 5
- **figma-design-auditor агент:** `~/.claude/agents/figma-design-auditor.md` — читает Figma файл через MCP, документирует экраны, заполняет пробелы дизайн-решениями, пишет `design-audit.md`. Затем Claude делает план фиксов для frontend
- **Workflow:** figma-design-auditor → design-audit.md → план фиксов (Claude) → Qwen имплементирует

---

## 2026-03-09 — LinkedIn Scraper: Stealth Browser Automation

- **Стек:** Patchright (не Playwright) + Node.js `--experimental-strip-types` + launchPersistentContext
- **Bun не работает** для Chrome subprocess — зависает навсегда. Только Node.js
- **Техники маскировки:** Gaussian delays (Box-Muller), Bezier curve mouse, scroll simulation, URL shuffle, viewport randomization, timezone = proxy location
- **Полная документация:** `harkly/memory/stealth-scraping-techniques.md`
- **Скрипт:** `nospace/tools/linkedin-scraper/scrape.ts`
- **Webshare proxies:** shared 1GB — блокировать image/media/font/stylesheet чтобы экономить

---

## 2026-03-08 — Стадия 3.5: Canvas Workspace Redesign (session 10)

- **Inter font:** заменён Geist на Inter (Google Fonts) — axiom digital design agency template за базу
- **Tailwind scale only:** убраны все `text-[Npx]`, `w-[Npx]`, `h-[Npx]` в canvas-компонентах → только `text-xs / text-sm / text-base`, `h-4 / h-6 / h-9`, `w-6 / w-8`
- **gray-100 borders:** `border-[#D9D9D9]` → `border-gray-100` во всех компонентах
- **NVIDIA NIM:** подключён как default agent — `meta/llama-3.3-70b-instruct`, OpenAI-compatible endpoint `https://integrate.api.nvidia.com/v1`, ключ из `NEXT_PUBLIC_NVIDIA_NIM_KEY`
- **Omnibar = chat:** Omnibar был построен (Cmd+K → dialog → FramingStudio) но не смонтирован. Подключён в `/app/[workspaceId]/page.tsx` через `use(props.params)` паттерн
- **useAgents version: 2:** бамп для сброса старого localStorage с устаревшим default provider
- **stream_options убран:** NVIDIA NIM не поддерживает `stream_options: { include_usage: true }` — убрано из `providers/openai.ts`
- **Floor architecture зафиксирована:** Floor 0-5 + 5 методологических школ → `handshake-harkly.md` + `current-context-harkly.md`

---

## 2026-03-10 — Лендинг: деплой + инфраструктурные решения (session 17)

- **Waitlist Telegram:** поле `email` → `telegram` (уникальный @handle) + `role` — Prisma schema обновлена, миграция применена через `prisma db execute --stdin` с DIRECT_URL
- **Middleware public routes:** `PUBLIC_PATHS = ['/', '/share']` — эти маршруты пропускают Supabase auth check полностью (`return NextResponse.next()` сразу)
- **tsconfig forceConsistentCasingInFileNames: false:** GSAP на Windows создаёт конфликт между `Draggable.d.ts` и `draggable.d.ts`. Отключено только в tsconfig (не влияет на Vercel/Linux где реальная файловая система case-sensitive)
- **Production URL:** `harkly-saas.vercel.app` — Vercel автоматически алиасирует каждый push к main на этот URL
- **prisma db execute workaround:** `DATABASE_URL="$DIRECT_URL" bunx prisma db execute --stdin` (не `prisma migrate dev` — зависает с Supabase pooler)
