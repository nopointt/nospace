---
name: mascot_meme_canon_bioluminescent_glow
description: Полная спецификация биолюминесцентного свечения маскота Meme. Hue 185°, hex `#1AD4E6`, 5-level intensity scale L1-L5, source rules (только из патины), радиус 1-2cm, soft falloff, запреты halo/rim/ambient/neon/LED.
type: reference
version: v7
locked: 2026-04-26 (session 254)
---

# Meme — Canon Bioluminescent Glow

> Свечение из патины. Этот файл — про свет. Patina (где живёт свет) — `canon-material-patina.md`. Bronze (где свет НЕ живёт) — `canon-material-bronze.md`.

## Концептуальная модель

Внутри verdigris patina **живёт фосфоресцирующий organism**. Это не abstract energy. Это не magic. Это organic biological light — как deep-sea bioluminescent algae, как phosphorescent moss в caves, как dinoflagellates в ocean.

Glow **emanates from inside patina patches**, не from outside, не from вокруг bracket silhouette, не from background ambient.

Каждое patch патины имеет свой own luminous source внутри. Multiple small patches → multiple small light sources. Все они combined → subtle ambient cyan-teal presence around bracket pair, но **никогда** halo / rim / aura / glowing outline.

### Reading rule

Тест чтения: **«phosphorescence inside patina»**, не **«patina is a light source»**.

Это нюанс:
- **Phosphorescence inside patina** — patina is the medium, glow is biological inhabitant. Bronze surface dominates visually, patina visible как accent, glow визуально subtle.
- **Patina is light source** (wrong) — patina becomes primary visual feature, bracket reads как «glowing object» not «bronze object with subtle accents».

Если в generation glow becomes dominant (eyes draw к glow first, не к bronze) — drift, regenerate.

## Цвет

### Glow emission color

| Property | Value |
|---|---|
| Hex (target) | `#1AD4E6` |
| Описание | Bright cyan-teal, slightly more saturated than patina mass |
| RGB | R: 26, G: 212, B: 230 |
| HSL | H: 185°, S: 80%, L: 50% |
| Saturation | 75-80% |
| Hue | 185° (cyan-teal middle) |
| Где появляется | Light emanating ИЗ patina patches |

`#1AD4E6` — slightly brighter, slightly more saturated cyan-teal vs `#1DA8A0` patina mass color. Это physically realistic — luminous organism brighter чем surrounding mineral.

### Hue precision

Hue 185° — **strict target**. Allowable drift:
- 175°-195° acceptable (cyan-teal range)
- <175° drifts toward green (wrong — patina chemistry should not look greenish glow)
- >195° drifts toward blue (wrong — patina chemistry not pure blue)

Если в generation glow looks pure green или pure blue — drift, regenerate. «Cyan-teal at hue 185°» — phrase to reinforce.

### Forbidden glow colors

| Wrong color | Why excluded |
|---|---|
| Pure cyan `#00FFFF` | Too saturated neon |
| Pure green `#00FF00` | Wrong chemistry |
| Pure blue `#0000FF` | Wrong chemistry |
| White / cool white | Не bioluminescence — это electric light |
| Yellow / warm | Wrong color territory |
| Magenta / purple | Не natural copper chemistry |
| Red | Никогда (red used только для error states, отдельный canon) |

## 5-level intensity scale (CRITICAL)

Glow intensity управляется через **5-level scale L1-L5**. Это canonical scale для всех states маскота и для всех downstream rendering.

### Scale definition

| Level | Intensity description | Brightness lift над bronze | Where used | Spread radius | Visibility test |
|---|---|---|---|---|---|
| **L1** | Barely visible — minimum presence | 5% surface lift | Idle in privacy contexts (vault), low-power states | 0.5-1 cm | Glow noticeable только при close inspection в dark environment |
| **L2** | Subtle — canonical baseline | 10% surface lift | **Default canonical state** (R-02 reference, idle, knowing) | 1-2 cm | Glow visible но not dominant; bronze still primary reading |
| **L3** | Visible — engaged state | 15% surface lift | Curious state, speech (talk animation default) | 1.5-2.5 cm | Glow clearly visible, contributes to character mood, still subordinate to bronze |
| **L4** | Bright — peak moments | 20% surface lift | Bridging (connection found), discovery beats в video reels | 2-3 cm | Glow noticeable от distance, character reads как «excited / engaged», bronze still readable |
| **L5** | Dominant — NEVER | 25%+ surface lift | **NEVER** — нарушает Calm pillar | 3+ cm | Glow becomes primary visual feature, bronze secondary; this is wrong territory |

