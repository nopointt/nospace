# Wave 1 Synthesis — CTX-09 UI/UX Polish
> Bayer UI Audit + Kandinsky UX Audit merged
> Date: 2026-03-30

---

## Design System Decisions (confirmed by nopoint)

| Decision | Value | Source |
|---|---|---|
| text-tertiary | #808080 (design system) | Fix index.css (#666666 -> #808080) |
| text-disabled | #CCCCCC (design system) | Fix index.css (#999999 -> #CCCCCC) |
| ConnectionModal | Light theme only | Remove dark colors, use existing tokens |
| Hover/pressed tokens | Add to design system | Derive by formula: mix(color, black, N%) |

**Known limitation:** #808080 = 3.78:1 contrast vs #FAFAFA — fails WCAG AA for normal text. Accepted by nopoint.

---

## Combined Findings (priority order)

### CRITICAL — block shipping

| ID | Source | Issue | Files | Fix |
|---|---|---|---|---|
| C-DS-01 | Bayer | index.css text-tertiary/disabled values wrong | index.css | Fix to #808080 / #CCCCCC |
| C-DS-02 | Bayer | No hover/pressed tokens for accent/error | index.css, color.md | Add 4 new tokens |
| C-DS-03 | Bayer | Landing.tsx: 58 arbitrary hex, 0 design tokens | Landing.tsx | Full token migration |
| C-DS-04 | Bayer | Privacy.tsx: 52 arbitrary hex | Privacy.tsx | Full token migration |
| C-DS-05 | Bayer | Terms.tsx: 50 arbitrary hex | Terms.tsx | Full token migration |
| C-DS-06 | Bayer | ConnectionModal.tsx: 38 hex, dark theme | ConnectionModal.tsx | Convert to light, use tokens |
| C-DS-07 | Bayer | Hero.tsx: 32 hex, inline styles | Hero.tsx | Convert inline styles to tokens |
| C-DS-08 | Bayer | Dashboard.tsx: 10 hex, inline styles | Dashboard.tsx | Convert to tokens |
| C-DS-09 | Bayer | DocumentModal.tsx: 10 hex + #EBEBEB off-palette | DocumentModal.tsx | Convert + decide on skeleton color |
| C-DS-10 | Bayer | Button.tsx: 5 hardcoded hex for states | Button.tsx | Use new hover/pressed tokens |
| C-DS-11 | Bayer | `hover:text-[#162f78]` in 9 instances across 5 auth files | Register, Login, ForgotPassword, VerifyEmail, ResetPassword | Use accent-hover token |
| C-DS-12 | Bayer | DocumentViewer.tsx: 6 inline style hex (D32F2F, 1E3EA0, 0A0A0A, E5E5E5) | DocumentViewer.tsx | Convert to Tailwind tokens |
| C-UX-01 | Kandinsky | F5: Two incompatible auth systems (AuthModal legacy vs Login better-auth) | AuthModal.tsx, Login.tsx | Unify to better-auth |
| C-UX-02 | Kandinsky | S3/S4: createEffect cleanup via return = dead code | ConnectionModal.tsx, DocumentModal.tsx | Use onCleanup() inside effect |

### HIGH — fix before release

| ID | Source | Issue | Files | Fix |
|---|---|---|---|---|
| H-UX-01 | Kandinsky | F1: 401 hard-redirect destroys unsaved state | api.ts:28-33 | Show "session expired" modal |
| H-UX-02 | Kandinsky | S1/S2: async inside createEffect loses tracking | Hero.tsx:152, Dashboard.tsx:172 | Use createResource |
| H-UX-03 | Kandinsky | A1/A2: Modals no focus management/trap | AuthModal, ConnectionModal, DocumentModal | Add focus trap + Escape + return |
| H-UX-04 | Kandinsky | A4: Errors shown under last field, not relevant field | Login, Register, ResetPassword | Error per field |
| H-UX-05 | Kandinsky | F4: "Login" button goes to /upload not /login | Settings.tsx:124, ApiPage.tsx:228 | Navigate to /login |
| H-DS-01 | Bayer | font-semibold (600) — not in DS scale (400/500/700) | Landing, Privacy, Hero, ConnectionModal, DocumentModal, DocumentViewer | Change to font-medium or font-bold |
| H-DS-02 | Bayer | Off-scale font sizes (11,13,15,17,18,22,28,36,42px) | Landing, Privacy, Terms, Hero, Dashboard, ConnectionModal, DocumentModal, DocumentViewer | Map to nearest DS size |
| H-DS-03 | Bayer | Off-scale line-heights (1.15,1.3,1.55,1.6,1.65,1.7) | Landing, Privacy, Terms, Hero | Map to 1.0/1.2/1.4/1.5 |
| H-DS-04 | Bayer | bg-white (27 instances) — semantically should be bg-bg-canvas | 10 files | Replace where it's page background |
| H-DS-05 | Bayer | outline-none deprecated in Tailwind v4 | Input.tsx:35, Hero.tsx:570 | Use outline-hidden |
| H-DS-06 | Bayer | AuthModal.tsx: bg-white hover:bg-gray-50 (off-palette default) | AuthModal.tsx:108 | bg-bg-canvas hover:bg-interactive-hover |

### MEDIUM — fix soon

