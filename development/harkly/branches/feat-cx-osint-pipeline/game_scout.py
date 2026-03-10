#!/usr/bin/env python3
"""Find indie Steam game candidates for cold outreach."""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from urllib.request import urlopen, Request

TAGS = ['Simulation', 'Strategy', 'RPG', 'Action', 'Survival', 'City Builder',
        'Indie', 'Management', 'Base Building', 'Roguelite', 'Turn-Based Strategy',
        'Colony Sim', 'Sandbox', 'Open World']
STEAMSPY_URL = "https://steamspy.com/api.php?request=tag&tag={tag}&page={page}"
STEAM_STORE_URL = "https://store.steampowered.com/api/appdetails?appids={appid}"
# Activeness proxy: game must have players in last 2 weeks (SteamSpy average_2weeks > 0)


def fetch_json(url):
    """Fetch JSON from URL with basic headers."""
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def get_steamspy_games(tag, seen_appids, pages=3):
    """Fetch games from SteamSpy for a tag across multiple pages, return filtered candidates."""
    from urllib.parse import quote
    candidates = []
    for page in range(pages):
        try:
            data = fetch_json(STEAMSPY_URL.format(tag=quote(tag), page=page))
        except Exception as e:
            print(f"    warn: {e}")
            break
        if not data:
            break
        for appid_str, info in data.items():
            appid = int(appid_str)
            if appid in seen_appids:
                continue
            negative = info.get('negative', 0)
            positive = info.get('positive', 0)
            price = int(info.get('initialprice', 0) or 0)
            if negative >= 50 and price >= 100:
                # Parse tags dict: {"tag_name": vote_count, ...}
                raw_tags = info.get('tags', {})
                tags_sorted = sorted(raw_tags.items(), key=lambda x: x[1], reverse=True) if isinstance(raw_tags, dict) else []
                candidates.append({
                    'appid': appid,
                    'name': info.get('name', 'Unknown'),
                    'negative': negative,
                    'positive': positive,
                    'price_cents': price,
                    'tags_matched': [tag],
                    # SteamSpy extras
                    'spy_developer': info.get('developer', ''),
                    'spy_publisher': info.get('publisher', ''),
                    'spy_owners': info.get('owners', ''),
                    'spy_avg_playtime_min': info.get('average_forever', 0),
                    'spy_median_playtime_min': info.get('median_forever', 0),
                    'spy_avg_2weeks_min': info.get('average_2weeks', 0),
                    'spy_tags': [t for t, _ in tags_sorted[:15]],
                })
                seen_appids.add(appid)
        time.sleep(2)
    return candidates


def check_steam_store(appid):
    """Check Steam store for game type and release date. Returns details or None."""
    for attempt in range(3):
        try:
            data = fetch_json(STEAM_STORE_URL.format(appid=appid))
            break
        except Exception as e:
            if '429' in str(e):
                time.sleep(10 * (attempt + 1))
            else:
                return None
    else:
        return None
    key = str(appid)
    if key not in data or not data[key].get('success'):
        return None
    details = data[key].get('data', {})
    if details.get('type') != 'game':
        return None
    release = details.get('release_date', {})
    if release.get('coming_soon'):
        return None
    date_str = release.get('date', '')
    try:
        # Handle various date formats from Steam
        for fmt in ['%b %d, %Y', '%d %b, %Y', '%Y-%m-%d', '%B %d, %Y']:
            try:
                rel_date = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
        else:
            return None
    except Exception:
        return None
    # Genres list
    genres = [g.get('description', '') for g in details.get('genres', [])]

    # Categories (single-player, multi-player, etc.)
    categories = [c.get('description', '') for c in details.get('categories', [])]

    # Supported languages — strip HTML tags
    import re as _re
    raw_langs = details.get('supported_languages', '')
    languages = _re.sub(r'<[^>]+>', '', raw_langs).split(',')
    languages = [l.strip() for l in languages if l.strip()][:10]

    return {
        'release_date': date_str,
        'price_usd': details.get('price_overview', {}).get('final', 0) / 100,
        # Steam Store extras
        'store_developers': details.get('developers', []),
        'store_publishers': details.get('publishers', []),
        'store_website': details.get('website') or '',
        'store_short_desc': details.get('short_description', '')[:200],
        'store_genres': genres,
        'store_categories': categories,
        'store_languages': languages,
        'store_metacritic': details.get('metacritic', {}).get('score'),
        'store_recommendations': details.get('recommendations', {}).get('total'),
        'store_platforms': {k: v for k, v in details.get('platforms', {}).items() if v},
    }


