# Requirements Contract — TASK-MONITOR-001-agent-dashboard

**Created:** 2026-03-02
**Project:** agent-monitor (standalone utility)
**Player:** Qwen CLI
**Status:** ACTIVE

---

## Task Description

Создать легковесный инструмент мониторинга AI агентов (Qwen CLI, OpenCode, Gemini CLI) для Windows без WSL.
Инструмент должен писать вывод каждого агента в отдельные лог-файлы и отображать их статус
через простой HTML дашборд с авто-обновлением, открываемый в браузере.

---

## Requirements

Каждый пункт должен быть независимо верифицирован Coach-ем.

- [ ] REQ-001: Папка `logs/` создаётся автоматически при первом запуске. Каждый агент пишет в свой файл: `logs/qwen.log`, `logs/opencode.log`, `logs/gemini.log`
- [ ] REQ-002: Три wrapper-скрипта (`.cmd` для Windows): `run-qwen.cmd`, `run-opencode.cmd`, `run-gemini.cmd` — принимают аргумент (промпт), запускают агента, пишут stdout+stderr в соответствующий лог с timestamp
- [ ] REQ-003: Node.js сервер `server.js` — отдаёт `dashboard.html` и API endpoint `GET /logs/:agent` который читает последние 100 строк из соответствующего лог-файла
- [ ] REQ-004: `dashboard.html` — показывает три панели (Qwen / OpenCode / Gemini), каждые 2 секунды опрашивает `/logs/:agent`, отображает статус (ACTIVE если лог обновлялся < 30 сек назад, IDLE иначе), последние строки вывода
- [ ] REQ-005: `start.cmd` — запускает `node server.js` и открывает `http://localhost:3333` в браузере одной командой
- [ ] REQ-006: `package.json` с единственной зависимостью — нет внешних npm зависимостей (только Node.js built-ins)

---

## Definition of Done

- Все REQ-XXX пункты подтверждены Coach независимо
- `node server.js` запускается без ошибок
- `dashboard.html` открывается в браузере и показывает три панели
- Лог-файлы создаются при запуске wrapper-скриптов
- Нет внешних npm зависимостей
- Файлы < 800 строк каждый

---

## Coach Verification Checklist

Coach ДОЛЖЕН независимо проверить каждый пункт:

- [ ] `node server.js` запускается без ошибок
- [ ] `GET /logs/qwen` возвращает данные из `logs/qwen.log`
- [ ] `dashboard.html` загружается по `http://localhost:3333`
- [ ] wrapper-скрипты создают лог-файлы с timestamp
- [ ] `package.json` не содержит внешних зависимостей
- [ ] Все файлы < 800 строк
- [ ] Нет hardcoded путей кроме localhost:3333
