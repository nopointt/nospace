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
| **Толщина линии** | 2-3 px на light theme, 1-2 px на dark theme (тонкий неон, как Jerry) |
| **Кривизна** | Wave-based, не пересекает себя кратно. Лёгкое возмущение в линии — намёк на «мысль» |
| **Размер** | Адаптивен к контексту. В favicon — 16×16px. В loading-state — 64×64px. В hero animation — 240×240px+. Должен читаться на всех |

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

**НИКОГДА:**
- Meme не получает «лицо» (глаза + рот). Двойственность ребёнок/старик — через КОМПОЗИЦИЮ и ДВИЖЕНИЕ, не через мимику.
- Meme не имеет конечностей в человеческом смысле. Может иметь arc-extension которая «тянется» к карточке, но это не рука.
- Meme не sympathetic-cartoony. Без улыбки и слёзных смайлов. Cute через геометрию, не через антропоморфизм.

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
