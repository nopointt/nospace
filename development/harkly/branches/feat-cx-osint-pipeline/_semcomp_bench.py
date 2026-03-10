"""
_semcomp_bench.py — semcomp quality benchmark.

Fetches fresh Steam reviews (no local files needed), runs semcomp.compress(),
measures PQC / PDR / Token Budget / Compression Ratio / UTC.

Usage:
    python _semcomp_bench.py [--games N] [--reviews N]

Targets:
    PQC  > 0.75    Pain Quote Coverage
    PDR  >= 1.0    Pain Density Ratio
    Tok  < 15000   Token budget per game (top-100 reviews)
    Comp  60-80%   Compression ratio
    UTC  > 0.70    Unique Topic Coverage
"""
import io
import re
import sys
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
import time
import math
import argparse
import urllib.request
import urllib.error
from collections import Counter
from pathlib import Path

REVIEWS_DIR = Path("output/reviews")

from semcomp import compress as semcompress, _PAIN_WORDS

# ── Test games ────────────────────────────────────────────────────────────────

TEST_GAMES = [
    (1295660, "Civ VII"),
    (24010,   "Train Sim Classic"),
    (553850,  "HELLDIVERS 2"),
    (2379780, "Palworld"),
    (1263990, "Wo Long"),
]

# ── Steam API fetch ────────────────────────────────────────────────────────────

def fetch_negatives(appid: int, max_reviews: int = 50) -> list[str]:
    """Fetch up to max_reviews negative reviews from Steam API."""
    texts = []
    cursor = "*"
    headers = {"User-Agent": "Mozilla/5.0"}
    for _ in range(5):
        if len(texts) >= max_reviews:
            break
        url = (
            f"https://store.steampowered.com/appreviews/{appid}"
            f"?json=1&filter=recent&review_type=negative&num_per_page=20"
            f"&cursor={urllib.parse.quote(cursor, safe='')}"
            if cursor != "*"
            else f"https://store.steampowered.com/appreviews/{appid}"
                 f"?json=1&filter=recent&review_type=negative&num_per_page=20&cursor=*"
        )
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  [WARN] fetch {appid} page failed: {e}", file=sys.stderr)
            break
        reviews = data.get("reviews", [])
        if not reviews:
            break
        for r in reviews:
            t = r.get("review", "").strip()
            if t:
                texts.append(t)
        cursor = data.get("cursor", "")
        if not cursor:
            break
        time.sleep(0.5)
    return texts[:max_reviews]


# urllib.parse needed for cursor encoding
import urllib.parse  # noqa: E402


def load_local_negatives(appid: int, max_reviews: int = 50) -> tuple[list[str], str]:
    """Load useful negative reviews from local file. Returns (texts, game_name)."""
    path = REVIEWS_DIR / f"{appid}.json"
    if not path.exists():
        return [], f"appid:{appid}"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    name = data.get("name", f"appid:{appid}")
    reviews = data.get("reviews", [])
    neg = [r for r in reviews if not r.get("voted_up", True) and r.get("votes_up", 0) > 0]
    neg.sort(key=lambda r: r.get("votes_up", 0), reverse=True)
    texts = [r.get("text", "") for r in neg[:max_reviews] if r.get("text", "")]
    return texts, name

# ── Metric helpers ────────────────────────────────────────────────────────────

def _words(text: str) -> list[str]:
    return re.findall(r"\b[a-z]{3,}\b", text.lower())


def _pain_words_set(text: str) -> set[str]:
    return set(_words(text)) & _PAIN_WORDS


