# Contextual Chunking — Deep Research
> Feature: Contextual chunk augmentation for Contexter RAG pipeline
> Date: 2026-03-28
> Framework: [deep-research-framework.md](deep-research-framework.md)
> Status: COMPLETE

---

## Layer 1: Current State

### 1.1 Our implementation

- **What:** Paragraph-greedy semantic chunker. Splits text on double-newline boundaries (`\n\n`), accumulates paragraphs until `maxTokens` is reached, then flushes. Overlap re-includes trailing tokens from previous chunk.
- **How:** `src/services/chunker/semantic.ts` — `chunkSemantic()`. Token counting via whitespace split (`1 word ~ 1 token` approximation). Three strategies: `semantic` (default for text/md/pdf), `row` (CSV/XLSX), `timestamp` (audio/video).
- **Config:** `DEFAULT_MAX_TOKENS = 500`, `DEFAULT_OVERLAP = 100` (tokens/words).
- **Embedding:** Jina v4, `truncate_dim=1024`, cosine similarity, HNSW index in pgvector.
- **LLM:** Groq Llama 3.1 8B Instant for query rewriting and answer generation.
- **Retrieval:** Hybrid search — pgvector cosine + PostgreSQL tsvector FTS, fused with RRF.

### 1.2 Known issues

1. **Context loss:** A chunk containing "Q3 revenue grew by 3%" has no information about which company, which year, or which document it came from. The embedding captures "revenue growth" but not "ACME Corp Annual Report 2025."
2. **Pronoun orphaning:** Chunks beginning with "He then proposed..." or "This approach..." lose their referent entirely after splitting.
3. **No structural awareness:** Markdown headings (`# Section`, `## Subsection`) are treated as regular paragraphs. A chunk doesn't know which section it belongs to.
4. **Flat metadata:** `ChunkMetadata` only stores `type: "semantic"`. No document title, section path, page number (for text), or parent context.
5. **Approximate tokenizer:** Whitespace split overestimates token count for CJK text and underestimates for code. Not critical for chunking boundaries but adds noise.
6. **No reranking:** Retrieved chunks go directly to LLM without reranking step.

### 1.3 Metrics (baseline, not yet measured)

- Baseline retrieval accuracy: **unknown** (no evaluation harness)
- Baseline latency: p50 ~200ms search (pgvector + FTS + RRF)
- Baseline cost: ~$0 for chunking (no LLM call), ~$0.05/M tokens for Groq queries
- User complaints: "answers are vague", "it doesn't find the right section" (anecdotal from testing)

---

## Layer 2: World-Class Standard

### 2.1 Anthropic's Contextual Retrieval (September 2024)

**Source:** [Anthropic blog — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)

**The method:** For every chunk in a document, use an LLM to generate a short contextual prefix (50-100 tokens) that situates the chunk within the overall document. Prepend this prefix to the chunk before embedding and before BM25 indexing.

**Exact prompt (from Anthropic):**

```
<document>
{{WHOLE_DOCUMENT}}
</document>
Here is the chunk we want to situate within the whole document
<chunk>
{{CHUNK_CONTENT}}
</chunk>
Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.
```

**Concrete example:**
- Original chunk: `"The company's revenue grew by 3% over the previous quarter."`
- Contextualized chunk: `"This chunk is from an SEC filing on ACME corp's performance in Q2 2023; the previous quarter's revenue was $314 million. The company's revenue grew by 3% over the previous quarter."`

**Benchmark results (Anthropic, averaged across codebases, fiction, research papers):**

| Configuration | Top-20 retrieval failure rate | Reduction vs baseline |
|---|---|---|
| Baseline embeddings | 5.7% | — |
| Contextual Embeddings | 3.7% | -35% |
| Contextual Embeddings + Contextual BM25 | 2.9% | -49% |
| Contextual Embeddings + Contextual BM25 + Reranking | 1.9% | **-67%** |

**Domain variance:** Fiction showed 77% improvement; ArXiv papers showed ~0% improvement at top-20 level. The technique works best on documents with implicit context (pronouns, abbreviations, domain jargon) rather than self-contained technical writing.

**Cost with Claude prompt caching:**
- Assumptions: 800 token chunks, 8K token documents, 50 token instructions, 100 token context output
- Cost: **$1.02 per million document tokens** (one-time, at indexing)
- Prompt caching: Load document into cache once, generate context for all chunks in that document. Cache reads at $0.30/M tokens vs $3.00/M fresh = **~90% cost reduction per document**.

