# HyDE (Hypothetical Document Embeddings) — Deep Research
> Date: 2026-03-28
> Researcher: Axis (Orchestrator)
> Context: Contexter RAG service query pipeline optimization
> Framework: deep-research-framework.md, all 6 layers

---

## Layer 1: Current State

### 1.1 Our implementation (Contexter)
- **What**: User query -> LLM rewrites to 3 query variants -> embed each variant -> vector search -> RRF hybrid ranking -> context assembly -> answer
- **How**: Jina v4 embeddings (1024-dim), Groq Llama 3.1 8B for query rewriting, Cloudflare Vectorize for vector store
- **Performance**: Not yet benchmarked systematically (pre-launch)
- **Known issues**: Query rewriting is a form of query expansion, but it rewrites the *query* — not a hypothetical *answer*. This means embedded queries still live in "question space" rather than "document space" in the embedding manifold.

### 1.2 Why HyDE is relevant
- Current approach: embed(query_variant) ~ embed(document) — cross-space similarity
- HyDE approach: embed(hypothetical_document) ~ embed(document) — same-space similarity
- Hypothesis: HyDE could improve retrieval quality by bridging the query-document embedding gap
- Question: Does it complement or replace our 3-variant query rewriting?

### 1.3 Baseline metrics (to establish)
- Baseline accuracy: TBD (need evaluation dataset)
- Baseline latency: ~200ms for query rewriting + embedding + search
- Baseline cost: 1 LLM call (rewrite) + 3 embedding calls per query
- HyDE would add: 1 LLM call (generate hypothetical doc) + 1 embedding call

---

## Layer 2: World-Class Standard

### 2.1 Original Paper — Gao et al. (2022)

