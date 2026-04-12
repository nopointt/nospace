# Reddit Subreddit Playbook — CTX-13

> Per-sub rules, angles, and tactics. Source: R1 research (30 subs analyzed).
> ⚠️ Rules sourced indirectly (reddit.com blocked). Manually verify sidebar before first post in each sub.

---

## Tier 1: CRITICAL (launch here)

### r/ClaudeAI (688K)
- **Self-promo:** Moderate. MCP tool sharing tolerated when genuine
- **Karma req:** Unknown, est. 50-100+
- **Peak:** 9-11 AM EST weekdays
- **Our angle:** "MCP endpoint that turns any file into searchable knowledge for Claude"
- **Format:** Technical demo, "I tested X" comparison, MCP workflow tips
- **DO:** Share config tips, help with MCP setup, demonstrate real workflows
- **DON'T:** Marketing language, "revolutionary", naked product links
- **Warmup topics:** T-01 (MCP setup), T-02 (MCP troubleshooting), T-03 (best MCP servers), T-04 (how MCP works), T-27 (giving Claude more context)

### r/mcp (~89K, growing fast)
- **Self-promo:** Likely high (sub exists for MCP tools)
- **Karma req:** Unknown (new sub)
- **Peak:** US tech hours
- **Our angle:** Direct "new MCP server" announcement with setup instructions
- **Format:** Technical, include install command or config snippet
- **DO:** Share architecture, benchmarks, GitHub link. Repeat posting OK with milestones (CodeGraphContext posted 4x)
- **DON'T:** Post without technical substance
- **Note:** ⚠️ MUST verify rules manually before posting — limited data available

### r/RAG (~55K)
- **Self-promo:** Likely moderate-high (builders sharing tools)
- **Karma req:** Unknown
- **Peak:** US tech hours weekdays
- **Our angle:** "Here's how we built our RAG pipeline — chunking, embeddings, retrieval, what we learned"
- **Format:** Deep technical dive that happens to be about Contexter's architecture
- **DO:** Share specific decisions (why pgvector, why Jina v4, why hybrid search), benchmark data
- **DON'T:** Generic "check out my tool" without technical substance
- **Warmup topics:** T-13 (build RAG), T-14 (debug RAG), T-15 (chunking), T-19 (hybrid search)
- **Note:** ⚠️ MUST verify rules manually

---

## Tier 2: HIGH (easy launch, promo-friendly)

### r/SideProject (230K)
- **Self-promo:** HIGH — explicitly welcome. Need working product, not idea
- **Karma req:** ~10
- **Peak:** Mon-Wed 9-11 AM EST. Video demos perform best
- **Our angle:** "I built a RAG-as-a-service — upload any file, get an API + MCP endpoint"
- **Format:** Demo link, transparent about stage, engage feedback
- **DO:** Show working product, be honest about early stage
- **DON'T:** Idea-stage posts, no demo link

### r/indiehackers (115K)
- **Self-promo:** HIGH — whole sub is for this
- **Karma req:** Low
- **Our angle:** "I built Contexter — here's my journey, stack, first users"
- **Format:** Authentic founder story with specific numbers and challenges

### r/AlphaandBetaUsers (21K)
- **Self-promo:** VERY HIGH — sub exists for beta recruitment
- **Karma req:** Very low
- **Our angle:** "Looking for beta testers: upload any file, get RAG-powered knowledge API with MCP"
- **Format:** Direct ask for testers with clear product description

### r/microsaas (155K)
- **Self-promo:** HIGH — focused on micro SaaS
- **Karma req:** Low
- **Our angle:** "I built a micro-SaaS: RAG-as-a-service for AI power users"
- **Format:** Pricing, stack, traction specifics

### r/buildinpublic (27K)
- **Self-promo:** HIGH — designed for journey posts
- **Karma req:** Low
- **Our angle:** Progress updates, milestones, challenges
- **Format:** "Week X: Y users" type updates

---

## Tier 3: MEDIUM (warmup + strategic posting)

