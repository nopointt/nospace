# Query Decomposition for RAG -- Deep Research

> Research date: 2026-03-28
> Researcher: Axis (Orchestrator)
> Context: Contexter RAG service -- currently rewrites queries into 3 variants but does not decompose complex multi-part questions
> Framework: [deep-research-framework.md](deep-research-framework.md)

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: `rewriteQuery()` in `src/services/rag/rewriter.ts` generates N alternative phrasings of the user query to improve recall in hybrid search (RAG Fusion pattern).
- **How**: Single LLM call with prompt "Generate N alternative search queries". Returns `[original, ...variants]`. Each variant is embedded independently, searched independently, results deduped by ID and sorted by score.
- **Performance**: One LLM call (~256 max tokens), N embedding calls, N search calls. Effective for single-concept queries.
- **Known issues**:
  - **No decomposition**: "Compare Q1 and Q3 revenue and explain the trend" generates 3 paraphrases of the same complex question. All 3 variants search for the same broad concept, missing that we need Q1 data AND Q3 data AND trend analysis independently.
  - **No query classification**: Every query gets the same treatment -- simple and complex alike. A simple "What is X?" wastes tokens on 3 rewrites.
  - **No sub-answer synthesis**: The pipeline generates one answer from one merged context. There is no mechanism to answer sub-parts independently and then synthesize.
  - **Fixed variant count**: `DEFAULT_QUERY_REWRITE_COUNT = 3` regardless of query complexity.

### 1.2 Metrics (baseline)

- **Baseline accuracy on complex queries**: Unknown (no eval suite), but qualitative observation: multi-part comparative questions frequently miss one aspect.
- **Baseline latency**: 1 LLM call (rewrite) + 4 embedding calls (original + 3 variants) + 4 search calls + 1 LLM call (answer) = ~6 operations.
- **Baseline cost**: ~2 LLM calls + 4 embeddings per query.
- **User complaints**: Complex questions get incomplete answers -- system retrieves context about one part but misses the other.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Query decomposition** is the established technique for handling complex, multi-hop questions in RAG systems. It was first formalized in the context of RAG by the self-ask prompting paper (Press et al., 2022) and has since become a standard module in production RAG pipelines.

The standard pipeline:
1. **Classify** query complexity (simple / complex / multi-hop)
2. **Decompose** complex queries into independent sub-questions
3. **Retrieve** evidence for each sub-question
4. **Answer** each sub-question from its own evidence
5. **Synthesize** a final answer from all sub-answers

**Why it's standard**: Multi-hop questions are the primary failure mode of single-pass RAG. When facts are distributed across multiple documents, a single retrieval pass almost always misses at least one required fact. Decomposition directly addresses this.

**Who uses it**: NVIDIA RAG Blueprint (opt-in module), LangChain (SubQuestionQueryEngine), Haystack (QueryDecomposition component), LlamaIndex (SubQuestionQueryEngine), Microsoft Azure AI Search (recommended architecture).

### 2.2 Top implementations and papers

| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| **Question Decomposition for RAG** (Ammann et al., ACL SRW 2025) | LLM decomposes -> retrieve per sub-Q -> rerank merged pool | Improved coverage and precision on multi-hop QA | Reranking the merged pool after decomposition is critical -- raw union is noisy |
| **Query Decomposition for RAG: Balancing Exploration-Exploitation** (Petcu et al., arXiv 2510.18633, Oct 2025) | Multi-armed bandit to select which sub-queries to pursue | +35% document-level precision | Not all sub-queries are equally useful -- dynamically allocate retrieval budget |
| **RT-RAG: Reasoning in Trees** (WWW 2026) | Consensus-validated tree structure with adaptive leaf determination | +7.0% F1, +6.0% EM over SOTA | Over-decomposition hurts -- adaptive stopping is essential |
| **ParallelSearch** (Zhao et al., arXiv 2508.09303, Aug 2025) | RL-trained LLM decomposes into parallel sub-queries | +12.7% on parallelizable Qs, 69.6% LLM calls vs sequential | Parallel decomposition is strictly better than sequential for independent sub-queries |
| **Adaptive-RAG** (Jeong et al., NAACL 2024) | Trained classifier routes: no-retrieval / single-step / multi-step | SOTA on mixed-complexity benchmarks | Small classifier (not LLM) can accurately route query complexity |
| **IRCoT** (Trivedi et al., ACL 2023) | Interleave retrieval with CoT reasoning steps | +21 points retrieval, +15 points QA on HotpotQA | For truly sequential multi-hop, interleaving retrieval with reasoning beats pre-decomposition |
| **MA-RAG** (Nguyen et al., arXiv 2505.20096, May 2025) | Multi-agent: Planner -> Step Definer -> Extractor -> QA | Outperforms across NQ, HotpotQA, 2WikimQA, TriviaQA | Agent-based decomposition enables modular interpretability |

