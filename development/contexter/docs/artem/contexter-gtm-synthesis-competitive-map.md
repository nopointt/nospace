# Contexter — Competitive Map: Non-Technical User Lens
> Analyst: Lead/MarketAnalysis
> Date: 2026-03-27
> Purpose: Positioning synthesis for non-technical ICP (analysts, researchers, PMs, marketers, founders, consultants)
> Source research: 7 deep-dive files (direct competitors, indirect, PKM, non-tech pain, Ragie, Supermemory, Langbase)

---

## Section 1 — Non-Technical User Journey Map

### The Current Reality: How a Non-Tech Person Tries to Make AI Know Their Documents

This is the actual lived experience of an analyst, PM, researcher, or consultant in 2026, reconstructed from real user quotes collected across OpenAI Community Forum, Reddit, Cursor Forum, and developer blogs.

---

#### Step 1: Discovery (first encounter with the problem)

The user starts a new ChatGPT chat. They paste a PDF they've uploaded before, or re-explain a project that the AI "should already know." The moment of recognition: "Wait, I did this last week. Why doesn't it remember?"

They search "how to make ChatGPT remember my documents." They find Custom Instructions. They spend 20 minutes writing a 1,500-character summary of their work context. They feel clever.

**Emotional state:** Mild frustration, but optimistic. "I found a workaround."

---

#### Step 2: The Upload-Every-Time Ritual

For documents specifically, the user develops a ritual:
1. Open ChatGPT (or Claude, or Gemini)
2. Re-upload the PDF / paste the text
3. Start the conversation over from scratch
4. Get a useful answer
5. Close the tab

The next day: repeat from Step 1.

For users with multiple AI tools, the ritual multiplies. The same research report gets uploaded to ChatGPT for one task, then to Claude for another. The same contract PDF goes into both.

**Emotional state:** Resignation. "That's just how it works."

**Key friction moments:**
- File limits: ChatGPT Plus allows ~80 uploads per 3-hour window; free users get 3/day
- Format failures: some PDFs don't parse correctly, audio files aren't accepted everywhere
- Context loss: long documents get truncated when they exceed context windows

---

#### Step 3: The Context Document Workaround

Power users eventually build a "context document" — a Google Doc, Notion page, or text file containing everything the AI needs to know. Before each important AI session, they copy-paste the relevant section.

User quote (from Reddit r/ChatGPT, paraphrased from community research):
> "The cruel irony is that the obvious solution — start a new chat — immediately destroys everything you built up, including all that onboarding, all those corrections, and all that shared context, leaving you back at square one."

Some users maintain multiple context documents — one per project, per client, per domain. They become context librarians for their own AI assistant.

**Emotional state:** High cognitive load. "This takes effort I shouldn't have to spend."

---

#### Step 4: The Walled Garden Discovery

The user discovers Claude Projects, or Custom GPTs, or NotebookLM. They're excited. They upload their documents once and they persist! The AI actually knows their stuff.

Then the reality sets in:
- Claude Projects only works in Claude. Switch to ChatGPT for a different task: start over.
- Custom GPTs have a 20-file hard cap. The research library doesn't fit.
- NotebookLM doesn't connect to anything else — it's a reading room, not a memory layer.

User quote (from Substack, March 2026, verbatim from research):
> "I want to try Claude, but I've been using ChatGPT for years. I have memories saved, projects set up, custom GPTs running. The idea of starting over feels exhausting."

User quote (from DEV.to, verbatim from research):
> "Using multiple AI tools feels like having a team of brilliant coworkers, who just refuse to talk to each other."

**Emotional state:** Trapped. Investment in one platform feels wasted the moment you try another.

---

#### Step 5: Accumulated Loss

For users who have been at this for 6-18 months, the emotional stakes become surprisingly high. They've built up months of context: preferences, project history, document libraries, style guidelines.

Then something breaks. ChatGPT's memory resets unexpectedly. A project's files disappear. A browser tab closes. Context is gone.

Real user quotes (verbatim, from OpenAI Community Forum, dates verified):

> "Two years worth of memories gone (Plus subscriber). Only an empty memories box." — nodehappy, Mar 2025

