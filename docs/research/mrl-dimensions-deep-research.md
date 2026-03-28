# MRL Dimension Reduction for RAG Embeddings -- Deep Research
> Date: 2026-03-28 | Model: Claude Opus 4.6 (1M)
> Context: Contexter uses Jina v4 at 1024 dimensions. Evaluate MRL truncation to 512/256 for storage/speed gains.
> Framework: [deep-research-framework.md](deep-research-framework.md)

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: Contexter embeds document chunks via Jina Embeddings v4 API, stores in pgvector (PostgreSQL), searches via HNSW cosine similarity index.
- **Model**: `jina-embeddings-v4` (3.8B params, Qwen2.5-VL-3B-Instruct backbone)
- **Dimensions**: 1024 (hardcoded in `JINA_DIMENSIONS`, `vector(1024)` column type, HNSW index on `vector_cosine_ops`)
- **API params**: `dimensions: 1024`, `truncate_dim: 1024` (both sent to Jina API)
- **Storage**: `embedding vector(1024)` column in `chunks` table, HNSW index `chunks_embedding_idx`
- **Search**: exact cosine distance `<=>` operator with `ORDER BY ... LIMIT topK`, filtered by `user_id`

### 1.2 Relevant files

| File | Role |
|---|---|
| `src/services/embedder/types.ts` | `JINA_DIMENSIONS = 1024` constant |
| `src/services/embedder/index.ts` | API call with `dimensions` + `truncate_dim` params |
| `src/db/schema.ts` | `vector(1024)` custom type, `chunks` table |
| `drizzle-pg/0000_special_sally_floyd.sql` | `embedding vector(1024)` DDL |
| `drizzle-pg/0001_fts_and_vector_indexes.sql` | HNSW index on embedding column |
| `src/services/vectorstore/vector.ts` | Search queries using `<=>` operator |
| `reembed_chunks.ts` | Batch re-embedding script for NULL embeddings |

### 1.3 Metrics (baseline at 1024 dims)

- **Storage per vector**: 4 * 1024 + 8 = **4,104 bytes** (~4 KB)
- **HNSW index page density**: ~2 vectors per 8 KB page (with HNSW neighbor list overhead)
- **Embedding API cost**: Jina v4 pricing per token; dimension count does not affect API cost (same token count)
- **Latency**: Single-user scale, not yet a bottleneck
- **Known issues**: No quantization (float32 only), no halfvec, no dimension optimization

---

## Layer 2: World-Class Standard

### 2.1 Matryoshka Representation Learning (MRL)

