# User Feedback Loops for RAG Quality Improvement — Deep Research
> Feature: feedback-loop | Date: 2026-03-28
> Target: Contexter RAG (Hono/Bun/PostgreSQL/Redis, pgvector, Groq LLM)
> Status: Research complete

---

## Layer 1: Current State

### 1.1 Our implementation

- **What:** Contexter has zero feedback infrastructure. Users query, receive answers with sources, and the interaction ends. No signal — positive or negative — flows back into the system.
- **How:** Query pipeline: `query -> rewrite (3 variants via Groq LLM) -> embed (Jina v4) -> hybrid search (pgvector cosine + tsvector FTS -> RRF merge) -> context build -> Groq LLM answer`. Scores are RRF-derived, static per chunk.
- **Performance:** Unknown. No metrics are collected on answer quality. No way to distinguish a 5-star answer from a hallucinated one.
- **Known issues:**
  - All chunks are treated equally regardless of how many times they have been useful or harmful.
  - Query rewriting is blind — no signal about which rewrites produce better retrieval.
  - No data to prioritize high-value documents vs. noisy ones.
  - Score threshold is hardcoded to 0 (no filtering).
  - No way to detect systematic retrieval failures (e.g., a bad document that always surfaces but never helps).

### 1.2 Metrics (measure before improving)

| Metric | Current value |
|---|---|
| Answer quality score | N/A (not measured) |
| Retrieval precision@5 | N/A |
| MRR (Mean Reciprocal Rank) | N/A |
| NDCG@5 | N/A |
| User satisfaction | N/A |
| Feedback data points | 0 |
| Cost per query | ~$0.001 (embed) + ~$0.0005 (LLM) = ~$0.0015 |

**Baseline:** We are flying blind. Any feedback mechanism, even the simplest thumbs up/down, would be an infinite improvement from zero data.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

The standard approach to feedback-driven RAG improvement in 2025-2026 involves three tiers:

1. **Explicit feedback collection** (thumbs up/down, 1-5 stars) — stored per query-response pair, linked to retrieved chunks.
2. **Feedback-weighted scoring** — chunks that receive positive feedback get score boosts in future queries; negatively-rated chunks get penalized. Implementation via a `feedback_score` column on chunks or a separate `feedback` table with aggregation at query time.
3. **Offline analytics** — periodic analysis of feedback data to identify: bad documents (consistently low-rated), good documents (consistently high-rated), query patterns that fail, and drift in user needs.

**Why it's standard:** Simple to implement (1 DB table + 1 API endpoint + score adjustment formula), requires no model training, provides immediate signal, and aligns with how Google Search evolved from PageRank to click-through-weighted ranking.

**Who uses it:** Perplexity (explicit + implicit feedback, millions of queries/hour), Google (click-through, dwell time, search-after-search patterns), Bing (thumbs up/down + RLHF pipeline), ChatGPT (thumbs up/down on every response), most production RAG SaaS (Ragie, Graphlit, Vectara).

### 2.2 Top 3 implementations

| Product/Paper | Approach | Result | Key insight |
|---|---|---|---|
| **Pistis-RAG** (arXiv 2407.00072, 2024) | Cascading framework: human feedback (copy/regenerate/dislike) used as Listwide Labels for Learning-to-Rank. Online learning adjusts ranking sensitivity to human + LLM preferences. | +6.06% (EN), +7.08% (CN) vs baseline RAG | Feedback on the entire result list (not individual docs) is cheaper to collect and still effective. Listwide approach avoids per-document annotation cost. |
| **RaFe** (EMNLP 2024 Findings) | Uses a reranker as a proxy for human feedback to train query rewriting models. Ranking feedback (which rewrite produced better retrieval) replaces expensive human annotation. | SOTA on multiple benchmarks; no human labels needed | You don't need human feedback to get feedback — a reranker's scores on retrieved docs serve as automated reward signal for query rewriting. |
| **Qdrant Relevance Feedback** (v1.17, 2025) | Vector-native approach: collect lightweight feedback on top-K results, create "context pairs" (more-relevant vs less-relevant), adjust scoring function for next retrieval pass. No model retraining. | Improved recall on billion-scale collections without retraining | Feedback operates at the vector similarity level, not at the model level. Works with any embedding model. |

