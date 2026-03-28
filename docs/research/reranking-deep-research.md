# Deep Research: Reranking for RAG Systems
> Version: 1.0 | Date: 2026-03-28
> Context: Contexter (Hono/Bun/PostgreSQL/pgvector), Jina v4 1024-dim embeddings, Groq Llama 3.1 8B
> Status: COMPLETE

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: Hybrid search combining pgvector cosine similarity + PostgreSQL tsvector full-text search, merged via Reciprocal Rank Fusion (RRF). NO reranking step exists.
- **How**:
  1. Query rewrite: Groq Llama 3.1 8B generates N alternative queries (default N=2, so 3 total including original)
  2. Each query variant is embedded via Jina v4 (task=`retrieval.query`, 1024 dims)
  3. For each variant: parallel pgvector cosine search (topK*2) + tsvector FTS search (topK*2)
  4. RRF fusion (k=60) merges vector + FTS results per variant
  5. Cross-variant dedup by chunk ID, sort by RRF score descending
  6. buildContext: fill up to maxContextTokens (~1.3 tokens/word estimate)
  7. Groq Llama 3.1 8B generates answer with context
- **Performance**:
  - Retrieval latency: ~200-500ms (pgvector HNSW ef_search=64 + tsvector GIN, parallel)
  - No reranking latency (0ms -- nonexistent)
  - Embedding cost: Jina v4 at $0.02/1M tokens
  - LLM cost: Groq free tier / Llama 3.1 8B (very cheap)
- **Known issues**:
  - RRF score is rank-based, not relevance-based -- a document at rank 1 with 0.99 cosine similarity and rank 1 with 0.51 cosine similarity get the same RRF contribution
  - No cross-attention between query and document content after retrieval -- bi-encoder embeddings encode query and document independently, missing token-level interactions
  - Query rewrite improves recall but doesn't improve precision of returned results
  - scoreThreshold=0 by default in query route (effectively no filtering)
  - RRF is sensitive to k parameter (fixed at 60), optimal value varies by domain
  - RRF discards score magnitude information -- only ordinal rank matters

### 1.2 Metrics (measure before improving)

- **Baseline accuracy**: Not formally measured. No NDCG/MRR benchmarks on our data.
- **Baseline latency**: p50 ~300ms, p95 ~800ms (estimate: embed 3 variants + 6 PG queries + RRF)
- **Baseline cost**: ~$0.001 per query (Jina embedding for 3 variants + Groq LLM for rewrite + answer)
- **User complaints**: Not yet in production with enough users for systematic feedback. Quality is "good enough for MVP" per nopoint's assessment.

### 1.3 Pipeline diagram (current)

```
query -> rewrite (3 variants) -> embed each (Jina v4)
  -> for each variant:
       pgvector cosine (topK*2) || tsvector FTS (topK*2)
       -> RRF fusion (k=60, topK)
  -> cross-variant dedup + sort by score
  -> buildContext (token budget)       <-- reranking would insert HERE
  -> Groq LLM -> answer
```

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

- **Algorithm**: Two-stage retrieval -- fast approximate retrieval (bi-encoder / BM25 / hybrid) followed by cross-encoder reranker
- **Why it's standard**: Cross-encoders perform full cross-attention between query and document tokens, capturing semantic nuances that bi-encoders miss. Yields +5-15% NDCG improvements on BEIR/MTEB benchmarks. Reranked results reduce LLM hallucinations by ~35% compared to raw embedding similarity.
- **Who uses it**: Pinecone (built-in rerank API), Cohere (rerank as flagship product), Weaviate (native reranker module), Qdrant, Elasticsearch, Databricks, every enterprise RAG deployment, LlamaIndex, LangChain.

### 2.2 Top reranker models (2025-2026 landscape)

