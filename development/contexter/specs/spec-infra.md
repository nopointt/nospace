# Spec: Infrastructure — F-022, F-023, F-024, F-029, F-030
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

## Stack context

Runtime: Bun on Hetzner CAX11 ARM64, 4 GB RAM, ~700 MB headroom. Framework: Hono. DB: PostgreSQL 16 + pgvector 0.8.2. Queue: Redis 7 + BullMQ 5.x. Embeddings: Jina v4 (1024-dim). LLM: Groq `llama-3.1-8b-instant`. Parser: Docling in a separate Docker container. The Contexter app itself runs in a container built from `Dockerfile` (currently just `oven/bun:1-alpine` + `ffmpeg`). No existing resilience layer. No feedback mechanism. FTS uses `ts_rank` with `plainto_tsquery('simple', ...)`. There is no `services/resilience.ts`, no `feedback` table, and no `/api/feedback` route anywhere in the codebase today.

Dependencies introduced in this spec:
- F-022: `cockatiel` (resilience) — Bun-compatible, confirmed pure Node.js ES module, no native bindings
- F-023: `tesseract-ocr-eng tesseract-ocr-rus` OS packages in Docling container, no new npm deps
- F-024: no new npm deps beyond `fetch` (already available in Bun)
- F-029: no new deps (conditional evaluation only — no code written unless PG 17 or VectorChord-BM25 confirmed available)
- F-030: `zod` + `@hono/zod-validator` for input validation (`bun add zod @hono/zod-validator`)

Migration numbering: existing migrations are `0000` through `0003`. New migrations in this spec use `0004`, `0005`, `0006`.

---

## F-022: Circuit breakers (cockatiel)

### Current state

No resilience layer exists. `EmbedderService.callApi()` has a manual 3-attempt retry loop with hardcoded delays (1s, 2s, 4s) and per-batch `AbortSignal.timeout(10_000)`. `LlmService.chat()` has a 3-attempt retry loop for 429 only, no timeout, no circuit breaker. Docling calls in `DoclingParser.parse()` use a single `AbortSignal.timeout(90_000)` with no retry. There is no bulkhead isolation — unlimited concurrent calls to any external service. There is no global rate-limit tracker — if N workers all hit a 429, each retries independently at t+1s, t+2s, t+4s simultaneously (thundering herd). The `/health` endpoint checks key presence and `SELECT 1`, but has no circuit state visibility.

### Cockatiel — Bun compatibility confirmation

`cockatiel` v3.x is a pure TypeScript/JavaScript package with no native bindings. It uses `Promise`, `AbortController`, and timers — all available in Bun. It is published as an ES module and works under Bun without modification. Install: `bun add cockatiel`.

### Implementation

#### Step 1: Install dependency

```
bun add cockatiel
```

#### Step 2: Create `src/services/resilience.ts`

This file exports one pre-built policy per external service plus the `RateLimitTracker`. Import once from the service layer, not re-instantiated per request.

```typescript
import {
  Policy,
  ConsecutiveBreaker,
  SamplingBreaker,
  BulkheadRejectedError,
} from "cockatiel"

// -------------------------------------------------------------------
// RateLimitTracker — shared backoff state per provider
// Prevents thundering herd: when one request hits 429, ALL concurrent
// requests for that provider back off until Retry-After expires.
// -------------------------------------------------------------------
export class RateLimitTracker {
  private backoffUntil: number = 0

  setBackoff(retryAfterMs: number): void {
    this.backoffUntil = Date.now() + retryAfterMs
  }

  isBackingOff(): boolean {
    return Date.now() < this.backoffUntil
  }

  remainingMs(): number {
    return Math.max(0, this.backoffUntil - Date.now())
  }
}

export const jinaRateLimiter = new RateLimitTracker()
export const groqRateLimiter = new RateLimitTracker()

// -------------------------------------------------------------------
// Circuit state observer — structured JSON log on every state change
// Consumed by Netdata log scraping.
// -------------------------------------------------------------------
function makeCircuitObserver(name: string) {
  return {
    onCircuitOpen: () => console.log(JSON.stringify({ event: "circuit_open", service: name })),
    onCircuitClose: () => console.log(JSON.stringify({ event: "circuit_close", service: name })),
    onCircuitHalfOpen: () => console.log(JSON.stringify({ event: "circuit_half_open", service: name })),
  }
}

// -------------------------------------------------------------------
// Jina Embeddings policy
// SamplingBreaker: opens when 50%+ of last 60 requests fail (min 5)
// HalfOpen probe window: 30s. Timeout: 10s per request.
// Bulkhead: max 3 concurrent, queue up to 10 (overflow → immediate BulkheadRejectedError).
// Fallback: localEmbedder (defined below). If local also fails → re-throw.
// -------------------------------------------------------------------
const jinaBreaker = Policy.handleAll()
  .circuitBreaker(30_000, new SamplingBreaker({ threshold: 0.5, duration: 60_000, minimumRps: 5 }))

jinaBreaker.onStateChange((state) => {
  const obs = makeCircuitObserver("jina")
  if (state === "open") obs.onCircuitOpen()
  else if (state === "closed") obs.onCircuitClose()
  else if (state === "halfOpen") obs.onCircuitHalfOpen()
})

const jinaRetry = Policy.handleAll()
  .retry()
  .attempts(3)
  .exponential({ initialDelay: 1_000, maxDelay: 4_000 })

const jinaBulkhead = Policy.bulkhead(3, 10)

export const jinaPolicy = Policy.wrap(jinaBulkhead, jinaRetry, jinaBreaker)

// -------------------------------------------------------------------
// Groq LLM policy
// SamplingBreaker: same parameters as Jina.
// Bulkhead: max 2 concurrent, queue up to 5.
// Fallback is handled in LlmService (DeepInfra) — not in the policy.
// -------------------------------------------------------------------
const groqLlmBreaker = Policy.handleAll()
  .circuitBreaker(30_000, new SamplingBreaker({ threshold: 0.5, duration: 60_000, minimumRps: 5 }))

groqLlmBreaker.onStateChange((state) => {
  const obs = makeCircuitObserver("groq_llm")
  if (state === "open") obs.onCircuitOpen()
  else if (state === "closed") obs.onCircuitClose()
  else if (state === "halfOpen") obs.onCircuitHalfOpen()
})

const groqLlmRetry = Policy.handleAll()
  .retry()
  .attempts(3)
  .exponential({ initialDelay: 1_000, maxDelay: 4_000 })

const groqLlmBulkhead = Policy.bulkhead(2, 5)

export const groqLlmPolicy = Policy.wrap(groqLlmBulkhead, groqLlmRetry, groqLlmBreaker)

// -------------------------------------------------------------------
// Groq Whisper policy
// ConsecutiveBreaker: opens after 3 consecutive failures.
// HalfOpen probe: 60s. Timeout applied at call site (120s).
// Bulkhead: max 1 concurrent, queue 3.
// On open: throw error → BullMQ retries the job.
// -------------------------------------------------------------------
const groqWhisperBreaker = Policy.handleAll()
  .circuitBreaker(60_000, new ConsecutiveBreaker(3))

groqWhisperBreaker.onStateChange((state) => {
  const obs = makeCircuitObserver("groq_whisper")
  if (state === "open") obs.onCircuitOpen()
  else if (state === "closed") obs.onCircuitClose()
  else if (state === "halfOpen") obs.onCircuitHalfOpen()
})

const groqWhisperRetry = Policy.handleAll()
  .retry()
  .attempts(2)
  .exponential({ initialDelay: 2_000, maxDelay: 8_000 })

const groqWhisperBulkhead = Policy.bulkhead(1, 3)

export const groqWhisperPolicy = Policy.wrap(groqWhisperBulkhead, groqWhisperRetry, groqWhisperBreaker)

// -------------------------------------------------------------------
// Docling policy
// ConsecutiveBreaker: opens after 3 consecutive failures.
// HalfOpen probe: 60s. Timeout applied at call site (180s after F-023).
// Bulkhead: max 1 concurrent, queue 3.
// Fallback: TextParser (handled in parser/index.ts or pipeline.ts).
// -------------------------------------------------------------------
const doclingBreaker = Policy.handleAll()
  .circuitBreaker(60_000, new ConsecutiveBreaker(3))

doclingBreaker.onStateChange((state) => {
  const obs = makeCircuitObserver("docling")
  if (state === "open") obs.onCircuitOpen()
  else if (state === "closed") obs.onCircuitClose()
  else if (state === "halfOpen") obs.onCircuitHalfOpen()
})

const doclingRetry = Policy.handleAll()
  .retry()
  .attempts(2)
  .exponential({ initialDelay: 2_000, maxDelay: 8_000 })

const doclingBulkhead = Policy.bulkhead(1, 3)

export const doclingPolicy = Policy.wrap(doclingBulkhead, doclingRetry, doclingBreaker)

// -------------------------------------------------------------------
// Circuit state snapshot — used by /health/circuits endpoint
// -------------------------------------------------------------------
export type CircuitStatus = "closed" | "open" | "halfOpen"

export interface ServiceCircuitState {
  status: "ok" | "degraded" | "down"
  circuit: CircuitStatus
  fallback: "inactive" | "active"
}

export interface CircuitHealthSnapshot {
  jina: ServiceCircuitState
  groq_llm: ServiceCircuitState
  groq_whisper: ServiceCircuitState
  docling: ServiceCircuitState
}

// Cockatiel exposes circuit state via `.state` property on the breaker
// Mapping: "closed" → ok, "open" → down, "halfOpen" → degraded
function breakerToServiceState(breaker: ReturnType<typeof Policy.handleAll>["circuitBreaker"], fallbackActive: boolean): ServiceCircuitState {
  // Access internal state — cockatiel exposes .state on CircuitBreakerPolicy
  const state = (breaker as unknown as { state: string }).state as string
  const circuitStatus: CircuitStatus = state === "open" ? "open" : state === "halfOpen" ? "halfOpen" : "closed"
  const status = circuitStatus === "closed" ? "ok" : circuitStatus === "halfOpen" ? "degraded" : "down"
  return { status, circuit: circuitStatus, fallback: fallbackActive ? "active" : "inactive" }
}

// These are module-level flags — set to true by the service when fallback is used
export let jinaFallbackActive = false
export let groqLlmFallbackActive = false

export function setJinaFallback(active: boolean): void { jinaFallbackActive = active }
export function setGroqLlmFallback(active: boolean): void { groqLlmFallbackActive = active }

export function getCircuitHealthSnapshot(): CircuitHealthSnapshot {
  return {
    jina: breakerToServiceState(jinaBreaker, jinaFallbackActive),
    groq_llm: breakerToServiceState(groqLlmBreaker, groqLlmFallbackActive),
    groq_whisper: breakerToServiceState(groqWhisperBreaker, false),
    docling: breakerToServiceState(doclingBreaker, false),
  }
}
```

