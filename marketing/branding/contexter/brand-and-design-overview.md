---
name: contexter_brand_and_design_overview
description: Contexter brand + design system inventory — links to all canon files. Cold Bauhaus, Архивариус 2050, Meme mascot, theme axis (light/dark), Public RAG + Shared Rooms category.
type: project
---

## Brand Symbol

**Архивариус 2050** — символ. Не библиотекарь прошлого, не AI-ассистент будущего. Архивариус который знает каждую карточку лично, потому что вы сами её туда положили.

**Meme** — маскот. Аморфный n-мерный персонаж. Внутри одной формы — любознательный ребёнок и опытный ворчливый старик одновременно. Бессмертное существо без лица. Двойственность через композицию и движение, не через мимику.

## Brand Docs (source of truth)

Расположение: `nospace/marketing/branding/contexter/`

| Doc | Path | Content |
|---|---|---|
| **Brand Bible** | `brand-bible.md` | Compressed RU summary — символ, миссия, 5 ценностей, vibe, 4 столпа TOV, аудитория, язык, правила письма, запрещённые паттерны, soul rules, регистр, anti-list |
| **TOV** | `tov.md` | CANONICAL — full 9-section voice contract. Audience, Brand Anchor, 4 Voice Pillars, Tone Calibration matrix (NN/G + 17 channels), Grammar, Do/Don't tables, AI Editor Persona (8 layers), Pre-publish checklist |
| **Values** | `values.md` | CANONICAL — 5 values, vibe (6 dimensions including Anthropocentric), 5-Layer Approach, positioning copy (RU+EN), TOV direction |
| **Positioning** | `positioning.md` | Одна фраза, для кого, проблема, ответ, почему другие, что не делаем, GTM, метрика успеха |
| **Category Manifesto** | `category-manifesto.md` | Public RAG + Shared Rooms + Any-format manifesto. Three concepts. Why this matters. |
| **Mascot Meme** | `mascot-meme.md` | Полная спецификация маскота — origin, двойственность, форма (Bauhaus-grounded), n-dimensional поведение, свет/тень как материал, поведение в анимации, голос в копирайте, маркетинг |
| **UI Language** | `ui-language.md` | Bilingual EN/RU. «Вы» в RU. Lowercase labels. Translation glossary. Anglicisms rules. Capitalisation rules. Capability moments vs error states. |
| **Interaction Pattern** | `interaction-pattern.md` | Web app pattern (NOT spatial canvas). Page routes. 8:4 raw→structured split. Theme axis carries meaning. Anti-patterns. |

## Mission

**Контекстер возвращает человеку контроль над контекстом.**

В эпоху, когда AI-вендоры пытаются стать единственным интерфейсом к памяти пользователя, Контекстер делает контекст обратно собственным. Один архив. Любая модель.

## Category

**Public RAG + Shared Rooms + Any size, any format.**

Три новых концепции:
1. **Public RAG** — открытые базы знаний с управляемым доступом
2. **Shared Rooms** — общие пространства контекста с правами
3. **Any size, any format** — RAG который не требует подгонки данных

## Values (5)

1. Контекст принадлежит человеку (не модели, не платформе, не вендору)
2. Человеческий контекст — самое ценное в эпоху AI
3. Слушание — дисциплина (хорошее извлечение требует метода, не магии)
4. Свет и тень имеют смысл (структурное разделение публичного и приватного)
5. Антропоцентричность (за каждой памятью — человек)

## Vibe (6 dimensions)

Cold · Spacious · Discreet · Precise · Timeless · Anthropocentric

Aesthetic: Bauhaus + Swiss типографика встречается с архивной картотекой 2050.

## TOV — 4 Pillars

1. **Sparing** — минимум слов, максимум смысла. Sparsamkeit Гропиуса.
2. **Trustworthy** — открытые границы, никакой "AI магии", явное перечисление параметров.
3. **Spatial** — память как пространство. Архив, ящик, полка, комната.
4. **Quietly Authoritative** — архивариус знает. Не убеждает. Не сравнивается.

NN/G calibration: 15% casual, 25% funny, 5% irreverent, 20% enthusiastic. **Serious-formal, mostly respectful, dry humour permitted, matter-of-fact with restrained warmth at capability moments.**

## Design System (in Pencil)

Полная design system существует в:

- **Active Pencil source:** `nospace/design/contexter/design-system-themes.pen` — 14 sections × 2 themes (light + dark) side-by-side. Theme axis. Caveat: Pencil saved this content INTO contexter-ui.pen, recovery via git pending — see brand-bible.md.
- **Legacy single-theme reference:** `nospace/design/contexter/contexter-ui.pen` (after git restore from `88013fe`)

### Light theme (Weiß-polus)

- Canvas `#FAFAFA`, accent `#1E3EA0` blue
- Used on: main `contexter.cc`, app default

### Dark theme (Gelb-polus)

