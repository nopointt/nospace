---
# HARKLY-18.2 — Upload + Process
> Parent: HARKLY-18 | Status: ⬜ BLOCKED by 18.1 | Parallel with: 18.4
> Spec: `docs/research/harkly-mvp-build-plan.md` Phase 1
> Copy Map: `docs/research/harkly-mvp-copy-map.md`
---

## Goal

Upload any supported file → text extracted → chunks in D1 + Vectorize → original in R2. Audio transcribed. YouTube subtitles fetched.

## Supported Formats (MVP)

| Format | Handler | Runtime |
|---|---|---|
| PDF | unpdf | CF Workers (edge) |
| DOCX | mammoth.js | CF Workers |
| CSV | papaparse | CF Workers |
| TXT/MD | as-is | CF Workers |
| Audio (mp3/wav/m4a) | Groq Whisper API | External API call |
| YouTube URL | youtube-transcript-api (JS) | CF Workers |
| Web URL | Jina Reader (`r.jina.ai`) | External API call |

## Tasks

- [ ] R2 presigned upload endpoint (aws4fetch, 15 min expiry)
- [ ] Upload UI: file picker + drag-and-drop + progress
- [ ] Queue producer: enqueue `process_source` job on upload
- [ ] Queue consumer: text extraction by MIME type
- [ ] Audio handler: send to Groq Whisper, store transcript
- [ ] YouTube handler: `youtube-transcript-api` → subtitles → text
- [ ] URL handler: Jina Reader → markdown
- [ ] Chunking: RecursiveCharacterTextSplitter (500/100)
- [ ] Embedding: Workers AI BGE-Large (batch 10) → Vectorize upsert (batch 100, 500ms delay)
- [ ] FTS5 auto-sync via trigger
- [ ] TokenCounter guard (D1 row size 1.5MB safe)
- [ ] IdUtils.ensureSafeId() for Vectorize IDs
- [ ] RateLimiter for Vectorize API (100 req/min)
- [ ] Job status API: list + detail + stale detection (>5 min → reset)
- [ ] Document list UI with status badges

## Clone From

| Source | What |
|---|---|
| cloudflare-rag | unpdf usage, batch embedding, ULID as vector ID |
| openai-sdk-knowledge-org | JobQueue, RateLimiter, TokenCounter, IdUtils, VectorStoreImpl |
| ai-rag-crawler | Workflow status polling pattern |

## Acceptance

- [ ] Upload PDF → text in D1, chunks indexed, vectors in Vectorize
- [ ] Upload DOCX, CSV, TXT → same pipeline
- [ ] Upload audio mp3 → Groq Whisper → transcript in D1
- [ ] Paste YouTube URL → subtitles fetched → indexed
- [ ] Paste web URL → Jina Reader → markdown → indexed
- [ ] Job status shows queued → running → completed
- [ ] 3 concurrent uploads → all process correctly