def main():
    seen_appids = set()
    all_candidates = []

    print(f"Querying SteamSpy for {len(TAGS)} tags...")
    for tag in TAGS:
        candidates = get_steamspy_games(tag, seen_appids)
        all_candidates.extend(candidates)
        print(f"  {tag}: {len(candidates)} candidates")
        time.sleep(2)

    # Sort by negative desc before Steam store check
    all_candidates.sort(key=lambda x: x['negative'], reverse=True)

    total = len(all_candidates)
    print(f"\nChecking Steam store for {total} candidates...")
    print(f"Estimated time: ~{total * 1.5 / 60:.0f} min at 1.5s/req\n")

    valid_targets = []
    start_time = time.time()
    os.makedirs('output', exist_ok=True)

    for i, cand in enumerate(all_candidates):
        # Progress prefix
        pct = (i + 1) / total * 100
        elapsed = time.time() - start_time
        eta_sec = (elapsed / (i + 1)) * (total - i - 1) if i > 0 else 0
        eta_str = str(timedelta(seconds=int(eta_sec))) if eta_sec > 0 else "--:--"
        name_short = cand['name'][:28].encode('ascii', errors='replace').decode('ascii')

        store_info = check_steam_store(cand['appid'])
        # Skip inactive games — no players in last 2 weeks
        if store_info and cand.get('spy_avg_2weeks_min', 0) == 0:
            status = "inactive"
            print(
                f"[{i+1:>5}/{total}] {pct:5.1f}%  ETA {eta_str}  "
                f"{cand['appid']:<9} {name_short:<28} {status}  "
                f"(valid: {len(valid_targets)})",
                flush=True
            )
            time.sleep(1.5)
            continue
        if store_info:
            valid_targets.append({
                # Identity
                'appid': cand['appid'],
                'name': cand['name'],
                # Reviews
                'negative': cand['negative'],
                'positive': cand['positive'],
                # Pricing & release
                'price_usd': store_info['price_usd'],
                'release_date': store_info['release_date'],
                # Tags
                'tags_matched': cand['tags_matched'],
                'spy_tags': cand.get('spy_tags', []),
                # Studio info (SteamSpy)
                'spy_developer': cand.get('spy_developer', ''),
                'spy_publisher': cand.get('spy_publisher', ''),
                # Ownership & engagement (SteamSpy)
                'spy_owners': cand.get('spy_owners', ''),
                'spy_avg_playtime_min': cand.get('spy_avg_playtime_min', 0),
                'spy_median_playtime_min': cand.get('spy_median_playtime_min', 0),
                'spy_avg_2weeks_min': cand.get('spy_avg_2weeks_min', 0),
                # Studio info (Steam Store)
                'store_developers': store_info.get('store_developers', []),
                'store_publishers': store_info.get('store_publishers', []),
                'store_website': store_info.get('store_website', ''),
                # Game metadata (Steam Store)
                'store_short_desc': store_info.get('store_short_desc', ''),
                'store_genres': store_info.get('store_genres', []),
                'store_categories': store_info.get('store_categories', []),
                'store_languages': store_info.get('store_languages', []),
                'store_metacritic': store_info.get('store_metacritic'),
                'store_recommendations': store_info.get('store_recommendations'),
                'store_platforms': store_info.get('store_platforms', {}),
            })
            status = "ok"
        else:
            status = "--"

        print(
            f"[{i+1:>5}/{total}] {pct:5.1f}%  ETA {eta_str}  "
            f"{cand['appid']:<9} {name_short:<28} {status}  "
            f"(valid: {len(valid_targets)})",
            flush=True
        )

        # Save after every valid hit
        if store_info:
            with open('output/targets.json', 'w', encoding='utf-8') as f:
                json.dump(valid_targets, f, indent=2)

        time.sleep(1.5)

    # Final sort and save
    valid_targets.sort(key=lambda x: x['negative'], reverse=True)
    final_targets = valid_targets

    with open('output/targets.json', 'w', encoding='utf-8') as f:
        json.dump(final_targets, f, indent=2)

    # Summary table (ASCII-safe)
    print("\n" + "=" * 80)
    print(f"{'appid':<10} {'name':<35} {'negative':<10} {'price':<8} {'release_date':<15} {'tags'}")
    print("=" * 80)
    for t in final_targets:
        safe_name = t['name'][:34].encode('ascii', errors='replace').decode('ascii')
        print(f"{t['appid']:<10} {safe_name:<35} {t['negative']:<10} ${t['price_usd']:<7.2f} {t['release_date'][:14]:<15} {t['tags_matched'][0]}")
    print("=" * 80)
    elapsed_total = time.time() - start_time
    print(f"\nTotal found: {len(final_targets)} targets saved to output/targets.json")
    print(f"Time elapsed: {str(timedelta(seconds=int(elapsed_total)))}")


if __name__ == '__main__':
    main()
