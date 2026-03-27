# Contexter MLP — Final Closure Document

> Generated: 2026-03-27
> Sources audited: CTX-01, CTX-06, CTX-07, ctx07-production-spec.md (1140 lines, 92 issues), contexter-roadmap.md, contexter-about.md, session-scratch.md, BACKEND-PIPELINE-SPEC.md, design system (12 docs + 2 UX files + Pencil), code TODOs (zero found), web research (7 searches)

---

## 1. MLP Definition of Done (from research)

### Framework: MLP = MVP + Delight + Production Readiness

An MLP (Minimum Lovable Product) is the simplest version of a product that:
1. Solves the core problem end-to-end (functional completeness)
2. Delivers a delightful user experience (emotional connection)
3. Is production-grade (safe to run with real users and real data)

### MLP Definition of Done — 7 Pillars

| # | Pillar | Criteria | Source |
|---|---|---|---|
| **1** | **Core Workflow** | Primary user journey works end-to-end without errors. User can complete the main task (upload -> index -> query -> get answer) without hitting dead ends. | Upsilon IT, Elena Verna, Product School |
| **2** | **User Experience** | UI is polished on primary flows. Copy is clear, not jargon. Error states are handled gracefully. Loading states exist. User feels confident, not confused. | Adam Fard, Eleken, UserGuiding |
| **3** | **Security** | No critical or high vulnerabilities. Auth works correctly. User data is isolated. Secrets are not exposed. Input is validated. Rate limiting prevents abuse. | GetDX, Reco.ai, DesignRevision |
| **4** | **Reliability** | System recovers from transient failures (API 429s, timeouts). No silent data corruption. Health checks are accurate. Backups exist. | ActiveWizards RAG Checklist, GoReplay |
| **5** | **Observability** | Structured logging exists. Errors are captured with context. External API failures are distinguishable from app bugs. Basic metrics exist. | NVIDIA RAG Blog, Coralogix |
| **6** | **Performance** | Response times acceptable for the use case (< 500ms for API, < 30s for pipeline). No N+1 queries on hot paths. Resource usage is bounded. | Maruti Tech, ActiveWizards |
| **7** | **Legal / Trust** | Privacy policy exists. Data handling is transparent. User can delete their data. No regulatory blockers for target market. | Orb SaaS Checklist, Scrut Compliance |

### MLP vs MVP vs MMP

| Dimension | MVP | MLP | MMP |
|---|---|---|---|
| Goal | Validate hypothesis | Create love/delight | Generate revenue |
| UX | Functional minimum | Polished primary flows | Full feature set |
| Security | Basic | Production-grade | Enterprise-grade |
| Audience | Early adopters/testers | First real users | Paying customers |
| Billing | None | Optional/freemium | Required |
| Monitoring | Console logs | Structured logging | Full observability stack |

**Contexter targets MLP** — first real users (Artem demo, early adopters), polished primary flow, production-grade security, no billing yet.

---

## 2. Current State Assessment

### What's Done and Working

| Area | Status | Evidence |
|---|---|---|
| **Infrastructure** | Deployed on Hetzner CAX11 | PG+pgvector, Redis, Caddy, Docling, Bun — all healthy |
| **Domain** | `contexter.cc` (frontend), `api.contexter.cc` (backend) | DNS configured via CF |
| **Pipeline** | parse -> chunk -> embed -> index | Async, stage tracking, retry endpoint |
| **RAG Query** | hybrid search (pgvector + tsvector + RRF) -> LLM answer | End-to-end working |
| **MCP** | 12 tools, Streamable HTTP on /sse | Claude.ai connector verified |
| **OAuth 2.1** | /authorize + /token + PKCE + consent page + DCR | For Perplexity/external clients |
| **Frontend** | SolidJS SPA on CF Pages | Interactive blob cluster, connection modal, doc viewer, dashboard |
| **File Formats** | 12 supported | PDF, DOCX, XLSX, PPTX, CSV, JSON, TXT, MD, Images, Audio, Video (audio), YouTube |
| **User Isolation** | pgvector + tsvector filtering by userId | Critical bug from CF Vectorize resolved |
| **Migration** | CF Workers -> Hetzner complete | All 63 CF bindings replaced, PG schema migrated |
| **Audits** | 12-agent audit (92 issues found) | Architect spec (1140 lines) + review (32 additions) |
| **Production Fixes** | WP-1 through WP-6 applied | 60+ fixes, 10/10 E2E smoke test |
| **Design System** | 12 docs + 51 audit criteria + 10 UX flows | Bauhaus/Swiss, verified against RAG |
| **Pricing Model** | Usage-based per-GB, credit system | n=$0.000422, >= 15% margin, 6 tiers |

