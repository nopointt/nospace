Now I have a thorough understanding of all files. Let me compile the complete review.

---

## Code Review: Contexter — Infrastructure, Resilience, Job Queue, Docker & Observability

---

### [CRITICAL] — Drift detection uses incompatible projection spaces

**File:** `src/services/evaluation/drift.ts:152,209`
**Category:** correctness
**Description:** The baseline creation (`createBaseline`, line 152) calls `buildProjectionMatrix()` to get a random 32x512 Gaussian projection matrix, then projects all embeddings with it and stores the projected 32d vectors in PostgreSQL. When `runDriftCheck` runs on the next weekly job (line 209), it calls `buildProjectionMatrix()` again, which uses `Math.random()` and produces a completely different random matrix. The current embeddings are then projected into a different subspace than the baseline. The MMD² comparison is thus between vectors in geometrically incompatible spaces — the computed score is mathematically meaningless and will report random noise rather than actual distributional drift. The projection matrix is never persisted to the database; only the projected vectors are stored.

**Recommendation:** Either (a) persist the projection matrix alongside the baseline in `eval_drift_baseline` and reload it in `runDriftCheck`, or (b) eliminate random projection entirely and use a deterministic reduction (PCA computed once). The simplest fix is to store the matrix as a JSONB column:

```sql
-- Add to eval_drift_baseline
ALTER TABLE eval_drift_baseline ADD COLUMN projection_matrix jsonb;
```

```typescript
// In createBaseline: store the matrix
await sql`INSERT INTO eval_drift_baseline (..., projection_matrix) VALUES (..., ${JSON.stringify(matrixAsArray)}::jsonb)`

// In runDriftCheck: load and reuse the matrix
const { projections, projection_matrix } = rows[0]
const matrix = (projection_matrix as number[][]).map(r => new Float64Array(r))
const current = embeddings.map((e) => projectVector(e, matrix))
```

---

### [CRITICAL] — `groqWhisperPolicy` and `doclingPolicy` circuit breakers are defined but never applied

**File:** `src/services/resilience.ts:113,134`
**Category:** reliability
**Description:** Both `groqWhisperPolicy` (Groq Whisper circuit breaker + bulkhead + retry) and `doclingPolicy` (Docling circuit breaker + bulkhead + retry) are exported but never imported or used anywhere in the codebase. Searching all TypeScript files confirms neither symbol is imported outside of `resilience.ts` itself. As a result, Docling and Groq Whisper HTTP calls are made raw, without circuit breaking, bulkhead throttling, or cockatiel retry. A Docling container crash or Groq Whisper 5xx storm will immediately propagate failures directly to BullMQ job attempts, consuming all 3 retry slots with no half-open recovery logic. Similarly, `jinaPolicy` is defined but also never imported (the embedder implements its own inline retry loop in `embedder/index.ts`).

**Recommendation:** Wrap the Docling HTTP call in `docling.ts` and the Whisper HTTP calls in `audio.ts` and `video.ts` with the corresponding policy. Example for `docling.ts`:

```typescript
import { doclingPolicy } from "../resilience"

const res = await doclingPolicy.execute(() =>
  fetch(`${this.doclingUrl}/v1/convert/file`, { method: "POST", body: formData, signal: AbortSignal.timeout(90_000) })
)
```

The embedder's inline retry loop should either be replaced by `jinaPolicy.execute()` or the policy should be removed to avoid duplicate retry logic.

---

### [CRITICAL] — `RateLimitTracker` instances (`jinaRateLimiter`, `groqRateLimiter`) are never called

**File:** `src/services/resilience.ts:34-35`
**Category:** reliability
**Description:** The `RateLimitTracker` class is designed to provide thundering-herd protection: when a 429 is received, all concurrent requests for that provider back off. Both `jinaRateLimiter` and `groqRateLimiter` are exported module-level singletons. However, no code anywhere in the codebase calls `setBackoff()` on a 429 response, and no code calls `isBackingOff()` before making a request. The trackers exist only on paper and provide zero protection. Meanwhile, the embedder's inline retry (`embedder/index.ts:108`) retries 429s independently on each concurrent call, recreating the thundering-herd problem the tracker was meant to solve.

