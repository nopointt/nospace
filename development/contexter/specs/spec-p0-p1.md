# Spec: P0+P1 Quick Wins — F-001, F-002, F-003, F-004, F-005
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

## Stack context

The affected code spans four service layers and one new file. F-001 and F-005 touch `src/services/vectorstore/types.ts` and `src/services/vectorstore/index.ts` — the RRF fusion pipeline. F-002 touches `src/services/chunker/tokenizer.ts` and `src/services/rag/context.ts` — the token counting layer. F-003 requires a new SQL migration `drizzle-pg/0004_multilingual_fts.sql` plus rewriting the two SQL queries in `src/services/vectorstore/fts.ts`. F-004 rewrites `DEFAULT_SYSTEM_PROMPT` in `src/services/rag/types.ts`, adds a new file `src/services/rag/citations.ts`, and modifies `src/services/rag/index.ts` and the `RagAnswer` type. The runtime is Bun on Hetzner, database is PostgreSQL 16 + pgvector 0.8.2. No new external services are introduced for F-001, F-003, F-005. F-002 requires one new package (`gpt-tokenizer`). F-004 is pure TypeScript.

---

## F-001: Fix RRF score threshold bug

### Current state

File: `src/services/vectorstore/types.ts`, line 34:
```typescript
export const DEFAULT_SCORE_THRESHOLD = 0.3
```

File: `src/services/vectorstore/index.ts`, line 59:
```typescript
return fused.filter((r) => r.score >= threshold)
```

The bug: RRF scores are computed as `1 / (RRF_K + rank + 1)`. With `RRF_K = 60` (line 35 of types.ts), the maximum possible RRF score for any single result is `1 / (60 + 0 + 1) ≈ 0.01639`. If a result appears in both vector and FTS lists at rank 0, the maximum combined score is `2 * 0.01639 ≈ 0.03279`. The threshold `0.3` is 9x higher than the theoretical maximum. Every query silently returns `sources: []`.

### Implementation

1. Open `src/services/vectorstore/types.ts`.
2. Replace line 34 — change `DEFAULT_SCORE_THRESHOLD` from `0.3` to `0`:
```typescript
// RRF scores max at 2/(RRF_K+1) ≈ 0.033. Threshold filtering is meaningless for
// rank-based fusion. Set to 0 — topK controls the cutoff, not score.
export const DEFAULT_SCORE_THRESHOLD = 0
```
3. No other changes needed in `types.ts`.
4. `src/services/vectorstore/index.ts` line 59 (`return fused.filter((r) => r.score >= threshold)`) is logically correct after the fix — with threshold=0 it passes all results through. Add a comment above it:
```typescript
// threshold is 0 by default for RRF (scores are rank-based, not similarity-based)
return fused.filter((r) => r.score >= threshold)
```

### Files changed

- `src/services/vectorstore/types.ts` — change `DEFAULT_SCORE_THRESHOLD` from `0.3` to `0`, add comment
- `src/services/vectorstore/index.ts` — add comment on line 59 (no logic change)

### Verification

First, ensure at least one document is indexed. Then:

```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "topK": 5}' | jq '.sources | length'
```

Expected: a number greater than `0` (previously always `0`).

To confirm score range is sensible:
```bash
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "topK": 5}' | jq '[.sources[].score]'
```

Expected: array of floats all between `0.01` and `0.04` (RRF range).

---

## F-002: BPE tokenizer replacement

### Current state

File: `src/services/chunker/tokenizer.ts`, lines 6–8:
```typescript
export function countTokens(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}
```

File: `src/services/rag/context.ts`, lines 45–47:
```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.3)
}
```

The whitespace splitter has 8–69% error on code, CJK characters, and mixed-language content. This causes chunk size drift (chunks exceed `maxTokens` budget) and inaccurate overlap calculations in the semantic chunker.

### Implementation

**Step 1 — Install package**

```bash
cd /c/Users/noadmin/nospace/development/contexter && bun add gpt-tokenizer
```

This adds `gpt-tokenizer` to `package.json` dependencies. The cl100k_base vocabulary is ~2 MB, negligible on 4 GB RAM.

**Step 2 — Rewrite `src/services/chunker/tokenizer.ts`**

Replace the entire file content with:

