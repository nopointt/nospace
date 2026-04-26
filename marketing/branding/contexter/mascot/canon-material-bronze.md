---
name: mascot_meme_canon_material_bronze
description: Полная спецификация материала корпуса маскота Meme. Aged bronze. Hex значения, поверхностная текстура, micro-pitting, aging, коэффициент покрытия. Бронза как dominant material reading.
type: reference
version: v4
locked: 2026-04-26 (session 253 material lock + session 254 coverage refinement)
---

# Meme — Canon Material: Bronze Body

> Корпус маскота. Этот файл — про bronze. Patina и glow — отдельные файлы (`canon-material-patina.md`, `canon-bioluminescent-glow.md`).

## Обзор материала

Корпус Meme — **aged bronze metal**. Литая бронза, прожившая декаду или больше в archive setting (атмосфера 2050 года, museum storage humidity).

Это не современная polished бронза, не industrial brass, не shiny new metal. Это **архивный артефакт** — выдержанный, накопивший историю, с микропатиной поверхности.

Бронза — **dominant material reading** маскота. То есть: при первом взгляде глаз должен распознать «это bronze object», не «patina with bronze underneath». Bronze занимает 70%+ visible surface. Patina — accent (≤30%, см. `canon-material-patina.md`).

## Heritage и references

### Marianne Brandt — Bauhaus metalwork

Главный исторический референс — **Marianne Brandt (1893-1983)**, Bauhaus metalworker. Особенно её работы в metal workshop под Moholy-Nagy:
- Brandt-Kandem table lamps (1928) — bronze + steel hybrid, sculpted forms
- MT 49 tea infuser (1924) — silver, но эстетика relevant
- Light fixtures для Bauhaus building в Dessau

Что мы берём от Brandt:
- Material truth (Bauhaus принцип Materialwahrheit) — bronze выглядит как bronze, не painted, не plated
- Sculpted form (objects как objects, не decorative)
- Functional aesthetic (forms имеют purpose)
- Slight imperfection (handmade quality, не industrial perfection — но в нашем случае это micro-pitting от aging, не от tooling)

Brandt НЕ референс для:
- Geometry shape (она работала с круглыми / органическими формами; наш Meme — sharp brackets)
- Surface finish (она часто polished; наш Meme — aged matte)

### Apple September 2025 product reveal aesthetic

Stylistic reference для **rendering** (не material itself):
- Floating object в space, precise material rendering
- Studio matte aesthetic
- Single soft light source dramatizing material
- Black / dark background letting material breath

Apple polishes материалы (chrome, anodized aluminum) — это противоположность нашему aged. Но **способ показать material** (one-light-on-floating-object) — наш референс.

### Avatar Pandora bioluminescence (для glow только)

Только для glow — не для бронзы. См. `canon-bioluminescent-glow.md`.

### Ancient bronze artifacts (museum reference)

- Greek bronze sculptures (5th-4th century BC) — Riace Bronzes, Charioteer of Delphi — natural patina развилась за тысячелетия
- Chinese ritual bronze (Shang and Zhou dynasties) — aged with verdigris
- Benin Bronzes (16th-19th century) — aged warm brown bronze
- Statue of Liberty (1886) — public bronze with maritime patina

Эти artifacts показывают **how aged bronze actually looks**: warm honey-amber где light strikes, dark chocolate в shadows, with verdigris patina concentrated в moisture pools. Это grounding в physical reality.

Meme — fictional 2050 archivist, но material grammar — real.

## Цвет

### Highlight color

