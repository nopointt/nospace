# Harkly Product Architecture Specification

**Date:** March 8, 2026 (revised March 18, 2026)
**Author:** Данияр Утегенов
**Version:** 0.2 — Layer 1 Foundation (updated: F0 per-branch, hybrid framing, connector priorities, tech stack)

---

## Executive Summary

This document defines the foundational architecture for Harkly Layer 1 — a CX research platform that transforms secondary OSINT data into actionable insights through a structured floor-based workflow. The architecture deliberately constrains scope to desk research workflows, deferring primary research (silicon customers, real customer interviews) to future layers.

The core innovation is the **spine-process floor system** combined with **branching research contexts**, enabling researchers to manage multiple parallel investigations while maintaining corpus isolation and methodological rigor.

---

## 1. Floor Architecture — Layer 1 Scope

### 1.1 Design Rationale

The floor metaphor reflects the natural progression of research maturity — from unstructured collection (Floor 0) through increasing levels of synthesis and formalization. Each floor represents a distinct phase of data transformation with different agent responsibilities and user interaction patterns.

**Key architectural decision:** Sources (Floor 1) and Raw Data (Floor 2) are separated despite both handling "input" because they operate on different time scales:
- **Floor 1** — configured once per workspace, rarely changes (infrastructure layer)
- **Floor 2** — created per research branch, high-frequency curation (operational layer)

### 1.2 Floor Definitions

| Floor | Name (RU) | Primary Function | Agent Role | User Activity |
|-------|-----------|-----------------|------------|---------------|
| **0** | Черновик (Scratchpad) | Unstructured intake, framing | Framing assistant, weak signal detection | Free-form data drops, question formulation, notes |
| **1** | Источники (Sources) | Infrastructure configuration | Connector management, MCP orchestration | One-time setup, authorization, source prioritization |
| **2** | Сырьё (Raw) | Corpus assembly and screening | Classification, deduplication, quality scoring | Manual curation, inclusion/exclusion decisions |
| **3** | Инсайты (Insights) | Normalization and synthesis | Entity extraction, thematic coding, fact verification | Review salient findings, citation validation |
| **4** | Артефакты (Artifacts) | Framework-based deliverables | Template population, cross-referencing | Select artifact type, refine outputs |
| **5** | Стейкхолдеры (Stakeholders) | Audience-specific formatting | Presentation generation, executive summarization | Export, share, version control |

---

## 2. Spatial Model — Floors, Branches, Infinity

### 2.1 Floors as Z-Axis of Infinite Space

Each floor is a **separate infinite canvas** — a complete unbounded 2D plane at its own Z-level. Between any two floors there is **infinity**. Switching floors = moving to a different infinite plane on the Z-axis, not scrolling or tabbing.

```
Z-axis (floors — each is an infinite 2D canvas)

  F5 ─────── ∞ infinite canvas (Stakeholders)
      ∞ gap
  F4 ─────── ∞ infinite canvas (Artifacts)
      ∞ gap
  F3 ─────── ∞ infinite canvas (Insights)
      ∞ gap
  F2 ─────── ∞ infinite canvas (Raw)
      ∞ gap
  F1 ─────── ∞ infinite canvas (Sources)
      ∞ gap
  F0 ─────── ∞ infinite canvas (Scratchpad)
```

### 2.2 Branches as Parallel Infinite Canvases

A branch is a **separate infinite canvas on the same floor**. Between any two branches there is also **infinity** — they are parallel infinite planes, not tabs or views.

```
Floor 0 (Z=0):
  Branch 1 ─── ∞ infinite canvas (Research A)
       ∞ gap
  Branch 2 ─── ∞ infinite canvas (Research B)
       ∞ gap
  Branch 3 ─── ∞ infinite canvas (Research C)
```

Each branch has its own complete F0–F5 stack — **6 separate infinite canvases**:

```
Branch 1:  F0₁ ─ F1₁ ─ F2₁ ─ F3₁ ─ F4₁ ─ F5₁   (each = ∞ canvas)
Branch 2:  F0₂ ─ F1₂ ─ F2₂ ─ F3₂ ─ F4₂ ─ F5₂   (each = ∞ canvas)
Branch 3:  F0₃ ─ F1₃ ─ F2₃ ─ F3₃ ─ F4₃ ─ F5₃   (each = ∞ canvas)
```

