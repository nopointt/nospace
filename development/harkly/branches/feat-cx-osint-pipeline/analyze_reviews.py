"""
analyze_reviews.py — JTBD analysis of collected reviews via OpenRouter LLM.

Features:
- Watches output/reviews/ for new {appid}.json files
- Programmatic pre-filter: top-100 negative reviews by votes_up
- 3 parallel workers using 3 OpenRouter keys
- Writes {appid}_jtbd.json + {appid}_jtbd.md to output/reports/
- Updates index.json with report_ready=True and jtbd_score

Usage:
    python analyze_reviews.py                  # watch mode (runs until Ctrl+C)
    python analyze_reviews.py --appid 1351240  # single game
    python analyze_reviews.py --limit 10       # process 10 unanalyzed games
    python analyze_reviews.py --workers 3      # parallel workers (default: 3)
    python analyze_reviews.py --model google/gemini-2.0-flash-001  # override model
"""

import json
import math
import os
import re
import time
import argparse
import threading
import queue
import sys
import urllib.request
import urllib.parse
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent
REVIEWS_DIR = BASE_DIR / "output" / "reviews"
REPORTS_DIR = BASE_DIR / "output" / "reports"
INDEX_FILE = REVIEWS_DIR / "index.json"

load_dotenv(BASE_DIR / ".env")

OPENROUTER_KEYS = [
    os.getenv("OPENROUTER_KEY_1", ""),
    os.getenv("OPENROUTER_KEY_2", ""),
    os.getenv("OPENROUTER_KEY_3", ""),
]

DEFAULT_MODEL = "deepseek/deepseek-chat"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

index_lock = threading.Lock()

SYSTEM_PROMPT = """You are a senior CX analyst specializing in Jobs-to-be-Done framework.
Analyze the following Steam game reviews. Return ONLY valid JSON, no markdown, no code blocks.

JTBD ANALYSIS TASK:

1. Identify the CORE JOB players hired this game to do (functional, emotional, social dimensions).

2. Find TOP 3-5 STRUGGLE MOMENTS where the game failed the job.
   For each struggle provide:
   - name: short descriptive label (3-6 words)
   - frequency_pct: estimated % of reviews mentioning this (integer)
   - intensity: emotional intensity 1-5 (5 = rage/grief)
   - trend: "worsening" | "stable" | "improving" (based on chronology of reviews if visible)
   - quotes: array of 2-3 best verbatim quotes (exact text from reviews, no paraphrasing)
   - outcome_gap: "players expected X, but got Y"

3. DEVELOPER RESPONSIVENESS:
   - dev_responds: true if developer responses appear in the data, else false
   - responsiveness_note: one sentence assessment

4. JTBD USEFULNESS SCORE (0-10) for cold outreach. Score each criterion:
   - pain_specificity: are complaints about fixable CX/UX/content issues? 0=vague, 1=somewhat, 2=clear, 3=very specific
   - negative_volume: negative rate >20% = 2, 10-20% = 1, <10% = 0
   - recency: majority of complaints in last 90 days = 2, else 0
   - dev_silence: no developer responses = 2, some = 1, active = 0
   - hook_clarity: a clear "we can help with X" sentence is obvious = 1, else 0

5. OUTREACH HOOK: one sentence (max 25 words) that would resonate with the studio's dev team.
   Must reference a specific pain from the data, not generic.

6. SUMMARY: 3-4 sentence plain text summary for quick scanning.

Return this exact JSON structure:
{
  "core_job": {
    "functional": "string",
    "emotional": "string",
    "social": "string"
  },
  "struggle_moments": [
    {
      "name": "string",
      "frequency_pct": integer,
      "intensity": integer,
      "trend": "worsening|stable|improving",
      "quotes": ["string", "string"],
      "outcome_gap": "string"
    }
  ],
  "dev_responds": boolean,
  "responsiveness_note": "string",
  "jtbd_score": integer,
  "score_breakdown": {
    "pain_specificity": integer,
    "negative_volume": integer,
    "recency": integer,
    "dev_silence": integer,
    "hook_clarity": integer
  },
  "outreach_hook": "string",
  "summary": "string"
}"""


# TF-IDF semantic compression — extracts most informative sentences per review
_STOPWORDS = set(
    "the a an and or but in on at to of for is was are were be been being "
    "have has had do does did will would could should may might can this that these those "
    "it its i me my we our you your he she him his her they them their with from by not "
    "no so very also just about up when if then all some any many one two more "
    "game games play played playing".split()
)