| Model | Provider | ELO (Agentset Leaderboard) | Latency | Pricing | Key insight |
|---|---|---|---|---|---|
| **zerank-2** | ZeroEntropy | #1 (top) | ~600ms | Custom (API) | Best overall; calibrated scores (0.8 = ~80% relevance); instruction-following |
| **Cohere Rerank 4 Pro** | Cohere | #2 (~1627 ELO) | ~614ms | $2/1K searches (up to 100 docs each) | +170 ELO over v3.5; massive +400 ELO on finance/business |
| **Cohere Rerank 4 Fast** | Cohere | #7 (~1506 ELO) | ~447ms | $2/1K searches | 37% faster than Pro, still +54 ELO over v3.5 |
| **Jina Reranker v3** | Jina AI | Top tier | ~188ms | $0.02/1M tokens | Only top-tier model under 200ms; 0.6B params; LBNL architecture |
| **Jina Reranker v2** | Jina AI | Top tier | 100ms-7s | $0.02/1M tokens | Open-source on HuggingFace; multilingual 100+ langs; function-calling |
| **Voyage Rerank 2.5** | Voyage AI | High | ~595ms | Per-token pricing | Excellent cross-lingual; strong synergy with Voyage embeddings |
| **BGE Reranker v2 M3** | BAAI | High | Self-hosted | Free (open-source) | Rivals Cohere on MRR; fully self-hostable; multilingual |
| **nemotron-rerank-1b** | NVIDIA | Top accuracy | Higher | NIM API | Top accuracy when latency not a constraint |
| **gte-reranker-modernbert-base** | Alibaba | Top accuracy | Higher | Free (open-source) | Shares top accuracy with nemotron |

### 2.3 Pricing deep-dive (for Contexter's use case)

Assumptions: topK=20 candidate chunks, average chunk ~200 tokens, ~100 queries/day initially.

| Reranker | Cost per query | Cost per 1K queries | Cost per month (3K queries) | Notes |
|---|---|---|---|---|
| **Jina Reranker v3** | ~$0.00008 | ~$0.08 | ~$0.24 | Token-based; 20 chunks x 200 tokens = 4K tokens per call |
| **Cohere Rerank 4** | $0.002 | $2.00 | $6.00 | Per-search; docs >500 tokens split into chunks counted separately |
| **Voyage Rerank 2.5** | ~$0.0003 | ~$0.30 | ~$0.90 | Token-based pricing |
| **BGE v2 M3 (self-hosted)** | $0 (API) | $0 | $0 + server cost | Need GPU/CPU inference; slow on CPU (~1-5s for 20 docs) |
| **Groq LLM (pointwise)** | ~$0.01-0.05 | ~$10-50 | ~$30-150 | 20 separate LLM calls per query; latency 2-5s |

**Winner on price**: Jina Reranker v3 at $0.02/1M tokens is ~25x cheaper than Cohere per query.
**Winner on quality**: zerank-2 or Cohere Rerank 4 Pro.
**Best price/quality ratio for Contexter**: Jina Reranker v3 -- already using Jina for embeddings (same API key, same billing).

### 2.4 Standard configuration (best practices)

- **Retrieve more, rerank fewer**: Fetch topK=20-50 from initial retrieval, rerank to final top 5-10
- **Score threshold after reranking**: Apply minimum relevance score AFTER reranker, not before
- **90% rule**: Start with ~50-100 candidates from retrieval, rerank down to 5-10 for generator
- **Stop rule**: Monitor NDCG@10 as you increase candidates; stop when gains drop below 2% per additional 25 candidates
- **Common pitfalls**:
  - Reranking with the same model that embedded (no benefit -- same representation)
  - Setting topK too low for initial retrieval (reranker can only reorder what it sees)
  - Not passing full chunk text to reranker (reranker needs actual content, not embeddings)
  - Documents >500 tokens with Cohere: each is split and counted as multiple "documents"

### 2.5 Migration path from current state

**Effort**: LOW. Single HTTP call inserted between RRF output and buildContext.