### Key Metrics

- **E2E tests:** 26/26 pass (CF stack) + 10/10 smoke (Hetzner stack)
- **Unit tests:** 128
- **File formats:** 12
- **MCP tools:** 12
- **Acceptance criteria (CTX-01):** 13/15 met (2 partial)
- **Production spec issues:** 92 found, ~60 fixed in WP-1 through WP-6

---

## 3. Outstanding Items (ALL sources consolidated, deduplicated)

### 3.1 Must-Do (blocks MLP launch)

These items prevent the primary user journey from working or create critical security/data risks.

| # | Item | Source | Priority | Effort |
|---|---|---|---|---|
| 1 | **Frontend deploy with `VITE_API_URL=https://api.contexter.cc`** — CF Pages env var must be set for production build to point to new backend | CTX-07, P0-005, session-scratch | P0 | 10 min |
| 2 | **Verify R2 S3 write works** — R2 token was recreated (session 193) but upload path needs end-to-end verification on production | CTX-07, P0-001 | P0 | 15 min |
| 3 | **Verify Docling parse works end-to-end** — endpoint path fixed (P0-003) but parse quality not compared with Workers AI toMarkdown | CTX-07, session-scratch | P0 | 30 min |
| 4 | **Test all 12 route files on production** — registration, upload, pipeline, query, MCP, OAuth, document viewer, retry, shares, delete | CTX-07 bug fixes list | P0 | 1 hour |
| 5 | **CORS restrict to allowlist** — wildcard CORS + query-param token auth = cross-origin data exfiltration. Architect rated P1, should be P0 for MLP | P3-006 (upgraded), spec gaps | P0 | 15 min |
| 6 | **MCP search_knowledge user scope** — returns ALL users' documents, not just requesting user's | P1-003 | P1 | 30 min |
| 7 | **Registration token leak** — duplicate email returns existing user's plaintext API token | P1-002 | P1 | 15 min |
| 8 | **Dev routes blocked in production** — `/dev/*` has zero auth, exposes all data + env key prefixes | P1-001, NEW-010 | P1 | 10 min |
| 9 | **PKCE plain method rejected** — OAuth 2.1 spec requires S256 only | P1-004 | P1 | 5 min |
| 10 | **Bigint COUNT returns string** — arithmetic bugs in pipeline health, status, document counts (6+ files) | P1-008 | P1 | 30 min |
| 11 | **OAuth /token bypasses CORS** — uses `Response.json()` instead of `c.json()`, breaks browser OAuth flows | P1-009 | P1 | 20 min |
| 12 | **Pipeline resume omits userId in vector metadata** — retried documents have broken user scoping | P1-011 | P1 | 10 min |
| 13 | **Expired share tokens appear valid** — `expires_at` date cast bug | P1-013 | P1 | 10 min |
| 14 | **`.env` file world-readable (644)** — all secrets exposed to any process on host | NEW-001 | P1 | 2 min |
| 15 | **Containers run as root** — RCE via API = root in container | NEW-002 | P1 | 20 min |
| 16 | **OAuth token stored in Redis plaintext** — combined with Redis having no password initially = token harvest. Verify Redis password is working and store only userId in OAuth code | P2-014 (upgraded to P1) | P1 | 20 min |
| 17 | **Frontend shares page crash** — backend returns `shareId`/`createdAt`, frontend expects `id`/`share_token`/`created_at` | P0-004 | P0 | 15 min |
| 18 | **Missing DELETE /api/status/:documentId** — frontend delete button calls nonexistent route | P2-001 | P2 | 15 min |
| 19 | **Missing DELETE /api/documents** — settings "delete all" calls nonexistent route | P2-002 | P2 | 15 min |
| 20 | **Query sources missing document_name** — shows raw documentId instead of filename | P2-012 | P2 | 15 min |
| 21 | **pg_dump backup to R2** — zero backup = total data loss risk on disk failure | NEW-030, CTX-07 | P2 | 1 hour |

**Total Must-Do effort estimate: ~6-8 hours**