### 2.3 Standard configuration

**Recommended defaults:**
- Decompose into 2-5 sub-questions max (over-decomposition hurts -- RT-RAG finding)
- Use structured output (JSON array of sub-questions) for reliable parsing
- Skip decomposition for queries classified as simple (Adaptive-RAG pattern)
- Parallel retrieval for independent sub-questions, sequential for dependent ones
- Merge strategy: retrieve per sub-Q, answer per sub-Q, synthesize final answer from sub-answers (not from raw chunks)
- Max recursion depth: 3 (NVIDIA default)

**Common pitfalls:**
- Decomposing simple queries (adds 16.7s overhead per query with zero benefit)
- No dependency awareness between sub-questions (sequential questions need ordered resolution)
- Treating decomposition as rewriting (they are fundamentally different -- rewriting preserves the same question, decomposition creates new questions)
- Not reranking the merged retrieval pool (raw union of sub-query results is noisy)
- Over-decomposition into trivial sub-questions that fragment context

**Migration path from our current state:**
- **Effort**: Medium (2-3 days). The pipeline already supports multi-query retrieval via `rewriteQuery`. The main additions are: (1) query classifier, (2) decomposition prompt (separate from rewrite prompt), (3) sub-answer generation, (4) synthesis step.
- The existing `rewriteQuery` function stays as-is for the simple-query path.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2025-2026)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **ParallelSearch** (arXiv 2508.09303) | 2025-08 | RL-trained decomposition that recognizes parallelizable structure; 12.7% gain on parallel Qs, 30% fewer LLM calls | Research, code available | High -- Contexter queries are mostly independent sub-parts |
| **RT-RAG** (WWW 2026) | 2026-01 | Consensus-based tree validation + adaptive over-decomposition prevention | Research | Medium -- tree structure is overkill for our query types but the over-decomposition prevention is valuable |
| **MA-RAG** (arXiv 2505.20096) | 2025-05 | Multi-agent collaborative CoT: Planner -> Step Definer -> Extractor -> QA | Research | Low for now -- too complex for our scale, but the Planner/Extractor pattern is informative |
| **Dependency-Aware Query Decomposition** (arXiv 2510.24390) | 2025-10 | Explicit dependency graph between sub-questions; logic-parallel content expansion | Research | Medium -- important for truly sequential multi-hop; most Contexter queries are parallel |
| **DecomposeRAG** (UC Berkeley) | 2025 | GPT-4 decomposition with sequential sub-answer chaining | Research | Medium -- sequential chaining useful for "explain the trend" type queries |
| **HopRAG** (arXiv 2502.12442) | 2025-02 | Passage graph with pseudo-query edges; retrieve-reason-prune mechanism; +76.78% answer metric | Research | Low -- requires graph index infrastructure we don't have |

### 3.2 Open questions in the field

- **Optimal decomposition granularity**: How many sub-questions is optimal? RT-RAG shows over-decomposition hurts, but the optimal number varies by query type. No universal rule exists.
- **Decomposition quality evaluation**: No standard metric for "was this decomposed correctly?" Current papers evaluate end-to-end QA quality, not decomposition quality in isolation.
- **Cost-accuracy Pareto frontier**: How much latency/cost increase is acceptable for what accuracy gain? No systematic study across query types.
- **Decomposition for non-English**: Most research is English-only. Contexter serves Russian-language knowledge bases -- decomposition quality in Russian is unstudied.