**Recommendation:** In `embedder/index.ts`, check `jinaRateLimiter.isBackingOff()` before the fetch and call `jinaRateLimiter.setBackoff(retryAfterMs)` on any 429 response. Parse the `Retry-After` header from Jina's 429 response to get the correct backoff duration. Same pattern applies to Groq callers.

---

### [HIGH] — BullMQ exponential backoff delay comment is wrong — actual delays are 60s/120s/240s

**File:** `src/services/queue.ts:27`
**Category:** correctness
**Description:** The comment `// 1min, 5min, 15min` is incorrect. BullMQ's exponential backoff computes delay as `delay * 2^(attempt - 1)`. With `delay: 60_000`, the actual delays are: attempt 1 → 60s, attempt 2 → 120s, attempt 3 → 240s. The comment implies the intended behavior was 60s/300s/900s, which would require `delay: 60_000` and a different multiplier or `delay: 300_000` with a different base. This is not merely cosmetic: if the document pipeline consistently fails due to a transient Docling downtime (e.g. OOM restart of the docling container), 240s total retry window may not be long enough to survive a container restart plus model reload.

**Recommendation:** Either correct the comment to `// 1min, 2min, 4min` to match actual behavior, or use `delay: 300_000` to achieve the intended `5min, 10min, 20min` pattern (more appropriate for a heavy processing pipeline). Also consider adding a `limiter` to the worker to cap job processing rate during recovery.

---

### [HIGH] — Pipeline job dedup ID not set — duplicate jobs possible on double-submit

**File:** `src/routes/upload.ts:204`, `src/routes/mcp-remote.ts:450,552`
**Category:** reliability
**Description:** All `queue.add("process", data)` calls across `upload.ts` and `mcp-remote.ts` omit the `jobId` option. BullMQ generates a UUID for each `add()` call, meaning that if the same document is submitted twice (network retry, double-click, or the fallback path in `upload.ts` that calls `runPipelineAsync` directly after failing BullMQ enqueue), two jobs will process the same `documentId`. The pipeline writes chunks to PostgreSQL with `ON CONFLICT (id) DO UPDATE`, which handles idempotency at the DB level, but the vector store (`vectorStoreService.index()`) is called twice, potentially indexing duplicate vectors. The dedup check (`findNearDuplicate`) runs per-chunk but may not cover all vector store duplicate scenarios.

**Recommendation:** Set `jobId` to the `documentId` when enqueuing to prevent BullMQ from running duplicate processing:

```typescript
await queue.add("process", data, { jobId: `pipeline-${documentId}` })
```

---

### [HIGH] — `feedback_score` decay formula has inconsistent denominator vs the write path

**File:** `src/services/feedback-decay.ts:27-28`
**Category:** correctness
**Description:** The decay job recalculates `feedback_score` using `denominator = pos + neg + 2` (Laplace smoothing with α=1). The write path in `src/routes/feedback.ts:60,68` uses `denominator = pos + neg + 3` (α=1.5 smoothing). These are inconsistent Bayesian priors. Every daily decay run will recompute the score using a different prior than the one originally written, causing score drift independent of actual feedback. A chunk with `pos=10, neg=0` would have score `0.5 + 11/12 ≈ 1.42` written by the feedback route, then recalculated by decay to `0.5 + (9.9+1)/(9.9+0+2) ≈ 1.49` — a different value.

**Recommendation:** Unify the prior. Choose one denominator (`+2` for Laplace or `+3` for a stronger prior) and apply it consistently in both `feedback.ts` and `feedback-decay.ts`. This should be a deliberate architectural decision documented in a comment.

---

### [HIGH] — Docker Compose: 6 of 7 services have no memory limits — OOM risk on 4GB host

**File:** `docker-compose.yml:1-105`
**Category:** reliability
**Description:** Only `nli-sidecar` has `mem_limit: 1.5g`. The remaining six services (app, postgres, redis, caddy, docling, netdata) have no memory limits. The estimated footprints from the checklist are: `app ~512MB + postgres ~512MB + redis ~256MB + caddy ~64MB + docling ~1GB + netdata ~128MB + nli-sidecar ~1.5GB = ~4GB` — this matches the entire host RAM. Without per-service memory limits, a single memory spike in `docling` (processing a large PDF) or `app` (large batch embedding) will trigger the Linux OOM killer, which will kill an arbitrary process — most likely the largest anonymous allocation, which could be `postgres` or `app`. This causes data corruption risk for Postgres and job loss for BullMQ workers.