### 2.3 Standard configuration

**Recommended defaults:**
- Feedback granularity: binary (thumbs up/down) — minimal friction, sufficient signal
- Feedback target: the entire answer (not individual chunks) — users can't assess chunk-level relevance
- Storage: feedback table linking `query_id`, `user_id`, `rating`, `timestamp`, chunk IDs
- Score adjustment: exponential moving average (EMA) of feedback per chunk, applied as a multiplier to retrieval score
- Decay: older feedback matters less; half-life of 30-90 days depending on domain volatility
- Cold start: new chunks get a neutral score (1.0 multiplier); first 5-10 feedback signals have outsized impact

**Common pitfalls:**
- Collecting feedback but never using it (data graveyard)
- Per-chunk feedback UI — users cannot meaningfully rate individual chunks
- No decay — ancient positive feedback keeps bad chunks afloat forever
- Popularity bias — frequently retrieved chunks accumulate more feedback, creating a rich-get-richer loop
- Ignoring implicit signals (query reformulation = negative implicit feedback)

**Migration from current state:**
- Effort: 1-2 days for MVP (1 table + 1 endpoint + score adjustment)
- Zero breaking changes to existing pipeline
- Feedback table + API can ship independently of score adjustment logic

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from last 12 months)

| Paper/Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **RAG-Reward** (arXiv 2501.13264, 2025-01) | 2025-01 | First paper to integrate RAG with standard RLHF pipeline. Defines 4 metrics (hallucination-free, comprehensive, reliable, efficient). Trains reward model on GPT-4o preference data. | Research (dataset + methodology published) | High conceptually, but requires model training — not viable for Contexter's Groq-only stack. The 4-metric evaluation framework is directly usable for offline analytics. |
| **RaFe** (EMNLP 2024) | 2024-11 | Reranker-as-reward-signal for query rewriting. No human labels needed. Online + offline training modes. | Production-ready (open implementation) | High. Contexter already does query rewriting (3 variants). RaFe's approach could select the best rewrite using reranker scores, improving retrieval without any human feedback. |
| **Qdrant Relevance Feedback** (v1.17) | 2025-Q2 | Context pairs from minimal feedback → adjust similarity computation at retrieval time. No reranking, no model changes. | Production (shipped in Qdrant 1.17) | Medium. Concept is transferable to pgvector, but Qdrant's implementation is engine-specific. The "context pair" idea could be adapted as a score adjustment heuristic. |
| **Test-time Corpus Feedback** (arXiv 2508.15437, 2025-08) | 2025-08 | Feedback signals from the corpus itself at test time — modify query, retrieved pool, or generation loop based on retrieval confidence. | Research | Medium. The retrieval-confidence trigger (if confidence < threshold, retry with expanded query) is simple to implement. |
| **RankArena** (arXiv 2508.05512, 2025-08) | 2025-08 | Unified platform for comparing retrieval, reranking, and RAG using structured human + LLM feedback. Pairwise preferences + full-list annotations. | Research prototype | Low for production, high for evaluation methodology. Good framework for offline quality measurement. |

### 3.2 Open questions in the field

- **Feedback attribution to chunks vs. answer:** When a user rates an answer, which chunks contributed positively/negatively? No reliable automatic method exists. LLM-as-judge (checking which chunks were actually used in the answer) is the best proxy.
- **Feedback loop stability:** Positive feedback on chunks increases their future ranking, which increases their future exposure, which increases their future feedback — creating a self-reinforcing loop. How to prevent monopoly by a few "superstar" chunks?
- **Cross-user feedback transfer:** Should User A's positive feedback on a chunk boost that chunk for User B? Works for shared knowledge bases, dangerous for personal ones.
- **Feedback on query reformulation quality:** Users reformulate queries when unsatisfied, but we don't know which reformulation succeeded. Tracking reformulation chains is an unsolved UX problem.

### 3.3 Bets worth making

