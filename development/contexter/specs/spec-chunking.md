# Spec: Chunking Track — F-011, F-017, F-020
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

## Stack context

- **Runtime:** Bun on Hetzner
- **Framework:** Hono
- **DB:** PostgreSQL 16 + pgvector (`vector(1024)`)
- **Embeddings:** Jina v4 (`jina-embeddings-v4`, 1024-dim), called via `EmbedderService` in `src/services/embedder/index.ts`
- **LLM:** Groq, accessed via `src/services/llm.ts` and directly via `fetch` to `env.GROQ_API_URL`
- **Source root:** `src/`
- **Migration dir:** `drizzle-pg/` — last file is `0003_auth_providers.sql`, so migration numbers: F-017 = `0007`, F-020 = `0008`
- **Env vars available:** `GROQ_API_KEY`, `GROQ_API_URL`, `GROQ_LLM_MODEL`, `JINA_API_KEY`, `JINA_API_URL`

## Implementation order (mandatory — each feature builds on the previous)

```
F-011 (structure-aware chunking + late chunking)
  └── F-017 (parent-child chunks — uses heading metadata from F-011)
        └── F-020 (contextual prefix — runs after F-017 produces children)
```

Do not implement F-017 until F-011 is complete. Do not implement F-020 until F-017 is complete.

---

## F-011: Structure-aware chunking + late chunking

### Current state

`src/services/chunker/semantic.ts` — `chunkSemantic()`:
- Splits text by double-newline (`\n\n`) via `splitParagraphs()` regex `[^\n]+(?:\n(?!\n)[^\n]*)*/g`
- Accumulates paragraphs until `maxTokens` (default 500) is exceeded, then flushes
- 100-token overlap via `getOverlapText()` (re-includes trailing tokens from previous chunk)
- All chunks produced with `metadata: { type: "semantic" }` — no heading info
- Token counting: whitespace split (`countTokens` in `tokenizer.ts`) — 1 word ≈ 1 token

`src/services/embedder/index.ts` — `callApi()`:
- Calls Jina with `{ model, input: texts.map(t => ({ text: t })), dimensions, task, truncate_dim }`.
- Does NOT currently pass `late_chunking` parameter.
- `JINA_MAX_BATCH = 64`, concurrency = 3 batches at a time.

`ChunkMetadata` type in `src/services/chunker/types.ts`:
- `{ type: "semantic" | "row" | "slide" | "timestamp", page?: number, sheet?: string, startTime?: number, endTime?: number }`
- No `sectionHeading` field, no `headingPath`.

### Implementation

#### 1. Extend `ChunkMetadata` in `src/services/chunker/types.ts`

Add one optional field to the existing `ChunkMetadata` interface:

```typescript
export interface ChunkMetadata {
  type: "semantic" | "row" | "slide" | "timestamp"
  page?: number
  sheet?: string
  startTime?: number
  endTime?: number
  sectionHeading?: string  // ADD: heading path at the point this chunk starts (e.g. "Installation > Linux")
}
```

No other changes to this file.

#### 2. Rewrite `chunkSemantic()` in `src/services/chunker/semantic.ts`

Replace the existing `chunkSemantic` function with a heading-aware version. The paragraph accumulation logic stays the same — the only change is (a) extracting heading events before the main loop, and (b) attaching the active heading to each built chunk.

**Heading detection regex:**
```
/^(#{1,6})\s+(.+)$/m
```
Match lines that start with one to six `#` characters followed by a space and heading text.

**Heading path logic:**
- Maintain a `headingLevels: Map<number, string>` (level → current heading text at that level, 1-indexed).
- When a line matches heading regex at level N: set `headingLevels.set(N, text)`, then delete all levels > N (child headings are reset when parent changes).
- Heading path = `Array.from(headingLevels.values()).join(" > ")` — e.g. `"Architecture > Installation > Linux"`.
- Track the active heading path at each character offset by building a sorted array of `{ offset: number, path: string }` events while scanning through lines of the document before running the paragraph loop.

**Injecting heading into paragraphs:**
`splitParagraphs()` returns `{ text, offset }`. For each paragraph, find the latest heading event with `event.offset <= para.offset`. That is the active `sectionHeading` for that paragraph.

**Attaching to chunks:**
The active `sectionHeading` at the first paragraph in a chunk's batch is stored as `metadata.sectionHeading`. Pass it into `buildChunk()` as a new parameter.

**Updated `buildChunk` signature:**
```typescript
function buildChunk(content: string, index: number, startOffset: number, sectionHeading?: string): Chunk
```
Sets `metadata: { type: "semantic", sectionHeading }`.

**Fallback:** If the document contains no heading lines (regex matches zero times), behavior is identical to the old code: all `sectionHeading` fields remain `undefined`.

#### 3. Add `late_chunking` support to `EmbedderService` in `src/services/embedder/`

**In `src/services/embedder/types.ts`:** add `lateChunking?: boolean` to `EmbedderOptions`:

