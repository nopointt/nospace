# session-scratch.md
> Active · Axis · 2026-03-30 · session follows 216

<!-- ENTRY:2026-03-30:CHECKPOINT:217:contexter:contexter-uiux-polish [AXIS] -->
## 2026-03-30 — checkpoint 217 [Axis]

**Decisions:**
- ConnectionModal AI brand colors (#CC785C, #10A37F, #20808D, #7C3AED) = EXEMPT, same rationale as Landing.tsx brand dots (Oud P-14: external standards, not individual design)
- KnowledgeGraph #AAAAAA → var(--color-border-default), #FFFFFF → var(--color-white) — Mondrian P-35: no component outside the system
- Off-scale font sizes 11→12, 13→12, 15→14, 42→48 — Zeitschrift + Oud P-14: system > individual
- leading-[1.6]/leading-relaxed → leading-[1.5] — Kandinsky P-19: exclusion of Zutaten
- Session expiry (H-3) and window.confirm (M-3) deferred to backlog — architectural
- C-UX-01 (AuthModal legacy vs Login better-auth unification) deferred to backlog — product decision

**Files changed:**
- `web/src/index.css` — design tokens confirmed (no changes needed)
- `web/src/components/Nav.tsx` — inline hex→Tailwind, text-[13px]→text-xs
- `web/src/pages/Upload.tsx` — bg-white→bg-bg-canvas, leading-relaxed→leading-[1.5]
- `web/src/components/Input.tsx` — bg-white→bg-bg-canvas, autocomplete prop, aria-invalid, aria-describedby, id prop
- `web/src/pages/Login.tsx` — bg-white→bg-bg-canvas, autocomplete, error display moved, hover standardized
- `web/src/components/Toast.tsx` — bg-white→bg-bg-canvas, aria-live="polite", role="status"
- `web/src/components/KnowledgeGraph.tsx` — 5 hex constants→var() tokens
- `web/src/pages/Hero.tsx` — responsive (px-4 md:px-16, sidebar w-full md:w-[440px]), helpers deduped, async createEffect extracted, YOUR_TOKEN section guarded by isAuthenticated(), aria-live on query results
- `web/src/pages/Dashboard.tsx` — responsive (flex-col md:flex-row, sidebar w-full md:w-[420px], hidden cols), helpers deduped, async createEffect extracted, ErrorState/EmptyState components, aria-live on query results
- `web/src/pages/DocumentViewer.tsx` — responsive (px-4 md:px-16 max-w-[900px]), helpers deduped, ErrorState component
- `web/src/pages/ApiPage.tsx` — responsive (px-4 md:px-8 lg:px-16), leading-relaxed→leading-[1.5], navigate→/login
- `web/src/pages/Settings.tsx` — navigate→/login
- `web/src/pages/Landing.tsx` — hover:text-black→hover:text-text-primary, text-[11/13px]→text-xs
- `web/src/pages/Privacy.tsx` — hover standardized, md:text-[42px]→md:text-[48px]
- `web/src/pages/Terms.tsx` — hover standardized, md:text-[42px]→md:text-[48px]
- `web/src/pages/Register.tsx` — autocomplete, error display moved, leading-[1.6]→leading-[1.5]
- `web/src/pages/ForgotPassword.tsx` — autocomplete, hover standardized, leading-[1.6]→leading-[1.5]
- `web/src/pages/ResetPassword.tsx` — autocomplete, error display moved, leading-[1.6]→leading-[1.5]
- `web/src/pages/VerifyEmail.tsx` — leading-[1.6]→leading-[1.5]
- `web/src/components/AuthModal.tsx` — focus management, Tab trap, Escape, role="dialog", aria-labelledby, hover:text-black→hover:text-text-primary
- `web/src/components/ConnectionModal.tsx` — onCleanup fix, focus management, Tab trap, role="dialog", aria-labelledby, font-size inline→Tailwind, rgba→bg-black/50
- `web/src/components/DocumentModal.tsx` — onCleanup fix, focus management, Tab trap, role="dialog", aria-labelledby, ErrorState component, rgba→bg-black/50
- `web/src/components/ErrorState.tsx` — NEW: shared error state component
- `web/src/components/EmptyState.tsx` — NEW: shared empty state component
- `web/src/lib/helpers.ts` — NEW: 5 shared helper functions (formatSize, formatDate, formatDateFull, statusToVariant, mimeShort)
- `web/src/lib/api.ts` — removed 401 hard redirect
- `web/src/App.tsx` — 404 catch-all route
- `web/src/index.tsx` — 404 catch-all route

**Completed:**
- Wave 2a: Token compliance (300+13 → 0 violations)
- Wave 2b: Responsive (4 pages, 21 breakpoints)
- Wave 2c: Deduplication (lib/helpers.ts, 5 files)
- Wave 2d: SolidJS fixes (P1×2, P3×2)
- Wave 2e: UX fixes (4/5, C-UX-01 deferred)
- Wave 3a: ErrorState + EmptyState components
- Wave 3b: Accessibility (aria-live, role="dialog", autocomplete×9, aria-invalid, Tab trap×3)
- Wave 3c: Hover state consistency (16 standardized)
- Wave 3d: YOUR_TOKEN guard, 404 route, AuthModal hover
- Wave 4a: Bayer re-audit → fixes (24 font sizes, 13 line-heights, 2 rgba)
- Wave 4b: Kandinsky re-audit → fixes (aria-labelledby×3, route fix, aria-describedby, aria-live×2)

**In progress:**
- Wave 4c: Moholy E2E (not started — needs dev server + Playwright)
- Wave 4d: Breuer visual regression (not started — needs dev server)

**Opened:**
- Backlog: H-3 session expiry leaves user stranded (needs navigate to /login after 401)
- Backlog: M-3 window.confirm for duplicates (Hero:257, Upload:272) → replace with ConfirmDialog
- Backlog: C-UX-01 AuthModal legacy vs Login better-auth unification

**Notes:**
- All builds pass throughout
- Bauhaus RAG (Qdrant) consulted for: KnowledgeGraph color decision, font scale enforcement, brand color exemption
- ~30 files modified across Waves 2-4
- ConnectionModal still heavy on inline styles (functional but not ideal — future refactor candidate)

<!-- ENTRY:2026-03-30:CLOSE:218:contexter:contexter-uiux-polish [AXIS] -->
## 2026-03-30 — сессия 218 CLOSE [Axis]

**Decisions:**
- CTX-09 UI/UX Polish epic: Waves 2-4 complete, deployed to production
- Pipeline indicator redesign: format-specific labels (6 groups), visual state grammar, time estimates, completion toast, human-readable errors, mobile responsive, aria-live
- Bauhaus RAG consulted for all design decisions (Mondrian P-35, Oud P-14, Kandinsky P-19, Zeitschrift)
- Brand colors (AI clients in ConnectionModal/Landing) = EXEMPT per Oud P-14
- deploy-web.sh fixed: --branch=main (was =production → Preview env), added CF cache purge + content verification
- Hetzner rescaled CAX11 → CAX21 (4GB→8GB RAM, €3.99→€6.99/mo)
- Docling mem_limit raised 1536m → 3072m
- Backlog deferred: H-3 (session expiry redirect), M-3 (window.confirm), C-UX-01 (AuthModal unification), pipeline scaling architecture

**Files changed (post-checkpoint 217):**
- `web/src/components/PipelineIndicator.tsx` — full rewrite: format-specific labels, visual state grammar, mobile abbreviated labels, aria-live, aria-label per stage
- `web/src/pages/Hero.tsx` — mimeType→PipelineIndicator, time estimate, completion toast, humanized errors, failed stage label, running→active statusMap fix, ctrl+v button
- `web/src/pages/Upload.tsx` — same pipeline fixes (mimeType, toast, humanized errors, running→active)
- `web/src/lib/helpers.ts` — added humanizeError() and getTimeEstimate()
- `web/src/pages/Landing.tsx` — text-text-disabled→text-text-secondary/text-black for visibility, "Работает со всеми..." font-medium text-sm
- `ops/deploy-web.sh` — --branch=main fix, CF cache purge step, content verification with retry
- `web/public/_headers` — NEW: Cache-Control no-cache for HTML, immutable for assets
- Server: `/opt/contexter/docker-compose.yml` — Docling memory 1536m→3072m

**Completed:**
- CTX-09 Waves 2a-2e, 3a-3d, 4a-4d — all complete
- Pipeline indicator redesign (P1-P8) — all complete, deployed
- ctrl+v button on drop zone — deployed
- Landing text visibility fixes — deployed
- deploy-web.sh branch fix — deployed
- Hetzner CAX11→CAX21 rescale — done
- Docling memory limit increase — done
- 10/10 E2E smoke tests pass
- 18 Playwright visual regression screenshots — 0 issues

**Opened:**
- Docling OOM recurrence even on CAX21 — needs structural fix (circuit breaker reset API, retry config)
- Pipeline scaling architecture for 1K+ users — Docling single worker bottleneck
- Backlog: H-3, M-3, C-UX-01

**Notes:**
- ~35 files modified total this session
- 8 Gropius passes (Player), 2 Bayer audits, 2 Kandinsky audits, 1 Mies diagnostic
- Bauhaus RAG (Qdrant) = source of truth for all design decisions
- CF Pages deploy was silently going to Preview environment for multiple deploys — root cause: --branch=production instead of --branch=main
