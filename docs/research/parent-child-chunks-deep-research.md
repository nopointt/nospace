# Parent-Child Chunk Architecture for RAG — Deep Research
> Date: 2026-03-28 | Contexter RAG Service
> Tags: chunking, hierarchical-retrieval, parent-child, small-to-big, sentence-window, metadata-propagation

---

## Layer 1: Current State

### 1.1 Our implementation

- **What:** Flat semantic chunking. Document -> markdown -> paragraphs grouped into ~500-token chunks with 100-token overlap. No hierarchy.
- **How:** `semantic.ts` splits by paragraph boundaries (`\n\n`), accumulates paragraphs until `maxTokens` (500) exceeded, then flushes. Overlap re-includes trailing 100 tokens from previous chunk. Special handling for oversized paragraphs (force-split by token window). Alternative strategies: `row` (CSV/XLSX), `timestamp` (audio/youtube).
- **Schema:** Single `chunks` table: `id, document_id, user_id, content, chunk_index, token_count, embedding`. No parent reference. No metadata columns beyond content.
- **Retrieval:** Hybrid search (pgvector cosine + FTS via BM25), RRF fusion (k=60), query rewriting (multiple variants embedded), context assembly by score-descending token budget packing.
- **Embedding:** Jina v4, 1024 dimensions. Every chunk embedded independently. Embedding task: `retrieval.passage` for indexing.

### 1.2 Known issues

1. **Context loss on precise matches.** A 500-token chunk about "revenue Q3" matches well, but surrounding context (what product line, what comparison period, what caveat follows) is in adjacent chunks and never retrieved.
2. **Chunk boundary artifacts.** Paragraphs split mid-argument. Overlap (100 tokens) mitigates but doesn't solve — overlap tokens are re-embedded, creating near-duplicate vectors.
3. **No structural metadata.** Page numbers, section headings, sheet names from the parser are discarded during chunking. The `ChunkMetadata` type has `page?` and `sheet?` fields but `chunkSemantic()` never populates them — always `{ type: "semantic" }`.
4. **No provenance chain.** When a chunk is retrieved, the only link back is `document_id`. No way to say "this is from Section 3.2, page 14" without re-parsing.
5. **One-size embedding.** Every chunk is ~500 tokens regardless of content density. A definition needs 50 tokens; a narrative needs 2000.

### 1.3 Metrics (estimated baselines)

| Metric | Estimate | Notes |
|---|---|---|
| Retrieval recall@10 | ~70-75% | Based on flat 500-token chunks with hybrid search (industry typical) |
| Context relevance | Medium | Retrieved chunks are topically correct but often lack surrounding context |
| Storage per document | 1x chunks + 1x embeddings | Each chunk: ~500 tokens content + 1024-dim vector (4KB float32) |
| Embedding cost | 1x (all chunks embedded) | Jina v4 pricing per token |
| Latency | p50 ~200ms search | pgvector HNSW, no hierarchy traversal overhead |

---

## Layer 2: World-Class Standard

### 2.1 Industry standard: Parent-Child / Small-to-Big Retrieval

The dominant pattern in production RAG systems (2024-2026) for solving the context-loss problem:

**Core idea:** Create two tiers of chunks. Embed and search against SMALL chunks (128-256 tokens) for precision. On match, return the PARENT chunk (512-2048 tokens) for context. Search is precise; LLM context is rich.

**Why it's standard:**
- Solves the fundamental chunking paradox: small chunks embed better (higher semantic purity per vector), but large chunks provide better LLM context
- Validated across LlamaIndex, LangChain, GraphRAG, and every major RAG framework
- Anthropic's Contextual Retrieval (2024) validated the principle: enriching chunks with context reduced retrieval failures by 67%

### 2.2 Top 3 implementations

| Implementation | Approach | Key insight |
|---|---|---|
| **LlamaIndex AutoMergingRetriever** | HierarchicalNodeParser creates 3-level tree (2048/512/128 tokens). Retrieves leaf nodes; if >X% of a parent's children match, auto-merges to parent. | Adaptive — returns parent only when multiple children fire, preserving precision for single-hit queries |
| **LangChain ParentDocumentRetriever** | Two splitters: parent (1500 tokens) and child (500 tokens). Children embedded in vector store. Parents stored in separate docstore (InMemoryStore, Redis, etc). On retrieval: find children -> look up parent IDs -> return parents. | Clean separation: vector store for search, docstore for context. Simple, battle-tested. |
| **Anthropic Contextual Retrieval** | Before embedding, prepend LLM-generated context to each chunk ("This chunk is from Section X of Document Y, discussing topic Z"). Embed the enriched chunk. | Doesn't need parent-child schema at all — context is baked into the chunk. But requires LLM call per chunk at indexing time. |

