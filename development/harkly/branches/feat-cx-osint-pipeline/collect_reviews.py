"""
collect_reviews.py — Collect all Steam reviews since 2025-01-01 for filtered games.

Features:
- Fetches ALL reviews (positive + negative) since DATE_FROM
- Stops pagination when review timestamp < DATE_FROM
- Captures developer_response field
- Resume-capable: skips appids with existing output file
- Writes {appid}.json (meta + reviews) to output/reviews/
- Maintains output/reviews/index.json with all summary data

Usage:
    python collect_reviews.py                  # full run
    python collect_reviews.py --limit 10       # first 10 games only
    python collect_reviews.py --dry-run        # print what would be done
    python collect_reviews.py --limit 3 --verbose
"""

import json
import os
import time
import argparse
import threading
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone

DATE_FROM = datetime(2025, 1, 1, tzinfo=timezone.utc)
DATE_FROM_STR = "2025-01-01"

BASE_DIR = Path(__file__).parent
FILTERED_FILE = BASE_DIR / "output" / "filtered" / "filtered_targets.json"
REVIEWS_DIR = BASE_DIR / "output" / "reviews"
INDEX_FILE = REVIEWS_DIR / "index.json"

SLEEP_BETWEEN_PAGES = 1.0  # seconds
SLEEP_BETWEEN_GAMES = 0.5  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 2.0
TIMEOUT = 30

index_lock = threading.Lock()


class Progress:
    def __init__(self, total: int):
        self.total = total
        self.done = 0
        self.skipped = 0
        self.total_reviews = 0
        self.start = time.time()
        self._lock = threading.Lock()

    def tick(self, skipped: bool = False, reviews: int = 0):
        with self._lock:
            if skipped:
                self.skipped += 1
            else:
                self.done += 1
                self.total_reviews += reviews

    def _elapsed(self) -> float:
        return time.time() - self.start

    def elapsed_str(self) -> str:
        e = int(self._elapsed())
        h, r = divmod(e, 3600)
        m, s = divmod(r, 60)
        return f"{h}h {m:02d}m {s:02d}s" if h else f"{m}m {s:02d}s"

    def rate_str(self) -> str:
        e = self._elapsed()
        processed = self.done + self.skipped
        if e < 1 or processed == 0:
            return "? g/min"
        return f"{processed / e * 60:.1f} g/min"

    def eta_str(self) -> str:
        e = self._elapsed()
        processed = self.done + self.skipped
        if processed == 0 or e < 1:
            return "?"
        remaining = (self.total - processed) / (processed / e)
        h, r = divmod(int(remaining), 3600)
        m = r // 60
        return f"{h}h {m:02d}m" if h else f"{m}m"

    def pos_str(self) -> str:
        processed = self.done + self.skipped
        w = len(str(self.total))
        return f"{processed:>{w}}/{self.total}"


def rate_sleep():
    time.sleep(SLEEP_BETWEEN_PAGES)