### 3.2 Should-Do (quality/polish, not blocking MLP but strongly recommended)

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | OAuth client registration rate limiting (10/IP/hour) | P1-005 |
| 2 | ufw firewall (22/80/443 only) | P1-006 |
| 3 | Redis password verification (was set in session 193, verify persists) | P1-007 |
| 4 | MIME type magic byte validation (file-type package) | P1-012 |
| 5 | mcp.ts legacy route — delete or fix CF bindings pattern | P1-010 |
| 6 | Redis failure graceful degradation (try/catch, fail-open) | P2-008 |
| 7 | Groq LLM retry logic (429 + 500/503) | P2-009 |
| 8 | Docling fetch timeout (90s AbortSignal) | P2-007 |
| 9 | Mobile responsive layout (Dashboard, ConnectionModal, DocumentModal) | P2-013 |
| 10 | PG connection pool timeouts (idle_timeout=30, connect_timeout=10) | P2-015 |
| 11 | JSON.parse(scope) try/catch in 2 locations | P2-016 |
| 12 | Rate limit IP extraction fix (CF-Connecting-IP, not X-Forwarded-For) | P2-017 |
| 13 | MCP redirect_uri validation (HTTPS only) | P2-018 |
| 14 | Shares POST response add `shareUrl` alias | P2-010 |
| 15 | Shares DELETE response add `success: true` | P2-011 |
| 16 | Upload rate limiting (20/user/hour) | NEW-004 |
| 17 | Query rate limiting (60/user/hour) | NEW-005 |
| 18 | Container security (no-new-privileges, CPU limits) | NEW-006 |
| 19 | Zip bomb / decompression bomb protection | NEW-007 |
| 20 | `db: null as any` in Env — latent crash path | NEW-013 |
| 21 | Upload + job creation transactional (orphaned doc prevention) | NEW-014 |
| 22 | Frontend API error body parsing (JSON -> human message) | P3-001 |
| 23 | Dashboard delete uses raw fetch (bypasses 401 handler) | P3-002 |
| 24 | Dead code files (tomarkdown.ts, pdf-visual.ts) -> archive | P3-003 |
| 25 | LLM empty response warning | P3-004 |
| 26 | CORS wildcard in mcp-remote.ts SSE response (second location) | P3-006 spec gap |
| 27 | Jina embed retry for 500/502/503 (not just 429) | P3-008 |
| 28 | ODS format routed to Docling instead of TextParser | P3-009 |
| 29 | Structured request logging (JSON, request ID) | P3-010 |
| 30 | Caddy access logging | P3-011 |
| 31 | Docker log rotation on all services | P3-012 |
| 32 | userId/documentId/shareId length 8 -> 16 chars (collision risk) | P3-013 |
| 33 | Pipeline buffer.buffer safe slice | P3-014 |
| 34 | Env vars validated at startup (with REDIS_URL, BASE_URL added) | P3-015 |
| 35 | Pipeline error full stack trace to jobs table | NEW-026 |
| 36 | Docling OOM prevention (shared models, 1 worker, OMP_THREADS=2) | P2-006 |
| 37 | PG tuning for NVMe (shared_buffers=512MB, work_mem=32MB) | P3-005 |
| 38 | PG indexes on documents.user_id, documents.status, jobs composite | P2-005 |
| 39 | DocumentViewer null-safe date formatting | NEW-019 |
| 40 | Dashboard error state with retry button | NEW-020 |
| 41 | DocumentModal AbortController for stale requests | NEW-021 |

### 3.3 Won't-Do for MLP (deferred to post-launch)

