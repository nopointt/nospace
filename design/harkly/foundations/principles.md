# Principles — Harkly Adaptation

Five Bauhaus principles. Universal structure, warm application. Each principle includes its Harkly-specific adaptation.

Source: `design/design_system/foundations/principles.md` (tLOS canonical). RAG: `bauhaus_knowledge` collection.

---

## 1. Gestaltung — Form Through Operation

**Rule:** Form emerges from structural role, not from physical-world analogy.

**Harkly adaptation:** A source card on F1 does not look like a physical card. A connector status indicator does not look like a physical LED. Form follows the spatial and functional role of the element on the canvas.

**Rounded corners are permitted.** Oud P-06: "I see no reason why the new architecture should renounce round forms." Kandinsky P-01: free curves = lyrical warmth. Harkly's soft corners (4/8/12/16/24px radius) are a formal choice expressing warmth, not decorative mimicry.

**Check:** Can the element's form be explained without "it looks like a..."?

---

## 2. Gleichgewicht — Dynamic Equilibrium

**Rule:** Achieve tensioned equilibrium through asymmetric balance, never through static symmetry.

**Harkly adaptation:** Research interfaces show dense, heterogeneous data (entities, quotes, graphs, timelines). Balance through Klee's three parameters: Mab (scale), Gewicht (visual weight), Charakter (quality). A small dark entity card balances a large light quote panel.

Mondrian P-16: "Equilibrium does not actually dissolve the tension — it is ceaselessly stimulating."

**Check:** Remove any element. Does the balance shift? If not, the element is decorative.

---

## 3. Materialwahrheit — Material Truth

**Rule:** Use every material according to its inner law. Screen = light + geometry + typography.

**Harkly adaptation:** The screen is a light-emitting surface. Harkly's material law includes **warmth** as a first-class property:
- Warm color (Cosmic Latte ground) = honest use of screen luminance in the yellow-warm spectrum
- Soft shadows = spatial signal of elevation, not simulated physical light. Moholy-Nagy P-11: shadow as "geometric structuring agent." Permitted when shadow serves spatial structure, not atmospheric decoration.
- No gradients simulating physical light sources
- No textures imitating paper, cloth, or metal

**The shadow rule for Harkly:** `effect:shadow` with `spread:1, blur:0` (structural border) = OK. `effect:shadow` with `blur:8, offset:y:2` (subtle float) = OK if it signals elevation. `box-shadow` with directional offset simulating sunlight = NOT OK.

**Check:** Does any element simulate a physical material? Replace with screen-native treatment.

---

## 4. Sparsamkeit — Economy of Means

**Rule:** Use the minimum elements necessary for maximum clarity. Every element must earn its place.

**Harkly adaptation:** This is the most natural principle for Harkly. The brand's infostyle IS Sparsamkeit in text. The design extends it visually:
- No decorative borders around groups that space already separates
- No icons next to text that says the same thing
- No labels on self-evident elements
- Breathing space is NOT wasted space — it is looseness (Klee) (release), compositionally active

Kandinsky P-12: compositions need both stiffness (Klee) (dense anchors) and looseness (Klee) (breathing release). Harkly leans toward looseness (Klee) — but never into formless emptiness.

**Check:** Remove the element. Does comprehension decrease? If not, remove it.

---

## 5. Raumgestaltung — Space as Active Participant

**Rule:** Space is not a container for elements. Space IS an element — active, weighted, compositional.

**Harkly adaptation:** This is the principle that makes Harkly feel calm. Space between source cards on F1, breathing room in the Framing Studio, the open canvas on F0 — all are designed intervals, not leftover gaps.

Moholy-Nagy P-01: space is a "biological regulator" — the supreme criterion. The spacing scale (4px base, 0-80px) encodes intentional rhythm. Harkly defaults toward the upper range (inset-lg, gap-lg, breathing-md) — calmer than tLOS's dense defaults, but from the same scale.

Kandinsky P-06: lighter forms toward the top, heavier at the bottom. The canvas basic plane (Kandinsky) has directional weight even in warm-white.

**Check:** Can you describe the spatial rhythm as an intentional pattern? If spacing is uniform everywhere, the space has not been designed.
