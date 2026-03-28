# Deep Research: Context Diversity for RAG
> Feature: Context assembly diversity (MMR, dedup, document spread)
> Date: 2026-03-28
> Status: COMPLETE

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: `buildContext()` in `contexter/src/services/rag/context.ts` assembles context from search results
- **How**: Greedy top-K — iterates `HybridSearchResult[]` in score order, appends `[Source N]\n{content}` until token budget exhausted
- **Algorithm**: Pure greedy. No diversity, no deduplication, no document-level balancing
- **Token estimation**: ~1.3 tokens/word (English average), hard-coded
- **Known issues**:
  - **Score dominance**: If one document's chunks dominate top scores, all context comes from that single document. Other relevant documents are completely ignored.
  - **Near-duplicate waste**: Overlapping chunks from the same region of a document (due to chunking overlap) can fill context with 80%+ redundant content. Sibling chunks that differ by a few sentences still get selected as distinct entries.
  - **No document spread**: A knowledge base with 50 documents may produce context from only 1-2 documents for a broad query.
  - **Token waste**: Redundant chunks consume token budget that could carry novel information from other documents.
  - **No embedding access at assembly time**: `buildContext()` receives pre-scored results. It has `score` but no embedding vectors, so pairwise similarity between chunks cannot be computed without additional data.

### 1.2 Metrics (baseline)

- **Baseline diversity**: 0 (no diversity mechanism exists)
- **Baseline latency**: ~0ms (context assembly is pure iteration, negligible)
- **Baseline cost**: 0 additional (no embeddings computed during assembly)
- **User impact**: Context may be narrow/one-sided for multi-document queries. LLM answers may miss critical information from lower-scored but topically distinct documents. For multi-hop questions requiring synthesis across documents, the greedy approach systematically fails.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

- **Algorithm**: Maximal Marginal Relevance (MMR)
- **Paper**: Carbonell & Goldstein, "The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries" (SIGIR 1998, CMU)
- **Why it's standard**: 28 years of validation. Simple, effective, tunable. Single parameter (lambda). Greedy with no complex dependencies. Adopted by every major vector DB and RAG framework.
- **Who uses it**: LangChain, LlamaIndex, Elasticsearch, OpenSearch (v3.3+), Qdrant, Weaviate, Pinecone, Azure AI Search, ChromaDB, Google Cloud Bigtable

### 2.2 MMR Formula

```
MMR = argmax_{d_i in D\S} [ lambda * Sim1(d_i, q) - (1 - lambda) * max_{d_j in S} Sim2(d_i, d_j) ]
```

Where:
- `D` = candidate set (initial retrieval results, typically `fetch_k` items)
- `S` = already-selected set (starts empty, grows to `k`)
- `q` = query (or query embedding)
- `Sim1(d_i, q)` = relevance of candidate to query (cosine similarity to query embedding)
- `Sim2(d_i, d_j)` = similarity between candidate and already-selected item (cosine similarity between embeddings)
- `lambda` = tradeoff parameter: 1.0 = pure relevance (greedy), 0.0 = pure diversity

### 2.3 MMR Pseudocode

```
function mmr_select(candidates, query, k, lambda):
    selected = []
    remaining = copy(candidates)

    // First pick: pure relevance (penalty = 0, no items in S yet)
    best = argmax(remaining, by: Sim1(item, query))
    selected.append(best)
    remaining.remove(best)

    // Subsequent picks: balance relevance vs redundancy
    while len(selected) < k and remaining not empty:
        best_score = -infinity
        best_item = null

        for item in remaining:
            relevance = Sim1(item, query)
            penalty = max(Sim2(item, s) for s in selected)
            score = lambda * relevance - (1 - lambda) * penalty
            if score > best_score:
                best_score = score
                best_item = item

        selected.append(best_item)
        remaining.remove(best_item)

    return selected
```

**Complexity**: O(k * N) where N = |candidates|, k = number to select. Each iteration scans remaining candidates and compares against selected set. Practically O(k * N * k) = O(N * k^2) for the full inner loop (comparing against all selected items). For typical RAG sizes (N=50, k=10), this is ~5000 operations — negligible.

