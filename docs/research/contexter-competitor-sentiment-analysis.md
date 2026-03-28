# Contexter Competitor Sentiment Analysis
> What users LOVE, HATE, and what triggers them to SWITCH
> Date: 2026-03-28
> Sources: Existing competitor research files + fresh web research (Reddit, ProductHunt, HN, forums, review sites)

---

## Table of Contents

1. [Direct Competitors (RAG/Context Infrastructure)](#1-direct-competitors)
   - Supermemory
   - Ragie
   - Morphik
   - Vectorize
   - Graphlit
   - Langbase Memory
2. [Indirect Competitors (Consumer AI Tools)](#2-indirect-competitors)
   - ChatGPT (Memory + File Upload)
   - Claude Projects
   - NotebookLM
3. [Indirect Competitors (Developer Memory)](#3-indirect-competitors-developer-memory)
   - Mem0
4. [Universal RAG User Pain Points](#4-universal-rag-user-pain-points)
5. [Sources](#5-sources)

---

## 1. Direct Competitors

### Supermemory

| What users love | What users hate | Switching triggers |
|---|---|---|
| Speed — sub-300ms retrieval resonates ("lightning speed & consistency") | "Polished repackaging of known ideas rather than a breakthrough" (HN user gabrycina) | Cost cliff: Free 10K queries -> $399/mo Scale tier is a steep jump |
| Memory graph connecting context across projects | Silent retrieval failures — writes succeed but recall returns empty (GitHub #792) | Closed self-host: enterprise agreement required for self-hosting despite MIT repo |
| Integration simplicity — "achievable in 120 seconds" | Cannot edit memories — must create new ones instead of editing existing | Vendor lock-in: proprietary `sm_` API keys, no data portability |
| "The only thing that works reliably" (CEO testimonial) | Platform instability — login failures, SSL errors on org invites, JSON parse errors | Benchmark skepticism: independent tests show 70% vs. self-claimed #1 (dev.to 2026) |
| Token efficiency — "40-50% fewer tokens" reported | Dual product confusion (API vs consumer app) on landing page | March 2026 outage: first major downtime, elevated latency for hours |
| Strong ecosystem: Claude Code, Cursor, OpenCode plugins | Learning curve for non-technical users | |
| 19.8K GitHub stars — strong organic discovery | Occasionally sluggish interface with heavy use | |
| Formatting issues when importing bullet-pointed lists | | |

**Verbatim praise:**
> "A thousand times better than the competition." — Zaid Mukaddam, Scira.ai
> "60% recall accuracy improvement" — Scira.ai

**Verbatim criticism:**
> "It's essentially a memory layer on top of an LLM... a polished repackaging of known ideas rather than a breakthrough." — gabrycina, HN
> "Can't edit memories — I would prefer to go back and edit existing memories rather than creating separate ones." — Olivia, Product Hunt (4.0/5)

---

### Ragie

| What users love | What users hate | Switching triggers |
|---|---|---|
| A+ developer experience — "Ragie is unbelievable!" (McKay Wrigley) | No self-hosted option — cloud only | Connector pricing: $250/connector/month after first free one |
| Speed to production — "3 weeks instead of 3 months" (Glue) | Potential for vendor lock-in (skywork.ai comparison) | Cost at scale: $100-$500/mo + page overages vs self-hosted alternatives |
| Legal drafting "5-10x faster" (Ellis) | Feature limitations tied to Ragie's roadmap, not user customization | No control over embedding models — blocks domain-specific tuning |
| All advanced features (reranking, hybrid search) available on free tier | Subscription costs vs free open-source alternatives | Cloud-only = hard blocker for on-prem regulated environments |
| Context-aware MCP server (dynamic tool descriptions) | Learning curve for new users | Rate limits exist but thresholds not publicly documented |
| Enterprise-ready: SOC2, HIPAA, GDPR from day one | No published rate limit documentation | Proprietary chunking/indexing — migrating means re-indexing everything |
| 40+ file formats including 11 video formats | | |

**Verbatim praise:**
> "I LOVE ragie!" — Luke Thomas, Zapier
> "Ragie is doing for RAG infrastructure what AWS did for the cloud" — Craft Ventures framing

**Inferred friction:**
No independent negative reviews found on any public platform (G2: 0, Slashdot: 0, Reddit: 0). Product is 18 months old and pre-review-corpus stage.

---

### Morphik

| What users love | What users hate | Switching triggers |
|---|---|---|
| ColPali visual search — "game changer for legal, aerospace, health tech" (PH) | "Never hallucinate" headline challenged: "How can it never hallucinate when retrieval accuracy is at 95%?" (vikyw89, GitHub) | GPU requirement for ColPali makes self-hosting operationally heavy |
| 93%+ accuracy on arXiv QA benchmarks | Documentation quality lags behind product velocity | Steep pricing cliff: Free (200 pages) -> Pro ($59/mo, 2,000 pages) |
| Search across diagrams and videos — "a big win" (HN user) | MCP update "isn't as interesting honestly" (bosky101, HN) | BSL license — some enterprises require Apache/MIT |
| Knowledge graphs in a single line of code | Self-hosting has "limited support" (official docs) | Self-hosted is first-class in messaging but second-class in support |
| Open source (BSL 1.1, 3,500 GitHub stars) | GPU Docker flash_attn crash (Issue #258 — resolved) | 2-person team raises scalability questions for enterprise commitments |
| Research Agent for multi-hop retrieval | Cloud vs self-hosted feature gaps | |

**Verbatim praise:**
> "This is seriously impressive, visual-based search for technical and research-heavy documents feels like a game changer." — PH user
> "The accuracy on the arXiv QA benchmark is really impressive." — PH user

**Verbatim criticism:**
> "More extensive documentation and use cases and a 'Deploy your first app' section would be helpful." — lehen04, HN
> "How can it never hallucinate when retrieval accuracy is at 95% instead of 100%?" — vikyw89, GitHub

---

### Vectorize

| What users love | What users hate | Switching triggers |
|---|---|---|
| No-code pipeline builder — "smooth as silk" (G2) | "Poor UI... lacks polish and functionality" (G2) | Pipeline count limits: only 3 on Pro ($399/mo) — forces Enterprise |
| "Very intuitive no-code system for testing and setting up various embeddings APIs" (G2) | "Barebones" UI (G2, multiple reviewers) | No audio/video support — blocker for media-rich use cases |
| Automatic weekly pipeline sync | Initial learning curve for advanced features | No self-hosting — fully managed cloud only |
| Responsive team ("Chris and the team are very responsive") (G2) | Variable pricing affecting budgeting | Pricing unpredictability on overages |
| RAG evaluation engine — unique differentiator | Complex setup (PH aggregate) | Price: $99/mo Starter is 21x more expensive than Contexter for equivalent |
| Hindsight agent memory: 91.4% on LongMemEval | Pipeline limits disproportionately restrictive | |
| 30+ document formats, Iris extraction | | |

**Verbatim praise:**
> "Building RAG pipelines has become smooth as silk." — G2 reviewer
> "Makes it easy to connect RAG sources for places where non-technical users want to store them." — G2 reviewer

**Verbatim criticism:**
> "Poor UI with Vectorize.io, feeling it lacks polish and functionality despite some improvements." — G2 reviewer
> "Some users had difficulties with the UI and felt it was barebones." — G2

---

### Graphlit

| What users love | What users hate | Switching triggers |
|---|---|---|
| 36+ live data connectors — broadest in category | Vendor lock-in: "Data stored with third party" (TrustGraph comparison) | Cloud-only = disqualified for EU data residency, GDPR-strict, government, healthcare |
| Multimodal pipeline (audio, video, images) | "API-only access to your data" — no direct database queries | Usage-based credits = "variable monthly bills" |
| Knowledge graph with 19 entity types (Schema.org) | "Limited control over data location" | No SOC2 certification found publicly |
| Framework-agnostic — "switch agent frameworks without rebuilding memory layer" | GraphQL API = steeper learning curve than REST | Opaque credit system — no published per-operation pricing |
| MCP server has 373 GitHub stars (primary discovery) | Zero independent reviews on any platform | |
| Kirk Marple's credibility (ex-Microsoft, prior exit) | Second PH launch got only 3 upvotes (vs 105 first) | |

**Inferred friction:**
Zero independent user reviews found on G2, Slashdot, Capterra, or PH (1 review total, likely affiliated). Product is in pre-social-proof stage with only one named production customer (Zine).

---

### Langbase Memory

| What users love | What users hate | Switching triggers |
|---|---|---|
| Zero-infra RAG — "test RAG via Langbase memory agents, seeing which chunks get retrieved" | Storage limits are tiny: 5 MB free / 50 MB at $250/mo | Knowledge base > 50 MB hits Growth ceiling, requires sales call |
| "One of the most 'need to have' tools in the past decade" (review aggregation) | JS-focused SDK — Python developers feel second-class | Audio/video not supported |
| Native integration with Pipes (agent platform) — zero glue code | "Documents with only selectable text are supported" — scanned PDFs fail | Scanned PDF / OCR = documented failure mode |
| Quickstart in 8 steps | "30-50x cheaper" claim is unverified — no methodology | Data sovereignty / GDPR: fully managed cloud, no self-hosted |
| "Millions of personalized RAG knowledge bases" at scale | Free tier (5MB, 2 files) insufficient for real experimentation | Locked to OpenAI embeddings — no model choice |
| Composability within Langbase platform | No intermediate tier between $250/mo and Enterprise | Cost at scale: $100/mo minimum for production |

**Inferred friction:**
No verified independent negative reviews found on any platform. Gap between self-reported scale (36K developers, 184B tokens) and near-zero independent review corpus is notable.

---

## 2. Indirect Competitors (Consumer AI Tools)

### ChatGPT (Memory + File Upload)

| What users love | What users hate | Switching triggers |
|---|---|---|
| Memory feature — "The fact that it knows me and understands my needs is the most valuable feature" | February 2025 memory wipe destroyed years of accumulated data | Involuntary memory loss drives subscription cancellation intent |
| Accumulated personalized context over months/years | "Each new chat resets completely, like it has no memory of me at all" | Memory cap: ~1,500-1,750 words — then silent degradation |
| Custom Instructions as persistent context | "Two years worth of memories gone (Plus subscriber)" | No warning when memory is full — "silence" |
| File upload for in-conversation analysis | File upload limits: 3 files/day free, 80 per 3hr Plus | "Using 2024's AI on 1990s memory policy" (Medium user) |
| GPTs for specialized workflows | Files above 50MB frequently cause timeout/processing errors | 300+ active complaint threads in r/ChatGPTPro since July 2025 |
| | "I've lost a year and a half of memories, and this thing was extraordinarily important" | Context fragmentation: no cross-conversation continuity |
| | November 2025 memory incident (acknowledged by OpenAI) | No export of memories or cross-tool portability |
| | "It feels like losing a beloved relative" — grief language for AI memory loss | |

**Verbatim pain quotes:**
> "I spent a year building these memories with the AI, and now all my crucial data is lost." — tugsatbaris, OpenAI Forum
> "few more than 8 months of chats, gone down the drain in one morning, and it's devastating" — benjamingalindo, OpenAI Forum
> "for a paid product, this limit feels primitive. We're using 2024's AI on 1990s memory policy." — Medium user
> "OpenAI doesn't notify you when your memory is full. There's no warning, no banner, no popup — just silence."

---

### Claude Projects

| What users love | What users hate | Switching triggers |
|---|---|---|
| Knowledge base per project — "turn Claude into your brain's co-worker" | 200K token context window cap (500K Enterprise) | Unpredictable usage limits — "you don't know when you'll hit limits" |
| Multiple file formats: PDF, DOCX, CSV, TXT, HTML, ODT, RTF, EPUB | Files are read-only — cannot edit, update, rename, or delete in place | Free users cannot create projects at all |
| Project instructions persist across conversations | Flat file structure — no folders | Rate limit complaints: "sessions meant to last hours burn out in minutes" |
| RAG selectively pulls relevant sections | "Claude only pulls relevant sections" — can't read entire KB at once | August 2025 weekly caps triggered "Claude Is Dead" threads |
| Team sharing on paid plans | No audio/video file support | March 2026: Max subscribers report 5-hour windows depleting in 1-2 hours |
| | Each Project is siloed — no cross-project context | |
| | 30MB per individual file | |

**Verbatim pain quotes:**
> "Your usage depends on Anthropic's load, and they don't tell you when you're going to hit limits."
> "Sessions meant to last hours are literally burning out in minutes." — Claude Code users, March 2026

---

### NotebookLM

| What users love | What users hate | Switching triggers |
|---|---|---|
| Grounded in user's sources — "AI tools don't need to make things up to be useful" | 50 source cap per notebook — researchers with 100+ papers hit ceiling immediately | No API access — cannot programmatically upload, query, or extract |
| Audio Overviews — podcast-style content generation | Isolated notebooks — psychology notebook can't reference neuroscience notebook | Export is "surprisingly difficult" — no structured export of notebooks |
| "Thinking partner" positioning resonates with non-technical users | No export to PDF, Word, or Excel — only Google Sheets/Docs | 100+ documents causes slowdowns, crashes, or confusing answers |
| Source-grounded responses reduce hallucination | Cannot see charts, diagrams, or schematics in PDFs — ignores visual content | Source updates not recognized — AI references outdated copy |
| Free tier generous enough for experimentation | Audio context truncates long documents, leading to "hallucinated summaries" | No task management layer — can't flag for follow-up |
| | Mobile app doesn't sync saved Studio output | Daily caps on Audio Overviews |
| | No bulk import of YouTube videos — one at a time only | No cross-notebook intelligence |
| | No real-time source sync — edits to Google Docs not reflected | |

**Inferred pain from review articles:**
> "NotebookLM feels powerful until you try to do these 5 basic things." — XDA Developers
> "Once you try to add more than a hundred documents, they slow down, crash, or give you confusing answers." — Elephas.app

---

## 3. Indirect Competitors (Developer Memory)

### Mem0

| What users love | What users hate | Switching triggers |
|---|---|---|
| Single line of code integration | Limited review data — near-zero independent reviews on any platform | No substantial complaint corpus found |
| 41,000+ GitHub stars | (Insufficient data to populate) | (Insufficient data) |
| Beat OpenAI by 26% accuracy with 91% faster performance (benchmark) | | |
| 13 million Python package downloads | | |
| Open source with strong community | | |
| $24M funding validates category | | |

**Note:** Mem0 is primarily a developer memory framework, not a consumer product. Review corpus on public platforms (G2, Slashdot, SourceForge) shows zero user reviews as of March 2026.

---

## 4. Universal RAG User Pain Points

These pain points appear consistently across ALL products and ALL user segments:

### Pain 1: Context Loss / Memory Wipe (HIGHEST SEVERITY)

Users invest weeks, months, or years building context — then lose it involuntarily.
- ChatGPT: February 2025 mass memory wipe, November 2025 incident
- Supermemory: Silent retrieval failures (write succeeds, read empty)
- All AI tools: New conversation = blank slate
- Emotional impact escalates to grief language after 6+ months of accumulated context

> "I spent a year building these memories with the AI, and now all my crucial data is lost."

### Pain 2: Context Fragmentation Across Tools

No AI tool shares context with any other. Users must re-explain everything when switching tools.
- "Using multiple AI tools feels like having a team of brilliant coworkers, who just refuse to talk to each other."
- Both Anthropic and Google shipped memory transfer tools in March 2026 — direct market validation
- Cursor Forum: "I explain my architecture in the morning and in the afternoon I have to explain it all again"

### Pain 3: Opaque / Unpredictable Pricing at Scale

Every managed RAG service creates cost anxiety:
- Ragie: $250/connector/month after first
- Vectorize: Pipeline limits force Enterprise at $399/mo for only 3 pipelines
- Langbase: 50 MB at $250/mo — not a knowledge base, it's a demo
- Supermemory: Free -> $399 cliff
- Graphlit: Opaque credit system, no published per-operation cost
- Claude/ChatGPT: Rate limits depend on server load, unpredictable

### Pain 4: Vendor Lock-in / No Data Portability

Every cloud-only product creates lock-in:
- Ragie: Proprietary chunking, no export, re-index everything to leave
- Supermemory: `sm_` API keys, proprietary memory graph format
- Graphlit: "API-only access to your data" — no direct DB access
- Langbase: Locked to OpenAI embeddings, no model choice
- Vectorize: Fully managed, no self-hosting
- ChatGPT/Claude: Memory is platform-specific, siloed

### Pain 5: Chunking / Retrieval Quality

80% of RAG failures trace back to ingestion and chunking, not the LLM:
- "One bad chunk split ruins relevance"
- Fixed-size chunking: 47-51% faithfulness vs 79-82% for semantic chunking
- "I asked for the Q3 policy update, it gave me the Q1 draft"
- Vector-only search has "mathematically provable limitations"
- Single-pass RAG is dead — multi-step retrieval needed but few products offer it

### Pain 6: Format Limitations

Users have content in formats their tools cannot process:
- Vectorize: No audio/video support
- Langbase: Only .txt, .pdf, .md, .csv + coding files — no DOCX, no OCR, no audio
- NotebookLM: Cannot see charts, diagrams, or schematics in PDFs
- Claude Projects: No audio/video files
- ChatGPT: File upload limits and timeouts on large files

### Pain 7: No Self-Hosting / Data Sovereignty

Cloud-only products are automatically disqualified for:
- EU data residency (GDPR-strict)
- Healthcare (HIPAA without third-party audit)
- Government / defense (air-gapped networks)
- Enterprise legal review (data stored with third party = compliance complexity)
- Affected: Ragie, Vectorize, Graphlit, Langbase, Supermemory (enterprise agreement for self-host)

### Pain 8: UI / UX Polish Gap

Developer tools consistently under-invest in interface quality:
- Vectorize: "Poor UI... lacks polish" (G2, multiple reviewers)
- Morphik: Documentation quality lags product velocity
- MCP ecosystem: "95% of MCP servers are utter garbage" (Reddit)
- NotebookLM: No structured export, no folders, no task management

### Pain 9: "Is This Really Novel?" Technical Skepticism

Experienced developers question whether managed RAG adds value over DIY:
- "We've had embeddings + vector search + profile stores for years" — HN on Supermemory
- "Subscription costs versus free open-source license" — on Ragie
- "Build it yourself" sentiment strongest among senior engineers and infrastructure teams
- Unverified performance claims (Langbase "30-50x cheaper", Morphik "never hallucinate") erode trust

### Pain 10: MCP Ecosystem Immaturity

MCP is promising but painful in production:
- Token bloat: 50 tools = 100K+ tokens burned before conversation starts
- Security vulnerabilities: prompt injection, sandbox escapes in early implementations
- Enterprise gaps: no multi-tenancy, no admin controls, no context-aware discovery
- Server quality: barrier to publish is low, barrier to publish well is high

---

## Summary Matrix: Contexter Positioning Opportunities

| Universal Pain | Contexter's Answer | Strength |
|---|---|---|
| Context loss / memory wipe | User-owned storage, user-controlled backups | Strong |
| Context fragmentation across tools | MCP-native = any AI tool reads your context | Strong |
| Opaque / unpredictable pricing | Flat EUR 4.72/mo self-hosted, no usage ceiling | Very strong |
| Vendor lock-in | Self-hosted on your server, open infrastructure | Very strong |
| Chunking / retrieval quality | (Must demonstrate comparable quality) | Needs proof |
| Format limitations | 15 formats incl. audio/video | Strong vs Langbase, Vectorize; parity with others |
| No self-hosting | Primary deployment mode | Very strong |
| UI/UX gap | (API-first, no UI currently) | Not applicable |
| Technical skepticism | Transparent, simple, self-hostable | Moderate — simplicity counters skepticism |
| MCP ecosystem issues | Purpose-built MCP, minimal tool surface | Moderate |

---

## 5. Sources

### Existing Research Files (read in full)
- `contexter-gtm-competitor-supermemory.md` (2026-03-27)
- `contexter-gtm-competitor-ragie.md` (2026-03-27)
- `contexter-gtm-competitor-morphik.md` (2026-03-27)
- `contexter-gtm-competitor-vectorize.md` (2026-03-27)
- `contexter-gtm-competitor-graphlit.md` (2026-03-27)
- `contexter-gtm-competitor-langbase.md` (2026-03-27)
- `contexter-gtm-v2-nontechnical-pain.md` (2026-03-27)

### Fresh Web Research (2026-03-28)
- [Supermemory Incident Report March 2026](https://blog.supermemory.ai/incident-report-march-2026/)
- [Supermemory Review — Comparateur-IA](https://comparateur-ia.com/en/ai-tools/supermemory-ai)
- [Supermemory Evaluation for Claude Code](https://adventuresinclaude.ai/posts/2026-02-17-supermemory-evaluation/)
- [RAGFlow vs Ragie comparison](https://skywork.ai/skypage/en/RAGFlow-vs.-Ragie-Which-RAG-Platform-is-Right-for-You-in-2025/1976482607423090688)
- [Ragie Review — DeClom](https://declom.com/ragie)
- [Ragie Review — AIChief](https://aichief.com/ai-development-tools/ragie/)
- [MCP: What's Working, What's Broken — StackOne](https://www.stackone.com/blog/mcp-where-its-been-where-its-going/)
- [MCP Token Bloat — The New Stack](https://thenewstack.io/how-to-reduce-mcp-token-bloat/)
- [MCP Roadmap 2026 — The New Stack](https://thenewstack.io/model-context-protocol-roadmap-2026/)
- [MCP is a fad — HN discussion](https://news.ycombinator.com/item?id=46552254)
- [RAG Limitations: 7 Critical Challenges 2026](https://www.stackai.com/blog/rag-limitations)
- [Why RAG Still Feels Clunky in 2025 — HuggingFace Forums](https://discuss.huggingface.co/t/why-does-rag-still-feel-clunky-in-2025/164650)
- [Why Most RAG Systems Fail in Production — DEV.to](https://dev.to/theprodsde/why-most-rag-systems-fail-in-production-and-how-to-design-one-that-actually-works-j55)
- [Fixing RAG in 2026 — Medium](https://medium.com/@gokulpalanisamy/fixing-rag-in-2026-why-your-enterprise-search-underperforms-and-what-actually-works-93480190fdd0)
- [NotebookLM Limitations 2026 — Atlas Blog](https://www.atlasworkspace.ai/blog/notebooklm-limitations)
- [NotebookLM feels powerful until... — XDA Developers](https://www.xda-developers.com/notebooklm-limitations/)
- [NotebookLM 5 features for 2026 — Android Police](https://www.androidpolice.com/notebooklm-powerful-but-these-features-would-make-it-unstoppable/)
- [NotebookLM Review 2026 — The Collective](https://getaitoolhub.com/articles/notebooklm-review-2026-still-worth-using)
- [ChatGPT Data Loss — OpenAI Community](https://community.openai.com/t/critical-chatgpt-data-loss-engineering-fix-urgently-needed/1360675)
- [ChatGPT Memory Regression Bug — OpenAI Community](https://community.openai.com/t/bug-gpt-4o-memory-regression-context-loss-across-chats-and-inside-threads/1310926)
- [ChatGPT Silent Memory Crisis — AllAboutAI](https://www.allaboutai.com/ai-news/why-openai-wont-talk-about-chatgpt-silent-memory-crisis/)
- [ChatGPT Memory Wipe Crisis — WebProNews](https://www.webpronews.com/chatgpts-fading-recall-inside-the-2025-memory-wipe-crisis/)
- [ChatGPT File Upload Limits 2026](https://aicognitivezone.com/chatgpt-file-upload-limits/)
- [Claude Devs Usage Limits — The Register](https://www.theregister.com/2026/01/05/claude_devs_usage_limits/)
- [Claude Code Rate Limit Drain — MacRumors](https://www.macrumors.com/2026/03/26/claude-code-users-rapid-rate-limit-drain-bug/)
- [Claude Weekly Limits Broken — Medium](https://medium.com/all-about-claude/claude-weekly-limits-are-still-broken-but-the-2x-usage-offer-shows-anthropic-gets-it-e0c35e51bb70)
- [Claude Projects — Help Center](https://support.claude.com/en/articles/9517075-what-are-projects)
- [Claude File Upload Limits — Fast.io](https://fast.io/resources/claude-file-upload-limit/)
- [Mem0 raises $24M — TechCrunch](https://techcrunch.com/2025/10/28/mem0-raises-24m-from-yc-peak-xv-and-basis-set-to-build-the-memory-layer-for-ai-apps/)
- [AI Memory Benchmark: Mem0 vs OpenAI vs LangMem](https://guptadeepak.com/the-ai-memory-wars-why-one-system-crushed-the-competition-and-its-not-openai/)
- [Langbase Review — AIChief](https://aichief.com/ai-development-tools/langbase/)
- [Langbase Review — AI Agents List](https://aiagentslist.com/agents/langbase)
- [RAG Production Guide 2026 — PremAI](https://blog.premai.io/building-production-rag-architecture-chunking-evaluation-monitoring-2026-guide/)
- [RAG at Scale 2026 — Redis](https://redis.io/blog/rag-at-scale/)
- [Chunking Strategies for RAG — Weaviate](https://weaviate.io/blog/chunking-strategies-for-rag)

---

*Report generated: 2026-03-28 | Analyst: Orchestrator (Axis)*
