# Harkly CX OSINT Pipeline — Implementation Spec
> Status: ready for implementation
> Target: fully autonomous, runs without Claude
> Stack: Python 3, DuckDB, Qwen CLI

---

## Overview

CLI pipeline that finds Steam game studios, validates them via OSINT scoring,
fetches reviews, clusters them via Qwen CLI, and outputs a Markdown report
ready for cold outreach.

---

## Directory Structure

```
harkly/branches/cx_osint_pipeline/src/
  db.py           — DuckDB init + all queries
  collect.py      — Steam Spy crawler → filtered candidates
  validate.py     — OSINT scoring (Steam API + scraping)
  reviews.py      — Steam reviews fetcher (paginated)
  cluster.py      — Qwen CLI caller for review clustering
  report.py       — Markdown report + Silicon Persona MD generator
  pipeline.py     — Main orchestrator (runs full flow)

harkly/branches/cx_osint_pipeline/output/
  harkly.db       — DuckDB database
  reports/        — generated Markdown reports per studio
```

---

## Step 1: collect.py

**Purpose:** Query Steam Spy by genre, filter Mixed-rated indie games.

```
Input:  genres (list), min_reviews, max_reviews, max_owners
Output: list of {appid, name, positive_rate, total_reviews, owners}
Saves:  table `candidates` in DuckDB
```

**Logic:**
- For each genre in ['Indie', 'Simulation', 'Adventure', 'Strategy', 'RPG']:
  - GET `https://steamspy.com/api.php?request=genre&genre={genre}`
  - Filter: total_reviews between min_reviews and max_reviews
  - Filter: positive_rate between 45% and 69% (Mixed)
  - Filter: owners_max < max_owners
  - Sleep 0.5s between requests (rate limiting)
- Deduplicate by appid
- Save to DuckDB table `candidates`

**CLI:**
```bash
python collect.py --min-reviews 1000 --max-reviews 4000 --max-owners 500000
```

---

## Step 2: validate.py

**Purpose:** OSINT score each candidate. Score 0-100. Skip <50.

```
Input:  candidates from DuckDB
Output: scored studios, saved to table `studios`
```

**Scoring formula:** SCORE = Activity(45) + Budget(30) + Accessibility(25)

### Activity signals (max 45):
- Steam last news age:
  - < 30 days  → +15
  - 30-90 days → +10
  - 90-180 days → +5
  - > 180 days → 0
- Steam news count last 6 months (from GetNewsForApp):
  - 5+  → +15
  - 2-4 → +10
  - 1   → +5
  - 0   → 0
- Twitter/X handle found on Steam store page: +8
- Discord link found on Steam store page: +7

### Budget signals (max 30):
- total_reviews:
  - > 3000 → +12
  - 1500-3000 → +9
  - 500-1500 → +6
- DLC count (from appdetails):
  - 5+  → +12
  - 1-4 → +8
  - 0   → +4
- Website found: +6

### Accessibility signals (max 25):
- Twitter/X confirmed: +10
- Discord confirmed: +8
- LinkedIn or email found: +7

**API calls per studio:**
- `store.steampowered.com/api/appdetails?appids={appid}` → developer, website, DLC, support_email
- `api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid={appid}&count=10` → news activity
- `store.steampowered.com/app/{appid}/` → scrape for twitter/discord links
- `{website}` → scrape for social links (fallback)

**Sleep 1s between studios.**

**CLI:**
```bash
python validate.py --min-score 50
```

---

## Step 3: reviews.py

**Purpose:** Fetch Steam reviews with pagination (cursor-based).

```
Input:  appid, target_count (default 200)
Output: list of {review_id, text, voted_up, votes_up, playtime_at_review, timestamp}
Saves:  table `reviews` in DuckDB
```

**Logic:**
- Paginate using `cursor` param (start with `*`)
- URL: `store.steampowered.com/appreviews/{appid}?json=1&num_per_page=100&language=english&filter=recent&cursor={cursor}`
- Stop when: fetched >= target_count OR no more reviews
- Filter: len(text) > 30
- Save to DuckDB with appid foreign key

**CLI:**
```bash
python reviews.py --appid 1351240 --count 200
```

---

## Step 4: cluster.py

**Purpose:** Call Qwen CLI to cluster reviews into pain themes.

```
Input:  appid (reads reviews from DuckDB)
Output: JSON with clusters, saved to table `clusters`
```

**Logic:**
- Read reviews from DuckDB for appid
- Build prompt (see below)
- Call: `qwen --approval-mode yolo --output-format text "{prompt}"`
- Parse output into structured clusters
- Save to DuckDB

