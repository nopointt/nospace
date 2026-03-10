# EPIC SPEC — E4: Insight Canvas
> Tags: [artifacts, fact-pack, evidence-map, empathy-map, synthesis, export]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L3 |
| **Token Budget** | ~400K |
| **Depends On** | E0 (data models), E3 (extractions verified) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | Review artifacts before export/share |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0, E1, E2, E3)
- [x] Out of Scope listed

---

## Problem Statement

После того как исследователь проверил extracted данные (E3), система должна автоматически сгенерировать три ключевых артефакта: Fact Pack (структурированная таблица фактов с источниками), Evidence Map (матрица покрытия тем vs силы доказательств), Empathy Map (SAY/THINK/DO/FEEL квадрант из corpus). Пользователь редактирует автогенерированные черновики и экспортирует в Markdown или PDF.

---

## Scope

**In scope:**
- Insight Canvas страница с 3 табами: Fact Pack | Evidence Map | Empathy Map
- "Generate [artifact]" кнопка для каждого артефакта → async generation job
- Fact Pack: таблица verified FACT + METRIC extractions, сгруппированная по теме
- Evidence Map: матрица (темы × evidence strength), с индикацией gaps
- Empathy Map: 4 квадранта (SAY/THINK/DO/FEEL), заполненные из QUOTE + FACT extractions
- Редактирование артефактов: inline editing ячеек/карточек
- Версионирование: сохранение каждого edit как версии (version history)
- Export: Markdown и PDF для каждого артефакта
- "Regenerate" кнопка (с предупреждением о перезаписи)
- Mock artifacts в seed data

**Out of scope:**
- Journey Map — v2
- PRISMA Flow Diagram — v2
- Signal Log — v2
- PPTX export — v2
- Audience presets (C-Suite/Product/Research formats) — v2
- Sharing link для артефакта — E6
- Collaboration (комментарии, совместное редактирование) — v2
- Cross-artifact synthesis (связи между артефактами) — v2

---

## Artifact Data Structures

### Fact Pack
```typescript
type FactPackContent = {
  themes: {
    name: string
    facts: {
      text: string
      source_document_id: string
      source_title: string
      confidence: number
      is_metric: boolean  // true for METRIC type extractions
      contradicted: boolean  // true if matched with a CONTRADICTION
    }[]
  }[]
  generated_at: string
  extraction_count: number
}
```

### Evidence Map
```typescript
type EvidenceMapContent = {
  frame_components: string[]  // e.g., ["Population", "Intervention", "Outcome"] for PICO
  themes: string[]
  matrix: {
    theme: string
    components: {
      component: string
      strength: 'strong' | 'moderate' | 'weak' | 'gap'
      // strong = 3+ verified facts, moderate = 1-2, weak = 1 low-confidence, gap = none
      fact_count: number
    }[]
  }[]
  generated_at: string
}
```

### Empathy Map
```typescript
type EmpathyMapContent = {
  say: {
    text: string  // verbatim quote or paraphrase
    source_document_id: string
    source_title: string
    is_quote: boolean  // true if verbatim QUOTE extraction
  }[]
  think: {
    text: string
    source_document_id: string
    source_title: string
  }[]
  do: {
    text: string
    source_document_id: string
    source_title: string
  }[]
  feel: {
    text: string
    source_document_id: string
    source_title: string
  }[]
  subject: string  // who the map is about (from frame P component)
  generated_at: string
}
```

---

## Artifact Generation Prompts

### Fact Pack generation
```
Group and organize these verified research extractions into a Fact Pack.

Project frame: {frame}
Extractions (facts + metrics):
{extractions_as_json}

Instructions:
1. Group facts into 3-7 thematic categories
2. Name each category clearly (2-4 words)
3. Within each category, list facts ordered by confidence (high first)
4. Identify which facts are metrics (contain numbers)
5. Flag any facts that have contradictions in the corpus

Return JSON matching FactPackContent structure.
Use the exact extraction content — do not paraphrase.
```

### Evidence Map generation
```
Create an Evidence Map showing research coverage.

Project frame ({frame_type}): {frame_fields}
Frame components: {list of P/I/C/O/T or equivalent}
Verified themes from extractions: {themes_list}
Extractions by theme: {extractions_grouped_by_theme}

For each theme × frame component combination, assess evidence strength:
- strong: 3+ independent verified facts directly addressing this component
- moderate: 1-2 verified facts
- weak: 1 low-confidence or indirect fact
- gap: no evidence found

Return JSON matching EvidenceMapContent structure.
```

