# session-scratch.md
> Closed · Axis · 2026-03-29 · session 208

<!-- ENTRY:2026-03-29:CLOSE:208:contexter:contexter-gtm [AXIS] -->
## 2026-03-29 — сессия 208 CLOSE [Axis]

**Decisions:**
- All file uploads → presigned R2 (server never touches bytes, scales to 1000+ concurrent)
- Audio segmentation: silence-detect → ≤23MB segments at mid-silence → parallel Whisper (concurrency 3)
- PDF images: Docling image_export_mode=embedded → filter → R2 → image chunks
- Multimodal embed: jina-clip-v2 for images, jina-embeddings-v4 for text (separate models, same 512-dim space)
- GROQ_LLM_URL separated from GROQ_API_URL (Whisper) — was causing /audio/transcriptions/chat/completions 404
- Registration rate limit raised 5→20/hr for testing
- CF Pages _redirects fix for SPA routing
- contexter-landing Pages project deleted (was causing deploy confusion)

**Files changed:**
- `web/src/components/ConnectionModal.tsx` — Perplexity instructions: Connectors flow
- `web/src/pages/Hero.tsx` — presigned upload, copy ссылку/токен buttons, removed 100MB limit
- `web/src/pages/Upload.tsx` — all files presigned, progress bar, removed MAX_FILE_SIZE
- `web/src/lib/api.ts` — presignUpload, confirmUpload, uploadToR2
- `web/public/_redirects` — NEW: SPA routing for CF Pages
- `src/routes/upload.ts` — /api/upload/presign + /api/upload/confirm endpoints
- `src/routes/mcp-remote.ts` — full format list in description
- `src/routes/auth.ts` — rate limit 5→20
- `src/services/pipeline.ts` — storeImagesToR2, buildImageChunks, dual embed (BROKEN)
- `src/services/parsers/audio.ts` — parseSegmented for >23MB
- `src/services/parsers/audio-segmenter.ts` — NEW: silence-aware segmenter
- `src/services/parsers/video.ts` — segmentation support
- `src/services/parsers/docling.ts` — image extraction via Docling JSON
- `src/services/parsers/types.ts` — ParsedImage, StoredImage interfaces
- `src/services/embedder/image.ts` — NEW: ImageEmbedderService (jina-clip-v2)
- `src/types/env.ts` — GROQ_LLM_URL field
- `src/index.ts` — GROQ_LLM_URL env initialization
- `package.json` — @aws-sdk/s3-request-presigner dependency
- DB: migrations 0005-0011 applied to production PostgreSQL
- R2: CORS configured on contexter-files bucket

**Completed:**
- [x] Perplexity connector instructions updated
- [x] "Скопировать ссылку" + "Скопировать токен" buttons
- [x] GIF/FLAC removed from frontend accept list
- [x] MCP format description updated (22 formats)
- [x] CF Pages _redirects SPA routing fix
- [x] Bug fixing methodology added to CLAUDE.md
- [x] CORS on R2 bucket
- [x] Docling image extraction test (supports embedded mode)
- [x] Presigned upload endpoints (backend)
- [x] Frontend presigned upload with progress bar
- [x] AudioParser v2 with silence-aware segmentation
- [x] VideoParser v2 with segmentation support
- [x] PDF image extraction via Docling
- [x] ImageEmbedderService (jina-clip-v2)
- [x] DB migrations 0005-0011 applied to prod
- [x] GROQ_LLM_URL fix (separated from Whisper URL)

**Opened / BLOCKERS:**
- [ ] CRITICAL: pipeline.ts crashes Bun silently when processing ANY file
  - Root cause: new pipeline code (image extraction + multimodal embed) has unhandled error
  - Server pipeline reverted to last commit but env.ts references GROQ_LLM_URL which old pipeline doesn't have
  - Need systematic top-down diagnosis in next session
  - Redis FLUSHDB was done — all caches/sessions/rate-limits cleared
- [ ] E2E tests written (17 suites, ~90 tests) but cannot pass while pipeline crashes
- [ ] Audio segmentation untested in production
- [ ] PDF image extraction untested in production
- [ ] Presigned upload flow verified (presign+PUT+confirm works) but pipeline processing after confirm crashes

**Notes:**
- Server state is inconsistent: pipeline.ts reverted to old commit, but upload.ts/index.ts/env.ts have new code
- Need to either: (A) fully revert ALL server code to last commit, or (B) fix pipeline.ts and deploy clean
- Approach B preferred — fix pipeline in isolation, test locally before deploy
- Registration rate limit currently 20/hr (was 5, raised for testing)
- contexter-landing CF Pages project deleted — only contexter-web remains
