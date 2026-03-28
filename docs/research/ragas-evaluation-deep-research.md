# RAGAS Evaluation Metrics + Embedding Quality Monitoring for RAG Systems
> Deep Research | Date: 2026-03-28
> Context: Contexter RAG (Bun/Hono/PostgreSQL/pgvector/Redis, Groq Llama 3.1 8B, Jina v4 embeddings)
> Status: Zero evaluation metrics. No monitoring of embedding quality or retrieval accuracy.

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: Contexter is a RAG-as-a-service pipeline: file -> parse -> chunk -> embed (Jina v4, 1024 dims) -> index (pgvector HNSW + tsvector GIN). Query: rewrite (Groq LLM) -> search (tsvector || pgvector -> RRF) -> context -> Groq Llama 3.1 8B -> answer.
- **How**: No evaluation whatsoever. No metrics on retrieval quality, answer faithfulness, embedding health, or drift. No golden test set. No A/B testing. No monitoring beyond basic health checks (Netdata for infra).
- **Performance**: Unknown. We have no baseline measurements for retrieval precision, answer quality, or embedding distribution health.
- **Known issues**:
  - Cannot measure if a pipeline change (new chunking strategy, different embedding model, prompt tweak) improves or degrades quality
  - No way to detect embedding drift if Jina updates their model
  - No way to catch hallucinations or unfaithful answers
  - No regression detection capability

### 1.2 Metrics (measure before improving)

- Baseline accuracy: **unmeasured**
- Baseline latency: monitored at infra level (Netdata), not at RAG component level
- Baseline cost: Groq Llama 3.1 8B at $0.05/1M input, $0.08/1M output tokens; Jina v4 embedding costs per API call
- User complaints: no structured feedback collection mechanism

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Framework: RAGAS (Retrieval-Augmented Generation Assessment Score)**
- Paper: "Ragas: Automated Evaluation of Retrieval Augmented Generation" (Es et al., 2023, arXiv:2309.15217)
- Published: EACL 2024 Demo track (ACL Anthology 2024.eacl-demo.16)
- Why standard: Reference-free evaluation (no ground truth needed for core metrics), automated LLM-as-judge, widely adopted (10K+ GitHub stars), integrates with LangChain/LlamaIndex/Haystack
- Who uses it: Elastic, Pinecone, Datadog (native integration), Weaviate, Qdrant, most production RAG teams

**Core RAGAS Metrics (the "RAG Triad" + extensions):**

| Metric | What it measures | Needs ground truth? | LLM calls per sample |
|---|---|---|---|
| **Faithfulness** | Are all claims in the answer supported by retrieved context? | No | 2 (claim extraction + verdict) |
| **Answer Relevancy** | Is the answer relevant to the question? | No | 1 (reverse question generation + similarity) |
| **Context Precision** | Are relevant chunks ranked higher than irrelevant ones? | Yes (reference answer) | 1 |
| **Context Recall** | Does retrieved context cover all aspects of ground truth? | Yes (reference answer) | 1 |
| **Response Groundedness** | Is the response grounded in context (token-efficient variant of faithfulness)? | No | 1 |
| **Context Relevance** | Is the retrieved context relevant to the question? | No | 1 |

**Reference-free metrics (no ground truth needed):** Faithfulness, Answer Relevancy, Response Groundedness, Context Relevance.
**Reference-required metrics (need golden test set):** Context Precision, Context Recall.

### 2.2 Top 3 implementations

| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| **RAGAS** (explodinggradients) | LLM-as-judge, claim decomposition, reference-free | Standard across KILT, SuperGLUE | Reference-free core metrics; can run on production traces without ground truth |
| **DeepEval** (Confident AI) | pytest-native RAG Triad, 14+ metrics, CI/CD integration | RAG Triad (faithfulness, answer relevancy, contextual relevancy) | Each metric maps to a specific RAG hyperparameter (embedding model, chunking strategy, reranker, prompt) |
| **ARES** (Stanford) | Synthetic data + fine-tuned lightweight classifiers + PPI | KILT, SuperGLUE, AIS (2 orders of magnitude less human annotation) | Trains lightweight judges from synthetic data; needs only ~150 human annotations for calibration |

### 2.3 Standard configuration

**Recommended defaults:**
- Faithfulness threshold: >= 0.8 (scores above 0.8 indicate strong performance)
- Answer Relevancy threshold: >= 0.8
- Context Precision threshold: >= 0.7
- LLM judge: GPT-4o or Claude 3.5 Sonnet (gold standard); Llama 3.1 70B+ (cost-effective alternative); Llama 3.1 8B (viable but lower judge quality)
- Evaluation cadence: every pipeline change (CI/CD gate) + weekly production sampling
- Production sampling rate: 1-10% of traffic for LLM-based metrics; 100% for lightweight proxy metrics

