# EPIC SPEC — E5: Research Notebook
> Tags: [notebook, notes, semantic-search, auto-surfacing, persistent-layer, sidebar]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L2 |
| **Token Budget** | ~300K |
| **Depends On** | E0 (data models, notes table), E1 (project context) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | Нет автоматических actions — пользователь решает что сохранять |

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

Notebook — это постоянный слой, доступный на всех стадиях исследования (не шестой этап, а ортогональный компонент). Исследователи думают во время чтения, приходят к выводам до полной экстракции, фиксируют слабые сигналы. Notebook должен быть всегда под рукой (collapsible sidebar), позволять писать заметки, привязывать их к конкретным документам, и автоматически показывать связанные заметки при работе с конкретным документом или extraction.

---

## Scope

**In scope:**
- Collapsible Notebook sidebar (правая панель) — доступна на всех страницах проекта
- Создание заметок: текстовый editor с минимальным форматированием (Markdown)
- Привязка заметки к документу(ам): тег `#doc:[title]` или кнопка "Link to current doc"
- Привязка заметки к extraction: кнопка "Link to this extraction" из E3
- Теги (string tags): пользователь добавляет произвольные теги к заметкам
- Поиск заметок: text search по content + tags
- Semantic auto-surfacing: при просмотре документа или extraction — sidebar показывает семантически связанные заметки
- Хронологический feed: все заметки проекта в порядке создания
- Filter: All | Tagged | Linked to docs | Untagged
- Note detail view: развернуть заметку с полным содержимым + ссылки
- Notebook страница (отдельный view): `/app/projects/[id]/notebook` с полным списком заметок

**Out of scope:**
- Knowledge graph визуализация — v2
- Автоматическая категоризация заметок (clustering) — v2
- Экспорт Notebook в документ — v2
- Weak signals detection (темпоральный тренд-анализ) — v2
- Связывание заметок между проектами — v2
- Rich text editor (images, tables) — v2 (в v1: plain text + Markdown)
- Collaboration: заметки видны только автору в v1

---

## Semantic Auto-Surfacing Design

При открытии документа preview (E2) или extraction row (E3):
1. Берётся content документа / extraction text
2. Вычисляется similarity против всех заметок проекта (простое keyword overlap в v1)
3. Top 3 related notes показываются в Notebook sidebar с badge "Related"

**v1 implementation:** keyword-based matching (tokenize content, count shared tokens with notes, rank). No embedding API calls for notes in v1 — too expensive per-keystroke. Semantic embeddings for notes → v2.

**Trigger:** debounced (500ms) after user focuses on document preview or extraction row.

---

## Notebook Data Model

Already defined in E0 (`Note` model):
```prisma
model Note {
  id             String   @id @default(uuid())
  project_id     String
  user_id        String
  content        String   // Markdown text
  tags           String[]
  linked_doc_ids String[] // array of document_ids
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}
```

No additional migrations needed for v1.

---

## UI Components & Layout

### Notebook Sidebar (`components/notebook/NotebookSidebar.tsx`)

**Trigger:** Notebook icon in right side of App Layout, or keyboard shortcut `Cmd+Shift+N`

**Collapsed state:** icon button on right edge of screen

**Expanded state:** 320px panel sliding in from right
- Header: "Notebook" + collapse button + "New note" button
- Search bar: text input for searching notes
- Filter chips: All | Linked | Tagged
- Notes list (scrollable):
  - Each note: first 2 lines of content + tag badges + date + actions (edit, delete)
  - "Related" badge if auto-surfaced based on current context
- "New note" form (inline, at top of list):
  - `Textarea` for content (Markdown)
  - Tag input: `Input` + Enter to add tag
  - "Link to current" button (links to whatever document/extraction is currently in focus)
  - Save / Cancel buttons

**Related notes section (when document/extraction focused):**
- Shown above full notes list
- "Related to current document:" heading
- Top 3 matched notes highlighted with "Related" badge

shadcn: `Sheet` (slide-over), `Textarea`, `Input`, `Badge`, `Button`, `ScrollArea`, `Separator`

### Notebook Full Page (`/app/projects/[id]/notebook`)

- Full-width layout (no sidebar overlap)
- Left: notes list (same as sidebar but wider, with more metadata)
- Right: note detail view (full content, linked docs, tags, edit mode)
- Header actions: "New note", search, filters
- shadcn: `ResizablePanel`, `Card`, `Textarea`, `Badge`

### Note Detail View
- Full Markdown content (rendered as HTML via `react-markdown`)
- Linked documents section: list of linked doc titles (clickable → opens doc preview)
- Tags: editable badge list
- Created/Updated timestamps
- "Edit" button → switches to edit mode (`Textarea` with current content)
- "Delete" button → `AlertDialog` confirmation

---

## API Routes

### POST `/api/projects/[id]/notes`
```typescript
// Body: { content: string, tags?: string[], linked_doc_ids?: string[] }
// Response 201: { note: Note }
// Validation: content required and non-empty
// Auth: required
```

