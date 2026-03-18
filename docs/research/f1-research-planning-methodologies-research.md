# Research Planning Methodologies — Beyond OSINT
> Purpose: Drive Collection Plan design for Harkly (AI qualitative research tool for PMs)
> Created: 2026-03-18 | Status: IN PROGRESS

---

## Contents

1. [Systematic Review Protocols](#1-systematic-review-protocols)
2. [Qualitative Research Design](#2-qualitative-research-design)
3. [UX/Design Research Plans](#3-uxdesign-research-plans)
4. [Market Research & Competitive Intelligence](#4-market-research--competitive-intelligence)
5. [Academic Research Methodology](#5-academic-research-methodology)
6. [Mixed Methods Design](#6-mixed-methods-design)
7. [Research Plan Templates & Structures](#7-research-plan-templates--structures)
8. [Collection Strategy by Source Type](#8-collection-strategy-by-source-type)
9. [Best Practices & Lifehacks](#9-best-practices--lifehacks)
10. [Case Studies](#10-case-studies)
11. [Synthesis for Harkly](#11-synthesis-for-harkly)

---

<!-- FINDINGS APPENDED BELOW AS RESEARCH PROGRESSES -->

---

## 1. Systematic Review Protocols

### PRISMA 2020

**Source:** [PRISMA Statement](https://www.prisma-statement.org/) | [PMC Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC8007028/)

**What it is:** Preferred Reporting Items for Systematic Reviews and Meta-Analyses. A 27-item checklist for reporting systematic reviews, plus a 12-item abstract checklist. Updated in 2020.

**Key insight for Harkly — Collection Plan section: Search Strategy**

The PRISMA #7 Search Strategy item mandates: "Present the full search strategies for all databases, registers and websites, including any filters and limits used." This is a direct analog to Harkly's "where will I look" layer of a collection plan.

PRISMA-S (extension for search reporting) adds a 16-item checklist specifically for documenting search processes:
- Databases searched (with date ranges)
- Search syntax per database
- Filters applied
- Deduplication approach
- Number of results per database

**Key insight for Harkly — Collection Plan section: Protocol Registration**

PRISMA-P (Protocol) is the pre-review version: 17-item checklist for documenting *intent* before collection begins. Critically — the protocol is registered before any data collection, establishing bias prevention. Harkly analogy: the research plan is a commitment document, not just a guide.

---

### Cochrane Systematic Review Protocol

**Source:** [Cochrane Handbook Chapter 3](https://training.cochrane.org/handbook/current/chapter-03) | [Protocol Development Guide (Covidence)](https://www.covidence.org/wp-content/uploads/2024/10/A_practical_guide_Protocol_Development_for_Systematic_Reviews.pdf)

**PICO Framework for Eligibility Criteria:**

| Element | Meaning | Question it answers |
|---|---|---|
| **P** | Population | Who are we studying? |
| **I** | Intervention | What is being done? |
| **C** | Comparator | Compared to what? |
| **O** | Outcome | What are we measuring? |

Cochrane distinguishes "Review PICO" (setting the question) from "Synthesis PICO" (how data will be grouped for analysis). This two-level PICO is important: the research question and the analysis groupings are specified separately.

**Key insight for Harkly:** Eligibility criteria (inclusion/exclusion) are PICO-derived and pre-specified in the protocol. For a PM using Harkly, this maps to: "Who qualifies as a valid source for this question?" Harkly's collection plan should have a participant/source eligibility layer.

**PROSPERO Registration:**

PROSPERO is the international register for systematic review protocols. What researchers must submit to register:
- Review question and objectives
- PICO specification
- Eligibility criteria (inclusion/exclusion)
- Information sources (databases, registers, websites)
- Search strategy (at least one complete example)
- Data extraction plan
- Risk of bias assessment approach
- Synthesis method

**Key insight for Harkly:** PROSPERO registration = accountability layer. The plan is public and timestamped. Harkly could offer a "lock and publish" function for research plans — confirming intent before collection begins.

---

### Systematic Search Strategy Development (15-Step Method)

**Source:** [PMC article: systematic approach to searching](https://pmc.ncbi.nlm.nih.gov/articles/PMC6148622/)

The Bramer et al. 15-step method for building a systematic search:

1. Establish a focused question
2. Describe what relevant articles would look like
3. Identify key concepts (disease, intervention, outcome)
4. Select essential elements — NOT all PICO components need to be searched; eliminate what adds noise
5. Choose starting database (recommended: Embase — ~300K Emtree terms vs MeSH's ~220K)
6. Document in text format outside the database (for reproducibility)
7. Find thesaurus terms (controlled vocabulary)
8. Extract synonyms from thesaurus
9. Add term variations (truncation, spelling variants, abbreviations)
10. Apply Boolean operators and field codes
11. **Novel optimization:** search "thesaurus terms NOT free-text terms" and vice versa to find missed synonyms
12. Evaluate results against known benchmark articles
13. Verify accuracy (check for missing operators, parentheses)
14. Translate syntax across databases (using macros)
15. Test iteratively

**Key Boolean structure insight:**
```
concept_1_thesaurus OR concept_1_freetext
AND
concept_2_thesaurus OR concept_2_freetext
AND
concept_3_thesaurus OR concept_3_freetext
```

**Key insight for Harkly — Collection Plan section: Query Construction**

The "write syntax before terms" principle prevents errors. For Harkly: the query structure (AND/OR logic, source types) should be planned before specific search terms are entered. Harkly could enforce this as a UX flow: define the logic scaffold first, then fill in terms.

**Database selection criteria:**
- Thesaurus richness (controlled vocabulary coverage)
- Support for proximity operators
- Coverage of your domain (MEDLINE for medicine, Scopus for multidisciplinary, etc.)

---

## 2. Qualitative Research Design

### Sampling Strategies

**Source:** [PMC: Practical guidance, Part 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC5774281/) | [Springer: Purposeful sampling](https://link.springer.com/article/10.1007/s11846-025-00881-2)

**Three core sampling types:**

| Strategy | When to use | Key criterion |
|---|---|---|
| **Purposive** | You know what profile you need | Information richness — select participants knowledgeable about the phenomenon |
| **Theoretical** | Grounded theory — you don't know yet | Sample to fill gaps in emerging theory; iterate |
| **Snowball** | Hard-to-reach populations | Existing participants refer next participants |

**Sample size by method (empirical guidance, 2024):**

| Method | Saturation range | Notes |
|---|---|---|
| Semi-structured interviews | 9–17 | Homogenous population, narrow aims |
| Cross-site interviews | 20–40 | Seeking patterns across contexts |
| Focus groups | 4–8 | Per group; need multiple groups |
| Web-based interviews | 30–67 | More variation, less rich signals |
| Grounded theory (theoretical saturation) | 20–30+ | Continue until no new concepts emerge |

**Data saturation vs. theoretical saturation:**
- Data saturation = redundancy of data (earlier stopping point, weaker justification)
- Theoretical saturation = no new concepts emerge that affect the theory (later, stronger)
- Practical recommendation: use data saturation as interim milestone, continue to theoretical saturation

**Key insight for Harkly — Collection Plan section: Participant/Source Strategy**

Harkly should prompt users to specify:
1. Sampling strategy (purposive → by profile; theoretical → emergent; snowball → referral chain)
2. Inclusion/exclusion criteria for participants
3. Target sample size with saturation checkpoint
4. Recruitment method

---

### Five Qualitative Approaches and Their Collection Patterns

**Source:** Creswell — Qualitative Inquiry and Research Design (5 approaches)

| Approach | Core question | Primary collection | # Participants | Data emphasis |
|---|---|---|---|---|
| **Narrative** | What is the story of one/a few people's lives? | Long interviews, documents, photos | 1–2 | Chronology, epiphany moments |
| **Phenomenology** | What is the essence of a lived experience? | Interviews only | 5–25 | Bracketing researcher bias; pure description |
| **Grounded Theory** | What theory explains this process? | Interviews + observation | 20–60 (iterative) | Constant comparison; memo-writing |
| **Ethnography** | What are the shared cultural patterns? | Observation + interviews + artifacts | 1 culture-sharing group | Prolonged fieldwork; thick description |
| **Case Study** | What is the deep understanding of this case? | Multiple sources (interviews, docs, observation) | 1–several bounded cases | Triangulation across sources |

**Key insight for Harkly:** Each approach has a different collection logic. Phenomenology = interviews only (purism). Ethnography = observation first, interviews second. Case study = deliberate multi-source triangulation. Harkly's collection plan should ask: "What is your research approach?" and then suggest appropriate source mix.

---

### Interview Guide Design (TEDW Framework)

**Source:** [Dscout research plan guide](https://dscout.com/people-nerds/how-to-write-a-user-research-plan-that-sets-your-project-up-for-success)

**TEDW question structure for qualitative interviews:**
- **T**ell me about...
- **E**xplain to me...
- **D**escribe...
- **W**alk me through...

All are open-ended, non-leading, and elicit narrative rather than yes/no answers.

**Interview guide structure (3 sections):**
1. **Introduction** — sets tone, explains session purpose, consent
2. **Questions** — TEDW-anchored questions derived from research objectives
3. **Wrap-up** — compensation, future participation, gratitude

**Objective-to-question mapping:** Convert each research objective into 3–5 specific interview questions. This ensures full coverage and prevents drift.

**Questions to avoid:**
- Priming/leading questions
- Future-behavior questions (focus on past/present instead)
- Double-barreled questions
- Yes/no questions

---

## 3. UX/Design Research Plans

### Nielsen Norman Group — Research Plan Structure

**Source:** [NN/g: Research Plans: Organize, Document, Inform](https://www.nngroup.com/articles/pm-research-plan/)

**Four core components:**

1. **Purpose and Goals**
   - Product/topic focus
   - Learning objectives
   - Research questions, goals, or hypotheses

2. **Participants**
   - Desired characteristics and sample size
   - Inclusion criteria (required traits)
   - Exclusion criteria (disqualifying traits)

3. **Method and Procedure**
   - Research methodology
   - Session length and tools
   - Study incentives
   - Tasks, prompts, or interview questions
   - Study stimuli (prototypes, designs)

4. **Logistics & Supporting Documents**
   - Facilitator guides
   - Screener questionnaires
   - Consent forms
   - Session dates/times
   - Equipment needs

**Best practices from NN/g:**
- Share with stakeholders to establish buy-in and expectations before starting
- Use participant codes (P1, P2) not real names
- Update after research concludes to reflect actual changes
- Provide observer guidelines for moderated sessions
- Create replicable documentation detailed enough for future studies

---

### User Interviews Field Guide — 7-Step Research Plan Process

**Source:** [User Interviews Research Field Guide](https://www.userinterviews.com/ux-research-field-guide-chapter/create-user-research-plan)

**7 steps:**

| Step | Action |
|---|---|
| 1 | Identify broad research goals |
| 2 | Develop specific research questions |
| 3 | Gather existing data (stakeholder interviews, secondary research, analytics) |
| 4 | Choose appropriate methodology |
| 5 | Design study details |
| 6 | Create recruiting strategy with screener survey |
| 7 | Plan analysis and reporting approach |

**Six-section plan structure:**

| Section | Content |
|---|---|
| Research Questions & Goals | What you're trying to learn; must be specific, practical, actionable |
| Business Goals | How findings will drive organizational decisions |
| Methodology | Approach, methods, tools, duration, timeline |
| Participant Profile | Screening criteria, recruitment strategy, compensation |
| Logistics & Schedule | Tools, team roles, timeline, budget |
| Next Steps & Deliverables | Anticipated outputs, reporting format, insight storage |

**Key insight for Harkly:** Step 3 (gather existing data before choosing method) is critical — it prevents redundant research. Harkly should prompt: "What do you already know?" before users plan collection.

---

### Research Question vs. Interview Question vs. Hypothesis

**Source:** [NN/g video: Research Goals, Questions, Hypotheses](https://www.nngroup.com/videos/research-goals-questions-hypotheses/) | [User Interviews Field Guide](https://www.userinterviews.com/ux-research-field-guide-chapter/user-research-questions)

**The three-level hierarchy:**

| Level | Definition | Example |
|---|---|---|
| **Research Goal** | What you want to learn (broad) | "Understand sign-up abandonment" |
| **Research Question** | Specific, answerable question driving the study | "Why do users who start sign-up not complete it?" |
| **Hypothesis** | A testable prediction | "Users abandon sign-up because the email verification step is unclear" |
| **Interview Question** | What you literally ask participants | "Walk me through the last time you tried to sign up for a new service" |

**Critical rule:** NEVER use research questions directly as interview questions. If participants know your hypothesis, they'll tell you what you want to hear. Research questions are for the researcher; interview questions are for participants.

**Generative vs. Evaluative questions:**

| Type | Asks | Methods |
|---|---|---|
| **Generative** | "What problems should we solve?" | Contextual inquiry, diary studies, interviews |
| **Evaluative** | "How well does our solution work?" | Usability testing, A/B tests, surveys |

---

### dscout Research Plan — Sections and Lifehacks

**Source:** [Dscout](https://dscout.com/people-nerds/how-to-write-a-user-research-plan-that-sets-your-project-up-for-success)

**Seven core components:**
1. **Background** — the "why," central problem statement
2. **Objectives** — what you want to learn AND how you'll study it (must be answerable by conclusion)
3. **Participants** — target user profile, defined via stakeholder workshops + competitive analysis + screener questions
4. **Methodology** — method choice + justification
5. **Interview Guide** — TEDW-anchored questions, 3-section structure
6. **Timeline** — dates for research, recruitment, interviews, synthesis, reporting (approximations are fine)
7. **Resources/Links** — centralized access to recordings, notes, synthesis docs, design tickets

**Bad vs. better objectives:**
- Bad: "Understand why participants order food"
- Better: "Understand the end-to-end journey of how and why participants choose to order food online"

**Key insight for Harkly:** Objectives are the hardest section to write. Harkly should offer AI-assisted objective refinement — taking a vague goal and tightening it to a specific, answerable objective.

---

### UX Research Cheat Sheet — Method Selection by Phase

**Source:** [NN/g UX Research Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/)

**Four phases with corresponding methods:**

| Phase | Goal | Methods |
|---|---|---|
| **Discover** | Understand user needs | Field studies, diary studies, user interviews, stakeholder interviews, competitive testing |
| **Explore** | Define and design | Competitive analysis, design review, persona building, card sorting, task analysis, journey mapping |
| **Test** | Validate | Qualitative usability testing, benchmark testing, accessibility evaluation |
| **Listen** | Ongoing monitoring | Surveys, analytics, search-log analysis, social media monitoring, FAQ analysis |

**Key insight for Harkly:** The phase-method relationship is the backbone of method selection. Harkly's collection plan should ask "what phase are you in?" and auto-suggest appropriate source types.

---

## 4. Market Research & Competitive Intelligence

### Key Intelligence Topics (KITs) and Key Intelligence Questions (KIQs)

**Source:** [ValueNotes: What are KITs and KIQs?](https://www.valuenotes.biz/insights-publications/publications/what-are-kits-and-kiqs/) | [SCIP](https://www.scip.org/page/Competitive-Intelligence-Foundational-Tools-and-Practices) | [Wikibooks: Competitive Intelligence/KITs](https://en.wikibooks.org/wiki/Competitive_Intelligence/Key_Intelligence_Topics_(KITs))

**KIT = category of intelligence need:**
Three types of KITs:
1. **Early Warning** — emerging opportunities and threats ("Am I looking ahead?")
2. **Strategic** — intelligence on competitor strategies ("Am I flying blind?")
3. **Key Competitor** — competitive positioning ("Where do I stand?")

**KIQ = specific question within a KIT:**
- KIT: "Competitor pricing strategy"
- KIQ: "Will Competitor X drop enterprise pricing below $X in Q3?"

**The KIT→KIQ→Collection cascade:**
1. Identify KITs (aligned with strategic objectives, top 1–3)
2. For each KIT, determine what you already know
3. Identify gaps → formulate KIQs
4. Map KIQs to sources
5. Execute collection
6. Analyze and report

**Key insight for Harkly:** The KIT/KIQ framework is a research question hierarchy for competitive intelligence. It maps cleanly to Harkly's research question → sub-question → source mapping flow. The "what do you already know?" step is critical for gap identification.

---

### Intelligence Collection Plan Structure

**Source:** [Kector: Intelligence Collection Plan](https://kector.com/intelligence-collection-plan/)

**Five components of a professional collection plan:**

1. **Intelligence Requirements** — Priority Intelligence Requirements (PIRs) and Essential Elements of Information (EEIs)
2. **Source Identification** — where the information lives
3. **Source Evaluation** — credibility, recency, relevance, completeness, methodology transparency
4. **Collection Methods** — OSINT, HUMINT, SIGINT, IMINT, MASINT, Cyber Intelligence
5. **Timelines and Priorities** — urgency ranking, resource allocation

**Source evaluation five-filter framework:**
1. Credibility (government, academic, established institution?)
2. Recency (current enough for the topic?)
3. Relevance (right population and geography?)
4. Completeness (adequate sample sizes?)
5. Methodology transparency (documented collection process?)

**Proactive vs. reactive collection:**
- Proactive = anticipatory (standing collection against known KITs)
- Reactive = event-driven (triggered by new development)

**Key insight for Harkly:** This five-filter evaluation framework should be a built-in source quality checker. When a Harkly user adds a source to their collection plan, Harkly could prompt evaluation against these five dimensions.

---

### Primary vs. Secondary Research Integration

**Source:** [Contify: Primary vs Secondary Research](https://www.contify.com/resources/blog/reboot-competitive-intelligence-by-leveraging-competitive-intelligence-solution-for-integrating-primary-and-secondary-research/)

**The integration model:**
- Secondary monitoring = early warning system, signal detection, broad coverage
- Primary research = validation of signals, depth on specific questions
- Workflow: secondary surfaces signal → primary validates

**Key insight for Harkly:** Harkly's collection plan should have a primary/secondary layer. Secondary sources (web, reports, social) inform the questions; primary sources (interviews, surveys) answer them. The plan should map which questions go to which source type.

---

### McKinsey/BCG Problem Definition Framework

**Source:** [MECE Framework](https://www.mbacrystalball.com/blog/strategy/mece-framework/) | [Issue Trees](https://strategyu.co/issue-tree/)

**MECE principle:** Mutually Exclusive, Collectively Exhaustive
- All sub-questions must be non-overlapping
- Together they must cover the entire problem space

**Issue Tree structure:**
```
Problem/Question
├── Sub-question A
│   ├── Sub-sub-question A1
│   └── Sub-sub-question A2
├── Sub-question B
│   └── ...
└── Sub-question C
    └── ...
```

**McKinsey 8-step problem-solving process:**
1. Define the problem precisely
2. Disaggregate into sub-issues (issue tree)
3. Prioritize sub-issues
4. Build a work plan (who collects what by when)
5. Conduct analysis
6. Synthesize findings
7. Develop recommendations
8. Communicate

**Hypothesis-led approach (BCG/McKinsey default):**
- Form an initial hypothesis first
- Design collection to test the hypothesis
- Efficient when problem is complex and data incomplete

**Key insight for Harkly:** MECE decomposition = the architecture of a good research plan. Research questions should be MECE. Harkly could offer an issue tree builder as the first step of planning — decompose the research problem before selecting sources.

---

## 5. Academic Research Methodology

### Research Proposal Structure (PhD/Thesis)

**Source:** [Scribbr: How to Write a Research Proposal](https://www.scribbr.com/research-process/research-proposal/) | [GradCoach: Methodology Chapter](https://gradcoach.com/how-to-write-the-methodology-chapter/)

**Standard PhD research proposal structure:**
1. Title and abstract
2. Introduction and problem statement
3. Research questions/objectives
4. Literature review (with gap identification)
5. **Research methodology** — includes:
   - Research approach (qual/quant/mixed)
   - Sampling strategy (who, how many, why)
   - Data collection instruments
   - Data collection procedure
   - Data analysis plan
   - Validity/reliability/trustworthiness considerations
6. Ethical considerations
7. Timeline
8. Budget

**Methodology chapter specifics:**
- Research approach (philosophical stance: positivism, interpretivism, pragmatism)
- Research design (experimental, survey, case study, ethnography, etc.)
- Sampling strategy rationale
- Data collection instruments (interview guide, survey, observation protocol)
- Analysis method (thematic analysis, content analysis, regression, etc.)

**Key insight for Harkly:** The research methodology chapter is essentially a collection plan with philosophical scaffolding. The key elements Harkly needs from this: approach, sampling strategy, instruments, analysis plan.

---

### NIH Research Plan Structure

**Source:** [NIAID: Write Your Research Plan](https://www.niaid.nih.gov/grants-contracts/write-research-plan) | [NIH Grants](https://grants.nih.gov/grants-process/write-application/advice-on-application-sections)

**NIH R01 Research Strategy (three mandatory sections):**
1. **Significance** — why is this important? What gap does it fill?
2. **Innovation** — what is new about this approach?
3. **Approach** — how will you do it? (includes Specific Aims, Preliminary Studies, methods)

**Specific Aims page (1 page, high impact):**
- Background and context
- Central hypothesis
- 3 specific aims (testable, completable in 4–5 years)
- Innovation statement
- Impact statement

**Key insight for Harkly:** The Specific Aims page is the most concise research planning format in existence. One page captures: problem → hypothesis → 3 aims → expected outcomes. Harkly could use this as a "research brief" template for PMs.

---

### EU Horizon Europe — Methodology Section Requirements

**Source:** [EuGrantMe: Concept and Methodology Section](https://www.eugrant.me/how-to-write-the-concept-and-methodology-section-of-horizon-europe-proposals-a-guide/)

**Methodology section requirements:**
1. Overall concept (underlying models, assumptions, interdisciplinary approach)
2. Methodological approach for achieving objectives
3. Open Science practices integration
4. Interdisciplinary collaboration description
5. Data Management Plan (FAIR principles: Findable, Accessible, Interoperable, Reusable)
6. Ethical considerations

**Key insight for Harkly:** The FAIR data principles (Findable, Accessible, Interoperable, Reusable) are a framework for evaluating sources. A source that produces FAIR data is higher quality for research purposes.

---

## 6. Mixed Methods Design

### Three Core Designs

**Source:** [Harvard Catalyst: Basic Mixed Methods Designs](https://catalyst.harvard.edu/community-engagement/mmr/) | [Atlas.ti: Mixed Methods Research Designs](https://atlasti.com/guides/the-guide-to-mixed-methods-research/mixed-methods-research-designs)

| Design | Sequence | Planning logic |
|---|---|---|
| **Convergent Parallel** | Qual + Quant simultaneously → compare | Use when you want to compare/contrast two data types; most efficient |
| **Explanatory Sequential** | Quant first → Qual to explain | Use when quantitative results need deeper explanation |
| **Exploratory Sequential** | Qual first → Quant to generalize | Use when you need to understand before you measure |

**When to choose which:**
- Use **convergent** when you have resources for parallel tracks and want triangulation
- Use **explanatory** when you have quantitative data (e.g., analytics, surveys) with surprising/unclear results
- Use **exploratory** when the phenomenon is new and you don't know what to measure yet

**Key insight for Harkly:** The mixed methods design choice is fundamentally a sequencing decision. Harkly's collection plan should surface this: "Are you collecting sources in parallel or in a sequence? If sequential, which informs which?"

---

## 7. Research Plan Templates & Structures

### Common Sections Across All Research Plan Templates

Synthesized from: NN/g, User Interviews, dscout, Miro, Asana, Reforge, UserTesting, parallelhq

| Section | Purpose | What goes here |
|---|---|---|
| **Title / Project name** | Identification | Research project name, version, date |
| **Background / Context** | Why this research | Problem statement, what triggered this study |
| **Research objectives** | What you want to learn | 2–5 specific, answerable objectives |
| **Research questions** | Operationalization of objectives | Specific questions the study will answer |
| **Hypotheses** (optional) | Predictions to test | Evaluative studies; not always present in generative |
| **Scope** | Boundaries | What's in/out, which product areas, geography |
| **Methodology** | How you'll collect | Method(s) with rationale; tools; session design |
| **Participant / Source criteria** | Who/what qualifies | Inclusion/exclusion criteria, screener |
| **Sample size** | How many | Target N with saturation/confidence justification |
| **Recruitment plan** | How you'll find participants | Channels, incentives, timeline |
| **Collection schedule** | When | Timeline for each phase |
| **Analysis plan** | How you'll make sense of data | Coding approach, synthesis method, who analyzes |
| **Deliverables** | What comes out | Reports, presentations, repository artifacts |
| **Stakeholders** | Who needs this | Decision-makers, team members, approvers |
| **Budget** | Resources needed | Incentives, tools, researcher time |
| **Ethical considerations** | Consent, privacy, bias | Consent forms, data handling, bias mitigation |
| **Supporting docs** | Links | Screener, consent form, discussion guide, existing data |

**Key insight for Harkly:** This is the canonical collection plan structure. Not all sections are needed for every study — Harkly should offer a "simple" vs. "comprehensive" template with smart defaults.

---

### Airbnb "Ask a Guest Anything" Research Program

**Source:** [Dscout Airbnb case study](https://dscout.com/case-studies/airbnb-case-study) | [UX Design Institute case studies](https://www.uxdesigninstitute.com/blog/real-world-ux-research-case-studies/)

**Planning approach:** Stakeholder-driven question collection before research design.
- Outreach to stakeholders: "If you could ask a guest anything, what would you ask?"
- Collect and categorize stakeholder questions
- Prioritize questions
- Translate into research activities (with Dscout Special Services)
- Execute

**Key insight for Harkly:** This is the "stakeholder question harvest" pattern. Before designing a research plan, collect raw questions from stakeholders — then translate them into structured research questions. Harkly could facilitate this upstream step.

**Airbnb check-in tool discovery:**
- Not a formal study — continuous behavioral monitoring
- 1.5M photo messages/week from hosts to guests
- Pattern discovery → product hypothesis → validation study

**Key insight for Harkly:** Behavioral signals can be a research source type in the collection plan. Harkly should support "behavioral data" as a source category alongside interviews and surveys.

---

### Spotify — Multi-Method Research Planning

**Source:** [UX Design Institute case studies](https://www.uxdesigninstitute.com/blog/real-world-ux-research-case-studies/)

**Planning logic:** Quantitative first (A/B testing) → qualitative to explain anomalies
- When A/B test results were inconclusive, qualitative interviews revealed the emotional dimension
- The "delight" finding (personalized greetings) only emerged from interviews, not from metrics

**Key insight for Harkly:** This is explanatory sequential mixed methods in practice. Harkly should prompt: "Do you have quantitative data that needs explanation?" as a trigger for follow-up qual research planning.

---

## 8. Collection Strategy by Source Type

### Triangulation Framework

**Source:** [Looppanel: Triangulation in Qualitative Research](https://www.looppanel.com/blog/triangulation-in-qualitative-research) | [PubMed: Use of Triangulation](https://pubmed.ncbi.nlm.nih.gov/25158659/)

**Four types of triangulation (Denzin 1978):**

| Type | What varies | Purpose |
|---|---|---|
| **Data/Source** | Who you collect from | Cross-verify findings across participants or groups |
| **Investigator** | Who analyzes | Reduce individual analyst bias |
| **Theory** | Interpretive lens | Understand phenomenon through multiple frameworks |
| **Methodological** | How you collect | Combine interview + observation + document analysis |

**Triangulation matrix application:**
Map each research question to multiple source types:

| Research Question | Interviews | Surveys | Behavioral Data | Documents |
|---|---|---|---|---|
| Why do users churn? | ✓ (primary) | ✓ (scale) | ✓ (pattern) | ✓ (support logs) |
| What features are used? | - | ✓ | ✓ (primary) | - |

**Key insight for Harkly:** The triangulation matrix is the collection plan's source layer. Harkly should offer a matrix view: research questions on one axis, source types on the other, with cell-level planning.

---

### Source Type Matrix by Research Phase

Synthesized from NN/g Cheat Sheet + Intelligence Collection frameworks:

| Source Type | Best for | Generative? | Evaluative? | Scale |
|---|---|---|---|---|
| **In-depth interviews** | Motivation, context, meaning | ✓✓ | ✓ | Low (n=5–30) |
| **Focus groups** | Social dynamics, shared perceptions | ✓✓ | ✓ | Medium (n=6–10/group) |
| **Diary/journal studies** | Longitudinal behavior, context-in-action | ✓✓ | ✓ | Medium |
| **Surveys** | Prevalence, validation, quantification | ✓ | ✓✓ | High |
| **Usability tests** | Task performance, friction points | - | ✓✓ | Low–Medium |
| **Analytics/behavioral data** | What users do (not why) | ✓ | ✓✓ | Very High |
| **Field observation** | Real-world context, workarounds | ✓✓ | - | Low |
| **Document analysis** | Existing knowledge, historical context | ✓✓ | ✓ | Variable |
| **Competitive analysis** | Industry patterns, benchmarks | ✓✓ | ✓ | Medium |
| **Social listening** | Unsolicited opinions, emerging themes | ✓✓ | ✓ | High |
| **Support ticket analysis** | Pain points, frequency | ✓✓ | ✓ | High |
| **Expert interviews** | Domain knowledge, edge cases | ✓✓ | ✓ | Low |
| **Secondary research** | Background, existing evidence | ✓✓ | - | Variable |

---

## 9. Best Practices & Lifehacks

### From ResearchOps Community — 8 Pillars

**Source:** [Medium: The Eight Pillars of User Research](https://medium.com/researchops-community/the-eight-pillars-of-user-research-1bcd2820d75a) | [NN/g: ResearchOps 101](https://www.nngroup.com/articles/research-ops-101/)

**Eight pillars (from 300+ survey + 33 workshops):**
1. **Environment** — physical and digital spaces for conducting research
2. **Scope** — what's in/out of research function
3. **People** — who conducts, who receives research
4. **Organizational context** — how research fits in the org
5. **Recruitment and admin** — participant sourcing and logistics
6. **Data and knowledge management** — how insights are stored, tagged, retrieved
7. **Governance** — ethical review, consent, data handling standards
8. **Tools and infrastructure** — software, hardware, systems

**Knowledge management insight:** "Data and knowledge management sits at the center. It's where years of studies, notes, and clips become shared memory." Minimum Viable Taxonomy (MVT Level 1) = a taxonomy for indexing research documents.

**Key insight for Harkly:** A collection plan isn't complete without a "where does this go?" plan. Harkly should include a storage/tagging plan in every research plan — connecting collection to the knowledge repository.

---

### Teresa Torres — Continuous Discovery Framework

**Source:** [Product Talk / Great Question: Continuous Discovery Guide](https://greatquestion.co/blog/continuous-discovery-guide)

**Core definition:** "At a minimum, weekly touchpoints with customers by the team building the product where they conduct small research activities in pursuit of a desired outcome."

**Key principles:**
- Weekly cadence over big-bang studies
- Small, focused activities (30 minutes each)
- The team building the product conducts research (not outsourced)
- Opportunity Solution Tree (OST) to organize insights

**Opportunity Solution Tree structure:**
```
Desired Outcome
└── Opportunity Area 1 (need/pain/desire)
    ├── Solution A
    └── Solution B
└── Opportunity Area 2
    └── Solution C
```

**Prioritization criteria:**
- Opportunity sizing (how many affected, how often?)
- Market factors (competitive landscape, external trends)
- Company factors (strategic coherence, feasibility)

**Research cadence planning:**
- Weekly: 30-min customer touchpoints
- Monthly: synthesis and OST update
- Quarterly: OST prioritization review

**Key insight for Harkly:** Continuous discovery = a research plan that is rolling, not one-off. Harkly should support both "single study" and "continuous cadence" planning modes. The OST is a planning artifact Harkly could generate.

---

### Jobs to be Done — Switch Interview Protocol

**Source:** [Thoughtbot Playbook: Switch Interviews](https://thoughtbot.com/playbook/rapid-product-validation/switch-interviews) | [JTBD.info](https://jobstobedone.org/)

**Switch interview: planning requirements**
- Find recent switchers (within 60 days of decision)
- Duration: 60–90 minutes
- Focus: reverse-engineer the decision timeline

**Switch timeline structure:**
1. **First Thought** — when did they first consider changing?
2. **Passive Looking** — what did they do while casually exploring options?
3. **Trigger Event** — what pushed them from passive to active?
4. **Active Looking** — what options did they evaluate?
5. **Decision** — what tipped them over?
6. **Aftermath** — reflections after the switch

**Four Forces of Progress (data extraction framework):**
- **Push** — dissatisfaction with current solution (driving toward new)
- **Pull** — attraction to new solution
- **Anxiety** — fear/uncertainty about switching
- **Habit/Inertia** — comfort with current that resists change

**Intercom's formalized JTBD process:**
1. 45 initial phone interviews (broad spectrum: new, churned, long-term)
2. Deep dive on 15 selected interviews (2-day process)
3. Extract: pushes, pulls, anxieties, habits, hiring/firing reasons, trade-offs
4. Codify patterns in software
5. Mathematical analysis of patterns
6. Report

**Key insight for Harkly:** JTBD switch interviews have a highly structured collection protocol with a defined timeline, a specific participant type (recent switchers), and a specific extraction framework (Four Forces). Harkly could offer this as a pre-built research plan template.

---

### Experienced Researcher Lifehacks (Synthesized)

From: dscout, User Interviews, NN/g, ResearchOps, JTBD practitioners

1. **Do stakeholder interviews before participant interviews** — understand what decisions the research will inform before designing collection
2. **Do secondary research before primary** — avoid rediscovering what's already known
3. **Write your analysis plan before collecting** — determines what data you need; prevents post-hoc rationalization
4. **Map objectives to questions to sources before starting** — ensures every objective has a collection mechanism
5. **Screener surveys <10 questions** — longer screeners reduce response rates and don't improve quality
6. **The 15-minute plan rule** — a well-written research plan takes 15 minutes to write and saves hours of chaos later
7. **Lock the plan before collection begins** — changes after collection starts introduce bias
8. **Plan for what you'll do when you're wrong** — what happens if your hypothesis is disconfirmed?
9. **Research to learn, not to validate** — approaching with genuine inquiry mindset (avoid confirmation bias)
10. **Document the research question, not just the findings** — future researchers need to know why you studied what you studied

---

## 10. Case Studies

### Case Study A: Airbnb — Behavioral Signal Discovery

**Source:** [Dscout Airbnb Case Study](https://dscout.com/case-studies/airbnb-case-study)

**Problem:** No clear research question — emerging from continuous monitoring
**Collection:** Behavioral data (photo message volume and content analysis)
**Trigger:** 1.5M photo messages/week → pattern recognition
**Follow-on research:** Design thinking — empathize → define → ideate → prototype → test
**Research plan type:** Exploratory → builds toward a defined question

**Lesson:** Behavioral monitoring can be a discovery layer that generates research questions. Not all research plans start with a question — some start with a signal.

---

### Case Study B: Google for Education — Crisis-Driven Research

**Source:** [UX Design Institute case studies](https://www.uxdesigninstitute.com/blog/real-world-ux-research-case-studies/)

**Problem:** COVID-19 suddenly changed how teachers used Meet (video conferencing)
**Collection:** Direct stakeholder interviews with teachers and administrators
**Planning:** Rapid, unstructured, need-driven — questions were: "What's broken right now?"
**Timeline:** Very short (days, not weeks)
**Output:** Feature prioritization for rapid iteration

**Lesson:** Research planning adapts to urgency. Rapid research plans sacrifice comprehensiveness for speed. The plan format shifts from "systematic" to "sufficient."

---

### Case Study C: Spotify — Mixed Methods Resolution

**Source:** [UX Design Institute case studies](https://www.uxdesigninstitute.com/blog/real-world-ux-research-case-studies/)

**Problem:** A/B test results were inconclusive — couldn't explain user behavior from metrics alone
**Collection Phase 1:** Quantitative (A/B testing, longitudinal studies)
**Collection Phase 2:** Qualitative (follow-up interviews to explain quantitative anomaly)
**Design:** Explanatory sequential mixed methods
**Finding:** Emotional dimension (delight at personalized greetings) not visible in metrics

**Lesson:** Plan for an "explain" phase after quantitative collection. Mixed methods sequencing should be part of the research plan, not an afterthought.

---

### Case Study D: Intercom — JTBD Large-Scale Interview Study

**Source:** [Intercom: Jobs-to-be-Done book and blog](https://www.intercom.com/resources/books/intercom-jobs-to-be-done)

**Problem:** Understand why customers hire Intercom
**Collection:** 45 phone interviews (structured participant mix: new, churned, long-term)
**Deep analysis:** 15 selected interviews analyzed over 2 days with The Rewired Group
**Extraction framework:** Four Forces (push, pull, anxiety, inertia)
**Analysis evolution:** 60-day analysis cycle compressed to 1 week via formalized debrief process

**Lesson:** Large-scale qual research requires a formalized extraction protocol. The data extraction framework (Four Forces) is specified in the research plan, not improvised during analysis.

---

## 11. Synthesis for Harkly

### Universal Collection Plan Structure (synthesized across all domains)

Drawing from PRISMA, Cochrane, NIH, UX research, CI, academic methodology, and JTBD:

**Layer 1 — Research Intent**
- Research objective (what you want to learn)
- Research questions (specific, answerable)
- Hypotheses (optional; for evaluative studies)
- Business goals (what decisions this informs)
- Study type (generative / evaluative / mixed)

**Layer 2 — Scope and Eligibility**
- Scope definition (what's in/out)
- Participant/source inclusion criteria
- Participant/source exclusion criteria
- Geographic/temporal boundaries

**Layer 3 — Collection Design**
- Research approach (qual / quant / mixed)
- If mixed: design type (convergent / explanatory sequential / exploratory sequential)
- Phase (Discover / Explore / Test / Listen)
- Primary methods selected (with rationale)
- Secondary sources (with rationale)
- Source triangulation plan (which questions → which sources)

**Layer 4 — Sampling and Recruitment**
- Sampling strategy (purposive / theoretical / snowball)
- Target sample size with saturation justification
- Recruitment channels
- Screener criteria
- Incentive structure

**Layer 5 — Collection Procedure**
- Per-source collection protocol (interview guide / survey / observation protocol)
- Session design (duration, structure, tools)
- Data capture method
- Collection timeline

**Layer 6 — Analysis Plan**
- Analysis method (thematic / content / statistical / etc.)
- Analyst(s)
- Bias mitigation approach
- Triangulation and synthesis method

**Layer 7 — Governance and Operations**
- Ethical considerations / consent
- Data handling and privacy
- Storage and tagging plan (repository)
- Stakeholders and communication plan
- Deliverable format

### Key Design Principles for Harkly's Collection Plan

1. **Questions-first design:** All source selection flows from research questions. The question → method mapping should be explicit and visible.

2. **Pre-registration principle:** The plan is a commitment document. Locking it before collection starts is a quality mechanism (reduces bias, increases reproducibility).

3. **Eligibility criteria are non-negotiable:** Every collection plan needs explicit inclusion/exclusion criteria for participants and sources.

4. **Triangulation as default:** Multiple source types per question increases validity. Harkly should surface this as best practice.

5. **Analysis plan before collection:** Knowing how you'll analyze the data determines what data you need to collect.

6. **Saturation, not fixed N:** Sample size should be expressed as a target range with a saturation criterion, not a fixed number.

7. **Stakeholder buy-in is part of the plan:** The plan is a communication artifact, not just an operational guide.

8. **Plan updates should be logged:** When the plan changes mid-study, it should be versioned and documented.

### What Makes Harkly Unique (vs. generic research plan tools)

- AI-assisted objective refinement (vague → specific)
- Question → method auto-suggestion based on research phase
- MECE decomposition of research questions
- Built-in source eligibility checker (five-filter framework)
- Triangulation matrix view
- Saturation guidance based on method + population
- Pre-built templates: JTBD switch interview, PICO, NNG four-phase, Continuous Discovery
- Locking mechanism (pre-registration analog)
- Repository integration (plan → collection → insights → repo)

---

## Appendix A: Additional Frameworks and Deep Dives

### Research Question Frameworks Beyond PICO

**Source:** [ANU LibGuides: PICO, SPIDER, SPICE](https://libguides.anu.edu.au/c.php?g=916656&p=7064999) | [PMC: PICO vs SPIDER comparison](https://pmc.ncbi.nlm.nih.gov/articles/PMC4310146/)

**Full comparison of structured question frameworks:**

| Framework | Components | Best for |
|---|---|---|
| **PICO** | Population, Intervention, Comparison, Outcome | Clinical interventions, quantitative systematic reviews |
| **SPIDER** | Sample, Phenomenon of Interest, Design, Evaluation, Research Type | Qualitative and mixed methods research |
| **SPICE** | Setting, Perspective, Intervention/Interest, Comparison, Evaluation | Evaluating outcomes of a service or project |
| **PICOT** | PICO + Time | When time is a critical variable |
| **PICOTS** | PICOT + Setting | When setting affects outcomes |
| **FINER** | Feasible, Interesting, Novel, Ethical, Relevant | Evaluating a research question's quality |

**When to use SPIDER instead of PICO:**
SPIDER is specifically designed for qualitative/mixed methods — it uses "Sample" instead of "Population" (samples are smaller, purposive), includes "Design" as an explicit search element, and focuses on subjective experience rather than quantifiable intervention.

**Key insight for Harkly:** When a PM specifies a qualitative research objective, Harkly should suggest SPIDER framework for structuring their questions. For evaluative (survey/analytics) objectives, PICO or SPICE. The framework choice should be surfaced as a guided decision, not buried in settings.

---

### Review Type Selection (Systematic vs. Scoping vs. Rapid)

**Source:** [SFU Library guide](https://www.lib.sfu.ca/about/branches-depts/rc/writing-theses/writing/literature-reviews/systematic-scoping-rapid-reviews) | [Springer: Systematic vs Scoping](https://link.springer.com/article/10.1186/s12874-018-0611-x)

| Review type | Purpose | Scope | Time | Team size | Quality appraisal |
|---|---|---|---|---|---|
| **Systematic** | Definitive answer to specific question | Narrow | Months-years | 3+ | Yes (required) |
| **Scoping** | Map a field, identify gaps | Broad | Weeks-months | 3+ | No |
| **Rapid** | Quick evidence synthesis for decisions | Variable | Days-weeks | 1–3 | Reduced |

**Decision rule:**
- Know your specific question precisely → Systematic review
- Exploring a new area, don't know what exists → Scoping review
- Need an answer fast for a business decision → Rapid review

**Key insight for Harkly:** Most PM research is analogous to "rapid review" or "scoping review" — not systematic reviews. Harkly should calibrate planning depth to the review type. A scoping study needs broader source coverage; a rapid review needs faster collection mechanics.

---

### Theoretical Sampling — Iterative Collection Planning

**Source:** [Simply Psychology: Theoretical Sampling](https://www.simplypsychology.org/theoretical-sampling.html) | [ATLAS.ti](https://atlasti.com/research-hub/theoretical-sampling)

**How theoretical sampling works (grounded theory):**

Unlike traditional research where all sampling decisions are made upfront, theoretical sampling is **iterative and emergent**:

```
Collect initial data
→ Analyze
→ Identify gaps in emerging theory
→ Decide WHERE to sample next (new sites, new participant types, new questions)
→ Collect targeted data
→ Analyze
→ Repeat until theoretical saturation
```

**Three mechanisms for directing theoretical sampling:**
1. **New sites** — go where the phenomenon manifests differently
2. **New questions** — add interview questions targeting emerging concepts
3. **New participant characteristics** — seek participants who can challenge or extend your theory

**Key insight for Harkly:** Theoretical sampling is the collection strategy pattern for grounded theory. Harkly's collection plan should support both upfront planning AND iterative sampling decisions — a "living plan" that can be updated as insights emerge, with a changelog.

---

### Double Diamond — Research Phase Structure

**Source:** [UK Design Council: The Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/)

**Two diamonds = two phases of diverge → converge:**

```
Diamond 1 (Problem):
  Diverge → Discover (research, observe, interview)
  Converge → Define (synthesize, create design brief)

Diamond 2 (Solution):
  Diverge → Develop (ideate, prototype, test)
  Converge → Deliver (refine, launch)
```

**Research methods by diamond stage:**
- Discover: field studies, interviews, observation, desk research, focus groups
- Define: affinity mapping, synthesis, journey mapping, persona development
- Develop: prototyping, usability testing, A/B testing
- Deliver: acceptance testing, final validation

**Key insight for Harkly:** The Double Diamond gives a spatial metaphor for when research happens. Harkly could map "which diamond stage are you in?" to method suggestions. Discovery-stage research is generative and broad; Develop-stage is evaluative and focused.

---

### Questions-Assumptions-Facts Tracker (Agile Context)

**Source:** [NN/g: Tracking Questions, Assumptions, Facts in Agile](https://www.nngroup.com/articles/tracking-questions-assumptions-facts-agile/)

**Four-state knowledge lifecycle:**

| State | Definition | What to do |
|---|---|---|
| **Question** | We don't know this | Add to research backlog |
| **Assumption** | We've guessed/estimated this | Document source + plan to validate |
| **Research** | Actively collecting data on this | Assign researcher, track progress |
| **Fact** | Validated through user research | Move to knowledge base |

**Critical warning:** Teams often forget that assumptions are not facts. The collection plan must explicitly track the Q→A→R→F progression for each research question.

**Implementation tools:**
- Kanban board (Trello): columns for Q / Assumption / In Research / Validated Fact
- Jira integration for product teams
- Shared text docs with outline structure

**Key insight for Harkly:** This Q→A→R→F framework is the core knowledge state model for research. Harkly's collection plan could display the "current knowledge state" for each research question, making visible what is assumed vs. what is proven. This directly addresses the most common failure mode in PM research.

---

### Assumption Mapping for Research Prioritization

**Source:** [Strategyzer: Assumption Mapping](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter) | [Maze: Assumption Mapping](https://maze.co/blog/assumption-mapping/)

**The assumption map matrix:**

```
                HIGH IMPORTANCE
                       |
    [Test now]         |      [Test now — critical]
    important+         |      important+
    low evidence       |      low evidence
                       |
LOW EVIDENCE ——————————+—————————————— HIGH EVIDENCE
                       |
    [Monitor]          |      [Accept]
    low importance +   |      low importance +
    low evidence       |      high evidence
                       |
                LOW IMPORTANCE
```

**X-axis:** Amount of existing evidence (low → high)
**Y-axis:** Importance to success (low → high)

**The four quadrants:**
1. **Top-left** (High importance, Low evidence) → Must validate through research NOW
2. **Top-right** (High importance, High evidence) → Treat as provisional fact; proceed cautiously
3. **Bottom-left** (Low importance, Low evidence) → Monitor; low priority
4. **Bottom-right** (Low importance, High evidence) → Accept; no research needed

**Key insight for Harkly:** Assumption mapping is a pre-research prioritization tool. Before building the collection plan, PMs should map their assumptions. Harkly could offer an assumption mapper as Step 0 — before any source selection or method choice, ask "what do you believe and how confident are you?" Top-left quadrant items become the research agenda.

---

### Atomic Research (Nugget Model)

**Source:** [Tomer Sharon / WeWork: Atomic Research](https://tsharon.medium.com/the-atomic-unit-of-a-research-insight-7bf13ec8fabe) | [User Interviews Field Guide](https://www.userinterviews.com/ux-research-field-guide-chapter/atomic-research-nuggets)

**The atomic nugget = smallest unit of a research insight:**
- An observation (what was observed)
- Evidence (what supports it: quote, clip, note)
- Tags (metadata for retrieval)

**Tag categories in a nugget:**
- Procedural: date, source, research method, evidence type
- Demographic: participant profile
- Experience-oriented: magnitude, frequency, emotional valence
- Business-oriented: revenue segment, product line
- Journey-oriented: stage in user journey

**Why this matters for planning:**
The atomic model is defined at planning time — the tagging taxonomy must be decided BEFORE collection begins, not after. Otherwise, insights are tagged inconsistently and can't be searched later.

**Key insight for Harkly:** The collection plan should include a "nugget taxonomy" — what tags will be applied to each insight from this study. This is the bridge between the collection plan and the research repository. Planning the taxonomy up front ensures findability later.

---

### ResearchOps Minimum Viable Taxonomy (MVT)

**Source:** [ResearchOps Community: MVT Level 1](https://medium.com/researchops-community/introducing-the-minimum-viable-taxonomy-level-1-63d13589fdcb) | [MVT Level 2](https://researchops.community/blog/minimum-viable-taxonomy-level-2/)

**MVT Level 1 — baseline for indexing research documents:**
- Study type (interview, survey, usability test, etc.)
- Research questions addressed
- Methods used
- Date range
- Product area
- Participant type

**MVT Level 2 — for insight discoverability:**
- More granular insight tagging
- Cross-study theme tracking
- Insight → decision linkage

**Key insight for Harkly:** The MVT is a community-derived standard for research metadata. Harkly's collection plan could auto-generate MVT-compatible metadata fields — making every study plan also a proper index entry for the research library.

---

### AI in Research Planning — Current State (2025–2026)

**Source:** [NN/g: Planning Research with AI](https://www.nngroup.com/articles/plan-research-ai/) | [Lyssna Research Synthesis Report 2025](https://www.lyssna.com/reports/research-synthesis/) | [User Interviews State of User Research 2025](https://www.userinterviews.com/state-of-user-research-report)

**Current AI adoption in research (2025):**
- 80% of researchers using AI in some aspect of work (up 24 points from 2024)
- 54.7% use AI-assisted analysis in synthesis specifically
- AI cuts qualitative analysis time by up to 80%
- Most trusted AI use: generating summaries (82.9%), identifying patterns (61.0%)
- Least trusted AI use: translating to recommendations (47.6%), data visualization (25.6%)

**Where AI actually helps in planning:**
- Generating research questions from context (NN/g validated)
- Suggesting methods matched to question type
- Drafting screener surveys and discussion guides
- Defining participant inclusion/exclusion criteria
- Synthesizing themes from transcripts
- Generating summary reports

**Where AI falls short:**
- Lacks organizational context → produces generic plans
- Produces biased interview questions (leading language, priming)
- Cannot reliably translate insights to recommendations
- Cannot substitute for researcher judgment on methodology

**Best practice for AI-assisted planning:**
1. Provide rich context (org, product, specific objectives) before any prompt
2. Generate more options than needed — filter down
3. Never use AI output directly as interview questions — review for bias
4. View AI as "UX assistant" not "UX expert"

**Key insight for Harkly:** AI-generated research plans need human review at each step. Harkly's UX should make the review natural — show AI suggestions as drafts, not as answers. The PM edits, not approves blindly. The hardest tasks (translating insights to recommendations) remain human.

---

### Continuous Discovery vs. Project-Based Research

**Source:** [Teresa Torres / Great Question: Continuous Discovery Guide](https://greatquestion.co/blog/continuous-discovery-guide)

**Two modes of research planning:**

| Mode | Cadence | Sample size per cycle | Purpose |
|---|---|---|---|
| **Continuous Discovery** | Weekly | 1–3 conversations | Learn continuously, adjust direction |
| **Project-Based Study** | Monthly/quarterly | 5–30+ sessions | Answer a specific question deeply |

**Continuous discovery cadence plan:**
- Weekly: 30-min customer touchpoint (one conversation minimum)
- Monthly: OST (Opportunity Solution Tree) update
- Quarterly: OST prioritization review, backlog reprioritization

**Project-based research plan:**
- Define clear research questions
- Design full collection plan (participants, methods, instruments)
- Execute collection over 2–6 weeks
- Synthesize and report
- Archive in research repository

**Key insight for Harkly:** Harkly should support both modes. Continuous discovery = lightweight weekly log + OST tracker. Project-based = full collection plan with all sections. The mode choice should be the first decision in any new research initiative.

---

### Diary Studies — Longitudinal Planning Protocol

**Source:** [NN/g: Diary Studies](https://www.nngroup.com/articles/diary-studies/) | [Indeemo: Diary Study Planning](https://indeemo.com/blog/diary-study) | [Dscout: Diary Study Guide](https://dscout.com/people-nerds/diary-study-guide)

**Diary study planning requirements:**
- Duration: 2–4 weeks (most common); 3 days minimum for day-in-the-life
- Trigger type:
  - **Interval-based** — participants log at fixed times (every 4 hours)
  - **Event-based** — participants log when a specific event occurs
  - **Signal-based** — researcher sends prompts at variable times
- Participant communication templates (prepared in advance)
- Data capture method: text, photo, video, audio

**Planning checklist for diary studies:**
1. Define the phenomenon to track (specific behavior, experience, or event)
2. Choose trigger type (interval/event/signal)
3. Design the log prompts (open-ended, specific, low cognitive burden)
4. Set duration (consider dropout — plan 30–50% attrition)
5. Define analysis approach (thematic coding of logs)
6. Recruit 10–20% more participants than needed (attrition buffer)
7. Prepare onboarding materials

**Key insight for Harkly:** Diary studies require the most upfront planning of any qualitative method — everything must be designed before launch. Harkly should offer a diary study template with all these elements pre-scaffolded, including attrition-adjusted sample size calculator.

---

### Interview Guide Types (Market Research Terminology)

**Source:** [Drive Research: 5 Components of a Market Research Interview Guide](https://www.driveresearch.com/market-research-company-blog/5-components-of-a-market-research-interview-guide/) | [Into the Minds: Interview Guide](https://www.intotheminds.com/blog/en/interview-guide/)

**Professional market research terminology:**
- **Discussion Guide** = Topic guide used in group discussions (focus groups); more flexible, discussion-driven
- **Interview Guide** = Structured guide for 1:1 interviews; more detailed, covers all topics
- **Topic Guide** = Lighter version with bullet points per topic (not scripted questions)

**Five components of a professional interview guide:**
1. **Introduction** — moderator introduction, consent, recording notice, session overview
2. **Warm-up questions** — general, low-stakes questions to build rapport
3. **Core questions** — the primary research agenda (TEDW-structured)
4. **Probing questions** — follow-ups to go deeper ("Can you tell me more about that?")
5. **Closing** — open-ended "anything else?", compensation, thank-you

**Key insight for Harkly:** An interview guide is a cascade of question types, not a flat list. Harkly's guide builder should support this structure: intro → warm-up → core (TEDW) → probes → close. The probe layer is often missing from non-professional guides.

---

## Appendix B: Research Planning Statistics (2025–2026)

| Statistic | Value | Source |
|---|---|---|
| % researchers using AI in any research task | 80% | User Interviews 2025 |
| % using AI for synthesis specifically | 54.7% | Lyssna 2025 |
| Most common synthesis timeframe | 1–2 days (35%) | Lyssna 2025 |
| % synthesis takes >5 days | 13.7% | Lyssna 2025 |
| Top pain point: time-consuming manual work | 60.3% | Lyssna 2025 |
| Top pain point: large data volumes | 46.3% | Lyssna 2025 |
| Organizations using research to inform decisions | 87% | User Interviews 2025 |
| Most popular research method: user interviews | 86% | User Interviews 2025 |
| Most popular method: usability testing | 84% | User Interviews 2025 |
| Hybrid research adoption (qual + quant) | 78% | UXPA 2024 |
| AI adoption growth (YoY) | +24 points | User Interviews 2024→2025 |
| Code saturation reached at (web-based interviews) | 30–67 interviews | JMIR 2024 |
| Theme saturation (in-person interviews) | 9–17 interviews | PMC review 2021 |

---

## Appendix C: Key Sources Reference List

### Systematic Review / Evidence Synthesis
- [PRISMA Statement (2020)](https://www.prisma-statement.org/)
- [PRISMA 2020 Full Article (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8007028/)
- [Cochrane Handbook Chapter 3](https://training.cochrane.org/handbook/current/chapter-03)
- [PROSPERO Registry](https://www.crd.york.ac.uk/prospero/)
- [Protocol Development Guide (Covidence)](https://www.covidence.org/wp-content/uploads/2024/10/A_practical_guide_Protocol_Development_for_Systematic_Reviews.pdf)
- [Bramer 15-Step Search Method (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6148622/)
- [PICO vs SPIDER comparison (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4310146/)
- [SFU Library: Review type comparison](https://www.lib.sfu.ca/about/branches-depts/rc/writing-theses/writing/literature-reviews/systematic-scoping-rapid-reviews)

### Qualitative Research
- [PMC: Purposeful sampling](https://pmc.ncbi.nlm.nih.gov/articles/PMC4012002/)
- [PMC: Practical guidance Part 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC5774281/)
- [JMIR: Sample size for saturation (2024)](https://www.jmir.org/2024/1/e52998)
- [Simply Psychology: Theoretical Sampling](https://www.simplypsychology.org/theoretical-sampling.html)
- [Looppanel: Triangulation guide](https://www.looppanel.com/blog/triangulation-in-qualitative-research)

### UX Research Planning
- [NN/g: Research Plans](https://www.nngroup.com/articles/pm-research-plan/)
- [NN/g: UX Research Cheat Sheet](https://www.nngroup.com/articles/ux-research-cheat-sheet/)
- [NN/g: Planning Research with AI](https://www.nngroup.com/articles/plan-research-ai/)
- [NN/g: Tracking Q/A/F in Agile](https://www.nngroup.com/articles/tracking-questions-assumptions-facts-agile/)
- [User Interviews Field Guide: Research Plan](https://www.userinterviews.com/ux-research-field-guide-chapter/create-user-research-plan)
- [Dscout: Research Plan Guide](https://dscout.com/people-nerds/how-to-write-a-user-research-plan-that-sets-your-project-up-for-success)
- [NN/g: Diary Studies](https://www.nngroup.com/articles/diary-studies/)
- [UK Design Council: Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/)

### Market Research / Competitive Intelligence
- [ValueNotes: KITs and KIQs](https://www.valuenotes.biz/insights-publications/publications/what-are-kits-and-kiqs/)
- [SCIP: CI Foundational Tools](https://www.scip.org/page/Competitive-Intelligence-Foundational-Tools-and-Practices)
- [Kector: Intelligence Collection Plan](https://kector.com/intelligence-collection-plan/)
- [Contify: Primary vs Secondary Research](https://www.contify.com/resources/blog/reboot-competitive-intelligence-by-leveraging-competitive-intelligence-solution-for-integrating-primary-and-secondary-research/)

### Product Research / PM Frameworks
- [Great Question: Continuous Discovery Guide](https://greatquestion.co/blog/continuous-discovery-guide)
- [Thoughtbot: Switch Interviews](https://thoughtbot.com/playbook/rapid-product-validation/switch-interviews)
- [Intercom: Jobs to be Done](https://www.intercom.com/resources/books/intercom-jobs-to-be-done)
- [JTBD.info: Four Forces of Progress](https://jtbd.info/the-forces-of-progress-4408bf995153)
- [Maze: Assumption Mapping](https://maze.co/blog/assumption-mapping/)
- [Strategyzer: Assumption Mapping](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter)
- [Tomer Sharon: Atomic Research](https://tsharon.medium.com/the-atomic-unit-of-a-research-insight-7bf13ec8fabe)

### ResearchOps
- [ResearchOps Community](https://researchops.community/)
- [Eight Pillars of User Research (Medium)](https://medium.com/researchops-community/the-eight-pillars-of-user-research-1bcd2820d75a)
- [MVT Level 1](https://medium.com/researchops-community/introducing-the-minimum-viable-taxonomy-level-1-63d13589fdcb)
- [MVT Level 2](https://researchops.community/blog/minimum-viable-taxonomy-level-2/)
- [NN/g: Research Repositories](https://www.nngroup.com/articles/research-repositories/)

### Government / Academic
- [NIH: Write Your Research Plan](https://www.niaid.nih.gov/grants-contracts/write-research-plan)
- [EU Horizon Europe: Methodology section](https://www.eugrant.me/how-to-write-the-concept-and-methodology-section-of-horizon-europe-proposals-a-guide/)
- [Scribbr: Research Proposal](https://www.scribbr.com/research-process/research-proposal/)
- [GradCoach: Methodology Chapter](https://gradcoach.com/how-to-write-the-methodology-chapter/)

### Reports / Industry Data
- [Lyssna Research Synthesis Report 2025](https://www.lyssna.com/reports/research-synthesis/)
- [User Interviews State of User Research 2025](https://www.userinterviews.com/state-of-user-research-report)
- [Maze: Future of User Research 2026](https://maze.co/resources/user-research-report/)

---

> Status: COMPLETE | Last updated: 2026-03-18

