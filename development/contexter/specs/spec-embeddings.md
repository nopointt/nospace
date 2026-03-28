# Spec: Embeddings — F-006, F-009, F-028
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

## Stack context

- **Runtime:** Bun on Hetzner
- **Framework:** Hono
- **DB:** PostgreSQL 16 + pgvector (via `postgres` driver, raw SQL tagged templates)
- **Cache:** Redis 7 via `ioredis` — instance available on `env.redis` in all route handlers, passed explicitly to services
- **Queue:** BullMQ — pipeline worker in `src/services/queue.ts` connects via `process.env.REDIS_URL`
- **Embeddings:** Jina v4 (`jina-embeddings-v4`) via `EmbedderService` in `src/services/embedder/index.ts`
- **Entry point:** `src/index.ts` — constructs `env: Env`, injects into Hono context via middleware
- **Pipeline entry:** `src/services/pipeline.ts` — `runPipelineAsync()` is called by the BullMQ worker in `queue.ts`. It calls `createServices(env, sql)` internally, which constructs `EmbedderService` directly.
- **Env type:** `src/types/env.ts` — `redis: Redis` field already present

**Dependency order: F-006 → F-009 → F-028.** F-009 must be live before F-028 is deployed. F-006 should be done first to avoid re-embedding at two dimensions.

---

## F-006: MRL dimension reduction 1024d → 512d

### Current state

`src/services/embedder/types.ts` line 19:
```typescript
export const JINA_DIMENSIONS = 1024
```

`src/db/schema.ts` lines 5–15:
```typescript
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)"
  },
  ...
})
```

`src/services/embedder/index.ts` line 76: `truncate_dim: dimensions` is already sent in the Jina API body — MRL truncation is supported natively by the API. No change needed in `callApi()`.

`drizzle-pg/0001_fts_and_vector_indexes.sql` line 8:
```sql
CREATE INDEX "chunks_embedding_idx" ON "chunks") USING hnsw ("embedding" vector_cosine_ops);
```
Latest migration is `0003_auth_providers.sql`. Migration numbers: F-006 = **0005**, F-028 = **0009**.

### Why 512d

Jina v4 uses Matryoshka Representation Learning — 512d retains 99.7% nDCG@10 quality vs 1024d. Benefits: 50% storage reduction, ~1.5–2× HNSW search speed, smaller index RAM footprint.

### Implementation

**Step 1 — Change the constant in `src/services/embedder/types.ts`:**
```typescript
export const JINA_DIMENSIONS = 512   // was 1024 — MRL truncation, retains 99.7% nDCG@10
```
No other change needed in `EmbedderService` — `dimensions` is passed through to `callApi()` already.

**Step 2 — Update the custom type in `src/db/schema.ts`:**
```typescript
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(512)"   // was vector(1024)
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(",").map(Number)
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`
  },
})
```

**Step 3 — Create migration file `drizzle-pg/0005_reduce_embedding_dims.sql`** (full SQL in section below).

**Step 4 — Re-embed all existing chunks using the existing script `reembed_chunks.ts`** (already present at project root). The script re-embeds with `truncate_dim: 512` sent to Jina. After Step 3 runs, execute:
```bash
bun run reembed_chunks.ts
```
The script reads all chunks without embeddings (set to NULL in migration) and re-embeds them in batches.

**Step 5 — HNSW index rebuild** is included in the migration SQL (drop old index, recreate at 512d).

### Migration SQL

**File: `drizzle-pg/0005_reduce_embedding_dims.sql`**

```sql
-- F-006: MRL dimension reduction 1024d → 512d
-- Retains 99.7% nDCG@10. 50% storage savings, ~1.5-2x HNSW search speed.

-- Drop HNSW index before altering column type (PG requires this)
DROP INDEX IF EXISTS "chunks_embedding_idx";
--> statement-breakpoint