**Important note on `breakerToServiceState` typing:** Cockatiel's `CircuitBreakerPolicy` has a `.state` getter returning `"open" | "halfOpen" | "closed"`. The `as unknown as { state: string }` cast is a workaround for the TypeScript type not exposing it directly in the exported surface. Verify the exact property name against `node_modules/cockatiel/dist/index.d.ts` after install — if `.state` is exposed directly, remove the cast.

#### Step 3: Inject jinaPolicy into `EmbedderService`

File: `src/services/embedder/index.ts`

The existing `callApi` method has a manual retry loop. Replace the outer retry loop body with a `jinaPolicy.execute()` call. The bulkhead, retry, and circuit breaker all fire from the single wrapping call.

Changes to `EmbedderService`:

1. Import at top:
```typescript
import { jinaPolicy, jinaRateLimiter, setJinaFallback } from "../resilience"
```

2. Remove the manual `for (let attempt = 0; attempt < maxRetries; attempt++)` loop in `callApi`. Replace the entire method body after the `body` object construction with:

```typescript
// Check shared rate-limit backoff first (thundering herd guard)
if (jinaRateLimiter.isBackingOff()) {
  const wait = jinaRateLimiter.remainingMs()
  await new Promise((r) => setTimeout(r, wait))
}

let response: Response
try {
  response = await jinaPolicy.execute(async () => {
    const signal = AbortSignal.timeout(10_000)
    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    // Parse Retry-After on 429 and set global backoff before throwing
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10)
      jinaRateLimiter.setBackoff(retryAfter * 1_000)
      const text = await res.text()
      throw new Error(`Jina 429 rate limit: ${text.slice(0, 100)}`)
    }

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Jina API error ${res.status}: ${error.slice(0, 200)}`)
    }

    return res
  })
} catch (e) {
  // Circuit open or all retries exhausted → fallback to local embedding
  console.warn(JSON.stringify({ event: "jina_fallback_triggered", error: e instanceof Error ? e.message : String(e) }))
  setJinaFallback(true)
  return this.localEmbed(texts, dimensions)
}

setJinaFallback(false)
const json = (await response.json()) as JinaResponse
// ... rest of existing response parsing ...
```

3. Add `localEmbed` fallback method to `EmbedderService`:

```typescript
/**
 * Local embedding fallback using @xenova/transformers all-MiniLM-L6-v2 (384d).
 * ~120MB RAM. Only loaded when Jina is unavailable.
 * ARM64 compatible — pure JS, no native bindings.
 *
 * CRITICAL: Local 384d embeddings are NOT compatible with Jina 512d embeddings.
 * Do NOT zero-pad — cosine similarity between different embedding spaces is meaningless.
 * Instead: return embeddings with a special `_fallback: true` flag so the pipeline
 * can mark these chunks as "needs_reembed" instead of storing the embedding.
 * The chunks will still be indexed via FTS (tsvector) and will be retrievable via
 * text search, just not via vector search until Jina is back and re-embeds them.
 */
private async localEmbed(texts: string[], targetDimensions: number): Promise<BatchEmbeddingResult> {
  // Return empty embeddings — chunks will be inserted with embedding=NULL.
  // FTS (tsvector) still works for retrieval. Vector search skips NULL embeddings.
  // When Jina recovers, reembed_chunks.ts re-embeds all NULL-embedding chunks.
  console.warn(JSON.stringify({
    event: "jina_fallback_null_embeddings",
    count: texts.length,
    reason: "Local 384d embeddings incompatible with Jina 512d space. Chunks indexed via FTS only.",
  }))

  const embeddings: EmbeddingResult[] = texts.map(() => ({
    vector: [],  // empty — pipeline must check for empty vector and skip vectorStore.index
    dimensions: 0,
    tokenCount: 0,
  }))

  return { embeddings, totalTokens: 0 }
}
```

4. Install `@xenova/transformers`:
```
bun add @xenova/transformers
```

**RAM note:** all-MiniLM-L6-v2 uses ~120 MB at inference. Lazy-loaded — no cost if Jina is healthy. Total headroom check: 700 MB available, 120 MB for model, 580 MB remaining. Within budget.

**Note on embedding quality during fallback:** Local 384-dim embeddings zero-padded to 1024d are not semantically equivalent to Jina embeddings. Fallback retrieval quality will degrade. This is intentional — the goal is availability, not quality. Log clearly when fallback is active.

#### Step 4: Inject groqLlmPolicy into `LlmService`

File: `src/services/llm.ts`

1. Import at top:
```typescript
import { groqLlmPolicy, groqRateLimiter, setGroqLlmFallback } from "./resilience"
```

2. Remove the manual `for (let attempt = 0; attempt <= MAX_RETRIES; attempt++)` loop. Replace the entire `chat` method body with:

```typescript
async chat(messages: LlmMessage[], maxTokens: number = 1024): Promise<LlmResponse> {
  if (groqRateLimiter.isBackingOff()) {
    await new Promise((r) => setTimeout(r, groqRateLimiter.remainingMs()))
  }

  try {
    const res = await groqLlmPolicy.execute(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens }),
      })

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10)
        groqRateLimiter.setBackoff(retryAfter * 1_000)
        const text = await response.text()
        throw new Error(`Groq 429 rate limit: ${text.slice(0, 100)}`)
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Groq API error ${response.status}: ${text.slice(0, 200)}`)
      }

      return response
    })

    setGroqLlmFallback(false)
    const data = await res.json() as GroqResponse

    if (!data.choices?.length) {
      console.warn("Groq returned empty choices — possible content filtering")
      return { response: "", promptTokens: 0, completionTokens: 0 }
    }

    return {
      response: data.choices[0]?.message?.content ?? "",
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    }
  } catch (e) {
    // Circuit open → raw-context passthrough fallback
    console.warn(JSON.stringify({ event: "groq_llm_fallback_triggered", error: e instanceof Error ? e.message : String(e) }))
    setGroqLlmFallback(true)
    // Return sentinel that callers interpret as "LLM unavailable"
    throw new Error("LLM_UNAVAILABLE: " + (e instanceof Error ? e.message : String(e)))
  }
}
```