### 2.4 Top implementations

| Product/Framework | Approach | Default lambda | Key insight |
|---|---|---|---|
| LangChain | `search_type="mmr"`, `lambda_mult` param, `fetch_k` for initial pool | 0.5 | Fetches `fetch_k` (default 20) candidates, then selects `k` (default 4) via MMR |
| LlamaIndex | `VectorIndexRetriever` with `mmr_threshold` | 0.5 | Integrated into SimpleVectorStore; mmr_threshold close to 1 = more relevance |
| Qdrant | Native MMR reranking in search API | 0.5 | Server-side MMR, no extra round-trip; `prefetch` larger set then MMR-rerank |
| Elasticsearch | `linear_combination` with MMR post-processing | configurable | Part of kNN search pipeline |
| OpenSearch 3.3+ | Vector search with MMR reranking (2026) | configurable | Server-side, integrated into search pipeline |
| Azure AI Search | MMR in semantic search pipeline | 0.5 | Combined with cross-encoder reranking |

### 2.5 Standard configuration & pitfalls

- **lambda default**: 0.5 (balanced). Production systems often use 0.6-0.7 (slightly favor relevance)
- **fetch_k / prefetch ratio**: 3-5x the final k. If you want 10 chunks in context, fetch 30-50 candidates for MMR pool
- **Similarity metric**: Cosine similarity for both Sim1 and Sim2 (embeddings must be available)
- **Common pitfalls**:
  - **lambda too low** (< 0.3): sacrifices too much relevance, returns off-topic but diverse results
  - **lambda too high** (> 0.9): barely any diversity effect, approaches greedy top-K
  - **fetch_k too small**: MMR has no room to diversify; if fetch_k == k, MMR degenerates to greedy
  - **Not normalizing scores**: MMR assumes Sim1 and Sim2 are on the same scale [0,1]. If relevance scores come from BM25 (unbounded) and diversity from cosine (bounded), rebalancing is needed
  - **Ignoring document-level diversity**: MMR operates at chunk level by default — two chunks from the same document may still be selected if they differ in embedding space
- **Migration effort from current greedy**: LOW (~50-100 lines). MMR is a drop-in replacement for the selection loop. Same inputs (scored results + embeddings), same output (ordered subset).

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from 2025-2026)

| Paper/Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **DF-RAG: Query-Aware Diversity for RAG** (arXiv 2601.17212) | 2026-01 | Adaptive lambda per query via Planner + Evaluator. Injects diversity into MMR dynamically based on query complexity (multi-hop vs single-hop). +8.9% improvement over vanilla RAG at 500-word contexts. | Research (EACL 2026 Findings) | HIGH — the insight that lambda should adapt per query is directly applicable. Simple version: increase diversity for multi-keyword queries |
| **"Diversity Enhances LLM Performance in RAG"** (arXiv 2502.09017) | 2025-02 | Empirical proof that MMR and Farthest Point Sampling increase recall of relevant sentences before LLM QA and summarization. Directly validates diversity for RAG context assembly. | Research | HIGH — provides empirical backing for our MMR adoption |
| **MUSS: Multilevel Subset Selection** (arXiv 2503.11126) | 2025-03 | Multilevel approach to diverse subset selection. Clusters data, selects within clusters, then merges. +4 pp precision in recommender systems, 20-80x faster than standard MMR. In production at Amazon. | Production (Amazon) | MEDIUM — useful if our candidate sets grow very large (1000+). Overkill for current scale (50-100 candidates) |
| **Cluster-based Adaptive Retrieval (CAR)** (arXiv 2511.14769) | 2025-11 | Uses clustering (K-Means, DBSCAN, HDBSCAN) to dynamically determine optimal number of documents to retrieve based on similarity distance patterns. | Research | LOW-MEDIUM — more about adaptive K than diversity within fixed K |
| **Jina AI Submodular Optimization** (blog, 2025-07) | 2025-07 | Applies submodular function maximization to text/passage selection for context engineering. Uses facility location / coverage functions with (1-1/e) approximation guarantee. Token-level and passage-level selection. | Production (Jina) | MEDIUM — theoretically superior to MMR but more complex. Worth considering for v2 |
| **MS-DPPs** (IJCAI 2025) | 2025 | Multi-Source Determinantal Point Processes for contextual diversity. Extends DPP to multi-source settings. | Research | LOW — DPPs are mathematically elegant but complex to implement. Not justified for our scale |
| **Cross-Document Topic-Aligned Chunking (CDTA)** (arXiv 2601.05265) | 2026-01 | Reconstructs knowledge at corpus level by identifying cross-document topics, mapping segments, synthesizing unified chunks. Addresses diversity at chunking time rather than selection time. | Research | LOW for now — requires fundamental changes to chunking pipeline |

