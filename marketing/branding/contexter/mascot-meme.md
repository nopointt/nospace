---
# Meme — Contexter Mascot Specification
> Version: 1.0 | 2026-04-26
> Sources: nopoint creative brief 2026-04-26 + Bauhaus RAG (Klee P-24, Moholy-Nagy P-03/P-09, Schlemmer Triadic Ballet)
> Companion: design-system-themes.pen (theme axis light/dark)
---

## Origin

**Meme** — маскот Контекстера. Аморфное n-мерное существо. Архивариус 2050.

Не сова. Не робот. Не дружелюбный ассистент со смайликом. **Бессмертный аморфный архивариус**, у которого в одной форме одновременно живут любознательный ребёнок и ворчливый опытный старик.

**Первичный визуальный референс:** Jerry-the-counselor из Pixar «Soul» — neon-outline 2D abstract figure, копающийся в картотеке душ. Аморфный. Минимальный. Выразительный через композицию, не через лицо.

**Имя Meme.** В оригинальном смысле Ричарда Докинза («The Selfish Gene», 1976) meme = единица культурной передачи, наследуемый кусочек человеческого контекста. Контекстер хранит мемы (в исходном смысле). Meme — их хранитель.

---

## Двойственность как движущая сила

Meme — не один характер. Он одновременно:

| Любознательный ребёнок | Опытный ворчливый старик |
|---|---|
| Задаёт вопрос | Помнит ответ |
| Тянется к новому файлу | Уже знает где такой лежал в 2017 |
| «А что это?» | «Опять то же что и в прошлый раз» |
| Радуется когда находит связь | Ворчит когда видишь связь только сейчас |
| Бесстрашный | Осторожный |
| Без фильтров | Со всеми фильтрами |

**Конфликт между ними — не баг.** Это и есть характер. Meme живой именно потому что внутри идёт спор. Когда Meme выводит «найдено 3 совпадения» — это голос ребёнка. Когда добавляет «правда, два из них старее года» — это голос старика.

**Не разделять.** Meme не имеет «детского режима» и «взрослого режима». Они одновременно. Один кадр анимации улыбается с любопытством, следующий — поджимает уголки рта.

---

## Форма (Bauhaus-grounded)

**RAG источники для формы:**

- **Klee P-24 (motion/space, 1925):** «Compositions dealing with fluid or atmospheric content should use intermediate formal symbols — neither pure static geometry (crosses, plumb lines) nor pure orbital forms (spirals, circles), but transitional forms (waves, partial arcs).»
- **Moholy-Nagy P-03 (volume, 1929):** «The spiral is the paradigmatic biotechnical form: deploy it structurally, not decoratively — it carries the entire construction.»
- **Moholy-Nagy P-09 (photogram, 1925):** «Organize the light and shadow relationships of a Photogramm as you would organize a composition in space — the paper is the record of that spatial organization, not a flat surface to be decorated.»
- **Schlemmer Triadic Ballet costume (Fig-07):** «Dark figure with white ring and baton» — silhouette + geometric primitives + functional accessory.
- **Oud P-30:** «Begin from the inner organizational logic; let the exterior emerge from that.»

**Геометрия Meme:**

| Свойство | Значение |
|---|---|
| **Базовая форма** | Open spiral + partial arc — Klee transitional symbol. Не закрытый круг (= old/static), не пустая линия (= incomplete) |
| **Замкнутость** | НИКОГДА полностью замкнут. Всегда есть открытое отверстие — точка, через которую проникает новый контекст |
| **Материал** | **CANON v4: Aged bronze + bioluminescent patina.** Бронза — solid, non-glowing, warm honey-amber где свет касается curve. Verdigris patina patches (green-blue) **subtly glow cyan-teal from within** — как deep-sea bioluminescence / phosphorescent moss / dinoflagellates. Bronze stays material, patina is alive. **Reading двойственности:** старик = bronze (выдержанный, накопленный, спокойный металл) / ребёнок = patina-свет (свежее присутствие, живое). Glow casts soft cool reflections on environment. NOT neon, NOT LED — soft organic biological glow. Reference: Marianne Brandt Bauhaus metalwork meets Avatar Pandora bioluminescence. (Эволюция session 253: v1 glowing neon yellow → rejected as too Soul-Jerry-similar / v2 solid bronze no glow → too dead / v3 cool glow + warm highlights → almost / **v4 bronze body + bioluminescent patina = canon, locked 2026-04-26 with nopoint approval**. v5 inverse — glowing bronze + still patina — explored as alternate but not chosen.) |
| **Толщина линии** | 2-3 cm wire-thick в proportion (sculptural cross-section, не тонкая 2px) |
| **Кривизна** | Wave-based, не пересекает себя кратно. Лёгкое возмущение в линии — намёк на «мысль» |
| **Размер** | Адаптивен к контексту. В favicon — 16×16px (silhouette). В loading-state — 64×64px. В hero — 240×240px+. Должен читаться на всех |

