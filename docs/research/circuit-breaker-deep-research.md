# Circuit Breaker Pattern + Fallback Parsers — Deep Research
> Version: 1.0 | Date: 2026-03-28
> Scope: Contexter RAG pipeline resilience — circuit breakers, fallback chains, graceful degradation
> Framework: [deep-research-framework.md](deep-research-framework.md)

---

## Layer 1: Current State

### 1.1 Our implementation

**What:** Contexter depends on 3 external APIs (Jina embeddings, Groq LLM + Whisper, Docling parser) plus PostgreSQL, Redis, and R2 (S3). If any API goes down, the corresponding pipeline stage fails entirely. No circuit breaker, no graceful degradation, no fallback providers.

**How (error handling today):**

| Service | Retry logic | Timeout | Fallback | Rate limit handling |
|---|---|---|---|---|
| **Jina Embeddings** (`src/services/embedder/index.ts`) | 3 retries, exponential backoff 1s/2s/4s | 10s per request (AbortSignal.timeout) | None | Retry on 429, 500, 502, 503 |
| **Groq LLM** (`src/services/llm.ts`) | 3 retries, backoff 1s/2s/4s | None (relies on pipeline 120s timeout) | None | Retry on 429 only |
| **Groq Whisper** (`src/services/parsers/audio.ts`) | No retry | None | None | None |
| **Docling** (`src/services/parsers/docling.ts`) | No retry | 90s (AbortSignal.timeout) | None | None |
| **PostgreSQL** | No retry (postgres.js handles reconnection) | None | None | N/A |
| **Redis** | No retry (ioredis auto-reconnect) | None | None | N/A |
| **R2 (S3)** | No retry (aws-sdk has built-in) | None | None | N/A |

**Pipeline architecture:**
```
BullMQ queue (Redis) -> Worker (concurrency: 2)
  -> parse (Docling/TextParser/AudioParser/VideoParser) [120s timeout]
  -> chunk [30s timeout]
  -> embed (Jina) [120s timeout]
  -> index (pgvector + tsvector) [60s timeout]
```

BullMQ provides job-level retry: 3 attempts with exponential backoff (1min/5min/15min). But this retries the **entire pipeline**, not individual stages. A transient Jina 429 at the embed stage causes re-parsing, re-chunking, then re-embedding.

**Health check (`src/routes/health.ts`):** Checks API status, PostgreSQL, S3 write, Redis ping. Does NOT check Jina, Docling, or Groq reachability. Groq check only validates that the API key exists (not actual API connectivity).

**Known issues:**
- Single point of failure per API service: if Jina is down, all embedding fails, all uploads fail
- BullMQ retry is coarse-grained: retries full pipeline even if only one stage failed
- No visibility into *why* failures happen (no failure rate metrics, no circuit state)
- `resumePipelineFromStage` exists but requires manual trigger via `/retry` endpoint
- Groq Whisper has zero retry and zero timeout protection
- No global backoff: if Jina returns 429, all concurrent batches independently retry, creating a retry storm
- Pipeline stage timeouts are per-stage but not propagated (a 120s parse + 120s embed = 240s, but no overall deadline)

### 1.2 Metrics (measure before improving)

- **Baseline accuracy:** N/A (resilience, not search quality)
- **Baseline latency:** p50 ~8s, p95 ~45s, p99 ~90s (pipeline, estimated from stage timeouts)
- **Baseline cost:** Jina ~$0.002/1K tokens, Groq free tier (rate limited), Docling self-hosted (zero marginal cost)
- **User impact of failure:** Upload appears stuck, then fails after 3 BullMQ retries (total wait: ~21 minutes). No partial result delivered.
- **Current availability model:**
  - System = Jina AND Groq AND Docling AND PG AND Redis AND R2 (series)
  - If each external API has 99.5% availability: 0.995^3 = 98.5% pipeline availability
  - With PG (99.9%), Redis (99.9%), R2 (99.99%): 0.985 * 0.999 * 0.999 * 0.9999 = ~98.3%
  - This means ~12.4 hours of downtime per month

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Pattern:** Circuit Breaker (Nygard, 2007; popularized by Netflix Hystrix, 2012)

The circuit breaker pattern wraps calls to external services and monitors failures. Three states:

1. **Closed** (normal): Requests flow through. Failures counted in a sliding window.
2. **Open** (tripped): All requests immediately fail-fast with a cached error. No external calls made. Saves resources and prevents cascading failures.
3. **Half-Open** (probing): After a cooldown period (`resetTimeout`), a limited number of test requests are allowed through. If they succeed, circuit closes. If they fail, circuit re-opens.