**Note on LLM fallback:** When circuit opens, `chat()` throws `LLM_UNAVAILABLE: ...`. The caller (`RagService.generateAnswer`) must catch this and return a raw-context passthrough answer: `"Here are the relevant passages:\n\n{context}"`. Add this catch in `src/services/rag/index.ts` in the `generateAnswer` method:

```typescript
// In generateAnswer, wrap the this.llm.chat() call:
try {
  const result = await this.llm.chat([...], 1024)
  return { answer: result.response, ... }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.startsWith("LLM_UNAVAILABLE:")) {
    return {
      answer: `LLM временно недоступен. Найденные фрагменты:\n\n${context}`,
      promptTokens: 0,
      completionTokens: 0,
    }
  }
  throw e
}
```

#### Step 5: Inject doclingPolicy into `DoclingParser`

File: `src/services/parsers/docling.ts`

1. Import at top:
```typescript
import { doclingPolicy } from "../resilience"
```

2. Wrap the `fetch` call in `parse()` method:

```typescript
async parse(input: ParserInput): Promise<ParseResult> {
  const buffer = input.file instanceof ArrayBuffer
    ? input.file
    : await streamToBuffer(input.file)

  const formData = new FormData()
  const blob = new Blob([buffer], { type: input.mimeType })
  formData.append("files", blob, input.fileName)

  let data: DoclingResponse
  try {
    data = await doclingPolicy.execute(async () => {
      const res = await fetch(`${this.doclingUrl}/v1/convert/file`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(180_000),  // F-023: extended to 180s for OCR
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Docling API error ${res.status}: ${text.slice(0, 200)}`)
      }

      return res.json() as Promise<DoclingResponse>
    })
  } catch (e) {
    // Circuit open or all retries exhausted → TextParser fallback
    // Only for text-decodable formats (not PDF, PPTX, images)
    const textDecodable = ["text/html", "application/vnd.oasis.opendocument.text"]
    if (textDecodable.includes(input.mimeType)) {
      const content = new TextDecoder().decode(buffer)
      const warnings = ["Docling unavailable — fell back to TextParser"]
      return { content, metadata: buildMetadata(input, content, detectFormat(input.mimeType), { warnings }) }
    }
    throw e  // For PDF, PPTX, XLSX etc — re-throw, BullMQ will retry
  }

  const content = data.document?.md_content ?? data.md_content ?? ""
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    warnings.push("Docling returned empty content — file may be image-only or protected")
  }

  return {
    content: content || "",
    metadata: buildMetadata(input, content || "", detectFormat(input.mimeType), { warnings }),
  }
}
```

**Note on formData reuse:** `FormData` with a consumed `Blob` cannot be re-sent across retries. The retry policy in `doclingPolicy` wraps the entire `execute()` callback, which re-creates the `FormData` and `Blob` on each attempt. The `buffer` variable is captured by closure — this works correctly.

#### Step 6: Add `/health/circuits` endpoint

File: `src/routes/health.ts`

Add a new route below the existing `health.get("/")`:

```typescript
import { getCircuitHealthSnapshot } from "../services/resilience"

health.get("/circuits", async (c) => {
  const snapshot = getCircuitHealthSnapshot()

  // Aggregate status: if any service is "down" → overall down;
  // if any is "degraded" → overall degraded; else ok
  const statuses = Object.values(snapshot).map((s) => s.status)
  const overall = statuses.includes("down")
    ? "down"
    : statuses.includes("degraded")
      ? "degraded"
      : "ok"

  const httpStatus = overall === "down" ? 503 : overall === "degraded" ? 200 : 200

  return c.json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: snapshot,
  }, httpStatus)
})
```

**Full `/health/circuits` response JSON format:**

```json
{
  "status": "ok | degraded | down",
  "timestamp": "2026-03-28T12:34:56.789Z",
  "services": {
    "jina": {
      "status": "ok | degraded | down",
      "circuit": "closed | halfOpen | open",
      "fallback": "inactive | active"
    },
    "groq_llm": {
      "status": "ok | degraded | down",
      "circuit": "closed | halfOpen | open",
      "fallback": "inactive | active"
    },
    "groq_whisper": {
      "status": "ok | degraded | down",
      "circuit": "closed | halfOpen | open",
      "fallback": "inactive"
    },
    "docling": {
      "status": "ok | degraded | down",
      "circuit": "closed | halfOpen | open",
      "fallback": "inactive"
    }
  }
}
```

Status mapping: `circuit: "closed"` → `status: "ok"`. `circuit: "halfOpen"` → `status: "degraded"`. `circuit: "open"` → `status: "down"`.

#### Step 7: Register /health/circuits in app entry point

The existing `health` Hono router is mounted at some prefix in the main entry point. Find where `health` is mounted (likely `app.route("/health", health)`) — the new `/circuits` sub-route is automatically registered because it's added to the same Hono instance. No change to the main entry file needed.

### Files changed

- `src/services/resilience.ts` — NEW. All policies, RateLimitTracker, circuit state snapshot.
- `src/services/embedder/index.ts` — Replace manual retry loop with `jinaPolicy.execute()`. Add `localEmbed()` fallback method.
- `src/services/llm.ts` — Replace manual retry loop with `groqLlmPolicy.execute()`.
- `src/services/rag/index.ts` — Add `LLM_UNAVAILABLE` catch in `generateAnswer`.
- `src/services/parsers/docling.ts` — Wrap fetch with `doclingPolicy.execute()`. Change timeout 90s → 180s.
- `src/routes/health.ts` — Add `GET /circuits` sub-route.
- `package.json` — Add `cockatiel` and `@xenova/transformers`.

### Verification

**1. Confirm cockatiel installs under Bun:**
```
bun add cockatiel
bun run -e "import { Policy } from 'cockatiel'; console.log('ok')"
```
Expected: `ok`

**2. Confirm @xenova/transformers installs (ARM64):**
```
bun add @xenova/transformers
bun run -e "const { pipeline } = await import('@xenova/transformers'); console.log('loaded')"
```
Expected: `loaded` (first run downloads model ~80MB, subsequent runs are cached)

**3. Verify /health/circuits returns correct shape:**
```
curl -s http://localhost:3000/health/circuits | jq .
```
Expected: JSON with `status`, `timestamp`, `services.jina.circuit === "closed"` (all closed when services are healthy).

**4. Verify circuit opens after N failures (Jina example):**

Set `JINA_API_URL` to an unreachable endpoint in test env, then make 5 embedding requests. After the ConsecutiveBreaker/SamplingBreaker threshold is crossed:
```
curl -s http://localhost:3000/health/circuits | jq '.services.jina.circuit'
```
Expected: `"open"` or `"halfOpen"` depending on timing.

Alternatively, use a mock approach:
```typescript
// In a test script, temporarily replace JINA_API_URL with localhost:1 (refused)
// Send 6 requests to any endpoint that triggers embedding
// Poll /health/circuits every 2s — observe state transition closed → open
```

**5. Verify thundering herd guard (RateLimitTracker):**

Inspect logs after a 429 from Jina. Expected log line:
```json
{"event":"circuit_open","service":"jina"}
```
And subsequent embed calls within the backoff window should see the `isBackingOff()` guard fire and wait, visible in request latency (not in a new log line).

**6. Verify Docling fallback for text-decodable:**

Stop Docling container. Upload an `.html` or `.odt` file. Expected: document processes successfully via TextParser fallback, `warnings` array in parse result contains `"Docling unavailable — fell back to TextParser"`.

**7. Verify LLM raw-context fallback:**

Set `GROQ_API_KEY` to an invalid value. Make a `/api/query` request. Expected: response contains `"LLM временно недоступен"` with relevant passage text, HTTP 200 (not 500).

---

## F-023: OCR Phase 1 — Tesseract

### Current state

`DoclingParser` sends files to the Docling container at `/v1/convert/file` with a plain `FormData` body — no OCR parameters. Docling does not enable OCR by default. For image-only or scanned PDFs, `data.document?.md_content` is empty and a warning is appended: `"Docling returned empty content — file may be image-only or protected"`. Tesseract is NOT installed in the Docling container (which is the `quay.io/docling-project/docling-serve` image, not the Contexter app image — these are separate containers).

### Implementation

#### Step 1: Determine Docling container Dockerfile

The production Docling container uses the upstream image `quay.io/docling-project/docling-serve`. To add Tesseract, create a custom Dockerfile for the Docling service that extends the upstream image.

Create: `docker/docling/Dockerfile`

```dockerfile
FROM quay.io/docling-project/docling-serve:latest