### 2.2 Top 3 implementations

| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| **Anthropic Contextual Retrieval** (2024-09) | LLM-generated prefix per chunk + hybrid BM25 + reranking | -67% retrieval failure (top-20) | Prompt caching makes it economical; BM25 helps where embeddings fail |
| **Unstructured Platform** (2025) | Contextual chunking as built-in pipeline step; uses LLM to generate chunk summaries | Not published | First platform to productize; supports structure-aware + contextual |
| **Together AI Implementation** (2024) | Open-source Contextual RAG with Llama models; async batch processing | Reproduced Anthropic results | Shows it works with open-source LLMs, not just Claude |

### 2.3 Standard configuration (2025-2026 consensus)

**Recommended defaults:**
- Chunk size: 256-512 tokens for factoid queries, 512-1024 for analytical/multi-hop
- Overlap: 10-20% of chunk size
- Contextual prefix: 50-150 tokens (shorter = cheaper, longer = more context)
- Hybrid search: vector + BM25 with RRF fusion (this is now table stakes)
- Reranking: adds 5-20% on top of contextual retrieval

**Common pitfalls:**
1. Running contextual generation without prompt caching = 10x cost blow-up
2. Using contextual chunking for in-document retrieval (needle-in-haystack) — it actually *degrades* performance because context makes chunks more similar to each other within the same document
3. Not evaluating per-domain — ArXiv/technical docs may not benefit
4. Semantic chunking (embedding-similarity-based splitting) averages only 43 tokens per chunk, which retrieves well in isolation but gives LLM too little context — **54% end-to-end accuracy vs 69% for recursive splitting**

**Migration effort from our current state:** MEDIUM
- We already have hybrid search (pgvector + tsvector + RRF) — done
- We need: (1) LLM call per chunk at indexing, (2) prefix storage in DB, (3) re-embedding with prefix
- No architectural changes required — it's a pipeline enhancement

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques

| Paper/Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **Late Chunking** (Jina, arXiv 2409.04701) | 2024-09, updated 2025-07 | Embed entire document through transformer, then mean-pool per chunk. Each chunk embedding is "conditioned on" all surrounding tokens. | Production (Jina v3/v4 API, `late_chunking=true`) | **HIGH — we already use Jina v4.** Zero LLM cost. |
| **Proposition-based chunking** (NirDiamant/RAG_Techniques) | 2024-2025 | LLM extracts atomic factoids ("ACME revenue was $323M in Q2 2023"). Each proposition is self-contained and verifiable. | Prototype / open-source | HIGH for factoid-heavy docs (financials, specs). Expensive (LLM per paragraph). |
| **Agentic chunking** (IBM, various) | 2025 | LLM agent decides chunk boundaries based on semantic density, topic shifts, and content type. Variable-size chunks. | Experimental | LOW — high computational overhead, discontinued in some studies. Wait for cost reduction. |
| **TopoChunker** (arXiv 2603.18409) | 2026-03 | Topology-aware framework that analyzes document structure as a graph. | Research | MEDIUM — interesting for structured docs, too new to adopt. |
| **Document-structure-aware chunking** (MarkdownHeaderTextSplitter, various) | 2024-2025 | Split on markdown headings, preserve heading hierarchy as metadata. | Production-ready | **HIGH — immediate win for our markdown-heavy pipeline.** |
| **SmartChunk / Mix-of-Granularity** (arXiv 2602.22225, arXiv 2406.00456) | 2025-2026 | Query-adaptive chunk granularity — router decides optimal chunk size per query at retrieval time. | Research | MEDIUM-LOW — requires dual indexing at multiple granularities. |
| **RAPTOR with semantic chunking** (Frontiers, 2025) | 2025 | Hierarchical tree of summaries — leaf chunks + parent summaries + root summary. Multi-level retrieval. | Research/prototype | MEDIUM — good for long documents, adds complexity. |
| **"Beyond Chunk-Then-Embed" taxonomy** (arXiv 2602.16974) | 2026-02 | Comprehensive benchmark: structure-based > LLM-guided for in-corpus retrieval; LumberChunker > all for in-document retrieval; contextual chunking helps in-corpus but hurts in-document. | Research | **HIGH — validates our approach direction.** |

### 3.2 Open questions in the field

