<!-- ENTRY:2026-03-18:CHECKPOINT:157:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 157 [Axis]

**Decisions:**
- F0 НЕ глобальный — каждая ветка имеет свой F0 (отдельный пустой скретчпад)
- PICOT bar NOT sticky — видимость управляется юзером (не прилипает к флорам)
- Harkly UI = только русский язык, аудитория RU/CIS B2B
- Framing Studio — ключевой UI элемент F0: появляется при вводе вопроса
- PICOT может не быть единственным фреймом — зависит от типа вопроса (ресёрч в процессе)

**Files changed:**
- `harkly/memory/harkly-design-ui.md` — L3 полностью обновлён: warm токены, border bug, artboard structure, node IDs, архитектурные решения
- `untitled.pen` — F0 артборд: Студия фрейминга добавлена (все тексты на русском), FloorPill → "Черновик"
- `~/.claude/projects/.../memory/project_harkly_language.md` — новый memory файл: Harkly UI = русский
- `~/.claude/projects/.../memory/MEMORY.md` — поинтер на project_harkly_language.md + исключение из english_only

**Completed:**
- Контекст сессии восстановлен из дампа #155 в L3
- L3 harkly-design-ui.md обновлён: warm токены (19 vars), border bug rule, структура артбордов
- F0 Scratchpad: Студия фрейминга спроектирована (PICOT × 5 строк, кнопки, warm palette)
- Архитектурные решения зафиксированы: F0 per-branch, PICOT bar не sticky
- Память: Harkly UI = русский язык (RU/CIS аудитория)

**In progress:**
- Ресёрч-агент: framing frameworks (PICOT alternatives) — фоновый, ещё не завершён
- После ресёрча: обновить L3 с решением по фреймворкам (когда какой фрейм)

**Opened:**
- Студия фрейминга: поддерживать несколько фреймов (PICOT / SPIDER / HMW / JTBD) или только PICOT?
- `--border-subtle` (#E3E3E3) остался холодным — нужен warm вариант
- Omnibar placeholder "Ask Harkly…" → перевести на русский

**Notes:**
- Баг в /closeaxis (harkly): scratch не копируется в chronicle перед очисткой — нужно починить скилл
- Pencil border bug: effect.shadow не принимает токены ($vars) — только hardcoded hex
- Padding в Pencil: [vertical, horizontal] порядок
- Ресёрч: PICOT из медицины (EBM), плохо работает для exploratory CX-вопросов → SPIDER/HMW лучше