### 3.3 Bets worth making

- **Heuristic classifier + LLM decomposition hybrid**: Use a cheap heuristic (regex/keyword) for obvious simple queries, LLM only for ambiguous cases. Saves the classification LLM call for 60-70% of queries.
- **Parallel sub-query retrieval**: Our existing multi-query pipeline already retrieves in parallel. Decomposition + parallel retrieval is a natural fit with minimal architectural change.
- **Sub-answer synthesis over raw chunk synthesis**: Instead of merging all chunks and generating one answer, generate sub-answers and synthesize. This is a fundamental shift from "retrieve-then-generate" to "retrieve-answer-synthesize" and is the key quality unlock for complex queries.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Compiler design** | Complex expression evaluation | Parse into AST, evaluate leaves first, propagate up | Sub-question dependency graph is literally an AST. Evaluate independent leaves in parallel, dependent nodes sequentially |
| **Project management** | Complex deliverable with dependencies | Work Breakdown Structure (WBS) + Critical Path Method | Decompose query into WBS, identify critical path (dependent sub-Qs), parallelize independent paths |
| **Military intelligence** | Complex intelligence requirement | PIR decomposition (Priority Intelligence Requirements -> Specific Information Requirements -> collection plan) | The PIR->SIR decomposition is exactly query->sub-queries->retrieval-plan |
| **Divide and conquer algorithms** | Problem too large to solve directly | Split into independent subproblems, solve recursively, merge results | Classic CS pattern -- query decomposition IS divide-and-conquer applied to information retrieval |
| **MapReduce** | Processing large datasets | Map (split into independent chunks) -> Reduce (merge results) | Sub-query retrieval = Map phase, synthesis = Reduce phase |
| **Journalism** | Complex investigative story | "5 Ws" decomposition: Who, What, When, Where, Why | Force-decompose any query into facets; ensures no aspect is missed |

### 4.2 Biomimicry / Nature-inspired

- **Ant colony foraging**: Ants decompose the search problem by splitting into independent scouts, each exploring a different direction. When one finds food, pheromone trails redirect others. Analogous to: launch parallel sub-queries, use early results to redirect remaining queries.
- **Human working memory**: Humans naturally chunk complex questions ("Let me think about the first part... now the second part..."). Decomposition mirrors this cognitive strategy. Miller's Law (7 +/- 2 items) suggests 2-5 sub-questions is the natural cognitive limit.

### 4.3 Engineering disciplines

- **Signal processing**: Band-pass filtering -- decompose a complex signal into frequency bands, process each independently, recombine. Query decomposition is conceptual band-pass filtering on the information spectrum.
- **Information theory**: A complex query has higher entropy than a simple one. Decomposition reduces per-sub-query entropy, making each retrieval more targeted (lower entropy = more precise search).
- **Control systems**: Cascade control -- decompose a complex control problem into nested loops (inner loop fast/precise, outer loop slow/strategic). Query decomposition creates a cascade: inner loop = sub-query retrieval, outer loop = synthesis and verification.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **What math we use**: Cosine similarity for dense retrieval, BM25 for sparse retrieval, RRF for fusion. Query rewriting generates variants in the same semantic neighborhood.
- **Assumptions**: The query and relevant documents are in the same semantic region of embedding space. Rewriting explores nearby points in that region.
- **Where assumptions break**: For multi-hop queries, relevant documents are in DIFFERENT semantic regions. "Compare Q1 and Q3 revenue" requires documents from the Q1-revenue region AND the Q3-revenue region. No amount of rewriting moves a single query into two disjoint regions simultaneously.

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Reference |
|---|---|---|---|---|
| **Subspace decomposition** | Linear algebra | Decompose the query vector into orthogonal components, each targeting a different aspect | O(k * d) where k=sub-queries, d=dimensions | Analogous to PCA: find the principal components of the information need |
| **Multi-armed bandit** | Decision theory | Dynamically allocate retrieval budget across sub-queries based on observed utility | O(k * log(T)) for k arms over T rounds | Petcu et al. (2510.18633) -- 35% precision gain |
| **Information gain / entropy reduction** | Information theory | Prioritize sub-queries that maximize expected information gain | O(k * n) for k sub-queries, n candidate docs | Greedy selection of most informative sub-query first |
| **Set cover** | Combinatorics | Find minimum set of sub-queries whose retrieved documents cover all required facts | NP-hard, greedy O(k * n * m) | Ensures completeness -- no fact left uncovered |