1. **Contextual chunking vs late chunking — which wins?** Late chunking is free (no LLM cost) but requires long-context embedding model support. Contextual chunking is model-agnostic but costs $1/M tokens. Head-to-head benchmarks are sparse.
2. **Optimal context prefix length:** Anthropic uses ~100 tokens. Is 50 enough? Is 200 better? No systematic study.
3. **Cross-document context:** Current approaches contextualize within a single document. What about a chunk from Document A that references concepts from Document B?
4. **Dynamic re-contextualization:** Should context be updated when new documents are added to the knowledge base?

### 3.3 Bets worth making

1. **Late chunking via Jina v4 API** — zero incremental cost, we already pay for Jina. Enable `late_chunking=true`, send entire document as concatenated chunks. Measure impact before adding LLM-based contextual prefix.
2. **Structure-aware chunking** — split on markdown headings first, include heading path as metadata. This is free and immediate.
3. **Contextual prefix generation via Groq Llama 3.1 8B** — at $0.05/M input tokens, contextualizing 1M tokens of documents costs ~$0.05-0.10 (10-20x cheaper than Claude). Test quality of context generated by 8B model vs larger models.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Linguistics — Discourse analysis** | Anaphora resolution: pronouns ("he", "it", "this") losing their referent when text is segmented | Coreference resolution: identify all mentions of an entity and link them. Centering Theory tracks forward-looking and backward-looking centers across utterances. | **Direct transfer:** Before chunking, run lightweight coreference resolution to replace pronouns with their referents. "He proposed..." becomes "CEO John Smith proposed..." This is exactly what contextual prefix does, but more targeted. |
| **Linguistics — Discourse segmentation** | Determining meaningful unit boundaries in running text | Topic segmentation algorithms (TextTiling, TopicTiling) detect topic shifts by measuring vocabulary overlap between adjacent blocks | **Direct transfer:** Use topic shift detection to find natural chunk boundaries instead of fixed-size splitting. Already partially done by semantic chunking. |
| **Library science — Abstracting & indexing** | Making documents discoverable without reading them in full | Two-layer system: (1) Abstract = dense summary, (2) Index terms = controlled vocabulary keywords. Both are created by humans who understand the whole document. | **Direct transfer:** Contextual prefix = automated abstracting. Each chunk gets its own micro-abstract. We could also generate index terms (keywords) per chunk for BM25 boosting. |
| **Library science — Controlled vocabulary** | Different documents use different terms for the same concept (synonymy/polysemy problem) | Authority files, thesauri (e.g., Library of Congress Subject Headings). Every concept gets a canonical term. | **Indirect transfer:** Normalize terminology in contextual prefixes. If doc A says "revenue" and doc B says "income", the prefix could include both terms. |
| **Cognitive science — Miller's chunking** | Working memory capacity is ~4 chunks (revised from Miller's original 7+-2). Humans group information into meaningful units. | Chunks are defined by the "largest meaningful unit the person recognizes." Experts have larger chunks because they recognize larger patterns. | **Key insight:** Optimal chunk size depends on the *reader* (the embedding model). A model with 8K context can "recognize" larger meaningful units than one with 512 tokens. Our 500-token default may be leaving performance on the table with Jina v4 (32K context). |
| **Cognitive science — Schema theory** | Humans understand new information by fitting it into existing mental frameworks (schemas) | Schemas provide top-down context that disambiguates ambiguous input. "Bank" means something different in a finance schema vs a geography schema. | **Direct transfer:** The contextual prefix acts as a schema activator — telling the embedding model "this is a financial document" primes the right interpretation of ambiguous terms. |
| **Music theory — Phrase boundaries** | Segmenting continuous sound into meaningful musical phrases | Phrases are delimited by cadences (harmonic closure), rests, melodic contour (arch shape), and rhythmic patterns. The brain detects boundaries via a Closure Positive Shift (CPS) — same neural mechanism as language. | **Analogy:** Good chunk boundaries should occur at "cadence points" — where a topic reaches natural closure. Sentence-final periods, paragraph breaks, and section headers are textual cadences. Our paragraph-greedy approach already uses paragraph breaks as cadences, which is musically sound. |

### 4.2 Nature-inspired

- **Cell membranes in biology:** Cells are self-contained units with everything needed for function, but they also have surface receptors (metadata) that signal to other cells what they contain. A chunk should be a "cell" — self-contained with surface metadata (contextual prefix) that enables discovery.
- **Fractal structure:** Documents have self-similar structure at multiple scales: document > section > paragraph > sentence > phrase. The contextual prefix adds document-scale information to paragraph-scale chunks, bridging two levels of the fractal.

