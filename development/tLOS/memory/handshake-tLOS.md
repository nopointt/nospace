# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-02-28 by Assistant

---

## Где мы сейчас

Phase 1 node-v1 **полностью реализован и E2E протестирован** (2026-02-28): tlos-patch-send → Blossom → Nostr → tlos-patch-daemon → NATS → PatchDialog в Tauri-приложении. `tLOS_0.1.0_x64-setup.exe` собран. nopoint identity создан, Nostr npub известен. Ждём настройки машины Артёма.

---

## Следующий приоритет

1. **Настроить машину Артёма**: отправить установщик, обменяться npub, запустить daemon
2. **E2E тест с Артёмом**: nopoint → `tlos-patch-send --to <artem_npub>` → Артём видит PatchDialog
3. **MCB оставшиеся фреймы**: mcb-strategy, mcb-signal-brief, mcb-gap-detail, mcb-task-card (ждём API от Артёма)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| mcb-v1 | Marketing Command Board — 6 frames | open — ждём API доступы от Артёма |
| node-v1 | Phase 1 Nostr pipeline | shipped — осталась настройка машины Артёма |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Установщик | core/shell/frontend/src-tauri/target/release/bundle/nsis/tLOS_0.1.0_x64-setup.exe |
| Patch send binary | core/kernel/target/release/tlos-patch-send.exe |
| Patch daemon binary | core/kernel/target/release/tlos-patch-daemon.exe |
| PatchDialog | core/shell/frontend/src/components/PatchDialog.tsx |
| Shell NATS→WS bridge | core/shell/src/main.rs |

---

## Критические данные (node-v1)

| Ключ | Значение |
|---|---|
| nopoint Nostr npub | `npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw` |
| nopoint identity file | `~/.tlos/identity.key` (создан 2026-02-28) |
| Blossom сервер | `blossom.primal.net` — работает, нужен `["x", sha256]` в BUD-01 auth event |
| Рабочий relay | `wss://relay.damus.io` (nos.lol временно 502) |

---

## Команды

```powershell
# Запустить dev среду
grid run

# Отправить патч Артёму (заменить npub)
.\tlos-patch-send.exe --actor mcb-seo --version 1.2 --file ./mcb-seo.wasm --to <artem_npub>

# Запустить daemon (на машине Артёма)
.\tlos-patch-daemon.exe --dev-npub npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw
```

---

## Открытые вопросы

- [ ] Когда Артём установит tLOS и запустит daemon? (нужна координация)
- [ ] Tech debt: tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — унифицировать в будущем
- [ ] Windows DPAPI для хранения nsec (сейчас plaintext hex в файле)
- [ ] Оставшиеся MCB фреймы — когда? (ждём API доступы от Артёма)
