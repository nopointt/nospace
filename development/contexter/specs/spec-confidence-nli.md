# Spec: Confidence + NLI — F-025, F-026, F-027
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

---

## Stack context

Runtime: Bun on Hetzner CAX11 (ARM64, 4GB RAM, ~700 MB free headroom). API: Hono. LLM: Groq `llama-3.1-8b-instant`. Embeddings: Jina v4 1024-dim. DB: PostgreSQL 16 + pgvector. Queue: Redis + BullMQ.

Source root: `src/`. All paths in this spec are relative to `src/`.

**RAG pipeline today** (current `rag/index.ts`):
```
rewriteQuery → embedBatch → vectorStore.search (×3 variants) → sort by score → buildContext → generateAnswer
```
`RagAnswer` has: `answer`, `sources: RagSource[]`, `queryVariants`, `tokenUsage`. No citations, no confidence.

**RagSource** fields in scope for F-026: `score` (RRF-based, range ~0.003–0.066), `source: "vector"|"fts"|"both"`.

**`RRF_K = 60`** exported from `vectorstore/types.ts`. Theoretical max RRF score for a chunk ranked #1 in both lists: `2/(60+1) ≈ 0.0328`. Max for single-list rank #1: `1/(60+1) ≈ 0.0164`.

**F-007 dependency note:** F-026 Tier 1 uses Convex Combination (CC) scores when F-007 is live. CC scores are in `[0, 1]` so `maxFusionScore = 1.0`. Until F-007 is deployed, the implementation uses RRF normalization (`maxFusionScore = 2/61`). The code must branch on score range OR accept a config flag. See F-026 implementation section for the exact approach.

**NLI infrastructure:** A single `services/nli.ts` module is created for F-025 and reused by F-027. It is deployed once. F-025 and F-027 both import from this one file. F-026 does not use NLI.

---

## F-025: Inline citations — Tier 2 (NLI verification)

### Prerequisite

**F-004 (Citations Tier 1) must be implemented first.** F-025 verifies citations that F-004 produces. Without F-004, there are no `[N]` markers in the answer and no `citations[]` array to verify against.

F-004 adds to `rag/types.ts` (field names from spec-p0-p1):
```typescript
export interface CitationMapping {
  number: number          // The [N] reference in the answer (F-004 field name)
  sourceIndex: number     // 0-based index into sources[]
  chunkId: string         // The source chunk ID
  documentId: string      // The source document ID
}
```
And adds `citations: CitationMapping[]` to `RagAnswer`.

F-025 depends on both `citations` and `sources` from the F-004 output. If F-004 is not yet shipped, F-025 cannot be implemented. Do not implement F-025 without F-004.

### NLI model decision: HHEM-2.1-Open (chosen, not LettuceDetect)

**Decision: use HHEM-2.1-Open (vectara/hallucination_evaluation_model).**

Rationale for ARM64 4GB constraint:
- HHEM-2.1-Open is T5-base architecture, ~600 MB on disk, ~500–600 MB resident memory at inference time. On CAX11 with 700 MB headroom this fits by ~100 MB margin.
- LettuceDetect is ModernBERT-based (~600 MB), also fits. But LettuceDetect requires a GPU for its advertised 30–60 ex/sec throughput. On CPU (CAX11 has no GPU) it degrades to ~3–5 ex/sec which may violate the 3s p95 SLA for typical queries (5–10 claims × 1–3 sources = 5–30 NLI pairs).
- HHEM-2.1-Open is a cross-encoder: a single forward pass over `(premise=source_chunk, hypothesis=claim)` produces a factual consistency probability in [0,1]. On ARM64 CPU with T5-base, measured latency is ~1–1.5s per pair for 2K-token inputs. For 3 claims × 2 sources = 6 pairs, total ~6–9s — too slow inline.
- **Resolution:** Run NLI as an HTTP sidecar process (Python/FastAPI, port 8765, bind localhost only). The Bun process calls it via `fetch("http://localhost:8765/nli", ...)`. The sidecar loads the model once at startup and batches inference calls. With HHEM-2.1-Open and batching up to 8 pairs per call, latency drops to ~1.5–2s per batch on CAX11. This is within the 3s p95 budget for typical queries.
- HHEM-2.1-Open is Apache 2.0 licensed, production-ready, and already used in production by Vectara. LettuceDetect is MIT but younger (v0.1.7 at time of research).

