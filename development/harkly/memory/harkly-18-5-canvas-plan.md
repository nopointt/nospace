---
# HARKLY-18.5 — Canvas Port: Implementation Plan
> Parent: HARKLY-18 | Status: ⬜ UNBLOCKED (18.3 ✅)
> Created: 2026-03-19 | Author: Axis
> Sources: harkly-eval-ui-canvas.md, harkly-mvp-architecture.md, harkly-mvp-copy-map.md, harkly-shell audit (77 files, 8830 lines)
---

## Goal

Пространственный canvas показывает extracted data как ноды. Существующие harkly-shell компоненты (77 SolidJS файлов) портированы в web SolidStart. Продукт работает end-to-end: upload → schema → extract → canvas.

---

## Porting Assessment

**Исходник:** `development/harkly/harkly-shell/src/` — 77 файлов, ~8830 строк.

| Категория | Файлов | Строк | Web-ready? | Effort |
|---|---|---|---|---|
| Canvas core (Space, viewport, snap) | 5 | ~500 | ✅ 100% | Trivial |
| Frame system (registry, WindowFrame) | 2 | ~420 | ✅ 100% | Trivial |
| Harkly frames (7 специализированных) | 7 | ~600 | ✅ 100% | Trivial |
| Omnibar (5 panels + input) | 6 | ~800 | ⚠️ 90% | Moderate — mock kernel → real API |
| Hooks (viewport, components, snap, floor) | 6 | ~600 | ✅ 100% | Trivial |
| State (types, constants, commands) | 6 | ~400 | ✅ 100% | Trivial |
| Kernel + intent pipeline | 2 | ~220 | ❌ rewrite | Significant — mock → fetch/WS |
| App.tsx (orchestrator) | 1 | ~250 | ⚠️ 80% | Moderate — remove Tauri APIs |
| tLOS-only frames (Agent, G3, Kernel, MCB) | 25+ | ~3000 | ❌ skip | Not porting |

**Tauri dependency:** 1 import (`@tauri-apps/api/window`), 5 вызовов (maximize/minimize/close/resize). Заменяется на browser APIs.

**Bottom line:** ~5500 строк бизнес-логики копируются as-is. ~300 строк Tauri → browser mock. ~3000 строк tLOS-specific → skip.

---

## Architecture — Web Canvas

```
SolidStart Route: /(protected)/kb/[kbId]/canvas

┌─────────────────────────────────────────────────┐
│  CanvasPage.tsx                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ Space.tsx (infinite grid, pan/zoom)         ││
│  │  ├── FrameLayer (DynamicComponent × N)      ││
│  │  │    ├── SourceCardFrame                   ││
│  │  │    ├── InsightsFrame                     ││
│  │  │    ├── RawDataFrame                      ││
│  │  │    ├── NotebookFrame                     ││
│  │  │    └── ArtifactsFrame                    ││
│  │  ├── SelectionOverlay (group select)        ││
│  │  └── GridBackground (canvas 2D)             ││
│  ├─────────────────────────────────────────────┤│
│  │ Omnibar (fixed, bottom-left, hidden MVP)    ││
│  │ FloorIndicator (current research phase)     ││
│  │ Toolbar (zoom controls, fit-to-screen)      ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘

Data flow:
  D1 (extractions) → API fetch → SolidJS store → frames on canvas
  User drag/resize → debounced save → API persist (canvas_frames table)
```

---

## Phases

### Phase 1: Canvas Core Port (1 session)

**Goal:** Пустой canvas с pan/zoom/grid работает в SolidStart.