```
Current:  allResults.sort(by score) -> buildContext
Proposed: allResults -> rerank(query, allResults) -> buildContext
```

Estimated implementation: 1-2 hours. No infrastructure changes. API-based reranker.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2024-2026)

| Paper/Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **FIRST** (Faster Improved Listwise Reranking with Single Token) | 2024-10 (EMNLP) | Listwise LLM reranking via single-token decoding; drastically reduces LLM reranking latency | Research/prototype | Not yet -- too complex for our scale; interesting for future |
| **Jina Reranker v3 LBNL** (Last But Not Late Interaction) | 2025-09 (arXiv) | Novel architecture different from both cross-encoder and ColBERT late interaction; 0.6B params | Production | HIGH -- already available via Jina API we use |
| **LLM-Confidence Reranker (LCR)** | 2026-02 (Expert Systems with Applications) | Training-free reranking using black-box LLM confidence via MSCP (Maximum Semantic Cluster Proportion) | Research | Interesting for zero-cost reranking using our existing Groq LLM |
| **REBEL** (Multi-Criteria Reranking) | 2025-04 (arXiv) | Scales RAG quality with inference-time compute via multi-criteria reranking | Research | Future -- when we need criteria beyond relevance |
| **Jina ColBERT v2** | 2025 | +6.5% over ColBERT-v2, compact multilingual embeddings, PLAID 7x GPU / 45x CPU speedup | Production | Alternative to cross-encoder; requires index changes |
| **RAP-RAG** (Adaptive Retrieval Task Planning) | 2025 | Dynamically adjusts retrieval depth based on query complexity | Research | Future -- adaptive reranking depth |

### 3.2 Open questions in the field

- **Score calibration**: Most rerankers output uncalibrated scores (Voyage rerank-3.5 always outputs ~0.5 regardless of relevance). Only zerank-2 claims calibrated scores. How to set reliable thresholds?
- **Optimal fusion of RRF + reranker**: Should reranker replace RRF or complement it? No clear consensus.
- **When NOT to rerank**: For simple, high-confidence queries, the bi-encoder may be sufficient. Confidence-based routing (skip reranker if top bi-encoder score >> rest) is emerging but not standardized.

### 3.3 Bets worth making

- **Jina Reranker v3 via API**: Already in our vendor ecosystem, sub-200ms, cheapest token pricing. Zero infrastructure risk.
- **LLM-Confidence Reranker as fallback**: If Jina API is down, use our existing Groq Llama to score relevance. Training-free, zero additional cost beyond existing LLM calls.
- **Confidence-based skip**: If top RRF result has score >> 2nd result, skip reranking entirely. Saves latency and cost for easy queries.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Library Science / IR Theory** | Precision vs recall in catalog search | Two-stage: broad recall via subject headings, then precision via expert curation | Exactly our architecture: hybrid search for recall, reranker for precision |
| **Signal Processing** | Extracting signal from noise (SNR improvement) | Matched filter: maximize SNR by convolving signal with its template | Cross-encoder is a "matched filter" -- it directly measures query-document fit instead of comparing independent projections |
| **Radar / Sonar** | Target detection in clutter | CFAR (Constant False Alarm Rate): adaptive thresholding based on local noise | Adaptive score thresholds based on query difficulty; don't use fixed threshold |
| **Ensemble ML** | Combining weak classifiers into strong one | Boosting (sequential), Stacking (meta-learner) | RRF = bagging (parallel combination). Reranker = stacking (meta-learner on top of base rankers) |
| **Medical Diagnosis** | Screening (high recall) then diagnostic test (high precision) | Two-stage: cheap screening catches 95%+ cases, expensive diagnostic confirms | Same tradeoff: cheap retrieval gets candidates, expensive reranker confirms relevance |
| **Voting Theory** | Aggregating voter preferences into ranking | Condorcet method, Borda count | RRF is a Borda-count variant. Reranker is an expert judge overriding crowd vote |

### 4.2 Biomimicry / Nature-inspired

