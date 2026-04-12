# Reddit Warmup Calendar — CTX-13 Phase 1

> 3-week plan. Goal: karma 200+. ZERO product mentions.
> Source: R5 research (52 topics, 10 templates, engagement data)
> Timing: 6-9 AM EST or 12-2 PM EST for maximum visibility

---

## How to Find Threads

1. Open target subreddit
2. Sort by **Rising** (not Hot, not New — Rising = posts that passed spam filter with 10-20 upvotes, growing)
3. Find a post matching your topic expertise
4. Write a helpful comment (50-150 words)
5. End with a question to invite reply (engagement signal)

**Pro tip:** Being in the first 5-10 comments on a Rising post gives 10x more visibility than comment #50 on a Hot post.

---

## Week 1: Easy Comments (Days 1-7) — Target: 50-80 karma

| Day | Subreddit | Topic | What to do |
|---|---|---|---|
| **1** | r/ClaudeAI | MCP setup help | Find "MCP not connecting" thread. Share config path tips (macOS vs Windows), explain full restart requirement. Use Template 1. |
| **2** | r/LocalLLaMA | Embedding models | Find "which embedding model" thread. Share Gemini Embedding 2 / Qwen3 / Jina v5 comparison with benchmark numbers. Use Template 3. |
| **3** | r/node or r/webdev | Bun vs Node | Find runtime comparison thread. Share production experience — 2.4x faster HTTP, native TS. Use Template 6. |
| **4** | r/ClaudeAI | Context management | Find "how to give Claude more context" thread. Explain three tiers: Projects, custom GPTs, RAG. Use Template 8. |
| **5** | r/PostgreSQL | pgvector | Find vector database thread. Share pgvectorscale benchmarks (471 QPS, 11.4x vs Qdrant). Use Template 4. |
| **6** | r/ClaudeAI | Best MCP servers | Find "what MCP servers do you use" thread. Recommend starting with 3-5 (context budget), share curated list. |
| **7** | r/RAG | RAG debugging | Find "my RAG gives bad answers" thread. Share 90% retrieval problem diagnosis. Use Template 2. |

**Rules:** 2-3 comments per day. Each 50-150 words. No product. No links. Just expertise.

---

## Week 2: Deeper Technical (Days 8-14) — Target: +80-150 karma

| Day | Subreddit | Topic | What to do |
|---|---|---|---|
| **8** | r/RAG + r/LangChain | Chunking + hybrid search | Detailed comment on chunking strategy (512 tokens recursive = 69% accuracy baseline). Recommend hybrid search as #1 improvement. Use Template 5 + 9. |
| **9** | r/ClaudeAI | MCP vs API | Explain trade-offs — USB analogy. M×N integration problem. When MCP makes sense, when API is better. |
| **10** | r/selfhosted | Hetzner + Postgres | Architecture advice: $60/month vs $800 AWS. Docker Compose + Caddy. Use Template 7. |
| **11** | r/RAG + r/LocalLLaMA | Hallucination + context vs RAG | Explain RAG reduces hallucinations 60-80% but doesn't eliminate. Long context = deep analysis, RAG = search across many docs. Use Template 8. |
| **12** | r/ClaudeAI + r/webdev | Build first MCP server | Help someone build MCP server in TypeScript. Share minimal example — McpServer, StdioTransport, tool definition. |
| **13** | r/RAG + r/MachineLearning | pgvector HNSW + RAG eval | Share tuning tips (m=16, ef_construction=64, shared_buffers). Explain hit rate / precision / faithfulness metrics. |
| **14** | r/LocalLLaMA | PDF parsing | Share "OCR + image" approach. Recommend LlamaParse (complex) vs PyMuPDF4LLM (standard). Use Template 10. |

**Rules:** 2 detailed comments per day. 100-200 words. Include specific numbers/benchmarks. Still no product.

---

## Week 3: First Posts + Comments (Days 15-21) — Target: +70-120 karma