```typescript
export interface EmbedderOptions {
  model?: string
  dimensions?: number
  task?: "retrieval.passage" | "retrieval.query" | "text-matching"
  lateChunking?: boolean  // ADD: maps to Jina v4 "late_chunking" param
}
```

**In `src/services/embedder/index.ts`:** thread `lateChunking` through `embedBatch` → `callApi`. In `callApi`, add to the request body:

```typescript
const body: Record<string, unknown> = {
  model,
  input: texts.map((text) => ({ text })),
  dimensions,
  task,
  truncate_dim: dimensions,
}
if (options.lateChunking) {
  body.late_chunking = true
}
```

The `lateChunking` flag is passed from the pipeline caller. `callApi` is private; `embedBatch` already accepts `EmbedderOptions` — just pass it through.

#### 4. Update pipeline to pass `lateChunking: true` when embedding

In `src/services/pipeline.ts`, in both `runPipelineAsync` and `resumePipelineFromStage`, change the embed stage call:

```typescript
// BEFORE:
embedResult = await embedderService.embedBatch(chunks.map((c) => c.content))

// AFTER:
embedResult = await embedderService.embedBatch(chunks.map((c) => c.content), {
  lateChunking: true,
})
```

Same change in `runPipeline` (sync version used in dev/testing).

### Files changed

| File | Change |
|---|---|
| `src/services/chunker/types.ts` | Add `sectionHeading?: string` to `ChunkMetadata` |
| `src/services/chunker/semantic.ts` | Rewrite `chunkSemantic` with heading-aware splitting |
| `src/services/embedder/types.ts` | Add `lateChunking?: boolean` to `EmbedderOptions` |
| `src/services/embedder/index.ts` | Thread `lateChunking` into `callApi` body |
| `src/services/pipeline.ts` | Pass `{ lateChunking: true }` to `embedBatch` calls (3 places) |

### Verification

```bash
# 1. Heading extraction test — run from project root
bun -e "
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const md = '# Introduction\n\nFirst paragraph text.\n\n## Details\n\nSecond paragraph text.'
const chunks = svc.chunk(md, 'md')
console.log(JSON.stringify(chunks.map(c => ({ i: c.index, heading: c.metadata.sectionHeading, preview: c.content.slice(0, 30) })), null, 2))
"
```
Expected: chunk at index 0 has `sectionHeading: "Introduction"`, chunk at index 1 has `sectionHeading: "Introduction > Details"`.

```bash
# 2. No-heading fallback — must not crash and sectionHeading is undefined
bun -e "
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const chunks = svc.chunk('Plain text without any headings.', 'md')
console.log('heading:', chunks[0]?.metadata.sectionHeading)
"
```
Expected output: `heading: undefined`

```bash
# 3. TypeScript compile check
bun tsc --noEmit
```
Expected: no errors.

---

## F-017: Parent-child chunks

### Current state

**Schema (`src/db/schema.ts` + `drizzle-pg/0000_special_sally_floyd.sql`):**
The `chunks` table has: `id, document_id, user_id, content, chunk_index, token_count, embedding, created_at`.
No `parent_id`, no `chunk_type`, no `section_heading`, no `page_number`, no `start_offset`, no `end_offset`.
All chunks are flat (`chunk_type` concept does not exist).

**Chunker:**
`ChunkerService.chunk()` returns a flat `Chunk[]` array. No hierarchy. All chunks are independent.

**Pipeline (`src/services/pipeline.ts`):**
Embeds all chunks with `embedderService.embedBatch(chunks.map(c => c.content))`, then upserts them into the `chunks` table. One row per chunk, no parent reference.

**Retrieval (`src/services/vectorstore/vector.ts` + `fts.ts`):**
Both `VectorService.search()` and `FtsService.search()` return `SearchResult[]` from `SELECT ... FROM chunks WHERE ...`. They return the `content` field directly from the matching row. No parent lookup. `buildContext` in `src/services/rag/context.ts` uses `result.metadata.content` directly.

### Implementation

#### 1. Schema migration: `drizzle-pg/0007_parent_child_chunks.sql`

```sql
-- F-017: Parent-child chunk hierarchy
ALTER TABLE "chunks" ADD COLUMN "parent_id" text REFERENCES "chunks"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "chunk_type" text NOT NULL DEFAULT 'flat';
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "section_heading" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "page_number" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "sheet_name" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "start_offset" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "end_offset" integer;
--> statement-breakpoint
CREATE INDEX "chunks_parent_id_idx" ON "chunks" ("parent_id");
--> statement-breakpoint
CREATE INDEX "chunks_chunk_type_idx" ON "chunks" ("chunk_type");
```

`chunk_type` values: `'flat'` (legacy, default), `'parent'`, `'child'`.
`parent_id` is NULL for parent chunks and flat chunks; set for child chunks.
`ON DELETE CASCADE` on `parent_id` ensures children are deleted when their parent is deleted.

