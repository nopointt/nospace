---
# contexter-backlog.md — Contexter Product Backlog
> Layer: L2.5 | Frequency: on demand | Loaded: when planning next epic
> Last updated: 2026-03-30 (session 212 — created from CTX-08 open items + CTX-01/07 deferred)
---

## Bugs

### BUG-001: Direct upload returns 415 for multipart
- **Created:** 2026-03-29 08:00 UTC (session 209)
- **Source:** CTX-08 Phase 7.1
- **Severity:** MEDIUM (workaround exists: presigned upload flow)
- **Description:** `POST /api/upload` with multipart form-data returns 415 "Unsupported file type". The `resolveMimeType()` function at `src/routes/upload.ts:437` falls back to `application/octet-stream` when `file.type` is empty or generic in multipart context. Presigned flow (`/api/upload/presign` + PUT + `/api/upload/confirm`) works correctly because MIME type is explicitly passed in JSON body.
- **Root cause:** `file.type` from Hono multipart parser may be empty or `application/octet-stream` for some file types. `resolveMimeType()` only falls back to extension-based lookup when `provided` is falsy or `application/octet-stream`, but the multipart parser sometimes sends a valid-looking but incorrect MIME.
- **Affected:** Direct upload API + MCP `add_document` tool (if it uses direct upload)
- **Not affected:** Presigned upload flow (used by frontend + E2E tests + k6)
- **Code:** `src/routes/upload.ts:166-169` (direct), `src/routes/upload.ts:378-380` (confirm)
- **Debug logging:** `upload.ts:167` — `upload_debug` event, remove after fix
- **Fix approach:** Always resolve MIME from file extension as primary, file.type as secondary. Or: extract extension from fileName, look up in MIME_MAP, use that instead of trusting browser-provided type.

### BUG-002: PDF produces 1 chunk for large documents
- **Created:** 2026-03-29 08:00 UTC (session 209)
- **Source:** CTX-08 Phase 7.1
- **Severity:** LOW (affects quality, not availability)
- **Description:** A 22K character PDF was chunked into 1 chunk instead of expected ~10-15. The BPE encoder (`gpt-tokenizer`) may not be loaded at pipeline start in edge cases (race condition with lazy import), causing `countTokensSync()` to use the word-count fallback (`words * 1.4`) which overestimates, and `splitParagraphs` may not find split points in Docling markdown output.
- **Code:** `src/services/chunker/tokenizer.ts` (lazy BPE load), `src/services/pipeline.ts:474` (`ensureEncoderLoaded` called before chunking)
- **Status:** `ensureEncoderLoaded()` was added in chunking overhaul. May be resolved. Needs verification with a real PDF upload.
- **Verify:** Upload a multi-page PDF, check chunk count: `SELECT count(*) FROM chunks WHERE document_id = 'X'`

### BUG-003: Unit tests partially failing
- **Created:** 2026-03-30 07:00 UTC (session 212)
- **Source:** CTX-08 session 212
- **Severity:** LOW (does not affect production)
- **Description:** `tests/rag.test.ts` and `tests/vectorstore.test.ts` have 13 failing tests due to module rename (`reciprocalRankFusion` → renamed/moved during chunking overhaul). `tests/mcp.test.ts` crashes (needs DATABASE_URL).
- **Code:** `tests/rag.test.ts`, `tests/vectorstore.test.ts`, `tests/mcp.test.ts`
- **Fix approach:** Update imports to match current module exports. Add mock DB URL for mcp.test.ts or skip DB-dependent tests.

---

## Auth (blocked/deferred)

### AUTH-001: Telegram Login Widget
- **Created:** 2026-03-28 12:00 UTC (session 198)
- **Source:** CTX-08 Phase 4
- **Severity:** LOW (Google OAuth works, email auth in progress)
- **Description:** Telegram Login Widget requires the bot's domain to be set in BotFather. The `contexter.cc` domain needs to be registered as the bot's web app domain. Backend code is fully implemented (`src/routes/auth-social.ts:41` — POST `/api/auth/telegram` with HMAC verification), but the widget JS on frontend can't authenticate because BotFather domain config is missing.
- **Code:** Backend: `src/routes/auth-social.ts` (complete — verify HMAC, find/create user, return token). Frontend: no Telegram widget integrated yet.
- **Fix approach:** 1) Set domain in BotFather: `/setdomain` → `contexter.cc`. 2) Add Telegram Login Widget to login page. 3) Test end-to-end.
- **Blocked by:** BotFather domain config (5 min manual step)

### AUTH-002: Card payments
- **Created:** 2026-03-28 12:00 UTC (session 198)
- **Source:** CTX-08 Phase 4
- **Severity:** MEDIUM (crypto-only payments limit user base)
- **Description:** No credit/debit card payment processing. NOWPayments handles crypto only. Card payments require a KYB-verified entity (company registration) for Stripe/LemonSqueezy/Paddle integration.
- **Blocked by:** No legal entity for KYB. Billing entity planned in Argentina (RU citizen).

---

## Infrastructure

