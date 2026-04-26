---
name: mascot_canon_readme
description: Контейнер канонической спецификации маскота Meme. 21 файл в порядке загрузки. Source of truth для всех Imagen / Veo / Lyria / DaVinci / ElevenLabs генераций и для всех product UI usages.
type: reference
---

# Meme — Mascot Canon

Это папка содержит **полную каноническую спецификацию маскота Meme**. Каждый файл покрывает один слой и заполнен исчерпывающе. Не сокращать. Не додумывать. Если что-то не описано — возвращаемся к nopoint и уточняем, не угадываем.

Эта папка существует потому что одного файла `mascot-meme.md` недостаточно: маскот имеет геометрический канон, материальный канон, glow-канон, face-канон, состояния, motion (2 слоя — talk animation и idle states), copy voice, sonic voice, marketing surfaces, и анти-паттерны. Каждый слой — отдельный файл, чтобы при загрузке в LLM-промпт можно было выбрать минимально необходимый набор.

## Когда какой файл загружать

| Задача | Файлы загружать |
|---|---|
| Imagen prompt для reference frame (R-01..R-06) | `canon-geometry.md` + `canon-material-bronze.md` + `canon-material-patina.md` + `canon-bioluminescent-glow.md` + `canon-face.md` + `canon-composition.md` + `canon-lighting.md` + `continuity-block.md` |
| Veo 3.1 prompt для motion clip | то же что выше + `states.md` (выбрать состояние) + `motion-talk-animation.md` ИЛИ `motion-idle-and-states.md` (по типу клипа) + `continuity-block.md` |
| Lyria score prompt | `philosophy.md` + `voice-audio.md` (для тонального соответствия score и mascot identity) |
| DaVinci color grade | `canon-material-bronze.md` + `canon-material-patina.md` + `canon-bioluminescent-glow.md` + `canon-lighting.md` |
| ElevenLabs Voice Design / voice production | `voice-audio.md` + `philosophy.md` (для понимания character) + `voice-and-copy.md` (для tone reference) |
| UI копирайт (loading / empty / errors) | `voice-and-copy.md` |
| UI illustration / dashboard usage | `marketing-surfaces.md` + `canon-geometry.md` + `cute-friendliness.md` |
| Marketing video / press kit | все canon-* + `marketing-surfaces.md` + `motion-*` |
| Pencil дизайн новой композиции | все canon-* + `canon-composition.md` + `cute-friendliness.md` + `anti-patterns.md` |
| Reference review / decision archaeology | `decisions-log.md` + `references-rag-sources.md` |
| Onboarding нового агента / контрагента | `philosophy.md` + `README.md` (этот файл) |
| Любая задача связанная с маскотом | `continuity-block.md` minimum (одного хватает чтобы LLM не ошиблась с базовой формой) |

## Порядок чтения для нового агента

Если ты впервые видишь эту папку — читай в этом порядке:

1. `philosophy.md` — что такое Meme и почему он такой (origin, двойственность, концептуальное обоснование)
2. `canon-geometry.md` — физическая форма
3. `canon-material-bronze.md` — материал корпуса
4. `canon-material-patina.md` — материал патины
5. `canon-bioluminescent-glow.md` — свечение
6. `canon-face.md` — конструкция глаз и лица
7. `canon-composition.md` — как кадрировать
8. `canon-lighting.md` — как освещать
9. `states.md` — какие состояния существуют
10. `motion-talk-animation.md` — как анимируется речь
11. `motion-idle-and-states.md` — как анимируется покой и переходы
12. `voice-and-copy.md` — что Meme говорит (текст)
13. `voice-audio.md` — как Meme звучит (голос)
14. `marketing-surfaces.md` — где Meme появляется в продукте и маркетинге
15. `cute-friendliness.md` — что делает Meme приятным без антропоморфизма
16. `anti-patterns.md` — что Meme никогда не делает
17. `continuity-block.md` — paste-ready блок для каждого промпта
18. `decisions-log.md` — как мы пришли к текущему канону
19. `references-rag-sources.md` — все RAG источники из Bauhaus + web research
20. `open-questions.md` — что отложили на следующую итерацию

## File-by-file purpose

### Canon (физическая спецификация)

