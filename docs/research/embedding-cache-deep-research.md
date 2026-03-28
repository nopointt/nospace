# Embedding Caching for RAG Systems -- Deep Research
> Date: 2026-03-28 | Author: Axis (Orchestrator)
> Context: Contexter embeds every chunk fresh via Jina v4 API (1024 dims). No deduplication. Redis available (ioredis, Redis 7).
> Framework: [deep-research-framework.md](deep-research-framework.md)

---

## Layer 1: Current State

### 1.1 Our implementation

**What:** `EmbedderService` (`src/services/embedder/index.ts`) wraps Jina v4 API. Two call paths:
1. **Ingest pipeline** (`pipeline.ts`): `embedBatch(chunks.map(c => c.content))` with `task: "retrieval.passage"` (default). Called on every upload -- no dedup check.
2. **Query path** (`rag/index.ts`): `embedBatch(queryVariants, { task: "retrieval.query" })`. Query rewriting produces 2-4 variants per user query. Each variant is embedded fresh every time.

**How:** Direct HTTP POST to `https://api.jina.ai/v1/embeddings`. Model: `jina-embeddings-v4`, 1024 dimensions (truncate_dim). Max batch: 64. Concurrency: 3 parallel sub-batches. Retry: 3x on 429/5xx with exponential backoff (1s, 2s, 4s).

**Critical detail -- task-dependent embeddings:** Jina v4 uses task-specific LoRA adapters (60M params each). The same text embedded with `retrieval.passage` vs `retrieval.query` produces **different vectors**. This means the cache key MUST include the task parameter.

**Performance:**
- Ingest embed latency: 2-10s for typical document (50-200 chunks)
- Query embed latency: 200-800ms for 2-4 query variants
- No caching at any level -- every call hits Jina API

**Known issues:**
1. **Zero dedup.** Upload same PDF twice -> embeds all chunks twice. Same content across different documents -> embedded independently.
2. **Zero query cache.** Identical query "What is X?" asked 100 times -> 100 API calls (times query rewrite multiplier = 200-400 actual embedding calls).
3. **No cost tracking.** `totalTokens` is returned but not logged or accumulated anywhere.
4. **Retry-on-resume re-embeds.** `resumePipelineFromStage` re-embeds even if embed stage succeeded before failure happened in index stage.

### 1.2 Metrics (baseline -- estimated)

| Metric | Value | Notes |
|---|---|---|
| Embed cost per chunk | ~0 (Jina v4 free tier) | 100K TPM limit, research license |
| Embed cost per chunk (v3 paid) | ~$0.02/1M tokens | OpenAI text-embedding-3-small equivalent |
| Ingest latency (embed stage) | 2-10s per document | Network-bound, 3 concurrent sub-batches |
| Query embed latency | 200-800ms per query | 2-4 variants x 1 API call each |
| API calls per day (est.) | 50-500 | Early stage, low traffic |
| Duplicate chunk ratio (est.) | 10-30% | Re-uploads, shared boilerplate, headers/footers |
| Query duplicate ratio (est.) | 20-40% | Common questions across users |
| Rate limit headroom | 100 RPM / 100K TPM | Free tier, shared across all Jina APIs |

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Content-hash embedding cache** is the established pattern (2024-2026):
- Algorithm: SHA-256 hash of (normalized_text + model_id + task + dimensions) -> lookup in cache -> hit = return cached vector, miss = call API + store
- Why standard: trivial to implement, deterministic, zero false positives, 10-40% API cost reduction on typical workloads
- Who uses it: LangChain (CacheBackedEmbeddings), LlamaIndex (embedding cache), RedisVL (EmbeddingsCache), every production RAG system at scale

**Semantic query cache** is the second standard pattern:
- Algorithm: embed query -> vector search in cache -> if similarity > threshold (0.90-0.95) -> return cached result
- More complex, requires tuning threshold, risk of false positives
- Who uses it: GPTCache, Redis Semantic Cache, LangChain RedisSemanticCache

### 2.2 Top 3 implementations

