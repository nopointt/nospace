# Vector Database Pricing Comparison for Contexter RAG
> Research date: 2026-03-25
> Context: Contexter production at 10K users scale
> Current: CF Vectorize (1024 dims, cosine)

---

## Workload Parameters

| Parameter | Value |
|---|---|
| Vectors (initial) | 300K (10K users x 30 docs x 10 chunks) |
| Vectors (target) | 3M (growth) |
| Dimensions | 1024 (Jina v4) |
| Queries/month | 450K (15K/day) |
| Hybrid search | Required (vector + full-text) |
| User isolation | Filter by userId on every query |
| Metadata filtering | MUST work reliably |

---

## Current: Cloudflare Vectorize

**Pricing model:** Per-dimension (stored + queried)
- Stored: $0.05 per 100M dimensions/month
- Queried: $0.01 per 1M dimensions/month
- Included (Workers Paid): 30M queried dims + 5M stored dims/month

**Current usage (from contexter-about):**
- 307M dims stored
- 1.38B queried dims/month

**Cost calculation (current):**
- Stored: (307M - 5M) / 100M x $0.05 = $0.15/mo
- Queried: (1,380M - 30M) / 1M x $0.01 = $13.50/mo
- **Total: ~$13.65/mo** (extremely cheap)

**At 3M vectors x 1024 dims:**
- Stored dims: 3,072M
- Queried dims (15K queries/day x 30 days): 15K x 30 x (3M + 1) x 1024... wait

Correction -- queried dims = (vectors_in_index + queries) x dims per query:
Actually, queried vector dimensions = number_of_vectors_queried_against x dimensions. Each query scans the full index.
- Per query: 3M vectors x 1024 dims = 3,072M dims per query
- 450K queries/month: 450K x 3,072M = way too much...

Actually re-reading CF docs: "queried vector dimensions" = total vectors in queried indexes x dimensions. If you query an index with 3M vectors of 1024 dims, each query = 3M x 1024 = 3.072B dims.
- Monthly: 450K queries x 3.072B = 1,382,400B = 1.38T dims
- Cost: (1.38T - 30M) / 1M x $0.01 = ~$13,824/mo <-- this can't be right

Let me re-check. The CF docs example: "10,000 vectors with 384-dimensions, 100 queries = (10,000 + 100) x 384 = 3,878,400 queried dims." So it's (vectors + queries) x dims, not vectors x queries x dims.

So at 3M vectors, 450K queries/month:
- Queried dims: (3,000,000 + 450,000) x 1024 = 3,533,M = 3,533,000,000 = 3.533B
- Cost: (3,533M - 30M) / 1M x $0.01 = $35.03/mo

**Stored dims:** 3M x 1024 = 3,072M = 3.072B
- Cost: (3,072M - 5M) / 100M x $0.05 = $1.53/mo

**CF Vectorize at 3M vectors: ~$36.56/mo**

**Issues:**
- Metadata filtering bugs (known, current blocker)
- No native full-text/BM25 (using D1 FTS5 separately)
- Vendor lock-in to CF ecosystem
- Limited index management

---

## MANAGED/CLOUD OPTIONS

### 1. Qdrant Cloud

**Pricing model:** Resource-based (vCPU + RAM + storage)
- Free tier: 1GB RAM, 4GB disk (~100K vectors)
- Standard: Pay-as-you-go by resource
- Mid-range cluster (8GB RAM, 2 vCPU): $150-200/mo

**At 3M vectors x 1024 dims:**
- RAM needed: 3M x 1024 x 4 bytes x 1.5 = ~17.2GB (without quantization)
- With scalar quantization: ~4-5GB RAM
- Estimated cluster: 16-32GB RAM node
- **Estimated cost: $150-250/mo** (Standard tier, no quantization)
- **With quantization: ~$80-120/mo** (smaller cluster)

**Pros:** Best metadata filtering, hybrid search (BM25 via Fastembed), excellent performance, battle-tested
**Cons:** Resource-based pricing = pay for capacity not usage

### 2. Pinecone Serverless

**Pricing model:** Read Units + Write Units + Storage
- Storage: $0.33/GB/mo
- Read units: $8.25/1M RUs (Standard)
- Write units: $2/1M WUs (Standard)
- Minimum: $50/mo (Standard)

**At 3M vectors x 1024 dims:**
- Storage: 3M x 1024 x 4 bytes = ~12.3GB = $4.06/mo
- Metadata overhead: ~50% = ~18GB total = $5.94/mo
- Read units per query: ~3 RUs (for 12GB namespace) -- sublinear scaling
- Monthly reads: 450K queries x 3 RU = 1.35M RU = $11.14/mo
- With metadata filtering: 5-10x = 6.75M-13.5M RU = $55-111/mo
- **Estimated cost: $70-130/mo** (metadata filtering is expensive)

**Pros:** Fully managed, automatic scaling, good ecosystem
**Cons:** Metadata filtering multiplies read costs, closed-source, vendor lock-in, no self-host option

### 3. Weaviate Cloud (Shared)

**Pricing model:** Vector dimensions stored + storage + backups
- Shared Cloud (Standard SLA): $0.095/1M vector dims stored/mo
- Minimum: $25/mo (Flex) or $45/mo (some tiers)

**At 3M vectors x 1024 dims:**
- Vector dims: 3M x 1024 = 3.072B dims
- Cost: 3,072M x $0.095/1M = $291.84/mo (!!!)
- Plus storage and backup costs
- **Estimated cost: $300-350/mo**

**Pros:** Native hybrid search (BM25 + vector), excellent metadata filtering, multi-tenancy support
**Cons:** Expensive at scale, complex pricing

### 4. Zilliz Cloud (Milvus)

**Pricing model:** Compute Units (vCUs) + Storage
- Serverless: $4/1M vCUs
- Free: 5GB storage, 2.5M vCUs/mo
- Storage: $0.04/GB/mo

**At 3M vectors x 1024 dims:**
- Storage: ~12GB = $0.48/mo
- Write (one-time ingest 3M): ~2.25M vCUs = $9
- Read queries: 3M vectors, 450K queries ~ 6.75M vCUs/mo = $27/mo
- **Estimated cost: $30-50/mo** (serverless)

**Pros:** Milvus-compatible, good hybrid search, tiered storage, competitive pricing
**Cons:** Newer serverless tier, smaller community than Qdrant/Pinecone

### 5. Turbopuffer

**Pricing model:** Per-vector storage + per-query
- Storage: $1/mo per 1M vectors
- Queries: $4/1M queries
- Minimum: $64/mo

**At 3M vectors x 1024 dims:**
- Storage: 3M vectors = $3/mo
- Queries: 450K/mo = $1.80/mo
- **Minimum applies: $64/mo**

**Pros:** Cheapest at very large scale (100M+ vectors), built-in hybrid search (BM25), metadata filtering, object-storage-first (very cost efficient), used by Cursor and Notion
**Cons:** $64 minimum means overpaying at 3M vectors, newer company, less ecosystem

### 6. Upstash Vector

**Pricing model:** Pay-per-request + storage
- Free: 10K daily queries, 1GB storage
- Pay-as-you-go: $0.4/100K requests + $0.25/GB storage
- Fixed: $60/mo
- Max dimensions: 3072 (pay-as-you-go), 5376 (pro)

**At 3M vectors x 1024 dims:**
- Storage: ~12GB = $3/mo
- Queries: 450K/mo = $1.80/mo (pay-as-you-go)
- **Estimated cost: $5-10/mo** (pay-as-you-go) or $60/mo (fixed)

**Pros:** Serverless, edge-friendly, integrates with CF Workers, very cheap at low scale
**Cons:** Less mature for large datasets, no native BM25/hybrid search, limited ecosystem, less battle-tested at scale

---

## SELF-HOSTED OPTIONS

### VPS Baseline (Hetzner)
| Plan | vCPU | RAM | Disk | Price |
|---|---|---|---|---|
| CX32 | 8 | 16GB | 160GB | ~$16/mo |
| CX42 | 16 | 32GB | 320GB | ~$24/mo |
| CX52 | 16 | 32GB | 320GB | ~$32/mo |
| CCX33 | 8 dedicated | 32GB | 240GB | ~$55/mo |
| CCX43 | 16 dedicated | 64GB | 480GB | ~$100/mo |

### 1. Qdrant (self-hosted)

**RAM for 3M x 1024:**
- Without quantization: 3M x 1024 x 4 x 1.5 = ~17.2GB
- With scalar quantization: ~4.3GB
- With binary quantization: ~1.1GB
- Disk for data: ~15-20GB

**Minimum VPS:** 32GB RAM (no quantization) or 8GB RAM (with SQ)
- **Hetzner cost: $24-55/mo** (CX42 or CCX33)
- With quantization: $16/mo (CX32)

**Pros:** Best self-hosted option, single Docker binary, excellent docs, REST+gRPC API, Prometheus metrics, snapshot backups, native hybrid search
**Cons:** Need to manage backups, updates, monitoring

### 2. Weaviate (self-hosted)

**RAM for 3M x 1024:**
- Without quantization: ~18GB (6GB per 1M vectors)
- With PQ: ~6GB
- Disk: ~20GB

**Minimum VPS:** 32GB RAM or 16GB with quantization
- **Hetzner cost: $24-55/mo**

**Pros:** Native hybrid search (BM25 + vector), multi-tenancy, GraphQL API
**Cons:** Heavier than Qdrant (Java-based), more complex to operate, higher base RAM usage

### 3. pgvector (PostgreSQL extension)

**RAM for 3M x 1024:**
- HNSW index: ~17-20GB (needs to fit in RAM for performance)
- IVFFlat: ~8-12GB (more memory-efficient, slightly slower)
- With quantization (pgvector 0.8+): ~6-8GB

**Minimum VPS:** 32GB RAM recommended for HNSW
- **Hetzner cost: $24-55/mo**

**Hybrid search:** YES -- combine with tsvector/tsquery for full-text, or pg_textsearch for BM25
**Performance:** 471 QPS at 99% recall on 50M vectors (pgvectorscale benchmarks)

**Pros:** Single database for everything (metadata + vectors + full-text), no new infra, PostgreSQL ecosystem (backups, monitoring, tooling), hybrid search via tsvector+pgvector or pg_textsearch, mature and battle-tested
**Cons:** Not purpose-built for vectors, HNSW index build is slow, need PostgreSQL expertise

### 4. ChromaDB

**RAM for 3M x 1024:**
- Formula: RAM_GB / 0.245 = max millions of vectors
- Need: 3M / 0.245 = ~12.2GB minimum
- Practical: 16-24GB to avoid swapping

**Minimum VPS:** 16-32GB RAM
- **Hetzner cost: $16-24/mo**

**Pros:** Simple API, Python-native, easy to get started
**Cons:** NOT production-ready for 3M+ vectors (memory-bound, no horizontal scaling, designed for single-node, performance degrades rapidly when exceeding RAM), no native BM25, limited metadata filtering

### 5. LanceDB (embedded)

**RAM requirements:** Minimal -- data lives on disk/object storage
- Uses memory-mapped files
- Can run with 2-4GB RAM for 3M vectors
- Storage: ~15-20GB on disk

**Minimum VPS:** 8GB RAM is sufficient
- **Hetzner cost: $8-16/mo** (cheapest self-hosted option)

**Pros:** Zero infrastructure (embedded), file-based (can use S3), minimal RAM, columnar format (efficient), hybrid search support
**Cons:** Cloud offering still in beta, smaller community, less mature than Qdrant/pgvector, limited production references at scale

---

## COMPARISON TABLE (sorted by monthly cost at 3M vectors x 1024 dims, 450K queries/mo)

| # | Solution | Type | Monthly Cost | Hybrid Search | Metadata Filter | User Isolation | Scaling (to 30M) | Reliability |
|---|---|---|---|---|---|---|---|---|
| 1 | **Upstash Vector** | Managed | **$5-10** | No native BM25 | Basic | Namespace | Easy (serverless) | Medium |
| 2 | **LanceDB (self-hosted)** | Self-hosted | **$8-16** | Yes | Yes | Partition | Manual | Medium (beta feel) |
| 3 | **Qdrant (self-hosted, SQ)** | Self-hosted | **$16-24** | Yes (BM25) | Excellent | Payload filter | Manual | High |
| 4 | **pgvector (self-hosted)** | Self-hosted | **$24-55** | Yes (tsvector/BM25) | Excellent (SQL) | WHERE clause | Manual | Very High |
| 5 | **Zilliz Cloud** | Managed | **$30-50** | Yes | Good | Partition | Auto (serverless) | High |
| 6 | **Qdrant (self-hosted, no Q)** | Self-hosted | **$32-55** | Yes (BM25) | Excellent | Payload filter | Manual | High |
| 7 | **CF Vectorize** (current) | Managed | **$37** | No (D1 FTS5 separate) | Buggy | Namespace/filter | Auto | Medium (bugs) |
| 8 | **Weaviate (self-hosted)** | Self-hosted | **$24-55** | Yes (native) | Excellent | Multi-tenant | Manual | High |
| 9 | **Turbopuffer** | Managed | **$64** (minimum) | Yes (BM25) | Yes | Namespace | Auto | High |
| 10 | **Pinecone Serverless** | Managed | **$70-130** | No native | Good | Namespace | Auto | Very High |
| 11 | **Qdrant Cloud** | Managed | **$80-250** | Yes | Excellent | Payload filter | Auto | Very High |
| 12 | **ChromaDB (self-hosted)** | Self-hosted | **$16-24** | No | Basic | Collection | Not viable at 3M+ | Low |
| 13 | **Weaviate Cloud** | Managed | **$300-350** | Yes (native) | Excellent | Multi-tenant | Auto | Very High |

---

## RECOMMENDATION MATRIX

### Best overall value: **Qdrant self-hosted with Scalar Quantization**
- $16-24/mo on Hetzner CX32/CX42
- Excellent metadata filtering (your current CF Vectorize pain point)
- Native hybrid search (dense + sparse vectors, BM25 via Fastembed)
- Single Docker binary, simple ops
- Scales to 30M+ with quantization on a $55/mo server
- Active community, excellent docs

### Best managed/zero-ops: **Zilliz Cloud Serverless**
- $30-50/mo (competitive with self-hosted)
- Milvus ecosystem (open-source backend)
- Good hybrid search
- Tiered storage (hot/warm/cold)
- Serverless scaling

### Best if already using PostgreSQL: **pgvector**
- $24-55/mo (same VPS as your app)
- Everything in one database
- SQL-native metadata filtering (your strongest option)
- Hybrid search via tsvector + pg_textsearch (BM25)
- Battle-tested infrastructure

### Best for future massive scale (10M+ vectors): **Turbopuffer**
- $64/mo minimum (overpay at 3M, but pricing becomes dominant at 10M+)
- $1/mo per million vectors = $10/mo for 10M vectors + $4/1M queries
- Used by Cursor, Notion -- proven at scale
- Native BM25 hybrid search

### Avoid:
- **ChromaDB** -- not production-ready at 3M+ vectors
- **Weaviate Cloud** -- too expensive ($300+/mo)
- **Pinecone** -- metadata filtering multiplies costs, closed-source
- **CF Vectorize** -- metadata bugs are a blocker

---

## MIGRATION CONSIDERATIONS

From CF Vectorize to any option:
1. Export all vectors via Vectorize API (batch read)
2. Transform metadata format if needed
3. Batch insert into new DB
4. Update Contexter vectorstore service (`src/services/vectorstore.ts`)
5. Update query route to use new hybrid search
6. Can keep D1 FTS5 as fallback during migration

### Hybrid Search Architecture

Current: CF Vectorize (vector) + D1 FTS5 (full-text) + RRF fusion in code
Target: Single system with native hybrid search (Qdrant/Turbopuffer/pgvector)

Benefit: Simpler architecture, better relevance (single system optimizes fusion), fewer round-trips

---

## Sources

- [Qdrant Pricing](https://qdrant.tech/pricing/)
- [Qdrant Capacity Planning](https://qdrant.tech/documentation/guides/capacity-planning/)
- [Qdrant Memory Consumption](https://qdrant.tech/articles/memory-consumption/)
- [Pinecone Pricing](https://www.pinecone.io/pricing/)
- [Pinecone Understanding Cost](https://docs.pinecone.io/guides/manage-cost/understanding-cost)
- [Weaviate Pricing](https://weaviate.io/pricing)
- [Weaviate Serverless Pricing](https://weaviate.io/pricing/serverless)
- [Weaviate Cloud Pricing Update](https://weaviate.io/blog/weaviate-cloud-pricing-update)
- [Zilliz Cloud Pricing](https://zilliz.com/pricing)
- [Zilliz Serverless Cluster Cost](https://docs.zilliz.com/docs/serverless-cluster-cost)
- [Turbopuffer Pricing](https://turbopuffer.com/pricing)
- [Turbopuffer Hybrid Search](https://turbopuffer.com/docs/hybrid)
- [Upstash Vector Pricing](https://upstash.com/pricing/vector)
- [CF Vectorize Pricing](https://developers.cloudflare.com/vectorize/platform/pricing/)
- [pgvector Benchmarks](https://www.instaclustr.com/education/vector-database/pgvector-performance-benchmark-results-and-5-ways-to-boost-performance/)
- [pgvector Hybrid Search](https://jkatz05.com/post/postgres/hybrid-search-postgres-pgvector/)
- [pg_textsearch BM25](https://www.tigerdata.com/blog/introducing-pg_textsearch-true-bm25-ranking-hybrid-retrieval-postgres)
- [LanceDB Pricing](https://lancedb.com/pricing/)
- [ChromaDB Performance](https://docs.trychroma.com/guides/deploy/performance)
- [ChromaDB Resources](https://cookbook.chromadb.dev/core/resources/)
- [Hetzner Cloud Pricing](https://www.hetzner.com/cloud)
- [Self-Hosting vs SaaS Cost Analysis](https://openmetal.io/resources/blog/when-self-hosting-vector-databases-becomes-cheaper-than-saas/)
- [Vector DB Pricing Comparison 2026](https://ranksquire.com/2026/03/04/vector-database-pricing-comparison-2026/)
- [ParadeDB Hybrid Search Manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual)