New branch = 6 new infinite canvases (one per floor). Branches are fully isolated — no shared state, no shared canvas, no cross-contamination.

### 2.3 Branch Isolation

Each research branch maintains:
- **Own scratchpad** (Floor 0) — independent infinite canvas with framing context
- **Independent source configurations** (Floor 1) — different API keys, connector priorities
- **Separate raw corpora** (Floor 2) — no cross-contamination of documents
- **Isolated insight graphs** (Floor 3) — entity relationships scoped to branch
- **Branch-specific artifacts** (Floor 4) — Empathy Maps, Evidence Maps unique to each frame

### 2.4 Cross-Branch Operations

While branches are isolated during synthesis, Floor 5 (Stakeholders) enables:
- **Comparative reports** — side-by-side artifact analysis across branches
- **Meta-analysis** — aggregated insights from multiple research contexts
- **Portfolio views** — executive dashboards showing all active investigations

---

## 3. Floor 0 — Черновик (Scratchpad)

### 3.1 Purpose

Floor 0 is the **per-branch working surface** where researchers operate before formal structure emerges. It is intentionally friction-free — no validation, no forced categorization, no schema enforcement.

### 3.2 UI Components

**Omnibar (Primary Input)**
- Single text input field, always accessible (bottom-left, not center — distinct Harkly pattern)
- Natural language question entry triggers Framing Studio
- Acts as universal search, command palette, and research question formulator

**Framing Studio**
- Appears contextually when user enters a question
- Hybrid framing model: accepts any natural language input (HMW, Problem Statement, JTBD, vague signal)
- AI classifies internally and suggests appropriate framework
- User can accept, modify, or reject suggested frame
- Saved frames become branch metadata

**Signals & Notebook Panel**
- Right sidebar or collapsible bottom panel
- Unstructured notes, emerging themes, weak signals
- Links and references not yet classified
- Personal observations and hypotheses
- Does not feed directly into floors 1-5 (manual promotion required)

**Draft Corpus List**
- Center pane showing manually added items (URLs, files, text, screenshots)
- Visual queue for material awaiting screening (Floor 2 promotion)
- Drag-and-drop reordering, bulk tagging
- No automatic processing — explicit user action required to advance

### 3.3 Framing Methodology — Hybrid Model

Harkly uses a **hybrid framing approach** rather than a single framework. The Framing Studio accepts any natural language input and classifies it internally:

| Framework | Role | Audience |
|---|---|---|
| **JTBD** | Primary frame for discovery/exploratory research | PM-native, well-known in RU (GoPractice, ProductSense) |
| **SPICE** | Service/experience evaluation | Internal classification — shown in PM-native language |
| **PEO** | Quick fallback for simple questions | Minimal, 3 elements |
| **FINER** | Validation gate (internal) | Shows only Feasibility warning to user |
| **Issue Tree** | Advanced mode for complex programs | Power users |
| **PICOT/PICO** | Advanced mode only | Only when PM explicitly tests a hypothesis with measurable outcomes |

**Input layer:** Accepts any NL — HMW, Problem Statement, JTBD, vague signal. Does not force PM to know frameworks.

**AI classification (internal):**
- Exploratory qualitative CX → SPIDER (drives source/method recommendations)
- Service/experience evaluation → SPICE
- Hypothesis testing / A-B review → PICO(T)
- Complex multi-branch → Issue Tree → then SPIDER/SPICE per branch
- Discovery / generative → JTBD → then SPIDER for evidence

**User-facing output:** PM-native language (not "S-P-I-D-E-R elements" but "Who / What we study / How / What we look for"). Framework name is an informational label, not primary UI.

**FINER gate (internal):** Scores Feasibility and Relevance before finalization. Flags questions that are too broad or infeasible.

### 3.4 PICOT Framework Detail (advanced mode)

PICOT is a structured question formulation framework adapted from evidence-based medicine. Available when PM explicitly needs hypothesis testing:

