"""
semcomp.py — Smart semantic compression router for Steam reviews.

Classifies each review by (length, language, structure, signal_density),
then routes to the optimal compression algorithm and configuration.

Public API:
    from semcomp import compress, compress_batch, RouteDecision

    text, decision = compress(text, all_texts)
    print(decision.algo, decision.profile)

    results = compress_batch(texts)   # shares IDF corpus across all
"""

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Callable

# ── Thresholds ────────────────────────────────────────────────────────────────

SHORT_LIMIT     = 300    # chars — return as-is below this
LONG_LIMIT      = 900    # chars — "LONG" above this
VERY_LONG_LIMIT = 2000   # chars — "VERY_LONG": increase n cap
CJK_THRESHOLD   = 0.15   # fraction of CJK chars → flag as CJK
LIST_THRESHOLD  = 0.30   # fraction of lines that look like list items
MIXED_THRESHOLD = 0.10   # lower bound for "MIXED" structure
LOW_DENSITY     = 0.8    # pain words per 100 chars
HIGH_DENSITY    = 2.0

# ── Word lists ────────────────────────────────────────────────────────────────

_STOPWORDS = set(
    "the a an and or but in on at to of for is was are were be been being "
    "have has had do does did will would could should may might can this that these those "
    "it its i me my we our you your he she him his her they them their with from by not "
    "no so very also just about up when if then all some any many one two more "
    "game games play played playing".split()
)

_PAIN_WORDS = set(
    "broken bug crash freeze lag stutter horrible terrible awful disgusting "
    "waste refund disappointed frustrating unplayable unfinished incomplete "
    "missing locked dlc expensive overpriced trash garbage forced never quit "
    "annoying ridiculous useless regret mistake worse worst failed fail ruin "
    "ruined dead killed remove stupid lazy greedy money pay".split()
)

# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class ReviewProfile:
    length_class: str   # SHORT | MEDIUM | LONG
    lang_class:   str   # LATIN | CJK | MIXED
    structure:    str   # NARRATIVE | LIST | MIXED
    density:      str   # LOW | MEDIUM | HIGH
    char_count:   int


@dataclass
class RouteDecision:
    algo:    str
    config:  dict = field(default_factory=dict)
    profile: ReviewProfile = None

    def __str__(self) -> str:
        p = self.profile
        cfg = ", ".join(f"{k}={v}" for k, v in self.config.items())
        return (
            f"[{self.algo}({cfg})] "
            f"{p.length_class}/{p.lang_class}/{p.structure}/{p.density} "
            f"({p.char_count}c)"
        )


# ── Classifier ────────────────────────────────────────────────────────────────

def _cjk_ratio(text: str) -> float:
    if not text:
        return 0.0
    cjk = sum(
        1 for c in text
        if "\u3000" <= c <= "\u9fff" or "\uf900" <= c <= "\ufaff"
    )
    return cjk / len(text)


def _list_ratio(text: str) -> float:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return 0.0
    pat = re.compile(r"^(\d+[.)]\s|[-•*]\s)")
    return sum(1 for l in lines if pat.match(l)) / len(lines)


def _pain_density(text: str) -> float:
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    pain = sum(1 for w in words if w in _PAIN_WORDS)
    return pain / max(len(text) / 100, 1)


def classify(text: str) -> ReviewProfile:
    n = len(text)

    if n < SHORT_LIMIT:
        length_class = "SHORT"
    elif n >= VERY_LONG_LIMIT:
        length_class = "VERY_LONG"
    elif n >= LONG_LIMIT:
        length_class = "LONG"
    else:
        length_class = "MEDIUM"

    cjk = _cjk_ratio(text)
    if cjk > 0.4:
        lang_class = "CJK"
    elif cjk > CJK_THRESHOLD:
        lang_class = "MIXED"
    else:
        lang_class = "LATIN"

    lr = _list_ratio(text)
    if lr >= LIST_THRESHOLD:
        structure = "LIST"
    elif lr >= MIXED_THRESHOLD:
        structure = "MIXED"
    else:
        structure = "NARRATIVE"

    d = _pain_density(text)
    density = "HIGH" if d >= HIGH_DENSITY else ("LOW" if d < LOW_DENSITY else "MEDIUM")

    return ReviewProfile(length_class, lang_class, structure, density, n)


# ── Shared helpers ────────────────────────────────────────────────────────────

def _tok(text: str) -> list:
    return re.findall(r"\b[a-z]{3,}\b", text.lower())


def _split_latin(text: str, min_words: int = 8) -> list:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [
        p.strip() for p in parts
        if len(p.strip().split()) >= min_words and p.strip()[-1] in ".!?"
    ]


