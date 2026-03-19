---
# HARKLY-18.5 — Canvas Port
> Parent: HARKLY-18 | Status: ⬜ BLOCKED by 18.3
> Spec: `docs/research/harkly-mvp-build-plan.md` Phase 4
> Source: `development/harkly/harkly-shell/src/` (77 SolidJS files)
---

## Required Reading (before any code)

1. `nospace/docs/research/harkly-eval-ui-canvas.md` — FULL (quantum Tauri config, solid-pages CF patterns, solid-flow rejected, canvas recommendation, Frontend Architecture)
2. `nospace/docs/research/harkly-mvp-architecture.md` — section 6 (Frontend Architecture, build matrix)
3. `nospace/docs/research/harkly-mvp-copy-map.md` — sections 3 (Existing Harkly Code), 4 (Port from harkly-saas)
4. `nospace/development/harkly/harkly-shell/src/` — browse file tree, understand structure before porting
5. `nospace/docs/research/harkly-mvp-api-spec.md` — section 4 (Canvas endpoints)

## Goal

Spatial canvas shows entities from extracted data. Existing harkly-shell components ported to web SolidStart. Product usable end-to-end.

## What to Port from harkly-shell

**Canvas core:**
- `Space.tsx` → canvas container with transform matrix (pan/zoom)
- `useViewport.ts` → viewport state
- `useFloor.ts` → floor/layer management
- `useSnap.ts` + `snapUtils.ts` → snap behavior
- `coordinates.ts` → coordinate math

**Frame system:**
- `frameRegistry.tsx` → frame type registry
- `WindowFrame.tsx` → base frame wrapper (drag, resize)
- `frames/harkly/SourceCardFrame.tsx` → document source card
- `frames/harkly/InsightsFrame.tsx` → extraction insights
- `frames/harkly/NotebookFrame.tsx` → notes
- `frames/harkly/RawDataFrame.tsx` → raw chunk viewer
- `frames/harkly/ArtifactsFrame.tsx` → artifacts

**Omnibar (hidden in MVP, ported for v1.1):**
- `Omnibar.tsx`, `OmnibarInput.tsx`, `OmnibarBody.tsx`
- `commandRegistry.ts`, `defaultCommands.ts`

## Tasks

- [ ] Port Space.tsx → SolidStart route `/(protected)/canvas.tsx`
- [ ] Port useViewport, useFloor, useSnap hooks
- [ ] Port frameRegistry + WindowFrame
- [ ] Port 5 Harkly-specific frames
- [ ] Remove Tauri-specific imports (@tauri-apps/api), replace IPC with fetch
- [ ] Connect canvas to D1: each entity type → node type, each extracted row → node
- [ ] Auto-layout: grid arrangement, user can drag
- [ ] Persist canvas state to D1 (canvas_frames, canvas_viewports tables)
- [ ] Port Omnibar (hidden by default, Cmd+K to open)
- [ ] Dashboard: list knowledge bases with stats
- [ ] KB detail page: documents, schema, extractions, canvas
- [ ] Error handling: loading spinners, error toasts, empty states
- [ ] Full end-to-end flow: upload → schema → extract → query → canvas

## Adaptation Notes

- harkly-shell uses `kernel.ts` for tLOS-specific kernel connection → remove entirely
- `useIntentPipeline.ts` → adapt or remove (tLOS agent routing, not needed)
- `useKernelHealth.ts` → remove (tLOS-specific)
- `LatticeStatus.tsx`, `BranchPill.tsx`, `CoordPill.tsx` → evaluate: keep spatial UI or simplify
- All `frames/mcb/*` (marketing frames) → skip, not for MVP
- All `frames/G3*`, `frames/Agent*`, `frames/Kernel*` → skip, tLOS-specific

## Acceptance

- [ ] Canvas loads with entities from extracted data as nodes
- [ ] Pan + zoom work smoothly
- [ ] Click node → detail frame with extracted fields + source
- [ ] Drag nodes, positions persist on reload
- [ ] Dashboard shows knowledge bases with correct stats
- [ ] Full flow: upload → schema → extract → canvas
