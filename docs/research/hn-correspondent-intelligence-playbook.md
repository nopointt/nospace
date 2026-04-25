# HN Correspondent Intelligence Playbook
> Production-grade reference for `hn-correspondent` subagent
> Generated: 2026-04-25 from existing research + live API verification + April 2026 web research
> Audience: developers, AI/ML engineers, founders, builders. Senior-technical, privacy + OSS bias, anti-marketing reflex.

## 1. Mission and scope

Daily intelligence gathering for Contexter content factory. Runs 09:00 UTC and 21:00 UTC.

**8 core topics:**
1. RAG / retrieval / embeddings / vector databases
2. MCP (Model Context Protocol) and agent tooling
3. LLM infrastructure and deployment
4. AI devtools (Cursor, Continue, Aider, Claude Code, Cline)
5. Agent frameworks (LangGraph, CrewAI, AutoGen, emerging)
6. AI security (prompt injection, secret leakage, sandboxing)
7. Dev productivity / engineering culture
8. Self-hosted / open-source AI

**Hard exclusions:** politics, hiring threads, crypto without tech depth, HN-meta drama, duplicate URLs (<72h), tutorial content (mod-downranked), "X considered harmful" rants.

## 2. APIs

### Algolia (search) — http://hn.algolia.com/api/v1

No auth. CORS open. ~1 min lag from live.

| Endpoint | Use |
|---|---|
| `/search` | Relevance-ranked search |
| `/search_by_date` | Date desc search (PRIMARY for daily digest) |
| `/items/:id` | Single item + nested comment tree |

**Tags (AND default, OR via parens):**
- `story` / `comment` / `poll` / `pollopt`
- `show_hn` / `ask_hn`
- `front_page`
- `author_USERNAME`
- `story_ITEM_ID` (comments on specific story)

**numericFilters fields:** `points`, `num_comments`, `created_at_i` (Unix seconds).
Operators: `<`, `<=`, `=`, `!=`, `>=`, `>`. Comma-separated = AND.

**Pagination:** `hitsPerPage` (max 1000), `page` (zero-indexed).

**Time filter pattern:**
```bash
NOW=$(date +%s)
SINCE_24H=$((NOW - 86400))
SINCE_12H=$((NOW - 43200))
# Use: numericFilters=created_at_i>${SINCE_12H}
```

**Example: RAG stories last 24h with 20+ points:**
```bash
curl "http://hn.algolia.com/api/v1/search_by_date?\
tags=story&\
query=RAG+retrieval&\
numericFilters=created_at_i>${SINCE_24H},points>20&\
hitsPerPage=20"
```

### Firebase (live) — https://hacker-news.firebaseio.com/v0

No auth. Real-time vs Algolia's lag. Safe interval: 15-30s between bulk calls.

| Endpoint | Returns |
|---|---|
| `/topstories.json` | Top 500 IDs ranked |
| `/newstories.json` | 500 newest IDs |
| `/beststories.json` | 500 best (moderated quality) |
| `/showstories.json` | Show HN IDs (200) |
| `/askstories.json` | Ask HN IDs (200) |
| `/jobstories.json` | Job IDs (200, exclude these) |
| `/item/:id.json` | Single item full data |
| `/user/:username.json` | User profile |
| `/maxitem.json` | Current max ID (detect new) |
| `/updates.json` | Recently changed items |

**Item fields:** `id`, `type`, `by`, `time` (Unix), `title`, `url`, `text`, `score`, `descendants`, `kids` (array), `parent`, `dead`, `deleted`.

**User fields:** `id`, `karma`, `created`, `about`, `submitted` (array).

### HNRSS — https://hnrss.org

Fallback / passive monitoring. Use Algolia/Firebase for active scouting.

Endpoints: `/frontpage`, `/newest`, `/ask`, `/show`, `/launches`, `/bestcomments`, `/pool`, `/jobs`, `/submitted?id=NAME`.

Params: `q=KEYWORD`, `points=N`, `comments=N`, `count=N` (max 100).

**Quality RSS for digest:** `https://hnrss.org/frontpage?points=30&count=50`

## 3. Daily scout protocol

**Phase 1 — Front page capture (~60s, 3 calls)**
1. GET `/topstories.json` (500 IDs)
2. Parallel fetch first 30 items via `/item/:id.json`
3. Compute velocity = `score / age_hours`. Filter velocity > 5 OR score > 50.

Tags: `velocity > 50` = HIGH, `20-50` = MEDIUM, `5-20` = LOW.

