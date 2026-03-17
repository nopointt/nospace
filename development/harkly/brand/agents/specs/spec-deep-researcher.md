# Spec: deep_researcher.py — OSINT deep dive → Research Brief

## Goal
Create `agents/deep_researcher.py` — takes an idea from Idea Hub, runs OSINT triangulation across sources, produces a structured Research Brief (7 sections), saves it as markdown.

## Output file
`/c/Users/noadmin/nospace/development/harkly/brand/agents/deep_researcher.py`

## Brief output path
`/c/Users/noadmin/nospace/development/harkly/brand/ideas/briefs/{idea_id}-brief.md`

## Credentials
- Groq key: read from `~/.tlos/groq-key`
- Jina key: read from `~/.tlos/jina-key`
- Groq base URL: `https://api.groq.com/openai/v1`
- Jina reader URL: `https://r.jina.ai/{url}` with header `Authorization: Bearer {jina_key}`
- Model: `llama-3.3-70b-versatile`

## Import
```python
from idea_hub import get_idea, update_idea
```

## Pipeline

### Step 1 — Load idea
Read idea from Hub by id. If status != "new", warn and continue anyway.

### Step 2 — Source gathering (up to 5 sources total)
For each source in idea["sources"]:
  - If type == "hn": fetch HN item + top comments via HN API
  - If type == "github": fetch README via Jina reader
  - If type == "web": fetch content via Jina reader

Additionally search HN for related discussions:
  - URL: `https://hn.algolia.com/api/v1/search?query={topic}&tags=story&hitsPerPage=5`
  - Fetch top 3 results that aren't already in sources

Collect all content into a single context string (truncate each source to 2000 chars).

### Step 3 — OSINT triangulation (Groq)
System prompt:
```
You are a research analyst for Harkly — Customer Signals Research platform.
Your job: verify a content claim using OSINT triangulation (minimum 2 independent sources).
Admiralty source reliability scale: A-F (reliability) + 1-6 (accuracy).
```

User prompt: provide idea + all gathered content, ask for:
- Verification of main claim against sources
- Contradictions found (if any)
- Confidence rating (Admiralty Code: e.g. B2)
- Refined claim if needed

### Step 4 — Research Brief generation (Groq)
Single LLM call with all gathered context + triangulation result.

Generate Research Brief with exactly 7 sections:
```
## 1. Thesis
One refined, verifiable claim for the post. Max 2 sentences.

## 2. Key Data Points
3-5 specific facts/numbers from sources. Each with source attribution.

## 3. Quotes
2-3 verbatim quotes from sources (real quotes only, no paraphrasing).

## 4. Counter-arguments
1-2 legitimate opposing views or limitations. Be honest.

## 5. Harkly Angle
How this connects to Customer Signals Research. 2-3 sentences.
What unique perspective can Harkly add based on its own data (13 PM/UX chats)?

## 6. Post Structure Suggestion
Recommended pillar + format (short/long) + hook idea (first 160 chars suggestion).

## 7. Confidence
Admiralty Code rating + brief explanation. Flag if thesis needs more sources.
```

### Step 5 — Save + update Hub
- Write brief to `ideas/briefs/{idea_id}-brief.md`
- Call `update_idea(idea_id, status="assigned", research_brief_path=str(brief_path))`
- Print brief path to stdout

## Entry point
```
python deep_researcher.py <idea_id>
python deep_researcher.py --next          # auto-pick highest priority "new" idea
```

## Requirements
- httpx for all HTTP (sync)
- Groq call via httpx (not openai SDK)
- Max 2 Groq calls per run (step 3 + step 4)
- Graceful: if Jina fails for a URL, skip and continue with other sources
- Under 300 lines
- No classes — plain functions + main()

## Verification
```bash
python deep_researcher.py --next
# Expected: creates ideas/briefs/{id}-brief.md, prints path, no errors
```
