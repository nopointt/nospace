#!/usr/bin/env python3
"""Batch pipeline for overnight automation of player profiles and outreach."""

import argparse
import csv
import glob
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional


def load_targets(path: str) -> list[dict]:
    """Read JSON array from targets file. Exit with error if not found."""
    if not os.path.exists(path):
        print(f"Error: Targets file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_existing_report(appid: int, output_dir: str) -> Optional[str]:
    """Look for existing player profile report. Return path if found, None otherwise."""
    pattern = os.path.join(output_dir, "reports", f"{appid}_player_profile_*.md")
    matches = glob.glob(pattern)
    return matches[0] if matches else None


def run_player_profile(appid: int, steam_api_key: str, max_reviews: int, output_dir: str) -> Optional[str]:
    """Run player_profile_pipeline.py subprocess. Return report path or None on failure."""
    cmd = [
        sys.executable,
        "player_profile_pipeline.py",
        "--appid", str(appid),
        "--api-key", steam_api_key,
        "--max-reviews", str(max_reviews),
        "--output-dir", output_dir,
    ]
    try:
        result = subprocess.run(cmd, timeout=300, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  player_profile failed: {result.stderr.strip()}", file=sys.stderr)
            return None
        return find_existing_report(appid, output_dir)
    except subprocess.TimeoutExpired:
        print("  player_profile timed out (300s)", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  player_profile error: {e}", file=sys.stderr)
        return None


def run_outreach(appid: int, report_path: str, from_email: str, from_password: str, send: bool) -> dict:
    """Run outreach_pipeline.py subprocess. Parse output and return results dict."""
    cmd = [
        sys.executable,
        "outreach_pipeline.py",
        "--appid", str(appid),
        "--report", report_path,
    ]
    if send and from_email and from_password:
        cmd.extend(["--from-email", from_email, "--from-password", from_password])

    result = {"email": None, "twitter": None, "discord": None, "reddit": None,
              "website": None, "sent": False, "output": ""}

    try:
        proc_result = subprocess.run(cmd, timeout=300, capture_output=True, text=True)
        result["output"] = proc_result.stdout + proc_result.stderr

        # Parse stdout for email
        for line in proc_result.stdout.splitlines():
            lower_line = line.lower()
            if "email:" in lower_line:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    email_val = parts[1].strip()
                    if email_val and "@" in email_val:
                        result["email"] = email_val
            if "twitter:" in lower_line or "twitter.com" in lower_line:
                result["twitter"] = line.split(":", 1)[-1].strip()
            if "discord:" in lower_line:
                result["discord"] = line.split(":", 1)[-1].strip()
            if "reddit:" in lower_line:
                result["reddit"] = line.split(":", 1)[-1].strip()
            if "website:" in lower_line:
                result["website"] = line.split(":", 1)[-1].strip()
            if "email sent to" in lower_line:
                result["sent"] = True

    except subprocess.TimeoutExpired:
        result["output"] = "outreach timed out (300s)"
    except Exception as e:
        result["output"] = f"outreach error: {e}"

    return result


def log_result(log_path: str, row: dict) -> None:
    """Append one CSV row to batch_log.csv. Create file with header if not exists."""
    fieldnames = ["timestamp", "appid", "name", "email", "twitter", "discord",
                  "reddit", "website", "report_path", "sent", "error"]
    file_exists = os.path.exists(log_path)

    with open(log_path, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def main():
    parser = argparse.ArgumentParser(description="Batch pipeline for player profiles and outreach")
    parser.add_argument("--targets", default="output/targets.json", help="Path to targets JSON file")
    parser.add_argument("--steam-api-key", default=None, help="Steam API key (or use STEAM_API_KEY env var)")
    parser.add_argument("--max-reviews", type=int, default=100, help="Max reviews to analyze per game")
    parser.add_argument("--delay", type=int, default=3, help="Seconds to wait between games")
    parser.add_argument("--send", action="store_true", help="Actually send emails")
    parser.add_argument("--from-email", default=None, help="Gmail address for sending emails")
    parser.add_argument("--from-password", default=None, help="App password for Gmail")
    parser.add_argument("--dry-run", action="store_true", help="Compose and discover but do not send")
    args = parser.parse_args()

    # Get Steam API key
    steam_api_key = args.steam_api_key or os.environ.get("STEAM_API_KEY")
    if not steam_api_key:
        print("Error: STEAM_API_KEY required (use --steam-api-key or set env var)", file=sys.stderr)
        sys.exit(1)

    # Load targets
    targets = load_targets(args.targets)
    print(f"Starting batch for {len(targets)} games")

    # Setup paths
    output_dir = os.path.dirname(args.targets) or "output"
    log_path = os.path.join(output_dir, "batch_log.csv")

    # Counters for final summary
    emails_sent = 0
    no_email_found = 0

    for i, target in enumerate(targets, start=1):
        appid = target.get("appid")
        name = target.get("name", "Unknown")

        print(f"[{i}/{len(targets)}] {name} (appid {appid})")

        report_path = find_existing_report(appid, output_dir)

        # If report exists, skip player profile generation
        if report_path:
            print(f"  skipping (report exists)")
        else:
            # Run player profile pipeline
            report_path = run_player_profile(appid, steam_api_key, args.max_reviews, output_dir)
            if not report_path:
                error_msg = "player_profile pipeline failed"
                print(f"  error: {error_msg}", file=sys.stderr)
                log_result(log_path, {
                    "timestamp": datetime.now().isoformat(),
                    "appid": appid,
                    "name": name,
                    "email": "",
                    "twitter": "",
                    "discord": "",
                    "reddit": "",
                    "website": "",
                    "report_path": "",
                    "sent": False,
                    "error": error_msg,
                })
                time.sleep(args.delay)
                continue

        # Run outreach pipeline
        send_emails = args.send and not args.dry_run
        outreach_result = run_outreach(appid, report_path, args.from_email, args.from_password, send_emails)

        # Log result
        log_result(log_path, {
            "timestamp": datetime.now().isoformat(),
            "appid": appid,
            "name": name,
            "email": outreach_result["email"] or "",
            "twitter": outreach_result["twitter"] or "",
            "discord": outreach_result["discord"] or "",
            "reddit": outreach_result["reddit"] or "",
            "website": outreach_result["website"] or "",
            "report_path": report_path,
            "sent": outreach_result["sent"],
            "error": "",
        })

        # Update counters
        if outreach_result["sent"]:
            emails_sent += 1
        elif not outreach_result["email"]:
            no_email_found += 1

        # Print summary
        channels = []
        if outreach_result["twitter"]:
            channels.append("twitter")
        if outreach_result["discord"]:
            channels.append("discord")
        if outreach_result["reddit"]:
            channels.append("reddit")
        channels_str = ", ".join(channels) if channels else "none"

        print(f"  email={outreach_result['email'] or 'not found'} | channels={channels_str} | sent={outreach_result['sent']}")

        # Delay between games
        if i < len(targets):
            time.sleep(args.delay)

    print(f"Done. Processed {len(targets)} games, emails sent: {emails_sent}, no email found: {no_email_found}")


if __name__ == "__main__":
    main()
