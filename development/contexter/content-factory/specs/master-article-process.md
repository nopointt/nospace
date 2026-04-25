# Master Article Process — Contexter Content Factory

> Date: 2026-04-25 | Owner: Axis | Status: v1 LOCKED
> Documents the full daily digest production pipeline end-to-end.
> Corresponds to: `morningDigest` and `eveningDigest` skills (auto-execution).

---

## Cycle types

| Cycle | UTC time | Window | Audience expectation | Length |
|---|---|---|---|---|
| `morningDigest` | 09:00 UTC | prior 12 hours (since last evening cycle, or last 24h on Mondays) | "что произошло за ночь, что подготовиться к рабочему дню" | 1500-2200 words |
| `eveningDigest` | 21:00 UTC | last 24 hours | "что произошло за рабочий день, синтез и завтрашние сигналы" | 1500-2500 words |

Cycle determines: opener tone, "пробую завтра" presence (evening more action-directed, morning more "что подготовить"), valve content.

---

## Pipeline overview

```
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER (cron 09:00 UTC / 21:00 UTC OR manual /skill)      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  STAGE 1A        │      │  STAGE 1B        │
│  HN              │      │  Reddit          │
│  correspondent   │      │  correspondent   │
│  (parallel)      │      │  (parallel)      │
│  ~10-15 min      │      │  ~10-15 min      │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └────────────┬────────────┘
                      ▼
        ┌────────────────────────┐
        │  STAGE 2 (optional)    │
        │  Triangulation Pass 1  │
        │  Gemini constrained    │
        │  verification          │
        │  ~5-10 min             │
        └────────┬───────────────┘
                 ▼
        ┌────────────────────────┐
        │  STAGE 3               │
        │  Master draft          │
        │  Layer 4 mode select   │
        │  + per-item template   │
        │  ~20-30 min            │
        └────────┬───────────────┘
                 ▼
        ┌────────────────────────┐
        │  STAGE 4 (4 layers)    │
        │  L1 vault check        │
        │  L2 self-check pass    │
        │  L3 factcheck-agent    │
        │  L4 genre/voice/filter │
        │  ~10-20 min            │
        └────────┬───────────────┘
                 ▼
        ┌────────────────────────┐
        │  STAGE 5               │
        │  File + chronicle      │
        │  + publish             │
        │  ~5 min                │
        └────────────────────────┘

Total: ~60-90 min per cycle
```

---

## Stage 0 — Pre-pipeline

### Working directory setup

Create cycle directory:
```
nospace/development/contexter/content-factory/digests/{YYYY-MM-DD}-{HH}/
```

Where `{HH}` = `09` for morning cycle, `21` for evening.

Subdirectories created lazily by stages as outputs arrive. Don't pre-create empty.

### Window calculation

```
NOW = current UTC time
IF cycle == morning:
    window_end = NOW (≈ 09:00 UTC)
    window_start = NOW - 12h (or NOW - 24h on Mondays — covers weekend)
IF cycle == evening:
    window_end = NOW (≈ 21:00 UTC)
    window_start = NOW - 24h
```

Window passes verbatim to correspondents in their prompts (must filter by `created_utc` or `time` field).

---

## Stage 1 — Source intelligence

### 1A. HN correspondent agent

**Agent file:** `~/.claude/agents/hn-correspondent.md` (12+ KB, 7-phase protocol)

**Topics filtered to 8 core:**
- RAG / retrieval-augmented generation
- MCP / Model Context Protocol
- LLM tooling (frameworks, runtime, orchestration)
- AI infrastructure (TPU, GPU, serving, inference)
- Agent frameworks (LangChain alternatives, agent runtimes)
- AI security (prompt injection, sandbox, supply chain)
- Dev productivity (Cursor, Claude Code, GitHub Copilot tier)
- Self-hosted OSS (Ollama, vLLM, LM Studio class)

**APIs used:**
- Algolia HN search: keyword filtering by topic
- HN Firebase API: top stories, comment trees
- HNRSS: RSS-style top + new feeds

**Launch pattern (Orchestrator does this):**