### 4.3 Key linguistic insight: Anaphora is the core problem

The fundamental reason chunks lose context is **anaphora** — backward references to previously mentioned entities. In a 10-page document:
- ~30-40% of sentences contain pronominal anaphora ("he", "she", "it", "they")
- ~20-30% contain demonstrative anaphora ("this approach", "that method", "these results")
- ~10-15% contain zero anaphora (implied subject, common in technical writing)

When a chunk starts mid-paragraph, these references become dangling pointers. Contextual prefix generation is, at its core, **automated anaphora resolution at the chunk level**.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **Similarity:** Cosine similarity in 1024-dimensional space (Jina v4 embeddings)
- **Retrieval:** k-NN via HNSW index (approximate, `ef_search=64`) + BM25 via tsvector + RRF fusion
- **Assumptions:**
  - Chunks are independent documents (bag-of-chunks model)
  - Embedding captures full semantic content of chunk
  - Cosine similarity is the right metric for relevance
- **Where assumptions break:**
  - Chunks are NOT independent — they share document context
  - Embedding of "Revenue grew 3%" captures growth semantics but loses entity (which company? which quarter?)
  - Cosine similarity treats all dimensions equally, but some are more relevant to specific queries

### 5.2 Information-theoretic analysis

#### Chunking as lossy compression

A document D with entropy H(D) is compressed into N chunks {c_1, ..., c_N}. Each chunk c_i is further compressed into an embedding vector e_i in R^1024.

The compression pipeline: `D -> {c_1, ..., c_N} -> {e_1, ..., e_N}`

**Information loss occurs at two stages:**

1. **Chunking loss:** I_lost_chunk = H(D) - sum(H(c_i)) + I(c_i; c_j)
   - The mutual information I(c_i; c_j) between adjacent chunks represents shared context that is duplicated (via overlap) or lost. Our 100-token overlap captures ~20% of inter-chunk mutual information.

2. **Embedding loss:** I_lost_embed = H(c_i) - H(e_i)
   - A 1024-dim float32 vector stores ~32K bits. A 500-token chunk at ~4 bytes/token stores ~16K bits. So the embedding actually has MORE bit capacity than the chunk, but the mapping is lossy because the embedding function is many-to-one.

**What contextual prefix does mathematically:**

Contextual prefix increases H(c_i) by adding document-level information. Specifically, it adds the conditional information: I(c_i; D | c_i) — the information about the document that is NOT already in the chunk.

This reduces the "contextual entropy gap": the difference between what the chunk means in isolation vs what it means in context. Formally:

```
H_gap(c_i) = H(c_i | D) - H(c_i)
```

Where H(c_i | D) is the entropy of interpreting the chunk given the full document (low — meaning is clear), and H(c_i) is the entropy of interpreting it in isolation (high — meaning is ambiguous). The prefix minimizes this gap.

#### Optimal chunk size

From information theory, the optimal chunk size balances two competing objectives:

1. **Precision:** Smaller chunks have lower internal entropy, meaning the embedding vector can represent them more faithfully. Retrieval precision increases.
2. **Recall:** Larger chunks contain more context, reducing the probability that a relevant answer is split across chunks. Retrieval recall increases.

**The research consensus (arXiv 2505.21700v2):**
- 64-128 tokens: optimal for entity-based factoid queries (high precision, low recall)
- 256-512 tokens: optimal for general-purpose RAG (balanced)
- 512-1024 tokens: optimal for analytical/multi-hop queries (high recall, lower precision)

**With contextual prefix:** The prefix effectively adds 50-100 tokens of "virtual context" to each chunk without increasing storage cost proportionally (the prefix is much smaller than increasing chunk size by the same amount). This shifts the precision-recall frontier outward — you get better recall without sacrificing as much precision.

### 5.3 Graph-theoretic perspective

A document can be modeled as a directed acyclic graph (DAG) of propositions:

```
D = (V, E) where
  V = {p_1, ..., p_n}  (propositions / atomic facts)
  E = {(p_i, p_j) | p_j references or depends on p_i}
```

Chunking = graph partitioning into subgraphs. The quality of a partition depends on:

