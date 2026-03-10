# Harkly Product Architecture Specification

**Date:** March 8, 2026  
**Author:** Данияр Утегенов  
**Version:** 0.1 — Layer 1 Foundation

---

## Executive Summary

This document defines the foundational architecture for Harkly Layer 1 — a CX research platform that transforms secondary OSINT data into actionable insights through a structured floor-based workflow. The architecture deliberately constrains scope to desk research workflows, deferring primary research (silicon customers, real customer interviews) to future layers.

The core innovation is the **spine-process floor system** combined with **branching research contexts**, enabling researchers to manage multiple parallel investigations from a single persistent scratchpad while maintaining corpus isolation and methodological rigor.

---

## 1. Floor Architecture — Layer 1 Scope

### 1.1 Design Rationale

The floor metaphor reflects the natural progression of research maturity — from unstructured collection (Floor 0) through increasing levels of synthesis and formalization. Each floor represents a distinct phase of data transformation with different agent responsibilities and user interaction patterns.

**Key architectural decision:** Sources (Floor 1) and Raw Data (Floor 2) are separated despite both handling "input" because they operate on different time scales:
- **Floor 1** — configured once per workspace, rarely changes (infrastructure layer)
- **Floor 2** — created per research branch, high-frequency curation (operational layer)

### 1.2 Floor Definitions

| Floor | Name | Primary Function | Agent Role | User Activity |
|-------|------|-----------------|------------|---------------|
| **0** | Scratchpad | Unstructured intake, framing | Framing assistant, weak signal detection | Free-form data drops, question formulation, notes |
| **1** | Sources | Infrastructure configuration | Connector management, MCP orchestration | One-time setup, authorization, source prioritization |
| **2** | Raw | Corpus assembly and screening | Classification, deduplication, quality scoring | Manual curation, inclusion/exclusion decisions |
| **3** | Insights | Normalization and synthesis | Entity extraction, thematic coding, fact verification | Review salient findings, citation validation |
| **4** | Artifacts | Framework-based deliverables | Template population, cross-referencing | Select artifact type, refine outputs |
| **5** | Stakeholders | Audience-specific formatting | Presentation generation, executive summarization | Export, share, version control |

---

## 2. Branching Research Model

### 2.1 Tree Structure

Floor 0 serves as the **global workspace root** — a persistent scratchpad shared across all research branches. When a research question matures into a structured investigation, the user formulates a **PICOT frame** which spawns an isolated branch with its own Floor 1-5 instances.

Floor 0 (Global Scratchpad)
├── Research A [PICOT-A]  →  1a → 2a → 3a → 4a → 5a
├── Research B [PICOT-B]  →  1b → 2b → 3b → 4b → 5b
└── Research C [PICOT-C]  →  1c → 2c → 3c → 4c → 5c

### 2.2 Branch Isolation

Each research branch maintains:
- **Independent source configurations** (Floor 1) — different API keys, connector priorities, query templates
- **Separate raw corpora** (Floor 2) — no cross-contamination of documents between studies
- **Isolated insight graphs** (Floor 3) — entity relationships scoped to branch context
- **Branch-specific artifacts** (Floor 4) — Empathy Maps, Evidence Maps unique to each PICOT

### 2.3 Cross-Branch Operations

While branches are isolated during synthesis, Floor 5 (Stakeholders) enables:
- **Comparative reports** — side-by-side artifact analysis across branches
- **Meta-analysis** — aggregated insights from multiple research contexts
- **Portfolio views** — executive dashboards showing all active investigations

---

## 3. Floor 0 — Scratchpad

### 3.1 Purpose

Floor 0 is the **persistent working surface** where researchers operate before formal structure emerges. It is intentionally friction-free — no validation, no forced categorization, no schema enforcement. Material accumulates here until patterns justify spawning a formal research branch.

### 3.2 UI Components

**Omnibar (Primary Input)**
- Single text input field, always accessible
- Natural language question entry triggers Framing Studio
- Acts as universal search, command palette, and research question formulator

**Framing Studio**
- Appears contextually when user enters a question
- Presents PICOT framework for structured question decomposition
- User can accept, modify, or reject suggested frame
- Saved frames become branch metadata, visible across all floors in that branch

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

### 3.3 PICOT Methodology

**PICOT** is a structured question formulation framework adapted from evidence-based medicine research. Each component enforces specificity:

| Component | Full Term | Research Question | Example (CX Context) |
|-----------|-----------|-------------------|---------------------|
| **P** | Population/Patient | Who is studied? | E-commerce users, 25-40 years old, mobile devices |
| **I** | Intervention | What is applied? | Checkout flow redesign, payment method change |
| **C** | Comparison | What is the baseline? | Current checkout flow, competitor implementations |
| **O** | Outcome | What is measured? | Conversion rate, abandonment triggers, user sentiment |
| **T** | Time | Over what period? | Q4 2025, 6-month trend analysis |

