# Reddit Correspondent Intelligence Playbook
> Production-grade reference for `reddit-correspondent` subagent
> Generated: 2026-04-25 from existing research + April 2026 web research
> Audience: developers, AI/ML engineers, indie founders, builders.

## 1. Mission and scope

Daily intelligence gathering. Runs 09:00 UTC and 21:00 UTC. Produces structured digest output.

**Primary subs:**
- r/ClaudeAI (747K) · r/LocalLLaMA (900K+) · r/MachineLearning (3.0M) · r/selfhosted (553-650K) · r/programming (6M+, LLM ban watch) · r/Rag (55K) · r/mcp (89K) · r/devops (347-436K) · r/netsec (553K) · r/SideProject (230K) · r/artificial (1.2M) · r/OpenAI (1.4M) · r/Anthropic (50-100K)

**Secondary watchlist:**
- r/AI_Agents · r/LLMDevs · r/ClaudeCode · r/vibecoding · r/NotebookLM

**Exclusions:** politics, gaming, r/funny, anything outside tech/AI/dev.

## 2. APIs

### Public JSON (no auth) — PRIMARY mechanism

**Critical: November 2025 Reddit killed self-service OAuth.** Public `.json` endpoint remains and works. Pre-November grandfathered OAuth at 60 req/min still works. New OAuth needs manual approval ($10K+/month enterprise).

**Rate limit unauth:** ~10 req/min per IP (conservative). Existing `nospace/tools/reddit-scraper/scrape.ts` runs at ~0.5 req/s with gaussian jitter (mean=1500ms, std=600ms) and works in practice.

**User-Agent required:** Set browser-like UA (e.g., `Chrome/120.0.0.0`). Bare `python-requests` blocked.

**Per-sub feeds:**
```
GET /r/{sub}/hot.json?limit=25
GET /r/{sub}/new.json?limit=25
GET /r/{sub}/top.json?t={hour|day|week|month|year|all}&limit=100
GET /r/{sub}/rising.json?limit=25
GET /r/{sub}/controversial.json?t={day|week}&limit=25
```

**Search:**
```
GET /r/{sub}/search.json?q={kw}&restrict_sr=on&sort={relevance|hot|top|new}&t={day|week}&limit=25
GET /search.json?q={kw}&sort=relevance&t=week&limit=25
```

**Multi-sub combined (OR, max ~5-6 reliably):**
```
GET /r/{sub1}+{sub2}+{sub3}/top.json?t=day&limit=50
```

**Thread + comments:**
```
GET /r/{sub}/comments/{id}.json?sort=top&limit=10
```
Returns `[0]` = post, `[1]` = comment tree.

**User:**
```
GET /user/{name}/about.json
GET /user/{name}/submitted.json?limit=25
GET /user/{name}/comments.json?limit=25&sort=top
```

**Sub metadata:**
```
GET /r/{sub}/about.json
GET /r/{sub}/about/rules.json
```

### Time filters (`t=`)

`hour | day | week | month | year | all`

**Daily digest:** `t=day` on `top.json` + `new.json` (no time filter).

### Pagination

`limit` (max 100), `after=t3_{id}` (cursor), `before=t3_{id}`, `count=N`.

Hard cap: ~1000 items per listing. For 24h digest, single `limit=100` per sort = sufficient.

### Rate handling

Headers: `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` (Unix ts).

On 429: stop, wait until reset, resume with doubled delay (3s base).

**Never run concurrent scrape instances same IP.**

### Pushshift replacement (April 2026)

Pushshift dead since May 2023. Current options:

- **Arctic Shift** (github.com/ArthurHeitmann/arctic_shift): full archive 2005-12 to 2026-02 (2.5B items, 261.8 GB Parquet). "Limited API". For historical research, NOT real-time digest.
- **PullPush:** back online but data only to 2025-05-20. Not useful for current.
- **Reveddit:** check if specific thread removed.
- **camas.unddit.com:** limited.

**For correspondent: use live `.json` only.** Arctic Shift for one-off historical lookups.

