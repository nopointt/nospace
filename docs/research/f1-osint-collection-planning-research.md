# OSINT Collection Planning — Research Report
> Topic: How OSINT professionals plan and execute data collection — for Harkly Collection Plan design
> Created: 2026-03-18 | Status: IN PROGRESS
> Purpose: Drive product design of Harkly's "Collection Plan" feature for AI-powered qualitative research

---

## ANGLE 1 — OSINT Collection Plans: Structure and Anatomy

### 1.1 What a Collection Plan Is

A collection plan is a formal document that guides the acquisition of information for a specific intelligence purpose. It answers: **what to collect, from where, using what methods, in what sequence, and with what prioritization**.

**Source:** Silobreaker glossary on OSINT collection plans — https://www.silobreaker.com/glossary/osint-collection-plan/
**Harkly mapping:** Core artifact that Harkly's Collection Plan feature should produce.

### 1.2 The Intelligence Requirements Hierarchy

The collection plan sits within a structured hierarchy:

```
Intelligence Requirements (IR) — broadest category
  └── Priority Intelligence Requirements (PIR) — critical gaps, decision-critical
        └── Specific Information Requirements (SIR) — granular questions per PIR
              └── Essential Elements of Information (EEI) — atomic facts needed
                    └── Collection Plan — operationalizes collection against EEI
                          └── Tasking — assigns specific sources/assets to collection tasks
```

**PIR (Priority Intelligence Requirements):** The first step to creating an intelligence collection plan is defining your PIRs. They are the foundation for all CTI work — from collection to analysis to dissemination. PIRs identify the most critical intelligence required for decision-making.

**SIR (Specific Information Requirements):** A SIR specifies information required, based on an indicator, within a specific time and location, that, when collected, could partially or fully answer an intelligence requirement.

**EEI (Essential Elements of Information):** Any critical intelligence information required by consumers to perform their mission. A specific set of EEIs are used by collectors to develop a collection plan.

**Sources:**
- Kraven Security — How To Build A Cyber Threat Intelligence Collection Plan In 2025: https://kravensecurity.com/intelligence-collection-plan/
- ThreatConnect Best Practices — Intelligence Requirements: https://knowledge.threatconnect.com/docs/best-practices-intelligence-requirements
- Wikipedia — Essential elements of information: https://en.wikipedia.org/wiki/Essential_elements_of_information
- Forge Institute OSINT 104 — Collections Management: https://www.forge.institute/courses/osint-104

**Harkly mapping:** Users need to express their research goal as a PIR-like statement, then decompose it into SIR-level questions. Harkly's Collection Plan UI should guide this decomposition.

### 1.3 Complete Collection Plan Structure (13 Sections)

Based on the Silobreaker glossary and Tarlogic analysis, a professional collection plan contains:

1. **Objective Definition** — specify collection goals and required information
2. **Intelligence Requirements & Questions** — list all questions to be answered; classify by domain
3. **Source Selection** — identify relevant data sources (databases, surveys, social, dark web)
4. **Method Selection** — choose techniques and tools appropriate for data types
5. **Schedule Creation** — establish collection timetables and frequency
6. **Process Documentation** — provide detailed step-by-step collection instructions
7. **Collector Assignment** — designate responsible parties (individuals, teams, or automated systems)
8. **Quality Control** — implement validation checks and error correction
9. **Data Storage** — define security protocols and storage locations
10. **Analysis** — select appropriate analytical methods
11. **Reporting** — determine output formats
12. **Documentation** — maintain complete records for future reference
13. **Risk Assessment** — identify challenges and mitigation strategies

**Sources:**
- Silobreaker OSINT Collection Plan: https://www.silobreaker.com/glossary/osint-collection-plan/
- Tarlogic — Data Collection Plan & Intelligence Cycle: https://www.tarlogic.com/blog/data-collection-plan-intelligence-cycle/

**Harkly mapping:** Sections 1-4, 7, 8 are most applicable to Harkly's target users (researchers). Sections 5-6, 9 could be simplified/automated.

### 1.4 Military Collection Plan Format (Army FM 34-7 Approach)

Military doctrine (MAGTF Intelligence Collection) provides the most structured templates. Key elements:

- **Commander's Critical Information Requirements (CCIR)** — commander-level priorities
- **Priority Intelligence Requirements (PIR)** — what the commander needs most
- **Friendly Force Information Requirements (FFIR)** — context of own forces
- **Essential Elements of Friendly Information (EEFI)** — what must not be compromised
- **Intelligence Collection Worksheet** — assigns PIR → source → method → timeline
- **Intelligence Synchronization Matrix** — tracks collection across time and sources

Collection Planning Principles (from MAGTF doctrine):
- Prioritize requirements
- Take multidiscipline approach
- Task organic assets first
- Maintain redundancy
- Track collection status continuously

**Sources:**
- MAGTF Intelligence Collection (MCWP 2-2): https://www.marines.mil/Portals/1/Publications/MCWP%202-2%20MAGTF%20Intelligence%20Collection.pdf
- GlobalSecurity Army FM 34-7: https://www.globalsecurity.org/intell/library/policy/army/fm/34-7/34-7_appd.pdf
- Forge Institute OSINT 104: https://www.forge.institute/courses/osint-104

**Harkly mapping:** "Intelligence Synchronization Matrix" concept → useful for Harkly as a visual view of which sources are mapped to which research questions.

### 1.5 ICD 203 — Analytic Standards

Intelligence Community Directive 203 (2022) defines five standards all intelligence products must meet:

1. **Objective** — free from bias
2. **Independent of political consideration** — analytic integrity
3. **Timely** — relevant to the decision being made
4. **Based on all available sources** — not cherry-picked
5. **Based on analytic tradecraft standards** — including nine specific sub-standards

**Source:** Academic analysis of ICD 203 — https://iacis.org/iis/2024/3_iis_2024_81-93.pdf

**Harkly mapping:** These standards translate to collection plan quality criteria. A Harkly collection plan should encourage users to seek multiple source types (standard 4) and flag potential bias in source selection.

### 1.6 MoSCoW Prioritization for Intelligence Requirements

One documented approach for prioritizing collection requirements uses MoSCoW:
- **Must-have** — requirements that directly answer the critical question
- **Should-have** — important but not critical requirements
- **Could-have** — nice to have, pursue if time allows
- **Won't-have** — explicitly out of scope for this collection cycle

**Source:** Collection plan CTI methodology reference (Kraven/Tarlogic)

**Harkly mapping:** Harkly could use MoSCoW labeling for source-question assignments in the collection plan.

---

## ANGLE 2 — OSINT Collection Strategies: Source Selection by Research Type

### 2.1 The Three-Layer Source Model

Professional OSINT distinguishes sources by type and proximity to raw signals:

**Layer 1 — Primary OSINT Sources (raw, unmediated):**
- Social media platforms (X, LinkedIn, Reddit, Telegram, Discord, Facebook)
- Forums and communities (niche subreddits, professional Slack/Discord servers)
- Public records (government databases, EDGAR, court records, patent databases)
- Job postings (reveal organizational priorities and pain)
- GitHub issues and discussions
- Product reviews (G2, Capterra, Trustpilot, App Store)
- Conference proceedings and Q&A sessions (audience questions = real pain)
- Imagery and video on public platforms