### Empathy Map generation
```
Create an Empathy Map from this research corpus.

Research subject (who this is about): {frame_population}
Verified extractions (quotes, facts, themes):
{extractions_as_json}

Map each extraction to the most appropriate quadrant:
- SAY: things the subject says or expresses (use QUOTE extractions first)
- THINK: beliefs, concerns, mental models (FACT extractions about cognition/beliefs)
- DO: behaviors, actions, patterns (FACT extractions about behavior)
- FEEL: emotions, frustrations, satisfactions (sentiment-bearing QUOTE and FACT)

Rules:
- Each item in SAY/THINK/DO/FEEL: 1-2 sentences
- SAY: prefer verbatim quotes with "quotation marks"
- Maximum 6 items per quadrant
- If extraction doesn't fit any quadrant, omit it

Return JSON matching EmpathyMapContent structure.
Subject: use the P (Population) from frame.
```

---

## UI Components & Layout

### `/app/projects/[id]/canvas`

**Tab bar:** Fact Pack | Evidence Map | Empathy Map
- Each tab shows generation status: Not generated | Generating... | Generated (date)
- "Generate" or "Regenerate" button on each tab

**Fact Pack tab:**
- Section per theme (collapsible `Accordion`)
- Each fact row: checkbox | fact text | source link | confidence badge | metric tag | contradiction warning ⚠
- "Edit" inline: click fact text → becomes `Textarea`
- "Add fact manually" at bottom of each section
- "Export Markdown" + "Export PDF" buttons (top right)
- shadcn: `Accordion`, `Badge`, `Button`, `Textarea`, `Tooltip`

**Evidence Map tab:**
- Table: rows = themes, columns = frame components
- Each cell: colored badge (Strong/Moderate/Weak/Gap)
  - Strong: filled green circle
  - Moderate: half-filled yellow circle
  - Weak: outline yellow circle
  - Gap: dashed red outline circle + "Missing" text
- Hover on cell: tooltip showing supporting fact count
- Click on cell: side panel with supporting extractions list
- "Export Markdown" + "Export PDF" buttons
- shadcn: `Table`, `Badge`, `Tooltip`, `Sheet` (side panel)

**Empathy Map tab:**
- 2×2 grid layout: SAY (top-left) | THINK (top-right) | DO (bottom-left) | FEEL (bottom-right)
- Each quadrant: header with icon + color, list of items
- Each item: text + source link + delete button
- "Add item" button per quadrant → inline input
- "Edit" mode toggle: all items become editable
- Subject label: "About: {population_from_frame}"
- "Export Markdown" + "Export PDF" buttons
- shadcn: `Card`, `Button`, `Input`, `Badge`, `ScrollArea`

**Version history (accessible via "History" button):**
- Drawer with list of versions: "Generated 2026-03-08 14:32" | "Edited 2026-03-08 15:01"
- Click version → preview (read-only)
- "Restore this version" button
- shadcn: `Sheet`, `ScrollArea`

---

## Export Format Specifications

### Markdown export — Fact Pack
```markdown
# Fact Pack: {project_title}
**Generated:** {date} | **Frame:** {frame_type}

---

## {Theme Name}

| Fact | Source | Confidence |
|------|--------|------------|
| {fact_text} | [{source_title}]({source_url}) | {confidence%} |
| **{metric_text}** *(metric)* | [{source_title}]({source_url}) | {confidence%} |
| ~~{contradicted_fact}~~ ⚠ contradicted | ... | ... |
```

### Markdown export — Evidence Map
```markdown
# Evidence Map: {project_title}

| Theme | {Component1} | {Component2} | {Component3} |
|-------|-------------|-------------|-------------|
| {theme} | 🟢 Strong | 🟡 Moderate | 🔴 Gap |
```

### Markdown export — Empathy Map
```markdown
# Empathy Map: {project_title}
**Subject:** {population}

## 💬 SAY
- "{quote text}" — *{source_title}*

## 💭 THINK
- {thought} — *{source_title}*

## 🎯 DO
- {behavior} — *{source_title}*

## ❤️ FEEL
- {feeling} — *{source_title}*
```

### PDF export
- Server-side PDF generation using `@react-pdf/renderer` or `puppeteer` screenshot
- Same content as Markdown but with visual styling

---

## API Routes

