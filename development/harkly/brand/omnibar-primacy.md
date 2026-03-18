---
name: Harkly Omnibar Primacy
description: Omnibar = primary (not only) input. Frames are functional too. No dashboard patterns.
type: project
---

Omnibar is the **primary** (not the only) method of interaction in Harkly. Floors (F0–F5) are **spatial canvases** — each an infinite 2D plane with frames (spatial objects).

**Key distinction:**
- **Omnibar** = primary path for complex actions (add source, run search, configure settings, create research)
- **Frames** = directly interactive (click to expand detail, reconnect, view list, edit inline)
- The system is designed omnibar-first, but frames are NOT read-only displays that redirect to omnibar

**How to apply:** When designing any floor:
- Floor = infinite canvas with frames positioned spatially, NOT a web dashboard
- Frames show STATUS + are directly interactive (expand, reconnect, browse content)
- Omnibar handles creation and search (new source, new research, find entity)
- Frames handle their own actions (view file list, reconnect expired auth, browse channels)
- No page headers, no filter chips, no dashboard grid layouts
- Empty space between frames = intentional compositional interval
- Omnibar position: bottom-LEFT (Kandinsky: grounded departure point)
- Proximity between frames implies relationship

**Anti-patterns:**
- Card grid layout (web pattern, not spatial)
- Search bar on floor (omnibar IS the search)
- Full-width page sections (frames float on canvas)
- Frames that ONLY display and redirect to omnibar for everything (frames are functional)
- Page-level "Add" buttons (omnibar handles creation)

Full rules: `nospace/design/harkly/harkly-spatial-interface-rules.md`
