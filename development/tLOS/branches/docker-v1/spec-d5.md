# D5 — NIM_KEY .env + Docker Desktop Autostart

## Цель

Завершить Always-On Kernel: контейнеры стартуют автоматически при загрузке Windows без `grid.ps1`.

## Что сделано

### core/kernel/.env (gitignored)

```
NIM_KEY=<из ~/.tlos/nim-key>
```

`docker-compose.yml` уже использует `${NIM_KEY}` для litellm сервиса.
Docker Compose автоматически читает `.env` из директории compose-файла.
Gitignored через `core/.gitignore` (строка `.env`).

### Верификация

```bash
cd core/kernel
docker compose config | grep NIM_KEY
# → NIM_API_KEY: nvapi-... (resolved)
```

## Ручной шаг (nopoint)

Docker Desktop → Settings → General → ☑ **Start Docker Desktop when you sign in**

После этого:
```
Windows boot → Docker Desktop (autostart) → docker compose (restart: unless-stopped) → все 6 сервисов up
```

## Статус

D5 ✅ DONE — .env создан, NIM_KEY разрезолвится, Docker Desktop autostart — ручной шаг.
D6 ✅ DONE — Desktop/tLOS.lnk уже создан (сессия 11).

**Always-On Kernel полностью реализован (D1–D6 все DONE).**
