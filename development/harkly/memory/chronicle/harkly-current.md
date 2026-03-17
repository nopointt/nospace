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
