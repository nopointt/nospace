"""
filter_games.py — Filter all_games.json by review count range + exclude AAA publishers.
Criteria:
  1. 100 <= (positive + negative) <= 50000
  2. publisher NOT in EXCLUDED_PUBLISHERS

Usage:
    python filter_games.py
    python filter_games.py --min 100 --max 50000
"""

import json
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "output" / "all_games.json"
OUTPUT_DIR = BASE_DIR / "output" / "filtered"
OUTPUT_FILE = OUTPUT_DIR / "filtered_targets.json"

# AAA publishers — cold outreach makes no sense for these
EXCLUDED_PUBLISHERS = {
    "2K", "2K Games",
    "Activision", "Activision Blizzard",
    "Bandai Namco Entertainment", "BANDAI NAMCO Entertainment",
    "Bethesda Softworks",
    "CAPCOM Co., Ltd.", "Capcom",
    "Deep Silver",
    "Devolver Digital",
    "Disney", "Disney Interactive",
    "Electronic Arts", "EA",
    "Focus Entertainment",
    "Koch Media",
    "Microsoft Studios", "Xbox Game Studios",
    "Nacon",
    "Paradox Interactive",
    "Rockstar Games",
    "SEGA",
    "Square Enix",
    "Team17",
    "THQ Nordic",
    "Ubisoft",
    "Warner Bros. Interactive Entertainment", "Warner Bros. Games",
    "505 Games",
}


def get_publishers(game: dict) -> list:
    pubs = game.get("store_publishers") or []
    spy = game.get("spy_publisher", "")
    if spy:
        pubs = pubs + [spy]
    return pubs


def is_excluded_publisher(game: dict) -> bool:
    for pub in get_publishers(game):
        if pub in EXCLUDED_PUBLISHERS:
            return True
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--min", type=int, default=100)
    parser.add_argument("--max", type=int, default=50000)
    args = parser.parse_args()

    with open(INPUT_FILE, encoding="utf-8") as f:
        all_games = json.load(f)

    total = len(all_games)
    filtered = []
    excluded_too_few = 0
    excluded_too_many = 0
    excluded_publisher = 0

    for game in all_games:
        reviews = game.get("positive", 0) + game.get("negative", 0)
        if reviews < args.min:
            excluded_too_few += 1
        elif reviews > args.max:
            excluded_too_many += 1
        elif is_excluded_publisher(game):
            excluded_publisher += 1
        else:
            filtered.append(game)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"Input:              {total} games")
    print(f"Excluded <{args.min}:      {excluded_too_few}")
    print(f"Excluded >{args.max}:  {excluded_too_many}")
    print(f"Excluded publisher: {excluded_publisher}")
    print(f"Kept:               {len(filtered)} games")
    print(f"Output:             {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
