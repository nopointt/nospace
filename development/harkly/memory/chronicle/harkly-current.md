# CHRONICLE — Harkly
> Append-only session log. NEVER overwrite. Only append new entries at the bottom.
> Created: 2026-03-14 (migrated from epics-log-harkly.md + decisions-harkly.md)
> Format: <!-- ENTRY:[YYYY-MM-DD]:[TYPE]:[N]:harkly:[epic] -->

---

<!-- ENTRY:2026-03-08:CLOSE:1:harkly:e0-scaffold -->
## 2026-03-08 — сессия 1 CLOSE

**Phase:** Stage 0–2 → Stage 3: E0 Scaffold + Auth + DB Schema

**Completed:**
- Next.js 16 App Router scaffold (Bun runtime)
- Supabase auth (signIn/signUp/signOut) + middleware protection `/app/*`
- Prisma schema: workspaces, research_projects, documents, extractions
- shadcn/ui base components + auth pages + dashboard
- Vercel deployment: harkly-saas.vercel.app

**Notes:**
- `prisma migrate dev` hangs with Supabase pooler → use `prisma db execute --stdin`

---

<!-- ENTRY:2026-03-08:CLOSE:2:harkly:e0.5-canvas -->
## 2026-03-08 — сессия 2 CLOSE

**Phase:** Stage 3: E0.5 Canvas Shell

**Completed:**
- Infinite canvas (pan + zoom), CanvasFrame draggable/resizable
- FrameContentRouter: `frame.module` → React component routing
- useCanvasState Zustand store + localStorage persist
- ChatPanel (floating, 3 positions), AgentStatusBar, ProjectPicker

---

<!-- ENTRY:2026-03-08:CLOSE:3:harkly:e1-e3-frames -->
## 2026-03-08 — сессия 3 CLOSE

**Phase:** Stage 3: E1–E3 Frames

**Completed:**
- E1 Framing Studio (`/app/projects/[id]/frame`)
- E2 Corpus Triage (`/app/projects/[id]/corpus`)
- E3 Evidence Extractor (`/app/projects/[id]/extract`)

---

<!-- ENTRY:2026-03-09:CLOSE:4:harkly:e4-e6-frames -->
## 2026-03-09 — сессия 4 CLOSE

**Phase:** Stage 3: E4–E6 Frames

**Completed:**
- E4 Insight Canvas (`/app/projects/[id]/canvas`) — SQL migration pending
- E5 Research Notebook (`/app/projects/[id]/notebook`)
- E6 Share + Export (`/share/[token]`) — SQL migration pending

**Notes:**
- e4_artifacts.sql + e6_share.sql created but not applied in Supabase

---

<!-- ENTRY:2026-03-10:CLOSE:5:harkly:canvas-3.5 -->
## 2026-03-10 — сессия 5 CLOSE

**Phase:** Stage 3.5 Canvas Workspace Redesign (partial)

**Completed:**
- ChatPanel, ChatSettingsBar, AgentStatusBar, FloorBadge redesigned
- Omnibar connected, NVIDIA NIM provider wired
- Canvas workspace layout improved

**In progress (on-hold):**
- Floor navigation + per-floor canvas content

---

<!-- ENTRY:2026-03-10:CLOSE:6:harkly:stage-4-debt -->
## 2026-03-10 — сессия 6 CLOSE

**Phase:** Stage 4: Tech Debt Analysis

**Completed:**
- tech-debt-frontend.md written
- ux-debt-report.md written
- ProxyMarket partnership CLOSED (Артём — separate co-founder, not via ProxyMarket)

---

<!-- ENTRY:2026-03-10:CLOSE:7:harkly:landing-page -->
## 2026-03-10 — сессия 7 CLOSE

**Phase:** Stage L: Landing Page

**Completed:**
- Landing page deployed: harkly-saas.vercel.app
- Waitlist API: POST /api/waitlist { telegram, role }
- Auth bypass: PUBLIC_PATHS = ['/', '/share'] in middleware.ts
- Waitlist switched to Telegram (not email)
- HARKLY-13 epic CLOSED

**Notes:**
- Session 17 in old numbering system

<!-- ENTRY:2026-03-17:CHECKPOINT:8:harkly:harkly-marketing-content [AXIS] -->
## 2026-03-17 — checkpoint 142 [Axis/Harkly session]

**Decisions:**
- "Вы" confirmed for all Russian B2B Harkly content
- Category term: "Customer Signals Research" — Harkly introduces and owns
- Positioning: Методологический лидер (methodological leader)
- TOV v2 structure: 8-component copywriter doc + 8-layer AI persona split
- Audience portrait pipeline: built, first run done, needs second run with smarter sampling
- Facts from enemy.md / hero.md marked as possibly Qwen-hallucinated — verify before including in TOV
- 4 Voice Pillars confirmed: Attentive · Precise · Humanist · Calm

