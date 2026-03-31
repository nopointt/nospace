# Contexter Chronicle
> Working set. Append-only.

<!-- ENTRY:2026-03-21:CHECKPOINT:180:contexter:contexter-mvp [AXIS] -->
## 2026-03-21 — checkpoint 180 [Axis]

**Project created.** Contexter = RAG-as-a-service, evolved from Harkly MVP data layer.

Full pipeline implemented: 12 parsers → 3 chunking strategies → Jina v4 embeddings → Vectorize + FTS5 hybrid search → RAG query with rewrite.

Deployed to CF Workers: contexter.nopoint.workers.dev. MCP connected to Claude.ai. User isolation + sharing working.

Design system: 12 MD docs + 14 Pencil frames. Swiss/Bauhaus identity. Needs visualization quality rework.

128 unit tests, 0 fail. 13/14 e2e tests pass.

<!-- ENTRY:2026-03-22:CLOSE:183:contexter:contexter-mvp [AXIS] -->
## 2026-03-22 — сессия 183 CLOSE [Axis]

**Decisions:**
- 45/45 screen states = full atomic actions map coverage
- JTBD final: J1=upload, J2=API/connect, J6=query UI (tertiary)
- D-03 cancelled, all 30 design fixes applied
- 8 skill fixes for contexter project support

**Files changed:**
- `design/contexter/contexter-ui.pen` — 45 screen states
- `design/contexter/foundations/philosophy.md` — Raw→Structured duality
- `design/contexter/guidelines/layout.md` — wireframes updated
- `design/contexter/ux/atomic-actions-map.md` — 10 flows, 45 actions
- `design/contexter/ux/design-audit-criteria.md` — 32 criteria
- `~/.claude/commands/{start,close,continue,checkpoint}axis.md` — contexter support

**Completed:**
- 45/45 screen states, 30/30 fixes, 8/8 skill fixes, design audit + JTBD

**Opened:**
- CTX-03: Frontend implementation
- RAG quality tuning, FTS5 prod reset

<!-- ENTRY:2026-03-22:CLOSE:185:contexter:contexter-mvp [AXIS] -->
## 2026-03-22 — сессия 185 CLOSE [Axis]

**Decisions:**
- Nav refactored to 3 reusable components: Nav/Hero (r9v70), Nav/App (Ya5Gk), Nav/Skeleton (RdvbP)
- All 45 nav instances replaced with refs → single source of truth
- Desktop-First, Mobile-Responsive strategy (evidence-based, 200+ sources)
- Bottom tab bar for mobile nav (4 tabs: Docs, Query, Upload, Profile)
- Phone = Query + Upload + Docs only; API/Settings = desktop-only
- Bauhaus P-28/P-10/P-06/P-11 applied to responsive philosophy

**Files changed:**
- `design/contexter/contexter-ui.pen` — 3 Nav components, 45 refs
- `docs/research/` — 7 research files (~160KB, 300+ sources)

**Completed:**
- Nav → reusable component refactor (3 components, 45 refs)
- Stage 1 responsive research (6 Opus agents, 200+ searches)
- Master synthesis with strategic decisions

**Opened:**
- Stage 2: Content architecture (45 screens → 3 devices)
- Stage 3: Pencil mobile (360px) + tablet (768px) design
<!-- ENTRY:2026-03-22:CLOSE:186:contexter:none [LOGOS] -->
## 2026-03-22 — сессия 186 CLOSE [Logos]

**Decisions:**
- Full nospace workspace restructuring audit (admin domain, not contexter-specific)
- 26 structural improvements proposed in 4 phases (admin/action-plan-final.md)
- 4 Logos skills unified with Axis logic (start/close/checkpoint/continue)
- logos-active: contexter preserved as last project

**Files changed:**
- `admin/` — 11 files (4,213 lines): index, audits, plans
- `docs/research/` — 5 research reports (3,627 lines, 150+ sources)
- `~/.claude/commands/{startlogos,closelogos,checkpointlogos,continuelogos}.md` — unified with Axis

**Completed:**
- Full nospace directory scan (21,371 files)
- 5 web research + 6 directory audits (parallel agents)
- Final restructuring action plan
- Logos skill unification

**Opened:**
- Phase 1-4 restructuring execution (pending nopoint approval)

**Notes:**
- Session invoked as /startlogos, work was Orchestrator-level admin
- No contexter code/DB changes
- Key finding: 8,886 tokens/prompt always-loaded, 14,892 tokens /startgsession

