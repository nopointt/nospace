# /nospace — Complete Directory Index
> Domain: admin | Generated: 2026-03-22 by Logos
> Purpose: full map of every directory and key file in the workspace
> Stats: ~473K lines of markdown, 4 projects, 25+ regulations, 14 Bauhaus PDFs

---

## Root Files

| File | Description |
|---|---|
| `intent.md` | Workspace philosophy: memory layers (L0-L4), abstraction levels, access model |
| `ideas_inbox.md` | nopoint's raw idea stream (unfiltered). Topics: data marketplace, bug KB, error tolerance, JTBD metrics, SQLite memory, token potential debt |
| `bauhaus-2026.md` | Bauhaus 2026 content theme — structural analogy 1919 vs 2026 (large file, research + references) |
| `.gitignore` | Secrets, runtime, build artifacts, OS junk, logs, Claude caches |
| `.gitattributes` | Git LFS / line ending config |
| `.gitmessage` | Commit message template |

---

## 1. `.archive/`
> Deprecated files. Never delete — archive here.

| Path | Description |
|---|---|
| `agents/_template-old/` | Old agent template: config.yaml, identity.md, permissions.json, tools-whitelist.md |
| `agents/workspace-charter.md` | Old workspace charter (superseded by global-constitution.md) |

---

## 2. `agents/`
> Agent definitions, templates, ecosystem map

| Path | Description |
|---|---|
| `_template/L0-identity.md` | Agent identity template (L0) |
| `_template/L1-cognition.md` | Agent cognition layer template |
| `_template/L2-memory-config.yaml` | Memory configuration template |
| `_template/L3-mcp-tools.json` | MCP tools manifest template |
| `_template/L4-guardrails.yaml` | Agent guardrails template |
| `comet/L0-identity.md` | Comet (Perplexity) identity — external assistant |
| `comet/comet-startgsession.md` | Comet session start protocol |
| `comet/comet-closegsession.md` | Comet session close protocol |
| `comet/onboarding.md` | Comet onboarding instructions |
| `domain-lead/INSTRUCTION.md` | Domain Lead agent full instruction (audit → spec → G3) |
| `ecosystem-map.md` | **KEY**: Full agent topology, DAG flow, communication rules, escalation matrix |
| `assistant/`, `cto/`, `devops-lead/`, `frontend-engineer/`, `qa-lead/`, `research-assistant/`, `reviewer-agent/`, `senior-architect/`, `sre-lead/`, `tech-lead/` | Empty role directories (templates for future agent configs) |

---

## 3. `data/`
> Runtime/session data. Gitignored. Currently empty.

---

## 4. `design/`
> Design systems, Pencil files, UI docs

### 4.1 `design/design_system/` — tLOS Bauhaus Design System (43 files)

| Subdirectory | Files | Description |
|---|---|---|
| `README.md` | 1 | Overview of the design system |
| `DESIGN-CODE.md` | 1 | Design Code methodology |
| `AGENTS.md` | 1 | Design agent roles |
| `formal-grammar/` | 6 | balance-tension, color, decomposition, economy, point-line-plane, rhythm-proportion |
| `foundations/` | 5 | gaps, glossary, philosophy, principles, provenance |
| `guidelines/` | 8 | agents, color, elevation, layout, motion, spacing, spatial, typography |
| `material/` | 4 | faktur-textur-struktur, light, material-truth, tactile |
| `patterns/` | 6 | agent-dialog, composition, error-states, interaction, navigation, workspace |
| `perception/` | 4 | consciousness, neue-sehen, pedagogy, sensation |
| `production/` | 4 | craft-industry, prototype, standardization, typus |
| `space/` | 5 | body-in-space, modular, scale, transparency, zoning |
| `time/` | 4 | movement, notation, rhythm-tempo, simultaneity |
| `tokens/base/` | 4 | color, motion, spacing, typography tokens (JSON) |
| `tokens/component/` | 5 | button, input, omnibar, panel, tag tokens |
| `tokens/semantic/` | 2 | color.semantic, elevation.semantic tokens |
| `tokens/themes/` | 2 | dark, high-contrast themes |
| `registry/` | — | Empty (planned for component registry) |

### 4.2 `design/harkly/` — Harkly Design System

| Path | Description |
|---|---|
| `README.md` | Harkly design system overview |
| `harkly-ui.pen` | **Pencil source of truth**: tokens, 17 components, 8+ artboards |
| `bauhaus-rag-results.md` | RAG validation of design decisions against Bauhaus |
| `bauhaus-validation-results.md` | Bauhaus validation report |
| `harkly-spatial-interface-rules.md` | Spatial interface rules |
| `foundations/philosophy.md` | Design philosophy |
| `foundations/principles.md` | 5 design principles |
| `guidelines/` | color, data-viz, elevation, layout, motion, pencil-naming, spacing, typography |
| `components/inventory.md` | Component inventory |
| `patterns/` | composition, error-states, interaction, navigation, workspace |

### 4.3 `design/contexter/` — Contexter Design System

| Path | Description |
|---|---|
| `README.md` | Swiss/Bauhaus. JetBrains Mono. B&W + blue. 0px corners. |
| `foundations/` | philosophy, principles |
| `guidelines/` | color, data-viz, elevation, layout, motion, spacing, typography |
| `components/inventory.md` | Component list |
| `patterns/` | error-states, interaction |
| `ux/` | atomic-actions-map, design-audit-criteria |