### Default canonical = L2

**Reference image R-02** (canonical isolation reference) — locked at L2.

Все Imagen generations canonical Meme — at L2 unless explicitly другое state.

### State-to-level mapping

| State | Default glow level | Notes |
|---|---|---|
| Idle (canonical) | L2 | Baseline для reference shots и idle UI |
| Curious | L3 | Slight lift expressing engagement |
| Knowing | L2 | Same as idle, character signal через eye behavior, не glow |
| Bridging | L4 | Moment peak, найдена связь — energy briefly elevated |
| Speech (talk animation) | L3 | Slightly lifted to support visible bracket separation moments |
| Speech vowel peaks (transient) | L3.5-L4 | Brief 80-120ms transient pulses (см. `motion-talk-animation.md` State 10) |
| Processing | L2 (oscillating ±2%) | Slow rhythmic oscillation suggests work |
| Error | L1 | Dimmed; or signal-error red overlay (separate canon) |

### Implementation в Imagen / Veo prompts

Imagen / Veo не accept numerical brightness values directly. Translate L1-L5 в descriptive language:

| Level | Prompt phrase |
|---|---|
| L1 | «very subtle, barely visible glow, hint of luminescence» |
| L2 | «subtle glow, ~30% of bronze highlight brightness, barely noticeable at first glance» |
| L3 | «visible glow, ~45% of bronze highlight brightness, character signal» |
| L4 | «bright glow but still organic, ~60% of bronze highlight brightness, peak moment energy» |
| L5 | NEVER USE |

## Источник свечения (source rules)

### Only from inside patina patches

Glow emanates **only from inside individual patina patches**. Этот rule absolute.

Source semantics:
- Каждый patina patch = own light source
- Multiple patches = multiple sources (small, distributed)
- Light intensity per source = same level (L2 default), modulated together
- Source is **internal** to patch — light emerges from within mineral structure outward

### Where glow does NOT come from

- ❌ Bronze surfaces — bronze никогда не glows (см. `canon-material-bronze.md`)
- ❌ Bracket silhouette — no halo around bracket outline
- ❌ Eye-dots — eyes никогда не glow (см. `canon-face.md`)
- ❌ Background — no ambient glow в empty space
- ❌ Floor / ground — no glow projection downward
- ❌ Air вокруг bracket — no ambient cyan haze в atmosphere
- ❌ Inner edges (facing other bracket) **в idle state** — окей, inner edges имеют patina и glow patches (если они там есть), но не dedicated «inner edge glow line»
- ❌ Inner edges **в speech state** — exception: inner facing surfaces have brightness lift 10-15% per `motion-talk-animation.md` State 7. Это **brightness lift на existing patina patches** в inner-facing zones, не new dedicated glow.

### Glow от each patch independently

Каждый patch glows independently. Не synchronized. Не one big network.

- One patch может быть at L2, another at L1.5 — minor variations OK
- Some patches могут быть «sleeping» (very dim) momentarily — natural biological variation
- Speech vowel peaks lift glow temporarily across all patches — synchronized это допустимо
- Otherwise — independent variation expected

В Imagen generation modal often renders synchronized glow (all patches same brightness). Это acceptable для simplicity, но не required. Slight variation enhances «organism» reading.

## Радиус и spread

### Spread radius

| Level | Spread radius (default) |
|---|---|
| L1 | 0.5-1 cm out from each patch |
| L2 | 1-2 cm |
| L3 | 1.5-2.5 cm |
| L4 | 2-3 cm |
| L5 | 3+ cm (NEVER) |

Это approximate per-patch radius. Не universal — depends on patch size. Larger patch — slightly larger radius. Smaller patch — smaller radius.

### Falloff curve

Glow intensity **softly falls off** from patch surface outward:
- At patch surface: 100% intensity
- At 50% radius: ~60% intensity
- At 80% radius: ~25% intensity
- At full radius: ~5% intensity (almost invisible)
- Beyond radius: 0% (sharp cutoff to dark)

Это **soft Gaussian-like falloff**, не hard edge, не linear.

В Imagen / Veo prompt: «soft falloff, gentle diffuse glow boundary, не sharp edge».

### Что spread radius НЕ does

