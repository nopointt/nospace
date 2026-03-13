---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-13 (checkpoint 59 — Phase 9 Shell Expansion COMPLETE — Steps 9.1-9.4 ALL DONE)
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — `mcb` команда починена (viewport reset); ждём API доступы Артёма |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |
| epic-nim-v1 | nim-v1 | NIM AI Bridge — NVIDIA NIM HTTP SSE интеграция | **SHIPPED** — agent-bridge переписан, Omnibar → NIM → token stream работает |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand system зафиксирована, сайт в разработке |
| epic-eidolon-v1 | omnibar | Claude Code integration as Eidolon AI backend | **OPEN** — session persistence fix + context summarization + mcb fix shipped |
| epic-workspace-v1 | workspace-v1 | Организация рабочего пространства nopoint + Артём | **OPEN** — sessions-map.md создан, 3 трека (A: Omnibar v2, B: BB Floors, C: Infra) |
| epic-docker-v1 | docker-v1 | Dockerization D1–D6 — Always-On Kernel | **CLOSED** — merged → main (session 15) |
| epic-l2-step5 | — | L2 Step 5 — Agent Frames (agent-status, memory-viewer, g3-session) | **DONE** — shipped session 15 |
| epic-l3-agents | l3-agents | L3 Agent Hierarchy — Chief/Lead/Senior nodes in LangGraph | **DONE** — Steps 6+7+8+9 COMPLETE |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | **Roadmap v5 Phase 9 COMPLETE.** Steps 9.1-9.4 ALL DONE. **Phase 8 COMPLETE. Phase 7 COMPLETE. Phase 6 E2E: ALL PASS. Prod-Ready Plan: Phases 0-5 COMPLETE (5.1 BLOCKED).** Roadmap v5 FULLY COMPLETE (Phases 6-9). | 2026-03-13 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid.ps1 run` | 2026-03-10 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| claude_bridge | tlos-claude-bridge — FULL: XML memory, microagents, stable sessionId, context compaction + Letta + domain memory (pg+liteLLM) | 2026-03-10 |
| langgraph_bridge | tlos-langgraph-bridge — Python service: NATS → LangGraph. Graphs: direct + Chief(5 domains) + Lead(11 roles) + Special(6 domains) + **Дирижёр** + G3 cyclic subgraph. Memory: `global_memory.py`, `project_memory.py`, `special_memory.py`, `chief_comm.py`, `letta_shared.py`, `continuum.py`, `domain_config.py`, `memory_edges.py`. **Comms: `agent_comm.py` (generalized inter-agent messaging, pg `agent_messages` table), `comm_rules.yaml` (17 pairs communication matrix).** Services: `samurizator.py` (hybrid compaction + **Phase 7.1 scheduler: 6h periodic + episode_end triggers**), `regulator.py` (rules engine + YAML + communication + **procedural** validation, 13 rules, escalation_rules.yaml integration), **`debug_service.py` (meta-service "медики": diagnose + predict_risks + analyze_trends, pg `debug_diagnoses` table, auto-diagnose in trace.py)**. Resilience: `timeout_config.py` (timeouts: 180s/call, 420s/chain, 600s/multi, 900s/complex), `checkpointer.py` (PostgresSaver + thread_id config), retry wrapper, double-texting queue. **Phase 7 Automation: (7.1) Samurizator scheduler 6h + episode_end triggers, (7.2) auto episode boundaries (task + g3_session), (7.3) G3 escalation propagation (agent:g3:escalation), (7.4) NATS agent:special:run canonical + agent:senior:run legacy. Phase 8 Agent Comms: (8.1) Chief parallel dispatch (ThreadPoolExecutor), (8.2) Exchange round (_chief_exchange_call + _dispatch_chiefs_exchange_round, parallel, audit trail via chief_comm), (8.3) Cross-domain coordination wired into dirizhyor_router_node.** Docker rebuilt 2026-03-13. | 2026-03-13 |
| dirizhyor_node | **DONE (Step 2.1) + E2E VALIDATED.** Full chain Дирижёр→Chief tested (312.7s). Fixes applied: `--strict-mcp-config` (no MCP overhead), `_extract_json()` (code fence stripping), Claude CLI auth via volume mount. NATS subject: `agent:dirizhyor:run`. | 2026-03-13 |
| agent_flow_optimization | **PLAN APPROVED** — `docs/agent-flow-optimization-plan.md` (original 5 mechanisms). **SUPERSEDED by** `docs/agent-system-prod-ready-plan.md` — full production-ready plan (6 phases, gap analysis, model routing, 8 new files, 15+ industry sources). Phase 0 (Observability) = first priority. | 2026-03-13 |
| prod_ready_plan | **ALL PHASES COMPLETE (0-5, 5.1 BLOCKED)** — `docs/agent-system-prod-ready-plan.md`. Done: (0) Observability, (1) Speed, (2) Quality, (3) Cost, (4) Resilience, (5.2) Horizontal Comms, (5.3) Debug Service, (5.4) Procedural Regulations — regulator.py procedural checks + escalation_rules.yaml integration. **5.1 BLOCKED** (no API key, permanent). Plan fully executed. | 2026-03-13 |
| claude_cli_fixes | **3 fixes applied to graph.py:** (1) `--strict-mcp-config` + empty mcpServers — eliminates MCP server startup (Figma etc.) inside Docker. (2) `_extract_json()` — strips markdown code fences from LLM JSON output. (3) plain `--print` instead of `--output-format stream-json`. Claude CLI auth: volume mount `~/.claude:/root/.claude:ro`. | 2026-03-13 |
| debug_service | **DONE (Phase 5.3)** — `debug_service.py` (NEW): meta-service "медики". pg table `debug_diagnoses` (trace_id, error_signature, diagnosis, suggested_resolution, known_bug_id, blast_radius, status). 6 functions: `diagnose()` (Bug KB first → LLM fallback), `predict_risks()` (Bug KB history + LLM), `analyze_trends()` (7-day trends → global_memory), `get_recent_diagnoses()`, `mark_resolved()`, `get_diagnosis_summary()`. Auto-diagnose in `trace.py` (fire-and-forget on empty CLI response). NATS: `agent:debug:diagnose/predict/analyze`. Bridge handlers: 3 async handlers in bridge_handler.py. NEVER raises. Docker verified: diagnose (new+known bug), predict_risks (5 risks), analyze_trends (3 insights → global_memory). | 2026-03-13 |
| global_memory | **DONE (Step 3.1)** — global_memory.py: pg table `global_memory` with Continuum layers (frozen/slow/medium/fast/operational). API: read_global_context, write_global_fact, update_global_fact, read_global_summary. NEVER raises. Integrated into Дирижёр node. | 2026-03-13 |
| chief_comm | **DONE (Step 2.2)** — chief_comm.py: pg table `chief_messages` (from_chief, to_chief, subject, content, status). API: send_message, read_inbox, read_inbox_summary, mark_archived, get_thread. Integrated into chief_development_node (reads inbox). NEVER raises. | 2026-03-13 |
| project_memory | **DONE (Step 3.2)** — project_memory.py: pg table `project_memory` (domain, layer, category, content). API: read_project_context, write_project_fact, update_project_fact, read_project_summary, list_domains. Per-domain + 5 Continuum layers. Integrated into lead_frontend/backend_node. NEVER raises. | 2026-03-13 |
| l3_step6 | **DONE** — Chief/Development node. G3 session (Coach+Player subagents). Files: graph.py (ChiefDevState, chief_development_node, chief_worker_node, build_chief_graph), bridge_handler.py (get_chief_graph, handle_chief_run), bridge.py (agent:chief:run). build_graph() unchanged, no regressions. Branch: l3-agents/spec.md. | 2026-03-11 |
| l3_step7 | **DONE** — Lead/Frontend + Lead/Backend nodes. G3 Quality Sprint format (Orchestrator spec → Coach research → Player backend-developer → Coach verified). Files: graph.py (LeadState, lead_frontend_node, lead_backend_node, lead_worker_node, build_lead_graph), bridge_handler.py (_lead_graphs singleton, get_lead_graph, handle_lead_run), bridge.py (agent:lead:run). All AC-1..AC-8 PASS. | 2026-03-11 |
| agent_workflow | **Domain Lead + G3 = default work mode.** Orchestrator (Clarify loop → Formalize → Anticipate) → Domain Lead (isolated, reads domain files, writes spec) → G3 pair (Player + Coach, isolated, see only spec, don't see each other). CLI agents DEPRECATED. CLAUDE.md updated. Domain Lead instruction: `nospace/agents/domain-lead/INSTRUCTION.md`. Methodology: obra/superpowers (writing-plans + subagent-driven-development). | 2026-03-11 |
| rules_conflicts | **FIXED.** `~/.claude/rules/agents.md` — переписан: Domain Lead + G3 workflow, таблица доменов, параллельные лиды. `~/.claude/rules/testing.md` — переписан: verification steps вместо TDD 80%, Coach protocol, AC table format. `~/.claude/rules/performance.md` — обновлён: Player = Sonnet явно, Haiku только для утилитных агентов. | 2026-03-11 |
| claude_md_workflow | **HARDENED.** CLAUDE.md: (1) Контекст разделён — Orchestrator проактивен, субагенты строго по спеке. (2) Formalize ≠ Spec — 5-строчный триггер. (3) Hand off → Decompose + параллельные Domain Lead-ы. (4) Subagent escalation protocol. | 2026-03-11 |
| l3_step8 | **DONE** — Senior нода + Special memory. graph.py: SeniorState + senior_frontend_node + senior_backend_node + build_senior_graph. special_memory.py (NEW): pg table `special_memory_facts`, create_table + write_spec + read_context. bridge_handler.py: _senior_graphs singleton + handle_senior_run. bridge.py: agent:senior:run. pyproject.toml: psycopg2-binary>=2.9. uv.lock: auto-updated. docker-compose.yml: DB env vars → langgraph-bridge. Docker rebuild PENDING. | 2026-03-11 |
| l3_step9 | **DONE** — Shared Letta memory blocks между нодами домена. letta_shared.py (NEW): per-domain singleton Letta-агент (tlos-domain-{domain}), read_domain_context + write_domain_context + append_domain_context, NEVER raises, graceful Letta-DOWN degradation. graph.py: lead_frontend/backend читают + пишут DOMAIN HISTORY; senior_frontend/backend читают. docker-compose.yml: LETTA_URL=http://letta:8283 + depends_on:letta → langgraph-bridge. pyproject.toml: requests>=2.32. AC-1..AC-13: 13/13 PASS. Docker rebuild PENDING. | 2026-03-11 |
| docker_v1_remote | **DELETED** — `git push origin --delete docker-v1`. Remote branch docker-v1 removed. Only origin/main remains. | 2026-03-11 |
| roadmap_v4 | **Roadmap v4 WRITTEN** — `docs/agent-system-architecture.md` полностью перестроен. 6 фаз: Phase 0 (L3 Deploy ✅), Phase 1 (Quality Sprint — IN PROGRESS), Phase 2 (Agent Evolution), Phase 3 (Continuum Memory ‖ Phase 2), Phase 4 (Services), Phase 5 (Shell Evolution ‖ Phase 4). Parallelism map included. | 2026-03-12 |
| quality_sprint | **9/9 TRACKS COMPLETE.** Tracks 1-5,7-9 shipped (Phase A+B+C). **Track 6 (Product Debt) DONE** — 44 features audited: 27 full, 9 partial, 8 not started, 0 divergent. Top gaps fed into Roadmap v5. | 2026-03-13 |
| l3_deploy | **Phase 0+2+3+4 ALL DONE** — Docker rebuilt 6x (2026-03-13). 11/11 services UP. All 13 steps deployed. | 2026-03-13 |
| samurizator | **DONE (Step 4.1+4.2)** — `samurizator.py` (NEW): hybrid compaction service. Extractive (Operational→Fast: top-N by access_count) + LLM via liteLLM (Fast→Medium, Medium→Slow). Frozen proposals table (human review only). Cross-domain extraction (Project→Global). Triggers: episode_end, schedule, frozen, project_to_global. NATS: `agent:samurizator:run`. `bridge_handler.py`: handle_samurizator_run. NEVER raises. | 2026-03-13 |
| regulator | **DONE (Step 4.3+4.4 + Phase 5.2 comm + Phase 5.4 procedural)** — `regulator.py` + `regulator_rules.yaml`: real-time rules engine. **13 YAML rules** (2 naming, 1 scope, 1 workflow, 2 rate_limit, 2 communication, **5 procedural**). Procedural: blast_radius enforcement, escalation_required, g3_iteration_limit, level_skip_prevention, worker_autonomy. Uses `escalation_rules.yaml` for level parameters. In-memory rate limiting. pg violations table. Hot-reload via `agent:regulator:reload`. NATS: `agent:regulator:check`, `agent:regulator:violation`. NEVER raises. | 2026-03-13 |
| agent_comm | **DONE (Phase 5.2)** — `agent_comm.py` (NEW): generalized inter-agent messaging for ALL hierarchy levels. pg table `agent_messages` (from_agent, to_agent, from_level, to_level, domain, msg_type, subject, content, metadata JSONB, trace_id, status). `comm_rules.yaml` (NEW): 17 communication pairs (11 allowed, 5 forbidden, 1 same-domain-only). Functions: validate_comm, send_message, read_inbox, read_inbox_summary, get_thread, mark_archived. Integrated into Lead+Special nodes (inbox reading), bridge.py (agent:comm:send/inbox NATS handlers), regulator.py (_check_communication). Verified in Docker. NEVER raises. | 2026-03-13 |
| phase5_status | **PHASE 5 COMPLETE.** 5.1 BLOCKED (permanent, no API key). **5.2 DONE** — horizontal comms. **5.3 DONE** — Debug Service. **5.4 DONE** — Procedural Regulations (5 rules: blast_radius, escalation, g3_iter, level_skip, worker_autonomy). 10/10 tests PASS. | 2026-03-13 |
| phase6_e2e | **PHASE 6 COMPLETE.** Steps 6.1-6.4 ALL PASS. 6.1: Дирижёр E2E (312.7s). 6.2a: Chief/Dev (65.7s, 723 chars). 6.2b: Lead/Backend (65.3s, 755 chars). 6.3: Special→G3 cycle (312.7s, 1321 chars). 6.4: Full chain Дирижёр→Chief/Production (565.3s, 6171 chars). Bugs fixed: checkpointer config (thread_id), timeouts (90→180s/call, 120→420s/chain). Docker rebuilt 2x. | 2026-03-13 |
| phase7_automation | **PHASE 7 COMPLETE.** Steps 7.1-7.4 ALL DONE. **(7.1)** Samurizator scheduler: `asyncio.create_task(_samurizator_scheduler)` 6h periodic (global_memory + project_memory per domain + project_to_global), env `SAMURIZATOR_INTERVAL` override. Episode_end triggers in handle_special_run + handle_dirizhyor_run (fire-and-forget). **(7.2)** Auto episode boundaries: `start_episode`/`end_episode` in handle_dirizhyor_run (type=task) + handle_special_run (type=g3_session). **(7.3)** G3 escalation: SpecialState.escalation field, special_node detects iterations>=3 && !passed → handler publishes `agent:g3:escalation` on NATS. **(7.4)** NATS rename: `agent:special:run` canonical + `agent:senior:run` legacy alias (both in _CHAIN_MSG_TYPES). Docker rebuilt + verified. | 2026-03-13 |
| phase8_agent_comms | **PHASE 8 COMPLETE.** Steps 8.1-8.3 ALL DONE. **(8.1)** Chief parallel dispatch — already done (ThreadPoolExecutor + phased execution_order in dirizhyor_router_node). **(8.2)** Exchange round: `_chief_exchange_call()` (lightweight Claude CLI call per Chief, sees other Chiefs' results, returns adjusted or NO_ADJUSTMENT_NEEDED) + `_dispatch_chiefs_exchange_round()` (parallel via ThreadPoolExecutor, persists summaries to chief_comm for audit trail). **(8.3)** Cross-domain coordination: wired into dirizhyor_router_node — collect raw results → exchange if 2+ chiefs → format aggregated. E2E verified: Дирижёр→Dev+Marketing parallel→exchange round (2 chiefs)→aggregated result. Trace: 7 spans, 4920 tokens, 141s. Docker rebuilt + verified 11/11 UP. | 2026-03-13 |
| phase9_shell_expansion | **PHASE 9 COMPLETE.** Steps 9.1-9.4 ALL DONE. **(9.1)** Core Omnibar commands: `help` (HelpFrame — lists all commands), `status` (SystemStatusFrame — kernel health, memory stats, samurizator, regulator), `compact` (action — triggers Samurizator via NATS), `dirizhyor` (DirizhyorFrame — full hierarchy invocation with streaming). **(9.2)** Memory Admin frame: 5 tabs (Global/Domain/Project/Special/Frozen), domain filter, search, Continuum layer badges, frozen proposal approve/reject. **(9.3)** Regulator Log frame: violations list with severity filters (All/Critical/Warning/Info), rule name, agent, domain, timestamp, auto-refresh 30s. **(9.4)** Dynamic frame layouts: `loadExternalLayouts()` from localStorage, `saveExternalLayout()` persistence, `requestKernelLayouts()` NATS hot-reload. Backend: 6 new NATS handlers (kernel:status-full, memory:admin:list/frozen/approve-frozen/reject-frozen, agent:regulator:violations). TypeScript + Vite build clean. Docker rebuilt + verified 11/11 UP. | 2026-03-13 |
| domain_expansion | **DONE (Step 2.3)** — `domain_config.py` (NEW): 5 chiefs + 11 leads as Python dicts. `graph.py`: `_build_chief_node(domain)` + `_build_lead_node(role)` factory functions replace hardcoded per-domain functions. Adding new domains = config only. `bridge_handler.py`: dict singletons for per-domain/role graph caching. | 2026-03-13 |
| continuum_lifecycle | **DONE (Step 3.3)** — `continuum.py` (NEW): LAYER_POLICIES with TTL (frozen=∞, slow=90d, medium=30d, fast=7d, operational=24h), frozen immutability, `expires_at` column. All memory tables upgraded: `global_memory.py`, `project_memory.py`, `special_memory.py`. | 2026-03-13 |
| selective_retention | **DONE (Step 3.4)** — `continuum.py`: `compute_retrieval_boost_sql()` returns SQL expr: layer_weight + ln(1+access_count) + recency_decay. Used in ORDER BY for all read functions. No stored column — computed at query time. | 2026-03-13 |
| temporal_continuity | **DONE (Step 3.5)** — `memory_edges.py` (NEW): pg tables `memory_edges` + `memory_episodes`. API: `add_edge()`, `get_edges_from/to()`, `get_related_facts()` (BFS, max 50), `start/end_episode()`. Same NEVER-raises pattern. | 2026-03-13 |
| domain_memory | **DONE** — pg+pgvector+liteLLM. `domain-memory.js` (переименовано из zep-client.js): direct pg (tlos_facts table, vector(1536), HNSW cosine) + liteLLM embeddings (NIM Matryoshka). Docker: db:5432 (internal), litellm:4000, qdrant:6333. Session 13: connected inside Docker via service names. | 2026-03-10 |
| associative_routing | **DONE** — qdrant-client.js (tlos-global collection, djb2 dedup, cosine search). index.js: searchAssociative per-message → `<associative_context>` block. agent:zep:add_fact syncs to Qdrant. | 2026-03-10 |
| dispatcher | tlos-dispatcher — FIXED (graceful wasm skip, no crash on missing math_worker.wasm) | 2026-03-08 |
| eidolon | Eidolon AI backend LIVE — context summarization, stable sessions, nearLimit compaction, domain context | 2026-03-10 |
| session_continuity | Omnibar: stable `conversationSessionId` per conversation → claude-bridge resumes correctly | 2026-03-10 |
| context_summarization | bridge: nearLimit → summarizeConversation() → new session with `<PREVIOUS_CONTEXT_SUMMARY>` | 2026-03-10 |
| nim_key_path | ~/.tlos/nim-key — ОБНОВЛЁН 2026-03-10 (новый ключ от nopoint) | 2026-03-10 |
| agent_arch_doc | `docs/agent-system-architecture.md` **v5** — Roadmap v5. Phases 0-5 ALL COMPLETE (v4 archive). v5: Phase 6 (E2E Validation), Phase 7 (Automation), Phase 8 (Agent Comms), Phase 9 (Shell Expansion). 14 steps, Phase 6 blocks 7+8+9 which run parallel. | 2026-03-13 |
| phase5_shell | **DONE (Steps 5.1-5.3)** — `intent.ts`: tLOS_Intent entity + helpers. `commandRegistry.ts`: register/get/list/execute. `defaultCommands.ts`: mcb/kernel/g3 via registry. `frameLayouts.ts`: unified layout system (custom/grid/stack/single). `useIntentPipeline.ts`: SolidJS hook (create→parse→route→track). App.tsx: inline commands removed, registry+pipeline wired. OmnibarInput.tsx: autocomplete dropdown. TypeScript compiles clean. | 2026-03-13 |
| product_debt_audit | **DONE (QS Track 6)** — 44 features audited: 27 fully implemented, 9 partial, 8 not started, 0 divergent. P0: E2E test of full hierarchy. P1: Samurizator scheduling, escalation propagation, Chief parallel dispatch, more Omnibar commands, frozen proposals UI. P2: NATS rename, auto episodes, configurable layouts, MChS. | 2026-03-13 |
| roadmap_v5 | **Roadmap v5 WRITTEN** — `docs/agent-system-architecture.md`. 4 new phases: Phase 6 (E2E Validation, 4 steps), Phase 7 (Automation, 4 steps), Phase 8 (Agent Comms, 3 steps), Phase 9 (Shell Expansion, 4 steps). Phase 6 blocks all. Phases 7+8+9 run in parallel. | 2026-03-13 |
| desktop_shortcut | `Desktop/tLOS.lnk` → `AppData/Local/tLOS/tlos-app.exe`. Icon: monolith.ico (прозрачный фон, проблема отображения не решена). | 2026-03-10 |
| dockerization | **D1-D6 ALL DONE** — Dockerfiles: tlos-claude-bridge (node:22-alpine) + tlos-langgraph-bridge (python:3.12-slim+Node22). Unified compose: `core/kernel/docker-compose.yml` (6 services). `.env`: NIM_KEY (gitignored). grid.ps1 обновлён. NATS: `-a 0.0.0.0`. Inter-container env vars. All 6 containers online. D5: `core/kernel/.env` создан. D6: Desktop/tLOS.lnk создан. Docker Desktop autostart → ручной шаг nopoint. | 2026-03-10 |
| docker_compose_unified | `core/kernel/docker-compose.yml` — **12 сервисов** (session 16): nats:4222, db:5433, litellm:4000, qdrant:6333, letta:8283, langgraph-bridge, claude-bridge, shell-bridge:3001, dispatcher, fs-bridge, shell-exec, agent-bridge(profile:nim). NATS_URL=nats://nats:4222 (internal). WORKSPACE_ROOT через .env (grid.ps1 auto). | 2026-03-10 |
| docker_env_permanent | `core/kernel/.env` — теперь постоянный: NIM_KEY + WORKSPACE_ROOT=`C:\Users\noadmin\nospace\development\tLOS` + USERPROFILE=`C:\Users\noadmin`. Больше не зависит от grid.ps1 для записи. | 2026-03-10 |
| docker_ignore | `core/.dockerignore` создан — исключает `kernel/target/` (Rust build cache ~2GB), `shell/frontend/node_modules/`, `shell/frontend/dist/`. Без него build context был 2GB+ → OOM. Теперь будет ~50MB. | 2026-03-10 |
| rust_docker_build | **DONE (attempt 3, rust:1.88)** — `Finished release profile in 5m 20s`. Root cause: time@0.3.47 + time-core@0.1.8 require rustc 1.88.0. Images built: kernel-shell-bridge, kernel-dispatcher, kernel-fs-bridge, kernel-shell-exec. | 2026-03-11 |
| disk_cleanup | **DONE** — 2026-03-11. C: освобождено ~16 GB (99% → 86%, 2.3 GB → 18 GB free). builder prune #2: 2.585 GB freed before 1.88 build. | 2026-03-11 |
| active_docker_stack | **DONE** — NEW `core/kernel/docker-compose.yml` запущен. 11/11 сервисов UP: nats, db(healthy), litellm(healthy), qdrant(healthy), letta, langgraph-bridge, claude-bridge, shell-bridge, dispatcher, fs-bridge, shell-exec. Старый tlos-zep-bridge полностью остановлен и удалён. Дубли образов удалены (~1.3 GB). | 2026-03-11 |
| domain_memory_rename | **DONE** — все zep ссылки убраны. `docker-compose.yml`: volume `domain_memory_data`, POSTGRES_USER/DB: `tlos`/`domain_memory` (env vars). `domain-memory.js`: DB_USER/PASSWORD/NAME из env. `index.js`: `agent:zep:add_fact` → `agent:memory:add_fact`. | 2026-03-11 |
| claude_permissions | `rm`, `rm -rf`, `rmdir`, `del`, `rd`, `Remove-Item` — навсегда заблокированы в deny list. Claude не может удалять файлы. Все удаления — nopoint вручную. | 2026-03-11 |
| kernel_status_ui | **DONE v2** — 11/11 сервисов в KernelStatusFrame. 6 direct (HTTP/WS) + 5 NATS-inferred (DISPATCH/FS/EXEC/LGRAPH/CLAUDE). KERN убран из тайтлбара. Fullscreen при старте. Frame height 620px. | 2026-03-11 |
| tauri_rebuild | **DONE (final)** — BMP branding: installer-header.bmp (150x57) + installer-sidebar.bmp (164x314). kernel.ts WS fix (tauri.localhost). NSIS + MSI готовы. Установлен /S, shortcuts обновлены. | 2026-03-11 |
| excalidraw_skill | **INSTALLED** — `~/.claude/skills/excalidraw-diagram/` (coleam00/excalidraw-diagram-skill). Playwright renderer setup: uv + chromium. Generates `.excalidraw` JSON + renders to PNG. Replaces FigJam MCP (лимиты исчерпаны). | 2026-03-11 |
| project_map | **CREATED** — `development/tLOS/tlos-project-map.excalidraw` + `.png`. 4 секции: Roadmap timeline (L2→L3→QS→L4), System Architecture (Shell→NATS→Services), Agent Hierarchy (Claude Code + LangGraph), 8 Product Domains. Rendered OK. | 2026-03-11 |
| tlos_system_spec | **CREATED** — `docs/tlos-system-spec.md`. 8 sections: Five Pillars, Agent Hierarchy (L0-L5 vision), Continuum Memory (5 layers × 5 containers), Shell (Omnibar+Frames+Rendering), Kernel (12 Docker services), Services (Samurizators+Regulators), Communication Rules, Gap Analysis. Source: nopoint's 30min audio transcription + codebase audit. | 2026-03-12 |
| tlos_system_map | **CREATED** — `development/tLOS/tlos-system-map.excalidraw` + `.png`. 6-zone comprehensive system architecture diagram: Agent Hierarchy (L0-L5), Continuum Memory (5 layers × 5 containers), Shell (Omnibar+Frames), Kernel (12 Docker services + NATS bus), Services (Samurizators+Regulators), Data Flow (Intent pipeline + Memory degradation). Dark theme (#0a0a0f), gold+cyan palette. ~200 elements. Rendered OK via Playwright. | 2026-03-12 |
| tlos_system_graph | **CREATED** — `development/tLOS/tlos-system-graph.excalidraw` + `.png`. Full System Graph: network topology of ALL tLOS components. NATS-centric radial layout. ~120 elements: 7 bridges, 4 data stores, 3 shell, 2 external APIs, 6 agent levels, 5 memory containers, 2 meta-services. 5 edge types: gold=NATS pub/sub, gray=Docker networking, cyan=Agent hierarchy, green=Memory r/w, red=Meta-service. NATS subject labels + port numbers. Dark theme. Rendered OK. | 2026-03-12 |
| excalidraw_vscode | **INSTALLED** — VSCode extension `pomdtr.excalidraw-editor` v3.9.1. Allows in-editor preview/editing of `.excalidraw` files. | 2026-03-12 |
| figjam_board | FigJam product domains board создана в предыдущей сессии. URL: https://www.figma.com/board/ZZwpIQoksMAOyD9UCWjxBT/tLOS-Product-Domains — FigJam MCP лимиты исчерпаны, переход на Excalidraw. | 2026-03-11 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| ~~claude-bridge: cmd.exe breaks on <SYSTEM_CONTEXT> in -p arg~~ | claude-bridge | 2026-03-10 | **RESOLVED** — prompt via stdin |
| ~~Neural Link frame спавнится на каждое сообщение~~ | frontend | 2026-03-10 | **RESOLVED** — фильтр agent:* events |
| ~~agent:context payload bug~~ | claude-bridge + Omnibar | 2026-03-10 | **RESOLVED** |
| ~~sessionId создавался per-message → сессии не резюмировались~~ | Omnibar | 2026-03-10 | **RESOLVED** — stable `conversationSessionId` |
| ~~mcb команда не показывала фреймы~~ | App.tsx | 2026-03-10 | **RESOLVED** — resetViewport() после replaceComponents |
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Артём не настроил tlos-patch-daemon | node-v1 | 2026-02-28 | Нужно: tLOS-setup.exe + daemon с --dev-npub nopoint |
| ~~**Rust Docker build fails**~~ | kernel | 2026-03-11 | **RESOLVED** — rust:1.88 + --no-cache. Root cause: time@0.3.47 requires rustc 1.88.0. |
| ~~**tlos-zep-bridge claude-bridge crashing**~~ | kernel | 2026-03-11 | **RESOLVED** — старый стек останавливается, новый kernel compose запускается. |
| ~~**Zep CE vector search**~~ | zep-bridge | 2026-03-10 | **RESOLVED** — Zep CE полностью заменён на pg+pgvector+liteLLM. Vector search working (cosine HNSW). |
| ~~**liteLLM proxy**~~ | zep-bridge | 2026-03-10 | **RESOLVED** — liteLLM proxy deployed, 1536-dim NIM embeddings confirmed. |
| **Local PG conflict** | infra | 2026-03-10 | **RESOLVED** — Docker pg exposed on port 5433 (local PG on 5432). zep-client.js uses 5433. |
| **Phase 5.1 Direct API** | langgraph-bridge | 2026-03-13 | **PERMANENTLY BLOCKED** — no ANTHROPIC_API_KEY (subscription only). CLI overhead ~3-5s/call is architectural ceiling. |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы + агент-система как ядро: LangGraph (Python) + Letta (session memory) + pg+pgvector+liteLLM (domain memory) + Qdrant (vector, TODO); все self-hosted, управляются grid.ps1, общаются через NATS
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Claude AI pipeline:** Omnibar → agent:chat{provider:'claude', model} → NATS → claude-bridge → `claude --print` (stdin) → NATS → Omnibar
  - System prompt: XML memory blocks (`<persona>`, `<workspace>`, `<domain_memory>`) injected
  - Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
  - Session ID stability: Omnibar `conversationSessionId` signal — reused across all messages, reset only on clearContext()
  - Microagents: `agents/eidolon/microagents/*.md` — keyword-triggered context injection per message (OpenHands pattern)
  - Context tracking: `agent:context` event → `payload: { tokensUsed, contextTotal, nearLimit, turns }`
  - **Context compaction:** bridge dual-path — Letta UP: history/summary in Letta blocks (persistent); Letta DOWN: in-memory fallback (`memoryFallback`); on `nearLimit` → `summarizeConversation()` → new Claude session with `<PREVIOUS_CONTEXT_SUMMARY>` injected
  - **Domain memory:** `getDomainContext()` → DomainMemory.getContext('development-domain') → `<domain_memory>` injected on new session
  - **agent:zep:add_fact** NATS event → DomainMemory.addFact (fire-and-forget; NATS subject kept for compatibility)
  - Compaction UI: `agent:summarizing` event → Omnibar shows `⚙️ compacting...` indicator
- **Domain Memory pipeline (replaces Zep CE):** domain-memory.js → PostgreSQL (pgvector 0.5.1, Docker: db:5432) + liteLLM proxy (litellm:4000) → NIM embeddings
  - Table: `tlos_facts` (id, domain, content, metadata JSONB, embedding vector(1536), created_at)
  - Index: HNSW cosine (`vector_cosine_ops`) on embedding column
  - API: isAvailable, ensureDomain, addFact, getFacts, searchFacts (vector cosine), getContext
  - Embeddings: liteLLM maps `text-embedding-ada-002` → NIM `llama-3.2-nv-embedqa-1b-v2` (Matryoshka, 1536-dim)
  - Chat: liteLLM maps `meta/llama-3.1-70b-instruct` → NIM passthrough (for future Summarize Service)
  - Docker Compose: `core/kernel/docker-compose.yml`; 6 services (db + litellm + qdrant + letta + langgraph-bridge + claude-bridge)
  - 14 seed facts auto-inserted on first `ensureDomain('development-domain')`
  - Fallback: substring search if liteLLM unavailable
- **Associative Routing (L2 Step 4):** qdrant-client.js → Qdrant v1.13.0 (port 6333) → `tlos-global` collection
  - Functions: isAvailable, ensureCollection, upsert, addGlobal, search, searchAssociative
  - djb2 hash for deterministic point IDs (dedup on upsert)
  - index.js: `searchAssociative(content, 5)` per-message → `<associative_context>` block injected into prompt
  - agent:zep:add_fact → DomainMemory.addFact (pg) + QdrantClient.addGlobal (qdrant) in parallel
  - **Seed sync on startup:** после ensureDomain() → getFacts(50) → addGlobal each fact (idempotent, djb2 dedup)
  - Healthcheck: `bash -c ':> /dev/tcp/localhost/6333'` (qdrant image has no python3)
- **LangGraph pipeline:** tlos.shell.events → tlos-langgraph-bridge → LangGraph (orchestrator→worker) → tlos.shell.broadcast
  - subscribe: `tlos.shell.events`, message type `agent:graph:run`
  - publish: `agent:graph:token` (streaming chunks), `agent:graph:error`, `agent:graph:status`
  - graph.py: GraphState, call_claude_cli (subprocess+stdin), build_graph(), build_g3_subgraph(), **build_dirizhyor_graph()** (L1 intent→routing→chiefs)
  - **Дирижёр graph:** DirizhyorState → dirizhyor_node (intent formalization + Global Memory) → dirizhyor_router_node (Chief dispatch) → END
  - G3 cyclic subgraph: player→coach→conditional edge (passed/iter≥3→END, else→player)
  - Singleton compiled graph in bridge_handler.py (pre-compile at import)
  - run_in_executor for graph.invoke (async-safe)
- **NIM AI pipeline:** Omnibar → agent:chat{provider:'nim'} → NATS → agent-bridge → NVIDIA NIM SSE → NATS → Omnibar
- **Auth:** claude-bridge reads ~/.claude.json, publishes agent:auth:status; Omnibar кэширует в localStorage
- **Frame filtering:** useComponents.ts фильтрует все agent:* events (включая agent:summarizing)
- **Markdown:** Chat.tsx + Omnibar.tsx используют `marked` (GFM+breaks), стили в index.css (.chat-md)
- **tlos_action cards:** Chat.tsx парсит ` ```tlos_action ` блоки → ⚡ карточки
- **MessageStatus:** `kernel.ts` экспортирует `MessageStatus = 'streaming' | 'complete' | 'error'`
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **Agent system architecture:** `docs/agent-system-architecture.md` — L2 Kernel: LangGraph + Letta + pg+liteLLM + Qdrant внутри tLOS, self-hosted, grid.ps1. Иерархия: Orchestrator(Eidolon) → Chief → Lead → Senior → G3(Coach↔Player). CMA: Session(Letta) → Domain(pg+liteLLM) → Project(pg+liteLLM) → Global(pg+liteLLM).
- **Letta service:** `letta/letta:latest` Docker image — порт 8283; volume `letta_data:/root/.letta`
- **LangGraph service:** Docker `core/kernel/tlos-langgraph-bridge/Dockerfile` (python:3.12-slim+Node22+uv+claude CLI)
- **Domain Memory + All Kernel services:** `docker compose up` из `core/kernel/` — **unified compose** `core/kernel/docker-compose.yml` (6 services). NIM_KEY env var from ~/.tlos/nim-key. grid.ps1: `docker-kernel` service.
- **Full Docker stack (session 16):** grid.ps1 теперь только `docker compose up -d` + Tauri. NATS в Docker (nats:latest, 4222+8222). 5 Rust сервисов: shell-bridge(3001), dispatcher, fs-bridge, shell-exec, agent-bridge(profile:nim). `kernel/Dockerfile.rust-services` — multi-stage Rust build. server.rs: TLOS_BIND_HOST env var (0.0.0.0 в Docker). WORKSPACE_ROOT auto → fs-bridge + shell-exec volume mount.
- **lettaAgentIds persistence (session 16):** `~/.tlos/letta-agents.json` — Map сохраняется при каждом новом агенте. Пережитает рестарт Docker.
- **Agent Frames (L2 Step 5):** AgentStatusFrame (kernel:ping → kernel:status, 30s poll), MemoryViewerFrame (memory:get-facts + memory:search), G3SessionFrame (agent:graph:run + streaming). Omnibar: `kernel` → agent-status+memory-viewer, `g3` → g3-session. Files: `core/shell/frontend/src/components/frames/AgentStatusFrame.tsx`, `MemoryViewerFrame.tsx`, `G3SessionFrame.tsx`, `data/kernel-frames.ts`, `data/g3-frames.ts`.
- **First build — READY TO RUN:** `cd core/kernel && docker compose build shell-bridge dispatcher fs-bridge shell-exec && docker compose up -d`. `.dockerignore` исправлен → build context ~50MB (был 2GB, падал OOM). Потом `grid.ps1 run` запустит Tauri поверх.
- **`.env` постоянный:** `core/kernel/.env` содержит NIM_KEY + WORKSPACE_ROOT + USERPROFILE — не нужен grid.ps1 для первого запуска.
- **`.dockerignore`:** `core/.dockerignore` — исключает `kernel/target/` и `shell/frontend/node_modules/`.
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. `asyncio.get_event_loop()` deprecated в Python 3.10+ (bridge_handler.py LOW). model не прокидывается через GraphState в worker_node (LOW). Legacy files archived: `core/kernel/archive/`. Полный рефактор → Quality Sprint.

## L2 Kernel Roadmap

| Шаг | Задача | Статус |
|-----|--------|--------|
| 1 | Letta self-hosted + tlos-claude-bridge migration | ✅ DONE (G3 TLOS-07) |
| 2 | tlos-langgraph-bridge — Python service + LangGraph + G3 subgraph | ✅ DONE (G3 TLOS-08) |
| 3 | Domain Memory — pg+pgvector+liteLLM (replaced Zep CE) | ✅ DONE — zep-client.js rewritten, vector search working |
| 4 | Qdrant self-hosted + Associative Routing | ✅ DONE — qdrant-client.js, tlos-global collection, per-message assoc context |
| 5 | tLOS Agent Frames (agent-status, g3-session, memory-viewer) | ✅ DONE — session 15. Omnibar: `kernel` + `g3` |

## Omnibar Roadmap (branch: omnibar)

| Task | Status |
|---|---|
| Redesign: NIM chat panel, token streaming | ✅ DONE |
| Provider selector (Claude/NVIDIA toggle + model list) | ✅ DONE |
| Auth UI: Connected/Sign in status in Model panel | ✅ DONE |
| Monolith logo: SVG + favicon + Tauri icons | ✅ DONE (2026-03-10) |
| Auth persistence: localStorage cache | ✅ DONE (2026-03-10) |
| Eidolon agent backend: system prompt + config | ✅ DONE (2026-03-10) |
| claude-bridge: stdin-based prompt (Windows shell fix) | ✅ DONE (2026-03-10) |
| claude-bridge: session persistence to disk | ✅ DONE (2026-03-10) |
| claude-bridge: spawn timeout 30s | ✅ DONE (2026-03-10) |
| Markdown rendering in Chat.tsx | ✅ DONE (2026-03-10) |
| Bug hunt sprint 1: 26/39 issues fixed | ✅ DONE (2026-03-10) |
| Letta XML memory blocks (persona + workspace as XML) | ✅ DONE (2026-03-10) |
| OpenHands microagents (keyword-triggered context) | ✅ DONE (2026-03-10) |
| assistant-ui message parts (tlos_action cards) | ✅ DONE (2026-03-10) |
| Markdown in Omnibar AI messages | ✅ DONE (2026-03-10) |
| agent:context payload bug fixed | ✅ DONE (2026-03-10) |
| Context bar: real token counts from agent:context | ✅ DONE (2026-03-10) |
| Session ID stability (conversationSessionId) | ✅ DONE (2026-03-10) |
| Context summarization (LLM-based compaction at nearLimit) | ✅ DONE (2026-03-10) |
| Omnibar command `mcb` fix (viewport reset) | ✅ DONE (2026-03-10) |
| Letta integration: persistent memory blocks (G3 session) | ✅ DONE (2026-03-10) |
| Domain memory: `<domain_memory>` in system prompt | ✅ DONE — pg+pgvector+liteLLM (vector search, 2026-03-10) |
| RESEARCH: Intent Trigger audit — все команды/триггеры в Omnibar, что активирует что, типология (Command/Keyword/Context/Event), связь с IntentTrigger entity | TODO — 2026-03-12 |
| SEC: PatchDialog Nostr signature verification | TODO — needs nostr-tools |
| SEC: System prompt file permissions (world-readable) | TODO |
| FEATURE: microagents harkly.md, nostr.md, rust.md | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — future |

## Bug Hunt Status (2026-03-10)

Session 3 additions: 3 more bugs fixed (sessionId, mcb viewport, agent:summarizing filter).
Remaining open: SEC (PatchDialog sig, system prompt permissions).

Priority next:
1. SEC: PatchDialog Nostr signature verification (needs nostr-tools)
2. SEC: System prompt file permissions
3. Summarize Service design (liteLLM chat + pg summaries)

## THELOS Brand System (зафиксировано 2026-02-28)

| Элемент | Значение |
|---|---|
| Концепция | Чёрный квадрат Малевича (апогей) + чёрная дыра (притяжение) + τέλος (завершённость/полнота) |
| Логотип | Монолит — чёрный вертикальный прямоугольник, соотношение 4:5, Супрематизм |
| Шрифт | Helvetica / Neue Haas Grotesk — Швейцария, объективность, сведение к сущности |
| Стиль | Супрематизм — геометрия, никакого декора, формы в пространстве |
| `#000` / `#0A0A0F` | Чёрный — абсолютная форма, финальность |
| `tlos-cyan` | `#06B6D4` (Tailwind cyan-500) |
| `tlos-primary` | `#f2b90d` (золотой акцент) |
| Monolith SVG | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