| # | Item | Source | Reason |
|---|---|---|---|
| 1 | BullMQ job queue (replace fire-and-forget) | CTX-07, session-scratch | Major architectural change; fire-and-forget + retry endpoint works for MLP scale |
| 2 | D1 -> PG data migration (existing users) | CTX-07, session-scratch | Only nopoint's test data in D1; new users register on new stack |
| 3 | Video processing (ffmpeg) | CTX-01, CTX-07 | Audio extraction from video is niche; audio upload works |
| 4 | E2E test suite adapted for Hetzner stack | CTX-06, CTX-07 | 10/10 smoke test sufficient for MLP; full Playwright suite is post-launch |
| 5 | Netdata monitoring dashboard | CTX-06, CTX-07 | Docker stats + structured logging sufficient for MLP scale |
| 6 | Batch INSERT for chunks (N+1 fix) | P2-003 | Performance optimization; works correctly at MLP scale |
| 7 | Parallel embed batches | P2-004 | Performance optimization; 1.5s vs 300ms acceptable at MLP scale |
| 8 | Caddy self-signed -> Let's Encrypt | P3-007 | CF Full SSL mode works; Full-Strict not needed for MLP |
| 9 | YouTube parser fragile HTML scraping | P4-003 | Known limitation; "upload transcript" fallback documented |
| 10 | Google + Telegram OAuth | CTX-01, CTX-04 | Token-based auth works; social login is growth feature |
| 11 | RAG quality tuning (query rewriter, domain terms) | CTX-01 roadmap | RAG answers are acceptable; tuning is iterative post-launch |
| 12 | ConnectionModal popup UX improvements | CTX-01 | Functional; UX polish is post-Artem-feedback |
| 13 | Perplexity OAuth e2e verification | CTX-01 | OAuth implemented; Perplexity-specific testing deferred |
| 14 | Responsive mobile/tablet | CTX-01, CTX-02 | Desktop-first MLP; responsive is post-launch |
| 15 | CF Pages custom domain for frontend | CTX-01 | `contexter.cc` already points to CF Pages |
| 16 | Missing Pencil screens (~16 states) | CTX-02 | Design system complete for implemented screens |
| 17 | LemonSqueezy billing integration | Roadmap | MLP is free tier only; billing after user validation |
| 18 | Benchmarks (latency, cost per doc) | CTX-05 | Deferred to post-billing |
| 19 | Document viewer content empty for some docs | CTX-01 AC-12 | Known backend data issue; most docs work |
| 20 | Pipeline progress UI (4-stage progress bar) | CTX-01 | Status API exists; visual progress bar is polish |
| 21 | FTS sanitizeFtsQuery drops CJK/Arabic/Hebrew | P4-001 | Target audience is Russian/English |
| 22 | Duplicated streamToBuffer utility | P4-002 | Code cleanup, not functional |
| 23 | r2_key column rename to storage_key | P4-004 | Cosmetic |
| 24 | RAG token estimation ~30% undercount | P4-005 | Acceptable at MLP scale |
| 25 | PG pool size configurable from env | P4-006 | Hardcoded 10 is fine for CAX11 |
| 26 | Embedder outdated CF Workers comment | P4-007 | Cosmetic |
| 27 | LLM base URL configurable from env | P4-008 | Using Groq only for now |
| 28 | Registration accepts empty email/name | P4-009 | Low risk after P1-002 fix |
| 29 | OAuth consent form hidden fields "undefined" text | NEW-017 | Cosmetic |
| 30 | LLM maxTokens 1024 -> 2048 | NEW-018 | Acceptable for MLP answers |
| 31 | Upload stage status string mapping warns on unknown | NEW-022 | Backend/frontend strings verified |
| 32 | Settings "zapros" usage card hardcoded at 0/100 | NEW-023 | No query counting API exists yet |
| 33 | HNSW index params for 100K+ scale | NEW-024 | Not at scale yet |
| 34 | Upload streaming to R2 (avoid RAM buffering) | NEW-025 | 100MB limit + 4GB RAM sufficient |
| 35 | Error aggregation / alerting | NEW-027 | Pipeline health endpoint sufficient for MLP |
| 36 | Pipeline latency metrics (p50/p95/p99) | NEW-028 | Post-launch optimization |
| 37 | Groq/Jina API call logging | NEW-029 | Structured request logging covers basics |
| 38 | UDP receive buffer for QUIC/H3 | NEW-031 | Cosmetic performance |
| 39 | Caddy format warning | NEW-032 | Cosmetic |
| 40 | PG SSL between containers | NEW-008 | Single-host Docker bridge, accepted risk |
| 41 | MCP tools/list without auth | NEW-009 | Tool names are public API surface |
| 42 | R2 storage key filename sanitization | NEW-011 | Low risk with encodeURIComponent |
| 43 | esbuild CVE in dev dependencies | NEW-012 | Dev-only, not production |
| 44 | Pipeline cancel on doc delete mid-pipeline | NEW-015 | FK violation safely caught |
| 45 | retry.ts malformed JSON body handling | NEW-016 | Falls through to auto-detect |
| 46 | Hero copy (AI chat badges) | CTX-03 | Polish |
| 47 | Seamless auth UX | CTX-03 | Post-launch iteration |
| 48 | Breuer/Albers design verification | CTX-03 | Design coach pass deferred |

---

## 4. MLP Acceptance Checklist