def _split_cjk(text: str) -> list:
    parts = re.split(r"(?<=[。！？\n])", text.strip())
    return [p.strip() for p in parts if len(p.strip()) >= 15]


def _build_idf(corpus_toks: list) -> dict:
    N = len(corpus_toks)
    df: Counter = Counter()
    for toks in corpus_toks:
        df.update(set(toks))
    return {w: math.log(N / (df[w] + 1)) for w in df}


# ── Algorithms ────────────────────────────────────────────────────────────────

def algo_as_is(text: str, all_texts: list, **_) -> str:
    return text


def algo_truncate(text: str, all_texts: list, limit: int = 600, **_) -> str:
    return text[:limit] + ("..." if len(text) > limit else "")


def algo_cjk_truncate(text: str, all_texts: list, limit: int = 500, **_) -> str:
    """CJK-aware sentence extraction: splits on 。！？ and newlines."""
    sents = _split_cjk(text)
    out, total = [], 0
    for s in sents:
        if total + len(s) > limit:
            break
        out.append(s)
        total += len(s)
    return "".join(out) if out else text[:limit]


def algo_list_extract(text: str, all_texts: list, top_n: int = 4, **_) -> str:
    """Extract numbered/bulleted items, rank by pain signal, return top-N in order."""
    pat = re.compile(r"^(\d+[.)]\s|[-•*]\s)(.*)", re.MULTILINE)
    items = [m.group(2).strip() for m in pat.finditer(text)]
    if not items:
        return algo_truncate(text, all_texts)
    scored = sorted(
        [(sum(1 for w in _tok(i) if w in _PAIN_WORDS), i) for i in items],
        reverse=True,
    )
    top = {i for _, i in scored[:top_n]}
    ordered = [i for i in items if i in top]
    return "\n".join(ordered[:top_n])


def algo_emotion(text: str, all_texts: list, n: int = 3, **_) -> str:
    """Select sentences with highest pain/frustration signal."""
    sents = _split_latin(text)
    if len(sents) <= n:
        return text
    scored = []
    for sent in sents:
        words = _tok(sent)
        pain = sum(1 for w in words if w in _PAIN_WORDS)
        neg_bonus = 1.3 if any(w in ("not", "never") for w in words) else 1.0
        length_bonus = min(len(words) / 15.0, 2.0)
        scored.append(((pain + 0.5) * neg_bonus * length_bonus, sent))
    scored.sort(reverse=True)
    top = {s for _, s in scored[:n]}
    return " ".join(s for s in sents if s in top)


def algo_textrank(
    text: str,
    all_texts: list,
    n: int = 3,
    length_penalty: bool = False,
    iterations: int = 15,
    **_,
) -> str:
    """Graph-based ranking with optional length penalty to favour concise sentences."""
    sents = _split_latin(text, min_words=3)
    if len(sents) <= n:
        return text

    def _sim(s1: str, s2: str) -> float:
        w1 = set(_tok(s1)) - _STOPWORDS
        w2 = set(_tok(s2)) - _STOPWORDS
        if not w1 or not w2:
            return 0.0
        return len(w1 & w2) / (math.log(len(w1) + 1) + math.log(len(w2) + 1))

    num = len(sents)
    matrix = [[_sim(sents[i], sents[j]) for j in range(num)] for i in range(num)]
    scores = [1.0 / num] * num
    d = 0.85
    for _ in range(iterations):
        new = [(1 - d) / num] * num
        for i in range(num):
            for j in range(num):
                if i != j:
                    col_sum = sum(matrix[k][i] for k in range(num))
                    if col_sum > 0:
                        new[j] += d * scores[i] * matrix[j][i] / col_sum
        scores = new

    if length_penalty:
        scores = [
            s / math.log(max(len(sents[i].split()), 2))
            for i, s in enumerate(scores)
        ]

    ranked = sorted(range(num), key=lambda i: scores[i], reverse=True)[:n]
    ranked.sort()
    return " ".join(sents[i] for i in ranked)


