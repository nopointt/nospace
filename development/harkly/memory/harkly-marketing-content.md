---
# harkly-marketing-content.md — Epic: HARKLY-14 Content Auto-Writing System
> Layer: L3 | Status: 🔶 IN PROGRESS — design phase
> Last updated: 2026-03-17 (session close · Axis)
---

## Epic Overview

**Goal:** Automated multi-channel content pipeline. Research → Ideas → Write → Edit → Publish.
**Status:** Design phase — Brand TOV + system architecture
**Priority:** Active (parallel to Stage 5 backend)

---

## Channels (Phase 1)

| Channel | Publish API | Analysis | Priority |
|---|---|---|---|
| Telegram | Bot API (python-telegram-bot) | Telethon MTProto — full history | ✅ P0 |
| Site (Ghost) | Ghost Admin API + JWT | Own DB | ✅ P0 |
| Habr | ❌ API closed | RSS + feedparser + bs4 | ⚠️ analysis only |
| LinkedIn | ❌ Partner Program required | ❌ ToS risk | ⏸ deferred |

---

## Pipeline Architecture

```
Research Agent (cron 12h)
  └── sources: HN, ProductHunt, Twitter/X trends, Reddit, Google Trends RU/Global
  └── generates: 5-10 ideas per run → tagged by channel/topic/priority
  └── stores in: Idea Hub

Idea Hub (markdown + JSON)
  └── ideas tagged: channel | topic | priority | status (new/assigned/written/published)

{channel}Person (copywriter agent — one per channel)
  └── TelegramPerson   — calibrated on top Telegram tech/product channels
  └── GhostPerson      — calibrated on top blog posts in research/AI/SaaS space
  └── HabrPerson       — analysis only (no publish yet), calibrated on top Habr articles
  └── INPUT: idea from Hub + Brand TOV
  └── OUTPUT: draft article → Editor queue

Editor Agent
  └── checks: TOV compliance | structure | factual accuracy | channel fit
  └── APPROVE → Scheduler queue
  └── REJECT → back to copywriter with inline comments (max 2 iterations)

Scheduler (v1 = manual confirmation)
  └── Telegram: python-telegram-bot → bot.send_message(channel_id, text)
  └── Ghost: POST /ghost/api/admin/posts/ with JWT
  └── v2: optimal time-slot automation
```

---

## Stack

| Component | Tech |
|---|---|
| Orchestration | Python 3.12 + Modal.com cron |
| LLM calls | NVIDIA NIM (meta/llama-3.3-70b) via Groq fallback |
| Telegram publish | python-telegram-bot |
| Telegram analysis | Telethon (MTProto) |
| Habr analysis | feedparser + beautifulsoup4 |
| Ghost publish | requests + JWT (Ghost Admin API) |
| Idea Hub storage | Markdown files + JSON index |
| Brand TOV | `nospace/marketing/branding/tov.md` |
| Channel calibration | `nospace/marketing/copywriting/channels/{channel}-persona.md` |

---

## Brand TOV (foundation)

Base: Bauhaus principles (Sparsamkeit, Gestaltung, Materialwahrheit, Gleichgewicht, Raumgestaltung)
Harkly flavor: softer, rounder, warmer than tLOS
Symbol: **The Child** — curiosity, wonder, joy of discovery, no fear of "obvious" questions
Vibe: soft / elegant / intelligent / scientific / anthropocentric
Category term: **Customer Signals Research** — Harkly introduces and owns this term
Position: Методологический лидер (methodological leader)
Register: **"Вы"** throughout all Russian B2B content (confirmed 2026-03-17)
File: `nospace/development/harkly/brand/tov.md` — DRAFT v1 ✅ (pending v2 rewrite)
Values file: `nospace/development/harkly/brand/values.md` — canonical, source of truth ✅
Research: `nospace/docs/research/tov-best-practices-research.md` — 587 lines, 4 pillars, NN/G analysis ✅
Voice pillars (4): Attentive · Precise · Humanist · Calm

---

## Persona Framework (confirmed 2026-03-17)

### Two separate persona types

| Persona | Format | Purpose |
|---|---|---|
| **Audience Portrait** | Silicon Persona + JTBD | Who reads us — research interview tool. Format: Who I Am / Pain Clusters / What I Really Want / Breaking Points / Questions to Ask. Built from: 15 relevant chat files via audience_analysis.py |
| **TelegramPerson (copywriter)** | Tavern Card + TTM | AI copywriter agent. Built from: TOV v2 + audience vocabulary + **mes_example (BLOCKING)** |

