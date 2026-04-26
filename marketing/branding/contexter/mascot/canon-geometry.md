---
name: mascot_meme_canon_geometry
description: Полная геометрическая спецификация маскота Meme. Форма скоб, сечение, углы, симметрия, парение, состояния промежутка. Все геометрические инварианты которые сохраняются от 2D логотипа до 3D marketing video.
type: reference
version: v6
locked: 2026-04-26 (session 253 form lock + session 254 refinement)
---

# Meme — Canon Geometry

> Геометрия маскота Meme. Rigid, non-negotiable. Этот файл — про форму. Material / glow / face / lighting — отдельные файлы.

## Обзор формы

Meme состоит из **двух элементов**:

1. **Brackets** (тело) — две скульптурные square brackets `[ ]` парят в воздухе side-by-side
2. **Face** (сознание) — два круглых глаза парят чуть выше brackets, центрированные над промежутком

Brackets и face **не соединены физически**. Face hovers as separate consciousness above brackets. См. `canon-face.md` для детальной спецификации лица.

Этот файл покрывает **только brackets** (тело). Face geometry — отдельно.

## I. Форма каждой скобы

### Базовый принцип

Каждая скоба shaped **exactly like the printed character `[` или `]`**.

Это не стилизованный bracket. Не abstract bracket-like shape. Не округлённый bracket. Это **точная форма печатного символа**, реализованная как 3D скульптура.

Если LLM при генерации делает что-то более «органическое» / «изогнутое» / «декоративное» — это нарушение канона. Возвращаем к **квадратной форме печатного символа**.

### Анатомия одной скобы

Скоба `[` (left bracket) состоит из трёх сегментов:

1. **Vertical bar** — основной вертикальный брус (длинный)
2. **Top horizontal segment** — короткий горизонтальный сегмент сверху, развёрнутый на 90° **внутрь** (вправо для левой скобы, влево для правой)
3. **Bottom horizontal segment** — короткий горизонтальный сегмент снизу, развёрнутый на 90° **внутрь** (зеркально симметрично top)

Скоба `]` (right bracket) — mirror image скобы `[`. Top и bottom segments turn внутрь (то есть **влево**, навстречу левой скобе).

### Пропорции (LOCKED v8 session 254)

| Свойство | Значение |
|---|---|
| Bracket height (reference unit) | **1.0H** (canonical idle baseline) |
| Cross-section thickness | **0.13H** (~13% of height) |
| Horizontal segment length | **0.35H** (35% of bracket height) |
| Gap между brackets (default) | **0.13H** (gap = thickness) |
| Height-to-thickness ratio | **~7.7:1** (slim elongated, NOT wire-thin, NOT chunky) |
| Face vertical gap above brackets | **0.25H** (face floats 25% bracket height above) |

**Critical для Imagen / Veo prompts:** Numerical ratios часто misinterpreted by image models. Per session 254 video pilot lessons — use **descriptive language** в prompts:
- «Substantial thick sculptural cross-section like museum bronze or large old door handles»
- «NOT wire-thin, NOT minimalist line, NOT chunky-square»
- «About 7-8 times taller than they are thick»
- «Eyes positioned close together over narrow bracket gap, NOT widely separated»

Пропорции должны быть mirror-identical между left и right brackets. Никаких различий в высоте, толщине, длине segments.

### Cross-section (поперечное сечение)

| Свойство | Значение |
|---|---|
| Профиль | **Прямоугольный**, не круглый, не tapered |
| Толщина | 3-4 cm (uniform throughout) |
| Глубина | 3-4 cm (uniform throughout, equal to thickness) |
| Постоянство | Cross-section идентичен по всей длине bar — не утончается, не расширяется |

Скоба — **3D объект**, не плоская 2D форма. У неё есть глубина. Это видно в R-03 (3/4 view reference) — depth surface также имеет patina и материал. См. `canon-composition.md` для variants reference shots.

Если в генерации скоба выглядит как flat 2D shape — это нарушение канона.

### Углы (corners)

**Все внутренние углы — ровно 90 градусов.**