**Recommendation:** Add `mem_limit` and `memswap_limit` to all services. Suggested conservative allocations:

```yaml
app:       mem_limit: 512m
postgres:  mem_limit: 768m   # shared_buffers ~256m
redis:     mem_limit: 256m
caddy:     mem_limit: 128m
docling:   mem_limit: 1.5g   # large PDFs spike here
netdata:   mem_limit: 256m
nli-sidecar: mem_limit: 1.5g  # already set
```

Total: ~4.9GB nominally, which exceeds 4GB — but limits prevent any single service from consuming all memory uncontrolled. Reduce `docling` or `nli-sidecar` to `1.2g` each if needed.

---

### [HIGH] — Docker Compose: `app` `depends_on` does not use health checks — startup race condition

**File:** `docker-compose.yml:9-11`
**Category:** reliability
**Description:** The `app` service declares `depends_on: [postgres, redis]` without `condition: service_healthy`. Docker starts `app` as soon as the `postgres` and `redis` containers start, not when they are actually ready to accept connections. PostgreSQL typically takes 2-5 seconds to initialize; Redis takes less time but can have a brief startup period. The `app` performs DB migrations at startup (or connects immediately), so it may fail with a connection-refused error and exit — potentially causing a crash loop if the restart policy triggers before Postgres finishes. Neither `postgres` nor `redis` have `healthcheck` definitions, so `service_healthy` condition cannot be used as-is.

**Recommendation:** Add healthchecks to `postgres` and `redis`, then use `condition: service_healthy` in `app`:

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
    interval: 5s
    timeout: 5s
    retries: 10

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 10

app:
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

---

### [HIGH] — Audio parser (`audio.ts`) has no HTTP timeout on Groq Whisper call

**File:** `src/services/parsers/audio.ts:35`
**Category:** reliability
**Description:** The `fetch()` call to Groq Whisper at line 35 has no `signal: AbortSignal.timeout(...)`. The video parser (`video.ts:84`) also omits a timeout on its Whisper call. The pipeline `STAGE_TIMEOUT_MS.parse = 120_000` wraps the entire parse stage via `withTimeout()`, but that timeout rejects the Promise while leaving the underlying `fetch()` open. In Bun, an orphaned fetch keeps the event loop alive and may consume resources. More importantly, if Groq Whisper hangs (not errors) for more than 2 minutes, the pipeline job will time out and be retried, but the previous request to Groq may still be pending, consuming the groqWhisperBulkhead slot (if the policy were applied).

**Recommendation:** Add per-request timeouts consistent with the stage timeout:

```typescript
const response = await fetch(this.groqApiUrl, {
  method: "POST",
  headers: { Authorization: `Bearer ${this.groqApiKey}` },
  body: formData,
  signal: AbortSignal.timeout(110_000),  // slightly under stage timeout
})
```

---

### [HIGH] — NLI sidecar: `torch` installed without CPU-only flag — pulls full CUDA build (~2GB extra)

**File:** `services/nli-sidecar/requirements.txt:2`, `services/nli-sidecar/Dockerfile:10`
**Category:** reliability
**Description:** `requirements.txt` pins `torch` without the `--extra-index-url https://download.pytorch.org/whl/cpu` specifier. On ARM64 Linux (the target platform), PyPI will install the default PyTorch build. While ARM64 builds of PyTorch do not include CUDA (CUDA is x86-only), the default PyTorch package still includes unnecessary GPU-detection code and is significantly larger than the CPU-only variant. More critically, on AMD64 (if the image is ever built for testing on an x86 machine), this would pull the full CUDA toolkit (~2GB), making the image non-functional in a 1.5GB memory container and bloating the image. No version pins exist for any dependency — `transformers` and `torch` are unpinned, so a future `pip install` will pull whatever is latest, breaking reproducibility.

**Recommendation:** Pin all dependencies with exact versions and use the CPU-only PyTorch index:

```
torch==2.2.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu
transformers==4.39.3
fastapi==0.110.1
uvicorn==0.29.0
pydantic==2.6.4
```