**Common pitfalls:**
- Using the same LLM for both generation AND evaluation (self-preference bias)
- Evaluating only end-to-end without separating retrieval vs generation quality
- Running evaluation once and never again (quality degrades over time)
- Not pinning embedding model versions (silent drift)
- Skipping cost estimation before enabling evaluation at scale

**Migration path from our current state:**
- Phase 1 (1-2 days): Add lightweight proxy metrics (zero LLM cost)
- Phase 2 (2-3 days): Implement reference-free RAGAS metrics with Groq as judge
- Phase 3 (1-2 weeks): Build golden test set incrementally, add Context Precision/Recall
- Phase 4 (ongoing): Continuous monitoring + drift detection

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from last 6 months)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **MIGRASCOPE** (arXiv:2602.21553) | 2026-02 | Information-theoretic retriever benchmark using Mutual Information; models retriever ranking as noisy view of ideal chunk distribution | Research | Direct: measure retrieval quality without LLM calls using MI-based score |
| **RAGOps** (arXiv:2506.03401) | 2025-06 | Formal operational framework extending LLMOps for RAG; defines data lifecycle + evaluation lifecycle as first-class concerns | Research/Framework | Direct: structured approach to continuous RAG monitoring |
| **Case-Aware LLM-as-Judge** (arXiv:2602.20379) | 2026-02 | Enterprise-scale judge that adapts evaluation criteria per query type/domain | Research | Medium: useful when Contexter serves diverse knowledge bases |
| **Information-Theoretic RAG Framework** (MDPI Electronics 14/15/2925) | 2025 | Models RAG as cascading information channels; retrieval channel = primary bottleneck; capacity bounded by min(embedding_dim, schema_entropy) | Research | High: theoretical foundation for understanding where quality loss occurs |
| **Diverse Synthetic Datasets via Multi-Agent** (arXiv:2508.18929) | 2025-08 | Multi-agent framework for generating diverse, private synthetic evaluation data | Research | Medium: better synthetic test generation than single-LLM approach |

### 3.2 Open questions in the field

- **Judge reliability**: LLM judges exhibit verbosity inflation (prefer longer answers), self-preference (prefer answers from same model family), and position bias. 2025-2026 research demands validation of judges before trusting them.
- **Cross-domain generalization**: Evaluation metrics calibrated on one domain (e.g., Wikipedia) may not transfer to specialized domains (legal, medical, technical documentation).
- **Multilingual evaluation**: Most RAGAS benchmarks are English-centric; Contexter may need to handle Russian/multilingual content.
- **Cost of evaluation at scale**: Running LLM-as-judge on every production request is prohibitively expensive; optimal sampling strategies are still being researched.

### 3.3 Bets worth making

- **MI-based retrieval scoring (MIGRASCOPE approach)**: Zero LLM cost, mathematically grounded, measures retrieval quality directly from embedding distributions. Worth prototyping as a complement to LLM-based metrics.
- **Fine-tuned lightweight judge**: Following ARES approach, fine-tune a small model (e.g., Llama 3.1 8B) specifically as an evaluation judge. Reduces per-eval cost to near-zero while maintaining quality. Requires initial investment of ~150 human annotations.
- **Prompt compression for evaluation**: LLMLingua-style compression cuts evaluation token costs by ~30%. Useful when scaling evaluation to more production traffic.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Manufacturing QC** | Sampling inspection of production output | Statistical Process Control (SPC): control charts, X-bar/R charts, Western Electric rules | Monitor RAG quality metrics as a time series; use control chart rules to detect anomalies (2-sigma drift, runs, trends) without complex ML |
| **Clinical trials** | Measuring treatment effectiveness without perfect ground truth | Surrogate endpoints: measure proxy indicators correlated with true outcome | Use lightweight proxy metrics (retrieval scores, answer length, chunk overlap) as surrogates for expensive LLM-judged quality |
| **Signal processing** | Detecting signal degradation in noisy channels | Signal-to-Noise Ratio (SNR), spectral analysis | Treat relevant chunks as "signal" and irrelevant chunks as "noise"; compute retrieval SNR = cosine_sim(query, relevant) / cosine_sim(query, irrelevant) |
| **Ecology** | Measuring biodiversity without complete census | Shannon diversity index, species richness estimation | Measure "answer diversity" and "context coverage" using entropy-based metrics without exhaustive annotation |
| **Financial auditing** | Verifying accuracy of large datasets with limited resources | Statistical sampling + materiality thresholds | Sample 1-5% of production queries; define "materiality" threshold (faithfulness < 0.5 = critical alert) |

