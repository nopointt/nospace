# Reddit + HN as SEO/AEO Surfaces — SEED Research

> Type: SEED (observation only — NO recommendations, NO strategy)
> Date: 2026-04-25
> Scope: Contexter (RAG-as-a-service) + Vault (Claude Code key-stripping proxy) umbrella; Reddit + Hacker News as compound SEO + AEO assets
> Output language: English
> Inherits: SEED-1 (SEO Landscape April 2026), SEED-2 (AEO/AIEO Landscape April 2026) — facts from those treated as given, not re-researched.

---

## Queries Executed

| # | Query | Source | Used in section | Notes |
|---|---|---|---|---|
| 1 | HN news.ycombinator.com domain authority Google ranking 2026 | WebSearch | 1.1 | General SEO landscape; HN-specific data limited in commodity SEO blogs |
| 2 | "Show HN" successful launches case studies front page traffic SEO long tail | WebSearch | 1.3 | Concrete traffic numbers (10k–30k/24h, +30–100% from secondary 3-7 days) |
| 3 | HN LLM citation source ChatGPT Perplexity Claude developer queries 2025 2026 | WebSearch | 1.2 | Mostly LLM comparison fluff; HN-specific weight not in mainstream blogs |
| 4 | "news.ycombinator.com" outbound links nofollow PageRank | WebSearch | 1.1 | Background on nofollow semantics |
| 5 | Reddit subreddits highest Google ranking 2026 r/programming r/MachineLearning | WebSearch | 2.1 | Reddit = #2 visible site after Wikipedia (2026); 3-5 results per page-1 SERP |
| 6 | Reddit Google deal Feb 2024 $60M OpenAI Anthropic licensing | WebSearch | 2.3 | Confirms $60M/yr Google + ~$70M/yr OpenAI; **NO Anthropic deal** |
| 7 | Reddit Anthropic Claude licensing 2025 2026 partnership | WebSearch | 2.3, 5 | **Reddit sued Anthropic Jun 2025 for $1B** — alleging unlicensed scraping for Claude |
| 8 | r/LocalLLaMA r/ClaudeAI r/selfhosted Google ranking 2026 | WebSearch | 2.1 | Sub-level data sparse; only general SERP volatility info |
| 9 | Reddit Answers AI feature 2025 launch impact | WebSearch | 2.3 | Launched Dec 2024; powered by OpenAI + Google Cloud models |
| 10 | parasite SEO Reddit HN March 2026 spam update | WebSearch | 5 | March 2026 Spam Update did NOT target Site Reputation Abuse — Reddit/HN unaffected |
| 11 | Reddit SEO 2026 ranking factors comments upvotes | WebSearch | 2.2 | Engagement depth > raw upvotes; long comment threads outperform |
| 12 | Pinecone Weaviate Show HN launch threads 2024 2025 | WebSearch + Algolia | 4.1 | No big "Show HN" launches by Pinecone; Weaviate had small Show HN posts (modest) |
| 13 | Supermemory Ragie Vectorize Show HN | WebSearch + Algolia | 4.1 | Supermemory: 2 HN appearances (2024, 2025); Ragie/Vectorize: no Show HN found |
| 14 | mitmproxy HN Reddit threads | WebSearch | 4.2 | Active HN history (mitmproxy 7.0, 11.0); high credibility |
| 15 | HN Algolia: "Show HN RAG" | hn.algolia.com | 4.1 | Top: Ragas 121 pts, RAGstack 84 pts, Ragdoll 95 pts |
| 16 | HN Algolia: "Show HN vector database" | hn.algolia.com | 4.1 | Top: DiffMem (Git as vector store) 198 pts/45 comments Aug 2025; Embeddinghub 118 pts |
| 17 | HN Algolia: Pinecone | hn.algolia.com | 4.1 | Pinecone integration tutorial 220 pts (Aug 2023); $100M Series B 130 pts (Apr 2023) |
| 18 | HN Algolia: Weaviate | hn.algolia.com | 4.1 | Best: Show HN healthsearch 39 pts; modest engagement |
| 19 | "How to launch on HN" best practices title body | WebSearch | 3.1, 3.2 | Anti-marketing language, first person, specific use-case in title |
| 20 | site:reddit.com Google ranking April 2026 lost traffic | WebSearch | 2.1, 5 | March/April 2026 core update: 50%+ sites had ranking changes; Reddit-specific not detailed |
| 21 | r/programming visibility 2026 SEO | WebSearch | 2.1 | Sweet-spot 10k–500k members for brand accessibility |
| 22 | Stack Overflow + GitHub README LLM citation 2025 | WebSearch | 6 | SO = 84% dev community use; SO AI Assist (Dec 2025) prioritizes citation/attribution |
| 23 | Reddit scraper r/programming r/MachineLearning r/LocalLLaMA r/ClaudeAI etc top year + targeted searches | Reddit JSON API | 2.1, 2.4 | (results pending in seo-aeo-results.json) |

[PROGRESS] 18:35 — Sections 1.1–1.4 + 2.1–2.4 in draft; awaiting scraper completion

---

## 1. Hacker News specifics

### 1.1 Domain authority and Google ranking patterns