- **`philosophy.md`** — концептуальный фундамент. Кто такой Архивариус 2050. Что значит имя Meme (Докинз etymology). Почему двойственность ребёнок+старик. Почему нет рта. Семантика свет/тень.
- **`canon-geometry.md`** — форма, сечение, углы, симметрия, межскобный промежуток, парение. Все геометрические инварианты которые сохраняются от 2D логотипа до 3D marketing video.
- **`canon-material-bronze.md`** — корпус. Hex значения, поверхностная текстура, micro-pitting, aging, коэффициент покрытия. Бронза как dominant material reading.
- **`canon-material-patina.md`** — верх корпуса. Verdigris chemistry, coverage ≤30%, разрешённые/запрещённые зоны, запрет потёков, crystalline mineral micro-texture.
- **`canon-bioluminescent-glow.md`** — свечение из патины. Hex значения, hue, 5-level intensity scale (L1-L5), радиус, falloff, запреты (halo / rim / ambient / neon / LED).
- **`canon-face.md`** — лицо. 3-layer eye структура (bronze rim → white iris → black pupil), асимметрия (left wider, right semicircle squint), масштаб, положение зрачка, no-mouth rule.
- **`canon-composition.md`** — кадрирование reference shots: aspect ratios, центрирование, вертикальная занятость, фон uniform, margin от краёв, in-context vs character-sheet.
- **`canon-lighting.md`** — освещение reference shots: single soft box upper-left 45° tungsten 3200K, направление highlights/shadows, dual-source rule (warm key + bioluminescent secondary), запреты (rim/back/side fill/ambient haze).

### States (поведенческая спецификация)

- **`states.md`** — 7 каноничных состояний: Idle (canonical) / Curious / Knowing / Bridging / Speech / Processing / Error. Glow level / eye behavior / bracket gap / trigger context / forbidden states.

### Motion (анимация)

- **`motion-talk-animation.md`** — Talk Animation v1 spec. 10 sub-states (Idle / Auftakt / Vowels / Consonants / Word boundaries / Phrase boundaries / Asymmetric coupling / Emotion modulation / Face response / Patina glow modulation). RAG-grounded по Bauhaus + Disney 12 principles + Pixar Luxo Jr precedent. Implementation hints для SVG / Web Audio / Framer Motion / Lottie.
- **`motion-idle-and-states.md`** — анимация для всех остальных состояний. Idle 8-sec breath cycle. Eye blink intervals. Glow polyrhythm. Curious / Knowing / Bridging / Processing motion. Duration tokens из design system.

### Voice (голос)

- **`voice-and-copy.md`** — что Meme говорит в копирайте. Loading states / empty states / found connections / processing complete / error / permission denied. RU + EN. Регистр «Вы». Контраст таблицы (sterile / cartoony / Meme correct).
- **`voice-audio.md`** — как Meme звучит. 12-dimension sonic signature (pitch / age / gender / pace / rhythm / texture / tone / modulation / linguistic / precedents / sync / never). Real-world precedents (TARS / Bilbo / Каневский). ElevenLabs Voice Design implementation. Multilingual treatment.

### Surfaces (где Meme появляется)

- **`marketing-surfaces.md`** — favicon (0D) / loading screens (1D) / empty states (2D) / hero (2.5D) / marketing video (3D) / blog illustrations / social avatars / press kit. Per-surface size and complexity rules. Per-surface theme (light/dark).
- **`cute-friendliness.md`** — cute через геометрию. Открытость формы / wave-движение / размер / двойственность / свет-тень разделение. Anti-cute (большие глаза / подмигивания / объятия / ободрения / эмодзи).

### Discipline (что нельзя)

- **`anti-patterns.md`** — что Meme никогда не делает. Walking biped, neon/Tron, sympathetic-cartoony мимика, anime-eyes, plush merch, product placement, happy/sad mode toggles, color shifts during speech, perfect bilateral symmetry, metronomic timing.

### Output (готовое для копи-паста)

- **`continuity-block.md`** — paste-ready блок для каждого Imagen / Veo / Lyria prompt. Полная версия со всеми ограничениями + variant blocks для разных состояний.

### Archive (как мы сюда пришли)

- **`decisions-log.md`** — эволюция канона: v1 (glowing neon yellow, rejected) → v2 (solid bronze no glow, too dead) → v3 (cool glow + warm highlights, almost) → v4 (bronze body + bioluminescent patina, locked session 253) → v5 (inverse, rejected) → v6 (form locked — brackets `[ ]` + face above + bracket X-axis talk, locked session 253) → v7 (3-layer eyes + ≤30% patina + L2 glow, locked session 254). Каждое решение с датой, контекстом, причиной.
- **`references-rag-sources.md`** — все RAG источники: Bauhaus principles (Klee P-24 / P-16, Moholy-Nagy P-03 / P-09, Schlemmer Triadic Ballet / P-09 / Bewegung, Van Doesburg P-17, Kandinsky P-19 / Sprache, Oud P-30, Marianne Brandt) + web references (Pixar Luxo Jr 12 principles, Duolingo Rive state-machine, Apple counter-dip strategy, NN/G eye-ratio research, phoneme research).
- **`open-questions.md`** — что отложили: sound design specifics, 3D rendering technology choice (voxel/wireframe/raymarch), print presence (risograph), localised variants, voice clone path, trademark/IP, animation framework choice (Lottie vs Framer Motion vs Rive).