#### 2. Drizzle schema update: `src/db/schema.ts`

Add to the `chunks` table definition (inside the existing `pgTable("chunks", { ... })` call, before the index factory function):

```typescript
parentId: text("parent_id").references(() => chunks.id, { onDelete: "cascade" }),
chunkType: text("chunk_type", { enum: ["parent", "child", "flat"] }).notNull().default("flat"),
sectionHeading: text("section_heading"),
pageNumber: integer("page_number"),
sheetName: text("sheet_name"),
startOffset: integer("start_offset"),
endOffset: integer("end_offset"),
```

Add two indexes to the existing index array:
```typescript
index("chunks_parent_id_idx").on(table.parentId),
index("chunks_chunk_type_idx").on(table.chunkType),
```

#### 3. Extend `Chunk` type and `ChunkMetadata` in `src/services/chunker/types.ts`

Add parent-child fields to `Chunk` (not metadata — these are structural):

```typescript
export interface Chunk {
  content: string
  index: number
  tokenCount: number
  startOffset: number
  endOffset: number
  metadata: ChunkMetadata
  // F-017 additions:
  chunkType: "parent" | "child" | "flat"
  parentIndex?: number  // index of the parent chunk within the same document batch
}
```

`parentIndex` is a local reference used inside the chunker to link children to parents before DB IDs are known. The pipeline will resolve this to a real `parent_id` string when inserting.

Add `PARENT_MAX_TOKENS`, `PARENT_MIN_TOKENS`, `CHILD_MAX_TOKENS`, `CHILD_MIN_TOKENS` constants:

```typescript
export const PARENT_MAX_TOKENS = 1024
export const PARENT_MIN_TOKENS = 256
export const CHILD_MAX_TOKENS = 200
export const CHILD_MIN_TOKENS = 50
```

Add to `ChunkerOptions`:
```typescript
export interface ChunkerOptions {
  maxTokens?: number
  overlap?: number
  strategy?: "semantic" | "row" | "slide" | "timestamp"
  hierarchical?: boolean  // ADD: if true, produce parent+child chunks
}
```

#### 4. New file: `src/services/chunker/hierarchical.ts`

This file exports one function: `chunkHierarchical(text: string, options: ChunkerOptions): Chunk[]`.

**Algorithm:**

**Step 1 — Create parent chunks (up to `PARENT_MAX_TOKENS = 1024`):**

Call the updated `chunkSemantic(text, { ...options, maxTokens: PARENT_MAX_TOKENS, overlap: 0 })` to produce parent-sized segments. No overlap on parents — children overlap is not needed since parents provide context.

For each parent chunk produced:
- Set `chunkType: "parent"`
- Preserve `sectionHeading` from `metadata.sectionHeading` (comes from F-011 heading detection)
- Re-assign sequential `index` values starting from 0

**Step 2 — Create child chunks (up to `CHILD_MAX_TOKENS = 200`) from each parent:**

For each parent chunk `p` at index `pi`:
- Call `splitIntoChildren(p.content, p.startOffset, CHILD_MAX_TOKENS)` (see below)
- For each child `c`:
  - Set `chunkType: "child"`
  - Set `parentIndex: pi`
  - Copy `metadata.sectionHeading` from the parent
  - Assign `index` values continuing from the last parent's index + all previous children

**`splitIntoChildren` inner function:**
- Split the parent's content at sentence boundaries: regex `/(?<=[.!?])\s+/` (lookbehind for sentence-ending punctuation)
- Accumulate sentences until `CHILD_MAX_TOKENS` would be exceeded, then flush — same accumulation pattern as `chunkSemantic` but without overlap
- If a sentence alone exceeds `CHILD_MAX_TOKENS`, emit it as a single child regardless
- Skip children with `tokenCount < CHILD_MIN_TOKENS = 50` (merge into the preceding child instead; if no preceding child, emit anyway to avoid data loss)
- Preserve `startOffset` / `endOffset` using character positions within `p.content` offset by `p.startOffset`

**Return value:** A flat array interleaving parents and their children in document order:
```
[parent_0, child_0_0, child_0_1, ..., parent_1, child_1_0, ..., parent_N, child_N_0, ...]
```
This ordering is important — the pipeline uses it to assign DB IDs before insertion.

**Edge case — document shorter than `PARENT_MAX_TOKENS`:** If the entire document produces only one parent chunk (fewer than `PARENT_MIN_TOKENS = 256` tokens), skip the hierarchy and emit a single `chunkType: "flat"` chunk instead. This avoids creating a parent with a single child for tiny documents.

#### 5. Update `ChunkerService` in `src/services/chunker/index.ts`

In `ChunkerService.chunk()`, when strategy is `"semantic"` and `options.hierarchical === true`, call `chunkHierarchical` instead of `chunkSemantic`:

```typescript
import { chunkHierarchical } from "./hierarchical"

// In chunk():
case "semantic":
default:
  if (options.hierarchical) {
    return chunkHierarchical(content, options)
  }
  return chunkSemantic(content, options)
```

