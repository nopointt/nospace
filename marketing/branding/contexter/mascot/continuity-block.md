---
name: mascot_meme_continuity_block
description: Paste-ready continuity block для каждого Imagen / Veo / Lyria prompt. Полная версия со всеми ограничениями + variant blocks для разных состояний.
type: reference
version: v7
locked: 2026-04-26 (session 254)
---

# Meme — Continuity Block

> Paste-ready блок для каждого промпта. Используется verbatim в Imagen / Veo / Lyria генерациях. Этот файл — output. Detail сожержается в canon-* files.

## Назначение

Continuity block — это **canonical character definition** в формате готовом для прямого вставления в каждый prompt. Устраняет drift между генерациями.

Принцип: при каждой генерации Meme — paste этот блок **verbatim** перед scene-specific содержимым. Это обеспечивает:
- Geometry consistency
- Material consistency
- Glow consistency
- Face consistency
- Asymmetry preservation
- Negative constraints reinforcement

## Master Continuity Block (canonical idle state, v8 session 254)

Это **default block**. Используется когда нужен canonical Meme в idle state (R-02 isolation reference, hero shot, любой baseline). v8 update: descriptive language preferred over numerical ratios (Imagen / Veo drift on math notation).

```
=== MEME CHARACTER CONTINUITY BLOCK (v8) ===

GEOMETRY: Two square bracket sculptures shaped like the printed characters "[" and "]". Each bracket is a vertical rectangular bar with short horizontal segments at top and bottom turning 90 degrees inward. Substantial thick sculptural cross-section like museum bronze or large old door handles — NOT wire-thin, NOT chunky-stocky. Brackets are about 7-8 times taller than they are thick. All inner corners EXACTLY 90 degrees, sharp Bauhaus right angles, machined precision, no rounding, no bevels. Both brackets IDENTICAL: thickness, height, proportions, mirror symmetric. Perfectly vertical, perfectly parallel, no tilt, no lean, no splay. Default gap between brackets is NARROW — about same width as bracket cross-section thickness itself. Brackets stand close together side by side. NO LEGS, NO appendages — brackets are the entire body. Brackets float in mid-air, no support, no ground plane, no shadow on floor.

MATERIAL — BRONZE BODY: Aged cast bronze body — warm honey-amber highlights (target hex #C8860A) where directional light strikes, dark chocolate-brown shadows (target hex #3D2006). Cast bronze surface with subtle micro-pitting and aging texture, matte/satin finish (NOT polished, NOT mirror reflective). Bronze is 70%+ of total visible surface, dominant material reading. Bronze does NOT glow.

MATERIAL — VERDIGRIS PATINA: Cyan-teal verdigris patina (target hex #1DA8A0, hue 185°, saturation 70-80%) covers ≤30% of each bracket, MATCHED mirror coverage between left and right (statistical equivalence, not pixel-identical). Patina concentrates ONLY at: inside corners where horizontal meets vertical, top edges of horizontal segments, bottom edges of horizontal segments, undersides of horizontal segments. NEVER on middle vertical sections of bars or large flat front faces. NO drips, NO vertical streaks, NO running stains. Crystalline mineral micro-texture (not painted-on, not smooth). Patina edges fade gradually into bronze (not sharp paint-line boundaries).

GLOW — BIOLUMINESCENT: Subtle cyan-teal bioluminescent glow (target hex #1AD4E6, hue 185°, saturation 75-80%) emanates ONLY from INSIDE individual patina patches. Each patina patch glows from within, like phosphorescent moss inside corroded copper or deep-sea bioluminescent algae. Glow brightness ~30% of bronze highlight brightness (subtle, barely noticeable at first glance, subordinate to bronze). Spread radius 1-2 cm out from each patch with soft Gaussian falloff. NO halo around bracket silhouette. NO rim light. NO surrounding ambient cyan light. NO atmospheric cyan haze. NO bronze surface glowing. Bronze surfaces never glow. Eyes never glow. Soft organic biological light — NOT neon, NOT LED, NOT electric, NOT point-source, NOT magic VFX.

FACE: Two circular eyes floating just above brackets in CLOSE PROXIMITY (small vertical gap, eyes are close to top of brackets). Eyes positioned CLOSE TOGETHER side by side, centered horizontally over the narrow gap between brackets — eyes are NOT widely separated, they are nearly touching like a pair of eyes on a face. Face is awareness above, brackets are body below. NO MOUTH, NO LIPS, NO TEETH, NO TONGUE. NO NOSE, NO EARS, NO EYEBROWS, NO EYELASHES. NO face shape outline (just two eyes floating, background visible around them).

EACH eye has THREE LAYERS (NOT solid spheres):
- Outer layer: aged bronze ring (sculpted bronze eyelid, same bronze material as bracket body, clean bronze with NO patina on rims)
- Middle layer: pure clean matte WHITE iris (like enamel inlay or bone, NOT glowing, NOT painted, NOT yellow, NOT cream-tinted)
- Inner layer: small matte BLACK pupil at upper-center of visible iris area (NOT dead center, slightly elevated for engaged gaze, NO specular dot in pupil)

DEFAULT EXPRESSION (v8 canon — both eyes equally drooped):
Both eyes have FULL CIRCLE outline (no shape distortion, no semicircle, no top-flattening). Top 15-20% of each eye covered by upper bronze rim curving downward (subtle eyelid drop). White iris visible only in lower 80-85% of each eye. Pupil sits at upper-center of visible iris area. Both eyes have IDENTICAL droop ratio (symmetric, not asymmetric squint).

Asymmetry through SIZE only (mandatory, non-negotiable):
- Left eye: 30% LARGER overall diameter than right eye
- Right eye: smaller diameter, same full circle outline, same droop ratio
Both eyes full circles with identical droop. Asymmetry читается через size variation alone.

Reading: calm, slightly wry, mildly amused archivist who has seen it all. NOT angry, NOT sad, NOT scrutinizing — just lightly knowing. NOTE: semicircle squint top-flattening on right eye is reserved для Knowing state active modulation, NOT для default expression.

Eye scale: left eye ≈30% of bracket horizontal segment length, right eye ≈23% (left × 0.77).

LIGHTING: Single soft box key light from upper-left at 45° elevation, warm tungsten 3200K color temperature. ALL highlights on upper-left surfaces of BOTH brackets (matched single-source). ALL shadows on lower-right and lower surfaces. Soft penumbra (no hard shadow edges). NO rim light. NO back light. NO side fill. NO ambient fill that washes out shadows. The only secondary illumination is the bioluminescent glow which is LOCAL to patina patches only.

BACKGROUND: Pure neutral dark hex #1A1A1A. UNIFORM — no vignette, no gradient, no atmospheric tint, no cyan haze. Studio void in isolation reference shots.

NEGATIVE (always): mouth, lips, teeth, tongue, nose, ears, eyebrows, eyelashes, fully open eyes, wide-open eyes, eyes without droop, asymmetric eyelid droop (must be symmetric), semicircle squinted eye in default (reserved для Knowing state), top-flattened bronze rim eye in default, narrowed eye, suspicious expression, scrutinizing face, identical eye sizes, symmetric size eyes (must be size-asymmetric), solid eye spheres, painted eyes, cartoon eyes, animated style eyes, glowing eyes, glowing iris, yellow iris, cream iris, painted patina, drips, vertical streaks, patina on flat surfaces, patina coverage above 30%, bronze body glowing, bronze surface glowing, halo, rim light, neon glow, LED glow, electric light, surrounding ambient cyan, atmospheric cyan haze, glowing aura around figure, bracket tilt, bracket lean, splayed brackets, deformed segments, rounded corners, organic curves, soft corners, beveled edges, sculpted curves, brackets too skinny wire-like, brackets too chunky stocky, eyes wide apart spread across face, walking, limbs, arms, legs, leg appendages growing from brackets, body shapes, plastic, rubber, anime, cartoon, animated style, text on surface, watermark, archive, drawers (in isolation reference), environment, ground plane, shadow on floor, reflection, depth of field blur (in static reference), motion blur, lens flare, vignette, atmospheric haze (in isolation reference), face shape outline, head outline.

=== END CONTINUITY BLOCK ===
```