| # | Task | Source → Target | Notes |
|---|---|---|---|
| 1.1 | Copy types | `types/frame.ts` → `src/lib/canvas/types.ts` | FrameData, Viewport, Floor. Remove tLOS-specific types (KernelMessage, etc.) |
| 1.2 | Copy constants | `constants.ts` → `src/lib/canvas/constants.ts` | Snap thresholds, window defaults, grid params |
| 1.3 | Port Space.tsx | `Space.tsx` → `src/components/canvas/Space.tsx` | Canvas 2D grid. Zero changes needed. |
| 1.4 | Port useViewport | `useViewport.ts` → `src/hooks/useViewport.ts` | Mouse/wheel handlers. Add touch pinch-zoom for mobile. |
| 1.5 | Port DynamicComponent | `DynamicComponent.tsx` → `src/components/canvas/FrameContainer.tsx` | Rename for clarity. Remove kernel references. Keep RAF throttling, shared event delegation. |
| 1.6 | Create CanvasPage route | — → `src/routes/(protected)/kb/[kbId]/canvas.tsx` | SolidStart route. Import Space + viewport hook. Protected by auth middleware. |
| 1.7 | Add touch support | — | `onTouchStart/Move/End` for single-finger pan, two-finger pinch zoom. |

**Verification:**
```
Open http://localhost:3000/kb/test/canvas
Expected: infinite grid, pan with middle-mouse/touch, zoom with wheel/pinch
No frames yet — just empty canvas
```

---

### Phase 2: Frame System + Harkly Frames (1 session)

**Goal:** Frames render on canvas, drag/resize работает. 5 Harkly frames портированы.

| # | Task | Source → Target | Notes |
|---|---|---|---|
| 2.1 | Port frame registry | `frameRegistry.tsx` → `src/components/canvas/frameRegistry.ts` | Keep only Harkly frames (7) + system frames (window, text, panel, error). Drop: Agent*, G3*, Kernel*, MCB*, Terminal. |
| 2.2 | Port useComponents | `useComponents.ts` → `src/hooks/useComponents.ts` | Store + signals. Replace localStorage with D1 persistence (Phase 3). Keep localStorage as fallback. |
| 2.3 | Port useSnap | `useSnap.ts` + `snapUtils.ts` → `src/hooks/useSnap.ts` | Multi-select, group drag/resize. Copy as-is. |
| 2.4 | Port useFloor | `useFloor.ts` → `src/hooks/useFloor.ts` | 6 research phases. Copy as-is. |
| 2.5 | Port SourceCardFrame | `frames/harkly/SourceCardFrame.tsx` → `src/components/frames/SourceCard.tsx` | Document source card. Adapt to show D1 source data. |
| 2.6 | Port InsightsFrame | `frames/harkly/InsightsFrame.tsx` → `src/components/frames/Insights.tsx` | Extraction insights list. Connect to D1 extractions. |
| 2.7 | Port NotebookFrame | `frames/harkly/NotebookFrame.tsx` → `src/components/frames/Notebook.tsx` | Research notepad. Copy as-is. |
| 2.8 | Port RawDataFrame | `frames/harkly/RawDataFrame.tsx` → `src/components/frames/RawData.tsx` | Raw chunk viewer. Connect to D1 chunks. |
| 2.9 | Port ArtifactsFrame | `frames/harkly/ArtifactsFrame.tsx` → `src/components/frames/Artifacts.tsx` | Artifact type selector. Copy as-is. |
| 2.10 | Port CollectionPlanFrame | `frames/harkly/CollectionPlanFrame.tsx` → `src/components/frames/CollectionPlan.tsx` | Copy and adapt. |
| 2.11 | Port FramingStudioFrame | `frames/harkly/FramingStudioFrame.tsx` → `src/components/frames/FramingStudio.tsx` | Copy and adapt. |

**Verification:**
```
Open canvas → hardcoded test frames appear
Drag frame → position updates
Resize frame → size updates
Double-click → select group
Floor navigation (Ctrl+Alt+Wheel) works
```

---

### Phase 3: Data Integration — D1 → Canvas (1 session)

**Goal:** Canvas отображает реальные extracted данные из D1. Позиции frame'ов персистятся.