**N-dimensional поведение:**

| Размерность | Где применяется | Форма |
|---|---|---|
| **0D** (point) | Notification dot, status indicator | Один пиксель |
| **1D** (line) | Loading bar, progress indicator, inline cursor | Anim. волна |
| **2D** (silhouette) | Lockup в логотипе, иллюстрации блога, social cards | Open spiral + arc, outlined |
| **2.5D** (parallax) | Hero на лендинге, transition-state | 2D форма + смещение слоёв |
| **3D** (volumetric) | Marketing video, key-art | Same form rendered as voxel/wireframe mesh |
| **4D** (motion + time) | UI animations, idle states | Тот же контур анимирует через transitional арки |

**Принцип:** Meme — одна форма, рендеренная разной размерностью под surface. НЕ разные иллюстрации в разных стилях. Один контур → разные дименсии.

---

## Свет и тень — материал Meme

**Этот раздел — Materialwahrheit маскота.**

Свет и тень для Meme — не оформление, а ЭКРАН-материал (по Moholy-Nagy P-09). Где Meme присутствует — он либо в свете, либо в тени, и это несёт смысл:

| Контекст | Тема | Цвет Meme | Семантика |
|---|---|---|---|
| **Public surface** | Light (Weiß-polus) | Outline в `--accent` (`#1E3EA0` blue) | Meme на свету. Открытые данные. Любой может видеть. |
| **Private surface** | Dark (Gelb-polus) | Outline в `--accent` (`#E8C018` yellow) | Meme в тени. Личные данные. Только владелец видит. |
| **Shared room (mixed)** | Dark | Outline + soft glow (yellow + faint white halo) | Meme на границе. Публичные участники + приватный контекст. |
| **Loading / processing** | Текущая | Animated wave (motion duration: 700ms ceremonial) | Meme работает. Не «загружается» — «листает картотеку». |
| **Empty state** | Текущая | Static с opened arc (паузной формой) | Meme ждёт. Архив пуст. Ничего тревожного. |
| **Error state** | Текущая | Outline в `--signal-error` (red) + closed arc | Meme в замкнутом состоянии. Что-то заблокировано. |

**Form (locked v6, 2026-04-26):** Meme = два square brackets `[` `]` (sculptural 3D objects, bronze + bioluminescent patina) + minimal face floating above between them. Brackets = body/architecture (что держит контекст). Face = awareness above (что наблюдает за bracketing).

**Лицо у Meme — ТОЛЬКО ГЛАЗА (без рта).** (Изменено session 253: рот убран. Talk animation работает через X-axis отдаление brackets, не через мимику рта.)

**Тип лица:**
- **Только глаза.** 2 точки-глаза. Без рта, без бровей, без других элементов.
- **Асимметричное.** Один глаз чуть шире (ребёнок-любопытство), второй чуть прищурен (старик-знание).
- **Постоянное.** Лицо не появляется/исчезает по состоянию — оно есть всегда. Меняются только размеры зрачков, степень открытости, и положение face в пространстве.
- **Расположение.** Floating slightly above the bracket pair, центрировано над промежутком между ними. Не «голова» прикреплённая к телу — face hovers as separate consciousness above the brackets.
- **Материал глаз.** Bronze, non-glowing (как brackets). Patina glow вокруг face area subtle, но сами eye-dots — solid bronze.

**НИКОГДА:**
- Meme не имеет рта. Talk animation = X-axis bracket separation, не лип-синк.
- Meme не имеет конечностей. Brackets — body, face — awareness. Никаких рук/ног/выростов.
- Meme не walking biped — не Soul Jerry. **Парит/плывёт** — статически, в воздухе.
- Meme не sympathetic-cartoony в детальной мимике. Без anime-eyes, без анимированных бровей, без улыбок.
- Meme не белый/cyan/Tron-blue/yellow-glow. Bronze body + cyan-teal patina glow, только.

---

## Talk Animation — спецификация (v1, locked 2026-04-26)

Talk animation работает **через горизонтальное отдаление brackets по X-axis**, без mouth, без lip-sync. Это критически важно: текст не «произносится ртом», а **bracketing-event происходит** — каждый звук это акт раскрытия/смыкания brackets.

Метафорика: говорить = открывать brackets, чтобы выпустить контекст. Молчать = brackets at default distance.