-- Set all existing embeddings to NULL (will be re-embedded at 512d by reembed_chunks.ts)
UPDATE "chunks" SET "embedding" = NULL;
--> statement-breakpoint

-- Alter column type from vector(1024) to vector(512)
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(512) USING NULL;
--> statement-breakpoint

-- Rebuild HNSW index for 512d cosine similarity
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);
```

> Note: `USING NULL` in the ALTER is a safe cast since we already set all values to NULL in the UPDATE above. pgvector does not support implicit cast between `vector(1024)` and `vector(512)` — NULL-first is the correct approach.

### Files changed

| File | Change |
|---|---|
| `src/services/embedder/types.ts` | `JINA_DIMENSIONS = 512` |
| `src/db/schema.ts` | `dataType()` returns `"vector(512)"` |
| `drizzle-pg/0005_reduce_embedding_dims.sql` | New migration file (full SQL above) |

### Verification

```bash
# 1. Confirm new embeddings are 512d
curl -s -X POST https://api.contexter.cc/api/pipeline \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test-doc-001"}' | jq '.stages[] | select(.stage=="embed") | .data.dimensions'
# Expected: 512

# 2. Confirm schema column type
psql $DATABASE_URL -c "\d chunks" | grep embedding
# Expected: embedding | vector(512) | ...

# 3. Confirm HNSW index exists
psql $DATABASE_URL -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename='chunks' AND indexname='chunks_embedding_idx';"
# Expected: row with indexdef containing "hnsw" and "vector_cosine_ops"

# 4. Confirm no 1024d vectors remain after re-embed
psql $DATABASE_URL -c "SELECT COUNT(*) FROM chunks WHERE embedding IS NOT NULL AND vector_dims(embedding) != 512;"
# Expected: 0
```

---

## F-009: Embedding cache — Tier 1 (Redis)

> **Prerequisite:** F-006 must be complete first so all cached vectors are 512d from the start.

### Current state

`src/services/pipeline.ts` function `createServices()` (lines 85–95):
```typescript
function createServices(env: Env, sql: Sql) {
  ...
  const embedderService = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  ...
}
```

`EmbedderService` has no cache. Every call to `embedBatch()` or `embedQuery()` hits the Jina API (200–400ms per call). Re-uploads, retries, and repeated content all pay full API cost.

`env.redis` (type `Redis` from `ioredis`) is already constructed in `src/index.ts` line 49 and injected into `env`. It is available everywhere `env` is passed.

### Implementation

**Create new file `src/services/embedder/cache.ts`.**

This file exports `CachedEmbedderService` which wraps `EmbedderService`. It must not modify `EmbedderService` itself (immutability rule — new wrapper, not mutation).

#### Cache key format
```
emb:v1:{model}:{task}:{dims}:{sha256hex}
```
- `model`: the Jina model name (e.g. `jina-embeddings-v4`)
- `task`: `retrieval.passage`, `retrieval.query`, or `text-matching`
- `dims`: the dimensions integer (e.g. `512`)
- `sha256hex`: SHA-256 hex of normalized text

**Text normalization before hashing:**
1. Unicode NFC normalization: `text.normalize("NFC")`
2. Trim leading/trailing whitespace: `.trim()`
3. Collapse internal whitespace sequences to single space: `.replace(/\s+/g, " ")`

This ensures `"hello  world"` and `"hello world"` share a cache entry.

**SHA-256 in Bun:**
```typescript
const normalized = text.normalize("NFC").trim().replace(/\s+/g, " ")
const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized))
const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
```

#### TTL values
- `retrieval.passage` and `text-matching`: **2592000 seconds** (30 days) — document content is stable
- `retrieval.query`: **14400 seconds** (4 hours) — query embeddings are ephemeral

#### Algorithm: batch cache lookup → embed uncached → batch cache store

For `embedBatch(texts, options)`:
1. Compute cache keys for all texts (normalize + hash each)
2. Redis pipeline `MGET` all keys in one round-trip
3. Partition texts into `cached` (key hit → parse JSON vector from Redis value) and `uncached` (key miss)
4. If `uncached.length > 0` → call `this.inner.embedBatch(uncachedTexts, options)` to get fresh embeddings from Jina
5. Redis pipeline `SET key value EX ttl` for each newly computed embedding
6. Reconstruct full result array in original order: merge cached + freshly embedded results
7. Return `{ embeddings: orderedResults, totalTokens }` — `totalTokens` is the sum from the Jina call (cached hits contribute 0 tokens)

For `embed(text, options)`:
- Delegate to `embedBatch([text], options)`, return `result.embeddings[0]`

For `embedQuery(query, options)`:
- Delegate to `embed(query, { ...options, task: "retrieval.query" })`

**Graceful degradation:** if Redis throws at any point (lookup or store), log a warning and fall through to `this.inner`. Never propagate Redis errors to the caller.

#### Full class interface

```typescript
import type Redis from "ioredis"
import { EmbedderService } from "./index"
import type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions } from "./types"
import { JINA_MODEL, JINA_DIMENSIONS } from "./types"