| Property | Value |
|---|---|
| Hex (target) | `#C8860A` |
| Описание | Warm honey-amber, rich gold tone |
| RGB | R: 200, G: 134, B: 10 |
| HSL | H: 39°, S: 90%, L: 41% |
| Где появляется | Surfaces куда падает direct light (upper-left lit per canon-lighting.md) |
| Не путать с | Pure gold (#FFD700 — too yellow), copper (#B87333 — too red), brown (#8B4513 — too dull) |

`#C8860A` — это не bright pure gold. Это **тёплый bronze gold** который сохраняет honey warmth с slight orange undertone. Material с patina и aging, не fresh polished gold.

### Shadow color

| Property | Value |
|---|---|
| Hex (target) | `#3D2006` |
| Описание | Dark chocolate-brown |
| RGB | R: 61, G: 32, B: 6 |
| HSL | H: 27°, S: 82%, L: 13% |
| Где появляется | Surfaces away from light (lower-right per canon-lighting.md), внутри inside corners, на underside горизонтальных сегментов |
| Не путать с | Pure black (#000000 — слишком dark, теряется material), warm brown (#5C2E0E — too red) |

`#3D2006` — это **тёплый dark brown** с warm undertone. Не cool dark, не gray-brown. Сохраняет bronze warmth даже в самых тёмных областях.

### Midtones

Между highlight и shadow — natural bronze gradient через amber-brown midtones:
- Upper midtone: `#A56F0E` (slightly darker than highlight)
- Mid-midtone: `#7E5710` (transition)
- Lower midtone: `#5A3C0A` (darker, approaching shadow)

Эти не fixed targets, это interpolation между highlight и shadow. Material должен smoothly modulate через них based на lighting.

### Color drift в production

При rendering / re-encoding / display calibration cliffhanger color drifts. Acceptable variance:
- Highlight `#C8860A` ± 8% saturation, ± 4° hue
- Shadow `#3D2006` ± 5% saturation, ± 3° hue

Drift beyond этих bounds → перегенерировать. Особенно critical: highlight не должен drift в `#FFD700` direction (становится pure gold) или в `#8B4513` direction (становится muddy brown).

### Что не bronze (другие оттенки)

Эти colors **никогда** не должны появляться на bronze body:

| Wrong color | Why excluded |
|---|---|
| Silver / chrome reflections | Это бронза, не chrome. Не reflective metal |
| Bright pure gold (#FFD700) | Too yellow, теряет brown grounding |
| Pure black (#000000) | Теряет material warmth |
| Cool gray | Bronze is warm metal, не cool |
| Greenish (без patina context) | Verdigris is in patina, не в bronze body |
| Reddish (#B22222) | Это copper, не bronze |
| Pinkish | Никогда не появляется в bronze |
| Blue | Никогда |
| Orange-saturated (#FF8C00+) | Too saturated, теряет honey warmth |

## Поверхность

### Cast bronze surface texture

Bronze — **cast metal**, не stamped, не CNC-milled, не extruded.

Текстура поверхности должна читаться как:
- Subtle imperfections от литьевой формы (slight ripple на large flat areas)
- Micro-pitting от aging (small mineral pinpoints, almost imperceptible at distance)
- Minor patina pre-staging в зонах где будет verdigris развиваться больше (slight darkening вокруг inner corners даже на bronze parts)
- Hand-finished feel (не mass-production sterile, но и не overtly hand-made — Bauhaus precision still)

### Aging texture

Текстура aging:
- Микропатина (тонкий даркнинг) на whole surface — даёт depth, material не выглядит fresh
- Edge softening **NOT in geometry** but in light interaction — edges catch light slightly differently на самом краю (не chamfered geometry, а material aging)
- Slight bronze surface oxidation (не verdigris, более subtle — где medium amber меняется на slightly cooler brown)
- No scratches, no dings, no impact marks — aging from time, not from handling

### Surface finish

| Property | Value |
|---|---|
| Finish | Matte / satin |
| Reflection | Diffuse — не mirror-like, не glossy |
| Specular highlight | Soft, broad — не sharp pinpoint |
| Microfacet roughness | Medium-high (0.5-0.7 в PBR terms) |

Bronze не reflects environment. Не показывает studio HDRI поверхности. Не chrome-y. Просто amber-brown matte material with directional highlights.

### Specular / glossiness rule

Когда light hits bronze surface — soft broad highlight, not sharp specular dot. Это **diffuse reflection**, not mirror.

В rendering terms (если в Veo / Imagen):
- Roughness factor: 0.55-0.7
- Specular intensity: low (0.2-0.3)
- Subsurface: minimal (bronze не translucent)

Это approximate guidance — actual values для Imagen / Veo не controllable directly, но описание в prompt должно reinforce «matte aged bronze, soft diffuse highlights, not glossy, not mirror-like».

## Покрытие (coverage)

### 70%+ visible surface

Bronze body занимает **минимум 70% visible surface** обеих скоб combined. Patina ≤30% (см. `canon-material-patina.md`).

Это означает в каждой скобе:
- Middle vertical sections — clean bronze (patina-free zone per canon)
- Большая часть large flat faces — clean bronze
- Edges и corners — могут быть patina-covered (см. `canon-material-patina.md`)
- Верхние и нижние kromki — могут быть patina-covered

Reading test: при первом взгляде глаз идентифицирует «это bronze object». Patina видна как accent / detail, не как dominant feature.

### Если bronze coverage drops ниже 70%

Это нарушение канона:
- 60% bronze + 40% patina → too much patina, regenerate
- 50% bronze + 50% patina → completely wrong, definitely regenerate
- 30% bronze + 70% patina → catastrophic drift, full re-prompt

Не accept «slightly more patina чем 30%». Canon — strict.

## Bronze не glow

**Bronze body itself NEVER glows.**

Это абсолютное правило. Bronze surfaces — non-emissive. Они **reflect** light from external sources (warm key light) и от bioluminescent glow (через bounce от patina patches, очень subtle), но сами не emit.

Если в генерации bronze light up или glow — это нарушение канона. Glow живёт в patina (см. `canon-bioluminescent-glow.md`), не в bronze.

### Reflection от patina glow на bronze

Patina patches glow cyan-teal. Этот glow может subtle reflect на nearby bronze surfaces — это physical realism (bronze is reflective metal, even matte). Но:
- Reflection — **очень subtle**, не obvious
- Reflection — **on adjacent bronze** в ≤2cm от patina patch
- Reflection — **changes hue tint slightly** (warm bronze + cool cyan = neutral cooler bronze в reflection zone)

В Imagen / Veo generation это редко правильно рендерится — modal often либо ignores reflection, либо overdoes it (whole bronze surface tints cyan). Acceptable: minimal reflection или zero reflection. Unacceptable: bronze tints cyan beyond local patina vicinity.

## Material truth (Bauhaus principle)

### Materialwahrheit applied

Bauhaus принцип Materialwahrheit — material is what it is, не painted to look like something else. Bronze is bronze, не chrome painted brown.

Для Meme это означает:
- Material consistency across surfaces (bronze в highlight = bronze в shadow, just lit differently)
- No optical illusions (не используем gradient tricks чтобы bronze казалась объёмнее)
- No hidden materials (только bronze, patina, и matte enamel в eyes — никаких third materials)
- No artificial polishing (matte aging maintained throughout)

### Если material drift в production

Часто Imagen / Veo at re-rendering can drift bronze toward:
- Painted look (matte but uniform — losing aging texture)
- Plastic look (slightly translucent / glossy)
- Wood look (warm brown but with grain — wrong texture)
- Stone look (matte but no warm highlight modulation)

Все эти drifts — нарушение material truth. Reinforce «aged cast bronze metal, not painted, not plastic, not wood, not stone, real metal aging texture» в prompts.

## Surface temperature perception

В rendering, bronze should feel:
- **Warm** at touch (psychologically — warm metal от tungsten light)
- **Heavy** (visible weight in thickness и density)
- **Solid** (not hollow, not thin sheet metal)
- **Old but cared-for** (museum quality, не abandoned ruin)

«Old but cared-for» — important nuance. Patina present but not invading every surface. Bronze still has warm honey-amber glow under directional light. This is artifact in active use в archive 2050, not artifact in attic.

## В разных contexts

### Reference shot (R-02 isolation)

- Pure bronze body, ≤30% patina
- Single soft light upper-left (warm tungsten 3200K)
- Bronze highlights peak at ~75% IRE (visible но не blown)
- Bronze shadows at ~10% IRE (deep но не crushed)
- See `canon-composition.md` и `canon-lighting.md` для full setup

### In-archive shot (R-01 master hero)

- Bronze body same spec
- Plus archive ambient lighting (warm tungsten от drawer interiors)
- Plus volumetric haze (atmospheric depth reducing bronze contrast в distance)
- Bronze может look slightly warmer от archive context bouncing
- See same files

### Marketing video (3D animated)

- Same spec
- Plus motion blur considerations (bronze surfaces могут show slight directional motion blur при fast camera moves — acceptable, не nullify material)
- Plus subtle subsurface in bronze в glow areas (when patina glow nearby — slight SSS visible at very close ECU)

### UI illustration (2D / 2.5D)

- Bronze rendered as solid color fill `#C8860A` highlight + `#3D2006` shadow + midtone gradient
- Aging texture optional в low-resolution (favicon — pure silhouette ok)
- В 2D illustrations — slight noise / grain texture допустим для material feel

## Material verification checklist

При generation reference / clip, verify:

- [ ] Highlight reads as warm honey-amber (`#C8860A` range)
- [ ] Shadow reads as dark chocolate-brown (`#3D2006` range)
- [ ] Midtones read as smooth bronze gradient (no gray, no green, no blue tints)
- [ ] Surface is matte / satin (not glossy, not mirror)
- [ ] No bronze surface glows
- [ ] Aging texture visible (subtle micro-pitting, not pristine)
- [ ] Bronze occupies 70%+ visible surface
- [ ] Material reads as «aged cast bronze» (not painted, not plastic, not wood)
- [ ] No reflective artifacts от non-canonical light sources

## Связь с другими файлами

- **Patina** — `canon-material-patina.md` (что покрывает остальные ≤30%)
- **Glow** — `canon-bioluminescent-glow.md` (свечение из patina, не из bronze)
- **Composition** — `canon-composition.md` (framing для bronze focus shots)
- **Lighting** — `canon-lighting.md` (как warm key light играет на bronze)
- **Geometry** — `canon-geometry.md` (на каких surfaces material живёт)
- **Continuity Block** — `continuity-block.md` (paste-ready material section)
- **Philosophy** — `philosophy.md` (почему bronze — heritage и meaning)
- **Decisions** — `decisions-log.md` (как dropped neon yellow → settled на bronze)

## Lock status

Bronze body material — **LOCKED v4 (session 253, 2026-04-26)**.

Hex highlight (`#C8860A`) и shadow (`#3D2006`) — non-negotiable targets. Surface finish (matte aged), coverage (70%+), no-glow rule — non-negotiable.

Refinements которые НЕ нарушают lock:
- Уточнение exact micro-pitting density
- Уточнение exact aging signature
- Per-surface texture variations (slight differences в reference shots vs marketing video)
- Specular / roughness PBR values уточнение
