# batch_pipeline.py — Spec

## Goal

Build `batch_pipeline.py` — overnight automation that:
1. Reads `output/targets.json` (list of candidate Steam games)
2. For each game: generates player profile report, discovers contact channels, composes + optionally sends personalized outreach email
3. Logs results to `output/batch_log.csv`

## CLI

```
python batch_pipeline.py
python batch_pipeline.py --send --from-email YOUR@gmail.com --from-password APP_PASSWORD
python batch_pipeline.py --max-reviews 100 --delay 5
Optional: --targets output/targets.json (default)
          --steam-api-key KEY (or reads STEAM_API_KEY env var)
          --dry-run  (compose + discover but do not send)
```

## What to implement

### 1. load_targets(path: str) -> list[dict]

Read JSON array from `output/targets.json`. Each item has: appid, name, negative, positive, price_usd, release_date, tags_matched.
Return list. Exit with error if file not found.

### 2. find_existing_report(appid: int, output_dir: str) -> Optional[str]

Look for any file matching `output/reports/{appid}_player_profile_*.md`.
Return path if found, None otherwise. Used for resume logic — skip pipeline if report already exists.

### 3. run_player_profile(appid: int, steam_api_key: str, max_reviews: int, output_dir: str) -> Optional[str]

Run subprocess:
```
python player_profile_pipeline.py --appid {appid} --api-key {steam_api_key} --max-reviews {max_reviews} --output-dir {output_dir}
```
Wait for completion (timeout 300s). Return report path (find via find_existing_report after run). Return None on failure.

### 4. run_outreach(appid: int, report_path: str, from_email: str, from_password: str, send: bool) -> dict

Run subprocess:
```
python outreach_pipeline.py --appid {appid} --report {report_path}
```
If send=True and from_email/from_password provided, add: `--from-email {from_email} --from-password {from_password}`

Parse stdout to extract:
- email found (look for "Email:" or "email:" lines)
- channels found (twitter, discord, reddit, website)
- whether email was sent (look for "Email sent to" in output)

Return dict: {email, twitter, discord, reddit, website, sent: bool, output: str}

### 5. log_result(log_path: str, row: dict)

Append one CSV row to `output/batch_log.csv`.
Columns: timestamp, appid, name, email, twitter, discord, reddit, website, report_path, sent, error
Create file with header if not exists. Append if exists.

### 6. main()

Flow:
1. Parse args (argparse)
2. Load targets from --targets path
3. Read STEAM_API_KEY from --steam-api-key or env var STEAM_API_KEY. Exit with error if missing.
4. Print: "Starting batch for N games"
5. For each target:
   a. Print: "[X/N] {name} (appid {appid})"
   b. Check find_existing_report — if found, print "  skipping (report exists)" and still run outreach on existing report
   c. If no report: run_player_profile → if fails, log error and continue
   d. run_outreach → log result
   e. Print summary: "  email={email or 'not found'} | channels={twitter/discord/reddit} | sent={True/False}"
   f. Sleep --delay seconds between games (default 3)
6. Print final summary: "Done. Processed N games, emails sent: M, no email found: K"

## Rules

- No hardcoded keys or passwords
- Use subprocess.run() for calling other pipelines
- All errors caught with try/except — never crash the batch, log error and continue
- CSV append is atomic enough for this use case (single process)
- File < 200 lines
- Use only stdlib: subprocess, csv, json, os, sys, argparse, pathlib, datetime, glob, time