<!-- ENTRY:2026-03-24:CLOSE:188:contexter:contexter-mvp [AXIS] -->
## 2026-03-24 — сессия 188 CLOSE [Axis]

**Summary:** Frontend SPA + async pipeline + user isolation + production deploy. 7 Bauhaus Eidolons created. 62/62 E2E tests pass.

**Completed:** Frontend (CF Pages), Backend async pipeline (CF Workers), Pencil recovery (31 nodes), Bauhaus Team (7 agents), E2E tests (62 pass), user isolation (Vectorize + FTS5).

**Opened:** Document viewer, hero copy, auth UX, OAuth, RAG quality, verification passes, responsive.

# session-scratch.md
> Active · Axis · 2026-03-24

<!-- ENTRY:2026-03-24:CHECKPOINT:189:contexter:contexter-mvp [AXIS] -->
## 2026-03-24 — checkpoint 189 [Axis]

**Decisions:**
- Landing page: single-scroll layout (5 sections: hero → dropzone → files → dashboard → connection)
- Typography: Inter (body) + JetBrains Mono (code only) — away from full mono
- Client list finalized: ChatGPT, Claude.ai, Claude Desktop, Perplexity, Cursor
- Copy: "нейросети" for mass audience, specific names in badges/popups
- ConnectionModal: dark Bauhaus modal with tabs per client, 3 steps each
- Claude.ai real flow: Settings → Connectors → Add custom connector (not Projects)
- Auth-gated badges: click → register first → then show modal with real token
- MCP endpoint: POST responses in SSE format + Mcp-Session-Id header (spec compliance)
- RAG context enrichment: document metadata always included for meta-questions
- Embedder retry: exponential backoff on Jina 429 (mass upload support)
- Text contrast: text-tertiary #808080→#666666, text-disabled #CCC→#999

**Files changed:**
- `web/src/pages/Hero.tsx` — full restructure: 5 sections, badges, new copy "нейросети"
- `web/src/components/ConnectionModal.tsx` — NEW: dark modal, 5 client tabs, instructions
- `web/src/components/Nav.tsx` — avatar + Inter font + "подключение"→/api
- `web/src/components/Input.tsx` — placeholder contrast fix
- `web/src/index.css` — Inter font added, text-tertiary/disabled contrast bump
- `src/services/embedder/index.ts` — retry with exponential backoff on 429
- `src/services/rag/index.ts` — docsMeta context enrichment
- `src/routes/status.ts` — chunk count in list endpoint (subquery)
- `src/routes/query.ts` — passes docsMeta to RAG
- `src/routes/mcp-remote.ts` — SSE POST responses + Mcp-Session-Id + spec compliance
- `nospace/docs/research/contexter-mcp-connection-instructions.md` — NEW: Opus research
- `nospace/docs/research/mcp-streamable-http-compliance.md` — NEW: Opus MCP spec research
- Pencil: 3 ConnectionModal screens (Claude Desktop, ChatGPT, Claude.ai)
- Memory: ideas_ux_obvious_gaps.md — UX idea about dev blind spots

**Completed:**
- Landing page restructure (5 sections)
- Black dropzone design
- Dashboard section with real data (chunk count fix)
- Connection section with MCP setup
- Inter font (Bauhaus typography)
- Avatar in nav
- ConnectionModal (5 clients, auth-gated)
- Gropius visual audit + all CRITICAL/HIGH fixes
- Moholy E2E: 24/26 pass
- Embedder retry (429 handling)
- RAG meta-questions fix
- MCP SSE format compliance
- Instagram PDF retry (Jina 429 recovery)
- 3 Pencil screens designed

<!-- ENTRY:2026-03-25:CLOSE:190:contexter:contexter-mvp [AXIS] -->
## 2026-03-25 — сессия 190 CLOSE [Axis]

**Decisions:**
- SVG blob cluster replaces knowledge graph — feGaussianBlur + feColorMatrix goo filter
- Proximity-based radial gradient: focal point always at blob edge, gradient fills on approach
- Idle floating animation: Der Kreisel (Bauhaus), harmonic 2:3/3:2 ratios, per-blob personality
- Parallax on cursor movement (global window listener)
- Organic edge wobble via feTurbulence + feDisplacementMap
- 30% cursor repulsion (blobs shy away)
- Real SVG logos from simple-icons (ChatGPT flower, Claude sparkle, Perplexity P, Cursor diamond)
- Full OAuth 2.1 server for Perplexity (authorize + token + PKCE + consent page)
- DocumentModal popup replaces separate page navigation
- Pre-qualification screen in ConnectionModal ("какую нейросеть используете?")
- Pipeline stage timeout (parse 25s, chunk 5s, embed 25s, index 20s)
- Registration rate limit (5/hour per IP) + email deduplication
- Vectorize post-query filtering (metadata index not available on CF)
- Copy: "вы загружаете файлы — мы открываем их для всех нейросетей"