### 3.2 Open questions in the field

- **Optimal lambda per query type**: DF-RAG shows lambda should vary, but no universal formula exists. How to predict optimal diversity level without an expensive LLM planner call?
- **Diversity metric for evaluation**: No consensus on how to measure "answer completeness" improvement from diversity. TREC 2025 RAG track uses nugget-based evaluation but it's expensive.
- **Token-level vs chunk-level diversity**: Jina's work suggests operating at token level. Is sub-chunk diversity worth the computational cost?
- **Diversity across modalities**: As RAG systems incorporate images, tables, and code, diversity must account for modality differences, not just semantic similarity.

### 3.3 Bets worth making

- **Adaptive lambda based on query features** (low cost, high potential): Simple heuristic — more keywords in query = lower lambda (more diversity). Multi-hop detection increases diversity automatically.
- **Document-level MMR enhancement** (low cost, medium potential): After standard MMR, apply a document-spread bonus that penalizes chunks from already-represented documents. Cheap to implement on top of MMR.
- **Submodular optimization for large candidate sets** (medium cost, high potential for scale): If Contexter grows to handle 1000+ chunk candidate pools, MUSS or facility-location-based selection would provide both speed and quality gains over quadratic MMR.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Finance (Markowitz Portfolio Theory, 1952)** | Maximize return while minimizing risk through diversification | Mean-variance optimization: don't pick assets with highest individual return — pick the portfolio with best risk-adjusted return. Correlation matrix between assets is the key input. | Direct analogy: chunks = assets, relevance = expected return, inter-chunk similarity = correlation. A "portfolio" of chunks should maximize total information while minimizing redundancy. Lambda in MMR ~ risk tolerance. |
| **Ecology (Biodiversity)** | Measure and maintain species diversity in ecosystems | Shannon Diversity Index: H = -sum(p_i * ln(p_i)). Accounts for both richness (number of species) and evenness (distribution). Simpson's Index for dominance. | Can use Shannon entropy over document sources as a diversity metric: H over document distribution in selected chunks. If H is low, one document dominates = low diversity. |
| **Signal Processing (Nyquist-Shannon)** | Reconstruct a signal from samples without aliasing | Sample at 2x the highest frequency. Uniform sampling in frequency domain captures all information. | Chunks from a single document are like oversampling one frequency. Need to "sample" the information space at diverse points to reconstruct the full "signal" (answer). |
| **Genetics (Gene Pool Diversity)** | Maintain genetic diversity for population resilience | Heterozygote advantage: diverse gene pools resist disease better than homogeneous ones. Inbreeding depression. | Homogeneous context (all chunks from one doc) = "inbreeding" — vulnerable to that document's biases/errors. Diverse context = resilient answers. |
| **Jury Selection (Law)** | Select a jury that represents diverse perspectives | Stratified selection: ensure representation from different demographics, backgrounds, experiences. | Document-stratified selection: ensure representation from different source documents, not just highest-scoring chunks. |

### 4.2 Biomimicry / Nature-inspired

- **Ant colony foraging**: Ants don't all follow the strongest pheromone trail. Some explore randomly. This exploration-exploitation balance maps to relevance-diversity tradeoff. The "explore" probability in ant algorithms ~ (1 - lambda) in MMR.
- **Neural attention**: The brain's attention mechanism doesn't fixate on the single strongest stimulus. Inhibition of return (IOR) suppresses already-attended locations, forcing attention to new stimuli. MMR's diversity penalty is computationally analogous to IOR.
- **Immune system diversity**: T-cell receptor diversity ensures the immune system can respond to novel threats. Narrow repertoire = vulnerability. Diverse context = ability to answer unexpected follow-up questions.