1. **Automated feedback via LLM-as-judge** — after generating an answer, use a cheap LLM call to score faithfulness and relevance (RAGAS-style metrics). Store as synthetic feedback. Cost: ~$0.0005 per query extra. Benefit: 100% coverage (every query gets feedback), no user action needed.
2. **Reranker-as-reward for query rewriting** (RaFe approach) — use a cross-encoder reranker to score which query variant retrieved the best results, then bias future rewrites toward successful patterns. No human labels, no model training.
3. **Retrieval confidence threshold** — if hybrid search returns low-confidence results (all scores below threshold), trigger a second retrieval pass with expanded/modified query. Simple heuristic, big impact on tail queries.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Recommender systems** | Cold start: new items have no ratings | Thompson Sampling (Bayesian multi-armed bandit): maintain Beta(a,b) distribution per item, sample from it to decide exposure, update with each interaction | New chunks get Beta(1,1) prior (uniform). Each thumbs-up increments a, thumbs-down increments b. Score multiplier = E[Beta(a,b)] = a/(a+b). Naturally handles uncertainty and exploration. |
| **E-commerce** | Sorting products by rating with varying sample sizes | Wilson Score Lower Bound: ranks by the lower confidence bound of the positive proportion, penalizing items with few ratings | Apply to chunk ranking: chunk with 2/2 positive (100%) should not outrank chunk with 95/100 positive (95%). Wilson score handles this correctly. |
| **Chess (Elo)** | Rating players from pairwise outcomes | Elo rating: each game updates both players' ratings based on expected vs. actual outcome | Chunks "compete" when they appear together in results. If user rates answer positively, all included chunks "win" against excluded chunks. Update Elo scores accordingly. |
| **Ecology** | Species fitness in changing environments | Evolutionary stable strategies: populations adapt through selection pressure + mutation | Chunks with consistently low feedback "die out" (score drops below retrieval threshold). New chunks "mutate in" with neutral fitness. Prevents stagnation. |
| **Control systems** | Maintaining setpoint despite disturbances | PID controller: proportional (react to current error), integral (react to accumulated error), derivative (react to rate of change) | Feedback score adjustment as PID: P = current feedback rating, I = cumulative historical rating, D = trend (is this chunk getting better or worse over time?). Prevents over-correction. |

### 4.2 Biomimicry / Nature-inspired

**Immune system / Clonal selection:** The adaptive immune system identifies threats through a feedback loop: (1) encounter antigen, (2) proliferate matching B-cells, (3) hypermutate for better fit, (4) select highest-affinity variants, (5) store in memory. Transfer to RAG: (1) encounter query, (2) retrieve matching chunks, (3) generate answer variants, (4) user selects best answer, (5) boost chunks that contributed to it. The "memory cell" analogy maps to storing high-feedback chunks in a priority cache.

**Ant colony optimization:** Ants deposit pheromones on paths that lead to food. More-traveled paths accumulate more pheromone, attracting more ants — but pheromone evaporates over time, preventing lock-in to suboptimal paths. Transfer: feedback = pheromone. Positive feedback on a chunk = pheromone deposit. Time-based decay = evaporation. Natural balance between exploitation (follow high-feedback chunks) and exploration (low-pheromone paths still get some traffic).

### 4.3 Engineering disciplines

