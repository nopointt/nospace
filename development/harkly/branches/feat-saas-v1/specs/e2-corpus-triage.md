# EPIC SPEC — E2: Corpus Triage
> Tags: [corpus, sources, ingestion, screening, relevance, include-exclude]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L2 |
| **Token Budget** | ~300K |
| **Depends On** | E0 (data models), E1 (project + frame confirmed) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | Corpus finalization gate (пользователь явно подтверждает корпус) |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0, E1)
- [x] Out of Scope listed

---

## Problem Statement

После того как исследователь подтвердил frame (E1), ему нужно собрать корпус документов. В v1 это ручной импорт: вставить URL или загрузить файл. Система автоматически извлекает текст и ранжирует документы по релевантности к frame. Исследователь принимает Include/Exclude/Maybe решения. Корпус финализируется через явный HITL gate перед экстракцией (E3).

---

## Scope

**In scope:**
- URL импорт: пользователь вставляет URL → система скрейпит контент (server-side, headless)
- File upload: PDF, DOCX, TXT, CSV → text extraction
- Bulk URL import: textarea с несколькими URL (одна строка = один URL), до 50 за раз
- Document list view: таблица/карточки всех документов с метаданными
- AI relevance scoring: POST каждого документа к frame → cosine similarity score (0-1)
- Relevance badge: цветная метка (High/Medium/Low) на каждом документе
- Include/Exclude/Maybe решения: кнопки или горячие клавиши (I/E/M)
- Screening filter: tabs "All | Pending | Included | Excluded | Maybe"
- Document preview: клик на документ → preview panel или drawer с full text
- Batch operations: выделить несколько → bulk Include/Exclude
- Corpus finalization: кнопка "Finalize corpus" → HITL gate с подтверждением
- Corpus stats: total / included / excluded / maybe / pending
- Mock documents: seed-скрипт добавляет 10-15 документов к тестовым проектам
- Background processing: URL scraping и relevance scoring — async jobs (stateful, с индикатором прогресса)

**Out of scope:**
- API коннекторы (Reddit API, PubMed, etc.) — v2
- Browser extension для one-click capture — v2
- Автоматический поиск по интернету на основе frame — v2
- Inter-rater reliability (несколько рецензентов) — v2
- Citation extraction из документов — v2
- Дедупликация (fuzzy matching между документами) — v2
- OCR для отсканированных PDF — v2

---

## Workflow

```
User lands on /app/projects/[id]/corpus
        ↓
Empty state: "Add sources to get started"
    → URL input field (single or bulk paste)
    → File upload dropzone
        ↓
User adds sources
        ↓
Background jobs:
    1. URL scraping / file text extraction (SourceStatus: PENDING → PROCESSING → PROCESSED)
    2. Relevance scoring against project frame (cosine similarity)
        ↓
Document appears in list with:
    - Title (extracted or filename)
    - Source type badge
    - Relevance score (High/Med/Low)
    - Word count
    - Screening status (default: PENDING)
        ↓
User reviews documents:
    - Clicks Include / Exclude / Maybe (or I/E/M keys)
    - Opens preview to read full text
        ↓
User clicks "Finalize corpus"
    → Confirmation modal: "X included, Y pending. Continue with X documents?"
    → On confirm: corpus_finalized = true on project
    → Redirect / navigation cue to Extract stage (E3)
```

---

## UI Components & Layout

### `/app/projects/[id]/corpus`

**Layout:** Two-column when preview open (list 40% | preview 60%), single column otherwise

**Top bar:**
- "Add sources" button (opens AddSourcesPanel)
- Corpus stats strip: `{total} total · {included} included · {excluded} excluded · {pending} pending`
- "Finalize corpus" button (primary, disabled if 0 included documents)
- Filter tabs: All | Pending | Included | Excluded | Maybe

**Document list (left pane):**
- Each row: checkbox | title | source type badge | relevance badge | word count | screening buttons (Include / Exclude / Maybe) | date
- Active row highlighted (currently previewed)
- Skeleton loader rows during processing
- Status badge on processing documents: "Extracting text..." | "Scoring..."
- shadcn: `Table` or `Card` stack, `Badge`, `Button`, `Checkbox`, `Skeleton`

