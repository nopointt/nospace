# HANDSHAKE — 2026-02-23
> Operative context for the next session. Read this LAST during /startgsession.
> Written by: Assistant Agent at session close.

---

## 🔴 CRITICAL — Read First

- **OPS-TODO-01 (Critical):** Encrypt `private_knowledge/context/longterm/cloudflare-root.env` and `neon-db-master.env` with `age`. Referenced in `docs/ecosystem-noadmin/explanation/owasp-llm-security-audit.md`. Requires nopoint action.
- `memory/` directory is gitignored — `handshake.md`, context files are local only. This is intentional.

---

## Active Work

| Item | Status | Next Action |
|---|---|---|
| nospace git setup | ✅ Complete | — |
| OWASP LLM security sprint | ✅ Complete | OPS-TODO-01 pending (human action) |
| Task management regulation | ✅ Complete | Apply to harkly on next stage |
| harkly project scaffold | ⏳ Deferred | nopoint: "fill harkly on next stage" |

---

## Context Snapshot

**Workspace phase:** scaffolding
**Active projects:** tLOS, harkly
**Last action:** Configured full git workflow — GCM credentials, commit hooks, commit template, .gitattributes, git-regulation.md. Created /startgsession and /closegsession slash commands.

---

## Open Decisions

- [ ] harkly project scaffold — when to start?
- [ ] agent-identity-regulation JWT: Phase 2 (HTTP `/identity/issue` server) not yet implemented
- [ ] vector-search-regulation: Qdrant + Ollama stack not yet deployed
- [ ] Cycle Time baselines in task-management-regulation §8 — fill after 10 closed tasks per GAIA level

---

## Files Changed This Session

- `.gitignore` — new, excludes secrets and runtime files
- `.gitattributes` — new, LF normalization
- `.gitmessage` — new, conventional commits template
- `.git/hooks/pre-commit` — new, secret detection + file size check
- `.git/hooks/commit-msg` — new, conventional commits validation
- `rules/regulations/git-regulation.md` — new, full git protocol
- `rules/global-constitution.md` — added git-regulation to §6 hierarchy
- `~/.claude/settings.json` — `includeCoAuthoredBy: false`, GCM allowed
- `~/.claude/commands/startgsession.md` — new global slash command
- `~/.claude/commands/closegsession.md` — new global slash command

---

## Recommended First Action Next Session

> Run `/startgsession` to load full context, then check if nopoint has a priority task. If not, propose harkly scaffold as next milestone.
