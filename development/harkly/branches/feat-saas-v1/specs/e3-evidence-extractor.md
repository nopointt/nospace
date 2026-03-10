# EPIC SPEC — E3: Evidence Extractor
> Tags: [nlp, extraction, facts, quotes, metrics, themes, triangulation, modal]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L3 |
| **Token Budget** | ~350K |
| **Depends On** | E0 (data models), E1 (frame), E2 (corpus finalized) |
| **Topology** | Single-Agent (Qwen) + async NLP pipeline |
| **HITL Checkpoint** | После extraction job — пользователь верифицирует/отклоняет извлечённые данные |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0, E1, E2)
- [x] Out of Scope listed

---

## Problem Statement

После финализации корпуса система должна автоматически извлечь структурированные данные из included документов: факты, метрики, цитаты, темы, противоречия между источниками. Каждая extracted единица должна иметь трассируемую ссылку на исходный документ и confidence score. Пользователь верифицирует извлечённое, отклоняет шум, добавляет аннотации. Результат — структурированная база данных для генерации артефактов в E4.

---

## Scope

**In scope:**
- Extraction pipeline trigger: кнопка "Run extraction" после финализации корпуса
- Extraction types: FACT, METRIC, QUOTE, THEME, CONTRADICTION
- NLP extraction через LLM API (Anthropic Claude или OpenAI) — по одному документу за раз, async
- Confidence score для каждой extraction (0-1)
- Source traceability: каждая extraction → document_id → source_id
- Contradiction detection: если 2+ документа делают противоположные claims — CONTRADICTION extraction
- Extraction review UI: таблица extractions с фильтрами по типу и статусу
- HITL: кнопки Verify (✓) / Reject (✗) на каждой extraction
- Inline annotation: пользователь может добавить комментарий к extraction
- Extraction progress indicator: X из Y документов обработано
- Coverage score: насколько каждый компонент frame покрыт extracted данными
- Mock extractions в seed data

**Out of scope:**
- Named Entity Recognition (NER) через специализированную модель — в v1 LLM справляется
- Knowledge graph визуализация — v2
- Relationship extraction (causal, temporal) — v2
- Cross-document entity resolution — v2
- Sentiment analysis как отдельный pipeline — в v1 sentiment извлекается в контексте QUOTE/FACT
- Автоматическое отклонение low-confidence extractions — пользователь решает сам

---

## Extraction Pipeline Design

### Per-document prompt (LLM call)

```
You are a research data extractor.

Research frame:
{frame_type}: {frame_fields_as_text}

Document to analyze:
---
{document_content_first_2000_tokens}
---

Extract ALL of the following from this document:
1. FACTS: specific claims, statements, findings (with confidence 0-1)
2. METRICS: numerical data, statistics, percentages (with exact numbers)
3. QUOTES: verbatim notable phrases (preserve exact wording)
4. THEMES: recurring topics or patterns (1-3 word labels)

For each item return JSON in this format:
{
  "extractions": [
    {
      "type": "FACT" | "METRIC" | "QUOTE" | "THEME",
      "content": "extracted text",
      "confidence": 0.85,
      "position_hint": "first paragraph" | "section 2" | "conclusion"
    }
  ]
}

Rules:
- Only extract what is explicitly stated in the document
- Do not infer or hallucinate
- QUOTE type: copy verbatim, preserve exact wording
- METRIC type: always include the number
- Minimum confidence to include: 0.5
- Maximum 20 extractions per document (most important only)
```

### Contradiction detection prompt (runs after all documents processed)

```
You are checking for contradictions across a research corpus.

Research frame: {frame}

Here are extractions from multiple documents:
{extractions_grouped_by_theme}

Identify pairs of DIRECTLY CONTRADICTING claims.
For each contradiction:
- claim_a: first claim text
- source_a: document title
- claim_b: contradicting claim text
- source_b: document title
- explanation: why these contradict

Return JSON: { "contradictions": [...] }
Only report genuine contradictions, not mere differences of emphasis.
Limit: 10 most important contradictions.
```

---

## Async Job Architecture