### 4.3 Engineering disciplines

- **Information theory**: Shannon entropy measures information content. Redundant chunks carry near-zero marginal information (mutual information with existing context approaches total information). Diverse chunks maximize conditional entropy H(new_chunk | existing_context).
- **Signal processing**: Compressed sensing shows you can reconstruct a sparse signal from far fewer measurements than Nyquist requires — but only if measurements are incoherent (diverse). Greedy top-K is like taking coherent measurements — many samples, little information.
- **Control systems**: PID controllers avoid oscillation by using derivative (change) alongside proportional (current error). Pure proportional = greedy relevance. Adding derivative ~ adding diversity (responding to rate of change in information coverage).
- **Queueing theory**: The "shortest job first" scheduler is optimal for average wait time but causes starvation of long jobs. Analogously, greedy top-K "starves" lower-scored but important documents. Fair schedulers (round-robin, weighted fair queueing) map to document-level diversity constraints.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **What math we use**: Cosine similarity for relevance scoring (via Vectorize). RRF (Reciprocal Rank Fusion) for hybrid search combining BM25 + vector scores. Then pure greedy selection (argmax by score, no further optimization).
- **Assumptions**: (1) Highest-scored chunks are most useful. (2) Chunks are independent — selecting one doesn't affect the value of others. (3) Linear token budget constraint.
- **Where assumptions break**: Assumption (2) is catastrophically wrong. Chunks are NOT independent. If chunk A and chunk B convey 90% the same information, selecting both wastes budget. The value of chunk B given chunk A is ~10% of its standalone value. Greedy ignores this conditional value entirely.

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers/References |
|---|---|---|---|---|
| **MMR (greedy marginal gain)** | IR (1998) | Simple, one tunable parameter, linear-time per selection step | O(N * k^2) total | Carbonell & Goldstein 1998 |
| **Submodular function maximization** | Combinatorial optimization | Formal (1-1/e) approximation guarantee for monotone submodular objectives. MMR is a special case. | O(N * k) per greedy step | Nemhauser, Wolsey, Fisher 1978; Jina 2025 |
| **Determinantal Point Processes (DPP)** | Quantum physics / random matrix theory | Provably optimal diversity: samples subsets where probability is proportional to determinant of kernel matrix (high-quality + diverse items get highest probability). | O(N * k^3) for greedy MAP | Kulesza & Taskar 2012; MS-DPPs (IJCAI 2025) |
| **Facility Location** | Operations research | Select k "facilities" (chunks) to maximize coverage of "clients" (information needs). Naturally submodular. | O(N * k) greedy | Classic OR literature; Jina 2025 application |
| **Farthest Point Sampling (FPS)** | Computational geometry | Maximum spread in embedding space. Select next point that is farthest from all selected. | O(N * k) | Wang et al. 2025 (arXiv 2502.09017) |
| **MUSS (Multilevel Subset Selection)** | Graph partitioning | Cluster → select within clusters → merge. 20-80x faster than standard MMR with comparable quality. | O(N log N) | Nguyen & Kan 2025 (arXiv 2503.11126) |

### 5.3 Optimization opportunities

- **Current bottleneck**: Not computational (context assembly is trivial) but informational — we select a suboptimal subset. The greedy approach maximizes sum of individual relevances but not the joint information value of the selected set.
- **Better objective function**: Maximize `f(S) = sum_{i in S} Sim1(d_i, q) - alpha * sum_{i,j in S, i<j} Sim2(d_i, d_j)`. This is a "facility location with penalties" formulation — reward relevance, penalize redundancy. MMR's greedy approach approximates this.
- **No embedding vectors needed for document-level diversity**: A simpler first step — apply a per-document cap (max N chunks from any single document) before or after scoring. Zero additional computation. Significant diversity gain.

### 5.4 Information-theoretic analysis

