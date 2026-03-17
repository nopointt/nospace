"""Deep Researcher — OSINT triangulation → Research Brief generator."""

import argparse
import json
import sys
from pathlib import Path

import httpx

from idea_hub import get_idea, get_next_idea, update_idea

GROQ_KEY_PATH = Path.home() / ".tlos" / "groq-key"
JINA_KEY_PATH = Path.home() / ".tlos" / "jina-key"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
JINA_READER_URL = "https://r.jina.ai/{url}"
MODEL = "llama-3.3-70b-versatile"
MAX_CHARS_PER_SOURCE = 2000
BRIEFS_DIR = Path(__file__).parent.parent / "ideas" / "briefs"


def _load_key(path: Path) -> str:
    """Read API key from file, strip whitespace."""
    return path.read_text(encoding="utf-8").strip()


def _fetch_hn_item(item_id: int) -> dict | None:
    """Fetch HN item via Firebase API."""
    try:
        resp = httpx.get(f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json", timeout=10)
        return resp.json() if resp.status_code == 200 else None
    except Exception:
        return None


def _fetch_hn_thread(item_id: int) -> str:
    """Fetch HN item + top comments, return as text."""
    item = _fetch_hn_item(item_id)
    if not item:
        return ""
    text = f"Title: {item.get('title', '')}\n"
    text += f"By: {item.get('by', '')}\n"
    text += f"Score: {item.get('score', 0)}\n"
    text += f"URL: {item.get('url', '')}\n"
    text += f"Text: {item.get('text', '')}\n"
    comments = item.get("kids", [])[:10]
    for kid_id in comments:
        kid = _fetch_hn_item(kid_id)
        if kid and kid.get("text"):
            text += f"\nComment by {kid.get('by', '')}: {kid['text']}\n"
    return text.strip()


def _fetch_via_jina(url: str, jina_key: str) -> str | None:
    """Fetch URL content via Jina Reader."""
    try:
        resp = httpx.get(
            "https://r.jina.ai/" + url,
            headers={"Authorization": f"Bearer {jina_key}"},
            timeout=15
        )
        return resp.text if resp.status_code == 200 else None
    except Exception:
        return None


def _search_hn(query: str) -> list[dict]:
    """Search HN via Algolia API, return top stories."""
    try:
        url = f"https://hn.algolia.com/api/v1/search?query={query}&tags=story&hitsPerPage=5"
        resp = httpx.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("hits", [])[:3]
    except Exception:
        pass
    return []


def _gather_sources(idea: dict, jina_key: str) -> str:
    """Gather all source content, return as single context string."""
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


def _call_groq(groq_key: str, system_prompt: str, user_prompt: str) -> str:
    """Make Groq API call via httpx."""
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3
    }
    resp = httpx.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _triangulate(idea: dict, context: str, groq_key: str) -> str:
    """Run OSINT triangulation analysis."""
    system_prompt = """You are a research analyst for Harkly — Customer Signals Research platform.
Your job: verify a content claim using OSINT triangulation (minimum 2 independent sources).
Admiralty source reliability scale: A-F (reliability) + 1-6 (accuracy)."""

    user_prompt = f"""Idea to verify:
Topic: {idea.get('topic', '')}
Angle: {idea.get('angle', '')}
Claim: {idea.get('angle', '')}

Gathered OSINT context:
{context}

Tasks:
1. Verify the main claim against the sources
2. Identify any contradictions found
3. Provide confidence rating (Admiralty Code: e.g. B2)
4. Suggest refined claim if needed

Respond with clear sections for each task."""

    return _call_groq(groq_key, system_prompt, user_prompt)


def _generate_brief(idea: dict, context: str, triangulation: str, groq_key: str) -> str:
    """Generate the 7-section Research Brief."""
    system_prompt = """You are a research analyst for Harkly — Customer Signals Research platform.
Generate structured Research Briefs with exactly 7 sections as specified."""

    user_prompt = f"""Idea:
ID: {idea.get('id', '')}
Topic: {idea.get('topic', '')}
Angle: {idea.get('angle', '')}
Pillar: {idea.get('pillar', '')}
Channel: {idea.get('channel', '')}

OSINT Context:
{context}

Triangulation Analysis:
{triangulation}

Generate Research Brief with exactly these 7 sections:

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
Admiralty Code rating + brief explanation. Flag if thesis needs more sources."""

    return _call_groq(groq_key, system_prompt, user_prompt)


def _save_brief(idea_id: str, brief_content: str) -> Path:
    """Save brief to markdown file."""
    BRIEFS_DIR.mkdir(parents=True, exist_ok=True)
    brief_path = BRIEFS_DIR / f"{idea_id}-brief.md"
    brief_path.write_text(brief_content, encoding="utf-8")
    return brief_path


def run(idea_id: str) -> None:
    """Run the deep researcher pipeline."""
    # Load credentials
    groq_key = _load_key(GROQ_KEY_PATH)
    jina_key = _load_key(JINA_KEY_PATH)

    # Step 1: Load idea
    idea = get_idea(idea_id)
    if not idea:
        print(f"Error: Idea '{idea_id}' not found")
        sys.exit(1)
    if idea.get("status") != "new":
        print(f"Warning: Idea status is '{idea.get('status')}', not 'new'. Continuing anyway.")

    # Step 2: Gather sources
    context = _gather_sources(idea, jina_key)
    if not context:
        print("Warning: No source content gathered, proceeding with empty context")

    # Step 3: OSINT triangulation
    triangulation = _triangulate(idea, context, groq_key)

    # Step 4: Generate Research Brief
    brief_content = _generate_brief(idea, context, triangulation, groq_key)

    # Step 5: Save + update Hub
    brief_path = _save_brief(idea_id, brief_content)
    update_idea(idea_id, status="assigned", research_brief_path=str(brief_path))
    print(str(brief_path))


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Deep Researcher — OSINT → Research Brief")
    parser.add_argument("idea_id", nargs="?", help="Idea ID to process")
    parser.add_argument("--next", action="store_true", help="Auto-pick highest priority 'new' idea")
    args = parser.parse_args()

    if args.next:
        idea = get_next_idea()
        if not idea:
            print("No 'new' ideas found in hub")
            sys.exit(1)
        run(idea["id"])
    elif args.idea_id:
        run(args.idea_id)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