### POST `/api/projects/[id]/artifacts`
```typescript
// Body: { artifact_type: ArtifactType }
// Response 202: { job_id: string }
// Queues artifact generation job
// Generates new Artifact record (or new version if exists)
// Auth: required
// Validation: extraction_status must be COMPLETED
```

### GET `/api/projects/[id]/artifacts`
```typescript
// Response 200: { artifacts: Artifact[] }
// Returns latest version of each artifact type
// Auth: required
```

### GET `/api/projects/[id]/artifacts/[artifactId]`
```typescript
// Response 200: { artifact: Artifact, versions: ArtifactVersion[] }
// Auth: required
```

### PATCH `/api/projects/[id]/artifacts/[artifactId]`
```typescript
// Body: { content: ArtifactContent }
// Creates new version (version++)
// Response 200: { artifact: Artifact }
// Auth: required
```

### GET `/api/projects/[id]/artifacts/[artifactId]/export`
```typescript
// Query: format = 'markdown' | 'pdf'
// Response: file download
// Auth: required
```

### POST `/api/projects/[id]/artifacts/[artifactId]/restore`
```typescript
// Body: { version: number }
// Restores artifact to specified version (creates new version with old content)
// Response 200: { artifact: Artifact }
// Auth: required
```

---

## Mock Data (Seed Script Update)

Add to seed for "Checkout abandonment analysis":
- 1 generated Fact Pack with 3 themes (8 facts total)
- 1 generated Evidence Map (PICO × 4 themes)
- 1 generated Empathy Map (4 items per quadrant)

---

## Acceptance Criteria (AC)

- [ ] **AC-401**: Canvas page (`/app/projects/[id]/canvas`) рендерится с тремя табами
- [ ] **AC-402**: Каждый таб показывает статус: "Not generated" если артефакт не создан
- [ ] **AC-403**: POST `/api/projects/[id]/artifacts` с `artifact_type: FACT_PACK` запускает генерацию
- [ ] **AC-404**: POST артефакта возвращает 422 если `extraction_status !== COMPLETED`
- [ ] **AC-405**: Прогресс генерации индицируется (spinner или "Generating...")
- [ ] **AC-406**: Fact Pack отображает факты, сгруппированные по темам
- [ ] **AC-407**: Каждый факт в Fact Pack содержит: текст, source link, confidence badge
- [ ] **AC-408**: METRIC факты помечены тегом "metric"
- [ ] **AC-409**: CONTRADICTION факты помечены предупреждением ⚠
- [ ] **AC-410**: Evidence Map отображает таблицу тем × frame компонентов
- [ ] **AC-411**: Каждая ячейка Evidence Map: Strong/Moderate/Weak/Gap с цветовой кодировкой
- [ ] **AC-412**: Hover на ячейку показывает tooltip с количеством фактов
- [ ] **AC-413**: Empathy Map отображает 2×2 сетку с SAY/THINK/DO/FEEL
- [ ] **AC-414**: SAY квадрант использует verbatim quotes (с кавычками) где возможно
- [ ] **AC-415**: Inline editing: клик на текст факта/элемента → редактируемое поле
- [ ] **AC-416**: Сохранение edit создаёт новую версию артефакта (version++)
- [ ] **AC-417**: "Export Markdown" скачивает `.md` файл с корректным содержимым
- [ ] **AC-418**: "Export PDF" скачивает `.pdf` файл
- [ ] **AC-419**: Version history drawer показывает список версий
- [ ] **AC-420**: "Restore" версии создаёт новую версию с content из старой
- [ ] **AC-421**: Seed артефакты корректно рендерятся в UI
- [ ] **AC-422**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Canvas page | GET `/app/projects/[id]/canvas` (authenticated) | 200, renders |
| Generate guard | POST `/api/projects/:id/artifacts` when extraction_status != COMPLETED | 422 |
| Generate fact pack | POST `{"artifact_type":"FACT_PACK"}` (extraction done) | 202, generation starts |
| Get artifacts | GET `/api/projects/:id/artifacts` | Returns 3 artifact types |
| Edit artifact | PATCH artifact with modified content | 200, version incremented |
| Export markdown | GET `/api/projects/:id/artifacts/:id/export?format=markdown` | File download, `.md` extension |
| Export PDF | GET same with `format=pdf` | File download, `.pdf` extension |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: artifact generation (mock LLM) + version history + export format
- [ ] PDF generation functional (не placeholder)
- [ ] Artifact content validated against TypeScript types before save
- [ ] Нет `any` типов
- [ ] LLM calls только в server-side routes