## Variant blocks per state

В non-idle states некоторые parameters change. Use these variant blocks instead of master.

### Variant — Curious state

Replace «idle» specific lines в master block с:

```
GLOW LEVEL: L3 visible glow (slightly brighter than baseline L2, ~45% of bronze highlight brightness, still subordinate to bronze).

FACE — STATE MODULATION:
- Left eye iris widened 5-10% (visibly enlarged, dilated curious gaze)
- Right eye holds normal squint position
- Both pupils shift to upper-edge of iris (looking up engaged)
```

### Variant — Knowing state

```
GLOW LEVEL: L2 (same as idle baseline).

FACE — STATE MODULATION:
- Left eye holds normal full circle position
- Right eye squint deepens — top edge bronze rim flattens further (more pronounced semicircle)
- Both pupils settle slightly toward center
```

### Variant — Bridging state

```
GLOW LEVEL: L4 bright glow (~60% of bronze highlight brightness, peak moment energy, still organic not neon).

FACE — STATE MODULATION:
- Left eye iris brightens (slight saturation lift in white)
- Right eye less squint than knowing — both eyes more equal momentarily
- Both pupils centered on viewer (acknowledgment direct gaze)
```

### Variant — Speech state (talk animation moment)

```
GEOMETRY — STATE MODULATION:
- Brackets separated horizontally by 8-12 cm (2-3× wider than default gap, X-axis spread for speech)
- Vertical bars stay perfectly vertical (no tilt during separation)
- Inner-facing surfaces (facing other bracket) have 10-15% brighter glow on patina patches in those zones

GLOW LEVEL: L3 visible (during sustained vowels: brief transient L3.5-L4 pulses).

FACE — STATE MODULATION:
- Both eyes asymmetry preserved (default canonical)
- Vowel peaks brighten eyes 3-5%
- Possible blink at sentence end
- Face floats steadily (does NOT move with brackets)
```

