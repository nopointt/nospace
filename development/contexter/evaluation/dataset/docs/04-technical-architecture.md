# Contexter Technical Architecture

## Infrastructure

Contexter runs on a Hetzner CAX11 server (2 ARM vCPU, 4GB RAM, 40GB NVMe) in Helsinki, Finland. The frontend is a SolidJS SPA deployed to Cloudflare Pages.

### Docker Services

| Service | Image | RAM Limit | Purpose |
|---|---|---|---|
| app | oven/bun:1-alpine + ffmpeg | 512 MB | Hono API server |
| postgres | pgvector/pgvector:pg16 | 1024 MB | Metadata + vectors + FTS |
| redis | redis:7-alpine | 256 MB | Rate limits + BullMQ queue |
| caddy | caddy:2-alpine | 128 MB | Reverse proxy + TLS |
| docling | docling-serve | 1536 MB | Document parsing (IBM, MIT) |
| netdata | netdata/netdata | 256 MB | Monitoring + alerts |

Total allocated RAM: 3712 MB (within 4096 MB physical, with ~384 MB for OS).

## Database Schema

PostgreSQL 16 with pgvector 0.8.2 extension. Key tables:

- **users**: id, name, email, api_token (64-char hex), google_id, telegram_id, avatar_url
- **documents**: id, user_id, name, mime_type, size, r2_key, status, metadata (jsonb)
- **chunks**: id, document_id, user_id, content, chunk_index, token_count, embedding (vector 512), tsv (tsvector), parent_id, chunk_type, section_heading, page_number, context_prefix, duplicate_of, feedback_pos, feedback_neg, feedback_score
- **jobs**: id, document_id, user_id, type (parse/chunk/embed/index), status, progress, error_message

### Indexes

15 indexes total:
- Primary keys on all tables
- Unique index on users.api_token
- B-tree on chunks.document_id, chunks.user_id, jobs.document_id
- GIN on chunks.tsv (full-text search)
- HNSW on chunks.embedding with cosine distance (ef_search=64)

## Embedding Strategy

Jina v4 (jina-embeddings-v4) with Matryoshka Representation Learning. Native dimensions: 1024, truncated to 512 (retains 99.7% of nDCG@10 quality). Late chunking enabled for batch embeddings — groups chunks within 8K token windows for context-aware vectorization.

## Query Pipeline

1. Query rewrite (Groq Llama 8B) — expands and clarifies the user's question
2. Query embedding (Jina v4, 512-dim)
3. Hybrid search: tsvector full-text search || pgvector cosine similarity → convex fusion (alpha=0.5)
4. Cross-encoder reranking (Jina reranker)
5. MMR diversity filter (lambda=0.7)
6. Parent resolution — if child chunks are retrieved, fetch the full parent for richer context
7. Context assembly — build prompt with retrieved passages
8. LLM answer generation (Groq Llama 70B, streaming SSE)

## Resilience

Circuit breakers (cockatiel library) protect all external API calls:
- Jina: SamplingBreaker (50% failure in 60s → open), bulkhead 3 concurrent, retry 3x
- Groq LLM: SamplingBreaker, bulkhead 2, retry 3x + provider chain fallback to NIM
- Groq Whisper: ConsecutiveBreaker (3 failures → open), bulkhead 1, retry 2x
- Docling: ConsecutiveBreaker (3 failures → open), bulkhead 1, retry 2x
