# Deep Technology Research Framework — Contexter
> Version: 1.0 | Date: 2026-03-28
> Purpose: systematic research template for each feature/component
> Inspired by: TRIZ (systematic invention), Design Science Research, First Principles Engineering

---

## How to use

For each feature/component, create a file `{feature}-deep-research.md` and fill all 6 layers. Each layer builds on the previous. Skip nothing — depth is the point.

---

## Layer 1: Current State (Где мы)

**Goal:** Honest audit of what we have today.

```markdown
### 1.1 Our implementation
- What: [what the component does]
- How: [algorithm, model, config]
- Performance: [latency, accuracy, cost per operation]
- Known issues: [bugs, limitations, tech debt]

### 1.2 Metrics (measure before improving)
- Baseline accuracy: [% or score]
- Baseline latency: [p50, p95, p99]
- Baseline cost: [$ per 1K operations]
- User complaints: [from feedback, support, analytics]
```

---

## Layer 2: World-Class Standard (Как делают лучшие)

**Goal:** What is the current industry standard? What do the top 3 products/papers use?

```markdown
### 2.1 Industry standard approach
- Algorithm: [name, paper, year]
- Why it's standard: [benchmark results, adoption]
- Who uses it: [products, companies]

### 2.2 Top 3 implementations
| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| [name] | [approach] | [result] | [what makes it work] |

### 2.3 Standard configuration
- Recommended defaults: [params, thresholds]
- Common pitfalls: [what NOT to do]
- Migration path from our current state: [effort estimate]
```

---

## Layer 3: Frontier Innovation (Технологии завтрашнего дня)

**Goal:** What's being invented right now? What will be standard in 12-18 months?

```markdown
### 3.1 Emerging techniques (papers from last 6 months)
| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| [title] | [YYYY-MM] | [what's new] | [research/prototype/production] | [how it applies to us] |

### 3.2 Open questions in the field
- [unsolved problem 1]
- [unsolved problem 2]

### 3.3 Bets worth making
- [technique that's risky but high-reward if it works]
- [why we should try it before competitors]
```

---

## Layer 4: Cross-Disciplinary Transfer (Идеи из смежных дисциплин)

**Goal:** What solutions exist in OTHER fields that solve analogous problems?

Think: biology, physics, signal processing, linguistics, neuroscience, economics, game theory, music theory, architecture, logistics, military strategy.

```markdown
### 4.1 Analogous problems in other fields
| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| [field] | [their version of our problem] | [how they solve it] | [how we can adapt it] |

### 4.2 Biomimicry / Nature-inspired
- [pattern from nature that maps to our problem]

### 4.3 Engineering disciplines
- Signal processing: [relevant technique]
- Information theory: [relevant concept]
- Control systems: [feedback loops, PID, etc.]
- Linguistics: [NLP insight from formal linguistics]
```

---

## Layer 5: Mathematical Foundations (Математика под капотом)

**Goal:** What mathematical structures underlie the problem? Are we using the right math?

```markdown
### 5.1 Current mathematical model
- What math we use: [cosine similarity, BM25, RRF, etc.]
- Assumptions: [what we assume about the data]
- Where assumptions break: [edge cases]

### 5.2 Alternative mathematical approaches
| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| [math technique] | [field] | [why better] | [O(n) etc.] | [reference] |

### 5.3 Optimization opportunities
- Current bottleneck: [what's slow/inaccurate mathematically]
- Better objective function: [what we should optimize for]
- Approximation tricks: [LSH, quantization, sketches, etc.]

### 5.4 Information-theoretic analysis
- How much information is in our chunks? (entropy)
- How much is lost in embedding? (mutual information)
- Optimal chunk size from information theory perspective
- Compression vs retrieval tradeoff

### 5.5 Linear algebra / geometry insights
- Vector space structure: [are our embeddings actually using the space well?]
- Dimensionality: [intrinsic dimension vs stored dimension]
- Clustering: [do documents form natural clusters?]
- Manifold hypothesis: [are embeddings on a lower-dimensional manifold?]
```

---

## Layer 6: Synthesis & Decision (Что делаем)

**Goal:** Concrete decision based on all 5 layers.

```markdown
### 6.1 Recommended approach
- **What**: [specific technique]
- **Why**: [which layer(s) support this choice]
- **Expected impact**: [quantified if possible]
- **Cost**: [implementation time + operational cost]
- **Risk**: [what could go wrong]

### 6.2 Implementation spec (brief)
- Input: [what the component receives]
- Output: [what it produces]
- Algorithm: [step by step]
- Config: [parameters and defaults]
- Fallback: [if the new approach fails]

### 6.3 Validation plan
- How to measure improvement: [A/B test, benchmark, metric]
- Minimum success criteria: [X% improvement on Y metric]
- Rollback trigger: [when to revert]

### 6.4 Rejected alternatives
| Alternative | Why rejected |
|---|---|
| [option] | [reason — cost, complexity, marginal gain, etc.] |
```

---

## Research execution rules

1. **Save as you go** — append findings to the file after each search, not at the end
2. **Primary sources only** — papers > blog posts > tweets. Always cite.
3. **Quantify everything** — "better" is not a finding. "+14% on BEIR" is.
4. **Time-bound innovations** — always note the date. A 2023 paper may be obsolete.
5. **Implementation bias** — prefer techniques with open-source implementations
6. **Cost reality** — always estimate operational cost, not just accuracy gain
7. **One file per feature** — `{feature}-deep-research.md` in `docs/research/`

---

## Feature research file naming

```
docs/research/
  reranking-deep-research.md
  contextual-chunking-deep-research.md
  tokenization-deep-research.md
  hyde-deep-research.md
  ...
```

---

*This framework is a living document. Update when we discover a better research structure.*