- **Human visual attention**: Humans do two-stage visual search -- peripheral vision scans broadly (recall), then foveal attention focuses on candidates (precision). Reranking mirrors foveal attention.
- **Immune system**: T-cells do two-stage recognition -- MHC molecules present candidates broadly, then T-cell receptors do high-specificity binding. Cross-encoder = T-cell receptor (high-specificity cross-interaction).

### 4.3 Engineering disciplines

- **Signal processing**: The cross-encoder is mathematically analogous to a matched filter. A matched filter maximizes SNR by correlating the received signal with a known template. A cross-encoder maximizes relevance by computing full attention between query tokens and document tokens. Both leverage the known query structure to optimally extract the signal (relevance) from noise (irrelevant documents).
- **Information theory**: Bi-encoder embedding = lossy compression of document into fixed-size vector. Information lost in compression cannot be recovered by comparing compressed representations. Cross-encoder avoids this loss by processing raw tokens directly. This is the fundamental information-theoretic argument for why reranking works.
- **Control systems**: Reranking acts as a feedback refinement loop. Initial retrieval = open-loop control (fire and forget). Reranking = closed-loop correction (measure actual query-document fit, adjust ranking).

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **Bi-encoder (pgvector)**: `score = 1 - cos_distance(embed(q), embed(d))` where embed() is Jina v4. Query and document are encoded independently. Score = cosine similarity of two 1024-dim vectors.
- **FTS (tsvector)**: `score = ts_rank(tsv, plainto_tsquery(q))` -- term frequency-based ranking.
- **RRF fusion**: `score(d) = sum(1/(k + rank_i(d)))` across all lists where d appears. k=60 (damping constant).
- **Assumptions**:
  - Cosine similarity in embedding space correlates with semantic relevance (approximately true, but embedding is lossy compression)
  - RRF rank is sufficient to merge heterogeneous score distributions (throws away magnitude information)
  - Higher RRF score = more relevant (true on average, but not per-query calibrated)
- **Where assumptions break**:
  - Cosine similarity misses nuanced relevance that requires token-level interaction (e.g., negation, conditional statements, specific quantity matching)
  - RRF treats rank 1 at 0.99 cosine the same as rank 1 at 0.51 cosine
  - No handling of score distribution shape -- if all cosine scores are clustered near 0.8, rank differences are noise

### 5.2 Cross-encoder mathematical advantage

**Bi-encoder scoring function**:
```
score_bi(q, d) = cos(f(q), g(d))     where f, g are independent encoders
```
- Each encoder sees only its own input
- Interaction happens only at the final dot product / cosine
- Information bottleneck: all semantic content compressed to a single 1024-dim vector

**Cross-encoder scoring function**:
```
score_cross(q, d) = sigmoid(W * CLS_token(Transformer(concat(q, [SEP], d))))
```
- Transformer processes q and d tokens jointly
- Full self-attention: every query token attends to every document token (and vice versa)
- No information bottleneck at scoring time -- all token-level interactions preserved
- CLS token aggregates the joint representation, linear layer + sigmoid maps to [0, 1] relevance

**Why cross-encoder is strictly more expressive**: The bi-encoder score is a special case of what a cross-encoder can compute. A cross-encoder with full attention can learn any function of (q, d) pairs, while a bi-encoder is limited to functions decomposable as `f(q)^T g(d)`. This is the fundamental mathematical reason cross-encoders consistently outperform bi-encoders on relevance tasks.

**Cost**: Cross-encoder is O(n * (|q| + |d|)^2) for n candidates (quadratic in sequence length, linear in candidates). Bi-encoder is O(|q|^2 + n * |d|^2) for indexing but O(|q|^2 + n) for search (precomputed document embeddings).

### 5.3 Optimization opportunities

**Current bottleneck**: RRF merges based on ordinal rank only, discarding score magnitude. A document cluster where all cosine scores are 0.85-0.87 gets spread across ranks 1-10 with large RRF score differences, even though the actual relevance differences are negligible.

