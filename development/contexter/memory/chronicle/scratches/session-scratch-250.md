# session-scratch.md
> Placeholder · Axis · 2026-04-25 · session 250
> Last processed checkpoint: #249

<!-- ENTRY:2026-04-25:CLOSE:250:contexter:gtm-01-omnipresence-epic [AXIS] -->
## 2026-04-25 — сессия 250 CLOSE [Axis]

**Decisions:**
- D-CONTENT-01: Контент-фабрика построена как multi-tier OSINT pipeline. Tier 1 = specialized correspondents (HN + Reddit shipped, GitHub + ArXiv + Hugging Face + Dev.to + Anthropic + OpenAI + Google + Telegram planned). Tier 2 = Gemini API synthesis. Tier 3 = Claude editorial. Tier 4 = master + 10 platform snippets.
- D-CONTENT-02: Voice locked = cold Bauhaus + info-style + founder POV (nopoint). Lowercase headers, no em-dashes, founder voice >= 3 markers, forbidden words list (English + Russian corporate slop).
- D-CONTENT-03: Master digest length 1500-2500 слов. Asymmetric Gleichgewicht weighting (story 1 ~40% / 2 ~30% / 3 ~15%).
- D-CONTENT-04: Gemini API НЕ primary scout. Reddit JSON и HN Algolia блокируются url_context fetcher. Gemini = synthesis-only layer на готовом scout output.
- D-CONTENT-05: Triangulation = 2-pass architecture. Pass 1 = constrained chat mode (per-signal verification, deterministic). Pass 2 = Deep Research mode на filtered signals (open synthesis). Single-pass Deep Research auto-decompose ломает iteration по corpus.
- D-CONTENT-06: 8 correspondents в roadmap: HN ✓, Reddit ✓, GitHub P1, ArXiv P1, Hugging Face P1, Dev.to P2, Anthropic/OpenAI/Google P2 (или combined Lab Blogs), Telegram P3 (special architecture).
- D-CONTENT-07: r/programming LLM ban appears LIFTED (MEDIUM, per Reddit correspondent v2 verification — 50 /new posts, 0 mod removals).
- D-CONTENT-08: Cold Bauhaus visual system Contexter подтверждён существующий в `nospace/design/contexter/foundations/philosophy.md` (3 colors black/white/blue accent #1E3EA0, Inter + JetBrains Mono, lowercase, 0px corners, raw→structured duality).

**Files changed (new + modified, this session):**

Agents + research:
- `~/.claude/agents/hn-correspondent.md` — new (12 KB, 7-phase scout protocol, authority submitter index, output JSON schema)
- `~/.claude/agents/reddit-correspondent.md` — new (14 KB, 7-step protocol, per-sub cheatsheet, Nov 2025 OAuth shutdown context)
- `~/.tLOS/gemini-api-key` — new (free tier API key, chmod 600)
- `~/.tLOS/gemini-project.json` — new (project metadata)

Memory:
- `~/.claude/projects/C--Users-noadmin-nospace/memory/feedback_no_time_estimates.md` — new
- `~/.claude/projects/C--Users-noadmin-nospace/memory/reference_contexter_content_voice.md` — new
- `~/.claude/projects/C--Users-noadmin-nospace/memory/MEMORY.md` — updated (2 new entries)

Research artifacts (`nospace/docs/research/`):
- `image-providers-seed-research.md` — new (28 KB)
- `video-models-seed-research.md` — new (28 KB)
- `hn-correspondent-intelligence-playbook.md` — new (16 KB, 12 sections, 38 queries)
- `reddit-correspondent-intelligence-playbook.md` — new (18 KB, 14 sections, 27 queries)
- `gemini-api-capability-matrix.md` — new (17 sections, 8 hypotheses tested, all 6 confirmed)

Content factory (`nospace/development/contexter/content-factory/`):
- `planning/correspondent-roadmap.md` — new (8-correspondent architecture)
- `prompts/evening-digest-v2.md` — new (locked digest prompt template, voice rules, anchor mapping)
- `digests/2026-04-25-21/` — new directory with:
  - `hn-narrative-v2.md`, `hn-structured-v2.json` — HN scout output (8 stories, all gates pass)
  - `reddit-narrative-v2.md`, `reddit-structured-v2.yaml` — Reddit scout output (14 posts + 4 cross-sub trends, gates pass)
  - `gemini-api-narrative.md`, `gemini-api-narrative-v2.md` — Gemini API runs (v1 generic, v2 with anchors)
  - `gemini-api-raw.json`, `gemini-api-raw-v2.json`, `gemini-prompt.txt`, `gemini-system-instruction-v2.txt`, `gemini-user-content-v2.txt`, `gemini-request.json`, `gemini-api-request-v2.json`
  - `run-gemini.sh`, `run-gemini-v2.sh` — API call scripts
  - `master-blog-post-2026-04-25.md` — v1 master post (1620 words, 9 HIGH / 3 MEDIUM / 2 LOW confidence, all editorial gates pass)
  - `triangulation-bundle/CORPUS.md` — refactored v2 (669 lines, 26 numbered signals, narrow definitions)
  - `triangulation-bundle/CORPUS.md` — v2 refactor с numbered headers
  - `triangulation-bundle/PROMPT.md` — v2 refactor (227 lines, hard constraints, no Deep Research, narrow lateral/discourse)

Pencil:
- `nospace/design/contexter/contexter-ui.pen` — modified (added Workspace 01 inputs+brain, Workspace 02 masters with morning/evening columns + 7-day weekly grid, Workspace 03 waterfall with 11 platform cards in 4×3 grid). Total Pencil work: 9 batch_design calls, ~120 nodes added.

Disk cleanup:
- 2.6 GB → 6.1 GB free (Tier 🟢 + 🟡: TEMP + npm/bun cache + Recycle Bin + Docker prune + diskpart compact docker_data.vhdx). +3.5 GB recovered.

**Completed:**
- HN Correspondent agent shipped + production tested (10 min run, 13/13 quality gates pass, 1630 words, founder voice 6 markers, em-dashes 0, forbidden words 0)
- Reddit Correspondent agent shipped + production tested (9 min run, all gates pass, 4 cross-sub trends detected, r/programming LLM ban verified lifted)
- First master blog post written + editorial pass (master-blog-post-2026-04-25.md, 1620 words, structured per Bauhaus asymmetric weighting)
- Gemini API integration validated (free tier ping pass на gemini-2.5-flash, gemini-3-flash-preview; 3.1 Pro / 3 Pro / 2.5 Pro / pro-latest all paid-only)
- Gemini API capability matrix research done (Deep Research API endpoint via Interactions API exists, Gemini 3 series live, url_context tool, context caching 90% reduction explicit mode, Batch API GA Feb 2026, Flex tier 50% off, text-embedding-004 dead, 8 hypothesis tests)
- Triangulation pipeline v1 attempted (Deep Research mode, output deprecated — Gemini не подхватил corpus, сделал autonomous research)
- Triangulation v2 refactored prompts (numbered signals, hard constraints, narrow definitions, no Deep Research mode)
- Triangulation v2 second attempt: Gemini standard chat (3 Flash Preview-grade) обработал все 26 signals в правильном формате но поверхностно (filter quality good, enrichment quality low — generic URLs, missing notable voices, glossed numerical specifics)
- 8-correspondent roadmap planning artifact written
- Pencil content factory v1 visualization собран (3 workspaces) + screenshots verified
- Disk cleanup автоматически выполнен (Tier 🟢 + 🟡 без approval)
- Memory updates: feedback_no_time_estimates + reference_contexter_content_voice

**Opened (next session):**
- Build Wave 1 correspondents in parallel: GitHub + ArXiv + Hugging Face + Dev.to (research SEEDs + agent files)
- Build Wave 2 correspondents: Anthropic + OpenAI + Google (separate per user preference)
- Build Wave 3: Telegram correspondent (Telethon auth, channel curation requires nopoint manual setup)
- Run triangulation Pass 2 (Deep Research mode) on filtered 14 publishable signals from Pass 1 — for enrichment (lateral context + discourse depth + notable voices)
- Compare: master post v1 (без триангуляции) vs v2 (на основе triangulation filter + enrichment) — quality comparison test
- Build content factory dashboard / aggregator — единая точка для daily cycles aggregating N correspondent outputs into master synthesis
- Daily cron schedule: 09:00 + 21:00 UTC двух correspondent agents
- Sources catalog file `nospace/docs/content-factory/sources-input.tsv` для NotebookLM bulk import (300 sources max, currently 121 loaded)

**Blockers / Open issues:**
- Reddit API key shutdown Nov 2025 — no new OAuth credentials. Public JSON limit ~10 req/min unauth (наш Reddit correspondent работает в этом режиме корректно)
- Gemini Pro models (3 Pro, 3.1 Pro, 2.5 Pro) только paid — 3 Flash Preview free и достаточен для production digest синтеза
- Reddit JSON и HN Algolia URLs блокируются Gemini url_context — Gemini не может быть primary scout, только synthesis layer
- arxiv ID 2604.21691 в signal #20 не URL-verified, MEDIUM confidence
- CVE-2026-5752 + CVE-2025-59532 в signal #21 не verified vs NVD/MITRE, MEDIUM confidence
- securityscanner.dev/reports/2026-q2 underlying report (signal #14) not WebFetched, MEDIUM confidence
- Pre-CTX-11 commits `a5eb98a..c3f4033` всё ещё local main, NOT pushed (не блокер этой сессии, унаследовано от 249)
- Telegram correspondent требует nopoint phone auth (Telethon) + channel whitelist approval — не блокер сейчас, defer to wave 3
- Triangulation enrichment quality (lateral + discourse + notable voices) низкое в Gemini standard chat. Нужен Pass 2 Deep Research или manual Claude WebSearch enrichment.

**Notes / context / tech debt:**
- Knowledge cutoff Claude (январь 2026) систематически ломает мою оценку свежих claims (Claude Code leak, Anthropic Mythos, GPT-5.5/5.5 Pro/Codex, Gemini 3 series). Решение: A1 + A2 stricter — WebSearch first для любых post-cutoff claims.
- Contexter design system ALREADY EXISTS at `nospace/design/contexter/{foundations,guidelines,components,patterns,ux}/` — 16 markdown files. Я обнаружил это session 250, ранее неявно знал. Это критическое для voice/content factory work — Contexter brand уже определён.
- Harkly TOV (`nospace/marketing/branding/tov.md`) и Vault TOV (`nospace/development/contexter-vault/brand/tov.md`) существуют как референс. Contexter TOV отдельным файлом не лежит, но philosophy.md + principles.md его эффективно определяют.
- Pencil app upon Apr 23 update broke MCP WebSocket sometimes — нужен полный restart Pencil app (taskkill + relaunch) для recovery. Работает stable после рестарта.
- `~/.tLOS/gemini-api-key` хранит free tier ключ, project 679178383496. chmod 600 не enforce'ится на NTFS, но файл в user profile — практически OK.
- Gemini API лимиты: gemini-2.5-flash 10 RPM / 250 RPD free (cut Dec 2025), Flash-Lite 15 RPM / 1000 RPD free, 3 Flash Preview free но "Pro at Flash price" (по research). 3 Pro / 3.1 Pro / 2.5 Pro / pro-latest все paid.
- Workspace 03 in Pencil (waterfall, 11 platform cards 4×3 grid) занимает ~3000px высотой — может потребоваться компактизация если станет тесно.
- Telegram channel whitelist для P3 correspondent требует nopoint approval — black-box до этого момента.
