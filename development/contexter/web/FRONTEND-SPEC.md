# Contexter Frontend — CTO Spec for G3 Implementation

## Mission
Build a Minimum Lovable Product frontend for Contexter — a RAG-as-a-service product. This will be shown to Artem (CPO ProxyMarket, technically decent C-level) for UX testing with screen recording.

## Stack
- SolidJS 1.9 + Vite 8 + Tailwind CSS 4 (already scaffolded)
- JetBrains Mono — single typeface everywhere
- Deployed to Cloudflare Pages (static SPA)
- API: `https://contexter.nopoint.workers.dev` (fully working)

## Design System Source of Truth

### Files to read (MANDATORY before any code):
1. `nospace/design/contexter/guidelines/color.md` — 26 color tokens
2. `nospace/design/contexter/guidelines/typography.md` — type scale, 11 roles
3. `nospace/design/contexter/guidelines/spacing.md` — 4px atom, 12-step scale
4. `nospace/design/contexter/guidelines/layout.md` — 12-col grid, 8:4 split, 1280px max
5. `nospace/design/contexter/guidelines/elevation.md` — no shadows, color shift only
6. `nospace/design/contexter/components/inventory.md` — Button×4, Input, Badge×4, Pipeline, DropZone, DataTable
7. `nospace/design/contexter/patterns/interaction.md` — state machine, 6 patterns

### Pencil Design (visual reference):
- File: `nospace/design/contexter/contexter-ui.pen`
- Use `mcp__pencil__get_screenshot` to see each screen
- Key node IDs:
  - `ilJuB` — Screen 1 Hero (landing + upload)
  - `NQerr` — Screen 2 Dashboard (documents + query)
  - `PC7wO` — 2.3 upload:processing
  - `ssJNg` — 5.5 dash:empty
  - `NXcPB` — 9.1 settings:overview
  - `as2LF` — 10.1 auth:register-prompt

### Pencil Node Structure (exact values):
Use `mcp__pencil__batch_get` with `readDepth: 3` and `resolveVariables: true` to get exact px values for any node.

## Current Code State

### Working:
- Scaffold: SolidJS + Vite + Tailwind CSS 4 + router
- 10 components: Logo, Button, Input, Badge, PipelineIndicator, DropZone, DataTable, Nav, Toast, AuthModal
- 5 pages: Hero, Dashboard, ApiPage, Settings, Upload (redirects to /)
- API integration: lib/api.ts (all endpoints), lib/store.ts (auth state)
- CSS tokens: 26 variables in @theme, @layer base reset (FIXED)
- Build passes, dev server works

### Broken / Needs Fix:
1. **Visual quality far from Pencil design** — structure correct but styling doesn't match
2. **Typography hierarchy** — sizes don't match Pencil (display 48px, h1 32px, h2 24px, body 14px, label 12px, caption 10px)
3. **Spacing** — not following 4px grid consistently
4. **Component rendering** — components exist but may not match design tokens exactly
5. **Layout grid** — 8:4 split works but proportions/gaps may be off
6. **Nav labels** — `/settings` shows "подключение" but should show "настройки"

## Design Rules (NON-NEGOTIABLE):
- JetBrains Mono ONLY (font-mono in Tailwind)
- 0px corners EVERYWHERE — no border-radius
- NO shadows — elevation via bg color shift only
- 3 colors: black #0A0A0A, white #FAFAFA, accent #1E3EA0
- Chromatic color < 5% of viewport
- Lowercase dominant for headings, buttons, nav
- All UI text in Russian

## What "Done" Looks Like:
1. Open http://localhost:3000/ — Hero page matches Pencil screenshot pixel-close
2. Click through all pages — every page matches its Pencil counterpart
3. Upload a file — pipeline visualization works
4. Query documents — answer with sources renders correctly
5. Artem can navigate without asking "what do I press?"

## Verification Method:
For EVERY page: take Playwright screenshot (1440×900) → take Pencil screenshot (same node) → compare side-by-side → fix differences.