- **Marginal information of redundant chunks**: If chunk B has cosine similarity 0.95 with already-selected chunk A, the marginal information B adds is roughly proportional to `1 - sim(A, B)` = 0.05 of its standalone information. Selecting B "costs" full token budget but provides ~5% marginal value. This is the core waste of greedy selection.
- **Diminishing returns formalization**: The function f(S) = "total information covered by chunk set S" is submodular: adding a chunk to a smaller set always provides >= marginal gain than adding it to a larger set. This is exactly the diminishing returns property. The greedy algorithm for submodular maximization (which MMR approximates) guarantees at least (1 - 1/e) ~ 63.2% of optimal coverage.
- **Shannon entropy as diversity metric**: Given selected chunks, compute document-source distribution p_i = (chunks from doc_i) / (total chunks). Shannon entropy H = -sum(p_i * log(p_i)). Maximum H = log(k) when chunks are evenly spread across k documents. Minimum H = 0 when all chunks come from one document. This metric is cheap to compute and meaningful.
- **Mutual information between chunks**: For two chunks with embeddings e_A and e_B, the cosine similarity approximates their mutual information in the embedding space. High similarity = high MI = high redundancy. MMR's penalty term directly targets MI reduction.

### 5.5 Linear algebra / geometry insights

- **Hubness problem**: In high-dimensional embedding spaces (1024-dim for Contexter), some vectors become "hubs" — they appear similar to disproportionately many other vectors. This means some chunks will always score high in pairwise similarity, making them perpetual penalty targets in MMR. QB-Norm debiasing can address this but adds complexity.
- **Embedding space utilization**: Document embeddings often cluster on a lower-dimensional manifold within the high-dimensional space. Chunks from the same document form tight clusters. MMR effectively selects points from different clusters, which is geometrically equivalent to maximizing the volume of the convex hull of selected embeddings — exactly what DPPs optimize for.
- **Cosine similarity concentration**: In 1024 dimensions, random vectors tend to have cosine similarity near 0. Only semantically related chunks show cosine > 0.3. This means MMR's penalty term has natural "resolution" — it effectively distinguishes related from unrelated chunks. For Contexter's embedding dimension, MMR is well-behaved.
- **Score scale alignment**: Our hybrid search produces RRF scores (bounded, [0,1]-ish) for Sim1 (relevance). For Sim2 (inter-chunk similarity), cosine similarity is in [-1,1] but practically [0,1] for related chunks. These scales are naturally aligned, which simplifies MMR implementation.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: MMR with Document-Level Diversity Enhancement

**What**: Replace greedy top-K selection in `buildContext()` with a two-layer diversity mechanism:
1. **MMR selection** (primary) — standard Maximal Marginal Relevance for chunk-level diversity
2. **Document spread bonus** (secondary) — lightweight penalty for chunks from already-represented documents

**Why** (supported by all layers):
- **Layer 2**: MMR is the universal industry standard, adopted by LangChain, LlamaIndex, Qdrant, Elasticsearch, OpenSearch, Azure AI Search. Battle-tested for 28 years.
- **Layer 3**: DF-RAG (EACL 2026) shows +8.9% improvement on RAG QA tasks with diversity. Wang et al. (2025) empirically prove diversity enhances LLM performance in RAG. MUSS (Amazon, 2025) validates the approach at production scale.
- **Layer 4**: Finance (portfolio diversification), ecology (biodiversity), signal processing (incoherent sampling), neuroscience (inhibition of return) all converge on the same principle: diverse sampling outperforms concentrated sampling for information coverage.
- **Layer 5**: Greedy top-K violates the submodularity of information coverage. Redundant chunks waste ~95% of their token cost. MMR provides (1-1/e) approximation guarantee. Shannon entropy over document sources provides a cheap evaluation metric.

**Expected impact**:
- **Answer completeness**: +5-10% improvement on multi-document queries (conservative estimate from DF-RAG benchmarks)
- **Document coverage**: From 1-2 documents to 3-5+ documents in typical context window
- **Token efficiency**: ~20-40% reduction in redundant content, allowing more novel information per token
- **No latency impact**: MMR adds O(k^2 * N) operations where k~10, N~50 — microseconds

**Cost**: ~2-4 hours implementation. Requires embedding vectors to be passed through to `buildContext()`.

