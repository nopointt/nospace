# session+174-scratch.md
> Harkly · Axis · 2026-03-19

<!-- ENTRY:2026-03-19:CLOSE:174:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 174 CLOSE [Axis]

**Decisions:**
- 18.4 MCP Worker deployed as separate CF Worker (`harkly-mcp.nopoint.workers.dev`)
- workers-oauth-provider types verified against real npm package — API matches
- SolidStart `event.context` is empty on CF Pages — must use `event.nativeEvent.context.cloudflare.env` for bindings
- better-auth requires `withCloudflare` + drizzle D1 adapter + `BETTER_AUTH_SECRET` secret + `geolocationTracking: false`
- Landing page removed `useSession()` dependency — was blocking SSR hydration
- Queues (producers/consumers) commented out — require Workers Paid plan
- Handshake memory system deprecated → scratches only

**Files changed:**
- `workers/harkly-mcp/` — 13+ files: full MCP Worker with OAuth 2.1, consent UI, login UI, 6 MCP tools
- `src/components/canvas/` — Space, FrameContainer, frameRegistry, ErrorBoundary (Phase 1-2 canvas port)
- `src/components/frames/` — 11 frame components (Opus agent)
- `src/hooks/` — useViewport, useComponents, useSnap, useFloor
- `src/lib/canvas/` — types, constants, entity-mapper
- `src/components/kb/` — DocumentsTab, SchemaTab, ExtractionsTab (Opus agent)
- `src/components/layout/` — Header, Sidebar, ProtectedLayout (Opus agent)
- `src/components/ui/` — Toast, Skeleton, EmptyState (Opus agent)
- `src/components/canvas/Omnibar/` — Omnibar, OmnibarInput (Opus agent)
- `src/lib/commands/` — registry, defaults (Opus agent)
- `src/routes/(protected)/` — dashboard, KB detail, canvas, extract, extractions, schema pages (Opus agent)
- `src/routes/api/kb/[kbId]/canvas/` — auto-layout, index
- `src/routes/index.tsx` — simplified landing
- `src/routes/login.tsx`, `src/routes/register.tsx`
- `src/middleware/index.ts` — nativeEvent.context.cloudflare.env fix
- `src/lib/auth.ts` — withCloudflare + drizzle D1 adapter
- `src/lib/db.ts` — nativeEvent fallback
- `src/routes/api/auth/[...auth].ts` — direct handlers
- `wrangler.toml` — queues commented out
- `e2e-smoke.spec.ts` — 10/10 passing Playwright tests
- `drizzle/migrations/kb/0004_canvas.sql`, `0005_observability.sql`
- All API routes: `requireAuth` replacing hardcoded "demo-user" (Qwen CLI)

**Completed:**
- Tech debt: tenantId "demo-user" → auth session (9 files), wrangler.jsonc noted, temp specs noted
- 18.4 MCP + OAuth: deployed + all endpoints verified (metadata, client reg, /authorize redirect, /mcp 401)
- 18.5 Canvas Phase 1-2: 22 files, 3008 lines (first Opus agent)
- 18.5 Canvas Phase 3-5: D1 integration, dashboard, omnibar (second Opus agent — files created)
- D1 migrations applied to remote (auth + kb, 5 migrations total)
- Playwright E2E: 10/10 smoke tests passing
- harkly-web deployed to CF Pages (`harkly-web.pages.dev`)

**Opened:**
- **AUTH REGISTRATION BUG** — sign-up/sign-in returns 500. Root cause chain: SolidStart event wrapping → missing BETTER_AUTH_SECRET → D1 adapter → geolocation. Last state: geolocation disabled, still 500. Needs 1-2 more iterations.
- **Pre-existing TS errors (29)** — APIEvent import, middleware FetchEvent types, entry-server, embedder, zod-compiler. Not from this session.
- nopoint requested: 3 parallel tracks (bug hunt + test coverage + tech debt audit) — not started yet
- `src/routes/api/debug.ts` — debug endpoint left in codebase, should be removed for prod
- Queues not available (Workers Paid plan?) — async ingest blocked

**Notes:**
- **CRITICAL FEEDBACK**: never go on long debug sessions (3+ cycles) without warning nopoint first
- Qwen CLI works for focused coding tasks (auth fix: 9 files, 0 errors)
- Opus subagent for canvas port was very effective (22 files Phase 1-2, then ~30 files Phase 3-5)
- `event.nativeEvent.context.cloudflare.env` is the correct path for CF bindings in SolidStart on CF Pages — this is not documented anywhere obvious