## 3. Response schema (post object)

Key fields under `data.children[].data`:

| Field | Use |
|---|---|
| `id` | Dedup key |
| `title` | Primary signal |
| `selftext` | Body (`""` for link, `[removed]` if deleted) |
| `author` | Check authority index |
| `score` | Net upvotes (fuzzed ±5-10%) |
| `upvote_ratio` | >0.85 consensus / 0.5-0.7 controversial |
| `num_comments` | Engagement |
| `created_utc` | Unix ts |
| `subreddit` | Source |
| `permalink` | `/r/sub/comments/id/...` |
| `url` | External link or permalink |
| `domain` | Dedup helper |
| `is_self` | true=text post |
| `link_flair_text` | Filter signal |
| `stickied` | true = mod-pinned, SKIP |
| `locked` | true = drama, may include with note |
| `removed_by_category` | null=live, "moderator"=mod-removed, "reddit"=spam, "automod_filtered"=held |
| `distinguished` | "moderator" or "admin" |
| `num_crossposts` | Amplification |
| `over_18` | NSFW, skip |
| `score_hidden` | First minutes |

**Removal detection:** filter out if `removed_by_category != null` OR `selftext == "[removed]"`.

## 4. Daily scout protocol

**Step 1 — Hot feed sweep (~26s)**
For each of 13 subs:
```
GET /r/{sub}/top.json?t=day&limit=50
```
Filter to last 12h (evening cycle) or 12-24h ago (morning cycle).

**Step 2 — New feed (high-velocity subs only, ~8s)**
r/ClaudeAI, r/LocalLLaMA, r/mcp, r/Rag:
```
GET /r/{sub}/new.json?limit=25
```

**Step 3 — Keyword search sweep (~16s)**
8 targeted queries (Section 7) across key subs.

**Step 4 — Dedup**
- By `id` (exact)
- By `domain` + URL (cross-sub same link)
- By title Jaccard >0.7 word sets (cross-sub same story)

**Step 5 — Quality filter** (Section 6)

**Step 6 — Comment tree sampling (~20s)**
For top-priority posts (quality_score=3):
```
GET /r/{sub}/comments/{id}.json?sort=top&limit=10&depth=2
```

**Step 7 — Output** YAML/JSON per Section 11.

**Total budget per cycle:** ~35 requests, ~70s sequential. Within 10 req/min budget.

## 5. Per-sub intelligence

### r/ClaudeAI (747K)
- Peak: 14:00-22:00 UTC. Karma gate: low (10-50).
- Self-promo: permissive for genuinely useful Claude Code/MCP tools.
- Patterns: Claude Code tips, MCP announcements, API key management, model comparison.
- Top thresholds: 100-200 = hot, 500+ = top of week.
- AVOID: "Claude is worse than X" flame, subscription complaint, AI philosophy threads.
- Voice winners: loss framing + solution, scale + outcome, utility + speed.

### r/LocalLLaMA (900K+)
- Peak: 14:00-23:00 UTC. Karma gate: 50+.
- Self-promo: 10% rule (max 10% of activity).
- Patterns: local benchmarks, quantization, hardware, privacy-first, OSS releases, RAG implementations.
- Top: 150-300 = hot, 1000+ = major release.
- Confirmed pattern (March 2026): "I classified 3.5M patents with Nemotron 9B on RTX 5090 then built search engine" → 65 upvotes + 20 comments in 2h.
- Voice: technical depth mandatory, real numbers, privacy-first framing, contrarian technical claims spark engagement.

### r/MachineLearning (3.0M)
- Flair MANDATORY: `[P]` project, `[R]` research, `[D]` discussion, `[N]` news.
- Karma gate: ~100+. Self-promo only in weekly thread.
- Tone: academic, citations required, "revolutionary" = downvotes.
- For digest: RAG/retrieval research papers, LLM architecture papers, agent frameworks.

