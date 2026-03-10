# EPIC SPEC — E1: Framing Studio
> Tags: [framing, pico, hmw, issue-tree, ai, research-question, omnibar]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L2 |
| **Token Budget** | ~350K |
| **Depends On** | E0 (scaffold, auth, data models) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | После AI call интеграции (нужен LLM API key) |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0)
- [x] Out of Scope listed

---

## Problem Statement

Исследователь приходит с размытым вопросом ("Почему пользователи не возвращаются после первой покупки?"). Framing Studio помогает превратить его в структурированный исследовательский frame (PICO, HMW, Issue Tree, или Free-form), который затем управляет всем workflow — какие источники искать, что извлекать, какие артефакты генерировать. Без чёткого frame — нет ориентира для системы.

---

## Scope

**In scope:**
- Omnibar: единая точка ввода исследовательского вопроса (глобальная + в контексте проекта)
- Создание Research Project через Omnibar или кнопку
- Framing Studio: UI с 4 фреймворками (PICO, HMW, Issue Tree, Free-form)
- AI-переформулирование вопроса в выбранном фреймворке (LLM call через Next.js API route → Modal.com или прямо Anthropic/OpenAI API)
- Подтверждение frame пользователем (HITL gate)
- Сохранение frame в `research_projects.frame` (JSON) и `frame_type`
- Frame отображается как sticky context bar в App Layout при открытом проекте
- Dashboard проектов: список проектов workspace, создание/архивация
- Переход от Framing → Corpus Triage (кнопка "Start gathering sources")
- Mock data для проекта: seed-скрипт с 1-2 тестовыми проектами

**Out of scope:**
- Реальный сбор источников (E2)
- CoCoPop, SPIDER, SPICE фреймворки (v2)
- Foresight / Horizon Scanning (v2)
- Несколько веток (branches) одного проекта (v2)
- Шаблонная библиотека frames из прошлых проектов (v2)
- Совместная работа / комментарии (v2)

---

## Workflow

```
User arrives at /app/dashboard
        ↓
Sees projects list + "New Research" button (or Omnibar Cmd+K)
        ↓
Types question: "Why do users abandon checkout?"
        ↓
Framing Studio modal opens
    → Shows 4 framework tabs: PICO | HMW | Issue Tree | Free-form
    → Default: PICO
    → Each tab shows AI-suggested decomposition of the question
        ↓
User reviews, edits fields
        ↓
User clicks "Confirm Frame" (HITL gate)
        ↓
ResearchProject created, frame saved
        ↓
Redirect to /app/projects/[id]/frame (project view with confirmed frame)
        ↓
User clicks "Start gathering" → /app/projects/[id]/corpus (E2)
```

---

## UI Components & Layout

### `/app/dashboard`
- Header: "Your Research" + "New Research" button
- Projects grid: `Card` per project (title, frame_type badge, status, date, progress indicator)
- Empty state: illustration + "Start your first research" CTA
- shadcn: `Card`, `Badge`, `Button`, `DropdownMenu` (archive/delete)

### Omnibar (`components/omnibar/Omnibar.tsx`)
- Accessible via `Cmd+K` (keyboard shortcut) globally
- `Dialog` overlay with `Input` field
- Placeholder: "Ask a research question or search..."
- On submit: triggers Framing Studio
- Also: search existing projects (basic text filter)
- shadcn: `Command`, `CommandInput`, `CommandList`

### Framing Studio (`components/framing/FramingStudio.tsx`)
- Rendered inside `Dialog` (modal) or full-page `Sheet`
- Top: question input (pre-filled from Omnibar)
- Tab switcher: PICO | HMW | Issue Tree | Free-form
- Each tab shows a form with relevant fields + AI suggestion
- AI suggestion: `Skeleton` loader while generating, then text with "Use this" / "Edit" buttons
- "Confirm Frame" button (primary action, disabled until frame has required fields)
- "Save as draft" (saves without confirming)
- shadcn: `Tabs`, `TabsContent`, `Textarea`, `Input`, `Button`, `Skeleton`, `Badge`