### Variant — Processing state

```
GLOW LEVEL: L2 baseline with rhythmic ±2% oscillation.

FACE — STATE MODULATION:
- Asymmetry preserved
- Half-blink at ~6-second intervals (rhythmic, partial close, not full)
- Pupils may have slight lateral drift (small lateral movement 1-3 degrees, slow)
```

### Variant — Error state

```
GLOW LEVEL: L1 dimmed glow (5% surface lift, barely visible).

FACE — STATE MODULATION:
- Both eyes squinted (left eye slightly squinted matching right; right eye stays squinted)
- Eye blink suppressed (held expression)
- Pupils centered (focused inward)

GEOMETRY — STATE MODULATION:
- Bracket gap may compress slightly to 0.95× default (closed-down posture)
```

## Composition variant blocks

For specific reference shots beyond canonical isolation:

### Variant — R-01 Master Hero (with archive setting)

Append к master block:

```
SETTING: Vast dark archive interior, year 2050. Endless rows of aged metal card-catalog drawers receding toward right side of frame to atmospheric depth. One drawer in foreground (lower-left of frame) slightly ajar, revealing warm tungsten interior glow. Volumetric atmospheric haze visible mid-distance, catching warm directional light from upper-left. Background drawers silhouetted against #1A1A1A to #0D0D0D tonal range.

ASPECT RATIO: 16:9 cinematic widescreen.
COMPOSITION: Subject in mid-distance, ~50% vertical occupation, centered horizontally.
```

### Variant — R-03 3/4 View

Modify GEOMETRY section:

