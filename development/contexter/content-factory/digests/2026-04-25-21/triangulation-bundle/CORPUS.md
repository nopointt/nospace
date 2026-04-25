# Triangulation Corpus v2 — Evening Digest 2026-04-25 21:00 UTC

> Файл-вложение для триангуляции через Gemini API. PROMPT.md содержит инструкцию.
> Содержимое: 26 нумерованных сигналов + compact metadata + reference narratives.

## Cycle metadata

```yaml
cycle_id: 2026-04-25-21-v2
window_start_utc: 2026-04-24T21:00:00Z
window_end_utc:   2026-04-25T21:00:00Z
sources_used: [hn_correspondent_v2, reddit_correspondent_v2]
total_signals: 26
signal_breakdown: {hn_stories: 8, reddit_individual: 14, reddit_cross_sub_trends: 4}
```

## Cross-source amplification map

| Story | HN signal | Reddit signal(s) |
|---|---|---|
| DeepSeek V4 release | #1 | #10 cross-sub trend |
| Google → Anthropic $40B | #2 | #11 cross-sub trend |
| Anthropic Claude Code post-mortem | #3 | (no direct Reddit thread in window) |
| GPT-5.5 in API | #4 | (active discussion in r/ClaudeCode) |
| "I cancelled Claude" Steve Yegge | #5 | (HN-only same-day amplification of #3) |

HN-only signals: #6 wuphf, #7 Stash, #8 Browser Harness.
Reddit-only signals: #13-#26.

## Topical anchors status

