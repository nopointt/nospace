# Requirements Contract — TASK-TLOS-001-OMNIBAR-REFACTOR

**Created:** 2026-03-02
**Project:** tLOS — Omnibar UI refactor
**File:** `core/shell/frontend/src/components/Omnibar.tsx`
**Status:** ACTIVE

---

## Task Description

Полный рефактор компонента Omnibar.tsx (SolidJS + TypeScript). Омнибар становится командным центром с системой расширений (4 sub-panel). Поле ввода — TUI внутри омнибара, омнибар — родитель всех панелей.

---

## Requirements

### Критические (компиляция / runtime)

- [ ] REQ-001: `createRef` НЕ импортируется из `solid-js` — это React API. Использовать `let containerRef!: HTMLDivElement;` и `ref={el => (containerRef = el)}` в JSX.
- [ ] REQ-002: `containerRef.current` заменить на `containerRef` везде.
- [ ] REQ-003: Omnibar div должен иметь явную ширину `w-[560px]` в collapsed состоянии.

### UI / визуальные

- [ ] REQ-004: Убран glow div (`bg-gradient-to-r from-cyan-500 to-blue-600`). ✅ (уже выполнено)
- [ ] REQ-005: 3 состояния истории: `collapsed` / `expanded` (h-[360px]) / `max` (h-[600px]). ✅
- [ ] REQ-006: Правая кнопка — 3 направления: → (есть текст, send), ↑ (нет текста + collapsed, expand), ↓ (нет текста + expanded/max, collapse). ✅
- [ ] REQ-007: Правая кнопка контрастная: `bg-zinc-700 hover:bg-zinc-600 w-7 h-7 rounded-lg`. ✅
- [ ] REQ-008: Левый элемент — кружочек с количеством агентов и цветным кольцом здоровья. ✅
- [ ] REQ-009: Input row не показывает `border-t` когда collapsed (применять только когда `isExpanded()`).

### State machine

- [ ] REQ-010: `togglePanel('context')`: если `historyState() === 'max'` → сначала `setHistoryState('expanded')`, затем открыть панель.
- [ ] REQ-011: Клик по кружочку (agent indicator): если активна `agent-state` или `agent-management` → закрыть (setActivePanel('none')); иначе → открыть `agent-state`. ✅ (уже выполнено)
- [ ] REQ-012: ESC: если `activePanel !== 'none'` → закрыть панель; иначе если `isExpanded` → collapse. ✅

### Header (только когда expanded)

- [ ] REQ-013: Заголовок "Eidolon" (button) → при клике togglePanel('agent-management'). ✅
- [ ] REQ-014: Контекст n/m (button) → при клике togglePanel('context'). ✅
- [ ] REQ-015: Название модели / статус (button) → при клике togglePanel('model'). ✅
- [ ] REQ-016: Кнопка expand/contract: в `expanded` → показывает ↑, клик → `max`; в `max` → показывает ↓, клик → `expanded`. ✅

### Панели

- [ ] REQ-017: Panel A (agent-state, LEFT w-60): список агентов с dot + статус, кнопка "configure →". ✅
- [ ] REQ-018: Panel B (agent-management, LEFT w-60): Eidolon + workers, same slot что и agent-state. ✅
- [ ] REQ-019: Panel C (model, RIGHT w-60): название модели, статус, провайдер. ✅
- [ ] REQ-020: Panel D (context, INSIDE omnibar): usage bar, message count, clear context button. ✅

### Click outside

- [ ] REQ-021: Клик за пределами containerRef → collapse history + close panel. Работает только если REQ-001/002 исправлены.

---

## Definition of Done

- Все REQ-XXX проверены Coach (не Player)
- Файл компилируется без TypeScript ошибок (`tsc --noEmit` или vite build)
- Нет `createRef` из solid-js
- Нет `containerRef.current`
- Omnibar имеет явную ширину
- context panel: открытие из max → reduce to expanded
- Файл < 800 строк

---

## Coach Verification Checklist

- [ ] Проверить import строку — нет `createRef`
- [ ] Проверить `containerRef` usage — нет `.current`
- [ ] Проверить `togglePanel` — содержит логику max→expanded для context
- [ ] Проверить omnibar div — есть `w-[560px]`
- [ ] Проверить input row border — только когда isExpanded()
- [ ] Запустить TypeScript check
- [ ] Визуально проверить все 3 состояния кнопок

---

## История

| Turn | Статус | Кто |
|---|---|---|
| 0 | Требования созданы | Coach |