**Files changed (50+ files this session):**
- `web/src/components/KnowledgeGraph.tsx` — REWRITTEN 4x: canvas graph → SVG blobs → goo filter → floating + parallax + wobble + logos
- `web/src/components/ConnectionModal.tsx` — pre-qualification screen, real client instructions, dejargoned
- `web/src/components/DocumentModal.tsx` — NEW: popup document viewer
- `web/src/pages/Hero.tsx` — blob cluster, trust footer, elevated query, "выбрать файлы" button, pipeline stages RU, copy rewrites
- `web/src/pages/Dashboard.tsx` — font-sans, dejargoned, doc modal integration
- `web/src/pages/ApiPage.tsx` — 28 text edits, full dejargon
- `web/src/pages/Settings.tsx` — dejargon, spinner fix
- `web/src/pages/DocumentViewer.tsx` — NEW page (route preserved)
- `web/src/lib/api.ts` — getDocumentContent, null-safe mappers, 401 auto-logout
- `web/src/components/Nav.tsx` — onLogin prop, correct routes
- `web/src/components/PipelineIndicator.tsx` — Russian stage labels
- `web/index.html` — favicon SVG []
- `web/public/favicon.svg` — NEW
- `src/routes/auth.ts` — rate limit, email dedup, input validation
- `src/routes/oauth.ts` — NEW: full OAuth 2.1 (authorize + token + PKCE)
- `src/routes/documents.ts` — NEW: GET /api/documents/:id/content
- `src/routes/pipeline.ts` — NEW: GET /api/pipeline/health
- `src/routes/mcp-remote.ts` — SSE format, client/register, GET→redirect
- `src/routes/upload.ts` — content-type guard
- `src/services/pipeline.ts` — stage timeouts, error handling
- `src/services/embedder/index.ts` — retry 5→3, max delay 4s, AbortSignal
- `src/services/vectorstore/vector.ts` — post-query userId filtering
- `src/index.ts` — OAuth routes, .well-known metadata, /register endpoint

**Research files created:**
- `docs/research/contexter-silicon-sampling.md` — 20 persona × 5 task simulation
- `docs/research/contexter-copy-audit.md` — full text audit
- `docs/research/contexter-ux-audit.md` — user journey mapping
- `docs/research/metaball-2d-canvas-research.md` — SVG/Canvas metaball techniques
- `docs/research/contexter-mcp-connection-instructions.md` — connection guides per client

**Completed:**
- 4 full audits (Gropius visual, Copy, UX flow, Schlemmer API) — ALL applied
- Silicon Sampling: 20 personas, 100 interactions, 10 actionable findings
- SVG blob cluster with proximity gradient, floating, parallax, wobble, logos
- Pre-qualification ConnectionModal
- Document viewer (popup modal)
- "выбрать файлы" button in drop zone
- Pipeline stages translated to Russian
- Trust footer
- Elevated post-upload query section
- Registration security (rate limit + email dedup + validation)
- Pipeline error handling (stage timeouts, stuck detection)
- Vectorize userId post-query filtering (critical bug fix)
- OAuth 2.1 server (authorize + token + PKCE) for Perplexity
- Favicon []
- 401 auto-logout
- E2E 26/26 pass (Moholy rerun)
- ~30 deploys this session

**Opened:**
- Document viewer shows empty for some docs (backend returns incomplete data)
- Pipeline progress UI redesign (4-stage progress bar with dots + lines)
- Perplexity OAuth flow testing (consent page deployed, needs e2e verification)
- Hero block height optimization
- Responsive design (mobile/tablet) — deferred to after Artem usability test
- Google + Telegram OAuth — deferred

**Notes:**
- Massive session: 8+ hours, 30+ deploys, 20+ agents launched
- nopoint gave carte blanche on agents (10 Opus + 10 Sonnet limit)
- Bauhaus RAG actively consulted for motion/physics decisions
- feedback_preserve_agent_context.md saved — don't destroy agent context without asking
- Production: https://contexter-web.pages.dev + https://contexter.nopoint.workers.dev
<!-- ENTRY:2026-03-25:CLOSE:191:contexter:contexter-mvp [AXIS] -->
## 2026-03-25 — session 191 CLOSE [Axis]