**If NLI sidecar is unavailable at startup** (failed health check): F-025 disables itself gracefully, returns `citations` from F-004 unverified with `nliVerified: false` on each mapping.

### NLI sidecar: `services/nli-sidecar/server.py`

This is a new Python file alongside the Bun service. It is NOT inside `src/` — it lives at repo root level in `services/nli-sidecar/`. However the TypeScript interface to it lives at `src/services/nli.ts`.

**Sidecar contract:**
```
POST http://localhost:8765/nli
Content-Type: application/json

Request body:
{
  "pairs": [
    { "premise": "...", "hypothesis": "..." },
    ...
  ]
}

Response body:
{
  "scores": [0.87, 0.12, ...]   // float [0,1] per pair, same order as request
}
```

Health check: `GET http://localhost:8765/health` → `{ "status": "ok" }`.

The sidecar uses `transformers` + `torch` (CPU-only). Model loaded at startup: `vectara/hallucination_evaluation_model`. Inference: `pipeline("text-classification", model="vectara/hallucination_evaluation_model", device=-1)`. The HHEM model output label `"CONSISTENT"` maps to the score; `"INCONSISTENT"` maps to `1 - score`. See Vectara's official usage docs.

**Sidecar startup:** Added to `docker-compose.yml` (or process manager). The Bun service does NOT wait for the sidecar to start — it checks health on first NLI call and disables NLI if unhealthy.

### `src/services/nli.ts` — NLI client (shared by F-025 and F-027)

This module is the single interface between Bun and the NLI sidecar. Both F-025 and F-027 import from this file. It is deployed once.

```typescript
export interface NliPair {
  premise: string   // the source chunk text
  hypothesis: string // the claim or answer to verify
}

export interface NliService {
  /**
   * Score each (premise, hypothesis) pair.
   * Returns scores[i] ∈ [0,1] — factual consistency probability.
   * If sidecar is unavailable, returns null (caller must handle gracefully).
   */
  scorePairs(pairs: NliPair[]): Promise<number[] | null>
  /** Returns true if sidecar health check passed within the last 30s */
  isAvailable(): boolean
}
```

**Implementation details for `nli.ts`:**
- Sidecar URL: `NLI_SIDECAR_URL` env var, default `http://localhost:8765`.
- Health check: called once at startup, then cached for 30 seconds (lazy re-check on every `scorePairs` call if cache is stale).
- Timeout on `/nli` call: 5000ms (hardcoded). If timeout fires → return `null`, log `warn("NLI sidecar timeout")`.
- Batch cap: max 20 pairs per call (enforced by caller).
- No retries on failure — NLI is best-effort; failure degrades gracefully.
- Export a singleton: `export const nliService = new NliServiceImpl(process.env.NLI_SIDECAR_URL ?? "http://localhost:8765")`.

### Claim decomposition

Before NLI verification, the answer must be split into individual verifiable claims. Use sentence splitting:
```typescript
function splitIntoClaims(text: string): string[] {
  // Split on sentence boundaries. Strip the citation markers from each
  // claim before NLI (they are not part of the factual content).
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/\[(\d+)\]/g, "").trim())
    .filter(s => s.length > 10)  // skip very short fragments
}
```

