# Learned/Adaptive RRF Weights for Hybrid Search — Deep Research
> Date: 2026-03-28 | Component: Hybrid Fusion (vectorstore/hybrid.ts)
> Context: Contexter uses RRF with fixed K=60 to merge pgvector cosine + tsvector ts_rank results.
> Question: Should we keep RRF, tune K, add query-adaptive weights, or switch to an alternative?

---

## Layer 1: Current State

### 1.1 Our implementation

- **What:** Reciprocal Rank Fusion merging two retrieval signals into a single ranked list.
- **How:** `score = SUM(1 / (K + rank))` across vector and FTS result lists, K=60 (hardcoded constant).
- **Retrieval pipeline:** pgvector cosine similarity (1536-dim embeddings) + PostgreSQL tsvector with `ts_rank` and `plainto_tsquery('simple', ...)`. Both run in parallel via `Promise.all`, each returning `topK * 2` candidates. RRF merges to `topK`, then filters by `scoreThreshold >= 0.3`.
- **Score ranges:** pgvector cosine similarity returns `[0, 1]` (bounded). tsvector `ts_rank` returns `[0, ~unbounded)` depending on term frequency and document length -- scales are incompatible.
- **Known issues:**
  1. Fixed K=60 treats both signals equally regardless of query type.
  2. RRF discards raw score magnitudes -- a document with cosine similarity 0.98 and one with 0.72 can get identical RRF contributions if ranked adjacently.
  3. No query-adaptive behavior: keyword-heavy queries (e.g., "PostgreSQL VACUUM FULL syntax") and semantic queries (e.g., "how to clean up disk space in databases") receive identical fusion treatment.
  4. `ts_rank` is NOT true BM25 -- PostgreSQL's built-in ranking is a simplified TF-based rank, not the full Okapi BM25 formula. This means the FTS signal is already weaker than what dedicated BM25 implementations provide.
  5. Threshold of 0.3 is applied to RRF scores, which have a very narrow range (max possible ~0.033 for K=60, rank 1), meaning the threshold likely never filters anything and is effectively a no-op.

### 1.2 Metrics (measure before improving)

- **Baseline accuracy:** Not formally measured. No relevance judgments or labeled query sets exist for Contexter.
- **Baseline latency:** Both searches run in parallel; fusion is O(n) in-memory merge, negligible (<1ms).
- **Baseline cost:** Zero additional cost -- fusion runs in application code, no API calls.
- **User complaints:** No systematic feedback collection. The problem is theoretical/architectural, not user-reported.
- **Corpus characteristics:** Contexter is a personal knowledge base -- corpus is small (hundreds to low thousands of documents), not millions. This matters because statistical normalization methods (DBSF, z-score) require sufficient result set size to produce meaningful distributions.

### 1.3 Score threshold bug

The RRF score for a document appearing in only one list at rank 1 is `1 / (60 + 1) = 0.0164`. A document appearing in both lists at rank 1 gets `2 / (60 + 1) = 0.0328`. The `DEFAULT_SCORE_THRESHOLD = 0.3` is orders of magnitude above any possible RRF score. This means **all results are being filtered out** unless the threshold is not actually applied to RRF scores (it is -- see `index.ts` line 59). This is a critical bug that should be fixed regardless of fusion strategy.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Reciprocal Rank Fusion (RRF)** remains the most widely adopted fusion method in 2026.

- **Paper:** Cormack, Clarke, Buttcher. "Reciprocal rank fusion outperforms Condorcet and individual rank learning methods." SIGIR 2009.
- **Formula:** `RRF(d) = SUM_r(1 / (k + rank_r(d)))` where `r` ranges over result lists.
- **Why standard:** Zero-config, score-scale agnostic, no normalization needed, robust across domains.
- **Who uses it:** Elasticsearch (default hybrid fusion, commercial license), Azure AI Search, MongoDB Atlas Search, OpenSearch (since 2.10), Chroma, LanceDB, MariaDB 11.6+, Milvus.
- **Market adoption:** 63% of new enterprise RAG systems use hybrid search (Gartner, Feb 2025), up from 28% in early 2023.

**Key insight:** RRF is the "default safe choice" -- it works well enough with zero tuning, which is why every major vector database ships it. But it is NOT the best-performing fusion method when tuning is possible.