### 4.2 Biomimicry / Nature-inspired

- **Immune system analogy**: The adaptive immune system maintains a "memory" of past threats (golden test set) while also detecting novel threats via pattern matching (proxy metrics). RAG evaluation should similarly combine a curated reference set with real-time anomaly detection.
- **Canary in the coal mine**: Maintain a small set of "canary queries" (known-good Q&A pairs) that are evaluated on every deployment. If canary scores drop, block deployment. Analogous to canary deployments in DevOps.

### 4.3 Engineering disciplines

- **Signal processing**: Apply moving average and exponential smoothing to quality metrics over time. A sudden drop in the smoothed faithfulness score indicates a problem, while gradual decline indicates drift.
- **Information theory**: Shannon entropy of retrieved chunk relevance scores measures how "decisive" retrieval is. Low entropy = retrieval is confident (most chunks clearly relevant or irrelevant). High entropy = retrieval is uncertain (scores clustered in the middle). High entropy correlates with poor answer quality.
- **Control systems**: Implement a feedback loop: monitor quality -> detect degradation -> alert -> human review -> update golden set / adjust pipeline -> re-evaluate. The "setpoint" is your quality threshold (faithfulness >= 0.8).
- **Linguistics**: Lexical overlap between answer and context (ROUGE-L) as a cheap faithfulness proxy. If the answer uses words/phrases not present in context, it may be hallucinating. Not perfect but costs zero LLM calls.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **What math we use**: Cosine similarity for vector search (pgvector HNSW), BM25-equivalent (tsvector) for lexical search, Reciprocal Rank Fusion (RRF) to combine both. No evaluation math at all.
- **Assumptions**: We assume that high cosine similarity between query embedding and chunk embedding implies relevance. We assume RRF produces good rankings. We assume the LLM generates faithful answers from context.
- **Where assumptions break**:
  - Cosine similarity can be high for semantically related but factually irrelevant chunks (topic match != answer match)
  - RRF weights are fixed (k=60 typically); may not be optimal for all query types
  - LLM can hallucinate even with relevant context, especially for complex multi-hop reasoning
  - Embedding quality degrades silently if Jina updates their model

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| **Mutual Information retriever scoring** | Information theory | Measures retrieval quality without LLM calls; compares actual chunk distribution to ideal distribution | O(n*k) where n=queries, k=chunks | MIGRASCOPE (arXiv:2602.21553) |
| **Maximum Mean Discrepancy (MMD)** | Kernel methods / statistics | Detects embedding distribution drift; non-parametric, works in high dimensions | O(n^2) but approximations exist | Evidently AI implementation |
| **Wasserstein distance** | Optimal transport theory | Better than KS test for high-dimensional embedding drift detection; captures geometry of distribution shift | O(n log n) for 1D, harder in high-D | AWS ML monitoring guidance |
| **Pointwise Mutual Information (PMI)** | Information theory / NLP | PMI between question and context under LM correlates with answer accuracy; useful for document ordering | O(n) per query-context pair | arXiv:2411.07773 |
| **NDCG with graded relevance** | Information retrieval | Properly accounts for ranking quality with non-binary relevance labels; industry standard for search evaluation | O(k log k) per query | Standard IR, Weaviate/Pinecone docs |

### 5.3 Optimization opportunities

- **Current bottleneck**: No measurement at all. The first optimization is simply measuring anything.
- **Better objective function**: Instead of just cosine similarity for retrieval, optimize for a composite score: `quality = alpha * retrieval_precision + beta * faithfulness + gamma * answer_relevancy`. Alpha/beta/gamma tuned empirically.
- **Approximation tricks**:
  - For embedding drift: compute statistics on PCA-reduced embeddings (project 1024-dim to 32-dim) rather than full vectors. Catches 90%+ of drift at 1/32 computation cost.
  - For faithfulness estimation: use ROUGE-L overlap as a fast pre-filter. Only run expensive LLM-as-judge on samples where ROUGE-L is ambiguous (0.3-0.7 range).
  - For production sampling: stratified sampling by query type/knowledge base instead of uniform random. Ensures coverage of edge cases.

### 5.4 Information-theoretic analysis