**Files created:**
- `development/harkly/brand/values.md` — canonical brand values (soft/elegant/intelligent/scientific/anthropocentric)
- `development/harkly/brand/tov.md` — marked as DRAFT v1, pending v2 rewrite
- `development/harkly/brand/agents/audience_analysis.py` — full pipeline (10 groups, 15082 msgs, Groq)
- `development/harkly/brand/channels/audience-portrait.md` — first draft (low quality)
- `development/harkly/brand/channels/telegram-persona.md` — first draft (low quality)
- `nospace/docs/research/tov-best-practices-research.md` — 587 lines (Mailchimp/Monzo/NN-G analysis)

**In progress:**
- values.md needs update: methodological leader, Enemy narrative, Hero (Owner of Outcomes)
- TOV v2: structure clear, ready to write
- Audience portrait: second run with better sampling (filter recruitment posts)

**Notes:**
- Hero = "Owner of Outcomes / The Bridge" — pain is political, not methodological
- NN/G: trustworthiness >> friendliness (52% vs 8%). Humor destroys trust in analytical contexts.
- instagram_str1.md = full GTM doc ($9 commitment filter, Enthusiasts → Ambassadors)

<!-- ENTRY:2026-03-17:CLOSE:9:harkly:harkly-marketing-content [AXIS] -->
## 2026-03-17 — сессия CLOSE [Axis/Harkly]

**Completed:**
- Тестовый пост написан (Pillar 1 Signals, рекрутмент, "9 из 13 чатов") — готов к публикации
- Pipeline v0 построен: idea_hub.py ✅ / antenna.py ⚠️ / deep_researcher.py ⚠️
- Код: `nospace/development/harkly/brand/agents/`, идеи: `brand/ideas/hub.json`

**Decisions:**
- Pipeline v0 = NEEDS REWORK. HN + GitHub дают нерелевантный контент для PM/UX аудитории
- Telethon — единственный качественный source. Нужны TG_API_ID + TG_API_HASH для запуска
- idea_hub.py (CRUD) — переиспользовать, хороший. Antenna + DeepResearcher — переписать
- Qwen CLI использован для кодинга (one-time authorization от nopoint, только эта сессия)
- TelegramPerson v2 system_prompt — единственный production-ready компонент пайплайна

**Next:**
- Rework Antenna (Telethon primary) + DeepResearcher с TG_API_ID + TG_API_HASH
- GhostPerson + HabrPerson (Phase 1 остаток)
<!-- ENTRY:2026-03-18:CLOSE:159:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 159 CLOSE [Axis]

**Decisions:**
- F0 flow = двухшаговый: омнибар → Студия фрейминга (появляется после intent normalization)
- Omnibar-dialog для нормализации интента = отдельный эпик (не в текущем дизайне)
- JTBD framing реализован в Pencil F0 (Когда / Хочу / Чтобы)
- Collapsed state Студии фрейминга = 300×52px карточка с expand icon
- Compact header controls rule: 24px height, 16×16 icons, gap:8 (8px grid)
- `--border-subtle` → #E8DDD0 (warm, was #E3E3E3 cold)
- Harkly UI язык = русский, все лейблы переведены
- closeaxis скилл исправлен для harkly (Steps 3,4,5,8 + chronicle структура)

**Files changed:**
- `harkly/memory/harkly-design-ui.md` — L3: JTBD node IDs, 6 новых Pencil critical rules, токен border-subtle обновлён, JTBD rebuild задача закрыта
- `harkly/memory/harkly-roadmap.md` — L2: дата + HARKLY-15 в Next Priority #1
- `harkly/memory/harkly-about.md` — L1: Write Authority обновлён (chronicle entries)
- `~/.claude/commands/closeaxis.md` — Steps 3,4,5,8 исправлены для harkly
- `harkly/memory/chronicle/harkly-chronicle.md` — создан (ротационный архив)
- `harkly/memory/chronicle/queue/` + `queue/processed/` — созданы
- `untitled.pen` — F0 rebuilt: JTBD panel, header controls (JTBD+collapse+pin+X), collapsed card, border-subtle warm, "Спросите Harkly…"

**Completed:**
- [x] F0 Framing Studio rebuild: PICOT → JTBD (Когда/Хочу/Чтобы)
- [x] Header controls: JTBD chip + collapse + pin + X (compact 24px/16px/gap:8)
- [x] Collapsed card state нарисована
- [x] `--border-subtle` → #E8DDD0 warm
- [x] Omnibar placeholder → "Спросите Harkly…"
- [x] L3/L2/L1 полностью актуализированы
- [x] closeaxis skill исправлен (harkly chronicle paths)
- [x] Harkly chronicle структура создана (queue/, harkly-chronicle.md)

