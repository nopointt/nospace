# Confidence Scoring for RAG — Deep Technology Research
> Feature: Answer Confidence Estimation for Contexter RAG
> Date: 2026-03-28
> Framework: [deep-research-framework.md](deep-research-framework.md)
> Status: Research complete, ready for implementation spec

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: Contexter RAG returns answers with source citations but zero confidence indication. Users receive an answer and a list of `RagSource[]` objects (each with `score`, `source` type, `content`), but no aggregate confidence signal.
- **How**: Hybrid search (pgvector cosine + PostgreSQL tsvector FTS) merged via Reciprocal Rank Fusion (RRF, k=60). Multi-query rewriting (3 variants). Context assembled by score-descending order within a 3000-token budget. LLM generates answer from context via system prompt.
- **Scores available but unused**:
  - Per-chunk RRF scores (range: ~0.003 to ~0.033 for single-source, ~0.006 to ~0.066 for dual-source "both")
  - Per-chunk raw cosine similarity (1 - cosine distance, range 0-1, available in vector search but discarded during RRF)
  - Per-chunk FTS ts_rank scores (range varies, also discarded during RRF)
  - Source type: "vector" | "fts" | "both" — strong signal (chunks found by both methods are more relevant)
- **Performance**: Latency ~2-5s total (query rewrite + embedding + search + LLM generation). Cost: ~1200 tokens per query (embedding) + ~1000-4000 tokens LLM.
- **Known issues**:
  - No confidence indicator at all — users cannot distinguish high-quality answers from guesses
  - RRF scores are rank-based, not calibrated probabilities — cannot be directly interpreted as confidence
  - System prompt says "if context doesn't contain enough information, say so clearly" but LLMs still hallucinate instead of abstaining
  - No threshold-based abstention mechanism
  - `scoreThreshold` (default 0.3) exists in vectorstore but is applied to RRF scores, which have a different scale

### 1.2 Metrics (measure before improving)

- **Baseline accuracy**: Unknown — no evaluation dataset exists yet
- **Baseline latency**: p50 ~2s, p95 ~4s, p99 ~6s (estimated)
- **Baseline cost**: ~$0.002-0.005 per query (Groq/NIM inference)
- **User complaints**: "I don't know if this answer is reliable" — the core motivation for this research
- **Abstention rate**: 0% (model never explicitly refuses, even on impossible questions)
- **Hallucination rate**: Unknown but estimated 10-20% based on industry norms for small-KB RAG

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

The industry standard for RAG confidence scoring in 2025-2026 is a **multi-signal composite score** combining:

1. **Retrieval confidence** — aggregated relevance scores from top-K results
2. **Generation faithfulness** — NLI-based or LLM-as-judge verification that the answer is grounded in context
3. **Abstention trigger** — explicit "I don't know" when confidence is below threshold

Key papers:
- "Sufficient Context: A New Lens on RAG Systems" (Google, ICLR 2025) — introduced context sufficiency classification as a first-class signal
- RAGAS framework (2023-2025) — standardized faithfulness = supported_claims / total_claims
- ConfRAG (Huang & Xu, 2025) — confidence-guided RAG triggering, reducing hallucination from 20-40% to <5%

### 2.2 Top 3 implementations

| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| **Google "Sufficient Context" (ICLR 2025)** | Binary classifier: is retrieved context sufficient to answer? Combined with LLM self-rated confidence for selective generation | +2-10% correct answer fraction among non-abstained responses across Gemini/GPT/Gemma | Context sufficiency is orthogonal to answer confidence — both are needed |
| **RAGAS Faithfulness** | LLM extracts claims from answer, verifies each against context. Score = supported/total | Industry-standard metric, used by Confident AI, Langfuse, Datadog, Braintrust | Claim-level decomposition catches partial hallucinations that sentence-level misses |
| **Bayesian RAG (Frontiers, 2025)** | Monte Carlo Dropout on embeddings, uncertainty-aware scoring: S = mu - lambda * sigma | +22.7% MRR, +25.4% NDCG@10 over BM25 on financial docs | Embedding uncertainty directly in retrieval scoring > post-hoc recalibration |

### 2.3 Standard configuration

**Recommended defaults from literature:**
- Retrieval confidence threshold: 0.3-0.5 (cosine similarity), varies by embedding model
- Faithfulness threshold: 0.7 (RAGAS standard — below this, answer is likely unfaithful)
- Abstention threshold: combined signal < 0.4 triggers "I don't know"
- Top-K for confidence estimation: use all K results, not just top-1