- **Retrieval entropy**: H(relevance_scores) over retrieved chunks. Low entropy means retrieval is confident; high entropy means uncertain. Track over time as a drift indicator.
- **Channel capacity**: RAG performance is bounded by min capacity across all channels (encoding -> retrieval -> integration -> generation). The retrieval channel is typically the bottleneck.
- **Embedding dimension efficiency**: Jina v4 uses 1024 dims (truncated). The intrinsic dimensionality of our document embeddings is likely much lower. Measuring intrinsic dimensionality tells us if we're using the vector space efficiently.

### 5.5 Linear algebra / geometry insights

- **Cosine similarity distribution**: For a healthy embedding space, query-to-relevant-chunk similarities should form a clearly separated distribution from query-to-irrelevant-chunk similarities. If these distributions overlap significantly, retrieval quality is poor regardless of threshold.
- **Embedding anisotropy**: If embeddings cluster in a narrow cone of the vector space (high anisotropy), cosine similarity loses discriminative power. Monitor the average pairwise cosine similarity of random chunk pairs — if it's > 0.5, the space is anisotropic and quality suffers.
- **L2 norm distribution**: Track L2 norm distribution of embeddings over time. If the shape changes (higher variance, shifted mean, new outliers), the embedding process changed even if you can't identify the cause.
- **Cluster structure**: If documents form natural clusters in embedding space, evaluation should be cluster-aware. A retrieval that pulls from the right cluster but wrong document is better than one that pulls from a completely wrong cluster.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: 4-Phase Minimum Viable Evaluation Pipeline

**Phase 1: Lightweight Proxy Metrics (zero LLM cost)**
- **What**: Instrument every query/answer with:
  - `retrieval_score_mean`: mean cosine similarity of top-k retrieved chunks
  - `retrieval_score_max`: max cosine similarity of top-k chunks
  - `retrieval_score_spread`: max - min similarity (high spread = mixed relevance)
  - `chunks_retrieved_count`: number of chunks used
  - `answer_length_chars`: response length
  - `answer_length_tokens`: response token count
  - `lexical_overlap_score`: ROUGE-L between answer and concatenated context (cheap faithfulness proxy)
  - `retrieval_latency_ms`: time for vector search
  - `generation_latency_ms`: time for LLM response
  - `empty_answer_rate`: percentage of queries with empty/refused answers
  - `embedding_l2_norm_mean`: mean L2 norm of chunk embeddings per query (drift canary)
- **Why**: Layer 2 (standard practice) + Layer 4 (SPC/clinical trials analogy) + Layer 5 (information theory)
- **Expected impact**: Immediate visibility into retrieval health. Detects gross degradation within hours.
- **Cost**: Zero LLM cost. ~50 lines of code. ~1 day implementation.
- **Risk**: Proxy metrics can miss subtle quality issues (hallucination with high lexical overlap). Mitigated by Phase 2.

**Phase 2: Reference-Free LLM Evaluation (sampled, using Groq)**
- **What**: Run RAGAS Faithfulness + Answer Relevancy on 5-10% of production queries using Groq Llama 3.1 8B as judge.
  - Faithfulness: 2 LLM calls per sample (claim extraction + verdict)
  - Answer Relevancy: 1 LLM call per sample
  - Total: 3 LLM calls per evaluated sample
- **Why**: Layer 2 (RAGAS standard) + Layer 3 (reference-free = no ground truth needed)
- **Expected impact**: Catch hallucinations and irrelevant answers. Establish quality baseline.
- **Cost estimate**:
  - Assume 100 queries/day, 10% sampling = 10 evaluated queries/day
  - ~3 LLM calls per query, ~2K tokens per call (input+output)
  - 10 * 3 * 2K = 60K tokens/day
  - Groq Llama 3.1 8B: $0.05/1M input + $0.08/1M output ~ $0.004/day ~ **$0.12/month**
  - At 1000 queries/day: **$1.20/month**
  - At 10K queries/day: **$12/month**
- **Risk**: Llama 3.1 8B as judge is less reliable than GPT-4o/Claude. Mitigated by: (a) using it for trend detection not absolute scoring, (b) validating against human judgment on 50 samples initially.

**Phase 3: Golden Test Set + Retrieval Metrics (incremental)**
- **What**: Build a golden test set of 50-200 Q&A pairs incrementally:
  1. Start with 20 manually curated questions from real user queries + expected answers
  2. Generate 30 synthetic Q&A pairs using RAGAS TestsetGenerator from uploaded documents
  3. Human-review synthetic pairs (promote "silver" to "gold" via SME review)
  4. Add 5-10 pairs per week from production (queries where faithfulness score was low -> investigate -> add correct answer)
  - With golden set, enable: Context Precision, Context Recall, MRR, NDCG@k
  - Run full evaluation suite on every pipeline change (CI gate)
