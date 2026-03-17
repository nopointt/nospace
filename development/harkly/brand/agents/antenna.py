#!/usr/bin/env python3
"""Antenna — on-demand content idea scanner for Harkly Telegram channel."""

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from telethon import TelegramClient
from telethon.sessions import StringSession

from idea_hub import add_idea, init_hub

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{id}.json"
HN_KEYWORDS = {
    "research", "product", "customer", "interview", "qualitative",
    "feedback", "survey", "insight", "analytics", "discovery",
    "ux", "persona", "usability", "prototype", "validation"
}

GH_TRENDING_URL = "https://github.com/trending?since=daily"
GH_KEYWORDS = {"research", "analytics", "data", "AI", "agent", "LLM", "product", "feedback"}

TG_CHANNELS = ["productchats", "betternotworse", "market_qual_research", "ilya_krasinsky"]
TG_SESSION_PATH = Path.home() / ".tgidparser" / "session.txt"
GROQ_KEY_PATH = Path.home() / ".tlos" / "groq-key"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a content strategist for Harkly — a Customer Signals Research platform for Product Managers and UX researchers.
Generate content ideas for a Telegram channel aimed at PMs and UX researchers (3-7 years experience, B2B SaaS, RU market).
Content pillars:
- signals: data patterns we discovered in our research (9/13 PM/UX chats show X)
- category: reframe how PMs think about user research methodology
- methodology: practical techniques for faster/better discovery

For each idea return JSON: {"topic": "...", "angle": "...", "pillar": "signals|category|methodology", "channel": "telegram", "sources": [...], "priority": 1-5}
Return a JSON array of 5-10 ideas. No markdown, just the JSON array."""


def fetch_hacker_news() -> list[dict]:
    """Fetch top HN stories, filter by score and keywords."""
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(HN_TOP_URL)
            resp.raise_for_status()
            top_ids = resp.json()[:50]
            stories = []
            for story_id in top_ids:
                item_resp = client.get(HN_ITEM_URL.format(id=story_id))
                if item_resp.status_code == 200:
                    item = item_resp.json()
                    if item and item.get("score", 0) > 50:
                        title = item.get("title", "") or ""
                        if any(kw.lower() in title.lower() for kw in HN_KEYWORDS):
                            stories.append({
                                "source": "hacker_news",
                                "title": title,
                                "url": item.get("url", ""),
                                "score": item.get("score", 0)
                            })
            logger.info(f"Hacker News: fetched {len(stories)} relevant stories")
            return stories
    except Exception as e:
        logger.error(f"Hacker News fetch failed: {e}")
        return []


def fetch_github_trending() -> list[dict]:
    """Scrape GitHub trending repos, filter by keywords."""
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(GH_TRENDING_URL, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            repos = []
            for article in soup.select("article.Box-row"):
                name_el = article.select_one("h2 a")
                desc_el = article.select_one("p")
                if name_el:
                    name = name_el.text.strip()
                    desc = (desc_el.text.strip() if desc_el else "") or ""
                    text = f"{name} {desc}".lower()
                    if any(kw.lower() in text for kw in GH_KEYWORDS):
                        repos.append({
                            "source": "github_trending",
                            "repo": name,
                            "description": desc,
                            "url": "https://github.com" + name_el["href"]
                        })
            logger.info(f"GitHub Trending: fetched {len(repos)} relevant repos")
            return repos
    except Exception as e:
        logger.error(f"GitHub Trending fetch failed: {e}")
        return []


async def fetch_telegram(skip: bool = False) -> list[dict]:
    """Fetch high-engagement messages from monitored Telegram channels."""
    if skip:
        logger.info("Telegram: skipped (--no-tg flag)")
        return []
    api_id = os.getenv("TG_API_ID")
    api_hash = os.getenv("TG_API_HASH")
    if not api_id or not api_hash:
        logger.warning("Telegram: TG_API_ID or TG_API_HASH not set, skipping")
        return []
    session_str = ""
    if TG_SESSION_PATH.exists():
        session_str = TG_SESSION_PATH.read_text().strip()
    messages = []
    try:
        client = TelegramClient(StringSession(session_str), int(api_id), api_hash)
        await client.start()
        for channel in TG_CHANNELS:
            try:
                entity = await client.get_entity(channel)
                async for msg in client.iter_messages(entity, limit=50):
                    forwards = msg.forwards or 0
                    reactions = sum(r.count for r in (msg.reactions or [])) if hasattr(msg, "reactions") and msg.reactions else 0
                    if forwards >= 50 or reactions >= 100:
                        messages.append({
                            "source": "telegram",
                            "channel": channel,
                            "text": msg.text[:200] if msg.text else "",
                            "forwards": forwards,
                            "reactions": reactions
                        })
            except Exception as e:
                logger.warning(f"Telegram channel {channel} failed: {e}")
        await client.disconnect()
        logger.info(f"Telegram: fetched {len(messages)} high-engagement messages")
    except Exception as e:
        logger.error(f"Telegram fetch failed: {e}")
    return messages


def generate_ideas_groq(signals: list[dict]) -> list[dict]:
    """Call Groq API to synthesize 5-10 content ideas from signals."""
    key_path = GROQ_KEY_PATH
    if not key_path.exists():
        logger.error(f"Groq key not found at {key_path}")
        return []
    api_key = key_path.read_text().strip()
    input_data = json.dumps(signals, ensure_ascii=False, indent=2)
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"Here are the signals:\n{input_data}"}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            # Strip markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            ideas = json.loads(content)
            logger.info(f"Groq: generated {len(ideas)} ideas")
            return ideas
    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        return []


async def main():
    parser = argparse.ArgumentParser(description="Antenna — content idea scanner")
    parser.add_argument("--no-tg", action="store_true", help="Skip Telegram source")
    args = parser.parse_args()
    init_hub()
    logger.info("Antenna: scanning sources...")
    hn_stories = fetch_hacker_news()
    gh_repos = fetch_github_trending()
    tg_messages = await fetch_telegram(skip=args.no_tg)
    all_signals = hn_stories + gh_repos + tg_messages
    if not all_signals:
        logger.warning("No signals collected, exiting")
        return
    ideas = generate_ideas_groq(all_signals)
    added = 0
    source_counts = {"hacker_news": 0, "github_trending": 0, "telegram": 0}
    for idea in ideas:
        try:
            add_idea(
                topic=idea.get("topic", ""),
                angle=idea.get("angle", ""),
                pillar=idea.get("pillar", "signals"),
                channel=idea.get("channel", "telegram"),
                sources=idea.get("sources", []),
                priority=idea.get("priority", 3)
            )
            added += 1
            for src in idea.get("sources", []):
                if isinstance(src, dict):
                    source_counts[src.get("source", "")] = source_counts.get(src.get("source", ""), 0) + 1
        except Exception as e:
            logger.error(f"Failed to add idea: {e}")
    print(f"\n=== Antenna Summary ===")
    print(f"Ideas added: {added}")
    print(f"Sources: HN={len(hn_stories)}, GH={len(gh_repos)}, TG={len(tg_messages)}")
    if added > 0:
        print(f"Idea sources breakdown: {source_counts}")


if __name__ == "__main__":
    asyncio.run(main())
