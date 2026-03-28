/**
 * F-025: NLI client — interface between Bun and the HHEM-2.1-Open sidecar.
 * Shared by F-025 (citation verification) and F-027 (faithfulness signal).
 * Gracefully degrades: all callers must handle null return from scorePairs().
 */

export interface NliPair {
  premise: string    // source chunk text
  hypothesis: string // claim to verify
}

export interface NliService {
  /**
   * Score each (premise, hypothesis) pair.
   * Returns scores[i] ∈ [0,1] — factual consistency probability.
   * Returns null if sidecar is unavailable or times out.
   */
  scorePairs(pairs: NliPair[]): Promise<number[] | null>
  /** True if sidecar health check passed within the last 30 seconds. */
  isAvailable(): boolean
}

const HEALTH_CACHE_MS = 30_000
const SCORE_TIMEOUT_MS = 5_000
const BATCH_CAP = 20
const NLI_THRESHOLD = 0.5

class NliServiceImpl implements NliService {
  private readonly baseUrl: string
  private readonly enabled: boolean
  private lastHealthCheck = 0
  private lastHealthResult = false
  private healthCheckInFlight: Promise<void> | null = null

  constructor(baseUrl: string, enabled: boolean) {
    this.baseUrl = baseUrl
    this.enabled = enabled
  }

  isAvailable(): boolean {
    if (!this.enabled) return false
    return this.lastHealthResult && (Date.now() - this.lastHealthCheck) < HEALTH_CACHE_MS
  }

  async scorePairs(pairs: NliPair[]): Promise<number[] | null> {
    if (!this.enabled) return null

    // Re-check health if cache is stale — dedup concurrent callers via in-flight promise
    if ((Date.now() - this.lastHealthCheck) >= HEALTH_CACHE_MS) {
      if (this.healthCheckInFlight !== null) {
        await this.healthCheckInFlight
      } else {
        this.healthCheckInFlight = this.checkHealth().finally(() => {
          this.healthCheckInFlight = null
        })
        await this.healthCheckInFlight
      }
    }

    if (!this.lastHealthResult) return null

    const batch = pairs.slice(0, BATCH_CAP)

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), SCORE_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch(`${this.baseUrl}/nli`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairs: batch }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      if (!response.ok) {
        console.warn("NLI sidecar returned non-OK status:", response.status)
        return null
      }

      const json = await response.json() as { scores?: unknown }
      if (!Array.isArray(json.scores)) {
        console.warn("NLI sidecar response missing scores array")
        return null
      }

      return json.scores as number[]
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError"
      if (isAbort) {
        console.warn("NLI sidecar timeout")
      } else {
        console.warn("NLI sidecar error:", err instanceof Error ? err.message : String(err))
      }
      this.lastHealthResult = false
      return null
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2_000)
      let response: Response
      try {
        response = await fetch(`${this.baseUrl}/health`, { signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      this.lastHealthResult = response.ok
    } catch {
      this.lastHealthResult = false
    }
    this.lastHealthCheck = Date.now()
  }
}

export const NLI_THRESHOLD_VALUE = NLI_THRESHOLD

export const nliService: NliService = new NliServiceImpl(
  process.env.NLI_SIDECAR_URL ?? "http://localhost:8765",
  (process.env.NLI_ENABLED ?? "true") !== "false"
)