Это означает 4 critical corners на каждой скобе:
1. Inside top corner (где top horizontal segment встречается с vertical bar)
2. Inside bottom corner (где bottom horizontal segment встречается с vertical bar)
3. Outside top corner (внешний угол top сегмента — где он начинается на vertical bar)
4. Outside bottom corner (внешний угол bottom сегмента)

Все эти углы — **sharp Bauhaus right angles**. Никаких:
- Скруглений (rounded corners)
- Фасок (bevels, chamfers)
- Органических softening
- Sculpted curves
- Casting tolerances выше machining grade

«Machined precision» — описательный target. Скобы выглядят как изготовленные на современном CNC станке, не литые в форму с плавными переходами.

Это критическое geometric requirement — **Bauhaus precision**. Если в генерации corners становятся rounded — это **drift toward organic**, который Imagen / Veo склонны делать при rendering bronze (модель статистически tends toward smooth forms). Активно reinforce в каждом prompt.

### Сечение остаётся прямоугольным на углах

В углах cross-section не «плавится» в единое целое — это два отдельных rectangular volume сегмента, встречающихся под прямым углом. Внутренний угол виден как clean intersection двух прямоугольных blocks, не как continuous curved transition.

## II. Симметрия пары

### Mirror symmetry между left и right

Левая скоба `[` и правая скоба `]` — **mirror identical**.

Identical:
- Высота
- Cross-section thickness и depth
- Длина horizontal segments
- Угловые позиции
- Surface texture распределение (на abstract уровне — random но statistically equivalent)

Mirror inverse:
- Direction of horizontal segments (left bracket — internal segments turn right; right bracket — internal segments turn left)

### Что НЕ identical

Patina coverage может быть **statistically similar но not pixel-identical** между скобами — это natural physics variation. Однако:
- Coverage процент должен быть mirror match (например, 28% left и 28% right, не 28% и 35%)
- Placement zones должны mirror match (если patina на inside top corner left — она также на inside top corner right)

См. `canon-material-patina.md` для full patina spec.

### Mirror axis

Ось симметрии — **вертикальная**, проходит через центр промежутка между скобами.

Композиционно это означает: subject **perfectly centered horizontally** в кадре, axis симметрии — frame center vertical. См. `canon-composition.md` для framing rules.

## III. Pair alignment

### Вертикальность

Обе скобы **perfectly vertical**. Vertical bars каждой скобы параллельны друг другу и параллельны frame's vertical axis.

Никаких:
- Tilt (наклон одной скобы)
- Lean (наклон обеих скоб в одну сторону)
- Splay (расхождение в стороны — скобы не V-shape, не A-shape)
- Skew (перекос — top и bottom не на одной vertical line)

Если в генерации одна скоба leans inward, или обе brackets splay outward, или angles перекошены — это нарушение канона. Reinforce «perfectly parallel, zero tilt, zero lean» в prompts.

### Параллельность

Vertical bars левой и правой скобы — параллельны друг другу (как два printed `[` `]` в моноспейс шрифте).

Параллельность включает:
- Vertical axis alignment
- Cross-section orientation (rectangular profile orientation matches)
- Top edges на одинаковой высоте
- Bottom edges на одинаковой высоте

### Tilt в motion (исключение)

Это правило применяется к **static reference shots** и **idle states**. В motion-states (curious, knowing, bridging, speech) могут быть subtle tilt 3-5° для выражения attention vector / animation principles. См. `motion-talk-animation.md` и `motion-idle-and-states.md` для motion-specific rules.

Но в **canonical reference image** (R-02 isolation, R-01 hero shot) — perfectly vertical, no tilt.

## IV. Промежуток между скобами

### Default state

Промежуток (negative space) между скобами — **3-4 cm** в реальном масштабе, или эквивалентная нормализованная единица в композиции.

Эквивалент: ≈ **1× ширины скобы**. То есть промежуток равен толщине одного бракета (или чуть шире).

В этом state скобы выглядят как печатные `[ ]` в напечатанном тексте — стоят рядом, читаются как пара, но не соприкасаются.

### Speech state (talk animation)