def _tok(text: str) -> list:
    return re.findall(r"\b[a-z]{3,}\b", text.lower())


def _sentences(text: str) -> list:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if len(p.strip().split()) >= 10]


def _compress_tfidf(text: str, all_texts: list) -> str:
    """Return the most informative sentences via TF-IDF. Short reviews returned as-is."""
    if len(text) < 400:
        return text
    sents = _sentences(text)
    if len(sents) <= 3:
        return text

    # Build IDF from the game's full review corpus
    corpus = [_tok(t) for t in all_texts]
    N = len(corpus)
    df: Counter = Counter()
    for toks in corpus:
        df.update(set(toks))
    idf = {w: math.log(N / (df[w] + 1)) for w in df}

    doc_toks = _tok(text)
    tf = Counter(doc_toks)
    total = max(len(doc_toks), 1)

    scored = []
    for pos, sent in enumerate(sents):
        words = [w for w in _tok(sent) if w not in _STOPWORDS]
        if not words:
            continue
        tfidf_score = sum((tf.get(w, 0) / total) * idf.get(w, 0) for w in words) / len(words)
        # Position bias: первое предложение часто содержит главный тезис
        position_bonus = 0.3 if pos == 0 else (0.1 if pos == 1 else 0.0)
        score = tfidf_score + position_bonus * tfidf_score
        scored.append((score, sent))

    scored.sort(reverse=True)
    n = min(max(3, len(text) // 600), 5)  # adaptive: longer review → more sentences
    top = {s for _, s in scored[:n]}
    ordered = [s for s in sents if s in top]
    return " ".join(ordered[:n])


def prepare_reviews_for_llm(reviews: list) -> str:
    negatives = [r for r in reviews if not r.get("voted_up", True)]
    negatives.sort(key=lambda r: r.get("votes_up", 0), reverse=True)
    top100 = negatives[:100]

    all_texts = [r.get("text", "") for r in top100]  # corpus for IDF

    from semcomp import compress as _semcompress

    lines = []
    for i, r in enumerate(top100, 1):
        hrs = r.get("playtime_minutes", 0) // 60
        date_str = r.get("review_date", "")[:10]
        dev_note = " [DEV REPLIED]" if r.get("developer_response") else ""
        text, _ = _semcompress(r.get("text", ""), all_texts)
        lines.append(
            f"[{i}] {date_str} | {hrs}hrs played | {r.get('votes_up', 0)} helpful{dev_note}\n{text}"
        )

    return "\n\n---\n\n".join(lines)


def call_llm(reviews_text: str, game_name: str, api_key: str, model: str) -> dict:
    user_msg = f"Game: {game_name}\n\nReviews:\n\n{reviews_text}"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://harkly.io",
            "X-Title": "Harkly CX Pipeline",
        },
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
                result = json.loads(raw)
                if "error" in result:
                    raise RuntimeError(f"API error: {result['error']}")
                if not result.get("choices"):
                    raise RuntimeError(f"No choices in response: {raw[:300]}")
                content = result["choices"][0]["message"]["content"]
                # strip markdown code fences if present
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                return json.loads(content.strip())
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"    HTTP {e.code} error body: {body[:500]}")
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                raise RuntimeError(f"LLM HTTP {e.code} after 3 attempts: {body[:200]}")
        except Exception as e:
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                raise RuntimeError(f"LLM call failed after 3 attempts: {e}")

    return {}