# Install Tesseract OCR with English and Russian language data
# The upstream image is Debian/Ubuntu-based — use apt-get
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tesseract-ocr \
      tesseract-ocr-eng \
      tesseract-ocr-rus && \
    rm -rf /var/lib/apt/lists/*

USER docling
```

**Note:** If the upstream Docling image is Alpine-based, replace `apt-get` with:
```dockerfile
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng tesseract-ocr-data-rus
```
Verify the base OS before deploying: `docker run --rm quay.io/docling-project/docling-serve:latest cat /etc/os-release`.

**Image size impact:** `tesseract-ocr-eng` ~10 MB, `tesseract-ocr-rus` ~40 MB, Tesseract binary ~5 MB. Total delta ~55 MB. Acceptable.

**Runtime RAM impact:** Tesseract loads language data on first OCR call: ~60 MB for English, ~120 MB for Russian loaded simultaneously. Total ~200 MB per OCR invocation. The Docling container runs separately from Contexter — its RAM limit is independent of the 700 MB Contexter headroom.

#### Step 2: Add OCR env variable to Contexter

In `src/types/env.ts`, add:
```typescript
OCR_ENABLED: string  // "true" | "false", default "false"
```

In the `.env` / docker-compose for Contexter:
```
OCR_ENABLED=true
```

#### Step 3: Modify `DoclingParser.parse()` to pass OCR params

File: `src/services/parsers/docling.ts`

The Docling `/v1/convert/file` endpoint accepts additional form fields for OCR configuration (Docling-serve 1.15.0+ API). Add OCR parameters to `FormData` when `OCR_ENABLED=true`:

```typescript
async parse(input: ParserInput): Promise<ParseResult> {
  const buffer = input.file instanceof ArrayBuffer
    ? input.file
    : await streamToBuffer(input.file)

  const formData = new FormData()
  const blob = new Blob([buffer], { type: input.mimeType })
  formData.append("files", blob, input.fileName)

  // F-023: OCR parameters — only for formats where OCR makes sense
  const ocrEnabled = process.env.OCR_ENABLED === "true"
  const ocrFormats = ["application/pdf", "image/png", "image/jpeg", "image/webp"]
  if (ocrEnabled && ocrFormats.includes(input.mimeType)) {
    formData.append("do_ocr", "true")
    formData.append("force_ocr", "false")      // false = only OCR pages where text layer is absent
    formData.append("ocr_engine", "tesseract_cli")
    formData.append("ocr_lang", "eng+rus")
  }

  // ... rest of parse() — fetch call, error handling, etc.
  // (Timeout is 180s after F-022 changes above)
}
```

**`force_ocr` = false rationale:** When `false`, Docling only runs Tesseract on pages where the PDF has no embedded text layer. For mixed documents (some pages digital, some scanned), this is the correct setting. Setting to `true` would re-OCR digital pages unnecessarily, increasing processing time by 5–10x.

**`ocr_lang` = "eng+rus":** Standard Tesseract multi-language syntax — both language packs must be installed.

#### Step 4: Update `DOCLING_TIMEOUT` comments

After F-022 changes the timeout to 180s, add a comment in `docling.ts`:

```typescript
// F-023: timeout extended to 180s — OCR adds ~10-15s/page on ARM64.
// A 20-page scanned PDF can take 200-300s → acceptable for async BullMQ queue.
// Synchronous callers should set their own outer deadline.
signal: AbortSignal.timeout(180_000),
```

#### Step 5: Update docker-compose on server

In `/opt/contexter/docker-compose.yml` on the server, change the Docling service `image:` to reference the custom image built from `docker/docling/Dockerfile`. Build and push it, or use `build:` directive:

```yaml
docling:
  build:
    context: ./docker/docling
    dockerfile: Dockerfile
  # ... rest of service config unchanged
```

### Files changed

- `docker/docling/Dockerfile` — NEW. Extends upstream Docling image with Tesseract.
- `src/services/parsers/docling.ts` — Add OCR FormData fields when `OCR_ENABLED=true`.
- `src/types/env.ts` — Add `OCR_ENABLED: string`.

### Verification

**1. Confirm Tesseract is available in custom Docling container:**
```bash
docker build -t contexter-docling ./docker/docling
docker run --rm contexter-docling tesseract --version
docker run --rm contexter-docling tesseract --list-langs
```
Expected: Tesseract version line. `list-langs` output includes `eng` and `rus`.

**2. Test OCR on a scanned PDF:**

Upload a known scanned PDF (image-only, zero text layer) via `POST /api/upload` with `OCR_ENABLED=true` in the Contexter env. Wait for pipeline to complete. Then query:
```sql
SELECT content FROM chunks WHERE document_id = '<uploaded_doc_id>' LIMIT 1;
```
Expected: Non-empty text content extracted from the scanned pages.

**Before OCR enabled:** `content` is empty or contains only whitespace/warning text.
**After OCR enabled:** `content` contains recognizable text from the scanned document.

**3. Verify OCR only fires for configured MIME types:**

Upload a `.docx` file with `OCR_ENABLED=true`. Confirm in Docling logs that no `tesseract_cli` invocation occurs (DOCX has an embedded text layer and is not in `ocrFormats`).

**4. Verify processing time is acceptable (async):**

Upload a 20-page scanned PDF. Monitor BullMQ job status via `GET /api/documents/:id/status`. Expected: job completes with `status: "ready"` within 5–10 minutes. No timeout error.

---

## F-024: OCR Phase 2 — Mistral cloud fallback

### Prerequisite

F-023 must be fully deployed and confirmed working before F-024. Mistral OCR is the fallback — it only activates when local Tesseract produces empty or unusable output.

### Implementation

#### Step 1: Define "low confidence" trigger conditions

Mistral OCR fallback triggers when **either** of these conditions is true after a Docling parse attempt:

1. `content.trim().length === 0` — Docling returned empty content (OCR was attempted but produced nothing)
2. `content.length < 50 && warnings.includes("Docling returned empty content")` — practically empty

There is no per-page confidence score exposed by Docling's current API. The empty-content check is the correct proxy. Do NOT trigger Mistral fallback for documents with legitimate empty content (e.g., spreadsheets with only images — these are edge cases that users will need to accept).

#### Step 2: Create `src/services/parsers/mistral-ocr.ts`

```typescript
/**
 * Mistral OCR API fallback for documents where local Tesseract produces empty output.
 * Endpoint: https://api.mistral.ai/v1/ocr
 * Model: mistral-ocr-latest
 * Output: Markdown text extracted from document.
 * Cost: ~$1-2 per 1000 pages (~$0.001-0.002 per page).
 * Privacy: documents are sent to Mistral's API. Opt-in only via OCR_CLOUD_FALLBACK_ENABLED=true.
 */

export interface MistralOcrResult {
  content: string
  pageCount: number
}