---

### [HIGH] — NLI sidecar `_load_model()` is called synchronously in `lifespan` — blocks event loop on startup

**File:** `services/nli-sidecar/server.py:21-25`
**Category:** reliability
**Description:** `_load_model()` calls `pipeline(...)` from `transformers`, which loads ~600MB model weights from disk and runs several hundred milliseconds of initialization, all synchronously within an `async` lifespan context manager. In FastAPI with uvicorn's async event loop, synchronous blocking calls in `async def` handlers block the event loop for all requests. During model load, the health endpoint at `/health` will be unresponsive even though the container is technically running. This means Netdata health checks (interval 30s) can fail during the 120s start_period if model load takes longer than 10s (timeout), causing unnecessary container restarts.

**Recommendation:** Wrap the blocking model load in `asyncio.get_event_loop().run_in_executor()`:

```python
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pipe
    print("Loading HHEM-2.1-Open model…")
    loop = asyncio.get_event_loop()
    _pipe = await loop.run_in_executor(None, _load_model)
    print("Model ready.")
    yield
    _pipe = None
```

---

### [HIGH] — YouTube parser scrapes HTML with brittle regex — no timeout, no rate limit handling

**File:** `src/services/parsers/youtube.ts:59,73`
**Category:** reliability
**Description:** The YouTube parser fetches the full watch page HTML (potentially several hundred KB) with no `AbortSignal.timeout()`, then uses a regex to extract caption JSON from an undocumented embedded JavaScript structure. Three issues: (1) No timeout — a slow or stalled YouTube response blocks the parse stage indefinitely; (2) The regex `/"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"` is fragile — YouTube A/B tests page structure changes, and the match group assumption will silently fail when YouTube changes their HTML format (returns "No captions data found" to users without explanation); (3) No handling for YouTube rate limiting (HTTP 429) or bot detection (HTTP 403), which are common for automated requests.

**Recommendation:** Add `signal: AbortSignal.timeout(30_000)` to both fetch calls. Add explicit handling for 403/429 responses with actionable error messages. Consider adding the YouTube page fetch to the `fetchRollingBaseline` timeout pattern.

---

### [MEDIUM] — `ORDER BY RANDOM()` on `chunks` table performs full sequential scan — performance risk at scale

**File:** `src/services/evaluation/drift.ts:120`
**Category:** performance
**Description:** `fetchEmbeddingSample` uses `SELECT embedding::text FROM chunks WHERE embedding IS NOT NULL ORDER BY RANDOM() LIMIT 500`. PostgreSQL's `ORDER BY RANDOM()` performs a full sequential scan of the entire `chunks` table (reading all rows) before randomly selecting 500. At even modest scale (10K-100K chunks), this is a table scan on a column that includes a 512-float embedding for each row — potentially hundreds of MB of data scanned weekly. The weekly drift check runs at Monday 03:00 UTC, which coincides with the daily retention job (`0 2 * * *`) — they may run close together.

**Recommendation:** Replace with `TABLESAMPLE SYSTEM` for a statistically equivalent but much faster approach:

```sql
SELECT embedding::text AS embedding
FROM chunks TABLESAMPLE SYSTEM(10)  -- sample ~10% of pages
WHERE embedding IS NOT NULL
LIMIT 500
```

Or use the `TABLESAMPLE BERNOULLI` variant for per-row sampling. This avoids the full scan.

---

### [MEDIUM] — Maintenance queue cron jobs re-register on every app restart without deduplication

**File:** `src/routes/maintenance.ts:32-46`
**Category:** reliability
**Description:** `startMaintenanceWorker()` calls `queue.add("daily-retention", {}, { repeat: ..., jobId: "daily-retention-cron" })` and `queue.add("drift-check", {}, { repeat: ..., jobId: "weekly-drift-check-cron" })` on every server startup. BullMQ uses the `jobId` as a deduplication key for repeatable jobs only when the pattern hasn't changed. If the `pattern` changes between deployments, BullMQ creates a new repeatable schedule entry without removing the old one, resulting in duplicate cron triggers. The `feedback-decay.ts` handles this correctly by explicitly calling `removeRepeatableByKey` before adding. The maintenance queue does not.