| Product/Paper | Approach | Result | Key insight |
|---|---|---|---|
| **RedisVL EmbeddingsCache** | Hash-based key (text+model), Redis Hash storage, optional TTL | Sub-ms lookup, batch `mset`/`mget` operations | Separate cache from vector DB. Cache = dedup layer, vector DB = retrieval layer |
| **LangChain CacheBackedEmbeddings** | Content hash -> any key-value store (Redis, local, etc.) | Transparent wrapper around any embedder | Decorator pattern: wraps existing embedder, zero code change in pipeline |
| **Cache-Craft (SIGMOD 2025)** | Chunk-level KV-cache reuse for LLM inference, hash-based chunk identity | 51% reduction in redundant compute, 1.6x throughput, 2x latency reduction | 75% of retrieved chunks in production are reprocessed -- the waste is massive |

### 2.3 Standard configuration

**Recommended defaults:**
- Cache key: `emb:{model}:{task}:{dims}:{sha256(normalized_text)}`
- Storage: Redis Hash (more memory-efficient than String for vector + metadata)
- TTL: 7-30 days for passage embeddings (content rarely changes), 1-24h for query embeddings (queries are ephemeral)
- Eviction: `allkeys-lru` at Redis level as safety net, TTL as primary expiration
- Normalization: strip leading/trailing whitespace, normalize unicode (NFC), collapse multiple spaces

**Common pitfalls:**
1. Forgetting task parameter in cache key (Jina v4 `retrieval.passage` != `retrieval.query` for same text)
2. Not normalizing text before hashing (whitespace differences = cache miss)
3. Caching before chunking instead of after (chunk boundary changes invalidate everything)
4. No model version in key (model upgrade silently serves stale embeddings)
5. Storing float64 vectors when float32 suffices (2x memory waste)

**Migration path from current state:**
- Effort: ~2-3 days implementation + testing
- Wrap `EmbedderService` with `CachedEmbedderService` (decorator pattern)
- Redis is already in the stack (ioredis, Redis 7)
- Zero changes to pipeline.ts, rag/index.ts, or any consumer code

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2025-2026)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **Cache-Craft** (SIGMOD 2025) | 2025-02 | KV-cache reuse at LLM inference level, chunk hash identity | Production-ready (published at top DB venue) | Directly applicable -- same chunk-hash principle for embedding cache |
| **SemHash** (MinishLab) | 2025 | model2vec + vicinity for fast semantic dedup at dataset scale | Open-source, production | Useful for ingestion-time semantic dedup (near-duplicate detection) |
| **NVIDIA NeMo SemDeDup** | 2024-2025 | Cluster embeddings, pairwise cosine within clusters, threshold-based dedup | Open-source (NeMo Curator) | Heavy for our scale, but algorithm is instructive |
| **CacheClip** (arxiv 2510.10129) | 2025-10 | KV cache reuse across RAG retrievals with attention-aware clipping | Research | Future optimization for LLM answer generation, not embedding |
| **RAGCache** (arxiv 2404.12457) | 2024-04 | Intermediate knowledge cache between retrieval and generation | Research/prototype | 80% retrieval latency reduction, but targets LLM KV cache not embedding |

### 3.2 Open questions in the field

1. **Optimal cache granularity for embeddings:** Should we cache at chunk level (our current plan), sentence level, or token level? Chunk-level is standard but misses sub-chunk dedup.
2. **Cross-model cache transfer:** When upgrading from Jina v4 to v5 (or switching models), can we use cached embeddings to warm-start fine-tuning of a mapping function? Active research area.
3. **Adaptive TTL:** Can cache hit rate history drive dynamic TTL adjustment? Frequently-hit entries get longer TTL, rarely-hit entries expire faster. No production implementation found.

### 3.3 Bets worth making