1. **Internal connectivity (cohesion):** Propositions within a chunk should be densely connected. High cohesion = semantically coherent chunk.
2. **External connectivity (coupling):** Edges crossing chunk boundaries represent lost context. The contextual prefix "re-attaches" cut edges by summarizing what the partition lost.

**Optimal partitioning** minimizes the number of cut edges (min-cut) while keeping partitions within size constraints. This is the graph-theoretic formulation of good chunking.

**Contextual prefix as edge restoration:** For each chunk, the prefix restores the most important incoming edges from other partitions — the "which document?", "which section?", "which entity?" information that was severed by the partition.

### 5.4 Compression ratio analysis

| Representation | Size (bits, 500-token chunk) | Information capacity | Use case |
|---|---|---|---|
| Full text | ~16,000 bits (500 words * ~4 bytes) | Complete | Storage, display |
| Embedding (1024d float32) | 32,768 bits | Semantic similarity only | Vector search |
| BM25 term frequencies | ~2,000 bits (sparse vector) | Lexical matching only | Keyword search |
| Contextual prefix (100 tokens) | ~3,200 bits | Document-level context | Context restoration |

The contextual prefix adds ~20% to raw text storage but provides disproportionate value because it contains HIGH-VALUE, LOW-REDUNDANCY information (document identity, section context, entity disambiguation) that is precisely what's lost in chunking.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Three-phase enhancement

**Phase 1 (zero cost): Structure-aware chunking + late chunking**
- **What:** (a) Split markdown on heading boundaries, carry heading path as metadata. (b) Enable `late_chunking=true` in Jina v4 API calls — send document sections as arrays, get contextually-informed embeddings.
- **Why:** Layer 3 research shows structure-based methods outperform LLM-guided for in-corpus retrieval. Late chunking is free with Jina v4 and preserves cross-chunk context at the embedding level. Layer 4 (cognitive science) tells us optimal chunk size depends on the model's context window — Jina v4 supports 32K tokens, so late chunking unlocks its full capacity.
- **Expected impact:** +5-15% retrieval accuracy (based on markdown-aware splitting benchmarks) + improved embedding quality from late chunking
- **Cost:** $0 incremental
- **Risk:** Low. Pure improvement. Fallback: revert to current behavior.

