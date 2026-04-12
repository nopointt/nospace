# Reddit Launch Post Drafts — CTX-13 Phase 3-4

> Ready-to-adapt drafts per subreddit. Based on R2 research (32 real examples, pattern analysis).
> Rules: 1500-3000 chars. "I built [thing] that [result]" title formula. No emoji. No marketing. No links in body.
> Product link goes in FIRST COMMENT only, not in post body.
> nopoint adapts tone/details before posting. These are starting points, not copy-paste.

---

## Draft 1: r/SideProject (Phase 3)

**Title:** I built a RAG-as-a-service so my AI agents stop forgetting everything between sessions

**Body:**

I've been building AI-powered workflows for the past year, and the biggest pain wasn't the models — it was context loss.

Every new conversation, Claude or ChatGPT starts from zero. I'd re-explain my project, re-upload my docs, re-describe my preferences. It's like onboarding a new intern every morning.

So I built Contexter — upload any file (PDF, audio, video, 308+ text formats), and it creates a knowledge API with an MCP endpoint. Connect it to Claude, ChatGPT, Perplexity, or Cursor, and your AI has persistent access to your documents without cramming them into the context window.

**How it works under the hood:**
- Hierarchical + semantic chunking (not fixed-size)
- Jina v4 embeddings (512 dims, Matryoshka)
- Hybrid search (pgvector HNSW + tsvector BM25)
- MCP endpoint via Streamable HTTP

**Stack:** Bun + Hono, PostgreSQL + pgvector, Redis + BullMQ, Hetzner CAX21 ($8/month). Total infra: under $15/month.

**Current state:** Working product, 308 text formats, 2 real users (just me and a friend, honestly). Free tier is 1GB. Looking for feedback from builders who deal with the same context problem.

What's your approach to giving AI tools persistent knowledge? Curious what others are doing.

---

## Draft 2: r/AlphaandBetaUsers (Phase 3)

**Title:** Looking for beta testers: upload any file, get a RAG-powered knowledge API with MCP for Claude/ChatGPT

**Body:**

Hi! I'm building Contexter — a RAG-as-a-service that lets you upload documents and instantly get a knowledge API your AI tools can query.

**What it does:**
- Upload any text-based file (PDF, DOCX, MD, HTML, audio transcription — 308 formats)
- Automatically chunks, embeds, and indexes the content
- Gives you an MCP endpoint that works with Claude Desktop, VS Code, Cursor, ChatGPT
- Semantic + keyword hybrid search so your AI finds the right context

**What I'm looking for:**
- People who use Claude, ChatGPT, or Cursor daily and are frustrated with context loss
- Honest feedback on the upload → query flow
- Edge cases I haven't thought of

**What stage it's at:**
- Working product at contexter.cc
- Free tier (1GB, no credit card)
- Just me building this, no team yet

Drop a comment or DM if interested. Happy to walk you through the setup.

---

## Draft 3: r/indiehackers (Phase 3)

**Title:** Solo founder, 240 coding sessions, $300 invested — here's my AI knowledge base product

**Body:**

I've been building Contexter for the past few months. 240 sessions with Claude Code as my only "team member." Total invested: $300 (server + domains + services).

**The problem I'm solving:**
Every AI tool has a memory problem. ChatGPT forgets your documents. Claude's context fills up after ~13 files. NotebookLM has no API. Everyone caps at 50 sources.

**My approach:**
Upload any file → RAG pipeline (parse, chunk, embed, index) → MCP endpoint that any AI client can query. Your Claude or ChatGPT gets persistent access to your docs without context window bloat.

**Numbers (honest):**
- Revenue: $0 (just launched supporters program)
- Users: 2 (both test accounts)
- Formats supported: 308 text-based
- Infra cost: ~$15/month (Hetzner + Cloudflare)
- Sessions to build: 240 with Claude Code

**Tech stack:** Bun, Hono, PostgreSQL + pgvector, Redis, Jina v4 embeddings, Cloudflare Pages + R2.

**What's next:** Trying to get first 100 users. All organic — $0 marketing budget.

Would love to hear: how are you solving the AI context/memory problem in your workflows?

---

## Draft 4: r/mcp (Phase 4)

**Title:** I built an MCP server that turns any uploaded document into a searchable knowledge base for Claude

**Body:**

After using Claude Code for hundreds of sessions, I kept hitting the same wall: context window fills up, compact throws away important stuff, new dialog means re-explaining everything.

So I built an MCP server that solves this differently. Instead of cramming documents into the context window, you upload them once and the server handles retrieval.

**What it does:**
- Upload any text document (PDF, DOCX, MD, HTML, CSV, JSON — 308 formats)
- Hierarchical chunking with semantic boundaries
- Jina v4 embeddings (512-dim Matryoshka) + pgvector HNSW indexing
- Hybrid search: semantic (cosine) + keyword (BM25 via tsvector)
- 12 MCP tools: search_knowledge, upload_document, list_documents, summarize, and more

