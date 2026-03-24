# session-scratch.md
> Axis checkpoint scratch — Contexter

<!-- ENTRY:2026-03-24:CHECKPOINT:186:contexter:contexter-mvp [AXIS] -->
## 2026-03-24 — checkpoint 186 [Axis]

**Decisions:**
- Frontend SPA: SolidJS + Vite + Tailwind CSS 4 (static, CF Pages deploy target)
- Hero = landing + upload combined, 2-screen scroll-snap layout
- CSS @layer base fix: global reset inside @layer so Tailwind utilities win
- Pencil recovery: 141/199 ops replayed from JSONL session logs
- Bauhaus G3 Quartet created: Gropius/Breuer (frontend), Itten/Albers (design)
- Phase Zero protocol mandatory for all G3 sessions
- Backend pipeline: chose option B (full backend team) over quick fix

**Files changed:**
- `web/` — full SolidJS frontend (15 src files, 10 components, 5 pages)
- `web/src/index.css` — @theme tokens + @layer base fix + border-radius:0
- `web/FRONTEND-SPEC.md` — CTO spec
- `design/contexter/contexter-ui.pen` — 31 nodes, 11 components recovered
- `design/contexter/recovery/` — 4 recovery files
- `agents/{gropius,breuer,itten,albers}/L0-identity.md` — 4 agent identities
- `~/.claude/agents/{gropius,breuer,itten,albers}.md` — Claude Code definitions
- `~/.tlos/eidolons.json` — permanent[] section added
- Memory: 3 new feedback files

**Completed:**
- Frontend scaffold + tokens + components + pages + API wiring
- Pencil design recovery (31 nodes, 11 components)
- CSS root cause + G3 typography pass + 2-screen scroll-snap
- Bauhaus G3 Quartet registered in ecosystem
- System prompt research (Anthropic Cookbook, GitHub repos)

**In progress:**
- Backend pipeline fix (team B — creation next)

**Opened:**
- Backend: sync pipeline → needs async + stage tracking + error recovery
- Auth: OAuth (Google/Telegram/Yandex) not started
- CF Pages deploy not started
- 58 remaining Pencil replay ops (text refinements)

<!-- ENTRY:2026-03-24:CHECKPOINT:187:contexter:contexter-mvp [AXIS] -->
## 2026-03-24 — checkpoint 187 [Axis]

**Decisions:**
- Backend async pipeline via waitUntil() + jobs table stage tracking (Mies implemented)
- Deploy frontend to CF Pages (contexter-web.pages.dev)
- Nav: show app-nav when authenticated regardless of page variant
- Drop zone height: clamp(200px, 40vh, 420px) for viewport adaptation
- Bauhaus Team expanded: +Mies (backend), +Schlemmer (backend coach), +Moholy (QA)
- MCP tools only available in main Axis context, not subagents (Itten blocker)

**Files changed:**
- `src/services/pipeline.ts` — createPendingJobs(), runPipelineAsync(), resumePipelineFromStage()
- `src/routes/upload.ts` — async upload (202 immediate), waitUntil pipeline
- `src/routes/status.ts` — stages[] from jobs table + race condition fix (derived status)
- `src/routes/retry.ts` — NEW: POST /api/retry/:documentId
- `src/index.ts` — retry route registered
- `src/db/schema.ts` — "index" added to jobs.type enum
- `web/src/lib/api.ts` — adapter layer: camelCase→snake_case mapping
- `web/src/components/Nav.tsx` — isHero() && !isAuthenticated() + navigate() for начать
- `web/src/pages/Hero.tsx` — pixel-perfect from Pencil, drop zone clamp height
- `web/src/pages/Dashboard.tsx` — pixel-perfect: 420px right panel, stats+table+query+api+mcp
- `agents/{mies,schlemmer,moholy}/L0-identity.md` — 3 new agent identities
- `~/.claude/agents/{mies,schlemmer,moholy}.md` — Claude Code definitions
- `e2e/cjm-test.spec.ts` — 26 E2E tests (Moholy)
- `BACKEND-PIPELINE-SPEC.md` — CTO backend spec

