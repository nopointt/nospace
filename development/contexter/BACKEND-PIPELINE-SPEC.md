# Backend Pipeline Fix — CTO Spec

## Problem

Pipeline (parse→chunk→embed→index) runs SYNCHRONOUSLY inside the upload POST handler. Issues:
1. Upload request blocks until entire pipeline completes (~10-30s)
2. If any stage times out (CF Workers 30s limit), entire request dies
3. No intermediate stage status in D1 — frontend can't show real progress
4. Status API returns only overall status, no stage breakdown
5. `jobs` table exists in schema but pipeline never writes to it
6. No retry mechanism for failed stages

## Solution Architecture

### Phase 1: Stage Tracking (immediate fix)
- Pipeline writes job rows to D1 `jobs` table at START of each stage
- Updates job status to "done"/"error" AFTER each stage
- Status endpoint (`/api/status/:documentId`) returns stages from `jobs` table
- Frontend polls status and gets real stage-by-stage progress

### Phase 2: Async Pipeline (proper fix)
- Upload handler: store file in R2 + insert document row + return immediately with documentId
- Use `c.executionCtx.waitUntil()` to run pipeline in background (non-blocking)
- Pipeline updates jobs table after each stage
- Frontend polls status endpoint for progress
- If worker dies mid-pipeline, jobs table shows last completed stage

### Phase 3: Error Recovery
- Failed stages can be retried via POST `/api/retry/:documentId`
- Retry resumes from last failed stage (doesn't re-run completed stages)
- Rate limiting errors (Jina) get auto-retry with exponential backoff

## Files to Modify

1. `src/services/pipeline.ts` — Add job tracking, stage-by-stage DB writes
2. `src/routes/upload.ts` — Make pipeline async (waitUntil), return immediately
3. `src/routes/status.ts` — Return stages from jobs table
4. `src/db/schema.ts` — Verify jobs table has correct columns
5. NEW: `src/routes/retry.ts` — Retry failed pipelines

## DB Schema (jobs table — already exists)

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'parse' | 'chunk' | 'embed' | 'index'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'done' | 'error'
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## API Changes

### POST /api/upload (modified)
Response changes from blocking to immediate:
```json
{
  "documentId": "abc123",
  "status": "processing",
  "message": "pipeline started"
}
```

### GET /api/status/:documentId (modified)
New response with stages:
```json
{
  "documentId": "abc123",
  "fileName": "test.pdf",
  "status": "processing",
  "stages": [
    { "type": "parse", "status": "done", "progress": 100 },
    { "type": "chunk", "status": "running", "progress": 50 },
    { "type": "embed", "status": "pending", "progress": 0 },
    { "type": "index", "status": "pending", "progress": 0 }
  ],
  "chunks": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### POST /api/retry/:documentId (new)
Resumes failed pipeline from last error stage.

## Frontend Compatibility

Frontend already expects `stages[]` in status response (see `web/src/lib/api.ts` → `getDocumentStatus`). The API just needs to actually return it.

## Verification

1. Upload PDF → response < 2s, documentId returned
2. Poll status → stages update in real-time (parse→done, chunk→running...)
3. Full pipeline completes → all stages "done", document status "ready"
4. Force error (bad file) → stage shows "error", other stages "pending"
5. Retry → resumes from failed stage
