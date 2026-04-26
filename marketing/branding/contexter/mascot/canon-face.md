---
name: mascot_meme_canon_face
description: Полная спецификация лица маскота Meme. 3-layer eye structure (bronze rim → white iris → black pupil), асимметрия (left wider, right semicircle squint), масштаб, положение зрачка, no-mouth rule, eyes never glow, no patina on eye rims.
type: reference
version: v7
locked: 2026-04-26 (session 254)
---

# Meme — Canon Face

> Лицо маскота. Этот файл — про face. Bracket body — `canon-geometry.md`. Material для bracket body — `canon-material-bronze.md` и `canon-material-patina.md`. Glow — `canon-bioluminescent-glow.md` (eyes don't glow).

## Концептуальная модель

Лицо Meme — **awareness above brackets**. Не «голова прикреплённая к телу». Face hovers **as separate consciousness above brackets**. Brackets — body / structure / containment. Face — observer / awareness / perceiving consciousness.

Это reflective dual-element design:
- Brackets bracket the context (контейнер, hold the archive material)
- Face observes from above (consciousness, perceiving the contained material)

Эта separation важна семантически: Meme не имеет привязанной головы потому что awareness не is contained — она перceives containment from above. Это echoes Контекстер's тезис: контекст принадлежит человеку, читается consciousness (Meme), не «owned» by structural container.

### Только глаза

Лицо Meme — **только глаза**. Без рта, без носа, без других элементов.

Это absolute design rule. Концептуальные обоснования см. `philosophy.md` секция «Концептуальное обоснование без рта».

## I. 3-layer eye structure

Это центральный canonical detail face. **Каждый глаз имеет 3 слоя**, не solid sphere.

### Layer 1 — Outer bronze ring

| Property | Value |
|---|---|
| Material | Aged bronze, same heritage as bracket body |
| Function | Sculpted bronze eyelid surrounding the eye |
| Color | Highlights `#C8860A`, shadows `#3D2006` (matches bracket bronze spec — см. `canon-material-bronze.md`) |
| Thickness | Bronze rim ~15-25% of eye radius (proportionally substantial, not thin line) |
| Surface finish | Matte aged bronze (same as bracket body) |

Bronze ring — это **structural frame** глаза. Дает eye material identity (consistent с bracket body). Communicates «sculptural construction», not «painted face».

### Layer 2 — Middle white iris

| Property | Value |
|---|---|
| Material | Pure matte white (target hex `#F5F5F0`) |
| Description | Like enamel inlay or bone, NOT glowing, NOT painted, NOT yellow |
| Texture | Slightly enamel-like, soft sheen but not glossy |
| Diameter | 60-70% of full eye diameter (between bronze rim) |
| Color drift | Acceptable: white до off-white. Forbidden: yellow / cream / blue tints |

White iris — это **expressive surface**. White provides high contrast against dark pupil center, делая pupil position и size readable.

### Layer 3 — Inner black pupil

| Property | Value |
|---|---|
| Material | Matte deep black (target hex `#0A0A0A`) |
| Description | Small dot at center-upper area of iris (slightly elevated for engaged gaze) |
| Diameter | 20-30% of iris diameter |
| Position default | Slightly upper-center of iris (NOT dead center) |
| Surface finish | Matte (no specular dot, no reflection in pupil) |

Pupil — **directional indicator**. Position в iris communicates «where Meme is looking». Default upper-center = «looking forward and slightly up at viewer» (engaged gaze).

### Visual reading

Look at canonical R-02 reference image: each eye reads как **discreet 3-layer construction** — bronze ring frames the eye, white iris fills middle, black pupil pinpoints attention.

This is NOT:
- Solid bronze ball with subtle highlight (no white iris)
- Painted-on cartoon eye (no sculptural depth)
- Anime-eye with visible eyelash lines
- Cyclops single-pupil-no-iris
- Glowing emissive eye
- Reflective glass / glossy eye

## II. Асимметрия (asymmetry)

> **CANON UPDATE session 254 R-02 v8 development:** Default expression revised. Asymmetric semicircle squint на правом глазу читался как «scrutinizing / suspicious». Новый default = **обa eyes full circle outline + symmetric eyelid droop 15-20%**, asymmetry exclusively through size. Semicircle squint top-flattening reserved для **Knowing state active modulation**, не для default. См. `decisions-log.md` D-CANON-FACE-04.

### Default expression — symmetric droop, size asymmetry

В canonical idle / default state:

**Both eyes:**
- Bronze ring: **full circle outline** на обоих глазах (no flattening, no semicircle)
- Eyelid droop: **upper 15-20% covered by bronze rim curving down** — symmetric on both eyes
- White iris visible: lower 80-85% of full iris
- Black pupil: at upper-center of visible iris area

**Asymmetry through SIZE only:**
- Left eye: **30% larger diameter** than right (curious child reading)
- Right eye: smaller diameter, same full circle shape, same droop ratio (wise archivist reading через size, не через squint)

**Reading:** «calm, slightly wry, mildly amused archivist who has seen it all». Не angry, не sad, не scrutinizing. Slight wry undertone fits TOV pillar Quietly Authoritative + 25% funny calibration.

### Knowing state — semicircle squint active modulation (not default)

Per `states.md` Knowing state, right eye **может** transition в semicircle squint (top edge bronze rim flattens) — но это **active state modulation**, не canonical default.

Knowing state:
- Right eye: top edge of bronze rim flattens further → semicircle shape
- Left eye: holds normal full circle position
- Glow: holds at L2

Это active recognition signal («I see this pattern from before»). Returns к default symmetric droop когда state ends.

**Default = symmetric droop. Knowing = asymmetric squint as transient.**

### Why asymmetry

Asymmetry communicates двойственность ребёнок+старик **physically через лицо** (см. `philosophy.md`).

Без asymmetry:
- Two identical eyes → reads as «standard mascot face», loses character distinctness
- Symmetric face triggers cuteness perception (NN/G research) — не наш желаемый baseline
- Loses primary visual carrier of dual personality

Asymmetry — primary mechanism для personality reading в no-mouth design.

### Strict mirror prohibition

**Never** generate face с perfectly symmetric eyes. Asymmetry — non-negotiable canonical detail.

В Imagen / Veo modal often defaults к symmetric faces (статистически більш common в training data). Reinforce «left eye 30% wider, full circle; right eye smaller, top edge flattened semicircle» в каждом prompt.

## III. Масштаб (scale)

### Eye scale

| Property | Value |
|---|---|
| Each eye diameter | ≈25-30% of bracket horizontal segment length |
| Combined eye width | ≈40-50% of bracket gap width (so eyes don't overflow gap) |
| Eye-to-bracket vertical gap | Slight floating gap, ~10-15% of bracket height |

Scale rule: eyes должны быть **clearly readable** в reference shot — не too small (tiny dots над brackets), не too large (overwhelming face dominating frame).

### Why this scale

- Smaller eyes (<20% segment length) — face becomes incidental detail, brackets dominate too much
- Larger eyes (>35% segment length) — face становится dominant focus, отвлекает от bracket form
- 25-30% — sweet spot где face и body share visual attention

### In different surfaces

| Surface | Eye scale rendering |
|---|---|
| Favicon (16×16) | Eyes simplified to dots, scale reduced to 15-20% silhouette |
| 2D illustration | Canonical 25-30% scale |
| 2.5D hero | Canonical 25-30% scale |
| 3D marketing video | Canonical 25-30% scale, full 3-layer depth visible |
| ECU close-up (R-06 face study) | Eyes fill frame, structure clearly visible |

## IV. Положение face в frame

### Centered over gap

Face position — **horizontally centered over the midpoint of the negative space between brackets**.

Strict rule:
- Не offset left или right
- Не closer к one bracket чем other
- Mirror axis симметрии Meme проходит через center of face (between left и right eyes), и через center of bracket gap

### Vertical position

Face floats **slightly above brackets**, not touching, not directly atop:
- Vertical gap between top of brackets и bottom of face: ~10-15% of bracket height
- Face center slightly above bracket top edge horizontal segments

В canonical R-02: bracket top edges на ~50% of frame height, face center на ~35% of frame height, visible separation between face и brackets.

### Face не follows bracket motion в speech

В speech state (talk animation, см. `motion-talk-animation.md` State 9):

Face **does NOT move with X-axis** when brackets separate. Face floats steadily over the **midpoint of changing gap**. As brackets move apart, face stays centered relative to их midpoint.

Это semantic: face is awareness, не speech apparatus. Brackets are speaking, face is observing the speech.

Eyes might respond (per `motion-talk-animation.md` State 9 — vowel peaks brighten eyes 3-5%, sentence-end blink, etc.), но position is fixed relative to bracket midpoint.

## V. Eyes never glow

### Absolute rule

Eyes **никогда не glow**. Не в idle, не в curious, не в bridging, не в speech. Never.

This applies к:
- Bronze rim — same matte aged bronze, no luminescent effect
- White iris — pure matte white, no glow, no fluorescence
- Black pupil — pure matte black, no specular highlight, no glow

### Why eyes don't glow

- **Reading discipline** — glow lives in patina (см. `canon-bioluminescent-glow.md`). Eyes — matte material. Separation maintains clarity of material logic.
- **Visual hierarchy** — if eyes glowed, they would compete с patina glow для attention. Currently patina glow subtle и diffuse; eyes punctate и focused. Two glow systems would cause visual confusion.
- **Brand discipline** — glowing eyes triggers «AI / robot / neon» reading. Meme — not those. Calm matte material face.
- **Anti-pattern recognition** — many AI characters / robots / cute mascots have glowing eyes. Meme distinguishes itself by NOT having glowing eyes — quietly more sophisticated reading.

### What about patina glow reflection on eyes

Eyes — bronze material. Per `canon-material-bronze.md`, bronze has minimal glow reflection from nearby patina patches (1-2cm radius).

Eyes are floating above brackets (not touching). Patina patches are на bracket bodies. Distance from eyes to nearest patina patch — typically >5cm — beyond reflection radius.

Therefore: **eyes practically never receive patina glow reflection**. They render as pure matte bronze without cyan tint.

If в close ECU (eye close-up R-06) some very subtle slight cyan tint visible from glow ambient — это barely acceptable, but minimal. Not a reading feature.

## VI. No patina on eye rims

### Absolute rule

Bronze rims of eyes — **clean bronze, no verdigris patina**.

### Why eyes don't have patina

- **Production stability** — patina на bronze depends on physical edge accumulation. Eye rims small и floating — different physical context from bracket body. Patina on eyes would feel arbitrary.
- **Reading clarity** — eyes are expressive elements. Patina obscures expression. Clean bronze rims maintain expressive read.
- **Material distinction** — eyes are aware-of-self separate element. Their bronze stays clean (well-cared-for). Brackets — older substrate (where patina lived longer).

### Forbidden

- ❌ Verdigris patina patches на bronze rim
- ❌ Glow effects на eye area
- ❌ Cyan-teal coloration анywhere в eye structure
- ❌ Mineral texture на bronze rim
- ❌ Aging discoloration на eye area

Bronze rim — pristine clean canonical bronze same color as fresh bracket section без patina.

## VII. Pupil position — engaged gaze

### Default upper-center

Pupil sits в **upper-center area of white iris**, not dead center.

| Position | Reading |
|---|---|
| Upper-center (default canonical) | Engaged gaze, looking forward and slightly up at viewer |
| Dead center | Neutral, less engaged |
| Lower-center | Looking down (introspective или sad — not canonical default) |
| Upper-left / upper-right | Looking off to side (specific moment, не canonical default) |
| Lower-left / lower-right | Avoiding gaze (specific moment, не canonical default) |

Default canonical R-02: pupils в upper-center for «present, engaged» reading.

### Why upper-center

- **Engaged feeling** — looking up слегка at viewer suggests consciousness focused outward
- **Curiosity signal** — upper position resonates с child-curiosity primary signal (left eye carries this most)
- **Avoiding «sad eyes»** — dead-center или lower-center можут read как melancholy, не canonical mood
- **Subtle but present** — not dramatically eye-rolling up, just slight elevation

### State variations

| State | Pupil position |
|---|---|
| Idle (canonical) | Upper-center (both eyes) |
| Curious | Upper-edge (both, slightly higher) |
| Knowing | Center (both, slightly settled) |
| Bridging | Direct center, both centered on viewer (acknowledgment moment) |
| Speech (vowel peaks) | Upper-center (default holds) |
| Processing | Center, occasionally slow drift |
| Error | Center, narrowed (squint signal) |

## VIII. Eye blink

### Blink mechanics

Eye blink — bronze rim closes briefly, hiding white iris и pupil. Time:
- Close: 80ms
- Hold closed: 0-20ms (variable)
- Open: 80ms

Total blink: ~160-180ms. Per `motion-idle-and-states.md`.

### Blink frequency

Idle state: every 6-12 seconds, irregular interval. Не metronomic. Per `motion-talk-animation.md` State 9 sentence-end blink has 50% probability на phrase ends.

### What closes during blink

Bronze rim narrows top-to-bottom, meeting в middle, fully covering white iris. Outer bronze edge of rim retains shape — only inner rim closes inward.

This requires **3-layer eye structure** to be coherent: bronze rim is the «eyelid», white iris is the «eyeball», pupil is point of focus.

## IX. Forbidden face elements

### Strictly excluded

- ❌ Mouth (in any form — line, slot, oval, painted, sculpted)
- ❌ Lips
- ❌ Teeth (visible or implied)
- ❌ Tongue
- ❌ Nose (any size, any style)
- ❌ Nostrils
- ❌ Ears (any position)
- ❌ Eyebrows (above eyes — sometimes Imagen adds brows над bronze rims)
- ❌ Eyelashes (rendered detail above bronze rim)
- ❌ Tears (никогда)
- ❌ Wrinkles (вокруг глаз — Imagen sometimes adds aging detail near eyes)
- ❌ Cheeks (defined cheek area — Meme has no face structure beyond eyes)
- ❌ Chin (defined chin shape)
- ❌ Forehead (specific forehead area)
- ❌ Hairline или any hair
- ❌ Facial hair (beard, mustache)
- ❌ Skin color rendering (face area should be background-color, not skin-tinted)

### What about face «shape»

Face is **just the two eyes** floating над brackets. No outline of «head». No silhouette of «face». No demarcated face area.

Background visible вокруг eyes — same `#1A1A1A` (or other context-appropriate background). Eyes пары plus small space между them — это full extent of «face».

If в generation modal adds face shape (oval head, round head outline, blob face area) — это нарушение канона. Strict «just two eyes, nothing else, background visible around them».

## X. Face verification checklist

При generation, verify:

- [ ] Two eyes present, located above bracket pair
- [ ] Each eye is 3-layer: bronze ring outer, white iris middle, black pupil inner
- [ ] Left eye visibly 30% wider than right eye
- [ ] Right eye top edge flattened (semicircular shape, not full circle)
- [ ] White iris pure matte white (not yellow, not cream, not glowing)
- [ ] Black pupil matte (no specular dot)
- [ ] Pupil position upper-center (not dead center, not lower)
- [ ] Eyes do NOT glow
- [ ] No patina on bronze rim of eyes
- [ ] Bronze rim is clean aged bronze, matches bracket bronze color
- [ ] Eyes centered horizontally over bracket gap (mirror axis)
- [ ] Eyes float above brackets with visible vertical gap
- [ ] NO mouth, NO nose, NO eyebrows, NO ears, NO other face features
- [ ] No face «shape» — just eyes floating above brackets
- [ ] Eye scale ~25-30% bracket horizontal segment length
- [ ] Background visible around eyes (no implied face shape)

## XI. Drift modes warning

Common drift в Imagen / Veo:

- **Symmetric eyes drift** — modal generates equal-size identical eyes. Reinforce «left eye 30% wider, right eye smaller with semicircle top».
- **Solid sphere drift** — modal generates solid bronze ball без 3-layer structure. Reinforce «3-layer construction: bronze ring → white iris → black pupil».
- **Mouth resurrection** — modal adds mouth despite negative prompts. Reinforce «NO mouth, NO lips, NO smile line, eye area only».
- **Yellow iris drift** — white iris becomes cream / yellow. Reinforce «pure matte white iris, like enamel inlay».
- **Glowing eyes drift** — eyes start glowing cyan-teal. Reinforce «eyes do NOT glow, matte material».
- **Patina on rims** — modal adds verdigris to bronze rims. Reinforce «no patina on eye rims, clean bronze».
- **Face shape drift** — modal adds head/face outline. Reinforce «just two eyes floating, no face shape, no head outline, background visible around eyes».
- **Brow / lash drift** — modal adds eyebrow или lash details. Reinforce «no eyebrows, no eyelashes, just bronze rim eyelid construction».
- **Pupil position drift** — pupil dead center, not slightly upper. Reinforce «pupil position upper-center for engaged gaze».

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (brackets which face hovers above)
- **Bronze** — `canon-material-bronze.md` (bronze rim same material, same hex)
- **Patina / Glow** — `canon-material-patina.md` / `canon-bioluminescent-glow.md` (patina и glow do NOT touch eyes)
- **Composition** — `canon-composition.md` (face position в reference shot framing)
- **Lighting** — `canon-lighting.md` (how warm key light plays on bronze rim)
- **States** — `states.md` (per-state pupil position и blink behavior)
- **Motion** — `motion-talk-animation.md` (face response State 9), `motion-idle-and-states.md` (blink intervals, pupil drift)
- **Continuity Block** — `continuity-block.md` (paste-ready face section)
- **Philosophy** — `philosophy.md` (why no mouth, why asymmetry, dual personality)
- **References** — `references-rag-sources.md` (NN/G eye-ratio research, Schlemmer organism principle, no-mouth precedents)
- **Decisions** — `decisions-log.md` (3-layer eye introduction в session 254)

## Lock status

Face — **LOCKED v8 (session 254, 2026-04-26 video pilot)**.

**v8 update from v7:**
- Default expression revised — symmetric eyelid droop 15-20% replaces v7 asymmetric semicircle right-eye squint
- Asymmetry exclusively через size (left 30% larger), not через shape distortion в default
- Semicircle squint top-flattening reserved для Knowing state active modulation
- Reading shifted from «curious + scrutinizing» (v7 read as suspicious) к «slightly wry archivist» (v8)

3-layer eye structure (bronze rim / white iris / black pupil) — non-negotiable. Asymmetry (left wider, right semicircle squint) — non-negotiable. No mouth — absolute. Eyes never glow — absolute. No patina на rims — absolute. Pupil upper-center default — locked.

Refinements которые НЕ нарушают lock:
- Уточнение exact pupil radius percentage
- Уточнение exact white iris diameter ratio
- Per-state pupil position fine-tuning
- Eye blink mechanics уточнение

История изменений:
- v1-v5: face design exploring различных constructions (с ртом, без рта, glowing eyes, painted eyes)
- v6 (session 253): no-mouth canonical, eye-dots solid bronze (single layer)
- **v7 (session 254)**: 3-layer eye structure introduced (bronze rim → white iris → black pupil) per nopoint feedback during R-02 development; asymmetry refined (right eye semicircle top); pupil upper-center default for engaged gaze; eyes never glow rule explicit; no patina on rims explicit