def _split_sents(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def pain_sentences(text: str) -> list[str]:
    """Sentences containing at least 1 pain word."""
    return [s for s in _split_sents(text) if _pain_words_set(s)]


def pqc(original: str, compressed: str) -> float:
    """
    Pain Quote Coverage: fraction of pain sentences from original
    where ≥2 pain-word types appear in the compressed output.
    """
    pain_sents = pain_sentences(original)
    if not pain_sents:
        return 1.0
    comp_pain = _pain_words_set(compressed)
    retained = 0
    for sent in pain_sents:
        sent_pain = _pain_words_set(sent)
        needed = min(2, len(sent_pain))
        if len(sent_pain & comp_pain) >= needed:
            retained += 1
    return retained / len(pain_sents)


def pdr(original: str, compressed: str) -> float:
    """Pain Density Ratio: pain-density(compressed) / pain-density(original)."""
    def density(t: str) -> float:
        w = _words(t)
        pain = sum(1 for x in w if x in _PAIN_WORDS)
        return pain / max(len(t) / 100, 1)

    orig_d = density(original)
    if orig_d == 0:
        return 1.0  # no pain in original — trivially OK
    comp_d = density(compressed)
    return comp_d / orig_d


def utc(original: str, compressed: str) -> float:
    """Unique Topic Coverage: fraction of unique pain-word types retained."""
    orig_pain = _pain_words_set(original)
    if not orig_pain:
        return 1.0
    comp_pain = _pain_words_set(compressed)
    return len(orig_pain & comp_pain) / len(orig_pain)


# ── Benchmark core ────────────────────────────────────────────────────────────

def _is_cjk(text: str) -> bool:
    if not text:
        return False
    cjk = sum(1 for c in text if "\u3000" <= c <= "\u9fff" or "\uf900" <= c <= "\ufaff")
    return cjk / len(text) > 0.15


def run_game(appid: int, name: str, max_reviews: int, texts: list[str] | None = None) -> dict:
    if texts is None:
        print(f"\nFetching {name} ({appid})...", flush=True)
        texts = fetch_negatives(appid, max_reviews)
    else:
        print(f"\n{name} ({appid}) — {len(texts)} reviews", flush=True)
    if not texts:
        print(f"  [SKIP] no reviews", flush=True)
        return None

    all_texts = texts  # IDF corpus
    results = []
    for orig in texts:
        compressed, decision = semcompress(orig, all_texts)
        is_cjk_review = _is_cjk(orig)
        results.append({
            "orig": orig,
            "comp": compressed,
            "algo": decision.algo,
            "pqc":  pqc(orig, compressed),
            "pdr":  None if is_cjk_review else pdr(orig, compressed),
            "utc":  utc(orig, compressed),
            "comp_ratio": 1.0 - len(compressed) / max(len(orig), 1),
            "cjk": is_cjk_review,
        })

    # Token budget: extrapolate to top-100 from our sample
    avg_comp_len = sum(len(r["comp"]) for r in results) / max(len(results), 1)
    token_budget = int(avg_comp_len * 100 / 4)

    # Per-algo aggregation
    algo_stats = {}
    for r in results:
        a = r["algo"]
        if a not in algo_stats:
            algo_stats[a] = {"n": 0, "pqc": [], "pdr": [], "utc": [], "comp": []}
        s = algo_stats[a]
        s["n"] += 1
        s["pqc"].append(r["pqc"])
        if r["pdr"] is not None:
            s["pdr"].append(r["pdr"])
        s["utc"].append(r["utc"])
        s["comp"].append(r["comp_ratio"])

    non_cjk = [r for r in results if not r["cjk"]]
    compressed_only = [r for r in results if r["algo"] not in ("as_is", "cjk_truncate")]

    return {
        "name": name,
        "appid": appid,
        "n": len(results),
        "pqc":  sum(r["pqc"] for r in results) / len(results),
        "pdr":  (sum(r["pdr"] for r in non_cjk) / len(non_cjk)) if non_cjk else None,
        "utc":  sum(r["utc"] for r in results) / len(results),
        # Comp: only measure reviews that actually went through compression
        "comp": (sum(r["comp_ratio"] for r in compressed_only) / len(compressed_only))
                if compressed_only else 0.0,
        "tok":  token_budget,
        "algo_stats": algo_stats,
    }


def _avg(lst):
    return sum(lst) / len(lst) if lst else 0.0


def _fmt(val, target, fmt=".2f"):
    if val is None:
        return "  N/A  "
    ok = "✓" if _meets(val, target) else "✗"
    return f"{val:{fmt}}  {ok}"


def _meets(val, target) -> bool:
    if val is None:
        return True  # CJK PDR — skip
    kind, threshold = target
    if kind == ">":  return val > threshold
    if kind == ">=": return val >= threshold
    if kind == "<":  return val < threshold
    if kind == "range": return threshold[0] <= val <= threshold[1]
    return False


TARGETS = {
    "pqc":  (">",  0.75),
    "pdr":  (">=", 1.0),
    "tok":  ("<",  15000),
    "comp": ("range", (0.60, 0.80)),
    "utc":  (">",  0.70),
}


def print_game(g: dict):
    print(f"\n  Game: {g['name']} ({g['appid']}) | {g['n']} reviews")

    # Algo distribution
    dist = ", ".join(f"{a}×{s['n']}" for a, s in sorted(g["algo_stats"].items(), key=lambda x: -x[1]["n"]))
    print(f"  Algos: {dist}")

    print(f"  PQC   {_fmt(g['pqc'],  TARGETS['pqc'])}  (>0.75)")
    print(f"  PDR   {_fmt(g['pdr'],  TARGETS['pdr'])}  (>=1.0)")
    print(f"  Tok   {_fmt(g['tok'],  TARGETS['tok'], 'd')}  (<15000)  [est. top-100]")
    print(f"  Comp  {_fmt(g['comp'], TARGETS['comp'], '.0%')}  (60-80%)")
    print(f"  UTC   {_fmt(g['utc'],  TARGETS['utc'])}  (>0.70)")


def print_aggregate(games: list[dict]):
    valid = [g for g in games if g]
    if not valid:
        print("No results.")
        return

    pqc_agg  = _avg([g["pqc"] for g in valid])
    pdr_vals = [g["pdr"] for g in valid if g["pdr"] is not None]
    pdr_agg  = _avg(pdr_vals) if pdr_vals else None
    utc_agg  = _avg([g["utc"] for g in valid])
    comp_agg = _avg([g["comp"] for g in valid])
    tok_agg  = int(_avg([g["tok"] for g in valid]))

    print("\n" + "═" * 60)
    print("AGGREGATE (all games)")
    print(f"  PQC   {_fmt(pqc_agg,  TARGETS['pqc'])}  (>0.75)")
    print(f"  PDR   {_fmt(pdr_agg,  TARGETS['pdr'])}  (>=1.0)")
    print(f"  Tok   {_fmt(tok_agg,  TARGETS['tok'], 'd')}  (<15000)")
    print(f"  Comp  {_fmt(comp_agg, TARGETS['comp'], '.0%')}  (60-80%)")
    print(f"  UTC   {_fmt(utc_agg,  TARGETS['utc'])}  (>0.70)")

    # Per-algo breakdown
    algo_all: dict = {}
    for g in valid:
        for a, s in g["algo_stats"].items():
            if a not in algo_all:
                algo_all[a] = {"n": 0, "pqc": [], "pdr": [], "utc": [], "comp": []}
            x = algo_all[a]
            x["n"] += s["n"]
            x["pqc"].extend(s["pqc"])
            x["pdr"].extend(s["pdr"])
            x["utc"].extend(s["utc"])
            x["comp"].extend(s["comp"])

    print("\nPer-algo breakdown:")
    print(f"  {'Algo':<20} {'N':>4}  {'PQC':>6}  {'PDR':>6}  {'UTC':>6}  {'Comp':>6}")
    print("  " + "-" * 55)
    for a, s in sorted(algo_all.items(), key=lambda x: -x[1]["n"]):
        pqc_v = _avg(s["pqc"])
        pdr_v = _avg(s["pdr"]) if s["pdr"] else None
        utc_v = _avg(s["utc"])
        comp_v = _avg(s["comp"])
        pqc_ok = "✓" if pqc_v > 0.75 else "✗"
        pdr_ok = "✓" if (pdr_v is None or pdr_v >= 1.0) else "✗"
        utc_ok = "✓" if utc_v > 0.70 else "✗"
        comp_ok = "✓" if 0.60 <= comp_v <= 0.80 else "✗"
        pdr_str = f"{pdr_v:.2f}" if pdr_v is not None else " N/A "
        print(
            f"  {a:<20} {s['n']:>4}  "
            f"{pqc_v:.2f}{pqc_ok}  {pdr_str}{pdr_ok}  "
            f"{utc_v:.2f}{utc_ok}  {comp_v:.0%}{comp_ok}"
        )

    # Status
    checks = [
        _meets(pqc_agg, TARGETS["pqc"]),
        _meets(pdr_agg, TARGETS["pdr"]),
        _meets(tok_agg, TARGETS["tok"]),
        _meets(comp_agg, TARGETS["comp"]),
        _meets(utc_agg, TARGETS["utc"]),
    ]
    met = sum(checks)
    status = "ALL TARGETS MET ✓" if met == 5 else f"{met}/5 met — ITERATE"
    print(f"\nTARGETS: PQC>0.75  PDR>=1.0  Tok<15000  Comp=60-80%  UTC>0.70")
    print(f"STATUS:  {status}")
    print("═" * 60)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--games",   type=int,  default=0,  help="Number of games (default: 0=all for --local, 5 for API)")
    parser.add_argument("--reviews", type=int,  default=40, help="Negative reviews per game (default: 40)")
    parser.add_argument("--appids",  type=str,  default="", help="Comma-separated appids to test instead of defaults")
    parser.add_argument("--local",   action="store_true",   help="Use local output/reviews/*.json instead of Steam API")
    args = parser.parse_args()

    if args.local:
        # Discover all local review files
        src_files = sorted(
            p for p in REVIEWS_DIR.glob("*.json")
            if not p.stem.endswith("_compressed") and p.stem != "index"
        )
        if args.appids:
            wanted = {a.strip() for a in args.appids.split(",") if a.strip()}
            src_files = [p for p in src_files if p.stem in wanted]
        if args.games and not args.appids:
            src_files = src_files[: args.games]
        print("═" * 60)
        print(f"  SEMCOMP BENCHMARK  |  {len(src_files)} local games  |  top-{args.reviews} neg/game")
        print("═" * 60)
        game_results = []
        for p in src_files:
            appid = int(p.stem)
            texts, name = load_local_negatives(appid, args.reviews)
            g = run_game(appid, name, args.reviews, texts=texts)
            if g:
                print_game(g)
            game_results.append(g)
    else:
        if args.appids:
            games_to_run = [(int(a.strip()), f"appid:{a.strip()}") for a in args.appids.split(",") if a.strip()]
        else:
            games_to_run = TEST_GAMES[: args.games or 5]
        print("═" * 60)
        print(f"  SEMCOMP BENCHMARK  |  {len(games_to_run)} games  |  {args.reviews} reviews/game")
        print("═" * 60)
        game_results = []
        for appid, name in games_to_run:
            g = run_game(appid, name, args.reviews)
            if g:
                print_game(g)
            game_results.append(g)

    print_aggregate(game_results)


if __name__ == "__main__":
    main()