**Decisions:**
- Production stack: Hetzner CAX41 + Qdrant + Postgres + DeepInfra + Groq ($117/mo for 10K users)
- Pricing: n=$0.000422, 6 tiers monthly + annual (10-35% discounts), >=15% margin at any volume
- Free tier: 100 slots, 12h inactivity releases slot, 7d zero tier, then data deleted
- Embeddings: Jina v4 primary, Voyage multimodal-3 fallback
- Billing: LemonSqueezy (prepaid + metered)

**Completed:**
- Antigravity IDE: blob + modal + instructions + deployed to CF Pages
- Capacity analysis (10K users), production stack decision
- Full pricing model (Python-verified, 4 scripts, P&L, competitor research)
- 12 MCP tools live (7 new: delete, content, ask, stats, share, summarize, rename)
- waitUntil bug fix, account dedup (7 merged + UNIQUE index)

**Opened:**
- Hetzner migration, LemonSqueezy billing, ConnectionModal UX, pipeline progress UI
<!-- ENTRY:[2026-03-27]:CLOSE:193:contexter:contexter-production [AXIS] -->
## 2026-03-27 — сессия 193 CLOSE [Axis]

Full Hetzner migration + production hardening session. CAX11 €4.72/mo. 63 CF bindings replaced. 12-agent audit → 92 issues → 85+ fixed. BullMQ, video, Netdata, D1 migration done. 17/17 routes verified. MLP ~95% ready.
<!-- ENTRY:2026-03-28:CLOSE:195:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 195 CLOSE [Axis]

CTX-01+CTX-07 closed (MLP COMPLETE). CTX-08 GTM created. Full competitive research (14 files, 6 deep dives). Product brief written. Landing page designed in Pencil + implemented in SolidJS + deployed to contexter.cc. Positioning: "One memory. Every AI." Non-tech audience. Key competitor: Supermemory. pg_dump backup cron + 8 production fixes deployed.
<!-- ENTRY:2026-03-28:CLOSE:198:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 198 CLOSE [Axis]

**Decisions:**
- NOWPayments for crypto billing (LS blocked without KYB)
- Invoice-based subscriptions, flat tiers ($9/$29/$79)
- Google OAuth (Telegram deferred)
- 6-layer deep research framework created
- 19 deep research studies completed for 32 planned features
- Remizov ODE: no RAG breakthrough (honest assessment)
- Critical RRF threshold bug found (0.3 vs max ~0.033)

**Completed:**
- Billing: NOWPayments setup + backend + webhook + deploy
- Auth: Google OAuth full flow in production
- Email: nopoint@contexter.cc (CF Email Routing)
- UI: App page restructure (5 sections)
- Research: 19/19 deep research studies, SOTA audit, competitor sentiment

**Opened:**
- Write implementation plan (prioritize 32 features into phases)
- Fix critical RRF threshold bug (immediate)
- Implement Phase 1 quick wins
- Telegram Login (deferred)
- Card payments (blocked — no KYB)
<!-- ENTRY:2026-03-28:CLOSE:201:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — session 201 CLOSE [Axis]

**Decisions:**
- Pre-implementation spec review: Opus reviewed all 10 specs against full source code
- 2 CRITICAL + 5 HIGH issues found and fixed in specs
- 4-wave implementation plan (19 G3 pairs)
- Wave 1E (F-011) completed: structure-aware chunking + late chunking

**Files changed:**
- `specs/spec-review.md` — created
- 4 spec files fixed (chunking, confidence-nli, query-enhance, infra)
- 5 source files modified by Wave 1E (chunker + embedder + pipeline)

**Completed:**
- Spec review, spec fixes, F-011 implementation

**Opened:**
- Wave 1A/B/C/D relaunch needed (permissions), Waves 2-4 pending
<!-- ENTRY:2026-03-28:CLOSE:204:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 204 CLOSE [Axis]

**Decisions:**
- rag/index.ts serialized across 3 agents (Mies C → B-fix → G-fix) to prevent collisions
- F-012/014/015/016 fully re-implemented from scratch (git stash pop failure lost Wave 2 work)
- resolveParents (F-017 parent fetch) bundled into G-fix to avoid additional rag/index.ts touch
- F-028 is semantic dedup at ingest (spec-embeddings.md), not A/B eval
- Session stopped at nopoint request: no new agents after 5 active, let current finish, then close

