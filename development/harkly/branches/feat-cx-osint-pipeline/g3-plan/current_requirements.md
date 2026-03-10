# Requirements Contract — TASK-HARKLY-06-PLAYER-PROFILE-ENRICHMENT

**Created:** 2026-03-06
**Project:** Harkly — H-06 CX Service (Steam Indie Games)
**Status:** ACTIVE

---

## Task Description

Build a Python CLI pipeline that collects negative Steam reviews for a given game (appid),
enriches each reviewer's profile via Steam Web API (GetOwnedGames), classifies reviewers
into a behavioral taxonomy (Genre Expert / Casual / Competitor Fan / Collector / Mixed),
cross-references reviewer types with complaint clusters, and generates a Markdown report.

Target game for first run: Taxi Life: A City Driving Simulator (appid 1351240).
Steam Web API key is provided via --api-key CLI argument or STEAM_API_KEY env var.

---

## Requirements

Each requirement must be independently verifiable by the Coach.

- [ ] REQ-001: Collect at least 200 English negative reviews using cursor-based pagination
      Source: GET https://store.steampowered.com/appreviews/{appid}?json=1&filter=negative&language=english&num_per_page=100&cursor=*
      Retry on HTTP error, stop when no more reviews or 500 reached.

- [ ] REQ-002: Handle private Steam profiles gracefully:
      - If GetOwnedGames returns error or empty list → mark reviewer as "private"
      - Count private profiles separately
      - Log: "private_ratio" in final report (e.g. 34% profiles private)

- [ ] REQ-003: Rate limiting enforced:
      - Steam Web API calls: max 1 request/second (use time.sleep(1))
      - SteamSpy API calls: max 1 request per 2 seconds (use time.sleep(2))

- [ ] REQ-004: Cache GetOwnedGames response per steamid to disk:
      Path: cache/owned_games/{steamid}.json
      If cache file exists → load from disk, skip API call.

- [ ] REQ-005: Cache SteamSpy response per appid to disk:
      Path: cache/steamspy/{appid}.json
      If cache file exists → load from disk, skip API call.

- [ ] REQ-006: Classify each reviewer into exactly ONE taxonomy type:
      Rules (apply in priority order):
      1. Competitor Fan — owns ANY of appids [227300, 270880, 493490] with playtime > 6000 min (100h)
      2. Genre Expert — owns 3+ games with SteamSpy tags containing "Driving" OR "Simulation" OR "Racing"
                        AND mean playtime across those genre games > 12000 min (200h)
      3. Collector — owns 1000+ games AND mean playtime across all owned games < 300 min (5h)
      4. Casual — playtime_at_review < 120 min (2h) OR total playtime in game < 3000 min (50h)
      5. Mixed — doesn't fit any of the above

- [ ] REQ-007: Legitimacy Score computed as:
      mean(playtime_at_review_minutes) for all reviewers classified as Genre Expert with voted_up=false
      If no Genre Experts found → report "N/A"
      Unit: hours (divide minutes by 60, round to 1 decimal)

- [ ] REQ-008: Final report includes ALL of the following sections:
      - Header: appid, game name (from Steam), date generated
      - Summary stats: total reviews collected, total profiles analyzed, private_ratio %
      - Taxonomy breakdown: count and % for each of 5 types
      - Legitimacy Score with interpretation note
      - Top 3 complaint clusters (use simple keyword frequency if Qwen unavailable;
        prefer Qwen CLI for clustering if available)
      - Reviewer Type × Cluster matrix: for each cluster, show % of each reviewer type

- [ ] REQ-009: Output file written to:
      output/reports/{appid}_player_profile_{YYYYMMDD}.md
      (YYYYMMDD = date of run)

- [ ] REQ-010: Script is runnable as:
      python player_profile_pipeline.py --appid 1351240
      Optional args: --api-key KEY, --max-reviews N (default 500), --output-dir PATH
      API key also accepted from env var STEAM_API_KEY

- [ ] REQ-011: No hardcoded API keys in source code.
      Key must come from --api-key argument or STEAM_API_KEY environment variable.
      If neither provided → print clear error and exit with code 1.

- [ ] REQ-012: Script handles network errors gracefully:
      - Retry failed requests up to 3 times with 2s delay
      - On permanent failure → skip that reviewer, log warning to stderr

---

## API Reference

### Steam Reviews (no key required)
GET https://store.steampowered.com/appreviews/{appid}?json=1&filter=negative&language=english&num_per_page=100&cursor=*
Response fields used: reviews[].steamid, reviews[].review, reviews[].author.playtime_at_review,
reviews[].author.playtime_forever, reviews[].voted_up, reviews[].timestamp_created

### Steam GetOwnedGames (key required)
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={KEY}&steamid={steamid}&include_appinfo=1&format=json
Response fields used: response.games[].appid, response.games[].playtime_forever

### SteamSpy (no key)
GET https://steamspy.com/api.php?request=appdetails&appid={appid}
Response fields used: tags (dict of tag_name → vote_count)

### Competitor appids for Taxi Life
- ETS2: 227300
- ATS: 270880
- City Car Driving: 493490

---

## Definition of Done

- All REQ-001 through REQ-012 checked off by Coach (not Player)
- Script runs end-to-end: python player_profile_pipeline.py --appid 1351240
- Output report file created with all required sections
- No API key in source code
- File size < 800 lines

---

## Coach Verification Checklist

The Coach MUST independently verify each item before issuing IMPLEMENTATION_APPROVED:

- [ ] Run: python player_profile_pipeline.py --appid 1351240 — completes without crash
- [ ] Output file exists at output/reports/1351240_player_profile_*.md
- [ ] Report contains all 8 required sections (REQ-008)
- [ ] Check source for hardcoded keys (REQ-011)
- [ ] Check rate limiting calls exist in code (REQ-003)
- [ ] Check cache read/write logic for both owned_games and steamspy (REQ-004, REQ-005)
- [ ] Check taxonomy logic covers all 5 types in correct priority order (REQ-006)
- [ ] File < 800 lines: wc -l player_profile_pipeline.py
