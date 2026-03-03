import json
import subprocess
import sys
import os
from typing import Dict, List, Any

from db import get_db_path


class ClusterAnalyzer:
    def __init__(self):
        self.qwen_command = "qwen.cmd" if sys.platform == "win32" else "qwen"

    def read_reviews(self, appid: str) -> List[str]:
        from db import DB

        db = DB(get_db_path())
        reviews_data = db.get_reviews(appid)

        if not reviews_data:
            print(f"No reviews found for appid {appid}")
            return []

        # Get game name for prompt
        from db import DB

        db = DB(get_db_path())
        candidates = db.get_candidates()
        for candidate in candidates:
            if candidate["appid"] == appid:
                game_name = candidate["name"]
                break
        else:
            game_name = f"Game {appid}"

        reviews_text = [r["text"] for r in reviews_data]
        return reviews_text, game_name

    def build_prompt(self, reviews: List[str], game_name: str) -> str:
        reviews_text = "\n\n".join(reviews[:50])  # Limit to 50 reviews for prompt

        prompt = f"""
You are a CX analyst. Analyze these {len(reviews)} Steam reviews for game {game_name}.

REVIEWS:
{reviews_text}

OUTPUT exactly this JSON structure (no commentary):
{{
  "clusters": [
    {{
      "name": "cluster name",
      "type": "pain|positive|mixed",
      "pct": 23,
      "quotes": ["quote1", "quote2"],
      "insight": "one sentence insight"
    }}
  ],
  "top_problem": "single most critical issue",
  "founder_insight": "one sentence to show the founder"
}}
        """

        return prompt.strip()

    def call_qwen(self, prompt: str) -> str:
        try:
            result = subprocess.run(
                [self.qwen_command, "--approval-mode", "yolo", "--output-format", "text"],
                input=prompt.encode("utf-8"),
                capture_output=True,
                timeout=300,
            )

            if result.returncode != 0:
                err = result.stderr.decode("utf-8", errors="replace")[:200].encode("ascii", "replace").decode()
                print(f"Qwen CLI error: {err}")
                return '{"clusters":[],"top_problem":"Qwen error","founder_insight":"rerun cluster.py"}'

            return result.stdout.decode("utf-8", errors="replace")

        except subprocess.TimeoutExpired:
            print("Qwen CLI timeout")
            return '{"clusters":[],"top_problem":"Qwen timeout","founder_insight":"rerun cluster.py"}'
        except Exception as e:
            err = str(e).encode("ascii", "replace").decode()
            print(f"Qwen CLI error: {err}")
            return """
{{
  "clusters": [],
  "top_problem": "Qwen CLI error: " + str(e)[:100],
  "founder_insight": "Review failed, please rerun cluster.py"
}}
            """

    def parse_output(self, output: str) -> Dict[str, Any]:
        try:
            # Try to parse JSON directly
            data = json.loads(output)
            if isinstance(data, dict) and "clusters" in data:
                return data
        except json.JSONDecodeError:
            pass

        # Fallback: try to extract JSON from output
        try:
            # Look for JSON-like patterns
            json_start = output.find("{")
            json_end = output.rfind("}")
            if json_start != -1 and json_end != -1:
                json_str = output[json_start : json_end + 1]
                data = json.loads(json_str)
                if isinstance(data, dict) and "clusters" in data:
                    return data
        except json.JSONDecodeError:
            pass

        # Return empty structure on failure
        return {
            "clusters": [],
            "top_problem": "Failed to parse Qwen output",
            "founder_insight": "Review failed, please rerun cluster.py",
        }

    def save_clusters(self, appid: str, clusters_data: Dict[str, Any]) -> None:
        from db import DB

        db = DB(get_db_path())
        db.init_schema()

        # Prepare cluster records
        cluster_records = []
        for i, cluster in enumerate(clusters_data.get("clusters", [])):
            cluster_records.append(
                {
                    "id": i + 1,
                    "appid": appid,
                    "cluster_name": cluster.get("name", ""),
                    "cluster_type": cluster.get("type", ""),
                    "pct": cluster.get("pct", 0),
                    "quotes": json.dumps(cluster.get("quotes", [])),
                    "insight": cluster.get("insight", ""),
                    "top_problem": clusters_data.get("top_problem", ""),
                    "founder_insight": clusters_data.get("founder_insight", ""),
                }
            )

        if cluster_records:
            db.insert_clusters(cluster_records)
            print(f"Saved {len(cluster_records)} clusters to database")

    def analyze(self, appid: str) -> None:
        print(f"Analyzing reviews for appid {appid}...")

        # Read reviews
        reviews, game_name = self.read_reviews(appid)
        if not reviews:
            return

        print(f"Building prompt with {len(reviews)} reviews...")
        prompt = self.build_prompt(reviews, game_name)

        print("Calling Qwen CLI...")
        output = self.call_qwen(prompt)

        print("Parsing output...")
        clusters_data = self.parse_output(output)

        print("Saving clusters...")
        self.save_clusters(appid, clusters_data)

        print(f"\nAnalysis complete for {game_name}:")
        print(f"  Top problem: {clusters_data.get('top_problem', 'N/A')}")
        print(f"  Founder insight: {clusters_data.get('founder_insight', 'N/A')}")
        print(f"  Clusters found: {len(clusters_data.get('clusters', []))}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Cluster Steam reviews with Qwen CLI")
    parser.add_argument("--appid", required=True, help="Steam app ID")

    args = parser.parse_args()

    analyzer = ClusterAnalyzer()
    analyzer.analyze(args.appid)


if __name__ == "__main__":
    main()
