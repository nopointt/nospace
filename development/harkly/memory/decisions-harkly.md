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