**Recommendation:** Mirror the pattern from `feedback-decay.ts` in `startMaintenanceWorker`: enumerate and remove existing repeatables named `daily-retention` and `drift-check` before re-adding:

```typescript
const existing = await queue.getRepeatableJobs()
for (const job of existing) {
  if (["daily-retention", "drift-check"].includes(job.name)) {
    await queue.removeRepeatableByKey(job.key)
  }
}
```

---

### [MEDIUM] — Netdata shell collector outputs `SET` format without `CHART` definition — collector silently produces no data

**File:** `monitoring/ragas-metrics-collector.sh:16,23`
**Category:** reliability
**Description:** The Netdata `exec`/`charts.d` plugin requires a `CHART` line before any `SET` lines to define the chart dimensions. The script outputs only `SET ragas_faithfulness_7d $FAITHFULNESS` and `SET ragas_retrieval_score_7d $RETRIEVAL` without a preceding `CHART` declaration or `BEGIN`/`END` boundaries. Without these, the Netdata collector will either ignore all SET values silently or produce errors. The alert rules in `netdata-ragas-alerts.conf` reference `on: ragas.faithfulness_7d` which will never match if the chart is never created. The monitoring system will appear to be working (no errors visible) but will produce no actual metrics or alerts.

**Recommendation:** Add the required Netdata `exec` plugin format headers:

```bash
echo "CHART ragas.faithfulness_7d '' 'RAG Faithfulness 7d' 'score' 'rag' '' line 100 60 '' '' 'ragas-metrics'"
echo "DIMENSION ragas_faithfulness_7d '' absolute 1 1000"
echo "BEGIN ragas.faithfulness_7d"
echo "SET ragas_faithfulness_7d = $(echo "$FAITHFULNESS * 1000" | bc | cut -d. -f1)"
echo "END"
```

Alternatively, use a Netdata Python collector (`.d/python.d`) which handles chart registration more cleanly.

---

### [MEDIUM] — `llm-eval.ts` hardcodes model name in `LlmEvalResult` instead of reading from `LlmService`

**File:** `src/services/evaluation/llm-eval.ts:154`
**Category:** maintainability
**Description:** `runLlmEval` returns `model: "llama-3.1-8b-instant"` as a hardcoded string in the result object. The `LlmService` instance used in the worker is constructed with `model: "llama-3.1-8b-instant"` at line 161, but `runLlmEval` is also called directly from the CI runner (`run-eval.ts`) where the `LlmService` is constructed externally. If the model is changed in the worker constructor, the logged `model` field in the eval result will be stale and misleading for audit purposes.

**Recommendation:** Pass the model name through `runLlmEval` (either as a parameter or via `llm.model`) rather than hardcoding it in the return value.

---

### [MEDIUM] — `docling.ts` Mistral OCR fallback instantiates `MistralOcrService` on every parse call

**File:** `src/services/parsers/docling.ts:77`
**Category:** performance
**Description:** When `OCR_CLOUD_FALLBACK_ENABLED=true`, `new MistralOcrService(mistralApiKey)` is created inside the `parse()` method on every failed OCR call. While the service holds no expensive state (just an API key and base URL), it means there is no opportunity to share connection state or add request-level deduplication. More importantly, the API key is read from `process.env.MISTRAL_API_KEY` at call time (line 76), not at service construction, breaking the consistent pattern of injecting configuration through the constructor.

**Recommendation:** Initialize `MistralOcrService` in the `DoclingParser` constructor when the environment variable is set, similar to how `groqApiKey` is injected into `AudioParser`. This also makes the fallback availability checkable at startup.

---

### [MEDIUM] — `resumePipelineFromStage` always re-parses the document even when retrying `embed` or `index` stage

**File:** `src/services/pipeline.ts:453`
**Category:** correctness
**Description:** When `startFromStage` is `"embed"` (index 2) or `"index"` (index 3), `resumePipelineFromStage` still runs `parserService.parse(input)` unconditionally (lines 453-460) and the chunk stage unconditionally (lines 465-468). The `startIndex <= 0` guard correctly avoids updating the parse job status for later retries, but the parsing computation still executes and costs time/Docling capacity. For a large PDF (120s parse time), retrying the embed stage would wait 120s for a parse that produces data that gets chunked and embedded again unnecessarily.