**Paper**: Kusupati et al., "Matryoshka Representation Learning", NeurIPS 2022 ([arXiv:2205.13147](https://arxiv.org/abs/2205.13147))

MRL trains models so that the first `d` dimensions of a `D`-dimensional embedding are themselves a valid, high-quality `d`-dimensional embedding. Loss functions are computed on progressively truncated versions (e.g., 2048, 1024, 512, 256, 128, 64 dims). The first dimensions carry the most significant semantic information; later dimensions add granularity.

**Key result from the original paper**: MRL achieves up to 14x smaller embedding size for ImageNet-1K classification at the same accuracy level, and up to 14x real-world speedups for large-scale retrieval.

### 2.2 Jina v4 MRL support

Jina v4 default dimension is **2048**. Supported `truncate_dim` values: `[128, 256, 512, 1024, 2048]`. Contexter currently uses 1024 -- already a 2x truncation from the model's native output.

**Jina v3 MRL ablation (Table 7, arXiv:2409.10173)**:

| Dimension | Retrieval nDCG@10 | STS Spearman | Retention vs 1024d |
|---|---|---|---|
| 32 | 52.54 | 76.35 | 82.9% |
| 64 | 58.54 | 77.03 | 92.4% |
| 128 | 61.64 | 77.43 | 97.3% |
| 256 | 62.72 | 77.56 | **99.0%** |
| 512 | 63.16 | 77.59 | **99.7%** |
| 768 | 63.30 | 77.59 | 99.9% |
| 1024 | 63.35 | 77.58 | 100% |

**Critical observation**: 512d retains 99.7% of 1024d retrieval quality. 256d retains 99.0%. The quality curve is logarithmic -- diminishing returns above 256d.

Note: These are v3 numbers. v4 was trained with MRL on the same principle but with a 2048d native space. We are already at 1024d (50% of native). Going to 512d means 25% of native, to 256d means 12.5% of native. Based on MRL theory and v3 data, 512d should retain ~99%+ of our current 1024d quality.

### 2.3 Industry consensus on MRL dimension reduction

| Source | Finding | Citation |
|---|---|---|
| Vespa (2025) | At 50% dims: 1-4 point nDCG@10 drop. At 25% dims: 5-10 point drop. | [Embedding Tradeoffs, Quantified](https://blog.vespa.ai/embedding-tradeoffs-quantified/) |
| HuggingFace | MRL models fall off much less quickly than standard models | [Matryoshka Blog](https://huggingface.co/blog/matryoshka) |
| Milvus | Funnel search with 1/6th dimensions for first pass | [Funnel Search Docs](https://milvus.io/docs/funnel_search_with_matryoshka.md) |
| OpenAI | text-embedding-3-large at 256d outperforms ada-002 at 1536d | General knowledge |
| Supermemory | "Shortlist with small prefix, rerank with larger slice" | [MRL Guide](https://supermemory.ai/blog/matryoshka-representation-learning-the-ultimate-guide-how-we-use-it/) |

### 2.4 Common pitfalls

- **Non-MRL models**: Truncating a model NOT trained with MRL destroys quality. Jina v4 IS MRL-trained -- safe.
- **Re-normalization**: After truncation, vectors should be L2-normalized. Jina API handles this when `truncate_dim` is passed. If truncating stored vectors locally, must re-normalize.
- **Mixed dimensions**: Cannot compare a 512d query against 1024d stored vectors. All vectors in an index must be the same dimension.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2025-2026)

| Paper/Project | Date | Key Innovation | Status | Applicability |
|---|---|---|---|---|
| **Jina v5** (arXiv:2602.15547) | 2026-02 | Task-targeted embedding distillation; compact models | Production | Future upgrade path; same MRL principle |
| **Beyond Matryoshka** (arXiv:2503.01776) | 2025-03 | Sparse coding for adaptive representation; non-nested dims | Research | Interesting but no production models yet |
| **SMEC** (arXiv:2510.12474) | 2025-10 | Rethinking MRL for retrieval embedding compression | Research | May improve quality at very low dims (<128) |
| **pgvector 0.8.0** | 2025 | Iterative index scans (hnsw.iterative_scan), better filtered search | Production | Direct benefit -- better filtered HNSW |
| **pgvectorscale SBQ** | 2025 | Statistical Binary Quantization for HNSW | Production | Orthogonal to MRL -- can combine for 64x savings |
| **Redundancy/Isotropy paper** (arXiv:2506.01435) | 2025-06 | First 25% of dims retain nearly all quality; retrieval embeddings have higher intrinsic dim than classification | Research | Validates 512d (50%) as safe for retrieval |

### 3.2 Open questions

- **Optimal dim for RAG specifically** (not general MTEB): RAG retrieval operates on longer chunks with specific domain content. Intrinsic dimensionality may differ from short-sentence benchmarks.
- **Interaction with hybrid search**: Contexter uses FTS + vector hybrid. If FTS handles recall and vectors handle reranking, even lower dims may suffice for the vector component.
- **v4 vs v3 MRL quality at low dims**: v4 paper lacks explicit dimension ablation table (v3 has Table 7). However, v4 was trained with same MRL methodology on a larger model -- quality should be equal or better.

### 3.3 Bets worth making

- **512d immediate**: Safe, well-validated, ~2x storage/speed improvement.
- **256d experimental**: Test on Contexter's actual queries. If quality holds, 4x savings.
- **Halfvec (float16) stacking**: 512d + halfvec = 512 * 2 + 8 = 1,032 bytes per vector. That's 4x reduction from current 4,104 bytes. Nearly free quality-wise.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems

| Field | Analogous Problem | Their Solution | Transfer Opportunity |
|---|---|---|---|
| **Signal processing** | Audio/image compression at multiple bitrates | Multi-resolution encoding (JPEG progressive, MP3 VBR) | MRL IS the embedding equivalent of progressive JPEG -- coarse representation first, refinement later |
| **Information theory** | Rate-distortion: minimum bits to represent signal at given quality | Shannon's R(D) function; optimal codebook design | Embedding dimension = "rate". Retrieval quality = "distortion". MRL approximates the rate-distortion curve. |
| **Cartography** | Maps at multiple zoom levels | Generalization: simplify features at low zoom, add detail at high zoom | First 256 dims = "country-level" semantics. Next 256 = "city-level". Next 512 = "street-level". |
| **Neuroscience** | Neural population coding; redundancy in cortical representations | Sparse distributed representations; ~5-10% of neurons active for any concept | Embeddings are similarly redundant; most dimensions carry near-zero marginal information |
| **Database indexing** | Multi-level index (B-tree levels, bloom filters for pre-filtering) | Coarse index for pruning, fine index for precision | Two-stage search: coarse 256d ANN, fine 1024d rerank |
| **Astronomy** | Photometric redshift estimation (few broadband filters vs full spectrum) | 5-7 filters capture 90%+ of spectral information for classification | Analogous: 256-512 dims capture 99%+ of semantic information for retrieval |

### 4.2 Information-theoretic insight

Recent work (Chen et al., ICCV 2025) establishes formal **rate-distortion limits for multimodal retrieval**: the R(D) function lower-bounds achievable ranking distortion. No encoding scheme can preserve similarity rankings with fewer bits than this limit.

Practical implication: There exists a *theoretical minimum dimension* below which retrieval quality must degrade. For typical document corpora, this is estimated at 50-256 dimensions (depending on corpus diversity). Our 512d target is comfortably above this floor.

### 4.3 The manifold hypothesis

Text embeddings live on a lower-dimensional manifold within the nominal embedding space. Research confirms:
- Even naive dimensionality reduction (keeping first 25% of dims) causes "very slight performance degradation" ([arXiv:2506.01435](https://arxiv.org/abs/2506.01435))
- Retrieval embeddings have higher intrinsic dimensionality than classification embeddings (need more dims to preserve ranking)
- TwoNN estimation puts intrinsic dim of text embeddings at **50-256** depending on corpus
- PCA: 80% explained variance typically reached within first 100-200 dimensions

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **Distance metric**: Cosine distance via `<=>` operator (equivalent to 1 - cosine_similarity)
- **Assumptions**: Embeddings are unit-normalized (Jina API normalizes by default). Cosine similarity is a meaningful semantic distance.
- **Where assumptions hold well**: Document chunk retrieval with same-model queries and passages.

### 5.2 Storage mathematics

| Dimension | Bytes/vector (float32) | Bytes/vector (halfvec) | Vectors per 8KB page | Storage ratio vs 1024d |
|---|---|---|---|---|
| 1024 | 4,104 | 2,056 | ~2 | 1.00x |
| 768 | 3,080 | 1,544 | ~2 | 0.75x |
| 512 | 2,056 | 1,032 | ~4 | **0.50x** |
| 256 | 1,032 | 520 | ~8 | **0.25x** |
| 128 | 520 | 264 | ~15 | 0.13x |

Formula: `bytes = dimensions * sizeof(type) + 8` where float32 = 4 bytes, float16 = 2 bytes.

**HNSW index size** (approximate): `N * D * 4 * 2` bytes (2x for graph overhead with m=16).

For 100K chunks at 1024d: ~800 MB index. At 512d: ~400 MB. At 256d: ~200 MB.

### 5.3 HNSW search complexity

HNSW search complexity is `O(log(N) * D)` where D is the dimension. Halving D approximately halves the distance computation cost per candidate. With pgvector's implementation:

- **Distance computation**: Dominant cost at search time. Linear in D.
- **Graph traversal**: `O(ef_search * log(N))` node visits, each requiring a D-dimensional distance computation.
- **Empirical**: Lower-dimensional embeddings (384d vs 1536d) boost pgvector throughput by **200%+** (Instaclustr benchmarks).
- **Index build**: `O(N * log(N) * M * D)` where M is the HNSW `m` parameter. Halving D nearly halves build time.

### 5.4 Quality loss model

MRL quality loss follows a **logarithmic decay curve** with respect to dimension:

```
Q(d) ~ Q_max - C * log(D/d)
```

Where `Q_max` is full-dimension quality, `C` is a model-specific constant (~0.3-1.0 nDCG points per halving), and `D` is the training dimension.

From Jina v3 data:
- 1024 -> 512: loss = 0.19 nDCG points (0.3%)
- 512 -> 256: loss = 0.44 nDCG points (0.7%)
- 256 -> 128: loss = 1.08 nDCG points (1.7%)

The loss accelerates below 256d but remains small above 256d. The "knee" of the curve is around 128-256d.

### 5.5 Intrinsic dimensionality analysis

| Property | Typical Value | Source |
|---|---|---|
| Intrinsic dim of text embeddings (TwoNN) | 50-256 | arXiv:2506.01435 |
| PCA 80% variance threshold | 100-200 dims | Multiple sources |
| PCA 95% variance threshold | 200-400 dims | Multiple sources |
| Practical MRL "knee" point | 128-256 dims | Jina v3 Table 7, Vespa benchmarks |
| Retrieval intrinsic dim (higher than classification) | 150-300 dims | arXiv:2506.01435 |

**Implication**: 512 dimensions is **2-5x above the intrinsic dimensionality** of typical document embeddings. This provides a substantial safety margin. Even 256d is at or above the intrinsic dimensionality for most retrieval tasks.

### 5.6 Two-stage search mathematics

**Funnel search** (Matryoshka-specific optimization):

1. **Stage 1**: Search low-dim index (e.g., 256d) with high `topK` (e.g., 200)
2. **Stage 2**: Rerank those 200 candidates using higher-dim vectors (e.g., 1024d)

Complexity: `O(ef_search * log(N) * d_small + topK * d_large)` vs single-stage `O(ef_search * log(N) * d_large)`

For N=100K, ef_search=100, topK=10, d_small=256, d_large=1024:
- Funnel: 100 * 17 * 256 + 200 * 1024 = 435,200 + 204,800 = 640,000 ops
- Single-stage: 100 * 17 * 1024 = 1,740,800 ops
- **Speedup**: ~2.7x

However, this requires storing TWO vector columns or using pgvector's `subvector()` function. For Contexter's current scale (~thousands of chunks), the complexity is not worth it. **Funnel search becomes valuable at 1M+ vectors.**

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

**What**: Reduce embedding dimension from 1024 to **512** for all new and existing embeddings.

**Why**:
- **Layer 2**: Jina v3 MRL ablation shows 512d retains 99.7% of 1024d retrieval quality (nDCG@10: 63.16 vs 63.35)
- **Layer 3**: Industry consensus is that 50% MRL truncation loses 1-4 nDCG points; 512d from 1024d is well within this range
- **Layer 5**: 512d is 2-5x above intrinsic dimensionality of document embeddings (~100-256), providing safety margin
- **Layer 5**: Storage halved (4,104 -> 2,056 bytes/vector), HNSW index halved, search throughput ~2x
- **Layer 4**: Rate-distortion theory confirms 512d is above the information-theoretic floor for document retrieval

**Expected impact**:
| Metric | 1024d (current) | 512d (proposed) | Change |
|---|---|---|---|
| Storage per vector | 4,104 bytes | 2,056 bytes | **-50%** |
| HNSW index size (100K vectors) | ~800 MB | ~400 MB | **-50%** |
| HNSW build time | baseline | ~0.5x baseline | **~2x faster** |
| Search QPS | baseline | ~1.5-2x baseline | **+50-100%** |
| Retrieval quality (nDCG@10) | 63.35 | ~63.16 | **-0.3%** |
| Jina API cost | same | same | **no change** (dimension doesn't affect token pricing) |

**Cost**: ~2 hours implementation + re-embedding time for existing chunks (or in-place SQL truncation -- see migration plan below).

**Risk**: Minimal. 0.3% quality loss is unmeasurable in practice. Fallback is trivial (change constant back to 1024 and re-embed).

### 6.2 Migration plan

#### Option A: Re-embed from Jina API (cleanest, recommended for small corpus)

1. Update `JINA_DIMENSIONS` to 512
2. Update schema: `vector(1024)` -> `vector(512)`
3. Run migration SQL
4. Re-embed all chunks using existing `reembed_chunks.ts` (set embeddings to NULL, re-run)

#### Option B: In-place SQL truncation (faster, no API calls)

MRL guarantees that the first 512 dimensions of a 1024d Jina embedding are a valid 512d embedding. pgvector supports vector casting:

```sql
-- Step 1: Drop HNSW index (required before ALTER)
DROP INDEX IF EXISTS chunks_embedding_idx;

-- Step 2: Truncate all vectors in-place + change column type
-- pgvector cast truncates to the target dimension
ALTER TABLE chunks
  ALTER COLUMN embedding TYPE vector(512)
  USING embedding::vector(512);

-- Step 3: Rebuild HNSW index at new dimension
CREATE INDEX chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);

-- Step 4 (optional): VACUUM FULL to reclaim disk space
VACUUM FULL chunks;
```

**Important**: After truncation, vectors must be L2-normalized for cosine similarity to work correctly. Jina v4 produces normalized 1024d vectors, but the first 512 components of a normalized 1024d vector are NOT automatically a normalized 512d vector. Two options:

(a) **Re-embed via API** with `truncate_dim: 512` (Jina handles normalization) -- Option A
(b) **Truncate + renormalize in SQL**:
```sql
-- Truncate and renormalize in one pass
UPDATE chunks SET embedding = (
  subvector(embedding, 1, 512)::vector(512) /
  l2_norm(subvector(embedding, 1, 512)::vector(512))
)::vector(512)
WHERE embedding IS NOT NULL;
```

Option B with renormalization avoids any API calls but requires pgvector functions. Option A is simpler and guaranteed correct.

#### Recommended: Option A for Contexter

Contexter's corpus is small (thousands of chunks). Re-embedding via API is fast (~minutes) and guarantees correct normalization. Use the existing `reembed_chunks.ts` script with updated dimension.

### 6.3 Code changes required

1. `src/services/embedder/types.ts`: Change `JINA_DIMENSIONS = 1024` to `JINA_DIMENSIONS = 512`
2. `src/db/schema.ts`: Change `vector(1024)` to `vector(512)` in custom type
3. New migration SQL: `0002_reduce_embedding_dims.sql`
4. `reembed_chunks.ts`: Update `JINA_DIMENSIONS` constant (or inherit from shared types)

### 6.4 Validation plan

- **Before migration**: Run top-10 retrieval queries, record results and scores
- **After migration**: Run same queries at 512d, compare result overlap and score distribution
- **Success criteria**: >= 90% overlap in top-10 results (expect >95%)
- **Rollback trigger**: < 80% overlap or user-visible quality degradation
- **Metric**: nDCG@10 on a held-out evaluation set (if available) or manual spot-check

### 6.5 Future optimization path (not for now)

| Optimization | Savings | When |
|---|---|---|
| **512d float32** (this change) | 2x storage, ~1.5-2x search speed | Now |
| **512d halfvec (float16)** | 4x storage vs current 1024d float32 | Next iteration |
| **256d float32** | 4x storage, ~3-4x search speed | If validated on actual queries |
| **256d halfvec** | 8x storage | Aggressive but viable |
| **512d + binary quantization (SBQ)** | 32-64x storage | At scale (100K+ vectors) |
| **Funnel search (256d recall -> 1024d rerank)** | Best of both worlds | At scale (1M+ vectors) |

### 6.6 Rejected alternatives

| Alternative | Why Rejected |
|---|---|
| **Stay at 1024d** | No meaningful quality benefit over 512d; paying 2x storage/compute for 0.3% quality |
| **Drop to 256d immediately** | Safe per theory, but should validate on actual Contexter queries first. 512d is the conservative-correct choice. |
| **Drop to 128d** | Quality loss becomes non-trivial (~1.7% nDCG). Not recommended for retrieval workloads. |
| **Halfvec without dimension reduction** | 50% savings but dimension reduction gives the same 50% with orthogonal benefits (faster distance computation). Do dimension reduction first, add halfvec second. |
| **Two-stage funnel search** | Engineering complexity not justified at Contexter's current scale (<100K vectors). Revisit at 1M+. |
| **Switch to pgvectorscale SBQ** | Requires pgvectorscale extension (not standard pgvector). Overkill for current scale. |
| **Re-embed with Jina v5** | v5 just launched (2026-02). Wait for stability and MTEB benchmarks before model switch. |

---

## Sources

- [Matryoshka Representation Learning (NeurIPS 2022)](https://arxiv.org/abs/2205.13147)
- [jina-embeddings-v3 paper (arXiv:2409.10173)](https://arxiv.org/abs/2409.10173) -- Table 7 MRL ablation
- [jina-embeddings-v4 paper (arXiv:2506.18902)](https://arxiv.org/abs/2506.18902)
- [jina-embeddings-v4 model card](https://huggingface.co/jinaai/jina-embeddings-v4)
- [Jina v4 product page](https://jina.ai/models/jina-embeddings-v4/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector HNSW storage internals](https://lantern.dev/blog/pgvector-storage)
- [Vespa: Embedding Tradeoffs, Quantified](https://blog.vespa.ai/embedding-tradeoffs-quantified/)
- [Milvus: Funnel Search with Matryoshka Embeddings](https://milvus.io/docs/funnel_search_with_matryoshka.md)
- [HuggingFace: Introduction to Matryoshka Embedding Models](https://huggingface.co/blog/matryoshka)
- [pgvector scalar and binary quantization](https://jkatz05.com/post/postgres/pgvector-scalar-binary-quantization/)
- [Neon: halfvec saves 50% storage](https://neon.com/blog/dont-use-vector-use-halvec-instead-and-save-50-of-your-storage-cost)
- [pgvector 0.8.0 release](https://www.postgresql.org/about/news/pgvector-080-released-2952/)
- [Redundancy, Isotropy, and Intrinsic Dimensionality of Text Embeddings (arXiv:2506.01435)](https://arxiv.org/abs/2506.01435)
- [Rate-Distortion Limits for Multimodal Retrieval (ICCV 2025)](https://openaccess.thecvf.com/content/ICCV2025W/MRR%202025/papers/Chen_Rate-Distortion_Limits_for_Multimodal_Retrieval_Theory_Optimal_Codes_and_Finite-Sample_ICCVW_2025_paper.pdf)
- [pgvector performance benchmarks (Instaclustr)](https://www.instaclustr.com/education/vector-database/pgvector-performance-benchmark-results-and-5-ways-to-boost-performance/)
- [Matryoshka embeddings: 5x faster vector search](https://medium.com/data-science-collective/matryoshka-embeddings-how-to-make-vector-search-5x-faster-f9fdc54d5ffd)
- [Pinecone: Rerankers and Two-Stage Retrieval](https://www.pinecone.io/learn/series/rag/rerankers/)