### TelegramPerson v2 — Tavern Card structure (1000–2000 tokens minimum)

```
name: TelegramPerson
description: 1000–2000 tokens — brand identity, product context, target audience
personality: TOV v2 Voice Pillars (Attentive·Precise·Humanist·Calm) + "Вы" register
speaking_style: extracted from audience chat vocabulary + channel format norms
mes_example: 3-5 REAL top posts from target channels (BLOCKING — must collect first)
first_mes: opening post template
```

### TTM 3-dimensional decoupling (test-time, MIT 2025)

Generate CONTENT from character's views → apply STYLE second. Never mix.
1. **Personality layer** — Harkly brand values + TOV v2 (already exists)
2. **Memory layer** — Customer Signals Research context, product knowledge, audience portrait
3. **Linguistic Style layer** — extracted from top channel posts (mes_example)

### Role Chain (ACL 2025) — pre-generation self-check

Before every post: (1) What are my core values on this topic? (2) What would Harkly say? (3) Does draft comply with TOV? (4) Is this the right linguistic style for Telegram?

### Audience analysis — hierarchical pipeline (designed 2026-03-17)

**Scale:** 15 chats, ~1.4M tokens total, avg ~93K/chat. OLcustdevru = 343K (needs sampling).
**Approach:** 15 parallel Sonnet subagents (one per chat) → 15 structured summaries → 1 final Sonnet call → Audience Portrait + speaking_style

**Output format per chat (each Sonnet subagent returns):**
```
## [chat_name]
### Кто здесь — роли, уровень, индустрия
### Топ-5 болей — конкретные формулировки из чата
### Топ-5 вопросов — дословно или близко
### Словарный запас — 15-20 реальных слов/фраз
### Стиль общения — длина, тон, обращение, эмодзи
### Горячие темы — 3-5 тем вокруг которых дискутировали
```

**Not started yet** — launch when nopoint confirms.

### Research sources

- Framework: `nospace/docs/research/synthetic-persona-research.md` — 30+ papers, Tavern Card, PsyPlay JSON, TTM, PersonaGym
- CX persona: `nospace/development/harkly/branches/feat-cx-osint-pipeline/` — Silicon Persona format, JTBD prompts
- Channel samples: `nospace/marketing/copywriting/research/telegram-channel-samples.json` — 105 posts, 7 channels

---

## Task Queue

### Phase 1 — Brand & Calibration
- [x] Write values.md (canonical brand values) — created 2026-03-17
- [x] Write Brand TOV v2 (`nospace/marketing/branding/tov.md`) — 9 sections, AI editor persona · done 2026-03-17
- [x] Research persona frameworks — Tavern Card + TTM + Silicon Persona · done 2026-03-17
- [x] Collect top channel posts via Telethon → `channel_collector.py` · 105 posts from 7 channels · done 2026-03-17
- [x] Fix audience_analysis.py (OUTPUT_DIR + TARGET_GROUPS 15 filtered + "Вы") · done 2026-03-17
- [x] Run hierarchical audience analysis — 13/15 чатов готовы в `audience-analysis/` · 2 пропущено (галлюцинация + нерелевантный) · done 2026-03-17
- [x] Агрегация: Audience Portrait v2 + speaking_style — done 2026-03-17
- [x] Write TelegramPerson v2 (Tavern Card + TTM 3-слоя + humanizer 24 паттерна + infostyle + post-writing rules) — done 2026-03-17
- [x] Update TelegramPerson v2 system_prompt — lab angle + CHANNEL MISSION + rule 16 + role_chain q2 · done 2026-03-17 [Axis]
- [ ] Rewrite recruitment test post with "our data" angle (Harkly собственные данные из 13 чатов)
- [ ] Collect top-20 Habr articles in research/AI/product space (RSS)
- [ ] Write GhostPerson (`nospace/marketing/copywriting/channels/ghost-persona.md`)
- [ ] Write HabrPerson (`nospace/marketing/copywriting/channels/habr-persona.md`)

### Phase 2 — Antenna + DeepResearcher + TGWriter Pipeline

> Архитектура финализирована 2026-03-17: Antenna (широкий скан) → DeepResearcher (глубокий нырок, OSINT триангуляция) → TGWriter (пишет по Research Brief)
> OSINT методология: `nospace/docs/research/osint-content-research-methodology.md` (512 строк)
> API источники: HN + GitHub Trending + NewsData.io + Reddit (reddapi.dev) + Telethon + Semantic Scholar + Serper