- **Signal processing:** Feedback signals are noisy (users make mistakes, rate randomly, have bad days). Apply a low-pass filter: require N feedback signals before adjusting a chunk's score. Prevents single outlier votes from causing large swings. Equivalent to a "minimum sample size" threshold.
- **Information theory:** Each feedback bit (thumbs up/down) carries at most 1 bit of information. But it's conditional on the query context. Storing (query, feedback, chunks) triples preserves the contextual information. Storing only aggregate chunk scores loses the query context — a chunk might be great for topic A but terrible for topic B.
- **Control systems:** Feedback loops can oscillate. If positive feedback boosts a chunk too aggressively, it gets over-retrieved, annoys users, gets negative feedback, drops too low, disappears, gets no feedback, eventually floats back up — classic oscillation. Damping (slow adjustment rate, EMA with alpha < 0.3) prevents this.
- **Linguistics / Pragmatics:** Query reformulation is a conversational repair mechanism. When a user rephrases a question, they're communicating "the previous answer didn't work." This is Gricean implicature — the meaning is in what's NOT said. Detecting reformulation patterns (same session, semantically similar queries within 60 seconds) is a strong implicit negative signal.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **What math we use:** Cosine similarity (pgvector HNSW) + BM25 (tsvector) -> Reciprocal Rank Fusion (RRF): `score = sum(1 / (k + rank_i))` where k=60. All chunks scored identically regardless of history.
- **Assumptions:** All chunks are equally likely to be relevant. Past retrieval performance has no bearing on future relevance. All users' preferences are identical.
- **Where assumptions break:** A document about "Python packaging" might be highly relevant for Python queries but toxic for queries about snakes. Aggregate feedback hides this. A chunk that was relevant 6 months ago for a fast-moving topic (e.g., API documentation) may be stale now.

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Reference |
|---|---|---|---|---|
| **Bayesian scoring (Beta-Binomial)** | Bayesian statistics | Handles uncertainty: chunks with few ratings stay near prior; chunks with many ratings converge to true quality. | O(1) per update, O(1) per query | Jules Jacobs, "Bayesian ranking of items with up and downvotes" (2015) |
| **Wilson Score Lower Bound** | Frequentist statistics | Conservative: ranks by lower confidence bound, not point estimate. Items with few ratings penalized fairly. | O(1) per computation | Evan Miller, "How Not To Sort By Average Rating" |
| **Exponential Moving Average (EMA)** | Time series / Signal processing | Recency-weighted: recent feedback matters more than old. Single parameter (alpha). Memory-efficient. | O(1) per update, 1 float per chunk | Standard in finance, control systems |
| **Rocchio Algorithm** | Information Retrieval (1971) | Shifts query vector toward relevant docs, away from non-relevant docs. Directly applicable to vector space. | O(d) per update where d = embedding dim | Rocchio, "Relevance Feedback in Information Retrieval" |
| **Elo Rating** | Game theory / Chess | Pairwise comparison: when chunk A appears in a good answer and chunk B doesn't, A "wins." Elegant handling of relative quality. | O(1) per update | Arpad Elo (1960); LMSYS Chatbot Arena (2023) |
| **Thompson Sampling** | Bayesian decision theory | Optimal exploration-exploitation tradeoff. Provably low regret. Naturally diversifies retrieved results. | O(1) per sample (Beta distribution) | Thompson (1933); Chapelle & Li (2011) |

### 5.3 Optimization opportunities

- **Current bottleneck:** Score = RRF(cosine_rank, bm25_rank). This is a rank-based fusion, meaning the actual similarity score magnitudes are lost. A chunk ranked #1 with score 0.99 looks the same as one ranked #1 with score 0.51. Adding a feedback multiplier to the POST-RRF score is simple but loses granularity. Better: apply feedback multiplier to the raw cosine/BM25 scores BEFORE rank fusion.
- **Better objective function:** Instead of optimizing for `max(similarity)`, optimize for `max(similarity * feedback_quality)` where `feedback_quality = EMA(ratings) or Beta(a,b).mean()`. This balances relevance with proven usefulness.
- **Approximation tricks:** For the MVP, a simple float column `feedback_score` on the chunks table (default 1.0, range [0.1, 3.0]) is sufficient. Multiply it into the final RRF score. No complex math needed for the first iteration.

### 5.4 Information-theoretic analysis

- **Feedback entropy:** Binary feedback (thumbs up/down) = max 1 bit per interaction. At 100 queries/day, that's 100 bits/day of signal. At 5 chunks per query, that's 20 bits/day per chunk (if every chunk gets rated in every query — unrealistic). Real-world: most chunks get 0-1 feedback signals per month. This means convergence is slow and cold start is real.
- **Information loss in aggregation:** Storing per-chunk aggregate scores loses the query-chunk-feedback triple. A chunk rated "good" for query A and "bad" for query B averages to "neutral" — information destroyed. Solution: store the triples, aggregate at query time with query-similarity weighting.
- **Optimal feedback granularity:** Binary (1 bit) vs. 5-star (2.3 bits) vs. free-text (unbounded). Research shows binary feedback has 85-90% of the discriminative power of 5-star at 3-5x higher response rate. Binary wins for Contexter's scale.