export class CachedEmbedderService {
  private inner: EmbedderService
  private redis: Redis

  constructor(inner: EmbedderService, redis: Redis) { ... }

  async embed(text: string, options?: EmbedderOptions): Promise<EmbeddingResult> { ... }
  async embedBatch(texts: string[], options?: EmbedderOptions): Promise<BatchEmbeddingResult> { ... }
  async embedQuery(query: string, options?: EmbedderOptions): Promise<EmbeddingResult> { ... }

  private async computeKey(text: string, model: string, task: string, dims: number): Promise<string> { ... }
  private ttlFor(task: string): number { ... }
}
```

`CachedEmbedderService` must expose the same public method signatures as `EmbedderService` so it can be used as a drop-in replacement wherever `EmbedderService` is typed.

#### Injection in `src/services/pipeline.ts`

The `createServices()` function must be updated to accept `redis` and wrap the embedder:

```typescript
// Before (line 85–95):
function createServices(env: Env, sql: Sql) {
  ...
  const embedderService = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  ...
}

// After:
function createServices(env: Env, sql: Sql) {
  ...
  const rawEmbedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const embedderService = new CachedEmbedderService(rawEmbedder, env.redis)
  ...
}
```

All three call-sites of `createServices(env, sql)` in `pipeline.ts` (`runPipeline`, `runPipelineAsync`, `resumePipelineFromStage`) automatically gain caching — no changes needed in those functions.

#### Redis configuration note (for DevOps, not code)

Set on the Redis instance: `maxmemory 1gb` and `maxmemory-policy allkeys-lru`. This ensures the cache self-manages under memory pressure. Estimated memory: 10K passages × ~6KB each ≈ 60MB + 5K queries × ~3KB each ≈ 15MB = ~75MB total. Well within 1GB.

### Files changed

| File | Change |
|---|---|
| `src/services/embedder/cache.ts` | New file — `CachedEmbedderService` implementation |
| `src/services/pipeline.ts` | `createServices()` wraps `EmbedderService` with `CachedEmbedderService` |

### Verification

```bash
# 1. Ingest a document, then ingest the same document again
# First ingest — should call Jina API (cache miss):
curl -s -X POST https://api.contexter.cc/api/upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@/tmp/test.pdf"
# Note the documentId from response

# Wait for pipeline to complete (check /api/status/{documentId})

# 2. Check Redis has keys after first ingest:
redis-cli -u $REDIS_URL KEYS "emb:v1:*" | wc -l
# Expected: > 0 (one key per unique chunk text)

# 3. Ingest the same file again:
curl -s -X POST https://api.contexter.cc/api/upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@/tmp/test.pdf"
# Note the new documentId

# 4. Check pipeline embed stage duration is dramatically shorter on second ingest:
curl -s https://api.contexter.cc/api/status/$NEW_DOC_ID \
  | jq '.jobs[] | select(.type=="embed") | .duration_ms'