```
GEOMETRY VIEW: Same canonical Meme geometry, viewed from 45° angle (3/4 view), revealing the 3-4cm rectangular cross-section thickness of the brackets. The depth of brackets is visible — solid rectangular volumes, not flat shapes. Inner corners 90° clearly visible from this angle.

ASPECT RATIO: 16:9.
COMPOSITION: Subject perspective showing depth, slight rotation visible.
```

### Variant — R-04 Texture Close-up

Replace COMPOSITION section:

```
SHOT: Extreme macro close-up of bronze + patina surface filling 100% of frame. Crystalline mineral structure of patina visible at extreme detail, layered chemistry showing newer patina over older. Bronze base visible in gaps between patina patches with cast surface micro-pitting. Glow visible from within patina patches at extreme detail.

NO full character visible (no full bracket form, no eyes — only material surface).
ASPECT RATIO: 1:1 square.
LIGHTING: Diffuse macro photography lighting (multiple soft sources to eliminate harsh shadows). Patina's own glow secondary illumination.
```

### Variant — R-05 Speaking Pose

Modify GEOMETRY section с speech state:

```
GEOMETRY — SPEAKING POSE: Brackets separated horizontally by 8-12 cm on X-axis (2-3× default gap). Vertical bars perfectly vertical (no tilt). Inner-facing surfaces glow 10-15% brighter on existing patina patches. Face centered horizontally over wider gap midpoint (face stays centered relative to gap as brackets separate).

ASPECT RATIO: 16:9.
COMPOSITION: Animation key pose, motion implied through extreme separation.
```

### Variant — R-06 Face Study

Modify COMPOSITION section:

```
SHOT: Extreme close-up on eye-dots and bracket top edge. Frame fills with face area dominating ~70% of frame. Top sections of brackets visible below as positioning context. 3-layer eye structure clearly visible, asymmetry detail (left wider, right semicircle squint), pupil position (upper-center) clearly readable. Bronze rim material detail visible at this scale.

ASPECT RATIO: 1:1.
LIGHTING: Very soft diffuse. Bronze rims catch minimal warm light from upper-left. Primary illumination — ambient bioluminescent glow from below (subtle, not overpowering).
```

## Usage instructions

### For Imagen 4 / Nano Banana

1. Paste master block at top of prompt
2. Append composition variant block per shot type (R-01 / R-02 / R-03 / R-04 / R-05 / R-06)
3. Append state variant block if non-idle state
4. Add scene-specific content after variants
5. Set aspect ratio explicitly (per variant)
6. Set quantity x4 для curation
7. Use Nano Banana Pro для best material fidelity

### For Veo 3.1

1. Paste master block in scene description
2. Append motion-relevant variant (Speech for talk clips, Processing for work clips)
3. Add per-clip storyboard content (DEEP-2 spec)
4. Reference image (Imagen-generated R-02 canonical) as `images[0]` (Branch A reference images)
5. Or use first/last frame Imagen-generated keyframes (Branch B)
6. Continuity block ensures character identity holds через clip generations

### For Lyria 3 Pro (audio score)

Lyria doesn't render Meme visually — но understanding character helps generate appropriate score:

```
CHARACTER CONTEXT: Score is for a brand mascot named Meme — calm bronze archivist character living in a dark archive interior 2050. Mascot has dual personality (curious child + wise old man simultaneously). Brand voice: cold Bauhaus, quietly authoritative, slightly dry humor, calm pillar (no dramatic peaks).

MUSIC SHOULD MATCH: spacious atmospheric, slow meditative, instrumental, no vocals, dark ambient cinematic genre. Mood arc: spacious atmospheric → searching curiosity → discovery lift → warm resolution → open invitation.
```

(Plus Lyria-specific score prompt per DEEP-2 §6.3.)

## Block size optimization

Master continuity block ≈ 750 words / ~5500 characters.

If prompt limit constrains:
- Compact version (essentials only) ≈ 350 words
- Full version ≈ 750 words

