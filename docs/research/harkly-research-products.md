# Harkly Research — Product Landscape
> Date: 2026-03-19

## Direct Competitors (closest to Harkly's full proposition)

### 1. Dovetail (dovetail.com)
- UX research repository. AI theme detection, call recording, video clips. "Ask Dovetail" chat.
- Pricing: Free to ~$1,800/month. Enterprise: custom.
- API: Enterprise only. MCP: No. Audio/Video: Yes. Schema inference: No.
- Gap vs Harkly: Research-team vertical only, no CSV/docs, no schema, no MCP, no personal tier.

### 2. HeyMarvin (heymarvin.com)
- AI-native customer insights. 30+ integrations. "Ask AI" with citations. Auto PII redaction.
- Pricing: Free (5 files/mo), Standard/Enterprise: custom (5-user minimum).
- API: Yes. MCP: Yes (Marvin MCP Connector). Audio/Video: Yes.
- Gap vs Harkly: Minimum 5 users, no individual plan, no CSV/document upload, no schema inference, no spatial canvas.

### 3. Looppanel (looppanel.com)
- UX research transcription and analysis. Smart search across calls.
- Pricing: ~$4,200/year for 5 users minimum.
- API: No. MCP: No. Audio/Video: Yes.
- Gap vs Harkly: Team-only, no doc/CSV ingestion, no schema, no API/MCP.

### 4. Insight7 (insight7.io)
- Conversational intelligence. Sales/CX/research/coaching analytics.
- Pricing: Free, $83/month Pro, $250/month Business, Enterprise custom.
- API: Enterprise only. MCP: No. Audio/Video: Yes.
- Gap vs Harkly: Calls/transcripts only, no schema, no MCP, no personal use.

### 5. Khoj (khoj.dev)
- Open-source personal AI second brain. Self-hostable. Multi-LLM.
- Pricing: Free (open source), cloud tier TBD.
- API: Yes. MCP: Yes. Audio/Video: Partial (voice I/O, not bulk ingestion).
- Gap vs Harkly: No schema inference, no structured DB output, no spatial canvas, technical setup required.

### 6. NotebookLM (notebooklm.google.com)
- Google's AI research assistant. Up to 50 sources. Audio Overview generation.
- Pricing: Free; Plus ~$20/month.
- API: No. MCP: No. Audio/Video: YouTube + audio file upload.
- Gap vs Harkly: No structured DB, no API/MCP, no CSV, no schema inference, no spatial canvas.

### 7. Perplexity Spaces (perplexity.ai)
- AI search + internal knowledge base. PDF, Word, Excel, PowerPoint, CSV upload.
- Pricing: Pro $20/month (50 files/Space); Enterprise Max: custom.
- API: Yes (separate from Spaces). MCP: No. Audio/Video: No.
- Gap vs Harkly: No structured DB, no schema inference, no MCP for Spaces, no audio/video.

### 8. SecondBrain.io (second-brain.io)
- Personal AI KB via Slack/Discord/Telegram. Auto-classifies. Supermemory API. Native MCP.
- Pricing: Free (100 captures/mo), Pro $15/month (MCP + 10K memories), Team $12/user/month.
- API: Yes. MCP: Yes (native). Audio/Video: No.
- Gap vs Harkly: Text capture only, no file upload, no audio/video, no schema inference, no structured DB, no spatial canvas.

---

## Adjacent Products (partial overlap)

| Product | Key overlap with Harkly | Key gap |
|---|---|---|
| Unstructured.io | 64 file types incl. audio/video; API-first ETL | Developer only, no schema proposal, no MCP consumer, no UI |
| LlamaExtract (LlamaIndex) | Schema extraction from documents, $0.003/page | Developer API, user defines schema, no audio/video |
| Dust.tt | MCP, enterprise KB, developer API | No file ingestion pipeline, no audio/video, no schema |
| Guru | MCP Server (2025), enterprise search | $250/month min, no audio/video, integration-based |
| Glean | 100+ integrations, enterprise search | $50K+/year, no audio/video, no schema inference |
| ATLAS.ti | Audio + video + AI analysis natively | Academic qualitative coding, no API/MCP, no structured DB |
| Elicit | Structured extraction from research papers | Papers only, no audio/video, no MCP, no personal pipeline |
| Otter.ai | Audio-first, searchable meeting archive | Meeting-only, no schema, no MCP, no doc/CSV |
| Fireflies.ai | "AskFred" cross-meeting query, CRM extraction | Meeting-only, no schema, no MCP, no doc/CSV |
| Chatbase | RAG chatbot on docs; CSV support; API | No audio/video, no schema, no MCP |
| Graphwise | MCP server, knowledge graph, enterprise | Enterprise-only, graph paradigm, no personal use |
| Mem.ai | Personal, AI-organized | Text notes only, no schema, no API/MCP |
| Capacities | Object-based schema (manual) | No ingestion pipeline, no API/MCP, no audio/video |

---

## The Core Gap Harkly Fills

**No product today does all of:**
1. Any-format ingestion (audio + video + PDF + CSV + URL) in a single consumer product
2. AI-proposed schema with zero user configuration
3. Output to a queryable structured database (not just RAG/vector search)
4. MCP/API access for any LLM at personal/prosumer pricing
5. Spatial canvas as an additional access layer

**Closest combined threat:** SecondBrain.io (MCP + personal pricing) + Unstructured.io (any format) + LlamaExtract (schema extraction) — but these are three separate developer tools, not one consumer product.

**Primary competitive risks:**
- NotebookLM adds CSV + API
- Perplexity Spaces adds schema inference + MCP
- Khoj adds schema inference + video pipeline
- SecondBrain.io adds file upload + audio

---

## Pricing Comparison Matrix

| Product | Entry Price | MCP | Audio/Video | Schema Inference | Target |
|---|---|---|---|---|---|
| Dovetail | ~$30/month | No | Yes | No | UX teams |
| HeyMarvin | Custom (5 users) | Yes | Yes | No | Research teams |
| Looppanel | ~$350/month (5 users) | No | Yes | No | UX teams |
| Insight7 | $83/month | No | Yes | No | Sales/research |
| Khoj | Free (open source) | Yes | Partial | No | Developers |
| NotebookLM | Free | No | Partial | No | General |
| Perplexity | $20/month | No | No | No | General |
| SecondBrain.io | $15/month | Yes | No | No | Personal |
| Dust | ~$32/user/month | Yes | No | No | Enterprise |
| Guru | $250/month min | Yes | No | No | Enterprise |
| LlamaExtract | $0.003/page | No | No | Partial | Developers |
| Unstructured.io | Pay-per-page | No | Yes (64 types) | No | Developers |
| **Harkly (target)** | **TBD** | **Yes** | **Yes** | **Yes** | **Personal/prosumer** |