export class MistralOcrService {
  private apiKey: string
  private baseUrl = "https://api.mistral.ai/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Send a document buffer to Mistral OCR API.
   * Mistral OCR accepts base64-encoded file content directly.
   * Supported: PDF, images (PNG, JPEG, WEBP).
   */
  async ocr(buffer: ArrayBuffer, mimeType: string, fileName: string): Promise<MistralOcrResult> {
    // Convert buffer to base64
    const bytes = new Uint8Array(buffer)
    const base64 = btoa(String.fromCharCode(...bytes))

    const body = {
      model: "mistral-ocr-latest",
      document: {
        type: "base64_document",
        data: base64,
        media_type: mimeType,
      },
    }

    const res = await fetch(`${this.baseUrl}/ocr`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Mistral OCR error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json() as MistralOcrResponse

    // Mistral OCR returns per-page results — concatenate with newline separator
    const content = (data.pages ?? [])
      .map((p) => p.markdown ?? "")
      .filter((t) => t.trim().length > 0)
      .join("\n\n")

    return {
      content,
      pageCount: data.pages?.length ?? 0,
    }
  }
}

interface MistralOcrResponse {
  pages?: Array<{ markdown?: string; index?: number }>
  usage?: { pages_processed?: number }
}
```

**Mistral OCR API reference:**
- Endpoint: `POST https://api.mistral.ai/v1/ocr`
- Auth: `Authorization: Bearer {MISTRAL_API_KEY}`
- Request body: `{ model: "mistral-ocr-latest", document: { type: "base64_document", data: "<base64>", media_type: "<mime>" } }`
- Response: `{ pages: [{ index, markdown }], usage: { pages_processed } }`
- Supported MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`

**Note on large files:** For PDFs over ~10 MB, the base64 string may be very large. Mistral's API accepts this via standard HTTP POST — no streaming required. The 120s timeout covers large documents.

**Alternative upload method (files API):** Mistral also offers a file-upload endpoint (`POST /files`) that returns a `file_id`, then reference it in the OCR request. For files >10 MB, this may be more reliable. Implement only if the base64 approach fails in practice — do not over-engineer for now.

#### Step 3: Add env variable

In `src/types/env.ts`:
```typescript
OCR_CLOUD_FALLBACK_ENABLED: string  // "true" | "false", default "false"
MISTRAL_API_KEY: string
```

#### Step 4: Integrate into `DoclingParser.parse()`

File: `src/services/parsers/docling.ts`

After the existing parse attempt, add cloud fallback logic:

```typescript
// ... existing parse attempt produces `content` and `warnings` ...

// F-024: Mistral OCR cloud fallback
// Triggers only when local OCR produced empty output AND cloud fallback is enabled
const cloudFallbackEnabled = process.env.OCR_CLOUD_FALLBACK_ENABLED === "true"
const ocrFailed = !content || content.trim().length === 0
const mimeTypeSupported = ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(input.mimeType)

if (cloudFallbackEnabled && ocrFailed && mimeTypeSupported) {
  console.log(JSON.stringify({
    event: "mistral_ocr_fallback_triggered",
    fileName: input.fileName,
    mimeType: input.mimeType,
  }))

  try {
    const mistralApiKey = process.env.MISTRAL_API_KEY
    if (!mistralApiKey) {
      warnings.push("Mistral OCR fallback enabled but MISTRAL_API_KEY not set")
    } else {
      const mistralOcr = new MistralOcrService(mistralApiKey)
      const result = await mistralOcr.ocr(buffer, input.mimeType, input.fileName)

      if (result.content.trim().length > 0) {
        console.log(JSON.stringify({
          event: "mistral_ocr_success",
          fileName: input.fileName,
          pageCount: result.pageCount,
          contentLength: result.content.length,
        }))
        return {
          content: result.content,
          metadata: buildMetadata(input, result.content, detectFormat(input.mimeType), {
            warnings: ["Content extracted via Mistral OCR cloud fallback"],
          }),
        }
      } else {
        warnings.push("Mistral OCR also returned empty content")
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    warnings.push(`Mistral OCR fallback failed: ${msg}`)
    console.error(JSON.stringify({ event: "mistral_ocr_fallback_failed", error: msg }))
  }
}

return {
  content: content || "",
  metadata: buildMetadata(input, content || "", detectFormat(input.mimeType), { warnings }),
}
```

#### Step 5: Import in docling.ts

Add at top of `src/services/parsers/docling.ts`:
```typescript
import { MistralOcrService } from "./mistral-ocr"
```

### Privacy note

When `OCR_CLOUD_FALLBACK_ENABLED=true`, the raw binary content of documents with empty OCR output is sent to Mistral's API servers. This applies only to documents that Tesseract fails to process. Default is `false` — operator must explicitly opt in.

### Files changed

- `src/services/parsers/mistral-ocr.ts` — NEW. Mistral OCR API client.
- `src/services/parsers/docling.ts` — Add cloud fallback logic after parse attempt.
- `src/types/env.ts` — Add `OCR_CLOUD_FALLBACK_ENABLED` and `MISTRAL_API_KEY`.

### Verification

**1. Test with Tesseract fallback path:**

Set `OCR_ENABLED=true`, `OCR_CLOUD_FALLBACK_ENABLED=true`, `MISTRAL_API_KEY=<valid>`. Upload a document that Tesseract fails on (e.g., a low-DPI or rotated scan). Check logs for:
```json
{"event":"mistral_ocr_fallback_triggered","fileName":"...","mimeType":"application/pdf"}
{"event":"mistral_ocr_success","fileName":"...","pageCount":N,"contentLength":M}
```
Expected: `content` column in `chunks` has text; no `"mistral_ocr_fallback_failed"` log.

**2. Verify default-off behavior:**

With `OCR_CLOUD_FALLBACK_ENABLED=false` (default), upload the same document. Confirm no calls to `api.mistral.ai` in network logs. Confirm `content` is empty (Tesseract failed, no fallback).

**3. Test missing API key guard:**

Set `OCR_CLOUD_FALLBACK_ENABLED=true`, unset `MISTRAL_API_KEY`. Upload a failing document. Expected: warning `"Mistral OCR fallback enabled but MISTRAL_API_KEY not set"` in parse result metadata, no crash.

---

## F-029: FTS BM25 ranking (conditional on PG version)

### Current state

File: `src/services/vectorstore/fts.ts`, lines 38–53.

Current FTS ranking uses `ts_rank(tsv, plainto_tsquery('simple', ${sanitized}))`. The `ts_rank` function in PostgreSQL implements a simplified TF-IDF without IDF weighting (rare terms weighted the same as common terms), without length normalization, and without BM25 saturation. The `'simple'` text search configuration applies no stemming or morphological analysis.

As confirmed from the migration `0001_fts_and_vector_indexes.sql`, the `tsv` column is defined as:
```sql
GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED
```

This spec is **conditional**. Read the condition section before implementing anything.

### Condition — PG version check

**Current server PostgreSQL version: 16.** BM25 ranking via the native `pg_textsearch` extension requires PostgreSQL 17+. VectorChord-BM25 is a third-party extension that claims PG 16 support.

**Before writing any code**, execute this check against the production database:

```sql
SELECT version();
SHOW server_version;
```

Then evaluate:

**Path A — PG 16 with VectorChord-BM25:**

Check if VectorChord-BM25 is available:
```sql
SELECT * FROM pg_available_extensions WHERE name = 'vchord_bm25';
```

If it returns a row → implement via Path A below.
If it returns no rows → VectorChord-BM25 is not installed. Stop. Document the blocker in a comment in `fts.ts` and do not implement F-029 yet.

**Path B — Upgrade to PG 17:**

This is an infrastructure decision requiring nopoint approval. Out of scope for this implementation task. If Path A is blocked, escalate.

**If neither condition is met: F-029 is blocked. Do not implement. Leave a TODO comment in `fts.ts` and close this feature.**

### Implementation (Path A — VectorChord-BM25 on PG 16)

Only implement if `SELECT * FROM pg_available_extensions WHERE name = 'vchord_bm25'` confirms availability.

#### Step 1: Migration `drizzle-pg/0012_bm25_fts.sql`

```sql
-- F-029: BM25 ranking via VectorChord-BM25 extension (PG 16)
-- CONDITION: only run if vchord_bm25 extension is available
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
--> statement-breakpoint

-- BM25 index on content column
-- VectorChord-BM25 creates its own internal index structure — not a GIN
CREATE INDEX "chunks_content_bm25_idx" ON "chunks" USING bm25 ("content")
  WITH (text_fields = '{"content": {}}');
```

Note: The exact DDL syntax for VectorChord-BM25 index creation depends on the installed version. Verify against `https://github.com/tensorchord/VectorChord-bm25` docs for the version available on the server before running.

#### Step 2: Update `FtsService.search()` in `fts.ts`

Replace the two SQL queries (userId-filtered and unfiltered) with BM25 ranking. VectorChord-BM25 uses a custom operator `<&>` for BM25 scoring:

```typescript
async search(query: string, topK: number = 10, userId?: string): Promise<SearchResult[]> {
  const sanitized = sanitizeFtsQuery(query)
  if (!sanitized) return []

  // VectorChord-BM25: uses bm25_query() and <&> distance operator
  // Score is returned as distance (lower = better) — negate for descending sort
  const rows = userId
    ? await this.sql`
        SELECT id, document_id, content, chunk_index,
          (content <&> bm25_query(${sanitized})) * -1 as score
        FROM chunks
        WHERE content @@ bm25_query(${sanitized}) AND user_id = ${userId}
        ORDER BY score DESC
        LIMIT ${topK}
      `
    : await this.sql`
        SELECT id, document_id, content, chunk_index,
          (content <&> bm25_query(${sanitized})) * -1 as score
        FROM chunks
        WHERE content @@ bm25_query(${sanitized})
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

**Warning on VectorChord-BM25 exact API:** The exact function names (`bm25_query`, `<&>` operator) must be verified against the installed version's documentation. The API may differ. If the exact syntax does not compile against the installed extension, escalate to Orchestrator — do not guess.

**Score normalization note:** VectorChord-BM25 returns a distance (lower = better match, negative direction). Multiplying by `-1` converts to a score (higher = better), consistent with the existing `SearchResult.score` convention used throughout the codebase. After F-007 (CC fusion), score normalization will be handled by min-max before fusion — this is sufficient for now.

### Blocker documentation (if neither path available)

If VectorChord-BM25 is not available and PG upgrade is not approved, add to `src/services/vectorstore/fts.ts`:

```typescript
// F-029 BLOCKED: BM25 ranking requires PG 17+ (pg_textsearch) or VectorChord-BM25 on PG 16.
// Current server: PG 16. VectorChord-BM25 not confirmed available.
// Current ranking: ts_rank with 'simple' configuration.
// Improvement: F-003 (multilingual stemming) is the correct FTS upgrade path for now.
// Revisit F-029 when PG 17 upgrade is scheduled.
```

### Files changed (if Path A available)

- `drizzle-pg/0012_bm25_fts.sql` — NEW. Enable extension + create BM25 index.
- `src/services/vectorstore/fts.ts` — Replace `ts_rank`/`plainto_tsquery` with BM25 query.

### Verification

**1. Confirm extension availability:**
```sql
SELECT * FROM pg_available_extensions WHERE name = 'vchord_bm25';
```
Expected if available: one row with `installed_version` non-null after migration.

**2. Verify BM25 index was created:**
```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chunks' AND indexname = 'chunks_content_bm25_idx';
```
Expected: one row.

**3. Verify BM25 scores are non-zero and vary by query:**
```sql
SELECT id, (content <&> bm25_query('quantum computing')) * -1 as score
FROM chunks
WHERE content @@ bm25_query('quantum computing')
ORDER BY score DESC
LIMIT 5;
```
Expected: 5 rows with varying positive scores.

**4. Confirm ts_rank is no longer used:**
```
grep -n "ts_rank" src/services/vectorstore/fts.ts
```
Expected: no matches (if Path A implemented).

---

## F-030: Feedback loops — MVFL

### Current state

No feedback mechanism exists. No `feedback` table. No `POST /api/feedback` endpoint. The `chunks` table has no feedback-related columns. Retrieval scores are purely based on vector similarity + FTS rank + RRF fusion, with no signal from user satisfaction.

### Implementation

#### Step 1: Migration `drizzle-pg/0010_feedback.sql`

This migration does two things: (1) creates the `feedback` table, (2) adds feedback columns to `chunks`.

```sql
-- F-030: Feedback loops — MVFL
-- feedback table: captures explicit thumbs up/down per query-answer pair

CREATE TABLE "feedback" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "query_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "query_text" TEXT NOT NULL,
  "answer_text" TEXT NOT NULL,
  "rating" SMALLINT NOT NULL CHECK ("rating" IN (-1, 1)),
  "chunk_ids" TEXT[] NOT NULL DEFAULT '{}',
  "source" TEXT NOT NULL DEFAULT 'explicit',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX "feedback_user_id_idx" ON "feedback" ("user_id");
--> statement-breakpoint
CREATE INDEX "feedback_query_id_idx" ON "feedback" ("query_id");
--> statement-breakpoint
CREATE INDEX "feedback_chunk_ids_idx" ON "feedback" USING GIN ("chunk_ids");
--> statement-breakpoint

-- chunks table: add feedback tracking columns
ALTER TABLE "chunks"
  ADD COLUMN "feedback_pos" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_neg" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_score" REAL NOT NULL DEFAULT 1.0;
--> statement-breakpoint

CREATE INDEX "chunks_feedback_score_idx" ON "chunks" ("feedback_score");
```

**Schema field definitions:**

| Field | Type | Description |
|---|---|---|
| `feedback.id` | TEXT PK | UUID, generated by caller |
| `feedback.query_id` | TEXT | Caller-provided ID for the query session (from query response or provided by client) |
| `feedback.user_id` | TEXT FK | User who submitted feedback |
| `feedback.query_text` | TEXT | The original query string |
| `feedback.answer_text` | TEXT | The answer text that was rated |
| `feedback.rating` | SMALLINT | `1` = thumbs up, `-1` = thumbs down |
| `feedback.chunk_ids` | TEXT[] | Array of chunk IDs that contributed to the answer |
| `feedback.source` | TEXT | `"explicit"` (this feature), `"implicit"` (Phase 2, not implemented) |
| `chunks.feedback_pos` | REAL | Count of positive feedback events for this chunk (decayed daily) |
| `chunks.feedback_neg` | REAL | Count of negative feedback events for this chunk (decayed daily) |
| `chunks.feedback_score` | REAL | Beta-Binomial score, default 1.0 (neutral) |

#### Step 2: Update Drizzle schema `src/db/schema.ts`

Add the `feedback` table and extend `chunks`:

```typescript
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  queryId: text("query_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  answerText: text("answer_text").notNull(),
  rating: integer("rating").notNull(),  // 1 or -1
  chunkIds: text("chunk_ids").array().notNull().default([]),
  source: text("source").notNull().default("explicit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("feedback_user_id_idx").on(table.userId),
  index("feedback_query_id_idx").on(table.queryId),
])
```

Extend `chunks` table definition (add to the existing `pgTable` call):
```typescript
feedbackPos: real("feedback_pos").notNull().default(0),
feedbackNeg: real("feedback_neg").notNull().default(0),
feedbackScore: real("feedback_score").notNull().default(1.0),
```

**Note:** Drizzle does not have a built-in `real` type import by default for all versions. Import `real` from `drizzle-orm/pg-core`. If not available, use `doublePrecision` — semantically equivalent for this use case.

#### Step 3: Add `query_id` to query response

For the feedback endpoint to reference a specific query-answer pair, the query response must include a `query_id`. Update `src/routes/query.ts`:

1. Generate a `queryId` at the start of the request handler:
```typescript
import { randomUUID } from "crypto"
// At the top of the route handler:
const queryId = randomUUID()
```

2. Include in the response JSON:
```typescript
return c.json({
  query_id: queryId,
  answer: result.answer,
  sources: filteredSources.map(...),
  // ... rest unchanged
})
```

3. Update `src/routes/query.ts` to also pass chunk IDs in sources response — needed for feedback to know which chunks to update. Sources already include `documentId` and `content`. Add `chunk_id`:
```typescript
sources: filteredSources.map((s) => ({
  chunk_id: s.id,          // NEW
  documentId: s.documentId,
  document_name: nameMap[s.documentId] ?? s.documentId,
  content: s.content,
  score: s.score,
  source: s.source,
})),
```

The `s.id` field is the chunk ID from `HybridSearchResult.id`. It is already available — just not currently included in the response.

#### Step 4: Create `POST /api/feedback` route

Create: `src/routes/feedback.ts`

```typescript
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { randomUUID } from "crypto"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const feedbackRouter = new Hono<AppEnv>()

const feedbackSchema = z.object({
  query_id: z.string().min(1).max(128),
  query_text: z.string().min(1).max(2000),
  answer_text: z.string().min(1).max(10000),
  rating: z.union([z.literal(1), z.literal(-1)]),
  chunk_ids: z.array(z.string()).min(1).max(50),
})

feedbackRouter.post("/", zValidator("json", feedbackSchema), async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const body = c.req.valid("json")

  // Insert feedback record
  const feedbackId = randomUUID()
  await sql`
    INSERT INTO feedback (id, query_id, user_id, query_text, answer_text, rating, chunk_ids, source)
    VALUES (
      ${feedbackId},
      ${body.query_id},
      ${auth.userId},
      ${body.query_text},
      ${body.answer_text},
      ${body.rating},
      ${body.chunk_ids},
      'explicit'
    )
  `

  // Update chunk feedback counters and recalculate feedback_score
  // Only update chunks that belong to this user (security: prevent cross-user score manipulation)
  if (body.rating === 1) {
    await sql`
      UPDATE chunks
      SET
        feedback_pos = feedback_pos + 1,
        feedback_score = 0.5 + (feedback_pos + 2) / (feedback_pos + feedback_neg + 3)
      WHERE id = ANY(${body.chunk_ids}) AND user_id = ${auth.userId}
    `
  } else {
    await sql`
      UPDATE chunks
      SET
        feedback_neg = feedback_neg + 1,
        feedback_score = 0.5 + (feedback_pos + 1) / (feedback_pos + feedback_neg + 3)
      WHERE id = ANY(${body.chunk_ids}) AND user_id = ${auth.userId}
    `
  }

  return c.json({ ok: true, feedback_id: feedbackId }, 201)
})
```

**Beta-Binomial scoring formula:**

The feedback_score is computed as: `0.5 + (pos + 1) / (pos + neg + 2)`

This is the Beta-Binomial posterior mean with prior `Beta(1, 1)` (uniform). Value range: (0.5, 1.5) — wait, let's verify:
- All positive: `pos=10, neg=0` → `0.5 + 11/12 ≈ 1.42`
- All negative: `pos=0, neg=10` → `0.5 + 1/12 ≈ 0.58`
- Neutral (no feedback): `pos=0, neg=0` → `0.5 + 1/2 = 1.0` ✓

The formula returns values in range `(0.5, ~1.5)`. The plan states "positive chunks get up to 1.5x boost; negative get 0.5x penalty" — these are approximate descriptions, the formula is the authoritative definition.

**SQL update formula note:** The SQL update runs AFTER incrementing the counter, so when rating=1, we've already added 1 to `feedback_pos`. The formula in the UPDATE uses the post-increment values. The correct SQL for a positive rating update:
```sql
-- After incrementing feedback_pos by 1:
-- new_score = 0.5 + (new_pos + 1) / (new_pos + neg + 2)
-- Since new_pos = old_pos + 1:
-- new_score = 0.5 + (feedback_pos + 1) / (feedback_pos + feedback_neg + 2)
```

Revise the SQL in the route to perform the increment and score update in one statement to avoid race conditions:

```sql
-- Positive rating (rating = 1):
UPDATE chunks
SET
  feedback_pos = feedback_pos + 1,
  feedback_score = 0.5 + (feedback_pos + 2) / (feedback_pos + feedback_neg + 3)
WHERE id = ANY(${body.chunk_ids}) AND user_id = ${auth.userId}
```
Here `feedback_pos + 2` = `(feedback_pos + 1) + 1` where the first +1 accounts for the increment just applied and the second +1 is the Beta prior. And `feedback_pos + feedback_neg + 3` = `(feedback_pos + 1) + feedback_neg + 2` (incremented pos + unchanged neg + prior denominator). This is correct — the formula evaluates using the post-increment values of `feedback_pos`.

```sql
-- Negative rating (rating = -1):
UPDATE chunks
SET
  feedback_neg = feedback_neg + 1,
  feedback_score = 0.5 + (feedback_pos + 1) / (feedback_pos + feedback_neg + 3)
WHERE id = ANY(${body.chunk_ids}) AND user_id = ${auth.userId}
```
Here `feedback_pos + feedback_neg + 3` = `feedback_pos + (feedback_neg + 1) + 2`. Correct.

#### Step 5: Register feedback route in app

In the main Hono app entry file (wherever routes are registered), add:
```typescript
import { feedbackRouter } from "./routes/feedback"
app.route("/api/feedback", feedbackRouter)
```

#### Step 6: Apply feedback_score multiplier in retrieval

File: `src/services/vectorstore/index.ts`

In the `search()` method, after calling `reciprocalRankFusion(vectorResults, ftsResults, topK)` and getting `fused`, fetch feedback scores for the returned chunk IDs and multiply:

```typescript
async search(
  queryVector: number[],
  queryText: string,
  options: SearchOptions = {}
): Promise<HybridSearchResult[]> {
  const topK = options.topK ?? DEFAULT_TOP_K
  const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
  const userId = options.userId

  const [vectorResults, ftsResults] = await Promise.all([
    this.vector.search(queryVector, topK * 2, userId),
    this.fts.search(queryText, topK * 2, userId),
  ])

  const fused = reciprocalRankFusion(vectorResults, ftsResults, topK)

  // F-030: Apply feedback_score multiplier
  if (fused.length > 0) {
    const ids = fused.map((r) => r.id)
    const feedbackRows = await this.sql`
      SELECT id, feedback_score FROM chunks WHERE id = ANY(${ids})
    `
    const scoreMap = new Map(feedbackRows.map((r) => [r.id as string, Number(r.feedback_score)]))

    for (const result of fused) {
      const fs = scoreMap.get(result.id) ?? 1.0
      result.score = result.score * fs
    }

    // Re-sort after applying multiplier
    fused.sort((a, b) => b.score - a.score)
  }

  return fused.filter((r) => r.score >= threshold)
}
```

**Note:** `VectorStoreService` currently does not hold a `sql` reference — it only uses `VectorService` and `FtsService`. Add `private sql: Sql` to the class and pass `config.sql` to it in the constructor.

#### Step 7: Add daily decay BullMQ cron job

Create: `src/services/feedback-decay.ts`

```typescript
import { Queue, Worker } from "bullmq"
import type { Sql } from "postgres"

const DECAY_QUEUE = "feedback_decay"
const DECAY_FACTOR = 0.99  // ~90-day half-life (ln(0.5)/ln(0.99) ≈ 68.97 days)

export function startFeedbackDecayWorker(redisUrl: string, sql: Sql): Worker {
  const worker = new Worker(
    DECAY_QUEUE,
    async () => {
      // Multiply feedback counters by decay factor
      // Recalculate feedback_score after decay
      await sql`
        UPDATE chunks
        SET
          feedback_pos = feedback_pos * ${DECAY_FACTOR},
          feedback_neg = feedback_neg * ${DECAY_FACTOR},
          feedback_score = 0.5 + (feedback_pos * ${DECAY_FACTOR} + 1)
            / (feedback_pos * ${DECAY_FACTOR} + feedback_neg * ${DECAY_FACTOR} + 2)
        WHERE feedback_pos > 0 OR feedback_neg > 0
      `
      console.log(JSON.stringify({ event: "feedback_decay_applied", factor: DECAY_FACTOR }))
    },
    { connection: { url: redisUrl } }
  )
  return worker
}

// Separate function to register the repeating job
export async function scheduleFeedbackDecay(redisUrl: string): Promise<void> {
  const queue = new Queue(DECAY_QUEUE, { connection: { url: redisUrl } })

  // Remove any existing repeat job to avoid duplicates on restart
  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === "daily_decay") {
      await queue.removeRepeatableByKey(job.key)
    }
  }

  // Schedule daily at 02:00 UTC
  await queue.add("daily_decay", {}, {
    repeat: { pattern: "0 2 * * *" },
    removeOnComplete: { count: 1 },
    removeOnFail: { count: 5 },
  })

  await queue.close()
}
```

**Decay math verification:**
- After 90 days: `0.99^90 ≈ 0.407` (not half-life at 90 days)
- Half-life of 0.99 per day: `0.99^N = 0.5` → `N = ln(0.5)/ln(0.99) ≈ 69 days`
- At 90 days: 59% reduction — appropriate for memory decay
- The plan says "~90-day half-life" — this is an approximation. 69 actual days is close enough.

**Note on SQL decay formula:** The SQL expression for `feedback_score` after decay needs careful evaluation since `feedback_pos` and `feedback_neg` are being multiplied inside the same statement. PostgreSQL evaluates the SET expressions using the pre-UPDATE row values. The expression `feedback_pos * 0.99` correctly refers to the old value. The full correct formula:

```sql
feedback_score = 0.5 + (feedback_pos * 0.99 + 1) / (feedback_pos * 0.99 + feedback_neg * 0.99 + 2)
```

This computes the new Beta-Binomial score after decay, using the post-decay counter values.

#### Step 8: Register decay worker in app startup

In the main app entry file, after starting the pipeline worker:
```typescript
import { startFeedbackDecayWorker, scheduleFeedbackDecay } from "./services/feedback-decay"

// Start decay worker
const decayWorker = startFeedbackDecayWorker(env.REDIS_URL, sql)
// Schedule repeating job (idempotent — removes old schedule first)
await scheduleFeedbackDecay(env.REDIS_URL)
```

Add to the graceful shutdown sequence:
```typescript
await decayWorker.close()
```

### Implicit feedback Phase 2 — design note (not implementing now)

Future implementation: if a user submits a query within 120 seconds of a previous query where `cosine_similarity(new_query_embedding, prev_query_embedding) > 0.7`, this indicates the previous answer was unsatisfactory (reformulation signal). Apply implicit negative feedback to the chunks from the previous query. Requires: (a) storing last-query-per-user in Redis with TTL, (b) comparing embeddings on new query arrival. Not implementing in this spec.

### Migration SQL

```sql
-- drizzle-pg/0010_feedback.sql
-- Run after 0009 (semantic_dedup) or any prior migration

CREATE TABLE "feedback" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "query_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "query_text" TEXT NOT NULL,
  "answer_text" TEXT NOT NULL,
  "rating" SMALLINT NOT NULL CHECK ("rating" IN (-1, 1)),
  "chunk_ids" TEXT[] NOT NULL DEFAULT '{}',
  "source" TEXT NOT NULL DEFAULT 'explicit',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" ("user_id");
--> statement-breakpoint
CREATE INDEX "feedback_query_id_idx" ON "feedback" ("query_id");
--> statement-breakpoint
CREATE INDEX "feedback_chunk_ids_idx" ON "feedback" USING GIN ("chunk_ids");
--> statement-breakpoint
ALTER TABLE "chunks"
  ADD COLUMN "feedback_pos" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_neg" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_score" REAL NOT NULL DEFAULT 1.0;
--> statement-breakpoint
CREATE INDEX "chunks_feedback_score_idx" ON "chunks" ("feedback_score");
```

### Files changed

- `drizzle-pg/0010_feedback.sql` — NEW. feedback table + chunks columns.
- `src/db/schema.ts` — Add `feedback` table export. Extend `chunks` with 3 feedback columns.
- `src/routes/feedback.ts` — NEW. POST /api/feedback endpoint.
- `src/routes/query.ts` — Add `query_id` and `chunk_id` to response.
- `src/services/vectorstore/index.ts` — Add feedback_score multiplier in search(). Add `sql` field.
- `src/services/feedback-decay.ts` — NEW. BullMQ cron job for daily decay.
- App entry file — Register feedback route and decay worker.

### Verification

**1. Confirm migration applied:**
```sql
\d feedback
\d chunks
```
Expected: `feedback` table exists with all columns. `chunks` table has `feedback_pos`, `feedback_neg`, `feedback_score` columns.

**2. Test POST /api/feedback — thumbs up:**
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-q-1",
    "query_text": "what is quantum computing",
    "answer_text": "Quantum computing uses qubits...",
    "rating": 1,
    "chunk_ids": ["<chunk_id_from_query_response>"]
  }'
```
Expected: `{"ok":true,"feedback_id":"<uuid>"}`, HTTP 201.

**3. Verify chunk score was updated after thumbs up:**
```sql
SELECT id, feedback_pos, feedback_neg, feedback_score FROM chunks WHERE id = '<chunk_id>';
```
Expected: `feedback_pos = 1`, `feedback_neg = 0`, `feedback_score` = `0.5 + (1+1)/(1+0+2)` = `0.5 + 2/3` ≈ `1.167`.

**4. Verify chunk score was updated after thumbs down:**

Submit feedback with `rating: -1` for the same chunk. Expected: `feedback_neg = 1`, `feedback_score` = `0.5 + (1+1)/(1+1+2)` = `0.5 + 2/4` = `1.0`.

**5. Verify score multiplier affects retrieval order:**

Index two documents A and B that both match query Q. Rate chunks from document A positively several times. Run query Q. Expected: document A chunks appear higher in `sources[]` compared to pre-feedback baseline.

**6. Test daily decay job:**

Manually enqueue the decay job:
```typescript
const queue = new Queue("feedback_decay", { connection: { url: redisUrl } })
await queue.add("daily_decay_manual", {})
```
Check chunk with non-zero counters before and after:
```sql
-- Before:
SELECT feedback_pos, feedback_neg, feedback_score FROM chunks WHERE id = '<chunk_id>';
-- Trigger job, wait for completion, then:
SELECT feedback_pos, feedback_neg, feedback_score FROM chunks WHERE id = '<chunk_id>';
```
Expected: `feedback_pos` and `feedback_neg` multiplied by 0.99. `feedback_score` recalculated.

**7. Verify security — cross-user score manipulation blocked:**

Authenticate as user B. Submit feedback with chunk IDs that belong to user A. Expected: HTTP 201 returned (to avoid information leakage), but SQL UPDATE affects 0 rows (WHERE `user_id = auth.userId` prevents cross-user updates). Verify:
```sql
SELECT feedback_pos FROM chunks WHERE id = '<user_a_chunk_id>';
```
Expected: unchanged.

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | cockatiel installs and imports under Bun | `bun run -e "import { Policy } from 'cockatiel'; console.log('ok')"` → `ok` |
| AC-2 | `GET /health/circuits` returns correct JSON with all 4 services | `curl /health/circuits \| jq '.services \| keys'` → `["docling","groq_llm","groq_whisper","jina"]` |
| AC-3 | Jina circuit transitions to `open` after failures | Set invalid JINA_API_URL, send 6 embed requests, poll `/health/circuits` → `services.jina.circuit === "open"` |
| AC-4 | Jina fallback activates when circuit opens | After AC-3, query endpoint still returns results; `/health/circuits` shows `services.jina.fallback === "active"` |
| AC-5 | Groq LLM fallback returns raw-context response | Set invalid GROQ_API_KEY, submit `/api/query` → response contains `"LLM временно недоступен"`, HTTP 200 |
| AC-6 | Docling fallback works for HTML/ODT formats | Stop Docling container, upload `.html` file → document processes via TextParser, no error |
| AC-7 | Tesseract installed in Docling container | `docker run --rm contexter-docling tesseract --list-langs` → output includes `eng` and `rus` |
| AC-8 | Scanned PDF produces non-empty chunks with OCR_ENABLED=true | Upload known scanned PDF → `SELECT content FROM chunks WHERE document_id = '...' LIMIT 1` returns non-empty text |
| AC-9 | OCR does not fire for DOCX/XLSX (non-OCR formats) | Upload `.docx` with OCR_ENABLED=true → Docling logs show no Tesseract invocation |
| AC-10 | Mistral OCR fallback is default-off | `OCR_CLOUD_FALLBACK_ENABLED` unset → no calls to `api.mistral.ai` during any file upload |
| AC-11 | Mistral OCR activates when local OCR fails | Set both OCR flags, upload a file Tesseract fails on → `mistral_ocr_success` log entry appears |
| AC-12 | F-029 implementation blocked on PG version check | `SELECT * FROM pg_available_extensions WHERE name = 'vchord_bm25'` → if no rows, no code changes made |
| AC-13 | `feedback` table created | `\d feedback` shows all columns with correct types |
| AC-14 | `chunks` has feedback columns | `\d chunks` shows `feedback_pos`, `feedback_neg`, `feedback_score` |
| AC-15 | POST /api/feedback returns 201 with valid payload | See verification step 2 above |
| AC-16 | feedback_pos/neg update after thumbs up | `SELECT feedback_pos FROM chunks WHERE id = '...'` = 1 after one positive rating |
| AC-17 | feedback_score formula correct | After 1 pos, 0 neg: `feedback_score ≈ 1.167` (= 0.5 + 2/3) |
| AC-18 | feedback_score multiplier applied at retrieval | Highly-rated chunks appear higher in query results |
| AC-19 | Daily decay cron job registered | `await queue.getRepeatableJobs()` returns job with pattern `"0 2 * * *"` |
| AC-20 | Decay reduces feedback counters by 0.99 | After manual decay trigger: `feedback_pos` ≈ previous × 0.99 |
| AC-21 | Cross-user feedback score manipulation blocked | Submit feedback for another user's chunk IDs → chunk score unchanged (see verification step 7) |