**Files changed:**
- `src/services/llm.ts` — F-012/014/015/016 full rewrite (LlmProviderConfig, chatStream, cache_control, DeepInfra)
- `src/services/rag/index.ts` — F-008 MMR + F-010 reranker + F-013 timing + F-014 queryStream + F-015 llmAnswer + F-017 resolveParents (305 lines)
- `src/routes/query.ts` — F-010 RerankerService + F-014 /api/query/stream SSE + F-015 buildLlmServices (291 lines)
- `src/services/rag/context.ts` — F-008 MMR rewrite (Map<docId,count>)
- `src/services/rag/types.ts` — MMR_MAX_CHUNKS_PER_DOCUMENT + RagStreamEvent union
- `src/services/vectorstore/index.ts` — F-017 fetchParentsForChildren + F-030 feedback_score multiplier
- `src/services/vectorstore/types.ts` — chunkType/parentId in VectorMetadata + ParentRow
- `src/services/embedder/cache.ts` — F-009 CachedEmbedderService (new)
- `src/services/embedder/dedup.ts` — F-028 findNearDuplicate (new)
- `src/services/chunker/contextual.ts` — F-020 addContextualPrefixes (new)
- `src/services/chunker/` (types/hierarchical/index/semantic/table/timestamp) — F-017 chunkType:"flat"
- `src/services/parsers/mistral-ocr.ts` — F-024 MistralOcrService (new)
- `src/services/parsers/docling.ts` — F-024 Mistral OCR fallback
- `src/services/evaluation/proxy.ts` — F-013 proxy metrics (new)
- `src/services/evaluation/llm-eval.ts` — F-031 LLM eval worker (new)
- `src/services/resilience.ts` — F-022 circuit breakers (new)
- `src/services/feedback-decay.ts` — F-030 decay cron (new)
- `src/services/pipeline.ts` — F-009 cache wrap + F-020 contextual prefix + F-028 dedup split
- `src/services/reranker.ts` — F-010 reranker (new, prior session)
- `src/routes/feedback.ts` — F-030 POST /api/feedback (new)
- `src/routes/metrics.ts` — F-013 GET /api/metrics (new)
- `src/routes/maintenance.ts` — F-013 retention cron (new)
- `src/routes/dev.ts` + `src/routes/mcp-remote.ts` — LlmService call site fixes
- `src/db/schema.ts` — F-017 + F-020 + F-024/F-030 + F-028 columns
- `src/types/env.ts` — DEEPINFRA_API_KEY, GROQ_REWRITE_MODEL, GROQ_ANSWER_MODEL, MISTRAL_API_KEY, OCR_CLOUD_FALLBACK_ENABLED
- `drizzle-pg/0005_reduce_embedding_dims.sql` — F-006 renamed from 0008
- `drizzle-pg/0006_eval_metrics.sql` — F-013 (new)
- `drizzle-pg/0007_parent_child_chunks.sql` — F-017 (new)
- `drizzle-pg/0008_contextual_prefix.sql` — F-020 (new)
- `drizzle-pg/0009_semantic_dedup.sql` — F-028 (new)
- `drizzle-pg/0010_feedback_scoring.sql` — F-030 (new)
- `docker/docling/Dockerfile` — F-023 tesseract OCR
- `evaluation/run-eval.ts` + `generate-synthetic.ts` + `check-stale.ts` — F-032 (new)
- `.github/workflows/eval.yml` — F-032 CI (new)
- `src/services/rag/citations.ts` — F-004 (new, prior session)
- `src/services/vectorstore/hybrid.ts` — F-007 convex fusion (prior session)

**Completed:**
- F-001 F-002 F-003 F-004 F-005 F-006 F-007 F-008 F-009 F-010 F-011 F-013 F-017 F-020 F-021 F-022 F-023 F-024 F-028 F-030 F-031 F-032
- F-012/014/015/016 implemented (Mies G-fix) — unverified

**Opened:**
- Schlemmer G2: verify F-012/014/015/016 + resolveParents
- Mies K: F-018 HyDE + F-019 query decomposition
- Mies M: F-025 NLI + F-026 confidence scoring
- Mies R: F-027 source attribution
- F-029 BM25 (conditional)
- F-033 eval dashboard (after F-032)
- F-031 query.ts sampling enqueue (collision-blocked)
- vectorstore/index.ts:80-84 immutability fix (F-030 MEDIUM)
- dist/index.js stale → build + deploy to Hetzner
- JINA_DIMENSIONS 1024 stale in types.ts (F-006 schema comment)

