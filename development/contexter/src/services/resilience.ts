import {
  handleAll,
  retry,
  circuitBreaker,
  bulkhead,
  wrap,
  CircuitState,
  SamplingBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
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
function attachStateLogger(breaker: ReturnType<typeof circuitBreaker>, name: string): void {
  breaker.onStateChange((state) => {
    if (state === CircuitState.Open) {
      console.log(JSON.stringify({ event: "circuit_open", service: name }))
    } else if (state === CircuitState.Closed) {
      console.log(JSON.stringify({ event: "circuit_close", service: name }))
    } else if (state === CircuitState.HalfOpen) {
      console.log(JSON.stringify({ event: "circuit_half_open", service: name }))
    }
  })
}

// -------------------------------------------------------------------
// Jina Embeddings policy
// SamplingBreaker: opens when 50%+ of last 60s fail (min 5 rps).
// HalfOpen probe window: 30s. Timeout: 10s per request (at call site).
// Bulkhead: max 3 concurrent, queue up to 10.
// -------------------------------------------------------------------
const jinaBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 30_000,
  breaker: new SamplingBreaker({ threshold: 0.5, duration: 60_000, minimumRps: 5 }),
})
attachStateLogger(jinaBreaker, "jina")

const jinaRetry = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 1_000, maxDelay: 4_000 }),
})

const jinaBulkhead = bulkhead(3, 10)

export const jinaPolicy = wrap(jinaBulkhead, jinaRetry, jinaBreaker)

// -------------------------------------------------------------------
// Groq LLM policy
// SamplingBreaker: same parameters as Jina.
// Bulkhead: max 2 concurrent, queue up to 5.
// -------------------------------------------------------------------
const groqLlmBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 30_000,
  breaker: new SamplingBreaker({ threshold: 0.5, duration: 60_000, minimumRps: 5 }),
})
attachStateLogger(groqLlmBreaker, "groq_llm")

const groqLlmRetry = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 1_000, maxDelay: 4_000 }),
})

const groqLlmBulkhead = bulkhead(2, 5)

export const groqLlmPolicy = wrap(groqLlmBulkhead, groqLlmRetry, groqLlmBreaker)

// -------------------------------------------------------------------
// Groq Whisper policy
// ConsecutiveBreaker: opens after 3 consecutive failures.
// HalfOpen probe: 60s. Timeout applied at call site (120s).
// Bulkhead: max 1 concurrent, queue 3.
// -------------------------------------------------------------------
const groqWhisperBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 60_000,
  breaker: new ConsecutiveBreaker(3),
})
attachStateLogger(groqWhisperBreaker, "groq_whisper")

const groqWhisperRetry = retry(handleAll, {
  maxAttempts: 2,
  backoff: new ExponentialBackoff({ initialDelay: 2_000, maxDelay: 8_000 }),
})

const groqWhisperBulkhead = bulkhead(1, 3)

// TODO: wire groqWhisperPolicy into src/services/parsers/audio.ts and src/services/parsers/video.ts
export const groqWhisperPolicy = wrap(groqWhisperBulkhead, groqWhisperRetry, groqWhisperBreaker)

// -------------------------------------------------------------------
// Docling policy
// ConsecutiveBreaker: opens after 3 consecutive failures.
// HalfOpen probe: 60s. Timeout applied at call site (180s after F-023).
// Bulkhead: max 1 concurrent, queue 3.
// -------------------------------------------------------------------
const doclingBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 60_000,
  breaker: new ConsecutiveBreaker(3),
})
attachStateLogger(doclingBreaker, "docling")

const doclingRetry = retry(handleAll, {
  maxAttempts: 2,
  backoff: new ExponentialBackoff({ initialDelay: 2_000, maxDelay: 8_000 }),
})

const doclingBulkhead = bulkhead(1, 3)

// TODO: wire doclingPolicy into src/services/parsers/docling.ts
export const doclingPolicy = wrap(doclingBulkhead, doclingRetry, doclingBreaker)

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

function breakerToServiceState(
  breaker: ReturnType<typeof circuitBreaker>,
  fallbackActive: boolean
): ServiceCircuitState {
  const state = breaker.state
  const circuitStatus: CircuitStatus =
    state === CircuitState.Open || state === CircuitState.Isolated
      ? "open"
      : state === CircuitState.HalfOpen
        ? "halfOpen"
        : "closed"
  const status =
    circuitStatus === "closed" ? "ok" : circuitStatus === "halfOpen" ? "degraded" : "down"
  return { status, circuit: circuitStatus, fallback: fallbackActive ? "active" : "inactive" }
}

// Module-level fallback flags — set to true by the service when fallback is used
export let jinaFallbackActive = false
export let groqLlmFallbackActive = false

export function setJinaFallback(active: boolean): void {
  jinaFallbackActive = active
}

export function setGroqLlmFallback(active: boolean): void {
  groqLlmFallbackActive = active
}

export function getCircuitHealthSnapshot(): CircuitHealthSnapshot {
  return {
    jina: breakerToServiceState(jinaBreaker, jinaFallbackActive),
    groq_llm: breakerToServiceState(groqLlmBreaker, groqLlmFallbackActive),
    groq_whisper: breakerToServiceState(groqWhisperBreaker, false),
    docling: breakerToServiceState(doclingBreaker, false),
  }
}