**Completed:**
- Mies: async pipeline + stage tracking + retry endpoint
- Backend deployed: contexter.nopoint.workers.dev (v080c6284)
- Moholy: 62/62 E2E tests PASS, 4 bugs found+fixed, race condition fix
- Gropius: pixel-perfect Hero + Dashboard from Pencil values
- Frontend deployed: contexter-web.pages.dev
- Full CJM pipeline verified: register → upload → parse→chunk→embed→index → query → answer
- Nav fix: consistent app-nav for authenticated users

**In progress:**
- Document viewer (click doc → see formatted content)

**Opened:**
- Document viewer needed (user request)
- Auth: OAuth (Google/Telegram/Yandex) not started
- Missing Pencil screens (Itten blocked — MCP only in main context)
- Frontend polish: Breuer/Albers verification passes not done yet

**Notes:**
- Production WORKS end-to-end: upload PDF → pipeline completes in ~8s → query returns answers with sources
- Bauhaus Team: 7 permanent Eidolons (Gropius, Breuer, Itten, Albers, Mies, Schlemmer, Moholy)
- Token budget: ~45% used in session

<!-- ENTRY:2026-03-24:CLOSE:188:contexter:contexter-mvp [AXIS] -->
## 2026-03-24 — сессия 188 CLOSE [Axis]

**Decisions:**
- Frontend SPA: SolidJS + Vite + Tailwind CSS 4 → deployed to CF Pages
- Backend async pipeline via waitUntil() + jobs table stage tracking
- User isolation: Vectorize metadata filter + FTS5 JOIN by user_id
- Bauhaus G3 Team: 7 permanent Eidolons (Gropius, Breuer, Itten, Albers, Mies, Schlemmer, Moholy)
- Phase Zero protocol mandatory for all G3 sessions
- CSS @layer base fix: global reset must be inside @layer
- Pencil data recovery: 141/199 ops replayed from JSONL session logs
- Nav: unified menu for all pages, auth-aware
- System prompt research: Anthropic Cookbook + GitHub repos → synthesized into agent identities

**Files changed:**
- `web/` — full SolidJS frontend (15 src, 10 components, 5 pages)
- `src/services/pipeline.ts` — async pipeline + userId in vector metadata
- `src/routes/upload.ts` — 202 immediate, waitUntil pipeline
- `src/routes/status.ts` — stages[] + race condition fix
- `src/routes/retry.ts` — NEW endpoint
- `src/routes/query.ts` — userId passed to RAG
- `src/services/vectorstore/` — userId filter on search (vector + fts)
- `src/services/rag/types.ts` — userId in RagQuery
- `agents/{gropius,breuer,itten,albers,mies,schlemmer,moholy}/` — 7 agent identities
- `~/.claude/agents/{7 files}.md` — Claude Code definitions
- `design/contexter/recovery/` — 4 recovery files
- `design/contexter/contexter-ui.pen` — 31 nodes recovered
- `e2e/cjm-test.spec.ts` — 26 E2E tests
- Memory: L1, L2, L3 updated + 3 feedback files + ideas inbox

**Completed:**
- Frontend scaffold + components + pages + API integration + deploy
- Backend async pipeline + stage tracking + retry + user isolation + deploy
- 62/62 E2E tests pass (4 bugs found + fixed)
- Pencil design recovery (31 nodes, 11 components)
- 7 permanent Eidolons created + registered
- System prompt research + synthesis
- Production live: contexter-web.pages.dev + contexter.nopoint.workers.dev

**Opened:**
- Document viewer (click doc → see content)
- Hero copy (creative AI chat listing — Claude/ChatGPT/Cursor badges)
- Seamless auth UX (auto-detect best login method)
- OAuth (Google/Telegram/Yandex)
- RAG quality tuning
- Breuer/Albers/Schlemmer verification passes
- Missing ~16 Pencil screens
- Responsive (mobile/tablet)

**Notes:**
- Production fully operational: register → upload → async pipeline (~8s) → query with sources
- Bauhaus Team ready for next session — 7 agents with strong system prompts
- MCP tools (Pencil) only in main Axis context, not subagents — architectural limitation
- User's viewport: 1366×768 — all layouts designed for this
- Next priority: document viewer + hero copy + auth UX