**Notes:**
- 22 of 33 features fully verified PASS; 4 implemented but unverified (F-012/014/015/016); 7 not started (F-018/019/025/026/027/029/033)
- Migration sequence 0000-0010 complete and gap-free
- Next session: start with Schlemmer G2, then Mies K + Mies M in parallel
<!-- ENTRY:2026-03-28:CLOSE:205:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — session 205 CLOSE [Axis]

**Decisions:**
- CC fusion replaces RRF, BPE tokenizer, FTS multilingual, embeddings 1024→512
- 5-domain professional review (102 findings), 78 fixed, all CRITICAL/HIGH closed
- NLI sidecar (HHEM-2.1-Open) created, drift detection with persistent projection matrix

**Completed:**
- 32/33 RAG features implemented
- 78/102 review findings fixed
- Full security hardening pass

**Opened:**
- ~12 MEDIUM/LOW fixes remaining
- Deploy to production (migrations + re-embed + NLI sidecar)
- F-029 BM25 (blocked: PG 17+)
<!-- ENTRY:2026-03-28:CLOSE:206:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 206 CLOSE [Axis]

**Decisions:**
- F-031 sampling enqueue wired in query.ts batch endpoint (10% default)
- Added context to rag.query() main return path
- .sort() → .toSorted() in vectorstore (immutability)
- JINA_DIMENSIONS 512 confirmed = DB vector(512)
- cockatiel added to package.json (missing dep)
- Capitalization audit: 9/12 frontend files fixed

**Files changed:**
- `src/services/rag/index.ts` — context in main return
- `src/routes/query.ts` — F-031 sampling enqueue
- `src/services/vectorstore/index.ts` — .toSorted()
- `src/services/embedder/types.ts` — comment update
- `package.json` — cockatiel dep
- `web/src/components/AuthModal.tsx` — caps
- `web/src/components/DataTable.tsx` — caps
- `web/src/components/DocumentModal.tsx` — caps
- `web/src/components/DropZone.tsx` — caps
- `web/src/pages/Settings.tsx` — caps + removed CSS lowercase
- `web/src/pages/Dashboard.tsx` — caps
- `web/src/pages/Hero.tsx` — caps
- `web/src/pages/DocumentViewer.tsx` — caps
- `web/src/pages/ApiPage.tsx` — caps + removed CSS lowercase
- `web/src/components/ConnectionModal.tsx` — 1/20 caps
- `memory/contexter-about.md` — dims 1024→512
- `memory/contexter-gtm.md` — 4 tasks marked done

**Completed:**
- F-031 enqueue, vectorstore immutability, JINA_DIMENSIONS, cockatiel dep, deploy (health green)
- Capitalization 9/12 files

**Opened:**
- ConnectionModal.tsx caps (~20), Landing.tsx caps (~6), Upload.tsx caps (unchecked)
<!-- ENTRY:2026-03-29:CLOSE:207:contexter:contexter-gtm [AXIS] -->
## 2026-03-29 — сессия 207 CLOSE [Axis]

**Decisions:**
- Capitalization audit pattern: fix text strings directly, keep CSS `uppercase` on small labels (matches Settings/ApiPage pattern)
- Production deploy target: `--project-name=contexter-web` (contexter.cc), NOT `contexter-landing`

**Files changed:**
- `web/src/components/ConnectionModal.tsx` — 2 caps fixes ("от Anthropic" → "От Anthropic", "вставьте URL" → "Вставьте URL")
- `web/src/pages/Landing.tsx` — 1 caps fix ("пдф" → "PDF")
- `web/src/pages/Upload.tsx` — 3 caps fixes ("youtube:" → "YouTube:", "url:" → "URL:", "текст" → "Текст")

**Completed:**
- Capitalization audit 12/12 frontend files (final 3 files done)
- Build + deploy to contexter.cc (contexter-web CF Pages)

**Opened:**
- Nothing new

**Notes:**
- Session 206 estimated ~20 caps for ConnectionModal, ~6 for Landing, unchecked for Upload — actual counts were 2, 1, 3 respectively
<!-- ENTRY:2026-03-29:CLOSE:208:contexter:contexter-gtm [AXIS] -->
## 2026-03-29 — сессия 208 CLOSE [Axis]

Presigned R2 upload + audio segmentation + PDF image extraction + multimodal embed. All code written, deployed. Pipeline crashes Bun — needs diagnosis next session. GROQ URL fix applied. DB migrations 0005-0011 applied. E2E tests written (17 suites) but blocked by pipeline crash.

<!-- ENTRY:2026-03-29:CLOSE:209:contexter:contexter-gtm [AXIS] -->
## 2026-03-29 — сессия 209 CLOSE [Axis]