### 2.3 Sentence Window Retrieval (alternative pattern)

Instead of parent-child, store individual sentences with a configurable window of surrounding sentences as metadata:

- **Index:** Each sentence gets its own embedding
- **Retrieve:** On match, expand to N sentences before + N sentences after (window size typically 3-5)
- **Advantage:** Finest-grained retrieval possible, natural boundary respect
- **Disadvantage:** Very high storage (1 embedding per sentence), window expansion is positional only (no semantic grouping)

LlamaIndex's `SentenceWindowNodeParser` implements this. Benchmarks show it performs comparably to parent-child on single-fact queries but worse on multi-hop reasoning.

### 2.4 Standard configuration (recommended defaults)

| Parameter | Recommended | Rationale |
|---|---|---|
| Parent chunk size | 1024-2048 tokens | Enough for full section/subsection context |
| Child chunk size | 128-256 tokens | High semantic purity for embedding |
| Child overlap | 0-50 tokens | Minimal — children don't need redundancy since parent provides context |
| Embedding target | Child only | Parents not embedded — saves 50%+ embedding cost |
| Merge threshold | 40-60% of children | AutoMerging: return parent if >40% of its children matched |
| Parent storage | Same table, `parent_id` column | Simpler than separate docstore for PostgreSQL-native systems |

### 2.5 Common pitfalls

1. **Embedding both parent and child** — doubles embedding cost with marginal retrieval gain (parent embeddings are diluted by multiple topics)
2. **Making children too small** (<64 tokens) — produces fragments that lack meaning even for embedding
3. **No overlap in children** when they're very small — acceptable since parent provides context anyway
4. **Ignoring metadata** — parent-child without section headings still loses structural context
5. **Flat parent_id without ordering** — must preserve child ordering within parent for correct reassembly

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2024-2026)

| Paper/Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **RAPTOR** (Sarthi et al., ICLR 2024) | 2024-01 | Recursive clustering + LLM summarization to build a tree of abstractions. Retrieves from any level. +20% accuracy on QuALITY benchmark. | Production-ready (open-source) | High for long documents — but requires LLM calls at indexing time (cost). Could be a premium tier feature. |
| **Dense-X Retrieval / Propositions** (Chen et al., EMNLP 2024) | 2024-12 | Decompose text into atomic propositions (self-contained factoids). Retrieve propositions, return parent context. +35% Recall@5 vs passage retrieval. | Research, some production | Very high — propositions are the ideal "child" unit. But requires LLM decomposition at ingest. |
| **Late Chunking** (Jina AI, 2024) | 2024-09 | Embed entire document through long-context transformer FIRST, then split into chunks. Each chunk embedding carries full-document attention context. +24.47% retrieval improvement. | Production (Jina embeddings v2+) | **Directly applicable** — we already use Jina. No schema change needed. Requires long-context model and documents < 8192 tokens. |
| **Growing Window Semantic Chunking** (ScienceDirect, 2026-01) | 2026-01 | Adaptive window that grows based on semantic similarity, addressing weak boundaries. +4% answer delivery rate. | Research | Medium — marginal improvement, high complexity. |
| **Contextual Retrieval** (Anthropic, 2024-09) | 2024-09 | LLM-generated context prepended to each chunk before embedding. -67% retrieval failures with reranking. | Production | High impact but high cost (LLM call per chunk). Alternative to parent-child that doesn't require schema changes. |
| **LeanRAG** (2025) | 2025 | Knowledge-graph-based generation with semantic aggregation and hierarchical retrieval. | Research | Low priority for Contexter's current scale. |

### 3.2 Open questions in the field