**Common pitfalls:**
- Using raw RRF scores as confidence (they are rank-based, not probabilities)
- Trusting LLM self-reported confidence (verbalized confidence uses a separate, nearly orthogonal direction from actual calibration — Closing the Confidence-Faithfulness Gap, 2025)
- Applying a single threshold across all query types (factual vs. analytical vs. opinion)
- Over-abstaining on valid queries (worse UX than occasional low-confidence answers)

**Migration path from current state:**
- Phase 1 (low cost): Retrieval score aggregation + simple heuristics (~2 hours)
- Phase 2 (medium cost): LLM self-assessment via structured output (~4 hours)
- Phase 3 (high cost): NLI-based faithfulness verification (~1-2 days)

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from last 12 months)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **ConfRAG** (Huang & Xu) | 2025-06 | Train LLM to say "I am unsure" via ConfQA fine-tuning; trigger RAG only when unsure | Research, code available | High — but requires fine-tuned model, not applicable to API-only LLMs |
| **Semantic Entropy Probes** (Farquhar et al.) | 2024-06, updated 2025 | Lightweight linear probes on hidden states detect hallucination without sampling | Research → production | Low for us — requires white-box model access |
| **Semantic Energy** | 2025-08 | Improves on semantic entropy for failure cases; uses energy-based model for uncertainty | Research | Medium — applicable if we switch to self-hosted LLM |
| **HALT-RAG** | 2025-09 | Combines NLI + lexical signals in a meta-classifier, calibrated and task-adapted | Research | High — lightweight, calibrated, combines signals we already have |
| **Beyond Semantic Entropy** (ACL 2025) | 2025-06 | Pairwise semantic similarity between multiple generations; captures intra/inter-cluster spread | Research | Medium — requires multiple LLM generations (costly) |
| **FaithJudge** (EMNLP Industry 2025) | 2025-05 | LLM-as-judge with diverse human-annotated hallucination examples | Production | Medium — LLM call overhead |
| **HaluGate** (vLLM, 2025-12) | 2025-12 | Token-level real-time hallucination detection during generation, 76-162ms overhead | Production, vLLM integration | Low — requires vLLM runtime, token-level access |
| **DACA** (ICLR 2025) | 2025 | Data-Adaptive Calibration Adjustment; reduces ECE from 23.68% to 8.60% on MMLU | Research | Low — requires access to logits |
| **Bayesian RAG** (Frontiers, 2025) | 2025 | MC Dropout on embeddings for retrieval uncertainty quantification | Research with code | Medium — requires custom embedding inference (not API-compatible) |

### 3.2 Open questions in the field

- **Verbalized vs. internal calibration**: LLMs encode proper calibration internally but verbalized confidence uses a separate neural pathway (Closing the Confidence-Faithfulness Gap, 2025). No reliable way to extract internal calibration via prompting alone.
- **Calibration across domains**: Confidence thresholds trained on one domain (e.g., medical) don't transfer to another (e.g., legal). Per-domain calibration remains unsolved for production systems.
- **Multi-step reasoning confidence**: Current methods estimate confidence for single-hop QA. For multi-hop reasoning over multiple chunks, confidence propagation is poorly understood.
- **Confidence in absence**: Detecting "the KB genuinely doesn't contain this information" vs. "retrieval failed to find it" is fundamentally different but looks the same to the system.

### 3.3 Bets worth making

- **HALT-RAG-style meta-classifier**: Combine our existing retrieval signals (RRF scores, source overlap, score distribution) with a lightweight NLI check. Low cost, high signal.
- **Sufficient Context classification**: A single LLM call to classify "is this context sufficient?" before generating the answer. Google's ICLR 2025 paper shows this is the highest-leverage intervention.
- **Structured confidence output**: Instead of asking "how confident are you?" (unreliable), ask the LLM to output a structured JSON with the answer AND a list of which claims are directly supported by which sources. Implicit confidence through citation density.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Medical diagnostics** | Is this test result reliable enough to act on? | Sensitivity/specificity trade-off, likelihood ratios, pre-test probability | Use likelihood ratios instead of raw scores: P(relevant\|score) vs P(irrelevant\|score) |
| **Weather forecasting** | How confident is this forecast? | Calibrated probability (e.g., "70% chance of rain" means it rains 70% of the time when they say this) | Calibrate our confidence scores empirically: when we say 80%, it should be right 80% of the time |
| **Criminal justice** | Beyond reasonable doubt vs. preponderance of evidence | Different confidence thresholds for different decision severity | Use tiered thresholds: low-stakes queries get answers at lower confidence; high-stakes get abstention |
| **Manufacturing QC** | Is this part within tolerance? | Six Sigma: measure process capability (Cpk), not individual measurements | Track confidence distribution over time, not per-query; alert when mean confidence drops |
| **Jury systems** | How much evidence is enough? | Unanimous vs. majority verdicts; weight of evidence | "Unanimous" (all top-K chunks agree) vs "majority" (most agree) as confidence tiers |

