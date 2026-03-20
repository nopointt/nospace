# session-scratch.md
> Placeholder · Axis · session 8057119d · last processed checkpoint: #178

<!-- ENTRY:2026-03-20:CLOSE:179:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-20 — сессия 179 CLOSE [Axis]

**Decisions:**
- harkly-web (SolidStart + Nitro + CF Pages) = DEPRECATED. Полный стек нестабилен на production workerd.
- Pivot: Tauri + SolidJS first (harkly-shell, 77 файлов), web port later.
- 5 auth/DB багов пофикшено локально, canvas рендерится в local wrangler. Production POST body parsing сломан на уровне Nitro — unfixable без смены стека.

**Files changed:**
- `src/lib/auth.ts` — wrapD1 proxy: Date→ISO, boolean→0/1
- `src/routes/api/auth/[...auth].ts` — buildCleanRequest: обход Nitro body corruption
- `src/lib/auth-guard.ts` — async requireAuth, session fallback, returns null
- `src/lib/request-body.ts` — NEW readJsonBody helper
- `src/lib/schema/{core,extraction,canvas,observability,pipeline}.ts` — explicit snake_case column names
- `src/middleware/index.ts` — removed session check (consumed POST body)
- `src/routes/login.tsx` — redirect /kb
- `src/routes/index.tsx` — auth check + redirect
- `.dev.vars` — local dev secret
- `.gitignore` — .dev.vars
- 14 API route files — await requireAuth
- `BUG-REPORT-session-179.md` — full diagnostic report
- `e2e-canvas-flow.spec.ts` + prod tests — Playwright E2E

**Completed:**
- Canvas renders locally (full Playwright flow green: register→login→create KB→canvas)
- 5 bugs diagnosed and fixed: auth secret, Nitro body, D1 types, auth-guard context, Drizzle columns
- Bug report with root causes, solutions, and prevention reglamentsы
- Deployed to CF Pages (auth works, GET works, POST broken)

**Opened:**
- Production POST /api/kb = Nitro 500 (body parsing on workerd). Unfixable without stack change.
- Registration on prod intermittent (CF error 1102)
- DECISION: abandon harkly-web, restart on Tauri

**Notes:**
- Root cause: SolidStart + Nitro + CF Pages = 3 abstraction layers, each breaking in unique ways on workerd runtime
- harkly-shell (Tauri + SolidJS) already has 77 files with canvas, hooks, frames — reusable
- Full bug report: `harkly-web/BUG-REPORT-session-179.md`