1. **Content-hash cache (NOW):** Zero risk, immediate payoff. This is not a bet -- it's table stakes.
2. **Semantic dedup at ingest (NEXT):** After hash cache is in place, add cosine similarity check against existing embeddings during ingest. Threshold 0.98+ = skip embedding + reuse existing vector. Reduces index bloat.
3. **Query embedding warm cache on deploy (FUTURE):** Pre-populate query cache with top-100 most common queries on service restart. Eliminates cold-start latency spike.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Web caching (HTTP)** | Avoid re-fetching identical resources | ETag (content hash) + If-None-Match header | Exact same pattern: content hash = ETag, cache lookup = conditional GET. We're implementing HTTP caching semantics for embeddings. |
| **Build systems (Make, Bazel)** | Avoid re-compiling unchanged source files | Content-addressable storage: hash inputs -> if hash matches -> skip build step | Same principle. Our "build" = embedding, our "source" = chunk text, our "artifact" = vector. Content-addressable embedding store. |
| **DNS caching** | Avoid repeated lookups for same domain | TTL-based cache with hierarchical invalidation | TTL model maps perfectly to embedding cache. Short TTL for volatile data (queries), long TTL for stable data (document chunks). |
| **Genomics (BLAST)** | Avoid re-aligning identical sequences against database | Sequence hash + cached alignment results | k-mer hashing for approximate matching is analogous to our semantic dedup via embedding similarity |
| **CDN edge caching** | Reduce origin server load for popular content | LRU eviction + TTL + cache warming for popular items | Query embedding cache should prioritize popular queries (LFU > LRU for query pattern) |

### 4.2 Biomimicry / Nature-inspired

**Hippocampal pattern separation and completion (neuroscience):** The hippocampus uses sparse coding to store memories efficiently -- similar inputs activate overlapping but distinct neural patterns. When a partial cue arrives, pattern completion retrieves the full memory. This maps to our problem: semantic dedup = pattern separation (are these chunks too similar?), query cache = pattern completion (this query is close enough to a cached one).

### 4.3 Engineering disciplines

- **Signal processing:** Locality-sensitive hashing (LSH) = the signal processing approach to approximate nearest neighbor search. For semantic dedup, LSH can replace brute-force pairwise cosine at scale. Not needed at our current scale (<100K chunks) but relevant if we grow 100x.
- **Information theory:** The embedding is a lossy compression of the text. Caching the embedding avoids re-running this compression. The information content of the cache key (SHA-256 of text) is sufficient to uniquely identify the input -- no information loss in the cache lookup.
- **Control systems:** Cache hit rate is the controlled variable. TTL and max cache size are the control inputs. A PID controller could theoretically adjust TTL based on hit rate deviation from target (e.g., 70% hit rate target). Overkill for now, but interesting for adaptive caching.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

**Embedding function:** `f: (text, task, model) -> R^1024` where `f` is Jina v4's transformer + LoRA adapter.

**Properties we rely on:**
- Determinism: `f(t, task, model) = f(t, task, model)` for identical inputs (same text, same task, same model version). This is the foundation of hash-based caching.
- Asymmetry: `f(t, "retrieval.passage", model) != f(t, "retrieval.query", model)` -- different LoRA adapters produce different vectors. Cache key must include task.
- Semantic smoothness: similar texts produce similar embeddings (cosine similarity correlates with semantic similarity). This enables semantic dedup.

**Assumptions:**
1. Jina API is deterministic for identical inputs (true for inference, not training)
2. Model version doesn't change silently behind the API (mostly true -- Jina versions explicitly)
3. Text normalization is sufficient to canonicalize inputs (mostly true, edge cases with unicode)

**Where assumptions break:**
- If Jina silently updates model weights (unlikely but possible during "free research" phase)
- Unicode normalization edge cases: "cafe\u0301" vs "caf\u00e9" (NFC normalization handles this)
- Floating point non-determinism across different hardware (Jina runs on their infra, so consistent)

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| **SimHash** | Information retrieval | O(1) approximate similarity via random hyperplane projections | O(d) per hash | Charikar 2002 |
| **MinHash** | Set similarity | Jaccard similarity estimation for near-duplicate detection at token/ngram level | O(k) per document | Broder 1997 |
| **LSH (Locality-Sensitive Hashing)** | Nearest neighbor search | Sublinear approximate nearest neighbor search for semantic dedup | O(L * k) | Indyk & Motwani 1998 |
| **Product Quantization** | Compressed vector storage | 4-64x compression of embedding vectors in cache | O(d * K) | Jegou et al. 2011 |

### 5.3 Optimization opportunities

**Current bottleneck:** Network latency to Jina API (100-400ms per request) dominates. Cache eliminates this entirely for hits.

