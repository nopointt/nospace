# HANDSHAKE — 2026-02-23
> Session handshake between Claude Code (Assistant) sessions. Read this LAST during /startgsession.
> Written by: Assistant Agent at session close.
> Purpose: Оперативный контекст между сессиями Claude Code. Перезаписывается при /closegsession.

---

## 🔴 CRITICAL — Read First

- **OPS-TODO-01 (Critical):** Encrypt `private_knowledge/context/longterm/cloudflare-root.env` and `neon-db-master.env` with `age`. Referenced in `docs/ecosystem-noadmin/explanation/owasp-llm-security-audit.md`. Requires nopoint action.
- `memory/` is tracked in git (private repo, needed for AI assistant context sync). See `.gitignore` comment.
- **Agent folders** (`/agents/assistant/`, `/agents/cto/`, `/agents/tech-lead/`, etc.) созданы локально, но ещё не запушены в репо. Необходимо сделать `/sync` и убедиться что `agents/` не в `.gitignore` (чисто — можно пушить).

---

## Active Work

| Item | Status | Next Action |
|---|---|---|
| nospace git setup | ✅ Complete | — |
| OWASP LLM security sprint | ✅ Complete | OPS-TODO-01 pending (human action) |
| Task management regulation | ✅ Complete | Apply to harkly on next stage |
| harkly project scaffold | ⏳ Deferred | nopoint: "fill harkly on next stage" |
| RBAC audit (Comet) | ✅ Complete | position-descriptions removed, comet role added |
| Agent folders push | ⚠️ Pending | Run /sync to push /agents/* folders |

---

## Context Snapshot

**Workspace phase:** scaffolding
**Active projects:** tLOS, harkly
**Active agents:** Assistant (Claude Code, local) + Comet (Perplexity, GitHub)
**Last action:** Comet audit — убраны position-descriptions, добавлена роль comet в RBAC, обновлена конституция, исправлены дубли и конфликты.

---

## Open Decisions

- [ ] harkly project scaffold — when to start?
- [ ] agent-identity-regulation JWT: Phase 2 (HTTP `/identity/issue` server) not yet implemented
- [ ] vector-search-regulation: Qdrant + Ollama stack not yet deployed
- [ ] Cycle Time baselines in task-management-regulation §8 — fill after 10 closed tasks per GAIA level
- [ ] Push /agents/* local folders to repo via /sync

---

## Files Changed This Session

- `.gitignore` — new, excludes secrets and runtime files (memory/ now tracked)
- `.gitattributes` — new, LF normalization
- `.gitmessage` — new, conventional commits template
- `rules/regulations/git-regulation.md` — new, full git protocol
- `rules/global-constitution.md` — updated: RBAC refs, harkly added to hierarchy, Web2 exception, Comet in agent table
- `rules/regulations/rbac-regulation.md` — updated: comet role added, position-descriptions removed
- `memory/handshake.md` — updated: memory/ tracking note fixed, agent folders push reminder
- `memory/handshake-assistant.md` — updated: Comet operative context
- `memory/episodic-context-global.md` — fixed: missing header on second entry
- `memory/current-context-global.md` — updated: active_agents corrected
- `development/harkly/rules/harkly-constitution.md` — updated: Web2 exception declared
- `docs/harkly/README.md` — created: fixes broken link
- `~/.claude/commands/startgsession.md` — new global slash command
- `~/.claude/commands/closegsession.md` — new global slash command

---

## Recommended First Action Next Session

> Run `/startgsession` to load full context. Priority: push /agents/* folders via /sync, then check nopoint for next task.