**Why PICOT for Harkly:** Transforms vague questions ("Why do users abandon carts?") into operationalizable research specifications that directly inform:
- Source selection (Floor 1) — which APIs and datasets are relevant
- Screening criteria (Floor 2) — what constitutes an includable document
- Insight extraction (Floor 3) — which entities and relationships to prioritize
- Artifact selection (Floor 4) — which frameworks best answer the O (Outcome)

### 3.4 Workflow Triggers

- **Explicit branch creation** — User clicks "Start Research" after formulating PICOT
- **Implicit suggestion** — Agent detects sufficient corpus accumulation and recommends branch spawn
- **Clone from template** — User duplicates existing PICOT and modifies parameters

---

## 4. Floor 1 — Sources

### 4.1 Purpose

Floor 1 configures the **infrastructure layer** for data acquisition. This is workspace-level setup, not per-research configuration. Once authenticated and prioritized, sources become available to all research branches.

### 4.2 Connector Types

**Native Integrations**
- Twitter/X API (academic access, enterprise tiers)
- Reddit API (PRAW, Pushshift alternatives)
- YouTube Data API (comments, transcripts)
- Google Custom Search API
- News aggregators (NewsAPI, GDELT)

**MCP (Model Context Protocol) Connectors**
- Custom OSINT tools wrapped as MCP servers
- Internal databases (CRM, support tickets, feedback forms)
- Third-party research platforms (Gartner, Forrester via partnerships)

**Manual Sources**
- File upload interface (PDF, DOCX, CSV, XLSX)
- URL scraper with headless browser support
- Browser extension for one-click capture

### 4.3 Configuration UI

**Authorization Panel**
- OAuth flows for social platforms
- API key management (encrypted storage, rotation alerts)
- Rate limit monitoring and quota visualization

**Prioritization Matrix**
- Drag-to-rank source importance for default search behavior
- Per-source quality scores (manually adjusted based on past relevance)
- Cost tracking for paid APIs (budget alerts, usage forecasting)

**Query Template Library**
- Reusable search patterns per source type (e.g., Twitter advanced search syntax)
- Variable substitution from PICOT components (auto-fill {population}, {intervention})
- Version control for query evolution

### 4.4 Agent Responsibilities

Floor 1 agents focus on **infrastructure orchestration**, not content analysis:
- Connection health checks (detect expired tokens, API downtime)
- Query translation (convert PICOT parameters into source-specific syntax)
- Deduplication fingerprinting (hash documents for Floor 2 screening)
- Metadata enrichment (source credibility scores, publish dates, author authority)

---

## 5. Floor 2 — Raw

### 5.1 Purpose

Floor 2 is the **corpus assembly workspace** for a specific research branch. All documents retrieved from Floor 1 sources land here for human-in-the-loop screening. The goal is a curated, high-quality corpus ready for automated insight extraction (Floor 3).

### 5.2 Screening Workflow

**Automatic Classification**
- Relevance scoring (cosine similarity to PICOT embedding)
- Language detection and filtering
- Duplicate detection (fuzzy matching, near-duplicate clustering)
- Spam/low-quality signals (word count, readability scores, bot-generated content patterns)

**Manual Review Interface**
- Three-pane layout: document list (left), full-text viewer (center), metadata/notes (right)
- Rapid triage hotkeys: Include (I), Exclude (E), Maybe (M), Flag for second review (F)
- Batch operations (bulk tag, bulk exclude by domain/author)
- Inclusion reason tagging (directly addresses PICOT, provides comparison data, contextual background)

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
- PICOT component mapping (which P/I/C/O/T does this document address?)

### 5.4 Agent Responsibilities