### 4.2 Biomimicry / Nature-inspired

- **Neural confidence in the brain**: The brain uses two parallel systems — fast intuitive (System 1) and slow deliberative (System 2). When System 1 confidence is low, System 2 is engaged. Analogy: retrieval score = System 1; LLM verification = System 2. Only invoke the expensive System 2 when System 1 confidence is below threshold.
- **Swarm intelligence**: Bees use "waggle dance" intensity to signal confidence in food source quality. Multiple scouts visiting the same location increase group confidence. Analogy: multiple query rewrites finding the same chunks = higher confidence (already have this signal — chunks with source="both").

### 4.3 Engineering disciplines

- **Signal Detection Theory (SDT)**: The classic framework for separating signal from noise in uncertain decisions. Key concepts directly applicable:
  - **d' (d-prime)**: Measures how well we can distinguish relevant from irrelevant results. The separation between our "relevant chunk" score distribution and "irrelevant chunk" score distribution, in standard deviations. Higher d' = better discrimination = more reliable confidence.
  - **ROC curve**: Plot hit rate (correct confident answers) vs. false alarm rate (confident but wrong answers) as we sweep our confidence threshold. The optimal threshold depends on the cost ratio of false confidence vs. unnecessary abstention.
  - **Criterion (beta)**: The decision boundary. Conservative criterion = fewer false alarms but more misses (more abstention). Liberal criterion = more hits but more false alarms (more hallucination).
  - **Application**: We can empirically measure d' for our system using a labeled evaluation set, then set the criterion optimally for our use case.

- **Information theory**:
  - **Entropy of score distribution**: If all top-K chunks have similar scores, entropy is high = low confidence (ambiguous retrieval). If one chunk dominates, entropy is low = high confidence (clear winner).
  - **Mutual information between query and top chunk**: How much knowing the query reduces uncertainty about the best chunk. Low MI = query is vague or out-of-domain.

- **Control systems**:
  - **PID feedback**: Track confidence accuracy over time. If actual accuracy diverges from reported confidence, adjust thresholds (integral term). If confidence is volatile, add dampening (derivative term).
  - **Kalman filtering**: Maintain a running estimate of "true confidence" by fusing noisy retrieval scores with noisy LLM self-assessment, weighting each by their estimated reliability.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

**What math we use:**
- Cosine similarity: `1 - (embedding <=> query_embedding)` via pgvector. Range [0, 1] for normalized vectors.
- BM25-style FTS: `ts_rank(tsv, plainto_tsquery(...))`. Range [0, ~1] but not calibrated.
- RRF fusion: `score = sum(1 / (k + rank + 1))` across vector and FTS lists. k=60.

**Assumptions:**
- Higher cosine similarity = more relevant (monotonic but not calibrated)
- Rank correlation between vector and FTS results is meaningful (chunks found by both are better)
- RRF is scale-invariant (by design — operates on ranks, not scores)

**Where assumptions break:**
- RRF discards magnitude information. A chunk with cosine=0.95 and another with cosine=0.5 both ranked #1 and #2 get the same RRF contribution. We lose the "how much better" signal.
- Small knowledge bases: with <100 chunks, rank-based scoring has low resolution. Rank #1 out of 5 is very different from rank #1 out of 10,000.
- FTS ts_rank is not comparable across queries of different lengths. A 2-word query and a 10-word query produce incomparable ts_rank values.

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| **Platt scaling on raw cosine scores** | ML calibration | Converts cosine similarity to calibrated probability P(relevant\|score) | O(1) per query after one-time logistic regression fit | Platt (1999), Niculescu-Mizil & Caruana (2005) |
| **Beta calibration** | Probabilistic forecasting | Better than Platt for scores in [0,1]; handles asymmetric distributions | O(1) per query, 3-parameter fit | Kull et al. (2017) |
| **Isotonic regression** | Nonparametric statistics | No distributional assumptions; piecewise-linear calibration | O(n log n) fit, O(log n) per query | Zadrozny & Elkan (2002) |
| **Monte Carlo Dropout** | Bayesian deep learning | Principled uncertainty via multiple stochastic forward passes | O(T * inference) where T = number of passes | Gal & Ghahramani (2016), Bayesian RAG (2025) |
| **Score distribution entropy** | Information theory | Zero-cost confidence signal from existing scores | O(K) per query | Novel application |