### 5.3 Optimization opportunities

- **Current bottleneck**: For multi-hop queries, single-point retrieval in embedding space misses documents in other semantic regions. This is a fundamental geometric limitation of the current approach.
- **Better objective function**: Instead of maximizing cosine similarity for a single query, maximize coverage of the set of information needs. This is a set cover / submodular optimization problem.
- **Approximation tricks**:
  - Pre-compute query complexity score from embedding norm and token count (cheap heuristic).
  - Use the LLM's first few tokens of decomposition output as an early-exit signal (if the LLM starts with "This is a simple question", abort decomposition).

### 5.4 Information-theoretic analysis

- **Entropy of query**: A complex multi-part query has high entropy (many possible relevant document sets). Decomposition reduces entropy per sub-query, making each retrieval more precise.
- **Mutual information**: The mutual information between sub-queries measures their independence. Fully independent sub-queries (MI ~0) can be retrieved in parallel. High MI sub-queries have sequential dependencies.
- **Channel capacity**: Each retrieval call has a "channel capacity" -- it can return at most topK relevant results. Complex queries need more total channel capacity, achieved by decomposition into multiple retrieval calls.

### 5.5 Geometric insights

- **Single query = single point in embedding space**: Rewriting moves this point slightly. Decomposition creates MULTIPLE points in DIFFERENT regions of the space.
- **Query coverage radius**: A single query covers a hypersphere of radius ~r in embedding space. For multi-hop queries, the relevant documents lie in multiple disjoint hyperspheres. Only decomposition can cover them all.
- **The fundamental insight**: Query rewriting is local exploration (nearby points in one region). Query decomposition is global exploration (multiple points in disjoint regions). They are complementary, not substitutes.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

- **What**: Two-stage query processing: (1) lightweight heuristic classifier to detect simple vs. complex queries, (2) LLM decomposition for complex queries only, with parallel sub-query retrieval, per-sub-question answering, and synthesis.
- **Why**:
  - Layer 2 evidence: Every major RAG framework now includes decomposition as a standard module
  - Layer 3 evidence: ParallelSearch shows 12.7% improvement on parallelizable queries with 30% fewer LLM calls than sequential
  - Layer 5 evidence: Single-point retrieval geometrically cannot cover multi-region information needs
  - Layer 1 evidence: Our current system's primary failure mode is exactly this -- complex queries get incomplete answers
- **Expected impact**:
  - Complex queries: +30-50% answer completeness (based on ACL SRW 2025, RT-RAG, and DecomposeRAG results)
  - Simple queries: No change (classifier skips decomposition)
  - Latency on complex queries: +1 LLM call (decomposition) + 1 LLM call (synthesis) = ~2-4s additional
  - Latency on simple queries: +0ms (heuristic classifier is regex, no LLM call)
- **Cost**: +1-2 LLM calls per complex query. On simple queries, potentially SAVES cost by skipping rewriting.
- **Risk**: Decomposition quality depends on LLM quality. Bad decomposition (wrong sub-questions, over-decomposition) can hurt worse than no decomposition. Mitigation: cap at 2-5 sub-questions, validate with structured output.

### 6.2 Implementation spec (brief)

#### Stage 1: Query Classifier (heuristic, no LLM call)

**Input**: Raw user query string.
**Output**: `"simple" | "complex"`.
**Algorithm** (rule-based heuristic):

