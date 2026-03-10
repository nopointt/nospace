"""
Compression algorithm benchmark on real Steam review data.
Read-only analysis — does not modify any production files.
"""
import json, math, re
from collections import Counter

# Load real data — Civ VII top-10 negative reviews
with open('output/reviews/1295660.json', encoding='utf-8') as f:
    data = json.load(f)

negs = [r for r in data['reviews'] if not r.get('voted_up', True)]
negs.sort(key=lambda r: r.get('votes_up', 0), reverse=True)
corpus = negs[:10]
texts = [r['text'] for r in corpus]

print(f"Game: {data['name']}")
print(f"Reviews: {len(texts)} negative (top by votes_up)")
print(f"Original total chars: {sum(len(t) for t in texts)}")
print()


def tokenize(text):
    return re.findall(r'\b[a-z]{3,}\b', text.lower())


STOPWORDS = set(
    'the a an and or but in on at to of for is was are were be been being '
    'have has had do does did will would could should may might can this that these those '
    'it its i me my we our you your he she him his her they them their with from by not '
    'no so very also just about up when if then all some any many one two more '
    'game games play played playing'.split()
)

PAIN_WORDS = set(
    'broken bug crash freeze lag stutter horrible terrible awful disgusting '
    'pathetic waste refund scam disappointed frustrating unplayable unfinished incomplete '
    'missing locked dlc expensive overpriced trash garbage forced '
    'never stop quit annoying ridiculous absurd pointless useless regret mistake worse worst '
    'failed fail ruin ruined dead dying killed remove removed deleted stupid dumb lazy '
    'greedy money cash pay paid'.split()
)


def split_sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 20]


# ALG 1: Current — char truncation
def algo_truncate(text, limit=800):
    return text[:limit] + ('...' if len(text) > limit else '')


# ALG 2: TF-IDF sentence scoring
def algo_tfidf(text, all_texts, n_sentences=3):
    corpus_tokens = [tokenize(t) for t in all_texts]
    N = len(corpus_tokens)
    df = Counter()
    for tokens in corpus_tokens:
        df.update(set(tokens))
    idf = {w: math.log(N / (df[w] + 1)) for w in df}
    doc_tokens = tokenize(text)
    tf_counts = Counter(doc_tokens)
    total = max(len(doc_tokens), 1)
    sentences = split_sentences(text)
    if not sentences:
        return text[:800]
    scored = []
    for sent in sentences:
        words = [w for w in tokenize(sent) if w not in STOPWORDS]
        if not words:
            continue
        score = sum((tf_counts.get(w, 0) / total) * idf.get(w, 0) for w in words) / len(words)
        scored.append((score, sent))
    scored.sort(reverse=True)
    top = {s for _, s in scored[:n_sentences]}
    ordered = [s for s in sentences if s in top]
    return ' '.join(ordered[:n_sentences])


# ALG 3: TextRank
def sentence_similarity(s1, s2):
    w1 = set(tokenize(s1)) - STOPWORDS
    w2 = set(tokenize(s2)) - STOPWORDS
    if not w1 or not w2:
        return 0.0
    return len(w1 & w2) / (math.log(len(w1) + 1) + math.log(len(w2) + 1))


def algo_textrank(text, n_sentences=3, iterations=15):
    sentences = split_sentences(text)
    if len(sentences) <= n_sentences:
        return text
    n = len(sentences)
    sim = [[sentence_similarity(sentences[i], sentences[j]) for j in range(n)] for i in range(n)]
    scores = [1.0 / n] * n
    damping = 0.85
    for _ in range(iterations):
        new_scores = [(1 - damping) / n] * n
        for i in range(n):
            for j in range(n):
                if i != j:
                    col_sum = sum(sim[k][i] for k in range(n))
                    if col_sum > 0:
                        new_scores[j] += damping * scores[i] * sim[j][i] / col_sum
        scores = new_scores
    ranked = sorted(range(n), key=lambda i: scores[i], reverse=True)[:n_sentences]
    ranked.sort()
    return ' '.join(sentences[i] for i in ranked)


# ALG 4: MMR — Maximal Marginal Relevance
def algo_mmr(text, all_texts, n_sentences=3, lambda_=0.6):
    sentences = split_sentences(text)
    if len(sentences) <= n_sentences:
        return text
    corpus_tokens = [tokenize(t) for t in all_texts]
    N = len(corpus_tokens)
    df = Counter()
    for tokens in corpus_tokens:
        df.update(set(tokens))
    idf = {w: math.log(N / (df[w] + 1)) for w in df}
    doc_tokens = tokenize(text)
    tf_counts = Counter(doc_tokens)
    total = max(len(doc_tokens), 1)

    def relevance(sent):
        words = [w for w in tokenize(sent) if w not in STOPWORDS]
        if not words:
            return 0.0
        return sum((tf_counts.get(w, 0) / total) * idf.get(w, 0) for w in words) / len(words)

    rel_scores = {s: relevance(s) for s in sentences}
    selected = []
    remaining = list(sentences)
    while len(selected) < n_sentences and remaining:
        if not selected:
            best = max(remaining, key=lambda s: rel_scores[s])
        else:
            def mmr_score(s):
                rel = rel_scores[s]
                max_sim = max(sentence_similarity(s, sel) for sel in selected)
                return lambda_ * rel - (1 - lambda_) * max_sim
            best = max(remaining, key=mmr_score)
        selected.append(best)
        remaining.remove(best)
    order = [(sentences.index(s), s) for s in selected if s in sentences]
    order.sort()
    return ' '.join(s for _, s in order)


