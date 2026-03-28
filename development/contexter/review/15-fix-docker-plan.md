Both Edit and Write are denied. I need to stop and explain.

The Read tool works, but both Edit and Write are denied for this session. Without file-write permissions I cannot apply any of the 21 fixes to source files.

Here is what I've done and what is needed:

**What I completed:**
- Read and fully understood every file referenced in all 21 fixes:
  - `src/services/evaluation/drift.ts` — projection matrix bug confirmed (FIX 1, 13)
  - `docker-compose.yml` — missing mem_limit, healthchecks, exposed Netdata port confirmed (FIX 2, 3, 4)
  - `src/services/parsers/audio.ts`, `video.ts`, `youtube.ts`, `docling.ts` — missing timeouts, missing circuit breaker wrapping confirmed (FIX 5, 6, 10)
  - `src/services/resilience.ts` — `doclingPolicy` and `groqWhisperPolicy` exports confirmed, ready to import (FIX 6)
  - `services/nli-sidecar/requirements.txt`, `server.py`, `Dockerfile` — unpinned deps, blocking model load, root user confirmed (FIX 7, 8, 9)
  - `src/routes/upload.ts`, `src/routes/mcp-remote.ts` — all 3 `queue.add("process", ...)` calls identified at lines 142, 204, 450, 552 (FIX 11)
  - `src/services/feedback-decay.ts` and `src/routes/feedback.ts` — denominator analysis: decay uses `+2` denominator, route write uses `+3` — inconsistency confirmed (FIX 12)
  - `src/routes/maintenance.ts` — no pre-removal of existing repeatable jobs before scheduling (FIX 14)
  - `monitoring/ragas-metrics-collector.sh` — missing CHART/BEGIN/END headers (FIX 15)
  - `src/services/pipeline.ts` — `resumePipelineFromStage` always re-parses even when `startFromStage > 0` confirmed (FIX 17)
  - `src/services/parsers/index.ts` — no charset strip on mimeType (FIX 18)
  - `monitoring/netdata-ragas-alerts.conf` — missing `crit` threshold on `ragas_retrieval_drop` (FIX 19)
  - `src/services/feedback-decay.ts` — Worker missing `concurrency: 1` (FIX 20)
  - `src/services/evaluation/llm-eval.ts` — hardcoded `"llama-3.1-8b-instant"` in `runLlmEval` return value and `startLlmEvalWorker` constructor (FIX 21)

**What is blocked:**
Both the Edit and Write tools are denied in this session. I cannot write any changes to disk.

**To unblock:** Please grant permission for the Edit tool (or Write tool) so I can apply all 21 fixes. Once permitted, I will apply them in one pass and run the build check.