This is a pure function in `rag/citations.ts` (alongside F-004's citation parser). Do not put it in `nli.ts`.

### Per-claim NLI verification

For each claim (sentence stripped of citation markers), verify it against the cited source(s). The cited source is known from `CitationMapping.sourceIndex`.

**Algorithm:**
```
For each CitationMapping cm in citations[]:
  source_chunk = sources[cm.sourceIndex].content
  // F-004's CitationMapping has no sentenceText field. Instead, extract the sentence
  // containing [N] from the answer text using a regex: find sentence around `[${cm.number}]`.
  claim_text = extractSentenceAroundCitation(answer, cm.number)
  pair = { premise: source_chunk, hypothesis: claim_text }

Collect all unique pairs (deduplicate if same claim cites multiple sources).
Call nliService.scorePairs(all_pairs) once (batched).
Map scores back to CitationMapping objects.
```

**CitationMapping extended (add to `rag/types.ts`):**
```typescript
export interface CitationMapping {
  number: number          // [N] marker from F-004
  sourceIndex: number
  chunkId: string
  documentId: string
  // Added by F-025:
  nliScore?: number       // [0,1] factual consistency, undefined if NLI unavailable
  nliVerified?: boolean   // true = score >= NLI_THRESHOLD (0.5 default)
}
```

**Faithfulness score** (returned in `RagAnswer`):
```typescript
faithfulnessScore = verified_citations / total_citations
// where verified = nliScore >= NLI_THRESHOLD
// If nli unavailable: faithfulnessScore = undefined
```

### Where in `rag/index.ts` to insert the verification pass

After `generateAnswer()` returns and after F-004's `parseCitations()` runs:

```typescript
// Existing (F-004 already added):
const { answer, promptTokens, completionTokens } = await this.generateAnswer(...)
const citations = parseCitations(answer, sources)

// F-025 adds:
const verifiedCitations = await this.verifyClaimsNli(citations, sources)
const faithfulnessScore = computeFaithfulnessScore(verifiedCitations)
```

`verifyClaimsNli` is a private method on `RagService`. It:
1. Checks `nliService.isAvailable()` — if false, returns citations unchanged with all `nliVerified = undefined`.
2. Builds pairs, calls `nliService.scorePairs()`.
3. If `scorePairs()` returns `null` (timeout/error) → return citations unchanged.
4. Attaches scores and boolean flags to each `CitationMapping`.

### Rollback trigger

If NLI sidecar p95 latency exceeds 3s (measured via Prometheus or log-based alerting): set `NLI_ENABLED=false` env var. When `false`, `nliService.scorePairs()` returns `null` immediately without making HTTP calls. The rest of the pipeline is unaffected.

### Files changed

| File | Change |
|---|---|
| `services/nli.ts` | NEW — NLI client, singleton export. Shared by F-025 and F-027. |
| `services/nli-sidecar/server.py` | NEW (outside `src/`) — Python HHEM inference server |
| `services/nli-sidecar/requirements.txt` | NEW — `transformers`, `torch` (CPU), `fastapi`, `uvicorn` |
| `rag/citations.ts` | EXTEND — add `splitIntoClaims()`, extend `CitationMapping` with NLI fields |
| `rag/types.ts` | EXTEND — `CitationMapping` NLI fields, `faithfulnessScore` on `RagAnswer` |
| `rag/index.ts` | EXTEND — add `verifyClaimsNli()` private method, call after `parseCitations()` |
| `docker-compose.yml` (repo root) | EXTEND — add `nli-sidecar` service |

### Verification

```bash
# 1. Sidecar health
curl http://localhost:8765/health
# Expected: {"status":"ok"}

# 2. Single NLI pair
curl -X POST http://localhost:8765/nli \
  -H "Content-Type: application/json" \
  -d '{"pairs":[{"premise":"The sky is blue.","hypothesis":"The sky is blue."}]}'
# Expected: {"scores":[0.9+]}  (high consistency)

curl -X POST http://localhost:8765/nli \
  -H "Content-Type: application/json" \
  -d '{"pairs":[{"premise":"The sky is blue.","hypothesis":"The sky is green."}]}'
# Expected: {"scores":[0.1-]}  (low consistency)

# 3. End-to-end: query with NLI_ENABLED=true
# POST /query with a question answerable from your KB.
# Expected response includes:
#   "citations": [{ "citationNumber":1, "nliScore":0.82, "nliVerified":true, ... }]
#   "faithfulnessScore": 0.85  (example)

# 4. Graceful degradation: kill sidecar, make query
# Expected response: citations present (from F-004) but nliScore/nliVerified absent,
#   faithfulnessScore absent. Answer still returned normally. No 500 error.

# 5. NLI_ENABLED=false: set env var, restart, make query
# Expected: NLI not called, no nliScore in citations, no faithfulnessScore.
```

---

## F-026: Confidence scoring — Tiers 1 + 2

### Prerequisite

**F-007 (Convex Combination fusion) should be deployed before F-026** so that source scores are in the `[0, 1]` range and carry magnitude information. Without F-007, scores are RRF-based (~0.003–0.066), which requires normalization by `2/RRF_K+1`.

The implementation handles both cases via a config flag. See the normalization approach in Tier 1 below.

F-026 does **not** depend on F-025 (NLI). Tiers 1 and 2 are retrieval-based and LLM-based respectively.

### Implementation

#### New file: `rag/confidence.ts`

This file is the single location for all confidence computation. Import from it in `rag/index.ts`. Do not spread confidence logic across multiple files.

**Types (add to `rag/types.ts`, not to `confidence.ts`):**

```typescript
export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient"

export interface ConfidenceSignals {
  retrievalScore: number      // Tier 1: normalized top score, [0,1]
  scoreEntropy: number        // Tier 1: normalized entropy, [0,1] — LOWER = more confident
  sourceAgreement: number     // Tier 1: fraction of sources found by both vector+FTS, [0,1]
  topScoreGap: number         // Tier 1: (score[0]-score[1])/score[0], [0,1]
  groundingScore?: number     // Tier 2: LLM self-assessment mapped to [0,1]
  faithfulnessScore?: number  // Tier 3: NLI faithfulness (F-027 populates this)
}

export interface ConfidenceResult {
  score: number               // composite [0,1]
  level: ConfidenceLevel
  signals: ConfidenceSignals
  abstentionReason?: string   // only when level === "insufficient"
}

// Extend RagAnswer:
export interface RagAnswer {
  answer: string
  sources: RagSource[]
  citations: CitationMapping[]       // from F-004
  faithfulnessScore?: number         // from F-025
  queryVariants: string[]
  tokenUsage: { embeddingTokens: number; llmPromptTokens: number; llmCompletionTokens: number }
  confidence: ConfidenceResult       // NEW — F-026
}
```

#### Tier 1: Retrieval Confidence — exact computation

**Step 1: normalize `retrievalScore`**

Determine the score range based on which fusion algorithm is active:

```typescript
// In confidence.ts:
const FUSION_MODE = process.env.FUSION_MODE ?? "rrf"  // "rrf" | "cc"
// RRF_K was 60 before F-007 replaced RRF with CC. Hardcode the constant
// to avoid import dependency on a removed export.
const RRF_K_LEGACY = 60
const MAX_FUSION_SCORE = FUSION_MODE === "cc" ? 1.0 : (2 / (RRF_K_LEGACY + 1))
// 2/61 ≈ 0.0328

function normalizeTopScore(score: number): number {
  return Math.min(score / MAX_FUSION_SCORE, 1.0)
}
```

`retrievalScore = normalizeTopScore(sources[0].score)`.

**Step 2: score entropy**

Given scores `s_0 >= s_1 >= ... >= s_{K-1}` from `sources`:

```typescript
function computeScoreEntropy(sources: RagSource[]): number {
  if (sources.length === 0) return 1.0  // maximum entropy = no confidence
  if (sources.length === 1) return 0.0  // single result, no distribution

  const scores = sources.map(s => s.score)
  const total = scores.reduce((a, b) => a + b, 0)
  if (total === 0) return 1.0

  const probs = scores.map(s => s / total)
  // Shannon entropy in bits
  const H = -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0)
  // Normalize by maximum possible entropy for K items = log2(K)
  const H_max = Math.log2(sources.length)
  return H_max > 0 ? H / H_max : 0.0
  // Result: 0 = one score dominates (confident), 1 = uniform distribution (not confident)
}
```

`scoreEntropy = computeScoreEntropy(sources)`.

The confidence contribution is `(1 - scoreEntropy)` — inverted because low entropy = high confidence.

**Step 3: source agreement**

```typescript
const bothCount = sources.filter(s => s.source === "both").length
const sourceAgreement = sources.length > 0 ? bothCount / sources.length : 0
```

**Step 4: top score gap**

```typescript
function computeTopScoreGap(sources: RagSource[]): number {
  if (sources.length === 0) return 0
  if (sources.length === 1) return 1.0  // no competitor, treat as max gap
  return (sources[0].score - sources[1].score) / sources[0].score
}
```

`topScoreGap = computeTopScoreGap(sources)`. If `sources[0].score === 0` → return `0`.

**Tier 1 composite:**

```
retrieval_confidence = 0.40 * retrievalScore
                     + 0.25 * (1 - scoreEntropy)
                     + 0.20 * sourceAgreement
                     + 0.15 * topScoreGap
```

Implemented as:
```typescript
export function computeTier1Confidence(sources: RagSource[]): number {
  if (sources.length === 0) return 0.0
  const retrievalScore = normalizeTopScore(sources[0].score)
  const scoreEntropy = computeScoreEntropy(sources)
  const sourceAgreement = sources.filter(s => s.source === "both").length / sources.length
  const topScoreGap = computeTopScoreGap(sources)
  return (
    0.40 * retrievalScore +
    0.25 * (1 - scoreEntropy) +
    0.20 * sourceAgreement +
    0.15 * topScoreGap
  )
}
```

#### Tier 2: LLM Generation Grounding

**Modify the system prompt** in `rag/types.ts` `DEFAULT_SYSTEM_PROMPT` (or pass an augmented prompt from `RagService`). The addition goes at the END of the system prompt:

```
[existing system prompt text...]

After your answer, output a JSON object on a new line (no markdown fences):
{"grounding":"high","supported_claims":N,"total_claims":N}

Where "grounding" must be one of:
- "high"   = every claim is directly stated in the provided sources
- "medium" = most claims are supported, some are inferred
- "low"    = significant inference required beyond sources
- "none"   = sources do not contain relevant information
N = integer count.
```

**Parsing the grounding field from LLM output:**

The LLM output will look like:
```
The system uses microservices [1]. Authentication is via OAuth 2.0 [2].
{"grounding":"high","supported_claims":2,"total_claims":2}
```

Parse with:
```typescript
function parseGroundingJson(rawAnswer: string): {
  answer: string
  groundingScore: number | undefined
} {
  // Find the last line that looks like a JSON object
  const lines = rawAnswer.split("\n")
  const lastLine = lines[lines.length - 1].trim()
  try {
    const parsed = JSON.parse(lastLine) as { grounding?: string }
    const map: Record<string, number> = { high: 1.0, medium: 0.7, low: 0.3, none: 0.0 }
    const groundingScore = parsed.grounding !== undefined ? (map[parsed.grounding] ?? undefined) : undefined
    // Remove the JSON line from the answer text
    const answer = lines.slice(0, lines.length - 1).join("\n").trimEnd()
    return { answer, groundingScore }
  } catch {
    // LLM didn't output the JSON — return raw answer, groundingScore undefined
    return { answer: rawAnswer, groundingScore: undefined }
  }
}
```

This function is in `rag/confidence.ts`. Call it inside `generateAnswer()` in `rag/index.ts` to strip the JSON tail before returning the answer string to callers.

**Tier 2 composite** (used when `groundingScore` is available):
```
composite_t2 = 0.60 * retrieval_confidence + 0.40 * grounding_score
```

This is the formula when only Tier 1 and Tier 2 are active (no NLI). When F-027 provides `faithfulnessScore`, the formula changes (see F-027).

#### Composite score assembly (in `confidence.ts`)

```typescript
export function assembleConfidence(
  sources: RagSource[],
  groundingScore?: number,
  faithfulnessScore?: number
): ConfidenceResult {
  const t1 = computeTier1Confidence(sources)
  const signals: ConfidenceSignals = {
    retrievalScore: normalizeTopScore(sources.length > 0 ? sources[0].score : 0),
    scoreEntropy: computeScoreEntropy(sources),
    sourceAgreement: sources.length > 0
      ? sources.filter(s => s.source === "both").length / sources.length : 0,
    topScoreGap: computeTopScoreGap(sources),
    groundingScore,
    faithfulnessScore,
  }

  let score: number
  if (faithfulnessScore !== undefined && groundingScore !== undefined) {
    // Tier 3 active: F-027 formula
    score = 0.30 * t1 + 0.20 * groundingScore + 0.50 * faithfulnessScore
  } else if (groundingScore !== undefined) {
    // Tier 2 active
    score = 0.60 * t1 + 0.40 * groundingScore
  } else {
    // Tier 1 only
    score = t1
  }

  // Abstention overrides (order matters — check hard overrides first)
  let level: ConfidenceLevel
  let abstentionReason: string | undefined

  if (sources.length === 0) {
    return {
      score: 0,
      level: "insufficient",
      signals,
      abstentionReason: "No relevant sources found in knowledge base.",
    }
  }
  if (signals.retrievalScore < 0.1) {
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "Top retrieval score below minimum threshold.",
    }
  }
  if (groundingScore === 0.0) {
    // LLM rated grounding as "none"
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "LLM self-assessment: context does not contain relevant information.",
    }
  }
  if (faithfulnessScore !== undefined && faithfulnessScore < 0.2) {
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "NLI faithfulness score below minimum threshold.",
    }
  }

  // Normal threshold classification (from the implementation plan)
  if (score >= 0.7) level = "high"
  else if (score >= 0.4) level = "medium"
  else if (score >= 0.2) level = "low"
  else {
    level = "insufficient"
    abstentionReason = "Composite confidence score below abstention threshold."
  }

  return { score, level, signals, abstentionReason }
}
```

**Thresholds summary:**
| Score | Level |
|---|---|
| >= 0.7 | high |
| 0.4 – 0.69 | medium |
| 0.2 – 0.39 | low |
| < 0.2 | insufficient (abstain) |

#### Abstention behavior — what the API returns

When `level === "insufficient"`, the HTTP response is:

```
HTTP 200 OK   ← NOT 4xx, NOT 5xx — the server succeeded
Content-Type: application/json

{
  "answer": "I don't have enough information to answer this reliably.",
  "sources": [],
  "citations": [],
  "queryVariants": [...],
  "usage": { ... },
  "confidence": {
    "score": 0.07,
    "level": "insufficient",
    "signals": { ... },
    "abstentionReason": "No relevant sources found in knowledge base."
  }
}
```

Key decisions:
- **HTTP 200, not 404/422**: the RAG pipeline ran successfully; the result is a valid (low-confidence) response. Returning 4xx would cause clients to treat this as a request error, not an answer.
- **Answer text is fixed**: always `"I don't have enough information to answer this reliably."` — do not use the LLM-generated answer (if one exists) when confidence is insufficient. Replace it.
- **Sources is empty array** in the response: do not expose low-quality sources when abstaining.
- **confidence block is always present** (even on abstention) so the caller knows why.

The substitution of the answer text happens in `rag/index.ts` after `assembleConfidence()` returns `"insufficient"`. The LLM-generated answer text is discarded; the fixed string is used instead.

#### Integration point in `rag/index.ts`

After `generateAnswer()` and after F-004/F-025 citation processing:

```typescript
// Parse grounding JSON from raw LLM output (modifies answer string)
const { answer: cleanAnswer, groundingScore } = parseGroundingJson(rawAnswer)

// Assemble confidence (faithfulnessScore comes from F-025/F-027 — undefined until F-027)
const confidence = assembleConfidence(sources, groundingScore, undefined)

// Abstention: replace answer if insufficient
const finalAnswer = confidence.level === "insufficient"
  ? "I don't have enough information to answer this reliably."
  : cleanAnswer

return {
  answer: finalAnswer,
  sources: confidence.level === "insufficient" ? [] : sources,
  citations: confidence.level === "insufficient" ? [] : citations,
  confidence,
  queryVariants,
  tokenUsage: { ... },
}
```

Also update `routes/query.ts` to pass `confidence` through to the JSON response:
```typescript
return c.json({
  answer: result.answer,
  sources: filteredSources.map(...),
  citations: result.citations,
  queryVariants: result.queryVariants,
  usage: result.tokenUsage,
  confidence: result.confidence,   // NEW
})
```

### Files changed

| File | Change |
|---|---|
| `rag/confidence.ts` | NEW — all Tier 1+2+3 confidence computation, `assembleConfidence()` |
| `rag/types.ts` | EXTEND — `ConfidenceLevel`, `ConfidenceSignals`, `ConfidenceResult`, `RagAnswer.confidence` |
| `rag/index.ts` | EXTEND — call `parseGroundingJson()`, call `assembleConfidence()`, abstention logic |
| `routes/query.ts` | EXTEND — pass `confidence` in JSON response |

### Verification

```bash
# 1. Tier 1 only: query with sources in KB, check confidence signals
# POST /query {"query": "...answerable question..."}
# Expected response includes:
#   "confidence": {
#     "score": 0.45-0.85,  (depends on KB match quality)
#     "level": "medium" or "high",
#     "signals": {
#       "retrievalScore": <non-zero>,
#       "scoreEntropy": <0-1>,
#       "sourceAgreement": <0-1>,
#       "topScoreGap": <0-1>
#     }
#   }

# 2. Tier 2: confirm groundingScore appears in signals
# The "signals" object should include "groundingScore": 0.7 or 1.0 (for typical answerable queries)

# 3. Abstention — empty KB
# Create a fresh user with no documents, POST /query
# Expected:
#   HTTP 200
#   "answer": "I don't have enough information to answer this reliably."
#   "sources": []
#   "confidence": { "level": "insufficient", "abstentionReason": "No relevant sources found..." }

# 4. Abstention — irrelevant query
# Upload a document about Topic A. Ask about Topic B (completely unrelated).
# Expected:
#   "confidence.level": "insufficient" or "low"
#   "answer": fixed abstention string or low-confidence answer

# 5. Unit check: entropy formula
# node -e "
#   const scores = [0.03, 0.01, 0.01];
#   const total = scores.reduce((a,b)=>a+b,0);
#   const probs = scores.map(s=>s/total);
#   const H = -probs.reduce((acc,p)=>acc+(p>0?p*Math.log2(p):0),0);
#   const Hmax = Math.log2(scores.length);
#   console.log('entropy:', H/Hmax);  // expect ~0.78 (non-uniform)
# "
```

---

## F-027: Confidence scoring — Tier 3 (NLI faithfulness)

### Prerequisite

1. **F-025 must be deployed first**: F-027 reuses `services/nli.ts` (the NLI sidecar client) from F-025. Without it, there is no NLI infrastructure to call.
2. **F-026 (Tier 1 + 2) must be deployed first**: F-027 extends `assembleConfidence()` in `confidence.ts`. The function signature changes to accept `faithfulnessScore` (already reserved as an optional parameter in the F-026 spec above).

If both prerequisites are met, F-027 is a 0.5-day effort (the infrastructure already exists).

### Recommendation: Option A (HHEM from F-025 directly)

**Decision: use Option A — HHEM from F-025's `services/nli.ts`.**

Rationale:
- Option B (second Groq call as NLI judge) adds ~500ms–1s latency and costs extra tokens. For CAX11 with the NLI sidecar already running, Option A is faster and cheaper.
- HHEM-2.1-Open is specifically designed for factual consistency scoring (premise = source, hypothesis = answer). Its scores are well-calibrated for this task.
- Option B (LLM-as-NLI) is unreliable: "verbalized confidence uses a nearly orthogonal neural pathway from actual calibration" (Closing the Confidence-Faithfulness Gap, 2025). LLM self-assessment as NLI adds noise rather than signal.
- Option A reuses existing sidecar with zero additional infrastructure cost. F-027 is purely additive code.

**When to prefer Option B:** If the NLI sidecar is disabled (`NLI_ENABLED=false` or sidecar down), Option B can serve as a fallback. Implement this as: if `nliService.isAvailable() === false` AND `FAITHFULNESS_LLM_FALLBACK=true` → use a second Groq call. This is optional; default is `FAITHFULNESS_LLM_FALLBACK=false`.

### How F-027 extends `confidence.ts`

F-027 adds one function to `confidence.ts`:

```typescript
/**
 * Compute NLI faithfulness score for Tier 3 confidence.
 * premise = concatenated source chunks (context used to generate the answer)
 * hypothesis = the generated answer
 * Returns [0,1] or undefined if NLI unavailable.
 */
export async function computeFaithfulnessNli(
  context: string,
  answer: string
): Promise<number | undefined> {
  if (!nliService.isAvailable()) return undefined

  // Single pair: context as premise, full answer as hypothesis.
  // For answers > 500 chars, truncate context to 1500 chars to stay within
  // T5-base 2K token limit (conservative estimate: 1 token ≈ 4 chars).
  const truncatedContext = context.slice(0, 1500)
  const truncatedAnswer = answer.slice(0, 500)

  const scores = await nliService.scorePairs([
    { premise: truncatedContext, hypothesis: truncatedAnswer }
  ])

  return scores?.[0]  // undefined if null returned
}
```

The import at the top of `confidence.ts`: `import { nliService } from "./nli"`. Wait — `nli.ts` is in `services/`, not in `rag/`. The correct import path from `rag/confidence.ts` is:
```typescript
import { nliService } from "../services/nli"
```

### Integration point in `rag/index.ts`

F-027 runs after `generateAnswer()`, after F-004's `parseCitations()`, after F-025's `verifyClaimsNli()`:

```typescript
// F-027: compute faithfulness NLI (uses same NLI sidecar as F-025)
const faithfulnessScore = await computeFaithfulnessNli(context, cleanAnswer)

// F-026: assemble full confidence (all three tiers when available)
const confidence = assembleConfidence(sources, groundingScore, faithfulnessScore)
```

The `context` variable is the string passed to `generateAnswer()` — it is already in scope in `RagService.query()`. Pass it out of `generateAnswer()` or capture it before the call.

### Tier 3 composite formula

From `assembleConfidence()` (already written in F-026 above, the branch for T3):

```
score = 0.30 * retrieval_confidence    ← Tier 1 composite
      + 0.20 * grounding_score         ← Tier 2 LLM self-assessment
      + 0.50 * faithfulness_score      ← Tier 3 NLI (highest weight)
```

Faithfulness weight is 0.50 because NLI faithfulness is the most reliable signal (LLM self-assessment is poorly calibrated per literature; retrieval scores lack LLM error information).

The abstention override `faithfulnessScore < 0.2` is already in `assembleConfidence()` from F-026.

### Files changed

| File | Change |
|---|---|
| `rag/confidence.ts` | EXTEND — add `computeFaithfulnessNli()`, import `nliService` from `../services/nli` |
| `rag/index.ts` | EXTEND — call `computeFaithfulnessNli(context, answer)`, pass to `assembleConfidence()` |
| `services/nli.ts` | NO CHANGE — already deployed for F-025, reused as-is |

### Verification

```bash
# 1. Faithfulness score present in response
# POST /query {"query": "...answerable question..."}
# Expected: "confidence.signals.faithfulnessScore": 0.6-0.95 (well-grounded answer)

# 2. Faithfulness on hallucination scenario
# Upload Doc A about Topic X. Ask a question where the answer requires Topic Y not in KB.
# Expected: "faithfulnessScore" lower than in test 1 (ideally < 0.4)

# 3. NLI sidecar down → graceful degradation
# Stop nli-sidecar, POST /query
# Expected:
#   "confidence.signals.faithfulnessScore": absent (undefined, not 0)
#   "confidence.score": computed from Tier 1+2 only (no T3 weight)
#   Answer still returned. No 500 error.

# 4. Abstention via faithfulness
# Construct a scenario where faithfulnessScore < 0.2 (e.g., answer is mostly hallucinated).
# Expected:
#   "confidence.level": "insufficient"
#   "confidence.abstentionReason": "NLI faithfulness score below minimum threshold."
#   "answer": "I don't have enough information to answer this reliably."

# 5. Context passed correctly
# Add debug log: console.log("context length for NLI:", context.length)
# Expected: context length matches the string built in buildContext() output
```

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | NLI sidecar starts, loads HHEM-2.1-Open, health check returns `{"status":"ok"}` | `curl http://localhost:8765/health` |
| AC-2 | `services/nli.ts` is a single file used by both F-025 and F-027 — no duplicate NLI client code | Grep for `nli-sidecar` calls — all must go through `nli.ts` |
| AC-3 | F-025: citations include `nliScore` and `nliVerified` fields when sidecar is up | POST /query, inspect response `citations[]` |
| AC-4 | F-025: sidecar down → `nliScore` absent, answer still returned, no 500 | Kill sidecar, POST /query |
| AC-5 | F-026 Tier 1: `confidence.signals` has all 4 fields with correct ranges | POST /query, verify each signal ∈ [0,1] |
| AC-6 | F-026: entropy formula correct — uniform scores → entropy ≈ 1.0, one dominant score → entropy ≈ 0 | Unit test with controlled score arrays |
| AC-7 | F-026 Tier 2: `groundingScore` present in signals when LLM output includes JSON line | POST /query with answerable question, check signals |
| AC-8 | F-026: empty KB → HTTP 200, `level: "insufficient"`, fixed answer string | POST /query with empty KB |
| AC-9 | F-026: `routes/query.ts` passes `confidence` field through to JSON response | POST /query, check top-level `confidence` key in response |
| AC-10 | F-027: `faithfulnessScore` present in `confidence.signals` when sidecar is up | POST /query, inspect `confidence.signals.faithfulnessScore` |
| AC-11 | F-027: T3 composite formula is `0.30*t1 + 0.20*grounding + 0.50*faithfulness` | Code review of `assembleConfidence()` branch |
| AC-12 | F-027: faithfulnessScore absent (not 0) when sidecar down — confidence uses T1+T2 formula | Kill sidecar, POST /query, verify `faithfulnessScore` is absent in signals |
| AC-13 | Rollback: `NLI_ENABLED=false` disables NLI for both F-025 and F-027 — zero sidecar calls | Set env var, restart, POST /query, confirm sidecar receives no requests |
| AC-14 | No duplicate NLI infrastructure — `services/nli.ts` deployed once, referenced twice | File count: exactly one `nli.ts` in `services/` |
