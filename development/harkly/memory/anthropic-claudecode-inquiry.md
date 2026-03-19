---
# anthropic-claudecode-inquiry.md — Запрос в Anthropic: интеграция Claude Code в Harkly
> Created: 2026-03-18 | Status: DRAFT — не отправлен
> Epic: HARKLY-16
---

## Контекст

Harkly — B2B SaaS платформа для качественных пользовательских исследований (RU/CIS рынок).
Рассматриваем интеграцию Claude Code CLI как часть продукта для пользователей.

## Целевая архитектура

Модель, которую хотим реализовать:

1. Пользователь самостоятельно устанавливает Claude Code CLI на свою машину
2. Пользователь самостоятельно аутентифицируется своим Claude Max/Pro аккаунтом (через `/login` → OAuth)
3. Пользователь платит Anthropic напрямую (своя подписка)
4. Пользователь платит Harkly отдельно (наша SaaS подписка за функционал платформы)
5. Harkly интегрируется с **локальным** инстансом Claude Code пользователя через Claude Agent SDK
6. Harkly **не хранит**, **не проксирует** и **не перехватывает** OAuth tokens пользователя

Схема потока:
```
Пользователь → [аутентификация в Claude Code] → локальный Claude Code
Пользователь → [подписка Harkly] → Harkly SaaS
Harkly SaaS ←→ локальный Claude Code (через Agent SDK, MCP или subprocess)
```

## Вопросы к Anthropic

**1. Допустимо ли это по ToS?**
Описанная архитектура — где пользователь самостоятельно аутентифицируется и мы интегрируемся с его локальным инстансом — нарушает ли Consumer Terms of Service?

**2. Чем отличается от IDE-интеграций?**
VS Code extension и аналогичные интеграции работают с OAuth-аутентифицированным Claude Code пользователя. Чем юридически отличается наш кейс от этих интеграций?

**3. Есть ли официальный путь для этой архитектуры?**
Если описанная модель запрещена — существует ли официальный механизм (partnership program, reseller agreement, Enterprise API) для продуктов, которые хотят предоставить пользователям Claude Code как часть своего SaaS без проксирования их credentials?

**4. MCP как альтернатива?**
Является ли интеграция через MCP (Model Context Protocol) — где Harkly выступает MCP-сервером для Claude Code пользователя — разрешённой моделью?

## Куда отправлять

- sales@anthropic.com (enterprise/partnership inquiry)
- https://claude.ai/contact
- Тема письма: `Third-party SaaS integration with Claude Code CLI — ToS clarification request`

## Черновик письма

---

Subject: Claude Code CLI integration in third-party SaaS — ToS clarification

Hi Anthropic team,

We're building Harkly, a B2B qualitative research SaaS platform for the RU/CIS market.
We're considering an integration with Claude Code CLI and want to clarify the ToS implications before building.

**Proposed architecture:**
- Users install Claude Code CLI independently on their machines
- Users authenticate with their own Claude Max/Pro subscriptions directly
- Users pay Anthropic directly (their own subscription)
- Users pay Harkly separately for our platform functionality
- Harkly integrates with the user's local Claude Code instance via Claude Agent SDK or MCP
- Harkly does NOT store, proxy, or intercept user OAuth tokens at any point

**Our questions:**
1. Does this architecture violate the Consumer Terms of Service?
2. How does this differ legally from IDE extensions (VS Code, etc.) that integrate with user-authenticated Claude Code?
3. If this model is not permitted, is there an official path (partnership, reseller, Enterprise API) for third-party products wanting to offer Claude Code as part of their SaaS?
4. Is MCP server integration (Harkly as MCP server for user's Claude Code) a permitted model?

We want to build this correctly and compliantly. Happy to discuss further or schedule a call.

Best regards,
[nopoint]
Harkly — harkly-saas.vercel.app

---

## Ответ Anthropic

> (заполнить после получения ответа)

## Решение

> (заполнить после получения ответа — что строим в итоге)