def render_report(game_data: dict, analysis: dict) -> str:
    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
    appid = game_data["appid"]
    name = game_data["name"]
    score = analysis.get("jtbd_score", 0)
    bd = analysis.get("score_breakdown", {})

    lines = [
        f"# JTBD Report: {name}",
        f"**appid:** {appid} | **Score:** {score}/10 | **Generated:** {now}",
        "",
        "## Summary",
        analysis.get("summary", ""),
        "",
        "## Core Job",
        f"- **Functional:** {analysis.get('core_job', {}).get('functional', '')}",
        f"- **Emotional:** {analysis.get('core_job', {}).get('emotional', '')}",
        f"- **Social:** {analysis.get('core_job', {}).get('social', '')}",
        "",
        "## Top Struggle Moments",
    ]

    for i, s in enumerate(analysis.get("struggle_moments", []), 1):
        lines.append(
            f"\n### {i}. {s.get('name', '')} "
            f"({s.get('frequency_pct', 0)}% of reviews | "
            f"intensity {s.get('intensity', 0)}/5 | "
            f"trend: {s.get('trend', '')})"
        )
        for q in s.get("quotes", []):
            lines.append(f'> "{q}"')
        lines.append(f"\n**Outcome gap:** {s.get('outcome_gap', '')}")

    lines += [
        "",
        "## Developer Responsiveness",
        analysis.get("responsiveness_note", ""),
        "",
        "## Outreach Hook",
        f'> {analysis.get("outreach_hook", "")}',
        "",
        f"## JTBD Score: {score}/10",
        "| Criterion | Score |",
        "|-----------|-------|",
        f"| Pain specificity | {bd.get('pain_specificity', 0)}/3 |",
        f"| Negative signal volume | {bd.get('negative_volume', 0)}/2 |",
        f"| Recency | {bd.get('recency', 0)}/2 |",
        f"| Developer silence | {bd.get('dev_silence', 0)}/2 |",
        f"| Hook clarity | {bd.get('hook_clarity', 0)}/1 |",
        "",
        "## Stats",
        f"- Reviews analyzed: {game_data.get('negative_collected', 0)} negative of {game_data.get('reviews_collected', 0)} total",
        f"- Period: {game_data.get('date_from', '')} – {game_data.get('date_to', '')}",
        (f"- Negative rate in period: "
         f"{round(game_data.get('negative_collected', 0) / max(game_data.get('reviews_collected', 1), 1) * 100, 1)}%"),
        f"- Developer responses in data: {game_data.get('dev_responses_count', 0)}",
    ]

    return "\n".join(lines)


def update_index_report(appid: int, score: int):
    with index_lock:
        if not INDEX_FILE.exists():
            return
        with open(INDEX_FILE, encoding="utf-8") as f:
            index = json.load(f)
        for entry in index["games"]:
            if entry["appid"] == appid:
                entry["report_ready"] = True
                entry["jtbd_score"] = score
                break
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)


class AnalyzerStats:
    def __init__(self, n_workers: int):
        self._lock = threading.Lock()
        self.done = 0
        self.errors = 0
        self._state: dict = {i + 1: ("WAITING", 0, "") for i in range(n_workers)}

    def set_analyzing(self, wid: int, appid: int, name: str):
        with self._lock:
            self._state[wid] = ("ANALYZING", appid, name)

    def set_waiting(self, wid: int):
        with self._lock:
            self._state[wid] = ("WAITING", 0, "")

    def mark_done(self, wid: int):
        with self._lock:
            self.done += 1
            self._state[wid] = ("WAITING", 0, "")

    def mark_error(self, wid: int):
        with self._lock:
            self.errors += 1
            self._state[wid] = ("WAITING", 0, "")

    def all_idle(self) -> bool:
        with self._lock:
            return all(s == "WAITING" for s, _, _ in self._state.values())

    def print_status(self, pending: int):
        with self._lock:
            now = datetime.now().strftime("%H:%M:%S")
            print(f"\n{'=' * 46}", flush=True)
            print(f"  HARKLY ANALYZER  |  {now}", flush=True)
            print(f"  Done: {self.done}  Pending: {pending}  Errors: {self.errors}", flush=True)
            print(f"  {'-' * 42}", flush=True)
            for wid in sorted(self._state):
                state, appid, name = self._state[wid]
                if state == "ANALYZING":
                    print(f"  [W{wid}] ANALYZING  {appid}  {name}", flush=True)
                else:
                    print(f"  [W{wid}] WAITING    (queue empty)", flush=True)
            print(f"{'=' * 46}", flush=True)


def analyze_game(appid: int, api_key: str, model: str, verbose: bool = False) -> int:
    """Analyze one game. Returns jtbd_score (0-10), or -1 if skipped, -2 on error."""
    reviews_file = REVIEWS_DIR / f"{appid}.json"
    json_out = REPORTS_DIR / f"{appid}_jtbd.json"
    md_out = REPORTS_DIR / f"{appid}_jtbd.md"

    if json_out.exists():
        return -1  # already done

    if not reviews_file.exists():
        print(f"  ERROR: {reviews_file} not found")
        return -2

    with open(reviews_file, encoding="utf-8") as f:
        game_data = json.load(f)

    name = game_data.get("name", str(appid))
    reviews = game_data.get("reviews", [])
    negative_count = game_data.get("negative_collected", 0)

    if negative_count < 5:
        return -1  # skip — not enough negatives

    reviews_text = prepare_reviews_for_llm(reviews)
    analysis = call_llm(reviews_text, name, api_key, model)

    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)

    report_md = render_report(game_data, analysis)
    with open(md_out, "w", encoding="utf-8") as f:
        f.write(report_md)

    score = analysis.get("jtbd_score", 0)
    update_index_report(appid, score)
    return score