**Phase 2 — Topic query sweep (~2min, 8 parallel queries)**
Run 8 Algolia `search_by_date` queries (Section 6). Dedupe against Phase 1.

**Phase 3 — Show HN sweep (1 call)**
```
GET https://hnrss.org/show?points=20&count=30&link=comments
```
Show HN at 15+ pts in our domain = include regardless of overall score.

**Phase 4 — Dedup + skip-list filter** (Section 7)

**Phase 5 — Comment intelligence** for top 5 stories
```
GET /items/:id  # full nested tree
```
Extract top 3 first-level comments, founder presence, authority commenters.

**Phase 6 — Score + rank** (5 dimensions, 0-2 each, max 10)
- Topic relevance
- Engagement quality (comment/score ratio 0.5-1.2 = ideal)
- Velocity
- Source authority (known author = +2)
- Technical depth (code/benchmarks/architecture)

**Phase 7 — Output** YAML/JSON per Section 9.

## 4. Authoritative submitter index

### Power users (>100K karma) — verified live April 2026

| username | karma | what they post | relevance |
|---|---|---|---|
| **simonw** | 104,240 | Daily LLM research, Datasette, AI tools, TILs | CRITICAL — every major AI dev mentioned |
| **tptacek** | 418,840 | Security research, Fly.io, crypto | AI security, prompt injection, credential leakage |
| ingve | 218,053 | Low-level programming, Rust, systems, papers | Dev productivity, infra |
| todsacerdoti | 214,495 | Tech news (Pipedream CEO) | Broad tech, AI news |
| pg | 157,316 | Rare; essays | Foundational thinking |
| patio11 | 127,807 | Business of software | Founder/financial dimension |
| minimaxir | 74,488 | AI text gen, ML tools | RAG, LLM benchmarks |
| cperciva | 64,144 | Tarsnap, FreeBSD, crypto | Security in AI |
| antirez | 30,782 | Redis, systems | Caching, embedding stores |
| swyx | 23,694 | AI engineering, dev tools, Latent Space | AI infra, agents, MCP |
| sama | 23,059 | OpenAI news, AI strategy | Announcements |
| karpathy | 4,573 | Deep learning, NLP | LLM fundamentals (low karma, extreme authority) |

### OSS founders — Show HN watchlist

Track these for new tool announcements:
- tcarambat1010 (AnythingLLM) · ocolegro (R2R) · yuhongsun (Danswer/Onyx) · Weves (Onyx YC) · dhorthy (HumanLayer/12-factor agents) · lharries (WhatsApp MCP) · pzullo (mcp-use) · Fosowl (AgenticSeek) · robmck (Glide)

### Comment authority signals

Presence of these in top-level comments amplifies story signal:
- **tptacek** = security story credible (not FUD)
- **simonw** = LLM/AI story has practical validity
- **dang** = mod note (often legit but complex)
- **patio11** = business/monetization angle
- **antirez** = data storage/caching/infra significance

## 5. Quality signal cheatsheet

### Story classification

| Signal | Threshold | Meaning | Action |
|---|---|---|---|
| velocity (pts/hr) | >50 | Rising hot, near-certain front page | Priority include |
| velocity | 20-50 | Gaining traction | Include if topic match |
| velocity | <5 | Stale/niche | Skip unless our topic |
| score | >200 | Hall of fame | Always include |
| score | 100-200 | Strong front page | Include |
| score | 50-100 | Decent | Include if topic match |
| score | 20-50 | Some noise | Show HN only |
| score | <20 | Minimal | Skip (exception: known founder Show HN) |
| comments/score | 0.5-1.2 | Engaged not toxic | Include |
| comments/score | >1.5 | Controversial | Flag, may include with note |
| comments/score | <0.3 | Link-only | Lower priority |
| `dead=true` | any | Killed | Skip entirely |
| `[flagged]` in title | any | Community-flagged | Skip entirely |

### Ranking formula (stable since 2013)

```
HN Score = (P - 1) / (T + 2)^1.8
```
Gravity = 1.8. Front page rescores ~45 min. **Early velocity dominates** (correlation ρ = 0.74 with final score).

### Karma gates

- 31 karma: can flag + vouch dead content
- 501 karma: can downvote comments
- <2 weeks account: green username = community skepticism
- Flame-war (comments > score): downweighted by HN
- Tutorial posts: mod-downranked

## 6. Topic query recipes

All use `search_by_date` + `tags=story` + Unix timestamps.