Export `chunkHierarchical` from `src/services/chunker/index.ts`.

#### 6. Update pipeline `src/services/pipeline.ts`

**Chunk stage:** pass `{ hierarchical: true }` to `chunkerService.chunk()`:

```typescript
// BEFORE:
chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)

// AFTER:
chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat, { hierarchical: true })
```

Apply this change in all three pipeline functions: `runPipeline`, `runPipelineAsync`, `resumePipelineFromStage`.

**Embed stage:** embed ONLY child chunks (and flat chunks for backward compat). Parents are not embedded:

```typescript
const embeddableChunks = chunks.filter(c => c.chunkType === "child" || c.chunkType === "flat")
embedResult = await embedderService.embedBatch(
  embeddableChunks.map((c) => c.content),
  { lateChunking: true }
)
```

**Index stage:** insert ALL chunks (parents + children + flat) into the DB, then set embeddings only on embeddable chunks:

```typescript
// Build DB rows for ALL chunks (parents need no embedding)
// First pass: insert parents to get their IDs available for children's parent_id FK
const parents = chunks.filter(c => c.chunkType === "parent")
const children = chunks.filter(c => c.chunkType === "child")
const flatChunks = chunks.filter(c => c.chunkType === "flat")

// Generate IDs for all chunks:
// Parent ID: `${documentId}-p${parentIndex}`
// Child ID:  `${documentId}-c${childIndex}` (childIndex = child's index field)
// Flat ID:   `${documentId}-${chunk.index}` (legacy format — unchanged)

const allRows = chunks.map((chunk) => {
  const id = chunkId(documentId, chunk)
  return {
    id,
    document_id: documentId,
    user_id: userId,
    content: chunk.content,
    chunk_index: chunk.index,
    token_count: chunk.tokenCount,
    chunk_type: chunk.chunkType,
    parent_id: chunk.parentIndex !== undefined
      ? chunkId(documentId, parents[chunk.parentIndex])
      : null,
    section_heading: chunk.metadata.sectionHeading ?? null,
    start_offset: chunk.startOffset,
    end_offset: chunk.endOffset,
  }
})

await sql`
  INSERT INTO chunks ${sql(allRows)}
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    token_count = EXCLUDED.token_count,
    chunk_type = EXCLUDED.chunk_type,
    parent_id = EXCLUDED.parent_id,
    section_heading = EXCLUDED.section_heading,
    start_offset = EXCLUDED.start_offset,
    end_offset = EXCLUDED.end_offset
`
```

Helper `chunkId(documentId, chunk)`:
```typescript
function chunkId(documentId: string, chunk: Chunk): string {
  if (chunk.chunkType === "parent") return `${documentId}-p${chunk.index}`
  if (chunk.chunkType === "child") return `${documentId}-c${chunk.index}`
  return `${documentId}-${chunk.index}` // flat — legacy format
}
```

Then upsert embeddings only on embeddable chunks:
```typescript
const embeddableIds = embeddableChunks.map((c) => chunkId(documentId, c))
const records: VectorRecord[] = embeddableChunks.map((chunk, i) => ({
  id: chunkId(documentId, chunk),
  vector: embedResult.embeddings[i].vector,
  metadata: {
    documentId,
    userId,
    chunkIndex: chunk.index,
    content: chunk.content,
  },
}))
await vectorStoreService.index(records)
```

#### 7. Update retrieval to do parent lookup

**In `src/services/vectorstore/vector.ts` — `VectorService.search()`:**

Change the SELECT to also return `parent_id` and `chunk_type`:

```typescript
// In both the userId and non-userId variants:
SELECT id, document_id, content, chunk_index, chunk_type, parent_id,
  1 - (embedding <=> ${vectorStr}::vector) as score
FROM chunks
WHERE embedding IS NOT NULL  -- and optionally user_id filter
ORDER BY embedding <=> ${vectorStr}::vector
LIMIT ${topK}
```

Extend `SearchResult` in `src/services/vectorstore/types.ts` to carry these fields:

```typescript
export interface VectorMetadata {
  documentId: string
  userId?: string
  chunkIndex: number
  content: string
  // F-017 additions:
  chunkType?: "parent" | "child" | "flat"
  parentId?: string
}
```

**In `src/services/vectorstore/fts.ts` — `FtsService.search()`:**
Same change — add `chunk_type, parent_id` to SELECT and return them in metadata.

**New function in `src/services/vectorstore/vector.ts` — parent lookup:**

```typescript
async fetchParents(sql: Sql, parentIds: string[]): Promise<Map<string, { id: string; content: string; sectionHeading: string | null; pageNumber: number | null }>> {
  if (parentIds.length === 0) return new Map()
  const rows = await sql`
    SELECT id, content, section_heading, page_number
    FROM chunks
    WHERE id = ANY(${sql.array(parentIds)}::text[])
      AND chunk_type = 'parent'
  `
  const map = new Map<string, { id: string; content: string; sectionHeading: string | null; pageNumber: number | null }>()
  for (const row of rows) {
    map.set(row.id as string, {
      id: row.id as string,
      content: row.content as string,
      sectionHeading: row.section_heading as string | null,
      pageNumber: row.page_number as number | null,
    })
  }
  return map
}
```