```typescript
/**
 * BPE tokenizer using cl100k_base (GPT-3.5/4 vocabulary).
 * Replaces whitespace word-count which had 8–69% error on code and CJK content.
 * cl100k_base is a close proxy for Jina v4 tokenization.
 */
let _encode: ((text: string) => number[]) | null = null

async function getEncoder(): Promise<(text: string) => number[]> {
  if (_encode) return _encode
  try {
    const { encode } = await import("gpt-tokenizer/encoding/cl100k_base")
    _encode = encode
    return encode
  } catch (e) {
    console.warn("[tokenizer] gpt-tokenizer failed to load, falling back to word count * 1.4:", e instanceof Error ? e.message : String(e))
    _encode = (text: string) => new Array(Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.4))
    return _encode
  }
}

/**
 * Count BPE tokens in text using cl100k_base.
 * Async because encoder loads lazily on first call.
 */
export async function countTokens(text: string): Promise<number> {
  const encode = await getEncoder()
  return encode(text).length
}

/**
 * Synchronous token count — uses cached encoder if already loaded, else falls back.
 * Safe to call after the first async countTokens() call has completed.
 */
export function countTokensSync(text: string): number {
  if (_encode) return _encode(text).length
  // Fallback if encoder not yet loaded (conservative overestimate)
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.4)
}

/**
 * Split text into tokens (words). Returns array of words with their character offsets.
 * Used by semantic chunker for overlap calculation.
 */
export function tokenize(text: string): Array<{ word: string; start: number; end: number }> {
  const tokens: Array<{ word: string; start: number; end: number }> = []
  const regex = /\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return tokens
}
```

**Step 3 — Update `src/services/rag/context.ts`**

Replace the private `estimateTokens` function (lines 45–47) with a call to `countTokensSync` from the tokenizer. Also add the import at the top of the file.

Add import at top (after existing imports):
```typescript
import { countTokensSync } from "../chunker/tokenizer"
```

Replace the `estimateTokens` function definition (lines 45–47):
```typescript
// old:
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.3)
}
```
with:
```typescript
function estimateTokens(text: string): number {
  // Uses BPE cl100k_base if encoder is loaded, conservative fallback otherwise.
  return countTokensSync(text)
}
```

**Step 4 — Update callers of `countTokens` in the chunker**

Search for all calls to `countTokens` in the chunker services:

```bash
grep -rn "countTokens" /c/Users/noadmin/nospace/development/contexter/src/services/chunker/
```

For every caller that uses `countTokens(text)` synchronously, either:
- Await it if the calling function is async: `await countTokens(text)`
- Or replace with `countTokensSync(text)` if async is not possible in context

The semantic chunker is the primary consumer. If the chunker pipeline entry point is already async (BullMQ worker jobs are async), prefer `await countTokens(text)` for full accuracy.

### Files changed

- `src/services/chunker/tokenizer.ts` — full rewrite (async BPE + sync fallback)
- `src/services/rag/context.ts` — add import, replace `estimateTokens` body
- `package.json` — `gpt-tokenizer` added as dependency

### Verification

```bash
cd /c/Users/noadmin/nospace/development/contexter
bun -e "import { countTokens } from './src/services/chunker/tokenizer.ts'; console.log(await countTokens('Hello world this is a test sentence.'))"
```
Expected: `8` (BPE tokens, not word count of 7).

```bash
bun -e "import { countTokens } from './src/services/chunker/tokenizer.ts'; console.log(await countTokens('def foo(): return 42  # comment'))"
```
Expected: a number between 10 and 14 (BPE splits code tokens more granularly than words).

---

## F-003: FTS multilingual stemming

### Current state

File: `drizzle-pg/0001_fts_and_vector_indexes.sql`, line 3:
```sql
ALTER TABLE "chunks" ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED;
```

File: `src/services/vectorstore/fts.ts`, lines 38–52:
```typescript
const rows = userId
  ? await this.sql`
      SELECT id, document_id, content, chunk_index,
        ts_rank(tsv, plainto_tsquery('simple', ${sanitized})) as score
      FROM chunks
      WHERE tsv @@ plainto_tsquery('simple', ${sanitized}) AND user_id = ${userId}
      ORDER BY score DESC
      LIMIT ${topK}
    `
  : await this.sql`
      SELECT id, document_id, content, chunk_index,
        ts_rank(tsv, plainto_tsquery('simple', ${sanitized})) as score
      FROM chunks
      WHERE tsv @@ plainto_tsquery('simple', ${sanitized})
      ORDER BY score DESC
      LIMIT ${topK}
    `
```