**MCP config:**
```json
{
  "mcpServers": {
    "contexter": {
      "url": "https://api.contexter.cc/sse?token=YOUR_TOKEN"
    }
  }
}
```

**Architecture:** Bun + Hono backend, PostgreSQL 16 + pgvector 0.8.2, Redis 7 + BullMQ for async processing, Caddy reverse proxy, Hetzner CAX21.

Happy to answer questions about the chunking strategy, embedding choice, or MCP implementation details.

---

## Draft 5: r/RAG (Phase 4)

**Title:** I built a hosted RAG-as-a-service — here's the architecture and what I learned about chunking

**Body:**

I've been building a hosted RAG product (Contexter) for a few months. Want to share the architecture decisions and what actually moved the needle on retrieval quality.

**Pipeline:**
Upload → content filter (22 regex patterns) → parse (Docling for complex PDFs, TextParser for everything else) → chunk (hierarchical + semantic boundary detection, auto-merge at 0.4 similarity) → contextual prefix via Groq 8B → dedup check (0.98 cosine threshold) → embed (Jina v4, 512 dims MRL) → index (pgvector HNSW + tsvector GIN)

**What actually improved quality (ranked by impact):**

1. **Hybrid search** was the #1 win. BM25 + semantic with convex fusion (α=0.5). Pure vector missed exact terms. Added ~25% to end-to-end accuracy.

2. **Contextual prefixes** — before embedding, Groq 8B adds a 1-sentence context prefix to each chunk ("This chunk is from section X about Y"). Huge improvement for ambiguous chunks.

3. **Hierarchical chunking** — respecting document structure (headings, sections) instead of fixed-size splitting. Tables kept as atomic units.

4. **Reranking** — Jina cross-encoder as a second pass. Expensive but worth it for top-3 precision.

**What didn't help much:**
- Increasing embedding dimensions beyond 512 (Matryoshka FTW)
- Fancy overlap strategies (diminishing returns past 50 tokens)
- Multiple embedding models (one good model > two mediocre)

**Stack:** PostgreSQL + pgvector (yes, not a dedicated vector DB — it handles our scale fine), Bun, Hono, Redis + BullMQ.

Interested in hearing: what's working in your RAG pipelines? Especially curious about people's experience with late chunking or proposition chunking.

---

## Draft 6: r/ClaudeAI (Phase 4)

**Title:** I tested 5 ways to give Claude access to my documents — here's what actually worked

**Body:**

I've been using Claude Code for 240+ sessions and tried everything to solve the "Claude forgets my docs" problem. Here's what I tested, ranked by actual usefulness:

**1. Claude Projects (built-in)**
- Good for ≤10 docs. Fills context fast. At ~13 files, silently switches to RAG mode (documented bug). 200K tokens = about an hour of deep work before quality degrades.

**2. Manual re-upload each session**
- Works but tedious. Eats context budget. Not sustainable for 50+ documents.

**3. CLAUDE.md + memory files**
- Great for project config and conventions. Not designed for large knowledge bases. Gets compacted away during long sessions.

**4. Local RAG (self-built)**
- Spent 2 weeks building with LangChain. Quality was mediocre until I fixed chunking. Maintenance overhead killed it for me.

**5. Hosted RAG with MCP endpoint**
- This is what I ended up building (Contexter). Upload files once, Claude queries via MCP when needed. No context window bloat. Retrieves only relevant chunks per question.

**The difference:** Instead of stuffing everything into the context window and hoping Claude finds it, MCP-based retrieval gives Claude exactly the relevant pieces when it asks for them. Like the difference between reading every book in the library vs asking the librarian for the specific chapter you need.

For anyone dealing with the same problem — what's your current setup? Curious how others are managing documents across sessions.

---

## First Comment Template (post immediately after your post)

```
Hey everyone, OP here. A few quick notes:

- [Product] is at [URL] — free tier, no credit card needed
- Happy to answer any technical questions about the architecture
- If something doesn't work, DM me directly — actively fixing issues
- Source code: [GitHub URL if applicable]

Built this because I kept losing context across Claude sessions. If you're dealing with the same problem, I'd genuinely love to hear how you're handling it.
```

Adapt per subreddit. r/mcp can be more technical. r/SideProject can be more casual. r/RAG should focus on pipeline details.

---

## Anti-Pattern Checklist (verify before posting)

- [ ] No emoji in title
- [ ] No "revolutionary", "game-changer", "best", "amazing"
- [ ] No link in post body (link goes in first comment only)
- [ ] Title has specific detail (number, problem, or result)
- [ ] Post is 1500-3000 chars
- [ ] Ends with open question (invites comments)
- [ ] Honest about stage (early, 2 users, $0 revenue)
- [ ] Technical details included (not vague promises)
- [ ] Different angle from other subreddit posts (no cross-posting)
- [ ] Posted 9-11 AM Eastern, Tuesday-Thursday
