# SPEC — feat-desktop-scaffold

## Task Classification
- **GAIA Level:** L1 (migration + structural, ≤5 steps)
- **Token Budget:** 8,000
- **Topology:** Single agent (Assistant)
- **HITL Checkpoint:** nopoint review after migration complete

## Problem Statement
Перенести рабочий код desktop-версии Harkly из `nopoint/harkly/desktop/` в `nospace/development/harkly/src/desktop/` по стандартам nospace. Подготовить структуру для дальнейшей разработки и инвестиционной презентации.

## Scope
- Копирование исходного кода (без node_modules, dist, .db, .env, runtime-данных)
- Создание nospace-структуры (constitution, branches, docs)
- Перенос spec-документов в docs/harkly/
- Заглушка для api-модуля
- Проверка запуска

**Out of scope:** рефакторинг кода, добавление новых парсеров, API-модуль

## Acceptance Criteria
- [ ] `src/desktop/` содержит всё исходники без артефактов
- [ ] `package.json` + `tsconfig.json` + `vite.config.ts` на месте
- [ ] `npm install` завершается без критических ошибок
- [ ] Документация перенесена в `docs/harkly/`
- [ ] `harkly-constitution.md` создан

## Architecture Notes
Код остаётся Electron-приложением. Замена JSON-DB на Supabase — следующий этап (api-модуль).

## Dependencies
- Node.js + npm (установлены)
- Puppeteer (устанавливается через npm install)

## Verification Gates
```bash
cd /c/Users/noadmin/nospace/development/harkly/src/desktop
npm install --dry-run   # должен пройти без ошибок
npx tsc --noEmit        # типы должны проверяться
```

## Definition of Ready (DoR)
- [x] Исходная директория исследована
- [x] Список файлов для копирования определён
- [x] Секреты/артефакты исключены
- [x] Целевая структура согласована с nopoint
- [x] Токен-бюджет установлен

## Definition of Done
- [ ] Все Verification Gates: PASS
- [ ] Confidence Score ≥ 70
- [ ] nopoint review: approved