The `'simple'` dictionary does zero morphological analysis — it only lowercases and strips accents. Russian has 12+ inflected word forms per lemma. Searching "компании" will miss "компания", "компанию", etc. English loses stemming too ("running" misses "run").

### Implementation

**Step 1 — Create migration file**

Create file `drizzle-pg/0004_multilingual_fts.sql` with the following exact content:

```sql
-- Drop old simple tsvector column and index
ALTER TABLE "chunks" DROP COLUMN IF EXISTS "tsv";
--> statement-breakpoint
-- Add multilingual tsvector: english + russian morphological stemming
ALTER TABLE "chunks" ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', "content") || to_tsvector('russian', "content")
  ) STORED;
--> statement-breakpoint
-- Recreate GIN index on new tsv column
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING gin ("tsv");
```

**Step 2 — Apply migration to production**

```bash
psql $DATABASE_URL -f /path/to/drizzle-pg/0004_multilingual_fts.sql
```

Note: The `DROP COLUMN IF EXISTS` + `ADD COLUMN` pattern rebuilds the generated column. On existing data PostgreSQL will automatically recompute `tsv` for all rows at migration time. This is a table rewrite — expect a brief lock on large tables. Current corpus is small so this is safe.

**Step 3 — Rewrite FTS queries in `src/services/vectorstore/fts.ts`**

Replace the entire `search` method body (lines 33–63) with:

```typescript
async search(query: string, topK: number = 10, userId?: string): Promise<SearchResult[]> {
  const sanitized = sanitizeFtsQuery(query)
  if (!sanitized) return []

  // websearch_to_tsquery supports "phrase search", OR, -exclusion at no extra cost.
  // ts_rank normalization flag 1 divides rank by 1 + log(doc_length) — normalizes for
  // document length so short chunks don't get unfairly penalized.
  // Combined english || russian query: both configs applied, results union-merged by PG.
  const rows = userId
    ? await this.sql`
        SELECT id, document_id, content, chunk_index,
          ts_rank(tsv,
            websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}),
            1
          ) as score
        FROM chunks
        WHERE tsv @@ (websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}))
          AND user_id = ${userId}
        ORDER BY score DESC
        LIMIT ${topK}
      `
    : await this.sql`
        SELECT id, document_id, content, chunk_index,
          ts_rank(tsv,
            websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}),
            1
          ) as score
        FROM chunks
        WHERE tsv @@ (websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}))
        ORDER BY score DESC
        LIMIT ${topK}
      `

  return rows.map((row) => ({
    id: row.id as string,
    score: Number(row.score),
    metadata: {
      documentId: row.document_id as string,
      chunkIndex: row.chunk_index as number,
      content: row.content as string,
    },
  }))
}
```

Do not change the `sanitizeFtsQuery` function — it already uses `\p{L}\p{N}` Unicode classes which is correct for multilingual input.

### Files changed

- `drizzle-pg/0004_multilingual_fts.sql` — new migration file (exact content above)
- `src/services/vectorstore/fts.ts` — replace `search` method body with `websearch_to_tsquery` + combined `'english' || 'russian'` queries

### Verification

After applying the migration and restarting the server:

```bash
# Verify tsv column was rebuilt with both configs
psql $DATABASE_URL -c "SELECT id, tsv FROM chunks LIMIT 1;"
```
Expected: `tsv` column is non-null and contains lexemes from both English and Russian dictionaries (visible as space-separated tokens).

```bash
# Verify Russian morphological matching works
# (requires at least one Russian-language document indexed)
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "компания", "topK": 5}' | jq '.sources | length'
```
Expected: greater than `0`, and results should also match chunks containing "компании", "компанию", "компаний" if present.

```bash
# Verify websearch_to_tsquery syntax works (phrase and OR)
psql $DATABASE_URL -c "SELECT websearch_to_tsquery('english', 'machine learning OR neural network');"
```
Expected: no error, returns a `tsquery` value.

---

## F-004: Inline citations — Tier 1 (prompt-based)

### Current state