### Job: `extractDocument(document_id, project_id)`

```
1. Load document.content + project.frame
2. Call LLM API (Anthropic Claude)
3. Parse JSON response
4. For each extraction in response:
   - Create Extraction record { project_id, document_id, type, content, confidence, metadata }
5. Mark document as extraction_processed (add field to Document model)
6. Update extraction progress counter on project
```

### Job: `detectContradictions(project_id)`

```
Runs after all documents extracted.
1. Load all verified extractions for project (not rejected)
2. Group by THEME
3. Call LLM contradiction detection prompt
4. For each contradiction: create Extraction records of type CONTRADICTION
   - metadata: { claim_a, source_a_id, claim_b, source_b_id, explanation }
```

### Progress tracking

Add to `ResearchProject` schema:
```prisma
extraction_total    Int     @default(0)
extraction_done     Int     @default(0)
extraction_status   ExtractionStatus @default(NOT_STARTED)
```

```prisma
enum ExtractionStatus {
  NOT_STARTED
  RUNNING
  COMPLETED
  FAILED
}
```

Frontend polls GET `/api/projects/[id]/extraction-status` every 3s while RUNNING.

---

## UI Components & Layout

### `/app/projects/[id]/extract`

**Top bar:**
- "Run extraction" button (primary, visible when corpus_finalized AND extraction_status = NOT_STARTED)
- Re-run button (visible when COMPLETED, confirms overwrite)
- Progress bar (visible when RUNNING): "Extracting: 7 / 12 documents"
- "Detect contradictions" button (appears after extraction COMPLETED)

**Coverage Score panel:**
- Small card showing frame coverage: e.g., for PICO:
  - P (Population): ████░ 4 facts
  - I (Intervention): ██░░░ 2 facts
  - O (Outcome): ███░░ 3 facts
  - T (Time): █░░░░ 1 fact
- computed from extraction.metadata.frame_component (assigned during extraction)

**Extractions table:**
- Filter tabs: All | Facts | Metrics | Quotes | Themes | Contradictions
- Columns: Type badge | Content (truncated, expandable) | Source (doc title link) | Confidence badge | Status (Verified/Rejected/Pending) | Actions
- Row actions: Verify (✓) / Reject (✗) / Annotate (pencil icon → inline textarea)
- Contradiction rows: highlighted in orange, shows both conflicting sources
- Empty state per tab: "No facts extracted yet"

**Document source link:** clicking doc title in extraction row opens document preview (reuse from E2 Document preview component)

**shadcn:** `Table`, `TableRow`, `Badge` (for type + confidence), `Progress`, `Button`, `Textarea` (annotation), `Tooltip` (for confidence explanation)

---

## API Routes

### POST `/api/projects/[id]/extraction/run`
```typescript
// Body: {}
// Response 202: { job_id: string, total: number }
// Queues extraction jobs for all included documents
// Sets extraction_status = RUNNING
// Auth: required
// Validation: corpus_finalized must be true
```

### GET `/api/projects/[id]/extraction-status`
```typescript
// Response 200: { status: ExtractionStatus, done: number, total: number }
// Auth: required
```

### GET `/api/projects/[id]/extractions`
```typescript
// Query: type?: ExtractionType, status?: 'verified'|'rejected'|'pending'
// Response 200: { extractions: ExtractionWithDocument[] }
// ExtractionWithDocument includes document.title + document.source.url
// Auth: required
```

### PATCH `/api/projects/[id]/extractions/[extractionId]`
```typescript
// Body: { verified?: boolean, rejected?: boolean, annotation?: string }
// verified and rejected are mutually exclusive
// Response 200: { extraction: Extraction }
// Auth: required
```

### POST `/api/projects/[id]/extraction/detect-contradictions`
```typescript
// Body: {}
// Response 202: { job_id: string }
// Runs contradiction detection on verified extractions
// Auth: required
```

---

## Data Model Additions

Add to `Document`:
```prisma
extraction_processed Boolean @default(false)
```

Add to `Extraction`:
```prisma
annotation String?
```

