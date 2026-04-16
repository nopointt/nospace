---
# contexter-reddit-gtm.md — CTX-13 Reddit GTM
> Layer: L3 | Epic: CTX-13 | Status: 🔶 IN PROGRESS
> Created: 2026-04-12 (session 240) | Last updated: 2026-04-16 (session 243 — no direct progress on Reddit epic; session focused on CTX-10 copy audit refresh + analytics SEED + credits programs)
> Predecessor: CTX-10 GTM Launch (research + infrastructure done), CTX-12 Supporters Backend (complete)
> Research base: 5 DEEP files in `docs/research/contexter-gtm-deep-*.md` (~750K total)
---

## Goal

Build organic Reddit presence for Contexter. No direct sales. Founder build-in-public persona. Measure success by: karma growth, community recognition, inbound traffic, first organic signups.

## Strategy — "Composio Playbook" Adapted

**Core principle:** "The product isn't hard-sold. It's used as a contextually relevant example during high-value conversations." (from Composio/StartupSpells case study)

**Persona:** nopoint as founder. Personal account u/Cute_Baseball2875. Developer sharing expertise on MCP, RAG, vector search, Bun/Hono stack. Build-in-public style — sharing learnings, not pitching.

**What we DO:**
- Expert comments answering real questions (MCP setup, RAG debugging, embedding choice, etc.)
- Discussion-starter posts (open questions, "what do you use for X", lessons learned)
- Technical deep-dives framed as personal experience
- Mention product ONLY in profile bio + when directly asked + in designated promo threads

**What we DON'T:**
- No links to product in post body (only in comments if asked)
- No marketing language, no emojis in titles, no hype
- No cross-posting identical content
- No automation for posts/comments (Reddit TOS: manual only)
- No product mention during warmup phase (Phase 1)

## Account State

- **Account:** u/Cute_Baseball2875
- **Age:** 7 months (good — above 6mo AutoMod threshold)
- **Karma:** 1 (bad — needs 200+ for most subs)
- **History:** 0 posts, 0 comments (blank slate)
- **Profile bio:** ✅ CONFIGURED (2026-04-13) — display name "nopoint", avatar set, banner designed+uploaded, bio+social links recommended
- **Voice Guide:** `specs/reddit-voice-guide.md` — Bauhaus TOV, AI blacklist, de-AI checklist
- **Humanizer:** `/humanizer` skill installed (blader/humanizer)

## Phases

### Phase 1: Warmup (Weeks 1-3) — Target: karma 200+

**Goal:** Build karma through expert comments. ZERO product mentions.

**Execution:** See `specs/reddit-warmup-calendar.md` for day-by-day plan.

**Target subs for commenting:**
- r/ClaudeAI, r/RAG, r/mcp — core technical audience
- r/LocalLLaMA, r/LangChain — adjacent technical
- r/node, r/webdev, r/PostgreSQL — developer credibility
- r/selfhosted — infrastructure expertise

**Cadence:** 2-3 comments/day, 50-150 words each. Sort by "Rising" for maximum visibility.

**KPI:**
- [ ] Karma ≥ 200
- [ ] Comments in ≥ 8 different subreddits
- [ ] At least 3 comments with 10+ upvotes
- [ ] Profile bio updated with founder description

**Topics:** 52 topics documented in `docs/research/contexter-gtm-deep-warmup-topics.md` with 10 ready templates.

### Phase 2: Presence (Weeks 4-6) — Target: karma 500+, first posts

**Goal:** Establish thought leadership with discussion-starter posts. Soft product mentions when contextually relevant.

**Execution:** See `specs/reddit-subreddit-playbook.md` for per-sub angles.

**Post types:**
1. "Lessons from building a production RAG pipeline" (r/RAG)
2. "pgvector vs dedicated vector databases in 2026" (r/LocalLLaMA)
3. "What MCP servers do you actually use daily?" (r/ClaudeAI)
4. "My $60/month self-hosted stack for AI workloads" (r/selfhosted)
5. "I tested 5 ways to give Claude my documents" — Composio-style comparison (r/ClaudeAI)

**Product mention rules:**
- In profile bio: always
- In comments: only when someone directly asks "what do you use?"
- In posts: NOT YET (wait for Phase 3)

**KPI:**
- [ ] Karma ≥ 500
- [ ] ≥ 4 posts with 50+ upvotes
- [ ] ≥ 1 post in r/ClaudeAI or r/mcp top weekly
- [ ] First DMs asking about your tools/stack

### Phase 3: Soft Launch (Weeks 7-9) — Target: first organic signups

**Goal:** First "I built X" posts in promo-friendly subs. MCP directory submissions live.

**Launch posts (see `specs/reddit-launch-drafts.md`):**
- r/AlphaandBetaUsers — direct beta recruitment
- r/SideProject — "I built a RAG-as-a-service" with demo
- r/indiehackers — builder journey story
- r/microsaas — micro-SaaS angle

**Parallel:** MCP directory submissions (see `specs/reddit-directory-checklist.md`).

**KPI:**
- [ ] ≥ 3 launch posts published
- [ ] ≥ 1 post with 100+ upvotes
- [ ] ≥ 10 organic signups from Reddit
- [ ] Listed in ≥ 10 MCP directories

### Phase 4: Core Launch (Weeks 10-12) — Target: community recognition

**Goal:** Technical launch posts in core subs.

**Launch posts:**
- r/mcp — "New MCP server: upload any document, get RAG-powered search for Claude"
- r/RAG — "I built a hosted RAG-as-a-service — here's the architecture"
- r/ClaudeAI — "I built an MCP endpoint that turns any file into a searchable knowledge base"
- r/SaaS — Weekly Feedback Thread
- r/webdev — Showoff Saturday