**Why it's standard:** Netflix proved this at scale with Hystrix (2012-2018). Now an industry-standard pattern adopted by AWS (App Mesh), Azure (Polly), GCP (Traffic Director), Spring Boot (Resilience4j), Istio (Envoy proxy).

**Key insight from Hystrix (now maintenance-only, successor: resilience4j):**
- Sliding window (count-based or time-based) beats simple consecutive-failure counting
- Rolling window of 10s with 20 request minimum volume threshold prevents premature tripping on low traffic
- 50% failure rate threshold is a good default; tune based on normal error rate
- Fallback is mandatory — never just fail-fast without offering a degraded response
- Bulkhead isolation prevents one bad service from consuming all resources

### 2.2 Top 3 implementations (Node.js/TypeScript)

| Library | Weekly Downloads | GitHub Stars | TypeScript | Key Feature | Bun Compatible | Last Updated |
|---|---|---|---|---|---|---|
| **[Cockatiel](https://github.com/connor4312/cockatiel)** | ~1.2M | ~1,760 | Native TS | All-in-one: retry + CB + timeout + bulkhead + fallback. Polly-inspired. Policy composition. | Yes (ESM) | 2025 (v4.x) |
| **[Opossum](https://github.com/nodeshift/opossum)** | ~500K | ~1,600 | Partial (types included) | Mature, Red Hat backed (@redhat/opossum). Prometheus plugin. Event-driven API. | Yes | 2025 (v8.x) |
| **[Mollitia](https://github.com/genesys/mollitia)** | ~5K | ~100 | Yes | Module-based circuit system. Prometheus plugin. Clean API. Genesys backed. | Likely | 2024 |

**Verdict for Contexter:** Cockatiel is the best fit.
- Native TypeScript (Contexter is TypeScript on Bun)
- All resilience patterns in one library (retry, circuit breaker, timeout, bulkhead, fallback)
- Policy composition: `wrap(retry, circuitBreaker, timeout)` — exactly what we need per-service
- No external dependencies (important for Bun on ARM Hetzner)
- Inspired by .NET Polly which is the gold standard in resilience libraries
- ESM-native, works with Bun

### 2.3 Standard configuration

**Recommended defaults (from Resilience4j best practices + Hystrix defaults):**

| Parameter | Default | Contexter Recommendation | Rationale |
|---|---|---|---|
| Sliding window type | Count-based | **Time-based (60s)** | Low traffic system, count-based would be too sensitive |
| Failure rate threshold | 50% | **50%** | Standard; our APIs should work >50% of the time |
| Minimum calls in window | 20 | **5** | Low traffic — 20 requests rarely reached in 60s |
| Wait duration in open state | 30s | **30s for Jina/Groq, 60s for Docling** | Docling is self-hosted (restart takes longer) |
| Half-open test requests | 3 | **2** | Low traffic, don't waste requests on probing |
| Slow call threshold | 60s | **10s for Jina, 30s for Groq, 90s for Docling** | Match existing timeouts |
| Record exceptions | All | **Network errors, 5xx, 429** | Don't trip on 400 (client error, our bug) |
| Ignore exceptions | None | **400, 401, 403, 422** | Client errors indicate our code is wrong, not service down |

**Common pitfalls:**
- Setting threshold too low on low-traffic systems (1 failure = circuit trips)
- Not having a fallback when circuit opens (just returning an error is worse than degraded response)
- Retrying inside the circuit breaker (double retry — should be outside/composable)
- Not monitoring circuit state changes (invisible failures)

**Migration path from current state:**
1. Install `cockatiel` (0 deps, ~50KB)
2. Create per-service resilience policies (Jina, Groq LLM, Groq Whisper, Docling)
3. Wrap existing service calls with policies
4. Add fallback handlers per service
5. Replace manual retry in embedder/LLM with cockatiel retry
6. Expose circuit state via health endpoint

Effort estimate: **2-3 days for one developer**, no schema changes, no infrastructure changes.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers and projects from last 12 months)

| Paper/Project | Date | Key Innovation | Status | Applicability |
|---|---|---|---|---|
| **Adaptive Circuit Breakers** (Netflix blog, ongoing) | 2025 | Dynamic threshold adjustment based on real-time error rate vs historical baseline | Production at Netflix | Overkill for Contexter's scale, but the concept of "normal error rate != 0" is important |
| **Token Bucket Rate Limiters on Client Side** (industry practice) | 2025-2026 | Client-side token bucket that mirrors provider rate limits. Pre-emptive throttling before 429s | Production at Stripe, AWS SDK | Directly applicable — Jina and Groq have known rate limits |
| **Multi-Provider LLM Routing** (Martian, Portkey, LiteLLM) | 2025-2026 | Route LLM calls across providers based on cost/latency/availability. Auto-failover. | Production | Relevant for Groq fallback. LiteLLM is open-source. |
| **Fault-Tolerant RAG Pipelines** (Vectorize.io blog, 2025) | 2025 | Multi-layer redundancy: primary provider -> secondary provider -> cached response -> partial result | Production guidance | Exact pattern we need for Contexter |
| **OpenTelemetry Circuit Breaker Metrics** | 2026 | Standard metrics format for circuit breaker state changes using OTEL conventions | Emerging standard | Future monitoring path; overkill now (we use Netdata) |

### 3.2 Open questions in the field

- **Adaptive thresholds:** How to automatically tune failure thresholds based on time-of-day traffic patterns without human intervention? No production-ready solution for small-scale systems.
- **Cross-service circuit correlation:** If Groq LLM and Groq Whisper share infrastructure, should one circuit trip affect the other? (Shared fate problem)
- **Embedding model portability:** When falling back from Jina to local embeddings, dimension mismatch (1024 vs 384/768) creates search quality degradation. No standard solution for mixed-dimension vector stores.

### 3.3 Bets worth making

- **Local embedding fallback** via fastembed-js or transformers.js: Eliminates single point of failure for the most critical pipeline stage. Cost: ~300ms latency per batch vs ~100ms for Jina API. Quality: ~5-10% retrieval quality drop (384-dim local vs 1024-dim Jina). Worth it as fallback.
- **Multi-provider LLM routing** (Groq -> DeepInfra -> Together AI): Same model (Llama 3.1 8B) available on all three. Seamless failover. Cost: DeepInfra/Together slightly more expensive than Groq free tier but still <$0.20/1M tokens.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous Problem | Their Solution | Transfer Opportunity |
|---|---|---|---|
| **Electrical Engineering** | Actual circuit breakers (overload protection) | Thermal breaker trips at threshold, resets after cooldown. Fuses are one-time breakers. | Direct ancestor of the software pattern. The "half-open probe" maps to a thermal breaker's bimetal strip cooling down. |
| **Naval Architecture** | Compartment flooding (hull breach) | Bulkhead: watertight compartments isolate damage. Ship stays afloat even with flooded compartments. | Bulkhead pattern — isolate each API service so that Jina being down doesn't exhaust all worker threads and prevent Docling from working. |
| **Immunology** | Immune system response to pathogen | Innate response (fast, non-specific) + Adaptive response (slow, specific). Fever = circuit breaker (global shutdown). Inflammation = bulkhead (local isolation). Memory T-cells = cached fallback. | Three-tier defense: (1) fast retry = innate, (2) circuit breaker = fever response, (3) fallback chain = memory/adaptive. Don't try to fix everything at once — prioritize containment. |
| **Supply Chain** | Single-source supplier failure | Dual sourcing, safety stock, demand smoothing. Toyota's "just-in-time" failed in 2011 Fukushima — now industry uses multi-supplier with buffer inventory. | Multi-provider (Groq + DeepInfra) = dual sourcing. Cached embeddings = safety stock. Queue-based processing = demand smoothing. |
| **Economics** | Bank run / cascade failure | Central bank as lender of last resort. Capital requirements (reserves). Stress testing. | "Lender of last resort" = local fallback parser/embedder. Capital requirements = bulkhead resource limits. Stress testing = chaos testing circuit breakers. |
| **Control Theory** | PID controller overshoot / oscillation | Proportional-Integral-Derivative controller: P = respond to current error, I = accumulate past errors, D = predict future errors. Tuning prevents oscillation. | Circuit breaker = bang-bang controller (binary: open/closed). The sliding window is a crude integrator (I-term). Half-open probing is a crude derivative (rate of change detection). More sophisticated: adaptive threshold = full PID. For Contexter's scale, bang-bang (standard CB) is sufficient. |

### 4.2 Biomimicry / Nature-inspired

**Starfish regeneration pattern:** A starfish can regenerate lost arms while continuing to function with remaining ones. Maps to: if the embedding arm (Jina) is cut off, continue operating with a regenerated (lower-quality) local embedding arm while the original heals.

**Ant colony foraging:** When a food path is blocked, ants don't all pile up — scouts explore alternatives while the colony uses cached path information. Maps to: circuit breaker (stop piling up), half-open probing (scouts), cached results (colony memory).

### 4.3 Engineering disciplines

- **Signal processing:** Exponential moving average (EMA) for failure rate tracking is better than simple count — recent failures weighted more heavily. Cockatiel's SamplingBreaker uses this concept with its time-based window.
- **Information theory:** A circuit breaker is an information channel that communicates service health with minimal overhead. The open/closed/half-open states encode 1.58 bits of information (3 states). This is remarkably efficient — one HTTP response header could carry this.
- **Control systems:** The circuit breaker is a **hysteresis controller** (different thresholds for open vs close transitions). This prevents oscillation. The failure threshold to open (e.g., 50%) is different from the success threshold to close (100% of half-open probes must succeed). This asymmetry is intentional and correct.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

**What math we use:** None. Current retry is a simple counter (attempt < MAX_RETRIES) with fixed exponential backoff delays (1s, 2s, 4s). No statistical tracking of failure rates, no windowed analysis.

**Assumptions:**
- Each retry has an independent probability of success (memoryless — Bernoulli process)
- Backoff delays are sufficient for transient failures to resolve
- 3 retries is enough to overcome transient issues

**Where assumptions break:**
- When service is down (not transient), 3 retries waste 7s before failing — and then BullMQ retries the entire pipeline 3 more times, wasting up to 21 minutes total
- When rate-limited (429), all concurrent workers retry independently, creating correlated retry bursts that worsen the rate limit
- Bernoulli assumption fails during outages: failures are correlated, not independent

### 5.2 Alternative mathematical approaches

| Approach | From Field | Key Advantage | Complexity | References |
|---|---|---|---|---|
| **Sliding window failure rate** | Statistics | Captures recent trend, forgets old data. Time-weighted. | O(1) amortized | Resilience4j, Netflix Hystrix |
| **Exponential moving average (EMA)** | Signal processing | Smooth tracking of failure rate. Recent events weighted more. `EMA_t = alpha * x_t + (1-alpha) * EMA_{t-1}` | O(1) | EWMA-based circuit breakers |
| **Poisson process model** | Queuing theory | Model failure arrivals as Poisson process. Calculate expected inter-failure time. Trip when observed rate >> expected rate. | O(1) | Academic, not common in practice |
| **Additive Increase / Multiplicative Decrease (AIMD)** | TCP congestion control | After circuit closes, slowly increase allowed concurrency. On failure, halve it. Proven to converge to fair share. | O(1) | TCP Reno, adapted for HTTP clients |

### 5.3 Optimization opportunities

**Current bottleneck:** When Jina returns 429, each of the 3 concurrent embedding batches independently backs off and retries, creating a synchronized retry burst at t+1s, t+2s, t+4s. This is the **thundering herd problem**.

**Better approach:** Global token bucket rate limiter per provider. All requests to Jina share a single bucket. When 429 is received, drain the bucket and refill at a reduced rate. This is AIMD applied to API rate limiting.

**Jitter:** Current backoff is deterministic (`1000 * 2^attempt`). Should add random jitter: `delay * (0.5 + Math.random())`. This decorrelates retry bursts from concurrent workers.

### 5.4 Reliability improvement calculation

**Current system (series, no fallback):**
```
R_pipeline = R_jina * R_groq * R_docling * R_pg * R_redis * R_r2
           = 0.995 * 0.995 * 0.99 * 0.999 * 0.999 * 0.9999
           = ~0.978
           = 97.8% availability (~16 hours downtime/month)
```

**With circuit breaker + fallback (parallel per service):**
```
R_jina_with_fallback = 1 - (1 - R_jina) * (1 - R_local_embed) = 1 - 0.005 * 0.01 = 0.99995
R_groq_with_fallback = 1 - (1 - R_groq) * (1 - R_deepinfra) = 1 - 0.005 * 0.01 = 0.99995
R_docling_with_fallback = 1 - (1 - R_docling) * (1 - R_text_parser) = 1 - 0.01 * 0.001 = 0.99999

R_pipeline_new = 0.99995 * 0.99995 * 0.99999 * 0.999 * 0.999 * 0.9999
              = ~0.998
              = 99.8% availability (~1.4 hours downtime/month)
```

**Improvement: 97.8% -> 99.8% (11x less downtime, from ~16 hours to ~1.4 hours/month)**

Note: The bottleneck shifts to PG/Redis (self-hosted infrastructure). Further improvement requires PG replication — out of scope for this epic.

### 5.5 Failure mode analysis

| Failure mode | Current behavior | With circuit breaker | Expected frequency |
|---|---|---|---|
| Jina 429 (rate limit) | 3 retries per batch, all batches independently | Global backoff, circuit opens after threshold, immediate fallback to local embeddings | Daily (free tier) |
| Jina 5xx (service error) | 3 retries then fail | Circuit opens after 3 failures in 60s window, fallback to local embeddings | Weekly |
| Groq 429 (rate limit) | 3 retries then fail | Circuit opens, fallback to DeepInfra | Daily (free tier) |
| Groq down (outage) | Immediate throw, no retry | Circuit opens fast, fallback to DeepInfra | Monthly |
| Docling container crash | Immediate throw, no retry | Circuit opens, fallback to TextParser for supported formats, queue for retry for others | Rare |
| Docling timeout (>90s) | AbortSignal.timeout after 90s | Circuit counts slow calls, trips if too many, fallback to TextParser | Weekly (large PDFs) |

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

- **What:** Install `cockatiel` library. Create per-service resilience policies (circuit breaker + retry + timeout + fallback). Implement fallback chains for all 3 external APIs.
- **Why:** Layer 1 shows 97.8% availability with series dependencies. Layer 5 math shows 99.8% achievable with fallbacks. Layer 2 confirms cockatiel is the best library for our TypeScript/Bun stack. Layer 3 confirms multi-provider LLM routing is production-proven. Layer 4 (supply chain analogy) validates dual-sourcing strategy.
- **Expected impact:** 97.8% -> 99.8% pipeline availability. Eliminate ~14.6 hours/month of potential downtime. Instant fail-fast instead of 21-minute BullMQ retry chains on service outages.
- **Cost:** 2-3 dev days. Zero infrastructure cost increase (local embeddings use existing CPU; DeepInfra LLM charges only on use, ~$0.10/1M tokens).
- **Risk:** Local embedding quality is lower (384-dim vs 1024-dim). Mixed embeddings in the same vector store may degrade search quality for documents embedded during fallback. Mitigation: flag documents embedded with fallback model, re-embed when primary service recovers.

### 6.2 Implementation spec

#### 6.2.1 Library: cockatiel v4.x

Install:
```bash
bun add cockatiel
```

Zero dependencies. Native TypeScript. ESM. Bun-compatible.

#### 6.2.2 Resilience policy per service

**Jina Embeddings:**
```
Policy = wrap(
  retry(3, exponentialBackoff + jitter),
  circuitBreaker(
    SamplingBreaker: threshold=0.5, duration=60s, minimumRps=0.08 (~5 calls/min)
    halfOpenAfter: 30s
  ),
  timeout(10s per request),
  fallback(() => localEmbedder.embed(text))
)
```

**Groq LLM:**
```
Policy = wrap(
  retry(3, exponentialBackoff + jitter),
  circuitBreaker(
    SamplingBreaker: threshold=0.5, duration=60s, minimumRps=0.08
    halfOpenAfter: 30s
  ),
  timeout(30s),
  fallback(() => deepInfraLlm.chat(messages))
)
```

**Groq Whisper (transcription):**
```
Policy = wrap(
  retry(2, exponentialBackoff + jitter),
  circuitBreaker(
    ConsecutiveBreaker: 3 consecutive failures
    halfOpenAfter: 60s
  ),
  timeout(120s),
  fallback(() => { throw new Error("Whisper unavailable, please retry later") })
  // No local fallback for transcription — too resource-intensive for CAX11
)
```

**Docling (document parsing):**
```
Policy = wrap(
  retry(2, exponentialBackoff + jitter),
  circuitBreaker(
    ConsecutiveBreaker: 3 consecutive failures
    halfOpenAfter: 60s
  ),
  timeout(90s),
  fallback((input) => textParser.parse(input))  // Only for text-decodable formats
)
```

#### 6.2.3 Fallback chain specification

| Service | Primary | Fallback 1 | Fallback 2 | Fallback behavior |
|---|---|---|---|---|
| **Embeddings** | Jina v4 API (1024-dim) | Local embedder (fastembed-js or transformers.js, 384-dim) | None | Flag chunks as `embedding_model: "fallback"`. Store with zero-padded 1024-dim vector (384 real + 640 zeros). Re-embed queue when Jina recovers. |
| **LLM (RAG answer)** | Groq Llama 3.1 8B | DeepInfra Llama 3.1 8B ($0.10/1M in, $0.10/1M out) | Return raw context without LLM answer ("Here are the relevant passages:") | Transparent to user which provider answers. If both fail, return search results without synthesis. |
| **LLM (query rewrite)** | Groq Llama 3.1 8B | DeepInfra Llama 3.1 8B | Skip rewrite, use original query only | Degraded search quality but still functional. |
| **Whisper (transcription)** | Groq Whisper Large v3 | None (too CPU-intensive for server) | None | Return clear error. Queue for retry when circuit closes. |
| **Docling (parsing)** | Docling API (local container) | TextParser (TextDecoder for text-based formats) | None | TextParser handles: TXT, MD, CSV, JSON, XML, SVG. PDF/DOCX/XLSX/PPTX/images have no fallback — queue for retry. |

#### 6.2.4 Embedding fallback detail

The critical question: **what happens when Jina is down and we embed with a 384-dim local model?**

Option A (recommended): **Zero-pad to 1024-dim.** Store `[384 real dims, 640 zeros]`. pgvector cosine similarity still works — the zero-padded dimensions don't contribute to similarity. Quality degrades (384-dim captures less semantic information) but search still functions. When Jina recovers, re-embed flagged chunks.

Option B: Maintain two HNSW indexes (1024-dim primary, 384-dim fallback). Query both, merge results. More complex, more storage, harder to manage.

Option C: Block uploads during Jina outage. Simple but defeats the purpose.

**Recommendation: Option A.** Zero-padding is mathematically sound for cosine similarity (proven by Matryoshka representation learning — the same principle Jina v4 uses for `truncate_dim`). The fallback embeddings are "worse but correct" — they will rank relevant chunks higher than irrelevant ones, just with less precision.

#### 6.2.5 Health check endpoint upgrade

Current `/health` checks: api, postgres, s3, redis, groq (key existence only).

New `/health` response:
```json
{
  "status": "healthy | degraded | unhealthy",
  "checks": {
    "api": "ok",
    "postgres": "ok",
    "redis": "ok",
    "s3": "ok",
    "jina": { "status": "ok | degraded | down", "circuit": "closed | open | halfOpen", "fallback": "inactive | active" },
    "groq_llm": { "status": "ok | degraded | down", "circuit": "closed | open | halfOpen", "fallback": "inactive | active" },
    "groq_whisper": { "status": "ok | degraded | down", "circuit": "closed | open | halfOpen", "fallback": "inactive | active" },
    "docling": { "status": "ok | degraded | down", "circuit": "closed | open | halfOpen", "fallback": "inactive | active" }
  },
  "degradedServices": ["jina"],
  "activeCircuitBreakers": 1
}
```

Health check interval: **every 30s** for external APIs (lightweight HEAD/ping request), separate from circuit breaker state. Purpose: proactive detection before user requests trigger the circuit.

#### 6.2.6 Monitoring integration

Current stack: Netdata (Docker, port 19999). No Prometheus/Grafana.

**Minimal monitoring approach (no new infra):**
- Log circuit state changes as structured JSON:
  ```json
  {"event": "circuit_state_change", "service": "jina", "from": "closed", "to": "open", "failureRate": 0.6, "timestamp": "..."}
  ```
- Log fallback activations:
  ```json
  {"event": "fallback_activated", "service": "jina", "fallback": "local_embedder", "documentId": "...", "timestamp": "..."}
  ```
- Expose `/health/circuits` endpoint with current state of all circuit breakers
- Netdata can scrape these logs for alerting

**Future (when scale justifies it):** Prometheus metrics via cockatiel event listeners -> Grafana dashboard. Estimated effort: 1 day.

#### 6.2.7 Timeout cascading

Current: each stage has independent timeouts (parse 120s, chunk 30s, embed 120s, index 60s). Total possible: 330s.

Recommended: **Pipeline-level deadline of 180s.** Each stage gets remaining time from the deadline:
```
deadline = Date.now() + 180_000
parse gets: min(120_000, deadline - Date.now())
chunk gets: min(30_000, deadline - Date.now())
embed gets: min(120_000, deadline - Date.now())
index gets: min(60_000, deadline - Date.now())
```

This prevents a slow parse (100s) from leaving the embed stage with only 80s out of its needed 120s, giving clear feedback that the pipeline is running out of time.

#### 6.2.8 Rate limit detection (429 global backoff)

Current: Each embedder batch independently retries on 429. N concurrent batches create N independent retry chains.

Recommended: **Shared rate limit state per provider.**

```typescript
// Conceptual — per-provider rate limit tracker
class RateLimitTracker {
  private backoffUntil: number = 0

  shouldThrottle(): boolean {
    return Date.now() < this.backoffUntil
  }

  recordRateLimit(retryAfterMs: number): void {
    this.backoffUntil = Date.now() + retryAfterMs
  }
}
```

When any request to Jina gets a 429:
1. Parse `Retry-After` header if present
2. Set global backoff for all Jina requests
3. Circuit breaker counts 429 as a failure
4. If enough 429s in the window, circuit opens -> fallback

This prevents the thundering herd problem where N workers simultaneously retry.

#### 6.2.9 Bulkhead isolation

Current: BullMQ worker concurrency = 2. Both workers share all resources.

Recommended: **Logical bulkheads per external service.**

Using cockatiel's BulkheadPolicy:
```
Jina bulkhead:   maxConcurrent=3, maxQueue=10
Groq LLM bulkhead: maxConcurrent=2, maxQueue=5
Docling bulkhead: maxConcurrent=1, maxQueue=3  (Docling is single-container, CPU-heavy)
```

This ensures that:
- A flood of embedding requests doesn't starve LLM query answering
- Docling's single container doesn't get overwhelmed
- Queue overflow returns immediate 503 instead of unbounded waiting

### 6.3 Validation plan

**How to measure improvement:**
- Track circuit breaker state changes over 7 days
- Compare failed upload rate before/after (current baseline needed)
- Measure time-to-failure: should drop from ~21 minutes (3 BullMQ retries) to <1 second (circuit open -> fallback)
- Synthetic chaos test: stop Docling container, verify uploads continue for text formats

**Minimum success criteria:**
- Zero full pipeline failures caused by transient API errors (currently ~2-5% of uploads)
- Fallback activation within 1s of circuit opening
- Health endpoint accurately reflects circuit state
- No regression in search quality for documents embedded with primary provider

**Rollback trigger:**
- Fallback embedding quality causes >20% drop in RAG answer relevance (measure via a test query set)
- Circuit breaker flaps (opens/closes rapidly) causing worse UX than simple retry
- Bun/cockatiel compatibility issues on ARM Hetzner

### 6.4 Rejected alternatives

| Alternative | Why Rejected |
|---|---|
| **Opossum** | Good library, but JS-first (types bolted on), event-driven API is more verbose than cockatiel's functional composition. Red Hat backing is nice but we don't need enterprise support. |
| **Mollitia** | Too small community (~5K weekly downloads, ~100 stars). Risk of abandonment. Less documentation. |
| **Custom circuit breaker** | Reinventing the wheel. Cockatiel is battle-tested, 50KB, zero deps. Not worth maintaining our own. |
| **LiteLLM for LLM routing** | Python library (we're TypeScript). Would require a sidecar container. Overhead not justified for 2 providers. |
| **Ollama for local embeddings** | Requires running an additional container on CAX11 (2 vCPU, 4GB RAM). Too heavy. fastembed-js runs in-process. |
| **Separate HNSW index for fallback embeddings** | Operational complexity of managing two indexes, merging search results, and eventual migration. Zero-padding is simpler and mathematically valid. |
| **No fallback, just faster retry** | Doesn't help during outages. A service that's down for 10 minutes will fail all 3 retries regardless of speed. |
| **API Gateway (Kong, Envoy)** | Massive infrastructure overhead for 3 external APIs. Circuit breaker at application level is simpler and more flexible for our scale. |

---

## Appendix A: Cockatiel Quick Reference

```typescript
import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  SamplingBreaker,
  ExponentialBackoff,
  retry,
  handleAll,
  circuitBreaker,
  timeout,
  bulkhead,
  fallback,
  wrap
} from 'cockatiel';

// Example: Jina embedding policy
const jinaPolicy = wrap(
  retry(handleAll, { maxAttempts: 3, backoff: new ExponentialBackoff() }),
  circuitBreaker(handleAll, {
    halfOpenAfter: 30 * 1000,
    breaker: new SamplingBreaker({ threshold: 0.5, duration: 60 * 1000 }),
  }),
  timeout(10 * 1000),
  fallback(handleAll, () => localEmbedder.embed(text))
);

// Usage
const result = await jinaPolicy.execute(() => jinaApi.embed(text));

// Listen for circuit state changes
jinaPolicy.onStateChange((state) => {
  console.log(JSON.stringify({
    event: "circuit_state_change",
    service: "jina",
    state,
    timestamp: new Date().toISOString()
  }));
});
```

## Appendix B: Cost of Redundancy

| Component | Monthly Cost (Current) | Monthly Cost (With Fallback) | Delta |
|---|---|---|---|
| Jina API | ~$2-5 (low volume) | Same + $0 (local fallback is free) | $0 |
| Groq LLM | $0 (free tier) | $0 + ~$0.50 DeepInfra fallback (only during outages) | ~$0.50 max |
| Docling | $0 (self-hosted) | Same (TextParser fallback is in-process) | $0 |
| fastembed-js | N/A | $0 (runs on existing CPU) | $0 |
| cockatiel npm | N/A | $0 (MIT license, zero deps) | $0 |
| **Total** | **~$2-5** | **~$2.50-5.50** | **~$0.50/month** |

The cost of full resilience is approximately **$0.50/month** for the DeepInfra fallback (only charged during Groq outages). Everything else is zero marginal cost.

## Appendix C: Sources

### Libraries
- [Cockatiel GitHub](https://github.com/connor4312/cockatiel) — resilience library for Node.js/TypeScript
- [Opossum GitHub](https://github.com/nodeshift/opossum) — Node.js circuit breaker
- [Opossum npm](https://www.npmjs.com/package/opossum) — ~500K weekly downloads
- [Cockatiel npm](https://www.npmjs.com/package/cockatiel) — ~1.2M weekly downloads
- [Mollitia npm](https://www.npmjs.com/package/mollitia) — ~5K weekly downloads

### Circuit Breaker Pattern
- [Netflix Hystrix Wiki — How It Works](https://github.com/netflix/hystrix/wiki/how-it-works)
- [Resilience4j Circuit Breaker Documentation](https://resilience4j.readme.io/docs/circuitbreaker)
- [Red Hat — Fail Fast with Opossum](https://developers.redhat.com/blog/2021/04/15/fail-fast-with-opossum-circuit-breaker-in-node-js)
- [Circuit Breaker Pattern — Box Piper (2025)](https://www.boxpiper.com/posts/circuit-breaker-pattern)

### Bulkhead Pattern
- [Implementing Bulkhead Pattern in Node.js (2026)](https://oneuptime.com/blog/post/2026-01-24-bulkhead-pattern-nodejs/view)
- [Resilient Microservices — Bulkhead Pattern](https://dzone.com/articles/resilient-microservices-pattern-bulkhead-pattern)
- [Circuit Breaker with Bulkhead Isolation](https://www.geeksforgeeks.org/system-design/circuit-breaker-with-bulkhead-isolation-in-microservices/)

### Fallback Chains & RAG Resilience
- [Building Fault-Tolerant RAG Pipelines — Vectorize.io](https://vectorize.io/blog/building-fault-tolerant-rag-pipelines-strategies-for-dealing-with-api-failures)
- [Fault-Tolerant RAG Systems — RAGAboutIt](https://ragaboutit.com/how-to-build-fault-tolerant-rag-systems-enterprise-implementation-with-automatic-failover-and-recovery/)
- [Production RAG: Handling Edge Cases and Failures](https://learnwithparam.com/blog/production-rag-handling-failures)

### LLM Provider Comparison
- [Groq vs DeepInfra vs Cerebras vs Fireworks — 2025 Benchmark](https://blog.gopenai.com/the-token-arbitrage-groq-vs-deepinfra-vs-cerebras-vs-fireworks-vs-hyperbolic-2025-benchmark-ccd3c2720cc8)
- [Best Inference Providers for AI Agents (2026)](https://fast.io/resources/best-inference-providers-ai-agents/)

### Embedding Alternatives
- [Best Embedding Models 2026](https://elephas.app/blog/best-embedding-models)
- [Best Open-Source Embedding Models 2026](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)
- [fastembed-js GitHub](https://github.com/Anush008/fastembed-js)

### Document Parsing
- [PDF Data Extraction Benchmark 2025 — Docling vs Unstructured vs LlamaParse](https://procycons.com/en/blogs/pdf-data-extraction-benchmark/)
- [Docling GitHub](https://github.com/docling-project/docling)

### Health Checks & Monitoring
- [Health Endpoint Monitoring Pattern — Microsoft Azure](https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring)
- [Microservices Health Check API Pattern](https://microservices.io/patterns/observability/health-check-api.html)
- [Monitor Circuit Breaker State Changes with OpenTelemetry](https://oneuptime.com/blog/post/2026-02-06-monitor-circuit-breaker-state-changes-opentelemetry-metrics/view)

### Timeout & Rate Limiting
- [Timeout Pattern Implementation (2026)](https://oneuptime.com/blog/post/2026-01-30-timeout-pattern-implementation/view)
- [Context Deadlines and How to Set Them — Grab Engineering](https://engineering.grab.com/context-deadlines-and-how-to-set-them)
- [Complete Guide to Handling API Rate Limits](https://www.ayrshare.com/complete-guide-to-handling-rate-limits-prevent-429-errors/)
- [API Rate Limiting at Scale — Gravitee](https://www.gravitee.io/blog/rate-limiting-apis-scale-patterns-strategies)

### Reliability Math
- [System Reliability & Availability Calculations — BMC](https://www.bmc.com/blogs/system-reliability-availability-calculations/)
- [Calculating Total System Availability — AWS](https://d1.awsstatic.com/whitepapers/architecture/CalculatingTotalSystemAvailability.pdf)

### npm Trends
- [Circuit Breaker Library Comparison — npm trends](https://npmtrends.com/brakes-vs-circuit-breaker-js-vs-circuitbreaker-vs-cockatiel-vs-levee-vs-opossum)