1. **Optimal child granularity:** Propositions (atomic facts) vs sentences vs 128-token chunks — no consensus. Dense-X shows propositions win on recall, but cost is 10x at ingest.
2. **Dynamic hierarchy depth:** Should the tree be 2-level (parent/child) or 3+ levels? RAPTOR says multi-level helps for long documents. LangChain says 2 levels is sufficient for most use cases.
3. **Late chunking vs parent-child:** If your embedding model supports long context, late chunking may make parent-child unnecessary. But only works for documents < model context length.
4. **Merge strategy at retrieval:** Return parent always? Only when multiple children match? Concatenate non-overlapping children? No benchmark consensus.

### 3.3 Bets worth making

1. **Late Chunking with Jina** — We already use Jina. Switching to late chunking for documents < 8K tokens is nearly free and gives +24% improvement. No schema change needed.
2. **Lightweight Contextual Retrieval** — Instead of LLM-generated context (expensive), prepend the section heading + document title to each child chunk before embedding. 80% of the benefit at 0% LLM cost.
3. **Two-tier parent-child** — The safe, proven bet. Schema change is small, retrieval improvement is well-documented, storage overhead is manageable.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Cartography / GIS** | Multi-scale map rendering — showing detail at zoom levels | Level-of-Detail (LoD) pyramids: pre-render at multiple zoom levels, serve the appropriate one based on viewport | Chunk hierarchy = LoD pyramid. Query specificity = zoom level. Specific query -> child chunk (high zoom). Broad query -> parent chunk (low zoom). |
| **Computer Vision** | Feature detection at multiple scales | Image pyramids (Gaussian/Laplacian), Feature Pyramid Networks (FPN) | FPN detects objects at different scales simultaneously. Analogous to retrieving at multiple chunk granularities and merging results. |
| **Neuroscience** | Memory consolidation — episodic (specific) vs semantic (general) | Hippocampus stores episodic details, neocortex stores generalized knowledge. Retrieval starts specific, broadens if insufficient. | Child chunks = episodic memory (specific facts). Parent chunks = semantic memory (context, narrative). Retrieval should try specific first, broaden on failure. |
| **Information Retrieval (classic)** | Passage retrieval from books | Indexes: word -> sentence -> paragraph -> section -> chapter. Standard library science hierarchy. | The parent-child pattern IS this hierarchy, digitized. Book index = embedding search. "See also" = parent reference. |
| **Signal Processing** | Multi-resolution analysis of signals | Wavelet transforms: analyze signal at multiple frequency bands simultaneously. Coarse features = low frequency, fine details = high frequency. | Chunk granularity = frequency band. Small chunks capture high-frequency details (specific facts). Large chunks capture low-frequency patterns (themes, arguments). |
| **Database Systems** | B-tree indexing with variable fan-out | Internal nodes (parent) guide search, leaf nodes (child) store data. Search traverses from root to leaf. | Parent chunks = internal B-tree nodes (routing/context). Child chunks = leaf nodes (actual content for retrieval). |

### 4.2 Biomimicry

**Foveal vision model:** Human eyes have high-resolution center (fovea) and low-resolution periphery. When something catches attention peripherally, eyes saccade to focus. Analogous to: child chunk matches (peripheral attention) -> retrieve parent for full context (foveal focus). The retrieval system should "look around" the match point, not just return the match.

### 4.3 Information theory insight

**Shannon's source coding theorem** suggests that the optimal encoding depends on the information density of the source. Dense information (definitions, data tables) should be chunked smaller. Sparse information (narrative, introduction) should be chunked larger. A uniform 500-token chunk wastes capacity on sparse sections and truncates dense sections. Parent-child architecture naturally handles this: children can vary in size based on content density while parents maintain consistent context windows.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **Embedding space:** Jina v4 maps chunks to R^1024 via learned transformer encoder
- **Similarity:** Cosine similarity (1 - cosine distance) — assumes unit-sphere distribution
- **Search:** Top-k nearest neighbors via HNSW index on pgvector
- **Fusion:** RRF (Reciprocal Rank Fusion) with k=60 to merge vector + FTS results
- **Assumptions:** (a) Each chunk's meaning is self-contained, (b) semantic similarity in embedding space correlates with relevance, (c) 500-token chunks are an appropriate granularity for all content types

### 5.2 Where assumptions break

