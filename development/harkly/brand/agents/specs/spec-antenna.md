# Spec: antenna.py — On-demand content idea scanner

## Goal
Create `agents/antenna.py` — on-demand script that scans 3 sources, generates 5-10 content ideas for Harkly Telegram channel, and saves them to Idea Hub.

## Output file
`/c/Users/noadmin/nospace/development/harkly/brand/agents/antenna.py`

## Context
Harkly = Customer Signals Research platform for PM/UX researchers.
Target audience: Product Managers and UX researchers, 3-7 years experience, B2B SaaS.
Content pillars: signals (data we found), category (reframe industry concepts), methodology (practical how-to).

## Sources (3)

### Source 1 — Hacker News (public API, no key needed)
- Fetch top 50 story IDs: `https://hacker-news.firebaseio.com/v0/topstories.json`
- Fetch each story: `https://hacker-news.firebaseio.com/v0/item/{id}.json`
- Filter: score > 100 AND (title contains keywords below)
- Keywords: research, user research, product, discovery, interview, qualitative, feedback, customer, UX, PM, analytics, data, insight

### Source 2 — GitHub Trending (scrape, no key)
- URL: `https://github.com/trending?since=daily`
- Parse with beautifulsoup4: extract repo names + descriptions
- Filter: keywords: research, analytics, data, AI, agent, LLM, product, feedback

### Source 3 — Telethon (our monitored channels, existing session)
- Session: `~/.tgidparser/session.txt` (StringSession)
- Env vars required: `TG_API_ID`, `TG_API_HASH`
- If env vars missing: skip this source silently, log warning
- Channels to scan (last 50 messages each):
  - `productchats`, `betternotworse`, `market_qual_research`, `ilya_krasinsky`
- Extract: messages with 50+ forwards or 100+ reactions

## LLM synthesis (Groq)
- Key: read from `~/.tlos/groq-key`
- Base URL: `https://api.groq.com/openai/v1`
- Model: `llama-3.3-70b-versatile`
- Input: all collected signals (titles + snippets) as JSON
- Task: generate 5-10 ideas, each with:
  - topic (5-10 words)
  - angle (unique Harkly take, 1 sentence)
  - pillar (signals|category|methodology)
  - channel (telegram — always for now)
  - sources (list of source items from collected data)
  - priority (1-5, based on signal strength and audience relevance)

System prompt for Groq:
```
You are a content strategist for Harkly — a Customer Signals Research platform for Product Managers and UX researchers.
Generate content ideas for a Telegram channel aimed at PMs and UX researchers (3-7 years experience, B2B SaaS, RU market).
Content pillars:
- signals: data patterns we discovered in our research (9/13 PM/UX chats show X)
- category: reframe how PMs think about user research methodology
- methodology: practical techniques for faster/better discovery

For each idea return JSON: {"topic": "...", "angle": "...", "pillar": "signals|category|methodology", "channel": "telegram", "sources": [...], "priority": 1-5}
Return a JSON array of 5-10 ideas. No markdown, just the JSON array.
```

## Output
- Call `idea_hub.add_idea()` for each generated idea
- Print summary: how many ideas added, from which sources

## Import
```python
from idea_hub import add_idea, init_hub
```

## Entry point
```
python antenna.py           # scan all sources
python antenna.py --no-tg  # skip Telethon
```

## Requirements
- httpx for HTTP (sync, no asyncio for HN + GitHub)
- asyncio + telethon for Telegram source (wrap in asyncio.run)
- beautifulsoup4 for GitHub parsing
- Groq call via httpx (not openai SDK)
- Graceful degradation: if any source fails, log error and continue with others
- Under 250 lines

## Dependencies (install if missing)
httpx, beautifulsoup4, telethon