### r/selfhosted (553-650K)
- Peak: 18:00-02:00 UTC (evening + weekend).
- Self-promo: context-dependent. Open-source favored. Self-hosting angle required.
- Patterns: self-hosted software, Docker Compose, home labs, alternatives to cloud.
- Voice: "I self-hosted X so I don't pay Y", show-and-tell, Docker one-liners.

### r/programming (6M+) — CAUTION
- **April 2026:** temporary LLM ban ("2-4 week trial"). Status uncertain — check each cycle.
- 10% self-promo rule. Karma gate: 100-500+.
- Posts must be technically accurate, polished, pedagogically sound.
- For digest: only if LLM ban lifted or post is technical (algorithms, system design) not about LLMs.
- Action: check `/r/programming/new.json` weekly — if LLM posts appearing without removal = ban lifted.

### r/Rag (55K)
- HIGH VALUE — small sub, low noise, every substantive post is digest-worthy.
- Patterns: chunking, embedding comparisons, retrieval benchmarks, vector DB comparisons, production RAG.
- Voice: practitioner-level, "what actually works".

### r/mcp (89K)
- CRITICAL beat. Every substantial MCP tool announcement is digest-worthy.
- Patterns: new MCP servers, Claude Desktop setup, MCP clients, integration guides.
- Voice: "New MCP server: [what it does + one-line install]".

### r/devops (347-436K)
- Peak: 13:00-21:00 UTC weekdays. Karma gate: 50-100.
- Patterns: CI/CD, secrets, platform engineering, K8s, observability, IaC.
- For digest: AI tools entering DevOps, LLM-assisted ops, secrets sprawl, agent automation.

### r/netsec (553K)
- Curated, low volume. Karma gate: 100+. NO marketing.
- Self-research: requires 500+ word writeup with methodology, tool as appendix.
- Voice: research-first, "I investigated X and found Y", not "I built Y check it out".
- For digest: AI tool vulnerabilities, LLM jailbreaks with real threat models, API credential research, agent security architecture.

### r/SideProject (230K)
- Karma gate: ~10. Self-promo welcome.
- Requirement: working product, not idea.

### r/artificial (1.2M) / r/OpenAI (1.4M) / r/Anthropic
- Broad signal, less depth. Use for trend detection.

## 6. Quality signals

| Signal | Threshold | Meaning | Action |
|---|---|---|---|
| velocity | >5 upvotes/hr first 2h | Rising | Prioritize |
| velocity | >20/hr first hour | Strong early | Immediate include |
| upvote_ratio | >0.85 | Consensus | Include |
| upvote_ratio | 0.50-0.70 | Controversial | Note, include if topic match |
| upvote_ratio | <0.50 | Rejected | Skip unless newsworthy topic |
| num_comments/score | >0.3 (tech subs) | High engagement | Strong signal |
| num_comments/score | >1.0 | Controversy | Carefully assess |
| stickied | true | Mod-promoted | Skip |
| locked | true (high score) | Hot drama closed | Note as "controversy closed" |
| distinguished | "moderator" | Mod post | Skip unless rule change |
| removed_by_category | not null | Removed | Skip |
| selftext | "[removed]" | Deleted | Skip |
| num_crossposts | >5 | Multi-sub signal | Cross-sub trend |
| age | <2h | Very fresh | Score may be hidden, use comment count |
| author karma | >500 | Established | Higher base credibility |
| author karma | <50 | New | Assess content independently |
| is_self + selftext | >500 chars | Substantive writeup | Strong signal |
| domain | arxiv.org / github.com / known tech blogs | High-quality source | Prioritize |

**Velocity formula:**
```python
velocity = score / max(1, (now_unix - created_utc) / 3600)
```

Rising threshold per sub size:
- Small (r/Rag, r/mcp): velocity > 2
- Mid (r/ClaudeAI, r/LocalLLaMA): > 5
- Large (r/MachineLearning, r/programming): > 20

## 7. Topic query recipes

Use `/r/{sub}/search.json?q={query}&restrict_sr=on&sort=relevance&t=week&limit=25`.

