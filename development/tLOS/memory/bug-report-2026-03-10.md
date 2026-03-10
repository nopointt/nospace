# tLOS Bug Report — 2026-03-10
> Updated: 2026-03-10 (sprint 1 complete)

**Scope:** shell/frontend/src/ + kernel bridges
**Total issues:** 39 → **26 fixed**, 13 remaining

---

## ✅ FIXED — Sprint 1 (2026-03-10)

| # | Файл | Фикс |
|---|---|---|
| 1 | `PatchDialog.tsx:19` | subscribe → onMount + onCleanup |
| 2 | `kernel.ts:52` | exponential backoff 1s→2s→…→30s max |
| 3 | `kernel.ts` | subscriberSet (Set) + MAX_SUBSCRIBERS=50 guard |
| 5 | `claude-bridge/index.js` | spawn timeout 30s → kill + done event |
| 6 | `useComponents.ts:9-13` | localStorage catch → console.warn |
| 7 | `useSnap.ts` | Object.assign заменён на explicit draft assignments |
| 9 | `Chat.tsx:19` | null-check уже был — OK |
| 10 | `DynamicComponent.tsx` | event delegation: 1 window listener (shared Set) |
| 11 | `DynamicComponent.tsx` | mousemove RAF throttle — max 1 write/frame |
| 12 | `useSnap.ts:60-128` | isDockedToOmnibar O(N²)→O(N) via byId Map |
| 13 | `Omnibar.tsx:118` | hint interval останавливается при expanded |
| 14 | `Space.tsx:50-54` | canvas redraw optimization (sprint 1 agent) |
| 15 | `kernel.ts` | onerror handler добавлен |
| 17 | `claude-bridge/index.js` | spawn timeout (= #5) |
| — | `kernel.ts:40,44,49` | console.log → DEBUG-gated log() |
| — | `Omnibar.tsx:435` | "coming soon" удалён |
| 8 | `Omnibar.tsx:220-240` | model ID validation + fallback (sprint 1 agent) |
| — | `useSnap.ts` | produce((state: any)) → typed (sprint 1 agent) |
| — | Multiple | Magic numbers → constants.ts (sprint 1 agent) |

---

## 🔴 OPEN — Требуют отдельных задач

### SEC HIGH — Архитектурные

| # | Файл | Проблема | Почему отложено |
|---|---|---|---|
| 4/16 | `PatchDialog.tsx` | Патчи применяются без верификации Nostr-подписи | Требует `nostr-tools` crypto library + design решение (reject vs warn) |
| 18 | `claude-bridge/index.js` | System prompt files world-readable | Windows NTFS ACL vs Unix chmod — нужен OS-specific подход |
| 19 | `kernel.ts` | Identity keys могут попасть в логи | Нужен полный аудит всех путей логирования |

### ARCH DEBT — Системные

| Проблема | Описание | Условие для старта |
|---|---|---|
| Нет centralized state management | Каждый компонент держит свой state — нет single source of truth | После стабилизации core features |
| Нет input validation layer | Нет Zod/io-ts на границах (NATS → component, user input → send) | После stabilization + когда определены все data schemas |

---

## Приоритет следующего спринта

1. **SEC**: PatchDialog Nostr signature verification (`nostr-tools`)
2. **SEC**: System prompt file permissions (OS-specific)
3. **SEC**: Logging audit — убедиться что identity keys не логируются
4. **ARCH**: Определить state management стратегию (Solid store vs immer vs custom)