- ❌ Не connects glows from different patches into one large halo
- ❌ Не extends к bracket silhouette outline
- ❌ Не reaches to other bracket (cross-bracket glow contamination)
- ❌ Не projects на background
- ❌ Не projects shadow/light cast on surrounding surfaces beyond ~1cm bronze reflection

## Запреты (что glow никогда не делает)

### Forbidden glow patterns

- ❌ **Halo around silhouette** — glow outlining brackets — looks like neon sign
- ❌ **Rim light** — backlight rim creating glow outline on edges — wrong physics
- ❌ **Surrounding ambient cyan** — air around bracket tinted cyan — атмосфера не источник
- ❌ **Atmospheric cyan haze** — fog/mist tinted cyan — нет атмосферных эффектов
- ❌ **Background glow projection** — glow casts pool на пол/back wall — нет ground reference
- ❌ **Bronze tinting** — bronze surfaces tint cyan from нерadiated light — only minimal local reflection 1-2cm radius acceptable
- ❌ **Eye glow** — eyes становятся luminous — eyes НИКОГДА не glow
- ❌ **Uniform glow across all patches** — все patches на exactly same intensity — natural variation acceptable
- ❌ **Outer halo** — large bloom вокруг whole figure — не Bauhaus, не Calm pillar
- ❌ **Pulsing halo** — halo oscillating brighter/dimmer — wrong rhythm

### Forbidden glow types

- ❌ **Neon** — sharp electric edge, saturated, hard line
- ❌ **LED** — point-source, focused, specular
- ❌ **Electric arc** — visible bolt, jagged, intense
- ❌ **Laser** — coherent beam, directional
- ❌ **Plasma** — energetic plasma cloud
- ❌ **Holographic** — interference patterns, refraction
- ❌ **Magic VFX** — particle systems, fairy dust, sparkles
- ❌ **Fire** — orange/red flame quality

Glow is **organic biological**, soft, ambient к patch, gentle. Не technological.

### Forbidden colors

См. «Цвет» section выше — pure cyan, pure green, pure blue, white, yellow, magenta, red — все wrong.

### Forbidden visibility tricks

- ❌ Lens flares (radiant rays из glow points)
- ❌ Bloom effects (over-saturated white center)
- ❌ Volumetric god-rays (light shaft через atmosphere)
- ❌ God-rays через haze (no haze в isolation reference)
- ❌ Heat distortion (glow hot enough to refract air)
- ❌ Bokeh artifacts (defocus circles)

Glow is **subtle inside-patina presence**, not VFX-heavy spectacle.

## Reference vs in-context

### Reference shot (R-02 isolation)

- L2 baseline
- Black background — glow visible against contrast
- No background contamination (background remains pure `#1A1A1A`)
- Each patch glow visible но subtle
- Reading: «bronze object with phosphorescent patches»

### In-archive shot (R-01 master hero)

- L2 baseline
- Plus archive context — drawer rows behind brackets могут pick up очень subtle glow reflection (если в close proximity 1-2cm) — but mostly drawers remain dark
- Glow doesn't illuminate archive (archive lit by separate warm tungsten source per `canon-lighting.md`)
- Reading: same — bronze object with phosphorescent patches, в context

### Marketing video (3D animated)

- L2 default, transitioning to L3-L4 в peak moments per state
- Slight glow flicker / breath cycle (8-second period oscillating ±5% within level — adds life)
- Inner edge brightness lift в speech moments
- Per-clip color grade в DaVinci может slightly enhance glow (см. `canon-bioluminescent-glow.md` × `canon-lighting.md` × DaVinci grade recipe DEEP-5)

### UI illustration (2D/2.5D)

- L2 rendered as cyan-teal fill `#1AD4E6` в patina areas
- Spread может быть omitted в low-resolution / simplified
- В larger illustrations — soft radial gradient simulating spread

## Glow oscillation (subtle motion)

В motion contexts glow **subtly oscillates** at 8-second period с ±5% amplitude.

- Period: 8 seconds (matches idle breathing cycle)
- Amplitude: ±5% от current level (например, L2 at 10% baseline → oscillates 9.5%-10.5%)
- Phase: irregular (per Van Doesburg P-17 unequal accents principle — see `references-rag-sources.md`)
- Synchronized с patina glow modulation animation (см. `motion-talk-animation.md` State 10)

Oscillation is **almost imperceptible** при casual viewing, но contributes к organism feel — не frozen artifact.

В static reference frame — pick a moment in oscillation, doesn't have to be peak. Different reference frames могут capture different oscillation phases.

## Polyrhythm с idle

