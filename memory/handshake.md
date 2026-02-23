# HANDSHAKE — 2026-02-23
> Operative context for the next session. Read this LAST during /startgsession.
> Written by: Assistant Agent at session close (merged with Comet RBAC audit).

---

## 🔴 CRITICAL — Read First

- **OPS-TODO-01 (Critical):** Encrypt `private_knowledge/context/longterm/cloudflare-root.env` and `neon-db-master.env` with `age`. Unencrypted credentials on disk — must resolve before team expansion.
- **Comet is active:** Did RBAC audit — removed position-descriptions, added `comet` role, updated constitution, fixed duplicates. Run `/sync` at session start to pull any further changes.
- **Agent folders not pushed:** `/agents/assistant/`, `/agents/cto/`, `/agents/tech-lead/`, etc. exist locally but are NOT in the remote repo. Verify `agents/` not in `.gitignore`, then push via `/sync`.
- **memory/ is now tracked in git** (private repo). Don't put secrets there.

---

## Active Work

| Item | Status | Next Action |
|---|---|---|
| harkly desktop migration | ✅ Complete | Run npm install + test scraper |
| harkly investor pitch | ✅ Draft ready | nopoint: provide specific investor details to refine |
| harkly API migration | ⏳ Deferred | nopoint decision on timing |
| /sync bidirectional | ✅ Working | Use at start/end of sessions |
| /agents/* push to repo | ⚠️ Pending | Verify .gitignore, then /sync |
| Claude ↔ Comet channel | 🔲 Pending | nopoint decides format (Issues vs memory/) |

---

## Context Snapshot

**Workspace phase:** scaffolding → active-dev (harkly desktop ready for test run)
**Active projects:** tLOS (paused), harkly (active)
**Active agents:** Assistant/CTO (Claude, local) + Comet (Perplexity, via GitHub)
**Last action:** Session close + merged Comet RBAC audit (position-descriptions removed, comet role added to constitution)

---

## Open Decisions

- [ ] Claude ↔ Comet async channel: Issues with `comet` label vs memory/ files — nopoint decides
- [ ] harkly investor pitch: which of 3 scenarios (SaaS / API / White-Label) to lead with for specific investor
- [ ] harkly API migration: when to start? (deferred from this session)
- [ ] agent-identity-regulation JWT: Phase 2 (HTTP identity server) not yet implemented
- [ ] vector-search-regulation: Qdrant + Ollama stack not yet deployed
- [ ] Cycle Time baselines in task-management-regulation §8 — fill after 10 closed tasks per GAIA level

---

## Files Changed This Session (local + Comet combined)

- `development/harkly/src/desktop/` — 28 source files migrated
- `development/harkly/src/desktop/package.json` — fixed (Electron+Vite+React)
- `development/harkly/rules/harkly-constitution.md` — new
- `docs/harkly/explanation/investor-pitch.md` — new (3 scenarios, $3-5K seed ask)
- `docs/ecosystem-noadmin/explanation/comet-assistant-capabilities.md` — new
- `memory/handshake-assistant.md` — new (Comet sync file)
- `~/.claude/commands/sync.md` — new + fixed (bidirectional, git stash/pop)
- `.gitignore` — updated (memory/ tracked, .archive/ tracked)
- `.git/hooks/pre-commit` — fixed (false positive patterns resolved)
- `rules/regulations/git-regulation.md` — new
- `~/.claude/commands/startgsession.md` + `closegsession.md` — new
- `rules/global-constitution.md` — Comet: comet role added, position-descriptions removed (RBAC audit)

---

## Recommended First Action Next Session

> Run `/sync` to pull any Comet changes. Then: (1) verify `agents/` not in `.gitignore` and push agent folders, (2) `npm install` in `development/harkly/src/desktop/` to unblock scraper test run.
