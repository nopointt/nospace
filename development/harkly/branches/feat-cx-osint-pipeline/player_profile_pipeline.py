#!/usr/bin/env python3
"""
Player Profile Pipeline — Subtask 3a: Scaffold + Review Collection
Collects negative Steam reviews for a given game appid.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Collect negative Steam reviews for a game"
    )
    parser.add_argument(
        "--appid",
        type=int,
        required=True,
        help="Steam app ID of the game"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="Steam Web API key (or set STEAM_API_KEY env var)"
    )
    parser.add_argument(
        "--max-reviews",
        type=int,
        default=500,
        help="Maximum number of reviews to collect (default: 500)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output",
        help="Output directory (default: output)"
    )
    return parser.parse_args()


def get_api_key(args: argparse.Namespace) -> Optional[str]:
    """Get API key from args or environment."""
    if args.api_key:
        return args.api_key
    api_key = os.environ.get("STEAM_API_KEY")
    if api_key:
        return api_key
    return None


def rate_limit_sleep():
    """Rate limiting helper for Steam API calls (REQ-003)."""
    time.sleep(1)


def fetch_reviews_page(appid: int, cursor: str = "*") -> dict:
    """
    Fetch a single page of reviews from Steam.
    URL: https://store.steampowered.com/appreviews/{appid}?json=1&filter=negative&language=english&num_per_page=100
    """
    url = "https://store.steampowered.com/appreviews/{}?json=1".format(appid)
    params = {
        "filter": "negative",
        "language": "english",
        "num_per_page": 100,
        "cursor": cursor
    }
    
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("WARNING: Failed to fetch reviews after {} attempts: {}".format(
                    max_retries, e), file=sys.stderr)
                return {}
    
    return {}


def collect_reviews(appid: int, max_reviews: int = 500) -> list:
    """
    Collect negative English Steam reviews using cursor pagination (REQ-001).
    Stops at max_reviews or when no more results.
    Includes retry logic (REQ-012) and rate limiting (REQ-003).
    """
    reviews = []
    cursor = "*"
    prev_cursor = None

    while len(reviews) < max_reviews:
        rate_limit_sleep()

        data = fetch_reviews_page(appid, cursor)

        if not data or "reviews" not in data:
            break

        page_reviews = data.get("reviews", [])
        if not page_reviews:
            break

        for review in page_reviews:
            if len(reviews) >= max_reviews:
                break
            reviews.append(review)

        prev_cursor = cursor
        cursor = data.get("cursor", "*")
        if cursor == prev_cursor:
            break

    return reviews


def ensure_cache_dirs():
    """Ensure cache directories exist (REQ-004, REQ-005)."""
    Path("cache/owned_games").mkdir(parents=True, exist_ok=True)
    Path("cache/steamspy").mkdir(parents=True, exist_ok=True)


def get_owned_games(steamid: str, api_key: str) -> Optional[list]:
    """
    Get owned games for a Steam user via Steam Web API (REQ-002, REQ-004).
    Returns list of games or None if profile is private/error.
    Caches response to cache/owned_games/{steamid}.json.
    """
    cache_path = Path("cache/owned_games") / f"{steamid}.json"

    if cache_path.exists():
        with open(cache_path, "r") as f:
            cached = json.load(f)
            return None if cached == [] else cached

    time.sleep(1)

    url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
    params = {
        "key": api_key,
        "steamid": steamid,
        "include_appinfo": 1,
        "format": "json"
    }

    max_retries = 3
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            games = data.get("response", {}).get("games", [])

            if not games:
                with open(cache_path, "w") as f:
                    json.dump([], f)
                return None

            with open(cache_path, "w") as f:
                json.dump(games, f)

            return games
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("WARNING: Failed to fetch owned games for {} after {} attempts: {}".format(
                    steamid, max_retries, e), file=sys.stderr)
                return None

    return None


def fetch_steamspy_tags(appid: int) -> dict:
    """
    Fetch tags for a game from SteamSpy API (REQ-005).
    Returns tags dict or empty dict on error.
    Caches response to cache/steamspy/{appid}.json.
    """
    cache_path = Path("cache/steamspy") / f"{appid}.json"
    
    if cache_path.exists():
        with open(cache_path, "r") as f:
            return json.load(f)
    
    time.sleep(2)
    
    url = "https://steamspy.com/api.php"
    params = {
        "request": "appdetails",
        "appid": appid
    }
    
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            tags = data.get("tags", {})
            
            with open(cache_path, "w") as f:
                json.dump(tags, f)
            
            return tags
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("WARNING: Failed to fetch steamspy tags for {} after {} attempts: {}".format(
                    appid, max_retries, e), file=sys.stderr)
                return {}
    
    return {}


def classify_reviewer(owned_games: Optional[list], playtime_at_review: int, playtime_forever: int) -> str:
    """
    Classify reviewer into taxonomy type based on owned games and playtime (REQ-006).
    Rules applied in priority order (first match wins):
    - Competitor Fan: owns appid 227300, 270880, or 493490 with playtime_forever > 6000 min
    - Genre Expert: owns 3+ games with tags containing 'Driving'/'Simulation'/'Racing',
                    mean playtime across those games > 12000 min
    - Collector: >= 1000 games AND mean playtime < 300 min
    - Casual: playtime_at_review < 120 min OR playtime_forever < 3000 min
    - Mixed: none of the above
    """
    if owned_games is None:
        return 'private'

    competitor_appids = {227300, 270880, 493490}
    for game in owned_games:
        if game.get('appid') in competitor_appids and game.get('playtime_forever', 0) > 6000:
            return 'Competitor Fan'

    genre_tags = {'Driving', 'Simulation', 'Racing'}
    genre_games = []
    for game in owned_games:
        appid = game.get('appid')
        if appid:
            tags = fetch_steamspy_tags(appid)
            game_tags = set(tags.keys()) if isinstance(tags, dict) else set()
            if game_tags & genre_tags:
                genre_games.append(game)

    if len(genre_games) >= 3:
        total_playtime = sum(g.get('playtime_forever', 0) for g in genre_games)
        mean_playtime = total_playtime / len(genre_games)
        if mean_playtime > 12000:
            return 'Genre Expert'

    if len(owned_games) >= 1000:
        total_playtime = sum(g.get('playtime_forever', 0) for g in owned_games)
        mean_playtime = total_playtime / len(owned_games)
        if mean_playtime < 300:
            return 'Collector'

    if playtime_at_review < 120 or playtime_forever < 3000:
        return 'Casual'

    return 'Mixed'


def compute_legitimacy_score(reviewers: list) -> Optional[float]:
    """
    Compute legitimacy score from Genre Expert negative reviewers (REQ-007).
    Filters reviewers where type == 'Genre Expert' AND voted_up == False.
    Returns mean(playtime_at_review) / 60 rounded to 1 decimal, or None if no qualifiers.
    """
    qualifying = [r for r in reviewers if r.get('type') == 'Genre Expert' and r.get('voted_up') is False]
    if not qualifying:
        return None
    total_hours = sum(r.get('playtime_at_review', 0) for r in qualifying) / 60
    return round(total_hours / len(qualifying), 1)


def cluster_reviews_by_keyword(reviews: list) -> dict:
    """
    Cluster reviews by keyword matching (REQ-008).
    Returns dict: {cluster_name: [review, ...]}
    Each review can appear in multiple clusters.
    Returns top 5 clusters sorted by count descending.
    """
    clusters = {
        'AI & Traffic': ['ai', 'traffic', 'pedestrian', 'npc', 'vehicle'],
        'Bugs & Crashes': ['crash', 'bug', 'broken', 'freeze', 'error', 'glitch'],
        'Physics & Controls': ['physics', 'control', 'handling', 'steering', 'drift'],
        'Performance': ['fps', 'lag', 'stutter', 'performance', 'optimization'],
        'Content & Missions': ['content', 'mission', 'quest', 'story', 'boring', 'empty']
    }

    result = {}
    for cluster_name, keywords in clusters.items():
        matched = []
        for review in reviews:
            review_text = review.get('review', '').lower()
            if any(kw in review_text for kw in keywords):
                matched.append(review)
        if matched:
            result[cluster_name] = matched

    sorted_clusters = sorted(result.items(), key=lambda x: len(x[1]), reverse=True)
    return dict(sorted_clusters[:5])


def generate_report(appid: int, game_name: str, reviews: list, reviewers: list, output_dir: str) -> str:
    """
    Generate the final Markdown report (REQ-008, REQ-009).
    Output path: {output_dir}/{appid}_player_profile_{YYYYMMDD}.md
    """
    from datetime import datetime

    os.makedirs(output_dir, exist_ok=True)

    today = datetime.now().strftime('%Y%m%d')
    output_path = os.path.join(output_dir, f"{appid}_player_profile_{today}.md")

    total_reviews = len(reviews)
    unique_reviewers = len(reviewers)
    private_count = sum(1 for r in reviewers if r.get('type') == 'private')
    private_ratio = (private_count / unique_reviewers * 100) if unique_reviewers > 0 else 0

    taxonomy_counts = {}
    for r in reviewers:
        rtype = r.get('type', 'unknown')
        taxonomy_counts[rtype] = taxonomy_counts.get(rtype, 0) + 1

    legitimacy = compute_legitimacy_score(reviewers)

    clusters = cluster_reviews_by_keyword(reviews)

    reviewer_type_cluster_matrix = {}
    for cluster_name, cluster_reviews in clusters.items():
        type_counts = {}
        for review in cluster_reviews:
            author = review.get('author', {})
            steamid = author.get('steamid')
            if not steamid:
                continue
            reviewer_info = next((rv for rv in reviewers if rv.get('steamid') == str(steamid)), None)
            if reviewer_info:
                rtype = reviewer_info.get('type', 'unknown')
                type_counts[rtype] = type_counts.get(rtype, 0) + 1
        total_in_cluster = len(cluster_reviews)
        percentages = {t: (c / total_in_cluster * 100) if total_in_cluster > 0 else 0
                       for t, c in type_counts.items()}
        reviewer_type_cluster_matrix[cluster_name] = percentages

    lines = []
    lines.append("# Player Profile Report")
    lines.append("")
    lines.append("## Header")
    lines.append("")
    lines.append(f"- **App ID**: {appid}")
    lines.append(f"- **Game Name**: {game_name}")
    lines.append(f"- **Date Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Total Reviews**: {total_reviews}")
    lines.append(f"- **Unique Reviewers Analyzed**: {unique_reviewers}")
    lines.append(f"- **Private Ratio**: {private_ratio:.1f}%")
    lines.append("")
    lines.append("## Taxonomy Breakdown")
    lines.append("")
    lines.append("| Type | Count | % |")
    lines.append("|------|-------|---|")
    for rtype, count in sorted(taxonomy_counts.items(), key=lambda x: x[1], reverse=True):
        pct = (count / unique_reviewers * 100) if unique_reviewers > 0 else 0
        lines.append(f"| {rtype} | {count} | {pct:.1f}% |")
    lines.append("")
    lines.append("## Legitimacy Score")
    lines.append("")
    if legitimacy is not None:
        lines.append(f"- **Score**: {legitimacy} hours")
        if legitimacy >= 10:
            interpretation = "High legitimacy - Genre experts with significant playtime"
        elif legitimacy >= 5:
            interpretation = "Moderate legitimacy - Some expert engagement"
        else:
            interpretation = "Low legitimacy - Limited expert playtime"
        lines.append(f"- **Interpretation**: {interpretation}")
    else:
        lines.append("- **Score**: N/A (no Genre Expert negative reviewers)")
        lines.append("- **Interpretation**: Cannot assess legitimacy without Genre Expert data")
    lines.append("")
    lines.append("## Top Clusters")
    lines.append("")
    top_clusters = list(clusters.items())[:3]
    for i, (cluster_name, cluster_reviews) in enumerate(top_clusters, 1):
        lines.append(f"### {i}. {cluster_name} ({len(cluster_reviews)} reviews)")
        lines.append("")
        samples = cluster_reviews[:2]
        for sample in samples:
            text = sample.get('review', '')[:150]
            if len(sample.get('review', '')) > 150:
                text += "..."
            lines.append(f"> \"{text}\"")
        lines.append("")
    lines.append("## Reviewer Type x Cluster Matrix")
    lines.append("")
    lines.append("Percentage breakdown of reviewer types within each cluster:")
    lines.append("")
    for cluster_name, percentages in reviewer_type_cluster_matrix.items():
        lines.append(f"### {cluster_name}")
        lines.append("")
        lines.append("| Type | % |")
        lines.append("|------|---|")
        for rtype, pct in sorted(percentages.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"| {rtype} | {pct:.1f}% |")
        lines.append("")

    content = "\n".join(lines)
    with open(output_path, 'w') as f:
        f.write(content)

    return output_path


def fetch_game_name(appid: int) -> str:
    """Fetch game name from Steam store API."""
    url = "https://store.steampowered.com/api/appdetails?appids={}".format(appid)
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        app_data = data.get(str(appid), {})
        if app_data.get('success'):
            return app_data.get('data', {}).get('name', 'Unknown')
    except requests.exceptions.RequestException:
        pass
    return 'Unknown'


def main():
    """Main entry point."""
    args = parse_args()

    api_key = get_api_key(args)
    if not api_key:
        print("ERROR: No API key provided. Use --api-key or set STEAM_API_KEY environment variable.", file=sys.stderr)
        sys.exit(1)

    ensure_cache_dirs()

    print("Collecting negative reviews for appid {}...".format(args.appid))

    reviews = collect_reviews(args.appid, args.max_reviews)

    print("Collected {} reviews.".format(len(reviews)))

    game_name = fetch_game_name(args.appid)
    print("Game name: {}".format(game_name))

    # Classify reviewers
    seen_steamids = set()
    reviewers = []
    taxonomy_counts = {}

    for review in reviews:
        author = review.get('author', {})
        steamid = author.get('steamid')
        if not steamid:
            continue
        steamid = str(steamid)
        if steamid in seen_steamids:
            continue
        seen_steamids.add(steamid)

        owned_games = get_owned_games(steamid, api_key)
        playtime_at_review = author.get('playtime_at_review', 0)
        playtime_forever = author.get('playtime_forever', 0)

        reviewer_type = classify_reviewer(owned_games, playtime_at_review, playtime_forever)

        reviewers.append({
            'steamid': steamid,
            'type': reviewer_type,
            'voted_up': review.get('voted_up', False),
            'playtime_at_review': playtime_at_review
        })

        taxonomy_counts[reviewer_type] = taxonomy_counts.get(reviewer_type, 0) + 1

    # Print taxonomy breakdown
    print("\nTaxonomy Breakdown:")
    for rtype, count in sorted(taxonomy_counts.items()):
        print("  {}: {}".format(rtype, count))

    # Compute and print legitimacy score
    legitimacy = compute_legitimacy_score(reviewers)
    if legitimacy is not None:
        print("\nLegitimacy Score: {} hours".format(legitimacy))
    else:
        print("\nLegitimacy Score: N/A (no Genre Expert negative reviewers)")

    # Generate report
    report_path = generate_report(args.appid, game_name, reviews, reviewers, args.output_dir)
    print("\nReport written to: {}".format(report_path))


if __name__ == "__main__":
    main()