```python
Agent(
  description="HN correspondent — {cycle}",
  subagent_type="hn-correspondent",
  prompt=f"""
Cycle: {cycle}  # "morning" or "evening"
Window UTC: {window_start_iso} to {window_end_iso}
Output dir: nospace/development/contexter/content-factory/digests/{date}-{HH}/

Required outputs:
1. Structured JSON: structured-hn.json (top stories, scores, velocities, threads, comment authors, cross-references)
2. Narrative MD: narrative-hn.md (2000-3000 words, founder voice, 7-phase protocol output, all quality gates pass)

Apply quality gates per agent definition:
- Top stories filtered to 8 core topics
- Each story: source URL + score + velocity + age + ≥1 verbatim quote (≤125 chars)
- Cross-source amplification fields populated
- Confidence labels per story (HIGH/MEDIUM/LOW)
- 0 em-dashes in narrative body, lowercase headers
- Founder voice ≥3 markers
- 0 forbidden words

Save incrementally — first tool call writes skeleton, then update.
""",
  run_in_background=False  # we wait
)
```

**Output files:** `digests/{date}-{HH}/narrative-hn.md` + `structured-hn.json` + raw API responses if useful for triangulation.

**Typical duration:** 10-15 min.

### 1B. Reddit correspondent agent

**Agent file:** `~/.claude/agents/reddit-correspondent.md` (14+ KB, 7-step protocol)

**Subreddits monitored (13):**
- r/LocalLLaMA, r/ClaudeAI, r/Anthropic, r/ClaudeCode
- r/OpenAI, r/MachineLearning, r/LLMDevs
- r/AI_Agents, r/artificial
- r/mcp, r/RAG (если активен)
- r/netsec (для AI security crossover)
- r/devops, r/selfhosted (для infra crossover)

**API:** Reddit public JSON (`.json` suffix on any URL, no auth, ~10 req/min limit).

**Launch pattern:** аналогично 1A с `subagent_type="reddit-correspondent"`.

**Output files:** `digests/{date}-{HH}/narrative-reddit.md` + `structured-reddit.yaml` + `raw-{sub}-{type}.json` per sub.

**Typical duration:** 10-15 min.

### 1A + 1B parallel

**Always launch in parallel** (single message, two Agent tool calls). Don't sequence — independent work, full parallel speedup.

C1 quota guard: 2 agents = под 5+ threshold, automatic. No "согласовываю" needed.

---

## Stage 2 — Triangulation (OPTIONAL, default off for daily cycle)

### When to trigger

**Default for daily cycle: SKIP.** Stage 1 outputs are sufficient for master draft.

**Trigger Pass 1 only when:**
- HN + Reddit show 5+ candidates of comparable importance and need filtering
- Conflicting accounts in different sources (need verification)
- Big-news day with 3+ concurrent claims requiring fact verification before draft
- Weekly retrospective (Sunday evening cycle expanded version)

### Pass 1 — Constrained verification

**Tool:** Gemini API with `url_context` tool.

**KNOWN LIMITATION (discovered session 250):** url_context blocks reddit.com and news.ycombinator.com. Cannot use Gemini to fetch those URLs. Workaround: send corpus text directly + ask for verification of internal claims.

**Prompt template:** `nospace/development/contexter/content-factory/prompts/evening-digest-v2.md` (or morning equivalent)

**Output:** `digests/{date}-{HH}/triangulation-pass1.md` — filtered candidates with verification notes.

### Pass 2 — Deep Research enrichment

**API:** Gemini Deep Research endpoint (NEW, discovered session 250).

**When:** ONLY for big-news days requiring lateral context, discourse depth, notable voices that aren't in primary corpus. NOT default for daily.

**Output:** `digests/{date}-{HH}/triangulation-pass2.md` (deep enrichment).

### Skip path

If skipping triangulation: Orchestrator проверяет himself что у каждого top story есть ≥2 independent sources (Stage 1 outputs cover this) + minimum confidence threshold met. Move directly к Stage 3.

---

## Stage 3 — Master draft

This is the Orchestrator's main creative work. Subagent option exists but quality is currently better в main context.

### 3.1 Read inputs

```
nospace/development/contexter/content-factory/digests/{date}-{HH}/narrative-hn.md
nospace/development/contexter/content-factory/digests/{date}-{HH}/narrative-reddit.md
nospace/development/contexter/content-factory/digests/{date}-{HH}/structured-hn.json
nospace/development/contexter/content-factory/digests/{date}-{HH}/structured-reddit.yaml
```