**Better objective function:** Minimize `total_embedding_cost = API_calls * cost_per_call + cache_memory * cost_per_byte`. Currently we minimize nothing (everything calls API). The cache introduces a memory-cost tradeoff.

**Approximation tricks:**
- **Float32 -> Float16 in cache:** 1024 dims * 2 bytes = 2KB instead of 4KB. Cosine similarity between float32 and float16 versions of same embedding: >0.9999. Negligible quality loss, 50% memory savings.
- **Product quantization in cache:** 1024 dims with 8 sub-quantizers, 256 centroids each = 8 bytes per vector instead of 4096. ~96% compression. But reconstruction adds latency and introduces quantization error. Not worth it at our scale.

### 5.4 Information-theoretic analysis

**Cache key entropy:** SHA-256 produces 256-bit hash. Our chunk texts average 200-800 tokens (~1000-4000 chars). Shannon entropy of English text is ~1.0-1.5 bits/char, so typical chunk has 1000-6000 bits of entropy. SHA-256 at 256 bits is a massive compression but collision probability is 2^-128 for any two distinct inputs -- effectively zero.

**Information preserved in cache lookup:** The hash preserves exact identity (is this the same text?) but discards all semantic information. This is intentional -- we use exact matching for the cache, semantic matching for retrieval.

**Embedding information content:** A 1024-dim float32 vector stores 32,768 bits. The text it represents may have 1000-6000 bits of semantic entropy. The embedding is therefore an overcomplete representation -- this is by design (higher dims = better separation in vector space).

### 5.5 Linear algebra / geometry insights

**Vector space structure:** Jina v4 embeddings live in R^1024. Cosine similarity is the standard metric (matching pgvector HNSW index configuration).

**Dimensionality:** Jina v4 natively produces higher-dimensional embeddings truncated to 1024 via Matryoshka representation learning. The intrinsic dimensionality of the embedding manifold is likely much lower (50-200 dims based on typical transformer embedding studies). This means:
- Many cached vectors are partially redundant (they share a low-rank subspace)
- Semantic dedup with cosine > 0.98 is effective because truly distinct documents are well-separated in this space

**Clustering:** For semantic dedup, document embeddings typically form natural clusters by topic. Within-cluster cosine similarity is 0.7-0.9, cross-cluster is 0.1-0.5. Near-duplicates (cosine > 0.98) are almost always actual duplicates or trivial reformulations.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Two-tier embedding cache

**What:** Implement a two-tier caching strategy:

**Tier 1 -- Content-hash cache (PRIORITY 1, implement immediately):**
- SHA-256 hash of `normalized_text + model + task + dimensions` -> cached embedding vector
- Storage: Redis Hash
- Covers both ingest (passage) and query (query) paths
- Expected impact: 10-40% API call reduction on ingest, 20-40% on query path

**Tier 2 -- Semantic dedup at ingest (PRIORITY 2, implement after Tier 1):**
- After embedding a chunk, check cosine similarity against existing embeddings for the same user
- If similarity > 0.98 -> flag as near-duplicate, optionally skip indexing
- Not a cache -- a quality improvement that reduces index bloat

**Why (supported by Layers 1-5):**
- Layer 1: Zero caching today, every call hits API, duplicate re-uploads are common
- Layer 2: Industry standard, proven pattern (RedisVL, LangChain, every production RAG)
- Layer 3: Cache-Craft (SIGMOD 2025) validates chunk-hash as the right granularity
- Layer 4: Exact analogy to HTTP ETag caching and build system content-addressable storage
- Layer 5: SHA-256 collision probability is 2^-128, deterministic embedding function guarantees correctness

**Expected impact:**
- 15-35% reduction in Jina API calls (depends on upload patterns and query repetition)
- 50-80% reduction in query embedding latency for cached queries (Redis < 1ms vs Jina 200-400ms)
- Near-zero risk of serving incorrect results (exact hash match = exact same input)

**Cost:**
- Implementation: 2-3 days
- Redis memory: ~5KB per cached embedding (4KB vector + ~1KB overhead/metadata)
- 100K cached embeddings = ~500MB Redis memory (well within 4GB server RAM with other services)