**Better approach**: Cross-encoder reranking produces scores on a continuous scale reflecting actual relevance, not just relative ordering. This allows:
- Meaningful score thresholds (e.g., "only include if reranker score > 0.5")
- Score-weighted context building (allocate more context tokens to higher-scored chunks)
- Confidence estimation (if all reranker scores are low, the query may have no good answer)

**Optimal retrieval-to-rerank ratio**:
- Retrieve topK_initial = 20-50 candidates (enough for high recall ceiling)
- Rerank to topK_final = 5-10 (enough for context window)
- Empirical 90% rule: ~50-100 initial candidates captures ~90% of achievable NDCG@10
- For Contexter with average 200-token chunks: 20 candidates = ~4000 tokens to reranker = ~$0.00008 via Jina
- Diminishing returns: going from 20 to 100 candidates increases cost 5x but improves NDCG@10 by only ~5-10%

**Our recommendation**: Retrieve 20 candidates (current topK*2 = 20 is already good), rerank to top 5-10.

### 5.4 Information-theoretic analysis

**Information loss in bi-encoder embedding**:
- Jina v4 produces 1024-dim float32 vector = 4KB per chunk
- Average chunk = ~200 tokens = ~800 bytes of text (compressed from original ~1000 chars)
- Embedding preserves semantic similarity structure but loses:
  - Word order nuances (partially)
  - Negation sensitivity (known weakness)
  - Quantitative precision (numbers, dates)
  - Conditional/hypothetical framing

**Mutual information**: I(query; relevance | embedding) < I(query; relevance | full_text). The gap between these is exactly what the reranker recovers.

**Information gain per reranked position**: NDCG uses logarithmic discount: `gain_at_position_k = relevance / log2(k+1)`. Moving a relevant document from position 5 to position 1 has ~3.1x more impact than moving it from position 10 to position 5. This means reranking has highest value when it fixes errors in the top 3-5 positions.

### 5.5 Score calibration

**The calibration problem**: Most rerankers output uncalibrated scores. A score of 0.7 from Cohere doesn't mean the same thing as 0.7 from Jina. Even within one model, score 0.7 for query A may indicate different confidence than 0.7 for query B.

**Calibration approaches**:
1. **Score normalization**: min-max normalize per query (requires at least one known-irrelevant document)
2. **Sigmoid calibration**: Apply learned sigmoid to map raw logits to probabilities (Platt scaling)
3. **Calibrated models**: zerank-2 claims inherent calibration; Jina v3 adds confidence score
4. **Rank-based thresholding**: Instead of score threshold, use rank cutoff (simpler, more robust)

**Recommendation for Contexter**: Use rank-based cutoff (rerank 20, take top 5-10) rather than score thresholding. Avoids calibration issues entirely.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

- **What**: Add **Jina Reranker v3** (`jina-reranker-v3`) as a reranking step between RRF fusion and context building.
- **Why**:
  - **Layer 2**: Industry standard two-stage retrieval; every serious RAG system uses it
  - **Layer 3**: Jina v3 uses novel LBNL architecture, top-tier at sub-200ms latency
  - **Layer 4**: Cross-encoder = "matched filter" for relevance; recovers information lost in bi-encoder compression
  - **Layer 5**: Cross-encoder is strictly more expressive than bi-encoder; highest information gain at top positions
  - **Vendor alignment**: Already using Jina for embeddings -- same API key, same billing, same reliability story
- **Expected impact**:
  - +10-20% NDCG@10 improvement (conservative estimate based on benchmarks)
  - +35% reduction in LLM hallucinations (from better context quality)
  - Hit@1 improvement of +15-20pp (from ~65% to ~80-85% based on benchmark analogies)