Plus reference files:
```
nospace/development/contexter/content-factory/specs/editorial-layer-4-digest.md
~/.claude/projects/.../memory/reference_contexter_content_voice.md
```

### 3.2 Analyze landscape для mode selection

Apply Layer 4 decision tree:

```
1. Count comparable-significance stories from Stage 1 (target: 3-5)
2. For each candidate top story:
   - Score (impact + cross-source amplification + recency)
   - Note 2-3 line summary
3. Test for meta-thesis:
   - Read 3 top story summaries side-by-side
   - Ask: «Можно ли в 2 предложениях БЕЗ натяжки сформулировать структурный паттерн который объединяет?»
   - If YES → MODE A (meta-thesis frame)
   - If NO → MODE B (parallel tracks acknowledged)
4. Test for single dominant:
   - Is one story 2x impact of next?
   - If YES → MODE C (single takeover)
5. Test for monothematic:
   - Would primary story consume >60% of word budget if covered properly?
   - If YES → MODE D (monothematic essay)
```

**Decision logging:** record mode choice + justification in self-check section.

### 3.3 Pick opener type

```
IF MODE A: Type A aphorism + meta-thesis sentence (50-90 words total)
IF MODE B: Type A explicit acknowledgment ("три значимых развития сегодня") + assign anchor
IF MODE C: Type A dominant-story statement
IF MODE D: Type A + "сегодня только об этом" signal
```

If aphorism doesn't come naturally: fall back to Type C (plain boilerplate). Don't force grand claim для daily digest.

### 3.4 Section drafting per Layer 4 per-item template

For each top story:

```markdown
## [bold headline — declarative noun phrase, 2-5 words, lowercase]

*[italicized sub-header — 1 sentence context]*

Источник: HN front page · {score}/{comments} · age {age_h}h · velocity {pts_per_h} pts/hr · {authority_commenters_if_any} · {date_range}.

[Context paragraph: 100-200 слов. Где сигнал всплыл, что делает его non-obvious, source-traced facts.]

> "[verbatim quote ≤125 chars]"
> — {author}, {URL}, {date}

[Reframing paragraph: 100-200 слов. Money Stuff "principle-first → Anyway → news" pattern. Нашa interpretation, founder voice marker.]

[Optional: secondary point or "Также:" sub-section if section >250 words]

**Почему это важно:** [2-4 предложения. Implications для разработчиков RAG/MCP/инфраструктуры. 50-150 слов.]

[Optional: **Что проверяли / Что нашли / Оговорки** — only if evidence exists]

Кросс-источниковое подтверждение: {cross-source amplification details}. Уверенность: {HIGH/MEDIUM/LOW} ({source justification}).

**Источник:** [primary URL] · {date}
```

**Word budget per mode:**

| Mode | Story 1 | Story 2 | Story 3 | Valve | Total |
|---|---|---|---|---|---|
| A | 700-900w (45%) | 450-550w (30%) | 350-450w (25%) | 100-200w | 1700-2200w |
| B | 750-900w (45%) | 450-550w (30%) | 300-400w (20%) | 100-200w | 1700-2200w |
| C | 1300-1700w (75%) | 200-300w (15%) | — | 100-150w | 1700-2200w |
| D | 1700-2400w (95%) | — | — | 0-100w (optional) | 1700-2500w |

### 3.5 Compose secondary sections