File: `src/services/rag/types.ts`, lines 35–42:
```typescript
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant answering questions based on the provided context.
Rules:
- Use ONLY the information from the context below to answer.
- If a term in the question matches something in the context, treat it as the same thing even if spelling/case differs.
- Answer in the same language as the question.
- If the context contains the answer, give it directly — do not say "there is no information" when there is.
- If the context truly doesn't contain enough information, say so clearly.
- Cite relevant parts of the context in your answer.`
```

The last rule ("Cite relevant parts") is vague and the LLM ignores it. No structured citation extraction exists. `RagAnswer` has no `citations` field.

### Implementation

**Step 1 — Create `src/services/rag/citations.ts`** (new file)

```typescript
/**
 * Citation parser: extracts [N] markers from LLM answer and maps them to sources.
 * Tier 1 — prompt-based, zero cost.
 */

export interface CitationMapping {
  /** Marker number as it appears in text, e.g. 1 for [1] */
  number: number
  /** Index into the sources array (0-based) */
  sourceIndex: number
  /** The source chunk ID */
  chunkId: string
  /** The source document ID */
  documentId: string
}

/**
 * Parse [N] citation markers from LLM answer text.
 * Returns deduplicated list of valid citations (only markers that map to a real source).
 *
 * @param answer - Raw LLM answer text, may contain [1], [2], etc.
 * @param sourceCount - Number of sources available (markers > sourceCount are invalid)
 * @returns Array of { number, sourceIndex } sorted by number ascending
 */
export function parseCitationMarkers(
  answer: string,
  sourceCount: number
): Array<{ number: number; sourceIndex: number }> {
  const regex = /\[(\d+)\]/g
  const seen = new Set<number>()
  const result: Array<{ number: number; sourceIndex: number }> = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(answer)) !== null) {
    const n = parseInt(match[1], 10)
    if (n >= 1 && n <= sourceCount && !seen.has(n)) {
      seen.add(n)
      result.push({ number: n, sourceIndex: n - 1 }) // [1] maps to sources[0]
    }
  }

  return result.sort((a, b) => a.number - b.number)
}

/**
 * Build full CitationMapping[] by joining parsed markers with source metadata.
 * If LLM returns no markers, returns empty array (graceful degradation).
 */