**RAG:**
```
subreddit:Rag RAG pipeline
subreddit:Rag chunking strategy
subreddit:Rag "retrieval augmented"
subreddit:LocalLLaMA RAG implementation
subreddit:LocalLLaMA "vector search" OR "pgvector" OR "RAG"
subreddit:MachineLearning RAG retrieval
```

**MCP / Agents:**
```
subreddit:mcp "MCP server"
subreddit:ClaudeAI "model context protocol" OR MCP
subreddit:ClaudeAI "Claude Code" tool
subreddit:AI_Agents agent framework
subreddit:LocalLLaMA "MCP" OR "agent"
```

**LLM tooling / infra:**
```
subreddit:LocalLLaMA "I built" tool
subreddit:ClaudeAI "I built" OR "I made"
subreddit:Rag "I built" RAG
subreddit:selfhosted "LLM" OR "AI" self-hosted
subreddit:selfhosted "Ollama" OR "RAG"
```

**Dev productivity:**
```
subreddit:programming "AI coding" -LLM
subreddit:devops "AI" automation pipeline
subreddit:programming "developer tools"
```

**Security:**
```
subreddit:netsec "API key" OR "credential" leak
subreddit:netsec "AI" security
subreddit:devops secrets management
```

**Self-hosted:**
```
subreddit:selfhosted "language model" OR "LLM" OR AI
subreddit:LocalLLaMA "homelab" OR "home server"
subreddit:selfhosted "Ollama" OR "AnythingLLM"
```

**Fallback (Reddit search weak — use Google):**
```
site:reddit.com/r/LocalLLaMA "RAG" after:2026-04-01
site:reddit.com/r/ClaudeAI "MCP server" after:2026-04-01
```

## 8. Skip list

**Hard structural skips:**
- `stickied=true`
- `removed_by_category != null`
- `selftext == "[removed]"`
- `over_18 == true`
- `distinguished == "moderator"` and score < 50
- score < 5 after 4+ hours

**Content category skips:**
- Pure image posts (memes, screenshots)
- "What do you use for X?" surveys
- Personal tech support / debug help
- "Am I the only one who..." engagement bait
- AI doom/hype philosophy
- Karma-farm reposts
- Job postings
- AutoMod bot posts
- Subscription pricing complaints
- Twitter/X drama bridges

**Topic exclusions:**
- Politics, geopolitics
- Crypto without builder/infra context
- Gaming, entertainment
- Consumer AI questions

## 9. Cross-sub trend detection

**URL fingerprint dedup:**
```python
fingerprint = normalize_url(post['url'])
# strip ?utm_*, ?ref=*, trailing /, lowercase domain
# group by fingerprint
if len(group) > 1:
    trend_strength = len(group)
```

**Title fuzzy match (for self-posts):**
```python
words_a = set(title_a.lower().split()) - STOPWORDS
words_b = set(title_b.lower().split()) - STOPWORDS
jaccard = len(words_a & words_b) / len(words_a | words_b)
if jaccard > 0.7: # same story different subs
```

Stopwords: the, a, an, I, my, is, are, how, why, what.

**Domain repeat:** same external domain in 3+ posts across subs in 12h window with different paths but similar titles = coordinated coverage of paper/release.

**Amplification scoring:**
- 2 subs: "multi-sub" — note in output
- 3+ subs: "trend" — elevate to top
- 5+ subs: "breaking-trend" — flag immediate

**Output rule:** when same story appears in N subs, include only highest-scoring instance, note "also in r/X, r/Y" in cross-sub field.

## 10. Comment tree intelligence

For high-priority posts (quality_score=3), fetch tree, extract:

1. **Expert clarifications:** comments with high score relative to post (>50 if post=200) often correct or deepen — real signal.
2. **Named resources:** comments linking to papers, repos, tools — secondary intelligence.
3. **Author engagement:** post author replying within 1-2h = live builder.
4. **Dissenting high-karma:** ratio>0.8 AND score>50 contradicting post = legitimate counter-signal.

