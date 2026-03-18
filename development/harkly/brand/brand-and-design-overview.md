---
name: project_harkly_brand_symbol
description: Harkly brand — full brand docs inventory, symbol, TOV, values, positioning, design system in Pencil
type: project
---

## Brand Symbol

Harkly brand symbol = **внутренний ребёнок** (исцелённый, не наивный).
Логотип: лопоухий → слышит больше → Customer Signals → Attentive.
Инфостиль = Bauhaus в копирайтинге: оба убирают декор ради сути.

## Brand Docs (source of truth)

| Doc | Path | Content |
|---|---|---|
| **Brand Bible** | `development/harkly/brand/brand-bible.md` | Символ, миссия, ценности (5), TOV (4 pillars), аудитория (4 сегмента), speaking style |
| **Values** | `marketing/branding/values.md` | CANONICAL — 5 values, vibe (5 dimensions), 3-layer methodology, positioning copy |
| **Positioning** | `development/harkly/brand/positioning.md` | Одна фраза, для кого, проблема, ответ, GTM, метрика успеха |
| **Category Manifesto** | `development/harkly/brand/category-manifesto.md` | Customer Signals Research как дисциплина |
| **TOV** | `development/harkly/brand/tov.md` | v3 — inner child + lop-eared logo + infostyle |

## TOV — 4 Pillars

1. **Attentive** — слушает, не спешит к выводам, короткие конкретные предложения
2. **Precise** — каждое слово зарабатывает место, числа вместо прилагательных, инфостиль
3. **Humanist** — люди, не сегменты; понимание, не измерение
4. **Calm** — не перепродаёт, ровный регистр, без восклицательных в UI

## Vibe (Brand Aesthetic)

Soft · Elegant · Intelligent · Scientific · Anthropocentric

Aesthetic reference: The Economist (clarity) meets Moleskine (warmth + craft). Feynman — rigorous but human.

## Design System (in Pencil)

Полная design system уже существует в `design/harkly/harkly-ui.pen`:
- **Color System** (DpHtH) — 8 секций: Gray 10-step, Primary Y/R/B, Background 4 layers, Text 4 tones, Border 3, Interactive 3, Signal 4
- **Spacing System** (jrVLH) — 25 токенов: 12 base (4px unit, 0–80px) + 13 component aliases
- **Typography System** (Kf1xa) — 26 токенов: Inter + JetBrains Mono, 8-step scale (10–48px), 3 weights, 3 line-heights, 11 functional roles
- **Motion System** (zqE0U) — 21 токен: 6 duration, 4 delay, 6 easing (Klee), 5 composite
- **Interface Examples** (xF6MT) — 8 примеров (panel, buttons, signals, borders, overlay, accent, light theme)
- **Component Library** (ejLN6) — 17 reusable components

## How to apply

- Brand copy/content → проверять по TOV 4 pillars + values
- Design decisions → Bauhaus RAG (`design/design_system/`) + Pencil design system
- UI text → русский, "Вы", инфостиль
- Category term → "Customer Signals Research" (Harkly owns this term)