**Opened:**
- [ ] F1 Источники screen — следующий экран для дизайна
- [ ] Omnibar-dialog нормализации интента — отдельный эпик (не сейчас)
- [ ] Omnibar → reusable component (pending)
- [ ] SpineProgress bar в omnibar header (F1–F5)

**Notes:**
- Lucide X glyph оптически легче — принять как данность
- M() + layout drop bug: после M() всегда batch_get проверить layout
- set_variables формат: {type:"color",value:"#HEX"} — plain string не работает
- gap off-grid (gap:6) — запрещён, только кратные 4
<!-- ENTRY:2026-03-18:CLOSE:162:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 162 CLOSE [Axis]

**Decisions:**
- Badge text = CENTER (`justifyContent:"center"`) — user rejected left-align (flex-start). Центрирование — намеренный дизайн.
- Value text column alignment: исправлено через gap:8 на row frames (PEO, FINER), не через x детей (flexbox игнорирует x).
- PEO badge width: 64px → 80px — "Воздействие" (65px текст) не клипалось в 64px. 80px = корректный размер.
- Консистентность value text в FINER: row frames F/I/N gap:8 → value text x:104 (было x:108). Row E/R (layout:none) x:104 тоже. Все 5 строк на одной линии.
- `--signal-warning-bg` / `--signal-warning` токены — пропущено. F (Реализуемо) остаётся hardcode #FFF3CD / #B8860B до отдельной задачи.

**Files changed:**
- `untitled.pen` — 2 formal tokens добавлены; FINER badge colors → tokens; PEO badge width 80px; FINER/PEO row gaps → 8px; badge justifyContent center restored; value text columns aligned

**Completed:**
- FINER formal tokens (`--signal-success` + `--signal-success-bg`) → Pencil variables ✅
- FINER I/N/E/R badges → formal tokens ✅
- Badge alignment investigation (center vs flex-start) + revert ✅
- PEO badge clipping fix (width:80) ✅
- Value text column alignment: все 5 фреймворков ✅
- Все V1 Framing Studio фреймворки финализированы ✅

**Opened:**
- `--signal-warning-bg` + `--signal-warning` токены (F badge hardcode)
- F1 Источники screen design

**Notes:**
- Pencil flexbox rule: в flexbox-row frames нельзя задать x/y дочерним нодам — только gap/padding на parent
- Token count: 21 в Pencil (19 base + 2 signal-success)
- Все 5 V1 фреймворков (JTBD/SPICE/PEO/Issue Tree/FINER) готовы → следующий этап: F1–F5 screens
<!-- ENTRY:2026-03-18:CLOSE:165:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 165 CLOSE [Axis]

**Decisions:**
- Harkly design system created: 19 docs in `design/harkly/`, Bauhaus RAG validated
- Spatial paradigm: frames on canvas, not dashboard. Omnibar = primary not only.
- Green for success = Klee over Mondrian. Warm grays = Kandinsky temperature.
- F1 Источники: 6 artboards (default + 5 interaction states)
- Architecture restructured: branches/ → architecture/. Brand consolidated in brand/.
- Pencil Card → Frame. Naming convention doc created.

**Files:** 22 created, 8 updated. Design system complete. F1 complete. F2-F5 pending.
<!-- ENTRY:2026-03-18:CLOSE:168:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 168 CLOSE [Axis]

**Decisions:**
- Floors = Z-layers (same canvas, different content), not Y-zones
- Branches = isolated canvases per research thread, 5 default branches
- Auto-snap removed — frames drag freely
- Scroll: plain=vertical pan, Shift=horizontal, Ctrl=zoom, Ctrl+Alt=floors, Ctrl+Shift=branches
- Frame drag bug root cause: animate-h-enter CSS fill-mode overriding inline transform
- F1 Collection Plan needs full redesign as "serious research document"

**Files changed:**
- `harkly-shell/src/components/DynamicComponent.tsx` — drag fix (animation moved to inner div)
- `harkly-shell/src/hooks/useFloor.ts` — branches, goToFloor, createBranch, switchBranch
- `harkly-shell/src/hooks/useViewport.ts` — scroll mechanics (vertical/horizontal/passthrough)
- `harkly-shell/src/hooks/useSnap.ts` — auto-snap removed
- `harkly-shell/src/components/FloorPill.tsx` — dropdown with 6 floors
- `harkly-shell/src/components/BranchPill.tsx` — dropdown with branches + create
- `harkly-shell/src/App.tsx` — floor+branch filtering, auto-load, spawn inheritance
- `harkly-shell/src/commands/frameLayouts.ts` — 5 branches with varied content
- `harkly-shell/src/types/frame.ts` — floor, branch fields
- `docs/research/f1-osint-collection-planning-research.md` — NEW 1297 lines
- `docs/research/f1-research-planning-methodologies-research.md` — NEW 1298 lines
- `~/.claude/hooks/eidolon-register.py` — active→completed lifecycle fix
- `~/.tlos/eidolons.json` — cleaned