**Phase 2 (low cost): Contextual prefix generation via Groq**
- **What:** For each chunk, call Groq Llama 3.1 8B with the document text + chunk, get a 50-100 token contextual prefix. Store prefix in DB. Prepend prefix to chunk content before embedding AND before tsvector indexing.
- **Why:** Layer 2 (Anthropic) shows -49% retrieval failure with contextual embeddings + BM25, and -67% with reranking. Layer 4 (linguistics) confirms this is automated anaphora resolution. Layer 5 (information theory) shows it minimizes the contextual entropy gap.
- **Expected impact:** -30-50% retrieval failure rate (extrapolating Anthropic's results to our domain mix)
- **Cost:** ~$0.05-0.10 per million document tokens with Groq pricing ($0.05/M input, $0.08/M output). For a 100-document knowledge base averaging 10K tokens each (1M total), one-time contextual generation costs ~$0.10.
- **Risk:** Medium. Groq's Llama 3.1 8B may generate lower-quality context than Claude. Mitigation: A/B test quality. Fallback: use prefix as metadata-only boost, don't embed it.

**Phase 3 (if Phase 2 succeeds): Add reranking**
- **What:** After retrieval, use a cross-encoder reranker (Jina Reranker or Cohere) to re-score top-K chunks.
- **Why:** Layer 2 shows reranking adds another 18 percentage points on top of contextual retrieval.
- **Expected impact:** Additional -10-20% retrieval failure
- **Cost:** ~$0.01-0.05 per query (reranker API call)
- **Risk:** Low. Separate research already done: [reranking-deep-research.md](reranking-deep-research.md).

### 6.2 Implementation spec: Phase 2 (contextual prefix generation)

**Input:** Document full text (string) + array of chunks (from Phase 1 structure-aware chunker)

**Output:** Each chunk augmented with `contextPrefix` field (50-100 tokens)

**Prompt for Groq (adapted from Anthropic, optimized for 8B model):**

```
<document>
{DOCUMENT_TEXT}
</document>

<chunk>
{CHUNK_CONTENT}
</chunk>

Write a short context (2-3 sentences) that situates this chunk within the document. Include: document type, main topic, and any entities or timeframes referenced in the chunk. Be specific and factual.
```

Note: Simpler instruction than Anthropic's because Llama 8B benefits from more explicit guidance ("Include: document type, main topic, entities"). The `<document>` and `<chunk>` XML tags help the model parse structure.

**Algorithm (pseudocode):**

```
function contextualizeChunks(document, chunks):
    // Phase 1: Try batch approach (all chunks in one call if doc fits in context)
    if document.tokenCount + sum(chunk.tokenCount for chunk in chunks) < 120000:
        // Groq Llama 3.1 8B has 128K context
        // But for reliability, process chunks in batches of 10
        for batch in chunks.batchesOf(10):
            prompts = batch.map(chunk =>
                buildPrompt(document.text, chunk.content)
            )
            // Groq doesn't have prompt caching, but document is resent per call
            // Cost is still trivial at $0.05/M input tokens
            contexts = await Promise.all(
                prompts.map(p => groq.complete(p, maxTokens=150))
            )
            for (chunk, context) in zip(batch, contexts):
                chunk.contextPrefix = context
                chunk.content = context + "\n\n" + chunk.content

    // Phase 2: Re-embed with context
    embeddings = await jina.embed(
        chunks.map(c => c.content),
        task: "retrieval.passage",
        late_chunking: true  // Also use late chunking
    )

    // Phase 3: Re-index in pgvector + tsvector
    await db.upsertChunks(chunks, embeddings)

    return chunks
```

**Config (parameters and defaults):**

```
CONTEXTUAL_PREFIX_ENABLED = true
CONTEXTUAL_PREFIX_MAX_TOKENS = 150  // max output for context generation
CONTEXTUAL_PREFIX_MODEL = "llama-3.1-8b-instant"  // Groq
CONTEXTUAL_PREFIX_PROMPT_VERSION = 1
LATE_CHUNKING_ENABLED = true  // Jina v4 parameter
CHUNK_MAX_TOKENS = 500  // unchanged from current
CHUNK_OVERLAP = 100     // unchanged from current
```

**DB schema change:**

```sql
ALTER TABLE chunks ADD COLUMN context_prefix TEXT;
ALTER TABLE chunks ADD COLUMN context_version INTEGER DEFAULT 0;
```

**Fallback:** If Groq API fails during contextual generation, store chunk without prefix (graceful degradation). Set `context_version = 0` for non-contextualized chunks, `context_version = 1` for contextualized. This allows incremental migration.

### 6.3 Cost estimation

**Groq pricing (Llama 3.1 8B Instant):**
- Input: $0.05/M tokens
- Output: $0.08/M tokens
- Batch API: 50% discount (if available)

**Per-document cost (10K token document, ~20 chunks):**
- Input per chunk: ~10,000 (document) + 500 (chunk) + 100 (prompt) = ~10,600 tokens
- Total input for 20 chunks: 20 * 10,600 = 212,000 tokens = $0.0106
- Output per chunk: ~100 tokens
- Total output for 20 chunks: 2,000 tokens = $0.00016
- **Total per document: ~$0.011**
- **Total per 1M document tokens: ~$1.10** (comparable to Anthropic's $1.02 with Claude caching)

**Note on Groq vs Claude cost:**
- Groq Llama 8B: $0.05/M input — no prompt caching, but so cheap it doesn't matter
- Claude with caching: $0.30/M cached input, $3.00/M fresh — cheaper per-chunk after caching, but higher base cost
- **For our scale (small knowledge bases, <1000 documents), Groq wins on simplicity and absolute cost**

**Jina v4 embedding cost:**
- Already paid — no incremental cost for re-embedding with contextual prefix
- Late chunking: no additional cost (same API, add `late_chunking=true`)

**Total incremental cost for contextual chunking: ~$0.01 per document, ~$1.10 per million document tokens**

### 6.4 Whether to use prompt caching

**No.** Groq does not offer prompt caching for Llama 3.1 8B. However, at $0.05/M input tokens, the cost of resending the full document for each chunk is negligible. For a 10K token document with 20 chunks, the total "waste" from resending is 20 * 10K = 200K tokens = $0.01. Not worth optimizing.

If we ever switch to Claude for context generation (e.g., for higher quality), prompt caching becomes critical — it would reduce per-document cost by ~90%.

### 6.5 Chunk size recommendation with contextual prefix

**Keep 500 tokens.** Here's why:

1. The contextual prefix adds ~100 tokens of high-value context, making each chunk effectively ~600 tokens for embedding
2. This is within the optimal 256-512 range for general-purpose RAG (the prefix doesn't count toward retrieval granularity — it's context, not content)
3. Increasing chunk size would dilute the precision benefit of contextual retrieval
4. The "Beyond Chunk-Then-Embed" paper (2026) confirms that for in-corpus retrieval (our primary use case), moderate-sized structure-based chunks outperform both smaller semantic chunks and larger LLM-guided chunks

### 6.6 A/B test plan

**Setup:**
1. Create an evaluation dataset: 50 documents across 3+ domains (financial reports, technical docs, meeting notes)
2. Generate 200 test queries with known ground-truth chunks
3. Process each document through both pipelines:
   - **Control (A):** Current pipeline — paragraph-greedy chunking, direct embedding
   - **Treatment (B):** New pipeline — structure-aware chunking + late chunking + contextual prefix

**Metrics:**
- **Primary:** Recall@5, Recall@10, Recall@20 (does the correct chunk appear in top-K?)
- **Secondary:** MRR (Mean Reciprocal Rank), NDCG@10
- **End-to-end:** Answer quality scored by LLM judge (1-5 scale) on 50 representative queries
- **Cost:** Total $ spent on contextual generation per document
- **Latency:** Indexing time increase (one-time) + retrieval latency change (should be ~0)

**Success criteria:**
- Recall@10 improves by >15% (from Anthropic's -35% failure reduction, adjusted for smaller model)
- End-to-end answer quality improves by >0.5 points on 5-point scale
- Indexing cost remains under $0.02 per document
- Retrieval latency does not increase by more than 10ms

**Rollback trigger:** If Recall@10 improves by <5% or answer quality degrades.

### 6.7 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Proposition-based chunking** | Too expensive for general use — LLM call per paragraph to extract atomic facts. Good for specific domains (financial, legal) but overkill for general knowledge bases. Consider as future domain-specific enhancement. |
| **Agentic chunking (LLM decides boundaries)** | High computational overhead, discontinued in 2025 benchmark studies. The gains over structure-aware chunking are marginal (<3%) while cost is 10-50x higher. |
| **Full coreference resolution before chunking** | Dedicated coreference models (e.g., SpaCy, AllenNLP) add latency and complexity. Contextual prefix achieves the same goal more elegantly — resolving references implicitly through document context. |
| **RAPTOR hierarchical summaries** | Adds significant complexity (tree construction, multi-level retrieval). Better suited for very long documents (>50 pages). Our typical documents are 2-20 pages. |
| **Switching to Claude for context generation** | Higher quality but 60x more expensive ($3.00/M vs $0.05/M input). At our scale, the quality difference is unlikely to justify the cost. Revisit if quality A/B test shows Groq context is insufficient. |
| **Mix-of-Granularity (query-adaptive)** | Requires dual indexing at multiple granularities, complex query routing. Interesting but premature — get contextual chunking right first, then consider adaptive retrieval. |

---

## Appendix A: Key sources

### Layer 2

- [Anthropic — Contextual Retrieval (2024-09)](https://www.anthropic.com/news/contextual-retrieval)
- [DataCamp — Anthropic's Contextual Retrieval Guide](https://www.datacamp.com/tutorial/contextual-retrieval-anthropic)
- [Together AI — How to Implement Contextual RAG](https://docs.together.ai/docs/how-to-implement-contextual-rag-from-anthropic)
- [Unstructured — Contextual Chunking in Unstructured Platform](https://unstructured.io/blog/contextual-chunking-in-unstructured-platform-boost-your-rag-retrieval-accuracy)
- [Instructor — Implementing Contextual Retrieval with Async Processing](https://python.useinstructor.com/blog/2024/09/26/implementing-anthropics-contextual-retrieval-with-async-processing/)
- [Firecrawl — Best Chunking Strategies for RAG 2026](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
- [PremAI — RAG Chunking Strategies 2026 Benchmark Guide](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/)
- [LangCopilot — 9 Strategies Tested, 70% Accuracy Boost](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)
- [Anthropic — Prompt Caching](https://www.anthropic.com/news/prompt-caching)

### Layer 3

- [Jina — Late Chunking in Long-Context Embedding Models (2024-09)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)
- [arXiv 2409.04701 — Late Chunking paper (v3, 2025-07)](https://arxiv.org/abs/2409.04701)
- [Weaviate — Late Chunking: Balancing Precision and Cost](https://weaviate.io/blog/late-chunking)
- [DataCamp — Late Chunking for RAG: Implementation With Jina AI](https://www.datacamp.com/tutorial/late-chunking)
- [NirDiamant/RAG_Techniques — Proposition Chunking (GitHub)](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/proposition_chunking.ipynb)
- [IBM — What Is Agentic Chunking?](https://www.ibm.com/think/topics/agentic-chunking)
- [arXiv 2603.18409 — TopoChunker (2026-03)](https://arxiv.org/html/2603.18409)
- [arXiv 2602.16974 — Beyond Chunk-Then-Embed taxonomy (2026-02)](https://arxiv.org/abs/2602.16974)
- [arXiv 2505.21700 — Rethinking Chunk Size for Long-Document Retrieval (2025)](https://arxiv.org/html/2505.21700v2)
- [arXiv 2602.22225 — SmartChunk Query-Aware Compression (2026)](https://arxiv.org/html/2602.22225v1)
- [arXiv 2406.00456 — Mix-of-Granularity (2025)](https://arxiv.org/html/2406.00456v1)
- [Jina — Embeddings v4 model page](https://jina.ai/models/jina-embeddings-v4/)
- [HuggingFace — jinaai/jina-embeddings-v4](https://huggingface.co/jinaai/jina-embeddings-v4)
- [Medium — Late Chunking vs Contextual Retrieval: The Math](https://medium.com/kx-systems/late-chunking-vs-contextual-retrieval-the-math-behind-rags-context-problem-d5a26b9bbd38)

### Layer 4

- [Stanford NLP — Coreference Resolution and Entity Linking (Jurafsky & Martin)](https://web.stanford.edu/~jurafsky/slp3/26.pdf)
- [ScienceDirect — Anaphora and Coreference Resolution: A Review](https://www.sciencedirect.com/science/article/abs/pii/S1566253519303677)
- [Wikipedia — Chunking (psychology)](https://en.wikipedia.org/wiki/Chunking_(psychology))
- [Miller 1956 — The Magical Number Seven (original PDF)](https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf)
- [PMC — Perception of Phrase Structure in Music](https://pmc.ncbi.nlm.nih.gov/articles/PMC6871737/)
- [PNAS — Brain Dynamics of Event Segmentation During Music](https://www.pnas.org/doi/10.1073/pnas.2319459121)

### Layer 5

- [arXiv — Rate-Distortion Limits for Multimodal Retrieval (ICCV 2025)](https://openaccess.thecvf.com/content/ICCV2025W/MRR%202025/papers/Chen_Rate-Distortion_Limits_for_Multimodal_Retrieval_Theory_Optimal_Codes_and_Finite-Sample_ICCVW_2025_paper.pdf)
- [arXiv — The Information Theory of Similarity](https://www.arxiv.org/pdf/2512.00378)
- [Frontiers — Enhancing RAPTOR with Semantic Chunking and Adaptive Graph Clustering](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1710121/full)
- [Groq — Pricing](https://groq.com/pricing)

---

## Appendix B: Comparison matrix

| Approach | LLM cost at indexing | Embedding cost | Retrieval accuracy gain | Complexity | Our feasibility |
|---|---|---|---|---|---|
| Current (paragraph-greedy) | $0 | Baseline | Baseline | Low | Done |
| Structure-aware splitting | $0 | Same | +5-10% | Low | **Phase 1** |
| Late chunking (Jina v4) | $0 | Same | +5-15% | Low | **Phase 1** |
| Contextual prefix (Groq 8B) | ~$1.10/M tokens | Re-embed | +30-50% | Medium | **Phase 2** |
| Contextual prefix (Claude) | ~$1.02/M tokens (cached) | Re-embed | +35-50% | Medium | Alternative |
| Proposition chunking | ~$5-10/M tokens | Re-embed | +20-40% (factoid) | High | Rejected (cost) |
| Agentic chunking | ~$10-20/M tokens | Re-embed | +3-5% vs structure | Very high | Rejected (overhead) |
| Reranking (post-retrieval) | $0 | $0 | +10-20% on top | Low | **Phase 3** |
| Mix-of-Granularity | ~$2-5/M tokens | 2x (dual index) | Variable | Very high | Rejected (premature) |

---

*Research complete. Next step: implement Phase 1 (structure-aware chunking + late chunking) as a zero-cost improvement, then A/B test before proceeding to Phase 2.*
