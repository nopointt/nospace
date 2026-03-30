---
# contexter-uiux-polish.md — CTX-09 UI/UX Polish Epic
> Layer: L3 | Epic: CTX-09 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-30 (session 216 — Wave 2.1 complete, 300 violations → 0)
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
- [x] 2a. Token compliance — **300 violations → 0** across 18 files (100%)
  - [x] Design system foundation: index.css text-tertiary/disabled fixed, 4 new hover/pressed tokens
  - [x] Landing.tsx (64→0), Privacy.tsx (56→0), Terms.tsx (54→0), ConnectionModal.tsx (45→0, dark→light)
  - [x] Hero.tsx (36→0), Dashboard.tsx (10→0), DocumentModal.tsx (11→0), DocumentViewer.tsx (6→0)
  - [x] Button.tsx (5→0), auth pages + AuthModal + Input + DropZone (13→0)
- [ ] 2b. Responsive — Hero, Dashboard, DocumentViewer, ApiPage
- [ ] 2c. Deduplication — lib/helpers.ts, Upload+Hero consolidation
- [ ] 2d. SolidJS fixes — createEffect cleanup (S3/S4), async effects (S1/S2), props patterns
- [ ] 2e. UX fixes — 401 modal (F1), auth unification (F5), login redirect (F4), error placement (A4), focus traps (A1/A2)

### Wave 3: Polish (Itten + Gropius + Albers)
- [ ] 3a. Component extraction — LoadingSkeleton, ErrorState, EmptyState
- [ ] 3b. Accessibility — focus, keyboard, aria, touch targets
- [ ] 3c. Cross-file consistency — nav, tokens, hover states
- [ ] 3d. Minor fixes — YOUR_TOKEN (F3), Toast aria-live (A5), autocomplete (A3), 404 route (F2)

### Wave 4: Verification (Moholy + Bayer + Kandinsky)
- [ ] 4a. Bayer re-audit — violation count → 0
- [ ] 4b. Kandinsky re-audit — all states PASS, a11y resolved
- [ ] 4c. Moholy E2E — critical flows in browser
- [ ] 4d. Breuer visual regression — Playwright screenshots

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

- ~~Design system conflicts (text-tertiary, text-disabled)~~ RESOLVED: design system values applied
- Upload.tsx vs Hero.tsx consolidation — need product decision (out of scope this epic)