Когда Meme «говорит» — скобы **раздвигаются по X-axis** (см. `motion-talk-animation.md` State 3-4).

| Phoneme category | Bracket spread | Hold duration |
|---|---|---|
| Open vowels /a/, /o/ | D₀ × 1.40-1.60 | 80-120ms |
| Front vowels /e/, /i/ | D₀ × 1.15-1.25 | 50-80ms |
| Rounded vowels /u/ | D₀ × 1.05-1.10 | 60-80ms |
| Stops /p t k b d g/ | D₀ × 0.95 (compress) | 30-50ms |
| Fricatives /f s sh/ | D₀ × 1.05 vibrate | 80-150ms |

То есть в speech state промежуток варьируется от **D₀ × 0.95** (consonant compression) до **D₀ × 1.6** (max vowel spread). Maximum amplitude — **1.6× default**, не больше.

### Что не меняется в speech state

- Vertical bars остаются vertical (не tilt при separation)
- Cross-section не deforms
- Углы остаются 90° sharp
- Mirror symmetry preserved
- Glow внутри patina patches becomes brighter (10-15% lift), но source — same patina patches

В speech state меняется **только X-axis position** скоб относительно друг друга. Все остальные геометрические инварианты hold.

### Compress state (rare)

В curious / knowing transitions может быть subtle compress (D₀ × 0.92) — короткий момент когда брекеты slightly closer чем default. Не часто, не амплитудно. См. `motion-talk-animation.md` State 4 (consonants stops/nasals).

## V. Парение (levitation)

Скобы **парят в воздухе**. Они не stand on ground. Они не attached to anything. Они не float on water. Они в **mid-air**, suspended в пустом пространстве.

### Что это означает физически в reference

| Свойство | Значение |
|---|---|
| Ground plane | NONE — нет видимой поверхности под скобами |
| Drop shadow | NONE — нет тени на полу (нет пола) |
| Reflection | NONE — нет отражения на surface ниже |
| Support | NONE — нет visible mechanism удерживающего скобы (нет troughs, нет magnetic field viz, нет energy beams снизу) |
| Surrounding particles / dust | Может быть в archive setting (R-01 master hero), но не required в isolation (R-02) |

### Что это означает в кадре

Background занимает space **под** скобами без видимой границы. В R-02 (isolation reference) — uniform `#1A1A1A` сверху и снизу, никаких градиентов или vignettes указывающих «это пол».

В R-01 (master hero, archive setting) — drawer rows behind brackets, atmospheric depth, но НЕ ground plane visible. Скобы как будто in mid-air в archive room, но floor never explicit.

### Почему парение

Семантически: Meme **не attached to physical infrastructure**. Он outside of physical world's affordances. Архив 2050 — это переход от material к context, и Meme — guardian этого context. Контекст не имеет gravity. Meme не имеет gravity.

Дизайн-обоснование: floating mascot читается как **non-utilitarian** entity (не tool, не furniture). Это character. Это reinforces «Meme as consciousness», не «Meme as device».

Производственное обоснование: при image-to-video в Veo, mascot floating in mid-air — easier to keep consistent across motion clips (нет ground plane reference что drift между клипами). Static в воздухе.

### Subtle vertical bobbing

В idle motion (см. `motion-idle-and-states.md`) Meme имеет **очень subtle vertical bobbing** — ±1-2px (нормализовано к ±0.5% bracket height) с irregular phase. Это reinforces «парит, дышит», не sits there frozen.

Bobbing должен быть **almost imperceptible** в static reference frames. В video — visible но calm.

## VI. Запрещённые трансформации

Это explicit list того что геометрия Meme НЕ позволяет:

### Запрещённые формы

- ❌ C-shape (закруглённые brackets)
- ❌ Parentheses `( )` (круглые скобки)
- ❌ Curly braces `{ }`
- ❌ Angle brackets `< >`
- ❌ Square shapes без horizontal segments (просто vertical bars)
- ❌ Открытые формы (только vertical bar без top/bottom segments)
- ❌ Stylized brackets (brackets с decorative flourishes)
- ❌ Calligraphic brackets (rendered with brush stroke variation)