**Risk:**
- Redis memory pressure if cache grows unbounded -> mitigate with TTL + maxmemory-policy
- Model version change invalidates all cached embeddings -> mitigate with model version in key
- Text normalization edge cases -> mitigate with NFC unicode normalization + whitespace strip

### 6.2 Implementation spec (brief)

#### Redis key format

```
emb:v1:{model}:{task}:{dims}:{sha256}
```

**Concrete example:**
```
emb:v1:jina-embeddings-v4:retrieval.passage:1024:a3f2b8c9d4e5...
```

**Key components:**
| Segment | Purpose | Example |
|---|---|---|
| `emb` | Namespace prefix, avoids collision with other Redis keys | `emb` |
| `v1` | Cache schema version (bump on breaking format change) | `v1` |
| `{model}` | Model identifier | `jina-embeddings-v4` |
| `{task}` | Jina task parameter (CRITICAL: different task = different embedding) | `retrieval.passage` or `retrieval.query` |
| `{dims}` | Truncation dimensions | `1024` |
| `{sha256}` | SHA-256 hex digest of NFC-normalized, whitespace-stripped text | `a3f2b8c9...` (64 hex chars) |

**Total key length:** ~110-120 bytes. Well within Redis limits.

#### Redis value format

Store as Redis Hash (HSET) for memory efficiency and metadata co-location:

| Field | Type | Size | Description |
|---|---|---|---|
| `v` | Buffer (float32 array serialized) | 4096 bytes | The embedding vector (1024 * 4 bytes) |
| `t` | Integer | 4 bytes | Token count returned by Jina |
| `ts` | Integer | 8 bytes | Unix timestamp of creation (for debugging/monitoring) |

Total value size: ~4.1KB per entry.

#### TTL values

| Cache type | TTL | Rationale |
|---|---|---|
| Passage embeddings (ingest) | 30 days (2,592,000s) | Document content is stable. Re-uploads of same content should always hit cache. 30 days covers most re-processing scenarios. |
| Query embeddings | 4 hours (14,400s) | Queries are ephemeral but repeat within sessions. 4h covers a typical work session. Short enough to prevent unbounded growth. |

#### Redis memory budget

| Scenario | Cached entries | Memory | Notes |
|---|---|---|---|
| Current (small) | 10K passages + 5K queries | ~75MB | Comfortable within Redis allocation |
| Medium (100 users) | 100K passages + 50K queries | ~750MB | Needs monitoring, may need maxmemory config |
| Large (1000 users) | 1M passages + 500K queries | ~7.5GB | Exceeds 4GB server RAM. Requires maxmemory-policy eviction or dedicated Redis instance. |

**Recommendation:** Set `maxmemory` for Redis to 1GB with `allkeys-lru` eviction policy as safety net. TTL handles normal expiration; LRU catches edge cases where TTL isn't enough.

#### Algorithm (pseudocode)

```
function cachedEmbed(texts: string[], task: string): EmbeddingResult[]
  results = new Array(texts.length)
  uncachedIndexes = []

  // Phase 1: Batch cache lookup
  for i, text in texts:
    key = buildCacheKey(normalize(text), model, task, dims)
    cached = redis.hgetall(key)
    if cached:
      results[i] = deserialize(cached)
      redis.expire(key, ttl)  // refresh TTL on hit
    else:
      uncachedIndexes.push(i)

  // Phase 2: Batch embed uncached texts
  if uncachedIndexes.length > 0:
    uncachedTexts = uncachedIndexes.map(i => texts[i])
    freshEmbeddings = jina.embedBatch(uncachedTexts, task)

    // Phase 3: Batch cache store
    pipeline = redis.pipeline()
    for j, idx in uncachedIndexes:
      key = buildCacheKey(normalize(texts[idx]), model, task, dims)
      pipeline.hset(key, serialize(freshEmbeddings[j]))
      pipeline.expire(key, ttl)
      results[idx] = freshEmbeddings[j]
    pipeline.exec()

  return results

function buildCacheKey(normalizedText, model, task, dims):
  hash = sha256(normalizedText)
  return `emb:v1:${model}:${task}:${dims}:${hash}`

function normalize(text):
  return text.normalize("NFC").trim().replace(/\s+/g, " ")
```