Glow oscillation 8-second period coexists с другими mascot rhythms:
- Idle bracket breathing: ±1% amplitude, 8-second period (synchronized with glow)
- Eye blink: every 6-12 seconds, irregular interval (asynchronous from glow)
- Glow oscillation: ±5%, 8-second period (synchronized with breath)

Это **polyrhythm** — multiple natural cycles overlapping, не perfect synchronization. Per Van Doesburg «rhythm of unequal accents» principle.

## Verification checklist

При generation, verify:

- [ ] Glow color is cyan-teal hue 185° (`#1AD4E6` range)
- [ ] Glow emanates ТОЛЬКО from inside patina patches
- [ ] Bronze surfaces do not glow
- [ ] Eyes do not glow
- [ ] Background remains dark uniform (no cyan ambient)
- [ ] No halo around bracket silhouette
- [ ] No rim light
- [ ] No surrounding air cyan haze
- [ ] Spread radius 1-2 cm at L2 baseline
- [ ] Soft falloff (not sharp edge)
- [ ] Glow appears subordinate to bronze (bronze 70%+ visual dominance preserved)
- [ ] Reading test: «phosphorescence inside patina» (correct), not «patina is light source» (wrong)
- [ ] At L4 peak — still organic, not neon/LED/electric

## Drift modes warning

Common drift в Imagen / Veo:

- **Halo drift** — modal generates outline glow вокруг brackets. Reinforce «no halo, no rim, glow only from inside patches».
- **Brightness drift** — glow brightens over generations toward neon. Reinforce «subtle glow, ~30% of bronze highlight brightness, NOT neon».
- **Color drift** — glow shifts toward pure cyan (`#00FFFF`) или green. Reinforce «cyan-teal hue 185°, organic biological color».
- **Bronze tinting drift** — whole bronze surface tints cyan. Reinforce «bronze stays warm honey-amber, glow does not contaminate beyond local 1-2cm reflection».
- **Background contamination drift** — air around bracket tints cyan. Reinforce «background pure dark uniform, no ambient cyan haze».
- **Type drift** — glow becomes neon / LED / electric. Reinforce «soft organic biological light, like phosphorescent moss or deep-sea algae, NOT neon, NOT LED, NOT electric».
- **Eye glow contamination** — eyes start to glow. Reinforce «eyes are matte, do NOT glow».

## Связь с другими файлами

- **Patina** — `canon-material-patina.md` (patina is the source/medium for glow)
- **Bronze** — `canon-material-bronze.md` (bronze is non-emissive, complementary to glow)
- **Face** — `canon-face.md` (eyes never glow, separate material)
- **Composition** — `canon-composition.md` (how glow fits в reference shots)
- **Lighting** — `canon-lighting.md` (how warm key light interacts with cool glow)
- **States** — `states.md` (which level per state)
- **Motion** — `motion-talk-animation.md` (glow modulation in speech), `motion-idle-and-states.md` (oscillation в idle)
- **Continuity Block** — `continuity-block.md` (paste-ready glow section)
- **References** — `references-rag-sources.md` (Avatar Pandora bioluminescence inspiration, deep-sea algae natural science)
- **Decisions** — `decisions-log.md` (glow color и intensity evolution v1-v7)

## Lock status

Bioluminescent glow — **LOCKED v7 (session 254, 2026-04-26)**.

Hue 185° / `#1AD4E6` — non-negotiable. 5-level scale L1-L5 with L2 default — non-negotiable. Source-only-from-patina-patches — absolute. No halo / rim / ambient — absolute. Soft falloff — absolute. Organic biological character — absolute (no neon / LED / electric).

Refinements которые НЕ нарушают lock:
- Уточнение exact spread radius при PBR rendering
- Уточнение oscillation amplitude / phase
- Per-state glow level fine-tuning
- New states adding additional level usage (с decisions-log entry)

История изменений:
- v1: glowing neon yellow whole body — rejected (Soul Jerry similarity)
- v2: solid bronze no glow — rejected (too dead)
- v3: cool glow + warm highlights mixed — almost
- v4 (session 253): bronze body + bioluminescent patina canonical, glow color hue 185° locked
- v5 (session 253): inverse explored (glowing bronze + still patina) — rejected
- **v7 (session 254)**: 5-level intensity scale L1-L5 added; baseline L2 locked from R-02 development; halo / rim / ambient explicit forbidden; spread radius 1-2cm specified; oscillation 8-second period locked
