import sys
import os
from typing import Dict, List, Any

from db import get_db_path

class Pipeline:
    def __init__(self):
        self.db_path = get_db_path()
    
    def run_collect(self, genre: str, min_reviews: int, max_reviews: int, max_owners: int) -> List[Dict[str, Any]]:
        print(f"Collecting candidates for genre: {genre}")
        print(f"Filters: min_reviews={min_reviews}, max_reviews={max_reviews}, max_owners={max_owners}")
        
        from collect import Collector
        collector = Collector()
        candidates = collector.collect(min_reviews, max_reviews, max_owners)
        
        if candidates:
            from db import DB
            db = DB(self.db_path)
            db.init_schema()
            db.insert_candidates(candidates)
            print(f"Collected {len(candidates)} candidates")
        else:
            print("No candidates collected")
        
        return candidates
    
    def run_validate(self, min_score: int = 50) -> List[Dict[str, Any]]:
        print(f"Validating studios with min_score={min_score}")
        
        from validate import Validator
        validator = Validator()
        valid_studios = validator.validate_all(min_score)
        
        if valid_studios:
            print(f"Validated {len(valid_studios)} studios")
        else:
            print("No studios validated")
        
        return valid_studios
    
    def run_reviews(self, appid: str, count: int = 200) -> List[Dict[str, Any]]:
        print(f"Fetching {count} reviews for appid {appid}")
        
        from reviews import ReviewFetcher
        fetcher = ReviewFetcher()
        reviews = fetcher.fetch_reviews(appid, count)
        
        if reviews:
            from db import DB
            db = DB(self.db_path)
            db.init_schema()
            db.insert_reviews(reviews)
            print(f"Fetched {len(reviews)} reviews")
        else:
            print("No reviews fetched")
        
        return reviews
    
    def run_cluster(self, appid: str) -> None:
        print(f"Clustering reviews for appid {appid}")
        
        from cluster import ClusterAnalyzer
        analyzer = ClusterAnalyzer()
        analyzer.analyze(appid)
    
    def run_report(self, appid: str) -> None:
        print(f"Generating reports for appid {appid}")
        
        from report import ReportGenerator
        generator = ReportGenerator()
        generator.generate(appid)
    
    def run_full(self, genre: str, min_reviews: int, max_reviews: int, max_owners: int) -> None:
        print("Running full pipeline...")
        print("=" * 50)
        
        # Step 1: Collect candidates
        candidates = self.run_collect(genre, min_reviews, max_reviews, max_owners)
        if not candidates:
            print("No candidates found, aborting pipeline")
            return
        
        # Step 2: Validate studios
        valid_studios = self.run_validate(50)
        if not valid_studios:
            print("No valid studios found, aborting pipeline")
            return
        
        # Step 3: Get top candidate
        from db import DB
        db = DB(self.db_path)
        top_studio = db.get_studios(50)[0] if db.get_studios(50) else None
        if not top_studio:
            print("No top studio found, aborting pipeline")
            return
        
        appid = top_studio["appid"]
        print(f"\nTop candidate: {top_studio['name']} ({top_studio['developer']}) - Score: {top_studio['score_total']}/100")
        
        # Step 4: Fetch reviews
        self.run_reviews(appid, 200)
        
        # Step 5: Cluster reviews
        self.run_cluster(appid)
        
        # Step 6: Generate reports
        self.run_report(appid)
        
        print("=" * 50)
        print(f"Pipeline completed for {top_studio['name']}")
        print(f"Reports generated in: {os.path.join(os.path.dirname(__file__), '..', 'output', 'reports')}")
    
    def _ensure_candidate(self, appid: str) -> None:
        """Fetch basic game info from Steam and save to candidates if not already there."""
        import urllib.request, json as _json
        from db import DB, get_db_path
        db = DB(get_db_path())
        existing = [c for c in db.get_candidates() if c["appid"] == appid]
        if existing:
            return
        try:
            url = f"https://store.steampowered.com/api/appdetails?appids={appid}&cc=us&l=english"
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = _json.loads(resp.read())
            info = data.get(str(appid), {}).get("data", {})
            name = info.get("name", f"Game {appid}")
            # Get review counts from Steam Spy
            spy_url = f"https://steamspy.com/api.php?request=appdetails&appid={appid}"
            with urllib.request.urlopen(spy_url, timeout=15) as resp2:
                spy = _json.loads(resp2.read())
            pos = spy.get("positive", 0)
            neg = spy.get("negative", 0)
            total = pos + neg
            rate = round(pos / total * 100, 1) if total else 0
            owners = spy.get("owners", "unknown")
            db.insert_candidates([{
                "appid": str(appid), "name": name,
                "positive_rate": rate, "total_reviews": total, "owners": owners
            }])
            print(f"Saved candidate: {name} ({rate}% positive, {total} reviews)")
        except Exception as e:
            print(f"Warning: could not fetch game info for {appid}: {e}")

    def run_analyze(self, appid: str) -> None:
        print(f"Running analyze mode for appid {appid}...")
        print("=" * 50)

        # Step 0: Ensure game is in candidates table
        self._ensure_candidate(appid)

        # Step 1: Fetch reviews
        self.run_reviews(appid, 200)
        
        # Step 2: Cluster reviews
        self.run_cluster(appid)
        
        # Step 3: Generate reports
        self.run_report(appid)
        
        print("=" * 50)
        print(f"Analysis completed for appid {appid}")
        print(f"Reports generated in: {os.path.join(os.path.dirname(__file__), '..', 'output', 'reports')}")

    def run_validate_only(self, genre: str) -> None:
        print(f"Running validate mode for genre {genre}...")
        print("=" * 50)
        
        # Step 1: Collect candidates
        self.run_collect(genre, 1000, 4000, 500000)
        
        # Step 2: Validate studios
        self.run_validate(50)
        
        print("=" * 50)
        print("Validation completed")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Harkly CX OSINT Pipeline")
    parser.add_argument("--mode", required=True, choices=["full", "analyze", "validate"], 
                       help="Pipeline mode")
    parser.add_argument("--genre", default="Simulation", help="Game genre (for full/validate modes)")
    parser.add_argument("--appid", help="Steam app ID (for analyze mode)")
    parser.add_argument("--min-reviews", type=int, default=1000, help="Minimum reviews (for full mode)")
    parser.add_argument("--max-reviews", type=int, default=4000, help="Maximum reviews (for full mode)")
    parser.add_argument("--max-owners", type=int, default=500000, help="Maximum owners (for full mode)")
    
    args = parser.parse_args()
    
    pipeline = Pipeline()
    
    if args.mode == "full":
        pipeline.run_full(args.genre, args.min_reviews, args.max_reviews, args.max_owners)
    elif args.mode == "analyze":
        if not args.appid:
            print("Error: --appid is required for analyze mode")
            sys.exit(1)
        pipeline.run_analyze(args.appid)
    elif args.mode == "validate":
        pipeline.run_validate_only(args.genre)


if __name__ == "__main__":
    main()