**CRITICAL FIX: Pipeline infinite loop.** Root cause: regex `/^.*$/gm` in `buildHeadingEvents()` (semantic.ts) hangs on trailing `\n` in Bun's JSC. Fix: `text.split("\n")` + `for...of`. Also fixed: GROQ_LLM_URL env, Jina timeout 10→30s, contextual prefix truncation 12K→4K.

**E2E: 42/50 tests pass.** Suites 1-6 all green (42 tests). Suite 7 blocked by direct upload 415 (multipart MIME resolution). Suite 8 not run.

**Chunking research: 8 files completed (Opus deep dives).** Key: Jina v5 NO-GO (no late chunking), contextual+late = synergy (+23.6 nDCG), structure-aware chunker needed (5 failure modes), parent-child 80% ready (F-017), PIC 50 lines no LLM, Dense X NO-GO, evaluation framework designed.

**Open bugs:** direct upload 415, PDF→1 chunk (BPE not loaded), debug logging still in pipeline.ts, changes not committed to git.
<!-- ENTRY:2026-03-30:CLOSE:211:contexter:contexter-gtm [AXIS] -->
## 2026-03-30 — сессия 211 CLOSE [Axis]

**Epic:** CTX-08 GTM — Chunking Overhaul + Pre-launch QA

**Summary:** Chunking overhaul Waves 0-5 deployed. Pre-launch Phase 1 complete (backups, canary, alerts, smoke). Phase 2: 106 E2E tests, Docker memory fix, LLM provider chain Groq→NIM→DeepInfra, 25 golden pairs, deploy docs. 6 bugs found+fixed.

<!-- ENTRY:2026-03-30:CHECKPOINT:212:contexter:contexter-gtm [AXIS] -->
## 2026-03-30 — сессия 212 CHECKPOINT [Axis]

**Epic:** CTX-08 GTM — All 4 Pre-launch QA Phases COMPLETE

**Pre-launch Phase 2 (finished this session):**
- k6 load test baseline: 4 scripts, 3 scenarios. Key finding: Groq LLM = bottleneck (6s idle → 13s at 20 VUs)
- Netdata alerting: 5 custom alerts (disk/CPU/container/OOM/swap) → Telegram. Test delivery 3/3 OK. Docling at 99.2% RAM found.
- Content filter: 22 regex patterns, 5 categories, flag-not-block. Deployed + verified (injection doc flagged, normal doc clean)

**Pre-launch Phase 3 (Medium-term):**
- Deploy automation: ops/deploy.sh + rollback.sh + Dockerfile COPY (no more bind mount). deploy-web.sh for frontend.
- Privacy Policy + Terms of Service: 2 SolidJS pages, EN, global coverage (KZ/AR/FI), GDPR, England & Wales jurisdiction
- Unit tests: fixed 4 broken (async tokenizer + 512-dim embeddings) + 12 new content-filter tests = 52 pass / 0 fail
- Graceful degradation: 3 unwired circuit breakers wired (Jina/Docling/Whisper). /health/circuits endpoint. Runbook written. Key finding: DeepInfra key not configured.
- Regression fixtures: 15 docs (md/txt/json) + 17 QA pairs + chunking eval baseline
- Drift detection baseline: 500 embeddings sampled, JL 32d projection, stored in eval_drift_baseline
- Backward compat: flat chunks query correctly with hierarchical RAG pipeline ✅

**Pre-launch Phase 4 (Long-term):**
- GDPR account deletion: DELETE /api/auth/account — cascading delete (shares/payments/subscriptions/documents/user) + async R2 cleanup
- WAL archiving: archive_mode=on, archive_timeout=300 (5 min RPO), hourly R2 upload via cron
- Semantic anomaly detection: L2 norm outlier check after embed stage, metadata flag
- Maintenance procedures documented: golden set growth + monthly k6
- Loki+Grafana skipped (4GB RAM, AI-driven)

**Capacity model created:** k6/capacity-model.ts + k6/deepinfra-model.ts
- 50 users = comfortable, 100 = edge, 10K = CAX41 + $746/mo (DeepInfra)
- DeepInfra 52% cheaper than Groq, no TPM limits
- Revenue at 10K users (30% paid): $57K/mo, margin 99%

