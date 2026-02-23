# API GATEWAY REGULATION — Key Management & Access Proxy
> Applies to: all agents requesting external API access or deploy credentials.
> Authority: Assistant Agent (enforcement) + Senior Architect (policy).
> Tags: [api-gateway, keys, secrets, proxy, audit, revocation]

---

## § 1 — Принцип

Ни один агент **не хранит API-ключи локально**. Все внешние вызовы проходят через единый шлюз (Gateway), который:
1. Проксирует запрос, подставляя ключ автоматически.
2. Логирует каждый вызов (агент, эндпоинт, timestamp, статус).
3. Может заблокировать или отозвать доступ мгновенно — без пересоздания агента.

---

## § 2 — Архитектура шлюза

```
[Агент] → [tool: api_call(endpoint, params)] 
              ↓
         [Gateway — /tools/api-gateway]
              ↓ (подставляет ключ из /private_knowledge)
         [Внешний API]
              ↓
         [Лог → /memory/logs/agents/api-{date}.md]
              ↓
         [Ответ → Агент]
```

Агент НИКОГДА не видит сырой ключ. Он делает вызов через инструмент `api_call`. Gateway делает всё остальное.

---

## § 3 — Типы токенов

| Тип | Жизнь | Кому | Как отозвать |
|---|---|---|---|
| **Session Token** | 1 сессия (авто-expire) | Lead-агенты | Автоматически при завершении сессии |
| **Deploy Token** | 1 deploy-операция (one-time) | DevOps Lead | Сгорает после первого использования |
| **Monitor Token** | Постоянный (rotate ежемесячно) | SRE Lead / Monitor Swarm | Ручной rotate через Assistant |
| **Emergency Token** | 4 часа | nopoint только | Ручная ревокация |

---

## § 4 — Протокол выдачи ключа

```
1. Агент → Assistant: запрос (role, task_id, endpoint, обоснование)
2. Assistant: проверяет RBAC (роль имеет `request_secrets: true`?)
3. Assistant: логирует запрос в /memory/logs/system/key-requests.md
4. Assistant: уведомляет nopoint (если Deploy Token или Emergency Token)
5. Assistant → Gateway: активирует токен нужного типа
6. Gateway → Агент: подтверждение активации (не сам ключ!)
7. После операции: токен автоматически истекает (Session/Deploy) или ставится напоминание ротации (Monitor)
```

---

## § 5 — Автоматический трекинг

Каждый API-вызов через шлюз пишет запись:

```
[2026-02-22T14:30:00+03:00] agent:devops-lead | endpoint:cloudflare/deploy | status:200 | token_type:deploy | duration:1.2s
```

Файл: `/memory/logs/agents/api-{YYYY-MM-DD}.md` — append-only.

---

## § 6 — Аварийная ревокация

- Любой токен может быть отозван nopoint через команду Assistant за 1 действие.
- При компрометации: Assistant отзывает ВСЕ активные Session Tokens немедленно, уведомляет CTO и SRE Lead.
- Ключи в `/private_knowledge` rotate по графику: API-ключи ежеквартально, деплой-ключи ежемесячно.

---

## § 7 — Что запрещено

- NEVER хардкодить токены в `scratchpad.md`, `log-raw.md` или любом файле ветки.
- NEVER передавать токен между агентами напрямую — только через Gateway.
- NEVER логировать полный токен — только первые 4 символа для трекинга (e.g., `sk-ab**`).

---

## § 8 — Threat Model: /private_knowledge на диске

### Что защищаем

Файлы в `/private_knowledge/context/longterm/` — единственная точка хранения credential material:
- `cloudflare-root.env` — DNS / CDN root access
- `neon-db-master.env` — production database master credentials
- `web3-seed-phrases.enc` — on-chain signing keys (уже зашифрован)

### Модель угроз

| Угроза | Вектор | Смягчение |
|---|---|---|
| **T1: Скомпрометированный агент** | Агент пытается read `/private_knowledge/longterm/` | RBAC: ни одна агентная роль не имеет `read: /private_knowledge/context/longterm/**`. Только `assistant` с `secret_vault_access: read+dispense`. |
| **T2: Prompt injection → утечка** | Вредоносный контент в MCP-ответе заставляет агента вывести ключ | L4-guardrails: `secret_write_detection: true`, `pii_redaction: true`. Паттерны `sk-`, `pk-`, `Bearer`, seed-слова детектятся до записи в файл. |
| **T3: Скомпрометированный хост** | Атакующий получает доступ к файловой системе хоста | `.enc` файлы зашифрованы. Plaintext `.env` файлы уязвимы. **Требование:** все файлы в `longterm/` MUST быть зашифрованы `age` (см. ниже). |
| **T4: Утечка через лог** | Gateway логирует полный ключ | §7: логируется только `sk-ab**` (4 символа + маска). |
| **T5: Token TTL expired but not revoked** | Temp-token файл остался в `temp-mcp-tokens/` | approval-router.ts: auto-revoke через setTimeout + DELETE /tokens/:id endpoint. |

### Шифрование at rest (обязательное требование)

Все файлы в `/private_knowledge/context/longterm/` MUST быть зашифрованы с помощью [`age`](https://age-encryption.org/):

```bash
# Зашифровать (один раз при добавлении секрета)
age -r $(cat ~/.ssh/id_ed25519.pub | age-keygen -y) -o cloudflare-root.env.age cloudflare-root.env
rm cloudflare-root.env  # удалить plaintext

# Gateway расшифровывает при выдаче (в памяти, не на диск)
age -d -i ~/.ssh/id_ed25519 cloudflare-root.env.age
```

**Ключ шифрования:** хранится вне `/nospace/` (SSH key, YubiKey, или env var `AGE_KEY`). Никогда не коммитится.

**Текущий статус:**
- `web3-seed-phrases.enc` — зашифрован ✅
- `cloudflare-root.env` — требует шифрования ⚠️
- `neon-db-master.env` — требует шифрования ⚠️