**Completed:**
- Frame drag bug, floor/branch mechanics, scroll, auto-snap removal, 2 research docs, eidolon hook fix

**Opened:**
- F1 redesign (research synthesis pending), design system gaps, demo script, Cargo rename
<!-- ENTRY:2026-03-19:CLOSE:170:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 170 CLOSE [Axis]

**Summary:** Full MVP planning session. Copy First research (9 research files, 14 repos evaluated, 4 deep evals), 5 MVP specification documents (architecture, copy map, data model, API spec, build plan), stack pivot SolidStart + Cloudflare, memory L0-L3 updated, 5 sub-epics (18.1–18.5) created. Ready to code HARKLY-18.1 Scaffold.

**Key decisions:** Stack = SolidStart + CF (D1/R2/Vectorize/Queues) + better-auth + Drizzle. Web-first (Tauri v2). Audio in MVP, video v2. No LLM chat (v1.1). All epics paused, full focus HARKLY-18. 5 sub-epics with dependency graph.

**Created:** 9 research files, 5 MVP specs, 5 sub-epic L3 files, disk cleanup guide, saas-v1 roadmap archive. **Modified:** L0 stack, L1 full rewrite, L2 new roadmap, L3 updated, eidolon hooks.

**Next:** `/continueaxis` → G3 HARKLY-18.1 Scaffold on Sonnet.

<!-- ENTRY:2026-03-19:CLOSE:172:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 172 CLOSE [Axis]

**Decisions:**
- Manual SolidStart scaffold (C3 broken on Windows) — 1.3.2 + cloudflare-pages preset
- MiniMax M2.5 выбран как лучшая free модель для OpenCode CLI (80.2% SWE-bench Verified)
- OpenCode CLI работает как Player для UI задач; Qwen CLI требует `-y` (YOLO mode) + абсолютные пути
- Proxy upload в R2 вместо presigned URLs (aws4fetch — проще для MVP)
- Workers AI Llama 3.3 70B для schema discovery и extraction
- D1 регион EEUR (KB_DB: 1e070dfd, AUTH_DB: 7909c74e)
- wrangler.toml как primary config; wrangler.jsonc нужно удалить (C3 artifact)

**Files created (53 src + 6 SQL + configs):**
- `development/harkly/harkly-web/` — весь проект с нуля
- 18.1: package.json, app.config.ts, wrangler.toml, tsconfig.json, app.tsx, entry-*.tsx, middleware, db.ts, global.d.ts, auth.ts, auth-client.ts, [...auth].ts, login.tsx, register.tsx, 6 schema/*.ts, 6 migrations, drizzle.config.ts, .gitignore, src-tauri/README.md
- 18.2: api/kb/ (6 route files), pipeline/ (7 files), FileDropZone.tsx, UploadProgress.tsx, (protected)/kb/ (3 UI pages)
- 18.3: api/kb/[kbId]/schemas/ (3 routes), schema/discover.ts, extract.ts, extractions.ts, extraction/ (4 lib files), SchemaFieldEditor.tsx, (protected)/kb/[kbId]/schema/ (3 pages), extract.tsx, extractions.tsx

**CF Resources created:**
- D1 KB_DB: `1e070dfd-dc58-4e21-897d-4ca5f2287017` (EEUR)
- D1 AUTH_DB: `7909c74e-2f5a-4df3-a05b-0611e09e466c` (EEUR)
- R2: harkly-uploads | KV: OAUTH_KV, AUTH_KV, SESSION_KV | Vectorize: harkly-kb (1024-dim, cosine)

**Completed:** 18.1 Scaffold, 18.2 Upload+Process, 18.3 Schema+Extract (code complete, build passes)
**Opened:** 18.4 MCP+OAuth, 18.5 Canvas Port, integration testing, auth session integration, cleanup
<!-- ENTRY:2026-03-19:CLOSE:174:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 174 CLOSE [Axis]

18.4 MCP + OAuth deployed (`harkly-mcp.nopoint.workers.dev`). 18.5 Canvas all 5 phases code complete (55+ files). Auth registration bug open (SolidStart event wrapping + BETTER_AUTH_SECRET + D1 adapter chain). 10/10 Playwright smoke tests green. harkly-web deployed to CF Pages.
---
