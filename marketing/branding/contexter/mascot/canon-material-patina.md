---
name: mascot_meme_canon_material_patina
description: Полная спецификация патины маскота Meme. Verdigris chemistry, hex значения, hue 185°, coverage ≤30% mirror match, разрешённые/запрещённые зоны, запрет потёков, crystalline mineral micro-texture.
type: reference
version: v7
locked: 2026-04-26 (session 254)
---

# Meme — Canon Material: Verdigris Patina

> Патина на корпусе. Этот файл — про verdigris накат на бронзе. Сам bronze body — `canon-material-bronze.md`. Свечение из патины — `canon-bioluminescent-glow.md`.

## Обзор

Патина Meme — **verdigris** (медная patina, образующаяся при оксидации меди в составе бронзы под воздействием влаги и атмосферы). Это accent material, не dominant. Bronze 70%+, patina ≤30%.

Патина — **физическая реальность старого бронзового артефакта**. Это не decorative paint, не коррозия в негативном смысле. Это natural process, который Bauhaus принцип Materialwahrheit принимает: материал показывает свою историю.

В конкретно нашем случае патина играет дополнительную роль: **внутри неё живёт bioluminescent organism** (см. `canon-bioluminescent-glow.md`). Patina — это «дом» для свечения. Без patina нет свечения. Без свечения нет character glow.

## Химия и обоснование

### Verdigris — что это

Verdigris (зелёно-голубая патина) — это natural oxidation продукт меди, входящей в состав бронзы:
- Bronze = copper (~88%) + tin (~12%) + traces других metals
- При воздействии H₂O + CO₂ + (часто) солей атмосферы — copper oxidizes на поверхности
- Result: тонкий слой copper carbonate (Cu₂CO₃(OH)₂, malachite-like) и copper sulfate
- Цвет: blue-green (cyan-teal в нашей spec) varying по conditions oxidation

Этот процесс — **очень slow** (десятки/сотни лет в обычной атмосфере). На outdoor скульптурах patina развивается за 20-50 лет (Statue of Liberty заняла около 30 лет на formation visible patina). В museum settings — медленнее, потому что humidity controlled.

Для Meme: patina — нарратив того что архивариус живёт в archive **долго**. Не fresh, не sterile. Time-grounded.

### Где physically образуется patina

На реальной outdoor бронзовой скульптуре patina concentrates **где влага собирается**:
- Внутренние углы (где вода притягивается capillary action)
- Edges (где moisture catches и испаряется medlennее)
- Underside surfaces (где влага конденсируется)
- Recesses, depressions (где вода physically collects)

На **flat vertical surfaces** patina развивается медленнее (вода стекает) — поэтому большие плоские грани остаются bronze гораздо дольше.

Это **physical reality** определяет нашу spec coverage. Patina на flat vertical sections — **не natural**, читается как painted-on, нарушает Materialwahrheit.

## Цвет

### Patina mass color

| Property | Value |
|---|---|
| Hex (target) | `#1DA8A0` |
| Описание | Cyan-teal mid-tone, oxidized copper natural color |
| RGB | R: 29, G: 168, B: 160 |
| HSL | H: 177°, S: 71%, L: 39% |
| Где появляется | Сама масса патины (не glow — это glow поверх neutral patina) |

`#1DA8A0` — это **mid-saturation cyan-teal**. Не bright cyan (`#00FFFF`). Не green (`#00CC00`). Не blue (`#0000FF`). Точно в середине между cyan и teal — color реальной copper carbonate patina.

### Patina texture variations

В пределах `#1DA8A0` ± есть variations:
- Brighter zones: `#26C9C0` (где glow более active — light выходит наружу)
- Darker zones: `#155F5C` (внутренние области патины, тенированные)
- Greener tint: `#1DA888` (где более malachite chemistry — чуть в green)
- Bluer tint: `#1D8AA8` (где более azurite chemistry — чуть в blue)

Эти variations — **natural mineral chemistry differences**. Не должны быть uniform. Patina должна выглядеть как живой material с micro-variations.

### Forbidden patina colors