| # | Task | Files | Notes |
|---|---|---|---|
| 3.1 | D1 migration: `canvas_frames` table | migration file | `id, kb_id, user_id, frame_type, x, y, width, height, floor, data_ref, is_pinned, created_at, updated_at` |
| 3.2 | D1 migration: `canvas_viewports` table | migration file | `id, kb_id, user_id, x, y, zoom, current_floor, current_branch, updated_at` |
| 3.3 | API: GET /api/kb/[kbId]/canvas | route file | Returns `{ frames: FrameData[], viewport: Viewport }` from D1 |
| 3.4 | API: PUT /api/kb/[kbId]/canvas | route file | Saves frame positions + viewport state. Debounced from client (500ms). |
| 3.5 | API: POST /api/kb/[kbId]/canvas/auto-layout | route file | Given extracted data, generate initial frame positions (grid layout). Called once after first extraction. |
| 3.6 | Entity → Frame mapping | `src/lib/canvas/entity-mapper.ts` | Each schema entity type → frame type. Each extracted row → frame instance with data. Default: SourceCardFrame for documents, InsightsFrame for extractions. |
| 3.7 | Replace localStorage persistence | `useComponents.ts` | Load from API on mount, debounced save to API on change. Offline fallback to localStorage. |
| 3.8 | Auto-layout algorithm | `src/lib/canvas/layout.ts` | Grid: 3-4 columns, 20px gap, sorted by source. Frame size based on content. User can drag to rearrange — custom positions override auto-layout. |

**Verification:**
```bash
# Upload a document → extract → open canvas
# Expected: frames appear with extracted data, positioned in grid
# Drag a frame → reload page → position preserved
# Add new extraction → new frames appear at bottom
```

---

### Phase 4: Dashboard + Navigation (1 session)

**Goal:** Пользователь видит список KB, может перейти в canvas, полный flow работает.

| # | Task | Files | Notes |
|---|---|---|---|
| 4.1 | Dashboard route | `src/routes/(protected)/index.tsx` | List of knowledge bases with stats: docs count, extractions count, last updated. Link to `/kb/[kbId]`. |
| 4.2 | KB detail page | `src/routes/(protected)/kb/[kbId]/index.tsx` | Tabs: Documents, Schema, Extractions, Canvas. Summary stats at top. |
| 4.3 | Documents tab | `src/components/kb/DocumentsTab.tsx` | List uploaded sources with status (processing/ready/error). Upload button. |
| 4.4 | Schema tab | `src/components/kb/SchemaTab.tsx` | Show discovered schemas, fields, confirmation status. |
| 4.5 | Extractions tab | `src/components/kb/ExtractionsTab.tsx` | Table of extracted rows. Filter by schema. |
| 4.6 | Canvas tab / link | — | Button "Open Canvas" → navigates to `/kb/[kbId]/canvas`. |
| 4.7 | Navigation: header + sidebar | `src/components/layout/` | Minimal header: logo + user menu. Sidebar: KB list + create new. |
| 4.8 | Empty states | all tabs | "Нет загруженных файлов", "Схема не обнаружена", "Нет извлечённых данных". Copy from copy-map. |
| 4.9 | Loading spinners | shared | Skeleton loaders for lists and canvas. |
| 4.10 | Error toasts | `src/components/ui/Toast.tsx` | SolidJS toast notifications for errors. |

**Verification:**
```
Login → Dashboard → see KB list
Click KB → detail page with tabs
Documents tab → upload file → see it processing
Schema tab → confirm schema
Extractions tab → see extracted rows
Canvas → see spatial view of data
```

---

### Phase 5: Omnibar + Polish (1 session)

**Goal:** Omnibar портирован (hidden by default). Full end-to-end flow отполирован.

| # | Task | Source → Target | Notes |
|---|---|---|---|
| 5.1 | Port Omnibar | `Omnibar.tsx` + 5 panels → `src/components/canvas/Omnibar/` | Hidden by default (`display: none`). Cmd+K / Ctrl+K toggles. |
| 5.2 | Port command registry | `commandRegistry.ts` + `defaultCommands.ts` → `src/lib/commands/` | Keep: `/layout`, `/clear`. Remove: tLOS-specific commands. |
| 5.3 | Adapt intent pipeline | `useIntentPipeline.ts` → `src/hooks/useIntentPipeline.ts` | Remove kernel routing. Keep local command dispatch. Chat messages → future API (v1.1). |
| 5.4 | Full flow test | — | Upload PDF → schema discovery → confirm → extraction → canvas → drag nodes → persist. |
| 5.5 | Responsive layout | — | Canvas: desktop only (>1024px). Dashboard/KB pages: responsive. |
| 5.6 | Keyboard shortcuts | — | Space: pan (middle-mouse). Cmd+0: reset viewport. Cmd+K: omnibar. Esc: deselect. Delete: remove frame. |
| 5.7 | Auth redirect | middleware | Unauthenticated → `/login`. After login → redirect back. |