def algo_tfidf_pos(
    text: str,
    all_texts: list,
    adaptive: bool = True,
    n: int = 3,
    guarantee_first: int = 0,
    **_,
) -> str:
    """
    TF-IDF sentence scoring with position bias.

    guarantee_first: always include the first N sentences regardless of score.
    adaptive:        scale n by text length (longer reviews → more sentences).
    """
    if len(text) < SHORT_LIMIT:
        return text
    sents = _split_latin(text, min_words=5)
    if len(sents) <= 2:
        return text

    corpus_toks = [_tok(t) for t in all_texts]
    idf = _build_idf(corpus_toks)
    doc_toks = _tok(text)
    tf = Counter(doc_toks)
    total = max(len(doc_toks), 1)

    scored = []
    for pos, sent in enumerate(sents):
        words = [w for w in _tok(sent) if w not in _STOPWORDS]
        if not words:
            continue
        tfidf_s = sum((tf.get(w, 0) / total) * idf.get(w, 0) for w in words) / len(words)
        pos_bonus = 0.30 if pos == 0 else (0.10 if pos == 1 else 0.0)
        pain_count = sum(1 for w in words if w in _PAIN_WORDS)
        pain_boost = 1.0 + 0.4 * pain_count
        scored.append((tfidf_s * (1 + pos_bonus) * pain_boost, sent))

    scored.sort(reverse=True)
    target_n = min(max(3, len(text) // 600), 5) if adaptive else n

    guaranteed = set(sents[:guarantee_first]) if guarantee_first else set()
    top = guaranteed | {s for _, s in scored[:target_n]}
    ordered = [s for s in sents if s in top]
    return " ".join(ordered[: target_n + guarantee_first])


def algo_hybrid_list_tfidf(
    text: str,
    all_texts: list,
    list_top: int = 3,
    tfidf_n: int = 2,
    **_,
) -> str:
    """
    For MIXED structure: extract top list items by pain signal,
    then compress remaining narrative with TF-IDF.
    """
    list_pat = re.compile(r"^(\d+[.)]\s|[-•*]\s)(.*)", re.MULTILINE)
    items = [m.group(2).strip() for m in list_pat.finditer(text)]

    non_list = " ".join(
        l.strip()
        for l in text.splitlines()
        if l.strip() and not re.match(r"^(\d+[.)]\s|[-•*]\s)", l.strip())
    )

    parts: list[str] = []

    if items:
        scored = sorted(
            [(sum(1 for w in _tok(i) if w in _PAIN_WORDS), i) for i in items],
            reverse=True,
        )
        parts.extend(i for _, i in scored[:list_top])

    if len(non_list) > 100 and all_texts:
        compressed = algo_tfidf_pos(non_list, all_texts, adaptive=False, n=tfidf_n)
        if compressed and compressed != non_list:
            parts.append(compressed)

    return " | ".join(parts) if parts else algo_truncate(text, all_texts)


# ── Router ────────────────────────────────────────────────────────────────────

_ALGO_MAP: dict[str, Callable] = {
    "as_is":             algo_as_is,
    "truncate":          algo_truncate,
    "cjk_truncate":      algo_cjk_truncate,
    "list_extract":      algo_list_extract,
    "emotion":           algo_emotion,
    "textrank":          algo_textrank,
    "tfidf_pos":         algo_tfidf_pos,
    "hybrid_list_tfidf": algo_hybrid_list_tfidf,
}


def _route(profile: ReviewProfile) -> tuple[str, dict]:
    lc = profile.length_class
    la = profile.lang_class
    st = profile.structure
    de = profile.density

    if lc == "SHORT":
        return "as_is", {}

    if la == "CJK":
        return "cjk_truncate", {"limit": 500}

    if la == "MIXED":
        return "truncate", {"limit": 600}

    # LATIN only below
    if st == "LIST":
        return "list_extract", {"top_n": 5 if lc == "LONG" else 4}

    if st == "MIXED":
        return "hybrid_list_tfidf", {"list_top": 3, "tfidf_n": 2}

    # NARRATIVE
    if lc == "MEDIUM":
        if de == "HIGH":
            return "emotion", {"n": 3}
        if de == "LOW":
            return "tfidf_pos", {"n": 2, "adaptive": False, "guarantee_first": 1}
        return "tfidf_pos", {"n": 3, "adaptive": False}

    if lc == "VERY_LONG":
        # Large reviews: raise n cap to 8, always keep first 2 sentences
        return "tfidf_pos", {"adaptive": False, "n": 8, "guarantee_first": 2}

    if lc == "LONG":
        if de == "LOW":
            return "tfidf_pos", {"adaptive": True, "guarantee_first": 2}
        return "tfidf_pos", {"adaptive": True}

    return "truncate", {"limit": 600}


# ── Public API ────────────────────────────────────────────────────────────────

def compress(text: str, all_texts: list) -> tuple[str, RouteDecision]:
    """
    Compress a single review using the best algorithm for its profile.

    Args:
        text:      Review text to compress.
        all_texts: Full corpus of reviews for this game (for IDF calculation).

    Returns:
        (compressed_text, RouteDecision)
    """
    profile = classify(text)
    algo_name, config = _route(profile)
    result = _ALGO_MAP[algo_name](text, all_texts, **config)
    return result, RouteDecision(algo=algo_name, config=config, profile=profile)


def compress_batch(texts: list[str]) -> list[tuple[str, RouteDecision]]:
    """Compress a list of reviews sharing one IDF corpus."""
    return [compress(t, texts) for t in texts]