### 2.2 Top implementations

| Product | Approach | Key insight |
|---|---|---|
| **Weaviate** | relativeScoreFusion (default since v1.24): min-max normalize each list to [0,1], then `alpha * vector_norm + (1-alpha) * keyword_norm`. Also supports rankedFusion (their RRF variant). | Relative score fusion showed **~6% recall improvement** over ranked fusion in internal benchmarks. Alpha parameter gives per-query control. |
| **Pinecone** | Convex combination: `final = alpha * dense + (1-alpha) * sparse`. Sparse-dense stored in single index. No RRF. | Research arm (Bruch et al.) proved CC outperforms RRF. Alpha=0.5 default. Implementation bakes weighting into query vector scaling. |
| **Qdrant** | Both RRF and DBSF (Distribution-Based Score Fusion). DBSF uses 3-sigma normalization. | DBSF handles score distribution mismatch better than RRF. User chooses per query. |
| **OpenSearch** | Normalization processor (min_max or L2) + combination technique (arithmetic_mean, geometric_mean, harmonic_mean). Weights configurable per query clause. | Most flexible: `min_max + arithmetic_mean` is their recommended default. Supports per-query weight overrides. |
| **Vespa** | Multi-phase ranking: first-phase BM25, global-phase `normalize_linear()` + weighted sum. | Production-grade: handles distributed normalization across shards via match-features. |
| **Elasticsearch** | RRF (commercial license) + Linear Retriever (new, score-based). ELSER learned sparse encoder. | Moving toward score-based fusion. ELSER outperforms BM25 in 11/12 BEIR benchmarks. |

### 2.3 Standard configuration

- **Recommended defaults:**
  - RRF: K=60 (original paper value, robust in range [10, 100])
  - Convex combination: alpha=0.5 (equal weight), tune from there
  - Score normalization: min-max (simplest, most adopted)
  - Candidate pool: 2x-3x final topK from each retriever