> "I spent a year building these memories with the AI, and now all my crucial data is lost." — tugsatbaris, Mar 2025

> "It feels like losing a beloved relative." — tugsatbaris, Mar 2025

> "8 months of chats, gone down the drain in one morning, and it's devastating" — benjamingalindo, Jul 2025

**Emotional state:** Grief. The language users reach for is not "technical failure" — it's loss of something personal.

---

#### Step 6: The Fragmentation Tax (daily, ongoing)

Even without catastrophic loss, the daily friction compounds. Every tool switch requires a context tax:
- Switching from ChatGPT to Claude: re-upload documents, re-explain project
- Starting a new chat in the same tool: re-introduce context if the conversation got too long
- Using Perplexity for research: cannot access personal documents at all
- Using Cursor for code: no knowledge of the business requirements explained in Claude

The fragmentation tax is invisible to any single AI provider, but visible to the user who lives across multiple tools.

**Emotional state:** Chronic, low-level exhaustion. "I'm the memory for all my AI tools."

---

### Where the Journey Breaks: Failure Points Summary

| Stage | Failure Mode | Emotional Impact |
|---|---|---|
| Session ends | All uploaded files vanish | Annoyance → resignation |
| New conversation | Full context must be re-introduced | Time waste |
| Switch to different AI | Everything starts from zero | Frustration → avoidance |
| Context document workaround | Manual maintenance burden, easy to forget | Cognitive overload |
| Walled garden (Claude Projects, Custom GPT) | Only works in one tool | Trapped |
| Memory reset (OpenAI, Claude) | Months of accumulated context destroyed | Grief |
| Long documents | Truncated, partial results, silent failures | Loss of trust in AI |

---

### What Non-Technical Users Actually Want (Their Own Words)

From research (verbatim vocabulary analysis, Section 3 of non-tech pain research):

- "I wish AI just knew me already"
- "picks up where we left off"
- "doesn't need me to repeat myself"
- "one place to put everything so all my AIs can use it"
- "my AI assistant that knows everything about my work"

They do NOT say: "RAG," "embeddings," "context window," "vector store," "chunks." They say: "remember," "knows me," "start from scratch," "my stuff."

---

## Section 2 — Competitive Comparison Matrix (Non-Tech Lens)

Data sources: direct competitor research (2026-03-27), indirect competitor research (2026-03-27), PKM research (2026-03-27). All data verified at time of collection; market data has ~6-month shelf life.

Legend:
- YES = fully supported
- NO = not available
- PARTIAL = works but with significant limitations
- N/A = not applicable

---