**Key design decisions:**
1. **Batch lookup + batch store:** Use Redis pipeline for all cache operations to minimize round-trips
2. **TTL refresh on hit:** Frequently-accessed embeddings stay in cache longer (pseudo-LRU behavior)
3. **Graceful degradation:** If Redis is down, fall through to API call (fail-open, like existing rate limit code)
4. **Decorator pattern:** `CachedEmbedderService` wraps `EmbedderService` -- zero changes to consumers

#### Embedding versioning strategy (model change)

When model changes (e.g., Jina v4 -> v5):

1. **Model name is in the key.** Old entries (`emb:v1:jina-embeddings-v4:...`) automatically become dead cache entries that expire via TTL. New entries (`emb:v1:jina-embeddings-v5:...`) populate naturally.
2. **No manual invalidation needed.** The 30-day TTL on passage embeddings means old cache drains within a month.
3. **Force flush if needed:** `redis-cli --scan --pattern "emb:v1:jina-embeddings-v4:*" | xargs redis-cli del` for immediate cleanup.
4. **Schema version (`v1`):** If we change the value format (e.g., add a field to the Hash), bump to `v2`. Old `v1` keys expire naturally.

#### Cache hit rate estimation

| Scenario | Estimated hit rate | Reasoning |
|---|---|---|
| **Ingest (first upload)** | 0-5% | New content, almost nothing cached |
| **Ingest (re-upload same doc)** | 90-100% | All chunks identical, all cache hits |
| **Ingest (updated doc, minor changes)** | 60-80% | Most chunks unchanged, some new/modified |
| **Ingest (shared boilerplate across docs)** | 5-15% | Headers, footers, legal text, common sections |
| **Query (first query)** | 0% | Nothing cached |
| **Query (repeated exact query)** | 100% | Exact hash match |
| **Query (popular query patterns)** | 20-40% | Same questions asked by different users |
| **Overall weighted estimate** | 15-35% | Conservative, depends heavily on usage patterns |

#### Expected API cost savings

**Current state (Jina v4 free tier):**
- Direct API cost: $0 (research license, free)
- Real cost: rate limit pressure (100K TPM shared across all Jina APIs)
- Caching value: reduces rate limit consumption by 15-35%, extends effective capacity

**If migrating to paid Jina v3 or OpenAI:**
- At $0.02/1M tokens (OpenAI text-embedding-3-small equivalent)
- 100K chunks/month * avg 300 tokens/chunk = 30M tokens/month = $0.60/month
- 15-35% savings = $0.09-$0.21/month
- At 1M chunks/month: $6/month, savings $0.90-$2.10/month
- At 10M chunks/month: $60/month, savings $9-$21/month

**The real value is not dollar savings at current scale -- it's:**
1. Latency reduction (Redis < 1ms vs Jina 200-400ms) -- 200-400x faster for cache hits
2. Rate limit relief (critical on free tier)
3. Reliability improvement (cached embeddings work even if Jina API is down)
4. Re-processing efficiency (retry/re-upload flows hit cache instead of re-embedding)

### 6.3 Validation plan

**How to measure improvement:**
1. Add cache hit/miss counters: `emb_cache_hits`, `emb_cache_misses` (logged per request)
2. Track `cache_hit_rate = hits / (hits + misses)` over rolling 24h window
3. Measure embed stage latency before/after (p50, p95)
4. Monitor Redis memory usage: `redis-cli info memory`

**Minimum success criteria:**
- Cache hit rate > 10% within first week of production traffic
- Embed stage p95 latency reduced by > 30% for query path
- Zero cache-related errors (graceful degradation working)
- Redis memory < 500MB after 30 days