export function buildCitations(
  answer: string,
  sources: Array<{ chunkId: string; documentId: string }>
): CitationMapping[] {
  const markers = parseCitationMarkers(answer, sources.length)
  return markers.map((m) => ({
    number: m.number,
    sourceIndex: m.sourceIndex,
    chunkId: sources[m.sourceIndex].chunkId,
    documentId: sources[m.sourceIndex].documentId,
  }))
}
```

**Step 2 — Update `DEFAULT_SYSTEM_PROMPT` in `src/services/rag/types.ts`**

Replace the `DEFAULT_SYSTEM_PROMPT` constant (lines 35–42) with:

```typescript
export const DEFAULT_SYSTEM_PROMPT = `You are a precise assistant answering questions using ONLY the provided context sources.

Rules:
- Use ONLY information from the numbered context sources below.
- EVERY factual claim in your answer MUST be followed by a citation marker like [1], [2], etc.
- The number in [N] corresponds to the source number in the context (e.g. [1] = Source 1).
- If multiple sources support a claim, cite all of them: [1][2].
- Answer in the same language as the question.
- If a term in the question matches context content, treat them as the same regardless of spelling/case.
- If the context contains the answer, give it directly and cite the source — do not say "there is no information" when there is.
- If the context truly lacks the information, say so clearly without fabricating an answer.
- Do not add citation markers for general reasoning or conclusions not directly from a source.`
```

**Step 3 — Add `citations` field to `RagAnswer` in `src/services/rag/types.ts`**

Add import at top of `types.ts`:
```typescript
import type { CitationMapping } from "./citations"
```

Update the `RagAnswer` interface — add `citations` field after `sources`:
```typescript
export interface RagAnswer {
  answer: string
  sources: RagSource[]
  citations: CitationMapping[]   // NEW — [N] markers mapped to sources
  queryVariants: string[]
  tokenUsage: {
    embeddingTokens: number
    llmPromptTokens: number
    llmCompletionTokens: number
  }
}
```

**Step 4 — Update `src/services/rag/index.ts`**

Add import at top:
```typescript
import { buildCitations } from "./citations"
```

In the `query` method, after `buildContext` and `generateAnswer` are called (line 76 area), update the return statement to include `citations`:

Current return (lines 78–87):
```typescript
return {
  answer,
  sources,
  queryVariants,
  tokenUsage: {
    embeddingTokens: queryEmbeddings.totalTokens,
    llmPromptTokens: promptTokens,
    llmCompletionTokens: completionTokens,
  },
}
```

Replace with:
```typescript
return {
  answer,
  sources,
  citations: buildCitations(answer, sources),
  queryVariants,
  tokenUsage: {
    embeddingTokens: queryEmbeddings.totalTokens,
    llmPromptTokens: promptTokens,
    llmCompletionTokens: completionTokens,
  },
}
```

**Step 5 — Update route responses**

In `src/routes/query.ts`, the response JSON already spreads `result.answer` and `result.sources` individually. Add `citations` to the response object returned at line 83:

Current:
```typescript
return c.json({
  answer: result.answer,
  sources: filteredSources.map((s) => ({ ... })),
  queryVariants: result.queryVariants,
  usage: result.tokenUsage,
})
```

Add `citations: result.citations` to the JSON object:
```typescript
return c.json({
  answer: result.answer,
  sources: filteredSources.map((s) => ({ ... })),
  citations: result.citations,
  queryVariants: result.queryVariants,
  usage: result.tokenUsage,
})
```

In `src/routes/mcp-remote.ts`, the `search_knowledge` handler builds a text response (lines 349–355). Append citation info to the text if citations are non-empty:

After the existing `text` assembly (after the sources block), add:
```typescript
if (result.citations.length > 0) {
  text += `\n**Citations:** ${result.citations.map((c) => `[${c.number}] → ${c.documentId}`).join(", ")}\n`
}
```

### Files changed

- `src/services/rag/citations.ts` — new file (citation parser)
- `src/services/rag/types.ts` — updated `DEFAULT_SYSTEM_PROMPT`, added `citations` field to `RagAnswer`, added import
- `src/services/rag/index.ts` — added import, added `citations` to return value
- `src/routes/query.ts` — added `citations` to response JSON
- `src/routes/mcp-remote.ts` — added citations to `search_knowledge` text output

### Verification

```bash
# Verify citation parser logic
bun -e "
import { parseCitationMarkers, buildCitations } from './src/services/rag/citations.ts'
const answer = 'The capital is Paris [1]. It has 2 million people [2][1].'
const markers = parseCitationMarkers(answer, 3)
console.log(JSON.stringify(markers))
"
```
Expected: `[{"number":1,"sourceIndex":0},{"number":2,"sourceIndex":1}]`

```bash
# End-to-end: verify citations appear in API response
curl -s -X POST http://localhost:3000/dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "what is this document about?", "topK": 3}' | jq '{answer: .answer, citations: .citations}'
```
Expected: `answer` contains at least one `[N]` marker, `citations` array is non-empty (or empty array if LLM chose not to cite — graceful fallback).

```bash
# Verify TypeScript compiles without errors
cd /c/Users/noadmin/nospace/development/contexter && bun tsc --noEmit
```
Expected: no errors.

---

## F-005: RRF threshold guard for MCP/direct callers

### Current state

F-001 fixes `DEFAULT_SCORE_THRESHOLD` in `types.ts` to `0`. However, callers that explicitly pass `scoreThreshold` from user-supplied config could still override this with a non-zero value and accidentally filter out all RRF results.

Full grep result for `scoreThreshold` across `src/**/*.ts`:

| File | Line | Current value | Status |
|---|---|---|---|
| `src/services/vectorstore/types.ts` | 29 | `scoreThreshold?: number` in `SearchOptions` | Interface field — keep as-is |
| `src/services/rag/types.ts` | 5 | `scoreThreshold?: number` in `RagQuery` | Interface field — keep as-is |
| `src/services/vectorstore/index.ts` | 50 | `const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD` | Fixed by F-001 default |
| `src/routes/dev.ts` | 81 | `scoreThreshold: 0` | Already correct |
| `src/routes/mcp-remote.ts` | 340 | `scoreThreshold: 0` | Already correct |
| `src/routes/query.ts` | 66 | `scoreThreshold: 0` | Already correct |
| `src/services/rag/index.ts` | 60 | `scoreThreshold: input.scoreThreshold ?? 0` | Already correct |

**Finding:** All three call sites already explicitly pass `scoreThreshold: 0`. The `rag/index.ts` fallback also defaults to `0`. No caller is passing a user-configurable threshold. The only remaining gap is the absence of a documenting comment.

### Implementation

**Step 1 — Add guard comment in `src/services/vectorstore/index.ts`**

At line 50, the current code is:
```typescript
const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
```

Add a comment block above it:
```typescript
// IMPORTANT: Do not pass scoreThreshold > 0 for RRF results.
// RRF scores are rank-based (max ≈ 2/(RRF_K+1) ≈ 0.033), not similarity-based.
// A threshold > 0.033 silently discards ALL results. Use topK to control result count.
const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
```

**Step 2 — Add guard comment in `src/services/rag/types.ts`**

The `RagQuery` interface has `scoreThreshold?: number` (line 5). Add an inline comment:
```typescript
export interface RagQuery {
  query: string
  userId?: string
  topK?: number
  /** Must be 0 for RRF hybrid search. RRF scores max at ~0.033; any positive threshold discards results. */
  scoreThreshold?: number
}
```

**Step 3 — Add guard comment in `src/services/vectorstore/types.ts`**

The `SearchOptions` interface has `scoreThreshold?: number` (line 29). Add inline comment:
```typescript
export interface SearchOptions {
  topK?: number
  /** Must be 0 for RRF results. RRF scores are rank-based (max ≈ 0.033), not cosine similarity. */
  scoreThreshold?: number
  userId?: string
}
```

No logic changes are needed — all three REST/MCP callers already pass `scoreThreshold: 0` explicitly.

### Files changed

- `src/services/vectorstore/index.ts` — add comment block above `threshold` assignment
- `src/services/rag/types.ts` — add JSDoc comment to `scoreThreshold` field in `RagQuery`
- `src/services/vectorstore/types.ts` — add JSDoc comment to `scoreThreshold` field in `SearchOptions`

### Verification

```bash
# Confirm all callers pass scoreThreshold: 0
grep -n "scoreThreshold" \
  /c/Users/noadmin/nospace/development/contexter/src/routes/query.ts \
  /c/Users/noadmin/nospace/development/contexter/src/routes/mcp-remote.ts \
  /c/Users/noadmin/nospace/development/contexter/src/routes/dev.ts \
  /c/Users/noadmin/nospace/development/contexter/src/services/rag/index.ts
