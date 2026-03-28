# Deep Research: PostgreSQL Full-Text Search Optimization for RAG
> Version: 1.0 | Date: 2026-03-28
> Component: Contexter FTS (tsvector + GIN + hybrid RRF)
> Status: COMPLETE

---

## Layer 1: Current State

### 1.1 Our implementation
- **What**: Full-text search on chunk content for hybrid RAG retrieval
- **How**: PostgreSQL 16 `tsvector` with `'simple'` configuration (no stemming, no stop words, no synonyms). `GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED`. GIN index. `plainto_tsquery('simple', ...)` for queries. `ts_rank()` for scoring. Hybrid with pgvector cosine via Reciprocal Rank Fusion (k=60).
- **Stack**: PostgreSQL 16 + pgvector (HNSW, cosine, 1024-dim Jina v4 embeddings)
- **RRF**: Application-level fusion in TypeScript (`hybrid.ts`), not SQL-level
- **Performance**: No benchmarks measured yet
- **Known issues**:
  - `'simple'` config = no stemming. "running" won't match "run". "документы" won't match "документ".
  - No stop word removal = noise terms inflate results
  - No synonym support = "car" won't match "automobile"
  - `plainto_tsquery` = no phrase search, no proximity
  - `ts_rank` uses basic TF normalization, not BM25
  - Single language config for multilingual content (Russian + English)
  - No fuzzy/typo tolerance

### 1.2 Metrics (measure before improving)
- Baseline accuracy: NOT MEASURED (qualitative: "works for exact terms")
- Baseline latency: NOT MEASURED (expected fast due to GIN index)
- Baseline cost: Zero (native PG, no external service)
- User complaints: None yet (pre-launch), but known limitation for morphologically rich Russian

### 1.3 Key files
- `src/services/vectorstore/fts.ts` — FTS service (search, sanitize)
- `src/services/vectorstore/hybrid.ts` — RRF fusion
- `src/services/vectorstore/types.ts` — constants (RRF_K=60, threshold=0.3)
- `drizzle-pg/0001_fts_and_vector_indexes.sql` — migration (tsvector + GIN)

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Algorithm**: BM25 (Okapi BM25, Robertson et al. 1994) is the dominant relevance ranking algorithm for lexical search. Used by Elasticsearch, Solr, Lucene, and all major search engines. PostgreSQL's built-in `ts_rank` uses basic TF normalization that lacks three critical BM25 features: term frequency saturation, document length normalization against corpus average, and inverse document frequency (IDF) weighting.

**Why BM25 is standard**: On BEIR benchmark (18 IR datasets), BM25 averages nDCG@10 of 43.4 — competitive with many neural models. Hybrid (BM25 + dense vectors) reaches >52.6. BM25 remains the strongest zero-shot baseline, outperforming all neural models on argument retrieval (Touche-2020: 0.367 nDCG@10).

**Who uses it**: Elasticsearch (default), OpenSearch, Solr, Meilisearch, Typesense, ParadeDB, and every production search system.

**For multilingual (Russian + English)**: The standard approach is language-aware text search configurations with appropriate stemming dictionaries, not a single `'simple'` config.