# ALG 5: Emotion-weighted (pain/frustration signals)
def algo_emotion(text, n_sentences=4):
    sentences = split_sentences(text)
    if len(sentences) <= n_sentences:
        return text
    scored = []
    for sent in sentences:
        words = tokenize(sent)
        pain_score = sum(1 for w in words if w in PAIN_WORDS)
        neg_bonus = 1.3 if any(w in ('not', 'never') for w in words) else 1.0
        length_bonus = min(len(words) / 15.0, 2.0)
        score = (pain_score + 0.5) * neg_bonus * length_bonus
        scored.append((score, sent))
    scored.sort(reverse=True)
    top = {s for _, s in scored[:n_sentences]}
    return ' '.join(s for s in sentences if s in top)


# ALG 6: TF-IDF + Emotion hybrid
def algo_hybrid(text, all_texts, n_sentences=3):
    sentences = split_sentences(text)
    if len(sentences) <= n_sentences:
        return text
    corpus_tokens = [tokenize(t) for t in all_texts]
    N = len(corpus_tokens)
    df = Counter()
    for tokens in corpus_tokens:
        df.update(set(tokens))
    idf = {w: math.log(N / (df[w] + 1)) for w in df}
    doc_tokens = tokenize(text)
    tf_counts = Counter(doc_tokens)
    total = max(len(doc_tokens), 1)

    scored = []
    for sent in sentences:
        words = [w for w in tokenize(sent) if w not in STOPWORDS]
        if not words:
            continue
        tfidf_score = sum((tf_counts.get(w, 0) / total) * idf.get(w, 0) for w in words) / len(words)
        pain_score = sum(1 for w in words if w in PAIN_WORDS) / max(len(words), 1)
        score = 0.6 * tfidf_score + 0.4 * pain_score
        scored.append((score, sent))
    scored.sort(reverse=True)
    top = {s for _, s in scored[:n_sentences]}
    ordered = [s for s in sentences if s in top]
    return ' '.join(ordered[:n_sentences])


# ──────────────────────────────────────────────
# BENCHMARK OUTPUT
# ──────────────────────────────────────────────
print("=" * 72)
print("BENCHMARK: Compression algorithms on real Civ VII negative reviews")
print("=" * 72)

for i, (r, text) in enumerate(zip(corpus, texts), 1):
    if not text or len(text) < 100:
        continue
    sents = split_sentences(text)
    print(f"\n{'─'*72}")
    print(f"REVIEW [{i}] votes_up={r['votes_up']} | {len(text)} chars | {len(sents)} sentences")
    print(f"{'─'*72}")
    print(f"  ORIGINAL (first 300): {text[:300].replace(chr(10), ' ')}")

    algs = {
        'TRUNCATE-800 ': algo_truncate(text, 800),
        'TFIDF-3sent  ': algo_tfidf(text, texts, 3),
        'TEXTRANK-3s  ': algo_textrank(text, 3),
        'MMR-3sent    ': algo_mmr(text, texts, 3),
        'EMOTION-4s   ': algo_emotion(text, 4),
        'HYBRID-3s    ': algo_hybrid(text, texts, 3),
    }

    for name, result in algs.items():
        ratio = len(result) / max(len(text), 1)
        print(f"\n  [{name}] {len(result)} chars ({ratio:.0%})")
        print(f"  {result[:400].replace(chr(10), ' ')}")

    if i >= 5:
        break

print("\n\n" + "=" * 72)
print("COMPRESSION SUMMARY — top-10 reviews")
print("=" * 72)
orig_total = sum(len(t) for t in texts)
print(f"Original (10 reviews): {orig_total} chars ~ {orig_total//4} tokens\n")

all_t = texts
methods = {
    'TRUNCATE-800 ': lambda t: algo_truncate(t, 800),
    'TFIDF-3sent  ': lambda t: algo_tfidf(t, all_t, 3),
    'TEXTRANK-3s  ': lambda t: algo_textrank(t, 3),
    'MMR-3sent    ': lambda t: algo_mmr(t, all_t, 3),
    'EMOTION-4s   ': lambda t: algo_emotion(t, 4),
    'HYBRID-3s    ': lambda t: algo_hybrid(t, all_t, 3),
}
for name, fn in methods.items():
    results = [fn(t) for t in texts if t]
    total_chars = sum(len(r) for r in results)
    ratio = total_chars / orig_total
    savings = 1 - ratio
    print(f"  {name} {total_chars:>6} chars ~ {total_chars//4:>5} tokens | compress={savings:.0%}")