- **Why**: Layer 2 (standard) + Layer 3 (synthetic generation) + Layer 4 (incremental like clinical trial enrollment)
- **Expected impact**: Enable precise measurement of retrieval quality. Block regressions before deployment.
- **Cost**: RAGAS TestsetGenerator needs ~50 LLM calls for 30 synthetic pairs (one-time). CI eval on 200 pairs: ~600 LLM calls per run ~ 1.2M tokens ~ $0.10 on Groq per CI run.
- **Risk**: Golden set becomes stale as knowledge bases evolve. Mitigated by monthly review + auto-flagging when new documents are added.

**Phase 4: Continuous Monitoring + Drift Detection**
- **What**:
  - Weekly embedding drift check: compare current embedding distribution against baseline using MMD or cosine distance on PCA-reduced vectors
  - Canary queries: run 10 golden test queries on every deployment
  - Dashboard: Grafana panels showing quality trends (proxy metrics + sampled LLM scores)
  - Alerts: faithfulness 7-day moving average drops below 0.7, retrieval_score_mean drops below baseline by >10%, embedding L2 norm distribution shifts (KS test on per-component distributions)
- **Why**: Layer 2 (continuous monitoring standard) + Layer 3 (RAGOps) + Layer 4 (SPC control charts) + Layer 5 (MMD, L2 norm tracking)
- **Expected impact**: Detect degradation before users notice. Catch embedding model updates from Jina.
- **Cost**: Drift checks are pure computation (no LLM cost). Canary queries: 10 * 3 = 30 LLM calls per deployment ~ $0.003 on Groq.
- **Risk**: False positives from natural distribution evolution. Mitigated by: adaptive baselines (rolling 30-day reference window), multi-signal confirmation (require 2+ signals to alert).

### 6.2 Implementation spec (brief)

**Input**: Every query-response cycle produces:
```
{
  query: string,
  retrieved_chunks: Array<{id, text, cosine_score, bm25_score, rrf_rank}>,
  context_assembled: string,
  answer: string,
  metadata: {retrieval_ms, generation_ms, model, timestamp}
}
```

**Output**: Evaluation record:
```
{
  // Phase 1: always computed (sync, in-request)
  proxy: {
    retrieval_score_mean, retrieval_score_max, retrieval_score_spread,
    chunks_count, answer_length, lexical_overlap,
    retrieval_latency_ms, generation_latency_ms
  },
  // Phase 2: computed async for sampled requests
  llm_eval: {
    faithfulness: 0-1,
    answer_relevancy: 0-1,
    evaluated: boolean,
    judge_model: string,
    eval_cost_tokens: number
  }
}
```

**Storage**: PostgreSQL table `eval_metrics` (timestamp, query_id, proxy JSON, llm_eval JSON). Lightweight — one row per query. Retention: 90 days, then aggregate to daily summaries.

**Algorithm (Phase 1 proxy metrics)**:
1. After retrieval, compute cosine score statistics from top-k chunks
2. After generation, compute ROUGE-L between answer and context
3. Log to eval_metrics table (async, non-blocking)
4. Expose via `/metrics` endpoint for Prometheus scraping

**Algorithm (Phase 2 LLM eval)**:
1. Sampling decision: hash(query_id) % 100 < sampling_rate
2. If sampled, enqueue evaluation job to BullMQ
3. Worker: call Groq with faithfulness prompt (claim extraction -> verdict)
4. Worker: call Groq with answer relevancy prompt
5. Store scores in eval_metrics table
6. Emit Prometheus gauge metrics

**Config**:
```
EVAL_SAMPLING_RATE=10          # percent of queries to LLM-evaluate
EVAL_JUDGE_MODEL=llama-3.1-8b-instant  # via Groq
EVAL_FAITHFULNESS_THRESHOLD=0.7
EVAL_RELEVANCY_THRESHOLD=0.7
EVAL_DRIFT_CHECK_INTERVAL=7d   # weekly
EVAL_CANARY_QUERIES_PATH=/data/canary-queries.json
EVAL_GOLDEN_SET_PATH=/data/golden-set.json
```

**Fallback**: If evaluation fails (Groq rate limit, timeout), skip silently. Evaluation must never block the query pipeline. Log failure for monitoring. BullMQ retry handles transient failures (3 retries, exponential backoff — already in place).

