# Contexter — Stack (demo/MVP)
> All on Cloudflare. Zero external servers.

## Runtime & Framework

| Layer | Tech |
|---|---|
| Runtime | Bun |
| Frontend | SolidJS (static SPA) |
| API | Hono on CF Workers |
| CSS | Tailwind CSS 4 |
| ORM | Drizzle ORM (sqlite) |
| Deploy | Cloudflare Pages + Workers |

## Storage

| Layer | Tech |
|---|---|
| Metadata DB | CF D1 |
| Full-text search | D1 FTS5 |
| Vector store | CF Vectorize (1024 dims) |
| File storage | CF R2 |
| KV | CF KV (sessions, rate limits, OAuth tokens) |

## AI (all API calls from Workers)

| Layer | Tech |
|---|---|
| Embeddings | Jina v4 API (truncate_dim=1024, multimodal) |
| Transcription | Groq Whisper Large v3 API |
| RAG answer | Workers AI / Groq / NIM (fallback chain) |

## Auth & MCP

| Layer | Tech |
|---|---|
| User auth | better-auth 1.5 (D1, OAuth 2.1 Provider, MCP Auth) |
| MCP server | @cyanheads/mcp-ts-core (Streamable HTTP, Zod tools) |

## Processing

| Layer | Tech |
|---|---|
| Async pipeline | CF Workflows |
| Document parsing | env.AI.toMarkdown() (free) |
| PDF visual (scans) | Vision LLM API (base64 pages) |
| Audio | Groq Whisper API |
| YouTube | youtube-caption-extractor (субтитры only) |
| Video | demo: audio track only, no keyframes |

## RAG Query Pipeline

```
query
  → rewrite to N variants (LLM)
  → parallel: FTS5 (BM25) + Vectorize (semantic)
  → Reciprocal Rank Fusion
  → top-K chunks from D1
  → LLM synthesis
  → answer
```

## Supported Input Formats

| Format | Parser | Runtime |
|---|---|---|
| PDF (text) | toMarkdown | CF Workers AI |
| PDF (visual/scan) | Vision LLM API | API call |
| DOCX | toMarkdown | CF Workers AI |
| XLSX | toMarkdown | CF Workers AI |
| PPTX | toMarkdown | CF Workers AI |
| CSV | toMarkdown | CF Workers AI |
| JSON | toMarkdown | CF Workers AI |
| TXT, MD | toMarkdown | CF Workers AI |
| Images (PNG, JPG, WebP, SVG) | toMarkdown (AI description) | CF Workers AI |
| Audio (MP3, WAV, M4A, OGG) | Groq Whisper | API call |
| Video (MP4, MOV, WebM) | audio track → Groq Whisper | API call |
| YouTube URL | youtube-caption-extractor | CF Workers |

## Key Decisions

| Decision | Choice | Why |
|---|---|---|
| SolidStart vs Hono | Hono + static SolidJS | vinxi/CF bindings friction, Hono = first-class CF citizen |
| Jina dims | v4 @ 1024 (truncated) | Matryoshka-trained, fits Vectorize, multimodal preserved |
| Auth stack | better-auth 1.5 alone | OAuth 2.1 Provider + MCP Auth built-in, one library |
| Parsers | toMarkdown (CF native) | Free, covers 10+ formats, zero dependencies |
| YouTube | subtitles only | CF Workers compatible, covers 95% videos |
| Video | audio track only | no ffmpeg in Workers, keyframes = prod/VPS |
| External compute | none (demo) | all API calls, zero servers |
