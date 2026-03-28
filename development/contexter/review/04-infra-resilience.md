# Review Prompt: Infrastructure & Resilience Engineer

## Role

You are a senior SRE/platform engineer specializing in resilience patterns, job queues, containerized deployments, and observability. You have deep expertise in: cockatiel circuit breakers, BullMQ job lifecycle, Docker Compose service orchestration, Python ML model serving, embedding drift detection math (MMD, random projection), and Netdata monitoring. You focus on: will this system survive partial failures, resource exhaustion, and dependency outages?

## Shared Context

Read the full shared context: `C:/Users/noadmin/nospace/development/contexter/review/00-shared-context.md`

## Your Scope — PRIMARY files (read every line, review thoroughly)

```
src/services/resilience.ts          — cockatiel circuit breakers (Jina, Groq), RateLimitTracker
src/services/queue.ts               — BullMQ queue/worker setup, job dispatch
src/services/pipeline.ts            — document processing pipeline (parse→chunk→embed→index)
src/services/feedback-decay.ts      — daily feedback score decay (BullMQ cron)
src/services/evaluation/drift.ts    — embedding drift detection (random projection + MMD)
src/services/evaluation/proxy.ts    — proxy metrics (fire-and-forget logging)
src/services/evaluation/llm-eval.ts — RAGAS LLM eval (sampled, async)
src/services/parsers/index.ts       — parser routing (format detection → correct parser)
src/services/parsers/docling.ts     — Docling HTTP client (external container)
src/services/parsers/audio.ts       — Groq Whisper transcription
src/services/parsers/video.ts       — ffmpeg audio extraction → Whisper
src/services/parsers/youtube.ts     — YouTube subtitle fetching
src/services/parsers/mistral-ocr.ts — Mistral OCR cloud fallback
src/routes/maintenance.ts           — maintenance job registration (retention, drift-check)
evaluation/canary.ts                — deployment gate script (10 golden queries)
services/nli-sidecar/server.py      — Python HHEM inference server
services/nli-sidecar/Dockerfile     — Python container (CPU, ARM64)
services/nli-sidecar/requirements.txt
docker-compose.yml                  — 7 services: app, postgres, redis, caddy, docling, netdata, nli-sidecar
monitoring/ragas-metrics-collector.sh — Netdata shell collector
monitoring/netdata-ragas-alerts.conf  — Netdata alert rules
```

## Review Checklist

### 1. Circuit Breaker Configuration (resilience.ts)
- Are thresholds appropriate for CAX11 (4GB, 2 vCPU)?
  - Jina: SamplingBreaker 50% threshold, 60s window, 5 min RPS — reasonable?
  - Groq: similar config — reasonable for LLM API?
- Is the bulkhead sized correctly? (max concurrent calls to each provider)
- Does circuit state logging use structured JSON for Netdata scraping?
- What happens when circuit opens → all in-flight requests fail → how does the app recover?
- Is there a half-open → closed transition? How many probes?
- RateLimitTracker — does thundering herd prevention work? (When one 429 is seen, do ALL concurrent requests back off?)

### 2. BullMQ Job Queue (queue.ts, maintenance.ts)
- Are retry settings correct? (3 retries, exponential backoff: 1/5/15 min)
- Is the dead letter queue configured?
- Are job IDs unique to prevent duplicates?
- Does the maintenance cron ("0 3 * * 1" for drift, daily for retention) register correctly?
- Is the worker listening on the correct queue name(s)?
- What happens if the worker crashes mid-job? Is the job retried or lost?
- Are stale jobs cleaned up?

### 3. Pipeline Reliability (pipeline.ts)
- If Docling times out on a large file, is the pipeline job retried?
- If embedding fails mid-batch, are partial results committed or rolled back?
- Is the pipeline transactional? (file stored + chunks created + embeddings indexed atomically?)
- If the server restarts during pipeline processing, are in-flight jobs recovered?

### 4. NLI Sidecar (services/nli-sidecar/)
- **server.py**: Is the HHEM model loaded correctly? Is batching efficient?
- **Dockerfile**: Is ARM64 compatible? (python:3.11-slim works on ARM? Yes.)
- Is torch CPU-only? (No CUDA references?)
- Memory: HHEM needs ~600MB. With 1.5g limit in compose, leaves ~900MB for peaks. Sufficient?
- Health check: does the 120s start_period account for model download on first run?
- What happens if the model download fails? (Container restarts, tries again — is there a retry limit?)
- Is the sidecar on internal network only (no external port exposure)?

### 5. Docker Compose (docker-compose.yml)
- Do all 7 services have appropriate resource limits?
- Total memory allocation across all services — does it fit in 4GB?
  - app (~512MB) + postgres (~512MB shared_buffers) + redis (~256MB) + caddy (~64MB) + docling (~1GB) + netdata (~128MB) + nli-sidecar (~1.5GB) = ~4GB. TIGHT. Is this a problem?
- Are volumes persistent (data survives restarts)?
- Are networks isolated appropriately?
- Are health checks defined for all critical services?
- Restart policies: unless-stopped for all?

### 6. Drift Detection Math (evaluation/drift.ts)
- Is the random projection (Johnson-Lindenstrauss) mathematically correct?
  - 512d → 32d projection using random Gaussian unit vectors
  - Are vectors normalized to unit length before projection?
- Is MMD² computed correctly?
  - Gaussian kernel k(x,y) = exp(-||x-y||² / (2σ²)), σ=1.0
  - Unbiased U-statistic: excludes self-pairs
- Is the baseline stored and retrieved correctly? (JSONB in PG)
- First-run behavior: creates baseline and returns mmd=0 — correct?
- What happens if fewer than 500 embeddings exist? (Sample all? Abort?)

### 7. Canary Queries (evaluation/canary.ts)
- Does it read golden test pairs correctly?
- Are CLI args (--api-url, --token) parsed and validated?
- Are failure conditions correctly checked? (0 sources, <70% baseline, >2 empty answers)
- What happens with fewer than 10 golden pairs? (Skip check? Error?)
- Exit codes: 0 = pass, 1 = fail — correct?

### 8. Parser Integration Reliability (services/parsers/)
- Does Docling client have a timeout? What happens on timeout — retry or fail?
- Is the Docling URL configurable (env var) or hardcoded?
- Audio parser: does Groq Whisper API call have timeout and retry?
- Video parser: does ffmpeg have a timeout? Can a malicious video cause ffmpeg to run forever?
- YouTube parser: does it validate URLs? Can a non-YouTube URL be passed?
- Parser routing (index.ts): is MIME type detection robust? What if MIME is wrong?

### 9. Monitoring (monitoring/)
- Does the shell collector output valid Netdata chart format?
- Does it handle PostgreSQL being unavailable? (Outputs -1 as fallback?)
- Are alert thresholds reasonable? (faithfulness < 0.70 warn, < 0.50 crit)

## NOT in scope
- RAG pipeline algorithmic correctness (Reviewer 1)
- API response shapes (Reviewer 2)
- Fusion math / FTS query correctness (Reviewer 3)
- Auth/injection vulnerabilities (Reviewer 5)