> ⚠️ NEEDS REWORK (2026-03-17): v0 pipeline написан (`brand/agents/`: idea_hub.py ✅, antenna.py ⚠️, deep_researcher.py ⚠️) но качество неприемлемо без Telethon. HN/GitHub дают нерелевантные идеи. Единственный рабочий источник — Telethon. Переписывать с нуля: Telethon как primary source, HN/GitHub — secondary. Нужны TG_API_ID + TG_API_HASH для запуска.

- [ ] ⚠️ REWORK: Antenna — Telethon как primary source, HN/GitHub как secondary, on-demand
- [ ] ⚠️ REWORK: DeepResearcher — OSINT триангуляция (Jina + HN Algolia + Groq), Research Brief 7 секций
- [ ] ⚠️ REWORK: Idea Hub — схема ок (idea_hub.py переиспользовать), добавить `{date}-session.md` лог
- [ ] Implement Antenna cron on Modal.com (12h interval) — после rework

### Phase 3 — Copywriter Agents
- [ ] Write copywriter prompt template (brand TOV + channel persona + idea → article)
- [ ] Implement TelegramPerson (short format: 800-1200 chars, emoji OK, hook-first)
- [ ] Implement GhostPerson (long form: 1500-3000 words, SEO structure, no fluff)
- [ ] Implement HabrPerson (Habr format: technical depth, code examples, habracut)

### Phase 4 — Editor + Scheduler
- [ ] Write Editor Agent prompt (TOV check rubric + channel format rubric)
- [ ] Implement Editor review loop (max 2 iterations)
- [ ] Implement Telegram publisher (Bot API)
- [ ] Implement Ghost publisher (Admin API + JWT)
- [ ] Manual approval UI (v1: CLI confirm before publish)

---

## Open Questions

- [ ] Ghost: self-hosted on harkly.ru or separate Ghost.org managed?
- [ ] Research Agent data sources: need API keys? (Twitter/X Bearer, Google Trends = unofficial)
- [ ] Idea Hub: file-based v1 or straight to Supabase?
- [ ] TelegramPerson: separate bot for Harkly channel or same as existing?
- [ ] Article frequency target: how many posts/week per channel?

---

## Key Artifacts

| Artifact | Path | Status |
|---|---|---|
| Brand Values | `nospace/marketing/branding/values.md` | ✅ canonical |
| TOV Research | `nospace/docs/research/tov-best-practices-research.md` | ✅ created |
| Audience Pipeline | `nospace/marketing/copywriting/agents/audience_analysis.py` | ✅ created |
| Audience Portrait | `nospace/marketing/copywriting/channels/audience-portrait.md` | ✅ v2 (4 сегмента, 7 болей) |
| Audience Speaking Style | `nospace/marketing/copywriting/channels/audience-speaking-style.md` | ✅ created 2026-03-17 |
| TelegramPerson | `nospace/marketing/copywriting/channels/telegram-persona.md` | ✅ v2 (Tavern Card + humanizer + infostyle) |
| Brand TOV | `nospace/development/harkly/brand/tov.md` | ✅ v3 (inner child + lop-eared logo + infostyle) |
| Post-Writing Research | `nospace/docs/research/post-writing-research.md` | ✅ 415 строк (Ilyakhov + frameworks) |
| Category Manifesto | `nospace/development/harkly/brand/category-manifesto.md` | ✅ created 2026-03-17 |
| Positioning Doc | `nospace/development/harkly/brand/positioning.md` | ✅ created 2026-03-17 |
| Telegram Content Strategy | `nospace/marketing/copywriting/channels/telegram-content-strategy.md` | ✅ created 2026-03-17 |
| Brand Bible | `nospace/development/harkly/brand/brand-bible.md` | ✅ created 2026-03-17 |
| GhostPerson | `nospace/marketing/copywriting/channels/ghost-persona.md` | ⬜ to create |
| HabrPerson | `nospace/marketing/copywriting/channels/habr-persona.md` | ⬜ to create |
| Idea Hub | `development/harkly/brand/ideas/hub.json` | ⬜ to create |
| Research Agent | `development/harkly/brand/agents/research-agent.py` | ⬜ to create |
| Copywriter base prompt | `development/harkly/brand/agents/copywriter-prompt.md` | ⬜ to create |
| Editor prompt | `development/harkly/brand/agents/editor-prompt.md` | ⬜ to create |