| Component | Full Term | Research Question | Example (CX Context) |
|-----------|-----------|-------------------|---------------------|
| **P** | Population/Patient | Who is studied? | E-commerce users, 25-40 years old, mobile devices |
| **I** | Intervention | What is applied? | Checkout flow redesign, payment method change |
| **C** | Comparison | What is the baseline? | Current checkout flow, competitor implementations |
| **O** | Outcome | What is measured? | Conversion rate, abandonment triggers, user sentiment |
| **T** | Time | Over what period? | Q4 2025, 6-month trend analysis |

### 3.5 Workflow Triggers

- **Explicit branch creation** — User clicks "Начать исследование" after formulating frame
- **Implicit suggestion** — Agent detects sufficient corpus accumulation and recommends branch spawn
- **Clone from template** — User duplicates existing frame and modifies parameters

### 3.6 PICOT Bar Visibility (resolved)

PICOT/frame context bar is **NOT sticky** by default on any floor. Visibility is controlled by user toggle. No persistent context bar across floors.

---

## 4. Floor 1 — Источники (Sources)

### 4.1 Purpose

Floor 1 configures the **infrastructure layer** for data acquisition. This is workspace-level setup, not per-research configuration. Once authenticated and prioritized, sources become available to all research branches.

### 4.2 Connector Types

**Manual Sources (Tier 1 — highest priority for Russian B2B PMs)**
- File upload interface (PDF, DOCX, CSV, XLSX, audio, video)
- Interview transcript paste / Zoom recording upload
- URL scraper with headless browser support
- Browser extension for one-click capture

**Russian Market Connectors (Tier 1–2)**
- Telegram channel monitoring (MTProto API via Telethon)
- vc.ru scraping/monitoring
- VKontakte (social listening)
- Habr articles/comments (RSS + scraping)
- Yandex/Google reviews, App Store/Google Play reviews
- Ozon/Wildberries marketplace reviews (e-commerce PM segment)

**Support & Feedback Connectors (Tier 2)**
- Zendesk / Intercom (support tickets — CSV or API)
- NPS/CSAT survey exports (SurveyMonkey, Typeform, Google Forms)

**Global Connectors (Tier 3)**
- Reddit API
- Hacker News (Algolia API, no auth)
- YouTube Data API (comments, transcripts)
- News aggregators (NewsAPI, GDELT)

**Enterprise Connectors (Tier 4 — future)**
- Salesforce / HubSpot (CRM)
- Slack / Notion (internal knowledge)
- Gong / Chorus (sales call recordings)

**MCP (Model Context Protocol) Connectors**
- Custom OSINT tools wrapped as MCP servers
- Internal databases (CRM, support tickets, feedback forms)
- Third-party research platforms (via partnerships)

### 4.3 Connector Priority Rationale

Based on audience research (13 Telegram community mining, 2026-03-18):
- **File upload** is P0 — mentioned in 10/13 target audience chats. CustDev workflow always ends with a file.
- **Interview transcripts** are P0 — mentioned in 11/13 chats. The #1 data artifact.
- **Support tickets** are P1 — explicit named pain: "manual analysis of support feedback is exhausting" (5/13 chats)
- **Telegram channels** are P1 — "40-60 minutes daily monitoring channels" (3/13 chats, strong signal)
- **Reddit** is P4 — 0 mentions in 13 Russian PM chats. Wrong market geography.

The audience does not think in "connectors" — they think: **"I have data scattered everywhere and no time to look at it."** F1 messaging should reflect this.

### 4.4 Configuration UI

**Authorization Panel**
- OAuth flows for social platforms (popup preferred over full-page redirect)
- API key management (encrypted storage, rotation alerts, "show once" contract)
- Connection status: 5 states minimum (Connected/green, Expired/orange, Error/red, Not connected/gray, Syncing/spinner)

**Rate Limit & Quota Visualization**
- Linear progress bars with threshold colors: green (0–70%) → yellow (70–90%) → red (90–100%)
- Label: "1,842 / 5,000 requests used this month" + percentage
- "Last synced" relative timestamp on each connected source

**Prioritization Matrix**
- Drag-to-rank source importance for default search behavior
- Per-source quality scores (manually adjusted based on past relevance)
- Cost tracking for paid APIs (budget alerts, usage forecasting)

