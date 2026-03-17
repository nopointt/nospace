# Fix: antenna.py — HN keyword matching + score threshold

## File to edit
`/c/Users/noadmin/nospace/development/harkly/brand/agents/antenna.py`

## Problem 1 — HN keywords match full phrase in title
Current code: `any(kw.lower() in title.lower() for kw in HN_KEYWORDS)`
HN_KEYWORDS contains multi-word phrases like "user research" — rarely appear verbatim in HN titles.

## Fix 1 — Replace HN_KEYWORDS with single words only
```python
HN_KEYWORDS = {
    "research", "product", "customer", "interview", "qualitative",
    "feedback", "survey", "insight", "analytics", "discovery",
    "ux", "persona", "usability", "prototype", "validation"
}
```

## Problem 2 — Score threshold too high
Current: `score > 100` — filters out too many stories
Fix: change to `score > 50`

## Problem 3 — Fetching ALL 50 stories sequentially is slow and wasteful
Only fetch items that pass the score filter. But we don't know score before fetching.
Accept this limitation for now — no change needed.

## Instructions
Make only these two changes in antenna.py:
1. Replace HN_KEYWORDS set with the single-word version above
2. Change `score > 100` to `score > 50`

Do not change anything else.