**Parent lookup JOIN SQL (the canonical query — used in `RagService.query()` or a new `VectorStoreService.searchWithParents()` method):**

```sql
SELECT
  p.id            AS parent_id,
  p.content       AS parent_content,
  p.section_heading,
  p.page_number,
  MAX(c.score)    AS best_child_score
FROM (
  -- Inline the vector/FTS/RRF search results as a derived table
  -- In practice this is a VALUES or temp CTE populated from the search results
  -- child_id and score come from the search step above
  SELECT unnest($1::text[]) AS child_id,
         unnest($2::float8[]) AS score
) AS hits
JOIN chunks c ON c.id = hits.child_id
JOIN chunks p ON p.id = c.parent_id
WHERE c.chunk_type = 'child'
GROUP BY p.id, p.content, p.section_heading, p.page_number
ORDER BY best_child_score DESC
```

In implementation, pass the child IDs and scores as two parallel arrays. Use `sql.array()` for both.

**In `src/services/rag/index.ts` — update `query()` to do parent resolution:**

After `allResults` is assembled (post RRF fusion), add a parent resolution step before `buildContext`:

```typescript
// Separate results by chunk type
const childResults = allResults.filter(r => r.metadata.chunkType === "child" && r.metadata.parentId)
const flatResults = allResults.filter(r => !r.metadata.chunkType || r.metadata.chunkType === "flat")

// Parent lookup for child results
let contextResults: HybridSearchResult[] = flatResults

if (childResults.length > 0) {
  const childIds = childResults.map(r => r.id)
  const childScores = childResults.map(r => r.score)

  // Query parent content using the JOIN SQL above
  const parentRows = await this.vectorStore.fetchParentsForChildren(childIds, childScores)

  // De-duplicate: if multiple children share a parent, keep highest child score
  const parentMap = new Map<string, HybridSearchResult>()
  for (const row of parentRows) {
    if (!parentMap.has(row.parentId)) {
      parentMap.set(row.parentId, {
        id: row.parentId,
        score: row.bestChildScore,
        source: "vector",
        metadata: {
          documentId: childResults[0].metadata.documentId,  // approximate; refine if needed
          chunkIndex: -1,
          content: row.parentContent,
          chunkType: "parent",
        },
      })
    }
  }
  contextResults = [...Array.from(parentMap.values()), ...flatResults]
  contextResults.sort((a, b) => b.score - a.score)
}

const { context, sources } = buildContext(contextResults, this.config.maxContextTokens)
```

Add `fetchParentsForChildren(childIds: string[], childScores: number[])` to `VectorStoreService` as a pass-through to `VectorService.fetchParentsForChildren`.

**Backward compatibility:** flat chunks (legacy, `chunk_type = 'flat'` or NULL) are passed directly to `buildContext` without any parent lookup. The system handles both old and new documents simultaneously.

### Migration SQL (complete)

File: `drizzle-pg/0007_parent_child_chunks.sql`

```sql
-- F-017: Parent-child chunk hierarchy
ALTER TABLE "chunks" ADD COLUMN "parent_id" text REFERENCES "chunks"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "chunk_type" text NOT NULL DEFAULT 'flat';
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "section_heading" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "page_number" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "sheet_name" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "start_offset" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "end_offset" integer;
--> statement-breakpoint
CREATE INDEX "chunks_parent_id_idx" ON "chunks" ("parent_id");
--> statement-breakpoint
CREATE INDEX "chunks_chunk_type_idx" ON "chunks" ("chunk_type");
```

### Files changed

| File | Change |
|---|---|
| `drizzle-pg/0007_parent_child_chunks.sql` | New migration — add 7 columns + 2 indexes |
| `src/db/schema.ts` | Add 7 columns + 2 indexes to `chunks` table |
| `src/services/chunker/types.ts` | Add `chunkType`, `parentIndex` to `Chunk`; add `hierarchical` to `ChunkerOptions`; add 4 token constants |
| `src/services/chunker/hierarchical.ts` | New file — `chunkHierarchical()` function |
| `src/services/chunker/index.ts` | Route `hierarchical: true` to `chunkHierarchical`; export it |
| `src/services/pipeline.ts` | Pass `{ hierarchical: true }` to chunker; filter embeddable chunks; use `chunkId()` helper; insert all chunk rows with new columns |
| `src/services/vectorstore/types.ts` | Add `chunkType`, `parentId` to `VectorMetadata` |
| `src/services/vectorstore/vector.ts` | Add `chunk_type`, `parent_id` to SELECT; add `fetchParentsForChildren()` |
| `src/services/vectorstore/fts.ts` | Add `chunk_type`, `parent_id` to SELECT |
| `src/services/vectorstore/index.ts` | Expose `fetchParentsForChildren()` as pass-through |
| `src/services/rag/index.ts` | Add parent resolution step in `query()` |