**Relevance badges:**
- High (≥0.7): green badge
- Medium (0.4-0.69): yellow badge
- Low (<0.4): gray badge
- Unscored: `—`

**Document preview (right pane / Drawer):**
- Title + URL/filename
- Metadata: author, date, domain, word count, source type
- Relevance score + explanation ("Matched: 'checkout', 'abandonment', 'mobile'")
- Full text (scrollable, max-height with overflow)
- Include / Exclude / Maybe buttons (large, prominent)
- shadcn: `Sheet` (Drawer) or inline panel, `ScrollArea`, `Separator`

**AddSourcesPanel (`components/corpus/AddSourcesPanel.tsx`):**
- Two tabs: "URLs" | "Files"
- URLs tab: `Textarea` for bulk paste (placeholder: "Paste URLs, one per line")
  - "Add X URLs" button
  - Validation: shows invalid URLs in red before submit
- Files tab: Dropzone (`@/components/ui/dropzone`) accepting PDF, DOCX, TXT, CSV
  - File list with remove buttons
  - "Upload X files" button
- shadcn: `Dialog` or `Sheet`, `Tabs`, `Textarea`, `Button`

**Finalization Modal:**
- Shows summary: "You have N included documents, M pending"
- Warning if pending > 0: "You have M unreviewed documents. They will not be extracted."
- Primary: "Finalize corpus (N documents)"
- Secondary: "Go back and review"
- shadcn: `AlertDialog`

---

## Background Processing Architecture

**Two async jobs (queued):**

### Job 1: Source Processing (`processSource`)
```
Input: source_id
Steps:
  1. Fetch URL (using fetch + cheerio for HTML parsing) OR read uploaded file
  2. Extract text content (strip HTML, extract meaningful text)
  3. Extract metadata (title from <title>, author from meta, publish date)
  4. Create Document record with extracted content
  5. Update Source.status = PROCESSED (or FAILED)
Output: document_id
```

For file upload:
- PDF: use `pdf-parse` (Node.js)
- DOCX: use `mammoth`
- TXT/CSV: read directly

### Job 2: Relevance Scoring (`scoreDocument`)
```
Input: document_id, project_id
Steps:
  1. Load project.frame
  2. Create frame embedding text: concatenate all frame fields
  3. Create document embedding: first 512 tokens of content
  4. Compute cosine similarity between frame embedding and document embedding
  5. Update Document.relevance_score
Output: relevance_score (0-1)
```

**In v1 (mock data mode for frontend):** Jobs are simulated with setTimeout delays (2-5s per doc) and static mock scores. Real NLP integration = E3.

**Job state tracking:** Use `Source.status` enum + polling from frontend (GET `/api/projects/[id]/sources` every 3s when any source is PROCESSING).

---

## API Routes

### POST `/api/projects/[id]/sources`
```typescript
// Body: { type: 'url', urls: string[] } | { type: 'file', file_paths: string[] }
// Response 201: { sources: Source[], queued: number }
// Queues processing jobs for each source
// Auth: required
```

### GET `/api/projects/[id]/sources`
```typescript
// Response 200: { sources: Source[], documents: DocumentWithScore[] }
// Returns sources with their documents and relevance scores
// Auth: required
```

### PATCH `/api/projects/[id]/documents/[docId]`
```typescript
// Body: { screening_status: ScreeningStatus, screening_reason?: string }
// Response 200: { document: Document }
// Auth: required
```

### POST `/api/projects/[id]/documents/batch-screen`
```typescript
// Body: { document_ids: string[], screening_status: ScreeningStatus }
// Response 200: { updated: number }
// Auth: required
```

### POST `/api/projects/[id]/corpus/finalize`
```typescript
// Body: {}
// Response 200: { project: ResearchProject, included_count: number }
// Sets project.corpus_finalized = true (add field to schema or use status flag)
// Validates: at least 1 included document
// Auth: required
```

### POST `/api/upload`
```typescript
// Multipart form: file
// Response 200: { file_path: string, file_name: string }
// Stores in /uploads/ or cloud storage
// Auth: required
```