**Paper:** "Precise Zero-Shot Dense Retrieval without Relevance Labels"
**Authors:** Luyu Gao, Xueguang Ma, Jimmy Lin, Jamie Callan (Carnegie Mellon + U. Waterloo)
**Published:** Dec 2022 (arXiv), ACL 2023
**Links:** [arXiv](https://arxiv.org/abs/2212.10496) | [ACL Anthology](https://aclanthology.org/2023.acl-long.99/) | [GitHub](https://github.com/texttron/hyde)

**Method (exact pipeline):**
1. Given query Q, prompt an instruction-following LLM (InstructGPT) to generate a hypothetical document D_hyp that would answer Q
2. Generate N=5 hypothetical documents (diversity through sampling)
3. Encode each D_hyp with an unsupervised contrastive encoder (Contriever)
4. Average the N embedding vectors into a single vector
5. Use this averaged vector for nearest-neighbor search against the corpus
6. The encoder's dense bottleneck filters out hallucinated details — only the relevance pattern survives

**Key insight:** The hypothetical document doesn't need to be factually correct. It only needs to capture the *relevance pattern* — the kind of language, structure, and vocabulary that a real relevant document would have. The contrastive encoder maps it to the right neighborhood in embedding space.

**Results (from paper):**
- Significantly outperforms unsupervised Contriever across web search, QA, fact verification
- Competitive with fine-tuned retrievers (which require labeled data)
- Works across languages (Swahili, Korean, Japanese, etc.)
- On TREC DL19/DL20: HyDE with Contriever substantially beats vanilla Contriever
- Zero-shot: no task-specific training, no relevance labels needed

**Limitations noted in paper:**
- Relies on LLM knowledge — fails on topics the LLM has never seen
- Extra latency from LLM generation step
- Multilingual performance degrades as number of languages scales (encoder saturation)

### 2.2 Industry Standard: How Top Systems Use HyDE

| Product/Paper | Approach | Key Insight |
|---|---|---|
| **LangChain** | Built-in `HypotheticalDocumentEmbedder` class | Simplified API: wrap any LLM + embedder |
| **Haystack (deepset)** | HyDE pipeline component | Generates 5 docs, averages embeddings, configurable prompt |
| **LlamaIndex** | `HyDEQueryTransform` | Integrates with their query engine abstraction |
| **Elasticsearch** | Recommends HyDE as advanced RAG technique | Combined with hybrid BM25+dense |
| **Zilliz/Milvus** | Tutorial + recommended for production RAG | Emphasizes domain-specific prompt tuning |

### 2.3 ARAGOG Benchmark (2024) — Empirical Comparison

**Paper:** "ARAGOG: Advanced RAG Output Grading" (Eibich & Nagpal, 2024)
[arXiv](https://arxiv.org/abs/2404.01037) | [GitHub](https://github.com/predlico/ARAGOG)

**Methodology:** 10 runs per technique, ANOVA + Tukey HSD tests for statistical significance.

**Key findings:**
- **HyDE and LLM Reranking significantly enhance retrieval precision** — markedly outperforming Naive RAG baseline
- MMR and Cohere rerank did NOT show notable advantages over baseline
- Multi-query approaches *underperformed*
- Sentence Window Retrieval was best for retrieval precision but variable on answer similarity
- HyDE + reranking = strongest combination for precision

### 2.4 "Searching for Best Practices in RAG" (Wang et al., 2024)

[arXiv](https://arxiv.org/html/2407.01219v1)

**Key findings on HyDE:**
- Best configuration: "Hybrid with HyDE" retrieval + monoT5 reranking + Reverse repacking + Recomp summarization
- Query classification module enhances accuracy AND reduces latency (skip HyDE when unnecessary)
- **Single hypothetical document is sufficient** — more docs increase latency without significant benefit
- Concatenating pseudo-document with original query improves retrieval but adds latency

### 2.5 Standard Configuration (recommended defaults)

- **N hypothetical documents:** 1 (paper used 5, but later research shows 1 is sufficient for most cases)
- **LLM for generation:** Fast model (Llama 3.1 8B is fine; doesn't need to be factually perfect)
- **Prompt:** Domain-specific, carefully tuned to match document style in corpus
- **Embedding:** Same encoder used for corpus documents
- **Combination with original query:** Optional — concatenate HyDE doc with original query for hybrid signal
- **Reranking after HyDE:** Strongly recommended (HyDE + reranker > HyDE alone)

### 2.6 Common Pitfalls

1. **Using HyDE for ALL queries** — factoid/keyword queries don't benefit, adds unnecessary latency
2. **Not tuning the generation prompt** — generic "write a passage about X" underperforms domain-specific prompts
3. **Generating too many hypothetical docs** — diminishing returns after 1-2, latency scales linearly
4. **Ignoring the LLM's knowledge gap** — HyDE fails when LLM has no knowledge of the topic
5. **Not combining with reranking** — HyDE improves recall, reranking improves precision; use both

---

## Layer 3: Frontier Innovation

### 3.1 Emerging Techniques

| Paper/Project | Date | Key Innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **Adaptive HyDE** (Never Come Up Empty) | 2025-07 | Dynamic similarity thresholding — adjusts HyDE aggressiveness based on retrieval confidence. +20% on Helpfulness/Correctness/Detail vs standard RAG. 100% retrieval coverage. | Research/prototype | HIGH — solves "when to use HyDE" problem adaptively |
| **Multi-HyDE** (Financial RAG) | 2025-09 | Multiple non-equivalent query rephrasings, each gets its own hypothetical doc. +11.2% accuracy, -15% hallucination. Faithfulness 1.0. | Research (ACL FinNLP) | MEDIUM — our 3-variant rewriting is already similar in spirit |
| **Query2Doc** | 2023-2024 | Unlike HyDE (embed only the hypothetical doc), Query2Doc concatenates query + hypothetical doc, then embeds the concat. Different embedding geometry. | Production-ready | MEDIUM — easy to A/B test against pure HyDE |
| **MQRF-RAG** | 2025 | Multi-query RAG Fusion: +7% over HyDE on HotPotQA (multi-hop), +2.55% over RAG Fusion | Research | LOW — multi-hop is not primary Contexter use case |
| **Step-Back Prompting + RAG** | 2024 | Before retrieval, LLM generates a more abstract/general question. Fixes 21.6% of RAG errors while introducing only 6.3% new errors. | Production-ready | HIGH — complementary to HyDE, cheap to implement |
| **Hypothesis-Conditioned Query Rewriting** | 2026-03 | Query rewriting conditioned on hypotheses about what the user actually needs. Decision-useful retrieval. | Research (fresh) | HIGH — aligns with Contexter's query rewriting step |
| **CRAG (Corrective RAG)** | 2024-2025 | Post-retrieval evaluation: Correct/Incorrect/Ambiguous. If incorrect, falls back to web search. Adaptive RAG with T5 classifier cuts cost 40-60%. | Production-ready | MEDIUM — addresses "what if HyDE retrieves wrong docs" |

### 3.2 Key Finding: HyDE + Query Classification = Best Practice (2024-2025)

The consensus from multiple papers (ARAGOG, Best Practices in RAG, Adaptive HyDE):
1. **Classify the query first** — determine if HyDE is likely to help
2. **Use HyDE for complex/abstract queries** — where query-document gap is large
3. **Skip HyDE for simple/keyword queries** — direct embedding is sufficient
4. **Always rerank after retrieval** — regardless of whether HyDE was used

This is converging toward an "intelligent router" pattern, not a blanket "always use HyDE" approach.

### 3.3 Open Questions in the Field

- **Optimal hypothetical document length** — paper used paragraph-length; is shorter/longer better for specific domains?
- **Model-specific prompt engineering** — prompts that work for InstructGPT may not be optimal for Llama 3
- **HyDE for structured data** — tables, code, JSON — does the hypothetical doc approach transfer?
- **Real-time HyDE** — can we pre-compute HyDE embeddings for common query patterns?
- **HyDE + knowledge graphs** — using KG to ground the hypothetical document generation

### 3.4 Bets Worth Making

1. **Adaptive HyDE with query classification** — implement a lightweight classifier that routes queries to HyDE vs direct embedding. High impact, moderate implementation cost.
2. **Step-back prompting as HyDE variant** — instead of "write a document that answers X", ask "what general topic is X about?" then generate hypothetical doc for the generalized query. Combines both techniques.
3. **HyDE + our existing 3-variant rewriting** — generate 1 hypothetical doc AND 3 query variants, use all 4 embeddings with RRF. Tests whether HyDE is complementary to query expansion.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous Problems in Other Fields

| Field | Analogous Problem | Their Solution | Transfer to HyDE/RAG |
|---|---|---|---|
| **Cognitive Science** | How does the brain find relevant memories faster when it has expectations? | **Semantic priming** — exposure to a related stimulus pre-activates neural pathways, making recognition of related items faster. Spreading activation in semantic networks. | HyDE = artificial priming. The hypothetical document pre-activates the "neighborhood" in embedding space, making the retrieval system converge on relevant documents faster. Just as a primed brain finds "nurse" faster after seeing "doctor", a primed embedding finds relevant docs faster after generating a hypothetical one. |
| **Signal Processing** | How to detect a known signal pattern in noise? | **Matched filter** — correlate the received signal with a template of the expected signal. Proven optimal (Neyman-Pearson lemma): maximizes SNR when looking for a known waveform in additive Gaussian noise. | HyDE generates a "template" (hypothetical document). Embedding similarity = correlation. The corpus = signal + noise. HyDE is literally a matched filter in embedding space — it generates the template you're looking for, then correlates against the corpus. This is why it's mathematically principled, not just a heuristic. |
| **Library Science** | Different search strategies for different information needs | **Known-item search** vs **Exploratory search**. Known-item: user knows what they want, direct lookup suffices. Exploratory: user is investigating a topic, needs broader discovery. | HyDE helps most with exploratory search (abstract, open-ended queries). For known-item search (specific factoid, exact entity), direct query embedding is sufficient. This maps to the query classification heuristic: route exploratory queries through HyDE, skip for known-item queries. |
| **Bayesian Statistics** | How to make good decisions with limited information? | **Prior → Evidence → Posterior**. Start with a prior belief (hypothesis), observe data, update to posterior. Good priors accelerate convergence; bad priors can mislead. | HyDE = constructing an informative prior. The hypothetical document is the prior belief about what a relevant document looks like. Vector search against the corpus = observing evidence. Retrieved results = posterior. When the LLM has reasonable knowledge (good prior), HyDE accelerates retrieval. When the LLM has no knowledge (bad prior), HyDE misleads — exactly like a bad Bayesian prior. |
| **Radar/Sonar** | Detect a target when you know approximately what the return signal looks like | **Pulse compression** — transmit a chirp signal, match-filter on receive. The matched filter "expects" a certain waveform, amplifying the target return while suppressing noise. | HyDE's hypothetical document = the transmitted chirp. The embedding = compressed representation. Retrieval = correlation detection. The "pulse compression gain" is analogous to the retrieval precision improvement from HyDE. |

### 4.2 Biomimicry / Nature-Inspired

**Echolocation (bats, dolphins):** These animals emit a signal and listen for the echo. They have an internal model of what the "correct" echo sounds like for prey vs obstacles. HyDE does the same thing — emits a "signal" (hypothetical document) into embedding space and "listens" for the echoes (similar real documents). The key insight from echolocation: the emitted signal is tuned to the target. Bats change their call frequency depending on what they're hunting. Similarly, HyDE prompts should be tuned to the document type in the corpus.

**Immune system (adaptive immunity):** T-cells create hypothetical pathogen shapes (via V(D)J recombination), then test them against actual antigens. The ones that match are amplified. HyDE generates hypothetical document shapes, tests them against actual documents, and amplifies the matches.

### 4.3 Engineering Disciplines

- **Signal processing:** Matched filter (covered above). Additionally, **Wiener filter** — optimal filter when you know the signal AND noise statistics. Extension: if we could model the distribution of "relevant document embeddings" and "noise embeddings", we could build an optimal Wiener-type HyDE filter.
- **Information theory:** HyDE reduces **entropy of the query representation**. A short query has high entropy (many possible interpretations). The hypothetical document collapses the distribution toward a specific interpretation, reducing retrieval entropy. This is channel coding in reverse — instead of adding redundancy to protect signal, we add "hypothetical content" to sharpen the query.
- **Control systems:** HyDE can be viewed as **feedforward control**. Instead of waiting for the error (wrong documents retrieved) and correcting (CRAG), HyDE predicts what the correct output looks like and aims for it directly. Feedforward + feedback (HyDE + CRAG) is stronger than either alone — standard in control theory.
- **Linguistics:** The **cooperative principle** (Grice, 1975) — speakers structure utterances to be maximally informative. Queries violate this: they're minimal, ambiguous, underspecified. HyDE "repairs" the cooperative principle violation by generating what a cooperative, informative answer would look like.

---

## Layer 5: Mathematical Foundations

### 5.1 Current Mathematical Model (Contexter)

- **What math we use:** Cosine similarity between query embedding and document embeddings, RRF fusion of 3 query variants
- **Assumptions:** Query and document live in the same embedding space; cosine similarity is a valid proxy for relevance; query variants capture different facets of intent
- **Where assumptions break:** Short/ambiguous queries map to a very different region of embedding space than the documents that answer them. This is the **query-document asymmetry problem**.

### 5.2 Why HyDE Works: Embedding Space Geometry

**The core mathematical insight:**

Let E(x) denote the embedding function (Jina v4 / Contriever / any encoder).

For a query Q and relevant document D*:
- `sim(E(Q), E(D*))` = cosine similarity in cross-space (query space vs document space)
- `sim(E(D_hyp), E(D*))` = cosine similarity in same-space (document space vs document space)

**Claim:** `E[sim(E(D_hyp), E(D*))] > E[sim(E(Q), E(D*))]` for complex/abstract queries.

**Why?**

1. **Asymmetry in embedding space.** Contrastive encoders (Contriever, Jina, etc.) are trained with query-document pairs, but queries and documents occupy structurally different regions of the embedding manifold. Queries are short, high-entropy, ambiguous. Documents are long, low-entropy, specific. Even though training encourages alignment, the manifold geometry retains this asymmetry.

2. **HyDE projects the query into document space.** The LLM generation step `Q -> D_hyp` is a function that maps from query space to document space. Even though D_hyp is hallucinated, it has the structural properties of a document: length, vocabulary, specificity. Its embedding lands in the document region of the manifold, closer to where real documents live.

3. **Dense bottleneck as noise filter.** The encoder E has dimensionality d (e.g., 1024). D_hyp may contain k incorrect facts, but the encoder compresses the ~500-token document into a 1024-dim vector. Factual errors are high-frequency noise in the embedding; the relevance pattern is the low-frequency signal. Compression filters the noise, preserving the signal. This is why HyDE works even with hallucinated content.

### 5.3 Variance Reduction Through Averaging

Original HyDE generates N=5 documents and averages embeddings:

```
E_hyde = (1/N) * sum(E(D_hyp_i))  for i = 1..N
```

**Why averaging helps:**
- Each D_hyp_i captures the relevance pattern plus idiosyncratic noise (specific hallucinated facts, particular phrasing choices)
- Relevance pattern is consistent across all D_hyp_i (correlated signal)
- Idiosyncratic noise is independent across D_hyp_i (uncorrelated noise)
- By Central Limit Theorem: `Var(E_hyde) = Var(signal) + Var(noise)/N`
- Signal variance preserved, noise variance reduced by factor N
- This is exactly the same principle as **ensemble averaging** in machine learning and **stacking** in signal processing

**Practical implication for Contexter:** Generating 1 doc and skipping averaging means we accept higher variance. But later research (Wang et al. 2024) shows the marginal variance reduction from N>1 is small relative to the latency cost. One well-prompted document captures most of the signal.

### 5.4 When HyDE Fails: Mathematical Conditions

HyDE fails when the mathematical assumptions break:

1. **LLM has no knowledge of the topic (bad prior).**
   - D_hyp is pure noise, no relevance signal
   - `E(D_hyp)` is a random point in document space, uncorrelated with E(D*)
   - Retrieval degrades to random
   - **Condition:** Topic is post-training-cutoff, extremely niche, or in a language the LLM doesn't know

2. **Query is already well-specified (no asymmetry to bridge).**
   - For factoid queries like "What year was Python released?", E(Q) is already close to E(D*)
   - HyDE adds noise without reducing the query-document gap
   - Net effect: slight degradation + wasted latency
   - **Condition:** High cosine similarity between E(Q) and E(D*) already (> 0.8)

3. **Corpus is very narrow/specialized.**
   - When all documents are highly similar, the relevant signal is in the fine details (specific entity names, dates, version numbers)
   - HyDE captures structural/topical patterns (low-frequency), not fine details (high-frequency)
   - The dense bottleneck filters out the very details needed for discrimination
   - **Condition:** Intra-corpus similarity is high (e.g., all docs about the same API version)

4. **Embedding model is already asymmetry-aware.**
   - Models fine-tuned on QA datasets (like MS MARCO) already learn to map queries near relevant documents
   - HyDE adds less value because the encoder has already solved the asymmetry problem
   - **Condition:** Using a supervised asymmetric embedding model (not unsupervised Contriever)

### 5.5 Linear Algebra / Geometry Insights

**Query-document gap as angular distance:**
- In 1024-dim space, cosine similarity = cos(theta) where theta is the angle between vectors
- Short queries: high variance in direction -> theta to relevant docs is large + variable
- HyDE-generated docs: lower variance in direction -> theta to relevant docs is smaller + more stable
- The "averaging trick" further reduces angular variance

**Dimensionality considerations:**
- Jina v4 embeddings are 1024-dim. Effective (intrinsic) dimensionality of document embeddings is likely much lower (50-200 dim, per manifold hypothesis)
- HyDE works because it places the query probe on the same low-dimensional manifold as the documents
- Direct query embedding may place the probe OFF the document manifold -> nearest neighbor is a manifold projection, not a true neighbor

**Geometric interpretation of HyDE as manifold projection:**
```
Query Q lives at point q in R^1024
Documents live on manifold M (subset of R^1024)
Direct retrieval: find nearest point on M to q (may be far, especially if q is off-manifold)
HyDE: LLM projects q -> d_hyp (approximately on M), then find nearest point on M to d_hyp (much closer)
```

This is why HyDE is more effective with unsupervised encoders (Contriever) — their manifold structure is less aligned between query and document spaces. Supervised encoders (trained on Q-D pairs) already perform implicit manifold alignment.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended Approach

- **What:** Add HyDE as a **4th retrieval signal** alongside existing 3 query variants, gated by a lightweight query classifier
- **Why:** Layers 2-5 converge on the same conclusion: HyDE is most valuable for complex/abstract queries where the query-document embedding gap is large. Our current 3-variant rewriting operates in "question space"; HyDE adds a "document space" probe. Together with RRF, they cover complementary retrieval dimensions.
- **Expected impact:** +10-20% retrieval precision on complex queries (ARAGOG: significant improvement; Adaptive HyDE: +20% on helpfulness/correctness). Minimal impact on simple/keyword queries (but no degradation due to gating).
- **Cost:** 1 additional LLM call (~30-50ms on Groq Llama 3.1 8B) + 1 embedding call (~10ms on Jina v4) per query that passes the gate. For gated-out queries: 0 additional cost.
- **Risk:** (a) HyDE hallucination misleads retrieval for niche topics outside LLM knowledge. Mitigated by gating + RRF fusion (HyDE is one of 4 signals, not the only one). (b) Added latency. Mitigated by parallel execution (HyDE generation runs in parallel with query variant generation).

### 6.2 Implementation Spec

**Architecture: HyDE as parallel 4th signal (not replacement)**

```
User query Q
    |
    +---> [Query Classifier] -- simple/keyword --> skip HyDE
    |         |
    |         +-- complex/abstract --> generate HyDE
    |
    +---> [Parallel execution]
    |         |
    |         +---> LLM: rewrite to 3 query variants (existing)
    |         |         |
    |         |         +---> embed(variant_1) --> vector search --> results_1
    |         |         +---> embed(variant_2) --> vector search --> results_2
    |         |         +---> embed(variant_3) --> vector search --> results_3
    |         |
    |         +---> LLM: generate 1 hypothetical document (NEW, if gate passes)
    |                   |
    |                   +---> embed(hyde_doc) --> vector search --> results_hyde
    |
    +---> RRF(results_1, results_2, results_3, [results_hyde]) --> final ranked list
              |
              +---> context assembly --> answer
```

**Query Classifier (lightweight, heuristic-based v1):**

Route to HyDE when ANY of:
- Query length > 10 words (suggests complexity, not keyword search)
- Query contains question words (how, why, what is, explain, compare)
- Query does NOT contain specific entity names, version numbers, exact phrases in quotes

Route to direct embedding (skip HyDE) when ANY of:
- Query length <= 5 words AND contains a proper noun (known-item search)
- Query is in quotes (exact match intent)
- Query contains code/API syntax (literal match needed)

v2 (future): Train a small classifier on query logs with retrieval quality labels.

**HyDE Generation Prompt (for Contexter):**

```
Given the following question, write a short passage (3-5 sentences) that would
appear in a knowledge base article answering this question. Write as if you are
the author of the source document, not as someone answering a question. Include
relevant technical terms and context.

Question: {query}

Passage:
```

Key prompt design decisions:
- "knowledge base article" — matches Contexter's corpus style (not academic papers, not blog posts)
- "3-5 sentences" — matches typical chunk size (~200-400 tokens)
- "Write as if you are the author of the source document" — forces document-space language
- "Include relevant technical terms" — maximizes vocabulary overlap with real documents

**Config:**
- N hypothetical documents: 1 (sufficient per Wang et al. 2024)
- LLM: Groq Llama 3.1 8B (same model used for query rewriting — no additional model deployment)
- Temperature: 0.7 (some diversity but not wild hallucination)
- Max tokens: 200 (enough for 3-5 sentences, prevents runaway generation)
- Embedding: Jina v4 (same as corpus — mandatory)
- RRF k parameter: 60 (standard, same as existing)
- HyDE weight in RRF: Equal to query variants (1.0). Let RRF naturally balance signals.

**Fallback:**
- If HyDE LLM call fails (timeout, error): proceed with 3 query variants only. No degradation from current baseline.
- If classifier is uncertain: include HyDE (err on the side of more signals for RRF)

### 6.3 Inverted HyDE — Worth Noting for Future

**Concept:** Instead of generating hypothetical documents at query time, generate hypothetical *questions* at index time for each document chunk. Store question embeddings alongside document embeddings. At query time, match query embedding against hypothetical question embeddings (same-space: question vs question).

**Advantages:**
- Zero additional query-time latency
- No LLM dependency at query time
- Deterministic performance

**Trade-offs:**
- Higher index-time cost (1 LLM call per chunk)
- Index size increases ~2-3x
- Must re-index when changing the generation model

**Recommendation:** Evaluate after HyDE v1 proves value. Inverted HyDE is the production-optimization of the same principle.

### 6.4 Validation Plan

**A/B Test Design:**

| Variant | Description |
|---|---|
| **Control** | Current pipeline: 3 query variants -> embed -> RRF -> answer |
| **Treatment A** | Control + HyDE (always on, no gating) |
| **Treatment B** | Control + HyDE (with query classifier gating) |

**Metrics:**
- **Primary:** Retrieval precision@5 (are the top 5 results relevant?)
- **Secondary:** Answer quality (LLM-as-judge: helpfulness, correctness, groundedness)
- **Cost:** Average latency per query, LLM tokens consumed per query
- **Coverage:** % of queries where retrieval returns at least 1 relevant result

**Minimum Success Criteria:**
- Treatment B precision@5 >= Control precision@5 + 5% (statistically significant, p < 0.05)
- Treatment B latency <= Control latency + 100ms (p95)
- Treatment B cost <= Control cost * 1.3 (30% increase acceptable for 5%+ precision gain)

**Rollback Trigger:**
- Treatment precision < Control precision (HyDE is actively hurting)
- Latency increase > 200ms p95
- LLM error rate > 5% on HyDE generation calls

**Test Duration:** Minimum 500 queries per variant (for statistical power), or 2 weeks, whichever comes first.

### 6.5 Rejected Alternatives

| Alternative | Why Rejected |
|---|---|
| **Replace query rewriting with HyDE entirely** | They solve different problems. Query rewriting covers intent ambiguity (multiple interpretations). HyDE covers query-document space asymmetry. Complementary, not substitutes. |
| **Multi-HyDE (N=5 with averaging)** | Marginal gain over N=1 per Wang et al. 2024, but 5x latency/cost. Not justified for Contexter's scale. |
| **HyDE without query classification** | Treatment A in A/B test. Expected to show marginal gains on simple queries, unnecessary cost. Gating (Treatment B) should dominate. |
| **Inverted HyDE (index-time)** | Good technique but requires re-indexing infrastructure and increases storage 2-3x. Defer to post-MVP when we have query-time HyDE benchmarks. |
| **Full CRAG pipeline** | Too complex for MVP. Adds evaluation + fallback + web search. Consider after basic HyDE is validated. |
| **Step-back prompting instead of HyDE** | Step-back generates abstract questions (still in query space). HyDE generates documents (document space). Step-back is complementary, not a replacement. Could be layered on top later. |

### 6.6 Cost-Benefit Summary

```
Current pipeline (per query):
  1 LLM call (rewrite, ~150 tokens out) = ~$0.00002
  3 embedding calls (3 x ~20 tokens)    = ~$0.000003
  Total: ~$0.000023

With HyDE (per gated query, estimate 60% of queries gated in):
  1 LLM call (rewrite, ~150 tokens out) = ~$0.00002
  1 LLM call (HyDE, ~200 tokens out)    = ~$0.00003
  3 embedding calls                      = ~$0.000003
  1 embedding call (HyDE doc)            = ~$0.000001
  Total: ~$0.000054

Average with 60% gating: ~$0.000042 per query
Cost increase: ~82% per query, ~$0.019 per 1000 queries additional
```

At Contexter's expected query volume (< 100K queries/month pre-launch), the additional cost is < $2/month. Even at 1M queries/month, it's < $20/month. **Cost is not a blocker.**

The real cost is **latency**: the HyDE LLM call adds ~30-50ms. But since it runs in parallel with query rewriting (both are LLM calls that can start simultaneously), the actual latency increase is `max(rewrite_time, hyde_time) - rewrite_time`, which is approximately 0ms if both calls take similar time. **Latency increase is near-zero with parallel execution.**

---

## Sources

### Papers
- [Gao et al. 2022 — Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE)](https://arxiv.org/abs/2212.10496)
- [ARAGOG: Advanced RAG Output Grading (Eibich & Nagpal, 2024)](https://arxiv.org/abs/2404.01037)
- [Searching for Best Practices in Retrieval-Augmented Generation (Wang et al., 2024)](https://arxiv.org/html/2407.01219v1)
- [Never Come Up Empty: Adaptive HyDE Retrieval (2025)](https://arxiv.org/abs/2507.16754)
- [Enhancing Financial RAG with Agentic AI and Multi-HyDE (2025)](https://arxiv.org/abs/2509.16369)
- [The Geometry of Queries: Query-Based Innovations in RAG (2024)](https://arxiv.org/html/2407.18044v1)
- [Hypothesis-Conditioned Query Rewriting for Decision-Useful Retrieval (2026)](https://arxiv.org/html/2603.19008)
- [MuGI: Multi-Text Generation Integration (Query2Doc comparison)](https://arxiv.org/html/2401.06311v1)

### Implementations
- [LangChain HypotheticalDocumentEmbedder](https://python.langchain.com/docs/how_to/)
- [Haystack HyDE Component](https://docs.haystack.deepset.ai/docs/hypothetical-document-embeddings-hyde)
- [NirDiamant/RAG_Techniques — HyDE notebook](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/HyDe_Hypothetical_Document_Embedding.ipynb)
- [texttron/hyde — Original implementation](https://github.com/texttron/hyde)
- [ARAGOG GitHub](https://github.com/predlico/ARAGOG)

### Analysis & Guides
- [Inverted HyDE: Solving Real-World Dense Retrieval Challenges](https://behitek.com/blog/inverted-hyde/)
- [HyDE + Query Expansion: Supercharging Retrieval in RAG Pipelines](https://medium.com/theultimateinterviewhack/hyde-query-expansion-supercharging-retrieval-in-rag-pipelines-f200955929f1)
- [Retrieval Is the Bottleneck: HyDE, Query Expansion, and Multi-Query RAG Explained](https://medium.com/@mudassar.hakim/retrieval-is-the-bottleneck-hyde-query-expansion-and-multi-query-rag-explained-for-production-c1842bed7f8a)
- [Zilliz: Better RAG with HyDE](https://zilliz.com/learn/improve-rag-and-information-retrieval-with-hyde-hypothetical-document-embeddings)
- [Step-Back Prompting (PromptHub)](https://www.prompthub.us/blog/a-step-forward-with-step-back-prompting)
- [Asymmetric Embedding Spaces in Information Retrieval](https://medium.com/@venkatamani_kommineni/asymmetric-embedding-spaces-in-information-retrieval-principles-algorithms-and-a-novel-extension-eba44f80750a)
- [Matched Filter — Wikipedia](https://en.wikipedia.org/wiki/Matched_filter)