- Canvas `#1A1A1A` (Moholy-Nagy poster canon), accent `#E8C018` (Itten primary triad cadmium yellow)
- Used on: `blog.contexter.cc`, `vault.contexter.cc`, privacy-bound sections of app

### 14 sections

01 Color · 02 Typography · 03 Spacing · 04 Logofolio · 05 Component Library · 06 Elevation · 07 Motion · 08 State Machine · 09 Grid · 10 Data Table · 11 Error States · 12 Icons · 13 Directional Weights · 14 Type Specimen

### 11 reusable components

Button × 4 (Primary / Secondary / Ghost / Danger) · Input × 2 (Default / Focused) · Badge × 4 (Processing / Ready / Error / Pending) · PipelineIndicator · DropZone

### Design canon (text)

Расположение: `nospace/design/contexter/`

| Doc | Path | Purpose |
|---|---|---|
| Philosophy | `foundations/philosophy.md` | Cold Bauhaus + Swiss + Raw→Structured duality |
| Principles | `foundations/principles.md` | 5 Bauhaus principles adapted (Gestaltung / Gleichgewicht / Materialwahrheit / Sparsamkeit / Raumgestaltung) |
| Color | `guidelines/color.md` | 24 tokens × 2 themes (light/dark), WCAG verified |
| Typography | `guidelines/typography.md` | Inter (body/UI) + JetBrains Mono (code/data), 11 roles |
| Spacing | `guidelines/spacing.md` | 4px atom, 12-step scale (0-80px), component aliases |
| Layout | `guidelines/layout.md` | 12-col grid, 8:4 asymmetric split, raw→structured axis |
| Elevation | `guidelines/elevation.md` | 4-level no-shadow model, both themes |
| Motion | `guidelines/motion.md` | 6 durations, 4 delays, 4 easings, prefers-reduced-motion |
| Data Visualization | `guidelines/data-visualization.md` | Tables, progress, text-over-chart |
| Interaction patterns | `patterns/interaction.md` | State machine + 6 patterns |
| Error states | `patterns/error-states.md` | Signal isolation, inline errors |
| Component inventory | `components/inventory.md` | 11 components specced |
| UX atomic actions | `ux/atomic-actions-map.md` | 9 screens × ~45 states (action → reaction → state) |
| Design audit criteria | `ux/design-audit-criteria.md` | 30+ checks for design QA |

## How to apply

- **Brand copy/content** → проверять по `tov.md` (canonical), section 9 quick checklist
- **Design decisions** → `design/contexter/guidelines/*` + design-system-themes.pen
- **UI text** → `ui-language.md` (bilingual rules + glossary)
- **Mascot in product** → `mascot-meme.md` (loading states, empty states, capability moments)
- **Category framing** → `category-manifesto.md` (Public RAG, Shared Rooms, Any-format)
- **GTM coordination** → `nospace/memory/gtm-01-omnipresence-epic.md`
- **Content factory** → `nospace/development/contexter/memory/contexter-content-factory.md` (CTX-15 epic)
- **Per-platform copywriter cards** → `nospace/marketing/copywriting/channels/{platform}-audience.md` (создаются для каждой целевой платформы)

## Diff vs Harkly brand

| | Harkly | Contexter |
|---|---|---|
| Symbol | Лопоухий внутренний ребёнок (warmth + curiosity) | Архивариус 2050 (cold competence + spatial discretion) |
| Mascot | (no specified) | Meme — amorphous n-dimensional, child+old man duality |
| Vibe | Soft / Elegant / Intelligent / Scientific / Anthropocentric (warm) | Cold / Spacious / Discreet / Precise / Timeless / Anthropocentric (cold) |
| TOV pillars | Attentive / Precise / Humanist / Calm | Sparing / Trustworthy / Spatial / Quietly Authoritative |
| UI language | Russian only (RU/CIS B2B audience) | Bilingual EN primary + RU secondary |
| UI register (RU) | «Вы» | «Вы» (same) |
| Interaction model | Spatial canvas + omnibar primary | Web app + page routes |
| Default theme | Light (warm Cosmic Latte palette) | Light on main, dark on blog/vault/privacy sections |
| Aesthetic reference | The Economist meets Moleskine. Feynman. | Müller-Brockmann meets Dijkstra. Cold Bauhaus. |
| Category | Customer Signals Research | Public RAG + Shared Rooms |
| Audience | UX researchers + PMs (B2B SaaS, RU/CIS) | AI-power users (analysts, researchers, PMs, founders, writers — global) |

## Open work

- [ ] Per-platform audience cards (`marketing/copywriting/channels/`) — by platform under content factory
- [ ] Brand assets — logo SVG/PNG export from Pencil for press kit
- [ ] Press kit assembly — `nospace/brand/press-kit/`
- [ ] Demo GIF — Wave 0 GTM-01 task 6 (asciinema → SVG/GIF)
- [ ] Mascot Meme animation reference video — for marketing
- [ ] Sound design exploration (Meme idle/curious/knowing tones?)
- [ ] Russian register diff EN vs RU — does Meme «ворчит» differently in EN?