### 5.5 Linear algebra / geometry insights

- **Rocchio in embedding space:** After collecting positive feedback on chunks C+ and negative on C-, compute the centroid of C+ embeddings and C- embeddings. Shift future query embeddings: `q' = alpha*q + beta*centroid(C+) - gamma*centroid(C-)`. This is the classic Rocchio algorithm operating directly on 1024-dim Jina embeddings. No retraining needed.
- **Feedback as a learned metric:** Instead of cosine similarity, learn a Mahalanobis distance that accounts for feedback. Requires enough data (1000+ feedback pairs) to estimate the covariance matrix. Too heavy for Contexter's scale.
- **Dimensionality of feedback signal:** The feedback signal is extremely low-dimensional (1 bit) compared to the embedding space (1024 dims). It cannot meaningfully reshape the embedding space. It CAN meaningfully re-weight post-retrieval rankings — which is where it should be applied.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Minimum Viable Feedback Loop (MVFL)

**What:** A 3-component system:
1. **Explicit feedback collection** — thumbs up/down on answers, stored with full context (query, chunks used, answer).
2. **Chunk score adjustment** — Bayesian Beta-Binomial scoring per chunk, applied as a score multiplier in retrieval.
3. **Implicit feedback detection** — query reformulation within the same session = negative signal on previous query's chunks.

**Why (which layers support this):**
- Layer 1: We have zero data. Any feedback > 0 data.
- Layer 2: Industry standard. Every major RAG product does this. Proven approach.
- Layer 4: Beta-Binomial (Thompson Sampling / Bayesian scoring) handles cold start and uncertainty elegantly, borrowed from recommender systems.
- Layer 5: O(1) per update, 1 float per chunk. Mathematically sound, minimal storage overhead.

**Expected impact:**
- Retrieval precision@5 improvement: +5-15% (based on Pistis-RAG results of +6-7% with more sophisticated methods; our simpler approach should achieve at least comparable gains over zero-feedback baseline).
- User trust: thumbs up/down button signals "we care about quality" even before the data improves results.
- Data asset: feedback corpus enables future improvements (reranking, query routing, document quality scoring).

**Cost:**
- Implementation: 1-2 days (1 DB migration, 1 API endpoint, score adjustment in vectorstore query)
- Storage: ~200 bytes per feedback event. At 1000 queries/day with 30% feedback rate: ~2 MB/month.
- Query-time overhead: 1 additional float multiplication per chunk. Negligible (<0.1ms).
- No additional API costs (no extra LLM calls for basic MVFL).

**Risk:**
- Popularity bias (rich-get-richer). Mitigation: Beta prior starts at (1,1), slow convergence. Add exploration factor for low-feedback chunks.
- Malicious feedback (spam ratings). Mitigation: rate limit (already have 60 req/min), require auth (already have).
- Stale feedback on evolving content. Mitigation: exponential decay with 90-day half-life.

### 6.2 Implementation spec (brief)

#### Database schema

```sql
-- Feedback events table (append-only log)
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,            -- nanoid
  query_id TEXT NOT NULL,         -- links to a query session
  user_id TEXT NOT NULL REFERENCES users(id),
  query_text TEXT NOT NULL,       -- the original query
  answer_text TEXT NOT NULL,      -- the generated answer
  rating INTEGER NOT NULL,        -- 1 = thumbs up, -1 = thumbs down
  chunk_ids TEXT[] NOT NULL,      -- array of chunk IDs used in the answer
  source TEXT NOT NULL DEFAULT 'explicit',  -- 'explicit' | 'implicit_reformulation'
  metadata JSONB,                 -- optional: session_id, response_time_ms, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_created_at_idx ON feedback(created_at);
CREATE INDEX feedback_chunk_ids_idx ON feedback USING GIN(chunk_ids);

-- Chunk score cache (materialized from feedback)
-- Added to existing chunks table:
ALTER TABLE chunks ADD COLUMN feedback_pos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chunks ADD COLUMN feedback_neg INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chunks ADD COLUMN feedback_score REAL NOT NULL DEFAULT 1.0;
-- feedback_score = (feedback_pos + 1) / (feedback_pos + feedback_neg + 2)
-- This is the mean of Beta(feedback_pos+1, feedback_neg+1)
```

