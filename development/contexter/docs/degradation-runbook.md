# Contexter — Degradation Runbook

> What happens when each dependency fails. Based on code review (2026-03-30).

---

## Summary

| Dependency | Impact | Circuit Breaker | Fallback | User sees |
|---|---|---|---|---|
| **Groq LLM** | Query answers | ✅ Active | NIM (configured) → DeepInfra (NOT configured) | Slower answers via NIM, or raw context passthrough |
| **Jina Embeddings** | Query + Upload | ❌ NOT wired (TODO) | None | 500 error on query and upload |
| **Docling** | PDF/DOCX/XLSX upload | ❌ NOT wired (TODO) | None | Pipeline "error" status. TXT/MD/audio still work |
| **Groq Whisper** | Audio/Video upload | ❌ NOT wired (TODO) | None | Pipeline "error" for audio/video. Other formats work |
| **Redis** | Rate limits + Job queue | N/A | Rate limits fail-open | No rate limiting. Uploads won't queue (BullMQ dead) |
| **PostgreSQL** | Everything | N/A | None | Complete outage — /health returns unhealthy |
| **R2 (Cloudflare)** | File storage | N/A | None | Upload fails. Query still works (chunks already in PG) |

---

## Scenario 1: Groq LLM down (429 or 5xx)

**What happens:**
1. `groqLlmPolicy` catches error (retry 3x with exponential backoff)
2. If still failing → circuit breaker opens after 50% failure rate in 60s window
3. Fallback to NIM (NVIDIA) — configured, tested
4. If NIM also fails → chain exhausted → **context passthrough** (raw retrieved text without LLM synthesis)
5. Circuit half-opens after 30s, probes Groq again

**User experience:** Query works but answer is either slower (NIM ~2-4s vs Groq ~1-3s) or shows raw passages instead of synthesized answer.

**Gap:** DeepInfra not configured (no DEEPINFRA_API_KEY in .env). Chain is effectively Groq → NIM → passthrough.

**Fix needed:** Add DEEPINFRA_API_KEY to server .env for 3-tier chain.

---

## Scenario 2: Jina Embeddings down

**What happens:**
1. ❌ No circuit breaker wired — `jinaPolicy` exists but is unused
2. Embed call fails with network error or 5xx
3. **Query:** embedding step throws → 500 error to user
4. **Upload:** pipeline embed stage fails → document status "error", chunks not indexed

**User experience:** Complete failure for both query and upload. All operations require Jina.

**Gap:** CRITICAL — Jina is a single point of failure with no retry, no circuit breaker, no fallback. If Jina has a 30-minute outage, ALL queries and uploads fail for 30 minutes.

**Fix needed:**
1. Wire `jinaPolicy` into embedder (retry 3x + circuit breaker + bulkhead)
2. Consider embedding cache (CachedEmbedderService exists — verify it's active for queries)
3. Long-term: fallback embedding model (local or alternative API)

---

## Scenario 3: Docling down (container crash/OOM)

**What happens:**
1. ❌ No circuit breaker wired — `doclingPolicy` exists but is unused
2. HTTP connection to Docling container refused or timeout
3. Pipeline parse stage fails → document status "error"
4. Only affects: PDF, DOCX, XLSX, PPTX, ODS, HTML, images
5. **Not affected:** TXT, MD, CSV, JSON (use TextParser directly), audio, video

**User experience:** "Document processing failed" for rich formats. Plain text uploads still work.

**Current risk:** Docling at 99.2% RAM (1280MB limit). OOM kill is likely under load.

**Fix needed:**
1. Wire `doclingPolicy` into DoclingParser (retry 2x + circuit breaker + bulkhead)
2. Netdata OOM alert already configured (will notify via Telegram)
3. Consider: auto-restart Docling container on OOM (Docker `restart: unless-stopped` handles this)

---

## Scenario 4: Redis down

**What happens:**
1. Rate limits **fail-open** — all requests allowed without throttling
2. BullMQ queue dies — new uploads cannot be enqueued
3. Existing pipeline jobs in progress may crash mid-execution
4. Embedding cache (CachedEmbedderService) unavailable — every embed call hits Jina API
5. /health reports `redis: error`

**User experience:** Queries work (no Redis dependency in query path except rate limits). Uploads fail silently (queue can't accept jobs).

**Gap:** Upload route doesn't check if Redis/BullMQ is healthy before accepting the upload. User gets 200 on upload but document stays "pending" forever.

**Fix needed:** Check Redis health before accepting upload. Return 503 if queue is down.

---

## Scenario 5: PostgreSQL down

**What happens:** Complete outage. Every API call that touches DB returns 500. /health returns unhealthy. Telegram alert fires within 5 minutes.

**Recovery:** Docker `restart: unless-stopped` auto-restarts. If data corruption → `bash ops/rollback.sh --db`.

---

## Scenario 6: R2 (Cloudflare) down

**What happens:**
1. Upload: presigned URL generation fails → user can't upload
2. Query: unaffected (chunks/embeddings already in PG, R2 only stores original files)
3. Document viewer: "content" endpoint may fail if it reads from R2

**User experience:** Can't upload new documents. Existing queries work.

---

## Priority fixes (from this review)

| Priority | Fix | Effort |
|---|---|---|
| **P1** | Add DEEPINFRA_API_KEY to server .env | 5 min |
| **P2** | Wire `jinaPolicy` into EmbedderService | 30 min |
| **P3** | Wire `doclingPolicy` into DoclingParser | 30 min |
| **P4** | Wire `groqWhisperPolicy` into AudioParser/VideoParser | 30 min |
| **P5** | Upload route: check Redis/queue health before accepting | 15 min |
| **P6** | Register /health/circuits endpoint | 15 min |
