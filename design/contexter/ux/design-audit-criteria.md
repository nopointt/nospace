# Design Audit Criteria — Contexter

---

## 1. Design System Compliance

| ID | Критерий | Источник |
|---|---|---|
| DS-01 | **Font**: JetBrains Mono ONLY — никаких других шрифтов | typography.md rule 01 |
| DS-02 | **Sizes**: только из scale (10, 12, 14, 16, 20, 24, 32, 48) | typography.md rule 02 |
| DS-03 | **Weights**: только 400, 500, 700 | typography.md rule 03 |
| DS-04 | **Case**: lowercase dominant (headings, buttons, labels, nav) | typography.md rule 04 |
| DS-05 | **Colors**: только из 20 tokens (--black, --white, --accent, --text-*, --bg-*, --border-*, --signal-*, --interactive-*) | color.md |
| DS-06 | **Corner radius**: 0px everywhere | principles.md (Mondrian P-37) |
| DS-07 | **Shadows**: none — ни на одном элементе | elevation.md rule 1 |
| DS-08 | **Spacing**: только из scale (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80) | spacing.md rule 01 |
| DS-09 | **Components**: Badge, Button, Input, Pipeline, DropZone — через ref, не пересоздавать | components/inventory.md |
| DS-10 | **Icons**: Lucide only (iconFontFamily: "lucide") | inventory.md shared |
| DS-11 | **Chromatic ≤5%**: максимум 5% viewport с хроматическим цветом | color.md rule 06 |
| DS-12 | **Line height**: 1.0/1.2/1.4/1.5 — только из scale | typography.md rule 09 |

## 2. Layout & Composition

| ID | Критерий | Источник |
|---|---|---|
| LC-01 | **Grid**: content width 1280px, margins 64px, gutters 16px | layout.md grid |
| LC-02 | **8:4 split**: raw→structured duality на каждом экране | philosophy.md foundation 2 |
| LC-03 | **Nav consistency**: одинаковая высота, padding, структура | — |
| LC-04 | **Vertical rhythm**: gap values from spacing scale | spacing.md rule 03 |
| LC-05 | **No orphans**: каждый элемент в группе | layout.md rule 08 |
| LC-06 | **Line length**: 45-75 символов для body text | typography.md rule 05 |
| LC-07 | **Content > chrome**: данные занимают максимум пространства | layout.md rule 05 |
| LC-08 | **Section labels**: UPPERCASE, 10px, 500, letterSpacing +0.5-1 | typography.md rule 07 (label-caps) |
| LC-09 | **Consistent padding**: одинаковый inset для одинаковых контейнеров | spacing.md rule 04 |
| LC-10 | **Directional weights**: top=light/nav, bottom=heavy/actions | layout.md rule 02 |

## 3. Bauhaus Compliance

| ID | Критерий | Источник |
|---|---|---|
| BH-01 | **Gestaltung**: форма из функции, не имитация. Нет скевоморфизма | principles.md rule 1 |
| BH-02 | **Gleichgewicht**: асимметричный баланс, не центральная симметрия | principles.md rule 2 |
| BH-03 | **Materialwahrheit**: нет градиентов, текстур, blur, fake shadows | principles.md rule 3 |
| BH-04 | **Sparsamkeit**: минимум элементов, максимум ясности. Каждый элемент оправдан | principles.md rule 4 |
| BH-05 | **Raumgestaltung**: white space как активный элемент композиции | principles.md rule 5 |
| BH-06 | **Mondrian**: right angle governs — 0px corners, orthogonal layout | Mondrian P-37 |
| BH-07 | **Van Doesburg**: pure plastic means — линия и плоскость, без декора | Van Doesburg |
| BH-08 | **Kandinsky weights**: left=departure(raw), right=arrival(structured) | Kandinsky, layout.md rule 02 |
| BH-09 | **Zeitschrift**: single typeface, lowercase, functional layout | Zeitschrift citations |
| BH-10 | **Sachlichkeit**: no rhetoric, product speaks through facts | Zeitschrift P-13 |
