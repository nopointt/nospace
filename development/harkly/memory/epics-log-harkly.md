# EPICS LOG — Harkly
> Append-only. Never overwrite. One entry per completed epic.
> Format: `## [YYYY-MM-DD] — [Epic ID]: [Name]`

---

## 2026-03-08 — E0: Scaffold + Auth + DB Schema

**Статус:** ✅ DONE

**Что построено:**
- Next.js 14 App Router scaffold с Bun runtime
- Supabase auth (signIn/signUp/signOut) + middleware защита `/app/*`
- Prisma schema: `workspaces`, `research_projects`, `documents`, `extractions`
- shadcn/ui компоненты: Button, Input, Card, Label
- `/auth/login`, `/auth/register`, `/auth/forgot-password` страницы
- `/app/dashboard` — список проектов с Omnibar (⌘K)
- Landing page (`/`) с waitlist формой + "Dev →" ссылка в footer
- Vercel deployment: `harkly-saas.vercel.app`

**Ключевые файлы:**
- `prisma/schema.prisma` — схема БД
- `src/middleware.ts` — auth guard
- `src/app/auth/` — auth pages
- `src/app/app/dashboard/page.tsx` — dashboard

**Проблемы и решения:**
- `prisma migrate dev` зависает с Supabase pooler → использовать `prisma db push` или SQL напрямую

---

## 2026-03-08 — E0.5: Canvas Shell

**Статус:** ✅ DONE

**Что построено:**
- `Canvas.tsx` — infinite canvas с pan (drag) + zoom (wheel), CSS transform
- `CanvasFrame.tsx` — draggable/resizable frame компонент, `data-canvas-frame`
- `CanvasGrid.tsx` — dot grid background, CSS background-image
- `CanvasToolbar.tsx` — toolbar для добавления frames на canvas
- `CanvasFrame` type: `{ id, module, title, x, y, width, height, zIndex, minimized, projectId? }`
- `useCanvasState.ts` — Zustand store с persist в localStorage
- `ChatPanel.tsx` — floating chat (3 позиции: left/center/right), коллапсируется
- `AgentStatusBar.tsx` — статус активных агентов
- Providers: Anthropic, OpenAI, Ollama — API ключи только в localStorage
- **`FrameContentRouter.tsx`** — маршрутизация `frame.module` → React component
- **`ProjectPicker.tsx`** — выбор/создание проекта для привязки к frame

