# Fix: deep_researcher.py — sources can be strings or dicts

## File to edit
`/c/Users/noadmin/nospace/development/harkly/brand/agents/deep_researcher.py`

## Problem
In `_gather_sources()`, `sources` items can be either dicts OR plain strings (URLs or repo names).
Current code assumes all items are dicts with `.get()` method — crashes on strings.

## Fix
In `_gather_sources()`, replace the `existing_urls` line and the `for src in sources` loop to handle both cases:

```python
def _gather_sources(idea: dict, jina_key: str) -> str:
    sources = idea.get("sources", [])
    collected = []
    existing_urls = set()

    # Normalize: sources can be strings or dicts
    normalized = []
    for s in sources:
        if isinstance(s, dict):
            normalized.append(s)
            if s.get("url"):
                existing_urls.add(s["url"])
        elif isinstance(s, str) and s.startswith("http"):
            normalized.append({"type": "web", "url": s})
            existing_urls.add(s)
        # else: skip (non-url strings like repo names)

    # Fetch defined sources (max 5)
    for src in normalized[:5]:
        src_type = src.get("type", "web")
        content = ""
        if src_type == "hn" and src.get("id"):
            content = _fetch_hn_thread(src["id"])
        elif src_type in ("github", "web") and src.get("url"):
            content = _fetch_via_jina(src["url"], jina_key) or ""
        if content:
            collected.append(f"[Source: {src_type}] {content[:MAX_CHARS_PER_SOURCE]}")

    # Search HN for related discussions
    topic = idea.get("topic", "")
    if topic:
        hn_results = _search_hn(topic)
        for result in hn_results:
            url = result.get("url")
            if url and url not in existing_urls:
                content = _fetch_via_jina(url, jina_key)
                if content:
                    collected.append(f"[Source: hn_search] {content[:MAX_CHARS_PER_SOURCE]}")
                if len(collected) >= 5:
                    break

    return "\n\n---\n\n".join(collected)
```

Replace the entire `_gather_sources` function with the above. Do not change anything else.
