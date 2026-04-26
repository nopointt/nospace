---
name: mascot_meme_canon_lighting
description: Полная световая спецификация маскота Meme. Single soft box upper-left 45° tungsten 3200K, направление highlights/shadows, dual-source rule (warm key + bioluminescent secondary), запреты (rim/back/side fill/ambient haze).
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Canon Lighting

> Освещение маскота. Этот файл — про свет в reference shots и motion clips. Что освещается — `canon-geometry.md`, `canon-material-bronze.md`, `canon-material-patina.md`. Свечение из patina — `canon-bioluminescent-glow.md` (это secondary source, описано здесь × cross-ref).

## Концептуальная модель

Meme освещён **двумя источниками**:

1. **Primary key light** — warm directional light from upper-left, single soft box, tungsten color temperature 3200K
2. **Secondary bioluminescent** — cool cyan-teal light emanating from patina patches (см. `canon-bioluminescent-glow.md`)

Эти два источника **coexist в single composition** и создают характерную dual-temperature lighting:
- Bronze surfaces читаются warm (от key light + warm tone)
- Patina и proximate surfaces tinted slightly cool (от bioluminescent glow)
- Result: warm-cool play характеризующий Meme aesthetic

Это **museum-quality lighting** (single dramatic key + secondary subject light), не studio commercial product lighting (multi-light setup) и не cinematic moody lighting (high-contrast noir).

## Heritage references

### Museum bronze sculpture lighting

Главный референс — **museum bronze sculpture lighting standards**:
- Single warm directional spot 2700-3000K (тёплый key)
- 45° from upper-left (правое положение даёт left-shadow effect, читается attention к right)
- CRI 95+ (high color rendering для accurate bronze warmth)
- Dark room (Caravaggio-style spotlighting) — peripheral space recedes к darkness
- Effect: «polychrome sculpted figures arose shining from dimly lit alcoves»

Per DEEP-5 cross-discipline insights (см. `references-rag-sources.md`):
- 2700K key — gives strong warm push (RGB equivalent: R+0.05, G+0.01, B-0.08)
- 3200K subtler — RGB R+0.03, G+0.01, B-0.04 (canonical target для Meme)
- Shadows: NOT hard cut to black, soft penumbra
- Atmospheric gradient — depth feels significant но не chaotic

### Apple product reveal aesthetic

Stylistic reference для **floating object dramatization**:
- Single light источник
- Object suspended в space
- Background dark / matte
- Material precise rendering through directional contrast

Apple's product photography combines studio matte с single dramatic light. Это наша lighting paradigm для R-02 isolation reference.

### Apple September 2025 reveal references

Per `philosophy.md` and SEED references — Apple's September 2025 «floating object» product photography aesthetic:
- Subject floating mid-air
- Single soft box light upper-left ~45°
- Dark background `#1A1A1A` или similar
- Soft falloff shadows
- High material fidelity through directional rendering

Это canonical reference для R-02 lighting.

## I. Primary key light specification

### Position