### 4.4 `design/tlos-ui.pen`
> tLOS Pencil file — UI design for tLOS shell

---

## 5. `development/`
> Source code for all 3 projects

### 5.1 `development/tLOS/` — Sovereign Spatial OS

#### Core (`core/`)

| Subdirectory | Description |
|---|---|
| `shell/frontend/` | SolidJS + Vite + Tailwind + Tauri (1440×900 frameless). Components, hooks, commands, frames, assets |
| `shell/ai-worker/` | Cloudflare AI Worker (standalone) |
| `shell/src/` | Additional shell source |
| `kernel/docker-compose.yml` | 11-service Docker stack |
| `kernel/tlos-langgraph-bridge/` | **Python LangGraph**: graph.py, bridge_handler.py, domain_config.py, regulator.py, samurizator.py, debug_service.py, agent_comm.py, bauhaus_*.py, tlos_mcp_server.py, alembic/ |
| `kernel/tlos-claude-bridge/` | Claude CLI bridge (Node.js) |
| `kernel/tlos-shell-bridge/` | Rust WebSocket bridge (port 3001) |
| `kernel/tlos-dispatcher/` | Rust dispatcher |
| `kernel/tlos-fs-bridge/` | Rust filesystem bridge |
| `kernel/tlos-shell-exec/` | Rust shell exec |
| `kernel/tlos-nats/` | Rust NATS client |
| `kernel/tlos-nostr/` | Rust Nostr identity |
| `kernel/tlos-identity/` | Rust Ed25519/DID identity |
| `kernel/tlos-spatial/` | Rust spatial engine |
| `kernel/tlos-runtime/` | Rust WASM runtime |
| `kernel/tlos-agent-bridge/` | Rust agent bridge |
| `kernel/tlos-claude-cli-adapter/` | Claude CLI adapter |
| `kernel/tlos-patch-daemon/` | Rust patch daemon |
| `kernel/tlos-patch-send/` | Rust patch sender |
| `kernel/tlos-zep-bridge/` | Zep memory bridge |
| `kernel/actors/` | WASM actors: echo-worker, math-worker, shaper-worker |
| `kernel/wit/` | WASM Interface Types |
| `kernel/scripts/` | Utility scripts |
| `kernel/archive/` | Archived commands, scratches, JSX backups |
| `kernel/backups/` | DB/config backups |
| `agents/eidolon/` | Eidolon agent config: config.json, system-prompt.md, memory/ |
| `.claude/` | Claude Code commands & skills for tLOS core (13 files) |
| `.qwen/` | Qwen agent config (deprecated) |
| `.opencode/` | OpenCode agent config (deprecated) |
| `glmcode/` | GLM delivery reports (Cycles 12-14) |
| `kimicode/` | Kimi delivery reports (Cycles 6-13) |
| `docs/` | Core docs: E2E checklist, getting started, ports, test scenarios |
| `design-system/MASTER.md` | Legacy design system master |
| `memory/` | Core-level memory (legacy) |
| `CLAUDE.md` | Core-level Claude instructions |
| `BRIEFING.md` | Team briefing |
| `TEAM_AI.md` | AI team configuration |
| `grid.ps1` | PowerShell launcher |

#### Memory (`memory/`)

