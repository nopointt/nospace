<!-- ENTRY:2026-03-18:CHECKPOINT:161:harkly:harkly-design-ui [AXIS] -->

## 2026-03-18 — checkpoint 161 [Axis]

**Decisions:**
- FINER formal tokens: `--signal-success:#2D7D46` + `--signal-success-bg:#EAF4EB` — добавлены в Pencil variables (merged, не replace)
- FINER color coding: F (Реализуемо) = yellow warning (#FFF3CD / #B8860B, hardcode — warning token не существовал), I/N/E/R = `$--signal-success-bg` fill + `$--signal-success` text color (formal tokens)
- Grid alignment FINER: нет layout problems, panel y:150 off 8px grid — принято (все 5 артбордов одинаковы, менять не будем)

**Files changed:**
- `untitled.pen` — добавлены 2 токена; обновлены 4 badge fills (51jpZ/nHHAe/gGbv5/JEokh) + 4 badge texts (FX0nN/d2t6j/BPmgS/6BxnJ) с hardcode на formal tokens

**Completed:**
- FINER formal tokens → Pencil variables ✅
- FINER badges (I/N/E/R) → $--signal-success-bg / $--signal-success ✅
- FINER grid check — no problems ✅
- Все 5 V1 Framing Studio фреймворков финализированы: JTBD / SPICE / PEO / Issue Tree / FINER ✅

**In progress:**
- Обсуждение F1 Источники (следующий экран)

**Opened:**
- F (Реализуемо) badge = hardcode #FFF3CD / #B8860B — нужен `--signal-warning-bg` + `--signal-warning` токен если будем формализовывать

**Notes:**
- Token система теперь: 19 base + 2 signal-success = 21 переменных в Pencil
- FINER chip в header: "FINER" лейбл, структура идентична другим фреймворкам (chip group + X)

<!-- ENTRY:2026-03-18:CLOSE:162:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 162 CLOSE [Axis]

**Decisions:**
- Badge text = CENTER (`justifyContent:"center"`) — user rejected left-align (flex-start). Центрирование — намеренный дизайн.
- Value text column alignment: исправлено через gap:8 на row frames (PEO, FINER), не через x детей (flexbox игнорирует x).
- PEO badge width: 64px → 80px — "Воздействие" (65px текст) не клипалось в 64px. 80px = корректный размер.
- Консистентность value text в FINER: row frames F/I/N gap:8 → value text x:104 (было x:108). Row E/R (layout:none) x:104 тоже. Все 5 строк на одной линии.
- `--signal-warning-bg` / `--signal-warning` токены — пропущено. F (Реализуемо) остаётся hardcode #FFF3CD / #B8860B до отдельной задачи.

**Files changed:**
- `untitled.pen` — 2 formal tokens добавлены; FINER badge colors → tokens; PEO badge width 80px; FINER/PEO row gaps → 8px; badge justifyContent center restored; value text columns aligned

**Completed:**
- FINER formal tokens (`--signal-success` + `--signal-success-bg`) → Pencil variables ✅
- FINER I/N/E/R badges → formal tokens ✅
- Badge alignment investigation (center vs flex-start) + revert ✅
- PEO badge clipping fix (width:80) ✅
- Value text column alignment: все 5 фреймворков ✅
- Все V1 Framing Studio фреймворки финализированы ✅

**Opened:**
- `--signal-warning-bg` + `--signal-warning` токены (F badge hardcode)
- F1 Источники screen design

**Notes:**
- Pencil flexbox rule: в flexbox-row frames нельзя задать x/y дочерним нодам — только gap/padding на parent
- Token count: 21 в Pencil (19 base + 2 signal-success)
- Все 5 V1 фреймворков (JTBD/SPICE/PEO/Issue Tree/FINER) готовы → следующий этап: F1–F5 screens