**Qwen prompt template:**
```
You are a CX analyst. Analyze these {N} Steam reviews for game {name}.

REVIEWS:
{reviews_text}

OUTPUT exactly this JSON structure (no commentary):
{
  "clusters": [
    {
      "name": "cluster name",
      "type": "pain|positive|mixed",
      "pct": 23,
      "quotes": ["quote1", "quote2"],
      "insight": "one sentence insight"
    }
  ],
  "top_problem": "single most critical issue",
  "founder_insight": "one sentence to show the founder"
}
```

**CLI:**
```bash
python cluster.py --appid 1351240
```

---

## Step 5: report.py

**Purpose:** Generate Markdown report + Silicon Persona MD.

```
Input:  appid (reads all data from DuckDB)
Output: output/reports/{appid}_{name}_report.md
        output/reports/{appid}_{name}_persona.md
```

### report.md structure:
```markdown
# CX Analysis: {game_name}
## Studio: {developer} | Score: {osint_score}/100
## Rating: {positive_rate}% ({total_reviews} reviews)

## Pain Clusters
| Cluster | % | Type |
...

## Key Quotes
...

## Top Problem
...

## Founder Insight
...
```

### persona.md structure (Silicon Persona):
```markdown
# Silicon Persona: {game_name} Player

## Who I Am
[3-4 sentences behavioral profile based on clusters]

## My Pain Clusters
[numbered list from clusters]

## What I Really Want
[derived from positive clusters + JTBD inference]

## My Breaking Points
[from negative clusters]

## Questions to Ask Me
[5 PMF testing questions]
```

**CLI:**
```bash
python report.py --appid 1351240
```

---

## Step 6: pipeline.py — Main Orchestrator

**Purpose:** Run full pipeline end-to-end.

```bash
# Full run: find + validate + analyze top candidate
python pipeline.py --mode full --genre Simulation --min-reviews 1000

# Analyze specific game
python pipeline.py --mode analyze --appid 1351240

# Just find + validate candidates
python pipeline.py --mode validate --genre Indie
```

**Full mode flow:**
1. collect.py → get candidates
2. validate.py → score all, keep score >= 50
3. Sort by score desc, take top 1
4. reviews.py → fetch 200 reviews
5. cluster.py → Qwen clustering
6. report.py → generate MD files
7. Print path to output files

---

## Database Schema (DuckDB)

```sql
CREATE TABLE candidates (
  appid VARCHAR PRIMARY KEY,
  name VARCHAR,
  positive_rate FLOAT,
  total_reviews INTEGER,
  owners VARCHAR,
  collected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE studios (
  appid VARCHAR PRIMARY KEY,
  name VARCHAR,
  developer VARCHAR,
  website VARCHAR,
  support_email VARCHAR,
  twitter_handle VARCHAR,
  discord_url VARCHAR,
  price_usd FLOAT,
  dlc_count INTEGER,
  release_date VARCHAR,
  last_news_date TIMESTAMP,
  news_count_6m INTEGER,
  score_activity INTEGER,
  score_budget INTEGER,
  score_accessibility INTEGER,
  score_total INTEGER,
  validated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
  review_id VARCHAR PRIMARY KEY,
  appid VARCHAR,
  text TEXT,
  voted_up BOOLEAN,
  votes_up INTEGER,
  playtime_minutes INTEGER,
  review_date TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clusters (
  id INTEGER PRIMARY KEY,
  appid VARCHAR,
  cluster_name VARCHAR,
  cluster_type VARCHAR,
  pct INTEGER,
  quotes JSON,
  insight TEXT,
  top_problem TEXT,
  founder_insight TEXT,
  clustered_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling

- All HTTP calls: try/except with timeout=15, on error log and continue
- Steam API rate limit: sleep 0.5s between calls
- Qwen CLI: if exit code != 0, log stderr and save raw output for debug
- DuckDB: use context manager, commit after each step
- Encoding: always UTF-8, use `.encode('ascii', 'replace').decode()` for display only

---

## Dependencies

```
# stdlib only — no pip install needed except duckdb
duckdb
```

Install: `pip install duckdb`

All HTTP via `urllib.request` (stdlib).
Qwen via subprocess/shell (already installed globally).

---

## Notes

- NO Celery, NO Prefect, NO Redis — simple synchronous Python
- NO paid APIs — Steam API free, Qwen CLI free
- Output is human-readable Markdown, not dashboards
- Pipeline runs top-to-bottom, no retries on Qwen (rerun manually if needed)
- Windows-compatible paths (use os.path.join)