### Запрещённые трансформации геометрии

- ❌ Tilt (наклон скобы)
- ❌ Lean (наклон пары в одну сторону)
- ❌ Splay (расхождение в стороны)
- ❌ Rotation (поворот вокруг любой оси)
- ❌ Skew / shear (диагональное искажение)
- ❌ Bend (изгиб vertical bar)
- ❌ Curve (любая non-linear deformation)
- ❌ Stretch non-uniform (растяжение по одной оси)
- ❌ Twist (винтовая деформация)
- ❌ Squash > 5% (сжатие beyond canonical motion amplitude)

### Запрещённые добавления

- ❌ Decorative elements (узоры, гравюры, embossing)
- ❌ Text on surface (никаких надписей на bronze)
- ❌ Logo embedding (никаких знаков на материале)
- ❌ Mounting hardware (нет кронштейнов, нет цепей, нет supports)
- ❌ Связь между скобами (никаких physical connectors — мост, цепь, лента)
- ❌ Ground plane / pedestal (никаких подставок)
- ❌ Halo / aura (general — см. `canon-bioluminescent-glow.md` для precise rules)

### Запрещённые modes

- ❌ «Open» state (одна скоба removed) — нет canonical state без обеих скоб
- ❌ «Animated typing» (скобы расширяются для произнесения текста буква за буквой) — talk animation работает на phoneme rhythm, не letter-by-letter typing
- ❌ Translation rotational (one bracket flipping while other stays) — обе скобы в любом state двигаются coordinated
- ❌ Disappearance (Meme не fades to black, не vanishes) — он всегда presence

## VII. Allowable variations (states)

Геометрия позволяет следующие variations в states (height varies per v8 canon, см. Section VIII below):

| State | Geometry change | Height (% of canonical 1.0H) |
|---|---|---|
| Whisper / contemplation (rare) | Default proportions, settled deeply | **92%** |
| Error / compressed | Default geometry, glow dim or signal-error red overlay | **95%** |
| Knowing | Default geometry, slight settle | **97%** |
| **Idle (canonical)** | Default geometry, default gap (D₀ ≈ 1× bracket thickness) | **100%** baseline |
| Speech | Bracket gap variable D × 0.95-1.6 X-axis per phoneme | 100% (height held, action via gap) |
| Processing | Default + ±2% breath oscillation | 100% (with subtle oscillation) |
| Curious | Slight stretch upward | **105%** |
| Bridging | Peak stretch, found connection | **110%** |

См. `states.md` для complete state spec.

## VIII. Height as expression dimension (LOCKED v8 session 254)

**Bracket height varies per state** — это **new axis of mascot expressivity** beyond eye/glow/gap variation.

### Why height varies

Meme — minimalist character с limited expression toolkit (no mouth, no limbs, only eyes + brackets). Adding height as expression dimension даёт **dramatic-tool без violating Calm pillar** — character physically stretches up в curiosity / engaged moments, settles down в knowing / contemplation.

Like body posture в animation — characters grow taller when alert / excited, shrink slightly when settled.

### What changes / what holds

**Changes per state:**
- Bracket vertical bar length flexes (stretches up или compresses down)

**Holds across all states (constant):**
- Cross-section thickness (canonical 0.13H, never changes)
- Horizontal segment length (canonical 0.35H, never changes)
- Bracket gap (canonical 0.13H default, или X-axis spread в Speech only)
- Mirror symmetry между left и right brackets
- 90° corners
- Face floating above (vertical gap 0.25H scales proportionally with current bracket height)

### Height transition mechanics

Per `motion-idle-and-states.md` durations:
- Idle ↔ Curious (+5%): 250ms standard ease-out
- Idle ↔ Knowing (-3%): 150ms fast
- Idle ↔ Bridging (+10%): 400ms deliberate
- Idle ↔ Error (-5%): 200ms quick
- Idle ↔ Whisper (-8%): 400ms ceremonial settle

### Calm pillar constraint