**RAG / retrieval:**
```
?query=RAG+retrieval+augmented+generation&tags=story&numericFilters=created_at_i>{24H_AGO},points>10&hitsPerPage=20
?query=vector+database+embedding&tags=story&numericFilters=created_at_i>{24H_AGO},points>10&hitsPerPage=20
?query=pgvector+weaviate+chroma+pinecone&tags=story&numericFilters=created_at_i>{24H_AGO},points>5&hitsPerPage=10
```

**MCP:** (filter for AI context — "MCP" collides with multi-chip-package in hardware)
```
?query=model+context+protocol+MCP&tags=story&numericFilters=created_at_i>{24H_AGO},points>10&hitsPerPage=20
?query=MCP+server+tool&tags=story,show_hn&numericFilters=created_at_i>{72H_AGO},points>15&hitsPerPage=15
```

**LLM tooling:**
```
?query=claude+code+cursor+aider+continue+cline&tags=story&numericFilters=created_at_i>{24H_AGO},points>10&hitsPerPage=20
?query=openai+anthropic+gemini+release&tags=story&numericFilters=created_at_i>{12H_AGO},points>30&hitsPerPage=10
```

**AI infra:**
```
?query=GPU+inference+serving+vllm+triton&tags=story&numericFilters=created_at_i>{24H_AGO},points>20&hitsPerPage=15
?query=embedding+model+sentence-transformer&tags=story&numericFilters=created_at_i>{48H_AGO},points>15&hitsPerPage=10
```

**Agent frameworks:**
```
?query=LangGraph+CrewAI+AutoGen+agent+framework&tags=story&numericFilters=created_at_i>{48H_AGO},points>15&hitsPerPage=15
?query=AI+agent+autonomous+multi-agent&tags=story&numericFilters=created_at_i>{24H_AGO},points>20&hitsPerPage=15
```

**AI security:**
```
?query=prompt+injection+jailbreak+LLM+security&tags=story&numericFilters=created_at_i>{48H_AGO},points>15&hitsPerPage=10
?query=AI+secrets+credentials+leakage+agent&tags=story&numericFilters=created_at_i>{72H_AGO},points>10&hitsPerPage=10
?query=MCP+security+tool+poisoning&tags=story&numericFilters=created_at_i>{72H_AGO},points>10&hitsPerPage=10
```

**Self-hosted:**
```
?query=self-hosted+open-source+local+LLM+ollama&tags=story&numericFilters=created_at_i>{24H_AGO},points>15&hitsPerPage=15
?query=open-source+AI+MIT+license&tags=story,show_hn&numericFilters=created_at_i>{48H_AGO},points>20&hitsPerPage=10
```

**Show HN sweep (always last):**
```
?tags=story,show_hn&numericFilters=created_at_i>{12H_AGO},points>15&hitsPerPage=30
```

## 7. Skip list

**Hard skips (always exclude):**
- `dead=true` or `[flagged]` in title
- Political: trump/biden/politics/congress/senate/republican/democrat
- `type=job` or `jobs.ycombinator.com`
- HN-meta drama
- "Who is hiring" / "Who wants to be hired"
- Pure crypto price/trading

**Soft skips (unless strong secondary signal):**
- Tutorial content (mod-downranked) — exception: novel technique with >50 pts
- "X considered harmful" rant — exception: tptacek validates
- Duplicate URL <72h — exception: score doubled
- Press release / announcement no tech content — exception: major model release
- Click-bait AI titles ("AI will X", "The end of X")

## 8. Comment intelligence

Extract for: score >100, Show HN our domain >30, authority commenter present.

**API:** `/items/:id` returns nested tree.

**Heuristics:**
- "Author here" / "I built" in first comment = builder present, substantive discussion
- tptacek/simonw/dang/patio11/antirez in top 5 = signal amplification
- Comment count > 2x score = flame war (downweight)
- First-level comments by position in `kids` array (= rank)
- Highest-score top-level comment >100 pts = authoritative summary
- Comments with numbers/benchmarks/code = technical evidence

**Red flags:**
- Multiple green-username comments coordinating
- Top comment is attack on submitter without tech content
- AI-generated comments (HN bans them, community detects)

## 9. Output format