### GET `/api/projects/[id]/notes`
```typescript
// Query: search?: string, tag?: string
// Response 200: { notes: Note[] }
// Text search: basic ILIKE on content + tags
// Ordered by: created_at DESC
// Auth: required
```

### PATCH `/api/projects/[id]/notes/[noteId]`
```typescript
// Body: { content?: string, tags?: string[], linked_doc_ids?: string[] }
// Response 200: { note: Note }
// Partial update: only provided fields updated
// Auth: required, must be note owner
```

### DELETE `/api/projects/[id]/notes/[noteId]`
```typescript
// Response 200: { success: true }
// Auth: required, must be note owner
```

### GET `/api/projects/[id]/notes/related`
```typescript
// Query: context_text: string (document content or extraction text)
// Response 200: { notes: Note[] } (top 3, sorted by relevance score)
// Scoring: keyword overlap (tokenize both, count shared tokens / min(len_a, len_b))
// Auth: required
```

---

## Mock Data (Seed Script Update)

Add to seed for "Checkout abandonment analysis":
- 5 notes:
  1. "Users seem more comfortable with saved card options — worth investigating if 1-click checkout matters here" (tags: ["hypothesis", "payment"], linked_doc_ids: [doc_1_id])
  2. "Trust signals are consistently mentioned across 4 different sources — this is a strong theme" (tags: ["trust", "strong-signal"])
  3. "Contradiction between Report A (73% abandon at payment) and Blog B (52%) — need to check methodology" (tags: ["contradiction", "metrics"])
  4. "Mobile checkout friction much higher — might be separate PICO needed" (tags: ["mobile", "scoping"])
  5. "Key insight: the problem isn't form length, it's unexpected costs at last step" (tags: ["insight", "priority"])

---

## Acceptance Criteria (AC)

- [ ] **AC-501**: Notebook sidebar открывается через иконку или `Cmd+Shift+N`
- [ ] **AC-502**: Notebook sidebar доступна на всех страницах проекта (Frame, Corpus, Extract, Canvas)
- [ ] **AC-503**: "New note" форма в sidebar создаёт заметку через POST `/api/projects/[id]/notes`
- [ ] **AC-504**: Заметка сохраняется с content, tags, linked_doc_ids
- [ ] **AC-505**: Новая заметка мгновенно появляется в списке (optimistic update)
- [ ] **AC-506**: Поиск по заметкам фильтрует список в реальном времени (debounced 300ms)
- [ ] **AC-507**: Тег добавляется через Enter в tag input, отображается как `Badge`
- [ ] **AC-508**: "Link to current" привязывает заметку к открытому документу
- [ ] **AC-509**: Linked документы отображаются в note detail как кликабельные ссылки
- [ ] **AC-510**: Клик на linked document открывает document preview (из E2)
- [ ] **AC-511**: При фокусе на документ preview — sidebar показывает Related notes (top 3)
- [ ] **AC-512**: Related notes подсвечены "Related" badge
- [ ] **AC-513**: Фильтр "Linked" показывает только заметки с linked_doc_ids.length > 0
- [ ] **AC-514**: Фильтр "Tagged" показывает только заметки с tags.length > 0
- [ ] **AC-515**: Editing заметки через PATCH обновляет content в БД
- [ ] **AC-516**: Delete заметки с подтверждением удаляет запись из БД
- [ ] **AC-517**: Notebook full page (`/app/projects/[id]/notebook`) рендерится
- [ ] **AC-518**: Full page показывает полный список заметок с note detail view
- [ ] **AC-519**: GET `/api/projects/[id]/notes?search=trust` возвращает только matching заметки
- [ ] **AC-520**: GET `/api/projects/[id]/notes/related?context_text=...` возвращает top 3
- [ ] **AC-521**: Seed заметки (5 штук) загружаются без ошибок
- [ ] **AC-522**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Create note | POST `/api/projects/:id/notes` `{"content":"test note","tags":["test"]}` | 201, note created |
| Get notes | GET `/api/projects/:id/notes` | Returns notes list |
| Search | GET `/api/projects/:id/notes?search=payment` | Returns matching notes |
| Related | GET `/api/projects/:id/notes/related?context_text=checkout+form+friction` | Returns ≤3 related notes |
| Update | PATCH `/api/projects/:id/notes/:id` `{"content":"updated"}` | 200, content updated |
| Delete | DELETE `/api/projects/:id/notes/:id` | 200, note removed from DB |
| Auth guard | POST note without auth | 401 |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: CRUD operations + related notes scoring algorithm + search
- [ ] Notebook sidebar не вызывает layout shift при открытии (CSS transition smooth)
- [ ] Auto-surfacing debounced (не вызывается при каждом keystroke)
- [ ] Нет `any` типов
- [ ] Sidebar state сохраняется в localStorage (открыт/закрыт между навигациями)