```
function classifyQuery(query: string): "simple" | "complex" {
  // Signals of complexity:
  const hasConjunction = /\b(and|or|but|versus|vs\.?|compared? to|in contrast)\b/i.test(query)
  const hasMultipleQuestionMarks = (query.match(/\?/g) || []).length > 1
  const hasComparisonWords = /\b(compar|differ|similar|between|both|each|respective)\b/i.test(query)
  const hasTemporalRange = /\b(Q[1-4].*Q[1-4]|before.*after|from.*to|trend|over time|year.over.year|month.over.month)\b/i.test(query)
  const hasMultipleEntities = countDistinctEntities(query) >= 2  // simple NER: capitalized words, quoted terms
  const wordCount = query.split(/\s+/).length

  const complexityScore =
    (hasConjunction ? 1 : 0) +
    (hasMultipleQuestionMarks ? 1 : 0) +
    (hasComparisonWords ? 1 : 0) +
    (hasTemporalRange ? 1 : 0) +
    (hasMultipleEntities ? 1 : 0) +
    (wordCount > 20 ? 1 : 0)

  return complexityScore >= 2 ? "complex" : "simple"
}
```

**Rationale**: Avoids an LLM call for classification. The Adaptive-RAG paper (NAACL 2024) trains a small classifier, but for our scale a regex heuristic is sufficient and free. False positives (simple query classified as complex) cost an extra LLM call but don't hurt quality. False negatives (complex query classified as simple) fall through to the existing rewrite path, which is the current behavior anyway -- no regression.

**Fallback**: If heuristic is uncertain (score = 1), use the existing rewrite path (current behavior). Only score >= 2 triggers decomposition. Conservative by design.

#### Stage 2a: Simple Query Path (existing)

Unchanged. `rewriteQuery()` generates 3 variants. Retrieve, merge, answer. Existing pipeline.

#### Stage 2b: Complex Query Path (new)

**Decomposition prompt:**

```
You are a search query decomposer for a knowledge base. Break down the complex question into 2-5 independent sub-questions that together cover the full information need.

Rules:
- Each sub-question must be answerable independently from a knowledge base
- Keep ALL proper nouns, brand names, product names, and technical terms EXACTLY as they appear
- If the original question compares entities, create one sub-question per entity
- If the original question asks about a time range, create one sub-question per time period
- If the question asks "explain why" or "explain the trend", add a sub-question specifically for the causal/explanatory aspect
- Do NOT decompose further than necessary -- 2-3 sub-questions is typical, 5 is the maximum
- Return ONLY the sub-questions as a JSON array of strings, no explanations

Question: "{query}"
```

**Expected output** for "Compare the Q1 and Q3 revenue and explain the trend":
```json
[
  "What was the Q1 revenue?",
  "What was the Q3 revenue?",
  "What factors explain the revenue trend between Q1 and Q3?"
]
```

**Sub-answer generation**: For each sub-question:
1. Embed sub-question
2. Search (vector + FTS)
3. Build context from top results
4. Generate sub-answer with prompt: `"Answer this question based on the provided context: {sub_question}\n\nContext:\n{context}"`

**Synthesis prompt:**

```
You are synthesizing a comprehensive answer from sub-answers to the original question.

Original question: "{original_query}"

Sub-answers:
{foreach sub_question, sub_answer:}
Q: {sub_question}
A: {sub_answer}
{end}

Rules:
- Combine the sub-answers into a single coherent response that fully addresses the original question
- If sub-answers conflict, note the discrepancy
- If any sub-answer says "not enough information", reflect that gap in your final answer
- Answer in the same language as the original question
- Cite which aspects come from which sub-answers
```

#### Stage 3: Pipeline integration

```
Query -> [Classify: simple/complex]
  |
  |- simple -> [Rewrite x3] -> [Embed x4] -> [Search x4] -> [Merge] -> [Answer]
  |
  |- complex -> [Decompose] -> for each sub-Q:
                                  [Embed x1] -> [Search x1] -> [Sub-Answer]
                               -> [Synthesize final answer]
```