**Query Template Library**
- Reusable search patterns per source type
- Variable substitution from frame components (auto-fill {population}, {intervention})
- Version control for query evolution

### 4.5 Agent Responsibilities

Floor 1 agents focus on **infrastructure orchestration**, not content analysis:
- Connection health checks (detect expired tokens, API downtime)
- Query translation (convert frame parameters into source-specific syntax)
- Deduplication fingerprinting (hash documents for Floor 2 screening)
- Metadata enrichment (source credibility scores, publish dates, author authority)

---

## 5. Floor 2 — Сырьё (Raw)

### 5.1 Purpose

Floor 2 is the **corpus assembly workspace** for a specific research branch. All documents retrieved from Floor 1 sources land here for human-in-the-loop screening. The goal is a curated, high-quality corpus ready for automated insight extraction (Floor 3).

### 5.2 Screening Workflow

**Automatic Classification**
- Relevance scoring (cosine similarity to frame embedding)
- Language detection and filtering
- Duplicate detection (fuzzy matching, near-duplicate clustering)
- Spam/low-quality signals (word count, readability scores, bot-generated content patterns)

**Manual Review Interface**
- Three-pane layout: document list (left), full-text viewer (center), metadata/notes (right)
- Rapid triage hotkeys: Include (I), Exclude (E), Maybe (M), Flag for second review (F)
- Batch operations (bulk tag, bulk exclude by domain/author)
- Inclusion reason tagging (directly addresses frame, provides comparison data, contextual background)

**Quality Control Metrics**
- Inter-rater reliability (if multiple researchers collaborate)
- Inclusion rate trends (detect drift in screening criteria)
- Time-per-document benchmarks (identify bottlenecks)

### 5.3 Corpus Metadata

Each document in Floor 2 carries:
- Source provenance (Floor 1 connector, retrieval timestamp)
- Screening decision (included/excluded) with reason codes
- Human annotations (highlights, margin notes, tags)
- Deduplication cluster ID (link to near-duplicates)
- Frame component mapping (which elements of the frame does this document address?)

### 5.4 Agent Responsibilities