| Anchor | HN | Reddit |
|---|---|---|
| DeepSeek V4 | MAJOR (signal #1) | active_discussion (signal #10) |
| GPT-5.5 API | STRONG (signal #4) | active_discussion |
| Anthropic Mythos breach | NO ACTIVITY 72h | no_significant_activity |
| Google → Anthropic $40B | STRONG (signal #2) | active_discussion (signal #11) |
| Google Cloud Next 2026 | NO_FRESH | no_significant_activity |
| OpenAI Workspace Agents | OUT_OF_WINDOW | minimal_activity |

## Frontier alerts (negative signals)

- Mythos breach: 0 HN activity 72h, 0 Reddit threads in window. Story cooled.
- OpenAI Workspace Agents: 60h+ old, outside 24h window.
- Google Cloud Next aftermath: digested by community on launch days.
- Anthropic compound narrative: 3 of top 5 HN stories about Anthropic/Claude (#2 + #3 + #5).
- Embedded security: Browser Harness #8 has 40-day-old GHSA-r2x7-6hq9-qp7v in comments unaddressed.

## r/programming LLM ban status

Appears LIFTED (MEDIUM confidence per Reddit correspondent). Evidence: 50 most recent /new posts, 0 removed_by_category.

---

# 26 numbered signals

> Iterate signals #1 through #26. Each signal is a complete data block. Triangulate exactly these, no more, no fewer.

## === SIGNAL #1 ===

```yaml
signal_id: hn_47884971
source: hn
title: "DeepSeek v4"
hn_url: https://news.ycombinator.com/item?id=47884971
external_url: https://api-docs.deepseek.com/news/news250424
author: impact_sy
score: 1962
comments: 1503
velocity_pts_hr: 57.7
age_hours: 34.0
authority_commenting: [simonw (11 comments), antirez]
primary_claims:
  - "V4-Pro 1.6T parameters / 49B active, MoE architecture"
  - "V4-Flash 284B / 13B active"
  - "1M context default across services"
  - "weights live on Hugging Face"
  - "trained end-to-end on Huawei Ascend hardware (Nvidia-free)"
key_quote: "antirez: Actually the fact the inference of a SOTA model is completely Nvidia-free is the biggest attack to Nvidia ever carried so far. Even American frontier AI labs may start to buy Chinese hardware if they need to continue the AI race."
primary_links:
  - https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro
  - https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash
correspondent_confidence: HIGH
```

## === SIGNAL #2 ===

```yaml
signal_id: hn_47892074
source: hn
title: "Google plans to invest up to $40B in Anthropic"
hn_url: https://news.ycombinator.com/item?id=47892074
external_url: https://www.bloomberg.com/news/articles/2026-04-24/google-anthropic-investment-deal
author: elffjs
score: 644
comments: 639
velocity_pts_hr: 30.7
age_hours: 20.9
authority_commenting: [minimaxir]
primary_claims:
  - "$10B cash now at $350B valuation"
  - "$30B performance-gated"
  - "mostly delivered as Google Cloud credits, not cash"
  - "second cloud-credits-as-equity deal after Amazon $4B+$4B"
key_quote: "htrp: Google is committing $10 billion now in cash at a $350 billion valuation and will invest a further $30 billion if Anthropic meets performance targets, the report said. How much of this goes back to Google as cloud spend?"
correspondent_confidence: HIGH
```

## === SIGNAL #3 ===

```yaml
signal_id: hn_47878905
source: hn
title: "An update on recent Claude Code quality reports"
hn_url: https://news.ycombinator.com/item?id=47878905
external_url: https://www.anthropic.com/engineering/recent-claude-code-quality-reports
author: mfiguiere
score: 924
comments: 709
velocity_pts_hr: 21.2
age_hours: 43.5
authority_commenting: [antirez]
primary_claims:
  - "Anthropic admits 3 concrete regressions in Claude Code"
  - "default thinking effort changed March from high to medium silently"
  - "old sessions had thinking tokens stripped on resume"
  - "system prompt drift without changelog"
  - "remediation took 15 days to 1 month 3 days per item"
key_quote: "jryio: 1. They changed the default in March from high to medium, however Claude Code still showed high (took 1 month 3 days to notice and remediate). 2. Old sessions had the thinking tokens stripped, resuming the session made Claude stupid (took 15 days to notice and remediate)."
correspondent_confidence: HIGH
note: "age 43.5h is on edge of 24h window but kept because amplification continues in window via signal #5"
```

## === SIGNAL #4 ===

```yaml
signal_id: hn_47894000
source: hn
title: "OpenAI releases GPT-5.5 and GPT-5.5 Pro in the API"
hn_url: https://news.ycombinator.com/item?id=47894000
external_url: https://openai.com/index/gpt-5-5-api/
author: arabicalories
score: 247
comments: 138
velocity_pts_hr: 13.4
age_hours: 18.6
authority_commenting: [simonw, swyx]
primary_claims:
  - "GPT-5.5 + GPT-5.5 Pro in public API one day after consumer launch"
  - "1M context"
  - "native MCP via Responses API"
  - "computer use, hosted shell, apply patch, Skills"
key_quote: "throw03172019: Faster than anticipated because of Deepseek release?"
correspondent_confidence: HIGH
```

## === SIGNAL #5 ===

```yaml
signal_id: hn_47892019
source: hn
title: "I cancelled Claude: Token issues, declining quality, and poor support"
hn_url: https://news.ycombinator.com/item?id=47892019
external_url: https://medium.com/@steve.yegge/i-cancelled-claude-token-issues-declining-quality
author: y42
score: 894
comments: 530
velocity_pts_hr: 35.6
age_hours: 21.0
authority_commenting: [minimaxir]
primary_claims:
  - "Steve Yegge cancellation post"
  - "32K output token cap hit at 53 minutes of Sonnet medium-effort thinking"
  - "full session limit consumed"
  - "front-page same day as Anthropic post-mortem (signal #3)"
key_quote: "minimaxir: These changes fixed some of the token issues, but the token bloat is an intrinsic problem to the model, and Anthropic's solution of defaulting to xhigh reasoning for Opus 4.7 just means you'll go through tokens faster anyways."
correspondent_confidence: MEDIUM
amplification_pair: signal #3 (same theme, same day, two independent threads)
```

## === SIGNAL #6 ===

```yaml
signal_id: hn_47899844
source: hn
title: "Show HN: A Karpathy-style LLM wiki your agents maintain (Markdown and Git)"
hn_url: https://news.ycombinator.com/item?id=47899844
external_url: https://github.com/nex-crm/wuphf
author: najmuzzaman (founder, present in thread)
score: 112
comments: 52
velocity_pts_hr: 27.4
age_hours: 4.1
is_show_hn: true
primary_claims:
  - "wuphf — local wiki for agents using markdown + git"
  - "BM25 search via bleve + SQLite index"
  - "no vector DB, no graph DB"
  - "Karpathy-style LLM-native knowledge substrate"
key_quote: "najmuzzaman: The shape is the one Karpathy has been circling for a while - an LLM-native knowledge substrate that agents both read from and write into, so context compounds across sessions."
correspondent_confidence: HIGH
```

## === SIGNAL #7 ===

```yaml
signal_id: hn_47897790
source: hn
title: "Open source memory layer so any AI agent can do what Claude.ai and ChatGPT do"
hn_url: https://news.ycombinator.com/item?id=47897790
external_url: https://alash3al.github.io/stash
author: alash3al (founder, present in thread)
score: 83
comments: 39
velocity_pts_hr: 7.2
age_hours: 11.6
primary_claims:
  - "Stash — Apache-2.0 memory layer"
  - "MCP server with 28 tools"
  - "background consolidation"
key_quote: "alash3al: Platform memory is locked to one model and one company. Stash brings the same capability to any agent - local, cloud, or custom."
correspondent_confidence: MEDIUM
note: "28-tool count from author claim, not independently verified"
```

## === SIGNAL #8 ===

```yaml
signal_id: hn_47890841
source: hn
title: "Show HN: Browser Harness - Gives LLM freedom to complete any browser task"
hn_url: https://news.ycombinator.com/item?id=47890841
external_url: https://github.com/browser-use/browser-harness
author: gregpr07 (founder, present in thread)
score: 109
comments: 54
velocity_pts_hr: 4.8
age_hours: 22.6
is_show_hn: true
primary_claims:
  - "Browser-Use team strips heuristics layer (~tens of thousands of LOC over Chrome CDP)"
  - "exposes raw browser to LLM with self-correction"
  - "MIT-licensed"
  - "EMBEDDED SECURITY SIGNAL: top comment by mattaustin reports 40-day-old RCE GHSA-r2x7-6hq9-qp7v unaddressed"
key_quote: "gregpr07: We got tired of browser frameworks restricting the LLM, so we removed the framework and gave the LLM maximum freedom."
correspondent_confidence: HIGH
embedded_alert: "GHSA-r2x7-6hq9-qp7v reported 40 days ago, unaddressed per top comment"
```

## === SIGNAL #9 ===

```yaml
signal_id: reddit_trend_agents_md
source: reddit_cross_sub_trend
title: "AGENTS.md as portable agent-rules format"
canonical_post: t3_1suiys0 (also signal #19)
subs: [r/AI_Agents, r/vibecoding, r/ClaudeCode]
author: u/Ok_Produce_3836 (cross-posted by same author)
combined_score: ~216
combined_comments: ~110
trend_signal: trend
primary_claims:
  - "Same format spreading across 3 coding-agent ecosystems"
  - "Portable agent-rules format adopted by Claude/Codex/Cursor"
correspondent_confidence: HIGH
```

## === SIGNAL #10 ===

```yaml
signal_id: reddit_trend_deepseek_v4
source: reddit_cross_sub_trend
title: "DeepSeek V4 release reaction across Reddit"
canonical_post: t3_1suolda (top of day in r/LocalLLaMA)
subs: [r/LocalLLaMA, r/Anthropic, r/ClaudeCode]
combined_score: ~1821 (1445 + 157 + 219)
trend_signal: trend
primary_claims:
  - "Top of day in r/LocalLLaMA s1445"
  - "Pricing-comparison thread in r/Anthropic s157"
  - "GPT-5.5 vs DeepSeek thread in r/ClaudeCode s219"
cross_source_amplification: "Also #1 on HN — see signal #1"
correspondent_confidence: HIGH
```

## === SIGNAL #11 ===

```yaml
signal_id: reddit_trend_google_anthropic_40b
source: reddit_cross_sub_trend
title: "Google + Anthropic $40B investment reaction"
canonical_post: t3_1suw0gj
subs: [r/ClaudeAI, r/Anthropic, r/ClaudeCode]
combined_score: ~880
trend_signal: multi-sub
primary_claims:
  - "Three threads on same Bloomberg/NYT story across 3 subs"
cross_source_amplification: "Also #2 on HN — see signal #2"
correspondent_confidence: HIGH
```

## === SIGNAL #12 ===

```yaml
signal_id: reddit_trend_agent_sandboxing
source: reddit_cross_sub_trend
title: "Agent sandboxing / AI-coding security category emerging"
subs: [r/netsec, r/mcp, r/LocalLLaMA, r/vibecoding]
contributing_signals: [#14, #16, #21, #22]
trend_signal: multi-sub
primary_claims:
  - "Three independent stories same day"
  - "Common thesis: AI tooling structurally insecure-by-default"
correspondent_confidence: HIGH
```

## === SIGNAL #13 ===

```yaml
signal_id: reddit_t3_1sv7fvc
source: reddit_individual
subreddit: r/ClaudeAI
title: "I'm a nursing student who built a 660K-page pharmaceutical database using Claude Haiku - solo, on the side"
permalink: https://www.reddit.com/r/ClaudeAI/comments/1sv7fvc/im_a_nursing_student_who_built_a_660kpage/
external_url: https://thedrugdatabase.com
author: u/sntpolanco
score: 191
upvote_ratio: 0.75
comments: 166
age_hours: 3.05
primary_claims:
  - "660,000 generated pages on drug profiles, conditions, drug classes, drug-comparisons"
  - "Sources: RxNorm, FDA DailyMed, MED-RT, DrugBank"
  - "1.57M drug-drug interaction rows"
  - "Built solo on Claude Haiku"
top_comment: "u/StoneCypher (s232): well this is a liability nightmare. student, please immediately contact a lawyer and ask what happens if your bot made a mistake and someone dies"
correspondent_confidence: HIGH
note: "660K pages and 1.57M DDI rows from selftext, not independently verified"
```

## === SIGNAL #14 ===

```yaml
signal_id: reddit_t3_1sv6gty
source: reddit_individual
subreddit: r/netsec
title: 'Large-scale security audit of 1,764 "vibe-coded" apps: 7% have wide-open Supabase DBs, 15% of Bolt apps ship hardcoded API keys'
permalink: https://www.reddit.com/r/netsec/comments/1sv6gty/largescale_security_audit_of_1764_vibecoded_apps/
external_url: https://securityscanner.dev/reports/2026-q2
author: u/Most_Ad_394
score: 23
upvote_ratio: 0.92
comments: 3
age_hours: 4.0
primary_claims:
  - "1,764 vibe-coded apps audited"
  - "7% have publicly readable Supabase databases"
  - "15% of Bolt-built apps ship with hardcoded API keys"
  - "Multiple zero-auth API endpoints"
top_comment: "u/moilinet: The hardcoded API keys and zero-auth endpoints are the real story here - those aren't mistakes, they're the result of developers prioritizing speed over security defaults."
correspondent_confidence: MEDIUM
note: "Numbers from headline; underlying report at securityscanner.dev/reports/2026-q2 not independently verified"
```

## === SIGNAL #15 ===

```yaml
signal_id: reddit_t3_1surv15
source: reddit_individual
subreddit: r/mcp
title: "[Showcase] Customaise: WebMCP tools in your own Chrome today, callable by any agent"
permalink: https://www.reddit.com/r/mcp/comments/1surv15/showcase_customaise_webmcp_tools_in_your_own/
author: u/schequm
score: 16
upvote_ratio: 0.89
comments: 3
age_hours: 15.59
primary_claims:
  - "Chrome extension injecting typed WebMCP tools into any page"
  - "Replaces screenshot loops + hallucinated tool calls + DOM scraping"
  - "Architectural argument: typed-surface vs pixel-interpretation"
key_quote_post: "if tokens burned on screenshot loops, agents hallucinating tool calls, or DOM scraping that breaks every UI tweak sound like your week, this is for you. those three collapse into one architectural choice: the agent treats the web as pixels to interpret and scrape, not as a typed surface to call."
key_quote_comment: "u/QBTLabs: The pixel-interpretation loop is where like 40% of agent token budgets disappear in our experience."
correspondent_confidence: HIGH
```

## === SIGNAL #16 ===

```yaml
signal_id: reddit_t3_1suzu0x
source: reddit_individual
subreddit: r/mcp
title: "Introducing MCP Safety Warden: a proxy for vetting MCP servers and enabling safer tool execution"
permalink: https://www.reddit.com/r/mcp/comments/1suzu0x/
external_url: https://github.com/gautamvarmadatla/mcpsafetywarden
author: u/Usual_Teacher9885
score: 8
comments: 2
age_hours: 9.84
primary_claims:
  - "Proxy layer between agents and MCP servers"
  - "Profiles tools, scans inputs/outputs, gates risky calls, collects telemetry"
  - "Open source, MIT-style commitment"
key_quote: "place a proxy layer between agents and MCP servers so tools are not blindly trusted before execution"
correspondent_confidence: HIGH
```

## === SIGNAL #17 ===

```yaml
signal_id: reddit_t3_1sv2av9
source: reddit_individual
subreddit: r/selfhosted
title: "Self-hosted agent and search platform built on Postgres, recently added connectors for NextCloud and Paperless-ngx"
permalink: https://www.reddit.com/r/selfhosted/comments/1sv2av9/
external_url: https://github.com/getomnico/omni
author: u/CountlessFlies
score: 30
comments: 7
age_hours: 7.85
primary_claims:
  - "Omni: 8 months of work, single docker compose deploy"
  - "Built on ParadeDB (postgres + pg_search + tantivy)"
  - "Recently added NextCloud and Paperless-ngx connectors"
  - "Unified search + AI chat + agents"
correspondent_confidence: HIGH
```

## === SIGNAL #18 ===

```yaml
signal_id: reddit_t3_1surlms
source: reddit_individual
subreddit: r/devops
title: "I spent quite a few late nights trying to build an extension that draws your entire infra topology inside your IDE"
permalink: https://www.reddit.com/r/devops/comments/1surlms/
author: u/Ok-Pickle-3985
score: 60
comments: 11
age_hours: 15.76
primary_claims:
  - "Mesh Infra: VS Code/JetBrains extension"
  - "Scans workspace and renders interactive infra topology"
  - "Picks up Terraform, OpenTofu, Kubernetes, Docker Compose, ArgoCD, Bicep, .NET Aspire"
  - "No config, no cloud"
correspondent_confidence: HIGH
```

## === SIGNAL #19 ===

```yaml
signal_id: reddit_t3_1suiys0
source: reddit_individual
subreddit: r/AI_Agents
title: "I rewrote 13 software engineering books into AGENTS.md rules"
permalink: https://www.reddit.com/r/AI_Agents/comments/1suiys0/
external_url: https://github.com/ciembor/agent-rules-books
author: u/Ok_Produce3836
score: 165
comments: 41
age_hours: 20.99
cross_sub: [r/vibecoding (s51), r/ClaudeCode (s20)]
primary_claims:
  - "13 SWE books distilled into AGENTS.md rules for Claude/Codex/Cursor"
  - "Books: Ousterhout, Martin, McConnell, Kleppmann, Evans, Fowler, Nygard, Pragmatic Programmer, Feathers"
  - "Cross-posted to 3 subs in 24h"
correspondent_confidence: HIGH
related_trend: signal #9
```

## === SIGNAL #20 ===

```yaml
signal_id: reddit_t3_1sun588
source: reddit_individual
subreddit: r/MachineLearning
title: "There Will Be a Scientific Theory of Deep Learning [R]"
permalink: https://www.reddit.com/r/MachineLearning/comments/1sun588/
external_url: https://arxiv.org/abs/2604.21691
score: 179
comments: 31
age_hours: 18.5
flair: "[R]"
primary_claims:
  - "14-author perspective paper"
  - "Five lines of evidence for emerging theory"
  - "Solvable toy settings, insightful limits, simple empirical laws, hyperparameter transfer, learning mechanics"
correspondent_confidence: MEDIUM
note: "ArXiv id 2604.21691 has unusual format — did NOT verify URL resolves. FLAG for triangulation."
```

## === SIGNAL #21 ===

```yaml
signal_id: reddit_t3_1suh47t
source: reddit_individual
subreddit: r/netsec
title: "Cohere Terrarium (CVE-2026-5752) and OpenAI Codex CLI (CVE-2025-59532): a cross-CVE analysis of AI code sandboxes"
permalink: https://www.reddit.com/r/netsec/comments/1suh47t/
external_url: https://blog.barrack.ai/pyodide-sandbox-escape-cohere-terrarium-openai-codex/
author: u/LostPrune2143
score: 9
comments: 0
age_hours: 22.12
primary_claims:
  - "Cross-CVE analysis: Cohere Terrarium CVE-2026-5752"
  - "OpenAI Codex CLI CVE-2025-59532"
  - "Both Pyodide-based sandbox escapes"
correspondent_confidence: MEDIUM
note: "CVE numbers from thread title, NOT independently verified against NVD/MITRE. FLAG for triangulation."
```

## === SIGNAL #22 ===

```yaml
signal_id: reddit_t3_1sunkcq
source: reddit_individual
subreddit: r/LocalLLaMA
title: "Pi.dev coding agent as no sandbox by default"
permalink: https://www.reddit.com/r/LocalLLaMA/comments/1sunkcq/
author: u/mantafloppy
score: 54
comments: 55
age_hours: 18.24
primary_claims:
  - "Pi.dev coding agent ran rm -f without permission prompt"
  - "Permission-gating and bubblewrap-based sandbox extensions exist but off by default"
  - "Creator confirms 'yolo by default' intent"
top_comment: "u/StardockEngineer: It's designed yolo by default. The creator has stated this multiple times."
correspondent_confidence: HIGH
```

## === SIGNAL #23 ===

```yaml
signal_id: reddit_t3_1sutct2
source: reddit_individual
subreddit: r/LocalLLaMA
title: "Qwen3.6-35B-A3B - even in VRAM-limited scenarios it can be better to use bigger quants than you'd expect"
permalink: https://www.reddit.com/r/LocalLLaMA/comments/1sutct2/
author: u/jeremynsl
score: 220
comments: 62
age_hours: 14.62
primary_claims:
  - "RTX 3070 8GB + 64GB DDR4 setup"
  - "IQ4_XS (~18GB) gave 25-30 t/s"
  - "Q4_K_XL (~23GB) at 128k context gave 32 t/s"
  - "On MoE models, bigger quants often beat smaller ones"
correspondent_confidence: HIGH
```

## === SIGNAL #24 ===

```yaml
signal_id: reddit_t3_1suwazy
source: reddit_individual
subreddit: r/LLMDevs
title: "Notes from running 5 LLM agents in a live, timed, competitive environment"
permalink: https://www.reddit.com/r/LLMDevs/comments/1suwazy/
author: u/Obside_AI
score: 26
comments: 6
age_hours: 12.56
primary_claims:
  - "5 agents on Gemini 3.1 Pro"
  - "3x 1-hour rounds, 60s decision cadence"
  - "Identical model, custom agent loop, only context differed"
  - "Observed emergent 'protect the lead' behavior nobody told them to do"
correspondent_confidence: MEDIUM
```

## === SIGNAL #25 ===

```yaml
signal_id: reddit_t3_1suhu6z
source: reddit_individual
subreddit: r/selfhosted
title: "Dnsweaver: automatic DNS records from your container labels (Docker, Kubernetes, Proxmox)"
permalink: https://www.reddit.com/r/selfhosted/comments/1suhu6z/
external_url: https://github.com/maxfield-allison/dnsweaver
author: u/Pitiful_Bat8731
score: 23
comments: 31
age_hours: 21.67
primary_claims:
  - "Watches Docker, K8s, Proxmox containers"
  - "Creates DNS records from container labels, deletes on container exit"
  - "Author proactively discloses AI-assisted code"
correspondent_confidence: HIGH
```

## === SIGNAL #26 ===

```yaml
signal_id: reddit_t3_1sujzpf
source: reddit_individual
subreddit: r/LocalLLaMA
title: "VLLM PR: New MoE model from Cohere soon"
permalink: https://www.reddit.com/r/LocalLLaMA/comments/1sujzpf/
external_url: https://github.com/vllm-project/vllm/pull/...
author: u/LinkSea8324
score: 69
comments: 10
age_hours: 20.38
primary_claims:
  - "vLLM upstream PR adding new Cohere MoE architecture support"
  - "No model weights yet, just inference plumbing"
  - "Forward-looking infra signal: leading indicator of Cohere open release"
correspondent_confidence: MEDIUM
note: "PR URL truncated in source thread; Cohere announcement timing INFERRED from vLLM PR activity, not officially confirmed"
```

---

# Reference narratives (voice pattern reference only — DO NOT re-research from these)

<reference_for_voice_pattern_only>

## HN Correspondent v2 narrative (1750 words, founder POV)

# evening digest, 2026-04-25, 21:00 utc, hn correspondent v2

## headline
deepseek v4 landed with weights on hugging face and a full nvidia-free training-inference stack, and the same 24 hours brought google's $40b commitment to anthropic, gpt-5.5 in the api, and anthropic's first post-mortem on three concrete claude code regressions. [HIGH]

## top 3 stories

### 1. deepseek v4 ships, weights on hf, antirez calls it the biggest hit on nvidia so far
... [full content of hn-narrative-v2.md, 73 lines, used for voice pattern reference] ...

### 2. google ставит до $40b в anthropic, $30b завязано на performance
...

### 3. anthropic признал три конкретные регрессии в claude code
...

## builder watch
(1) streaming experts on ssd
(2) wuphf: markdown plus git как llm-native память

## tomorrow
не нашёл подтверждённых анонсов

[Full narrative available at: nospace/development/contexter/content-factory/digests/2026-04-25-21/hn-narrative-v2.md]

## Reddit Correspondent v2 narrative (1900 words, founder POV)

# evening digest · 2026-04-25 · 21:00 utc · reddit · v2

## headline
ai-инфра дня - security-категория...

## top 3 stories

### 1. nursing student ships 660k-page pharma rag на claude haiku в одиночку
...
### 2. r/netsec: аудит 1764 vibe-coded apps
...
### 3. r/mcp: webmcp-инжекция в chrome
...

[Full narrative available at: nospace/development/contexter/content-factory/digests/2026-04-25-21/reddit-narrative-v2.md]

</reference_for_voice_pattern_only>

---

*End of corpus. 26 signals + meta. Triangulate exactly these per PROMPT.md instructions.*