**Verification:**
```
Full E2E: signup → create KB → upload → schema → extract → canvas → Cmd+K omnibar
All keyboard shortcuts work
Canvas state persists across page reloads
```

---

## What NOT to Port

| Source File/Dir | Reason |
|---|---|
| `frames/mcb/` (6 files) | MCB marketing domain, not Harkly |
| `frames/G3Session*.tsx` | tLOS G3 coding sessions |
| `frames/AgentConsole.tsx`, `AgentStatus.tsx` | tLOS agent system |
| `frames/KernelStatus.tsx`, `IdentityFrame.tsx` | tLOS kernel |
| `frames/MemoryViewer.tsx`, `MemoryAdmin.tsx` | tLOS memory system |
| `frames/DirizhyorSession.tsx` | tLOS orchestrator |
| `frames/RegulatorLog.tsx` | tLOS regulator |
| `frames/Terminal.tsx`, `TextEditor.tsx` | Dev tools, not MVP |
| `frames/MicroPlayer.tsx`, `EchoWorker.tsx`, `MathWorker.tsx` | tLOS utilities |
| `kernel.ts` | Mock kernel → rewrite as API client |
| `useKernelHealth.ts` | tLOS-specific health check |
| `LatticeStatus.tsx`, `BranchPill.tsx`, `CoordPill.tsx` | tLOS spatial chrome |
| `TrafficLights.tsx` | Tauri window chrome → browser doesn't need |

**Ported: ~30 файлов (~5500 строк). Skipped: ~45 файлов (~3300 строк).**

---

## Tauri → Browser Replacements

| Tauri API | Browser Replacement |
|---|---|
| `getCurrentWindow().maximize()` | `document.documentElement.requestFullscreen()` or skip |
| `getCurrentWindow().minimize()` | Remove (browser controls this) |
| `getCurrentWindow().close()` | `window.close()` or remove |
| `getCurrentWindow().onResized()` | `window.addEventListener('resize', ...)` |
| `getCurrentWindow().toggleMaximize()` | Toggle fullscreen or remove |

---

## New D1 Tables

```sql
-- Canvas frame positions (per user, per KB)
CREATE TABLE canvas_frames (
  id TEXT PRIMARY KEY,
  kb_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL,
  frame_type TEXT NOT NULL,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 400,
  height REAL NOT NULL DEFAULT 300,
  floor INTEGER NOT NULL DEFAULT 0,
  data_ref TEXT,  -- JSON: { sourceId?, extractionId?, schemaId? }
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_canvas_frames_kb ON canvas_frames(kb_id, user_id);

-- Viewport state (per user, per KB)
CREATE TABLE canvas_viewports (
  id TEXT PRIMARY KEY,
  kb_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  zoom REAL NOT NULL DEFAULT 1,
  current_floor INTEGER NOT NULL DEFAULT 0,
  current_branch TEXT NOT NULL DEFAULT 'main',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(kb_id, user_id)
);
```

---

## File Structure (target)