**Post timing:** 9-11 AM Eastern, Tuesday-Thursday. One sub per day, unique angle per sub.

**KPI:**
- [ ] ≥ 5 launch posts in core subs
- [ ] ≥ 1 post with 200+ upvotes
- [ ] ≥ 50 organic signups from Reddit
- [ ] Listed in ≥ 30 directories
- [ ] First supporter from Reddit

### Phase 5: Sustained Presence (Ongoing) — Target: 2 posts/week

**Goal:** Composio-style sustained presence. Repeat posting with milestones.

**Cadence:**
- 2 posts/week (different subs, unique angles)
- 5+ comments/week (expert help, no product push)
- Monthly milestone posts ("Contexter hit X users / X documents processed")
- Blog-backed comparison posts ("NotebookLM vs Contexter for researchers")

**KPI:**
- [ ] Karma ≥ 2000
- [ ] Regular inbound traffic from Reddit
- [ ] Reddit becomes top 3 traffic source

## Messaging Angles (from competitor sentiment research)

| # | Angle | When to use | Source |
|---|---|---|---|
| 1 | "NotebookLM has no API — Contexter IS the API" | r/NotebookLM alternative threads | R3 research |
| 2 | "ChatGPT memory is broken (1200 words, wipes)" | r/ChatGPT memory complaint threads | R3 research |
| 3 | "Claude's context fills at ~13 files" | r/ClaudeAI context frustration threads | R3 research |
| 4 | "RAG without building RAG" | r/RAG "best tool" threads | R3 research |
| 5 | "No arbitrary caps (50 sources, 20 files)" | Anywhere competitors are compared | R3 research |
| 6 | "Works with everything (Claude, ChatGPT, Perplexity)" | MCP server recommendation threads | R3 research |
| 7 | "Upload any format, any size" | Document processing discussions | Product features |

## Automation Rules (per Reddit TOS, verified 2026-04-12)

| Action | Who does it | Why |
|---|---|---|
| Reddit posts & comments | **nopoint manually** | Reddit TOS: automated posting = ban risk. Human verification required since March 2026 |
| GitHub PRs (awesome-mcp-servers) | **Axis** | Git operations, no Reddit TOS issue |
| MCP directory web form submissions | **nopoint manually** | Web forms, some require captcha |
| CLI-based registry submissions (Official MCP Registry, Smithery) | **Axis** | CLI tools, no Reddit TOS issue |
| Reddit monitoring (finding threads to comment on) | **Axis via scraper** | Reddit public JSON API, personal use allowed |
| Draft preparation (post text, comment templates) | **Axis** | Text preparation, no Reddit interaction |

## Files

| File | Purpose |
|---|---|
| `memory/contexter-reddit-gtm.md` | This file — L3 epic, strategy overview |
| `memory/specs/reddit-subreddit-playbook.md` | Per-sub rules, angles, dos/don'ts |
| `memory/specs/reddit-warmup-calendar.md` | Day-by-day warmup plan + comment templates |
| `memory/specs/reddit-directory-checklist.md` | All directories with submission status |
| `memory/specs/reddit-launch-drafts.md` | Ready-to-post launch drafts per subreddit |

## Research Foundation

| File | Content | Location |
|---|---|---|
| R1: Subreddit Rules | 30 subs analyzed, rules, culture, peak hours | `docs/research/contexter-gtm-deep-subreddit-rules.md` |
| R2: Launch Post Examples | 32 real posts, pattern analysis, anti-patterns | `docs/research/contexter-gtm-deep-launch-post-examples.md` |
| R3: Competitor Presence | 8 direct + 5 indirect, sentiment, opportunity threads | `docs/research/contexter-gtm-deep-competitor-reddit.md` |
| R4: MCP Directories | 81 directories, submission process, priority | `docs/research/contexter-gtm-deep-mcp-directories.md` |
| R5: Warmup Topics | 52 topics, templates, engagement patterns | `docs/research/contexter-gtm-deep-warmup-topics.md` |
| Smetnyov Guide | Reddit marketing methodology (Skyeng founder) | `docs/research/reddit-marketing-guide-smetnyov.md` |

## Dependencies

- **CTX-10 (GTM Launch):** Research foundation ✅, copy audit refresh spec ready 2026-04-16 (`docs/research/contexter-copy-audit-2026-04-16.md`), apply 6 atomic commits pending. Analytics SEED complete (`docs/research/contexter-analytics-seed-research.md`), DEEP-1/2/3 pending nopoint approval.
- **CTX-12 (Supporters Backend):** ✅ Complete — /supporters page live, LemonSqueezy working
- **Product readiness:** OG tags missing, analytics missing, copy audit not applied — these are Track A (separate from Reddit, can parallel)

## Blockers

- **Karma = 1** — blocks posting in most subs. Phase 1 warmup resolves this.
- **No profile bio** — needs founder description + contexter.cc link before first comment
- **r/MCP, r/RAG rules unverified** — reddit.com blocked for Axis, nopoint must manually check sidebar rules before posting

## AC

| ID | Criteria | Phase | Verify |
|---|---|---|---|
| AC-1 | Karma ≥ 200 | Phase 1 | Reddit profile check |
| AC-2 | Karma ≥ 500 | Phase 2 | Reddit profile check |
| AC-3 | ≥ 3 launch posts published | Phase 3 | Post URLs |
| AC-4 | ≥ 10 organic signups from Reddit | Phase 3 | Analytics (needs setup) |
| AC-5 | Listed in ≥ 30 directories | Phase 4 | Directory checklist |
| AC-6 | ≥ 1 post with 200+ upvotes | Phase 4 | Post URL |
| AC-7 | First supporter from Reddit | Phase 4 | LemonSqueezy + referrer |
| AC-8 | Karma ≥ 2000 | Phase 5 | Reddit profile check |