| ID | Source | Issue | Files | Fix |
|---|---|---|---|---|
| M-UX-01 | Kandinsky | F3: YOUR_TOKEN visible to unauth users + copy works | Hero.tsx:370 | Hide connection section or disable copy |
| M-UX-02 | Kandinsky | A5: Toast no aria-live | Toast.tsx | Add aria-live="polite" |
| M-UX-03 | Kandinsky | A3: Missing autocomplete on auth inputs | Login, Register, ForgotPassword, ResetPassword | Add autocomplete attributes |
| M-UX-04 | Kandinsky | A7: ConfirmDialog no role="dialog" | Dashboard.tsx:95-113 | Add role + aria-modal |
| M-DS-01 | Bayer | KnowledgeGraph SVG fill #333333 hardcoded | KnowledgeGraph.tsx:644 | Use CSS variable |
| M-DS-02 | Bayer | ConnectionModal SVG stroke #4A4A4A | ConnectionModal.tsx:502,549 | Use currentColor |
| M-DS-03 | Bayer | KnowledgeGraph LOGO_COLOR #AAAAAA/#FFFFFF | KnowledgeGraph.tsx:171-172 | Review: exempt or token? |

### LOW — backlog

| ID | Source | Issue | Files | Fix |
|---|---|---|---|---|
| L-UX-01 | Kandinsky | F2: No 404 catch-all route | App.tsx | Add 404 route |
| L-UX-02 | Kandinsky | F6: Dashboard 420px query panel overflow | Dashboard.tsx:439 | Responsive |
| L-UX-03 | Kandinsky | S5-S8: && instead of Show, .map instead of For | Hero, DocumentViewer, DocumentModal | Refactor to SolidJS patterns |
| L-UX-04 | Kandinsky | A6: Query results no aria-live | Dashboard, Hero | Add aria-live |
| L-UX-05 | Kandinsky | A8: Dark drop zone keyboard focus barely visible | Hero.tsx | Improve focus indicator |

---

## Wave 2 Task Order

### Phase 2.0: Design System Foundation (before any file changes)
1. Fix index.css: text-tertiary #666666 -> #808080, text-disabled #999999 -> #CCCCCC
2. Add 4 hover/pressed tokens to index.css + color.md
3. Update design-audit-criteria.md with new tokens
4. Update Bayer hex-to-token reverse map

### Phase 2.1: Per-File Token Migration (largest files first)
1. Landing.tsx (64 violations)
2. Privacy.tsx (56 violations)
3. Terms.tsx (54 violations)
4. ConnectionModal.tsx (45 violations — also convert to light theme)
5. Hero.tsx (36 violations)
6. Dashboard.tsx (10 violations)
7. DocumentModal.tsx (11 violations)
8. DocumentViewer.tsx (6 violations)
9. Button.tsx (5 violations — use new tokens)
10. Remaining files (Login, Register, ForgotPassword, ResetPassword, VerifyEmail, AuthModal, Input, DropZone)

### Phase 2.2: UX Fixes
1. C-UX-02: Fix createEffect cleanup (ConnectionModal, DocumentModal)
2. H-UX-01: 401 → session expired modal (api.ts)
3. H-UX-02: async createEffect → createResource (Hero, Dashboard)
4. H-UX-03: Modal focus management (3 modals)
5. H-UX-04: Error per field (Login, Register, ResetPassword)
6. H-UX-05: Login button → /login (Settings, ApiPage)

### Phase 2.3: Auth Unification (C-UX-01)
- Decide: remove AuthModal legacy flow or convert it to better-auth
- This is architecturally significant — may need separate task

---

## Off-Palette Colors Reference (for implementation)

| Hex | Where | Count | Action |
|---|---|---|---|
| #162f78 | Button, Landing, auth pages | 14 | New token: accent-hover |
| #0f2260 | Button, Landing | 4 | New token: accent-pressed |
| #b71c1c | Button | 1 | New token: signal-error-hover |
| #961717 | Button | 1 | New token: signal-error-pressed |
| #F9F9F9 | Landing, Privacy | 5 | Replace with bg-canvas (#FAFAFA) |
| #F8F8F8 | Hero | 2 | Replace with bg-canvas (#FAFAFA) |
| #1A1A1A | Landing, Privacy, Terms, ConnectionModal | 5 | Remove (dark theme eliminated) |
| #141414 | ConnectionModal | 1 | Remove (dark theme eliminated) |
| #4A4A4A | ConnectionModal | 5 | Remove (dark theme eliminated) |
| #444 | Landing, Privacy, Terms | 3 | Replace with text-secondary (#333333) |
| #555 | Landing | 5 | Replace with text-tertiary (#808080) |
| #999 | Landing | 7 | Replace with text-disabled (#CCCCCC) |
| #333 | Privacy, Terms, Landing | ~50 | Replace with text-secondary (#333333) |
| #EBEBEB | DocumentModal | 2 | Decide: new skeleton token or use bg-elevated (#E5E5E5) |
| #C8D6F5 | Hero | 1 | Remove or define accent-tinted-border token |
| #F0F4FD | Hero | 1 | Remove or define accent-tinted-bg token |
| #F2F5FF | Landing | 1 | Remove or define accent-tinted-bg token |
| #FFFFFF | ConnectionModal, Hero, KnowledgeGraph | 4 | Replace with bg-canvas (#FAFAFA) or white token |

---

## Metrics After Wave 1

| Metric | Value |
|---|---|
| Total files audited | 29 |
| Files with violations | 18 |
| CRITICAL findings | 14 (DS) + 2 (UX) = 16 |
| HIGH findings | 6 (DS) + 5 (UX) = 11 |
| MEDIUM findings | 3 (DS) + 4 (UX) = 7 |
| LOW findings | 0 (DS) + 5 (UX) = 5 |
| Total | 39 findings |
