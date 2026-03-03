import json
import time
import urllib.request
from urllib.error import URLError, HTTPError
import sys
import os
from datetime import datetime, timezone
from typing import Dict, List, Any

from db import get_db_path


class ReviewFetcher:
    def __init__(self):
        self.base_url = "https://store.steampowered.com/appreviews"
        self.sleep_interval = 0.5
        self.default_count = 200

    def fetch_reviews_page(self, appid: str, cursor: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/{appid}?json=1&num_per_page=100&language=english&filter=recent&cursor={cursor}"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))
                return data
        except (HTTPError, URLError, json.JSONDecodeError):
            return None

    def fetch_reviews(
        self, appid: str, target_count: int = 200
    ) -> List[Dict[str, Any]]:
        reviews = []
        cursor = "*"

        while len(reviews) < target_count:
            print(f"Fetching reviews (cursor: {cursor[:20]}...)...")
            data = self.fetch_reviews_page(appid, cursor)

            if not data or not data.get("success"):
                print("  Failed to fetch reviews")
                break

            if not data.get("reviews"):
                print("  No more reviews available")
                break

            for review in data["reviews"]:
                # Filter short reviews
                if len(review["review"]) > 30:
                    reviews.append(
                        {
                            "review_id": str(review["recommendationid"]),
                            "appid": appid,
                            "text": review["review"],
                            "voted_up": review["voted_up"],
                            "votes_up": review.get("votes_up", 0),
                            "playtime_minutes": int(review.get("playtime_forever", 0)),
                            "review_date": datetime.fromtimestamp(review["timestamp_created"], tz=timezone.utc),
                        }
                    )

            # Check if we have more reviews
            if data.get("cursor") == cursor:
                print("  No new reviews fetched")
                break

            cursor = data.get("cursor", "")

            # Stop if we've reached target count
            if len(reviews) >= target_count:
                break

            time.sleep(self.sleep_interval)

        return reviews[:target_count]

    def save_to_db(self, reviews: List[Dict[str, Any]]) -> None:
        from db import DB

        db = DB(get_db_path())
        db.init_schema()
        db.insert_reviews(reviews)
        print(f"Saved {len(reviews)} reviews to database")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Fetch Steam reviews")
    parser.add_argument("--appid", required=True, help="Steam app ID")
    parser.add_argument(
        "--count", type=int, default=200, help="Number of reviews to fetch"
    )

    args = parser.parse_args()

    fetcher = ReviewFetcher()
    reviews = fetcher.fetch_reviews(args.appid, args.count)

    if reviews:
        fetcher.save_to_db(reviews)
        print(f"Fetched {len(reviews)} reviews for appid {args.appid}")
        for r in reviews[:3]:
            print(f"  {r['review_id']}: {r['text'][:50]}...")
    else:
        print("No reviews found")


if __name__ == "__main__":
    main()