### 5.3 Optimization opportunities

**Current bottleneck:** RRF scores are dimensionless rank-based numbers with no probabilistic interpretation. The maximum possible RRF score for a chunk found at rank 1 in both lists is `1/(60+1) + 1/(60+1) = 0.0328`. The minimum for a chunk at rank 20 in one list only is `1/(60+21) = 0.0123`. This 2.7x range is too compressed for reliable confidence estimation.

**Better objective function:** Instead of optimizing for rank-based fusion, we should preserve and combine the original score magnitudes. A confidence-aware scoring function:

```
confidence_retrieval = w_cos * calibrate(max_cosine)
                     + w_spread * (1 - normalized_entropy(top_K_cosines))
                     + w_agreement * agreement_bonus(source_types)
```

Where:
- `calibrate(score)` = Platt-scaled cosine similarity to [0,1] probability
- `normalized_entropy` = entropy of score distribution / log(K), range [0,1]
- `agreement_bonus` = fraction of top-K chunks found by both vector AND fts

**Approximation tricks:** None needed — all these computations are O(K) and add <1ms to query time.

### 5.4 Information-theoretic analysis

**Score distribution entropy as confidence signal:**

Given top-K retrieval scores s_1 >= s_2 >= ... >= s_K, normalize to a probability distribution:
```
p_i = s_i / sum(s_j)
H = -sum(p_i * log(p_i))
H_max = log(K)
H_normalized = H / H_max  (range [0, 1])
```

- **H_normalized near 0**: One chunk dominates — clear, confident retrieval
- **H_normalized near 1**: Scores uniformly distributed — ambiguous, low confidence

This is a **zero-cost** signal — we already have the scores, just need to compute entropy.

**Score gap analysis:**
```
gap_ratio = (s_1 - s_2) / s_1
```
- Large gap = clear top result = higher confidence
- Small gap = top results are interchangeable = lower confidence

### 5.5 Linear algebra / geometry insights