Sources:
- [Comparing full text search algorithms: BM25, TF-IDF, and Postgres](https://emschwartz.me/comparing-full-text-search-algorithms-bm25-tf-idf-and-postgres/)
- [ParadeDB: Implementing BM25 in PostgreSQL](https://www.paradedb.com/learn/search-in-postgresql/bm25)
- [Neon: Comparing Native Postgres, ElasticSearch, and pg_search](https://neon.com/blog/postgres-full-text-search-vs-elasticsearch)

### 2.2 Top 3 implementations for PostgreSQL

| Product/Extension | Approach | Benchmark / Key Metric | Key insight |
|---|---|---|---|
| **ParadeDB pg_search** | BM25 via Tantivy (Rust Lucene), LSM tree index | Elastic-quality search inside PG | Most mature PG BM25 extension; supports hybrid with pgvector; PG 15+ |
| **VectorChord-BM25** | BM25 via Block-WeakAnd algorithm, bm25vector type | 3x faster than Elasticsearch (claimed) | Lightweight, native PG operator + index; active development 2025-2026 |
| **Tiger Data pg_textsearch** | BM25 with Block-Max WAND, memtable architecture | 4x faster top-k queries; 41% smaller index | Parallel index builds; open source (2025); PG 17-18 only |

**Native PG approach (no extensions)**: Use built-in `'russian'` and `'english'` text search configs with Snowball stemming + stop words + `websearch_to_tsquery`. This is the zero-dependency baseline that gets 80% of the benefit.

Sources:
- [VectorChord-BM25 GitHub](https://github.com/tensorchord/VectorChord-bm25)
- [Tiger Data pg_textsearch](https://github.com/timescale/pg_textsearch)
- [ParadeDB pg_search](https://www.paradedb.com/blog/introducing-search)

### 2.3 Standard configuration for multilingual FTS

**PostgreSQL built-in text search configurations**:
- `'english'` — English Snowball stemmer + English stop words. "running" -> "run", "documents" -> "document"
- `'russian'` — Russian Snowball stemmer + Russian stop words. "документы" -> "документ", "бежать" -> "бежа"
- `'simple'` — No stemming, no stop words (current Contexter config). Only lowercases.

**Recommended approach for Russian + English**:

Three strategies exist:

1. **Per-row language column** (best for known-language content): Store `regconfig` column per row. Generate tsvector using row's config. Most accurate but requires language detection.

2. **Concatenated multi-language tsvector** (simplest, recommended for Contexter):
   ```sql
   GENERATED ALWAYS AS (
     to_tsvector('english', content) || to_tsvector('russian', content)
   ) STORED
   ```
   Bloats index (~2x) but handles mixed-language content without language detection. Query with both: `plainto_tsquery('english', q) || plainto_tsquery('russian', q)`.

3. **Language-aware index with config column**: `CREATE INDEX ON chunks USING GIN (to_tsvector(lang_config, content))`. Most flexible but requires per-row language.

**Query function upgrade**: Replace `plainto_tsquery` with `websearch_to_tsquery` — supports quotes for phrase search, OR operator, negation with `-`. Never raises syntax errors on user input. Drop-in replacement.

**Common pitfalls**:
- Using `'simple'` for morphologically rich languages (Russian has 12+ word forms per lemma)
- Not matching tsquery config to tsvector config (must be identical)
- Using `ts_rank` without normalization flags (default ignores document length)
- Forgetting to regenerate tsvector when changing configuration

Sources:
- [PostgreSQL: Documentation 18: Dictionaries](https://www.postgresql.org/docs/current/textsearch-dictionaries.html)
- [PostgreSQL: Documentation 18: Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [Building PostgreSQL FTS in any language](https://emplocity.com/en/about-us/blog/how_to_build_postgresql_full_text_search_engine_in_any_language/)

### 2.4 Synonym dictionaries in PostgreSQL

PostgreSQL supports two synonym dictionary types:

1. **Synonym template** (`synonym`): Simple word-to-word mapping. File format: `word replacement` per line. Placed in `$SHAREDIR/tsearch_data/`.

2. **Extended synonym template** (`dict_xsyn`): One word maps to multiple synonyms. Supports `matchorig`, `matchsynonyms`, `keeporig`, `keepsynonyms` flags.

**Setup pattern**:
```sql
CREATE TEXT SEARCH DICTIONARY my_synonyms (
  TEMPLATE = synonym,
  SYNONYMS = my_synonyms  -- references $SHAREDIR/tsearch_data/my_synonyms.syn
);
-- Then bind to configuration before the stemmer:
ALTER TEXT SEARCH CONFIGURATION my_config
  ALTER MAPPING FOR asciiword WITH my_synonyms, english_stem;
```

**Dictionary ordering rule**: Most specific (synonyms) first, then stemmer, then catch-all. Words recognized by an earlier dictionary are not passed to later ones.

**For Contexter**: Synonym dictionaries are low priority — the semantic vector search already handles synonyms implicitly. Focus stemming effort first.

Sources:
- [PostgreSQL: Documentation 18: dict_xsyn](https://www.postgresql.org/docs/current/dict-xsyn.html)
- [PostgreSQL: Documentation 18: Configuration Example](https://www.postgresql.org/docs/current/textsearch-configuration.html)

### 2.5 pg_trgm for fuzzy/typo tolerance

**What it does**: Splits text into 3-character trigrams, measures string similarity by shared trigrams. Enables `%` (similarity) and `<->` (word distance) operators with GIN/GiST indexes.

**Key differences from tsvector**:
- tsvector = index over words (lexemes); pg_trgm = index over character sequences
- tsvector understands language (stemming, stop words); pg_trgm is language-agnostic
- pg_trgm handles typos and partial matches; tsvector requires exact lexeme match
- tsvector is much faster for full-text (less data indexed); pg_trgm better for short strings

**Recommendation for Contexter**: Add pg_trgm as a complementary layer for query spelling correction, not as a replacement for tsvector. Use `similarity()` to detect user typos and suggest corrections before running the main FTS query.

Sources:
- [PostgreSQL: Documentation 18: pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Postgres Text Search: Full Text vs Trigram Search](https://www.aapelivuorinen.com/blog/2021/02/24/postgres-text-search/)

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques

| Project | Date | Key innovation | Status | Applicability to Contexter |
|---|---|---|---|---|
| **ParadeDB pg_search** | 2023-ongoing | BM25 via Tantivy inside PG; hybrid search with pgvector via SQL | Production | HIGH — direct replacement for ts_rank, but requires extension installation |
| **VectorChord-BM25** | 2025-2026 | Block-WeakAnd BM25 as native PG operator; `bm25vector` type | Production-ready | HIGH — lightweight, fast, but self-hosted PG only |
| **Tiger Data pg_textsearch** | 2025-2026 | BM25 with Block-Max WAND + parallel indexing; open source | Production | MEDIUM — PG 17-18 only (Contexter is PG 16) |
| **pg_bestmatch.rs** | 2025 | Generate BM25 sparse vectors inside PG; dot product scoring | Experimental | LOW — generates vectors only, no index-based search; needs pgvector for actual retrieval |
| **ParadeDB pg_sparse (svector)** | 2024 | SPLADE sparse vectors with HNSW in PG; fork of pgvector | Prototype | LOW — requires SPLADE model infrastructure; overkill for current scale |
| **SPLADE / BGE-M3 learned sparse** | 2022-2025 | Neural learned sparse embeddings outperform BM25 on multilingual | Research/Production (in vector DBs) | FUTURE — BGE-M3 outperforms BM25 on cross-lingual retrieval but requires inference pipeline |
| **PGroonga 4.0** | 2025 | Groonga-based multilingual FTS; parallel index builds; 2-10x faster | Production (Supabase) | MEDIUM — good CJK support but overkill; Snowball Russian is sufficient |
| **Rubic2** (BSNLP 2025) | 2025 | Ensemble lemmatization for Russian; higher accuracy than single models | Research | LOW — academic; PostgreSQL Snowball is sufficient for search |

Sources:
- [ParadeDB: Similarity Search with SPLADE Inside Postgres](https://www.paradedb.com/blog/introducing-sparse)
- [VectorChord-BM25: Revolutionize PostgreSQL Search](https://blog.vectorchord.ai/vectorchord-bm25-revolutionize-postgresql-search-with-bm25-ranking-3x-faster-than-elasticsearch)
- [Hybrid Search in RAG: Dense + Sparse](https://blog.gopenai.com/hybrid-search-in-rag-dense-sparse-bm25-splade-reciprocal-rank-fusion-and-when-to-use-which-fafe4fd6156e)

### 3.2 Open questions in the field

1. **BM25 extension fragmentation**: Three competing PG BM25 extensions (pg_search, VectorChord-BM25, pg_textsearch) with no clear winner. Ecosystem consolidation expected in 2026-2027.
2. **Managed hosting availability**: pg_search was removed from Neon (March 2026). Neither pg_textsearch nor VectorChord-BM25 are available on managed PostgreSQL platforms. Self-hosted PG required.
3. **SPLADE in PG**: No production-ready SPLADE pipeline that runs entirely inside PostgreSQL. Requires external inference + sparse vector storage.
4. **Optimal RRF k parameter**: k=60 is from 2009 paper. No systematic study of optimal k for RAG-specific hybrid search (vs. web search where k=60 was derived).

### 3.3 Bets worth making

1. **Immediate (zero-cost)**: Switch from `'simple'` to `'english' || 'russian'` concatenated tsvector. Zero extension dependency, massive recall improvement for Russian morphology.
2. **Short-term (1-3 months)**: Evaluate VectorChord-BM25 when upgrading to PG 17. Lightest-weight BM25 option, no external engine.
3. **Medium-term**: Watch pg_textsearch for PG 16 support. If Tiger Data backports, it becomes the best native BM25 option.
4. **Skip for now**: SPLADE / learned sparse. The dense embeddings (Jina v4 1024-dim) already capture semantic similarity. Adding sparse learned embeddings is diminishing returns for Contexter's scale.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Linguistics (morphology)** | Russian has 12+ inflected forms per lemma; stemming loses information | Lemmatization (dictionary-based) via pymorphy2/mystem; maintains full morphological info | PostgreSQL Hunspell dictionary = dictionary-based lemmatization (not algorithmic stemming). Hunspell_ru_ru extension exists. More accurate than Snowball but heavier. |
| **Information Retrieval** | BM25 vs neural ranking for zero-shot generalization | Hybrid approaches win: BM25 + dense retrieval + cross-encoder reranking | Already doing hybrid (pgvector + tsvector + RRF). Next step: add cross-encoder reranking post-RRF. |
| **Signal Processing** | Noise filtering in multi-channel signals | Bandpass filters; each channel processed with appropriate filter | Analogous to per-language text configs: Russian text through Russian stemmer, English through English stemmer. "Simple" config = no filtering = noisy signal. |
| **Ecology / Biodiversity** | Species identification with partial/degraded samples | Multi-key identification: morphological + molecular + habitat | Analogous to multi-signal search: lexical match + semantic similarity + metadata filtering. Each signal catches what others miss. |

### 4.2 Linguistics: Russian morphological analysis

**The Russian morphology problem**: Russian is a highly inflected Slavic language with:
- 6 grammatical cases (nominative, genitive, dative, accusative, instrumental, prepositional)
- 3 genders, 2 numbers
- Verb conjugation (6 forms per tense)
- Result: 12+ surface forms per lemma (e.g., "документ" -> документа, документу, документом, документе, документы, документов, документам, документами, документах...)

**Tools compared** (from academic research: Kotelnikov et al. 2018):

| Tool | Type | Accuracy (lemmatization) | Speed | PG Integration |
|---|---|---|---|---|
| **Snowball russian_stem** | Algorithmic stemmer | ~85-90% (overstemming common) | Very fast (in PG) | Native — `'russian'` config |
| **Hunspell (hunspell_ru_ru)** | Dictionary-based | ~92-95% | Fast (in PG) | Extension — postgrespro/hunspell_dicts |
| **pymorphy2** | Dictionary + rules | ~96-97% | Moderate | External only (Python) |
| **mystem (Yandex)** | Statistical + dictionary | ~97-98% | Fast | External only (binary) |

**Key insight**: For stemming errors >30% in highly inflected languages, stemming becomes counterproductive. Snowball at ~85-90% for Russian is borderline. Hunspell at ~92-95% is the safe choice within PostgreSQL.

**Recommendation**: Start with Snowball (`'russian'` config) — it is built-in, zero-dependency, and handles 85-90% of cases correctly. The remaining errors are caught by the dense vector search in hybrid mode. If quality issues emerge, upgrade to Hunspell.

Sources:
- [A Close Look at Russian Morphological Parsers](https://link.springer.com/chapter/10.1007/978-3-319-71746-3_12)
- [Assessing the impact of Stemming Accuracy on IR](https://www.sciencedirect.com/science/article/abs/pii/S0306457316300358)
- [postgrespro/hunspell_dicts GitHub](https://github.com/postgrespro/hunspell_dicts)

### 4.3 Information theory: Stop words and Zipf's Law

**Zipf's Law**: Word frequency follows power law: f(r) ~ 1/r^s (s near 1). The most frequent word appears ~2x as often as the 2nd, ~3x as often as the 3rd, etc.

**Implications for FTS**:
- Top ~100 words (stop words) account for ~50% of all word occurrences but carry near-zero semantic information
- Removing stop words: reduces index size by ~30-40%, improves precision (fewer noise matches)
- The `'simple'` config keeps ALL words including stop words -> inflated index, noisy matches
- `'english'` removes 127 stop words; `'russian'` removes 243 stop words

**IDF connection**: IDF (Inverse Document Frequency) is the mathematical correction for Zipf's Law — common words get low IDF, rare words get high IDF. Native `ts_rank` lacks IDF entirely. BM25 includes it inherently.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

**What we use**: `ts_rank(tsvector, tsquery)` — term frequency (TF) based scoring.

PostgreSQL `ts_rank` formula:
```
score = sum_over_matching_terms(w[i] * freq(term_i, doc))
```
Where `w[i]` is the weight class (A=1.0, B=0.4, C=0.2, D=0.1 by default) and `freq` is raw term frequency.

**Assumptions**:
- All documents are equally important regardless of length
- All terms are equally important regardless of rarity in corpus
- Term frequency scales linearly (no saturation)
- No document length normalization

**Where assumptions break**:
- Long documents dominate (more terms = higher TF) — critical for Contexter where chunk sizes vary
- Common words like "the", "и" score the same as rare domain terms
- Keyword stuffing is not penalized (no saturation)

### 5.2 BM25 — the correct mathematical model

**BM25 formula**:
```
BM25(D, Q) = sum_over_qi_in_Q [ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D|/avgdl)) ]
```

Where:
- `f(qi, D)` = frequency of term qi in document D
- `|D|` = document length (number of terms)
- `avgdl` = average document length across corpus
- `k1` = term frequency saturation parameter (default: 1.2)
- `b` = document length normalization parameter (default: 0.75)
- `IDF(qi) = ln((N - n(qi) + 0.5) / (n(qi) + 0.5) + 1)` where N = total docs, n(qi) = docs containing qi

**Three critical improvements over ts_rank**:

1. **Term Frequency Saturation** (k1):
   - ts_rank: f(t,D) scales linearly. 100 occurrences = 10x score of 10 occurrences.
   - BM25: Saturates via `f * (k1+1) / (f + k1)`. At k1=1.2: f=1 -> 0.909, f=5 -> 0.968, f=100 -> 0.988. Diminishing returns prevent keyword stuffing.

2. **Document Length Normalization** (b):
   - ts_rank: No normalization by default. Long chunks always win.
   - BM25: Normalizes by `|D|/avgdl`. When b=0.75, a document 2x average length needs ~2x more term occurrences to score equally.

3. **Inverse Document Frequency** (IDF):
   - ts_rank: All terms weighted equally (ignoring weights A-D).
   - BM25: Rare terms (low n(qi)) get exponentially higher IDF. A term in 1% of documents scores ~4.6x higher than one in 50%.

### 5.3 Optimal BM25 parameter values

| Parameter | Default | Range | When to adjust |
|---|---|---|---|
| k1 | 1.2 | 0.5 - 2.0 | Lower (0.5-0.8) for short documents/queries; higher (1.5-2.0) for long documents where TF matters more |
| b | 0.75 | 0.0 - 1.0 | Lower (0.3-0.5) when document lengths are uniform (like fixed-size chunks); higher when lengths vary widely |

**For Contexter chunks**: Chunks are relatively uniform in size (semantic chunking targets ~512 tokens). This suggests b=0.5 (less aggressive length normalization) and k1=1.2 (default saturation).

### 5.4 TF-IDF vs BM25 vs DFR — mathematical comparison

| Property | TF-IDF | BM25 | DFR (Divergence from Randomness) |
|---|---|---|---|
| TF component | Raw or log(tf) | Saturated: `tf*(k1+1)/(tf+k1)` | Probabilistic: `-log P(tf\|random)` |
| IDF component | `log(N/df)` | `log((N-df+0.5)/(df+0.5)+1)` | Implicit via randomness model |
| Length normalization | None (manual) | `1-b+b*dl/avgdl` | Separate normalization component |
| Parameters | None | k1, b (well-studied defaults) | 3 components (many variants) |
| Performance (BEIR avg) | ~40 nDCG@10 | ~43.4 nDCG@10 | ~44 nDCG@10 (Terrier PL2) |
| Complexity | O(1) per term | O(1) per term | O(1) per term |
| Availability in PG | ts_rank (approximate) | Extensions only | Not available |

**Verdict**: BM25 is the practical winner. DFR is marginally better on short queries but far more complex to tune and not available in PostgreSQL. BM25's 3.4 nDCG@10 points over TF-IDF (8.5% relative improvement) is significant and well-established.

### 5.5 Quantified impact of stemming

**General findings** (from IR literature):
- Stemming improves recall by 10-30% for morphologically rich languages (Russian, Finnish, German)
- Precision impact is mixed: +5% to -5% depending on stemmer quality
- For Russian specifically: lemmatization > stemming. Snowball overstemming rate ~10-15% for Russian.
- Combined effect on MAP (Mean Average Precision): +5-15% for Russian, +2-5% for English

**For Contexter specifically**:
- Current `'simple'` config: 0% morphological matching
- Switching to `'russian'`+`'english'`: Expected +15-25% recall improvement for Russian queries, +5-10% for English
- In hybrid mode (with dense vectors): Net improvement is dampened because vectors already capture morphological similarity. Estimated +5-10% on hybrid search quality.

### 5.6 RRF mathematical properties

Current RRF formula: `score(d) = sum_lists(1 / (k + rank_i(d)))`

- k=60 is from Cormack, Clarke & Butt (SIGIR 2009) — optimized for web search metasearch
- Properties: robust to score distribution differences between lists, emphasizes top ranks, diminishing contribution from lower ranks
- For Contexter: k=60 is reasonable. Pulling 2x candidates (topK*2 from each source) before fusion is correct practice.

**Potential improvement**: Weighted RRF where vector and FTS contributions are weighted differently:
```
score(d) = alpha * (1/(k + rank_vector(d))) + (1-alpha) * (1/(k + rank_fts(d)))
```
Default alpha=0.5. Could tune: alpha=0.6 (favor vectors for semantic queries) or alpha=0.4 (favor FTS for keyword queries). Requires A/B testing.

Sources:
- [Practical BM25 - Part 2: The BM25 Algorithm](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables)
- [Practical BM25 - Part 3: Picking b and k1](https://www.elastic.co/blog/practical-bm25-part-3-considerations-for-picking-b-and-k1-in-elasticsearch)
- [BM25 Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25)
- [Building Hybrid Search for RAG with RRF](https://dev.to/lpossamai/building-hybrid-search-for-rag-combining-pgvector-and-full-text-search-with-reciprocal-rank-fusion-6nk)

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach — Phased implementation

#### Phase 1: Native PG multilingual FTS (IMMEDIATE, zero dependencies)

**What**: Replace `'simple'` with concatenated `'english' || 'russian'` tsvector. Replace `plainto_tsquery` with `websearch_to_tsquery`. Add `ts_rank` normalization flags.

**Why**: Layers 1, 2, 4, 5 all converge — `'simple'` config is the single largest FTS quality bottleneck. Russian morphology (12+ forms/lemma) makes stemming essential. Built-in Snowball handles 85-90% correctly. Dense vectors catch the rest.

**Expected impact**: +15-25% recall for Russian, +5-10% for English. +5-10% hybrid search quality (net after vector dampening).

**Cost**: 1 migration file + 1 code change in `fts.ts`. <2 hours implementation.

**Risk**: Tsvector column size doubles (two language configs). GIN index rebuild required (minutes for current data size).

#### Phase 2: BM25 ranking (WHEN upgrading to PG 17+)

**What**: Evaluate VectorChord-BM25 or pg_textsearch for BM25 ranking instead of `ts_rank`.

**Why**: Layer 5 shows ts_rank lacks IDF, saturation, and length normalization — all critical for relevance ranking. BM25 is +8.5% nDCG@10 over TF-IDF.

**Expected impact**: +5-10% ranking quality on FTS results. Larger impact when FTS is the primary retrieval signal.

**Cost**: Extension installation + migration. 1-2 days.

**Risk**: Extension availability on managed PG. Lock-in to specific extension. pg_textsearch requires PG 17+.

#### Phase 3: Advanced (FUTURE, only if quality issues persist)

- Hunspell dictionary for Russian (accuracy 92-95% vs Snowball 85-90%)
- pg_trgm for typo tolerance layer
- Cross-encoder reranking post-RRF
- Weighted RRF tuning

### 6.2 Implementation spec — Phase 1

**Migration SQL** (new migration file: `0003_multilingual_fts.sql`):

```sql
-- Step 1: Drop existing generated column and index
DROP INDEX IF EXISTS "chunks_tsv_idx";
ALTER TABLE "chunks" DROP COLUMN IF EXISTS "tsv";

-- Step 2: Create multilingual tsvector column (English + Russian)
ALTER TABLE "chunks" ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', "content") || to_tsvector('russian', "content")
  ) STORED;

-- Step 3: Recreate GIN index
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING gin ("tsv");
```

**Code changes** (`src/services/vectorstore/fts.ts`):

```typescript
// BEFORE:
ts_rank(tsv, plainto_tsquery('simple', ${sanitized})) as score
WHERE tsv @@ plainto_tsquery('simple', ${sanitized})

// AFTER:
ts_rank(tsv, websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}), 1) as score
WHERE tsv @@ (websearch_to_tsquery('english', ${sanitized}) || websearch_to_tsquery('russian', ${sanitized}))
```

Notes on the `1` normalization flag for `ts_rank`:
- `0` (default) = no normalization
- `1` = divides rank by 1 + log(document length) — recommended
- `2` = divides by document length
- `32` = divides by 1 + log(unique words)

Using `1` gives mild length normalization without fully penalizing longer chunks.

**Query function**: `websearch_to_tsquery` instead of `plainto_tsquery`:
- Supports `"quoted phrases"` (phrase search)
- Supports `OR` between terms
- Supports `-excluded` terms
- Never raises syntax errors on malformed input
- Drop-in replacement — no query preprocessing changes needed

### 6.3 Validation plan

**How to measure improvement**:
1. Create a test set of 20-30 queries (10 Russian, 10 English, 5-10 mixed) with known relevant chunks
2. Measure recall@10 and MRR (Mean Reciprocal Rank) before and after migration
3. Compare FTS-only results, vector-only results, and hybrid results

**Minimum success criteria**:
- Russian query recall@10 improves by at least 15%
- No regression on English query quality
- Hybrid search (RRF) quality improves by at least 5%

**Rollback trigger**:
- If English query quality drops by >5% (unlikely but possible due to overstemming)
- Rollback: revert migration, restore `'simple'` config

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **PGroonga** | Overkill for Russian+English. Best for CJK. Adds Groonga dependency. |
| **ParadeDB pg_search right now** | External extension not available on most managed PG. Adds Tantivy dependency. Wait for PG ecosystem consolidation. |
| **SPLADE / learned sparse embeddings** | Requires inference pipeline (model serving). Dense vectors (Jina v4) already capture semantic similarity. Diminishing returns at Contexter's scale (<1M chunks). |
| **pg_bestmatch.rs** | Experimental. No index-based search — only generates vectors. Needs pgvector for actual retrieval which we already have. |
| **Hunspell immediately** | Requires extension installation (hunspell_ru_ru). Snowball is built-in and handles 85-90% of cases. Dense vectors catch the rest. Upgrade path exists if needed. |
| **Per-row language detection** | Over-engineering for Contexter. Content is user-uploaded; language varies per document, sometimes per paragraph. Concatenated tsvector handles this without language detection. |
| **DFR (Divergence from Randomness)** | Not available in PostgreSQL. Marginally better than BM25 on short queries only. Not worth building custom implementation. |
| **Custom BM25 in SQL** | Possible via CTE (Common Table Expression) with manual IDF calculation, but requires full table scan for IDF statistics. Performance disaster at scale. Use an extension instead. |

### 6.5 Hunspell dictionary setup (for Phase 3, reference)

If Snowball Russian proves insufficient, here is the Hunspell upgrade path:

```sql
-- Option A: Using postgrespro/hunspell_dicts extension (if available)
CREATE EXTENSION hunspell_ru_ru;
-- This creates 'russian_hunspell' dictionary

-- Option B: Manual setup with .aff and .dic files
-- Download ru_RU.aff and ru_RU.dic from LibreOffice dictionaries
-- Place in $SHAREDIR/tsearch_data/
CREATE TEXT SEARCH DICTIONARY russian_hunspell (
  TEMPLATE = ispell,
  DictFile = ru_ru,
  AffFile = ru_ru,
  StopWords = russian
);

-- Create mixed config
CREATE TEXT SEARCH CONFIGURATION contexter_multilingual (COPY = simple);

ALTER TEXT SEARCH CONFIGURATION contexter_multilingual
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart
  WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION contexter_multilingual
  ALTER MAPPING FOR word, hword, hword_part
  WITH russian_hunspell, russian_stem;
-- russian_stem as fallback for words not in Hunspell dictionary

-- Migration: regenerate tsvector with new config
ALTER TABLE chunks DROP COLUMN tsv;
ALTER TABLE chunks ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('contexter_multilingual', content)) STORED;
CREATE INDEX chunks_tsv_idx ON chunks USING gin (tsv);
```

---

## Appendix: Complete source list

### Layer 2 sources
- [ParadeDB: Full-Text Search in PostgreSQL](https://www.paradedb.com/learn/search-in-postgresql/full-text-search)
- [ParadeDB: Implementing BM25](https://www.paradedb.com/learn/search-in-postgresql/bm25)
- [ParadeDB: Hybrid Search Missing Manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual)
- [Neon: Comparing Native Postgres, ES, pg_search](https://neon.com/blog/postgres-full-text-search-vs-elasticsearch)
- [Comparing FTS algorithms: BM25, TF-IDF, Postgres](https://emschwartz.me/comparing-full-text-search-algorithms-bm25-tf-idf-and-postgres/)
- [PostgreSQL FTS Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL Dictionaries Documentation](https://www.postgresql.org/docs/current/textsearch-dictionaries.html)
- [PostgreSQL Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Building PostgreSQL FTS in any language](https://emplocity.com/en/about-us/blog/how_to_build_postgresql_full_text_search_engine_in_any_language/)
- [Postgres as a search engine](https://anyblockers.com/posts/postgres-as-a-search-engine)

### Layer 3 sources
- [VectorChord-BM25 GitHub](https://github.com/tensorchord/VectorChord-bm25)
- [VectorChord-BM25: 3x faster than Elasticsearch](https://blog.vectorchord.ai/vectorchord-bm25-revolutionize-postgresql-search-with-bm25-ranking-3x-faster-than-elasticsearch)
- [Hybrid search with BM25 and VectorChord](https://blog.vectorchord.ai/hybrid-search-with-postgres-native-bm25-and-vectorchord)
- [Tiger Data pg_textsearch](https://github.com/timescale/pg_textsearch)
- [Tiger Data: From ts_rank to BM25](https://www.tigerdata.com/blog/introducing-pg_textsearch-true-bm25-ranking-hybrid-retrieval-postgres)
- [Tiger Data: BM25 without Elastic](https://www.tigerdata.com/blog/you-dont-need-elasticsearch-bm25-is-now-in-postgres)
- [ParadeDB: SPLADE Inside Postgres](https://www.paradedb.com/blog/introducing-sparse)
- [pg_bestmatch.rs GitHub](https://github.com/tensorchord/pg_bestmatch.rs)
- [Neon pg_search deprecation](https://neon.com/docs/extensions/pg_search)
- [Hybrid Search in RAG: Dense + Sparse](https://blog.gopenai.com/hybrid-search-in-rag-dense-sparse-bm25-splade-reciprocal-rank-fusion-and-when-to-use-which-fafe4fd6156e)

### Layer 4 sources
- [Russian Morphological Parsers comparison](https://link.springer.com/chapter/10.1007/978-3-319-71746-3_12)
- [postgrespro/hunspell_dicts](https://github.com/postgrespro/hunspell_dicts)
- [Rubic2: Ensemble for Russian Lemmatization (BSNLP 2025)](https://aclanthology.org/2025.bsnlp-1.18.pdf)
- [Stemming impact on IR — multilingual](https://www.sciencedirect.com/science/article/abs/pii/S0306457316300358)
- [Indexing and Searching for Russian Language](https://libra.unine.ch/bitstreams/2f6476c9-7779-4cbd-a6c7-6cde0c4e978e/download)
- [Pinecone: SPLADE for Sparse Vector Search](https://www.pinecone.io/learn/splade/)
- [Zilliz: BGE-M3 and SPLADE](https://zilliz.com/learn/bge-m3-and-splade-two-machine-learning-models-for-generating-sparse-embeddings)

### Layer 5 sources
- [Elastic: Practical BM25 Part 2 — Algorithm](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables)
- [Elastic: Practical BM25 Part 3 — Picking k1 and b](https://www.elastic.co/blog/practical-bm25-part-3-considerations-for-picking-b-and-k1-in-elasticsearch)
- [BM25 Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25)
- [TF-IDF and BM25 for RAG — complete guide](https://www.ai-bites.net/tf-idf-and-bm25-for-rag-a-complete-guide/)
- [BEIR Benchmark paper](https://arxiv.org/abs/2104.08663)
- [Building Hybrid Search for RAG with RRF](https://dev.to/lpossamai/building-hybrid-search-for-rag-combining-pgvector-and-full-text-search-with-reciprocal-rank-fusion-6nk)
- [Zipf's Law — Wikipedia](https://en.wikipedia.org/wiki/Zipf's_law)
- [Which BM25 Do You Mean? Scoring Variants (Waterloo)](https://cs.uwaterloo.ca/~jimmylin/publications/Kamphuis_etal_ECIR2020_preprint.pdf)
- [Russian IR Benchmark (Dialogue 2025)](https://dialogue-conf.org/wp-content/uploads/2025/04/KovalevGetal.046.pdf)
