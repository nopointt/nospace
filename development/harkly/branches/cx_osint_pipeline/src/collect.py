import json
import time
import urllib.request
from urllib.error import URLError, HTTPError
import sys
import os
from typing import Dict, List, Any

from db import get_db_path


class Collector:
    def __init__(self):
        self.base_url = "https://steamspy.com/api.php"
        self.sleep_interval = 0.5
        self.genres = ["Indie", "Simulation", "Adventure", "Strategy", "RPG"]

    def fetch_genre_data(self, genre: str) -> List[Dict[str, Any]]:
        url = f"{self.base_url}?request=genre&genre={genre}"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))
                return list(data.values())
        except (HTTPError, URLError, json.JSONDecodeError) as e:
            print(f"Error fetching {genre}: {e}")
            return []

    def filter_candidates(
        self,
        games: List[Dict[str, Any]],
        min_reviews: int,
        max_reviews: int,
        max_owners: int,
    ) -> List[Dict[str, Any]]:
        filtered = []
        for game in games:
            try:
                total_reviews = int(game.get("score_rank", 0))
                positive_rate = float(game.get("score", 0))
                owners = game.get("owners", "")

                # Parse owners range (e.g., "100,000 .. 200,000")
                owners_max = 0
                if owners:
                    owners_parts = owners.split("..")
                    if len(owners_parts) == 2:
                        owners_max = int(float(owners_parts[1].replace(",", "")))

                if (
                    min_reviews <= total_reviews <= max_reviews
                    and 45 <= positive_rate <= 69
                    and owners_max < max_owners
                ):
                    filtered.append(
                        {
                            "appid": game.get("appid", ""),
                            "name": game.get("name", ""),
                            "positive_rate": positive_rate,
                            "total_reviews": total_reviews,
                            "owners": owners,
                        }
                    )
            except (ValueError, TypeError):
                continue
        return filtered

    def collect(
        self, min_reviews: int, max_reviews: int, max_owners: int
    ) -> List[Dict[str, Any]]:
        all_candidates = []

        for genre in self.genres:
            print(f"Fetching {genre} games...")
            games = self.fetch_genre_data(genre)
            filtered = self.filter_candidates(
                games, min_reviews, max_reviews, max_owners
            )
            all_candidates.extend(filtered)
            time.sleep(self.sleep_interval)

        # Deduplicate by appid
        unique_candidates = {}
        for candidate in all_candidates:
            appid = candidate["appid"]
            if appid not in unique_candidates:
                unique_candidates[appid] = candidate

        return list(unique_candidates.values())

    def save_to_db(self, candidates: List[Dict[str, Any]]) -> None:
        from db import DB

        db = DB(get_db_path())
        db.init_schema()
        db.insert_candidates(candidates)
        print(f"Saved {len(candidates)} candidates to database")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Collect Steam game candidates")
    parser.add_argument(
        "--min-reviews", type=int, default=1000, help="Minimum review count"
    )
    parser.add_argument(
        "--max-reviews", type=int, default=4000, help="Maximum review count"
    )
    parser.add_argument(
        "--max-owners", type=int, default=500000, help="Maximum owner count"
    )

    args = parser.parse_args()

    collector = Collector()
    candidates = collector.collect(args.min_reviews, args.max_reviews, args.max_owners)

    if candidates:
        collector.save_to_db(candidates)
        print(f"Found {len(candidates)} candidates")
        for c in candidates[:5]:
            print(
                f"  {c['name']} ({c['appid']}) - {c['positive_rate']}% ({c['total_reviews']} reviews)"
            )
    else:
        print("No candidates found")


if __name__ == "__main__":
    main()
