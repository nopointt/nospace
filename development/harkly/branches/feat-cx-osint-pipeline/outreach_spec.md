# Outreach Pipeline — Spec

## Goal

Build `outreach_pipeline.py` — discovers contact channels for a Steam game studio by appid,
composes a personalized cold outreach message referencing a report file, and sends via email.

## CLI

```
python outreach_pipeline.py --appid 1351240 --report output/reports/1351240_player_profile_20260306.md
Optional: --email OVERRIDE_EMAIL --from-email YOUR@gmail.com --from-password APP_PASSWORD
```

## What to implement

### 1. scrape_studio_channels(appid: int) -> dict

Scrape the Steam store page HTML for appid.
URL: https://store.steampowered.com/app/{appid}/

Extract and return a dict with keys (all optional, None if not found):
- `studio_name`: developer name (from <div class="dev_row"> or og:title meta)
- `website`: official website link (from "Visit the website" link or glassbox_link)
- `twitter`: Twitter/X handle (look for twitter.com/ links in page)
- `discord`: Discord invite link (look for discord.gg/ or discord.com/invite/ links)
- `reddit`: subreddit (look for reddit.com/r/ links)

Use requests + BeautifulSoup (bs4). No selenium.

### 2. scrape_email(website_url: str) -> Optional[str]

Given the studio website URL, find a contact email.
Strategy:
1. Fetch homepage, search for mailto: links
2. If not found, try /contact, /about, /press pages
3. Extract first email found via regex: r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
4. Return email string or None

### 3. compose_message(studio_name: str, report_path: str) -> str

Read first 50 lines of the report file to extract:
- Total reviews count
- Private ratio %
- Top taxonomy type (most common)
- Top cluster name (first cluster in "## Top Clusters" section)

Return a plain-text message like:
---
Subject: Free player profile analysis for {studio_name}

Hi {studio_name} team,

I analyzed {N} negative Steam reviews for your game and found some interesting patterns.

Quick findings:
- {X}% of reviewers had private Steam profiles (can't be enriched)
- Most common reviewer type: {top_taxonomy}
- Top complaint cluster: {top_cluster}

I put together a full Player Profile Report — reviewer taxonomy breakdown,
legitimacy score, and complaint clusters mapped to reviewer types.

Happy to share the full report for free as a sample of what Harkly does.

Reply here or reach out at harkly.io

— Harkly
---

### 4. send_via_email(to_email: str, subject: str, body: str, from_email: str, from_password: str) -> bool

Send email via Gmail SMTP (smtp.gmail.com:587, STARTTLS).
Return True on success, False on failure (log error to stderr).

### 5. main()

Flow:
1. Parse args
2. scrape_studio_channels(appid) → print what was found
3. scrape_email(website) if website found → print email if found
4. compose_message(studio_name, report_path) → print preview
5. If --from-email and --from-password provided AND email found:
   send_via_email(...)
   Print: "Email sent to {email}"
6. If no email found: print all discovered channels + composed message for manual use

## Rules

- No hardcoded emails, passwords, or API keys
- Use only: requests, bs4, smtplib, re, argparse, pathlib (all stdlib or pip installable)
- File < 300 lines
- Handle network errors gracefully (try/except, print warning, continue)
- Do not crash if any channel is not found — just skip and continue