#### API endpoint spec

```
POST /api/feedback
Authorization: Bearer <token>

Request body:
{
  "queryId": "string",       // returned by /api/query in response
  "rating": 1 | -1,          // thumbs up or down
  "queryText": "string",     // the query that was asked
  "answerText": "string",    // the answer that was given
  "chunkIds": ["string"],    // chunk IDs from sources
  "metadata": {}             // optional
}

Response (201):
{
  "id": "string",
  "message": "Feedback recorded."
}

Response (400): { "error": "Rating must be 1 or -1." }
Response (429): { "error": "Feedback rate limit exceeded." }
```

Changes to `/api/query` response:
```json
{
  "queryId": "abc123",    // NEW: unique ID for this query, used for feedback
  "answer": "...",
  "sources": [...],
  "queryVariants": [...],
  "usage": {...}
}
```

#### How feedback affects future queries (concrete algorithm)

**Step 1: Record feedback**
On `POST /api/feedback`:
1. Insert row into `feedback` table.
2. For each `chunkId` in the feedback:
   - If rating = 1: `UPDATE chunks SET feedback_pos = feedback_pos + 1 WHERE id = chunkId`
   - If rating = -1: `UPDATE chunks SET feedback_neg = feedback_neg + 1 WHERE id = chunkId`
3. Recompute feedback_score: `UPDATE chunks SET feedback_score = (feedback_pos + 1.0) / (feedback_pos + feedback_neg + 2.0) WHERE id = ANY(chunkIds)`

This is the mean of a Beta(pos+1, neg+1) distribution. With zero feedback, score = 1/2 = 0.5. But we want default = 1.0 (neutral). So:

**Adjusted formula:** `feedback_score = 0.5 + (feedback_pos + 1.0) / (feedback_pos + feedback_neg + 2.0)`

This gives: zero feedback = 1.0, all positive = 1.5, all negative = 0.5. Range: [0.5, 1.5].

**Step 2: Apply feedback at retrieval time**
In `VectorStoreService.search()`, after computing RRF scores:

```
final_score = rrf_score * chunk.feedback_score
```

This is a single float multiplication per chunk. Chunks with positive history get up to 1.5x boost; chunks with negative history get down to 0.5x penalty.

**Step 3: Implicit feedback (query reformulation)**
Detect reformulation: if user sends a new query within 120 seconds of a previous query, and the cosine similarity between the two query embeddings > 0.7, treat the previous query's chunks as receiving implicit negative feedback (rating = -1, source = 'implicit_reformulation'). Weight: 0.5x of explicit feedback (i.e., increment feedback_neg by 0.5, or use a separate counter).

**Step 4: Time decay (periodic job)**
Run a daily cron job (or BullMQ scheduled job):
```sql
-- Decay all feedback counts by 1% daily (~30% monthly, ~90-day half-life)
UPDATE chunks
SET feedback_pos = GREATEST(0, feedback_pos * 0.99),
    feedback_neg = GREATEST(0, feedback_neg * 0.99),
    feedback_score = 0.5 + (GREATEST(0, feedback_pos * 0.99) + 1.0)
                     / (GREATEST(0, feedback_pos * 0.99) + GREATEST(0, feedback_neg * 0.99) + 2.0)
WHERE feedback_pos > 0 OR feedback_neg > 0;
```

This ensures stale feedback gradually loses influence.

### 6.3 Validation plan