| Property | Value |
|---|---|
| Direction | **Upper-left** |
| Angle | **45° from horizontal** (45° elevation from horizon) |
| Azimuth | 45° from frame center to left (light coming from approximately 10-11 o'clock position) |
| Distance | Soft box positioned at moderate distance (key softness moderate) |
| Strict consistency | Same direction в всех reference shots, всех motion clips canonical lighting |

### Color temperature

| Property | Value |
|---|---|
| Color temperature | **Tungsten 3200K** |
| RGB equivalent | Subtle warm — R+0.03, G+0.01, B-0.04 push |
| Hex equivalent | Light source color reads ~`#FFD9B5` (warm tungsten) |
| Не путать с | 2700K (too warm orange), 5600K (too cool daylight), candle 1850K (too warm красный) |

### Source type

| Property | Value |
|---|---|
| Source type | Soft box (medium) |
| Diffusion | Soft, не sharp (avoids harsh edge shadows) |
| Spread | Moderate (illuminates subject area без contaminating background)* |
| Hardness | Medium-soft (some shadow definition но not crisp hard shadows) |

*Light **does not spill significantly onto background** (background remains dark `#1A1A1A`). Photometric setup achievable: soft box has limited reach beyond subject.

### Why these specifications

- **Upper-left 45°** — classic museum lighting position (matches gallery best practice). Lights bronze upper surfaces, casts shadows to lower-right (visually balanced).
- **3200K tungsten** — warm enough to show bronze warmth fully, cool enough to remain «honest» (not saturated orange). Halogen / tungsten studio standard.
- **Single source** — Apple-style minimalism. Multiple lights would create competing highlights, disrupt material reading.
- **Soft box** — soft shadow edges feel natural / artistic. Hard light would be sterile / industrial.

## II. Highlight direction

### Where highlights appear

Highlights **always on upper-left surfaces of both brackets** (matched single-source consistency).

Per bracket:
- **Top horizontal segment** — top face catches light, glows warm honey-amber
- **Vertical bar upper-left edge** — vertical edge facing upper-left direction catches light
- **Inside corner upper section** — где horizontal meets vertical, upper portion catches light
- **Front face upper portion** — bracket frontal face graduated brighter at top

Per bracket — same lit surfaces (mirror-matched).

### Highlight intensity

| Surface | Highlight intensity (target) |
|---|---|
| Direct light catching surface | Bright honey-amber `#C8860A` |
| Edge directly facing light | Maximum brightness |
| Adjacent surfaces (slightly off-axis) | Slightly dimmer |
| Front face center | Mid-bright |
| Back-of-bracket / lower-right surfaces | Shadow `#3D2006` |

Highlight peak ~75% IRE (на photographic luminance scale) — bright but not blown.

### Glow vs highlight

Critical distinction:
- **Highlight** = warm bronze surface where key light strikes (`#C8860A` family)
- **Glow** = cool cyan-teal emerging from patina patches (`#1AD4E6`)

These should be **distinct** в the rendering. Highlight bright bronze **где light hits**. Glow emerging **где patina is**. Two separate lighting elements coexisting.

При reading test: глаз должен distinguish «вот это bronze highlight» и «вот это glowing patina». Если они смешиваются в один уход — drift, regenerate.

## III. Shadow direction

### Where shadows appear

Shadows **always on lower-right and lower surfaces of both brackets** (matched).

Per bracket:
- **Bottom horizontal segment** — bottom face shadow, дарк chocolate
- **Vertical bar lower-right edge** — edge facing lower-right в shadow
- **Inside corner lower section** — где horizontal meets vertical, lower portion в shadow
- **Front face lower portion** — bracket frontal face graduated darker at bottom

### Shadow intensity

| Surface | Shadow value (target) |
|---|---|
| Direct shadow (light fully blocked) | Dark `#3D2006` chocolate-brown |
| Adjacent shadow (partial occlusion) | Slightly lighter dark brown |
| Inner corners (deepest) | Darkest, almost `#2D1604` |
| Underside того что floats | Strong shadow |

Shadow value at ~10% IRE — deep but не crushed (preserves material character even в darkness).

### Soft penumbra

Shadows **не sharp-edged**. Soft falloff between lit and shadow areas:
- Edge transition: soft gradient over 5-10mm visual zone
- No hard line shadows (would feel sterile / industrial)
- Penumbra reflects soft box source (large area light source)

Soft penumbra signature — visual hallmark of museum lighting.

### Shadow contamination

Some bronze ambient bounce light (reflected от bronze surfaces к other bronze surfaces) **slightly fills shadows** на opposite surfaces. Это physical realism:
- Lit upper-left surface reflects warm light к neighboring surfaces
- Slight warm fill в shadow areas (~10-15% bright)
- Result: shadows не absolute black, но warm darker bronze

В Imagen / Veo this often renders correctly automatically when describing «aged bronze metal with realistic light bounce». Reinforce при drift toward absolute-black shadows.

## IV. Forbidden lighting

### Never use

- ❌ **Rim light** — backlight rim creating glow outline. Wrong physics, looks neon. Также violates `canon-bioluminescent-glow.md` no-halo rule.
- ❌ **Back light** — illumination from behind subject. Wrong source position.
- ❌ **Side fill** — secondary key light from opposite (right) side. Multiplies sources, breaks single-key discipline.
- ❌ **Bottom light** — uplight от below. Theatrical / creepy reading.
- ❌ **Top light** — direct overhead. Crime drama interrogation reading.
- ❌ **Frontal light** — flat key directly on subject. Sterile / unflattering, loses material modulation.
- ❌ **Ambient fill** — soft fill light eliminating shadows. Loses key/shadow contrast, makes subject flat.
- ❌ **Atmospheric haze** (в isolation reference) — fog / mist. Background should be clean dark.
- ❌ **Multiple keys** — two или more directional lights. Disrupts single-source canonical setup.
- ❌ **Flicker / unstable** — flickering light source. Not canonical (unless specific story moment).
- ❌ **Colored gels** — light tinted with non-canonical colors (red / blue / green). Tungsten warm only.
- ❌ **Lens flares** — lens artifacts от bright source. Loses material focus.
- ❌ **God rays / volumetric** в isolation reference — атмосферный волюметрический свет. Background must be uniform.

### Why these forbidden

Each violates one of:
- Single-key canonical discipline (museum bronze lighting paradigm)
- Material truth (Bauhaus Materialwahrheit — material renders honestly under single source)
- Visual hierarchy (highlight + glow are the only two light elements, нothing else competes)
- Temporal stability (lighting consistent across reference shots and motion clips)

## V. Dual-source rule (warm key + bioluminescent secondary)

### How they interact

**Warm key light** (3200K tungsten) and **cool bioluminescent glow** (hue 185°) coexist в same composition:

| Aspect | Warm key | Bioluminescent secondary |
|---|---|---|
| Source | External soft box upper-left | Internal patina patches |
| Color temp | 3200K (warm) | Equivalent ~25,000K (cool) |
| Intensity (relative) | Primary, sets exposure | Subordinate ~30% of bronze highlight brightness (L2) |
| Direction | Directional from upper-left | Local emanation from patches |
| Reach | Across whole subject | 1-2cm from each patch |
| Falloff | Soft museum-style | Soft Gaussian |

### Visual result

Warm key light hits bronze → bronze surfaces glow warm honey-amber где light catches.
Bioluminescent organism in patina → cool cyan-teal patches emerging from patina locations.

Result: bronze **warm bias dominant**, patina **cool bias secondary**. These contrasting temperatures create:
- Dimensional richness
- Material distinction (bronze vs patina vs glow)
- Visual interest at every viewing distance
- Bauhaus duality (warm/cool как формальное соотношение)

### Temperature contrast

В color theory, warm + cool together = compositional energy. Meme leverages this:
- **Bronze** = warm anchor (steady, weighty, body)
- **Patina glow** = cool accent (sharp, ethereal, consciousness)

Per philosophy: bronze = старик-хранитель (warm wisdom), patina-glow = ребёнок-любопытство (cool living spark). Lighting embodies dual personality.

### Edge cases

В very close patina patch zone, warm bronze + cool glow might combine:
- Bronze surface immediately adjacent к patina patch
- Receives both warm key light (from above-left) and cool glow reflection (from patch)
- Net result: slightly cooler bronze в this 1-2cm zone (warm + cool = neutral cooler)
- Acceptable: subtle visible color shift в this zone (proximity reflection)
- Not acceptable: bronze loses warm identity beyond 2cm

## VI. Lighting per state

| State | Lighting variations |
|---|---|
| Idle (canonical) | Default: warm key upper-left + L2 patina glow |
| Curious | Default + L3 patina glow (slightly brighter) |
| Knowing | Default + L2 patina glow (same as idle, character signal через eyes) |
| Bridging | Default + L4 patina glow (peak moment energy) |
| Speech | Default + L3 glow + 10-15% inner-edge brightness lift on patina (per `motion-talk-animation.md` State 7) |
| Processing | Default + L2 oscillating ±2% (slow rhythmic) |
| Error | Default + L1 patina glow OR signal-error red overlay (canon TBD) |

Across all canonical states: **warm key direction unchanged, color temp unchanged**. What varies — patina glow level и optional state-specific modulations.

## VII. Lighting in different shots

### R-01 master hero (with archive)

- Canonical lighting setup
- Plus archive context lighting:
  - Dim ambient illumination from drawer interiors (warm tungsten)
  - Atmospheric haze catches warm directional from upper-left
  - Background drawer rows lit primarily by atmospheric depth (not by main key)
  - Foreground drawer ajar emits warm interior glow (illuminates lower-left frame slightly)

### R-02 isolation

- Canonical lighting only — single soft box upper-left, no archive context
- Background pure `#1A1A1A` uniform
- No archive-specific elements

### R-03 3/4 view

- Canonical lighting from same upper-left position
- Light plays differently на rotated geometry:
  - Some surfaces previously at oblique angle now catch direct light
  - Some surfaces previously lit now в shadow
  - Cross-section depth surfaces (3-4cm rectangular profile) variably lit
- Same color temp, same source — just different geometry receiving light

### R-04 texture close-up

- Diffuse macro photography lighting (multiple soft sources to eliminate harsh shadows)
- Less directional чем canonical
- Patina glow provides secondary illumination
- Material texture priority over directional drama

### R-05 speaking pose

- Canonical lighting setup
- Plus inner-edge brightness lift на patina patches (10-15% per State 7)
- Bracket gap wider creates more visible inner surfaces — these get more glow visibility

### R-06 face study

- Very soft diffuse lighting (close-up requires soft to avoid harsh shadows)
- Bronze rims of eyes catch minimal warm light from upper-left
- Primary illumination — ambient bioluminescent glow from below (subtle, не overpowering)

### Marketing video (Veo clips)

Per DEEP-2 storyboard:
- Continuity table maintains canonical lighting в каждом clip
- Camera moves but lighting source stays consistent (upper-left key)
- Atmospheric haze visible mid-distance
- Inner edge brightness lift в speech clips
- Glow oscillation (8-second period) в idle clips

## VIII. DaVinci grade implications

When grading Veo output в DaVinci (per DEEP-5 grade recipe):
- **Node 2 (Bronze Warmth)** enhances existing warm key — pushes RGB warm в shadows / mids / highlights
- **Node 3 (HSL Bronze Highlights)** isolates already-warm bronze highlights и saturates further
- **Node 4 (Glow Power Window)** isolates patina patches и applies Glow FX
- **Node 5 (Background Depth)** vignettes background slightly cooler

Lighting rendering правильно в Veo source гарантирует grade добавляет polish, не fights raw output. Если canonical lighting violations в Veo — grade can recover but at cost (loss of fidelity).

## IX. Lighting verification checklist

При generation reference / clip, verify:

- [ ] Single soft box upper-left 45° identifiable from highlight pattern
- [ ] Color temperature reads warm tungsten (~3200K) — bronze surfaces warm honey-amber (`#C8860A`)
- [ ] All highlights on upper-left surfaces of BOTH brackets (matched)
- [ ] All shadows on lower-right and lower surfaces of BOTH brackets
- [ ] Soft penumbra (no hard shadow edges)
- [ ] Background remains dark uniform `#1A1A1A` (no spill)
- [ ] No rim light around silhouette
- [ ] No back light
- [ ] No side fill from right
- [ ] No ambient fill eliminating shadows
- [ ] No atmospheric cyan haze
- [ ] No multiple key lights
- [ ] Bioluminescent glow secondary, subordinate to key
- [ ] Warm bronze + cool glow play visible (temperature contrast)

## X. Drift modes warning

Common drift в Imagen / Veo:

- **Wrong direction drift** — modal puts highlights from upper-right or center. Reinforce «light from upper-left only, all highlights upper-left, all shadows lower-right».
- **Color temperature drift** — modal renders cooler (5000K+) или warmer (2400K+). Reinforce «3200K warm tungsten, museum bronze sculpture lighting».
- **Multiple light sources** — modal adds rim, fill, или back lights. Reinforce «single soft box upper-left only, no other directional sources».
- **Hard shadow drift** — sharp shadow edges appear. Reinforce «soft museum lighting, soft penumbra, gradual shadow falloff».
- **Background spill** — light spills onto dark background. Reinforce «background remains pure dark `#1A1A1A`, no light spill, no atmospheric tint».
- **Frontal light drift** — modal lights from front (flat). Reinforce «directional from upper-left at 45°, NOT frontal, NOT flat lighting».
- **Atmospheric haze в isolation** — modal adds atmospheric mist. Reinforce «pure void background, no atmospheric haze в isolation reference».
- **Cyan ambient drift** — atmospheric cyan tint появляется. Reinforce «warm key light only, no cyan ambient, no atmospheric tinting from glow».

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (geometry which receives the light)
- **Material Bronze** — `canon-material-bronze.md` (bronze surfaces respond к key light)
- **Material Patina** — `canon-material-patina.md` (patina respond к key light + glow source itself)
- **Glow** — `canon-bioluminescent-glow.md` (bioluminescent secondary source spec)
- **Composition** — `canon-composition.md` (how lighting fits в composition rules)
- **States** — `states.md` (per-state lighting variations)
- **Motion** — `motion-talk-animation.md` and `motion-idle-and-states.md` (lighting consistency через motion)
- **Continuity Block** — `continuity-block.md` (paste-ready lighting section)
- **References** — `references-rag-sources.md` (museum bronze lighting research, Apple 2025 product reveal aesthetic, DEEP-5 DaVinci grade implications)

## Lock status

Lighting — **LOCKED v1 (session 254, 2026-04-26)**.

Single soft box upper-left 45° tungsten 3200K — non-negotiable. Highlight/shadow direction mirror-matched between brackets — non-negotiable. Soft penumbra — non-negotiable. No rim/back/side fill/ambient — absolute. Dual-source rule (warm key + cool bioluminescent secondary) — absolute.

Refinements которые НЕ нарушают lock:
- Уточнение exact color temp (within 3000-3500K range)
- Уточнение exact source distance / softness
- Per-shot specific atmospheric details (R-01 archive context, R-04 macro diffuse)
- Per-state glow level per `canon-bioluminescent-glow.md` 5-level scale