- **Cost**: ~$0.00008 per query ($0.24/month at 3K queries). Negligible.
- **Latency impact**: +100-200ms per query (Jina v3 at ~188ms). Total pipeline: 300ms -> ~450-500ms. Acceptable.
- **Risk**: Jina API downtime. Mitigated by fallback to current pipeline (skip reranking).

### 6.2 Implementation spec

**Input**: Array of HybridSearchResult (from RRF fusion, deduplicated, sorted by RRF score)
**Output**: Array of HybridSearchResult, reordered by reranker relevance score

**Algorithm**:
```
1. Receive allResults from RRF fusion (up to ~20-40 unique chunks across query variants)
2. If allResults.length <= 1: skip reranking, return as-is
3. Extract texts: allResults.map(r => r.metadata.content)
4. Call Jina Rerank API:
     POST https://api.jina.ai/v1/rerank
     {
       "model": "jina-reranker-v3",
       "query": originalQuery,
       "documents": texts,
       "top_n": min(10, allResults.length)
     }
5. Map response.results back to allResults by index
6. Return reordered results with reranker score replacing RRF score
```

**Config parameters**:
```
RERANK_ENABLED: boolean = true
RERANK_MODEL: string = "jina-reranker-v3"
RERANK_TOP_N: number = 10
RERANK_API_URL: string = "https://api.jina.ai/v1/rerank"
RERANK_TIMEOUT_MS: number = 3000
RERANK_MIN_CANDIDATES: number = 2     // skip if fewer candidates
```

**Fallback (if reranker API fails)**:
```
catch (error) {
  console.error("Reranker failed, falling back to RRF order:", error)
  return allResults  // return original RRF-ordered results
}
```

**Pseudocode for the reranking service**:
```typescript
// reranker.ts
interface RerankResult {
  index: number
  relevance_score: number
}

async function rerank(
  query: string,
  documents: string[],
  topN: number,
  apiKey: string
): Promise<RerankResult[]> {
  const response = await fetch("https://api.jina.ai/v1/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "jina-reranker-v3",
      query,
      documents,
      top_n: topN,
    }),
    signal: AbortSignal.timeout(3000),
  })

  if (!response.ok) throw new Error(`Rerank API error: ${response.status}`)

  const data = await response.json()
  return data.results
}
```

**Integration point** (in `rag/index.ts`, after allResults sorting):
```typescript
// After: allResults.sort((a, b) => b.score - a.score)
// Before: const { context, sources } = buildContext(allResults, ...)

if (allResults.length >= 2 && config.rerankEnabled) {
  try {
    const texts = allResults.map(r => r.metadata.content)
    const reranked = await rerank(input.query, texts, config.rerankTopN, env.JINA_API_KEY)

    // Rebuild allResults in reranked order with new scores
    allResults = reranked.map(rr => ({
      ...allResults[rr.index],
      score: rr.relevance_score,
    }))
  } catch (e) {
    // Fallback: use original RRF order
    console.error("Reranker failed, using RRF order:", e)
  }
}
```

**Pipeline after implementation**:
```
query -> rewrite (3 variants) -> embed each (Jina v4)
  -> for each variant:
       pgvector cosine (topK*2) || tsvector FTS (topK*2)
       -> RRF fusion (k=60, topK)
  -> cross-variant dedup + sort by RRF score
  -> RERANK (Jina v3, top_n=10)          <-- NEW
  -> buildContext (token budget)
  -> Groq LLM -> answer
```

### 6.3 Validation plan

**How to measure improvement**:
1. Create a test set of 20-30 question/answer pairs with known relevant chunks (manual curation)
2. Run each query through pipeline with and without reranking
3. Measure Hit@1, Hit@3, MRR, and NDCG@10
4. Compare answer quality (manual evaluation: correct, partially correct, wrong, hallucinated)

**Minimum success criteria**:
- Hit@1 improvement >= +10pp (e.g., from 60% to 70%)
- No regression in latency beyond +300ms p95
- Zero increase in error rate (reranker failures must fall back gracefully)