def fetch_page(appid: int, cursor: str, verbose: bool = False) -> dict:
    url = f"https://store.steampowered.com/appreviews/{appid}"
    params = {
        "json": "1",
        "filter": "recent",
        "language": "all",
        "num_per_page": "100",
        "cursor": cursor,
    }
    full_url = url + "?" + urllib.parse.urlencode(params)

    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(full_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                if verbose:
                    print(f"    Retry {attempt + 1}/{MAX_RETRIES}: {e}")
                time.sleep(RETRY_DELAY)
            else:
                print(f"    ERROR after {MAX_RETRIES} attempts: {e}")
                return {}
    return {}


def collect_reviews_for_game(game: dict, verbose: bool = False) -> dict:
    appid = game["appid"]
    name = game.get("name", "")
    reviews = []
    cursor = "*"
    prev_cursor = None
    pages = 0
    stopped_by_date = False

    while True:
        rate_sleep()
        data = fetch_page(appid, cursor, verbose)

        if not data or not data.get("success"):
            break

        page_reviews = data.get("reviews", [])
        if not page_reviews:
            break

        hit_cutoff = False
        for r in page_reviews:
            ts = r.get("timestamp_created", 0)
            review_dt = datetime.fromtimestamp(ts, tz=timezone.utc)

            if review_dt < DATE_FROM:
                hit_cutoff = True
                stopped_by_date = True
                break

            dev_response = r.get("developer_response") or None
            dev_response_ts = r.get("developer_response_timestamp")
            dev_response_date = None
            if dev_response_ts:
                dev_response_date = datetime.fromtimestamp(
                    dev_response_ts, tz=timezone.utc
                ).isoformat()

            reviews.append({
                "review_id": str(r.get("recommendationid", "")),
                "text": r.get("review", ""),
                "voted_up": r.get("voted_up", False),
                "votes_up": r.get("votes_up", 0),
                "votes_funny": r.get("votes_funny", 0),
                "playtime_minutes": int(r.get("author", {}).get("playtime_forever", 0)),
                "playtime_at_review_minutes": int(r.get("author", {}).get("playtime_at_review", 0)),
                "review_date": review_dt.isoformat(),
                "developer_response": dev_response,
                "developer_response_date": dev_response_date,
            })

        pages += 1
        print(f"\r    p{pages:3d} | {len(reviews):5d} rev", end="", flush=True)

        if hit_cutoff:
            break

        new_cursor = data.get("cursor", "")
        if not new_cursor or new_cursor == prev_cursor:
            break
        prev_cursor = cursor
        cursor = new_cursor

    print(flush=True)  # newline after inline page counter
    positive = sum(1 for r in reviews if r["voted_up"])
    negative = len(reviews) - positive
    dev_responses = sum(1 for r in reviews if r["developer_response"])

    if verbose:
        print(f"    Collected {len(reviews)} reviews ({positive}+/{negative}-) "
              f"in {pages} pages | date_stop={stopped_by_date}")

    return {
        "appid": appid,
        "name": name,
        "developer": game.get("spy_developer") or (game.get("store_developers") or [""])[0],
        "publisher": game.get("spy_publisher") or (game.get("store_publishers") or [""])[0],
        "total_positive_all_time": game.get("positive", 0),
        "total_negative_all_time": game.get("negative", 0),
        "price_usd": game.get("price_usd", 0),
        "release_date": game.get("release_date", ""),
        "spy_owners": game.get("spy_owners", ""),
        "store_website": game.get("store_website", ""),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "date_from": DATE_FROM_STR,
        "date_to": datetime.now(tz=timezone.utc).strftime("%Y-%m-%d"),
        "reviews_collected": len(reviews),
        "positive_collected": positive,
        "negative_collected": negative,
        "dev_responses_count": dev_responses,
        "pages_fetched": pages,
        "reviews": reviews,
    }


def load_index() -> dict:
    if INDEX_FILE.exists():
        with open(INDEX_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "total_games": 0,
        "total_reviews_collected": 0,
        "games": [],
    }


def save_index(index: dict):
    index["generated_at"] = datetime.now(tz=timezone.utc).isoformat()
    index["total_games"] = len(index["games"])
    index["total_reviews_collected"] = sum(g["reviews_collected"] for g in index["games"])
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def update_index(game_data: dict):
    with index_lock:
        index = load_index()
        total = game_data["total_positive_all_time"] + game_data["total_negative_all_time"]
        neg_rate = (
            game_data["negative_collected"] / game_data["reviews_collected"]
            if game_data["reviews_collected"] > 0 else 0.0
        )
        entry = {
            "appid": game_data["appid"],
            "name": game_data["name"],
            "developer": game_data["developer"],
            "publisher": game_data["publisher"],
            "price_usd": game_data["price_usd"],
            "total_positive_all_time": game_data["total_positive_all_time"],
            "total_negative_all_time": game_data["total_negative_all_time"],
            "total_reviews_all_time": total,
            "reviews_collected": game_data["reviews_collected"],
            "positive_collected": game_data["positive_collected"],
            "negative_collected": game_data["negative_collected"],
            "negative_rate_period": round(neg_rate, 4),
            "dev_responses_count": game_data["dev_responses_count"],
            "fetched_at": game_data["fetched_at"],
            "report_ready": False,
            "jtbd_score": None,
        }
        # update if exists, else append
        existing = next((i for i, g in enumerate(index["games"]) if g["appid"] == game_data["appid"]), None)
        if existing is not None:
            index["games"][existing] = entry
        else:
            index["games"].append(entry)
        save_index(index)


def process_game(game: dict, verbose: bool) -> tuple:
    """Collect reviews for one game. Returns (reviews_collected, pages_fetched)."""
    appid = game["appid"]
    name = game.get("name", "")
    out_file = REVIEWS_DIR / f"{appid}.json"

    if verbose:
        print(f"  Collecting {appid} {name}")

    game_data = collect_reviews_for_game(game, verbose)

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(game_data, f, ensure_ascii=False, indent=2)

    update_index(game_data)

    time.sleep(SLEEP_BETWEEN_GAMES)
    return (game_data["reviews_collected"], game_data["pages_fetched"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Process only N games")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    REVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    with open(FILTERED_FILE, encoding="utf-8") as f:
        games = json.load(f)

    if args.limit:
        games = games[:args.limit]

    total = len(games)
    prog = Progress(total)
    print(f"Games to process: {total}")
    print(f"Output dir: {REVIEWS_DIR}")
    print()

    for game in games:
        appid = game["appid"]
        name = game.get("name", "")
        out_file = REVIEWS_DIR / f"{appid}.json"

        if out_file.exists():
            prog.tick(skipped=True)
            if args.verbose:
                print(f"[{prog.pos_str()}] SKIP {appid} {name}")
            continue

        if args.dry_run:
            print(f"  DRY-RUN: would collect {appid} {name}")
            prog.tick(skipped=True)
            continue

        print(f"[{prog.pos_str()}] Collecting {appid} {name}...", flush=True)
        reviews, pages = process_game(game, args.verbose)
        prog.tick(reviews=reviews)
        print(
            f"[{prog.pos_str()}] {prog.elapsed_str()} | {prog.rate_str()} | ETA {prog.eta_str()} | total rev: {prog.total_reviews:,}\n"
            f"  -> done: {reviews} rev | {pages} pages",
            flush=True,
        )

    print()
    print(f"Done: {prog.done} collected, {prog.skipped} skipped | Reviews: {prog.total_reviews:,} | Total: {prog.elapsed_str()}")


if __name__ == "__main__":
    main()