| Solution | Persistent? | All LLMs? | Non-tech friendly? | Any format? | Any size? | Free tier? |
|---|---|---|---|---|---|---|
| **ChatGPT file upload** | NO — files vanish after session | NO — ChatGPT only | YES — zero setup, drag and drop | PARTIAL — PDF, images, DOCX; no audio/video on free | PARTIAL — 512MB/file, 2M tokens/file; ~80 files/3hr window on Plus | YES — 3 uploads/day on free |
| **Claude Projects** | YES — persists across conversations | NO — Claude only; Anthropic crackdown Jan 2026 blocked external OAuth | YES — no setup, upload in UI | PARTIAL — PDF, DOCX, images; no audio/video processing | PARTIAL — context window limits apply; large knowledge bases trigger RAG mode | YES — Pro $20/mo required for full Projects |
| **NotebookLM** | YES — sources persist in notebooks | NO — Gemini models only; no external API | YES — best non-tech UX in class; source citation built in | PARTIAL — PDF, DOCX, URLs, YouTube; no general audio/video beyond YouTube | PARTIAL — 50 sources/notebook; each source has size limits | YES — free tier available; Plus via Google Workspace $14/user/mo |
| **Custom GPTs** | YES — knowledge base persists | NO — ChatGPT only | YES — no-code setup; shareable | PARTIAL — major document formats; no audio/video transcription | NO — hard cap of 20 files, 512MB each | YES — ChatGPT Plus required ($20/mo) |
| **Supermemory** | YES — persistent cross-session | YES — works with Claude, ChatGPT, Gemini, Cursor via MCP | NO — developer-first; requires API key setup; no UX for non-tech | YES — PDFs, web pages, images (OCR), audio, video, connectors | YES — unlimited storage all tiers | YES — free: 1M tokens, 10K queries/mo |
| **Mem.ai** | YES — notes persist | NO — chat is within Mem's own AI; API exists but not for end-user LLM routing | YES — note-taking UX; easy capture | PARTIAL — voice memos transcribed; no PDF/video confirmed | PARTIAL — storage limits by plan | YES — free: 25 notes, 25 chat/mo; Pro $12/mo |
| **Notion AI** | YES — workspace persists | NO — Notion AI uses GPT-5/Claude/Gemini but only within Notion | YES — for teams already in Notion; familiar UI | PARTIAL — text, images, file attachments; no audio/video processing | PARTIAL — Notion file size limits apply | YES — free tier exists; AI on Business $15/user/mo |
| **Copy-paste (manual)** | NO — must repeat every session | YES — works with every AI tool | YES — zero setup; everyone knows how | PARTIAL — only what you can fit in a text paste | NO — context window limits; large docs must be summarized first | YES — completely free |
| **Contexter** | YES — persistent across all sessions and tools | YES — any LLM via REST API or MCP (ChatGPT, Claude, Gemini, Perplexity, Cursor) | PARTIAL — currently developer-oriented setup; non-tech UX is the product opportunity | YES — 15 formats including PDF, DOCX, audio, video, images | YES — no arbitrary file count caps; infrastructure-bound | YES — self-hosted at €4.72/mo; no per-upload or per-query limits |

---

### Notes on Key Rows

**ChatGPT file upload:** The most-used "solution" by default. OpenAI redesigned paste behavior in early 2026 (auto-converting pastes >5,000 chars to attachments) specifically because this workflow is so dominant it was degrading UX. Its fundamental problem — no persistence — is architectural.

**Claude Projects:** Anthropic made a deliberate walled-garden move in January 2026, blocking OAuth tokens from working outside Claude Code CLI. The direction is toward lock-in, not portability. Best-in-class for Claude-only workflows.

**NotebookLM:** The closest thing to non-tech-friendly persistent context that exists today. Source grounding (every answer cites exactly where it came from) is genuinely excellent UX. Critical limitation: Gemini-only, no API, not programmable.

**Custom GPTs:** 20-file hard cap is a policy decision, not a technical constraint. OpenAI's business incentive is to keep users in ChatGPT.

**Supermemory:** Closest functional competitor to Contexter. Developer-first. Non-technical users have no path to use it without engineering help. $3M funded, 19.8K GitHub stars.

**Mem.ai:** Solves a different problem — note capture and personal knowledge organization, not document context for AI tools. Confused with Contexter in some comparison queries but architecturally distinct.

**Notion AI:** For teams living in Notion, this is the path of least resistance. Official MCP server exists. Critical gap: only knows Notion pages, not arbitrary documents you upload.

**Copy-paste:** The real incumbent. Dominant behavior for ~95% of knowledge workers using AI today. Contexter's primary conversion story is from this behavior, not from displacing another SaaS product.

---

## Section 3 — Positioning Maps (2x2)

### Matrix A: AI Portability vs. User Accessibility

**X-axis:** Locked to one AI (left) ↔ Works with all AI (right)
**Y-axis:** Requires technical setup (bottom) ↔ Non-tech friendly (top)

```
NON-TECH FRIENDLY
        |
NotebookLM          Contexter (target position)
Mem.ai              [no one occupies this yet]
        |
Claude      Copy-
Projects    paste
Custom GPTs  ....
        |
ChatGPT     Supermemory
file upload  Langbase
             Ragie
        |
REQUIRES TECH SETUP
        |
LOCKED TO ONE AI ----+---- WORKS WITH ALL AI
```

**Plotted positions:**