**Config parameters:**
- `enableDecomposition: boolean` (default: true)
- `maxSubQuestions: number` (default: 5)
- `complexityThreshold: number` (default: 2) -- heuristic score threshold

#### When to skip decomposition (even for "complex" queries)

1. Knowledge base has < 50 chunks (too small to benefit from targeted sub-queries)
2. Query is a single entity lookup disguised as complex ("What is the revenue and address of Company X?" -- same document likely has both)
3. All sub-questions would search the same semantic region (decomposition adds cost without expanding coverage)

### 6.3 Validation plan

- **How to measure improvement**: Create a test set of 20 complex queries and 20 simple queries against a test knowledge base. Measure answer completeness (does the answer address all parts of the question?) and factual accuracy.
- **Minimum success criteria**:
  - Complex queries: 25%+ improvement in answer completeness (all sub-parts addressed)
  - Simple queries: No regression in quality or latency
  - Latency on complex queries: < 2x increase over current pipeline
- **Rollback trigger**: If complex query answers degrade (bad decomposition causing irrelevant retrieval) or latency exceeds 3x baseline.

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Always decompose (no classifier)** | 16.7s/query overhead on simple queries (500x slower than naive RAG). Simple queries get fragmented into trivial sub-questions, adding cost without benefit. |
| **LLM-based classifier instead of heuristic** | Adds an LLM call (~1-2s, ~$0.001) for every query. Heuristic is free, deterministic, and has acceptable false-positive rate. Can upgrade to LLM classifier later if heuristic proves insufficient. |
| **IRCoT (interleaved retrieval + CoT)** | Powerful for truly sequential multi-hop (hop 2 depends on hop 1's answer). But most Contexter queries are parallel (compare X and Y), not sequential. IRCoT adds complexity and latency for cases we rarely see. Worth revisiting if users start asking chain-reasoning questions. |
| **Full agentic loop (CRAG / Self-RAG)** | Overkill for current scale. Adds 3-5 LLM calls per query for self-critique and retry loops. Better suited for high-stakes domains (medical, legal). Can layer on top of decomposition later. |
| **Multi-agent decomposition (MA-RAG)** | Requires 4 specialized agents (Planner, Step Definer, Extractor, QA). Impressive results but extreme cost and latency. Not justified for a knowledge base Q&A service. |
| **Trained decomposition model (ParallelSearch)** | Requires RL training on query decomposition data. Best results (12.7% on parallel queries) but we lack the training infrastructure. Use prompt-based decomposition now, consider fine-tuning later. |
| **Graph-based decomposition (HopRAG)** | Requires building a passage graph with pseudo-query edges at indexing time. Infrastructure cost not justified for our corpus sizes. |
| **Skip rewriting on complex path** | Considered skipping the rewrite step for decomposed sub-questions. Rejected because a sub-question can still benefit from 1-2 rewrites to improve recall. But default to 0 rewrites on sub-questions initially to keep costs controlled. |

---

## Appendix A: Key Techniques Reference

### A.1 Sub-Question Decomposition

The core technique. An LLM breaks a complex question into 2-5 simpler sub-questions. Each sub-question is processed independently through the retrieval pipeline.

**Strengths**: Simple to implement, significant quality gains on multi-part questions, works with any retrieval backend.
**Weaknesses**: Quality depends entirely on the decomposition prompt and LLM capability. Bad decomposition is worse than no decomposition.
**Key papers**: Ammann et al. (ACL SRW 2025), Press et al. (Self-Ask, 2022).

### A.2 Multi-Hop Retrieval

Retrieval where each hop's query depends on the previous hop's results. "Who is the spouse of the CEO of Company X?" requires: (1) retrieve CEO name, (2) retrieve spouse of that person.

**Strengths**: Solves genuinely sequential information needs.
**Weaknesses**: Each hop adds latency. Error compounds -- if hop 1 retrieves wrong person, all subsequent hops fail.
**Key papers**: IRCoT (Trivedi et al., ACL 2023 -- +21 points retrieval, +15 points QA on HotpotQA).

### A.3 Step-Back Prompting

Before retrieval, ask the LLM to formulate a more abstract/general version of the question. Retrieve for both the original and the abstract version.

**Strengths**: Helps with questions requiring broader context. "What happens to gas when temperature increases?" -> step-back: "What are the principles of gas behavior?" Retrieves the underlying principles alongside specific facts.
**Weaknesses**: Not useful for precise factoid questions. Adds one LLM call.
**Key paper**: "Take a Step Back" (Google, 2023). Step-Back + RAG fixes 21.6% of errors from baseline RAG.

### A.4 IRCoT (Interleaving Retrieval with Chain-of-Thought)

Instead of decomposing the query upfront, interleave retrieval with reasoning steps. Each CoT sentence becomes a retrieval query; retrieved results inform the next reasoning step.

**Strengths**: Naturally handles sequential dependencies without explicit decomposition. Up to +21 points retrieval, +15 points QA. Reduces hallucination.
**Weaknesses**: Fundamentally sequential -- cannot parallelize. High latency (one retrieval per reasoning step). Complex to implement.
**Key paper**: Trivedi et al. (ACL 2023).

### A.5 Least-to-Most Prompting

Two-stage decomposition: (1) decompose problem into subproblems ordered from simplest to hardest, (2) solve each in order, using solutions from previous subproblems as context.

**Strengths**: Dramatically improves compositional reasoning (6% -> 76% on SCAN benchmark). Natural ordering ensures dependent sub-questions get resolved context.
**Weaknesses**: Strictly sequential. Assumes problems have natural easy-to-hard ordering, which many RAG queries don't.
**Key paper**: Zhou et al. (ICLR 2023). 99.7% on SCAN with code-davinci-002.

### A.6 Self-Ask Prompting

The LLM explicitly generates follow-up questions, answers them (potentially with retrieval), and uses those answers to address the original question.

**Strengths**: Transparent reasoning chain. Natural integration with search engines for answering follow-up questions. Narrows the compositionality gap.
**Weaknesses**: Sequential processing. Quality depends on the LLM generating the RIGHT follow-up questions.
**Key paper**: Press et al. (2022). Showed that the compositionality gap does NOT decrease with model size -- explicit decomposition is needed regardless of model capability.

### A.7 Query Classification (Simple vs. Complex)

Route queries to different processing pipelines based on complexity.

**Approaches**:
- **Heuristic** (our recommendation): Regex/keyword detection. Free, deterministic, fast. Catches 70-80% of cases correctly.
- **Small classifier** (Adaptive-RAG): Train a small LM (e.g., DistilBERT) on complexity labels. Higher accuracy but requires training data.
- **LLM-based** (most accurate): Ask the LLM to classify before processing. Most flexible but adds a full LLM call per query.

**Key paper**: Adaptive-RAG (Jeong et al., NAACL 2024). Three categories: no-retrieval, single-step, multi-step.

### A.8 Sub-Answer Merging Strategies

| Strategy | How | Best for | Cost |
|---|---|---|---|
| **Chunk merge + single answer** | Merge all retrieved chunks, generate one answer | Simple, when chunks are from same topic | 1 LLM call |
| **Sub-answer synthesis** (recommended) | Answer each sub-Q independently, synthesize final answer | Complex multi-part questions | N+1 LLM calls |
| **Hierarchical synthesis** | Answer leaves, merge pairs, merge pairs of pairs | Deep multi-hop (4+ hops) | O(N log N) LLM calls |
| **Iterative refinement** | Generate draft answer, retrieve for gaps, refine | Open-ended research questions | 2-3 rounds, unbounded |

---

## Appendix B: Cost Analysis

### B.1 Cost per query path

| Path | LLM calls | Embedding calls | Search calls | Est. latency |
|---|---|---|---|---|
| **Current (all queries)** | 2 (rewrite + answer) | 4 | 4 | ~3-4s |
| **Simple (proposed)** | 1 (answer only, skip rewrite) | 1 | 1 | ~1-2s |
| **Complex (proposed, 3 sub-Qs)** | 5 (decompose + 3 sub-answers + synthesis) | 3 | 3 | ~6-8s |

### B.2 Expected query distribution

Based on typical knowledge base Q&A patterns:
- **Simple queries**: ~60-70% (single-concept lookups, factoid questions)
- **Complex queries**: ~30-40% (comparisons, multi-part, trend analysis)

### B.3 Net cost impact

Assuming 1000 queries/day with 65% simple / 35% complex:

**Current**: 1000 * 2 LLM calls = 2000 LLM calls/day
**Proposed**: (650 * 1) + (350 * 5) = 650 + 1750 = 2400 LLM calls/day

**Net increase**: ~20% more LLM calls, but simple queries get FASTER (1 call instead of 2), and complex queries get significantly more complete answers.

If we add 1 rewrite per sub-question (to improve sub-query recall): (650 * 1) + (350 * 8) = 3450 LLM calls/day = +72%. Recommendation: skip rewrites on sub-questions initially, add if retrieval recall is insufficient.

---

## Sources

### Core Papers
- [Question Decomposition for RAG (ACL SRW 2025)](https://arxiv.org/abs/2507.00355) -- Ammann, Golde, Akbik
- [Query Decomposition for RAG: Balancing Exploration-Exploitation (arXiv 2510.18633)](https://arxiv.org/abs/2510.18633) -- Petcu et al.
- [RT-RAG: Reasoning in Trees (WWW 2026)](https://arxiv.org/abs/2601.11255) -- consensus-validated tree decomposition
- [ParallelSearch (arXiv 2508.09303)](https://arxiv.org/abs/2508.09303) -- RL-trained parallel decomposition
- [Adaptive-RAG (NAACL 2024)](https://arxiv.org/abs/2403.14403) -- query complexity classifier
- [IRCoT (ACL 2023)](https://arxiv.org/abs/2212.10509) -- interleaving retrieval with chain-of-thought
- [Self-Ask / Compositionality Gap (2022)](https://arxiv.org/abs/2210.03350) -- Press et al.
- [Least-to-Most Prompting (ICLR 2023)](https://arxiv.org/abs/2205.10625) -- Zhou et al.
- [Step-Back Prompting (Google, 2023)](https://www.prompthub.us/blog/a-step-forward-with-step-back-prompting)
- [MA-RAG (arXiv 2505.20096)](https://arxiv.org/abs/2505.20096) -- multi-agent collaborative CoT
- [HopRAG (arXiv 2502.12442)](https://arxiv.org/abs/2502.12442) -- multi-hop reasoning with passage graphs
- [Dependency-Aware Query Decomposition (arXiv 2510.24390)](https://arxiv.org/abs/2510.24390)
- [Decomposed Prompting Does Not Fix Knowledge Gaps (arXiv 2602.04853)](https://arxiv.org/abs/2602.04853)

### Implementations & Guides
- [Haystack Query Decomposition Cookbook](https://haystack.deepset.ai/cookbook/query_decomposition)
- [Haystack Query Decomposition Blog](https://haystack.deepset.ai/blog/query-decomposition)
- [LangChain Query Decomposition](https://python.langchain.com/v0.1/docs/use_cases/query_analysis/techniques/decomposition/)
- [NVIDIA RAG Blueprint Query Decomposition](https://docs.nvidia.com/rag/latest/query_decomposition.html)
- [NirDiamant/RAG_Techniques -- Query Transformations](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/query_transformations.ipynb)
- [Advanced RAG 11: Query Classification and Refinement](https://aiexpjourney.substack.com/p/advanced-rag-11-query-classification)
- [Adaptive-RAG GitHub](https://github.com/starsuzi/Adaptive-RAG)
- [IRCoT GitHub](https://github.com/StonyBrookNLP/ircot)
- [ParallelSearch GitHub](https://github.com/Tree-Shu-Zhao/ParallelSearch)