Maximum height stretch — **+10% (Bridging)**. Никогда beyond. Calm pillar enforces.
Minimum height compression — **-8% (Whisper)**. Никогда deeper. Beyond would read «sad / collapsed».

## VIII. Variation в context

В разных surfaces (favicon → marketing video) геометрия рендерится в разных размерах и dimensional complexity, но **canonical proportions сохраняются**.

| Surface | Dimensional rendering | Geometric fidelity |
|---|---|---|
| Favicon (16×16px) | 0D — точка / silhouette | High-level shape only — bracket pair recognizable |
| Loading bar (1D) | Animated wave — geometry abstracted to thin lines | Position и motion respected, bracket form approximated |
| 2D illustration (blog, empty state) | Flat outlined brackets | Full geometry visible, sharp 90° corners |
| 2.5D parallax (hero) | Layered depth | Full geometry + depth perception via parallax |
| 3D render (marketing video) | Full volume — bronze + patina + glow | Full geometry + 3D cross-section + material reflection |

Но в каждом surface — **proportions matched к canonical**. Bracket height-to-width ratio identical (3.5 height-to-segment-length). Cross-section thickness ratio matched. Mirror symmetry preserved.

См. `marketing-surfaces.md` для per-surface usage rules.

## IX. Geometric verification checklist

При generation любого reference image (Imagen) или motion clip (Veo), verify:

- [ ] Both brackets shaped exactly как printed `[` `]` chars (square, not rounded)
- [ ] Cross-section visibly rectangular and thick (3-4 cm equivalent)
- [ ] Both top horizontal segments turn inward toward each other
- [ ] Both bottom horizontal segments turn inward toward each other
- [ ] All 4 inner corners sharp 90° (no rounding, no bevels)
- [ ] Both brackets identical в height and proportions
- [ ] Both brackets identical в cross-section thickness
- [ ] Both brackets perfectly vertical (zero tilt, zero lean)
- [ ] Both brackets parallel to each other and frame vertical axis
- [ ] Default gap visible (3-4 cm equivalent, ≈1× bracket width)
- [ ] Brackets float in mid-air (no ground, no shadow on floor, no support)
- [ ] No decorative elements / text / hardware on brackets
- [ ] Subject horizontally centered (mirror axis = frame center)

Если любой пункт fails — regenerate. Не accept partial geometry compliance.

## Связь с другими файлами

- **Material** — `canon-material-bronze.md`, `canon-material-patina.md` (что покрывает геометрию)
- **Glow** — `canon-bioluminescent-glow.md` (свечение из patina patches которые сидят на geometry)
- **Face** — `canon-face.md` (eyes, sit above brackets — отдельный element)
- **Composition** — `canon-composition.md` (как геометрия фреймится в кадре)
- **Lighting** — `canon-lighting.md` (как свет ложится на геометрию)
- **States** — `states.md` (какие geometry variations возможны per state)
- **Motion** — `motion-talk-animation.md`, `motion-idle-and-states.md` (как геометрия animatues)
- **Continuity Block** — `continuity-block.md` (paste-ready geometry section для prompts)
- **Decisions** — `decisions-log.md` (как мы пришли к bracket form через v1-v6)
- **References** — `references-rag-sources.md` (Bauhaus principles informing form)

## Lock status

Bracket geometry — **LOCKED v8 (session 254, 2026-04-26 video pilot)**.

**v8 updates from v6:**
- Locked proportions table (height-to-thickness 7.7:1, thickness 0.13H, gap 0.13H, face gap 0.25H)
- Height as expression dimension (8 states with height % baseline) added — Section VIII new
- Descriptive language preference noted (numerical ratios drift в Imagen / Veo)

Cross-section thickness, 90° corner precision, mirror symmetry, parallel alignment — все non-negotiable. Любые изменения require nopoint approval + полный downstream impact assessment (все reference frames потребуют regeneration, все Veo clips потребуют regeneration).

Refinements которые НЕ нарушают lock:
- Уточнение exact thickness в pixels / cm
- Уточнение exact horizontal segment length ratio
- Уточнение default gap exact value
- Adding new state variations (с sequential approval + decisions-log entry)