## Cross-refs к brand bible

Эта папка — расширение `nospace/marketing/branding/contexter/mascot-meme.md` (теперь — короткий index pointing here). Сосуществует с другими файлами brand bible:

| Brand bible file | Связь с mascot canon |
|---|---|
| `brand-bible.md` | Общий обзор бренда. Mascot canon — глубокая детализация одного раздела. |
| `tov.md` | TOV pillars (Sparing / Trustworthy / Spatial / Quietly Authoritative) применяются к Meme голосу — см. `voice-and-copy.md` и `voice-audio.md` для проекции. |
| `values.md` | 5 brand values (контекст принадлежит человеку, и т.д.) — Meme их олицетворение. |
| `positioning.md` | Категория (Public RAG + Shared Rooms) — Meme её визуальный носитель. |
| `category-manifesto.md` | Манифест категории — голос Meme проводит этот манифест к пользователю. |
| `interaction-pattern.md` | Web app pattern — где Meme появляется в UI (loading / empty / errors). См. `marketing-surfaces.md` для конкретики. |
| `ui-language.md` | Bilingual EN/RU rules. Применяются и к Meme голосу. |
| `brand-and-design-overview.md` | Meta-index brand bible. Эта папка появляется как расширение раздела «Mascot Meme». |

## Cross-refs к design system

Mascot canon живёт **в брендинге**, не в design system. Design system (`nospace/design/contexter/`) — это слой UI tokens (colors, spacing, typography, motion durations). Mascot canon — character spec.

Связи:

| Design system file | Связь с mascot canon |
|---|---|
| `guidelines/color.md` | Theme axis (light Weiß-polus / dark Gelb-polus). Mascot цвет в светлой теме = blue accent #1E3EA0; в тёмной = yellow accent #E8C018. **Но canonical bronze body цвета (#C8860A / #3D2006) и patina/glow цвета (#1DA8A0 / #1AD4E6) — независимы от theme axis** (это материальный цвет маскота, не theme accent). См. `canon-material-bronze.md` и `philosophy.md` для семантики. |
| `guidelines/motion.md` | UI motion tokens (durations 80-700ms, easings, delays). Используются в анимации UI элементов рядом с Meme. **Мoushion маскота имеет собственные durations** (talk animation 80ms anticipation, 50-150ms phonemes; idle 8-second breath cycle) — см. `motion-talk-animation.md` и `motion-idle-and-states.md`. UI motion durations используются для transitions между states маскота. |
| `guidelines/typography.md` | Не связано напрямую — Meme не имеет typography в кадре. |
| `patterns/interaction.md` | UI patterns — Meme появляется как loading indicator, empty state illustrator. См. `marketing-surfaces.md`. |

## Версионирование

Каждый canon файл имеет header с версией и датой последнего изменения. Изменения tracked в `decisions-log.md`. Текущая версия канона — **v7 (locked 2026-04-26 session 254)**.

При обновлении любого canon файла:
1. Обновить header (version bump)
2. Добавить запись в `decisions-log.md` с датой, причиной, кто approved
3. Если изменение материально влияет на continuity block — обновить `continuity-block.md`
4. Если изменение нарушает любой existing reference image (R-01..R-06) — флаг + regenerate references

## Lock status (current canon)

| Aspect | Status | Locked when |
|---|---|---|
| Form (brackets + face above) | LOCKED v6 | session 253 (2026-04-26) |
| Material (bronze + verdigris patina + bioluminescent glow) | LOCKED v4 | session 253 (2026-04-26) |
| 3-layer eye structure | LOCKED v7 | session 254 (2026-04-26) |
| Patina coverage ≤30% mirror match | LOCKED v7 | session 254 (2026-04-26) |
| Bioluminescent glow 5-level scale, baseline L2 | LOCKED v7 | session 254 (2026-04-26) |
| No mouth, talk = X-axis bracket separation | LOCKED v6 | session 253 (2026-04-26) |
| Talk animation 10-state spec | LOCKED v1 | session 253 (2026-04-26) |
| Voice (sonic signature) | LOCKED v1 | session 254 (2026-04-26) |

---

*Эта папка — source of truth. Если в downstream работе обнаруживается противоречие с этой папкой — это противоречие нужно либо resolve в пользу canon, либо escalate к nopoint и обновить canon.*
