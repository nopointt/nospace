# Branch: node-v1 — Dev Node Implementation

**Epic:** node-v1
**Goal:** Реализовать текущую машину (nopoint) как первую Dev Node в tLOS Lattice
**ADR:** ADR-002-node-architecture.md
**Status:** OPEN

---

## Что такое Dev Node

Dev Node = машина разработчика в роли первой ноды Lattice.
- Публикует WASM акторы и обновления для клиентских нод
- Имеет Ed25519 identity (npub/nsec)
- Подключена к NATS как leaf node (локально пока нет remote cluster)
- Объявляет своё присутствие в Lattice при старте grid.ps1

---

## Phase 1 — Dev Node (текущая машина)

### Задача 1: Ed25519 identity
**Файл:** `core/tlos-identity/` (новый Rust crate)
**Что делает:**
- При первом запуске генерирует Ed25519 ключевую пару
- `nsec` сохраняет в Windows DPAPI (через `windows-dpapi` crate)
- `npub` записывает в `~/.tlos/identity.pub`
- При повторном запуске — читает существующий ключ

**Интеграция:**
- grid.ps1 запускает `tlos-identity` первым, до остальных сервисов
- Остальные сервисы читают npub из `~/.tlos/identity.pub`

### Задача 2: NATS leaf node конфиг
**Файл:** `core/nats.conf` (обновить)
**Что делает:**
- Добавить leaf node секцию с remote urls
- Пока remote = localhost (dev режим без VPS)
- Когда VPS готов — заменить на реальный адрес

```
leafnodes {
  remotes = [
    { urls: ["nats://localhost:4222"] }  # заменить на VPS адрес
  ]
}
```

### Задача 3: Node announcement
**Что делает:**
- При старте NATS публикует в subject `tlos.lattice.nodes.announce`
- Payload: `{ npub, version, capabilities, timestamp }`
- Signed Ed25519

---

## Phase 2 — Full Node (Артём) — ПОСЛЕ Phase 1

### Задача 4: Windows installer
- NSIS или cargo-wix
- Bundling: nats-server.exe + tlos-identity.exe + shell frontend
- First-run wizard: генерация ключей

### Задача 5: Update dialog в shell
- SolidJS компонент: UpdateNotification
- Подписка на `tlos.node.updates` NATS subject
- Диалог: "Доступно обновление v{version}. [Применить] [Позже]"

### Задача 6: E2E тест
- Dev node пушит тестовый актор
- Full node (Артём) видит notification
- Применяет обновление
- Hot-swap без перезапуска

---

## Phase 3 — Scale

### Задача 7: Client onboarding template
- Скрипт/документ: как настроить новый Full Node инстанс
- Параметры: client_id, allowed_actors, update_channel
- Время деплоя нового клиента: < 30 минут

---

## Зависимости

| Зависимость | Статус | Примечание |
|---|---|---|
| VPS для NATS supercluster | НУЖЕН | Hetzner CX11 ~5€/мес достаточно для начала |
| `windows-dpapi` Rust crate | available | для хранения nsec |
| `ed25519-dalek` Rust crate | available | для генерации ключей |
| NATS leaf node конфиг | simple | одна строка в nats.conf |

---

## Файлы которые будут созданы/изменены

```
core/
├── tlos-identity/          ← новый Rust crate
│   ├── Cargo.toml
│   └── src/main.rs
├── nats.conf               ← добавить leaf node секцию
└── grid.ps1                ← запускать tlos-identity первым
```