# Expected: much lower than first ingest (cache hits return in <5ms vs 200-400ms from Jina)

# 5. Verify a specific key exists and is valid JSON with a vector array:
redis-cli -u $REDIS_URL GET "$(redis-cli -u $REDIS_URL KEYS 'emb:v1:*' | head -1)"
# Expected: JSON string containing a float array of length 512

# 6. Verify TTL is set correctly for a passage key:
redis-cli -u $REDIS_URL TTL "$(redis-cli -u $REDIS_URL KEYS 'emb:v1:jina-embeddings-v4:retrieval.passage:*' | head -1)"
# Expected: value near 2592000 (30 days in seconds)
```

---

## F-028: Embedding cache — Tier 2 (Semantic dedup at ingest)

> **Prerequisite: F-009 must be deployed first.** F-028 runs after embedding — if F-009 is live, cache hits make the dedup check essentially free for repeated content. F-028 is post-embed dedup (semantic similarity), not pre-embed dedup (exact text match, which F-009 handles).

### Current state

`src/services/pipeline.ts` index stage (lines 270–292 in `runPipelineAsync`): chunks are inserted into `chunks` table with `ON CONFLICT DO UPDATE`. There is no similarity check before insertion — semantically identical chunks from re-uploaded documents all get indexed, causing index bloat and duplicate results in searches.

`src/db/schema.ts`: `chunks` table has no `duplicate_of` column.

`src/services/vectorstore/vector.ts` `search()` method shows the cosine distance pattern: `1 - (embedding <=> $vec::vector)` gives cosine similarity. The `<=>` operator gives cosine distance; `1 - distance` gives cosine similarity.

### Implementation

#### Schema change: add `duplicate_of` column to `chunks`

New migration file: **`drizzle-pg/0009_semantic_dedup.sql`**

Full SQL in section below.

Update `src/db/schema.ts` `chunks` table definition to add:
```typescript
duplicateOf: text("duplicate_of").references((): AnyPgColumn => chunks.id),
```
(Self-referential FK — requires importing `AnyPgColumn` from `drizzle-orm/pg-core`.)

#### New file `src/services/embedder/dedup.ts`

Exports one async function:
```typescript
export async function findNearDuplicate(
  sql: Sql,
  embedding: number[],
  userId: string,
  threshold: number = 0.98
): Promise<string | null>
```

This function queries pgvector for the most similar existing chunk for the same user. If the top result's cosine similarity exceeds `threshold`, it returns that chunk's `id`. Otherwise returns `null`.

**Exact SQL query to use:**
```sql
SELECT id, 1 - (embedding <=> $1::vector) AS similarity
FROM chunks
WHERE user_id = $2
  AND embedding IS NOT NULL
  AND duplicate_of IS NULL
ORDER BY embedding <=> $1::vector
LIMIT 1
```

Only non-duplicate chunks are considered as dedup targets (`duplicate_of IS NULL`) — avoids chains of duplicates pointing to duplicates.

**In `postgres` driver tagged template syntax:**
```typescript
const vectorStr = `[${embedding.join(",")}]`
const rows = await sql`
  SELECT id, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
  FROM chunks
  WHERE user_id = ${userId}
    AND embedding IS NOT NULL
    AND duplicate_of IS NULL
  ORDER BY embedding <=> ${vectorStr}::vector
  LIMIT 1
`
if (rows.length === 0) return null
const similarity = Number(rows[0].similarity)
return similarity > threshold ? (rows[0].id as string) : null
```

**Threshold: 0.98** — empirically chosen. 1.0 = identical vectors. 0.98 catches near-exact semantic duplicates (same text with minor formatting differences) while not flagging genuinely different chunks on the same topic.

#### Injection in `src/services/pipeline.ts` — index stage

In both `runPipelineAsync` and `resumePipelineFromStage`, modify the index stage chunk insertion loop:

**Before** (current pattern — inserts all chunks unconditionally):
```typescript
const chunkRows = chunks.map((chunk) => ({
  id: `${documentId}-${chunk.index}`,
  document_id: documentId,
  user_id: userId,
  content: chunk.content,
  chunk_index: chunk.index,
  token_count: chunk.tokenCount,
}))
await sql`INSERT INTO chunks ${sql(chunkRows)} ON CONFLICT (id) DO UPDATE SET ...`
```

**After** (dedup check per chunk, build separate arrays):
```typescript
import { findNearDuplicate } from "./embedder/dedup"

