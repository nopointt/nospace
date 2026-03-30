---
# contexter-uiux-polish.md — CTX-09 UI/UX Polish Epic
> Layer: L3 | Epic: CTX-09 | Status: ✅ COMPLETE
> Last updated: 2026-03-30 (session 218 — All waves complete, deployed, pipeline indicator redesigned)
---

## Goal

Привести весь фронтенд в соответствие с design system, закрыть UX gaps, сделать responsive. Zero hardcoded hex, zero SolidJS anti-patterns, WCAG 2.2 AA compliant.

## Plan

Full plan: `~/.claude/plans/humming-riding-marshmallow.md`
Wave 1 synthesis: `memory/wave1-synthesis.md` (39 findings, prioritized)

## Waves

### Wave 1: Audit (Kandinsky + Bayer parallel) ✅
- [x] 1a. Bayer UI Audit — 39 findings (16 CRIT, 11 HIGH, 7 MED, 5 LOW)
- [x] 1b. Kandinsky UX Audit — 12 findings (3 HIGH, 5 MEDIUM, 4 LOW)
- [x] 1c. Synthesis — merged, prioritized, off-palette reference table

### Wave 2: Foundation (Gropius implements)
- [x] 2a. Token compliance — **300+13 violations → 0** across 18 files (100%)
  - [x] Design system foundation: index.css text-tertiary/disabled fixed, 4 new hover/pressed tokens
  - [x] Landing.tsx, Privacy.tsx, Terms.tsx, ConnectionModal.tsx, Hero.tsx, Dashboard.tsx, DocumentModal.tsx, DocumentViewer.tsx, Button.tsx, auth pages, AuthModal, Input, DropZone, KnowledgeGraph.tsx, Nav.tsx
- [x] 2b. Responsive — Hero, Dashboard, DocumentViewer, ApiPage (21 breakpoints)
- [x] 2c. Deduplication — lib/helpers.ts (5 functions, 5 files)
- [x] 2d. SolidJS fixes — P1 onCleanup (×2), P3 async createEffect (×2)
- [x] 2e. UX fixes — 401 redirect removed, login redirect fixed, error display moved, focus management (×3). C-UX-01 deferred.

### Wave 3: Polish (Itten + Gropius + Albers) ✅
- [x] 3a. Component extraction — ErrorState, EmptyState (LoadingSkeleton skipped — too varied)
- [x] 3b. Accessibility — aria-live, role="dialog"(×3), autocomplete(×9), aria-invalid, Tab trap(×3), aria-labelledby(×3), aria-describedby
- [x] 3c. Cross-file consistency — 16 hover states standardized
- [x] 3d. Minor fixes — YOUR_TOKEN guarded, 404 catch-all, AuthModal hover

### Wave 4: Verification ✅
- [x] 4a. Bayer re-audit → fixes (24 font sizes, 13 line-heights, 2 rgba)
- [x] 4b. Kandinsky re-audit → fixes (aria-labelledby, route, aria-describedby, aria-live)
- [x] 4c. Moholy E2E — 10/10 smoke tests pass
- [x] 4d. Breuer visual regression — 18 screenshots, 0 issues

### Pipeline Indicator Redesign ✅
- [x] P1. Format-specific stage labels (6 groups)
- [x] P2. Visual state grammar (colors, font-sans, lowercase)
- [x] P3. Time estimate for slow formats
- [x] P4. Completion toast (>5s)
- [x] P5. Human-readable error messages
- [x] P6. Mobile responsive (<640px abbreviated labels)
- [x] P7. aria-live + aria-label per stage
- [x] P8. Deploy + verify

### Post-epic fixes
- [x] ctrl+v button on drop zone
- [x] Landing text visibility (text-disabled→text-secondary/text-black)
- [x] deploy-web.sh: --branch=main fix + CF cache purge + content verification
- [x] Hetzner CAX11→CAX21 (8GB RAM)
- [x] Docling mem_limit 1536m→3072m
- [x] statusMap: running→active fix (Hero + Upload)

## Success Criteria

| Metric | Current | Target |
|---|---|---|
| Hardcoded hex | ~~235+~~ **0** ✅ | 0 |
| Non-responsive pages | 3 | 0 |
| SolidJS anti-patterns | 8 (from Kandinsky) | 0 |
| State completeness | partial | all PASS |
| WCAG 2.2 AA critical | 2 (focus traps) | 0 |
| Files >700 lines | 2 | 0 |

## Research

- `docs/research/ux-review-agent-research.md` (905 lines)
- `docs/research/ui-visual-review-agent-research.md` (613 lines)
- `docs/research/review-agent-prompts-seed-research.md` (887 lines)
- `docs/research/review-company-practices-seed-research.md`
- `docs/research/review-agent-architectures-seed-research.md` (892 lines)
- `docs/research/solidjs-tailwind-review-seed-research.md` (1537 lines)

## Agents Created

- **Kandinsky** — UX Reviewer (`~/.claude/agents/kandinsky.md`)
- **Bayer** — UI Reviewer (`~/.claude/agents/bayer.md`)

## Blockers

- ~~Design system conflicts (text-tertiary, text-disabled)~~ RESOLVED
- ~~Upload.tsx vs Hero.tsx consolidation~~ Deferred to backlog
- Backlog: H-3 session expiry redirect, M-3 window.confirm→ConfirmDialog, C-UX-01 AuthModal unification
- Backlog: Docling circuit breaker reset API, retry config optimization
- Backlog: Pipeline scaling architecture for 1K+ users