### Verification

```bash
# 1. Check migration runs cleanly against local DB
bun run db:migrate
```
Expected: no errors, `drizzle_migrations` table records `0004_parent_child_chunks`.

```bash
# 2. Verify hierarchical chunker produces correct output
bun -e "
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const md = '# Section A\n\nFirst sentence here. Second sentence here. Third sentence.\n\n## Subsection B\n\nLonger text in subsection B that will form another parent chunk.'
const chunks = svc.chunk(md, 'md', { hierarchical: true })
const parents = chunks.filter(c => c.chunkType === 'parent')
const children = chunks.filter(c => c.chunkType === 'child')
console.log('parents:', parents.length, 'children:', children.length)
console.log('child[0].parentIndex:', children[0]?.parentIndex)
console.log('child[0].sectionHeading:', children[0]?.metadata.sectionHeading)
"
```
Expected: `parents: 1` (or 2 if headings split), `children: 2+`, `child[0].parentIndex: 0`, `child[0].sectionHeading: "Section A"` (or similar).

```bash
# 3. Verify flat chunks still work (backward compat)
bun -e "
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const chunks = svc.chunk('Short document.', 'md')
console.log('type:', chunks[0]?.chunkType)
"
```
Expected: `type: flat` (hierarchical is not the default when `options.hierarchical` is not set; short document defaults to flat even with hierarchical enabled).

```bash
# 4. TypeScript compile check
bun tsc --noEmit
```
Expected: no errors.

```bash
# 5. DB column verification after migration
psql $DATABASE_URL -c "\d chunks"
```
Expected: columns `parent_id`, `chunk_type`, `section_heading`, `page_number`, `sheet_name`, `start_offset`, `end_offset` appear in table description.

---

## F-020: Contextual prefix generation

### Current state

- No `context_prefix` column in `chunks` table (confirmed: schema has `id, document_id, user_id, content, chunk_index, token_count, embedding, created_at` + the F-017 additions above).
- No `context_version` column.
- No `contextual.ts` file in `src/services/chunker/`.
- After F-017, the pipeline inserts children first, then embeds them. There is no step that calls an LLM per chunk at indexing time.

### Implementation

#### 1. Schema migration: `drizzle-pg/0008_contextual_prefix.sql`

```sql
-- F-020: Contextual prefix for chunk contextualization
ALTER TABLE "chunks" ADD COLUMN "context_prefix" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "context_version" integer NOT NULL DEFAULT 0;
```

`context_version = 0`: not yet contextualized (default for all existing chunks).
`context_version = 1`: contextualized with Groq Llama 8B, this spec's prompt version.

#### 2. Update Drizzle schema: `src/db/schema.ts`

Add to `chunks` table definition:
```typescript
contextPrefix: text("context_prefix"),
contextVersion: integer("context_version").notNull().default(0),
```

#### 3. New file: `src/services/chunker/contextual.ts`

This file exports one async function: `addContextualPrefixes`.

**Signature:**
```typescript
export async function addContextualPrefixes(
  documentText: string,
  chunks: Chunk[],
  groqApiUrl: string,
  groqApiKey: string,
  model: string = "llama-3.1-8b-instant"
): Promise<Chunk[]>
```

**Returns:** a new array of `Chunk` objects (immutable — do not mutate inputs). Each returned chunk has `contextPrefix` set on a new field (see type extension below), and `content` is replaced with `contextPrefix + "\n\n" + originalContent`.

**Chunk type extension in `src/services/chunker/types.ts`:**

Add to `Chunk` interface:
```typescript
contextPrefix?: string  // F-020: LLM-generated context prefix (50-100 tokens)
```

**Groq prompt (verbatim — do not change wording):**

```
<document>
{DOCUMENT_TEXT}
</document>

<chunk>
{CHUNK_CONTENT}
</chunk>

Write a short context (2-3 sentences) that situates this chunk within the document. Include: document type, main topic, and any entities or timeframes referenced in the chunk. Be specific and factual.
```

`{DOCUMENT_TEXT}` = the full document text passed to the function.
`{CHUNK_CONTENT}` = `chunk.content` (the original content, before any prefix is prepended).

**Algorithm:**

```
1. Filter: only process chunks where chunkType === "child" OR chunkType === "flat"
   (do NOT generate prefixes for parent chunks — parents are not embedded)

2. Process in batches of 10 via Promise.all:
   for each batch of up to 10 target chunks:
     promises = batch.map(chunk => callGroqForPrefix(documentText, chunk.content, groqApiUrl, groqApiKey, model))
     prefixes = await Promise.all(promises)
     // Promise.all: if any call throws, catch at the batch level (see fallback below)

3. For each chunk that received a prefix:
   - Store prefix in chunk.contextPrefix
   - Replace chunk.content with: prefix + "\n\n" + originalContent

4. Return a new array (immutable) with the updated chunks
```