**Rollback trigger:**
- Cache-related errors > 1% of requests -> disable cache, fall through to API
- Redis memory > 1GB -> reduce TTL, increase eviction aggression
- Embedding quality regression detected (cosine similarity between cached and fresh embeddings for same text < 0.9999) -> invalidate cache, investigate model change

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Semantic query cache (return cached RAG answers for similar queries)** | Different problem. Useful but higher complexity, false positive risk, requires careful threshold tuning. Implement AFTER embedding cache. |
| **Local embedding model (self-hosted Jina v4)** | Jina v4 requires GPU. Our Hetzner CAX11 is ARM CPU only. Self-hosting would require a GPU instance ($30-100/mo) which exceeds the API cost savings. Not viable at current scale. |
| **PostgreSQL-based cache (store embeddings in PG instead of Redis)** | PG is already our vector store. Adding a cache table to PG defeats the purpose -- PG lookup is 1-10ms vs Redis < 1ms. Also adds write amplification to PG which is already the bottleneck. |
| **In-memory cache (Map in Bun process)** | Lost on restart. No sharing across potential future worker processes. Redis is already in the stack and persistent. |
| **Float16 storage in cache** | 50% memory savings but adds serialization complexity. At current scale (<100K entries, <500MB), not worth the complexity. Revisit if we hit memory pressure. |
| **Product quantization in cache** | 96% compression but introduces quantization error and reconstruction latency. Appropriate for billion-scale systems, overkill for us. |
| **Bloom filter pre-check** | Bloom filter to avoid Redis lookup on definite misses. Adds complexity, saves ~0.1ms per miss. Not worth it until we have >1M cached entries. |

---

## Appendix A: Redis configuration recommendations

```conf
# Add to Redis configuration
maxmemory 1gb
maxmemory-policy allkeys-lru

# Monitor with:
# redis-cli info memory
# redis-cli info stats | grep keyspace
# redis-cli --scan --pattern "emb:*" | wc -l
```

## Appendix B: Key research sources

- [Cache-Craft: Managing Chunk-Caches for Efficient RAG (SIGMOD 2025)](https://arxiv.org/abs/2502.15734) -- chunk-hash identity, 75% re-processing waste in production
- [RedisVL EmbeddingsCache documentation](https://redis.io/docs/latest/develop/ai/redisvl/user_guide/embeddings_cache/) -- reference implementation
- [RAG at Scale (Redis blog, 2026)](https://redis.io/blog/rag-at-scale/) -- production patterns
- [RAG Caching Strategies (APXML)](https://apxml.com/courses/optimizing-rag-for-production/chapter-4-end-to-end-rag-performance/caching-strategies-rag) -- embedding + LLM response caching
- [The Economics of RAG (TheDataGuy, 2025)](https://thedataguy.pro/blog/2025/07/the-economics-of-rag-cost-optimization-for-production-systems/) -- cost allocation metrics
- [Embedding Infrastructure at Scale (Introl, 2025)](https://introl.com/blog/embedding-infrastructure-scale-vector-generation-production-guide-2025) -- 30-50% query cache hit rate in production
- [Zero-Waste Agentic RAG (TDS)](https://towardsdatascience.com/zero-waste-agentic-rag-designing-caching-architectures-to-minimize-latency-and-llm-costs-at-scale/) -- caching architecture patterns
- [SemHash (MinishLab)](https://github.com/MinishLab/semhash) -- fast semantic deduplication
- [NVIDIA NeMo SemDeDup](https://docs.nvidia.com/nemo-framework/user-guide/latest/datacuration/semdedup.html) -- clustering-based semantic dedup
- [Jina Embeddings v4 (Jina AI)](https://jina.ai/news/jina-embeddings-v4-universal-embeddings-for-multimodal-multilingual-retrieval/) -- task-specific LoRA, asymmetric retrieval
- [Cache Eviction Strategies (Redis blog)](https://redis.io/blog/cache-eviction-strategies/) -- LRU vs LFU vs TTL
- [Beyond Prompt Caching: 5 More Things to Cache in RAG (n1n.ai, 2026)](https://explore.n1n.ai/blog/beyond-prompt-caching-rag-pipeline-optimization-2026-03-21) -- comprehensive RAG caching taxonomy
- [Mastering Embedding Versioning (SparkCo)](https://sparkco.ai/blog/mastering-embedding-versioning-best-practices-future-trends) -- model migration strategies
- [Different Embedding Models, Different Spaces (Medium)](https://medium.com/data-science-collective/different-embedding-models-different-spaces-the-hidden-cost-of-model-upgrades-899db24ad233) -- why model version in cache key matters