const canonicalRows: ChunkRow[] = []
const duplicateRows: ChunkRow[] = []

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i]
  const embedding = embedResult.embeddings[i].vector
  const chunkId = `${documentId}-${chunk.index}`

  // Check for near-duplicate among already-indexed chunks for this user
  const duplicateOf = await findNearDuplicate(sql, embedding, userId)

  const row = {
    id: chunkId,
    document_id: documentId,
    user_id: userId,
    content: chunk.content,
    chunk_index: chunk.index,
    token_count: chunk.tokenCount,
    duplicate_of: duplicateOf ?? null,
  }

  if (duplicateOf !== null) {
    duplicateRows.push(row)
  } else {
    canonicalRows.push(row)
  }
}

// Insert all rows (both canonical and duplicate) — duplicate_of column carries the audit trail
const allRows = [...canonicalRows, ...duplicateRows]
await sql`INSERT INTO chunks ${sql(allRows)} ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, token_count = EXCLUDED.token_count, duplicate_of = EXCLUDED.duplicate_of`

// Only index canonical chunks in the vector store — skip duplicates
const canonicalRecords: VectorRecord[] = canonicalRows.map((row) => {
  const chunkIdx = chunks.findIndex(c => `${documentId}-${c.index}` === row.id)
  return {
    id: row.id,
    vector: embedResult.embeddings[chunkIdx].vector,
    metadata: { documentId, userId, chunkIndex: row.chunk_index, content: row.content },
  }
})
if (canonicalRecords.length > 0) {
  await vectorStoreService.index(canonicalRecords)
}
```

**Performance note:** `findNearDuplicate` runs one pgvector query per chunk. For a 50-chunk document this is 50 sequential queries. The HNSW index makes each query fast (~5–10ms), so 50 chunks = ~250–500ms overhead. This is acceptable given the async BullMQ context and the 120s index stage timeout. If corpus grows to 10K+ chunks, consider batching the dedup queries in a future iteration.

**Also apply this change to `runPipeline()` (the sync path used by `/api/pipeline` dev route)** for consistency, though it is lower priority than the async path.

### Migration SQL

**File: `drizzle-pg/0009_semantic_dedup.sql`**

```sql
-- F-028: Add duplicate_of column to chunks for semantic dedup audit trail
ALTER TABLE "chunks" ADD COLUMN "duplicate_of" TEXT REFERENCES "chunks"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "chunks_duplicate_of_idx" ON "chunks" ("duplicate_of") WHERE "duplicate_of" IS NOT NULL;
```

`ON DELETE SET NULL`: if the canonical chunk is deleted, duplicates lose their pointer but remain in the table with `duplicate_of = NULL` (they become canonical). This avoids orphaned references.

The partial index on `duplicate_of` (only non-NULL rows) is small and cheap — useful for queries that need to find all duplicates of a given canonical chunk.

### Files changed

| File | Change |
|---|---|
| `drizzle-pg/0009_semantic_dedup.sql` | New migration file |
| `src/db/schema.ts` | Add `duplicateOf` column to `chunks` table |
| `src/services/embedder/dedup.ts` | New file — `findNearDuplicate()` function |
| `src/services/pipeline.ts` | Index stage in `runPipelineAsync`, `resumePipelineFromStage`, `runPipeline` — dedup check before vectorStore.index |

### Verification

```bash
# 1. Upload the same document twice and verify second ingest produces duplicate_of references:
DOC1=$(curl -s -X POST https://api.contexter.cc/api/upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@/tmp/test.pdf" | jq -r '.documentId')

# Wait for DOC1 to be ready
sleep 30

DOC2=$(curl -s -X POST https://api.contexter.cc/api/upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@/tmp/test.pdf" | jq -r '.documentId')

# Wait for DOC2 to be ready
sleep 30

# Check that DOC2 chunks have duplicate_of set:
psql $DATABASE_URL -c \
  "SELECT COUNT(*) FROM chunks WHERE document_id = '$DOC2' AND duplicate_of IS NOT NULL;"
# Expected: equal to (or close to) the total number of chunks in DOC2

# 2. Verify DOC2 chunks were NOT indexed in vector store (no embeddings):
psql $DATABASE_URL -c \
  "SELECT COUNT(*) FROM chunks WHERE document_id = '$DOC2' AND duplicate_of IS NOT NULL AND embedding IS NOT NULL;"
# Expected: 0 (duplicates have no embedding — they weren't passed to vectorStoreService.index)

# 3. Verify that a unique document does NOT get flagged as duplicate:
DOC3=$(curl -s -X POST https://api.contexter.cc/api/upload \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@/tmp/unique_content.pdf" | jq -r '.documentId')

sleep 30

psql $DATABASE_URL -c \
  "SELECT COUNT(*) FROM chunks WHERE document_id = '$DOC3' AND duplicate_of IS NOT NULL;"
# Expected: 0 (all chunks are canonical)

# 4. Verify threshold behavior — check similarity of a flagged duplicate to its canonical:
psql $DATABASE_URL -c "
  SELECT c.id, c.duplicate_of,
    1 - (c2.embedding <=> c.embedding) AS similarity
  FROM chunks c
  JOIN chunks c2 ON c2.id = c.duplicate_of
  WHERE c.document_id = '$DOC2'
  LIMIT 5;
"
# Expected: similarity values all > 0.98
```

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | `JINA_DIMENSIONS` constant is 512 | `grep JINA_DIMENSIONS src/services/embedder/types.ts` → `512` |
| AC-2 | Schema column is `vector(512)` | `psql $DB -c "\d chunks"` → embedding column shows `vector(512)` |
| AC-3 | No 1024d vectors remain after re-embed | `SELECT COUNT(*) FROM chunks WHERE embedding IS NOT NULL AND vector_dims(embedding) != 512;` → 0 |
| AC-4 | HNSW index rebuilt at 512d | `pg_indexes` query shows `hnsw` index on `chunks.embedding` |
| AC-5 | Redis has cache keys after first embed | `redis-cli KEYS "emb:v1:*" \| wc -l` → > 0 |
| AC-6 | Second ingest of same file hits cache (faster embed stage) | Status API embed `duration_ms` for repeat ingest is ≤10% of first ingest time |
| AC-7 | Cache keys have correct TTL | `redis-cli TTL emb:v1:jina-embeddings-v4:retrieval.passage:512:*` → ~2592000 |
| AC-8 | Redis failure does not break ingest | Stop Redis, run pipeline — ingest completes normally (falls back to Jina) |
| AC-9 | Duplicate chunks have `duplicate_of` set | Re-upload same doc → query shows all chunks with `duplicate_of IS NOT NULL` |
| AC-10 | Duplicate chunks have no embedding | `SELECT COUNT(*) FROM chunks WHERE duplicate_of IS NOT NULL AND embedding IS NOT NULL;` → 0 |
| AC-11 | Unique documents have `duplicate_of = NULL` | Upload new unique doc → all chunks have `duplicate_of IS NULL` |
| AC-12 | `duplicate_of` similarity > 0.98 | Join query on flagged duplicates → all similarity values > 0.98 |