### RAG findings — Bauhaus principles applied to motion

| Source | Principle | Применение к talk |
|---|---|---|
| **Van Doesburg P-17** (1925, Rhythmus) | «Rhythm of UNEQUAL accents» | Brackets никогда не двигаются metronomically. Каждый раз амплитуда чуть другая. Mechanical = death; unequal = life. |
| **Klee P-16** (1925, rhythm structural) | «Design system so any unit can be removed/added and rhythm holds» | Не создавать unique-moment-tied keyframes per phoneme. Animation = structural pattern, не precise lip-sync. Phonetic approximation достаточна. |
| **Kandinsky P-19** (1926, point/line) | «Punkt = rest, Linie = inner-moved tension born of movement» | Closed brackets = Punkt (rest state). Opening = Linie (tension carrying intention). Cycle: Punkt → Linie → Punkt. |
| **Moholy-Nagy P-03** (1929, Schwingung) | «Hand registers Schwingung (oscillation) and Druck (pressure)» | Brackets oscillate с pressure dynamics. Не uniform пульс — variable amplitude и timing. |
| **Schlemmer P-09** (1925, stage as organism) | «Every element's behavior affects every other» | Если brackets двигаются, face response обязателен. Eye dots пульсируют синхронно с vowel peaks. |
| **Schlemmer Bewegung (1925)** | «Sequential frames, incremental repositioning» | Animation работает в discrete keyframes (внутренние 12-15 fps), плавная интерполяция между. |
| **Kandinsky Sprache (vocab)** | «Visual language formed by point-line combinations — unreachable by words» | Talk не воспроизводит слова — он создаёт визуальный язык параллельный речи. |

### Web findings — animation principles

| Source | Principle | Применение |
|---|---|---|
| Disney/Pixar 12 principles | Anticipation: small action before main action | 80ms перед первым словом — brackets squeeze inward 2% (tension before release) |
| Luxo Jr. (Pixar 1986) | Personality without face — through timing/squash/stretch only | Прямой precedent для Meme. Brackets carry character без mouth |
| Phoneme research | Mouth opening correlates with vowel duration | Bracket separation amplitude = vowel openness; time held = duration |
| Linguistic research | Vowels longer before fricatives than stops | Brackets hold longer for /a/-/f/-/o/ sequence than /a/-/p/-/o/ |
| NN/G research | Robot with mouth perceived more lifelike + less sad | But Meme не робот — Meme является brand symbol, и геометрический язык скобок усиливает не уменьшает character |

### Animation states

#### State 1 — Idle (no speech)

- Brackets at base distance **D₀** (default gap, как в логотипе `con[text]er`)
- Micro-breath: brackets oscillate ±1% with **8-second period**, irregular phase (Van Doesburg unequal rhythm)
- Eye blink: every 6-12 sec, irregular interval. Blink = eye dots scale 1.0 → 0.4 → 1.0 over 80ms (fast принципов «calm» — короткий, не выразительный)
- Patina glow oscillates ±3% with 8-second period (slower than breath, creating polyrhythm)

#### State 2 — Speech opening (Auftakt / anticipation)

- **T = -80ms** (before first word):
  - Brackets squeeze inward by 2% (D₀ × 0.98) — anticipation
  - Patina glow brightens by 5%
  - Child eye dot widens by 5% (alertness)
  - Old eye dot remains (он уже знал что щас будут говорить)

- **T = 0ms** — speech begins.

#### State 3 — Vowels (open, sustain)