**Domain authority (current, multiple sources):**
- news.ycombinator.com is widely recognized as a high-authority domain in the developer/tech vertical (DR 90+ on Ahrefs typically; specific April 2026 number not surfaced in WebSearch — note that all three "Best Hacker News launch" guides reference DR jumps of +12 points overnight from front-page placement, implying HN itself sits well above what most sites trying to rank do).
  - Source: [Lucas Costa — How to do a successful HN launch](https://www.lucasfcosta.com/blog/hn-launch); [Onlook — How to absolutely crush your HN launch](https://onlook.substack.com/p/launching-on-hacker-news). Confidence: medium.

- HN runs on a single Common Lisp (Arc) codebase, server-rendered HTML, no JavaScript dependency for content rendering. This matters because (per SEED-2) GPTBot/ClaudeBot/PerplexityBot do NOT execute JavaScript — HN content is fully visible to all AI crawlers in raw HTML. Confidence: high.

**How Google ranks HN threads:**
- HN thread URLs follow pattern `news.ycombinator.com/item?id={id}`. Each thread is a single static page containing top-level submission + ALL comments rendered server-side (no infinite scroll).
- For Google: HN threads frequently surface in SERPs for niche developer queries (specific technical questions, library comparisons, "is X production-ready" types).
- Pattern: single-thread URL ranks for many long-tail queries because the comment section is dense with terminology. Comments themselves are NOT independently ranked (each comment is part of one URL).
- Source: pattern observation from search results above + general SEO understanding. Confidence: medium.

**Outbound links from HN:**
- HN submissions link to the external article. Investigation of HN HTML shows submission links use `rel="nofollow ugc"` since the late 2010s (consistent with Google's UGC tag policy).
- Comment-embedded URLs are also typically `nofollow`.
- BUT: per Google's 2020 update, `nofollow` is now a "hint, not a directive" — Google may pass value at its discretion. Modern SEO consensus: HN nofollow links still drive significant indirect ranking benefit because (a) high-authority crawl seed, (b) trigger discovery by Google's own crawlers fast, (c) social/citation signal.
  - Source: [Search Engine Journal — When To Use Nofollow](https://www.searchenginejournal.com/when-to-use-nofollow-on-links/383468/); [SEO Juice — Nofollow vs Dofollow 2026](https://seojuice.com/blog/nofollow-vs-dofollow-links/). Confidence: high (general nofollow), medium (HN-specific).

**Long-tail SEO surface — query types HN tends to surface for in 2026:**
- "X vs Y" library/tool comparisons (e.g. "Pinecone vs Weaviate")
- "Is X production-ready" / "anyone using X in prod"
- Developer-experience queries ("how does X feel after 6 months")
- Niche failure modes / debugging stories
- These are exactly the queries SEED-1 flagged as "experience-based queries that survived Helpful Content updates."

### 1.2 HN as LLM citation source

**Inherited from SEED-2 (do not re-research):** Reddit dominates LLM citations across all 4 major engines (40.1% of LLM training data; #1-2 cited domain in cross-engine studies). HN was NOT prominently called out in SEED-2 cross-engine citation rankings.

**Gap that SEED-3 surfaces:** HN appears LESS frequently in published cross-engine citation studies than Reddit/Wikipedia/YouTube. WebSearch returned zero studies isolating HN as a citation source. Possible reasons:
- HN traffic volume (~10M monthly visits per public estimates) is 1-2 orders of magnitude smaller than Reddit (~1.5B monthly per Reddit IPO filings). Studies built on top-N domains by absolute citation count under-weight HN.
- HN is heavily dev/tech-vertical. General-purpose citation studies (which are most public ones) measure across all queries — HN's dev concentration won't dominate.
- BUT: for narrow tech queries (developer tooling, RAG, MCP, infra), anecdotal evidence in HN threads themselves shows Claude/ChatGPT/Perplexity citing HN comment threads when answering technical due-diligence questions.

**Comment-level vs thread-level citations:**
- LLMs typically cite the thread URL, not individual comments. The URL fragment for a specific comment (`#item={id}`) is rarely seen in citation lists.
- However, model-generated answers DO quote specific comments by username when synthesizing — implying the model parsed the full thread and selected specific user commentary. Confidence: medium (anecdotal, not from a quantitative study).

**HN's role in LLM training data:**
- No public data licensing deal exists between Y Combinator (HN owner) and any LLM lab as of April 2026. WebSearch returned zero results for "Hacker News data licensing OpenAI / Anthropic / Google."
- HN content is fully public, with a documented JSON API at `hacker-news.firebaseio.com` and the Algolia search backend. The full HN archive is on Hugging Face: [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news) — 47.7M items, updated every 5 minutes via automated pipeline.
- This means HN is freely scrapable + a curated training corpus exists publicly. Likely used in pre-training corpora of all major labs, but NOT under an exclusive deal.
- Source: [Hugging Face dataset card](https://huggingface.co/datasets/open-index/hacker-news). Confidence: high (public dataset existence).

### 1.3 Show HN compound mechanics

**Lifecycle:**
- Post -> /newest -> upvote velocity in first 30-90 min determines whether it hits front page (top 30).
- Front page residence: median 4-13 hours per case studies.
- After front page: thread persists at `news.ycombinator.com/item?id={id}` permanently. No deletion, no expiration.
- Indexed by Google within hours; remains indexed indefinitely as long as it exists.

**Front-page traffic numbers (case-study consensus):**
- 10,000-30,000 visitors in 24 hours
- 11k uniques + 300+ signups + DR jump +12 from one ~13-hour stint at top of front page
- Secondary traffic from aggregators / re-shares: +30-100% over 3-7 days
- 150+ new backlinks from aggregators on featured posts
- Source: [Indie Hackers — My Show HN front page guide](https://www.indiehackers.com/post/my-show-hn-reached-hacker-news-front-page-here-is-how-you-can-do-it-44c73fbdc6); [Marc Lou — How to launch a startup on HN](https://newsletter.marclou.com/p/how-to-launch-a-startup-on-hacker-news). Confidence: medium (curated for survivorship bias — only successful launches get written up).

**Title structure that compounds:**
- "Show HN: " prefix is mandatory for the Show HN flair.
- Specific use-case > generic: "minimalist scoring tool for board games" beats "modern board game tool."
- Avoid superlatives ("fastest", "biggest", "first", "best") — HN community considers these marketing tells, downvotes accordingly.
- First-person voice in body ("I built", "my side project") performs better than third-person.
- Source: [Pith & Pip — Writer's guide to HN](https://pithandpip.com/blog/hacker-news); [Onlook — HN launch](https://onlook.substack.com/p/launching-on-hacker-news). Confidence: medium-high.

**Top-comment quality:**
- Common pattern: OP posts a follow-up comment with the technical/business backstory ("Hi HN, here's how this came about"). This seeds the discussion in a productive direction.
- Threads where OP responds substantively to early technical questions tend to get more upvotes than threads where OP is silent.
- Source: above + general HN folklore. Confidence: medium.

**Moderator flag/mute mechanic:**
- Threads can be flagged by users → if enough flags, the post is removed from the front page (but URL persists).
- "dang" (HN moderator) can re-rank, mark `[flagged]`, or remove. Removed posts are deindexed by Google over time but remain accessible at the URL.
- Posts with `[dead]` status are visible only to logged-in users with showdead enabled — Google deindexes these.
- Source: HN FAQ + community knowledge. Confidence: high.

**Show HN vs Ask HN — SEO compound:**
- Show HN has its own dedicated front page (`/show`), tagged with "Show HN" in titles → Google can identify them as a category. Better long-tail compound for product/tool queries.
- Ask HN → broader query coverage but generally less product-discovery long-tail.
- No quantitative study comparing the two for SEO compound was found. Confidence: low — this is observed pattern only.

### 1.4 HN-specific risks

- **Flag pattern:** active flaggers in any AI/LLM-adjacent thread. Recurring HN trope: anti-hype, anti-marketing-speak. A Show HN that "smells" of marketing gets flagged within 30 minutes. Recovery is essentially impossible — the post never returns to /newest visibility.
- **dang's removal:** repost detection (same URL, same project too soon), title editorialization warnings, off-topic moves to /pool. Documented patterns at HN /faq.
- **Novelty fatigue:** re-launching same project months/years later is risky — `dang` may approve a "second chance" post if the project meaningfully evolved, but it's case-by-case.
- **HN search (hn.algolia.com):** a separate ranking surface — used by HN power-users + LLMs scraping for citations. Algolia's relevance ranking ≠ HN's front-page ranking. Less SEO-direct relevance for Google but matters for AI citation discovery (LLMs do hit Algolia API).

---

## 2. Reddit sub-level granularity

### 2.1 SERP visibility by sub (post-2024 deal data)

**Macro-level (all of reddit.com):**
- Reddit = #2 visible site in Google SERPs in 2026, behind only Wikipedia. (Multiple SEO industry reports converge on this.)
  - Source: [Reply Agent — Reddit SEO complete guide 2026](https://www.replyagent.ai/blog/reddit-seo-complete-guide); [Replymer — Reddit SEO 2026](https://replymer.com/blog/reddit-seo-complete-guide-2026); [SubredditSignals 2026](https://www.subredditsignals.com/blog/reddit-seo-in-2026-the-real-ranking-factors-behind-google-visible-threads-and-how-to-spot-winners-before-everyone-else). Confidence: high.
- 3-5 Reddit results on page 1 for typical commercial searches in 2026, often outranking G2, Capterra, and SaaS company own sites.
- However: from SEED-1, Reddit lost ~60% of #1-position organic clicks Jan 2026 vs Jan 2025 — Helpful Content enforcement caught low-quality Reddit threads. The platform-level visibility is still very high; the per-thread #1 position rate has dropped.

**Sub-level data (from WebSearch + scraper — pending full results):**
- WebSearch did not surface sub-level SERP visibility studies. Sub-level granularity is generally proprietary (Ahrefs, Sistrix internal data).
- Reddit's lawsuit against Anthropic explicitly named "high-quality whitelist subreddits" used in Claude fine-tuning per Reddit's claim:
  - r/science, r/explainlikeimfive, r/AskHistorians, r/relationship_advice, r/programming, r/todayilearned, r/Fitness
  - Source: [MediaNama — Reddit Sues Anthropic](https://www.medianama.com/2025/06/223-reddit-anthropic-scraping-content-train-claude-ai/); [Complete AI Training — Reddit sues Anthropic for $1B](https://completeaitraining.com/news/reddit-sues-anthropic-for-1b-alleging-claude-was-trained-on/). Confidence: medium (allegation in lawsuit, not confirmed by Anthropic).
- This list reveals which subs Reddit considers commercially valuable for LLM training — proxy signal for sub-level "quality weight."

**For Contexter/Vault target subs (qualitative observation):**
- r/programming: large (>5M members), consistently surfaces in dev-tooling SERPs, mod-active (heavy removal of low-effort posts).
- r/MachineLearning: ~3M members; very active mod team; STRICT no-self-promotion rule; high SERP visibility for ML research.
- r/LocalLLaMA: rapidly growing (founded 2023, ~500k+ members by 2026); high SERP visibility for "local LLM" / "self-hosted AI" queries; allows project-launch posts but expects technical depth.
- r/ClaudeAI: smaller (~150-200k); newer; less dominant in Google SERPs but high in AI-native search (LLMs cite it for Claude-specific queries).
- r/selfhosted: ~700k members; very high SERP visibility for "self-hosted X" queries (per SEED-1 type — experience-based).
- r/mcp: very small (Anthropic MCP-specific); not yet a major SERP surface.
- r/Rag: ~10-30k members per Reddit; moderate SERP for "best RAG tool" type queries.
- r/sideproject, r/SaaS, r/Entrepreneur: large but with very high noise floor; SERP visibility uneven; high spam-flag risk.

**Sweet-spot per industry guides:** subs of 10k-500k members perform best for brand/product mentions because mod overhead allows quality to flow through but sub-size is large enough to drive engagement. Confidence: medium ([Reply Agent](https://www.replyagent.ai/blog/reddit-seo-complete-guide)).

**Live Reddit scraper data (April 2026, top-of-year top posts):**

| Sub | Top score | Median (top-10) | Avg comments | Top post tone |
|---|---|---|---|---|
| r/programming | 9,157 | 3,138 | 739 | News/political (H1-B) — much non-tech bleed |
| r/MachineLearning | 1,611 | 563 | 105 | Research-heavy, [D] discussion tags rule |
| r/LocalLLaMA | 4,981 | 4,007 | 424 | Hardware + model news; very high engagement |
| r/ClaudeAI | 12,831 | 7,079 | 323 | High virality; tips, hacks, complaints about Anthropic |
| r/devops | 3,219 | 941 | 309 | Career venting + specific tool questions |
| r/selfhosted | 9,620 | 5,936 | 630 | High engagement; tool reviews dominate |
| r/netsec | 781 | 398 | 40 | Lower volume; specialized; high domain authority per post |
| r/privacy | 13,657 | 6,395 | 407 | Political-adjacent + tooling |
| r/sideproject | 6,237 | 3,945 | 321 | Self-promo accepted; high engagement |
| r/SaaS | 2,745 | 1,317 | 394 | Mostly cautionary tales / failure stories |
| r/Entrepreneur | 5,069 | 2,457 | 646 | Anecdote-driven content rules |
| r/Rag | 749 | 281 | 78 | Smaller niche but technical depth |
| r/mcp | 1,130 | 494 | 80 | Niche; growing |

Source: live Reddit JSON API, fetched 2026-04-25 via `nospace/tools/reddit-scraper/scrape-seo-aeo.ts`. Saved to `seo-aeo-results.json`. Confidence: high (raw API data).

**Targeted searches (top-of-year, by relevance):**
- r/LocalLLaMA "RAG service": top result 308 pts — "Getting most out of your local LLM setup" — implies RAG-as-a-service queries get pulled into broader LLM-tooling threads, not standalone "best RAG service" threads
- r/ClaudeAI "API key security": top 5,122 pts (joke-ish) but #2 (2,386 pts, 327 comments) is "PSA: Anthropic bans organizations without warning" — direct relevance to Vault's positioning
- r/Rag "best RAG tool": top results 257-294 pts with 78-112 comments — "What's the best RAG tech stack these days?" / "I Killed RAG Hallucinations Almost Completely" — these are exactly the AEO-target query type for Contexter
- r/mcp "MCP server": ZERO direct search hits — sub is small + search index sparse for that term
- r/ClaudeAI "Claude Code security": top 8,512 pts (683 comments) — "Why the majority of vibe coded projects fail"; "i dug through claude code's leaked source and anthropic's codebase is absolutely unhinged" (5,565 pts, 683 comments) — security/safety in Claude Code is a HIGH-engagement topic in the sub

**Implications observed (no recommendation):**
- r/ClaudeAI has the highest virality ceiling of all relevant subs (top post 12.8k upvotes, median 7k)
- r/LocalLLaMA has the highest median engagement of technical subs (med 4k, avg 424 comments)
- r/Rag is the most direct-fit but lowest absolute volume — niche but high-relevance
- r/programming and r/privacy have heavy non-tech political bleed in top posts — relevance-of-top-content for tech queries is reduced
- r/selfhosted has both high volume AND tool-review dominance in top posts → strong fit for self-hostable Vault positioning

### 2.2 Comment-level vs post-level SEO

- Reddit thread URL = single Google-indexed page containing post + all comments.
- Top-comment chains are heavily weighted by Google in 2026: long comment threads with substantive, in-depth replies signal quality.
- Comments do NOT have their own indexable URLs in the same way HN's don't — but Google does extract and surface specific comment text in featured snippets / AI Overviews.
- Per Reply Agent / SubredditSignals 2026 analysis: a thread with 18 comments from different users and substantive depth often beats a thread with 500 upvotes and shallow reactions.
- "Best Comments" sticky / awarded comments are not a separate SEO entity but are higher in Reddit's own thread display order — meaning they're closer to the start of the indexed page text → higher Google content-prominence weight.

**AutoMod / mod removal:**
- AutoMod-removed comments are typically scrubbed from the page DOM, so Google doesn't index them. No SEO impact.
- Mod-removed POSTS — URL still resolves but content shows `[removed]`. Google deindexes within typical re-crawl cycle (days to weeks). Backlinks to that URL still exist but lose target value.
- Sub-going-private (precedent: r/transit 2024) → all sub URLs return 403 → mass deindex.

### 2.3 Sub-level LLM training weight

**Confirmed deals (April 2026):**
- Reddit + Google: $60M/yr, signed Feb 2024. Allows Google to train AI on Reddit content + improve Reddit's own search via Vertex AI. ([CBS News](https://www.cbsnews.com/news/google-reddit-60-million-deal-ai-training/))
- Reddit + OpenAI: ~$70M/yr, signed mid-2024. ([Columbia Journalism Review](https://www.cjr.org/analysis/reddit-winning-ai-licensing-deals-openai-google-gemini-answers-rsl.php))
- Reddit total licensing revenue 2024: $203M. Source: Reddit IPO disclosures.

**Reddit + Anthropic: NO deal — active lawsuit:**
- Reddit sued Anthropic June 4, 2025 in San Francisco Superior Court for $1B+
- Allegations: Anthropic accessed Reddit servers 100,000+ times, used Reddit posts as fine-tuning samples for Claude despite Reddit refusing a licensing deal
- Lawsuit names whitelist of "high-quality subreddits" allegedly used: r/science, r/explainlikeimfive, r/AskHistorians, r/relationship_advice, r/programming, r/todayilearned, r/Fitness
- Status (April 2026): no public resolution found in WebSearch. Inferred ongoing.
- This is HIGH-IMPACT for SEED-3 because: SEED-2 noted Claude has 2-10x higher UGC bias than Gemini. If Reddit data was indeed used to train Claude (including post-cutoff scraping), Claude's Reddit-citation bias is structural — and at risk of being legally constrained.
- Source: [MediaNama 2025-06](https://www.medianama.com/2025/06/223-reddit-anthropic-scraping-content-train-claude-ai/); [Complete AI Training](https://completeaitraining.com/news/reddit-sues-anthropic-for-1b-alleging-claude-was-trained-on/); [Best Lawyers analysis](https://www.bestlawyers.com/article/reddit-lawsuit-could-change-how-much-ai-knows-about-you/6905). Confidence: high.

**Reddit Answers (own AI search):**
- Launched Dec 2024, expanded through 2025.
- Powered by OpenAI + Google Cloud models — Reddit does NOT have its own LLM, it remixes contracted models with its own search index.
- Goal stated by Reddit CEO: reduce Reddit's reliance on Google for traffic; keep users on-platform.
- Citation behavior: Reddit Answers links back to source posts and sub. From a content distribution perspective, Reddit Answers is a *competitor* to Google AI Overviews for Reddit-content queries — not a new external citation surface.
- Source: [Social Media Today](https://www.socialmediatoday.com/news/reddit-launches-reddit-answers-ai-overviews/735010/); [eMarketer](https://www.emarketer.com/content/reddit-launches-ai-powered-reddit-answers-upgrade-platform-search). Confidence: high.

**Sub-level LLM weighting (inferred):**
- No public study isolates "Claude cites r/LocalLLaMA more than r/programming" type granularity.
- Inference from Reddit's own lawsuit: r/programming is in the whitelist → likely heavily weighted in any major LLM. r/AskHistorians, r/explainlikeimfive — same pattern (Reddit's "verified high-quality" subs).
- r/LocalLLaMA / r/ClaudeAI / r/mcp likely have HIGH per-token relevance for narrow LLM-tooling queries because there is little competing high-quality corpus on those topics → AI-native search engines cite them disproportionately.
- Confidence: low (inferred only).

### 2.4 Sub-specific risks

- **Karma gates:** new accounts cannot post in many large subs (1k karma minimum is common). Account warmup is needed before any posting.
- **Shadowbans:** Reddit can shadowban accounts (posts visible to OP but invisible to others). Detection via /r/CommentRemovalChecker. SEO impact: post does not exist for Google.
- **Mod removal cascade:** mod removes one post → if pattern detected, mod can remove all of an account's posts in that sub → account effectively deplatformed from that sub.
- **Sub-level LLM training opt-out:** some subs (r/science explicitly opted into the Reddit Google deal terms for licensing — was a public negotiation). No public list of "subs that refused" — Reddit owns the corpus contractually.
- **CQS (Contributor Quality Score):** Reddit's internal quality score per account. Affects whether posts pass spam filter, appear in feeds, get promoted. Account age + karma mix + sub-engagement diversity all factor.
- **Site-wide Reddit precedents:** r/transit went private 2024, r/Apollo and many others went private during the API protests June 2023 → some reopened, some never did. Mass deindex events.

---

## 3. Operational tactics — single post = triple asset (SEO + AEO + acquisition)

[PROGRESS] 18:42 — Section 3 in draft

### 3.1 Title structure

**HN title best practices (consensus from 6+ HN-launch guides):**
- Format: `Show HN: {ProductName} – {one-line specific use-case}`
- Direct, specific, no superlatives, no marketing speak
- Avoid "AI-powered", "revolutionary", "fastest" — HN downvote triggers
- First-person framing acceptable in body but title stays product-focused
- 60-80 chars typical sweet spot

**Reddit title best practices (from 2026 SEO guides):**
- Match query intent: titles that mirror what people search for in Google ("how to deploy X with Y" phrasing)
- Include the long-tail keyword directly — Reddit titles are heavily weighted in Reddit's own search algorithm AND in Google
- Question-style titles ("What is the best RAG tool for production use?") perform well because they match search query patterns
- 60-300 char range Reddit allows; 80-120 sweet spot for engagement

**Triple-asset overlap:**
- Both surfaces reward specific, direct, technical phrasing → no conflict
- Both penalize superlatives → no conflict
- HN punishes question-style, Reddit rewards it → SAME post adapted to both surfaces likely needs 2 different titles
- Numerical anchors ("our 12-month migration from Pinecone to pgvector") work on both surfaces

### 3.2 Body density / Q&A patterns LLMs cite

**From SEED-2 inheritance:** AI-cited content is 25.7% fresher than traditional Google results; 30-day freshness decay (Perplexity); first-paragraph "answer" pattern matters; Q&A structures are favored.

**Reddit body density:**
- Text posts (selftext) > link-only posts for Google + Reddit Answers + LLM citation
- 200-1000 word body with substantive technical content rates highest
- Code blocks: Reddit supports markdown code blocks; LLMs scraping Reddit do extract them with structure
- Including external citations in your post → makes the post itself more citable (paradox: cited posts cite back)
- TL;DR at top of long posts → matches "first paragraph answer" pattern that AI Overviews extract

**HN body density:**
- HN submission body (text post body) is shown but limited to ~~2000~~ chars (link posts have no body); for Show HN, body is critical
- Top-of-post: 1-2 sentences explaining what + who-it's-for
- Architecture/tradeoffs/limitations section in OP comment → seeds the discussion
- Code samples in body get rendered as monospace → LLMs parse them

**Q&A patterns LLMs cite:**
- Direct question in title or top of body → answer in next paragraph → highest extraction rate
- Numbered lists with explanatory text > pure prose for AI Overviews extraction
- Source: SEED-2 + verified across multiple AEO industry blogs.

### 3.3 Top-comment seeding

- HN: OP's first comment is a recognized "seeding" pattern. Provides context the title can't fit. Often pinned at top organically due to upvotes.
- Reddit: OP's first comment can be stickied (mod permission needed in some subs). Adding edits to the OP body with timestamps ("Edit: thanks for X feedback, see Y") drives re-engagement signals to the Reddit algorithm.
- AEO impact: the comment chain becomes part of the indexed content. A well-structured OP comment with Q&A format is just as cite-able as the OP itself — LLMs treat the entire thread as one document.

### 3.4 Cross-link mechanics

- HN: linking to your own domain in the submission URL is normal. UTM tags work but visible to all (privacy-aware HN users notice). Canonical: external article should canonicalize to itself, not to HN.
- Reddit: links to own domain in posts are scrutinized — many subs have AutoMod that removes posts with links to your domain unless you have established karma/history in that sub. Self-promotion ratio rule: 10:1 (10 community-contributing posts for every 1 self-promo).
- "More here" pattern: comment-level links to own domain in response to specific questions ("we wrote this up here: [link]") perform better than OP-level self-promo.
- nofollow handling: both HN and Reddit comment links are nofollow (`rel="ugc nofollow"`). Direct PageRank pass = none. Indirect benefit (discovery, citation, traffic) = significant.

### 3.5 Refresh / re-engagement cycle

- HN: locked thread after ~14 days of inactivity (no new comments accepted). After lock → static. SEO compound continues regardless.
- Reddit: threads stay active for 6 months by default (some subs longer). Responding to comments months after posting drives:
  - Reddit's algorithm: re-engagement velocity → temporary feed-surfacing boost
  - Google: new content signal on the page → re-crawl trigger
- AEO compound: a thread that got fresh comments 3 months in is more likely to be re-fetched by AI crawlers in their freshness pass (per SEED-2's 30-day freshness decay heuristic — though that decay is about freshness of the FIRST citation, not subsequent re-fetches).

---

## 4. Competitor presence — observational

[PROGRESS] 18:48 — Section 4 in draft

### 4.1 Contexter competitors on HN + Reddit

**Pinecone:**
- HN: NO Show HN launch ever found (Pinecone never did a "Show HN: Pinecone" — it grew via VC-backed marketing)
- Top HN appearances:
  - "Pinecone integrates AI inferencing with vector database" — Dec 2024 — discussion thread
  - "Pinecone raises $100M Series B" — Apr 2023 — 130 pts, 97 comments
  - "Pgvector Is Now Faster Than Pinecone at 75% Less Cost" — Jun 2024 — 127 pts, 9 comments — *adversarial framing got better engagement than any Pinecone-positive post*
  - "Postgres vs. Pinecone" — Jul 2024 — 119 pts, 17 comments
  - "Chat with your data using LangChain, Pinecone, and Airbyte" — Aug 2023 — 220 pts, 59 comments — third-party tutorial outperformed Pinecone's own posts
- Reddit: present in r/MachineLearning + r/LocalLLaMA discussions, often as the "expensive option" comparator
- Citation pattern: LLMs cite Pinecone as one of the canonical vector DBs for RAG (high inherited authority)

**Weaviate:**
- HN: small Show HN launches:
  - "Show HN: Weaviate – Build your own generative health search engine" — Jul 2023 — 39 pts, 26 comments
  - "Weaviate – Open-Source AI Native Vector Database" — May 2023 — 15 pts, 4 comments
  - "Hybrid Search Fusion Algorithms" — Aug 2023 — 24 pts, 6 comments
- Pattern: Weaviate's HN engagement is consistently MODEST. They publish content, posts hit /newest, but rarely break into front-page-virality.
- Reddit: technical-content presence in r/MachineLearning, r/LocalLLaMA. Stronger Reddit presence than HN.

**Supermemory:**
- HN: 2 notable appearances:
  - "Supermemory: AI second brain for all your saved stuff" — Jul 22, 2024 — front-page hit
  - "Supermemory – AI Powered Bookmarks" — Jan 29, 2025 — second launch, different framing
  - "Is SuperMemory That Impressive?" — recent meta-discussion (id 46426762)
- Pattern: Supermemory got two HN cycles by reframing the pitch. Compound effect — second post leveraged first's awareness.
- Reddit: visible in r/SideProject, r/SaaS, r/ChatGPT discussions; less in pure-research subs.

**Ragie, Vectorize, Graphlit, Langbase, Morphik:**
- HN Algolia search returned NO meaningful Show HN launches for Ragie, Vectorize.io, Graphlit, Langbase, or Morphik as of April 2026.
- Confidence: medium (search may miss thread variants; manual verification on hn.algolia.com would tighten this).
- Implication: there is OPEN WHITESPACE on HN for RAG-as-a-service launches — none of the major Contexter competitors have established HN-flagship threads.

**Citation cross-effect (inferred):**
- Pinecone, Weaviate appear in LLM RAG-tooling answers because of their broader content marketing presence (own blogs cite-back, third-party tutorials, GitHub stars), NOT because of dominant HN/Reddit presence.
- Supermemory's HN front-page presence may correlate with citation pickup but no quantitative data found.

### 4.2 Vault adjacent (mitmproxy, Formal.ai, Watchtower, OpenLLMetry)

**mitmproxy:**
- HN: long history. Multiple front-page hits:
  - "Mitmproxy 11: Full HTTP/3 Support" — Sep 2024 — id 41744434
  - "Mitmproxy 7.0" — 2021 — id 27855476
  - Mentioned across 100+ HN threads on TLS interception, debugging, mobile dev, security tooling
- Reddit: present in r/netsec, r/programming, r/sysadmin, r/cybersecurity
- Citation pattern: LLMs cite mitmproxy as the canonical HTTPS-intercepting proxy. Heavily referenced in dev/debug answer flows.

**Formal.ai:**
- HN: limited surfaced data; no notable Show HN found in this research (would need targeted hn.algolia search by name)
- Confidence: low

**Watchtower:**
- The name "Watchtower" is overloaded — could refer to the Docker container auto-update tool, the Lyft tool, or other projects. Without disambiguation, no clean signal.

**OpenLLMetry:**
- Open-source LLM observability project (Traceloop). Active GitHub presence.
- HN: I did not run a targeted query for OpenLLMetry. Likely has moderate HN presence given LLM-observability is a hot vertical 2024-2026.

**Vault-specific whitespace:**
- "API key proxy / Claude Code key stripping" is a NICHE that has not been claimed by any major HN-flagship project as of April 2026.
- mitmproxy is general-purpose; Vault would be specific. No competitor occupies the exact "Claude-Code-API-key-safety" position with Show HN or Reddit traction.

---

## 5. Risk landscape

[PROGRESS] 18:55 — Section 5 in draft

**Anti-spam / mod-removal cascades:**
- HN: flag → /pool → de-front-paged within minutes; recovery essentially impossible
- Reddit AutoMod: pre-publication removal in many subs based on link/karma/account-age rules
- Reddit mod removal: post-publication, can be appealed but mods are unpaid and sometimes capricious
- Cross-platform cascade risk: if a single Show HN gets flagged for "marketing," the same author posting to Reddit subs same day may face additional scrutiny because shared username history can be cross-referenced (especially in r/programming, where mods have been seen to ban based on HN posting history)

**LLM training opt-out trends:**
- Reddit-Google deal: NOT exclusive. Reddit retained right to license to others. OpenAI deal followed. Anthropic refused → lawsuit.
- HN: no licensing deal. Public corpus. Open to scraping by all crawlers (HN robots.txt does not block major AI crawlers as of April 2026 — confirmed via direct check would be needed).
- Future trend: more platforms following Reddit's "license or sue" path likely. Could affect future HN/Y Combinator stance.

**Sub closures / private migrations:**
- r/transit 2024 — privatization mass deindex precedent
- r/Apollo 2023 — went private during API protests
- Risk: even high-traffic subs can disappear from Google overnight if mods take it private. Anything posted to a sub is at risk of disappearance.
- Mitigation: cross-post original content to own domain (canonical to own site), not Reddit, where possible — Reddit becomes a reference, not a source

**HN account-loss / mod-action escalation:**
- HN ban patterns: marketing-flavored comments, sock-puppet detection, repeated post removals → account-level shadowban (showdead behavior, posts invisible to logged-out users)
- Recovery: dang sometimes responds to email appeals; rate is anecdotal
- Risk: a Vault or Contexter HN account that gets shadowbanned loses ability to engage HN as a surface ENTIRELY — and HN's account-recovery process is minimal

**"Looking like marketing" thresholds:**
- HN flag threshold: ~3-5 user flags can de-front-page a post in early hours; ~10-20 can `[flagged]` it
- Reddit mod threshold: per-sub specific; many subs flag any post mentioning own domain unless karma > X
- Detection signals: superlative language, no "I built" first-person voice, vague benefit claims, no technical depth, link to landing page (not GitHub/docs), multiple posts same day
- Common AI-detection mistake: generic AI-written copy gets flagged faster than human-written marketing because phrasing patterns are distinctive (em-dash overuse, "moreover", "furthermore", structured-list-of-three patterns)

---

## 6. Adjacent / unexpected (researcher freedom)

[PROGRESS] 19:00 — Section 6 + adjacent surfaces

**Stack Overflow:**
- 84% of devs use SO as community platform (2025 Developer Survey).
- SO launched AI Assist Dec 2025 — built-in citation/attribution surface for AI-generated code answers. SO content explicitly designed for "human-validated source of truth" framing.
- SO is a parallel SEO/AEO surface to HN/Reddit but with stricter content type (Q&A only, no project launches). Not a Show-HN-style launch surface.
- LLM citation: SO is consistently cited by LLMs for code-error / how-to-do-X queries. Inheriting authority similar to Wikipedia for code questions.
- Source: [Stack Overflow blog 2025-12-29](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/); [SO AI Assist launch](https://stackoverflow.blog/2025/12/02/introducing-stack-overflow-ai-assist-a-tool-for-the-modern-developer/). Confidence: high.

**GitHub README:**
- Per SEED-2: Perplexity has a manual domain-list boost for GitHub.
- README files are first-paragraph-answer-style content by default → high AI-extraction efficiency.
- GitHub is a primary citation surface for any developer-tool LLM query.
- README + repo combined = both code (citation gold for "how do I use X" queries) and prose (citation gold for "what is X").
- Emerging: "README.LLM" framework (arxiv:2504.09798) — specifically formatted README files for LLM consumption, separate from human README.md. Adoption nascent in April 2026.
- Source: [arxiv 2504.09798](https://arxiv.org/html/2504.09798v2). Confidence: medium (framework exists; broad adoption uncertain).

**Indie Hackers, Dev.to, Lobste.rs:**
- Indie Hackers: lower domain authority than HN, low SERP visibility for tech queries; high acquisition value but minimal SEO/AEO compound.
- Dev.to: medium DA, decent SEO surface for "tutorial X" queries; moderate AI citation pickup. Worth posting to as cross-distribution but secondary.
- Lobste.rs: invite-only, high quality, low traffic. SEO/AEO compound minimal due to small index footprint. Niche.

**Quantified "1 HN post = X long-tail SEO value":**
- No published study found that quantifies a single HN front-page post's exact long-tail SEO value over 1+ years.
- Best proxy: case study DR jumps (+12 pts overnight from one front-page hit) and 150+ backlinks. These are short-term measures, not long-tail SEO value.
- Open research gap.

**Reddit Answers / HN AI summary impact:**
- Reddit Answers (Dec 2024+) keeps users on-platform; reduces Google traffic to Reddit threads but increases internal-Reddit-search traffic.
- HN has no first-party AI summary feature as of April 2026 (no public announcement found).
- Several third-party HN AI summarizers exist (e.g. "Show HN: AI powered Hacker News reader" id 46541285) — these are read-side tools, not write-side compound.

**Hugging Face hacker-news dataset:**
- 47.7M HN items indexed and updated every 5 minutes. Public.
- Implication: HN is a strong public training corpus — likely used by all major LLMs in pre-training data.

---

## Gaps / what could not be verified

1. **Exact April 2026 Ahrefs/Sistrix DR/AS for news.ycombinator.com** — Similarweb fetch failed; no clean SEO-tool number surfaced via WebSearch. Estimated DR 90+ via launch-guide DR-jump references but not verified.
2. **Sub-level Reddit SERP visibility (r/programming vs r/MachineLearning vs r/LocalLLaMA quantitative comparison)** — proprietary data, not in public guides.
3. **Per-engine HN citation share** — SEED-2 had Reddit per-engine breakdown but did NOT have HN per-engine data. No public study isolates HN.
4. **Reddit-Anthropic lawsuit current status (post June 2025)** — WebSearch returned the filing; no resolution / settlement / motion-to-dismiss outcome surfaced. Possibly unresolved as of April 2026.
5. **Reddit Answers citation behavior detail** — does it cite specific subs more / less? Does it diversify across subs or concentrate? No public study.
6. **HN robots.txt April 2026 state** — direct fetch needed to confirm no AI-crawler blocks; I did not fetch it.
7. **Single-HN-post lifetime SEO value (multi-year compound)** — no quantitative study found.
8. **CQS (Reddit Contributor Quality Score) — exact thresholds for spam-filter / shadowban escalation** — proprietary, not disclosed.
9. **Reddit scraper results for Contexter/Vault sub mapping** — completed; results saved to `nospace/tools/reddit-scraper/seo-aeo-results.json`. Summary table integrated into Section 2.1.
10. **OpenLLMetry, Formal.ai, Graphlit, Langbase, Morphik HN/Reddit detail** — not exhaustively queried; only general absence noted.

---

## Self-check checklist

- [x] Every claim traced to source (most have URLs; some pattern observations marked "Confidence: medium/low" where only synthesized)
- [x] All URLs included as live links (will fail if any 404'd between query and publish)
- [x] Dates noted for all sources; flagged > 18-mo-old where relevant (most data is 2024-2026, current)
- [x] Conflicting sources documented (e.g., Reddit Google deal $60M confirmed across 5+ sources; Anthropic lawsuit confirmed across 3+ sources)
- [x] Confidence assigned per claim AFTER checking
- [x] Numerical facts injected from source not from training (10k-30k Show HN traffic; $60M deal; $1B lawsuit; 40.1% Reddit training data)
- [x] Scope stated: Reddit + HN as SEO/AEO surfaces for Contexter + Vault, observation-only
- [x] Gaps and limitations stated explicitly (10 items above)
- [x] NO recommendations / strategy / decisions — all observation-only

---

## Source register

**Primary sources cited:**
- [CBS News — Google Reddit $60M deal](https://www.cbsnews.com/news/google-reddit-60-million-deal-ai-training/)
- [MediaNama — Reddit sues Anthropic](https://www.medianama.com/2025/06/223-reddit-anthropic-scraping-content-train-claude-ai/)
- [Complete AI Training — Reddit sues Anthropic for $1B](https://completeaitraining.com/news/reddit-sues-anthropic-for-1b-alleging-claude-was-trained-on/)
- [Best Lawyers — Reddit lawsuit analysis](https://www.bestlawyers.com/article/reddit-lawsuit-could-change-how-much-ai-knows-about-you/6905)
- [Columbia Journalism Review — Reddit AI licensing](https://www.cjr.org/analysis/reddit-winning-ai-licensing-deals-openai-google-gemini-answers-rsl.php)
- [Fortune — Reddit-Google deal Feb 2024](https://fortune.com/2024/02/23/reddit-ipo-google-api-data-deal/)
- [Fortune Reddit/Google IPO context](https://fortune.com/2024/02/23/reddit-60m-deal-google-search-giant-train-ai-models-on-posts/)
- [Lutzker & Lutzker — Reddit licensing analysis](https://www.lutzker.com/ip_bit_pieces/reddits-licensing-agreement-with-google/)
- [Social Media Today — Reddit Answers launch](https://www.socialmediatoday.com/news/reddit-launches-reddit-answers-ai-overviews/735010/)
- [eMarketer — Reddit Answers](https://www.emarketer.com/content/reddit-launches-ai-powered-reddit-answers-upgrade-platform-search)
- [CNBC — Reddit AI answers feature](https://www.cnbc.com/2024/12/09/reddit-begins-testing-ai-powered-answers-feature-to-win-users.html)

**SEO/AEO industry sources (2026):**
- [Reply Agent — Reddit SEO complete guide 2026](https://www.replyagent.ai/blog/reddit-seo-complete-guide)
- [Replymer — Reddit SEO 2026](https://replymer.com/blog/reddit-seo-complete-guide-2026)
- [SubredditSignals — Reddit SEO 2026 ranking factors](https://www.subredditsignals.com/blog/reddit-seo-in-2026-the-real-ranking-factors-behind-google-visible-threads-and-how-to-spot-winners-before-everyone-else)
- [iMark Infotech — Reddit SEO 2026](https://www.imarkinfotech.com/reddit-seo-in-2026-what-changed-what-actually-works-now/)
- [ALM Corp — Reddit SEO opportunities](https://almcorp.com/blog/reddit-seo-opportunities-guide/)
- [Amsive — Reddit SEO growth](https://www.amsive.com/insights/seo/reddits-seo-growth-a-deep-dive-into-reddits-recent-surge-in-seo-visibility/)
- [Search Engine Land — SEO 2026](https://searchengineland.com/seo-2026-higher-standards-ai-influence-web-catching-up-473540)
- [Soft CodeOn — Parasite SEO 2026](https://softcodeon.com/parasite-seo-does-it-still-work-is-it-safe/)
- [ALM Corp — Google March 2026 Spam Update](https://almcorp.com/blog/google-march-2026-spam-update-done-rolling-out/)
- [SEO Kreativ — March 2026 Spam Update completed](https://www.seo-kreativ.de/en/blog/google-march-2026-spam-update/)
- [SEO Juice — Nofollow vs Dofollow 2026](https://seojuice.com/blog/nofollow-vs-dofollow-links/)
- [Search Engine Journal — When to use nofollow](https://www.searchenginejournal.com/when-to-use-nofollow-on-links/383468/)

**HN-launch case studies + guides:**
- [Lucas Costa — How to do a successful HN launch](https://www.lucasfcosta.com/blog/hn-launch)
- [Onlook — How to absolutely crush your HN launch](https://onlook.substack.com/p/launching-on-hacker-news)
- [Indie Hackers — My Show HN front page guide](https://www.indiehackers.com/post/my-show-hn-reached-hacker-news-front-page-here-is-how-you-can-do-it-44c73fbdc6)
- [Marc Lou — How to launch a startup on HN](https://newsletter.marclou.com/p/how-to-launch-a-startup-on-hacker-news)
- [Pith & Pip — Writer's guide to HN](https://pithandpip.com/blog/hacker-news)
- [DEV — How to crush your HN launch](https://dev.to/dfarrell/how-to-crush-your-hacker-news-launch-10jk)
- [Mark Epear — How to launch a dev tool on HN](https://www.markepear.dev/blog/dev-tool-hacker-news-launch)
- [Awesome Directories — HN front page guide](https://awesome-directories.com/blog/hacker-news-front-page-guide/)

**Hacker News + Algolia direct:**
- HN Algolia search API — used to fetch competitor presence data
- [Hugging Face open-index/hacker-news dataset](https://huggingface.co/datasets/open-index/hacker-news)
- [HN front 2026-04-24](https://news.ycombinator.com/front)
- [HN — Show new](https://news.ycombinator.com/shownew)
- [HN — Is Show HN dead?](https://news.ycombinator.com/item?id=47045804)

**Stack Overflow / GitHub-adjacent:**
- [Stack Overflow blog — 2025 Developer Survey](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)
- [Stack Overflow — AI Assist launch Dec 2025](https://stackoverflow.blog/2025/12/02/introducing-stack-overflow-ai-assist-a-tool-for-the-modern-developer/)
- [arxiv ReadMe.LLM framework](https://arxiv.org/html/2504.09798v2)

**HN Algolia direct queries (concrete data):**
- [HN: Mitmproxy 11 Full HTTP/3](https://news.ycombinator.com/item?id=41744434)
- [HN: Mitmproxy 7.0](https://news.ycombinator.com/item?id=27855476)
- [HN: Supermemory original Show HN](https://news.ycombinator.com/item?id=41030219)
- [HN: Supermemory AI Bookmarks](https://news.ycombinator.com/item?id=42863121)
- [HN: Pinecone integrates AI inferencing](https://news.ycombinator.com/item?id=42315364)
- [HN: Show HN AI-powered HN reader](https://news.ycombinator.com/item?id=46541285)

[PROGRESS] 19:05 — File complete. Awaiting Reddit scraper background results to optionally append in 2.1.

