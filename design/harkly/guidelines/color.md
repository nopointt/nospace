# Color Guidelines — Harkly

Adapted from tLOS `design/design_system/guidelines/color.md`. Warm palette rules.

---

## 01. Structure First, Color Second

**Rule:** Validate hierarchy in warm-neutral grayscale before applying warm palette. If the layout cannot communicate without chromatic color, the structure is broken.

**Harkly note:** tLOS validates in B&W (black/white). Harkly validates in warm-neutral (Cosmic Latte / warm grays). The method is the same — the neutral baseline is warm.

---

## 02. Warm Chromatic Vocabulary (replaces tLOS 3-primary restriction)

**Rule:** Harkly's chromatic palette is purpose-driven, not restricted to three Mondrian primaries.

| Token | Value | Purpose |
|---|---|---|
| `--accent-blue` | #1E3EA0 | Primary accent, info signal |
| `--accent-red` | #C82020 | Error signal, danger |
| `--accent-yellow` | #F2C200 | Warning signal |
| `--signal-success` | #2D7D46 | Success signal (green permitted in Harkly) |
| `--signal-success-bg` | #EAF4EB | Success background |

**Why green is permitted — deliberate departure from Mondrian:** Mondrian P-11 restricts green as "mixture" — forbidden in his universal chromatic system. Harkly consciously departs from Mondrian here in favor of Klee P-21, who treats green as a valid structural position on the red↔green complementary axis (gray point = center, displacement toward green = green-dominant reading). Harkly's audience universally expects green = success. This is a principled choice: Klee's organic color axis over Mondrian's three-primary restriction.

---

## 03. Color Follows Purpose (semantic tokens)

**Rule:** Reference semantic tokens, never raw hex values. `--signal-error`, not `#C82020`.

Identical to tLOS. Non-negotiable.

---

## 04. Flat Unmodulated Color

**Rule:** Apply color as flat, solid fills. No decorative gradients. No chromatic blurs.

**Harkly note:** Warm palette does not mean gradient washes. Cosmic Latte is flat. Surface tokens are flat. Oud's "blankness of color" applies to warm colors too.

---

## 05. Color Earns Its Place

**Rule:** Every chromatic element must encode information. Decorative color is prohibited.

Sparsamkeit. Identical to tLOS.

---

## 06. Chromatic Restraint (15% max chromatic surface)

**Rule:** No more than 15% of viewport surface area should carry chromatic (non-gray, non-warm-neutral) color. Maximum 3 distinct hues per viewport.

**Harkly note:** Warm background tokens (--bg-canvas, --bg-surface, --bg-elevated) are not chromatic — they are the neutral ground. Only accent and signal colors count toward the 15% limit.

**Bauhaus grounding:** Oud P-11: "too much color makes not colorful but garish." The 15% threshold is a practical engineering limit, not a Bauhaus-derived number. The Bauhaus principle is qualitative: restrain color to avoid garishness. The specific percentage is our operationalization of Oud's qualitative warning.

---

## 07. Color as Spatial Structure

**Rule:** Use color to define zones, not to style individual elements. Background tokens define spatial zones (canvas/surface/elevated). Chromatic color marks state transitions within those zones.

---

## 08. WCAG AA Contrast

**Rule:** Minimum 4.5:1 for text, 3:1 for UI elements. Non-negotiable.

**Harkly warning:** Cosmic Latte (#FFF8E7) as background produces lower contrast with warm tones than pure white. Every text/background pair MUST be verified. `--text-primary` (#1C1C1C) on `--bg-canvas` (#FFF8E7) = ~17:1 (passes). `--text-tertiary` (#8E8E8E) on `--bg-canvas` = ~4.2:1 (borderline — verify).

---

## 09. Yellow on Light: Background Only

**Rule:** Never use yellow as text color or thin border on light backgrounds. Yellow on light is invisible. Use yellow only as fill background for warning badges/banners.

Directly from tLOS. Critical for Harkly's light theme.

---

## 10. Warm Ground Theory (Kandinsky)

**Rule:** The warm canvas ground (Cosmic Latte #FFF8E7) is not neutral — it is the Gelb-polus (yellow pole) of Kandinsky's temperature system. Elements on this warm ground carry inherent warmth. Cool accents (--accent-blue) create maximum temperature contrast. Use this deliberately.

Kandinsky P-04: Weib-Gelb axis = warm, advancing. The ground itself is warm. Every element placed on it enters a warm atmosphere.

Kandinsky P-15 correspondence: Vertical = Weib = Gelb (warm). Harkly's vertical UI elements (omnibar, frame edges) resonate with the warm ground.

**Warm grays — departure from Mondrian:** Harkly's gray scale is chromatically tinted (hue ~43°, warm). Mondrian P-11/P-14 prescribe pure non-colors (black/white/gray without hue). Oud P-22 calls for "blankness of color". Harkly departs from this in favor of Kandinsky's temperature system: Cosmic Latte sits on the Weiß→Gelb warm axis. The warm tint is not decorative mixture — it is a compositional temperature decision grounded in Kandinsky's basic plane theory.