---

## Data Model Additions

Add to `ResearchProject` schema:
```prisma
corpus_finalized Boolean @default(false)
corpus_finalized_at DateTime?
```

---

## Mock Data (Seed Script Update)

Add to `prisma/seed.ts` — 10-15 documents for "Checkout abandonment analysis" project:
- 5 INCLUDED documents (relevance_score 0.75-0.92)
- 3 EXCLUDED documents (relevance_score 0.15-0.30, reason: "off-topic")
- 2 MAYBE documents (relevance_score 0.45-0.55)
- 2 PENDING documents (relevance_score null, Source.status PROCESSING — simulates in-progress)

Document content: realistic placeholder text about e-commerce checkout UX (can be short, 200-500 words each).

---

## Acceptance Criteria (AC)

- [ ] **AC-201**: Corpus page (`/app/projects/[id]/corpus`) рендерится без ошибок
- [ ] **AC-202**: URL input принимает одну или несколько URL (bulk paste)
- [ ] **AC-203**: Невалидные URL подсвечиваются красным перед submit
- [ ] **AC-204**: Файловый upload принимает PDF, DOCX, TXT, CSV
- [ ] **AC-205**: Файлы > 10MB отклоняются с сообщением об ошибке
- [ ] **AC-206**: После добавления источника — документ появляется в списке со статусом "Processing..."
- [ ] **AC-207**: После завершения обработки — статус меняется на relevance badge (High/Med/Low) или error
- [ ] **AC-208**: Relevance score отображается как цветной badge: High (зелёный), Medium (жёлтый), Low (серый)
- [ ] **AC-209**: Клик на документ открывает preview panel с full text и метаданными
- [ ] **AC-210**: Кнопки Include/Exclude/Maybe изменяют `screening_status` в БД
- [ ] **AC-211**: Горячие клавиши I/E/M работают для текущего (focused) документа
- [ ] **AC-212**: Фильтр tabs (All/Pending/Included/Excluded/Maybe) фильтрует список корректно
- [ ] **AC-213**: Bulk select + batch Include/Exclude обновляет несколько документов за раз
- [ ] **AC-214**: Corpus stats strip показывает актуальные числа (total/included/excluded/pending)
- [ ] **AC-215**: "Finalize corpus" кнопка неактивна если `included_count === 0`
- [ ] **AC-216**: "Finalize corpus" открывает AlertDialog с summary
- [ ] **AC-217**: Подтверждение финализации устанавливает `corpus_finalized = true` в БД
- [ ] **AC-218**: После финализации — появляется navigation cue "→ Extract insights" (или подсвечивается следующий шаг в sidebar)
- [ ] **AC-219**: GET `/api/projects/[id]/sources` возвращает sources с documents для текущего проекта
- [ ] **AC-220**: Seed данные (10-15 документов) корректно загружаются через `bun run db:seed`
- [ ] **AC-221**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Corpus page | GET `/app/projects/[id]/corpus` (authenticated) | 200, renders |
| Source add (URL) | POST `/api/projects/:id/sources` `{"type":"url","urls":["https://example.com"]}` | 201, source queued |
| Source status | GET `/api/projects/:id/sources` | Returns sources with PROCESSED status (after seed) |
| Screen update | PATCH `/api/projects/:id/documents/:docId` `{"screening_status":"INCLUDED"}` | 200, status updated in DB |
| Batch screen | POST `/api/projects/:id/documents/batch-screen` `{"document_ids":[...],"screening_status":"EXCLUDED"}` | 200, all updated |
| Finalize | POST `/api/projects/:id/corpus/finalize` | 200, corpus_finalized=true |
| Finalize guard | POST finalize with 0 included documents | 422 error |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: source processing logic + screening state machine + finalization validation
- [ ] File upload stores files safely (не в репозитории, в `/uploads/` или env-configurable path)
- [ ] URL scraping не выполняется на клиенте (только server-side)
- [ ] Нет `any` типов
- [ ] Компоненты < 300 строк каждый
- [ ] Polling интервал (3s) очищается при unmount компонента (нет memory leaks)