### 6.3 Validation plan

- **How to measure improvement**: Before/after comparison on golden test set when making pipeline changes. A/B comparison of proxy metric distributions.
- **Minimum success criteria**:
  - Phase 1: proxy metrics are logged for 100% of queries within 1 week
  - Phase 2: faithfulness baseline established (numeric value known, even if low)
  - Phase 3: golden test set of >= 50 pairs, CI gate blocks deploys that drop faithfulness by > 0.1
  - Phase 4: drift detection catches a simulated embedding change within 24 hours
- **Rollback trigger**: If evaluation overhead adds > 50ms to p95 latency, disable async evaluation. If Groq costs exceed $50/month, reduce sampling rate.

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **DeepEval as primary framework** | Python-only, pytest-based — Contexter is Bun/TypeScript. Would require a separate Python service. RAGAS metrics can be reimplemented directly or called via Python microservice. |
| **Arize Phoenix** | Full observability platform, heavy dependency for our scale. Good for debugging but overkill for MVP eval. Revisit at 10K+ queries/day. |
| **TruLens** | Acquired by Snowflake, traction declining, lacks agentic/conversational metrics. Not a safe long-term bet. |
| **GPT-4o as judge** | Gold standard quality but $2.50/1M input + $10/1M output = ~100x more expensive than Groq Llama 3.1 8B. Not justified at our scale. Use for periodic calibration only. |
| **ARES (Stanford)** | Requires fine-tuning a classifier — additional infrastructure complexity. Excellent for large-scale enterprise eval but overkill for our current volume. Revisit when golden set > 500 pairs. |
| **Full RAGAS Python library integration** | RAGAS is Python; our stack is Bun/TypeScript. Options: (a) reimplement core metrics in TS (2-3 days for faithfulness + relevancy), (b) Python sidecar service, (c) call RAGAS via CLI. Recommend (a) for Phase 1-2, evaluate (b) for Phase 3+. |
| **100% evaluation (no sampling)** | Even at Groq prices, evaluating every query adds latency and cost linearly. Sampling at 5-10% captures distribution accurately per statistical theory. |
| **Embedding drift via KS test** | KS test is less effective for high-dimensional data (1024-dim embeddings). MMD or Wasserstein distance on PCA-reduced vectors is more appropriate. |

---

## Appendix A: Cost Estimation Summary

| Component | Volume assumption | Token cost | Monthly cost |
|---|---|---|---|
| Phase 1 proxy metrics | 1K queries/day | 0 (computation only) | $0 |
| Phase 2 LLM eval (10% sampling) | 100 evaluated/day, 3 calls each, ~2K tokens/call | Groq $0.05-0.08/1M | **~$1.20/mo** |
| Phase 3 golden set generation | One-time 50 LLM calls | ~100K tokens | **~$0.01 one-time** |
| Phase 3 CI eval per run | 200 test cases, ~6K tokens each | ~1.2M tokens/run | **~$0.10/run** |
| Phase 4 canary queries | 10 queries per deploy, ~3 deploys/week | ~180K tokens/week | **~$0.05/mo** |
| Phase 4 drift check | Pure computation | 0 | $0 |
| **Total estimated** | | | **~$1.50/mo** at 1K queries/day |

At 10K queries/day: ~$12/mo. At 100K queries/day: ~$120/mo (consider increasing sampling or switching to fine-tuned local judge).

## Appendix B: Metric Implementation Priority

| Priority | Metric | Type | LLM cost | Implementation effort | Value |
|---|---|---|---|---|---|
| **P0** | retrieval_score_mean/max/spread | Proxy | $0 | 2 hours | Immediate retrieval health visibility |
| **P0** | answer_length + empty_answer_rate | Proxy | $0 | 1 hour | Detect broken generation |
| **P0** | retrieval_latency + generation_latency | Proxy | $0 | 1 hour | Performance regression detection |
| **P1** | lexical_overlap (ROUGE-L) | Proxy | $0 | 3 hours | Cheap faithfulness proxy |
| **P1** | Faithfulness (RAGAS) | LLM-as-judge | ~$0.004/sample | 1 day | Core quality metric |
| **P1** | Answer Relevancy (RAGAS) | LLM-as-judge | ~$0.002/sample | 1 day | Core quality metric |
| **P2** | embedding_l2_norm_distribution | Statistical | $0 | 4 hours | Drift early warning |
| **P2** | Canary query suite | LLM-as-judge | ~$0.01/deploy | 4 hours | Deployment safety gate |
| **P3** | Context Precision (RAGAS) | LLM + golden set | ~$0.002/sample | Requires golden set | Retrieval ranking quality |
| **P3** | Context Recall (RAGAS) | LLM + golden set | ~$0.002/sample | Requires golden set | Retrieval completeness |
| **P3** | MRR / NDCG@k | Computation + golden set | $0 | 4 hours | Standard retrieval metrics |
| **P4** | MMD drift detection | Statistical | $0 | 1 day | Full drift detection |
| **P4** | Retrieval entropy | Information theory | $0 | 2 hours | Retrieval confidence signal |

