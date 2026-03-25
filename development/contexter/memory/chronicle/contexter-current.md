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