### INFRA-001: F-029 BM25 conditional scoring
- **Created:** 2026-03-28 18:00 UTC (session 204)
- **Source:** CTX-08 Phase 5
- **Severity:** LOW (hybrid search works well without BM25)
- **Description:** BM25 scoring for full-text search requires `pg_bm25` extension or PG 17+ built-in BM25. Current PG 16.13 only supports tsvector ranking (`ts_rank`). BM25 would improve precision for keyword-heavy queries.
- **Blocked by:** PostgreSQL 17+ (current: 16.13). pgvector/pgvector Docker image needs PG 17 build.
- **Fix approach:** Wait for pgvector PG17 image, or install `pg_bm25` extension manually.

### INFRA-002: Rotate 54 API tokens
- **Created:** 2026-03-30 08:00 UTC (session 212)
- **Source:** CTX-08 Phase 8.5 (security review)
- **Severity:** LOW (no evidence of leak, files never committed to git)
- **Description:** `import.sql` and `d1-export.sql` contain plaintext API tokens for all 54 migrated users. Files are gitignored and verified never committed. Rotation is precautionary.
- **Fix approach:** `UPDATE users SET api_token = encode(gen_random_bytes(32), 'hex')` for all users. Warning: breaks any user with saved token (MCP connections, API integrations). Coordinate with active users first.

### INFRA-003: NLI sidecar not deployed
- **Created:** 2026-03-28 18:00 UTC (session 204)
- **Source:** CTX-08 Phase 5
- **Severity:** LOW (NLI code exists but container not in docker-compose)
- **Description:** Python NLI sidecar for faithfulness scoring (`src/services/nli.ts`) is implemented but the Docker container is not in production `docker-compose.yml`. NLI requires ~1536MB RAM — server can't fit it (4GB total, 3.7GB used). Code falls back gracefully when sidecar unavailable.
- **Blocked by:** RAM ceiling (4GB). Needs CAX21 upgrade (8GB) to deploy NLI.

---

## Frontend / UX

### UX-001: Pipeline progress UI
- **Created:** 2026-03-27 (CTX-01 close, deferred to backlog)
- **Source:** CTX-01 backlog
- **Severity:** LOW (status page shows stages, but no visual progress bar)
- **Description:** Upload status shows text stages (parse/chunk/embed/index: pending/running/done) but no 4-stage visual progress bar. Users can't see real-time progress during upload processing.
- **Code:** `web/src/pages/Hero.tsx` — current upload flow shows spinner, no stage breakdown.
- **Existing:** `GET /api/status/:documentId` returns `stages[]` with per-stage status and progress percentage.

### UX-002: Document viewer content empty for some docs
- **Created:** 2026-03-27 (CTX-01 close, deferred to backlog)
- **Source:** CTX-01 backlog
- **Severity:** LOW
- **Description:** Document viewer (`web/src/pages/DocumentViewer.tsx`) shows empty content for some documents. Likely related to chunks not being fetched or rendered correctly. `GET /api/documents/:id/content` returns chunks but frontend may not handle all chunk types (image chunks, hierarchical parent chunks).
- **Code:** `web/src/pages/DocumentViewer.tsx`, `web/src/components/DocumentModal.tsx`, `src/routes/documents.ts`

### UX-003: App pages not responsive (mobile/tablet)
- **Created:** 2026-03-27 (CTX-01 close, deferred to backlog)
- **Source:** CTX-01 backlog
- **Severity:** MEDIUM (landing page is responsive, app pages are not)
- **Description:** `Hero.tsx` and `Dashboard.tsx` have 0 responsive breakpoints (`md:` etc.). On mobile, layout breaks. Landing page (`Landing.tsx`) is fully responsive.
- **Code:** `web/src/pages/Hero.tsx` (0 `md:` classes), `web/src/pages/Dashboard.tsx` (0 `md:` classes)

### UX-004: ConnectionModal UX improvements
- **Created:** 2026-03-27 (CTX-01 close, deferred to backlog)
- **Source:** CTX-01 backlog
- **Severity:** LOW
- **Description:** MCP connection modal needs better UX: copy-to-clipboard for connection URL, visual confirmation, instructions for different AI tools (Claude Desktop, ChatGPT, etc.).

---

## GTM / Marketing (open-ended, need users/traffic)

### GTM-001: Landing page copy/design iterations
- **Created:** 2026-03-28 (CTX-08 Phase 6 opened)
- **Source:** CTX-08 Phase 6
- **Description:** Iterate on landing page based on user feedback, conversion data. Current: v1 deployed.

### GTM-002: Product video
- **Created:** 2026-03-28 (CTX-08 Phase 6 opened)
- **Source:** CTX-08 Phase 6
- **Description:** Demo video showing upload → query → MCP flow. Deferred until product is more stable.

### GTM-003: Testimonials collection
- **Created:** 2026-03-28 (CTX-08 Phase 6 opened)
- **Source:** CTX-08 Phase 6
- **Description:** Collect testimonials from Artem (CPO ProxyMarket, demo done) and early users. Need real active users first.

### GTM-004: A/B testing hero variants
- **Created:** 2026-03-28 (CTX-08 Phase 6 opened)
- **Source:** CTX-08 Phase 6
- **Description:** Test different hero copy variants. 5 EN + 5 RU variants written (`contexter-gtm-synthesis-positioning.md`). Need traffic to run meaningful A/B.
