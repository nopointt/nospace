# Typography Guidelines — Harkly

From tLOS `design/design_system/guidelines/typography.md`. Rules 02-12 are universal. Font choice and case rules adapted.

---

## 01. Two Font Families

**Rule:** Inter for UI text. JetBrains Mono for code/data/machine output. No third family.

**Harkly note:** tLOS uses Inter + IBM Plex Mono. Harkly uses Inter + JetBrains Mono (already in Pencil Typography System). The two-family rule is universal.

---

## 02. Systematic Type Scale

**Rule:** All font sizes from the Pencil Typography System scale: 10, 12, 14 (base), 16, 20, 24, 32, 48. No arbitrary sizes.

---

## 03. Hierarchy Through Weight and Size Only

**Rule:** Differentiate levels using font-weight (400/500/700) and font-size. No decorative containers to signal hierarchy. However: warm background fills on containers ARE permitted for spatial warmth — they serve spatial grouping (Raumgestaltung), not typographic hierarchy. A warm `--bg-surface` frame is a spatial container, not a hierarchy signal.

---

## 04. Case Rules

**Rule:** Sentence case for all UI text. ALL CAPS only for short labels (2-3 words) where spatial constraints demand density.

**Harkly note:** tLOS prefers strict lowercase (Bayer universal alphabet). Harkly uses sentence case — natural for Russian B2B audience. No Title Case for navigation, buttons, or headings.

---

## 05. Line Length: 45-75 Characters

**Rule:** Optimal reading width. Non-negotiable perceptual constraint.

---

## 06. Never Render Text as Image

**Rule:** Materialwahrheit. Text is a native screen material. Images of text are Ersatz.

---

## 07. Semantic Type Tokens

**Rule:** Reference role-based tokens (display, heading-lg, heading, heading-sm, body, body-emphasis, label, label-caps, caption, code, code-block), not raw size/weight values.

All 11 functional roles defined in Pencil Typography System.

---

## 08. Minimum Body Size 14px

**Rule:** Body text minimum is 14px (Harkly base). Caption/label may go to 10-12px. Below 10px is prohibited.

tLOS uses 16px minimum. Harkly uses 14px — acceptable for a professional tool with a competent audience. Pencil Typography System base = 14px.

---

## 09. Line Height: 1.0 / 1.2 / 1.4

**Rule:** Three line-height tokens from Pencil: tight (1.0), compact (1.2), reading (1.4).

- Headings: tight or compact
- Body: reading (1.4)
- Labels/captions: compact (1.2)
- Code: tight (1.0)

---

## 10. Letter Spacing as Compositional Tool

**Rule:** Two values only: none (0em) for normal text, caps (0.08em) for uppercase labels.

---

## 11. Baseline Grid Alignment

**Rule:** Text elements align to the 4px spacing grid. Line-height * font-size should produce a value divisible by 4.

---

## 12. Typography Must Survive Without Color

**Rule:** Remove all chromatic color. Hierarchy must remain clear through weight, size, and spacing alone. If color is carrying hierarchy, the typography is too weak.
