# Component Inventory — Harkly

17 reusable components in `harkly-ui.pen` (Component Library frame: ejLN6).

---

## Buttons (5)

| Component | ID | Fill | Text | Corner | Use |
|---|---|---|---|---|---|
| Button/Primary | zTAQG | `--accent-blue` | #FFFFFF 14/500 | 4px | Primary action |
| Button/Secondary | CBY3e | `--bg-canvas` + border `--border-default` | `--text-primary` 14/500 | 4px | Secondary action |
| Button/Ghost | ad37x | transparent | `--text-secondary` 14/500 | 4px | Tertiary action |
| Button/Danger | vEbVb | `--accent-red` | #FFFFFF 14/500 | 4px | Destructive action |
| Button/Icon | DXZvn | `--bg-surface` + border `--border-subtle` | — | 4px | Icon-only action |

All buttons: padding [8,16], Inter 14px weight 500. Icon button: padding 8, contains single icon.

---

## Inputs (2)

| Component | ID | Size | Corner | Use |
|---|---|---|---|---|
| Input/Default | RyYtd | 240x36 | 4px | Standard text input |
| Input/Search | GLxd1 | 360x40 | 20px | Search with icon, round pill |

Input/Default: border `--border-default`, placeholder `--text-disabled` 14px.
Input/Search: fill `--bg-surface`, border `--border-subtle`, Lucide search icon + placeholder, round pill shape.

---

## Badges (7)

| Component | ID | Style | Use |
|---|---|---|---|
| Badge/Stage | 4EZor | `--bg-surface` + border, `--text-secondary` 11/500 | Spine stage (inactive) |
| Badge/Stage/Active | JiycC | `--accent-blue`, #FFFFFF 11/500 | Spine stage (current) |
| Badge/Source/Reddit | rq6qg | #FFF0EB, #FF4500 icon+text | Source indicator |
| Badge/Source/HN | VguCG | #FFF5EE, #FF6600 icon+text | Source indicator |
| Badge/Status/Processing | kM4NU | #EEF2FF, `--accent-blue` dot+text | Status indicator |
| Badge/Status/Complete | i7Pc9 | #F0F0F0, `--text-secondary` dot+text | Status indicator |
| Badge/Count | E3aoE | `--text-primary`, `--bg-canvas` text | Numeric count |

All badges: cornerRadius 12, padding [4,8], Inter 11px.

---

## Frames (2)

| Component | ID | Width | Corner | Use |
|---|---|---|---|---|
| Frame/Project | 4SP6j | 280px | 8px | Research project — spatial object on canvas |
| Frame/Artifact | vqgBX | 220px | 8px | Artifact preview — spatial object on canvas |

Frame/Project: fill `--bg-canvas`, border `--border-subtle`, padding 20, gap 12. Contains: title (15/600), description (12), footer (stage + timestamp 11). These are spatial frames on the infinite canvas, not dashboard cards.

Frame/Artifact: fill `--bg-canvas`, border `--border-subtle`, padding 16, gap 8. Contains: type label (9/600 caps), title (14/600), description (11), status footer (dot + text).

---

## SpineProgress (1)

| Component | ID | Use |
|---|---|---|
| SpineProgress | 1QdMm | Spine stage progress bar |

6 stages: Framing → Ingestion → Extraction → Synthesis → Notebook → Stakeholders. Horizontal segmented bar. Active stage: `--accent-blue` fill. Completed: `--text-primary`. Pending: `--interactive-hover` + border.

---

## Shared Properties

- **Font:** Inter for all components
- **Icons:** Lucide icon font (iconFontFamily: "lucide")
- **Spacing:** All padding/gap from the spacing scale (4px multiples)
- **Corners:** 4px (buttons, inputs), 8px (cards), 12px (badges), 20px (search pill)
- **Border approach:** `effect:shadow` with spread:1 (Pencil stroke limitation)