**Cosine similarity distribution:** For high-dimensional embedding spaces (1024-dim in our case), random vectors have cosine similarity concentrated near 0 (by the curse of dimensionality). Relevant results typically score 0.3-0.8, while irrelevant ones score 0.0-0.3. The separation between these distributions (d' in SDT terms) determines how well we can set a confidence threshold.

**Cluster structure:** If top-K results form a tight cluster in embedding space (low intra-cluster variance), the query is well-matched to a coherent knowledge region = higher confidence. If they scatter (high variance), the query hits different topics = lower confidence. Measurable as:
```
coherence = 1 - mean(pairwise_cosine_distance(top_K_embeddings))
```

This is O(K^2) but with K=10, it's only 45 pairwise comparisons — negligible cost.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Three-Tier Confidence Scoring

**What:** A composite confidence score built from three tiers of signals, each adding accuracy at increasing cost. Only Tier 1 is mandatory; Tier 2 and 3 are activated based on use case requirements.

**Tier 1 — Retrieval Confidence (zero additional cost)**
Computed from existing retrieval scores. No extra API calls.

**Tier 2 — Generation Grounding (one extra structured output field)**
LLM self-assessment via structured output during the existing generation call. ~50 extra tokens.

**Tier 3 — NLI Faithfulness Verification (one extra lightweight model call)**
Post-generation check via HHEM or NLI model. ~100ms, ~$0.001 per query.

**Why this approach:**
- Layer 2: Matches industry standard (RAGAS-style faithfulness + retrieval metrics)
- Layer 3: ConfRAG and Sufficient Context papers show the highest leverage is in knowing WHEN context is sufficient
- Layer 4: Signal Detection Theory framework — set criterion based on cost ratio of false confidence vs. unnecessary abstention
- Layer 5: Score distribution entropy is a mathematically sound, zero-cost confidence signal

**Expected impact:**
- Users gain ability to distinguish reliable answers from guesses
- Abstention on truly unanswerable queries (estimated 10-15% of queries where KB lacks info)
- Reduced user trust erosion from hallucinated answers
- Foundation for future calibration loop (log confidence + user feedback -> improve thresholds)

**Cost:**
- Tier 1: Zero additional cost (computation from existing data)
- Tier 2: ~50 extra LLM output tokens per query (~$0.0001)
- Tier 3: ~100ms latency + ~$0.001 per query (HHEM model) OR ~200 extra LLM tokens (LLM-as-NLI)
- Implementation: ~8-16 hours total across all three tiers

**Risk:**
- Uncalibrated confidence is worse than no confidence (users may over-trust or under-trust)
- Must be validated empirically before shipping (need evaluation dataset)
- Threshold values below are starting points — must be tuned per knowledge base

### 6.2 Implementation spec

#### Input
```typescript
// Existing RagQuery — no changes needed
interface RagQuery {
  query: string
  userId?: string
  topK?: number
  scoreThreshold?: number
}
```

#### Output
```typescript
interface RagAnswer {
  answer: string
  sources: RagSource[]
  queryVariants: string[]
  tokenUsage: { ... }
  // NEW
  confidence: ConfidenceResult
}

interface ConfidenceResult {
  /** Composite score 0-1, calibrated to approximate P(answer is correct) */
  score: number
  /** Human-readable level for UI display */
  level: "high" | "medium" | "low" | "insufficient"
  /** Per-signal breakdown for debugging/logging */
  signals: {
    retrievalScore: number      // Tier 1: 0-1
    scoreEntropy: number        // Tier 1: 0-1 (lower = more confident)
    sourceAgreement: number     // Tier 1: 0-1
    topScoreGap: number         // Tier 1: 0-1
    groundingScore?: number     // Tier 2: 0-1 (LLM self-assessment)
    faithfulnessScore?: number  // Tier 3: 0-1 (NLI check)
  }
  /** If level is "insufficient", this explains why */
  abstentionReason?: string
}
```

#### Algorithm: Tier 1 — Retrieval Confidence

```
function computeRetrievalConfidence(sources: RagSource[]): Tier1Signals {
  if (sources.length === 0) {
    return { retrievalScore: 0, scoreEntropy: 1, sourceAgreement: 0, topScoreGap: 0 }
  }

  // 1. Max retrieval score (best single chunk relevance)
  //    For RRF scores: normalize to [0,1] by dividing by theoretical max
  //    Theoretical max RRF (rank 1 in both lists): 2 * 1/(k+1) = 2/61 ≈ 0.0328
  const maxRrfScore = 2 / (RRF_K + 1)
  const retrievalScore = clamp(sources[0].score / maxRrfScore, 0, 1)

  // 2. Score entropy (distribution concentration)
  const scores = sources.map(s => s.score)
  const total = scores.reduce((a, b) => a + b, 0)
  const probs = scores.map(s => s / total)
  const entropy = -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0)
  const maxEntropy = Math.log2(sources.length)
  const scoreEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1

  // 3. Source agreement (fraction of top-K found by both vector AND FTS)
  const bothCount = sources.filter(s => s.source === "both").length
  const sourceAgreement = bothCount / sources.length

  // 4. Top score gap (how much better is #1 than #2)
  const topScoreGap = sources.length >= 2
    ? (sources[0].score - sources[1].score) / sources[0].score
    : 1.0  // Only one result = no competition = max gap

  return { retrievalScore, scoreEntropy, sourceAgreement, topScoreGap }
}
```

**Tier 1 composite:**
```
retrieval_confidence = 0.40 * retrievalScore
                     + 0.25 * (1 - scoreEntropy)
                     + 0.20 * sourceAgreement
                     + 0.15 * topScoreGap
```

Weights rationale:
- retrievalScore (0.40): Strongest single signal — how well the best chunk matches
- 1 - scoreEntropy (0.25): Score concentration — is there a clear winner?
- sourceAgreement (0.20): Cross-modal validation — found by both semantic AND keyword
- topScoreGap (0.15): Decisiveness — is the top result clearly better?

#### Algorithm: Tier 2 — Generation Grounding

Modify the LLM system prompt to request structured confidence assessment:

```
SYSTEM PROMPT ADDITION:
After your answer, on a new line, output a JSON object:
{"grounding": "high" | "medium" | "low" | "none", "supported_claims": N, "total_claims": N}

Where:
- "high" = every claim in your answer is directly stated in the context
- "medium" = most claims are supported, some are inferred
- "low" = answer requires significant inference beyond the context
- "none" = context does not contain relevant information
```

Parse the JSON from LLM output. Map to score:
```
grounding_score = { "high": 1.0, "medium": 0.7, "low": 0.3, "none": 0.0 }
```

**Important caveat:** LLM self-assessment is known to be poorly calibrated (Closing the Confidence-Faithfulness Gap, 2025). Verbalized confidence uses a separate, nearly orthogonal direction from actual internal calibration. Use this as ONE signal among many, never as the sole confidence indicator. Weight it lower than retrieval signals.

#### Algorithm: Tier 3 — NLI Faithfulness (Optional)

Two options depending on infrastructure:

**Option A: HHEM (recommended for production)**
- Model: `vectara/hallucination_evaluation_model` (T5-base, 600MB, 1.5s on CPU for 2K tokens)
- Input: (premise=context, hypothesis=answer) pairs
- Output: factual consistency score [0, 1]
- Cost: self-hosted = fixed infra cost; API = ~$0.001/query
- Latency: ~100-200ms on GPU, ~1.5s on CPU

**Option B: LLM-as-NLI (simpler, API-only)**
- Use the same LLM in a second call:
  ```
  Given the CONTEXT and the ANSWER below, classify each sentence
  of the ANSWER as: SUPPORTED, PARTIALLY_SUPPORTED, or NOT_SUPPORTED.

  Context: {context}
  Answer: {answer}
  ```
- faithfulness_score = supported_sentences / total_sentences
- Cost: ~200-500 extra tokens (~$0.0005/query)
- Latency: ~500ms-1s additional

#### Algorithm: Composite Score

```
if (tier3_available) {
  composite = 0.30 * retrieval_confidence
            + 0.20 * grounding_score      // Tier 2
            + 0.50 * faithfulness_score   // Tier 3 (highest weight — most reliable)
} else if (tier2_available) {
  composite = 0.60 * retrieval_confidence
            + 0.40 * grounding_score      // Tier 2
} else {
  composite = retrieval_confidence        // Tier 1 only
}
```

#### Threshold Values (Starting Points)

| composite score | level | action |
|---|---|---|
| >= 0.75 | **high** | Show answer with green confidence indicator |
| 0.50 - 0.74 | **medium** | Show answer with yellow indicator, add "This answer may be incomplete" |
| 0.25 - 0.49 | **low** | Show answer with orange indicator, add "Low confidence — verify this information" |
| < 0.25 | **insufficient** | Replace answer with "I don't have enough information to answer this reliably" |

**Abstention triggers (override to "insufficient" regardless of score):**
- Zero retrieval results (sources.length === 0)
- Top retrieval score < 0.1 (normalized RRF)
- All chunks from a single document AND sourceAgreement === 0 (no cross-modal validation)
- Grounding self-assessment === "none" (Tier 2)
- Faithfulness score < 0.2 (Tier 3)

#### User-Facing Confidence Display

Based on UX research (AI Design Patterns, Smashing Magazine 2025, Agentic Design Patterns):

**Recommended format: Traffic-light badge + natural language modifier**

```
[HIGH]     ● Answer (well-supported)
[MEDIUM]   ● Answer (partially supported)
[LOW]      ● Answer (limited evidence)
[INSUFF]   ● "I don't have enough information to answer this reliably."
```

Design principles from UX research:
1. **Color + text** (never color alone — accessibility)
2. **Natural language over percentages** — "well-supported" is more actionable than "87%"
3. **Layered detail** — badge at surface, hover/expand for signal breakdown
4. **No false precision** — 4 levels (high/medium/low/insufficient) not 0-100%

Why NOT percentages:
- Users interpret "73% confident" as "73% chance of being correct" which is wrong unless calibrated
- Calibration requires a labeled dataset we don't have yet
- Bands (high/medium/low) are honest about our uncertainty about our uncertainty

Why NOT stars:
- Stars imply quality rating, not confidence
- 3-star = "mediocre" in user mental model, but medium confidence = "probably fine"
- Stars encourage gaming (optimizing for 5-star rather than honest assessment)

#### Config

```typescript
interface ConfidenceConfig {
  enabled: boolean              // default: true
  tier: 1 | 2 | 3              // default: 2
  thresholds: {
    high: number                // default: 0.75
    medium: number              // default: 0.50
    low: number                 // default: 0.25
  }
  weights: {
    retrievalScore: number      // default: 0.40
    scoreEntropy: number        // default: 0.25
    sourceAgreement: number     // default: 0.20
    topScoreGap: number         // default: 0.15
  }
  abstention: {
    minSources: number          // default: 1
    minTopScore: number         // default: 0.1
    minFaithfulness: number     // default: 0.2
  }
}
```

#### Fallback

If confidence computation fails (e.g., LLM doesn't return structured JSON for Tier 2):
- Fall back to Tier 1 only
- Log the failure for debugging
- Never block the answer due to confidence computation failure
- Confidence level defaults to "medium" with a flag indicating estimation was degraded

### 6.3 Validation plan

**How to measure improvement:**
1. Create a labeled evaluation set: 50-100 query-answer pairs with human-judged correctness labels
2. For each query, record: confidence score, confidence level, actual correctness
3. Compute:
   - **Calibration**: ECE (Expected Calibration Error) — is reported confidence close to actual accuracy?
   - **Discrimination**: AUROC — can the confidence score distinguish correct from incorrect answers?
   - **Abstention quality**: precision@abstention — when we say "I don't know", was the answer actually wrong?
   - **User trust**: A/B test — do users with confidence indicators report higher satisfaction?

**Minimum success criteria:**
- AUROC >= 0.70 (confidence score distinguishes correct/incorrect better than random)
- Abstention precision >= 0.80 (when we abstain, the answer would have been wrong >=80% of the time)
- User satisfaction +15% in A/B test (confidence indicator users vs. no-indicator users)

**Rollback trigger:**
- AUROC < 0.55 (confidence is nearly random — worse than showing nothing)
- False abstention rate > 20% (refusing to answer questions that have good answers)
- User satisfaction decreases (users distrust the confidence signals)

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Raw cosine similarity as confidence** | Not calibrated. 0.7 cosine doesn't mean 70% chance of correct answer. Score distribution varies by embedding model, query length, and KB size. |
| **LLM verbal confidence only ("I am 80% sure")** | Research shows verbalized confidence is nearly orthogonal to actual calibration (Closing the Confidence-Faithfulness Gap, 2025). Unreliable as sole signal. |
| **Multiple generation sampling (semantic entropy)** | Requires 5-10 LLM generations per query. 5-10x cost increase. Excessive for a lightweight RAG service. |
| **Monte Carlo Dropout on embeddings (Bayesian RAG)** | Requires custom embedding model with dropout layers. Not compatible with API-based embedding services (NIM, OpenAI). |
| **Full RAGAS evaluation per query** | RAGAS is designed for offline evaluation, not real-time. Requires multiple LLM calls per query (claim extraction + verification). Too expensive for production. |
| **Fine-tuned confidence classifier (ConfRAG-style)** | Requires fine-tuning a model specifically for confidence estimation. We use API-based LLMs without fine-tuning access. |
| **Single numeric percentage shown to user** | False precision. Without calibration data, "73%" is meaningless. Bands (high/medium/low) are more honest. |
| **Token-level probability monitoring (HaluGate)** | Requires access to token logprobs during generation. Not available with all LLM APIs. Runtime dependency on specific infrastructure. |

---

## Appendix A: RRF Score Ranges in Contexter

For reference, with k=60 and topK=10 (searching 20 per modality):

| Scenario | RRF Score | Normalized (0-1) |
|---|---|---|
| Rank 1 in both vector + FTS | 2/61 = 0.0328 | 1.00 |
| Rank 1 in one modality only | 1/61 = 0.0164 | 0.50 |
| Rank 5 in both | 2/66 = 0.0303 | 0.92 |
| Rank 10 in one only | 1/71 = 0.0141 | 0.43 |
| Rank 20 in one only | 1/81 = 0.0123 | 0.38 |

Normalization: divide by theoretical max (2/61).

## Appendix B: Implementation Priority

| Phase | What | Cost | Impact | Dependencies |
|---|---|---|---|---|
| **Phase 1** | Tier 1 retrieval confidence + confidence field in API response | ~2h dev | Medium — users see confidence levels | None |
| **Phase 2** | Tier 2 LLM grounding assessment (modify system prompt) | ~4h dev | High — catches answer-level issues Tier 1 misses | Phase 1 |
| **Phase 3** | User-facing display (badge + level text) | ~2h dev | High — users actually see the confidence | Phase 1 |
| **Phase 4** | Evaluation dataset + calibration | ~8h manual | Critical — validates everything | Phase 1-3 deployed |
| **Phase 5** | Tier 3 NLI faithfulness (HHEM or LLM-as-NLI) | ~8h dev | Medium — diminishing returns after Tier 1+2 | Phase 4 results |
| **Phase 6** | Threshold tuning based on evaluation data | ~4h | High — moves from guessed to calibrated thresholds | Phase 4 |

## Appendix C: Sources

### Papers
- Joren et al., "Sufficient Context: A New Lens on RAG Systems" (ICLR 2025) — [arxiv.org/abs/2411.06037](https://arxiv.org/abs/2411.06037)
- Huang & Xu, "ConfRAG: Confidence-Guided Retrieval-Augmenting Generation" (2025) — [arxiv.org/abs/2506.07309](https://arxiv.org/abs/2506.07309)
- "Closing the Confidence-Faithfulness Gap in Large Language Models" (2025) — [arxiv.org/html/2603.25052](https://arxiv.org/html/2603.25052)
- "Bayesian RAG: Uncertainty-Aware Retrieval for Reliable Financial QA" (Frontiers, 2025) — [frontiersin.org](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1668172/full)
- "From RAG to Reality: Coarse-Grained Hallucination Detection via NLI Fine-Tuning" (ACL 2025) — [aclanthology.org/2025.sdp-1.34](https://aclanthology.org/2025.sdp-1.34/)
- "Benchmarking LLM Faithfulness in RAG with Evolving Leaderboards" (EMNLP Industry 2025) — [aclanthology.org/2025.emnlp-industry.54](https://aclanthology.org/2025.emnlp-industry.54/)
- "Beyond Semantic Entropy: Boosting LLM Uncertainty Quantification" (ACL Findings 2025) — [arxiv.org/abs/2506.00245](https://arxiv.org/abs/2506.00245)
- "HALT-RAG: A Task-Adaptable Framework for Hallucination Detection" (2025) — [arxiv.org/pdf/2509.07475](https://arxiv.org/pdf/2509.07475)
- "Understanding the Impact of Confidence in RAG: Medical Domain" (2024) — [arxiv.org/abs/2412.20309](https://arxiv.org/abs/2412.20309)
- Ozaki et al., "Confidence-Calibrated RAG" (2025) — referenced in RAG survey [arxiv.org/html/2504.14891v1](https://arxiv.org/html/2504.14891v1)
- Farquhar et al., "Semantic Entropy Probes" (2024) — [arxiv.org/abs/2406.15927](https://arxiv.org/abs/2406.15927)
- "HaluGate: Token-Level Real-Time Hallucination Detection" (vLLM, 2025) — [blog.vllm.ai](https://blog.vllm.ai/2025/12/14/halugate.html)

### Frameworks & Tools
- RAGAS faithfulness metric — [docs.ragas.io](https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/faithfulness/)
- DeepEval faithfulness — [deepeval.com](https://deepeval.com/docs/metrics-faithfulness)
- Vectara HHEM-2.1-Open — [huggingface.co/vectara/hallucination_evaluation_model](https://huggingface.co/vectara/hallucination_evaluation_model)
- Google Sufficient Context code — [github.com/hljoren/sufficientcontext](https://github.com/hljoren/sufficientcontext)

### UX & Design
- "Confidence Visualization" AI Design Pattern — [aiuxdesign.guide](https://www.aiuxdesign.guide/patterns/confidence-visualization)
- "Confidence Visualization UI Patterns" — [agentic-design.ai](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns)
- "Psychology of Trust in AI" (Smashing Magazine, 2025) — [smashingmagazine.com](https://www.smashingmagazine.com/2025/09/psychology-trust-ai-guide-measuring-designing-user-confidence/)

### Calibration Methods
- "5 Methods for Calibrating LLM Confidence Scores" — [latitude.so](https://latitude.so/blog/5-methods-for-calibrating-llm-confidence-scores)
- "Adaptive Temperature Scaling" (2024) — [arxiv.org/abs/2409.19817](https://arxiv.org/abs/2409.19817)
- Platt scaling — [github.com/gpleiss/temperature_scaling](https://github.com/gpleiss/temperature_scaling)
