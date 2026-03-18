# session+165-scratch.md
> Active · Axis · 2026-03-18

<!-- ENTRY:2026-03-18:CHECKPOINT:166:harkly:harkly-design-ui [AXIS-FAST] -->
## 2026-03-18 — checkpoint 166 [Axis · fast]

**Decisions:**
- Floor architecture finalized: F0=Фрейминг, F1=Планирование, F2=Сырые данные, F3=Инсайты, F4=Артефакты, F5=Блокнот
- Sharing = global feature (any floor), Omnibar = единый поток через все этажи/ветки
- AI-initiated floor transitions + user manual (Ctrl+Alt+Scroll)
- Query planning = part of F1 (not separate), two-level: Research Concepts → Source Queries
- OSINT Intelligence Cycle = methodological foundation for data collection
- Harkly Shell = Tauri v2 + SolidJS fork from tLOS, HARKLY-17 epic created
- Shell decisions: omnibar bottom-LEFT, frameless window, pseudo-NLP scripted demo, all frames needed

**Files changed:**
- `design/harkly/harkly-ui.pen` — warning tokens, Omnibar reusable (19 components), F1 redesigned with Collection Plan + query info, F1 Plan Loading variant
- `architecture/harkly-spine-process-ru.md` — floor names updated, F5=Блокнот
- `architecture/harkly-cjm-spine-flow.md` — NEW: full CJM from F0→F5
- `memory/harkly-design-ui.md` — L3 updated: floor architecture, tokens 23, omnibar components, open issues resolved
- `memory/harkly-about.md` — L1 updated: 19 reusable components, CJM link, HARKLY-17 added
- `memory/harkly-roadmap.md` — L2 updated: CJM + query planning research links
- `memory/harkly-shell-epic.md` — NEW: HARKLY-17 Shell epic with 7 phases
- `docs/research/f1-query-planning-ux-research.md` — NEW: query planning UX research (SR tools + social listening + AI search)
- `development/harkly/harkly-shell/` — NEW: full shell copy from tLOS, restyled by 4 parallel agents (tailwind, CSS, App, Space, Omnibar, frames, kernel mock, floor nav, scenario engine)

**In progress:**
- Harkly Shell Tauri running (`cargo tauri dev` — window opened)
- Need to verify visual result and fix any UI issues
- Floor pills (FloorPill/BranchPill/CoordPill) created but not yet wired into App.tsx

**Opened:**
- Wire useFloor + pills into App.tsx
- Write demo scenario script for pseudo-NLP
- F2-F5 preliminary frame content
- Rename Cargo package from tlos-app to harkly-app

<!-- ENTRY:2026-03-18:CHECKPOINT:167:harkly:harkly-design-ui [AXIS-FAST] -->
## 2026-03-18 — checkpoint 167 [Axis · fast]

**Decisions:**
- Framework selector: horizontal chips slide out (not dropdown), stay visible, second selection spawns new frame via CustomEvent
- Design system must be embedded globally (CSS vars + Tailwind tokens + Inter font everywhere)
- FramingStudio reverted to Pencil exact design + horizontal framework chips
- Feedback saved: ALWAYS clarify before coding (feedback_clarify_before_coding.md)

**Files changed:**
- `harkly-shell/src/index.css` — CSS custom properties :root with all 23 h-* tokens
- `harkly-shell/src/styles/design-tokens.css` — tlos-* → h-* full rewrite
- `harkly-shell/src/components/DynamicComponent.tsx` — Harkly chrome (h-surface, h-elevated, h-blue ring, Harkly icons instead of TrafficLights), animate-h-enter
- `harkly-shell/src/components/frames/harkly/FramingStudioFrame.tsx` — Pencil exact + horizontal framework chips + spawn via CustomEvent
- `harkly-shell/src/App.tsx` — useFloor + FloorPill/BranchPill/CoordPill wired + harkly:spawn-frame listener + floor scroll (Ctrl+Alt+Scroll)
- `harkly-shell/src/components/frameRegistry.tsx` — .jsx.bak fix, imports from frames/harkly/
- `harkly-shell/src/types/frame.ts` — 7 Harkly frame types added, AVAILABLE_AGENTS color → h-blue
- Multiple components restyled by embed-design-system agent (ErrorBoundary, UUPRenderer, PatchDialog, LatticeStatus)
- `~/.claude/projects/.../memory/feedback_clarify_before_coding.md` — NEW feedback memory