## Appendix C: Tool/Framework Reference

| Tool | Type | Language | License | Best for | URL |
|---|---|---|---|---|---|
| RAGAS | Evaluation framework | Python | Apache 2.0 | Comprehensive RAG eval metrics | https://docs.ragas.io |
| DeepEval | Evaluation framework | Python | Apache 2.0 | pytest CI/CD integration, RAG Triad | https://deepeval.com |
| ARES | Evaluation framework | Python | MIT | Low-annotation eval via fine-tuned judges | https://github.com/stanford-futuredata/ARES |
| Arize Phoenix | Observability platform | Python | Apache 2.0 | Visual debugging, embedding visualization | https://arize.com/docs/phoenix |
| Evidently AI | ML monitoring | Python | Apache 2.0 | Drift detection (embeddings, data) | https://www.evidentlyai.com |
| Langfuse | Observability | TS/Python | MIT | Tracing, RAGAS integration, cost tracking | https://langfuse.com |
| Datadog RAGAS | Monitoring integration | Python | Commercial | Production RAGAS in Datadog dashboards | https://docs.datadoghq.com/llm_observability |

## Appendix D: Key Formulas

**Faithfulness** (RAGAS):
```
faithfulness = |claims_supported_by_context| / |total_claims_in_answer|
```
Requires: claim extraction (LLM call 1) + claim verification against context (LLM call 2).

**ROUGE-L** (lightweight faithfulness proxy):
```
ROUGE-L = LCS(answer, context) / max(|answer|, |context|)
```
LCS = Longest Common Subsequence. No LLM needed. Computed in O(m*n).

**Retrieval SNR** (from Layer 4 signal processing analogy):
```
SNR = mean(cosine_sim(query, relevant_chunks)) / mean(cosine_sim(query, irrelevant_chunks))
```
Higher SNR = cleaner retrieval. Track over time for degradation.

**Shannon Entropy of retrieval scores** (from Layer 5):
```
H = -sum(p_i * log2(p_i))  where p_i = softmax(cosine_scores)
```
Low H = confident retrieval. High H = uncertain/noisy retrieval.

**MMD for embedding drift** (from Layer 5):
```
MMD^2(P, Q) = E[k(x,x')] + E[k(y,y')] - 2*E[k(x,y)]
```
Where k is a kernel (RBF typical), P = reference distribution, Q = current distribution.
Drift alert when MMD > threshold (calibrated from historical variance).

**MRR** (Mean Reciprocal Rank):
```
MRR = (1/|Q|) * sum(1/rank_i)  for first relevant result per query
```

**NDCG@k** (Normalized Discounted Cumulative Gain):
```
DCG@k = sum(rel_i / log2(i+1))  for i = 1..k
NDCG@k = DCG@k / IDCG@k         where IDCG = ideal DCG
```

---

## Sources