```json
{
  "digest_id": "YYYY-MM-DD-HH",
  "cycle": "morning|evening",
  "generated_at": "ISO 8601 UTC",
  "stories": [
    {
      "rank": 1,
      "hn_id": "47865822",
      "title": "...",
      "url": "https://...",
      "hn_url": "https://news.ycombinator.com/item?id=47865822",
      "author": "username",
      "score": 139,
      "comments": 54,
      "velocity_pts_hr": 23.5,
      "age_hours": 5.9,
      "topic_tags": ["ai_security", "mcp"],
      "quality_score": 8,
      "quality_breakdown": {
        "topic_relevance": 2,
        "engagement_quality": 2,
        "velocity": 1,
        "source_authority": 2,
        "technical_depth": 1
      },
      "is_show_hn": false,
      "is_launch_hn": false,
      "founder_present": false,
      "authority_commenting": ["tptacek"],
      "one_line_summary": "Open-source credential proxy for AI agents that sits between agent and tool, redacts secrets from MCP traffic.",
      "comment_highlight": "tptacek: The threat model here is narrower than the README implies...",
      "skip_reason": null
    }
  ],
  "skipped_count": 47,
  "skip_breakdown": { "dead_flagged": 3, "political": 2, "off_topic": 31, "duplicate": 8, "low_score": 3 },
  "queries_executed": ["..."],
  "frontier_alerts": ["..."]
}
```

**Constraints:**
- Max 10 stories
- Min 3 stories (if fewer, note in `frontier_alerts`)
- `one_line_summary`: 1 sentence, 20-40 words, no marketing language, must contain concrete technical detail
- `topic_tags` from: `rag`, `mcp`, `llm_tooling`, `ai_infra`, `agent_frameworks`, `ai_security`, `dev_productivity`, `self_hosted_oss`

## 10. Quality gates (pre-output)

- [ ] ≥7 of 10 stories match core topics (else widen window to 36h, re-run)
- [ ] Zero `dead` or `[flagged]` items (verify via Firebase)
- [ ] No more than 3 stories from same domain
- [ ] No more than 2 stories same narrow sub-topic
- [ ] All stories `created_at_i > now - 36h` (morning cycle)
- [ ] No duplicates vs previous 4 cycles unless score increased >50%
- [ ] No forbidden words in summaries: revolutionary, game-changing, groundbreaking, amazing, exciting
- [ ] Each story has concrete tech detail in summary
- [ ] If <5 stories pass: lower threshold, re-run Show HN sweep, note in alerts

## 11. Failure modes

| Failure | Fallback |
|---|---|
| Algolia down/slow | Firebase topstories + manual ID batch fetch (no full-text) |
| Firebase down | Algolia `tags=story&numericFilters=created_at_i>{2H_AGO}` |
| Both degraded | HNRSS frontpage `?points=20&count=50` |
| TZ error | All timestamps Unix UTC, never local |
| <5 stories | Widen window 36→72h, lower threshold 10→5, add Show HN sweep |
| Velocity div-by-zero | `if age_hours < 0.1: velocity = None` |

## 12. Frontier notes (April 2026)

- **Algorithm stable** since ~2013: `(P-1)/(T+2)^1.8`. No 2025-2026 changes.
- **AI content saturation** ("Eternal LLMber") — community fatigue. AI Show HNs need stronger technical framing.
- **AI-generated comments banned** (2025 official guidelines). Community detects + flags. Write summaries in plain human voice.
- **MCP ecosystem** — SDK 97M+ cumulative downloads. OpenAI, Google, AWS adopted 2025-2026. ~10-15 MCP Show HNs/week peak.
- **Velocity research (April 2026):** correlation ρ=0.74 with final score, p<10⁻¹¹⁵. 50+ pts/hr threshold = near-certain front page (97.6% precision).

### Third-party intelligence tools

- hckrnews.com (alt UI, time-sorted)
- hackernewsletter.com (60K+ subs weekly)
- daemonology.net/hn-daily/ (Colin Percival)
- syften.com/hackernews (keyword alerts + Slack)
- octolens.com (HN mention monitoring with AI filter)
- bestofshowhn.com (Show HN curated 2008-2026)

### User profiling (simonwillison.net 2026-03-21)

For unknown commenter: fetch last 1000 via `tags=comment,author_USERNAME&hitsPerPage=1000`, LLM-analyze for expertise. Calibrates whether to trust comment as highlight.

## Sources

- HN Algolia API: http://hn.algolia.com/api
- HN Firebase API: github.com/HackerNews/API
- HNRSS: hnrss.github.io
- Ranking formula: righto.com/2013/11/how-hacker-news-ranking-really-works.html
- HN Undocumented: github.com/minimaxir/hacker-news-undocumented
- Velocity detector: dev.to/fairpricework/how-i-built-a-hacker-news-trend-detector-using-only-public-data-3hdp
- User profiling: simonwillison.net/2026/Mar/21/profiling-hacker-news-users/
- DBOS HN agent example: docs.dbos.dev/python/examples/hacker-news-agent