```

Expected output (exact lines, all showing `0`):
```
src/routes/query.ts:66:      scoreThreshold: 0,
src/routes/mcp-remote.ts:340:          scoreThreshold: 0,
src/routes/dev.ts:81:      scoreThreshold: 0,
src/services/rag/index.ts:60:          scoreThreshold: input.scoreThreshold ?? 0,
```

```bash
# Confirm DEFAULT_SCORE_THRESHOLD is 0 after F-001
grep "DEFAULT_SCORE_THRESHOLD" /c/Users/noadmin/nospace/development/contexter/src/services/vectorstore/types.ts
```
Expected: `export const DEFAULT_SCORE_THRESHOLD = 0`

---

## Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | Queries return non-empty `sources[]` after F-001 | `curl -s POST /dev/query '{"query":"test","topK":5}' \| jq '.sources \| length'` returns > 0 |
| AC-2 | Source scores are in RRF range 0.01–0.04 | `jq '[.sources[].score]'` on query response shows floats < 0.05 |
| AC-3 | `countTokens("Hello world")` returns BPE token count, not word count | `bun -e "import {countTokens} from './src/services/chunker/tokenizer.ts'; console.log(await countTokens('Hello world'))"` prints `2` |
| AC-4 | Fallback activates gracefully if gpt-tokenizer fails | Temporarily rename package, restart server — should log warning and use word*1.4, not crash |
| AC-5 | Russian morphological FTS: query "компания" matches "компании" | Upload RU doc, query "компания", get results containing inflected forms |
| AC-6 | `websearch_to_tsquery` phrase syntax works | `psql $DB -c "SELECT websearch_to_tsquery('english', '\"machine learning\"');"` returns no error |
| AC-7 | LLM answer contains `[N]` citation markers | Query with `topK >= 2`, `result.answer` contains at least one `[1]` or `[2]` |
| AC-8 | `citations[]` array is present in API response and maps to source indices | `jq '.citations'` on `/api/query` response returns array, each entry has `number`, `sourceIndex`, `chunkId`, `documentId` |
| AC-9 | Empty citations[] when LLM omits markers | API still returns `citations: []`, not a missing field |
| AC-10 | All RRF callers pass `scoreThreshold: 0` | `grep scoreThreshold src/routes/*.ts src/services/rag/index.ts` shows only `0` values |
| AC-11 | TypeScript compiles without errors | `bun tsc --noEmit` exits 0 |