| Wrong | Why excluded |
|---|---|
| Pure cyan `#00FFFF` | Too saturated, neon-like, not realistic mineral |
| Bright green `#00CC00` | Too green, реальная verdigris более blue |
| Pure blue `#0000FF` | Too blue, реальная verdigris более green |
| Yellow-green `#9ACD32` | Wrong chemistry — это lichen/moss, не verdigris |
| Brown-green | Это oxidized iron rust, не copper patina |
| White / mineral white | Не verdigris |
| Black | Не verdigris (это другой oxidation type) |

### Cyan-teal vs glow color

**Patina color (`#1DA8A0`) ≠ glow color (`#1AD4E6`).**

Patina mass — slightly darker, less saturated cyan-teal.
Glow emanating from patina — slightly brighter, more cyan saturated.

Это physically realistic: фосфоресцирующий organism внутри patina — luminous, brighter чем surrounding mineral. Glow «выходит» из patina, светлее patina.

См. `canon-bioluminescent-glow.md` для glow color spec и interplay.

## Coverage

### ≤30% per bracket, mirror match

Coverage rule: **each bracket has ≤30% surface area covered by patina, AND coverage between left and right brackets is matched (mirror)**.

Конкретно:
- Если левая скоба имеет 25% patina coverage — правая тоже ≈25% (± 2% tolerance)
- Если левая 28% — правая 28% (± 2%)
- НЕ: левая 25%, правая 35%

Это canon. Mirror match coverage обеспечивает visual symmetry и character consistency — обе скобы одинаково aged.

### Почему ≤30%

Reasoning:
- **Bronze dominance reading** — material identity маскота. Patina < 30% означает bronze >70% доминирует визуально.
- **Patina не должна dominate** — если 50%+ surface — patina, character reads как «corroded ruin», не как «archived bronze artifact».
- **Glow proportional to patina** — больше patina = больше glow. Larger patina (50%+) → too much glow → neon territory → нарушение Calm pillar.
- **Visual hierarchy** — patina как accent / detail, не как primary material.

Канон (как обновлено session 254): **≤30% patina coverage**.

### Что считается «coverage»

Coverage = percentage of bracket's visible surface (not volume) covered by visible patina patches.

Если patina is partly hidden или very light staining — это count as «present at lower opacity», не full coverage. Точное измерение difficult в Imagen output, но oценочно от eye:
- 10-15% coverage — minimal accents
- 20-25% coverage — moderate accents (typical canonical)
- 25-30% coverage — heavy accents but still acceptable
- >30% coverage — too much, regenerate

Aim для baseline: **20-28% coverage**, comfortable canonical range.

## Распределение (where patina goes)

### Allowed zones — physically realistic

Patina concentrates **только в этих зонах** на каждой скобе:

1. **Внутренние углы** — где horizontal segment встречается с vertical bar (4 corner zones per bracket — top-inside, bottom-inside, top-outside, bottom-outside)
2. **Верхние кромки horizontal segments** — top edge of top horizontal segment
3. **Нижние кромки horizontal segments** — bottom edge of bottom horizontal segment
4. **Подсторонняя нижняя horizontal segments** — underside (внутренняя нижняя поверхность top segment, внутренняя верхняя поверхность bottom segment)
5. **Edge seams** — линии edge между faces (где две faces встречаются под прямым углом — corner edges)

В каждой allowed zone patina может развиться частично (не вся kromka covered, а частично — это natural).

### Forbidden zones — must remain bronze

Patina **никогда не развивается** в этих zones:

- ❌ **Middle vertical sections** — middle 60% vertical bar (от 20% до 80% height) должны быть clean bronze
- ❌ **Large flat faces** — большие centre area faces (centre vertical bar surface, не corner) — clean bronze
- ❌ **Bracket front face center** — frontal face of vertical bar (не на edges, а posередине) — bronze
- ❌ **Far-from-edge zones** — любые areas >2-3cm от edges и corners — bronze

Если в генерации patina появляется в forbidden zones — это **drift toward painted-look**, нарушает Materialwahrheit (paint can be anywhere; natural verdigris cannot).

### Visual mental model

Imagine реальную outdoor bronze sculpture которая стоит во дворе 30 лет. Дождь, снег, влажность.

