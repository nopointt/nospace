# Contexter Product Overview

Contexter is a RAG-as-a-service platform that transforms any content into a queryable knowledge base.

## Core Features

- **Universal Format Support:** 15 file formats including PDF, DOCX, XLSX, PPTX, ODS, CSV, JSON, TXT, MD, HTML, images (PNG/JPG/WebP/SVG), audio (MP3/WAV/M4A/OGG), and video (MP4/MOV/WebM).
- **MCP Integration:** 12 tools available via Streamable HTTP JSON-RPC protocol.
- **Hierarchical Chunking:** Structure-aware block classification with parent-child relationships.
- **Multi-Provider LLM Chain:** Groq (primary) → NVIDIA NIM (fallback) with automatic failover.
- **Hybrid Search:** pgvector cosine similarity + PostgreSQL tsvector full-text search with convex fusion.

## Architecture

The pipeline processes documents through six stages:
1. Parse (Docling for rich formats, TextParser for plain text, Whisper for audio)
2. Chunk (hierarchical semantic splitting with auto-merge)
3. Contextual prefix (Groq 8B generates document-level context for each chunk)
4. Dedup (pgvector 0.98 cosine threshold to skip near-duplicate chunks)
5. Embed (Jina v4 with late chunking, 512-dim MRL)
6. Index (pgvector HNSW + tsvector GIN)

## Pricing

| Tier | Price | Storage | Queries |
|---|---|---|---|
| Starter | $9/mo | 1 GB | 100/day |
| Pro | $29/mo | 10 GB | 1000/day |
| Team | $79/mo | 50 GB | 5000/day |

## Security

All documents are stored encrypted at rest in Cloudflare R2 (EU region). The API uses Bearer token authentication. Rate limiting is enforced at 60 queries per minute per user and 20 uploads per hour. Content filtering scans uploaded documents for prompt injection patterns.