### PICO Frame fields
```
P (Population): WHO is studied?
I (Intervention): WHAT change or factor?
C (Comparison): Compared to WHAT?
O (Outcome): WHAT is measured/observed?
T (Time): WHEN / over what period?
```

### HMW Frame fields
```
How Might We: [full HMW statement]
User: WHO we're designing for
Context: WHEN/WHERE
Goal: WHAT they're trying to do
Constraint: WHAT makes this hard
```

### Issue Tree Frame fields
```
Core Question: [main question]
Branch 1: [first sub-question / hypothesis]
Branch 2: [second sub-question / hypothesis]
Branch 3: [optional third sub-question]
Key Metrics: [how will we know the answer?]
```

### Free-form Frame fields
```
Research Question: [free text]
Scope: [what's in/out]
Success Criteria: [how will we know we're done?]
```

### Project View (`/app/projects/[id]`)
- Left sidebar: project nav (Frame | Corpus | Extract | Canvas | Notebook | Share)
- Active stage highlighted
- Top bar: project title + frame type badge
- Frame context bar (collapsible): sticky below top bar, shows confirmed frame summary
- Main area: stage-specific content
- shadcn: `Tabs` (sidebar nav), `Collapsible`, `Breadcrumb`

### Frame View (`/app/projects/[id]/frame`)
- Shows confirmed frame in read-only mode
- "Edit Frame" button → re-opens Framing Studio in edit mode
- "Reset & Reframe" button (with confirmation dialog) → clears frame, restarts process
- Warning: resetting frame will not delete gathered sources/extractions (data preserved)

---

## API Routes

### POST `/api/projects`
```typescript
// Body: { workspace_id: string, title: string }
// Response 201: { project: ResearchProject }
// Response 422: { error: "title is required" }
// Auth: required
```

### GET `/api/projects`
```typescript
// Query: workspace_id
// Response 200: { projects: ResearchProject[] }
// Auth: required
```

### GET `/api/projects/[id]`
```typescript
// Response 200: { project: ResearchProject }
// Response 404: { error: "Not found" }
// Auth: required, must be workspace member
```

### PATCH `/api/projects/[id]/frame`
```typescript
// Body: { frame_type: FrameType, frame: object, confirmed: boolean }
// Response 200: { project: ResearchProject }
// Auth: required, must be workspace member
```

### DELETE `/api/projects/[id]`
```typescript
// Soft delete: sets status = ARCHIVED
// Response 200: { success: true }
// Auth: required, must be OWNER or ADMIN
```

### POST `/api/ai/frame-suggest`
```typescript
// Body: { question: string, frame_type: FrameType }
// Response 200: { suggestion: object } // shape matches frame_type fields
// Response 500: { error: "AI unavailable" }
// Auth: required
// Note: streams response (SSE) if question is long
```

---

## AI Frame Suggestion

### Prompt per frame type

**PICO:**
```
You are a research question structuring expert.
The user has this question: "{question}"
Decompose it into PICO format:
- P (Population): who is being studied?
- I (Intervention): what action, change, or factor?
- C (Comparison): compared to what baseline?
- O (Outcome): what is measured or observed?
- T (Time): over what time period?
Return JSON: {"p": "...", "i": "...", "c": "...", "o": "...", "t": "..."}
Be concise. Each field: 1-2 sentences max.
```

**HMW:**
```
You are a design researcher.
The user has this question: "{question}"
Reframe it as a "How Might We" question:
- hmw: the full HMW statement (start with "How might we...")
- user: who we're designing for
- context: when/where this happens
- goal: what they're trying to achieve
- constraint: what makes this difficult
Return JSON: {"hmw": "...", "user": "...", "context": "...", "goal": "...", "constraint": "..."}
```

**Issue Tree:**
```
You are a McKinsey-style analyst.
The user has this question: "{question}"
Decompose into an issue tree:
- core_question: the main question restated precisely
- branch_1: first key sub-question or hypothesis
- branch_2: second key sub-question or hypothesis
- branch_3: third sub-question (optional, leave empty if 2 suffice)
- key_metrics: how will we know we've answered the core question?
Return JSON: {"core_question": "...", "branch_1": "...", "branch_2": "...", "branch_3": "...", "key_metrics": "..."}
```