def _get_game_name(appid: int) -> str:
    reviews_file = REVIEWS_DIR / f"{appid}.json"
    try:
        with open(reviews_file, encoding="utf-8") as f:
            return json.load(f).get("name", str(appid))
    except Exception:
        return str(appid)


def worker(
    worker_id: int,
    task_queue: queue.Queue,
    api_key: str,
    model: str,
    verbose: bool,
    stats: AnalyzerStats,
    stop_event: threading.Event,
):
    while not stop_event.is_set():
        try:
            appid = task_queue.get(timeout=3)
        except queue.Empty:
            stats.set_waiting(worker_id)
            continue

        name = _get_game_name(appid)
        stats.set_analyzing(worker_id, appid, name)
        t0 = time.time()
        try:
            score = analyze_game(appid, api_key, model, verbose)
            elapsed = int(time.time() - t0)
            if score == -1:
                print(f"[W{worker_id}] SKIP  {appid} {name}", flush=True)
            else:
                print(f"[W{worker_id}] DONE  {appid} {name}  score={score}/10  ({elapsed}s)", flush=True)
            stats.mark_done(worker_id)
        except Exception as e:
            elapsed = int(time.time() - t0)
            print(f"[W{worker_id}] ERR   {appid} {name}  {e}  ({elapsed}s)", flush=True)
            stats.mark_error(worker_id)
        finally:
            task_queue.task_done()


def get_pending_appids() -> list:
    """Return appids that have reviews but no report yet."""
    if not REVIEWS_DIR.exists():
        return []
    pending = []
    for p in REVIEWS_DIR.glob("*.json"):
        if p.name == "index.json":
            continue
        appid = int(p.stem)
        if not (REPORTS_DIR / f"{appid}_jtbd.json").exists():
            pending.append(appid)
    return pending


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--appid", type=int, help="Analyze single game")
    parser.add_argument("--limit", type=int, help="Process N pending games, then stop")
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    keys = [k for k in OPENROUTER_KEYS if k]
    if not keys:
        print("ERROR: No OpenRouter keys found in .env")
        sys.exit(1)

    # Single-game shortcut
    if args.appid:
        print(f"Single game mode: {args.appid}")
        score = analyze_game(args.appid, keys[0], args.model, verbose=True)
        print(f"Done: score={score}/10" if score >= 0 else "Done: skipped")
        return

    n_workers = min(args.workers, len(keys))
    stop_event = threading.Event()
    stats = AnalyzerStats(n_workers)
    task_queue: queue.Queue = queue.Queue()
    seen: set = set()
    batch_mode = bool(args.limit)

    # Initial scan
    pending = get_pending_appids()
    if args.limit:
        pending = pending[:args.limit]
    for appid in pending:
        task_queue.put(appid)
        seen.add(appid)

    print(f"Initial queue: {len(pending)} games | workers: {n_workers} | model: {args.model}")
    print("Ctrl+C to stop\n")

    # Start worker threads
    threads = []
    for i in range(n_workers):
        key = keys[i % len(keys)]
        t = threading.Thread(
            target=worker,
            args=(i + 1, task_queue, key, args.model, args.verbose, stats, stop_event),
            daemon=True,
        )
        t.start()
        threads.append(t)

    # Main watcher loop
    last_status = time.time()
    try:
        while not stop_event.is_set():
            # Watch for new review files (skip in batch/limit mode)
            if not batch_mode:
                for p in REVIEWS_DIR.glob("*.json"):
                    if p.name == "index.json":
                        continue
                    appid = int(p.stem)
                    if appid not in seen:
                        seen.add(appid)
                        if not (REPORTS_DIR / f"{appid}_jtbd.json").exists():
                            task_queue.put(appid)

            # Print status every 10s
            if time.time() - last_status >= 10:
                stats.print_status(task_queue.qsize())
                last_status = time.time()

            # In batch mode: stop when queue empty and all workers idle
            if batch_mode and task_queue.empty() and stats.all_idle():
                break

            time.sleep(3)
    except KeyboardInterrupt:
        print("\nStopping...")

    stop_event.set()
    task_queue.join()
    print(f"\nAll done. Analyzed: {stats.done}  Errors: {stats.errors}")


if __name__ == "__main__":
    main()