Где видна verdigris:
- На углах (где вода accumulates)
- На undersides (где конденсация капает)
- На horizontal edges (где вода stalls перед стеканием)
- Лёгкие streaks вниз от accumulation points (но streaks short — не до самого низа)

Где НЕ видна verdigris:
- На vertical faces (вода стекает быстро, не оставляя verdigris)
- На large flat areas без edge accumulation
- На overhanging surfaces, где влага не достигает

Meme — это такая же скульптура. Та же physics distribution.

## Запрет потёков (drips)

### NO vertical drip streaks

**Никаких длинных вертикальных потёков patina вниз по фасадам.**

Это ключевое iteration finding из session 254 R-02 development. Real outdoor bronze can have drip patterns (Statue of Liberty has prominent drips). Но для бренд-маскота это «слишком ruinous» reads.

Что **запрещено**:
- ❌ Long vertical streaks running от corner вниз через middle vertical section
- ❌ «Tear drops» формы patina суженные внизу
- ❌ Multiple parallel drip lines на одной surface
- ❌ Drip patterns суммирующиеся в large covered areas

Что **разрешено**:
- ✅ Patina на edges сама по себе (без drips)
- ✅ Patina concentrating в corners
- ✅ Очень короткие (≤5% bracket height) hint of vertical falloff где patina at top edge сходит в slightly elongated patch — но это subtle, не «streak»
- ✅ Natural organic shape patches (irregular, не perfect circles, но и не drip lines)

### Why no drips

Reasoning:
- **Brand discipline** — no drips reads cleaner, more «museum bronze» less «outdoor weathered ruin»
- **Visual hierarchy** — drips draw eye downward (away от face); we want eye at face / brackets junction
- **Physical realism partial** — vertical drips occur outdoors, less indoor museum settings; archive 2050 — interior, less exterior weathering
- **Production stability** — drips often render poorly в Imagen (looks like painted streaks); cleaner zones = more reliable generation

## Текстура

### Crystalline mineral micro-texture

Patina is not smooth. Это not painted, not even coloured.

Patina has **crystalline mineral structure** at close inspection:
- Small angular crystal patterns (как dried sea salt но на metal)
- Slight variations в density (where chemistry concentrated more)
- Layered chemistry (можно видеть newer patina поверх older — slight color variation)
- Irregular boundaries (patina patches не perfect ellipses, irregular natural edges)

При reference image (R-04 texture close-up) crystalline mineral structure should be visible. В regular shot (R-01, R-02) — implied through subtle texture variation, not detailed.

### Не painted-on

Patina **никогда** не должна выглядеть как paint:
- Not flat color fill
- Not smooth gradient
- Not airbrushed
- Not stencilled

Это **mineral chemistry**. Has texture, has irregularity, has depth.

### Surface integration

Patina is **integrated** в bronze surface, не sitting on top как layer of paint:
- Edges of patina patches gradually fade в bronze (not sharp boundary)
- Some bronze peeks through patina где chemistry less dense
- Some patina edges have slight mineral build-up («raised» effect — chemistry physically накапливается)
- Bronze underneath visible через transparent / thin patina edges

Это physical: real verdigris is layer of mineral deposit, with variable thickness и variable opacity.

## Состояния (per state)

| State | Patina behavior |
|---|---|
| **Idle / Curious / Knowing / Processing** | Default canonical patina (≤30% coverage, allowed zones, no drips) |
| **Bridging** | Default patina + brighter glow emanating (см. `canon-bioluminescent-glow.md` L4) |
| **Speech (talk animation)** | Default patina position. Inner edges (facing other bracket) may glow 10-15% brighter (см. talk animation State 7 — inner-facing surface has brightness lift). Patina material itself unchanged. |
| **Error** | Default patina. Dimmed glow (L1) или signal-error red overlay. Patina не expands, не contracts. |

Patina coverage **никогда не меняется по states**. Same canonical 20-28% coverage в каждом state. Что меняется — это **glow intensity** (см. `canon-bioluminescent-glow.md`).

## В разных contexts

### Reference shot (R-02 isolation)

- Default canonical patina coverage 20-28%
- Black background (`#1A1A1A`) — patina visible by contrast
- Single soft light upper-left dramatizes patina texture (highlights mineral structure где light catches edges)