```
src/
├── routes/(protected)/
│   ├── index.tsx                    # Dashboard — KB list
│   └── kb/[kbId]/
│       ├── index.tsx                # KB detail — tabs
│       └── canvas.tsx               # Canvas page
├── components/
│   ├── canvas/
│   │   ├── Space.tsx                # Grid background
│   │   ├── FrameContainer.tsx       # DynamicComponent port
│   │   ├── frameRegistry.ts         # Type → Component map
│   │   ├── SelectionOverlay.tsx     # Group select visual
│   │   ├── Toolbar.tsx              # Zoom controls
│   │   └── Omnibar/                 # Hidden in MVP
│   │       ├── Omnibar.tsx
│   │       ├── OmnibarInput.tsx
│   │       ├── OmnibarBody.tsx
│   │       └── panels/
│   ├── frames/
│   │   ├── SourceCard.tsx
│   │   ├── Insights.tsx
│   │   ├── Notebook.tsx
│   │   ├── RawData.tsx
│   │   ├── Artifacts.tsx
│   │   ├── CollectionPlan.tsx
│   │   └── FramingStudio.tsx
│   ├── kb/
│   │   ├── DocumentsTab.tsx
│   │   ├── SchemaTab.tsx
│   │   ├── ExtractionsTab.tsx
│   │   └── KbHeader.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ProtectedLayout.tsx
│   └── ui/
│       ├── Toast.tsx
│       ├── Skeleton.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useViewport.ts
│   ├── useComponents.ts
│   ├── useSnap.ts
│   ├── useFloor.ts
│   └── useIntentPipeline.ts
├── lib/
│   ├── canvas/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── entity-mapper.ts
│   │   └── layout.ts
│   └── commands/
│       ├── registry.ts
│       └── defaults.ts
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Frame performance with 100+ nodes | Canvas slows | Virtual rendering: only render frames in viewport. SolidJS fine-grained reactivity helps. |
| Touch/mobile canvas | Pan/zoom broken on tablets | Phase 1.7: explicit touch handlers (pinch + pan) |
| D1 persistence latency | Frame position save lag | Client-side optimistic update + 500ms debounce to API |
| Large extractions → many frames | Visual clutter | Auto-layout with pagination (show 50 frames, "load more"). Floors filter by type. |
| Omnibar kernel dependency | Chat won't work | MVP: Omnibar hidden. Commands work locally. Chat = v1.1. |
| CodeMirror dependency (Terminal) | Bundle size | Not porting Terminal frame. No CodeMirror. |

---

## Acceptance Criteria

| ID | Criterion | How to Verify |
|---|---|---|
| AC-1 | Canvas loads with entities from extracted data as nodes | Upload → extract → open canvas → see frames |
| AC-2 | Pan + zoom work smoothly (mouse + touch) | Middle-mouse drag, wheel zoom, pinch on tablet |
| AC-3 | Click node → detail with extracted fields + source | Click SourceCard → see document, extraction data |
| AC-4 | Drag nodes, positions persist on reload | Drag → reload → same positions |
| AC-5 | Dashboard shows knowledge bases with correct stats | Login → dashboard → see KB list with counts |
| AC-6 | Full flow: upload → schema → extract → canvas | E2E walkthrough |
| AC-7 | Floor navigation works | Ctrl+Alt+Wheel switches research phases |
| AC-8 | Omnibar opens/closes with Cmd+K | Keyboard shortcut → omnibar appears |
| AC-9 | Auth redirect works | Unauthenticated → /login → redirect back |
| AC-10 | Empty states display correctly | New KB → each tab shows appropriate empty message |

---

## Estimated Sessions

| Phase | Sessions | Dependency |
|---|---|---|
| Phase 1: Canvas Core | 1 | None |
| Phase 2: Frame System + Harkly Frames | 1 | Phase 1 |
| Phase 3: Data Integration (D1) | 1 | Phase 2 + 18.2/18.3 done |
| Phase 4: Dashboard + Navigation | 1 | Phase 3 |
| Phase 5: Omnibar + Polish | 1 | Phase 4 |
| **Total** | **5 sessions** | |

---

## Dependency on Other Sub-Epics

| Dependency | Status | Impact |
|---|---|---|
| 18.1 Scaffold (SolidStart + CF + auth) | ✅ DONE | Needed for routes, middleware, D1 |
| 18.2 Upload + Process | ✅ CODE COMPLETE | Canvas shows uploaded documents as SourceCards |
| 18.3 Schema + Extract | ✅ CODE COMPLETE | Canvas shows extracted data as Insights/RawData frames |
| 18.4 MCP + OAuth | 🔜 NEXT | Independent — MCP doesn't affect canvas UI |

**18.5 can start immediately.** All code dependencies (18.1, 18.2, 18.3) are done.