**`callGroqForPrefix` inner function:**

```typescript
async function callGroqForPrefix(
  documentText: string,
  chunkContent: string,
  groqApiUrl: string,
  groqApiKey: string,
  model: string
): Promise<string>
```

Makes a single `POST` to `${groqApiUrl}/chat/completions` (standard OpenAI-compatible format):

```typescript
const body = {
  model,
  messages: [
    {
      role: "user",
      content: `<document>\n${documentText}\n</document>\n\n<chunk>\n${chunkContent}\n</chunk>\n\nWrite a short context (2-3 sentences) that situates this chunk within the document. Include: document type, main topic, and any entities or timeframes referenced in the chunk. Be specific and factual.`
    }
  ],
  max_tokens: 150,
  temperature: 0.1,
}
```

Headers: `Authorization: Bearer ${groqApiKey}`, `Content-Type: application/json`.

Returns `response.choices[0].message.content.trim()`.

Timeout: `AbortSignal.timeout(15_000)` (15s per call — Groq is fast, but document context is large).

**Fallback:** If `callGroqForPrefix` throws (network error, Groq 429/5xx, timeout), catch the error per-chunk: log a warning (use `console.warn`), return the chunk unchanged (`contextPrefix` stays undefined, `content` stays original, `context_version` stays 0).

