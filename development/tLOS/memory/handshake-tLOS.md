# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-02 by Assistant

---

## Где мы сейчас

NIM AI integration shipped: `tlos-agent-bridge` полностью переписан как NVIDIA NIM HTTP SSE bridge (meta/llama-3.1-8b-instruct), omnibar работает как чат с token streaming. Security hardening завершён (NATS/WS → 127.0.0.1, path traversal fix, memory leaks). Canvas теперь стартует пустым. Grid запускается командой `grid run` из PowerShell.

---

## Следующий приоритет

1. **NIM key refresh** — ключ в `~/.tlos/nim-key` временный (12ч). Если agent-bridge молчит — обновить ключ первым делом.
2. **MCB омнибар** — команда `mcb` не работает после редизайна омнибара. Починить или переосмыслить.
3. **E2E тест с Артёмом** — отправить installer, настроить patch-daemon с `--dev-npub nopoint`, проверить PatchDialog.

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| mcb-v1 | MCB frames для Артёма — заполнить реальными данными | open (blocked — ждём API доступы) |
| nim-v1 | NIM AI bridge — SHIPPED (2026-03-02) | done |
| node-v1 | Nostr patch pipeline — SHIPPED | done, ждём Артёма |
| website-v1 | THELOS marketing site | open |
| site-v1 | Промо-видео / collapse animation | **CLOSED** — commit-summary.md написан |

---

## Критические данные

| Ключ | Значение |
|---|---|
| nopoint Nostr npub (Secp256k1) | `npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw` |
| NIM key | `~/.tlos/nim-key` — временный (12ч), требует ручного обновления |
| NIM model | `meta/llama-3.1-8b-instruct` |
| NIM endpoint | `https://integrate.api.nvidia.com/v1/chat/completions` |
| Blossom BUD-01 тег | `["x", sha256_hex]` в kind:24242 auth event |
| Identity curve mismatch (tech debt) | tlos-identity = Ed25519, nostr-sdk = Secp256k1, работает но несогласованно |

---

## Файлы для отправки Артёму

| Файл | Путь |
|---|---|
| Установщик | `core/kernel/target/release/tLOS_0.1.0_x64-setup.exe` |
| Демон | `core/kernel/target/release/tlos-patch-daemon.exe` |
| Launcher | `core/kernel/target/release/tlos-patch-start.bat` |
| Инструкция | `core/kernel/target/release/ИНСТРУКЦИЯ-ДЛЯ-АРТЁМА.md` |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| NIM bridge | development/tLOS/core/kernel/tlos-agent-bridge/src/main.rs |
| Grid launcher | development/tLOS/core/grid.ps1 |
| Canvas state hook | development/tLOS/core/shell/frontend/src/hooks/useComponents.ts |
| App lifecycle | development/tLOS/core/shell/frontend/src/App.tsx |
| Patch daemon | development/tLOS/core/kernel/tlos-patch-daemon/src/main.rs |
| ADR-003 security | docs/ecosystem-noadmin/adr/003-tlos-network-isolation.md |
| MCB SEO фрейм | development/tLOS/core/shell/frontend/src/components/frames/mcb/McbSeoFrame.tsx |
| ADR-002 v3 | docs/tLOS/docs/technical/adr/ADR-002-node-architecture.md |

---

## THELOS Brand — Quick Ref

| | |
|---|---|
| Логотип | Чёрный монолит |
| Шрифт | Helvetica / Neue Haas Grotesk |
| Стиль | Супрематизм |
| Чёрный | `#000` / `#0A0A0F` |
| Синий | `~#0B1D3A` deep navy |
| Бежевый | `#FAF6F1` (слоновая кость) → `#C8A882` (капучино) |
| Правило | Бежевый = только там где система говорит с человеком |
| Бренд-доки | `docs/tLOS/docs/brand/` |

---

## Открытые вопросы

- [ ] NIM key rotation: нужен механизм автообновления или долгоживущего ключа
- [ ] WebSocket → Tauri IPC: когда переходить? (ADR-003 Phase 2, production milestone)
- [ ] MCB омнибар: команда `mcb` — починить или переосмыслить после редизайна
- [ ] PatchDialog.tsx:19 — kernel.subscribe() cleanup не подтверждён (LOW risk)
- [ ] tlos-spatial/src/lib.rs:195 — clippy: `result.len() >= 0` always true (minor)
- [ ] Унифицировать Ed25519 (tlos-identity) → Secp256k1 (nostr-sdk) в будущем
- [ ] Артём: когда пришлёт npub и доступы к API?