**Rollback trigger**:
- If reranker API error rate > 5% sustained for 1 hour
- If p95 latency exceeds 2000ms (current ~800ms + 200ms reranker + margin)
- If answer quality regression detected in manual evaluation
- Rollback = set RERANK_ENABLED=false in env, zero code change needed

### 6.4 Retrieval parameters (recommended changes)

| Parameter | Current | Recommended | Rationale |
|---|---|---|---|
| Initial topK (per search leg) | topK*2 = 10 (default topK=5) | 20 | More candidates for reranker to work with |
| RRF output | topK = 5 | 20 | Feed more to reranker |
| Reranker top_n | N/A | 10 | Final top-10 after reranking |
| buildContext input | sorted RRF | sorted reranker | Higher quality ordering |
| scoreThreshold | 0 | 0 (but can add reranker threshold later) | Start without threshold, add after calibration |

### 6.5 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Cohere Rerank 4 Pro** | 25x more expensive per query than Jina. Better quality but not worth the cost delta at our scale. Already have Jina API key. |
| **Cohere Rerank 4 Fast** | Same pricing problem. 447ms latency is acceptable but no advantage over Jina v3 at 188ms. |
| **zerank-2** | Best quality + calibrated scores, but custom pricing (likely expensive for startup). No existing vendor relationship. |
| **BGE Reranker v2 M3 (self-hosted)** | Free but requires GPU for acceptable latency. Hetzner CAX11 has no GPU. CPU inference = 1-5s per 20 docs. Would need additional server. |
| **LLM-based reranking (Groq Llama)** | 20 separate LLM calls per query = 2-5s latency + higher cost. Only justified for high-value, low-QPS scenarios. |
| **ColBERT late interaction** | Requires index-time token embeddings stored per document (storage overhead). Architecture change, not a drop-in. |
| **No reranking (keep current)** | RRF is a strong baseline but leaves ~10-20% NDCG on the table. Cost of adding Jina reranking is negligible. |
| **Voyage Rerank 2.5** | Good model but new vendor relationship. 595ms latency is 3x Jina v3. No compelling advantage. |
| **FIRST / Listwise LLM reranking** | Research-stage. Complex implementation. Not production-ready for our use case. |
| **Confidence-based skip (skip reranking for easy queries)** | Good optimization but premature. Add after baseline reranking is established and we have usage data. |

### 6.6 Future optimizations (post-launch)

1. **Confidence-based routing**: Skip reranker when top RRF result has score significantly above 2nd result (save latency/cost for easy queries)
2. **Score-weighted context**: Allocate more context tokens to higher-reranker-scored chunks
3. **Adaptive reranking depth**: Vary top_n based on query complexity (simple queries: top_n=5, complex: top_n=15)
4. **A/B testing**: Compare Jina v3 vs Cohere v4 on real user queries once we have volume
5. **Self-hosted fallback**: Deploy BGE v2 M3 on CPU as emergency fallback if all API rerankers go down
6. **LLM-Confidence Reranker**: Implement training-free LCR approach as zero-cost fallback using existing Groq

---

## Sources