1. **Self-contained meaning fails** when a chunk references context in adjacent chunks ("As mentioned above...", "The following table shows...", pronouns without antecedents). The embedding for such a chunk is semantically impoverished.
2. **Granularity assumption fails** when information density varies. A single sentence definition ("REST is a software architectural style for distributed systems") is a complete semantic unit at ~15 tokens. A 500-token chunk containing this sentence plus unrelated surrounding text will have a diluted embedding that may not match a query about REST.
3. **Cosine similarity fails for multi-topic chunks.** A 500-token chunk covering topics A and B will have an embedding that's roughly the centroid of A and B embeddings. It will match queries about A or B, but with lower score than a pure A-only or B-only chunk would.

### 5.3 Mathematical argument for smaller retrieval units

**Embedding purity theorem (informal):** Let chunk `c` contain topics `{t1, t2, ..., tn}`. Its embedding `e(c)` approximates `mean(e(t1), e(t2), ..., e(tn))` (empirically observed in transformer outputs). For a query about topic `t1`:

```
sim(q, e(c)) = sim(q, mean(e(t1), ..., e(tn)))
             <= sim(q, e(t1))          [equality only when n=1]
```

Smaller chunks -> fewer topics per chunk -> higher sim to relevant queries -> better recall and precision.

**The paradox:** But smaller chunks provide less context to the LLM, degrading answer quality. Parent-child resolves this by **decoupling search granularity from context granularity**.

### 5.4 Information-theoretic analysis

**Mutual information decomposition:**

Let `D` = document, `C_i` = chunk `i`, `Q` = query, `A` = correct answer.

In flat chunking: `I(C_i; A | Q)` = information the chunk provides about the answer given the query. This is bounded by the chunk's content.

In parent-child: We search on children (high `I(child; Q)` due to purity) but return parents (high `I(parent; A | Q)` due to context). The two-stage process maximizes both search precision AND answer information.

**Entropy budget:** A 500-token chunk has roughly `500 * 1.3 = 650` bits of semantic content (rough estimate at ~1.3 bits/token for natural language). Splitting into 4 children of 128 tokens each preserves the same total information but allows the retrieval system to be selective about which 128-token segment is most relevant.

### 5.5 Optimal child size from Chroma's research

Chroma's 2025 benchmarking found:
- **IoU (Intersection over Union)** varies 10x across chunking strategies — chunk configuration matters as much as embedding model selection
- **Recall peaks** at 250 tokens with 125-token overlap (for flat chunking)
- **RecursiveCharacterTextSplitter at 200 tokens, no overlap** is consistently high-performing across all metrics
- Implication for parent-child: children should be 128-256 tokens for optimal embedding-space behavior

### 5.6 Vector space geometry

In a parent-child system with child-only embedding:
- **N children** per parent means the search space is N times larger but each vector is more focused
- **HNSW index** performance scales as O(log N) for search, so doubling the number of vectors adds minimal latency (~1 additional HNSW layer traversal)
- **Storage:** Each vector is 1024 * 4 bytes = 4KB. If we go from 500-token chunks to 128-token children, we get ~4x more vectors = ~4x more vector storage. Offset: parent content stored as text only (no embedding) adds negligible overhead vs. vector storage.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Two-Tier Parent-Child with Metadata Propagation

**What:** Split each document into parent chunks (~1024 tokens) and child chunks (~200 tokens). Embed children only. On retrieval, return the parent chunk. Propagate structural metadata (section heading, page number, sheet name) into both parent and child records.

**Why:**
- Layer 2: Battle-tested in LlamaIndex and LangChain, proven in production
- Layer 3: Late chunking (Jina) can complement but doesn't replace hierarchy for docs > 8K tokens
- Layer 4: Matches multi-resolution analysis patterns (GIS, wavelets, foveal vision)
- Layer 5: Mathematically sound — decouples search precision from context richness; child purity increases cosine similarity on relevant queries