| Solution | X position | Y position |
|---|---|---|
| ChatGPT file upload | Far left (ChatGPT only) | Upper-middle (easy to use) |
| Claude Projects | Left (Claude only) | Upper-middle (easy for Claude users) |
| NotebookLM | Left (Gemini only) | Upper (best non-tech UX) |
| Custom GPTs | Left (ChatGPT only) | Upper-middle |
| Mem.ai | Left-center (Mem's own AI) | Upper (note-taking UX) |
| Notion AI | Left-center (Notion ecosystem) | Upper (familiar workspace) |
| Copy-paste | Right (all tools manually) | Upper (everyone can do it) |
| Supermemory | Right (all LLMs via API/MCP) | Lower (developer-only setup) |
| Ragie | Right (model-agnostic API) | Lower (developer-only) |
| Langbase | Right (100+ LLMs via API) | Lower (developer-only) |
| **Contexter** | **Far right (all LLMs)** | **Upper-right (target: non-tech)** |

**WHITE SPACE Contexter Occupies:**
The upper-right quadrant — works with all AI AND accessible to non-technical users — is empty. Every current solution forces a choice: either easy (but locked to one AI) or universal (but technical). Contexter is the only product positioned, or attempting to position, in this white space.

This is not an accident of market structure. The walled-garden players (OpenAI, Anthropic, Google) have business incentive to stay in the upper-left. The developer infrastructure players (Supermemory, Ragie, Langbase) serve developers first and have no stated roadmap for non-tech UX. The white space is structurally available.

---

### Matrix B: Format Breadth vs. Memory Persistence

**X-axis:** Text only (left) ↔ Any format — audio, video, images (right)
**Y-axis:** Per-session only (bottom) ↔ Persistent across sessions and tools (top)

```
PERSISTENT ACROSS SESSIONS & TOOLS
        |
        |   Claude Projects     Supermemory
        |   Custom GPTs         Ragie
        |   NotebookLM          Contexter
        |   Notion AI
        |
        |
        |   ChatGPT file upload (audio limited)
        |   Mem.ai (text/voice only)
        |
PER SESSION ONLY
        |
TEXT ONLY ----+---- ANY FORMAT (audio, video, images)
```

**Plotted positions:**

| Solution | X position | Y position |
|---|---|---|
| ChatGPT file upload | Center (PDF/doc but limited audio) | Bottom (per-session) |
| Claude Projects | Left-center (text/PDF/image) | Upper (persistent) |
| Custom GPTs | Center (major formats) | Upper (persistent) |
| NotebookLM | Center-left (text/PDF/YouTube) | Upper (persistent) |
| Mem.ai | Left (text/voice) | Upper (persistent) |
| Notion AI | Center-left (text/files) | Upper (persistent) |
| Supermemory | Right (PDF/audio/video/web/connectors) | Upper (persistent) |
| Ragie | Right (17 audio/video formats + docs) | Upper (persistent) |
| **Contexter** | **Right (15 formats: PDF/audio/video/images)** | **Upper (persistent)** |
| Copy-paste | Far left (text only) | Bottom (manual each time) |

**WHITE SPACE Contexter Occupies:**
In Matrix B, Contexter clusters with Supermemory and Ragie in the upper-right. The differentiation here is not about white space but about the non-tech access layer (see Matrix A). The upper-right quadrant has technical players but no consumer-accessible product. Contexter's opportunity is to occupy "any format + persistent + non-tech" — a position no one holds.

**Key insight from both matrices combined:**
When you overlay the two matrices, Contexter's unique position becomes the intersection of:
- Works with all AI (Matrix A, right side)
- Non-tech friendly (Matrix A, top)
- Any format (Matrix B, right)
- Persistent (Matrix B, top)

No other product is in all four quadrants simultaneously. This is the structural white space.

---

## Section 4 — "Why Not Just..." Objection Handling

These are the real objections a non-technical PM, analyst, or consultant will raise. Each counter is grounded in research, not marketing.

---

### "Why not just upload files to ChatGPT?"

**The objection:** It's already in my workflow. Free. Zero setup. Just drag and drop.

**The reality:**
Every file you upload disappears when the conversation ends. The next day you start from zero — same document, same re-upload, same re-introduction. If you use multiple AI tools (ChatGPT for one task, Claude for another), you upload the same file to both. Separately. Every time.

For occasional use (one document, one question, done), ChatGPT upload is fine. But if you work with the same materials over time, or across multiple AI tools, the upload ritual becomes a tax on every work session.

The moment you want to ask Claude about a document you already gave ChatGPT, you are paying the tax twice.

**One-sentence counter:** ChatGPT file upload is perfect for one question about one document — but your knowledge doesn't live there between conversations, and it certainly doesn't travel to Claude or Perplexity.

---

### "Why not use Claude Projects?"

**The objection:** I use Claude a lot. Projects let me upload documents once and they persist. That's exactly what I need.

**The reality:**
Claude Projects work perfectly — inside Claude. The moment you open ChatGPT, Perplexity, Gemini, or any other tool, your Projects context is gone. You've built a personal knowledge base that one company controls.

In January 2026, Anthropic explicitly tightened their walled garden (blocked OAuth access from outside Claude Code CLI). The direction of travel is toward more lock-in, not less. Your accumulated context — documents, conversation history, project knowledge — belongs to Anthropic's ecosystem.

If Claude disappears, changes pricing, or you want to try a better model for a specific task, you rebuild from scratch.

**One-sentence counter:** Claude Projects solve the memory problem perfectly — until you need to use any other AI tool, at which point you're starting over.

---

### "Why not use NotebookLM?"

**The objection:** NotebookLM is made for exactly this — upload sources, ask questions, get cited answers. It's free and works well.

**The reality:**
NotebookLM is genuinely excellent at what it does: reading research, grounding answers in sources, creating Audio Overviews. For a self-contained research project with a defined document set, it's one of the best tools available.

Three hard limits:
1. Gemini-only. Every answer comes from Google's model. You cannot take your NotebookLM knowledge base and ask Claude or ChatGPT about it.
2. No API. If you want another application to access your notebook's content, it cannot. NotebookLM is a reading room, not a library with a checkout system.
3. 50 sources per notebook cap. A substantial document collection won't fit.

NotebookLM is the best non-technical solution for reading and analyzing a fixed set of documents within a single Google experience. It is not a universal memory layer.

**One-sentence counter:** NotebookLM is a brilliant reading tool — but your sources stay inside Google's walls and can't be accessed by ChatGPT, Claude, or Perplexity.

---

### "Why not just copy-paste?"

**The objection:** I know exactly what context is relevant. I paste it into the prompt. It's simple and it works.

**The reality:**
Copy-paste works. It has zero setup, zero cost, works with every AI tool, and gives you complete control over what the AI sees. For occasional, simple use, it is genuinely the right choice.

It breaks at scale and over time:
- You are the retrieval layer. You manually decide what's relevant and hunt for it.
- Large documents cannot fit. A 200-page report must be summarized before pasting, losing information in the process.
- Every conversation starts from zero — there is no accumulation of context.
- If you work with AI daily across multiple projects, you spend a significant portion of your time feeding context rather than receiving answers.

The user who does five AI sessions per week, each requiring 10 minutes of context-gathering, is spending ~3.5 hours per week on context logistics. That is a productivity tax that compounds.

**One-sentence counter:** Copy-paste is perfect for occasional use — but if you work with AI every day, you're spending hours each week re-teaching AI tools what they should already know.

---

### "Why not use Notion AI?"

**The objection:** My team lives in Notion. Notion AI knows all our pages and databases. We already have everything in one place.

**The reality:**
For teams fully committed to Notion, this is the strongest objection — and it is partially valid. Notion AI has genuinely gotten good. Notion 3.0 (September 2025) added autonomous AI Agents. There's an official MCP server that lets Claude Code and Cursor access your Notion workspace.

Three limits that matter:
1. Notion AI only knows what's in Notion. The PDF a client sent by email, the audio recording from last week's meeting, the competitor's annual report — if it's not a Notion page, Notion AI doesn't know it.
2. Notion AI is inaccessible outside Notion. There is no endpoint that returns "answer from your Notion workspace" to an external application. You cannot ask Perplexity to use your Notion knowledge.
3. Complex document formats are limited. Notion handles text-based pages well. It is not a deep processor of PDFs, audio files, or large video transcripts.

**One-sentence counter:** Notion AI is excellent for your Notion workspace — but the moment your knowledge lives anywhere else (email attachments, PDFs, audio recordings), Notion AI can't see it.

---

## Section 5 — One-Sentence Competitive Positioning

Three formulations targeting different conversation contexts:

---

**Formulation 1 — Against the walled garden (ChatGPT Projects, Claude Projects, NotebookLM):**

"Unlike Claude Projects or NotebookLM, Contexter stores your knowledge in a neutral layer accessible to every AI tool — ChatGPT, Claude, Gemini, Perplexity — so your documents follow you wherever you work, not where one company decides you should stay."

---

**Formulation 2 — Against the copy-paste ritual:**

"Unlike manually re-uploading your documents to every AI chat, Contexter remembers everything once — any format, any size — so every AI you use already knows your work the moment you open a new conversation."

---

**Formulation 3 — Against developer-only solutions (Supermemory, Ragie):**

"Unlike Supermemory or Ragie, which require API keys and developer setup, Contexter gives non-technical professionals — analysts, researchers, PMs, consultants — a single memory layer their AI tools can actually use without involving an engineer."

---

## Synthesis: The Structural White Space

Every research finding across all seven source files points to the same conclusion.

The market in 2026 has:
- Easy solutions that lock you to one AI (Claude Projects, Custom GPTs, NotebookLM)
- Universal solutions that require technical setup (Supermemory, Ragie, Langbase)
- No solution that is both universal AND accessible to non-technical users

The non-technical user's pain is documented, real, and emotionally charged. Users describe memory loss in grief language. They describe re-uploading as exhausting. They describe tool-switching as isolation between AI tools that "refuse to talk to each other."

Both Anthropic (Claude memory import, March 2026) and Google (Gemini import tool, March 26, 2026) independently shipped memory transfer tools in the same two-week window — direct market validation that this pain is activating into purchasing behavior now.

The positioning "One memory. Every AI." maps to the vocabulary users actually use ("memory," "every AI") and names the exact problem (singular vs. fragmented). No current product owns this position with non-technical users.

Contexter's strategic path: occupy the upper-right of Matrix A (universal + non-tech accessible) before any well-funded player decides to move there. The walled-garden players (OpenAI, Anthropic, Google) have structural incentives preventing them from moving right on the X-axis. The developer infrastructure players (Supermemory, Ragie, Langbase) are oriented toward developers and have no non-tech roadmap visible. The window is open.

---

## Appendix: Sources and Research Basis

This document synthesizes findings from seven research files:

| File | Content |
|---|---|
| `contexter-gtm-v2-direct-competitors.md` | Top 5 direct competitors (Ragie, Graphlit, Morphik, Vectorize, Langbase Memory), competitive matrix, DIY RAG as non-product competitor |
| `contexter-gtm-v2-indirect-competitors.md` | 15 indirect competitors across 9 categories (per-session, walled garden, PKM, enterprise knowledge, AI memory, MCP servers, vector DB, no-code RAG, manual) |
| `contexter-gtm-v2-second-brain.md` | 10 PKM products + Supermemory bonus finding; API/MCP status; convergence assessment |
| `contexter-gtm-v2-nontechnical-pain.md` | 17 verbatim user quotes; 6 workaround patterns; vocabulary analysis; 5 landing page teardowns for non-tech language patterns |
| `contexter-gtm-competitor-ragie.md` | Deep dive: Ragie positioning, pricing ($100-$500/mo), ICP, feature matrix, user sentiment |
| `contexter-gtm-competitor-supermemory.md` | Deep dive: Supermemory positioning, $3M funding, feature matrix, love/hate/want analysis, switching triggers |
| `contexter-gtm-competitor-langbase.md` | Deep dive: Langbase Memory positioning, storage-based pricing ($100-$250/mo + 5-50 MB caps), format limitations, audience voice |

All pricing data as of 2026-03-27. Competitive intelligence has a shelf-life of approximately 6 months.

---

*Research by Lead/MarketAnalysis | Operator: chief-research (Eidolon) | 2026-03-27*