**Recommendation:** Skip the parse stage computation (not just the status update) when `startIndex > 0`. The existing parsed content is implicitly available by re-fetching from R2, but the correct approach is to cache the parse result in the database or skip re-parsing altogether when retrying downstream stages.

---

### [MEDIUM] — Video parser writes to `/tmp` without cleanup on parse-stage timeout

**File:** `src/services/parsers/video.ts:33-35`
**Category:** reliability
**Description:** The video parser writes `videoPath` and `audioPath` to `/tmp` using `writeFile`. The `finally` block at line 114-121 correctly cleans up these files when the method completes normally or throws. However, if `withTimeout()` in `pipeline.ts` rejects the Promise after the ffmpeg spawn but before the `finally` block executes (Promise cancellation in JavaScript does not run finally blocks on the timed-out promise), the temp files are orphaned. Over time with repeated timeouts, `/tmp` can fill up inside the Docker container, eventually causing `writeFile` to fail for new requests.

**Recommendation:** This is a known limitation of JS Promise cancellation. As a mitigation, add a startup temp-file sweep or use `AbortSignal` to coordinate cancellation more cleanly. At minimum, add a note to the Dockerfile that `/tmp` should be monitored, or mount a dedicated `tmpfs` volume with a size cap in `docker-compose.yml`.

---

### [LOW] — `parsers/index.ts` MIME routing does not handle subtypes or fallback — `text/html` charset variant fails

**File:** `src/services/parsers/index.ts:29`
**Category:** correctness
**Description:** MIME type matching uses `p.formats.includes(input.mimeType)` which is an exact string match. A browser upload may set `Content-Type: text/html; charset=utf-8`, which will not match `"text/html"` in the `DoclingParser.formats` array, throwing `No parser found for MIME type: text/html; charset=utf-8`. This is a realistic failure case for HTML file uploads.

**Recommendation:** Normalize MIME types by stripping parameters before routing:

```typescript
async parse(input: ParserInput): Promise<ParseResult> {
  const baseMime = input.mimeType.split(";")[0].trim()
  const parser = this.parsers.find((p) => p.formats.includes(baseMime))
  if (!parser) throw new Error(`No parser found for MIME type: ${input.mimeType}`)
  return parser.parse({ ...input, mimeType: baseMime })
}
```

---

### [LOW] — `GROQ_API_URL` env var is overloaded for two different endpoints

**File:** `src/index.ts:72`, `src/services/pipeline.ts:161`
**Category:** maintainability
**Description:** `GROQ_API_URL` defaults to `https://api.groq.com/openai/v1/audio/transcriptions` (the Whisper transcription endpoint) and is passed directly to `AudioParser` and `VideoParser`. But in `pipeline.ts` line 161, `process.env["GROQ_LLM_URL"] ?? env.GROQ_API_URL` is used for the chat completions endpoint in `addContextualPrefixes`. If `GROQ_LLM_URL` is not set, it falls back to the audio transcriptions URL for LLM chat calls, which will fail. This works only because `GROQ_LLM_URL` is presumably always set in production, but the fallback is a silent misconfiguration footgun.

**Recommendation:** Separate the two URLs in `Env`:
- `GROQ_WHISPER_URL: string` — for audio transcriptions
- `GROQ_LLM_URL: string` — for chat completions

Add both to `REQUIRED_ENV` in `index.ts` to fail fast if either is missing.

---

### [LOW] — Netdata alert `ragas_retrieval_drop` has no `crit` threshold — only `warn`

**File:** `monitoring/netdata-ragas-alerts.conf:14-19`
**Category:** reliability
**Description:** The `ragas_retrieval_drop` alert defines only `warn: $this < 0.015` with no `crit` level. A hard regression (retrieval score near zero) would only generate a warning, not a critical alert, potentially being missed or deprioritized. The `ragas_faithfulness_low` alert correctly defines both `warn` and `crit` levels.

**Recommendation:** Add a `crit` threshold:

```
crit: $this < 0.005
```

---

### [LOW] — `feedback-decay.ts` worker has no `concurrency` option set — defaults to BullMQ default (1)