| Day | Subreddit | Type | Content |
|---|---|---|---|
| **15** | r/RAG | **POST** | **"Lessons from building a production RAG pipeline — what I wish I knew"** — Share 5 lessons (chunking matters more than LLM choice, hybrid search is the #1 win, evaluate retrieval not generation, test with YOUR queries, pgvector beats dedicated vector DBs for <5M vectors). Ask "what's your experience?" |
| **16** | r/ClaudeAI | Comment | Continue answering MCP troubleshooting. Web vs local mode confusion (T-11). |
| **17** | r/LocalLLaMA | **POST** | **"pgvector vs dedicated vector databases in 2026 — anyone else going Postgres-only?"** — Share benchmarks, cost comparison, ask community. |
| **18** | r/webdev | Comment | Runtime/framework comparison. SolidJS 2-3x faster rendering, 6x smaller bundle. Bun + Hono production experience. |
| **19** | r/ClaudeAI | **POST** | **"What MCP servers do you actually use daily? Mine are..."** — Share personal setup (3-5 servers), explain context token budget issue. Invite discussion. |
| **20** | r/RAG | Comment | Framework choice (LangChain vs LlamaIndex vs direct implementation). Contrarian take: direct is 100 lines and easier to debug. |
| **21** | r/selfhosted | **POST** | **"My $60/month self-hosted stack for AI workloads (Hetzner + Docker + Postgres)"** — Architecture, cost breakdown, monitoring. Invite feedback. |

**Post format:** Discussion starters (Smetnyov format #5). Share experience, ask open questions. 1500-3000 chars (~250-500 words). No TL;DR needed for this length. Bold key phrases for scannability.

---

## Comment Templates (Ready to Adapt)

### Template 1: MCP Server Setup Help
```
I ran into this exact issue. Three things to check:

1. **Config path** — On Windows, Claude Desktop changed locations recently. Check both %APPDATA%\Claude\ and %LOCALAPPDATA%\Packages\Claude_\LocalCache\ for your config.

2. **Transport mismatch** — Claude Desktop uses stdio, Claude Code supports both stdio and HTTP. If your server is HTTP, you can't connect via stdio.

3. **Full restart required** — After saving config, completely quit Claude Desktop (not just close window) and restart. It only reads config at startup.

Check server logs at mcp-server-SERVERNAME.log if none of that helps.

What does your config look like? Happy to take a look.
```

### Template 2: RAG Quality Debugging
```
In my experience, 90% of RAG quality issues are retrieval problems, not LLM problems.

1. **Log retrieved chunks** before they hit the LLM. Are the right chunks coming back?

2. **Check chunking** — open a few chunks and read them. Complete thoughts, or cut in half?

3. **Try hybrid search** — pure vector misses exact keywords (product names, error codes). Adding BM25 alongside semantic search is often the single biggest quality win.

4. **Evaluate your embedding model** — is it appropriate for your content domain?

What's your current pipeline look like?
```

### Template 3: Embedding Model Recommendation
```
Current landscape (April 2026):

**All-rounder:** Gemini Embedding 2 — 5 modalities, 100+ languages, native Matryoshka.

**Best open-source:** Qwen3-Embedding-8B — #1 on MTEB Multilingual, Apache 2.0.

**Budget API:** OpenAI text-embedding-3-large at $0.13/M tokens.

**Best quality-to-size:** Jina v5-text-small.

Pro tip: use Matryoshka to reduce dims (512 instead of 1536). Cuts storage 3x with ~2-3% quality loss. Jina and OpenAI v3 support this natively.

What type of content are you embedding?
```

### Template 4: pgvector vs Alternatives
```
If you already run Postgres: pgvector, without hesitation.

Numbers: with pgvectorscale, Postgres hits 471 QPS at 99% recall on 50M vectors. 11.4x better than Qdrant in the same benchmark.

**When to consider alternatives:**
- Sub-10ms at 100M+ vectors → Qdrant or Pinecone
- Knowledge graph + vectors → Weaviate
- Zero-ops → Pinecone (most expensive, highest lock-in)

The 2026 trend: extended relational DBs winning over dedicated vector DBs. One database, one sync layer, fewer failure modes.

HNSW tuning: m=16, ef_construction=64, make sure index fits in shared_buffers.
```

### Template 5: Chunking Strategy
```
Start simple, optimize based on data:

**Default (70% of use cases):** Recursive character splitting, 512 tokens, 50-100 overlap. Benchmark: 69% accuracy, beats expensive alternatives as baseline.

**Structured docs (legal, technical):** Adaptive chunking aligned to section boundaries. 87% accuracy vs 13% for fixed-size in clinical studies.

**Watch out for semantic chunking** — 91.9% recall but 54% end-to-end accuracy. Chunks too small (43 avg tokens).

**2026 unlock:** Proposition chunking (each chunk = one complete idea) and late chunking (embed full doc first, then split).

What type of documents?
```

*Templates 6-10 available in `docs/research/contexter-gtm-deep-warmup-topics.md` (Part C).*

---

## Success Signals

- Comment upvotes consistently ≥5 → you're providing value
- DMs asking for advice → community recognizes you as expert
- Someone links your comment in another thread → organic amplification
- Karma growing 10-15/day → on track for 200+ in 3 weeks
- First "what tools do you use?" question → Phase 2 transition signal