**Ключевые файлы:**
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/CanvasFrame.tsx`
- `src/components/canvas/FrameContentRouter.tsx` ← НОВЫЙ
- `src/components/canvas/ProjectPicker.tsx` ← НОВЫЙ
- `src/types/canvas.ts` — `projectId?: string` добавлен
- `src/app/app/[workspaceId]/page.tsx` — маршрут канваса

**Проблемы и решения:**
- E0.5 был пропущен, E1-E3 построены как route-per-module → исправлено добавлением FrameContentRouter
- `ExtractPage` default export → импорт без `{}`

---

## 2026-03-08 — E1: Framing Studio

**Статус:** ✅ DONE

**Что построено:**
- `FramingStudio.tsx` — выбор методологии + заполнение полей фрейма
- Поддержка 4 типов: PICO, HMW, ISSUE_TREE, FREE_FORM
- Сохранение `frame_type` + `frame_data` в БД через API
- `onClose` callback (не router redirect) — совместим с canvas embedding

**Ключевые файлы:**
- `src/components/framing/FramingStudio.tsx`
- `src/types/framing.ts` — типы + EMPTY_FRAMES + REQUIRED_FIELDS

---

## 2026-03-08 — E2: Corpus Triage

**Статус:** ✅ DONE

**Что построено:**
- `CorpusPage.tsx` — список источников с релевантностью, скрининг, финализация
- API: GET/POST `/api/projects/[id]/corpus`, POST `.../finalize`
- Seed: 12 документов с оценками релевантности
- `corpus_finalized` флаг — блокирует изменения после финализации

**Ключевые файлы:**
- `src/components/corpus/CorpusPage.tsx`
- `src/app/api/projects/[id]/corpus/route.ts`
- `prisma/seed.ts` — 12 corpus documents

---

## 2026-03-08 — E3: Evidence Extractor

**Статус:** ✅ DONE

**Что построено:**
- `ExtractPage.tsx` (default export) — fact cards, quote cards, contradiction highlights
- 5 API routes: GET extractions, POST trigger extraction, GET status, PATCH annotation, DELETE
- Seed: 40 extractions (facts, quotes, metrics, contradictions)
- Поля `extraction_total`, `extraction_done` на `research_projects`
- Поле `extraction_processed` на `documents`
- Поле `annotation` на `extractions`

**Ключевые файлы:**
- `src/components/extract/ExtractPage.tsx` — **default export**
- `src/app/api/projects/[id]/extract/` — 5 routes
- `prisma/seed.ts` — 40 extractions

**⚠️ Pending SQL migration (применить в Supabase Dashboard):**
```sql
ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS extraction_total INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS extraction_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_processed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS annotation TEXT;
```

---

## 2026-03-08 — E4: Insight Canvas

**Статус:** ✅ DONE

**Что построено:**
- `InsightCanvasPage.tsx` — tab bar (Fact Pack | Evidence Map | Empathy Map), generation status per tab, polling for GENERATING state
- `FactPackTab.tsx` — Collapsible theme sections, inline textarea editing, confidence/metric/contradiction badges, Export Markdown, History button
- `EvidenceMapTab.tsx` — Table matrix themes×frame components, Strong/Moderate/Weak/Gap cells с цветовой кодировкой, custom hover tooltips
- `EmpathyMapTab.tsx` — 2×2 grid SAY/THINK/DO/FEEL, add/delete/edit mode per quadrant
- `VersionHistoryDrawer.tsx` — Dialog с version list, read-only preview, Restore
- `src/types/artifacts.ts` — ArtifactType, FactPackContent, EvidenceMapContent, EmpathyMapContent
- `src/lib/artifacts/generate.ts` — mock generation из extractions
- `src/lib/artifacts/export.ts` — Markdown export formatting
- 5 API routes: GET/POST artifacts, GET/PATCH artifact, POST restore, GET export
- `prisma/migrations/e4_artifacts.sql` — SQL для Supabase Dashboard
- Seed: 3 mock artifacts для "Checkout abandonment analysis"

**Ключевые файлы:**
- `src/app/app/projects/[id]/canvas/page.tsx` — route
- `src/components/insights/` — все 5 компонентов
- `src/app/api/projects/[id]/artifacts/` — 4 route директории
- `prisma/migrations/e4_artifacts.sql` — применить в Supabase

**Проблемы и решения:**
- `ArtifactContent as Prisma.InputJsonValue` → TypeScript ошибка → fix: cast через `unknown` первым
- `Accordion`, `Tooltip`, `Sheet`, `ScrollArea` не установлены в shadcn → агент заменил на `Collapsible`, custom hover divs, `Dialog`
- Build lock `.next/lock` после параллельного agenta → удалить и перезапустить

**⚠️ Pending SQL migration (применить в Supabase Dashboard):**
`prisma/migrations/e4_artifacts.sql`

---

## 2026-03-08 — E5: Research Notebook

**Статус:** ✅ DONE

**Что построено:**
- `NotebookSidebar.tsx` — collapsible 320px right panel, все страницы проекта через layout.tsx, Cmd+Shift+N, localStorage persistence
- `NoteCard.tsx` — preview 2 строки + tags + date + edit/delete on hover
- `NoteDetail.tsx` — full view с react-markdown, linked docs, edit mode, delete
- `NewNoteForm.tsx` — tag input (Enter to add) + POST + optimistic update
- `useRelatedNotes.ts` hook — keyword overlap, debounced 500ms
- `src/app/app/projects/[id]/layout.tsx` — project layout wrapper с NotebookSidebar
- `src/app/app/projects/[id]/notebook/page.tsx` — two-panel list + detail
- 3 API routes: GET/POST notes (search+tag), PATCH/DELETE (ownership guard 403), GET related (keyword scoring top 3)
- Seed: 5 notes для "Checkout abandonment analysis"

**Ключевые файлы:**
- `src/components/notebook/` — 4 компонента
- `src/hooks/useRelatedNotes.ts` — auto-surfacing hook
- `src/app/app/projects/[id]/layout.tsx` — sidebar wrapper для всех sub-pages
- `src/app/api/projects/[id]/notes/` — 3 routes

**Проблемы и решения:**
- `react-markdown` не установлен → `bun add react-markdown@10.1.0`
- `Sheet`, `ScrollArea` недоступны → plain div + overflow-y-auto
- layout.tsx params в Next.js 16 = `Promise<{id}>` → async server component

---

## 2026-03-08 — E6: Share + Export

**Статус:** ✅ DONE

**Что построено:**
- `ShareLinkDialog.tsx` — Dialog: create/copy/revoke shareable URL
- `src/utils/clipboard.ts` — copyToClipboard с execCommand fallback
- `/app/projects/[id]/share/page.tsx` — Share page: artifact cards, Download MD/PDF, Copy, Share link, "Download all as ZIP"
- `/share/[token]/page.tsx` — Public read-only page (no auth), renders FactPack/EvidenceMap/EmpathyMap, og: meta tags, "Sign up" CTA footer
- 3 API routes: POST/DELETE share-link, GET /api/share/[token] (public), GET export/zip
- `fflate` для ZIP generation (in-memory, no temp files)
- Seed: ShareLink token "test-share-token-123" для Fact Pack
- `prisma/migrations/e6_share.sql` — SQL для Supabase Dashboard

**Ключевые файлы:**
- `src/app/share/[token]/page.tsx` — public route вне /app/*, middleware не защищает
- `src/app/api/share/[token]/route.ts` — публичный GET без auth
- `src/app/api/projects/[id]/artifacts/[artifactId]/share-link/route.ts` — POST/DELETE
- `src/app/api/projects/[id]/artifacts/[artifactId]/export/zip/route.ts` — ZIP

**Проблемы и решения:**
- `Uint8Array` от fflate → `Response` требует `ArrayBuffer` → fix: `zipped.buffer as ArrayBuffer`
- ShareLink модель уже была в schema.prisma из предыдущей сессии → агент пропустил дублирование
- `/share/*` не в middleware matcher (только `/app/*` protected) — проверено
- Middleware: `pathname.startsWith('/app')` — `/share/` не затронут

**⚠️ Pending SQL migration (применить в Supabase Dashboard):**
`prisma/migrations/e6_share.sql`