**File:** `src/services/feedback-decay.ts:33`
**Category:** maintainability
**Description:** `startFeedbackDecayWorker` constructs `new Worker(DECAY_QUEUE, handler, { connection: { url: redisUrl } })` without specifying `concurrency`. BullMQ defaults to concurrency 1, which is correct for this job (a global UPDATE should not run in parallel), but the intent is not stated. Other workers in the codebase explicitly set `concurrency` (pipeline worker: 2, maintenance: 1, llm-eval: 1). The absence is a silent assumption.

**Recommendation:** Add `concurrency: 1` explicitly to document the intent and prevent accidental parallel execution if the concurrency default changes.

---

## Summary Table

| # | Severity | File | Title |
|---|---|---|---|
| 1 | CRITICAL | `src/services/evaluation/drift.ts:152,209` | Drift detection uses incompatible projection spaces — MMD scores are meaningless |
| 2 | CRITICAL | `src/services/resilience.ts:113,134` | `groqWhisperPolicy` and `doclingPolicy` circuit breakers defined but never applied |
| 3 | CRITICAL | `src/services/resilience.ts:34-35` | `RateLimitTracker` instances exported but never called — no thundering-herd protection |
| 4 | HIGH | `src/services/queue.ts:27` | Exponential backoff comment says 1/5/15 min — actual delays are 1/2/4 min |
| 5 | HIGH | `src/routes/upload.ts:204` + `mcp-remote.ts:450,552` | Pipeline jobs enqueued without `jobId` — duplicate processing possible |
| 6 | HIGH | `src/services/feedback-decay.ts:27-28` | `feedback_score` decay uses denominator `+2` but write path uses `+3` — inconsistent prior |
| 7 | HIGH | `docker-compose.yml:1-105` | 6 of 7 services have no memory limits — OOM on 4GB host will kill arbitrary process |
| 8 | HIGH | `docker-compose.yml:9-11` | `app` `depends_on` lacks `service_healthy` condition — startup race with Postgres/Redis |
| 9 | HIGH | `src/services/parsers/audio.ts:35`, `video.ts:84` | Groq Whisper fetch has no `AbortSignal.timeout()` — call can hang indefinitely |
| 10 | HIGH | `services/nli-sidecar/requirements.txt:2` | `torch` installed without CPU-only flag — pulls wrong build variant, no version pins |
| 11 | HIGH | `services/nli-sidecar/server.py:21-25` | `_load_model()` called synchronously in async lifespan — blocks event loop on startup |
| 12 | HIGH | `src/services/parsers/youtube.ts:59,73` | YouTube parser has no timeout and uses fragile HTML regex — silent failure on page changes |
| 13 | MEDIUM | `src/services/evaluation/drift.ts:120` | `ORDER BY RANDOM()` performs full table scan on embeddings column weekly |
| 14 | MEDIUM | `src/routes/maintenance.ts:32-46` | Maintenance cron jobs not deduplicated on restart — duplicate schedules accumulate |
| 15 | MEDIUM | `monitoring/ragas-metrics-collector.sh:16,23` | Shell collector outputs `SET` without `CHART` definition — metrics silently never appear in Netdata |
| 16 | MEDIUM | `src/services/evaluation/llm-eval.ts:154` | Model name hardcoded in eval result — stale if model changes |
| 17 | MEDIUM | `src/services/parsers/docling.ts:77` | Mistral OCR service instantiated on every parse call — breaks constructor injection pattern |
| 18 | MEDIUM | `src/services/pipeline.ts:453` | `resumePipelineFromStage` always re-parses even when retrying embed/index stage |
| 19 | MEDIUM | `src/services/parsers/video.ts:33-35` | Temp files in `/tmp` orphaned on pipeline stage timeout |
| 20 | LOW | `src/services/parsers/index.ts:29` | MIME exact-match routing fails for `text/html; charset=utf-8` and similar variants |
| 21 | LOW | `src/index.ts:72`, `src/services/pipeline.ts:161` | `GROQ_API_URL` overloaded for both Whisper and LLM endpoints — silent misconfiguration footgun |
| 22 | LOW | `monitoring/netdata-ragas-alerts.conf:14-19` | `ragas_retrieval_drop` alert missing `crit` threshold |
| 23 | LOW | `src/services/feedback-decay.ts:33` | Feedback decay worker concurrency not explicitly set |