| File | Description |
|---|---|
| `tlos-about.md` (L1) | Project reference — stack, paths, agents, Bauhaus, MCB |
| `tlos-roadmap.md` (L2) | Roadmap — phases and epics |
| `tlos-phase10.md` → `tlos-phase15.md` (L3) | Epic context files (10-15) |
| `tlos-phase_bauhaus_code_enrich.md` | Bauhaus enrichment epic |
| `chronicle/tlos-current.md` | Current chronicle (working set) |
| `chronicle/tlos-chronicle.md` | Full append-only history |
| `chronicle/index.md` | Chronicle index |
| `scratches/*.md` | Session scratch files (6 files, #143-#149) |
| `auto-scratch.md` | Auto-generated scratch (PostToolUse hook) |
| `l4-archive.md` | L4 scratch archive |
| `session-scratch.md` | Current session scratch |
| `codebase-map-tLOS.md` | Codebase map |
| `enricher-status.md` | Bauhaus enricher status |
| `bug-report-2026-03-10.md` | Bug report |
| `current-context-tLOS.md` | tLOS current context |
| `episodic-context-tLOS.md` | Episodic events |
| `semantic-context-tLOS.md` | Semantic entities |
| `handshake-tLOS.md` | Session handshake (deprecated) |
| `scratchpad-tLOS.md` | Legacy scratchpad |
| `scratch-checkpoint-50.md` | Old checkpoint |
| `session-12mar-context.md` | Session context snapshot |

#### Branches (`branches/`)

| Branch | Description |
|---|---|
| `_template/` | Branch template: spec.md, scratchpad.md, commit-summary.md, log-raw.md |
| `docker-v1/` | Docker v1 specs (d1-d5) |
| `feat-mcb-v1/` | MCB feature spec |
| `feat-node-v1/` | Node feature spec |
| `feat-omnibar/` | Omnibar feature |
| `feat-qdrant-v1/` | Qdrant integration specs (a-docker, b-client, c-integration) |
| `feat-site-v1/` | Website feature |
| `feat-tgdatabase/` | Telegram database |
| `feat-workspace-v1/` | Workspace feature |
| `feature-name/` | Generic template instance |
| `l3-agents/` | L3 agents specs (step7, step8) |
| `mcb-v1/` | MCB v1 |
| `phase-11/` | Phase 11 specs (token-budgets, backups, CSP, API key migration, docker healthchecks, getting-started) |
| `quality-sprint/` | Quality sprint specs |

#### Other tLOS subdirectories

| Path | Description |
|---|---|
| `docs/adr/` | 6 ADRs: NATS transport, Continuum memory, LangGraph, Claude CLI, TTL values, Regulator rules |
| `docs/agent-flow-optimization-plan.md` | Agent flow optimization |
| `docs/agent-system-prod-ready-plan.md` | Production readiness plan |
| `docs/backlog-moscow.md` | MoSCoW prioritized backlog |
| `docs/diataxis/` | 5 files: howto-add-agent-type, howto-add-nats-subject, reference-memory-layers, reference-services, tutorial-first-agent-invocation |
| `docs/reference/nats-catalog.md` | NATS subjects catalog |
| `rules/tLOS-constitution.md` | tLOS project constitution |
| `rules/regulations/tui-development-regulation.md` | TUI development regulation |
| `specs/` | Empty (planned) |
| `g3-plan/` | G3 session plans (tlos-08, tlos-09 player/review specs) |
| `.g3/sessions/` | G3 review sessions |
| `PRODUCT.md` | Product overview |
| `development/tLOS/` | Nested development dir (recursive placeholder) |

### 5.2 `development/harkly/` — Data Intelligence Platform

#### Code Projects

| Directory | Description |
|---|---|
| `harkly-shell/` | **Tauri + SolidJS desktop app** (77 SolidJS files). Canvas, frames, Omnibar, spatial hooks. src/components/frames/harkly/ (7 Harkly frames), frames/mcb/ (6 MCB frames). **Active** |
| `harkly-web/` | **SolidStart + CF Pages** (53 src files). ABANDONED (2026-03-20). Upload, query, canvas, auth, MCP. Bugs: backend, frontend, mcp-worker. Tech debt docs. |
| `harkly-saas/` | **Next.js + Prisma + Vercel** (DEPRECATED). Landing harkly-saas.vercel.app still live. |
| `cx-platform/` | CX/OSINT platform (Python/FastAPI). G3 plans, migrations, specs. |
| `astro-theme/` | Astro landing page theme (has own .git) |
| `tailgrids/` | TailGrids component library (has own .git, monorepo: apps + packages) |
| `lib-axiom-minimalist-theme/` | Axiom minimalist theme |
| `video-tests/` | Video testing |

#### Brand (`brand/`)

| File | Description |
|---|---|
| `brand-bible.md` | Full brand bible |
| `brand-and-design-overview.md` | Brand + design overview (canonical for MEMORY.md pointer) |
| `values.md` | Brand values |
| `positioning.md` | Market positioning |
| `category-manifesto.md` | Category creation manifesto |
| `tov.md` | Tone of Voice (v3) |
| `omnibar-primacy.md` | Omnibar as primary input |
| `ui-language-ru.md` | UI in Russian only |
| `MOVED.md` | Redirect notice |
| `agents/` | Content pipeline agents |
| `channels/` | Channel-specific content |
| `ideas/` | Brand ideas hub (hub.json + briefs/) |

#### Memory (`memory/`)

| File | Description |
|---|---|
| `harkly-about.md` (L1) | Project reference — stack, paths, active L3, canvas, compliance, design |
| `harkly-roadmap.md` (L2) | Roadmap |
| `harkly-mvp-data-layer.md` (L3) | ABANDONED — MVP data layer epic |
| `harkly-18-{1..5}-*.md` (L3 sub-epics) | 5 sub-epic trackers (scaffold, upload, schema, MCP, canvas) |
| `harkly-design-ui.md` (L3) | PAUSED — UI design epic |
| `harkly-shell-epic.md` (L3) | PAUSED — Shell (Tauri) epic |
| `harkly-marketing-content.md` (L3) | PAUSED — Content auto-writing |
| `harkly-saas-v1.md` (L3) | PAUSED — SaaS v1 backend build |
| `harkly-canvas-redesign.md` (L3) | PAUSED — Canvas redesign |
| `harkly-cold-outreach.md` (L3) | PAUSED — Cold outreach |
| `anthropic-claudecode-inquiry.md` (L3) | PAUSED — Claude CLI integration |
| `chronicle/harkly-current.md` | Current chronicle |
| `chronicle/harkly-chronicle.md` | Full history |
| `chronicle/index.md` | Chronicle index |
| `chronicle/session-scratch-20260317.md` | Archived scratch |
| `chronicle/scratches/` | Processed scratches |
| `session+{N}-scratch.md` (×16) | Session scratches (#152-#176) |
| `session-scratch.md` | Current session |
| `f79bd6ea+171-scratch.md` | Named scratch |
| `current-context-harkly.md` | Current context |
| `decisions-harkly.md` | Decision log |
| `epics-log-harkly.md` | Epic log |
| `harkly-mvp-session-context.md` | MVP session context |
| `landing-page-state.md` | Landing page state |
| `product-use-cases.md` | Use cases |
| `report-catalog.md` | Report catalog |
| `semcomp-registry.md` | Semantic component registry |
| `cold-outreach-*.md` (×2) | Outreach research |
| `stealth-scraping-techniques.md` | Scraping techniques |
| `handshake-harkly.md` | Session handshake (deprecated) |
| `harkly-saas-v1-roadmap-archive.md` | Archived SaaS roadmap |

#### Other

| Path | Description |
|---|---|
| `architecture/` | Legacy architecture docs (4 files: CJM, product arch EN/RU, business brief) |
| `archive/` | Archived docs (4 files) |
| `branches/` | 9 branch specs (OSINT pipeline, desktop scaffold, Instagram scraper, landing, OSINT layer, SaaS v1, QA fix) |
| `design/` | Harkly design (separate from design/) |
| `rules/harkly-constitution.md` | Harkly project constitution |

### 5.3 `development/contexter/` — RAG-as-a-Service

| Directory | Description |
|---|---|
| `src/` | Hono + CF Workers. 39 TypeScript files |
| `src/routes/` | 8 routes: upload, query, status, auth, dev, mcp, mcp-remote, health |
| `src/services/` | Core services: parsers (5 files), chunker (6 files), embedder (2), vectorstore (5), rag (4), mcp (3), pipeline, auth |
| `src/db/schema.ts` | Drizzle schema |
| `src/types/env.ts` | Environment types |
| `tests/` | Unit tests (128 tests) |
| `e2e/` | Playwright E2E tests |
| `mcp-bridge/` | stdio bridge for Claude Desktop |
| `drizzle/` | Migration files |
| `brand/` | Contexter brand assets |
| `memory/` | L1/L2/L3, chronicle, scratch |
| `.wrangler/` | Wrangler state + temp bundles |
| `.dev.vars` | Dev environment variables |
| `.gitignore` | Contexter-specific ignores |

**Deployed:** `contexter.nopoint.workers.dev` | GitHub: `nopointt/contexter`
**CF Resources:** D1 (contexter-db), R2 (contexter-files), KV, Vectorize (1024-dim)

---

## 6. `docs/`
> Documentation hub — Diátaxis framework (tutorials, how-to, reference, explanation)

### 6.1 Root docs

| File | Description |
|---|---|
| `README.md` | Diátaxis framework overview, ADR policy, docs-as-code workflow |
| `agent-system-architecture.md` | Agent system architecture |
| `disk-cleanup-guide.md` | Disk cleanup guide |
| `workspace-consciousness/` | Workspace consciousness architecture docs |
| `assets/system_projecting_mode.md` | System projecting mode |
| `templates/` | Document templates |
| `time oracle/` | Time oracle docs |

### 6.2 `docs/ecosystem-noadmin/` — Workspace-level docs

| Path | Description |
|---|---|
| `adr/001-use-git-context.md` | ADR: Use git for context |
| `adr/002-rust-for-mcp.md` | ADR: Rust for MCP servers |
| `adr/003-tlos-network-isolation.md` | ADR: Network isolation |
| `explanation/comet-assistant-capabilities.md` | Comet capabilities |
| `explanation/owasp-llm-security-audit.md` | OWASP LLM security audit |
| `how-to/create-new-agent.md` | How to create a new agent |
| `reference/` | Empty (planned) |

### 6.3 `docs/harkly/` — Harkly docs

| Subdirectory | Description |
|---|---|
| `README.md` | Harkly docs overview |
| `brand/` | Brand mythology, Harkly.md, enemy.md, framework.md, hero.md, instagram_str1.md |
| `economics/` | Financial models. Python scripts: calc, gen_doc, model, server. Results, scenarios, simulations. README + TESTS |
| `archive/` | Archived roadmap (ProxyMarket) |
| `adr/` | Harkly ADRs |
| `explanation/` | Explanatory docs |
| `experiments/` | Experiment logs |
| `how-to-guides/` | How-to guides |
| `reference/` | Reference docs |
| `research/` | Research docs |
| `specs/` | Specifications |
| `tutorials/` | Tutorials |

### 6.4 `docs/tLOS/` — tLOS docs (has own `.git`)

| Subdirectory | Description |
|---|---|
| `BB-framework/` | Business/Brand framework (+old/) |
| `MCB/` | Marketing Command Board docs |
| `audit/criteria/` + `audit/reports/` | Audit criteria and reports |
| `design/bauhaus-code/` | **107 Bauhaus extraction files** (~1.2M tokens). Batches from 14 books + 20 Zeitschrift issues |
| `docs/brand/` | Brand docs |
| `docs/product/` | Product docs |
| `docs/technical/` | Technical docs |
| `explanation/` | Explanatory docs |
| `how-to-guides/` | How-to guides |
| `reference/api/` | API reference |
| `reference/smart-contracts/` | Smart contract reference |
| `research/` | tLOS-specific research |
| `scripts/` | Utility scripts |
| `tutorials/` | Tutorial docs |

### 6.5 `docs/research/` — Cross-project research

| Category | Files | Description |
|---|---|---|
| Harkly research | 5 | harkly-research-{github, github-api, mcp-access, products, stack} |
| Harkly eval | 4 | harkly-eval-{mcp-auth, rag-pipeline, schema-extract, ui-canvas} |
| Harkly MVP | 5 | harkly-mvp-{api-spec, architecture, build-plan, copy-map, data-model} |
| Design research | 6 | design-{code-structure, handoff, system-architecture, system-file-structures, ai-workflow-figma, framing-frameworks} |
| Bauhaus research | 4 | bauhaus-{extraction-methodology, guidelines-structure, rag-plan, rag-kb} |
| LLM/AI research | 4 | llm-{context-compression, external-api, local-integration}, claude-{max-usage-limits, usage-api-tools} |
| Harkly F1 research | 6 | f1-{audience-sources, connector-ux, osint-collection, pm-sources, query-planning, research-planning} |
| Marketing research | 3 | {content-autopublishing, tov-best-practices, post-writing} |
| OSINT research | 1 | osint-content-research-methodology |
| Nomos research | 2 | nomos-{legal-kz, instruments-kz} |
| Other research | 4 | synthetic-persona, notebooklm, harkly-quality-gate, vscode-{extension, monitor} |
| `_eval/` | 14 dirs | Library evaluations: ai-rag-crawler, better-auth-cloudflare, cloudflare-rag, documind, instructor-js, l1m, mcp-ts-template, openai-sdk-knowledge-org, quantum, sift-kg, solid-flow, solid-pages, workers-mcp, workers-oauth-provider |
| `anthropic-intelligence/` | 7 files | AIA knowledge base: persona, models 4x, claude-code, api-sdk, how-it-works, company + feed + alerts |
| `bauhaus-2026/` | 2 files | Bauhaus 1919 vs 2026 structural analogy, emergent intelligence |
| `open-apis/` | 4 files | Open API index, public-apis-relevant, scraping-apis, scrapling-library |
| `public-apis/` | GitHub repo clone | Public APIs directory (has own .git) |

### 6.6 `docs/contexter/`

| File | Description |
|---|---|
| `cjm-microservices-map.md` | CJM microservices architecture |
| `design-identity.md` | Design identity |
| `stack-compatibility-research.md` | Stack compatibility research |
| `stack.md` | Stack overview |

---

## 7. `finance/`
> Personal finance project (Nomos)

### 7.1 `finance/nomos/`

| Path | Description |
|---|---|
| `memory/nomos-about.md` (L1) | Project identity: crypto investment, blocked accounts, KZ legal context, 75K KZT/mo |
| `memory/nomos-roadmap.md` (L2) | Roadmap |
| `memory/nomos-phase1.md` (L3) | Phase 1 — Setup & First Buy |
| `memory/scratches/21a40d46+0-scratch.md` | Session scratch |
| `memory/chronicle/` | Chronicle: index, nomos-current |
| `knowledge/` | Empty (.gitkeep) — planned RAG corpus |
| `portfolio/` | Empty (.gitkeep) — planned portfolio DB |
| `strategies/` | Empty (.gitkeep) — planned trading strategies |

---

## 8. `knowledge/`
> Source corpus for RAG and persona agents

### 8.1 `knowledge/bauhaus-books/`
> 14 Bauhaus school PDFs (1925-1930) + Zeitschrift (14 issues, 20 batches). ~1.16 GB total.

| Content | Count |
|---|---|
| PDFs (books) | 14 (Gropius, Klee, Meyer, Buehne, Mondrian, Van Doesburg, Moholy-Nagy ×2, Kandinsky, Oud, Malewitsch, Gleizes) |
| Zeitschrift issues | 14 issues in `zeitschrift/` |
| Text extractions | `11_malevich_text.txt`, `08_mfp_output.txt` |
| Enriched figures | `enriched_figures/book-01/` (PNG images) |
| Temp processing dirs | `tmp_malevich_b04/`, `tmp_oud_b05/`, `tmp_vma_batch/`, `tmp_vma_phase0/` |
| `catalog.md` | Book catalog |
| `download.sh` | Download script |

### 8.2 `knowledge/persona-corpus/`
> Primary source texts for CX Designer personas

| Persona | Files |
|---|---|
| `jobs/` | Steve Jobs: biography PDF, Stanford speech, Playboy interview, D8 conference, Thoughts on Flash, WWDC 1997, character_card.md, identity_kg.json |
| `gropius/` | Walter Gropius: Bauhaus manifesto 1919, New Architecture 1935, Theory of Organization 1923 |
| `kandinsky/` | Wassily Kandinsky: Concerning the Spiritual (EN), Über das Geistige (DE), Sounds 1913 |
| `klee/` | Paul Klee: Diaries 1898-1918, Thinking Eye vol.1, Nature of Nature vol.2 |
| `malevich/` | Kazimir Malevich: Cubism to Suprematism 1915, Non-Objective World 1959, Suprematism 34 Drawings (RU) |
| `moholy/` | László Moholy-Nagy: New Vision 1928, Vision in Motion 1947 |
| `schlemmer/` | Oskar Schlemmer: Theater of Bauhaus |
| Root | `manifest.json`, `download_corpus.py`, `run.sh`, `state.json` |

---

## 9. `marketing/`
> Harkly marketing domain

| Path | Description |
|---|---|
| `INDEX.md` | Marketing domain index — branding, copywriting, campaigns, SEO, research, pipeline agents |
| `branding/tov.md` | Tone of Voice v2 |
| `copywriting/agents/audience_analysis.py` | Audience analysis agent |
| `copywriting/agents/channel_collector.py` | Channel collector agent (7 channels, 105 posts) |
| `copywriting/channels/` | audience-portrait, audience-speaking-style, telegram-content-strategy, telegram-persona |
| `copywriting/research/audience-analysis/` | 12 analyzed Telegram channels |
| `copywriting/research/relevant_posts.txt` | Relevant posts |
| `copywriting/research/telegram-channel-samples.json` | Telegram samples |

---

## 10. `memory/`
> Global workspace memory

| File | Description |
|---|---|
| `current-context-global.md` | **Workspace state**: active epics, closed epics, global state table, blockers, token budget. Last updated 2026-03-10 |
| `semantic-context-global.md` | **Entity store** (YAML): nospace_Workspace, tLOS_Project, harkly_Project, nopoint, Artem. RAG-ready |
| `episodic-context-global.md` | **Episodic events log** (large file — 13K+ tokens). Amendment proposals, decisions |
| `handshake.md` | Session handshake (deprecated). Last: 2026-03-10. Critical items: .env encryption, Gemini key, SQL migrations |
| `handshake-assistant.md` | Comet operative context |

---

## 11. `private_knowledge/`
> Secrets and credentials. Gitignored paths.

| Path | Description |
|---|---|
| `context/current/active-sessions.json` | Active session tracking |
| `context/longterm/cloudflare-root.env` | Cloudflare credentials |
| `context/longterm/neon-db-master.env` | Neon DB credentials |
| `context/longterm/web3-seed-phrases.enc` | Encrypted seed phrases |
| `policies/approval-matrix.yaml` | Approval matrix for destructive actions |

---

## 12. `production/`
> Production deployment configs

### 12.1 `production/tLOS/`

| File | Description |
|---|---|
| `deploy.sh` | Deploy script |
| `wrangler.toml` | Cloudflare Wrangler config |
| `monitoring/p2p-health-rules.yaml` | P2P health monitoring rules |
| `pipelines/build-protocol.md` | Build protocol |
| `pipelines/compiler-loop-config.yaml` | Compiler loop config |
| `pipelines/gitops-pull.md` | GitOps pull protocol |

---

## 13. `requirements/`
> Empty directory (planned for requirements specs)

---

## 14. `research/`
> Independent research projects

| Directory | Description |
|---|---|
| `2026-02-graph-databases/` | Graph DB research: hypothesis, literature, results, conclusion |
| `2026-02-harkly-horizons/` | Harkly horizons README |
| `2026-02-synthetic-consumers-silicon-sampling/` | Synthetic consumers / silicon sampling README |

---

## 15. `rules/`
> Workspace governance — constitution + regulations

### 15.1 `rules/global-constitution.md`
> **Supreme law**. 8 sections: Philosophy, Economic Principles, Execution Standards, Agent Conduct, Quality Threshold, Rules Hierarchy, Agent Ecosystem, Amendment Process.

### 15.2 `rules/regulations/` (15 regulations)

| Regulation | Description |
|---|---|
| `rbac-regulation.md` | Role-Based Access Control — permissions per agent role |
| `agent-conduct-regulation.md` | Agent behavior rules |
| `agent-identity-regulation.md` | Agent identity and signing |
| `agent-onboarding-regulation.md` | Pre-flight checklist for new agents |
| `api-gateway-regulation.md` | External API access rules |
| `claude-agent-orchestration-regulation.md` | How Claude works with agents |
| `code-style-regulation.md` | Code style rules |
| `context-economy-regulation.md` | Token efficiency, context limits |
| `file-size-regulation.md` | File size limits |
| `git-regulation.md` | Git workflow rules |
| `mas-architecture-regulation.md` | Multi-Agent System architecture |
| `memory-regulation.md` | Memory system rules |
| `naming-regulation.md` | File/directory naming rules |
| `task-management-regulation.md` | Task lifecycle rules |
| `vector-search-regulation.md` | Vector/RAG system rules |

### 15.3 `rules/position-descriptions/` (9 PDs)

| File | Description |
|---|---|
| `assistant-pd.md` | Assistant Agent position description |
| `cto-pd.md` | CTO Agent PD |
| `devops-lead-pd.md` | DevOps Lead PD |
| `qa-lead-pd.md` | QA Lead PD |
| `reviewer-agent-pd.md` | Reviewer Agent PD |
| `senior-architect-jd.md` | Senior Architect JD (job description format) |
| `senior-architect-pd.md` | Senior Architect PD |
| `sre-lead-pd.md` | SRE Lead PD |
| `tech-lead-pd.md` | Tech Lead PD |

---

## 16. `temp/`
> Temporary files. Gitignored.

| File | Description |
|---|---|
| `tg_audit.txt` | Telegram audit output |
| `tg_sample.txt` | Telegram sample data |

---

## 17. `tools/`
> Utilities, MCP servers, scrapers, references

### 17.1 `tools/agent-monitor/`
> Agent monitoring dashboard

| File | Description |
|---|---|
| `dashboard.html` | HTML dashboard |
| `server.js` | Node.js server |
| `package.json` | Dependencies |
| `run-gemini.cmd`, `run-opencode.cmd`, `run-qwen.cmd`, `start.cmd` | Launch scripts (deprecated CLI agents) |
| `g3-plan/` | G3 plans and todos |
| `logs/qwen.log` | Agent log |

### 17.2 `tools/api-schemas/`
> API schema files (empty or minimal)

### 17.3 `tools/auth-gates/`
> Authorization router for destructive actions

| File | Description |
|---|---|
| `approval-router.ts` | TypeScript approval router |

### 17.4 `tools/awesome-claude-subagents/`
> Claude Code subagent catalog (has own .git)

| Path | Description |
|---|---|
| `CLAUDE.md` | Repo instructions |
| `README.md` | Overview |
| `CONTRIBUTING.md` | Contribution guide |
| `categories/01-core-development/` | Core dev agents: api-designer, backend-developer, electron-pro |
| `.claude-plugin/marketplace.json` | Plugin marketplace |

### 17.5 `tools/linkedin-scraper/`
> LinkedIn scraping tool

| File | Description |
|---|---|
| `scrape.ts`, `index.ts`, `test.ts` | Scraper code (Bun/TS) |
| `linkedin-results.json`, `linkedin-results-filtered.json` | Scraping results |

### 17.6 `tools/mcp-servers/`
> MCP server implementations

| Path | Description |
|---|---|
| `cargo-mcp-rust/mcp-manifest.json` | Rust MCP server manifest |
| `github-mcp/` | GitHub MCP server |
| `neon-db-mcp/` | Neon DB MCP server |
| `web3-dstorage-mcp/` | Web3 decentralized storage MCP |
| `query-codebase.json` | Codebase query config |

### 17.7 `tools/opcode/`
> OpCode — Tauri-based code editor (has own .git)

| Path | Description |
|---|---|
| `src/`, `src-tauri/` | Vite + Tauri source |
| `cc_agents/` | Claude Code agents: git-commit-bot, security-scanner, unit-tests-bot |
| `scripts/`, `dist/` | Build scripts and output |
| `web_server.design.md` | Web server design doc |

### 17.8 `tools/oss-reference/`
> Open-source reference projects (cloned repos)

| Repo | Description |
|---|---|
| `OpenHands/` | OpenHands AI agent framework |
| `assistant-ui/` | Assistant UI component library |
| `letta/` | Letta (ex-MemGPT) — self-hosted memory |

### 17.9 `tools/reddit-scraper/`
> Reddit scraping tool

| File | Description |
|---|---|
| `scrape.ts`, `search-prompts.ts` | Scraper code |
| `reddit-results.json`, `prompt-research-results.json` | Results |

### 17.10 `tools/sandboxes/`
> Isolated execution environments

| Path | Description |
|---|---|
| `node-drizzle-env/` | Node + Drizzle sandbox |
| `rust-compiler-env/seccomp-profile.json` | Rust compiler sandbox with seccomp |

### 17.11 `tools/scripts/`
> Utility scripts (directory exists, contents vary)

### 17.12 `tools/superpowers/`
> Claude Code superpowers plugin (has own .git)

| Path | Description |
|---|---|
| `README.md`, `RELEASE-NOTES.md` | Docs |
| `agents/code-reviewer.md` | Code reviewer agent |
| `commands/` | brainstorm, execute-plan, write-plan |
| `hooks/hooks.json` | Hook definitions |
| `skills/` | Skill definitions |
| `docs/` | Plugin docs (Codex, OpenCode, testing) |
| `.claude-plugin/`, `.cursor-plugin/` | Plugin manifests |
| `GEMINI.md`, `gemini-extension.json` | Gemini extension |

### 17.13 `tools/token-counter/`
> Token usage counter (Bun/TS)

| File | Description |
|---|---|
| `count.ts` | Main counter — `--today`, `--days N`, `--last5h`, `--watch` |
| `caps-poller.ts` | Rate limit caps poller |
| `data/` | Counter data |

### 17.14 `tools/vscode-claude-monitor/`
> VSCode extension for Claude usage monitoring

| File | Description |
|---|---|
| `src/extension.ts` | Extension source |
| `out/extension.js` | Compiled output |
| `package.json` | Extension manifest |

### 17.15 `tools/web-fetch/`
> Web fetch utility

| File | Description |
|---|---|
| `web-sources.json` | Web source definitions |

---

## 18. `admin/` ← NEW
> Workspace administration domain. Created 2026-03-22.
> This index lives here.

---

## Cross-Reference: Project Matrix

| Project | Code | Design | Memory | Docs | Research | Production | Brand |
|---|---|---|---|---|---|---|---|
| **tLOS** | `development/tLOS/core/` | `design/design_system/` + `design/tlos-ui.pen` | `development/tLOS/memory/` | `docs/tLOS/` | `docs/research/bauhaus-*` + `research/` | `production/tLOS/` | `docs/tLOS/docs/brand/` |
| **Harkly** | `development/harkly/{harkly-shell,harkly-web,cx-platform}/` | `design/harkly/` | `development/harkly/memory/` | `docs/harkly/` | `docs/research/harkly-*` + `docs/research/f1-*` | — | `development/harkly/brand/` + `marketing/` |
| **Contexter** | `development/contexter/src/` | `design/contexter/` | `development/contexter/memory/` | `docs/contexter/` | `docs/research/harkly-eval-*` | — | `development/contexter/brand/` |
| **Nomos** | — | — | `finance/nomos/memory/` | — | `docs/research/nomos-*` | — | — |

## Cross-Reference: Agent System

| Agent | Level | Identity File | Session Skill |
|---|---|---|---|
| nopoint | L0 | — (human) | — |
| Axis | L1 | `~/.claude/projects/*/memory/user_eidolon_identity.md` | `/startaxis` |
| Logos | L1 | same | `/startlogos` |
| Satoshi | L1 | same | `/startsatoshi` |
| Comet | L1 | `agents/comet/L0-identity.md` | `/startgsession` |
| Domain Lead | L2 | `agents/domain-lead/INSTRUCTION.md` | via Agent tool |
| Eidolon{hash} | ephemeral | `~/.tlos/eidolons.json` | via Agent tool |

## Cross-Reference: Memory Layers

| Layer | Global | tLOS | Harkly | Contexter | Nomos |
|---|---|---|---|---|---|
| L0 (frozen) | `~/.claude/CLAUDE.md` + `MEMORY.md` | — | — | — | — |
| L1 (slow) | `memory/current-context-global.md` | `tlos-about.md` | `harkly-about.md` | `contexter-about.md` | `nomos-about.md` |
| L2 (medium) | `memory/semantic-context-global.md` | `tlos-roadmap.md` | `harkly-roadmap.md` | `contexter-roadmap.md` | `nomos-roadmap.md` |
| L3 (fast) | — | `tlos-phase15.md` | `harkly-mvp-data-layer.md` | `contexter-mvp.md` | `nomos-phase1.md` |
| L4 (ephemeral) | — | `scratches/*.md` | `session+N-scratch.md` | `session-scratch.md` | `scratches/*.md` |
| Chronicle | — | `chronicle/tlos-current.md` | `chronicle/harkly-current.md` | `chronicle/` | `chronicle/nomos-current.md` |

## Stats Summary

| Metric | Value |
|---|---|
| Top-level dirs | 18 (incl. .archive, admin) |
| Projects | 4 (tLOS, Harkly, Contexter, Nomos) |
| Total MD files | ~473K lines |
| Regulations | 15 |
| Position descriptions | 9 |
| ADRs | 9 (3 ecosystem + 6 tLOS) |
| Bauhaus PDFs | 14 books + 14 Zeitschrift issues |
| Persona corpus PDFs | 16 PDFs across 7 personas |
| Design system files | 43 (tLOS) + 18 (Harkly) + 14 (Contexter) |
| Design tokens (JSON) | 13 |
| Research files | ~50 |
| Library evaluations | 14 |
| tLOS kernel services | 15 Rust/Python services |
| Harkly code projects | 5 (shell, web, saas, cx-platform, astro) |
| Contexter TS files | 39 |
| Tools directories | 15 |
| MCP servers | 4 |
| Session scratches (all projects) | ~25+ |

---

## Observations for Restructuring

> Added 2026-03-22 by Axis during global restructuring pass.

### Issues Found

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Empty agent directories** | `agents/cto/`, `agents/devops-lead/`, `agents/frontend-engineer/`, `agents/qa-lead/`, `agents/research-assistant/`, `agents/reviewer-agent/`, `agents/senior-architect/`, `agents/sre-lead/`, `agents/tech-lead/` | Low — role defs live in `rules/position-descriptions/`, these are stubs |
| 2 | **`requirements/` is empty** | `requirements/` | Low — unused, candidate for removal |
| 3 | **`data/` is empty** | `data/` | Low — gitignored runtime dir, could remove from tree |
| 4 | **Duplicate brand content** | `docs/harkly/brand/` vs `development/harkly/brand/` | Medium — two locations for Harkly brand docs |
| 5 | **Deprecated CLI agent dirs** | `core/glmcode/`, `core/kimicode/`, `core/.qwen/`, `core/.opencode/` | Medium — should be archived to `.archive/` |
| 6 | **Nested development artifact** | `development/tLOS/development/tLOS/` | Low — stale recursive dir |
| 7 | **Multiple separate .git repos** | `tLOS/core/`, `harkly-saas/`, `astro-theme/`, `tailgrids/`, `docs/tLOS/`, `public-apis/` | High — unclear if submodules or orphaned repos |
| 8 | **Scratch file accumulation** | Harkly: 16 session scratches, tLOS: 6 | Medium — need archival pass |
| 9 | **Large inflated file counts** | `tools/awesome-claude-subagents/` (external repo), `tools/oss-reference/` (3 cloned repos) | Low — awareness only |
| 10 | **Handshake files deprecated but present** | `memory/handshake.md`, `memory/handshake-assistant.md`, per-project handshakes | Low — per MEMORY.md feedback: scratches only |
| 11 | **marketing/ only for Harkly** | `marketing/` | Low — naming suggests cross-project but content is Harkly-only |
| 12 | **No admin/ existed before** | `admin/` | Fixed — created this session |
| 13 | **docs/research/ is catch-all** | 50+ files across 4 projects + cross-cutting | Medium — needs domain-based reorganization |
| 14 | **No Contexter or Nomos in production/** | `production/` only has tLOS | Low — those projects are pre-production |
| 15 | **Stale global memory** | `memory/current-context-global.md` last updated 2026-03-10 | Medium — 12 days stale |

### Restructuring Priorities

1. **P0 — Clarify .git repos** (#7): determine which are submodules vs orphaned, consolidate if needed
2. **P1 — Archive deprecated** (#5): move glmcode/kimicode/.qwen/.opencode to `.archive/`
3. **P1 — Clean brand duplication** (#4): single source of truth for Harkly brand
4. **P1 — Archive scratches** (#8): run archival pass on accumulated session scratches
5. **P2 — Research reorganization** (#13): move project-specific research into project dirs
6. **P2 — Update stale memory** (#15): refresh global memory files
7. **P3 — Remove empty dirs** (#1, #2, #3): clean up stubs or convert to `.gitkeep` with purpose
8. **P3 — Fix nested artifact** (#6): remove or flatten `development/tLOS/development/tLOS/`