### Pillar 1: Core Workflow

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1.1 | User can register and get API token | Needs verification on prod | Must-Do #4 |
| 1.2 | User can upload file (PDF, DOCX, TXT at minimum) | Needs verification (R2 + Docling) | Must-Do #2, #3 |
| 1.3 | Pipeline completes (parse -> chunk -> embed -> index) | Needs verification | Must-Do #4 |
| 1.4 | User can query and get answer with sources | Needs verification | Must-Do #4 |
| 1.5 | MCP endpoint works with Claude.ai | Verified on CF stack; needs retest on Hetzner | Must-Do #4 |
| 1.6 | User can delete their documents | **BLOCKED** — route missing | Must-Do #18, #19 |
| 1.7 | User can create/view/delete share links | **BLOCKED** — frontend crash | Must-Do #17 |
| 1.8 | Frontend points to production backend | **BLOCKED** — needs env var deploy | Must-Do #1 |

### Pillar 2: User Experience

| # | Criterion | Status | Gap |
|---|---|---|---|
| 2.1 | Copy is clear, no jargon | PASS (28+ text edits applied in session 190) | — |
| 2.2 | Loading states exist for async operations | PASS (pipeline stages, skeleton) | — |
| 2.3 | Error messages are human-readable | Partial (raw JSON in some toasts) | Should-Do #22 |
| 2.4 | Primary flow works on desktop (1280px+) | PASS | — |
| 2.5 | Interactive hero creates positive impression | PASS (SVG blob cluster) | — |
| 2.6 | Query sources show filenames, not IDs | **BLOCKED** — missing document_name | Must-Do #20 |

### Pillar 3: Security

| # | Criterion | Status | Gap |
|---|---|---|---|
| 3.1 | User data isolated (can't see other users' docs) | **BROKEN** in MCP search_knowledge | Must-Do #6 |
| 3.2 | Auth tokens not leaked | **BROKEN** on duplicate registration | Must-Do #7 |
| 3.3 | Dev/debug routes blocked in production | **BROKEN** | Must-Do #8 |
| 3.4 | CORS restricts origins | **BROKEN** — wildcard | Must-Do #5 |
| 3.5 | Secrets file permissions correct | **BROKEN** — 644 | Must-Do #14 |
| 3.6 | OAuth follows spec (S256, no plain) | **BROKEN** | Must-Do #9 |
| 3.7 | Expired tokens are rejected | **BROKEN** — date cast bug | Must-Do #13 |
| 3.8 | No root container processes | **BROKEN** | Must-Do #15 |
| 3.9 | No plaintext tokens in Redis | **BROKEN** | Must-Do #16 |

### Pillar 4: Reliability

| # | Criterion | Status | Gap |
|---|---|---|---|
| 4.1 | Health check is accurate | Needs verification (P0-002 fix applied) | Must-Do #4 |
| 4.2 | Pipeline retry works from failed stage | Needs verification | Must-Do #4 |
| 4.3 | Resume preserves user scoping | **BROKEN** — missing userId in metadata | Must-Do #12 |
| 4.4 | Database backup exists | **MISSING** | Must-Do #21 |
| 4.5 | Transient API failures are retried | Partial (embedder yes, LLM no) | Should-Do #7 |

### Pillar 5: Observability

| # | Criterion | Status | Gap |
|---|---|---|---|
| 5.1 | Structured request logging | Not implemented | Should-Do #29 |
| 5.2 | Error context captured | Partial (console.error only) | Should-Do #35 |
| 5.3 | Basic health endpoint | PASS | — |

### Pillar 6: Performance

| # | Criterion | Status | Gap |
|---|---|---|---|
| 6.1 | API response < 500ms | Needs measurement | — |
| 6.2 | Pipeline completes in reasonable time | Needs measurement | — |
| 6.3 | Counts are accurate numbers (not strings) | **BROKEN** — bigint concatenation | Must-Do #10 |

### Pillar 7: Legal / Trust

| # | Criterion | Status | Gap |
|---|---|---|---|
| 7.1 | Trust footer visible | PASS (CF Europe, no AI training, delete anytime) | — |
| 7.2 | User can delete all data | **BLOCKED** — route missing | Must-Do #18, #19 |
| 7.3 | Privacy policy page | Not checked — may need creation | Potential gap |

---

## 5. Verdict: NOT READY

### Summary