**In progress:**
- BUG: frame drag broken — frames select but don't move. Likely caused by .jsx/.js rename or DynamicComponent changes. Needs DevTools console debug.
- Tauri builds and runs, frames render correctly, but interaction broken

**Opened:**
- Fix drag bug (priority — blocks all demo work)
- Complete design system embedding (some inline hex may remain)
- F2-F5 frame content from Pencil
- Demo scenario script
- Rename Cargo package tlos-app → harkly-app

<!-- ENTRY:2026-03-18:CLOSE:168:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 168 CLOSE [Axis]

**Decisions:**
- Floors = Z-layers (same canvas, different content), not Y-zones
- Branches = isolated canvases per research thread, 5 default branches
- Auto-snap removed — frames drag freely
- Scroll: plain=vertical pan, Shift=horizontal, Ctrl=zoom, Ctrl+Alt=floors, Ctrl+Shift=branches
- Scroll inside frames passthrough when content has overflow
- Frame drag bug root cause: animate-h-enter CSS fill-mode overriding inline transform
- F1 Collection Plan needs full redesign as "serious research document" — launched OSINT + research methodology research

**Files changed:**
- `harkly-shell/src/components/DynamicComponent.tsx` — animate-h-enter moved from outer (positioning) to inner (content) div, fixing drag bug
- `harkly-shell/src/hooks/useFloor.ts` — added branches signal (5 default), goToFloor, createBranch, switchBranch
- `harkly-shell/src/hooks/useViewport.ts` — scroll=vertical pan, shift+scroll=horizontal pan, scrollable frame passthrough
- `harkly-shell/src/hooks/useSnap.ts` — removed all auto-snap/dock logic, simplified to pure drag/resize
- `harkly-shell/src/components/FloorPill.tsx` — rewritten with dropdown (6 floors), onSelectFloor
- `harkly-shell/src/components/BranchPill.tsx` — rewritten with dropdown (branches list + "Новая ветка")
- `harkly-shell/src/App.tsx` — floor+branch filtering, auto-load harkly layout, spawn inherits floor+branch, Ctrl+Shift+Scroll branch switch
- `harkly-shell/src/commands/frameLayouts.ts` — floor+branch on all frames, 5 branches with varied content (JTBD/SPICE/PEO/IssueTree/FINER)
- `harkly-shell/src/types/frame.ts` — added floor?: number, branch?: string fields
- `docs/research/f1-osint-collection-planning-research.md` — NEW: 1297 lines, 50 sources, 11 angles (PIR→SIR→EEI, FM 34-2, Admiralty Code, AI-augmented OSINT)
- `docs/research/f1-research-planning-methodologies-research.md` — NEW: 1298 lines, 30+ sources (PRISMA, Cochrane, NN/g, CI KIT→KIQ, mixed methods, assumption mapping)
- `~/.claude/hooks/eidolon-register.py` — fixed: now moves agents active→completed on completion, trims completed to 20
- `~/.tlos/eidolons.json` — cleaned from 16 stale "running" to 1 actual active

**Completed:**
- Frame drag bug fixed (animate-h-enter CSS animation override)
- Floor mechanics: dropdown + Ctrl+Alt+Scroll + Z-layer filtering
- Branch mechanics: dropdown + Ctrl+Shift+Scroll + isolated canvases + 5 default branches
- Scroll mechanics: vertical/horizontal pan + frame content passthrough
- Auto-snap removed
- OSINT collection planning research (1297 lines)
- Research planning methodologies research (1298 lines)
- Eidolon registry hook fixed + cleaned

**Opened:**
- F1 redesign as full research document (synthesis of both research files pending)
- Design system embedding gaps (some inline hex may remain)
- Demo scenario script
- Rename Cargo package tlos-app → harkly-app
- Wire floor navigation to filter canvas content visually (labels, background hints per floor)

**Notes:**
- OSINT research agent may still be running (finalizing source index) — check on next session start
- Research findings: PIR→SIR→EEI hierarchy + Q→A→R→F lifecycle + assumption mapping = core of new F1 design
