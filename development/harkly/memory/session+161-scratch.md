<!-- ENTRY:2026-03-18:CHECKPOINT:160:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 160 [Axis]

**Decisions:**
- Badge text в FS оставляем синим ($--accent-blue) — nopoint подтвердил после попытки сменить на $--text-secondary
- "Ветка" → "Гипотеза" в Issue Tree (терминология уточнена)
- Issue Tree second state: поле ввода с синим бордером (spread:2), бейдж "Новая гипотеза", кнопка "Уточнить" с синим бордером — индикатор режима добавления
- FINER цвета: хардкоды #D4EDDA/#2D9D5F временные; RAG рекомендует добавить `--signal-success:#2D7D46` + `--signal-success-bg:#EAF4EB` как формальные токены

**Files changed:**
- `Pencil untitled.pen` — 4 новых артборда F0 со всеми вариантами Framing Studio (y:3176/4176/5176/6176)

**Completed:**
- SPICE вариант FS (5 строк: Контекст/Взгляд/Изучаем/Сравним/Оценка) — артборд y:3176
- PEO вариант FS (3 строки: Популяция/Воздействие/Результат) — артборд y:4176
- Issue Tree вариант FS (Проблема + 3 Гипотезы) — артборд y:5176, 2 состояния в 1 артборде
- FINER вариант FS (5 строк, цветовое кодирование статусов) — артборд y:6176
- Issue Tree: плейсхолдер добавления гипотезы (input + send btn + синие бордеры)
- Позиции в артборде Issue Tree скорректированы — оба состояния влезают в 900px viewport
- RAG-запрос по semantic color через lead-visual-design агента

**In progress:**
- FINER: временные хардкоды → заменить на --signal-success токены

**Opened:**
- Добавить `--signal-success:#2D7D46` и `--signal-success-bg:#EAF4EB` в Pencil variables + обновить FINER бейджи
- F1 Источники — следующий экран для дизайна

**Notes:**
- Все 5 V1-фреймворков Framing Studio нарисованы: JTBD / SPICE / PEO / Issue Tree / FINER
- RAG: Кандинский — зелёный = пассивный/инертный (слабейший выбор для "успех"). Ван Дусбург — хардкоды нарушают Materialwahrheit, signal-success token закрывает незавершённый квартет error/warning/info
