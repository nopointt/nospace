# session+169-scratch.md
> Placeholder · last processed checkpoint: #168

<!-- ENTRY:2026-03-19:CHECKPOINT:169:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — checkpoint 169 [Axis]

**Decisions:**
- Stack pivot confirmed: SolidStart + Cloudflare (D1/R2/Vectorize/Queues) + better-auth + Drizzle. No Vercel, no Supabase, no Prisma, no Next.js.
- Web-first, Tauri desktop = v2
- Audio in MVP (Groq Whisper API), video = v2 (needs server for ffmpeg)
- YouTube subtitles via JS API in MVP, YouTube without subs = v2 (needs yt-dlp)
- No LLM chat in MVP. Omnibar hidden, polished later (v1.1)
- No Modal.com for now. If needed later — $30 free/month
- Canvas = port harkly-shell (77 SolidJS files) to web SolidStart
- Schema: AI hybrid (sift-kg discovery + documind Zod compilation + instructor-js extraction)
- MCP: workers-oauth-provider + mcp-ts-template. OAuth 2.1 + Streamable HTTP
- All epics PAUSED except HARKLY-18. Full focus on MVP
- HARKLY-18 split into 5 sub-epics: 18.1 Scaffold, 18.2 Upload+Process, 18.3 Schema+Extract, 18.4 MCP+OAuth, 18.5 Canvas port
- harkly-saas deprecated and to be deleted
- Freemium model, billing last

**Files created:**
- `docs/research/harkly-research-products.md` — 20+ products, gap analysis, pricing matrix
- `docs/research/harkly-research-github.md` — 50+ repos, top-10 ranked
- `docs/research/harkly-research-github-api.md` — 10 new repos via GitHub API (sift-kg, ai-rag-crawler, graphrag-workbench, 5ire, l1m)
- `docs/research/harkly-research-mcp-access.md` — MCP ecosystem 2026, all LLM clients, OAuth 2.1 standard
- `docs/research/harkly-research-stack.md` — CF services assessment, tools, templates, 10 gotchas
- `docs/research/harkly-eval-rag-pipeline.md` — cloudflare-rag, ai-rag-crawler, openai-sdk-knowledge-org deep eval
- `docs/research/harkly-eval-schema-extract.md` — documind, sift-kg, l1m, instructor-js deep eval
- `docs/research/harkly-eval-mcp-auth.md` — workers-mcp (rejected), mcp-ts-template, workers-oauth-provider, better-auth-cloudflare
- `docs/research/harkly-eval-ui-canvas.md` — quantum, solid-pages, solid-flow (rejected), better-auth+SolidStart
- `docs/research/harkly-mvp-architecture.md` — 709 lines, 22 stack decisions, 14 risks
- `docs/research/harkly-mvp-copy-map.md` — 25 npm packages, 45 clone entries, 57 existing files, 14 from scratch
- `docs/research/harkly-mvp-data-model.md` — 1522 lines, 15 tables + FTS5, full Drizzle schema
- `docs/research/harkly-mvp-api-spec.md` — 1615 lines, 23 REST endpoints, 6 MCP tools, 4 queue consumers (FIXED: was wrong stack, rewritten)
- `docs/research/harkly-mvp-build-plan.md` — 5 phases, dependency graph, 30+ risks consolidated
- `docs/disk-cleanup-guide.md` — disk cleanup protocol with protected files list
- `docs/research/_eval/` — 14 cloned repos for evaluation

**Files modified:**
- `.claude/settings.json` — added TaskStop to eidolon hook matcher
- `.claude/hooks/eidolon-register.py` — added TaskStop handling (kill confirmation check)
- `.tlos/eidolons.json` — cleaned up stale agents, registered new ones

**Completed:**
- Full Copy First research (Phase 1-3): products, GitHub, MCP, stack, 14 repos evaluated
- 5 MVP specification documents written by parallel agents
- Doc 4 API Spec rewritten (was wrong stack: Next.js/Vercel → SolidStart/CF)
- Disk audit completed: 7.3 GB free, cleanup plan ready (~10 GB reclaimable)
- Disk cleanup guide document written
- Eidolon registry hook fixed for TaskStop events

**In progress:**
- Disk cleanup commands sent to user, waiting for execution

**Completed (after checkpoint):**
- L0/L1/L2/L3 memory updates — all done
- HARKLY-18.1–18.5 sub-epic files — all 5 created
- saas-v1 roadmap archived to `harkly-saas-v1-roadmap-archive.md`

**Opened:**
- HARKLY-18.1 Scaffold — 🔜 NEXT (start in fresh session)
- Need free/cheap server for yt-dlp+ffmpeg (v2, not MVP blocker)
- FTS5 in D1 — needs verification (blocker in L3)
- Eidolon registry improvements (deferred, not blocking MVP)

**Notes:**
- ~75-80% of MVP code covered by existing code (harkly-shell) + research patterns
- Backend = 0%, all from scratch but with copy-paste patterns from 14 evaluated repos
- Competitive window: NotebookLM, Perplexity could add similar features. Speed matters.
- Token usage: 63M quota tokens in 5h window (39% of ~162M limit). 70% weekly quota used.
- Canvas not validated by interview but nopoint trusts intuition. Risk accepted.
- Session context open questions from 2026-03-18 all resolved in this session.

<!-- ENTRY:2026-03-19:CLOSE:170:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 170 CLOSE [Axis]

**Summary:** Full MVP planning session. Copy First research (9 files, 14 repos evaluated), 5 MVP specification documents, stack pivot to SolidStart + Cloudflare, memory L0-L3 updated, 5 sub-epics created. Ready to code HARKLY-18.1.

**Decisions:**
- All decisions from checkpoint #169 (see above) — confirmed and distributed to L0-L3
- Артём not involved in dev, nopoint + Axis = the team
- No time estimates in days — estimate in tokens
- Use Sonnet agents for coding (cheaper), fresh sessions (lower cache_read)

**Files created (after checkpoint 169):**
- `memory/harkly-18-1-scaffold.md` — sub-epic L3
- `memory/harkly-18-2-upload.md` — sub-epic L3
- `memory/harkly-18-3-schema.md` — sub-epic L3
- `memory/harkly-18-4-mcp.md` — sub-epic L3
- `memory/harkly-18-5-canvas.md` — sub-epic L3
- `memory/harkly-saas-v1-roadmap-archive.md` — archived old roadmap

**Files modified (after checkpoint 169):**
- `memory/harkly-about.md` (L1) — full rewrite: stack, paths, auth, canvas, Active L3
- `memory/harkly-roadmap.md` (L2) — new roadmap, all epics paused, sub-epics
- `memory/harkly-mvp-data-layer.md` (L3) — updated scope, stack, sub-epics table
- `MEMORY.md` (L0) — Harkly Stack section updated to CF

**Completed:**
- Everything from checkpoint #169 list
- L0/L1/L2/L3 memory fully synchronized
- 5 sub-epic files created with tasks, clone sources, acceptance criteria
- Scratch verified: all items distributed to correct layers

**Opened (for next session):**
- HARKLY-18.1 Scaffold — start coding via G3 on Sonnet
- Disk cleanup — user has commands, not yet executed

**Next session:** `/continueaxis` → G3 launch HARKLY-18.1 Scaffold on Sonnet