Floor 2 agents support curation, not decision-making:
- Pre-screening suggestions (confidence scores for inclusion)
- Anomaly detection (outlier documents that don't fit corpus distribution)
- Citation extraction (pull references for future source expansion)
- Data extraction preview (structured fields visible before Floor 3 processing)

---

## 6. Floor 3 — Инсайты (Insights)

### 6.1 Purpose

Floor 3 transforms the curated corpus (Floor 2) into **structured, queryable insights** through NLP pipelines. This is where automation dominates — agents extract entities, relationships, themes, and evidence chains without per-document human review (unless flagged for validation).

### 6.2 Extraction Pipelines

**Entity Recognition**
- Named entities (people, organizations, products, locations)
- Domain-specific entities (pain points, feature requests, emotional states)
- Entity linking (resolve mentions to canonical identifiers)

**Relationship Extraction**
- Causal relationships (X causes Y, supported by document D)
- Temporal relationships (event sequences, trend detection)
- Sentiment relationships (entity X associated with negative sentiment in context Y)

**Thematic Coding**
- Unsupervised clustering (LDA, BERTopic for emergent themes)
- Supervised classification (map to predefined CX frameworks like JTBD, service blueprints)
- Quote extraction (salient excerpts illustrating themes, preserved with source attribution)

**Fact Verification**
- Cross-document corroboration (claim appears in N independent sources)
- Contradiction detection (conflicting claims flagged for human review)
- Source authority weighting (claims from high-credibility sources prioritized)

### 6.3 Insight Graph

Floor 3 outputs a **knowledge graph** where:
- **Nodes** = entities (users, pain points, features, outcomes)
- **Edges** = relationships (causes, mentions, correlates_with)
- **Attributes** = evidence strength, source count, sentiment polarity

This graph is queryable via natural language ("Show me all pain points mentioned by mobile users in Q4") and powers Floor 4 artifact generation.

### 6.4 UI Components

**Graph Visualization**
- Interactive network diagram (zoom, filter by node type, edge type)
- Heatmaps for entity co-occurrence
- Timeline views for temporal relationships

**Evidence Browser**
- Drill-down from graph node to supporting documents
- Side-by-side quote comparison (show conflicting or corroborating evidence)
- Citation export (formatted references for reports)

**Quality Dashboard**
- Entity extraction accuracy (human-validated sample)
- Theme coherence metrics (silhouette scores for clusters)
- Coverage analysis (which frame components have sufficient evidence?)

---

## 7. Floor 4 — Артефакты (Artifacts)

### 7.1 Purpose

Floor 4 generates **framework-based deliverables** by populating structured templates with Floor 3 insights. These artifacts are the primary "outputs" researchers share internally before final stakeholder formatting (Floor 5).

### 7.2 Artifact Types

**Empathy Map**
- Quadrant layout (Says, Thinks, Does, Feels)
- Auto-populated from Floor 3 sentiment analysis, quote extraction, behavioral patterns
- User segments as separate map instances (compare mobile vs desktop users)

**Fact Pack**
- Structured list of validated claims with multi-source evidence
- Confidence scoring (high = 5+ independent sources, low = single mention)
- Contradiction alerts (conflicting facts highlighted)

**Journey Map**
- Stage-based visualization (Awareness → Consideration → Purchase → Retention)
- Pain points and delights mapped to stages
- Touchpoint inventory (channels, interactions, emotional peaks/troughs)

**Evidence Map**
- Argumentative structure (claim → evidence → warrant)
- Used for hypothesis testing (does corpus support or refute hypothesis H?)
- Color-coded by evidence strength (green = strong, yellow = weak, red = contradicted)

### 7.3 Generation Workflow

1. **Template Selection** — User chooses artifact type or agent recommends based on frame Outcome
2. **Automated Population** — Agent queries Floor 3 graph, fills template fields
3. **Human Review** — User edits auto-generated content, adds qualitative interpretation
4. **Version Control** — Snapshot saved, changes tracked, revert capability
5. **Cross-Artifact Synthesis** — Link related artifacts (e.g., Empathy Map pain points → Journey Map friction stages)

### 7.4 Agent Responsibilities

- Template-graph mapping (which Floor 3 nodes/edges populate which artifact fields?)
- Narrative generation (turn structured data into readable prose)
- Visual design (layout, color schemes, iconography for maps)
- Consistency checks (ensure artifacts don't contradict each other across branches)

---

## 8. Floor 5 — Стейкхолдеры (Stakeholders)

### 8.1 Purpose

Floor 5 transforms Floor 4 artifacts into **audience-specific formats** optimized for different stakeholder consumption patterns. This is the final formatting layer before distribution.

### 8.2 Output Formats

**Presentation (Slide Deck)**
- Executive summary slides
- Key findings with visual highlights (charts, quotes, maps)
- Appendix with methodology and sources
- Export: PPTX, PDF

**Brief (One-Pager)**
- Problem statement (frame P/I equivalent)
- Top 3-5 findings
- Recommended actions
- Export: PDF, Markdown

**Report (Long-Form Document)**
- Full methodology section
- Detailed findings with evidence
- Cross-referenced artifacts
- Comprehensive bibliography
- Export: DOCX, PDF, LaTeX

### 8.3 Audience Presets

**C-Suite**
- High-level summaries
- Emphasis on business outcomes (revenue impact, competitive positioning)
- Minimal methodological detail

**Product Team**
- Detailed pain points and feature requests
- User quotes and journey maps
- Actionable design recommendations

**Research Team**
- Full corpus metadata
- Methodology transparency
- Reproducibility documentation

### 8.4 Agent Responsibilities

- Audience adaptation (adjust tone, detail level, jargon usage)
- Visual storytelling (generate charts, infographics, data visualizations)
- Citation formatting (APA, MLA, Chicago — user selectable)
- Version comparison (track report changes across iterations)

---

## 9. Excluded from Layer 1 Scope

### 9.1 Silicon Customers (Layer 2)

**What:** Synthetic user personas generated via LLM simulation, interrogated through multi-agent debates to surface edge cases and emergent behaviors.

**Why Deferred:** Requires mature insight graphs (Floor 3) and validated frameworks (Floor 4) as grounding data. Premature introduction risks hallucinated personas detached from evidence base.

### 9.2 Real Customers (Layer 3)

**What:** Primary research workflows — interview scheduling, recording transcription, ethnographic observation tracking, survey deployment and analysis.

**Why Deferred:** Fundamentally different data modality (qualitative, consent-gated, small-N) requiring separate ethical, legal, and technical infrastructure. Floor 1-5 architecture optimized for high-volume secondary data.

### 9.3 Integration Path

When Layers 2 and 3 are introduced:
- **Silicon Customers** inject between Floor 3 (Insights) and Floor 4 (Artifacts) — synthetic data enriches insight graph before artifact generation
- **Real Customers** add new Floor 2 variant — "Primary Raw" with transcription, coding, and consent management workflows

Both integrate with existing floors via shared insight graph (Floor 3) — primary and secondary data converge in unified knowledge representation.

---

## 10. Technical Architecture Notes

### 10.1 Data Models

**Research Branch**
- `branch_id` (UUID)
- `frame` (JSON: framework-specific structure — JTBD/SPICE/PEO/PICOT/IssueTree)
- `frame_type` (enum: jtbd, spice, peo, picot, issue_tree)
- `created_at`, `updated_at`
- `workspace_id` (foreign key)

**Document** (Floor 2)
- `document_id` (UUID)
- `branch_id` (foreign key)
- `source_connector` (enum: manual_upload, telegram, vcru, vk, habr, reddit, etc.)
- `raw_content` (text, blob for binary files)
- `metadata` (JSON: author, publish_date, url, etc.)
- `screening_status` (enum: pending, included, excluded, flagged)
- `screening_reason` (text)

**Insight** (Floor 3)
- `insight_id` (UUID)
- `branch_id` (foreign key)
- `insight_type` (enum: entity, relationship, theme, quote)
- `content` (JSON: structured representation)
- `evidence_documents` (array of document_ids)
- `confidence_score` (float 0-1)

**Artifact** (Floor 4)
- `artifact_id` (UUID)
- `branch_id` (foreign key)
- `artifact_type` (enum: empathy_map, fact_pack, journey_map, evidence_map)
- `template_version` (string)
- `content` (JSON: populated fields)
- `version_history` (array of snapshots)

### 10.2 Agent Orchestration

**Framework:** LangGraph for stateful multi-agent workflows

**Key Agents:**
- **Framing Agent** (Floor 0): Framework classification, question refinement, FINER validation
- **Connector Agent** (Floor 1): API orchestration, query translation
- **Screening Agent** (Floor 2): Relevance scoring, duplicate detection
- **Extraction Agent** (Floor 3): NER, relation extraction, thematic coding
- **Synthesis Agent** (Floor 4): Template population, narrative generation
- **Formatting Agent** (Floor 5): Document generation, visual design

**Coordination Pattern:**
- Agents operate independently per floor
- Floor transitions trigger handoffs via message queues
- Human-in-the-loop gates at Floors 0→1 (branch spawn), 2→3 (corpus finalization), 4→5 (artifact approval)

### 10.3 Technology Stack

**Current (as of March 2026):**
- Next.js 16, Bun runtime
- PostgreSQL via Supabase (auth, realtime, DB)
- Prisma 7 (adapter-pg)
- Modal.com (agent compute, GPU inference)
- shadcn/ui (component library)
- Vercel (deployment)
- NVIDIA NIM (meta/llama-3.3-70b-instruct) for LLM

**Planned Additions:**
- Neo4j or PostgreSQL with AGE extension (Floor 3 graph database)
- Qdrant or Weaviate (vector search for semantic similarity)
- Cloudflare Workers (Floor 1 connector edge functions)
- WebSockets (realtime Floor 0 collaboration)

---

## 11. Design Principles

### 11.1 Floor Isolation

Each floor is a **bounded context** with clear input/output contracts. Agents cannot "reach down" to lower floors or "skip ahead" to higher floors. This enforces data lineage and makes quality control auditable.

### 11.2 Progressive Disclosure

UI complexity increases with floor number. Floor 0 is a blank slate, Floor 5 has full report generation controls. New users start on Floor 0 and discover advanced features as they ascend.

### 11.3 Human-in-the-Loop Gates

Automation cannot advance research across floor boundaries without explicit user approval. This prevents runaway agent behavior and ensures researcher intent is preserved at decision points.

### 11.4 Evidence Traceability

Every artifact (Floor 4) links back to insights (Floor 3) which link back to documents (Floor 2) which link back to sources (Floor 1). "Citation on demand" — user can always drill down to raw evidence.

### 11.5 Branch Independence

Research branches do not share state. Each branch has its own F0–F5. This prevents corpus contamination and allows parallel investigations with conflicting methodologies.

---

## 12. Resolved Questions

### 12.1 PICOT/Frame Visibility — RESOLVED

**Decision (2026-03-18):** Frame context bar is NOT sticky by default on any floor. Visibility is user-controlled via toggle. No persistent context bar across floors.

### 12.2 F0 Scope — RESOLVED

**Decision (2026-03-18):** F0 is per-branch, not global. Each branch starts with its own empty scratchpad. No shared canvas across branches.

## 13. Open Questions

### 13.1 Cross-Branch Merging

**Question:** Can insights from multiple branches be merged into a unified Floor 3 graph for meta-analysis?

**Implications:**
- **Yes** — enables portfolio-level analysis (e.g., "What are common pain points across 5 different product research studies?")
- **No** — maintains strict branch isolation, avoids conflation of different frames

**Technical Challenge:** Entity resolution across branches (same pain point mentioned in different terminology).

### 13.2 Floor 5 Collaboration

**Question:** Can stakeholders (non-researchers) access Floor 5 to customize reports without seeing Floors 0-4?

**Implications:**
- **Yes** — democratizes research outputs, enables self-service report generation
- **No** — maintains researcher control, prevents misinterpretation of findings

**Security Challenge:** Role-based access control (RBAC) per floor.

---

## 14. Success Metrics

### 14.1 Product Metrics

- **Time to First Artifact** — Duration from Floor 0 entry to first Floor 4 output (target: <2 hours for small corpus)
- **Corpus Quality** — Percentage of Floor 2 documents rated "highly relevant" in spot checks (target: >80%)
- **Agent Acceptance Rate** — Percentage of Floor 3 auto-extracted insights accepted without modification (target: >70%)
- **Artifact Reuse** — Number of times Floor 4 artifacts are referenced in Floor 5 reports (higher = more valuable synthesis)

### 14.2 Business Metrics

- **Research Throughput** — Number of completed research branches per user per month (target: 3-5 for active users)
- **Stakeholder Engagement** — Download/share rate of Floor 5 outputs (target: >60% of generated reports distributed)
- **Retention** — Percentage of users who create a second research branch after completing their first (target: >50%)

---

## 15. Roadmap Milestones

### Phase 1: Foundation (Q2 2026)
- Floor 0 Scratchpad with Omnibar and Framing Studio (hybrid model)
- Floor 1 Sources with Tier 1 connectors (manual upload, Telegram, vc.ru)
- Floor 2 Raw with manual screening UI
- Basic Floor 3 entity extraction (NER only, no relationships)

### Phase 2: Automation (Q3 2026)
- Floor 3 full pipeline (entities, relationships, themes, quotes)
- Floor 4 with 2 artifact types (Empathy Map, Fact Pack)
- Agent orchestration via LangGraph
- Branch management (create, clone, archive)

### Phase 3: Distribution (Q4 2026)
- Floor 5 Stakeholders with 3 output formats (Presentation, Brief, Report)
- Collaboration features (multi-user, comments on artifacts)
- MCP connector framework for custom integrations
- Tier 2 connectors (VK, Habr, support tickets, reviews)

### Phase 4: Intelligence (Q1 2027)
- Layer 2: Silicon Customers (synthetic personas, agent debates)
- Advanced analytics (trend detection, predictive modeling)
- API access for programmatic research execution

---

## 16. Conclusion

The Harkly Layer 1 architecture provides a **structured, auditable, and scalable foundation** for desk research workflows. By separating concerns across six floors and enforcing branch isolation, the system balances automation with human expertise while maintaining evidence traceability from raw source to stakeholder deliverable.

The deliberate exclusion of primary research (silicon and real customers) allows focused execution on secondary data workflows, with clear integration paths for future capability expansion. The branching model enables portfolio-scale research management while preserving per-study methodological rigor.
