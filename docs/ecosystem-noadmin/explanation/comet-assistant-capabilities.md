# Comet Assistant — GitHub Capabilities
> Perplexity-based assistant, connected to github.com/nopointt/nospace (private repo).
> Used as: secondary AI assistant for research, code generation, file management via GitHub.
> Sync protocol: /sync command (Claude → push + pull ↔ Comet reads/writes repo)

---

## Что умеет (Read)

- Читать любые файлы и директории репозитория
- Просматривать историю коммитов, ветки, теги
- Читать Issues и Pull Requests
- Смотреть diff между ветками/коммитами

## Что умеет (Write)

- Создавать файлы — с любым содержимым, в любой директории
- Редактировать файлы — обновлять содержимое существующих файлов
- Удалять файлы
- Создавать ветки
- Пушить коммиты — сразу в репо, без локального git
- Создавать и мёрджить Pull Requests
- Создавать и закрывать Issues
- Создавать теги и релизы

## Что НЕ умеет

- Выполнять код (запускать скрипты, билды, тесты)
- Взаимодействовать с CI/CD напрямую
- Работать с Git LFS
- Видеть файлы из .gitignore (они не в репо)

---

## Протокол совместной работы

```
Claude (local)          GitHub repo           Comet (remote)
──────────────          ───────────           ──────────────
/sync →                 push →                читает файлы
                        ← pull ←              пишет файлы, коммитит
работает с              ← pull ←              читает ответ Claude
локальным кодом
```

**Правила:**
- Comet работает через ветки или напрямую в `main` — зависит от задачи
- Comet НЕ трогает `private_knowledge/context/longterm/` (исключён из репо)
- Claude делает `git pull` в начале каждого `/sync` — забирает изменения от Comet
- Конфликты разрешает Claude (local) — он имеет полный контекст

## Типичные задачи для Comet

- Исследование и документирование через файлы в `research/` или `docs/`
- Генерация кода в `development/` по spec.md из ветки
- Обновление `memory/` файлов (current-context, episodic) по итогам своей работы
- Создание Issues для backlog задач
- Написание черновиков spec.md для новых веток