Batch-level fallback: wrap `Promise.all` in try/catch. If the batch call itself throws (shouldn't happen since individual errors are caught inside), log and continue with the remaining batches.

#### 4. Update pipeline: `src/services/pipeline.ts`

Add the contextual prefix step between the chunk stage and the embed stage. This step calls Groq and mutates the chunks array (returns a new array).

**Import:**
```typescript
import { addContextualPrefixes } from "./chunker/contextual"
```

**In `runPipelineAsync` (the main async pipeline function), between chunk and embed stages:**

```typescript
// AFTER chunk stage (chunks now contains parent+child+flat)
// BEFORE embed stage

let contextualizedChunks: Chunk[]
try {
  await updateJobStatus(sql, jobIds.chunk, "running")  // reuse chunk job for this sub-step
  contextualizedChunks = await withTimeout(
    addContextualPrefixes(
      parseResult.content,
      chunks,
      process.env.GROQ_LLM_URL ?? "https://api.groq.com/openai/v1",
      env.GROQ_API_KEY,
      env.GROQ_LLM_MODEL
    ),
    STAGE_TIMEOUT_MS.chunk,
    "contextual-prefix"
  )
  chunks = contextualizedChunks
  await updateJobStatus(sql, jobIds.chunk, "done", 100)
} catch (e) {
  // Non-fatal: log and proceed without prefixes
  console.warn("contextual prefix generation failed, proceeding without:", e instanceof Error ? e.message : String(e))
}
```

Apply the same pattern in `runPipeline` (sync dev version) and `resumePipelineFromStage`.

**Index stage update:** when inserting chunk rows, store `context_prefix` and `context_version`:

```typescript
const allRows = chunks.map((chunk) => {
  const id = chunkId(documentId, chunk)
  return {
    id,
    document_id: documentId,
    user_id: userId,
    content: chunk.content,          // now includes prefix prepended if F-020 ran
    chunk_index: chunk.index,
    token_count: chunk.tokenCount,
    chunk_type: chunk.chunkType,
    parent_id: /* ... as before ... */,
    section_heading: chunk.metadata.sectionHeading ?? null,
    start_offset: chunk.startOffset,
    end_offset: chunk.endOffset,
    context_prefix: chunk.contextPrefix ?? null,        // ADD
    context_version: chunk.contextPrefix ? 1 : 0,      // ADD
  }
})
```

Add to the ON CONFLICT DO UPDATE clause:
```sql
context_prefix = EXCLUDED.context_prefix,
context_version = EXCLUDED.context_version
```

#### 5. FTS: tsvector must index the enriched content

The existing tsvector column is defined as:
```sql
GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED
```

Since `chunk.content` is replaced with `prefix + "\n\n" + originalContent` before insertion, the tsvector will automatically include the prefix text. No migration change needed for FTS — the prefix is already in `content` when it reaches the DB.

### Migration SQL (complete)

File: `drizzle-pg/0008_contextual_prefix.sql`

```sql
-- F-020: Contextual prefix for chunk contextualization
ALTER TABLE "chunks" ADD COLUMN "context_prefix" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "context_version" integer NOT NULL DEFAULT 0;
```

### Files changed

| File | Change |
|---|---|
| `drizzle-pg/0008_contextual_prefix.sql` | New migration — 2 columns |
| `src/db/schema.ts` | Add `contextPrefix`, `contextVersion` to `chunks` table |
| `src/services/chunker/types.ts` | Add `contextPrefix?: string` to `Chunk` interface |
| `src/services/chunker/contextual.ts` | New file — `addContextualPrefixes()` function |
| `src/services/pipeline.ts` | Add contextual prefix step between chunk and embed stages; store `context_prefix`, `context_version` in DB |

### Verification

```bash
# 1. Run F-020 migration
bun run db:migrate
```
Expected: no errors, both `0004` and `0005` recorded in `drizzle_migrations`.

```bash
# 2. Smoke test contextualizer (requires GROQ_API_URL + GROQ_API_KEY in env)
bun -e "
import { addContextualPrefixes } from './src/services/chunker/contextual.ts'
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const doc = '# Q2 2025 Revenue Report\n\nACME Corp reported revenue of \$314M in Q2 2025, a 3% increase over Q1 2025.\n\n## Cost Structure\n\nOperating expenses rose by 1.2% to \$280M.'
const chunks = svc.chunk(doc, 'md', { hierarchical: true })
const result = await addContextualPrefixes(doc, chunks, process.env.GROQ_API_URL, process.env.GROQ_API_KEY, 'llama-3.1-8b-instant')
const children = result.filter(c => c.chunkType === 'child')
console.log('child[0].contextPrefix:', children[0]?.contextPrefix?.slice(0, 100))
console.log('child[0].content starts with prefix:', children[0]?.content.startsWith(children[0]?.contextPrefix ?? 'NO'))
"
```
Expected: `contextPrefix` is a non-empty string (2-3 sentences of context); `content` starts with the prefix.

```bash
# 3. Fallback: bad API key must not crash
bun -e "
import { addContextualPrefixes } from './src/services/chunker/contextual.ts'
import { ChunkerService } from './src/services/chunker/index.ts'
const svc = new ChunkerService()
const chunks = svc.chunk('Test document.', 'md', { hierarchical: true })
const result = await addContextualPrefixes('Test document.', chunks, 'https://api.groq.com/openai/v1', 'bad-key', 'llama-3.1-8b-instant')
console.log('no crash, contextPrefix:', result[0]?.contextPrefix ?? 'undefined (expected)')
"
```
Expected: no unhandled exception, `contextPrefix: undefined (expected)`, warnings logged to stderr.

```bash
# 4. DB: verify columns exist and context_version defaults to 0
psql $DATABASE_URL -c "SELECT id, context_version FROM chunks LIMIT 5;"
```
Expected: rows returned with `context_version = 0` for all pre-existing chunks.

```bash
# 5. TypeScript compile check (all three features together)
bun tsc --noEmit
```
Expected: no errors.

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | F-011: Markdown headings produce `sectionHeading` on chunks | Run heading extraction verification command; check `metadata.sectionHeading` values |
| AC-2 | F-011: Documents without headings still chunk correctly (no regression) | Run no-heading fallback command; confirm no crash, `sectionHeading` is `undefined` |
| AC-3 | F-011: `late_chunking: true` is sent to Jina in all embed calls | Inspect `body` in `callApi` for a document with multiple chunks; confirm `body.late_chunking === true` |
| AC-4 | F-017: Migration `0004` applies without error | Run `bun run db:migrate`; verify in `drizzle_migrations` table |
| AC-5 | F-017: Hierarchical chunker produces parents and children for a multi-section document | Run hierarchical chunker verification; confirm `parents.length >= 1`, `children.length >= 2`, `child.parentIndex` is set |
| AC-6 | F-017: Only children are embedded (parents have `embedding = NULL`) | After pipeline run, query: `SELECT chunk_type, COUNT(*), SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as no_embed FROM chunks WHERE document_id = '<id>' GROUP BY chunk_type` — parents row should have `no_embed = count` |
| AC-7 | F-017: RAG query returns parent content (not child fragment) | Run a query against a newly ingested document; inspect `sources[0].content` in response — it should be ~1024 tokens, not ~200 |
| AC-8 | F-017: Legacy flat chunks still queryable without errors | Ensure old flat-chunked documents still return results via `/query` endpoint |
| AC-9 | F-020: Migration `0005` applies without error | Run `bun run db:migrate`; verify both `0004` and `0005` in `drizzle_migrations` |
| AC-10 | F-020: Context prefix is generated and stored for new documents | After pipeline run, query: `SELECT id, context_version, LEFT(context_prefix, 50) FROM chunks WHERE document_id = '<id>' AND chunk_type = 'child'` — `context_version = 1`, `context_prefix` non-null |
| AC-11 | F-020: Groq failure is non-fatal — pipeline completes without prefix | Run with invalid GROQ key; verify document reaches `status = 'ready'`, `context_version = 0` |
| AC-12 | F-020: Parent chunks have no `context_prefix` (parents are not embedded, only children are contextualized) | Query: `SELECT context_prefix FROM chunks WHERE chunk_type = 'parent' AND document_id = '<id>'` — all `context_prefix` should be NULL |
| AC-13 | TypeScript: no compile errors across all changed files | `bun tsc --noEmit` exits with code 0 |