Contexter has achieved approximately **80% MLP completion**. The infrastructure migration is done, the pipeline works, the frontend is deployed, and 60+ production fixes have been applied. However, **9 security items are broken**, **3 core workflow items are blocked**, and **database backups don't exist**.

### Critical Gaps (in order of severity)

1. **Security (Pillar 3):** 9 out of 9 criteria have issues. CORS wildcard, MCP user scope bypass, token leak on registration, dev routes exposed, .env world-readable, containers running as root, expired tokens accepted, OAuth plain PKCE accepted, tokens stored plaintext in Redis. This is the primary blocker.

2. **Core Workflow (Pillar 1):** Frontend not deployed with correct API URL. Delete routes missing. Shares page crashes. Query sources show IDs not names. These are 4 user-facing broken flows.

3. **Reliability (Pillar 4):** No database backup. Pipeline resume breaks user scoping. These create data loss and data leak risks.

4. **Data Integrity (Pillar 6):** Bigint COUNT string concatenation produces incorrect numbers in 6+ files.

### Estimated Work to MLP Ready

| Category | Items | Effort |
|---|---|---|
| Must-Do fixes | 21 items | 6-8 hours |
| Should-Do (recommended before launch) | Top 10 items | 4-6 hours |
| End-to-end verification | Full CJM walkthrough | 2-3 hours |
| **Total** | | **12-17 hours** (~2 working days) |

### Recommended Sequence

```
Day 1 (8 hours):
  1. Must-Do #14: chmod 600 .env                           [2 min]
  2. Must-Do #15: non-root containers                      [20 min]
  3. Must-Do #5: CORS allowlist (both index.ts + SSE)      [15 min]
  4. Must-Do #8: dev routes blocked in prod                [10 min]
  5. Must-Do #7: registration token leak fix               [15 min]
  6. Must-Do #6: MCP search_knowledge user scope           [30 min]
  7. Must-Do #9: PKCE S256 only                            [5 min]
  8. Must-Do #13: expires_at date cast                     [10 min]
  9. Must-Do #16: OAuth code — store userId only           [20 min]
  10. Must-Do #10: COUNT(*)::int everywhere                [30 min]
  11. Must-Do #11: OAuth /token c.json()                   [20 min]
  12. Must-Do #12: pipeline resume userId                  [10 min]
  13. Must-Do #17: shares response field mapping           [15 min]
  14. Must-Do #18: DELETE /api/status/:id route             [15 min]
  15. Must-Do #19: DELETE /api/documents route              [15 min]
  16. Must-Do #20: query sources document_name             [15 min]
  17. Must-Do #1: frontend deploy with VITE_API_URL        [10 min]

Day 2 (4-6 hours):
  18. Must-Do #2: verify R2 write end-to-end               [15 min]
  19. Must-Do #3: verify Docling parse quality              [30 min]
  20. Must-Do #4: test all 12 routes on production         [1 hour]
  21. Must-Do #21: pg_dump cron backup to R2               [1 hour]
  22. Top Should-Do items (rate limiting, Redis resilience) [2-3 hours]
  23. Final CJM walkthrough (10-step smoke test from spec) [1 hour]
```

After Day 2 completion: **MLP READY** for Artem demo and first users.

---

## Appendix: Source Cross-Reference

| Source Document | Items Extracted |
|---|---|
| `contexter-mvp.md` (CTX-01) | 8 remaining tasks, 3 blockers, 2 partial ACs |
| `contexter-migration.md` (CTX-06) | CLOSED — all phases completed per session-scratch |
| `contexter-production.md` (CTX-07) | 12 bug fixes, 5 CTX-01 deferred, 7 CTX-06 deferred, 6 production requirements |
| `ctx07-production-spec.md` | 60 original issues (P0-P4) + 32 architect additions = 92 total |
| `contexter-roadmap.md` (L2) | CTX-04 (OAuth), CTX-05 (Benchmarks) planned; CTX-02/CTX-03 incomplete items |
| `contexter-about.md` (L1) | Active L3 status, stack reference |
| `session-scratch.md` | 6 open items: BullMQ, D1 migration, ffmpeg, frontend deploy, Docling quality, monitoring |
| `BACKEND-PIPELINE-SPEC.md` | Historical — all items implemented (async pipeline, stage tracking, retry) |
| Design system (12 docs) | No outstanding items in design docs |
| Code TODOs (src/ + web/src/) | Zero TODO/FIXME/HACK/XXX found in codebase |