### Layer 2
- [Cohere Rerank Product Page](https://cohere.com/rerank)
- [Cohere Rerank 4 vs 3.5 Analysis - Agentset](https://agentset.ai/blog/cohere-reranker-v4)
- [Cohere API Pricing 2026 - MetaCTO](https://www.metacto.com/blogs/cohere-pricing-explained-a-deep-dive-into-integration-development-costs)
- [Jina Reranker API](https://jina.ai/reranker/)
- [Jina Reranker v2 - HuggingFace](https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual)
- [Agentset Reranker Leaderboard](https://agentset.ai/rerankers)
- [Best Reranking Model Guide 2026 - ZeroEntropy](https://www.zeroentropy.dev/articles/ultimate-guide-to-choosing-the-best-reranking-model-in-2025)
- [Top 7 Rerankers for RAG - Analytics Vidhya](https://www.analyticsvidhya.com/blog/2025/06/top-rerankers-for-rag/)
- [Reranker Benchmark: Top 8 Models - AIMultiple](https://research.aimultiple.com/rerankers/)
- [Best Reranker Models 2026 - BSWEN](https://docs.bswen.com/blog/2026-02-25-best-reranker-models/)
- [Pinecone Rerankers and Two-Stage Retrieval](https://www.pinecone.io/learn/series/rag/rerankers/)

### Layer 3
- [LLM as Reranker Guide - ZeroEntropy](https://www.zeroentropy.dev/articles/llm-as-reranker-guide)
- [Cross-Encoders vs LLM Rerankers - ZeroEntropy](https://www.zeroentropy.dev/articles/should-you-use-llms-for-reranking-a-deep-dive-into-pointwise-listwise-and-cross-encoders)
- [LLM Reranker Practical Guide - Fin.ai](https://fin.ai/research/using-llms-as-a-reranker-for-rag-a-practical-guide/)
- [Jina Reranker v3 LBNL Paper - arXiv](https://arxiv.org/html/2509.25085v2)
- [Jina ColBERT v2 Announcement](https://jina.ai/news/jina-colbert-v2-multilingual-late-interaction-retriever-for-embedding-and-reranking/)
- [LLM-Confidence Reranker Paper](https://arxiv.org/html/2602.13571)
- [REBEL Multi-Criteria Reranking - arXiv](https://arxiv.org/html/2504.07104v1)
- [FIRST: Faster Listwise Reranking - EMNLP 2024](https://aclanthology.org/2024.emnlp-main.491.pdf)
- [Late Interaction Overview - Weaviate](https://weaviate.io/blog/late-interaction-overview)

### Layer 4
- [Two-Stage Retrieval Precision/Recall - Science Publishing Group](https://www.sciencepublishinggroup.com/article/10.11648/j.ajcst.20250804.11)
- [Hybrid Retrieval and Reranking - Genzeon](https://www.genzeon.com/hybrid-retrieval-deranking-in-rag-recall-precision/)
- [Reranking for Stacking Ensemble Learning - Springer](https://link.springer.com/chapter/10.1007/978-3-642-17537-4_70)
- [Two-Stage Learning to Rank - CiteSeerX](https://citeseerx.ist.psu.edu/document?repid=rep1&type=pdf&doi=6369b86c50b542c65e63754508720cb219fda495)

### Layer 5
- [Bi-Encoders vs Cross-Encoders Math - PrajnaAI](https://prajnaaiwisdom.medium.com/understanding-the-math-behind-bi-and-cross-encoders-a-beginners-guide-3030417d6e3b)
- [Cross-Encoders as Reranker - Weaviate](https://weaviate.io/blog/cross-encoders-as-reranker)
- [Optimal Reranking Depth - Elasticsearch Labs](https://www.elastic.co/search-labs/blog/elastic-semantic-reranker-part-3)
- [Rerank Before You Reason - arXiv](https://arxiv.org/html/2601.14224)
- [NDCG Explained - Evidently AI](https://www.evidentlyai.com/ranking-metrics/ndcg-metric)
- [RRF Limitations Analysis - RMIT University](https://rodgerbenham.github.io/bc17-adcs.pdf)
- [RRF Original Paper - SIGIR 2009](https://dl.acm.org/doi/10.1145/1571941.1572114)
- [Cross-Encoder Sentence Transformers](https://sbert.net/examples/cross_encoder/applications/README.html)
- [zerank-2 Score Calibration - ZeroEntropy](https://www.zeroentropy.dev/articles/zerank-2-advanced-instruction-following-multilingual-reranker)
- [Reranking RAG Assessment - Particula](https://particula.tech/blog/reranking-rag-when-you-need-it)
- [Enhancing RAG with Re-Ranking - NVIDIA](https://developer.nvidia.com/blog/enhancing-rag-pipelines-with-re-ranking/)