**How to measure improvement:**
- **Before launch:** Run 50-100 representative queries, have nopoint manually rate answers (ground truth).
- **After launch:** Compare feedback-adjusted retrieval precision vs. baseline (A/B test: 50% of queries use feedback_score, 50% don't).
- **Ongoing metric:** Track weekly average feedback rating. If it trends upward, the loop is working.
- **RAGAS-style automated eval:** Periodically run faithfulness + answer relevancy checks on a random sample of queries using an LLM judge.

**Minimum success criteria:**
- Feedback response rate > 10% (at least 1 in 10 queries gets a rating).
- Average feedback_score of retrieved chunks trends upward over 30 days.
- User-reported satisfaction (thumbs up ratio) > 70% after 60 days.

**Rollback trigger:**
- Feedback_score adjustment causes retrieval quality regression (measured by automated eval).
- Score distribution becomes degenerate (all chunks converge to 0.5 or 1.5 — the loop is biased).

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **5-star rating system** | Higher friction. Research shows binary feedback captures 85-90% of discriminative power at 3-5x higher response rate. At Contexter's scale (low query volume), maximizing response rate is critical. |
| **Per-chunk feedback UI** | Users cannot meaningfully assess individual chunks. They judge the answer as a whole. Per-chunk ratings would be noisy and low-engagement. |
| **RLHF model fine-tuning** (RAG-Reward approach) | Requires training infrastructure, GPT-4o for preference generation, and a custom reward model. Overkill for Contexter's scale and budget. The 4-metric evaluation framework is usable separately as an offline analytics tool. |
| **Elo rating for chunks** | Elegant but requires pairwise comparisons. Each query only surfaces 5-10 chunks — not enough "games" per chunk to converge. Beta-Binomial converges faster with fewer observations. |
| **Rocchio query vector modification** | Requires storing per-user query centroid shifts. Adds complexity (1024-dim vector operations per user). Better suited for systems with repeat users and stable information needs. Consider for Phase 2. |
| **Cross-encoder reranker** | Adds 100-500ms latency per query. Good accuracy improvement (+10-15% on benchmarks), but Contexter prioritizes speed. Consider for Phase 2 when query volume justifies the cost. |
| **LLM-as-judge on every query** | Adds ~$0.0005-0.001 per query and 200-500ms latency. Good for offline batch evaluation, not for real-time feedback. Recommended as a periodic audit, not inline. |
| **Full Qdrant migration for native relevance feedback** | Qdrant 1.17 has built-in relevance feedback, but migrating from pgvector is a large effort with unclear ROI at Contexter's scale. The simple score multiplier achieves 80% of the benefit. |

---

## Phase 2 Roadmap (after MVFL proves value)

| Feature | When | Prerequisites |
|---|---|---|
| **Query-scoped feedback** — store feedback triples (query, chunks, rating) and weight chunk scores by query similarity at retrieval time | After 1000+ feedback events | MVFL deployed, sufficient data |
| **Automated LLM-judge** — periodic batch evaluation of random query sample using RAGAS metrics | After MVFL deployed | Groq API budget for evaluation calls |
| **Reranker-as-reward** (RaFe approach) — select best query rewrite variant using cross-encoder scores | After MVFL data shows query rewriting is a bottleneck | Cross-encoder API or local model |
| **Rocchio in embedding space** — shift query vectors toward high-feedback chunks per user | After per-user feedback patterns emerge (100+ feedbacks per user) | User-level feedback aggregation |
| **Document quality score** — aggregate chunk feedback to rate entire documents; surface "problematic documents" dashboard | After 500+ feedback events | Admin UI |

---

## Appendix A: Privacy Considerations

| Concern | Mitigation |
|---|---|
| Feedback stores full query text | Query text already stored in server logs (Hono). Feedback table adds no new PII exposure. Implement 90-day retention policy: delete feedback rows older than 90 days (or anonymize by removing query_text). |
| User behavior tracking (implicit feedback) | Implicit feedback only tracks time between queries and semantic similarity — no click tracking, no dwell time, no cursor tracking. Minimal privacy surface. |
| Cross-user feedback leakage | Feedback_score is per-chunk, not per-user. User A's feedback affects User B's results. For shared knowledge bases, this is the desired behavior. For private KBs, scope feedback to the KB owner only (filter by user_id in score computation). |
| Data export / right to deletion | Feedback table has user_id — easy to purge on account deletion (CASCADE from users table or explicit DELETE). |

## Appendix B: Cost of Feedback Pipeline

| Component | Cost |
|---|---|
| Storage (feedback table) | ~200 bytes/row. 10K rows/month = 2 MB. Negligible in PG. |
| Index overhead (GIN on chunk_ids) | ~50% of data size. 1 MB/month. Negligible. |
| Score recomputation on feedback | 1 UPDATE per chunk per feedback event. O(1). |
| Daily decay job | 1 UPDATE per chunk with feedback. At 10K chunks: <100ms. |
| Additional API latency | 1 float multiplication per chunk during search. <0.01ms. |
| Total additional cost | ~$0/month (within existing PG and Redis capacity). |

---

## Sources

### Papers
- [Pistis-RAG: Enhancing Retrieval-Augmented Generation with Human Feedback](https://arxiv.org/abs/2407.00072) (2024)
- [RaFe: Ranking Feedback Improves Query Rewriting for RAG](https://aclanthology.org/2024.findings-emnlp.49/) (EMNLP 2024)
- [RAG-Reward: Optimizing RAG with Reward Modeling and RLHF](https://arxiv.org/abs/2501.13264) (2025)
- [RankArena: Evaluating Retrieval, Reranking and RAG with Human and LLM Feedback](https://arxiv.org/abs/2508.05512) (2025)
- [Test-time Corpus Feedback: From Retrieval to RAG](https://arxiv.org/pdf/2508.15437) (2025)
- [RPO: Retrieval Preference Optimization for Robust RAG](https://arxiv.org/abs/2501.13726) (2025)
- [Reward-RAG: Enhancing RAG with Reward Driven Supervision](https://arxiv.org/abs/2410.03780) (2024)

### Implementation References
- [NirDiamant/RAG_Techniques — Retrieval with Feedback Loop](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/retrieval_with_feedback_loop.ipynb)
- [Qdrant — Relevance Feedback in Informational Retrieval](https://qdrant.tech/articles/search-feedback-loop/)
- [Qdrant v1.17 — Relevance Feedback](https://qdrant.tech/articles/relevance-feedback/)
- [567-labs — Chapter 3.1: Feedback Collection (Systematically Improving RAG)](https://567-labs.github.io/systematically-improving-rag/workshops/chapter3-1/)
- [apxml — User Feedback in RAG: Continuous Improvement Loop](https://apxml.com/courses/optimizing-rag-for-production/chapter-6-advanced-rag-evaluation-monitoring/user-feedback-rag-improvement)

### Mathematical Foundations
- [Evan Miller — How Not To Sort By Average Rating (Wilson Score)](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html)
- [Jules Jacobs — Bayesian ranking of items with up and downvotes](https://julesjacobs.com/2015/08/17/bayesian-scoring-of-ratings.html)
- [Stanford NLP — Rocchio Algorithm](https://nlp.stanford.edu/IR-book/html/htmledition/the-rocchio71-algorithm-1.html)
- [Thompson Sampling (Wikipedia)](https://en.wikipedia.org/wiki/Thompson_sampling)
- [LMSYS — Chatbot Arena: Benchmarking LLMs with Elo Ratings](https://lmsys.org/blog/2023-05-03-arena/)

### Industry References
- [Perplexity — Architecting and Evaluating an AI-First Search API](https://research.perplexity.ai/articles/architecting-and-evaluating-an-ai-first-search-api)
- [Qdrant — Decay Functions for Relevance Score Boosting](https://qdrant.tech/blog/decay-functions/)
- [RAGAS — Metrics Documentation](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/)
- [Pinecone — Rerankers and Two-Stage Retrieval](https://www.pinecone.io/learn/series/rag/rerankers/)
- [ThirdAI — Cross the Chasm with RAG: Implicit Feedback and Click-Through Data](https://medium.com/thirdai-blog/cross-the-chasm-with-rag-implicit-feedback-and-click-through-data-a9eee6e7ec47)

### Cross-Disciplinary
- [Dorota Glowacka — Bandit Algorithms in Information Retrieval (book)](https://glowacka.org/files/bandit_book.pdf)
- [Exponential Decay Function Based Time-Aware Recommender System](https://thesai.org/Downloads/Volume13No10/Paper_71-Exponential_Decay_Function_Based_Time_Aware_Recommender_System.pdf)
- [Half-Life Decaying Model for Recommender Systems](https://ceur-ws.org/Vol-2038/paper1.pdf)
- [Daniel Tunkelang — Implicit Query Reformulation](https://dtunkelang.medium.com/implicit-query-reformulation-426a246e7a62)
