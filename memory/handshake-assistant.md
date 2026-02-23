# HANDSHAKE-ASSISTANT — 2026-02-23 10:45
> Synced from nospace workspace for external AI assistant (Perplexity/Comet).
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Setting up nospace workspace infrastructure (git, slash commands, memory sync) and migrating harkly desktop MVP into nospace structure. Preparing investor pitch for $3–5K seed round with 3 UX/UI scenarios.

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | scaffolding — paused | pipelines + build protocol configured, OWASP security sprint complete |
| harkly | active — migration done | desktop code migrated, investor-pitch.md created, API module pending |

---

## What Was Done Recently

- Created `/sync` slash command — pushes to GitHub with handshake-assistant.md
- Tracked `memory/` in git (repo switched to private — safe for context sync)
- Migrated harkly desktop code to `development/harkly/src/desktop/` (28 files)
- Created `docs/harkly/explanation/investor-pitch.md` (3 UX/UI scenarios, $3–5K investment proposal)
- Created `/startgsession` + `/closegsession` global slash commands
- Set up full git workflow: GCM credentials, commit-msg + pre-commit hooks, .gitmessage template, .gitattributes
- Created `rules/regulations/git-regulation.md`
- Completed OWASP LLM Top 10 security sprint (output_sanitization, JWT SIT, cargo audit, vector-search, etc.)
- Created `rules/regulations/task-management-regulation.md` (GAIA levels, CLEAR framework, DoR/DoD)

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| harkly: npm install + test scraper run | H | — |
| harkly: refine investor pitch (visuals, specific ask) | H | nopoint direction |
| harkly: API module migration (nopoint/harkly/main → nospace) | M | nopoint approval |
| harkly: Next.js frontend | M | post-investor decision |
| OPS-TODO-01: encrypt cloudflare/neon .env with `age` | H | nopoint action required |
| tLOS: next milestone direction | M | nopoint priority call |

---

## Key Files Changed This Session

- `memory/handshake-assistant.md` — this file (new)
- `memory/handshake.md` — operative context for Claude sessions
- `.gitignore` — memory/ unblocked, private_knowledge selective
- `.git/hooks/pre-commit` — secret detection improved (no false positives)
- `.git/hooks/commit-msg` — conventional commits validation
- `~/.claude/commands/sync.md` — new slash command
- `~/.claude/commands/startgsession.md` — new slash command
- `~/.claude/commands/closegsession.md` — new slash command
- `development/harkly/src/desktop/` — 28 source files migrated
- `development/harkly/rules/harkly-constitution.md` — new
- `docs/harkly/explanation/investor-pitch.md` — new
- `rules/regulations/git-regulation.md` — new
- `rules/regulations/task-management-regulation.md` — new
- `rules/global-constitution.md` — updated §6 hierarchy

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack:** TypeScript, Rust, Electron, React, Supabase, BullMQ
**Active agents:** Assistant (Claude) + nopoint (human)
**Regulations:** /rules/regulations/ (14 files)
**Constitution:** /rules/global-constitution.md

**harkly:** Review scraping platform (Electron MVP + Express API)
- Desktop: /development/harkly/src/desktop/ (Puppeteer + React + Vite + Electron)
- Parsers: Otzovik + Irecommend (working), WB/Ozon/YM (planned)
- RAG pipeline: chunker + cleaner + exporter (ready)
- API: /development/harkly/src/api/ (placeholder — nopoint/harkly/main is source)
- Investor pitch: /docs/harkly/explanation/investor-pitch.md

**tLOS:** The Last OS — decentralized Rust/WASM kernel
- Production: /production/tLOS/ (Cloudflare Workers + Arweave + NATS)
- Pipeline: pull-based GitOps (build swarm → Arweave CID → relay nodes pull)
- Status: scaffolding phase, awaiting next development milestone

**Security:** OWASP LLM Top 10 implemented
- JWT Session Identity Tokens, output sanitization, memory integrity hashes
- cargo audit, image digest pinning, vector search regulation
- Full audit: /docs/ecosystem-noadmin/explanation/owasp-llm-security-audit.md

---

## For External Assistant

To help effectively with this workspace:
1. Read `/CLAUDE.md` first (entry point with role-based navigation)
2. Read `/memory/current-context-global.md` (workspace state, epics, blockers)
3. Read `/rules/global-constitution.md` (rules hierarchy — 4 levels)
4. Read `/development/harkly/rules/harkly-constitution.md` for harkly context
5. This file written at 2026-02-23 10:45 — check git log for newer commits
