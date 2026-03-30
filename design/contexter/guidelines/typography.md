# Typography Guidelines — Contexter

Adapted from Harkly `guidelines/typography.md`. Dual typeface system.

---

## 01. Two Font Families

**Rule:** Inter for body/UI text. JetBrains Mono for code, data, and technical content.

| Token | Family | Use |
|---|---|---|
| `--font-sans` | Inter | Body text, headings, labels, buttons, navigation |
| `--font-mono` | JetBrains Mono | Code blocks, inline code, API tokens, technical data, pipeline labels |

Inter is a geometric sans-serif optimized for screen readability. JetBrains Mono provides fixed-width alignment for technical content where character alignment matters.

---

## 02. Systematic Type Scale

**Rule:** All font sizes from scale: 10, 12, 14 (base), 16, 20, 24, 32, 48. No arbitrary sizes.

Identical to Harkly. Universal.

---

## 03. Hierarchy Through Weight and Size Only

**Rule:** Differentiate levels using font-weight (400/500/700) and font-size. No decorative containers to signal hierarchy.

---

## 04. Case Rules (departure from Harkly)

**Rule:** Lowercase dominant for all UI text.

Harkly uses sentence case. Contexter follows Bayer universal alphabet: lowercase is the natural form.

RAG: Zeitschrift — "Continuous lowercase grotesque throughout. No decorative initials."

- Headings: lowercase
- Buttons: lowercase
- Labels: lowercase or UPPERCASE for short tags (2-3 words)
- Navigation: lowercase

---

## 05. Line Length: 45-75 Characters

Optimal reading width. Universal.

---

## 06. Never Render Text as Image

Materialwahrheit. Text is native screen material.

---

## 07. Semantic Type Tokens

11 functional roles:

| Role | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| display | 48px | 700 | 1.0 | Hero headline |
| heading-lg | 32px | 700 | 1.1 | Page heading |
| heading | 24px | 700 | 1.2 | Section heading |
| heading-sm | 20px | 500 | 1.2 | Subsection heading |
| body | 14px | 400 | 1.5 | Reading text, paragraphs |
| body-emphasis | 14px | 500 | 1.5 | Emphasized inline text |
| label | 12px | 500 | 1.2 | Button labels, field labels |
| label-caps | 12px | 500 | 1.2 | Uppercase labels, +0.04em |
| caption | 10px | 400 | 1.2 | Timestamps, hints |
| code | 14px | 400 | 1.0 | Inline code |
| code-block | 13px | 400 | 1.4 | Code block |

Body roles use Inter (`--font-sans`). Code roles use JetBrains Mono (`--font-mono`).

---

## 08. Minimum Body Size 14px

Identical to Harkly. Caption/label may go to 10-12px. Below 10px prohibited.

---

## 09. Line Height: 1.0 / 1.2 / 1.4 / 1.5

- Headings: 1.0-1.2 (tight/compact)
- Body: 1.5 (reading — wider than Harkly's 1.4, monospace needs more air)
- Labels/captions: 1.2 (compact)
- Code: 1.0 (tight)

---

## 10. Letter Spacing as Compositional Tool

| Context | Value | RAG |
|---|---|---|
| Display/H1 (48/32px) | -0.02em | Zeitschrift: "slightly tracked in display heads" |
| Body (14-20px) | 0em | Zeitschrift: "uniform typographic colour" |
| Label-caps (12px uppercase) | +0.04em | Tracking opens at small sizes |
| Logo | -0.04em | Compression = tension (Mondrian asymmetric) |

---

## 11. Baseline Grid Alignment

Text aligns to 4px spacing grid. line-height × font-size divisible by 4.

---

## 12. Typography Must Survive Without Color

Remove all chromatic color. Hierarchy must remain clear through weight, size, spacing. If blue is carrying hierarchy, typography is too weak.