**Extract logic:**
- Top 3 by score where `depth == 0`
- `body > 50 chars` AND `score > 20`
- `distinguished == "moderator"` = mod note (rule info)
- Body contains URL = potential linked resource

## 11. Output format

```yaml
- id: "t3_abc123"
  subreddit: "LocalLLaMA"
  title: "..."
  url: "https://www.reddit.com/r/.../comments/abc123/..."
  external_url: "https://github.com/user/project"  # null if self-post
  external_domain: "github.com"
  author: "u/soytuber"
  score: 412
  upvote_ratio: 0.93
  num_comments: 87
  created_utc: 1745582400
  age_hours: 6.3
  velocity: 65.4
  is_self: true
  selftext_preview: "I spent the last 3 months..."  # first 200 chars
  link_flair: "Show and Tell"
  quality_score: 3  # 1=skip, 2=skim, 3=read now
  quality_reason: "Original tool release, MCP-native, technical depth, GitHub repo"
  cross_sub: ["r/selfhosted", "r/mcp"]
  trend_signal: "multi-sub"  # null | multi-sub | trend | breaking-trend
  top_comment:
    author: "u/someexpert"
    score: 87
    body_preview: "..."
  digest_blurb: "Builder releases self-hosted RAG with 15 MCP endpoints on pgvector/Hetzner. Technical writeup. Cross-posted to r/selfhosted and r/mcp."
```

**digest_blurb:** 1-2 sentences, journalist-style, action-oriented, adds context the title doesn't.

**Sort:** by `quality_score` DESC, then `score` DESC. Group by sub within tier.

## 12. Quality gates

- [ ] All `stickied=true` removed
- [ ] All `removed_by_category != null` removed
- [ ] No duplicate `id`
- [ ] No dead posts (score<5 AND age>4h)
- [ ] Every quality_score=3 has non-empty `digest_blurb`
- [ ] Cross-sub trends identified (URL fingerprint + Jaccard pass)
- [ ] r/programming checked against LLM ban status
- [ ] At least one post from r/Rag and r/mcp included if any exist
- [ ] Output between 5-25 posts

## 13. Failure modes

| Failure | Fallback |
|---|---|
| 429 rate limit | Stop, wait `X-Ratelimit-Reset`, resume with doubled delay |
| 429 persists | Increase base delay 1.5→5s, partial cycle |
| Removed thread mid-fetch | Filter out, log as removed |
| 500/503 | Retry once after 30s, skip sub if fails |
| Empty search results | Fall back to `/top.json?t=day` + client-side keyword filter |
| Recent post missing from hot | Check `new.json` last 2h, include posts with any comments |
| Shadowban (read-only agent) | N/A — only affects posting, not scraping |

## 14. Frontier notes (April 2026)

- **November 2025 OAuth shutdown** — public `.json` is the only practical path for new agents.
- **September 2025 metric change** — Reddit replaced subscriber counts with weekly visitors. Third-party trackers may show stale data.
- **r/programming LLM ban (April 2026)** — status uncertain, check each cycle.
- **Arctic Shift coverage to Feb 2026** — historical lookups only, not daily.
- **CQS (Contributor Quality Score)** — increasingly used for new account filtering. Sock-puppet patterns detectable.
- **New subs to watch:** r/ClaudeCode (50K+, MCP setups), r/vibecoding (89K, Claude Code build logs), r/AI_Agents (100K+ growing), r/LLMDevs (110K).

## Sources

- molehill.io: Reddit Killed Self-Service API Keys (Nov 2025)
- PainOnSocial: Reddit API Rate Limits 2026
- Arctic Shift: github.com/ArthurHeitmann/arctic_shift
- dev.to: How to Scrape Reddit in 2026
- signals.sh: Reddit Algorithm Explained 2025
- GummySearch r/ClaudeAI / r/LocalLLaMA / r/mcp / r/Rag
- jcchouinard.com: Reddit JSON Documentation
- redaccs.com: Reddit API Guide 2026
- juheapi.com: Build Daily Reddit Digest Agent
