"""
compress_reviews.py — batch semantic compression of collected reviews.

For each game in output/reviews/*.json:
  - Takes negative reviews with votes_up > 0 (useful negatives)
  - Builds IDF corpus from top-100 of them (same as analyze_reviews.py)
  - Compresses each qualifying review using semcomp
  - Writes output/reviews/{appid}_compressed.json
    (array of {review_id, compressed_text, semcomp_algo, votes_up})

Usage:
    python compress_reviews.py [--limit N] [--no-force]

    --limit N    process only first N games
    --no-force   skip if _compressed.json already exists
"""
import io
import json
import os
import sys
import time
import argparse
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from semcomp import compress as semcompress

REVIEWS_DIR = Path("output/reviews")


def load_reviews(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_useful_negatives(reviews: list) -> list:
    """Negative reviews with at least 1 helpful vote, sorted by votes_up desc."""
    neg = [r for r in reviews if not r.get("voted_up", True) and r.get("votes_up", 0) > 0]
    neg.sort(key=lambda r: r.get("votes_up", 0), reverse=True)
    return neg


def compress_game(src_path: Path, dst_path: Path) -> dict:
    t0 = time.time()
    data = load_reviews(src_path)
    reviews = data.get("reviews", [])

    useful_neg = get_useful_negatives(reviews)
    idf_corpus = [r.get("text", "") for r in useful_neg[:100]]

    compressed = []
    for r in useful_neg:
        text = r.get("text", "")
        if text:
            compressed_text, decision = semcompress(text, idf_corpus)
            algo = decision.algo
        else:
            compressed_text = text
            algo = "as_is"

        compressed.append({
            "review_id":       r.get("review_id"),
            "votes_up":        r.get("votes_up", 0),
            "playtime_minutes": r.get("playtime_minutes", 0),
            "review_date":     r.get("review_date", ""),
            "developer_response": r.get("developer_response"),
            "compressed_text": compressed_text,
            "semcomp_algo":    algo,
        })

    result = {
        "appid":           data.get("appid"),
        "name":            data.get("name"),
        "semcomp_version": "1.0",
        "reviews":         compressed,
    }

    with open(dst_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    elapsed = time.time() - t0
    return {
        "total_in_file": len(reviews),
        "useful_neg":    len(useful_neg),
        "compressed":    len(compressed),
        "elapsed":       elapsed,
    }


def _eta(done: int, total: int, elapsed: float) -> str:
    if done == 0 or elapsed == 0:
        return "?h ??m"
    rate = done / elapsed
    remaining = (total - done) / rate
    h, r = divmod(int(remaining), 3600)
    return f"{h}h {r//60:02d}m"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit",    type=int,  default=0,     help="Process only first N games")
    parser.add_argument("--no-force", action="store_true",      help="Skip if _compressed.json exists")
    args = parser.parse_args()
    force = not args.no_force

    src_files = sorted(
        p for p in REVIEWS_DIR.glob("*.json")
        if not p.stem.endswith("_compressed") and p.stem != "index"
    )
    if args.limit:
        src_files = src_files[: args.limit]

    total_games  = len(src_files)
    done         = 0
    skipped      = 0
    total_comp   = 0
    t_start      = time.time()

    print(f"╔{'═'*58}╗")
    print(f"║  COMPRESS REVIEWS  │  {total_games} games{'':>29}║")
    print(f"║  Filter: negative + votes_up > 0  │  semcomp v1.0{'':>6}║")
    print(f"╚{'═'*58}╝")

    for i, src in enumerate(src_files, 1):
        appid = src.stem
        dst   = REVIEWS_DIR / f"{appid}_compressed.json"

        if dst.exists() and not force:
            skipped += 1
            print(f"  [{i:>4}/{total_games}] {appid:<12}  SKIP")
            continue

        try:
            s = compress_game(src, dst)
            done       += 1
            total_comp += s["compressed"]
            elapsed     = time.time() - t_start
            rate        = done / elapsed * 60

            print(
                f"  [{i:>4}/{total_games}] {appid:<12}"
                f"  {s['useful_neg']:>5} neg  →  {s['compressed']:>5} compressed"
                f"  {s['elapsed']:>4.1f}s"
                f"  │  {rate:>5.1f} g/min"
                f"  ETA {_eta(i, total_games, elapsed)}"
            )
        except Exception as e:
            print(f"  [{i:>4}/{total_games}] {appid:<12}  ERR: {e}")

    elapsed_total = time.time() - t_start
    h, r = divmod(int(elapsed_total), 3600)
    print(f"\n╔{'═'*58}╗")
    print(f"║  Done: {done} games  │  {total_comp:,} reviews compressed  │  {h}h {r//60:02d}m{'':>4}║")
    print(f"╚{'═'*58}╝")


if __name__ == "__main__":
    main()
