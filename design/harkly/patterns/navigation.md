# Navigation Patterns — Harkly

Adapted from tLOS `design/design_system/patterns/navigation.md`. Omnibar bottom-LEFT.

---

## Pattern 01: Omnibar-as-Axis

The Omnibar is the generative axis of all non-spatial navigation. All command, search, agent invocation, and action flows originate from the Omnibar. No competing command entry points.

Kandinsky: the Punkt is the generative origin of all lines of compositional movement. The Omnibar is the workspace's Punkt.

**Harkly difference from tLOS:**
- Position: **bottom-LEFT** (not center). Distinct Harkly pattern.
- Collapsed: 320x48 pill (LogoDot + placeholder + send button)
- Expanded: 360x852 panel (header + body + input row)
- No scrim on expansion (co-presence, not modal overlay)

**Do:** Open omnibar from any state via keyboard shortcut
**Do:** All search routes through omnibar
**Do not:** Place search bars inside floors or frames

---

## Pattern 02: Frame Activation

Navigating to a frame means activating it. Frames are never created or destroyed by navigation — only activation state changes.

The canvas is permanent. Every frame exists at all times. Navigation changes which frame has focus.

| State | Visual |
|---|---|
| Active | `--border-strong` border, full content legibility |
| Inactive | `--border-subtle` border, content present but receded |

**Do:** Active frame gets border contrast emphasis
**Do not:** Animate frame size on activation. Size is spatial property — its mutation carries semantic meaning.
**Do not:** Destroy frame content when it loses focus

---

## Pattern 03: Floor Transition

Switching floors = moving to a different Z-level infinite canvas. This is a spatial transition, not a page navigation.

**Motion:** `duration.deliberate` (400ms) + `easing.medial` (ease-in-out). The transition conveys spatial movement — the user feels they moved to a different level.

**FloorPill:** top-right, shows current floor name + chevron-down. Click to open floor selector dropdown.

**Keyboard:** `Cmd+1..6` for direct floor access.

---

## Pattern 04: Branch Switching

Branches = parallel infinite canvases on the same floor. Switching branches = moving to a parallel plane.

**BranchPill:** top-right, next to FloorPill. Shows current branch name + chevron-down.

**Motion:** `duration.deliberate` (400ms). Horizontal spatial feel — the user moves laterally, not vertically.

---

## Pattern 05: Canvas Navigation

Physical canvas operations (pan, zoom, drag) are viewport operations — perceptual instruments, not command navigation. They do NOT route through the Omnibar.

| Action | Input |
|---|---|
| Pan | Space+LMB / 2-finger scroll |
| Zoom | Mouse wheel (focal point preservation) |
| Frame drag | Click+drag on frame header |

Zoom levels:
- **Ground:** frame content readable, interactive
- **Neighborhood:** cluster relationships visible, text illegible
- **Overview:** entire floor pattern emerges