For Imagen 4 / Veo 3.1: full version fits comfortably.
For tight prompts: use compact version (omit detailed forbidden list, retain core structural rules).

## Compact version (when prompt size constrained)

```
=== MEME CHARACTER (compact) ===

Two bronze square bracket sculptures [ ] floating side by side, 3-4cm thick rectangular cross-section, sharp 90° Bauhaus angles, perfectly vertical and parallel, mirror symmetric. Default gap 3-4cm.

Aged bronze (warm honey-amber highlights #C8860A, dark chocolate shadows #3D2006), 70%+ visible bronze surface. Verdigris patina (#1DA8A0, hue 185°) covers ≤30% in concentrated patches at inside corners and horizontal segment edges only — NO patina on middle vertical sections, NO vertical drips. Bronze does NOT glow.

Subtle cyan-teal bioluminescent glow (#1AD4E6, hue 185°, ~30% of bronze brightness) emanates ONLY from inside patina patches, 1-2cm spread, soft falloff, NO halo around silhouette, NO rim light, NO ambient cyan.

Above brackets, two circular eyes (3-layer: bronze rim outer, white matte iris middle, black pupil inner). NO MOUTH. Left eye 30% wider full circle (curious child); right eye smaller with semicircle top (wise archivist). Pupils upper-center. Eyes do NOT glow.

Single warm tungsten soft box light upper-left 45° (3200K). Pure dark #1A1A1A background.

Negative: mouth, eyebrows, eyelashes, symmetric eyes, glowing eyes, halo, rim light, drips, patina on flat sections, bronze glowing, neon, LED, cartoon, anime, walking, limbs.

=== END ===
```

## Customization rules

When adding scene-specific content **after** continuity block:
- ✅ Camera position / movement
- ✅ Setting context (archive details, atmospheric haze, etc.)
- ✅ Aspect ratio specifics
- ✅ Action description (per state)
- ✅ Audio cues (for Veo native audio)
- ✅ Specific style descriptors (cinematic, museum quality, etc.)

When adding scene-specific content **after** continuity block:
- ❌ Conflicts с continuity block specifications (would create contradiction)
- ❌ Overrides material colors / hex values
- ❌ Overrides geometry rules
- ❌ Overrides face structure
- ❌ Overrides forbidden patterns

If scene requires deviation от continuity block — это **flag for canon update**, не silent override.

## Verification

After generation, verify output complies с continuity block:

- [ ] All geometry rules respected
- [ ] Material colors within canonical range
- [ ] Patina coverage ≤30% mirror match
- [ ] Glow source-only-from-patina
- [ ] 3-layer eyes preserved
- [ ] Asymmetry preserved
- [ ] No mouth / forbidden face elements
- [ ] Single-source lighting
- [ ] Background uniform
- [ ] No forbidden patterns (cross-check `anti-patterns.md`)

If any fails → regenerate с stronger reinforcement of failed area.

## Связь с другими файлами

- **Geometry** — `canon-geometry.md`
- **Material Bronze** — `canon-material-bronze.md`
- **Material Patina** — `canon-material-patina.md`
- **Glow** — `canon-bioluminescent-glow.md`
- **Face** — `canon-face.md`
- **Composition** — `canon-composition.md`
- **Lighting** — `canon-lighting.md`
- **States** — `states.md`
- **Anti-patterns** — `anti-patterns.md`
- **Decisions Log** — `decisions-log.md`

## Lock status

Continuity Block — **LOCKED v7 (session 254, 2026-04-26)**.

Master block — non-negotiable canonical content. Variant blocks per state and per shot type — locked. Customization rules — explicit.

Refinements которые НЕ нарушают lock:
- Compact version optimization
- Per-LLM-tool tuning (Imagen vs Nano Banana vs Veo wording variations)
- New variant blocks для new states (с decisions-log entry)

History:
- v1-v6: previous versions iterated в development
- v7 (session 254): finalized canonical block reflecting 3-layer eyes / ≤30% patina / L2 glow / 5-level scale / no drips canon