**Под капотом** (optional — keep if there's a 2-3 thread tech-side micro-trend):
- 2-3 paragraphs
- Should connect к meta-thesis или describe orthogonal axis
- Don't include for sake of length

**Что не случилось** (optional — keep when negative signals are themselves data):
- 2-3 bullet items на отсутствие активности
- "Зеркальное отсутствие — тоже сигнал" framing

These sections live между last main story и closing valve. They are NOT counted в depth distribution table above (they're sidebar/interlude).

### 3.6 Compose closing valve

**MANDATORY:** «происходит всякое» — 8-15 items, 1-2 sentences each.

Register degrades:
- Items 1-4: technical signals (releases, version bumps, library updates)
- Items 5-7: business signals (license changes, hiring, infrastructure stats)
- Items 8+: absurdist tail (incongruous observations, bone-dry one-liners)

**OPTIONAL:** «пробую завтра» — 1-3 sentences, action-directed, personal voice.
- Format: "Делаю/переписываю/пробую {X}. Потому что {Y from today's signals}."
- Use when there's a concrete actionable item from the day's signals.
- Skip when nothing concrete maps to nopoint's day.

For evening cycle: «пробую завтра» feels native (action-directed for tomorrow).
For morning cycle: «что подготовить» variant works similarly (action-directed for today).

### 3.7 Compose lede (opener)

Write opener LAST, after all stories drafted. Why: lede must reflect actual content shape (which stories made it, what mode emerged), not predicted shape.

For MODE A: `[1-2 sentence framing] + [3 story summaries in 1 sentence each]`.
For MODE B: `[explicit acknowledgment of multi-story day] + [anchor designation]`.
For MODE C: `[dominant story headline] + [why it ate the issue]`.
For MODE D: `[single thesis statement] + ["сегодня только об этом"]`.

Length cap: 100 words for lede. Daily digest, not magazine essay.

### 3.8 Length check

- Total ≥ 1500 words: fine
- Total > 2500 words: cut. Likely under-tapered (story 4+ excessive). Trim valve first, then sidebar, then story 3 last paragraph.
- Total < 1500 words: probably scattered-day with thin signals. Either accept (don't pad) or expand valve to 12-15 items.

---

## Stage 4 — Editorial pipeline (4 layers)

Run sequentially. Each layer can require draft revision.

### 4.1 Layer 1 — Local pattern check

**Tool:** `contexter-vault check` CLI (path: `~/development/contexter-vault/`).

**Checks:** claim extraction, AI-tell tropes, TOV (forbidden words), logic patterns.

**Run:**
```bash
cd nospace/development/contexter
contexter-vault check development/contexter/content-factory/digests/{date}-{HH}/master-blog-post.md
```

**Output:** structured findings list. Apply: replace flagged terms, hedge unverifiable claims, fix logic anti-patterns.

### 4.2 Layer 2 — Self-check pass (inline)

Add `## self-check` section to master post. Verify:
- Confidence labels per claim
- Recency check (>24h flag)
- Numerical facts source-traced
- Forbidden words scan (en+ru lists, see voice memory)
- Founder voice markers count (≥3)
- Structural compliance (lowercase headers, em-dashes=0 outside valve, length window)
- Info-style compliance (active voice, present tense, concrete numbers, bounded claims)

If any check fails → revise → re-check.

### 4.3 Layer 3 — Factcheck-agent

**When:** every claim that names a number, person, organization, CVE, URL, quote.

**Tool:** factcheck-agent (Sonnet subagent).

**Launch:**
```python
Agent(
  description="Factcheck — {date} {cycle}",
  subagent_type="factcheck-agent",
  prompt=f"""
Verify factual claims in master post:
{path_to_draft}

Per `~/.claude/reglaments/fact-check.md` rules.
Output verification file: digests/{date}-{HH}/factcheck-verification.md
"""
)
```

**Wait for completion**, READ THE FILE (per E6, not just chat summary), apply verdicts:
- `verified` → keep
- `verified-thin` → keep + attribution if launch-critical
- `unverified` → REMOVE or hedge
- `contradicted` → REMOVE or fix
- `conflict` → flag, escalate to nopoint

### 4.4 Layer 4 — Genre/voice/filters

**Read:** `nospace/development/contexter/content-factory/specs/editorial-layer-4-digest.md`

**Apply checklist (~25 items):**

```
[ ] Mode declared (A/B/C/D) с justification
[ ] Opener type (A/B/C) declared
[ ] Mode A: meta-thesis statement в opener traceable
[ ] Word distribution within mode table (45/30/25, 70-85/15, 90-100)
[ ] НЕ equal 33/33/33
[ ] Section headers = noun phrases, no transitions, lowercase
[ ] Per-item template: 2 mandatory labels (Почему это важно + Источник) ✓
[ ] Closing valve present (Опция 1/2/3) — never cut
[ ] No backward-reference transitions
[ ] Russian rubric grid (если RU output, для Telegram-distribution)
[ ] 7 anti-patterns cleared (TL;DR, English bullets, "к слову" между bullets, calqued "Why it matters:", "Вчера X произошло" lede, "AI-инструменты", foreign-agent footer)
[ ] Voice anchor markers ≥3 в commentary блоках
[ ] Bridge phrases scan: paragraph-level OK, digest-level absent
[ ] Body sentence case + proper nouns capitalized
[ ] Headers lowercase
[ ] Cyrillic « » для русских цитат, " " для английских inline
[ ] Em-dashes 0 outside valve
[ ] Length 1500-2500 words

# Sub-layer 4.1: англицизмы фильтр
[ ] Англицизмы replaced where clean Russian equivalent exists (check таблицу в spec)
[ ] Allowed англицизмы только: proper nouns, specific tech terms (VRAM, MoE), industry-standard (frontend, agent, token, embedding), established financial (equity, credits)
[ ] No invented calques

# Sub-layer 4.2: non-tech reader filter
[ ] Каждый jargon term: replaced ИЛИ has 1-line first-mention explanation
[ ] First-mention explanation pattern: `[term] — [explanation]`
[ ] Главная мета-thesis понятна без technical knowledge
[ ] Test passes: PM-коллега за минуту пересказывает каждую story в собственных словах
```

If any fails → revise → re-check this layer.

---

## Stage 5 — File + chronicle

### 5.1 Final master post location

```
nospace/development/contexter/content-factory/digests/{date}-{HH}/master-blog-post.md
```

(Numbered versions like `-v2`, `-v3` only during iteration. Final = no suffix.)

### 5.2 Append to chronicle

Add row to `nospace/development/contexter/memory/chronicle/index.md`:

```markdown
| {date} | contexter | DIGEST | {N} | content-factory-{cycle} | digests/{date}-{HH}/master-blog-post.md |
```

### 5.3 Publish (TBD — pending blog.contexter.cc Astro deployment)

Future: `bash ops/publish-digest.sh {date}-{HH}` deploys to blog.contexter.cc.

For now: file lives in repo. Manual publish via Astro build + wrangler deploy when CTX-14 ready.

### 5.4 Snippets (FUTURE iteration)

Master article → derivative snippets для 11 platforms:
- HN comment / Show HN
- Reddit posts (per-sub adapted)
- Twitter/X thread (11 tweets)
- LinkedIn long-form post
- Telegram channel post (rubric grid format!)
- Substack newsletter
- Dev.to / Medium / Hashnode cross-posts (with canonical)
- IndieHackers founder journey

This stage is OUT OF SCOPE для v1 skill. Future skills: `digestToHN`, `digestToReddit`, `digestToTwitter`, etc., consume master post as input.

---

## Decision points (Orchestrator must choose)

| Decision | When | How |
|---|---|---|
| Cycle (morning/evening) | Pre-pipeline | Time-based (cron) or skill name |
| Trigger Pass 1 triangulation | After Stage 1 | If conflicting accounts OR 5+ comparable candidates |
| Trigger Pass 2 deep research | After Pass 1 | Only big-news days |
| Mode (A/B/C/D) | After Stage 1 | Decision tree in 3.2 |
| Opener type | Stage 3.7 | Per mode + aphorism availability |
| Sidebar sections | Stage 3.5 | Keep only if relevant |
| «Пробую завтра» include | Stage 3.6 | Only if concrete actionable maps to nopoint's day |
| Skip layer | Stage 4 | Never (all 4 mandatory) |
| Iterate vs accept | Stage 4 | Iterate until checklist passes; max 3 iterations per layer before escalate |

---

## Common failure modes + recovery

| Failure | Detection | Recovery |
|---|---|---|
| HN agent stuck | No incremental writes for 10+ min | Send `[STATUS]` request via SendMessage; if no response, kill + relaunch |
| Reddit JSON API rate limit | 429 errors in raw JSON files | Wait 5 min, agent should retry. If persistent, use HNRSS-style caching |
| Stage 1 outputs thin (<3 candidates) | Manually inspect narrative outputs | Switch to MODE D (monothematic) or expand window backward |
| Stage 2 blocked URLs | Gemini reports url_context refused for HN/Reddit | Skip Pass 1; corpus from Stage 1 sufficient |
| L3 factcheck reports 3+ contradicted claims | Factcheck verification file | Mass revision required; consider WHY draft has wrong facts (training drift? agent hallucination?) |
| L4 mode test inconclusive | Can't decide A/B | Default to MODE B with explicit acknowledgment. Better honest fragmentation than fake thread. |
| Length over 2500w | Word count after L4 | Trim valve first → sidebar → story 3 last paragraph |
| Aphorism feels grandiose | Self-check or nopoint review | Downgrade to Type C plain opener. Daily digest, not manifesto. |
| Non-tech filter fails (PM test) | Layer 4 sub-layer 4.2 | Add first-mention explanations OR rewrite key sentences accessibility-first |

---

## Time + cost estimates

| Stage | Time | Token cost | Notes |
|---|---|---|---|
| Stage 1A (HN) | 10-15 min | ~80-100K | Per agent context |
| Stage 1B (Reddit) | 10-15 min | ~80-100K | Per agent context |
| Stage 2 Pass 1 | 5-10 min | ~30-50K | Skipped by default |
| Stage 2 Pass 2 | 15-30 min | ~80-150K | Big-news-day only |
| Stage 3 (master draft) | 20-30 min | ~30-50K | Orchestrator main context |
| Stage 4.1 (vault) | 1-2 min | local CLI | No tokens |
| Stage 4.2 (self-check) | 5 min | ~5-10K | Inline pass |
| Stage 4.3 (factcheck) | 10-15 min | ~50-80K | Subagent |
| Stage 4.4 (Layer 4) | 5-10 min | ~10-20K | Orchestrator inline |
| Stage 5 | 2-5 min | <5K | File ops |

**Total typical cycle:** 60-90 min real time, ~250-350K tokens (включая subagent contexts isolated, не загружают main).

**With Pass 2 enrichment:** +30-60 min, +100-150K tokens.

---

## Output file structure

```
nospace/development/contexter/content-factory/digests/{date}-{HH}/
├── narrative-hn.md                    # Stage 1A
├── narrative-reddit.md                # Stage 1B
├── structured-hn.json                 # Stage 1A
├── structured-reddit.yaml             # Stage 1B
├── raw-{sub}-{type}.json              # Stage 1B (Reddit raw cache)
├── parsed-candidates.json             # optional, manual filter
├── triangulation-pass1.md             # Stage 2 (optional)
├── triangulation-pass2.md             # Stage 2 (optional, big-news only)
├── factcheck-verification.md          # Stage 4.3
└── master-blog-post.md                # Stage 5 final
```

---

## Spec / reference files used by pipeline

| File | Purpose |
|---|---|
| `nospace/development/contexter/content-factory/specs/editorial-layer-4-digest.md` | Layer 4 genre spec |
| `nospace/development/contexter/content-factory/specs/master-article-process.md` | This document |
| `nospace/development/contexter/content-factory/prompts/evening-digest-v2.md` | Triangulation Pass 1 prompt |
| `~/.claude/agents/hn-correspondent.md` | HN agent definition |
| `~/.claude/agents/reddit-correspondent.md` | Reddit agent definition |
| `~/.claude/projects/.../memory/reference_contexter_content_voice.md` | Voice rules + англицизмы + non-tech filter |
| `~/.claude/reglaments/fact-check.md` | L3 factcheck workflow |
| `~/.claude/rules/standards.md` | Quality standards (E3, E6, A1, B1, B7 etc.) |

---

## Skills for automation

Two skills handle automated execution:

### `/morningDigest`

Located at `~/.claude/skills/morningDigest/SKILL.md`.
Auto-triggers: 09:00 UTC cron, or manual `/morningDigest` invocation.

### `/eveningDigest`

Located at `~/.claude/skills/eveningDigest/SKILL.md`.
Auto-triggers: 21:00 UTC cron, or manual `/eveningDigest` invocation.

Both skills follow this exact process document. Skills delegate stages 1-4 в subagents/tools; Stage 3 (master draft) executed in main context; Stage 5 file ops via Bash + Edit.

---

## Versioning

| Version | Date | Change |
|---|---|---|
| v1 | 2026-04-25 | Initial documentation. Layer 4 spec applied. Англицизмы + non-tech filter integrated. HN + Reddit only (Wave 1 correspondents pending: GitHub, ArXiv, HF, Dev.to). |

Future versions will track:
- Wave 2 correspondents added (Anthropic / OpenAI / Google blogs)
- Wave 3 Telegram correspondent
- Snippet skills (per-platform derivatives)
- Publish automation (Astro deployment)
- Schedule cron mechanism (Anthropic scheduled-tasks MCP or ops cron)