---

## Mock Data (Seed Script)

File: `prisma/seed.ts`

Creates for a test user:
- 1 workspace "Demo Workspace"
- 2 research projects:
  1. "Checkout abandonment analysis" — PICO frame, status ACTIVE, frame confirmed
  2. "Onboarding friction research" — HMW frame, status ACTIVE, frame in draft

---

## Acceptance Criteria (AC)

- [ ] **AC-101**: Dashboard (`/app/dashboard`) рендерится список проектов workspace
- [ ] **AC-102**: "New Research" button и `Cmd+K` открывают Omnibar
- [ ] **AC-103**: Ввод вопроса в Omnibar открывает Framing Studio с предзаполненным вопросом
- [ ] **AC-104**: Framing Studio отображает 4 таба: PICO, HMW, Issue Tree, Free-form
- [ ] **AC-105**: Выбор таба PICO показывает 5 полей (P, I, C, O, T)
- [ ] **AC-106**: Выбор таба HMW показывает 5 полей (HMW, User, Context, Goal, Constraint)
- [ ] **AC-107**: Выбор таба Issue Tree показывает 5 полей (Core, Branch1, Branch2, Branch3, Metrics)
- [ ] **AC-108**: Выбор таба Free-form показывает 3 поля (Question, Scope, Success Criteria)
- [ ] **AC-109**: POST `/api/ai/frame-suggest` с валидным question + frame_type возвращает JSON suggestion
- [ ] **AC-110**: AI suggestion отображается в полях (с Skeleton loader пока грузится)
- [ ] **AC-111**: Пользователь может редактировать любое поле frame вручную
- [ ] **AC-112**: Кнопка "Confirm Frame" активна только когда заполнены обязательные поля
- [ ] **AC-113**: Подтверждение frame создаёт ResearchProject в БД с правильным frame JSON
- [ ] **AC-114**: После подтверждения — редирект на `/app/projects/[id]/frame`
- [ ] **AC-115**: Frame context bar отображает сводку подтверждённого frame (collapsible)
- [ ] **AC-116**: Левый sidebar проекта содержит навигацию: Frame | Corpus | Extract | Canvas | Notebook | Share
- [ ] **AC-117**: "Edit Frame" кнопка открывает Framing Studio в edit mode с текущими значениями
- [ ] **AC-118**: "Start gathering" кнопка ведёт на `/app/projects/[id]/corpus`
- [ ] **AC-119**: GET `/api/projects` возвращает только проекты текущего workspace
- [ ] **AC-120**: PATCH `/api/projects/[id]/frame` обновляет frame в БД
- [ ] **AC-121**: Архивация проекта через меню устанавливает `status = ARCHIVED`, проект исчезает из основного списка
- [ ] **AC-122**: Seed скрипт (`bun run db:seed`) создаёт 2 тестовых проекта без ошибок
- [ ] **AC-123**: Нет TypeScript ошибок в новых файлах

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Seed | `bun run db:seed` | 2 projects created in DB |
| Dashboard | GET `/app/dashboard` (authenticated) | Projects list renders, no console errors |
| Omnibar | Cmd+K in browser | Omnibar dialog opens |
| PICO suggest | POST `/api/ai/frame-suggest` `{"question":"why users abandon cart","frame_type":"PICO"}` | JSON with p/i/c/o/t fields |
| Frame save | PATCH `/api/projects/:id/frame` with valid body | 200, frame saved in DB |
| Guard | GET `/app/projects/[id]` without auth | Redirect to /login |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: Framing Studio form validation + `/api/projects` CRUD + `/api/ai/frame-suggest` (mock LLM)
- [ ] AI call изолирован в `/api/ai/frame-suggest` route (не вызывается напрямую из компонента)
- [ ] `NEXT_PUBLIC_*` переменные не содержат серверных секретов
- [ ] Нет `any` типов
- [ ] Все компоненты: файлы < 300 строк