| Vowel category | Bracket spread | Hold duration | Curve |
|---|---|---|---|
| **Open /a/, /o/** (открытые) | D₀ × 1.40-1.60 | 80-120ms | ease-out opening, ease-in closing |
| **Front /e/, /i/** (передние) | D₀ × 1.15-1.25 | 50-80ms | ease-out, ease-in |
| **Rounded /u/, /ю/** (округлённые) | D₀ × 1.05-1.10 | 60-80ms | gentle curve |

При vowel peak — eye dots brighten by 3-5% (Schlemmer organism response).

#### State 4 — Consonants

| Type | Bracket behavior | Duration |
|---|---|---|
| **Stops /p t k b d g/** | Snap close to D₀ × 0.95, then return to D₀ | 30-50ms total, hard edges |
| **Fricatives /f s sh v z/** | Hold at D₀ × 1.05 with 5-10Hz micro-vibration (sustained narrow channel) | 80-150ms |
| **Nasals /m n/** | Close to D₀ × 0.92 (compressed) | 50-80ms |
| **Liquids /l r/** | D₀ × 1.10 with smooth flow | 80-120ms |

#### State 5 — Word boundaries

- 60-100ms pause at D₀ (return to rest, mini-Punkt — Kandinsky)
- Glow dims by 5% during pause (breath in)
- Face eye dots steady, no blink

#### State 6 — Phrase / sentence boundaries

- 200-300ms pause at D₀
- Glow dims by 10%, then breathes back up over 200ms
- Optional blink at sentence end (50% probability, irregular)

#### State 7 — Asymmetric coupling (CRITICAL — это что делает organic)

**Left bracket и right bracket двигаются АСИММЕТРИЧНО:**

- Left lags right by 15-30ms on opening, leads on closing (или наоборот per phrase)
- Amplitude difference: left = 100%, right = 90-110% (varies per phrase, by ±10%)
- Phase difference: 5-15° offset always present

**Это ключ к organic vs mechanical.** Perfect mirror motion = robot. Slight lag/lead = alive.

Per Van Doesburg P-17: «rhythm of UNEQUAL accents». Equal = death.

#### State 8 — Emotion modulation (Calm pillar capped)

| Mode | Amplitude scale |
|---|---|
| Whisper / contemplation | 0.6× |
| Default speech | 1.0× |
| Question / curious peak | 1.2× |
| Excited (rare) | 1.3× MAX |
| **Никогда** | >1.3× (Calm pillar Bauhaus — нет «крика») |

#### State 9 — Face response (Schlemmer organism)

Face does NOT lip-sync. Eyes respond:

- **Vowel peak:** eye dots brighten by 3-5%
- **Sentence end:** blink (80ms close → open)
- **Question (rising intonation):** eyes raise 2-3px upward at sentence end
- **Period:** eyes settle back to neutral position
- **Curiosity moment:** child eye (larger) opens 10% wider, old eye stays squinted

Face НЕ движется по X-axis вместе с brackets. Face floats steadily — она awareness, не часть speech apparatus.

#### State 10 — Patina glow modulation

- Glow pulses with vowel peaks: 5-10% amplitude over 80-120ms
- Glow intensity loosely correlates with audio amplitude (loudness-coupled)
- Color stays cyan-teal — НИКОГДА не shifts during speech (color = identity, not emotion)

### Implementation hints

**Web (SVG / CSS):**
- SVG path morphing for bracket shapes
- CSS variable transforms: `--bracket-spread`, `--patina-glow`, `--eye-scale`
- Web Audio API → AnalyserNode → RAF loop driving CSS variables
- Phoneme detection optional — RMS amplitude alone gives 80% of organic feel

**Animation library:**
- Framer Motion / GSAP for keyframe-based
- Lottie for sprite-sheet pre-rendered
- For real-time TTS sync: AnalyserNode + frequency band split → bracket spread coupled to mid frequencies (300-3kHz speech band)

**Frame rate:**
- Internal 12-15 fps (Schlemmer sequential frames)
- Rendered at 60fps with smooth bezier interpolation
- Don't render at 60fps native — feels too smooth, loses Bauhaus discrete-step character

### Don'ts (Calm pillar enforcement)

- ❌ No bouncing
- ❌ No squash-and-stretch beyond ±5% per axis
- ❌ No exaggeration peaks beyond 1.3× amplitude
- ❌ No emoji-style expressions or expression swaps
- ❌ No "happy / sad" mode toggles — единая dual personality всегда
- ❌ No color shifts during speech (glow color = identity)
- ❌ No perfect bilateral symmetry (Van Doesburg P-17)
- ❌ No metronomic timing (always unequal accents)

### Reference cycle (1 second of speech, simplified)

```
T=0ms:    [   ]  D₀ idle
T=-80ms:  [  ]   D₀ × 0.98 anticipation
T=0ms:    [    ] D₀ × 1.4 vowel /a/, hold 100ms, glow +8%
T=100ms:  [  ]   D₀ × 0.95 stop /t/, snap, 40ms
T=140ms:  [   ]  D₀ × 1.05 fricative /s/, vibrate 5Hz, 100ms
T=240ms:  [   ]  D₀ pause 80ms, glow -5%
T=320ms:  [   ]  next word ...
```

Asymmetry: каждый из этих frames — left и right bracket двигаются с 15-30ms phase offset.

---

## Поведение в анимации

**Idle state (default):** очень медленная wave-anim в линии (1 цикл / 8 сек). Meme дышит, не пляшет.

**Curious state (child voice):** arc раскрывается шире, наклоняется к источнику нового файла. Длительность: 250ms (standard).

**Knowing state (old voice):** spiral сжимается на четверть, как будто Meme «кивнул внутрь себя». Длительность: 150ms (fast).

**Bridging state (когда находит связь):** появляется вторая arc которая дотягивается до другой памяти, на мгновение их соединяя. Длительность: 400ms (deliberate).

**Processing state:** wave превращается в очень медленный spiral-rotate. ceremonial duration. Не вращается агрессивно — листает.

**No bouncing. No squash-and-stretch. No popping.** Calm pillar дизайн-системы применяется к маскоту: motion должен быть медленный, осознанный, измеренный.

---

## Голос Meme в копирайте

**Когда Контекстер говорит ОТ ИМЕНИ Meme** (loading state, empty state, found-something messages):

- Краткие фразы. 4-8 слов.
- Двойственность: один раз — детское наблюдение, следующий — старшее уточнение.
- Не в первом лице («Я нашёл»). И не от системы («Найдено 3»). А наблюдательно: «Похоже на то, что было в прошлом году».
- Без восклицательных знаков. Спокойный регистр.

**Примеры (RU):**

| Surface | Wrong (sterile) | Wrong (cute-cartoony) | Correct (Meme voice) |
|---|---|---|---|
| Loading | «Загрузка…» | «Минуточку! 🔍» | «Просматриваю» |
| Empty state | «Нет файлов» | «Ой, пусто! 😅» | «Архив пуст. Можно начать.» |
| Found connection | «3 совпадения» | «Ура, я что-то нашёл!» | «Похоже, это уже было — в трёх местах» |
| Processing complete | «Готово» | «Готово! Ура!» | «На месте» |
| Error | «Ошибка обработки» | «Упс! Что-то пошло не так 😢» | «Не открывается. Файл повреждён или формат не понятен» |
| Permission denied | «Доступ запрещён» | «Ой, это секрет!» | «Эта комната не ваша. Спросите у владельца» |

**Регистр:** «Вы» в RU. Спокойный, ровный, с лёгкой ноткой ворчливой опытности.

---

## Маскот в маркетинге

| Surface | Использование Meme |
|---|---|
| **Favicon (`contexter.cc`)** | 0D — точка. На светлом — синяя. На тёмном — жёлтая. |
| **Logo lockup** | Meme не в логотипе. Логотип = `con[text]er`. Meme — отдельный элемент рядом или над. |
| **Loading screens** | 1D wave anim. |
| **Empty states** | 2D Meme + минимальный контекст. |
| **Hero на лендинге** | 2.5D Meme в parallax. Слегка анимирован. |
| **Marketing video** | 3D Meme в полной геометрии. Wireframe или voxel-rendered. |
| **Blog illustrations** | 2D Meme в разных «настроениях» (curious / knowing / bridging) для иллюстрации статей. |
| **Social media avatars** | 2D Meme silhouette. Каждая платформа — свой crop. |
| **Press kit** | Полный набор: 0D / 1D / 2D / 2.5D / 3D variants + animation reference. |

**Никогда:**
- Meme не в плюшевом виде / в виде наклейки / merch без согласования.
- Meme не делает product placement (не «держит файл», не «улыбается пользователю»).
- Meme не имеет «happy / sad» вариантов — только curious / knowing / bridging / processing / error.

---

## Cute & Friendly через геометрию

nopoint указал: «милое и дружелюбное».

**Cute Контекстера = НЕ через антропоморфизм.** Cute через:

1. **Открытость формы** — arc никогда полностью не замкнут. Это приветливое «вход открыт».
2. **Wave-движение** — медленное «дыхание». Живое, но спокойное.
3. **Размер**.  Maybe scale в interface — Meme присутствует, но не доминирует. Не «весь экран». Уголок.
4. **Двойственность** — конфликт child/old создаёт характер без слов. Это и есть «дружелюбное» — не подобострастное, а живое.
5. **Свет и тень разделены чётко** — Meme не «следит» за тобой через границу приватности. Это и есть cute: уважение к личному пространству.

**Anti-cute (что отвергаем):**

- Большие глаза.
- Подмигивания.
- Объятия с пользователем («I'm here for you»).
- Поощрительные ободрения («Отлично!», «Молодец!»).
- Эмодзи в воз-роли Meme.

---

## Open questions (для следующей итерации)

1. **Sound design.** Имеет ли Meme звук? Тонкий perl-tone при поиске? Безмолвный?
2. **3D rendering specifics.** Voxel vs wireframe vs raymarch — что для marketing video.
3. **Print presence.** Можно ли Meme в press kit делать через risograph print с ограниченной палитрой (одно из любимых референсов Bauhaus printing).
4. **Localised variants.** Имеет ли Meme в RU-контенте чуть другую интонацию старика чем в EN?

Эти вопросы открыты для проработки после первой итерации в продукте.