- **Common pitfalls:**
  - Applying raw score thresholds to RRF scores (they live in a tiny range ~0.001-0.033)
  - Not normalizing scores before linear combination (BM25 and cosine are on different scales)
  - Tuning K for one domain and assuming it generalizes (Bruch et al. showed it doesn't)
  - Using RRF with only 2 result lists -- RRF's advantage grows with more lists; with 2 lists, CC often wins
- **Migration path from current state:**
  - **Minimal (1 day):** Fix score threshold bug. Keep RRF K=60.
  - **Medium (2-3 days):** Switch to convex combination with min-max normalization and alpha=0.5.
  - **Full (1 week):** Add query classification + adaptive alpha + cross-encoder reranker.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **Bruch et al. "Analysis of Fusion Functions for Hybrid Retrieval"** | 2022-10 (published ACM TOIS 2024) | Proved convex combination (CC) outperforms RRF in-domain AND out-of-domain. CC is sample-efficient: ~50 labeled queries sufficient to tune alpha. RRF K=60 generalizes poorly across domains. | Production (Pinecone) | **HIGH** -- directly applicable to Contexter. Switch from RRF to CC. |
| **SRRF (Scaled Reciprocal Rank Fusion)** | 2025 (AutoRAG) | Replaces hard ranks with sigmoid-approximated ranks. Partially recovers score magnitude information that RRF discards. Beta parameter controls smoothing. | Prototype | MEDIUM -- more complex than CC for marginal gain. |
| **DBSF (Distribution-Based Score Fusion)** | 2024 (Qdrant) | 3-sigma normalization: `norm = (score - (mean - 3*std)) / (6*std)`, clamped to [0,1]. Handles heavy-tailed score distributions. | Production (Qdrant) | LOW for Contexter -- requires sufficient result set size for meaningful statistics. Small corpus = noisy distributions. |
| **Meilisearch Dynamic Weighting** | 2025-2026 | Query-adaptive: if query has numbers/code, lean keyword; if vague question, lean semantic. Automatic, no user configuration. | Production (Meilisearch) | HIGH concept -- the idea of automatic query classification is directly applicable. |
| **Agentic Hybrid Search** | Feb 2026 (Elasticsearch) | LLM agent analyzes query semantics, classifies intent (factual/comparative/reasoning), determines optimal BM25/vector weights. Self-reflection loop evaluates retrieved documents. | Research/Prototype | LOW -- overkill for Contexter's scale. LLM call per query adds latency and cost. |
| **Elastic Linear Retriever** | 2025 | Score-based weighted sum replacing RRF. Preserves score magnitudes. Supports per-query weight adjustment. | Production (Elastic 8.x) | HIGH concept -- validates the industry shift from rank-based to score-based fusion. |

### 3.2 Open questions in the field

- **Optimal alpha per corpus:** No universal alpha exists. Bruch showed ~50 labeled examples suffice, but Contexter has zero labeled data. Cold-start problem.
- **Score normalization for small result sets:** DBSF's 3-sigma approach degrades when result set < 20 items (insufficient for meaningful mean/std). Min-max is more robust for small sets but sensitive to outliers.
- **Interaction with rerankers:** If a cross-encoder reranker is applied after fusion, does the fusion method matter at all? Evidence suggests rerankers can compensate for poor fusion, but better fusion reduces the reranker's workload and improves its top-k recall.
- **Multi-signal fusion beyond 2 lists:** Current research focuses on dense+sparse. Adding metadata signals (recency, source authority, user history) to fusion is underexplored.

### 3.3 Bets worth making

- **Convex combination with heuristic alpha:** Zero-cost improvement over RRF. Classify query by simple heuristics (length, presence of operators, question words) and set alpha accordingly. No ML model needed.
- **Cross-encoder reranker after fusion:** Biggest single precision gain in RAG pipelines. Standard pattern: hybrid retrieval for top-20, reranker selects top-5 for LLM. Addresses RRF's information loss.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Control theory** | Combining multiple sensor readings of different scales/ranges to estimate a single state variable | Kalman filter: optimal weighted combination based on each sensor's noise characteristics. PID controllers: adaptive gain scheduling. | Fusion weights as "gains" that adapt based on retrieval signal reliability. High-confidence vector match = increase vector weight. Like sensor fusion where noisier sensors get lower weight. |
| **Economics / Portfolio theory** | Combining multiple assets with different risk/return profiles into an optimal portfolio | Markowitz mean-variance optimization: weight assets inversely proportional to their variance, considering correlations | Weight retrieval signals inversely proportional to their "noise" (score variance). If vector results are tightly clustered (low variance = high confidence), increase their weight. |
| **Ensemble learning (ML)** | Combining predictions from multiple models into a single output | Stacking: train a meta-learner on base model outputs. Boosting: iteratively adjust weights. Bagging: equal weights + variance reduction. | Meta-learner that takes (vector_score, fts_score, query_features) and predicts relevance. But requires training data Contexter lacks. |
| **Signal processing** | Combining signals from multiple sources at different scales/frequencies | Matched filtering: weight each source by its SNR (signal-to-noise ratio). Beamforming: adaptive weighting. | Estimate SNR of each retrieval signal per query. High SNR = distinct score separation between relevant/irrelevant. Low SNR = flat scores = low confidence. Weight by estimated SNR. |
| **Neuroscience** | Brain integrates multiple sensory modalities (vision, hearing, touch) with different reliabilities | Maximum Likelihood Estimation (MLE): weight each modality by inverse variance. Known as "optimal cue integration." Empirically validated. | Formally equivalent to Kalman filtering for retrieval. Weight each retrieval signal by `1/variance(scores)`. Simple to compute, theoretically optimal under Gaussian assumptions. |
| **Voting theory** | Combining multiple voter rankings into a consensus ranking | Borda count, Condorcet methods, approval voting. RRF is actually a variant of Borda count. | RRF IS the voting theory solution. Condorcet is provably better but NP-hard in general. RRF approximates it cheaply. |

### 4.2 Biomimicry: Optimal Cue Integration

The neuroscience finding is directly applicable and has a clean mathematical formulation:

When combining two signals with variances sigma_v^2 (vector) and sigma_f^2 (FTS):

```
optimal_weight_vector = (1/sigma_v^2) / (1/sigma_v^2 + 1/sigma_f^2)
optimal_weight_fts = (1/sigma_f^2) / (1/sigma_v^2 + 1/sigma_f^2)
```

This is the **minimum-variance unbiased estimator** -- mathematically provable optimal combination.

**Transfer to Contexter:** After normalizing scores to [0,1], compute variance of each result list's scores. Higher variance = more discriminative signal = higher weight. This is implementable with zero training data.

### 4.3 Engineering disciplines

- **Signal processing:** The retrieval fusion problem is formally a **detection problem** -- distinguishing relevant documents (signal) from irrelevant ones (noise). The optimal detector (Neyman-Pearson lemma) uses likelihood ratios, not ranks. This theoretically supports score-based fusion over rank-based.
- **Information theory:** RRF's rank transformation is a **lossy compression** of the score distribution. It maps a continuous signal (scores) to ordinal data (ranks), losing magnitude information. Shannon's source coding theorem tells us this is suboptimal when the original signal is available. Ranks discard at least `log2(N)` bits of information from each score distribution.
- **Control systems:** The feedback loop analogy maps directly: measure system output (retrieval quality) -> compare to desired output (user satisfaction) -> adjust controller parameters (fusion weights). PID analogy: P = current query features, I = accumulated user feedback, D = rate of change in query patterns.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

**RRF formula:**
```
RRF(d) = SUM_{r in R} 1 / (k + rank_r(d))
```
where R = {vector_results, fts_results}, k = 60.

**Assumptions:**
1. Rank order within each list is meaningful (monotonically related to relevance).
2. The two lists are equally reliable indicators of relevance (symmetric treatment).
3. The mapping from relevance to rank is the same across both lists (same "rank elasticity").
4. K=60 is an appropriate smoothing constant for both 2-list fusion and arbitrary corpus sizes.

**Where assumptions break:**
- Assumption 2 fails for keyword-heavy vs semantic queries.
- Assumption 3 fails because vector similarity and ts_rank have fundamentally different score distributions. Vector similarity produces near-Gaussian distributions centered on corpus mean similarity. ts_rank produces heavily right-skewed distributions with many zeros.
- Assumption 4: K=60 was optimized for TREC datasets with 3+ retrieval systems. With only 2 lists and small result sets, the optimal K may differ.

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| **Convex Combination (CC)** | Statistics | Preserves score magnitudes. Single parameter alpha. Sample-efficient tuning. | O(n) + normalization | Bruch et al. 2024 |
| **DBSF (3-sigma normalization)** | Statistical process control | Handles heavy-tailed distributions. Robust to outliers via 3-sigma clipping. | O(n) per list | Mazzeschi (Qdrant) |
| **CombMNZ** | Data fusion (Fox & Shaw 1994) | Amplifies documents found by multiple retrievers: `score = SUM(scores) * count(non_zero)`. | O(n) | Fox & Shaw 1994 |
| **Inverse Variance Weighting** | Meta-analysis / sensor fusion | Provably optimal under Gaussian assumptions. Automatically adapts to signal quality per query. | O(n) + variance computation | Numerous (statistical canon) |
| **Learning-to-Rank (LTR)** | ML/IR | Learns optimal feature combination from training data. Can model non-linear interactions. | O(n*d) per query + training | LambdaMART, RankNet, etc. |
| **Bayesian fusion** | Bayesian statistics | Principled uncertainty quantification. Prior encodes domain knowledge. | O(n) per list | Bayesian data fusion literature |

### 5.3 Optimization opportunities

**Current bottleneck:** Not computational (fusion is O(n), negligible). The bottleneck is *information loss* -- RRF discards the continuous score signal and uses only ordinal ranks.

**Better objective function:** Instead of `sum of inverse ranks`, optimize for NDCG@k or MAP -- standard IR metrics that account for graded relevance and position bias.

**Practical optimization:** The convex combination `final = alpha * norm_vector + (1-alpha) * norm_fts` has a closed-form optimal alpha when labeled data exists:
```
alpha* = argmax_alpha NDCG@k(alpha * v + (1-alpha) * f, relevance_labels)
```
Grid search over alpha in [0, 1] with step 0.05 (20 evaluations) suffices.

### 5.4 Information-theoretic analysis

**Information preserved by each fusion method:**

| Method | Info preserved | Info discarded |
|---|---|---|
| RRF (rank-based) | Ordering within each list | Score magnitudes, gaps between scores, distribution shape |
| Convex Combination (score-based) | Ordering + relative magnitudes (after normalization) | Absolute magnitudes (lost in normalization) |
| DBSF (distribution-aware) | Ordering + magnitudes + distribution context | Scores beyond 3-sigma (clipped) |
| Raw score sum (no normalization) | Everything | Nothing -- but scale mismatch makes sum meaningless |

**Key insight:** Moving from RRF to CC recovers ~1 bit of information per document per retrieval list (the magnitude information lost by rank transformation). For a result set of 20 documents from 2 lists, that's ~40 bits of additional signal for the fusion algorithm.

### 5.5 Score normalization deep dive

**Min-max normalization:**
```
norm(s) = (s - min(S)) / (max(S) - min(S))
```
- Pros: Simple, maps to [0,1], preserves relative differences.
- Cons: Sensitive to outliers (a single extreme score compresses all others). Undefined when all scores are equal (division by zero).

**Z-score normalization:**
```
norm(s) = (s - mean(S)) / std(S)
```
- Pros: Robust to outliers, preserves distribution shape.
- Cons: Output not bounded to [0,1] -- needs additional clipping. Requires std > 0.

**DBSF (3-sigma):**
```
norm(s) = (s - (mean(S) - 3*std(S))) / (6 * std(S))
```
- Pros: Handles heavy tails, bounded [0,1] (with clamping), statistically principled.
- Cons: Needs sufficient samples for meaningful statistics (N > ~20).

**For Contexter:** Min-max is the best fit. Corpus is small, result sets may be small (5-20 items), and simplicity matters. Bruch et al. confirmed that CC performance is "not sensitive to the choice of normalization so long as the transformation has reasonable properties."

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

**Phase 1 (Immediate -- fix bug):** Fix the score threshold. RRF scores with K=60 max out at ~0.033. The threshold of 0.3 filters everything. Either remove the threshold, set it to ~0.005, or apply it to raw scores before fusion.

**Phase 2 (Recommended -- switch to Convex Combination):**

- **What:** Replace RRF with weighted convex combination using min-max normalized scores.
- **Formula:** `final_score = alpha * minmax(vector_score) + (1 - alpha) * minmax(fts_score)`
- **Default alpha:** 0.5 (equal weighting, same as current RRF behavior).
- **Why:**
  - Layer 2: Pinecone uses this natively. Weaviate made it their default (relativeScoreFusion). OpenSearch recommends min_max + arithmetic_mean. Industry consensus is shifting from rank-based to score-based fusion.
  - Layer 3: Bruch et al. proved CC outperforms RRF both in-domain and out-of-domain. CC is sample-efficient (~50 labeled queries to tune alpha).
  - Layer 4: Equivalent to inverse-variance weighting / optimal cue integration from neuroscience. Preserves more information than rank-based methods.
  - Layer 5: Recovers ~40 bits of score magnitude information per query that RRF discards.
- **Expected impact:** Based on Weaviate's benchmarks, ~6% recall improvement over rank-based fusion. On domains with vocabulary mismatch, Bruch showed even larger gains.
- **Cost:** 0 operational cost increase. ~1 day implementation.
- **Risk:** Min-max is sensitive to outlier scores. Mitigated by clamping and using `topK * 2` candidate pool (already done).

**Phase 3 (Optional -- query-adaptive alpha):**

- **What:** Heuristic query classifier that adjusts alpha per query.
- **Rules (zero-latency, no ML model):**
  - Short query (1-2 words) + no question words: alpha=0.3 (favor keyword)
  - Long query (5+ words) + question words (how, why, what): alpha=0.7 (favor semantic)
  - Contains code/technical operators: alpha=0.2 (favor keyword)
  - Default: alpha=0.5
- **Why:** Meilisearch's Dynamic Weighting proves the concept. Deepset's SklearnQueryClassifier achieves 80x latency savings by routing queries. Stanford tests showed 42% precision boost with per-query method selection (though they abandoned LLM classification for rule-based due to latency).
- **Expected impact:** Moderate. Most benefit on extreme query types. May not be worth the complexity for Contexter's use case.
- **Cost:** ~0.5 day implementation.
- **Risk:** Heuristic rules may not generalize to all Contexter users' query patterns. Wrong alpha is worse than default 0.5 (Bruch showed ~5% penalty for badly tuned parameters).

**Phase 4 (Future -- if labeled data becomes available):**

- **What:** Tune alpha from user feedback signals (upvotes, click-through, LLM usage of retrieved chunks).
- **How:** Log (query, alpha, retrieval_results, user_signal) tuples. Optimize alpha via grid search on accumulated data. Update periodically (not per-query).
- **Why:** Bruch showed ~50 labeled examples suffice to find near-optimal alpha per domain.
- **When:** Only after Contexter has a feedback mechanism and sufficient usage data.

### 6.2 Implementation spec (Phase 2 -- Convex Combination)

- **Input:** `vectorResults: SearchResult[]` (cosine scores [0,1]), `ftsResults: SearchResult[]` (ts_rank scores [0, unbounded]), `alpha: number = 0.5`, `topK: number = 10`
- **Output:** `HybridSearchResult[]` sorted by fused score descending
- **Algorithm:**
  1. Min-max normalize vector scores to [0,1] (already bounded, but normalize within result set for relative ranking).
  2. Min-max normalize FTS scores to [0,1].
  3. For each unique document: `fused = alpha * norm_vector_score + (1-alpha) * norm_fts_score`. Documents appearing in only one list get 0 for the missing signal.
  4. Sort by fused score descending, take topK.
  5. Apply score threshold to fused scores (threshold ~0.1 for normalized [0,1] range, or remove threshold entirely).
- **Config:**
  - `FUSION_ALPHA = 0.5` (default, overridable per search)
  - `SCORE_THRESHOLD = 0.0` (effectively disabled; filtering is topK-based)
- **Fallback:** If either result list is empty, return the other list's results directly with normalized scores.
- **Edge cases:**
  - All scores identical in one list: min-max normalization yields 0/0. Fallback to equal scores (0.5) for that list.
  - Single result in a list: normalized to 1.0.

### 6.3 Validation plan

- **How to measure improvement:** Create a manual evaluation set of ~30 queries with expected top-3 results. Compare RRF vs CC ordering. Measure Hit@3 and MRR@10.
- **A/B test:** Log both RRF and CC results for each query (run both, serve CC, log comparison). After 100 queries, compare which produces better results based on downstream LLM answer quality.
- **Minimum success criteria:** CC matches or exceeds RRF on Hit@3 for the manual eval set. No latency regression.
- **Rollback trigger:** If CC produces clearly worse results for >20% of test queries, revert to RRF and investigate.

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Keep RRF, just fix K** | K=60 is already near-optimal for general use. The problem isn't K, it's the rank-only information loss. Tuning K to 30 or 90 yields <2% difference (robust parameter). |
| **DBSF (3-sigma normalization)** | Requires sufficient result set size (N > ~20) for meaningful statistics. Contexter's small corpus may return 5-15 results per retriever. DBSF degrades to noisy normalization with small N. |
| **Learned weights via ML model** | No labeled training data. No user feedback loop. Premature optimization. Phase 4 defers this to when data exists. |
| **LLM-based query classification** | Adds 200-500ms latency per query for an LLM call. Cost per query increases. Overkill for Contexter's scale. Rule-based heuristics achieve 80% of the benefit at 0 cost. |
| **Cross-encoder reranker (alone)** | Reranking is orthogonal to fusion -- it should be added AFTER fusion, not instead of it. Better fusion improves the candidate set the reranker receives. Reranking is a separate feature with its own cost/latency tradeoffs (already researched in reranking-deep-research.md). |
| **CombMNZ** | Amplifies multi-list overlap, which is good, but still requires score normalization. CC with alpha achieves the same effect more controllably. CombMNZ's multiplicative factor makes it less predictable. |
| **SRRF (Scaled RRF)** | More complex than CC for marginal gain. Still fundamentally rank-based. Beta parameter introduces new tuning requirement. AutoRAG's own benchmarks show CC (TM2C2) often outperforms SRRF. |
| **Inverse Variance Weighting** | Theoretically optimal but requires Gaussian assumption on score distributions, which doesn't hold for ts_rank (heavily right-skewed). Would need distribution fitting per query, adding complexity. The simple alpha parameter in CC approximates this adequately. |

---

## Appendix A: Fusion Method Decision Tree

```
Do you have labeled relevance data (>50 queries)?
  YES -> Convex Combination with tuned alpha (Bruch recommendation)
  NO  -> Do you need zero-config simplicity?
           YES -> RRF K=60 (safe default)
           NO  -> Convex Combination with alpha=0.5 + heuristic query classifier
                  (recovers score information, matches or beats RRF)
```

For Contexter: NO labeled data + willing to implement CC = **Phase 2 (CC with alpha=0.5)**.

## Appendix B: Score Range Reference

| Signal | Score range | Distribution shape | Notes |
|---|---|---|---|
| pgvector cosine similarity | [0, 1] (typical: 0.3-0.9) | Near-Gaussian, centered on corpus mean | Higher = more similar |
| PostgreSQL ts_rank | [0, ~unbounded) | Right-skewed, many zeros | Not true BM25; simplified TF |
| RRF score (K=60) | [0, ~0.033] | Discrete, narrow range | Max = 1/(60+1) per list |
| Min-max normalized | [0, 1] | Preserves shape | Applied per query, per list |

## Appendix C: Industry Comparison Table

| System | Default fusion | Score-based option | Adaptive weights | Reranker support |
|---|---|---|---|---|
| **Contexter (current)** | RRF K=60 | No | No | No |
| **Contexter (proposed)** | CC alpha=0.5 | Yes (is default) | Heuristic (Phase 3) | Separate feature |
| **Weaviate** | relativeScoreFusion | Yes (default) | alpha parameter | Yes |
| **Pinecone** | CC (alpha scaling) | Yes (only option) | Per-query alpha | Yes |
| **Qdrant** | RRF or DBSF | DBSF | Manual selection | Yes |
| **OpenSearch** | min_max + arithmetic_mean | Yes (default) | Weight per clause | Yes |
| **Elasticsearch** | RRF (commercial) | Linear Retriever (new) | Manual weights | ELSER + semantic reranker |
| **Vespa** | Linear combination | Yes (only option) | Global-phase normalize | Yes (cross-encoder) |
| **Meilisearch** | Dynamic Weighting | Proprietary | Automatic per query | Built-in |

## Appendix D: Sources

### Papers
- Cormack, Clarke, Buttcher. "Reciprocal rank fusion outperforms Condorcet and individual rank learning methods." SIGIR 2009. https://dl.acm.org/doi/10.1145/1571941.1572114
- Bruch, Gai, Ingber. "An Analysis of Fusion Functions for Hybrid Retrieval." ACM TOIS, 2024. https://dl.acm.org/doi/10.1145/3596512 / https://arxiv.org/abs/2210.11934
- Fox, Shaw. "Combination of Multiple Searches." TREC-2, 1994. (CombSUM/CombMNZ origin)

### Product documentation
- Weaviate Fusion Algorithms: https://weaviate.io/blog/hybrid-search-fusion-algorithms
- Pinecone Hybrid Search: https://docs.pinecone.io/guides/search/hybrid-search
- Qdrant Hybrid Search: https://qdrant.tech/articles/hybrid-search/
- OpenSearch Normalization Processor: https://docs.opensearch.org/latest/search-plugins/search-pipelines/normalization-processor/
- Vespa Hybrid Search: https://blog.vespa.ai/improving-zero-shot-ranking-with-vespa-part-two/
- Elasticsearch Hybrid Search: https://www.elastic.co/search-labs/blog/hybrid-search-elasticsearch
- Meilisearch Hybrid Search: https://www.meilisearch.com/blog/hybrid-search-rag

### Blog posts and analysis
- DBSF: https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18
- SRRF: https://medium.com/@autorag/for-better-hybrid-retrieval-introducing-srrf-7fbc4e4d322a
- Agentic Hybrid Search (Feb 2026): https://medium.com/@shivangimasterblaster/agentic-hybrid-search-in-elasticsearch-building-a-self-optimizing-rag-system-with-adaptive-d218e6d68d9c
- deepset Query Classifier: https://www.deepset.ai/blog/save-resources-with-query-classifier-for-neural-search
- Superlinked RAG Optimization: https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking
