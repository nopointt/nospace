# RAG-as-a-Service Pricing Competitive Analysis
> Date: 2026-03-25 | For: Contexter pricing model design
> Method: WebSearch across 20+ competitors, exact pricing where available

---

## Executive Summary

The RAG/knowledge base market has **no standard pricing unit**. Competitors charge by:
- **Per vector/dimension** (Pinecone, Weaviate, Zilliz)
- **Per GB storage** (Pinecone, Zilliz, Supabase, Qdrant)
- **Per query/request** (Vectara, Google, Algolia, Cohere)
- **Per page processed** (Unstructured, LlamaParse)
- **Per seat** (Notion, Dust, Mem, Relevance AI)
- **Per resource unit** (Azure, AWS Kendra, MongoDB)
- **Per credit** (Vectara, LlamaCloud, Relevance AI)

Contexter's positioning (upload file -> parse -> chunk -> embed -> query) spans the FULL pipeline. Most competitors only cover 1-2 stages. This is both an advantage (simplicity) and a pricing challenge (must bundle parsing + storage + retrieval).

---

## 1. Direct Competitors (RAG / Knowledge Base API)

### 1.1 Pinecone Serverless

| Metric | Value |
|---|---|
| **Free tier** | 2 GB storage, ~300K vectors (1536-dim), 5 indexes, 1M RU/mo, 2M WU/mo |
| **Storage** | $0.33/GB/month |
| **Reads** | $8.25 per 1M read units (1 query = 5-10 RU with filters) |
| **Writes** | $2.00 per 1M write units |
| **Min commitment** | Standard: $50/mo, Enterprise: $500/mo |
| **Pinecone Assistant** | $0.05/assistant-hour + $5/1M context tokens, 1 GB file storage on free |
| **Pricing unit** | Per GB + per read/write unit |

**Key insight:** At scale (5M queries/day), read costs alone = $4,000/mo. The "serverless scale cliff."

### 1.2 Vectara

| Metric | Value |
|---|---|
| **Free tier (Growth)** | 15,000 queries, 15,000 generative requests, 50 MB storage |
| **Scale plan** | Contact sales (not public) |
| **Enterprise** | $100K-$500K/year (Small/Medium/Large) |
| **Pricing unit** | Credits (bundles of queries + storage + generative requests) |
| **Trial** | 30 days, 10,000 credits |

**Key insight:** True RAG-as-a-service (closest to Contexter). Very generous free tier for queries but tiny storage (50 MB). Enterprise-focused pricing.

### 1.3 LlamaCloud / LlamaParse

| Metric | Value |
|---|---|
| **Free tier** | 10,000 credits/month (~10K pages basic parse) |
| **Credit cost** | 1,000 credits = $1 |
| **Parse cost** | 1 credit/page (no AI) to 90 credits/page (agentic with Sonnet) |
| **Recommended** | 3 credits/page (cost-effective with basic LLM) |
| **Paid plans** | Starter, Pro — not public, contact sales |
| **Pricing unit** | Per credit (primarily per page parsed) |

**Key insight:** Parsing-focused, not storage-focused. $0.001/page basic, $0.003/page recommended, $0.09/page agentic. No storage pricing published.

### 1.4 Cohere (Embed + Rerank — components, not full RAG)

| Metric | Value |
|---|---|
| **Embed v4** | $0.12 per 1M tokens (text), $0.47/1M tokens (image) |
| **Embed v3** | $0.10 per 1M tokens |
| **Rerank 3.5** | $2.00 per 1,000 searches (up to 100 docs/search) |
| **Free tier** | Rate-limited trial keys |
| **Pricing unit** | Per token (embed) + per search (rerank) |

**Key insight:** Component pricing only. No storage, no parsing. Cheapest embedding at $0.10/1M tokens. Good benchmark for Contexter's embedding cost component.

### 1.5 Unstructured.io

| Metric | Value |
|---|---|
| **Free tier** | 15,000 pages (no expiration, full features) |
| **Pay-as-you-go** | $0.01/page ($10 per 1,000 pages) |
| **Page definition** | PDF/PPTX/TIFF: 1 page = 1 page. Other files: 1 page = 100 KB |
| **Pricing unit** | Per page processed |

**Key insight:** Parsing-only, no storage/retrieval. $0.01/page = $10/1000 pages. For a 100-page PDF, that's $1.00 to process. Generous free tier.

### 1.6 Zilliz Cloud (Milvus)

| Metric | Value |
|---|---|
| **Free tier** | Monthly free credits included (amount not specified) |
| **Storage** | $0.04/GB/month (standardized Jan 2026, all clouds) |
| **Data transfer** | At-cost pass-through (no Zilliz markup) |
| **Key feature** | 87% storage cost reduction with new tiered storage |
| **Pricing unit** | Per GB storage + compute units |

**Key insight:** Cheapest vector storage at $0.04/GB/month. 8x cheaper than Pinecone's $0.33/GB.

### 1.7 MyScale

| Metric | Value |
|---|---|
| **Free tier** | 5 million vectors (768-dim), single AZ |
| **Paid plans** | Not publicly listed (contact sales) |
| **Pricing unit** | Per cluster (resource-based) |

**Key insight:** Extremely generous free tier (5M vectors). ClickHouse-based, SQL-compatible. Paid pricing opaque.

---

## 2. Adjacent (AI Document Storage / Enterprise Search)

### 2.1 Google Vertex AI Search

| Metric | Value |
|---|---|
| **Free tier** | 10,000 queries/account/month |
| **Queries** | $1.50 per 1,000 queries (Standard) / $2.50 per 1,000 (Commerce) |
| **Storage** | Measured in GiB (exact per-GiB rate not public) |
| **Min commitment** | 1,000 QPM + 50 GB storage (configurable pricing) |
| **Pricing unit** | Per query + per GiB storage |

### 2.2 AWS Kendra

| Metric | Value |
|---|---|
| **Free tier** | 750 hours first 30 days only |
| **Developer Edition** | $810/month (10K docs, 4K queries/day) |
| **Enterprise Edition** | $1,008/month (100K docs, 8K queries/day) |
| **Connectors** | $0.35/hour + $1/1M docs scanned |
| **Pricing unit** | Per index/month (flat) + connectors |

**Key insight:** Enterprise-grade pricing. $810/mo MINIMUM. Not competitive for startups/developers.

### 2.3 Azure AI Search

| Metric | Value |
|---|---|
| **Free tier** | 50 MB storage, 3 indexes |
| **Basic** | ~$73.73/month/SU (15 GB storage) |
| **S1** | ~$245.28/month/SU (160 GB storage) |
| **S2** | ~$981.12/month/SU |
| **S3** | ~$1,962.24/month/SU |
| **Storage Optimized L1/L2** | Higher price, up to 2 TB/partition |
| **Pricing unit** | Per Search Unit/month (flat hourly rate) |

**Key insight:** $73/mo minimum for basic. Enterprise-grade. Effective cost: Basic = ~$4.91/GB/mo, S1 = ~$1.53/GB/mo.

### 2.4 Algolia NeuralSearch

| Metric | Value |
|---|---|
| **Free tier (Build)** | 1M records, 10K requests/month |
| **Grow** | $0.50/1K search requests + $0.40/1K records (beyond 100K) |
| **Grow Plus** | $0.75/1K search requests |
| **Elevate (NeuralSearch)** | Custom pricing, ~$50K+/year minimum |
| **Pricing unit** | Per search request + per record |

**Key insight:** NeuralSearch (semantic) requires $50K+/year Elevate tier. Basic keyword search is affordable. Not directly comparable to RAG.

### 2.5 MongoDB Atlas Vector Search

| Metric | Value |
|---|---|
| **Free tier (M0)** | 512 MB storage |
| **Flex tier** | $8-$30/month (5 GB storage, 100 ops/sec) |
| **Dedicated (M10+)** | From $57/month (10 GB-4 TB) |
| **Vector Search** | Included with cluster (no separate charge) |
| **Pricing unit** | Per cluster tier (resource-based) |

**Key insight:** Vector search is free on top of existing Atlas. Flex tier at $8/mo is cheapest managed DB option.

---

## 3. Developer-Focused (Similar Positioning)

### 3.1 Supabase (with pgvector)

| Metric | Value |
|---|---|
| **Free tier** | 500 MB database, 1 GB file storage, 2 projects |
| **Pro** | $25/month (8 GB database, 100 GB file storage) |
| **Team** | $599/month |
| **Extra DB storage** | $0.125/GB/month |
| **Extra file storage** | Included in plan quotas |
| **pgvector** | Available on all plans (Postgres extension) |
| **Pricing unit** | Per plan + per GB overage |

**Key insight:** $25/mo for 8 GB is excellent value. pgvector included. But no parsing/RAG pipeline — you build it yourself. Effective: ~$3.13/GB/mo base, $0.125/GB overage.

### 3.2 Weaviate Cloud

| Metric | Value |
|---|---|
| **Free tier** | Sandbox cluster (14-day expiry) |
| **Serverless** | $25 per 1M vector dimensions/month |
| **Flex plan** | From $45/month (pay-as-you-go) |
| **Plus plan** | From $280/month |
| **Pricing unit** | Per million vector dimensions + per GB storage + per GB backups |

**Key insight:** $25/1M dimensions. For 100K vectors at 1536-dim = 153.6M dimensions = ~$3.84/mo just for vectors. Plus storage costs on top.

### 3.3 Qdrant Cloud

| Metric | Value |
|---|---|
| **Free tier** | 1 GB RAM, 4 GB disk (forever, no CC) |
| **Paid** | Resource-based (vCPU + RAM + disk) |
| **Example** | 8 GB RAM + 2 vCPU = $150-$200/month |
| **Hybrid Cloud** | From $0.014/hour |
| **Pricing unit** | Per resource (RAM/CPU/disk) |

**Key insight:** Best free tier for vector DB (1 GB RAM forever). But scaling is expensive — resource-based, not usage-based.

---

## 4. No-Code / Prosumer (Knowledge Base Tools)

### 4.1 Notion AI

| Metric | Value |
|---|---|
| **Free tier** | Limited AI trial |
| **Plus** | $10/user/month (limited AI trial) |
| **Business** | $18/user/month (full AI, billed annually) |
| **Enterprise** | Custom |
| **Storage** | Unlimited file uploads on all paid plans |
| **Pricing unit** | Per seat/month |

**Key insight:** Per-seat, not per-storage. No API for external RAG. Not a direct competitor but sets consumer expectations.

### 4.2 Mem.ai

| Metric | Value |
|---|---|
| **Free tier** | Very limited |
| **Individual** | ~$8.33/month (billed yearly at $14.99/yr) or $14.99/mo |
| **Teams** | Contact sales |
| **Storage** | 100 GB on Individual plan |
| **Pricing unit** | Per seat/month |

**Key insight:** Personal knowledge management. Not API-accessible. $8.33/mo for 100 GB = $0.083/GB effective.

### 4.3 Dust.tt

| Metric | Value |
|---|---|
| **Free tier** | 15-day trial |
| **Pro** | EUR 29/user/month (~$31 USD) |
| **Enterprise** | Custom |
| **Storage** | 1 GB/user data sources |
| **Features** | Connections to GitHub, Google Drive, Notion, Slack |
| **Pricing unit** | Per seat/month |

**Key insight:** AI agent platform with knowledge base. EUR 29/user = ~$31/user for 1 GB storage per user. Expensive per GB.

### 4.4 Stack AI

| Metric | Value |
|---|---|
| **Free tier** | 500 runs/month, 2 projects, 1 seat |
| **Enterprise** | Custom (estimated $1,000-$5,000+/mo) |
| **Pricing unit** | Per seat + per run |

**Key insight:** No-code workflow builder. No mid-tier pricing published. Free tier good for prototyping.

### 4.5 Relevance AI

| Metric | Value |
|---|---|
| **Free** | 200 actions/month, $2 vendor credits, 10 MB knowledge |
| **Pro** | $19/month (annual) / $29/month (monthly), 2,500 actions, 100 MB knowledge |
| **Team** | $234/month (annual) / $349/month, 7,000 actions, 1 GB knowledge |
| **Business** | $599/month, 150K actions, 5 GB knowledge |
| **Extra knowledge** | $100/GB |
| **Pricing unit** | Per seat + per action + per GB knowledge |

**Key insight:** $100/GB for additional knowledge storage is EXTREMELY expensive. Pro includes unlimited knowledge on some plans but tiny on others. Confusing pricing.

---

## 5. Contexter's Own Stack Cost (Cloudflare)

For comparison, here's what Contexter actually pays on Cloudflare:

| Component | Pricing |
|---|---|
| **D1 (metadata)** | $0.75/mo per 10 GB storage, reads free first 25B/mo |
| **Vectorize** | $0.01/1M queried vector dimensions + $0.05/100M stored dimensions |
| **R2 (file storage)** | $0.015/GB/month storage, free egress |
| **Workers AI (toMarkdown)** | Free |
| **Jina Embed v4** | ~$0.02/1M tokens (1024-dim) |
| **Workers** | $5/mo paid plan |

**Effective cost to Contexter per 1 GB of documents:**
- R2 storage: $0.015/GB/month
- D1 metadata: ~$0.001/GB/month
- Vectorize (1024-dim, ~5K chunks/GB): ~$0.0003/month stored
- Parsing: Free (CF toMarkdown)
- Embedding (one-time): ~$0.02 per GB
- **Total recurring: ~$0.02/GB/month**
- **Total one-time processing: ~$0.02/GB**

---

## Comparison Table — Sorted by Effective Cost per GB

| # | Service | Free Tier | Effective $/GB/mo | Query Cost | Pricing Model | Notes |
|---|---|---|---|---|---|---|
| 1 | **Cloudflare (Contexter stack)** | Workers free plan | ~$0.02 | ~$0.01/1M dim | Per usage | Our actual cost |
| 2 | **Zilliz Cloud** | Free credits | $0.04 | Compute-based | Per GB + compute | Cheapest pure vector |
| 3 | **Supabase** | 500 MB | $0.125 (overage) | N/A (self-built) | Per plan + overage | No RAG pipeline |
| 4 | **Pinecone Serverless** | 2 GB | $0.33 | $8.25/1M RU | Per GB + per RU | Read costs add up |
| 5 | **MongoDB Atlas Flex** | 512 MB | ~$1.60 ($8/5GB) | Included | Per cluster | Vector search free |
| 6 | **Azure AI Search Basic** | 50 MB | ~$4.91 ($74/15GB) | Included | Per SU/month | Enterprise-grade |
| 7 | **Weaviate Flex** | Sandbox 14d | ~$5-10 (est.) | Included | Per M dims + GB | Complex pricing |
| 8 | **Supabase Pro** | 8 GB incl. | ~$3.13 ($25/8GB) | N/A | Per plan | Great for dev |
| 9 | **Qdrant** | 1 GB free | ~$18-25/GB (est.) | Included | Per resource | RAM-based pricing |
| 10 | **Algolia Grow** | 1M records | ~N/A (per record) | $0.50/1K | Per record + query | Not storage-based |
| 11 | **Dust.tt** | 15-day trial | ~$31/GB/user | Included | Per seat | 1 GB/user |
| 12 | **Relevance AI** | 10 MB | $100/GB (addon) | Per action | Per seat + per action + per GB | Insanely expensive storage |
| 13 | **AWS Kendra Dev** | 750h trial | ~$81/GB ($810/10K docs) | Included | Per index/month | Enterprise only |
| 14 | **Vertex AI Search** | 10K queries | Contact sales | $1.50/1K queries | Per query + GiB | Enterprise |
| 15 | **Azure AI Search S1** | 50 MB | ~$1.53 ($245/160GB) | Included | Per SU/month | Better at scale |

---

## Processing Cost Comparison (One-Time, Per Document)

| Service | Cost per 1,000 pages | Notes |
|---|---|---|
| **CF toMarkdown** | $0.00 (free) | Contexter's parser |
| **LlamaParse (basic)** | $1.00 (1 credit/page) | No AI, fast |
| **LlamaParse (recommended)** | $3.00 (3 credits/page) | Cost-effective LLM |
| **Unstructured.io** | $10.00 ($0.01/page) | Full ETL pipeline |
| **LlamaParse (agentic)** | $90.00 (90 credits/page) | Sonnet-powered |

---

## Key Takeaways for Contexter Pricing

### 1. Market Gap
No competitor offers the FULL pipeline (upload -> parse -> chunk -> embed -> store -> query -> answer) at a transparent, storage-based price. Vectara is closest but enterprise-focused ($100K+/year for real usage).

### 2. Pricing Sweet Spot
- **Free tier:** 50-100 MB storage, ~1,000 queries/month (beats Vectara's 50 MB)
- **Starter:** $5-10/month for 1-5 GB (undercuts Supabase Pro at $25/month, but includes RAG pipeline)
- **Pro:** $20-30/month for 10-50 GB (comparable to Supabase Pro but with full RAG)
- **Scale:** $0.10-0.50/GB/month (between Zilliz $0.04 and Pinecone $0.33)

### 3. Margin Analysis
At $0.10/GB/month with ~$0.02/GB actual cost = **80% gross margin**.
At $0.50/GB/month = **96% gross margin**.
Query costs are negligible on Cloudflare.

### 4. Competitive Advantages to Emphasize
- **Simplest pricing:** Per GB, not per vector/dimension/credit/seat
- **Full pipeline included:** Parse + chunk + embed + store + query + answer
- **No query limits on paid plans** (CF costs are negligible)
- **MCP-native** (unique in market)
- **Zero egress fees** (Cloudflare R2)

### 5. Pricing Anti-Patterns to Avoid
- Per-seat pricing (Notion, Dust) — limits adoption
- Credit systems (Vectara, LlamaCloud) — confusing
- Per-vector-dimension pricing (Weaviate) — hard to estimate
- Minimum commitments (Pinecone $50/mo, Algolia $50K/yr for semantic)
- Hidden query costs that dominate at scale (Pinecone RU)

---

## Sources

- [Pinecone Pricing](https://www.pinecone.io/pricing/)
- [Pinecone Assistant Pricing](https://docs.pinecone.io/guides/assistant/pricing-and-limits)
- [Pinecone Cost Guide](https://docs.pinecone.io/guides/manage-cost/understanding-cost)
- [Vectara Pricing](https://www.vectara.com/pricing)
- [LlamaParse Pricing](https://www.llamaindex.ai/pricing)
- [LlamaParse v2 Blog](https://www.llamaindex.ai/blog/introducing-llamaparse-v2-simpler-better-cheaper)
- [Cohere Pricing (PE Collective)](https://pecollective.com/tools/cohere-pricing/)
- [Cohere Pricing Docs](https://docs.cohere.com/docs/how-does-cohere-pricing-work)
- [Unstructured.io Pricing](https://unstructured.io/pricing)
- [Zilliz Cloud Pricing](https://zilliz.com/pricing)
- [Zilliz Oct 2025 Update](https://zilliz.com/blog/zilliz-cloud-oct-2025-update)
- [MyScale Pricing](https://www.myscale.com/pricing/)
- [Vertex AI Search Pricing](https://cloud.google.com/generative-ai-app-builder/pricing)
- [AWS Kendra Pricing](https://aws.amazon.com/kendra/pricing/)
- [Azure AI Search Pricing](https://azure.microsoft.com/en-us/pricing/details/search/)
- [Algolia Pricing](https://www.algolia.com/pricing)
- [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
- [MongoDB Flex Costs](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/)
- [Supabase Pricing](https://supabase.com/pricing)
- [Weaviate Pricing](https://weaviate.io/pricing)
- [Weaviate Pricing Update Blog](https://weaviate.io/blog/weaviate-cloud-pricing-update)
- [Qdrant Pricing](https://qdrant.tech/pricing/)
- [Notion Pricing](https://www.notion.com/pricing)
- [Mem.ai Pricing](https://get.mem.ai/pricing)
- [Dust.tt Pricing](https://dust.tt/home/pricing)
- [Stack AI Pricing](https://www.stackai.com/pricing)
- [Relevance AI Pricing](https://relevanceai.com/pricing)
- [Relevance AI Plans Docs](https://relevanceai.com/docs/get-started/subscriptions/plans)
- [Cloudflare Vectorize Pricing](https://developers.cloudflare.com/vectorize/platform/pricing/)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Vector DB Pricing Comparison 2026](https://ranksquire.com/2026/03/04/vector-database-pricing-comparison-2026/)
- [Pinecone vs Weaviate 2026](https://rahulkolekar.com/vector-db-pricing-comparison-pinecone-weaviate-2026/)
