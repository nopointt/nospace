# Data Visualization Guidelines — Contexter

Adapted from Harkly `guidelines/data-visualization.md`. Web app context.

---

## 01. Text Over Chart
Prefer text/tables over graphical charts. Numbers over infographics. Monospace alignment makes tables first-class citizens.

Exception (Kandinsky P-04): temporal data benefits from line-form visualization.

## 02. Neutral Palette for Data

| Element | Token |
|---|---|
| Background | `--bg-canvas` or `--bg-surface` |
| Grid lines | `--border-subtle` |
| Default data | `--text-primary` |
| Labels | `--text-secondary` |
| Metadata | `--text-tertiary` |
| Highlight | `--accent` |
| Warning | `--signal-warning` |
| Error | `--signal-error` |
| Success | `--signal-success` |

## 03. Data Tables

| Element | Style |
|---|---|
| Header | `--bg-surface`, 12px/500 `--text-secondary`, UPPERCASE, +0.04em |
| Body row | `--bg-canvas`, 14px/400 `--text-primary` |
| Row border | 1px `--border-subtle` bottom |
| Cell padding | 8px vertical, 16px horizontal |
| Hover | `--interactive-hover` |
| Selected | `--accent` left border 2px |

No alternating row colors. Monospace = columns align naturally.

## 04. Progress Indicators

- Height: 4px (compact) or 8px (standard)
- Track: `--bg-surface`
- Fill: `--text-primary` (default)
- Threshold: `--signal-success` (0-70%) → `--signal-warning` (70-90%) → `--signal-error` (>90%)

## 05. Empty States
No illustrations. No mascots. Plain text on white ground: "no documents yet. upload your first file."

## 06. Accessibility
Never color as sole differentiator. Status dot + text label always together.