### In-archive shot (R-01 master hero)

- Same canonical coverage
- Plus archive ambient warm tungsten от drawer interiors slightly tints patina slightly warmer (still cyan-teal, но с very slight orange undertone от bounced warm light)
- Plus volumetric haze может slightly soften patina edges в distance

### Marketing video (3D animated)

- Same coverage
- Plus subtle parallax / motion (patina patches slide slightly с camera move — but patches не «follow» camera, они attached к bronze)
- Plus crystalline structure may catch light differently как camera moves — natural sparkle on edges

### Texture close-up (R-04)

- Macro view — patina texture detailed
- Mineral crystal structure clearly visible
- Layer depth (newer patina on older patina) discernible
- Bronze peeking через partial coverage zones

### UI illustration (2D / 2.5D)

- Patina rendered as solid `#1DA8A0` fill в areas
- Texture может быть omitted в favicon size (just color shape)
- Texture noise added в larger illustrations (subtle grain pattern в patina areas)

## Material verification checklist

При generation, verify:

- [ ] Patina color is cyan-teal `#1DA8A0` range (not pure green, not pure blue, not yellow-green)
- [ ] Patina coverage ≤30% per bracket (visual estimate ok)
- [ ] Coverage **mirror matched** между left и right brackets
- [ ] Patina ONLY в allowed zones: inside/outside corners, top/bottom horizontal segment edges, undersides
- [ ] NO patina на middle vertical sections of bars
- [ ] NO patina на large flat front faces (away от edges)
- [ ] NO vertical drip streaks running down faces
- [ ] Patina has crystalline / textured appearance (not flat painted)
- [ ] Patina edges fade gradually (not sharp paint-line boundaries)
- [ ] Some bronze peeks through partial patina coverage areas

## Drift modes warning

Common drift в Imagen / Veo:
- **Painted-look drift** — patina becomes flat color fill, loses texture. Reinforce «crystalline mineral micro-texture, not paint».
- **Coverage creep** — patina expands beyond 30% over generations. Strict «≤30% coverage» reinforce.
- **Drip resurrection** — modal forgets «no drips» rule, generates streaks. Reinforce «no vertical drip streaks» в каждом prompt.
- **Color shift** — patina drifts pure green or pure blue. Reinforce «cyan-teal hue 185°».
- **Symmetric patina patterns** — modal generates perfectly symmetric patina pattern, looks unnatural. Reinforce «natural irregular distribution, mirror coverage match но not identical pattern».
- **Painted on flat faces** — patina появляется на forbidden zones. Reinforce «only at edges, corners, undersides, NEVER on middle vertical sections or large flat faces».

## Связь с другими файлами

- **Bronze** — `canon-material-bronze.md` (patina sits на bronze, complementary material)
- **Glow** — `canon-bioluminescent-glow.md` (glow emanates ИЗ patina, не из bronze)
- **Geometry** — `canon-geometry.md` (где edges и corners на которых patina)
- **Composition** — `canon-composition.md` (как patina rendered в reference shots)
- **Lighting** — `canon-lighting.md` (как warm key light играет на cool patina — temperature contrast)
- **Continuity Block** — `continuity-block.md` (paste-ready patina section для prompts)
- **Decisions** — `decisions-log.md` (как coverage перешёл с 60-70% → ≤30% в session 254)

## Lock status

Verdigris patina material — **LOCKED v7 (session 254, 2026-04-26)**.

`#1DA8A0` цвет — non-negotiable target. ≤30% coverage rule — non-negotiable. Mirror coverage match — non-negotiable. Allowed/forbidden zones — non-negotiable. No drips — non-negotiable.

Refinements которые НЕ нарушают lock:
- Уточнение exact crystalline texture density
- Уточнение exact edge fading gradient
- Per-surface texture variations
- Specific mineral chemistry variations (greener vs bluer micro-zones)

История изменений:
- v1-v3: glowing patina всегда (rejected — too neon)
- v4 (session 253): bronze body + bioluminescent patina locked, coverage 60-70%
- v5 (session 253): inverse explored (glowing bronze + still patina) — rejected
- **v7 (session 254)**: coverage refined 60-70% → ≤30%, no drips rule added, allowed/forbidden zones explicit