**Files created/modified:**
- k6/: setup.js, scenario-1-queries.js, scenario-2-uploads.js, scenario-3-mixed.js, smoke.js, BASELINE-2026-03-30.md, capacity-model.ts, deepinfra-model.ts
- ops/: deploy.sh, deploy-web.sh, rollback.sh, Dockerfile, netdata/contexter.conf, netdata/health_alarm_notify.conf
- src/services/content-filter.ts (new), pipeline.ts (content filter + anomaly detection), embedder/index.ts (jinaPolicy), parsers/docling.ts (doclingPolicy), parsers/audio.ts + video.ts (groqWhisperPolicy), routes/health.ts (/circuits), routes/auth.ts (DELETE /account)
- web/src/pages/Privacy.tsx + Terms.tsx (new), App.tsx + Landing.tsx (routes + footer)
- tests/content-filter.test.ts (new), chunker.test.ts + embedder.test.ts (fixed)
- drizzle-pg/0012_content_filter.sql (metadata jsonb column)
- docs/degradation-runbook.md, docs/maintenance-procedures.md
- evaluation/dataset/docs/ (15 fixtures), evaluation/dataset/eval.json (17 QA pairs)
- Server: Dockerfile COPY, docker-compose WAL config, Netdata alerts, drift baseline, PG metadata column
<!-- ENTRY:2026-03-30:CLOSE:213:contexter:contexter-auth [AXIS] -->
## 2026-03-30 — сессия 213 CLOSE [Axis]

**Epic:** CTX-08 CLOSED + CTX-04 Auth (Waves 1-5 complete)

**Summary:** Massive session — 4 pre-launch QA phases completed (28 tasks), CTX-08 closed, CTX-04 Auth epic opened and completed (better-auth v1.5.6, email+password, Google OAuth, hybrid resolveAuth, 5 frontend pages, Resend domain verified). Deploy automation (ops/deploy.sh, Dockerfile COPY). Full L0-L3 audit (15 factual corrections). Production readiness audit (13 issues found and fixed). k6 load test baseline. Capacity model for 10K users. Netdata alerts. Content filter. Circuit breakers. GDPR deletion. WAL archiving. Legal pages. Product backlog (14 tickets).

Backend prod-ready for 50 users. Frontend has white screen issue on /register (deferred to frontend audit session).
<!-- ENTRY:2026-03-30:CLOSE:216:contexter:contexter-uiux-polish [AXIS] -->
## 2026-03-30 — session 216 CLOSE [Axis]

**Decisions:**
- All subagents = Sonnet by default
- Design system = source of truth for colors (index.css aligned)
- Bauhaus RAG consulted for 4 design decisions
- Inter = primary font, JetBrains Mono = code only
- ConnectionModal: dark → light theme (Mondrian P-35)
- 4 hover/pressed tokens added (mix formula 25%/50%)

**Completed:**
- Research regulation v1.0 + 7 seed research files
- Kandinsky (UX Reviewer) + Bayer (UI Reviewer) agents created
- Wave 1 audit: 39 UI + 12 UX findings
- Wave 2.0: design system foundation
- Wave 2.1: **300 token violations → 0** (100% compliance)

**Opened:**
- Phase 2.2: UX fixes (createEffect cleanup, 401 modal, auth unification, focus traps, error placement)
- Wave 3: Polish | Wave 4: Verification
<!-- ENTRY:2026-03-30:CLOSE:218:contexter:contexter-uiux-polish [AXIS] -->
## 2026-03-30 — сессия 218 CLOSE [Axis]

CTX-09 UI/UX Polish epic complete. Waves 2-4 deployed. Pipeline indicator redesigned (format-specific labels, visual grammar, time estimates, toast, errors, mobile, a11y). deploy-web.sh fixed (branch=main). Hetzner CAX11→CAX21. Docling mem 1.5→3GB. ~35 files, 8 Gropius passes, 2 Bayer/Kandinsky audits.
<!-- ENTRY:2026-03-31:CLOSE:220:contexter:contexter-auth [AXIS] -->
## 2026-03-31 — сессия 220 CLOSE [Axis]

**Scope:** Architecture stress testing, MCP-only pivot, infra scaling to 100 concurrent

**Key results:**
- Groq removed from query path → MCP search p50: 7.6s → 110ms (66x)
- Chat UI removed from frontend
- Infra scaled: app 1536m, PG 1536m pool 100, BullMQ 4, Docling 3072m
- 6 stress test runs, server sustains 118 VUs / 11 RPS / 14 min
- YouTube audio fallback via yt-dlp added
- Deploy script fixed (docker-compose.yml sync)
- Presign MIME resolution bug fixed (.md files)

**Open:** yt-dlp verification, pipeline failures from external API rate limits, Groq paid tier for contextual prefix at scale