**Risk**: Lambda misconfiguration could reduce relevance if set too low. Mitigated by default lambda=0.7 (conservative, relevance-favoring) and per-query tuning as a future enhancement.

### 6.2 Implementation spec (brief)

**Input changes**:
```typescript
interface DiverseContextOptions {
  maxTokens: number          // existing (default: DEFAULT_MAX_CONTEXT_TOKENS)
  lambda: number             // NEW: MMR tradeoff, default 0.7
  fetchK: number             // NEW: candidate pool size, default 3x target chunks
  maxChunksPerDocument: number // NEW: document diversity cap, default 3
}
```

**Embedding requirement**: `HybridSearchResult` must carry embedding vectors (or they must be accessible) for pairwise cosine similarity. If embeddings are not available at assembly time, fallback to document-level-only diversity (no MMR, just per-document caps).

**Algorithm (step by step)**:
1. Receive `results: HybridSearchResult[]` (already sorted by relevance score)
2. Take top `fetchK` results as candidate pool
3. Apply MMR selection loop:
   a. First chunk: highest relevance score (same as greedy)
   b. Each subsequent chunk: `score = lambda * relevance(chunk) - (1 - lambda) * max_sim(chunk, selected)`
   c. Additionally subtract `docPenalty` if chunk's document already has N chunks selected (document spread bonus)
   d. Select highest-scoring chunk, add to selected set
   e. Check token budget; stop if exceeded
4. Return selected chunks in MMR-order with sources

**Fallback (no embeddings available)**: Apply document-level diversity only:
1. Sort results by score
2. Iterate, but skip chunks from any document that already has `maxChunksPerDocument` chunks selected
3. Continue until token budget filled
This is zero-cost and captures ~60% of the diversity benefit.

**Config defaults**:
- `lambda`: 0.7 (favors relevance; conservative start)
- `fetchK`: 3 * targetChunks (if targeting ~10 chunks in context, fetch top 30)
- `maxChunksPerDocument`: 3 (allow at most 3 chunks from any single document)

### 6.3 Validation plan

**How to measure improvement**:
- **Diversity metric**: Shannon entropy H over document-source distribution in selected chunks. Measure before/after.
- **Unique document count**: Count distinct `documentId` values in context sources. Target: 2-3x increase.
- **Answer quality** (manual): For 20 test queries across different knowledge bases, compare LLM answers with greedy vs MMR context. Score completeness on 1-5 scale.
- **Deduplication ratio**: Measure average pairwise cosine similarity among selected chunks. Lower = less redundancy.

**Minimum success criteria**:
- Shannon entropy increases by >= 50% (e.g., from 0.4 to 0.6+)
- Unique document count increases by >= 2x on multi-document knowledge bases
- No regression in single-document query quality (lambda=0.7 should preserve this)

**Rollback trigger**:
- Answer quality drops on > 20% of test queries
- Latency increase > 10ms p95 (should not happen given O(k^2*N) with small k, N)

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **DPP (Determinantal Point Processes)** | Mathematically optimal but O(N*k^3) complexity, requires kernel matrix construction, complex to implement correctly. Marginal quality gain over MMR doesn't justify complexity for our scale (N < 100 candidates). |
| **Submodular facility location** | Superior theoretical guarantees (1-1/e) but requires defining a coverage function over information needs, which is abstract. MMR approximates this with simpler mechanics. Worth revisiting at larger scale. |
| **MUSS (Multilevel Subset Selection)** | 20-80x faster than MMR but designed for N > 10,000. At our scale (N < 100), standard MMR is already sub-millisecond. MUSS overhead (clustering) would dominate. |
| **Pure document round-robin** | Select one chunk per document in rotation. Too aggressive — ignores relevance entirely. A highly relevant document should contribute more chunks than an irrelevant one. |
| **Cross-encoder reranking for diversity** | Cross-encoders rerank for relevance, not diversity. They could improve the relevance signal fed into MMR, but they don't solve the diversity problem themselves. Separate concern — valuable but orthogonal. |
| **Adaptive lambda (DF-RAG style)** | Requires an LLM call (Planner) to estimate query complexity. Adds latency and cost per query. Valuable as a v2 enhancement but premature for initial implementation. Simpler heuristics (keyword count, query length) can approximate. |
| **Farthest Point Sampling** | Pure diversity, no relevance component. Would need to be combined with relevance in a weighted scheme, which converges to MMR anyway. |
| **Deduplication via MinHash/SimHash** | Designed for near-exact duplicate detection at massive scale. Our chunks are too short (200-500 tokens) and too few (< 100) for MinHash to be effective. Cosine similarity on embeddings handles semantic near-duplicates more naturally at our scale. |

