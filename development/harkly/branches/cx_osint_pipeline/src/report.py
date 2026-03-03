import json
import os
from typing import Dict, List, Any

from db import get_db_path

class ReportGenerator:
    def __init__(self):
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "output", "reports")
        os.makedirs(self.output_dir, exist_ok=True)
    
    def read_data(self, appid: str) -> Dict[str, Any]:
        from db import DB
        db = DB(get_db_path())
        
        # Get game info
        candidates = db.get_candidates()
        game_info = None
        for candidate in candidates:
            if candidate["appid"] == appid:
                game_info = {
                    "appid": candidate["appid"],
                    "name": candidate["name"],
                    "positive_rate": candidate["positive_rate"],
                    "total_reviews": candidate["total_reviews"],
                    "owners": candidate["owners"]
                }
                break
        
        if not game_info:
            print(f"No game found for appid {appid}")
            return None
        
        # Get studio info
        studios = db.get_studios()
        studio_info = None
        for studio in studios:
            if studio["appid"] == appid:
                studio_info = {
                    "developer": studio["developer"],
                    "website": studio["website"],
                    "score_total": studio["score_total"],
                    "score_activity": studio["score_activity"],
                    "score_budget": studio["score_budget"],
                    "score_accessibility": studio["score_accessibility"]
                }
                break
        
        # Get clusters
        clusters = db.get_clusters(appid)
        
        return {
            "game": game_info,
            "studio": studio_info,
            "clusters": clusters
        }
    
    def generate_report_md(self, data: Dict[str, Any], appid: str) -> str:
        game = data["game"]
        studio = data["studio"]
        clusters = data["clusters"]
        
        # Calculate summary stats
        pain_clusters = [c for c in clusters if c["cluster_type"] == "pain"]
        positive_clusters = [c for c in clusters if c["cluster_type"] == "positive"]
        
        total_pct = sum(c["pct"] for c in clusters)
        if total_pct == 0:
            total_pct = 1  # Avoid division by zero
        
        md = f"""# CX Analysis: {game["name"]}
## Studio: {studio["developer"] if studio else "Unknown"} | Score: {studio["score_total"] if studio else "N/A"}/100
## Rating: {game["positive_rate"]}% ({game["total_reviews"]} reviews)

## Pain Clusters

| Cluster | % | Type |
|---------|---|------|
"""
        
        for cluster in pain_clusters:
            md += f"| {cluster["cluster_name"]} | {cluster["pct"]}% | {cluster["cluster_type"]} |\n"
        
        md += f"""

## Key Quotes

"""
        
        for cluster in pain_clusters[:3]:  # Show top 3 pain clusters
            if cluster["quotes"]:
                quotes = json.loads(cluster["quotes"])
                for quote in quotes[:2]:  # Show 2 quotes per cluster
                    md += f"- \"{quote[:100]}[...]\"\n"
        
        md += f"""

## Top Problem

{clusters[0]["top_problem"] if clusters else "N/A"}

## Founder Insight

{clusters[0]["founder_insight"] if clusters else "N/A"}

## Studio OSINT Score Breakdown

| Category | Score |
|----------|-------|
| Activity | {studio["score_activity"] if studio else "N/A"} |
| Budget | {studio["score_budget"] if studio else "N/A"} |
| Accessibility | {studio["score_accessibility"] if studio else "N/A"} |
| **Total** | **{studio["score_total"] if studio else "N/A"}** |
        """
        
        return md
    
    def generate_persona_md(self, data: Dict[str, Any], appid: str) -> str:
        game = data["game"]
        clusters = data["clusters"]
        
        pain_clusters = [c for c in clusters if c["cluster_type"] == "pain"]
        positive_clusters = [c for c in clusters if c["cluster_type"] == "positive"]
        
        # Create behavioral profile
        behaviors = [
            "I'm a dedicated gamer who invests significant time in finding and playing indie games",
            "I value unique gameplay mechanics and artistic expression over mainstream polish",
            "I actively share my gaming experiences with friends and online communities",
            "I'm willing to overlook technical issues if the core gameplay is compelling"
        ]
        
        md = f"""# Silicon Persona: {game["name"]} Player

## Who I Am

{behaviors[0]} {behaviors[1]} {behaviors[2]} {behaviors[3]}

## My Pain Clusters

"""
        
        for i, cluster in enumerate(pain_clusters[:3], 1):
            md += f"{i}. {cluster["cluster_name"]} ({cluster["pct"]}%):\n"
            if cluster["quotes"]:
                quotes = json.loads(cluster["quotes"])
                md += f"   - Example: \"{quotes[0][:80]}[...]\"\n"
        
        md += f"""

## What I Really Want

I seek games that offer innovative mechanics and authentic experiences. I'm drawn to titles that take creative risks and provide meaningful player agency. My ideal game balances artistic vision with engaging gameplay loops.

## My Breaking Points

- Technical instability that disrupts gameplay flow
- Shallow mechanics that don't deliver on creative promises
- Poor UX that makes basic interactions frustrating
- Lack of meaningful progression or player impact

## Questions to Ask Me

1. What specific gameplay mechanic did you find most innovative in your experience?
2. How did the game's artistic style influence your emotional connection to it?
3. What would need to change for you to recommend this game to a friend?
4. Which aspect of the game felt most authentic to your gaming preferences?
5. How does this game compare to others in the same genre that you've played?
        """
        
        return md
    
    def save_report(self, content: str, filename: str) -> str:
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return filepath
    
    def generate(self, appid: str) -> None:
        print(f"Generating reports for appid {appid}...")
        
        data = self.read_data(appid)
        if not data:
            return
        
        # Sanitize name for Windows filename (remove invalid chars)
        import re
        safe_name = re.sub(r'[\\/:*?"<>|]', '_', data['game']['name'])

        # Generate report
        report_md = self.generate_report_md(data, appid)
        report_path = self.save_report(report_md, f"{appid}_{safe_name}_report.md")
        print(f"Report saved to: {report_path}")

        # Generate persona
        persona_md = self.generate_persona_md(data, appid)
        persona_path = self.save_report(persona_md, f"{appid}_{safe_name}_persona.md")
        print(f"Persona saved to: {persona_path}")
        
        print(f"\nReports generated successfully for {data['game']['name']}")
        print(f"  Report: {os.path.basename(report_path)}")
        print(f"  Persona: {os.path.basename(persona_path)}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate CX reports")
    parser.add_argument("--appid", required=True, help="Steam app ID")
    
    args = parser.parse_args()
    
    generator = ReportGenerator()
    generator.generate(args.appid)


if __name__ == "__main__":
    main()