### r/LocalLLaMA (671K)
- **Self-promo:** 10% rule
- **Karma req:** Low
- **Peak:** US tech hours + model release spikes
- **Our angle:** "RAG-as-a-service that works with any LLM via MCP — including local models"
- **DO:** Benchmarks, architecture, GitHub. Must be technical
- **DON'T:** Cloud-only positioning (community values self-hosted)
- **Warmup topics:** T-16 (embeddings), T-17 (pgvector), T-24 (context vs RAG)

### r/SaaS (409K)
- **Self-promo:** Moderate — Weekly Feedback Thread for products
- **Karma req:** ~100 + 7d account
- **Peak:** US business hours Mon-Wed
- **Our angle:** "How we built a RAG-as-a-service and got our first users"
- **DO:** Real metrics, pricing experiments, growth strategies
- **DON'T:** Pure promotion outside weekly thread

### r/webdev (2.6M)
- **Self-promo:** 9:1 rule, Showoff Saturday only
- **Karma req:** Unknown, est. moderate
- **Our angle:** Dev experience, technical implementation
- **Format:** Saturday showcase with [Showoff Saturday] flair

### r/AI_Agents (~100K+)
- **Self-promo:** Moderate-high, recurring project threads
- **Our angle:** "How to give AI agents persistent knowledge with RAG-as-a-service via MCP"
- **Format:** Agent + RAG integration guide

### r/selfhosted (553K)
- **Self-promo:** Moderate (lead with value, not product)
- **Peak:** Evenings + weekends
- **Our angle:** Infrastructure story ($60/month Hetzner stack)
- **Note:** Only works if emphasizing self-hostable components or architecture
- **Warmup topics:** T-37 (Hetzner), T-43 (Postgres as everything DB)

### r/NotebookLM (50K+)
- **Self-promo:** Unknown — primarily complaint/alternative threads
- **Our angle:** Empathize with limitations → suggest API-based alternative
- **DO:** Wait for "alternatives?" threads, comment with genuine experience
- **DON'T:** Create posts attacking NotebookLM

### r/MachineLearning (3M)
- **Self-promo:** Weekly [D] Self-Promotion Thread + [P] flair for projects
- **Karma req:** ~100+
- **Our angle:** [P] post with architecture, benchmarks, methodology
- **DO:** Research-grade rigor, reproducible results
- **DON'T:** Marketing speak

---

## Tier 4: COMMENT-ONLY (build karma, no launch posts)

### r/ChatGPT (11.4M)
- **Why comment-only:** Strict moderation, massive sub, posts drown
- **Warmup topics:** T-27 (give ChatGPT more context), T-28 (vs NotebookLM)
- **Opportunity threads:** Memory complaint threads (300+ active)

### r/programming (6M+)
- **Why comment-only:** Very strict, no self-promotion
- **Warmup topics:** T-43 (Postgres everything DB), developer tool discussions

### r/Entrepreneur (5.1M)
- **Why comment-only:** 10 sub-karma required, "Thank You Thursday" only
- **Self-promo:** Only Thursday thread

### r/Notion (346K)
- **Why comment-only:** Strict, documented bans for self-promo

### r/productivity (3.7M)
- **Why comment-only:** Large sub, anti-promo culture
- **Opportunity:** "What tools for X" threads

---

## Designated Promo Threads

| Subreddit | Thread | Frequency | Day |
|---|---|---|---|
| r/MachineLearning | [D] Self-Promotion | Weekly | Varies |
| r/SaaS | Weekly Feedback Thread | Weekly (pinned) | Varies |
| r/startups | Share Your Startup | Monthly | 1st of month |
| r/Entrepreneur | Thank You Thursday | Weekly | Thursday |
| r/webdev | Showoff Saturday | Weekly | Saturday |

---

## Timing Cheat Sheet

| Time (EST) | Best for |
|---|---|
| 6-9 AM Tue-Thu | New posts in developer subs |
| 9-11 AM Mon-Wed | Posts in startup/SaaS subs |
| 12-2 PM Mon-Fri | Comments on morning posts |
| 7-9 PM Mon-Thu | Comments, follow-up discussions |
| 10 AM-12 PM Saturday | r/webdev Showoff Saturday, r/SideProject |
| **AVOID** | 2-6 AM EST, Friday afternoon |