---

## Sources

### Papers
- Carbonell & Goldstein, "The Use of MMR, Diversity-Based Reranking" (SIGIR 1998) — [CMU PDF](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf)
- Wang et al., "Diversity Enhances an LLM's Performance in RAG and Long-context Task" (2025) — [arXiv 2502.09017](https://arxiv.org/abs/2502.09017)
- DF-RAG, "Query-Aware Diversity for Retrieval-Augmented Generation" (2026) — [arXiv 2601.17212](https://arxiv.org/html/2601.17212)
- MUSS, "Multilevel Subset Selection for Relevance and Diversity" (2025) — [arXiv 2503.11126](https://arxiv.org/abs/2503.11126)
- CAR, "Cluster-based Adaptive Retrieval" (2025) — [arXiv 2511.14769](https://arxiv.org/abs/2511.14769)
- MS-DPPs, "Multi-Source Determinantal Point Processes for Contextual Diversity" (IJCAI 2025) — [PDF](https://www.ijcai.org/proceedings/2025/0207.pdf)
- Cross-Document Topic-Aligned Chunking (2026) — [arXiv 2601.05265](https://arxiv.org/html/2601.05265v1)
- "Vector Retrieval with Similarity and Diversity: How Hard Is It?" (2024) — [arXiv 2407.04573](https://arxiv.org/pdf/2407.04573)
- You et al., "Semantics at an Angle: When Cosine Similarity Works Until It Doesn't" (2025) — [arXiv 2504.16318](https://arxiv.org/html/2504.16318v2)

### Framework documentation
- [LangChain MMR](https://python.langchain.com/v0.1/docs/modules/model_io/prompts/example_selectors/mmr/)
- [LangChain.js MMR options](https://v03.api.js.langchain.com/types/_langchain_core.vectorstores.MaxMarginalRelevanceSearchOptions.html)
- [LlamaIndex MMR demo](https://developers.llamaindex.ai/python/examples/vector_stores/simpleindexdemommr/)
- [Qdrant MMR blog](https://qdrant.tech/blog/mmr-diversity-aware-reranking/)
- [OpenSearch MMR docs](https://docs.opensearch.org/latest/vector-search/specialized-operations/vector-search-mmr/)
- [Elasticsearch MMR](https://www.elastic.co/search-labs/blog/maximum-marginal-relevance-diversify-results)
- [Azure AI Search MMR](https://farzzy.hashnode.dev/enhancing-rag-with-maximum-marginal-relevance-mmr-in-azure-ai-search)

### Industry articles
- [Jina AI: Submodular Optimization for Text Selection, Passage Reranking & Context Engineering](https://jina.ai/news/submodular-optimization-for-text-selection-passage-reranking-context-engineering/)
- [Full Stack Retrieval: MMR](https://community.fullstackretrieval.com/retrieval-methods/maximum-marginal-relevance)
- [Mitchell Bryson: RAG data quality at scale](https://www.mitchellbryson.com/articles/ai-rag-data-quality-at-scale)
- [Ailog: MMR Diversify Search Results](https://app.ailog.fr/en/blog/guides/mmr-diversification)
- [RAGFlow: From RAG to Context — 2025 year-end review](https://ragflow.io/blog/rag-review-2025-from-rag-to-context)

### Cross-disciplinary
- [Modern Portfolio Theory — Wikipedia](https://en.wikipedia.org/wiki/Modern_portfolio_theory)
- [Shannon Diversity Index — Statology](https://www.statology.org/shannon-diversity-index/)
- [Submodular Functions and Greedy Maximization](https://www.jeremykun.com/2014/07/07/when-greedy-algorithms-are-good-enough-submodularity-and-the-1-1e-approximation/)