**Expected impact:**
- Retrieval recall@10: +15-25% (based on Dense-X +35% for propositions, conservative for chunk-based children)
- Context relevance: Significant improvement — LLM always gets 1024-token parent with full surrounding context
- Answer quality: +10-20% (from richer context)
- Retrieval failures: -30-49% (based on Anthropic's contextual retrieval results, since metadata-enriched children approach a similar effect)

**Cost:**
- Storage: ~4x more chunk rows (children), but parent content stored as text only (no embedding). Net: ~4x vector storage, ~5x text storage.
- Embedding cost: ~4x more embeddings (children are smaller but more numerous). Partially offset: children are shorter, so total token count is similar (just spread across more chunks).
- Implementation: ~2-3 days for schema + chunker + pipeline changes. ~1 day for retrieval path.
- Latency: Minimal increase. HNSW scales logarithmically. One additional SQL lookup (child -> parent) adds ~1-5ms.

**Risk:**
- More complex pipeline (two-stage chunking, parent-child linking)
- Re-indexing required for all existing documents
- Edge case: very short documents (< 1024 tokens) don't benefit from hierarchy

### 6.2 Implementation spec

#### Schema changes

```sql
-- Option A: Add columns to existing chunks table (RECOMMENDED — simpler)
ALTER TABLE chunks ADD COLUMN parent_id TEXT REFERENCES chunks(id);
ALTER TABLE chunks ADD COLUMN chunk_type TEXT NOT NULL DEFAULT 'flat';  -- 'parent' | 'child' | 'flat' (legacy)
ALTER TABLE chunks ADD COLUMN section_heading TEXT;
ALTER TABLE chunks ADD COLUMN page_number INTEGER;
ALTER TABLE chunks ADD COLUMN sheet_name TEXT;
ALTER TABLE chunks ADD COLUMN start_offset INTEGER;
ALTER TABLE chunks ADD COLUMN end_offset INTEGER;

CREATE INDEX chunks_parent_id_idx ON chunks(parent_id);
CREATE INDEX chunks_type_idx ON chunks(chunk_type);
```

Drizzle schema addition:

```typescript
// In schema.ts — add to chunks table definition:
parentId: text("parent_id").references(() => chunks.id),
chunkType: text("chunk_type", { enum: ["parent", "child", "flat"] }).notNull().default("flat"),
sectionHeading: text("section_heading"),
pageNumber: integer("page_number"),
sheetName: text("sheet_name"),
startOffset: integer("start_offset"),
endOffset: integer("end_offset"),
```

#### Chunking algorithm

```
Input: document markdown text, parse metadata (page boundaries, section headings)

Step 1: PARENT CHUNKING
  - Split by section boundaries (## headings) first
  - If section > 1024 tokens, split at paragraph boundaries to stay <= 1024
  - If section < 256 tokens, merge with next section
  - Each parent gets: content, section_heading, page_number, start/end offset

Step 2: CHILD CHUNKING
  - For each parent chunk:
    - Split into children of ~200 tokens at sentence boundaries
    - Each child inherits parent's metadata (section_heading, page_number, sheet_name)
    - Each child gets: parent_id, content, child_index_within_parent
  - No overlap between children (parent provides context)

Step 3: METADATA ENRICHMENT (lightweight contextual retrieval)
  - Prepend to each child's content before embedding:
    "[Document: {doc_name}] [Section: {section_heading}] [Page: {page_number}]\n"
  - This is the child's "enriched content" for embedding
  - Store original content separately (for display) or strip prefix at retrieval time
```

#### Embedding strategy

```
- Embed: CHILDREN ONLY (enriched content with metadata prefix)
- Do NOT embed parents (saves ~50% embedding cost vs embedding both)
- Parents stored as text only — retrieved by ID lookup, no vector search needed
```

#### Retrieval algorithm change

```
Current:  query -> embed -> vector search -> top-k chunks -> build context -> LLM
Proposed: query -> embed -> vector search children -> top-k children
          -> for each child: SELECT parent WHERE id = child.parent_id
          -> deduplicate parents (multiple children may share a parent)
          -> rank parents by max child score
          -> build context from parents (not children) -> LLM

SQL for parent lookup:
  SELECT DISTINCT p.id, p.content, p.section_heading, p.page_number,
         MAX(c.score) as best_child_score
  FROM (search results as c)
  JOIN chunks p ON p.id = c.parent_id
  GROUP BY p.id, p.content, p.section_heading, p.page_number
  ORDER BY best_child_score DESC
```

#### Migration strategy for existing documents

```
1. Add new columns (nullable, with defaults) — zero downtime
2. New documents get parent-child chunking automatically
3. Background job re-chunks existing documents:
   - Read markdown from documents table
   - Re-run chunker with parent-child strategy
   - Insert new parent + child rows
   - Delete old flat rows
4. Retrieval code handles both: if chunk.parent_id exists, fetch parent; otherwise return chunk directly
```

#### Configuration defaults

```typescript
const PARENT_CHILD_CONFIG = {
  parentMaxTokens: 1024,     // Max tokens per parent chunk
  parentMinTokens: 256,      // Merge small sections
  childMaxTokens: 200,       // Max tokens per child chunk
  childMinTokens: 50,        // Don't create tiny children
  metadataPrefix: true,      // Prepend doc/section info to children before embedding
  embedParents: false,       // Only embed children
  mergeThreshold: 0.4,       // (future) AutoMerge: return parent if >40% children match
}
```

### 6.3 Metadata propagation spec

Metadata flows from parser -> chunker -> database -> retrieval -> context:

```
Parser output:
  - page_boundaries: [{offset: N, page: M}, ...]      (from PDF/DOCX parser)
  - section_headings: [{offset: N, heading: "...", level: 1-6}, ...]  (from markdown)
  - sheet_names: [{sheet: "Sheet1", startOffset: N}, ...]  (from XLSX/ODS)

Chunker enrichment:
  For each parent chunk at [startOffset, endOffset]:
    - page_number = last page_boundary where offset <= startOffset
    - section_heading = last heading where offset <= startOffset
    - sheet_name = sheet containing this offset range
  For each child:
    - Inherit parent's metadata (section_heading, page_number, sheet_name)

Database storage:
  chunks.section_heading, chunks.page_number, chunks.sheet_name

Retrieval output:
  Each source in the RAG answer includes:
    { chunkId, documentId, content, score, sectionHeading, pageNumber, sheetName }

Context assembly:
  "[Source 1 — Page 14, Section 3.2: Revenue Analysis]
   {parent chunk content}"
```

### 6.4 Validation plan

| Test | Method | Success criteria |
|---|---|---|
| Retrieval recall improvement | Compare recall@10 on test query set: flat vs parent-child | >= +15% recall |
| Context relevance | Manual evaluation: does the returned parent provide sufficient context? | 90%+ of retrieved parents contain the answer's supporting context |
| Answer quality | Side-by-side: same queries, flat chunking vs parent-child | Qualitative improvement in answer completeness and accuracy |
| Metadata accuracy | Spot-check: do page numbers / section headings match the original document? | 95%+ accuracy |
| Latency regression | Benchmark search latency with 4x more vectors | < +20ms p50 increase |
| Storage growth | Measure DB size before/after migration | < 5x growth (acceptable) |
| Backward compatibility | Old documents (flat chunks) still retrievable during migration | 100% backward compat |

### 6.5 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **RAPTOR (recursive tree with LLM summarization)** | Requires LLM call per cluster at indexing time. High cost for Contexter's volume. Complexity of tree construction. Revisit as premium tier. |
| **Dense-X Propositions as children** | Requires LLM decomposition per paragraph. +35% recall but 10x indexing cost. Revisit when cheap fast models (Haiku-class) available at scale. |
| **Sentence Window Retrieval** | Too many embeddings (1 per sentence = 10-20x current). Storage explosion. Parent-child achieves similar benefits with 4x, not 20x. |
| **Late Chunking only (no hierarchy)** | Only works for documents < 8K tokens (Jina v2 context limit). Most Contexter documents are longer. Good complement but not replacement. |
| **Anthropic Contextual Retrieval** | LLM call per chunk at indexing time. Contexter is self-hosted / API-budget-constrained. The lightweight version (metadata prefix) captures 80% of the benefit. |
| **Separate parent table** | More complex schema, more JOINs, harder migration. Single table with `parent_id` self-reference is cleaner for PostgreSQL. |
| **Embed both parent and child** | 2x embedding cost. Parent embeddings are semantically diluted (multiple topics per parent). Research consensus: child-only embedding is optimal. |
| **3-level hierarchy (grandparent/parent/child)** | Complexity not justified for Contexter's document types. 2-level is sufficient for documents up to ~50 pages. Revisit for book-length documents. |

### 6.6 Future enhancements (post-MVP)

1. **Late Chunking integration** — For documents < 8K tokens, use Jina late chunking for children instead of independent embedding. Requires Jina API support for chunked pooling.
2. **AutoMerge at retrieval** — If >40% of a parent's children match, boost that parent's score. Requires tracking child count per parent.
3. **Adaptive child size** — Use semantic similarity between sentences to determine child boundaries (semantic chunking at child level). Currently: fixed 200-token children at sentence boundaries.
4. **Proposition decomposition** — For premium users, decompose children into atomic propositions using a fast LLM. Store propositions as grandchildren.
5. **Cross-document parent linking** — When the same section heading appears across multiple documents (e.g., "Methodology"), create a virtual parent that groups them.

---

## Sources

### Layer 2 — Industry Standard
- [LlamaIndex: Small-to-Big Retrieval (Sophia Yang)](https://medium.com/data-science/advanced-rag-01-small-to-big-retrieval-172181b396d4)
- [LlamaIndex HierarchicalNodeParser API](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/hierarchical/)
- [LlamaIndex AutoMergingRetriever Docs](https://developers.llamaindex.ai/python/examples/retrievers/auto_merging_retriever/)
- [LlamaIndex Recursive Retriever + Node References](https://docs.llamaindex.ai/en/stable/examples/retrievers/recursive_retriever_nodes/)
- [LangChain ParentDocumentRetriever](https://python.langchain.com/docs/how_to/parent_document_retriever/)
- [LangChain ParentDocumentRetriever API](https://api.python.langchain.com/en/latest/retrievers/langchain.retrievers.parent_document_retriever.ParentDocumentRetriever.html)
- [LangChain's ParentDocumentRetriever Revisited (Omri Levy, TDS)](https://towardsdatascience.com/langchains-parent-document-retriever-revisited-1fca8791f5a0/)
- [Parent-Child Chunking in LangChain (Seahorse)](https://medium.com/@seahorse.technologies.sl/parent-child-chunking-in-langchain-for-advanced-rag-e7c37171995a)
- [MongoDB: Parent Document Retrieval with LangChain](https://www.mongodb.com/docs/atlas/ai-integrations/langchain/parent-document-retrieval/)
- [Parent-Child Retriever in GraphRAG](https://graphrag.com/reference/graphrag/parent-child-retriever/)

### Layer 3 — Frontier Innovation
- [RAPTOR: Recursive Abstractive Processing (Sarthi et al., ICLR 2024)](https://arxiv.org/abs/2401.18059)
- [Dense X Retrieval: Propositions as Retrieval Unit (EMNLP 2024)](https://arxiv.org/pdf/2312.06648)
- [Late Chunking in Long-Context Embedding Models (Jina AI, 2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)
- [Late Chunking paper (arXiv)](https://arxiv.org/pdf/2409.04701)
- [Late Chunking: Balancing Precision and Cost (Weaviate)](https://weaviate.io/blog/late-chunking)
- [Anthropic Contextual Retrieval — 67% reduction in retrieval failures](https://www.maginative.com/article/anthropics-contextual-retrieval-technique-enhances-rag-accuracy-by-67/)
- [Growing Window Semantic Chunking (ScienceDirect, 2026)](https://www.sciencedirect.com/science/article/pii/S0950705125019343)
- [LeanRAG: Hierarchical Retrieval (2025)](https://arxiv.org/html/2508.10391v1)

### Layer 4 — Metadata Propagation
- [Metadata-Aware Chunking for Production RAG (Medium)](https://medium.com/@asimsultan2/metadata-aware-chunking-the-secret-to-production-ready-rag-pipelines-85bc25b12350)
- [How to Use Metadata in RAG (Unstructured)](https://unstructured.io/insights/how-to-use-metadata-in-rag-for-better-contextual-results)
- [Azure RAG Chunk Enrichment Phase](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-enrichment-phase)
- [Associating Metadata with Document Chunks](https://apxml.com/courses/getting-started-rag/chapter-3-data-preparation-for-rag/chunk-metadata)

### Layer 5 — Benchmarks
- [Chroma Research: Evaluating Chunking Strategies](https://research.trychroma.com/evaluating-chunking)
- [Best Chunking Strategies for RAG in 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
- [RAG Chunking Strategies: 2026 Benchmark Guide (PremAI)](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/)
- [Chunk Twice Embed Once: Chemistry-Aware RAG (2025)](https://arxiv.org/html/2506.17277v1)
- [Document Chunking for RAG: 9 Strategies Tested (LangCopilot, 2025)](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)
- [Chunking Strategies for RAG (Weaviate)](https://weaviate.io/blog/chunking-strategies-for-rag)
- [RAGBench: Explainable Benchmark (2024)](https://arxiv.org/abs/2407.11005)