- [RAGAS paper (arXiv:2309.15217)](https://arxiv.org/abs/2309.15217)
- [RAGAS documentation](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/)
- [RAGAS faithfulness metric](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)
- [RAGAS context precision](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/)
- [RAGAS cost analysis](https://docs.ragas.io/en/stable/howtos/applications/_cost/)
- [RAGAS v0.1 to v0.2 migration](https://docs.ragas.io/en/latest/howtos/migrations/migrate_from_v01_to_v02/)
- [RAGAS LLM adapters (Groq support)](https://docs.ragas.io/en/stable/howtos/llm-adapters/)
- [RAGAS testset generation](https://docs.ragas.io/en/stable/concepts/test_data_generation/rag/)
- [ARES paper (arXiv:2311.09476)](https://arxiv.org/abs/2311.09476)
- [MIGRASCOPE paper (arXiv:2602.21553)](https://arxiv.org/abs/2602.21553)
- [RAGOps paper (arXiv:2506.03401)](https://arxiv.org/html/2506.03401v1)
- [Information-Theoretic RAG Framework (MDPI)](https://www.mdpi.com/2079-9292/14/15/2925)
- [PMI for RAG (arXiv:2411.07773)](https://arxiv.org/html/2411.07773v2)
- [Case-Aware LLM-as-Judge (arXiv:2602.20379)](https://arxiv.org/html/2602.20379)
- [DeepEval RAG evaluation guide](https://deepeval.com/guides/guides-rag-evaluation)
- [DeepEval RAG Triad](https://deepeval.com/guides/guides-rag-triad)
- [DeepEval CI/CD integration](https://www.confident-ai.com/blog/how-to-evaluate-rag-applications-in-ci-cd-pipelines-with-deepeval)
- [Evidently AI: 5 methods to detect drift in ML embeddings](https://www.evidentlyai.com/blog/embedding-drift-detection)
- [Evidently AI: RAG evaluation guide](https://www.evidentlyai.com/llm-guide/rag-evaluation)
- [Evidently AI: embeddings drift parameters](https://docs-old.evidentlyai.com/user-guide/customization/embeddings-drift-parameters)
- [Arize: embedding drift with Euclidean distance](https://arize.com/blog-course/embedding-drift-euclidean-distance/)
- [Arize: KS test for AI](https://arize.com/blog-course/kolmogorov-smirnov-test/)
- [Embedding drift: the quiet killer (DEV.to)](https://dev.to/dowhatmatters/embedding-drift-the-quiet-killer-of-retrieval-quality-in-rag-systems-4l5m)
- [Decompressed: detecting embedding drift](https://decompressed.io/learn/embedding-drift)
- [Monitoring retrieval drift in RAG (apxml.com)](https://apxml.com/courses/optimizing-rag-for-production/chapter-6-advanced-rag-evaluation-monitoring/monitoring-retrieval-drift-rag)
- [Groq pricing](https://groq.com/pricing)
- [Groq Llama 3.1 8B pricing calculator (Helicone)](https://www.helicone.ai/llm-cost/provider/groq/model/llama-3.1-8b-instant)
- [Snowflake: benchmarking LLM-as-judge for RAG Triad](https://www.snowflake.com/en/engineering-blog/benchmarking-LLM-as-a-judge-RAG-triad-metrics/)
- [Evidently AI: LLM-as-a-judge complete guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [Top RAG evaluation tools 2026 (Goodeye Labs)](https://www.goodeyelabs.com/articles/top-rag-evaluation-tools-2026)
- [Top 5 RAG evaluation platforms 2026 (Maxim AI)](https://www.getmaxim.ai/articles/top-5-rag-evaluation-platforms-in-2026/)
- [Production RAG in 2025 (Dextralabs)](https://dextralabs.com/blog/production-rag-in-2025-evaluation-cicd-observability/)
- [RAG evaluation 2026 benchmarks (Label Your Data)](https://labelyourdata.com/articles/llm-fine-tuning/rag-evaluation)
- [Building a golden dataset (Maxim AI)](https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/)
- [Synthetic data for RAG evaluation (Red Hat)](https://developers.redhat.com/articles/2026/02/23/synthetic-data-rag-evaluation-why-your-rag-system-needs-better-testing)
- [Golden dataset path at Microsoft](https://medium.com/data-science-at-microsoft/the-path-to-a-golden-dataset-or-how-to-evaluate-your-rag-045e23d1f13f)
- [RAG monitoring dashboard (apxml.com)](https://apxml.com/courses/optimizing-rag-for-production/chapter-6-advanced-rag-evaluation-monitoring/hands-on-rag-monitoring-dashboard)
- [Datadog RAGAS evaluations](https://docs.datadoghq.com/llm_observability/evaluations/ragas_evaluations/)
- [Weaviate: retrieval evaluation metrics](https://weaviate.io/blog/retrieval-evaluation-metrics)
- [Pinecone: RAG evaluation](https://www.pinecone.io/learn/series/vector-databases-in-production-for-busy-engineers/rag-evaluation/)
- [Jina embeddings v4](https://jina.ai/models/jina-embeddings-v4/)
- [Jina embeddings v4 paper (arXiv:2506.18902)](https://arxiv.org/abs/2506.18902)
- [KS test limitations for embeddings (AWS)](https://docs.aws.amazon.com/prescriptive-guidance/latest/gen-ai-lifecycle-operational-excellence/prod-monitoring-drift.html)
- [Groq integration issues with RAGAS (GitHub #2580)](https://github.com/vibrantlabsai/ragas/issues/2580)