Floor 2 agents support curation, not decision-making:
- Pre-screening suggestions (confidence scores for inclusion)
- Anomaly detection (outlier documents that don't fit corpus distribution)
- Citation extraction (pull references for future source expansion)
- Data extraction preview (structured fields visible before Floor 3 processing)

---

## 6. Floor 3 — Insights

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
- Coverage analysis (which PICOT components have sufficient evidence?)

---

## 7. Floor 4 — Artifacts

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

1. **Template Selection** — User chooses artifact type or agent recommends based on PICOT Outcome
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

## 8. Floor 5 — Stakeholders

### 8.1 Purpose

Floor 5 transforms Floor 4 artifacts into **audience-specific formats** optimized for different stakeholder consumption patterns. This is the final formatting layer before distribution.

### 8.2 Output Formats

**Presentation (Slide Deck)**
- Executive summary slides
- Key findings with visual highlights (charts, quotes, maps)
- Appendix with methodology and sources
- Export: PPTX, PDF

**Brief (One-Pager)**
- Problem statement (PICOT P/I)
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
- `picot_frame` (JSON: {P, I, C, O, T})
- `created_at`, `updated_at`
- `parent_floor_0_workspace_id` (foreign key)

**Document** (Floor 2)
- `document_id` (UUID)
- `branch_id` (foreign key)
- `source_connector` (enum: twitter, reddit, manual_upload, etc.)
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
- **Framing Agent** (Floor 0): PICOT decomposition, question refinement
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
- Next.js 14, Bun runtime
- PostgreSQL (YC Managed, 152-FZ compliant)
- Supabase (auth, realtime subscriptions)
- Prisma (multi-source data access)
- Modal.com (agent compute, GPU inference)
- shadcn/ui (component library)
- Vercel (deployment)

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

Research branches do not share state beyond Floor 0. This prevents corpus contamination and allows parallel investigations with conflicting methodologies.

---

## 12. Open Questions

### 12.1 PICOT Visibility

**Question:** Does PICOT frame live exclusively on Floor 0 (branch metadata), or is it visible as a "sticky context bar" on all floors within that branch?

**Implications:**
- **Floor 0 only** — cleaner UI, but users may forget framing context on higher floors
- **Sticky on all floors** — constant reminder of research scope, but clutters workspace
- **Hybrid** — collapsible panel, visible by default on Floors 1-3, hidden on 4-5

**Decision Needed:** User testing will determine optimal visibility pattern.

### 12.2 Cross-Branch Merging

**Question:** Can insights from multiple branches be merged into a unified Floor 3 graph for meta-analysis?

**Implications:**
- **Yes** — enables portfolio-level analysis (e.g., "What are common pain points across 5 different product research studies?")
- **No** — maintains strict branch isolation, avoids conflation of different PICOTs

**Technical Challenge:** Entity resolution across branches (same pain point mentioned in different terminology).

### 12.3 Floor 5 Collaboration

**Question:** Can stakeholders (non-researchers) access Floor 5 to customize reports without seeing Floors 0-4?

**Implications:**
- **Yes** — democratizes research outputs, enables self-service report generation
- **No** — maintains researcher control, prevents misinterpretation of findings

**Security Challenge:** Role-based access control (RBAC) per floor.

---

## 13. Success Metrics

### 13.1 Product Metrics

- **Time to First Artifact** — Duration from Floor 0 entry to first Floor 4 output (target: <2 hours for small corpus)
- **Corpus Quality** — Percentage of Floor 2 documents rated "highly relevant" in spot checks (target: >80%)
- **Agent Acceptance Rate** — Percentage of Floor 3 auto-extracted insights accepted without modification (target: >70%)
- **Artifact Reuse** — Number of times Floor 4 artifacts are referenced in Floor 5 reports (higher = more valuable synthesis)

### 13.2 Business Metrics

- **Research Throughput** — Number of completed research branches per user per month (target: 3-5 for active users)
- **Stakeholder Engagement** — Download/share rate of Floor 5 outputs (target: >60% of generated reports distributed)
- **Retention** — Percentage of users who create a second research branch after completing their first (target: >50%)

---

## 14. Roadmap Milestones

### Phase 1: Foundation (Q2 2026)
- Floor 0 Scratchpad with Omnibar and Framing Studio
- Floor 1 Sources with 3 native connectors (Twitter, Reddit, manual upload)
- Floor 2 Raw with manual screening UI
- Basic Floor 3 entity extraction (NER only, no relationships)

### Phase 2: Automation (Q3 2026)
- Floor 3 full pipeline (entities, relationships, themes, quotes)
- Floor 4 with 2 artifact types (Empathy Map, Fact Pack)
- Agent orchestration via LangGraph
- Branch management (create, clone, archive)

### Phase 3: Distribution (Q4 2026)
- Floor 5 Stakeholders with 3 output formats (Presentation, Brief, Report)
- Collaboration features (multi-user Floor 0, comments on artifacts)
- MCP connector framework for custom integrations

### Phase 4: Intelligence (Q1 2027)
- Layer 2: Silicon Customers (synthetic personas, agent debates)
- Advanced analytics (trend detection, predictive modeling)
- API access for programmatic research execution

---

## 15. Conclusion

The Harkly Layer 1 architecture provides a **structured, auditable, and scalable foundation** for desk research workflows. By separating concerns across six floors and enforcing branch isolation, the system balances automation with human expertise while maintaining evidence traceability from raw source to stakeholder deliverable.

The deliberate exclusion of primary research (silicon and real customers) allows focused execution on secondary data workflows, with clear integration paths for future capability expansion. The branching model enables portfolio-scale research management while preserving per-study methodological rigor.

Next steps: UI wireframing for Floor 0-2, agent prompt engineering for Framing Studio, and connector prioritization for Floor 1 integrations.