Add to `ResearchProject`:
```prisma
extraction_total  Int              @default(0)
extraction_done   Int              @default(0)
extraction_status ExtractionStatus @default(NOT_STARTED)
```

---

## Mock Data (Seed Script Update)

Add to seed — 30-50 extractions for "Checkout abandonment analysis":
- 15 FACT extractions (5 verified, 5 pending, 5 rejected) — various confidence 0.6-0.95
- 8 METRIC extractions (e.g., "73% of users abandon at payment step") — all pending
- 10 QUOTE extractions (e.g., "It felt too complicated") — 5 verified
- 5 THEME extractions (e.g., "Payment friction", "Trust issues", "Form complexity")
- 2 CONTRADICTION extractions (conflicting claims about abandonment rates)

---

## Acceptance Criteria (AC)

- [ ] **AC-301**: Extract page (`/app/projects/[id]/extract`) рендерится без ошибок
- [ ] **AC-302**: "Run extraction" кнопка отсутствует если `corpus_finalized = false`
- [ ] **AC-303**: "Run extraction" кнопка присутствует если `corpus_finalized = true`
- [ ] **AC-304**: POST `/api/projects/[id]/extraction/run` возвращает 202 и устанавливает `extraction_status = RUNNING`
- [ ] **AC-305**: Progress bar отображает "X / Y documents" и обновляется при polling
- [ ] **AC-306**: После завершения extraction — таблица заполняется extracted данными
- [ ] **AC-307**: Filter tabs (Facts/Metrics/Quotes/Themes/Contradictions) фильтруют таблицу
- [ ] **AC-308**: Каждая extraction показывает: content, source document title, confidence badge, status
- [ ] **AC-309**: Confidence badge: High (≥0.8 зелёный), Medium (0.6-0.79 жёлтый), Low (<0.6 серый)
- [ ] **AC-310**: Кнопка Verify (✓) устанавливает `verified = true`, Reject (✗) устанавливает `rejected = true`
- [ ] **AC-311**: Verified и Rejected статусы взаимно исключают друг друга
- [ ] **AC-312**: Annotation textarea сохраняет аннотацию к extraction
- [ ] **AC-313**: Клик на source document title открывает document preview (из E2)
- [ ] **AC-314**: CONTRADICTION extractions подсвечены (оранжевый фон/бордер)
- [ ] **AC-315**: CONTRADICTION строки показывают оба conflicting source title
- [ ] **AC-316**: Coverage score panel показывает frame coverage по компонентам
- [ ] **AC-317**: "Detect contradictions" кнопка появляется после COMPLETED extraction
- [ ] **AC-318**: POST detect-contradictions создаёт CONTRADICTION extractions в БД
- [ ] **AC-319**: GET `/api/projects/[id]/extractions` возвращает extractions с document metadata
- [ ] **AC-320**: Seed данные загружаются без ошибок (30-50 extractions)
- [ ] **AC-321**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Extract page | GET `/app/projects/[id]/extract` (authenticated) | 200, renders |
| Run extraction | POST `/api/projects/:id/extraction/run` (corpus finalized) | 202, status=RUNNING |
| Guard | POST extraction/run when corpus NOT finalized | 422 error |
| Status poll | GET `/api/projects/:id/extraction-status` | Returns status + progress |
| Extractions list | GET `/api/projects/:id/extractions` | Returns extractions with document info |
| Verify | PATCH `/api/projects/:id/extractions/:id` `{"verified":true}` | 200, verified=true |
| Reject | PATCH same + `{"rejected":true}` (previously verified) | 200, verified=false, rejected=true |
| Contradiction | POST detect-contradictions | 202, new CONTRADICTION extractions created |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: extraction job logic (mock LLM) + verify/reject state machine + contradiction detection
- [ ] LLM calls only in server-side routes/jobs (не на клиенте)
- [ ] LLM API key в env variables (не hardcoded)
- [ ] Document content truncated to 2000 tokens before LLM call (cost control)
- [ ] Нет `any` типов
- [ ] Polling cleanup on unmount (no memory leaks)