**Layer 2 — Secondary OSINT Sources (processed/interpreted):**
- Industry news sites and tech press
- Newsletters (Lenny's, Stratechery, etc.)
- Corporate blog posts and case studies
- Podcast transcripts
- Analyst reports (when not paywalled)
- Wikipedia as anchor for entity validation

**Layer 3 — Tertiary OSINT Sources (synthesized/aggregated):**
- Academic papers (Google Scholar, Semantic Scholar, JSTOR, OA.mg)
- Industry research reports (Gartner, NNG, Forrester)
- Government statistical databases
- Standards-body publications

**Source:** Multiple sources synthesized — Recorded Future OSINT Framework: https://www.recordedfuture.com/threat-intelligence-101/intelligence-sources-collection/osint-framework

**Harkly mapping:** Source selection in Harkly's Collection Plan should be organized by these three layers so researchers understand what they're choosing from.

### 2.2 Source Categories by Intelligence Discipline

Professional OSINT encompasses multiple sub-disciplines:

| Discipline | Source type | Best for |
|---|---|---|
| OSINT | General publicly available information | Broad research, background |
| SOCMINT | Social media platforms | Sentiment, community signals, behavioral |
| WEBINT | Web-specific intelligence (WHOIS, DNS, scraping) | Digital footprint, technical |
| IMINT | Imagery intelligence | Geolocation, verification |
| VIRTUAL HUMINT | Online persona engagement | Insider insight (active collection) |

**Source:** Tarlogic collection plan methodology — https://www.tarlogic.com/blog/data-collection-plan-intelligence-cycle/

**Harkly mapping:** For a qualitative research tool, SOCMINT and OSINT are primary. Labeling source categories by discipline helps users think systematically.

### 2.3 Surface Web vs Deep Web vs Dark Web Strategy

**Surface web (default starting point):**
- Standard search engines (Google, Bing, DuckDuckGo)
- Social media public pages
- News sites, academic databases, government portals
- Best for: 80% of OSINT collection needs

**Deep web (requires registration or specialized access):**
- Subscription databases
- Private forums (requires account creation)
- Behind-login social content
- Academic databases (JSTOR, ProQuest)
- Best for: niche communities, professional discussions, paywalled research

**Dark web (specialized tools required):**
- .onion sites via Tor browser
- Tools: TorBot for crawling dark web sites
- Best for: threat intelligence, illicit activity research (rarely applicable to standard qualitative research)

**Source:** ShadowDragon OSINT Techniques 2026 — https://shadowdragon.io/blog/osint-techniques/

**Harkly mapping:** Most Harkly users operate exclusively on surface web. A collection plan should have surface/deep web options with clear guidance on when deep web is worth the friction.

### 2.4 Source Selection Decision Framework

The five factors that determine source selection:

1. **Relevance** — does this source type contain the information needed?
2. **Reliability** — does this source have a track record of accurate information?
3. **Recency** — is the information fresh enough for the research question?
4. **Accessibility** — can the researcher access this source without barriers?
5. **Legality** — is collection from this source compliant with data protection laws?

**Source:** Authentic8 OSINT gathering best practices — https://www.authentic8.com/blog/osint-gathering-best-practices

**Harkly mapping:** When a user adds a source to their collection plan, Harkly could prompt them to assess these five factors.

---

## ANGLE 3 — OSINT Workflows & Frameworks: Step-by-Step Processes

### 3.1 The Five-Phase Intelligence Cycle (Core Model)

The foundational workflow used across all professional OSINT contexts:

**Phase 1: Planning and Direction**
- Define investigation purpose and scope
- Identify stakeholder/client requirements
- Write Intelligence Requirements (IR) and Priority Intelligence Requirements (PIR)
- Select appropriate sources and methods
- Develop structured collection plan
- Apply "5W + H" framework: Who, What, When, Where, Why, Which (sources), How

**Phase 2: Collection**
- Execute collection against the plan
- Use passive collection by default (no target interaction)
- Archive all collected data with timestamps
- Maintain evidence chain for legal defensibility

**Phase 3: Processing and Exploitation**
- Remove duplicates and irrelevant material
- Normalize formats (dates, locations, identifiers)
- Translate non-native language content
- Document sources and collection context
- "Clean data enables clear thinking."

**Phase 4: Analysis and Production**
- Identify patterns, trends, and anomalies
- Assess reliability and confidence of findings
- Contextualize data within broader frameworks
- Apply structured analytic techniques (ACH, etc.)
- Intelligence products should directly address original objectives

**Phase 5: Dissemination and Feedback**
- Tailor reports to audience literacy level
- Deliver findings clearly, concisely, securely
- Solicit feedback from decision-makers
- Feedback drives revised requirements → cycle repeats

**Sources:**
- Fivecast — OSINT Fundamentals: The Five Steps of the Intelligence Cycle: https://www.fivecast.com/blog/osint-fundamentals-osint-the-intelligence-cycle/
- Opsimathy — The Intelligence Cycle for OSINT Professionals: https://www.opsimathy.co.uk/2025/12/27/the-intelligence-cycle-for-osint-professionals-a-practical-guide/

**Harkly mapping:** Phase 1 (Planning) is the core of Harkly's Collection Plan feature. Phases 2-3 are partially automatable. Phase 4-5 are Harkly's analysis/reporting outputs.

### 3.2 Six-Stage Investigative Framework (Axeligence Model)

A practitioner-level model for investigations:

**Stage 1: Define Investigation Scope and Objectives**
- Create specific intelligence requirements (not broad topics)
- Identify PIRs
- Set investigation boundaries
- Output: Clear investigation blueprint

**Stage 2: Select Relevant OSINT Categories and Tools**
- Match tools to investigation needs
- Decision factors: lifecycle alignment, functional capabilities, technical features
- Common tools: SpiderFoot (200+ modules), theHarvester (30+ data sources), Shodan (IoT/infra), Maltego (visual link analysis), Recon-ng (modular CLI)
- Output: Curated toolset aligned with investigation phases

**Stage 3: Collect Data from Public Sources**
- Passive collection: without target interaction
- Active collection: targeted investigative techniques
- Data sources: domain lookups, social media, public records, geolocation data
- Output: Raw intelligence dataset

**Stage 4: Organize and Filter Raw Data**
- Filter noise, extract relevant intelligence
- Create naming schemes and folder structures
- Build timelines for time-sensitive data
- Standardize into consistent formats
- Output: Structured, filterable dataset

**Stage 5: Analyze Patterns and Relationships**
- Data correlation across multiple sources
- Pattern recognition using relationship mapping
- Cross-referencing with independent sources
- "Human judgment matters more than automation" at this phase
- Output: Identified connections, patterns, insights

**Stage 6: Report Findings**
- Prioritize recommendations by urgency/impact
- Target content to specific stakeholder groups
- Include specific, actionable recommendations
- Document methodology, sources, analytical techniques
- Output: Actionable intelligence deliverables

**Source:** Axeligence OSINT Framework Step-by-Step Guide: https://axeligence.com/osint-framework-a-step-by-step-guide-for-investigators/

**Harkly mapping:** Stages 1-2 map directly to the Collection Plan feature. Stage 4 maps to Harkly's ingestion/tagging. Stage 5-6 map to analysis and reporting.

### 3.3 The 12-Step OSINT Investigative Sequence (OSINT.UK Model)

A more granular operational sequence from practitioners:

1. Define scope with specific goals and key information needs
2. Conduct preliminary general research across search engines and databases
3. Tailor queries using keywords, usernames, and advanced techniques
4. Deploy OSINT tools for IP lookups, reverse image searches, domain research
5. Extract timestamps and metadata from digital files
6. Monitor social media and online communities in real-time
7. Search data breach databases for compromised information
8. Check personal websites and blogs for additional leads
9. Investigate access logs and digital footprints
10. Document findings with timestamps and URLs
11. Verify information from multiple sources
12. Consult experts to bridge information gaps

**Source:** OSINT.UK — The Importance of OSINT Investigative Strategy: https://www.osint.uk/content/the-importance-of-osint-investigative-strategy

**Harkly mapping:** Steps 1-3, 6, 10-11 are directly applicable to a non-technical qualitative researcher using Harkly.

### 3.4 Maltego Workflow: Visual Intelligence Mapping

Maltego is the dominant tool for visual relationship mapping in OSINT:

- Entities (nodes): persons, organizations, domains, IP addresses, email addresses, social accounts
- Transforms: automated enrichment actions that expand from one entity to connected entities
- Workflow: input seed entity → run transforms → visualize relationship graph → identify patterns

Maltego workflow for person-of-interest investigation:
1. Input known identifiers (name, email, username)
2. Run transforms to expand to connected accounts, domains, organizations
3. Visualize the entity graph
4. Identify clusters, anomalies, connection patterns
5. Export findings for reporting

**Source:** Maltego — How to Conduct Person of Interest Investigations: https://www.maltego.com/blog/how-to-conduct-person-of-interest-investigations-using-osint-and-maltego/

**Harkly mapping:** Maltego's entity-relationship model is a useful conceptual model for how Harkly might display relationships between research findings across sources.

### 3.5 JAPAN Ethical Framework for OSINT

Five ethical principles that structure professional OSINT:

- **Justifiable** — clear, legitimate purpose
- **Authorised** — legal compliance
- **Proportionate** — methods balanced with privacy
- **Auditable** — detailed documentation for accountability
- **Necessary** — only essential information collected

**Source:** OSINT.UK — Investigative Strategy: https://www.osint.uk/content/the-importance-of-osint-investigative-strategy

**Harkly mapping:** Harkly's Collection Plan should prompt users to articulate the "Justifiable" and "Necessary" elements as part of the plan.

---

## ANGLE 4 — Collection Management: Multi-Source Coordination

### 4.1 The Admiralty Code (NATO STANAG 2511)

The most widely used system for rating collected intelligence. Dual-axis notation separates source reliability from information credibility.

**Source Reliability (A-F):**

| Grade | Meaning | OSINT Application |
|---|---|---|
| A | Completely reliable | Known, verified source with consistent track record |
| B | Usually reliable | Established source with minor doubts |
| C | Fairly reliable | Source with significant doubts but past validity |
| D | Not usually reliable | Poor track record, occasional valid data |
| E | Unreliable | History of false information; bots, disinfo campaigns |
| F | Cannot be judged | New/unknown source, no basis for evaluation |

**Information Credibility (1-6):**

| Grade | Meaning | OSINT Application |
|---|---|---|
| 1 | Confirmed | Multiple independent trusted sources confirm |
| 2 | Probably true | Consistent with known intelligence, not independently confirmed |
| 3 | Possibly true | Somewhat consistent, requires further verification |
| 4 | Doubtful | Plausible but lacks confirmation |
| 5 | Improbable | Contradicts known TTPs or established facts |
| 6 | Cannot be judged | Insufficient or conflicting information |

**Critical design principles:**
- Source reliability and information credibility must be evaluated **separately** to avoid bias
- A trusted source can provide false information; unreliable sources occasionally provide accurate data
- Do not let an A1 rating create false security — always verify
- Never customize the scale — interoperability requires standardization
- Reassess dynamically as more evidence accumulates

**Practical integration:**
- Tag all CTI through MISP using "Admiralty Scale" taxonomy
- Automate escalation rules in SIEM for B2+ ratings
- A1 = immediate action required; D4 = monitor only; E-rating = monitor for corroboration only

**Sources:**
- SANS Institute — Enhance your CTI with the Admiralty System: https://www.sans.org/blog/enhance-your-cyber-threat-intelligence-with-the-admiralty-system/
- SOS Intelligence — Evaluating OSINT: https://sosintel.co.uk/evaluating-osint-why-it-matters-and-how-to-do-it-right/
- Blockint — Critical Review of the Admiralty Code: https://www.blockint.nl/intel-analysis/critical-review-of-the-admiralty-code/
- Matthew Wold — Intelligence Grading: Why the Admiralty Code Matters: https://www.matthewwold.net/post/intelligence-grading-why-the-admiralty-code-matters

**Harkly mapping:** Harkly should incorporate source reliability tagging (at minimum a simplified A/B/C/D scale) and information credibility rating for each finding. This is a core UX pattern for a research tool.

### 4.2 Gap Analysis — Tracking What's Missing

Gap analysis is the method for identifying what information is still needed after initial collection. The Nixintel four-question framework:

1. **What do I know?** — Document all confirmed information from gathered data
2. **What does this mean?** — Interpret significance and connections
3. **What do I need to know?** — Identify missing pieces required to progress
4. **How do I find out?** — Only then select tools/resources to fill gaps

Key insight: **thinking about tools and resources is only addressed at question four.** Most investigators make the mistake of tool-first thinking. Method-first, question-first, tool-last.

Example from practice: Rather than searching all 136 EasyJet airport destinations, gap analysis narrowed to fewer than 15 by identifying runway type (07/25) first, then confirmed location through architectural matching. Each gap identified led to a specific, answerable question rather than open-ended exploration.

**Sources:**
- Nixintel — Using Gap Analysis to Keep OSINT Investigations On Track: https://nixintel.info/osint/using-gap-analysis-to-keep-osint-investigations-on-track/
- Nixintel — Using Gap Analysis for Smarter OSINT: https://nixintel.info/osint/using-gap-analysis-for-smarter-osint-quiztime-4th-march-2020/
- SOS Intelligence — OSINT Essentials Planning Recording Evaluating: https://sosintel.co.uk/osint-essentials-planning-recording-and-evaluating-intelligence/

**Harkly mapping:** Gap analysis should be a first-class feature in Harkly's Collection Plan. After initial collection, show users what's still missing from their research requirements.

### 4.3 Collection Plan vs Gap Analysis Cycle

The relationship between collection planning and gap analysis is iterative, not linear:

```
Define Requirements (PIR/SIR)
  ↓
Create Collection Plan (sources × requirements matrix)
  ↓
Execute Collection
  ↓
Gap Analysis (4-question framework)
  ↓
If gaps exist → refine collection plan → collect again
  ↓
When gaps closed → proceed to analysis
```

**Harkly mapping:** Harkly's UX should make this cycle visible. A "requirements coverage" view showing which PIRs have been addressed and which still have gaps.

### 4.4 Source Matrix / Collection Matrix

A collection matrix maps requirements to sources to methods. Typical format:

| Requirement ID | PIR/SIR statement | Source type | Specific source | Collection method | Status | Coverage score |
|---|---|---|---|---|---|---|
| PIR-1 | Why do PMs avoid user interviews? | Primary | r/ProductManagement | Keyword search + thread analysis | Collected | A2 |
| SIR-1.1 | What substitutes are being used? | Secondary | Industry blogs | Google Dork + RSS | In progress | — |
| SIR-1.2 | What does the data show on volume? | Tertiary | NNG annual report | Direct access | Not started | — |

**Source:** Forge Institute OSINT 104 Collections Management — Intelligence Synchronization Matrix concept: https://www.forge.institute/courses/osint-104

**Harkly mapping:** This matrix IS the core data model for Harkly's Collection Plan feature. Each row = a research requirement. Each column = a collection dimension. Status tracking enables progress visibility.

### 4.5 Deduplication and Source Normalization

Processing phase activities (before analysis):
- Remove redundant information from multiple collection events
- Normalize formats (date formats, entity names, URL formats)
- Tag entities (person, organization, location, claim) consistently
- Document collection timestamp and source provenance for each item
- Version control — track modifications to collected findings

Tools: Maltego (entity deduplication), spreadsheets, Airtable, custom Python scripts

**Source:** Opsimathy — Intelligence Cycle for OSINT Professionals: https://www.opsimathy.co.uk/2025/12/27/the-intelligence-cycle-for-osint-professionals-a-practical-guide/

**Harkly mapping:** Harkly should auto-deduplicate similar findings and prompt users to normalize entity references (e.g., "UX researcher" = "user researcher" = "UXR").

---

## ANGLE 5 — Best Practices & Lifehacks from the OSINT Community

### 5.1 Michael Bazzell — Methodology, Workflow, Documentation, Ethics

Michael Bazzell (FBI Cyber Crimes Task Force, 20+ years) wrote the definitive practical guide. Key methodology insights from OSINT Techniques (11th Edition, 2024):

- Entire section on **Methodology, Workflow, Documentation, and Ethics** — "provides a clear game plan for active investigations"
- New chapters (11th Ed.) cover: Broadcast Streams, APIs, Data Leaks, Data Breaches, Stealer Logs, Ransomware
- Training curriculum: 200+ video lessons, 700+ pages PDF notes, 200+ practical exercises
- Emphasis on repeatable, documented workflows as the foundation of professional OSINT

**Core Bazzell methodology principles:**
1. Define the exact target and purpose before any collection
2. Use passive collection by default
3. Document everything with timestamps
4. Verify before concluding — never act on single-source intelligence
5. Maintain OPSEC throughout (separate investigation identity from personal)

**Source:** IntelTechniques — OSINT Techniques Book: https://inteltechniques.com/books.html

**Harkly mapping:** Bazzell's emphasis on pre-collection definition and documentation is directly applicable. Harkly should enforce "define before you collect" as a workflow gate.

### 5.2 Trace Labs — Passive-Only Collection Discipline

Trace Labs (nonprofit, missing persons CTF) enforces strict passive-only collection. Key lessons:

- **Passive collection only** — view but never engage; no direct interaction with targets or their networks
- **Zero-touch reconnaissance** — avoid interrupting ongoing investigations or causing harm
- **Team coordination** — one coordinator manages submissions while others collect; division of labor prevents duplication
- **Gamified category system** — intelligence organized into categories with points; forces systematic collection rather than random exploration
- **Real-time vetting** — volunteer judges verify all submissions before they count

The categories used in Trace Labs CTF provide a natural collection taxonomy:
- Basic personal information (name, age, location)
- Social media profiles
- Known associates/relationships
- Financial information
- Physical location indicators
- Digital footprints
- Employment/education records

**Sources:**
- Trace Labs — Search Party CTF: https://www.tracelabs.org/initiatives/search-party
- Dark Roast Security — Trace Labs CTF write-up: https://medium.com/dark-roast-security/tracelabs-missing-persons-ctf-8942ecd3b6c3
- Trace Labs OSINT Foundations Course: https://academy.osintcombine.com/p/tracelabstraining

**Harkly mapping:** The Trace Labs category system maps well to a "collection taxonomy" feature in Harkly — pre-defined categories of findings that users populate. The zero-touch principle → ethical guardrails in Harkly's collection guidance.

### 5.3 Bellingcat — Verification-First Investigation Methodology

Bellingcat's MH17 investigation (2014) established the gold standard for open-source verification methodology:

**What they collected:**
- Social media photos and videos (200+ soldier profiles from 53rd Brigade)
- Satellite imagery (for geolocation)
- Eyewitness accounts (from social media)
- Historical tracking data (Buk missile launcher convoy route)

**How they planned collection:**
- Started with a known artifact (the Buk launcher)
- Worked backwards from the artifact to document its movement
- Used triangulation of independent sources (photos from multiple angles, eyewitness timing)
- Applied geolocation to every image (cross-referenced with satellite imagery)
- Applied chronolocation (sun angle analysis) to verify when images were taken

**Core Bellingcat methodology elements:**
1. **Start with what you have** — known artifacts, confirmed claims
2. **Work systematically backward/forward in time**
3. **Verify every image** — geolocation (landmark comparison with satellite imagery) + chronolocation (shadow analysis)
4. **Crowd-source verification** — publish methodology so others can check
5. **Name contradictions explicitly** — never suppress conflicting evidence
6. **Preserve evidence immediately** — archive before deletion

**Tools used:**
- Google Maps / Earth (geolocation)
- Bellingcat Shadow Finder (shadow-based geolocation)
- Yandex Maps (for Russian-language geographic data)
- Social media archive services
- Metadata extraction tools (ExifTool)

**Sources:**
- Leiden Security Blog — Bellingcat MH17 methodology: https://www.leidensecurityandglobalaffairs.nl/articles/solving-the-mh17-and-the-skripal-case-how-bellingcat-demonstrates-the-power
- OSINT Team — Bellingcat and the MH17 Investigation: https://osintteam.blog/bellingcat-and-the-mh17-investigation-dd5df9df1375
- Bellingcat Online Investigation Toolkit: https://bellingcat.gitbook.io/toolkit

**Harkly mapping:** The Bellingcat verification model translates to: every finding should have geolocation/source verification attached. Harkly should prompt users to tag how each finding was verified, not just what was found.

### 5.4 SANS SEC487 — Structured Collection Training

SANS SEC487 course teaches collection methodology for professionals:

- **Source collection:** Manual and automated methods across social media, public records, websites, dark web
- **Pattern recognition:** Sifting large data volumes, recognizing patterns, structuring results
- **Pivoting:** Using one data point to discover connected data points
- **Hands-on exercises:** Real-world case studies
- **Ethical/legal compliance:** Emphasis on lawful collection throughout

SANS approach to collection order:
1. Define the target precisely
2. Identify what you know vs what you need to know
3. Select sources by highest-value-to-effort ratio
4. Execute with OPSEC maintained
5. Verify, analyze, report

**Source:** SANS — SEC487 Frequently Asked Questions: https://www.sans.org/blog/frequently-asked-questions-sec487-open-source-intelligence-gathering-and-analysis

**Harkly mapping:** The SANS "what you know vs what you need to know" frame is actionable in Harkly's UI — a split view of confirmed findings vs open requirements.

### 5.5 Practitioner Workflow Lifehacks

From the broader practitioner community:

**Tool chaining:** The real power comes from chaining tools together — SpiderFoot → Maltego → manual verification. Each tool feeds the next.

**Repeatable documentation:** Build workflows that are documented enough that someone else (or your future self) can reproduce the investigation. Template your workflows.

**The 4-W's test for any collected item:** Can you say Who created it, What it claims, When it was created, and Where it was published? If any answer is unknown, the item requires more verification before use.

**OPSEC as baseline:** Use VPN + VM + separate research identity for any investigation. Never use personal accounts for OSINT research.

**Automated monitoring for ongoing requirements:** Use RSS feeds, Google Alerts, Social-Searcher for requirements that need continuous tracking rather than one-time collection.

**The "nothing new" refresh technique:** Before declaring collection complete, re-examine all collected data from a different angle. MrSOSINT's principle: "Look again." Old data often yields new pivots when viewed with fresh context.

**Sources:**
- Trickest — OSINT Automation Guide: https://trickest.com/blog/osint-automation-guide/
- LifeRaft — OSINT Automation Workflow: https://liferaftlabs.com/blog/start-to-finish-guide-to-osint-automation
- OSINT Roadmap 2025: https://osintguide.com/2024/11/14/osint-roadmap/
- MrSOSINT — Nothing New? Look Again: https://www.mrsosint.com/nothing-new-look-again/

**Harkly mapping:** Automated monitoring requirements → Harkly could offer "watch" mode for ongoing research. The documentation discipline → Harkly enforces source tagging as a non-optional field.

---

## ANGLE 6 — Case Studies: Real OSINT Investigations

### 6.1 Bellingcat MH17 — The Blueprint Case

**Research question:** Who shot down Malaysia Airlines MH17 on July 17, 2014, over eastern Ukraine?

**Collection planning:**
- The investigation was initiated with publicly available photos and videos from social media
- No formal collection plan was written — Bellingcat pioneered the method as they went
- Retro-reconstruction: they worked from artifact (Buk launcher) backward to establish chain of custody

**Collection sources used:**
- Facebook, VKontakte (Russian social network) — 200+ soldier profiles identified
- YouTube, Instagram — convoy photos and videos
- Commercial satellite imagery (DigitalGlobe)
- Eyewitness accounts posted to social media
- Russian military databases
- Flight tracking data

**Collection techniques:**
- Geolocation of every image against Google Maps/Yandex Maps
- Chronolocation (shadow angles) to verify dates/times
- Cross-referencing convoy route across dozens of independent witness photos
- Reverse image search to find related images not caught by direct search

**Key insight for Harkly:** The investigation succeeded because they enforced **independent triangulation** — no claim was accepted without corroboration from at least two independent sources pointing to the same conclusion. The method of documenting each verification step is what made it legally defensible.

**Sources:**
- Bellingcat — MH17 Open Source Evidence: https://www.bellingcat.com/app/uploads/2015/10/MH17-The-Open-Source-Evidence-EN.pdf
- Bellingcat — MH17 Three Years Later: https://www.bellingcat.com/news/uk-and-europe/2017/07/17/mh17-open-source-investigation-three-years-later/

### 6.2 Corporate Competitive Intelligence — Hedge Fund Model

**Research question:** What is the likely direction of a company's next product launch?

**Collection planning:**
- Systematic monitoring of: competitors' websites, social media posts, press releases, public filings, patent databases
- Job postings (reveals strategic priorities — if they're hiring ML engineers for a specific vertical, that signals product direction)
- Conference talks and Q&A sessions
- Third-party analyst commentary
- Patent filing analysis (reveals R&D focus 12-24 months before launch)

**Example from practice:** Hedge funds used AI-driven OSINT to track market sentiment on X and Reddit during the 2021 GameStop short squeeze — real-time social sentiment was a leading indicator of trading behavior.

**Collection workflow:**
1. Define competitive intelligence requirements (what decisions need intelligence?)
2. Identify signal sources by priority (job postings > conference talks > press releases)
3. Set monitoring frequency (job postings: weekly scan; patents: monthly)
4. Track changes over time (new job postings appearing = strategy shift)
5. Synthesize into quarterly competitive intelligence report

**Sources:**
- Asher Law — Role of OSINT in Competitive Intelligence: https://asher-law.com/the-role-of-osint-in-competitive-intelligence-and-market-sentiment-analysis/
- Xenon Intelligence — OSINT in Corporate Strategy: https://www.xenonintelligence.com/blog/the-role-of-open-source-intelligence-osint-in-corporate-strategy/

**Harkly mapping:** The corporate CI model — systematic, scheduled, role-assigned monitoring against defined requirements — is exactly the workflow Harkly should enable for qualitative researchers tracking a market/audience over time.

### 6.3 Missing Persons — Trace Labs CTF Model

**Research question:** Where is a specific missing person likely located?

**Collection planning:**
- Subject: known information (name, last known location, social media profiles)
- Categories to populate: basic info, social media, associates, financial, location indicators, digital footprint, employment/education
- Method: passive-only, no direct contact
- Coordination: one coordinator, multiple collectors, real-time submission vetting

**Collection sequence (practical):**
1. Aggregate all known information first (before any active searching)
2. Run username across all major platforms (Namechk, Sherlock tool)
3. Google Dork the full name + variations
4. Check LinkedIn, Facebook, Instagram with site: operator
5. Reverse image search all profile photos
6. Check data breach databases (HaveIBeenPwned, etc.)
7. Check public records databases
8. Map known associates → expand to their public profiles for additional leads
9. Document all findings with source, timestamp, confidence level

**Sources:**
- Trace Labs — Search Party: https://www.tracelabs.org/initiatives/search-party
- CTFtime — Trace Labs OSINT CTF: https://ctftime.org/ctf/482/

**Harkly mapping:** The Trace Labs collection sequence translates to a "systematic sweep" checklist that Harkly could offer as a starting template for person/organization research.

---

## ANGLE 7 — Query Formulation: How OSINT Analysts Search

### 7.1 Google Dorking — Advanced Search Query Architecture

Google Dorks combine operators to find specific information not accessible through normal searches.

**Core operators:**

| Operator | Function | Example |
|---|---|---|
| `site:` | Restrict to domain | `site:reddit.com UX research burnout` |
| `intitle:` | Keyword in page title | `intitle:"customer interview" decline` |
| `inurl:` | Keyword in URL | `inurl:blog "product manager" tools` |
| `intext:` | Keyword in body | `intext:"we stopped doing" interviews` |
| `filetype:` | Filter by file type | `filetype:pdf "OSINT collection plan"` |
| `"exact phrase"` | Exact string match | `"qualitative research" "AI tool"` |
| `-` | Exclude term | `UX research -tools -template` |
| `OR` | Alternative terms | `UXR OR "user researcher" burnout` |
| `*` | Wildcard | `"the * of user research"` |
| `around(n)` | Proximity search | `interview around(5) decline` |

**Advanced combinations:**
- Multi-operator stacking: `site:linkedin.com/in intitle:"UX Researcher" "Figma"`
- Domain + content: `site:.edu intext:"qualitative research" methodology filetype:pdf`
- Exclusion refinement: `site:reddit.com r/UXResearch interview -tool -AI`
- Temporal: `site:medium.com UX research after:2024`

**Sources:**
- NEOSPLOIT — Master Google Dorking: https://neospl0it.github.io/master-google-dorking-advanced-search-techniques
- Recorded Future — What are Google Dorks: https://www.recordedfuture.com/threat-intelligence-101/threat-analysis-techniques/google-dorks
- Authentic8 — Intro to Advanced Search and Google Dorking: https://www.authentic8.com/blog/osint-need-knows-intro-advanced-search-and-google-dorking
- ShadowDragon — Google Dorks Generator: https://shadowdragon.io/blog/dork-assistant/
- Digital Stakeout — Automating Google Dorking: https://www.digitalstakeout.com/post/automating-google-dorking-advanced-search-techniques-for-osint-professionals

**Harkly mapping:** Harkly could offer a "Query Builder" that translates plain-language research questions into optimized search operators. Users describe what they want to find; Harkly generates the dork.

### 7.2 Twitter/X Advanced Search Operators

**Author-based:**
- `from:@username` — posts from specific account
- `to:@username` — replies directed at account
- `@username` — all mentions

**Temporal:**
- `since:YYYY-MM-DD` — posts after date
- `until:YYYY-MM-DD` — posts before date

**Content filters:**
- `filter:images` — image posts only
- `filter:videos` — video posts only
- `filter:links` — posts with links only
- `lang:en` — English posts only

**Geolocation:**
- `near:city` — posts from users near a city
- `geocode:lat,long,radius` — posts within geographic radius
- Example: `"breaking news" near:London` or `protest geocode:48.8566,2.3522,10km`

**Complex combinations:**
- `from:authentic8 OR from:darknetshopper OSINT filter:videos lang:en`
- `"user research" since:2024-01-01 until:2024-06-30 -template -tool`

**Google Dorks for X:**
- `site:twitter.com inurl:status "UX research" after:2024`
- `site:twitter.com inurl:lists intitle:"OSINT"`

**Note:** Twitter API restrictions post-2023 have broken many automated tools (Twint, GetOldTweets3). Manual search and official API are now the primary access methods.

**Source:** Authentic8 — Twitter X OSINT Advanced Search: https://www.authentic8.com/blog/twitter-x-osint

**Harkly mapping:** Platform-specific search operator templates — users pick a platform, Harkly provides the search syntax.

### 7.3 Reddit OSINT Search Operators

**Google-powered Reddit search:**
- `site:reddit.com [keyword]` — search all of Reddit
- `site:reddit.com r/UXResearch [keyword]` — search specific subreddit
- `site:reddit.com/r/ProductManagement inurl:"comments" [keyword]` — search comment sections specifically

**Native Reddit search filters:**
- Sort by: Relevance, Hot, New, Top, Comments
- Time filters: Past hour, day, week, month, year, all time
- Type filters: Posts, Comments, Communities, Users

**Third-party Reddit analysis tools:**
- **Reveddit** — retrieves deleted posts and comments
- **Redective** — analyzes user activity patterns, subreddit engagement metrics
- **Redditmetis** — visual analysis of last 1000 comments and submissions
- **Pushshift** (limited) — historical Reddit data (significant API restrictions since 2023)

**User profile investigation:**
- Profile images → reverse image search (TinEye, PimEyes)
- Account karma + cake day → establish account age and activity level
- Post/comment history → identify expertise, opinions, affiliations
- Trophy cases → verify verified accounts

**Source:** PageFreezer — The Reddit OSINT/SOCMINT Investigation Guide: https://blog.pagefreezer.com/the-reddit-osint-socmint-investigation-guide

**Harkly mapping:** Reddit is a primary qualitative signal source for Harkly's target audience (PMs, UX researchers). Harkly should optimize for Reddit collection with built-in operator templates.

### 7.4 LinkedIn Search Operators (Google-Mediated)

LinkedIn restricts internal search for non-logged-in users, but Google indexing exposes public profiles:

- `site:linkedin.com/in intitle:"UX Researcher"` — find researcher profiles
- `site:linkedin.com/in "Product Manager" "user research" "Figma"` — find PMs mentioning specific tools
- `site:linkedin.com/company "new hire" "user research"` — track hiring signals

**For competitive intelligence:**
- `site:linkedin.com [competitor company] "recently joined"` — identify new hires
- `site:linkedin.com intitle:"[competitor]" job postings` — track strategic hiring

**Source:** Social Searcher — Manual Search Guide Essential Google Operators for OSINT: https://www.social-searcher.com/2025/12/24/the-manual-search-guide-essential-google-search-operators-for-osint/

**Harkly mapping:** LinkedIn operator templates for person and organization research.

### 7.5 Boolean Search Logic for Systematic Collection

Boolean operators translate research questions into executable queries:

- **AND (default/implicit):** Narrows results — `UX research AND interviews AND decline`
- **OR (widen scope):** Broadens results — `"user interview" OR "customer interview" OR "research session"`
- **NOT (-):** Excludes noise — `research -AI -tool -template -course`
- **Quotes (exact phrase):** Requires exact sequence — `"we stopped doing user research"`

**Query building process:**
1. Identify the core concept (1-2 words)
2. Add synonyms with OR
3. Add specificity with AND for context terms
4. Exclude noise sources with NOT
5. Add site/filetype operators to target source type
6. Test and iterate — review 10 results, adjust operators

**Source:** OSINT.org — OSINT Tutorial for Market Researchers: https://osint.org/comprehensive-osint-tutorial-for-market-researchers/

**Harkly mapping:** Harkly's research question → query translation layer should apply Boolean logic automatically. Users write natural language; Harkly generates optimized Boolean queries.

### 7.6 Pivoting — Expanding from One Data Point to Many

Pivoting is the art of using one confirmed data point to unlock additional data points:

**Pivot types by data category:**
- **Email address pivot:** Username → other accounts using same username; Domain → other email users at organization; Full email → data breach lookup
- **Username pivot:** Username → cross-platform profile search (Sherlock, Namechk); Username → associated accounts on same platform
- **Domain pivot:** Domain → WHOIS registration data → registrant email → other domains by same registrant
- **Image pivot:** Reverse image search → other locations the image appears; EXIF metadata → GPS coordinates, device, timestamp
- **Name pivot:** Full name → social profiles; Name + location → LinkedIn, local news, court records
- **Phone number pivot:** Phone → carrier lookup; Phone → social accounts (if number used for registration)

**The pivot decision framework:**
1. What data point do I have that is confirmed?
2. What categories of connected data might exist?
3. Which pivot type has highest probability of yielding new information?
4. Execute the highest-value pivot first
5. Document each pivot step (to retrace if needed)

**Visual aids for pivoting:**
- Mind maps (Mindmeister, XMind, Obsidian Canvas)
- Maltego entity graphs
- Simple spreadsheets with entity → connected entities columns

**Sources:**
- D4rk_Intel — Advanced OSINT: The Art of Pivoting: https://preciousvincentct.medium.com/advanced-osint-the-art-of-pivoting-e042b785a5f7
- Hatless1der — Advanced OSINT: The Art of Pivoting: https://hatless1der.com/advanced-osint-the-art-of-pivoting/
- OSINT From Scratch — Geolocation, pivoting, collaboration: https://osint-fromscratch.medium.com/geolocation-pivoting-collaboration-three-pillars-for-an-osint-beginner-5cbd3633d92

**Harkly mapping:** Harkly's Collection Plan should support "pivot tracking" — when a finding leads to a new collection direction, that branching should be documented in the plan.

---

## ANGLE 8 — IC OSINT Strategy 2024-2026: Official Standards

### 8.1 IC OSINT Strategy Overview

The ODNI/CIA released the IC OSINT Strategy 2024-2026, defining OSINT as:
> "Intelligence derived exclusively from publicly or commercially available information that addresses specific intelligence priorities, requirements, or gaps."

**Key strategic pillars:**
1. **Embrace new technologies** — AI, ML, human language technologies for collection and evaluation
2. **Reimagine industry/academia partnerships** — leverage private-sector OSINT capabilities
3. **Tradecraft modernization** — continuously updated standards for the open source domain
4. **Workforce development** — flexible training updated regularly to keep pace with change
5. **IC OSINT Executive** — centralized oversight and alignment across IC OSINT activities

**Strategic direction for collection:**
- OSINT enables and enhances all other intelligence collection disciplines
- Gap analysis against priority collection requirements is formalized in the strategy
- AI/ML is the primary accelerant for collection at scale

**Source:** IC OSINT Strategy 2024-2026 — ODNI: https://www.dni.gov/index.php/newsroom/reports-publications/reports-publications-2024/3785-the-ic-osint-strategy-2024-2026

**Harkly mapping:** The IC's formalization of OSINT as a strategic discipline validates Harkly's product direction. The emphasis on requirement-gap mapping is directly translatable to product design.

### 8.2 Passive vs Active Collection — Operational Distinction

**Passive collection (default mode):**
- No target interaction — view only, never engage
- Username searches, data breach lookups, content preservation, historical records
- OPSEC: target unaware of investigation
- Legal risk: minimal (viewing public information)
- Examples: reading posts, looking up WHOIS, accessing public databases

**Semi-passive collection:**
- Sends internet traffic to target servers (mimics normal browsing)
- Does not implement in-depth investigation; only light reconnaissance
- Target may log the traffic but cannot identify it as investigative
- Examples: visiting a public website, checking DNS records

**Active collection:**
- Direct interaction with target system or persons
- Includes: sending friend requests, private messages, using tracking links
- Target may become aware of investigation
- Inherent risk: alerting target, exposing investigation identity
- Legal considerations: varies significantly by jurisdiction and purpose
- Examples: social engineering, port scanning, creating sock puppet for engagement

**Decision rule:** Default to passive. Use active only when necessary, documented, legally reviewed, and proportionate to the investigation need.

**Sources:**
- ConsilAD — Active or Passive OSINT: https://consilad.com/active-or-passive-osint/
- OSINT.UK — Investigative Strategy: https://www.osint.uk/content/the-importance-of-osint-investigative-strategy

**Harkly mapping:** For a qualitative research tool, all collection should be passive. Harkly's ethical framework should make this explicit in the product.

---

## ANGLE 9 — AI-Augmented OSINT Collection (2025-2026)

### 9.1 AI Capabilities in OSINT Collection

Current AI applications in professional OSINT collection:

**Automated collection:**
- AI-powered web crawlers harvest public data from social media, news, forums, archives
- Adapt to website layout variations; extract only relevant data
- Monitor thousands of sources simultaneously

**Natural Language Processing:**
- Named Entity Recognition (NER) — identify people, organizations, locations, dates in text
- Sentiment analysis — assess emotional valence of discussions
- Topic modeling — identify emerging themes across large document sets
- Cross-language intelligence — translate and analyze non-English sources

**Pattern recognition:**
- Anomaly detection in large datasets
- Network analysis — identify relationships between entities
- Timeline construction from disparate date-stamped sources

**Image/video analysis:**
- Facial recognition across images
- EXIF metadata extraction at scale
- Geolocation assistance (shadow analysis, landmark matching)

**Sources:**
- TechTarget — How to enhance OSINT investigations using AI: https://www.techtarget.com/searchenterpriseai/tip/How-to-enhance-OSINT-investigations-using-AI
- Barracuda — How AI can assist OSINT researchers: https://blog.barracuda.com/2025/02/18/ai-assist-osint-researchers
- Web Asha — AI-Powered OSINT Tools in 2026: https://www.webasha.com/blog/ai-powered-osint-tools-in-2025-how-artificial-intelligence-is-transforming-open-source-intelligence-gathering

**Harkly mapping:** These AI capabilities are the foundation of Harkly's value proposition. Specifically: NER for entity extraction from collected sources, sentiment analysis for signal classification, and automated topic modeling for gap identification.

### 9.2 AI Caution in OSINT — Fabricated Intelligence

A critical risk in AI-augmented OSINT (2025-2026):

**Problem:** LLM-generated content floods secondary and tertiary source layers with plausible-sounding but fabricated statistics and facts.

**Detection heuristics:**
- Suspiciously round numbers ("67% of researchers say...")
- No original methodology section or raw data link
- Studies that cannot be verified in Google Scholar
- Dates that are vague or contradictory within the same article

**Rule:** Never cite a statistic that cannot be traced to a primary study or a named survey with disclosed methodology.

**Source:** Multiple OSINT methodology sources consistently flag this as the #1 collection quality problem in 2025.

**Harkly mapping:** Harkly should include source provenance verification as a required field. AI should flag when a cited claim lacks a traceable origin.

---

## SYNTHESIS: What This Means for Harkly's Collection Plan Feature

### Core Insights for Product Design

**1. The Collection Plan is a structured document, not a search session.**
Professional OSINT planners create a formal plan before any collection starts. The plan maps requirements to sources to methods. Harkly should produce a tangible, shareable artifact.

**2. Requirements decomposition is the hardest and most valuable step.**
Moving from "I want to understand X" to a set of specific, answerable PIRs and SIRs is where most research fails. Harkly should guide this with AI-assisted decomposition.

**3. The Source Matrix / Collection Matrix is the core data model.**
Rows = requirements. Columns = sources, methods, status, confidence scores. This matrix should be the heart of Harkly's Collection Plan UI.

**4. Gap analysis drives iterative collection.**
After each collection cycle, users need to see: what's answered, what's still open, what's contradicted. This should be a visual summary in Harkly.

**5. Admiralty Code scoring (simplified) is the right credibility framework.**
A simplified A-D source reliability + 1-4 information credibility dual-axis score is appropriate for Harkly's research context. Users need a way to express confidence without learning full NATO tradecraft.

**6. Query generation should be automatic.**
Users should describe what they want to find in natural language. Harkly converts that to optimized search operators (Google Dorks, Twitter operators, Reddit operators) for each source platform.

**7. Pivot tracking captures the research branching.**
When a finding opens a new collection direction, Harkly should track the parent-child relationship between the original requirement and the emergent sub-investigation.

**8. Passive collection only — enforce ethically.**
All Harkly collection guidance should assume passive methods. The ethical framework (JAPAN principles) should be baked into the product UX, not just the ToS.

**9. Documentation is non-optional.**
Every collected item needs: source URL, collection timestamp, source reliability grade, information credibility grade, and verification status. These fields should be enforced, not optional.

**10. The intelligence cycle is a loop, not a pipeline.**
Harkly's UX should make the cycle visible: Define → Plan → Collect → Process → Analyze → Gap Analysis → Refine Plan → Collect again. Requirements completion percentage should be visible at all times.

### Recommended Harkly Collection Plan Structure

Based on all research, the optimal Collection Plan document structure for Harkly:

```
Collection Plan: [Research Topic]
Date: | Researcher: | Status: [Draft / Active / Complete]

SECTION 1 — RESEARCH BRIEF (Why)
- Central research question (plain language)
- Decision this research supports
- Success criteria (what does "done" look like?)
- Scope definition (in/out of scope)
- Ethical statement (JAPAN framework)

SECTION 2 — REQUIREMENTS (What)
- PIR-1: [Priority Intelligence Requirement — main question]
  └── SIR-1.1: [Sub-question 1]
  └── SIR-1.2: [Sub-question 2]
- PIR-2: [second main question]
  └── SIR-2.1...

SECTION 3 — COLLECTION MATRIX (Where + How)
| Req ID | Requirement | Source Layer | Specific Source | Method | Query | Status | Score |
|---|---|---|---|---|---|---|---|
| PIR-1 | ... | Primary | Reddit r/UXResearch | Keyword search | site:reddit.com r/UXResearch "interview" | Active | — |
| SIR-1.1 | ... | Secondary | NNG blog | Google Dork | site:nngroup.com "user interview" 2024 | Not started | — |

SECTION 4 — GAP TRACKER (What's missing)
- Answered requirements: [list]
- Open requirements: [list]
- Contradicted findings: [list with contradiction description]

SECTION 5 — FINDINGS INVENTORY
- [Each finding: claim, source, date, reliability grade, credibility grade, verified Y/N]

SECTION 6 — ANALYSIS NOTES
- Patterns identified
- Contradictions and how resolved
- Confidence level for each PIR

SECTION 7 — RECOMMENDED NEXT STEPS
- Pivots to pursue
- Additional sources to consult
- Expert validation needed
```

---

## ANGLE 10 — Military Collection Management Process (FM 34-2): Deepest Structural Template

### 10.1 The Six-Step Collection Management Process

The U.S. Army's FM 34-2 Collection Management process is the most structurally complete model for systematic intelligence collection. It provides the template that all other OSINT collection frameworks adapt from.

**Step 1: Develop Requirements**
- Record ALL requirements — create audit trail from origin to satisfaction
- Validate: Is it feasible? Complete? Necessary?
- Consolidate similar requirements (prevent duplication)
- Prioritize by: justification strength, specificity, time-phasing, commander's intent alignment
- Output: Prioritized list of WHAT needs to be collected, WHERE, and WHEN

**Step 2: Develop Collection Plan**
Three criteria for evaluating collection assets:
- **Availability** — which sources can be accessed?
- **Capability** — what can each source actually provide?
- **Performance History** — which sources have proven reliable?

Four collection strategy techniques:
- **Cueing** — use one source to direct collection by others (e.g., a Reddit thread cues a LinkedIn search)
- **Redundancy** — multiple independent sources for high-priority requirements
- **Mix** — complementary multi-discipline coverage (primary + secondary + tertiary)
- **Integration** — add requirements to existing collection activities (efficiency)

SIR sets break requirements into specific sub-questions: what, where, when.

**Step 3: Task Sources**
Convert SIRs into specific directives for each collection source. Example military format:
> "Report presence of reconnaissance vehicles in NAI 8 between 041800-052000. Specify direction, numbers, types. Latest Time Information Is of Value (LTIOV): 060400."

Adapted for OSINT research:
> "Collect practitioner discussions about AI replacing user research roles on Reddit r/UXResearch between Jan 2024 - Jan 2025. Capture: volume trends, sentiment, specific pain points. Needed by: [date]."

**Step 4: Monitor Collection**
- Track which requirements have active collection underway
- Identify gaps where no collection is happening
- Redirect excess capability to unsatisfied high-priority requirements

**Step 5: Evaluate Reporting**
Screen all collected items for:
- **Pertinence** — does this actually address the requirement?
- **Completeness** — is the information sufficient to answer the SIR?
- **Timeliness** — is it fresh enough to be useful?
- **Cueing opportunities** — does this finding open new collection directions?

Categorize each requirement as: Fully satisfied / Partially satisfied / Outstanding

**Step 6: Update Collection Planning**
- Eliminate satisfied requirements
- Redirect assets from satisfied to unsatisfied requirements
- Exploit cueing opportunities identified in Step 5
- Incorporate new requirements
- Maintain synchronization with changing operational timeline

The process is **cyclic, not linear** — continuously generating new requirements while satisfying existing ones.

**Sources:**
- FM 34-2 Appendix A — Collection Plan Format: https://irp.fas.org/doddir/army/fm34-2/Appa.htm
- FM 34-2 Chapter 3 — Collection Management Process: https://irp.fas.org/doddir/army/fm34-2/Ch3.htm

**Harkly mapping:** This six-step cycle is the definitive process model for Harkly's Collection Plan workflow. Each step has a corresponding UX state that Harkly should make visible.

### 10.2 The Intelligence Synchronization Matrix (ISM)

The ISM is the primary artifact of the collection plan. It:
- Links requirements to decision points and timelines
- Records Named Areas of Interest (NAIs) — locations/contexts where required information can be found
- Reflects enemy activity timelines (adapted: reflects research subject behavior patterns)
- Provides structure for collection tasks

**ISM column structure:**
| SIR # | Time Window | NAI/Context | SIR Description | PIR Supported | Collector | Capability Check | Priority Rank |
|---|---|---|---|---|---|---|---|

**Adapted for OSINT research:**
| SIR # | Time Range | Source Context | Research Question | PIR Supported | Collection Method | Source Capability | Priority |
|---|---|---|---|---|---|---|---|
| SIR-1.1 | Q1 2024 – Q1 2025 | r/UXResearch | How often are practitioners reporting AI replacement fear? | PIR-1 | Thread keyword search | Reddit search + Reveddit | High |

**Source:** FM 34-2 Appendix A: https://irp.fas.org/doddir/army/fm34-2/Appa.htm

**Harkly mapping:** The ISM is the exact format Harkly's Collection Plan table should implement. NAI = "source context" (subreddit, site, community). The matrix format is battle-tested over decades.

### 10.3 Collection Plan Formats — Visual Alternatives

The FM 34-2 approach accepts multiple format types for the collection plan:

1. **Worksheet format** (tabular matrix — most common) — links PIR → NAI → SIR → Agency → Time
2. **5×8 card file** (visual, color-coded by priority) — rapid reference for field use
3. **Prioritization matrix** (weighted scoring) — assigns numeric weights to each PIR, scores indicators by breadth of support
4. **Visual indicator worksheet** — for each PIR, lists all indicators and which SIR they satisfy

**Key principle:** "The collection plan has NO prescribed doctrinal format." The format should serve the analyst, not constrain them.

**Source:** FM 34-2 Appendix A: https://irp.fas.org/doddir/army/fm34-2/Appa.htm

**Harkly mapping:** Harkly should offer multiple views of the same Collection Plan data: table view (ISM-style), card view (for rapid scanning), priority matrix view (for resource allocation decisions).

### 10.4 SOR (Specific Orders and Requests) — The Tasking Artifact

A SOR converts a SIR into a specific collection directive for a source/analyst. Key characteristics:
- Directs a specific source to collect specific information in a specific location and time window
- Includes LTIOV (Latest Time Information Is of Value) — the deadline after which the data is no longer useful
- Links back to the SIR number for tracking

SOR format elements:
1. What information is needed
2. Where (specific source, context, platform)
3. When (time window + deadline)
4. How to report findings
5. Reference SIR number

**Source:** FM 34-2 Chapter 3: https://irp.fas.org/doddir/army/fm34-2/Ch3.htm

**Harkly mapping:** Each row in Harkly's Collection Matrix is effectively a SOR — it tasks a specific collection action against a specific requirement. Adding "deadline" (LTIOV equivalent) makes each row an actionable task, not just a plan element.

---

## ANGLE 11 — Qualitative Research Collection Plans: Academic/UX Context

### 11.1 Standard Qualitative Research Plan Sections

Academic qualitative research proposals (which inform how professional researchers think about collection planning) use this structure:

1. **Introduction** — research topic overview and target audience
2. **Background** — problem or opportunity being addressed
3. **Objectives** — specific research goals
4. **Research Paradigm** — interpretive, constructivist, etc.
5. **Research Questions** — the core questions driving collection
6. **Research Design** — case study, ethnography, grounded theory, etc.
7. **Research Method** — specific data collection methods (interviews, observation, document analysis)
8. **Ethical Considerations** — consent, privacy, harm avoidance
9. **Sampling Strategy** — purposive sampling rationale (not random — richness-based)
10. **Data Collection Plan** — sources, instruments, timeline
11. **Analysis Plan** — how data will be processed and interpreted
12. **Dissemination** — how findings will be shared

**Key difference from OSINT:** Qualitative research plans specify **data collection instruments** (interview guides, observation protocols) rather than collection sources. The parallel to OSINT's SIR is the qualitative research question.

**Sources:**
- Reforge — Research Plan Templates: https://www.reforge.com/blog/research-plan-templates
- Writing Center UTK — Drafting Qualitative Research Project: https://writingcenter.utk.edu/drafting-your-qualitative-research-project/

**Harkly mapping:** Harkly serves researchers who think in both OSINT terms (structured collection) and qualitative research terms (exploratory, emergent). The Collection Plan feature needs to bridge both paradigms.

### 11.2 UX Research Collection Planning

UX/product research uses a simplified version of the full intelligence collection cycle:

**Research plan components (Reforge model):**
1. Research question (the PIR equivalent)
2. Hypotheses to test
3. Method selection (interviews, surveys, usability tests, secondary research)
4. Participant/source criteria
5. Data collection protocol
6. Analysis approach
7. Timeline and stakeholders

**UX research source selection decision tree:**
- Exploratory (what?) → qualitative: interviews, ethnography, forum analysis
- Explanatory (why?) → qualitative: depth interviews, diary studies
- Validating (how many?) → quantitative: surveys, analytics
- Discovery (we don't know what we don't know) → OSINT + qualitative

**The "when to use which method" model (NN/g):**
Research questions along two axes: behavioral vs attitudinal × qualitative vs quantitative. OSINT collection maps to: "What do people say publicly?" = attitudinal + qualitative.

**Sources:**
- Nielsen Norman Group — When to Use Which Research Methods: https://www.nngroup.com/articles/which-ux-research-methods/
- Reforge — Research Plan Templates: https://www.reforge.com/blog/research-plan-templates
- Great Question — UX Research Methods Guide: https://greatquestion.co/blog/ux-research-methods-guide

**Harkly mapping:** Harkly's Collection Plan feature should integrate UX research thinking (research question → method selection → participant/source criteria) with OSINT structure (PIR → SIR → collection matrix → gap analysis). This integration is Harkly's unique value.

---

## Source Index

| # | URL | Source | Section |
|---|---|---|---|
| 1 | https://kravensecurity.com/intelligence-collection-plan/ | Kraven Security — CTI Collection Plan 2025 | 1.2 |
| 2 | https://knowledge.threatconnect.com/docs/best-practices-intelligence-requirements | ThreatConnect — Intelligence Requirements Best Practices | 1.2 |
| 3 | https://www.silobreaker.com/glossary/osint-collection-plan/ | Silobreaker — OSINT Collection Plan Glossary | 1.3 |
| 4 | https://www.tarlogic.com/blog/data-collection-plan-intelligence-cycle/ | Tarlogic — Data Collection Plan | 1.3 |
| 5 | https://www.forge.institute/courses/osint-104 | Forge Institute — OSINT 104 Collections Management | 1.4, 4.4 |
| 6 | https://iacis.org/iis/2024/3_iis_2024_81-93.pdf | IACIS — ICD 203 Analysis | 1.5 |
| 7 | https://www.recordedfuture.com/threat-intelligence-101/intelligence-sources-collection/osint-framework | Recorded Future — OSINT Framework | 2.1 |
| 8 | https://shadowdragon.io/blog/osint-techniques/ | ShadowDragon — OSINT Techniques 2026 | 2.3 |
| 9 | https://www.authentic8.com/blog/osint-gathering-best-practices | Authentic8 — OSINT Gathering Best Practices | 2.4 |
| 10 | https://www.fivecast.com/blog/osint-fundamentals-osint-the-intelligence-cycle/ | Fivecast — Five Steps of the Intelligence Cycle | 3.1 |
| 11 | https://www.opsimathy.co.uk/2025/12/27/the-intelligence-cycle-for-osint-professionals-a-practical-guide/ | Opsimathy — Intelligence Cycle for OSINT Professionals | 3.1, 4.5 |
| 12 | https://axeligence.com/osint-framework-a-step-by-step-guide-for-investigators/ | Axeligence — OSINT Framework Step-by-Step | 3.2 |
| 13 | https://www.osint.uk/content/the-importance-of-osint-investigative-strategy | OSINT.UK — Investigative Strategy | 3.3, 3.5, 8.2 |
| 14 | https://www.maltego.com/blog/how-to-conduct-person-of-interest-investigations-using-osint-and-maltego/ | Maltego — Person of Interest Investigations | 3.4 |
| 15 | https://www.sans.org/blog/enhance-your-cyber-threat-intelligence-with-the-admiralty-system/ | SANS — Admiralty System for CTI | 4.1 |
| 16 | https://sosintel.co.uk/evaluating-osint-why-it-matters-and-how-to-do-it-right/ | SOS Intelligence — Evaluating OSINT | 4.1 |
| 17 | https://nixintel.info/osint/using-gap-analysis-to-keep-osint-investigations-on-track/ | Nixintel — Gap Analysis for OSINT | 4.2 |
| 18 | https://sosintel.co.uk/osint-essentials-planning-recording-and-evaluating-intelligence/ | SOS Intelligence — OSINT Essentials Planning | 4.2, 4.5 |
| 19 | https://inteltechniques.com/books.html | IntelTechniques — Bazzell OSINT Techniques | 5.1 |
| 20 | https://www.tracelabs.org/initiatives/search-party | Trace Labs — Search Party CTF | 5.2, 6.3 |
| 21 | https://www.leidensecurityandglobalaffairs.nl/articles/solving-the-mh17-and-the-skripal-case-how-bellingcat-demonstrates-the-power | Leiden — Bellingcat MH17 Analysis | 5.3, 6.1 |
| 22 | https://bellingcat.gitbook.io/toolkit | Bellingcat Online Investigation Toolkit | 5.3 |
| 23 | https://www.sans.org/blog/frequently-asked-questions-sec487-open-source-intelligence-gathering-and-analysis | SANS — SEC487 FAQ | 5.4 |
| 24 | https://trickest.com/blog/osint-automation-guide/ | Trickest — OSINT Automation Guide | 5.5 |
| 25 | https://asher-law.com/the-role-of-osint-in-competitive-intelligence-and-market-sentiment-analysis/ | Asher Law — OSINT in Competitive Intelligence | 6.2 |
| 26 | https://neospl0it.github.io/master-google-dorking-advanced-search-techniques | NEOSPLOIT — Master Google Dorking | 7.1 |
| 27 | https://www.authentic8.com/blog/twitter-x-osint | Authentic8 — Twitter X OSINT | 7.2 |
| 28 | https://blog.pagefreezer.com/the-reddit-osint-socmint-investigation-guide | PageFreezer — Reddit OSINT Guide | 7.3 |
| 29 | https://www.social-searcher.com/2025/12/24/the-manual-search-guide-essential-google-search-operators-for-osint/ | Social Searcher — Manual Search Guide | 7.4 |
| 30 | https://osint.org/comprehensive-osint-tutorial-for-market-researchers/ | OSINT.org — Market Researcher Tutorial | 7.5 |
| 31 | https://preciousvincentct.medium.com/advanced-osint-the-art-of-pivoting-e042b785a5f7 | D4rk_Intel — Art of Pivoting | 7.6 |
| 32 | https://www.dni.gov/index.php/newsroom/reports-publications/reports-publications-2024/3785-the-ic-osint-strategy-2024-2026 | ODNI — IC OSINT Strategy 2024-2026 | 8.1 |
| 33 | https://consilad.com/active-or-passive-osint/ | ConsilAD — Active vs Passive OSINT | 8.2 |
| 34 | https://www.techtarget.com/searchenterpriseai/tip/How-to-enhance-OSINT-investigations-using-AI | TechTarget — AI in OSINT | 9.1 |
| 35 | https://osintguide.com/2024/11/14/osint-roadmap/ | OSINT Guide — Roadmap 2025 | 5.5 |
| 36 | https://www.neotas.com/open-source-investigation-best-practices/ | Neotas — Open Source Investigation Best Practices | 5.5 |
| 37 | https://hackyourmom.com/en/kibervijna/taktyka-vykorystannya-analizu-progalyn-dlya-prodovzhennya-osint-rozsliduvan/ | HackYourMom — Tactics for Gap Analysis in OSINT | 4.2 |
| 38 | https://irp.fas.org/doddir/army/fm34-2/Appa.htm | FM 34-2 Appendix A — Collection Plan Formats | 10.1, 10.2, 10.3 |
| 39 | https://irp.fas.org/doddir/army/fm34-2/Ch3.htm | FM 34-2 Chapter 3 — Collection Management Process | 10.1, 10.4 |
| 40 | https://www.reforge.com/blog/research-plan-templates | Reforge — Research Plan Templates | 11.1, 11.2 |
| 41 | https://www.nngroup.com/articles/which-ux-research-methods/ | Nielsen Norman Group — When to Use Which Research Methods | 11.2 |
| 42 | https://writingcenter.utk.edu/drafting-your-qualitative-research-project/ | UTK Writing Center — Qualitative Research Project | 11.1 |
| 43 | https://greatquestion.co/blog/ux-research-methods-guide | Great Question — UX Research Methods Guide | 11.2 |
| 44 | https://en.wikipedia.org/wiki/Intelligence_collection_management | Wikipedia — Intelligence Collection Management | 1.2 |
| 45 | https://www.army.mil/article/285410/priority_intelligence_requirement_management_in_divisions_and_corps | U.S. Army — PIR Management | 1.2 |
| 46 | https://osintteam.blog/bellingcat-and-the-mh17-investigation-dd5df9df1375 | OSINT Team — Bellingcat MH17 Investigation | 5.3, 6.1 |
| 47 | https://blog.sociallinks.io/what-is-open-source-intelligence-osint-in-2025/ | Social Links — What is OSINT in 2025 | 2.1 |
| 48 | https://www.neotas.com/osint-sources-social-media-osint/ | Neotas — OSINT Sources Social Media | 2.2 |
| 49 | https://www.barracuda.com/2025/01/09/understanding-osint-modern-research | Barracuda — OSINT in Modern Research | 2.4 |
| 50 | https://medium.com/@pizzasteve/a-practical-osint-methodology-tools-notes-and-workflow-fbf027fdc0bc | Ahmed Mohammed — Practical OSINT Methodology | 3.2 |

---

*Research status: COMPLETE — 2026-03-18*
*Next step: Hand to Product/Design for Collection Plan feature specification*
