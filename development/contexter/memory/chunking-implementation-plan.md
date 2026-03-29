---
# chunking-implementation-plan.md — Chunking Overhaul
> Layer: L3 supplement | Epic: CTX-08 | Status: DRAFT
> Based on: 8 research files (seed + R1-R7) + code audit (2026-03-29)
> Created: 2026-03-29 | Author: Axis
---

## Architecture: AS-IS vs TO-BE

### AS-IS (current production)

```
file → parse (Docling/Text/Audio/Video)
     → chunk: chunkSemantic() — paragraph split by \n\n, fixed 500 tok, 100 overlap
       - NO heading-based splitting (headings only feed metadata)
       - NO code block preservation (split mid-function)
       - NO inline table preservation (split mid-row)
       - NO list preservation (split mid-list)
       - hierarchical mode EXISTS but UNREACHABLE (pipeline never passes hierarchical=true)
       - BPE encoder race condition → falls back to wordCount*1.4
     → contextual prefix: Groq Llama 8B, 4000 char doc window, 150 tok response
     → embed: Jina v4, late_chunking=true, 512 dim MRL
       - truncate_dim phantom parameter (ignored by API)
       - NO token-aware batching (may silently exceed 8K-32K limit)
     → index: pgvector HNSW + tsvector FTS
       - resolveParents: threshold=0 (ANY child → fetch parent, too aggressive)
       - parent/child dedup bug (parent can appear twice in results)
```

**Failure modes:**
1. Code block split mid-function → both halves useless for retrieval
2. Markdown table split between rows → loses column headers
3. Heading ends up at tail of previous chunk → wrong section association
4. Nested lists split arbitrarily → loses parent context
5. Fixed 500-token chunks for ALL content types (code, narrative, tables)
6. Late chunking may silently truncate on long documents (no token cap)
7. 1/5 children triggers parent fetch → 80% irrelevant content in LLM context
8. BPE encoder not loaded at chunk time → inaccurate token counts

### TO-BE (after implementation)

```
file → parse (Docling/Text/Audio/Video)
     → classify: blockClassifier(text) → Block[] (HEADING|CODE|TABLE|LIST|PARAGRAPH)
       - Docling JSON element types for PDF/DOCX (label: title, table, code, etc.)
       - Regex-based for MD/TXT (fast, no API)
     → chunk: two-stage split
       Stage 1: split at structural boundaries (headings, block types)
       Stage 2: within each section, token-based sizing with soft/hard limits
       - Code blocks: atomic, split at function boundaries if oversized
       - Tables: atomic, split by rows with header prepend if oversized
       - Lists: atomic, split at top-level items if oversized
       - Narrative: paragraph/sentence boundaries, adaptive sizing
       - hierarchical=true ALWAYS for docs > 1000 tokens (parent 1024, child 200)
     → contextual prefix: Groq Llama 8B (unchanged, already good)
     → embed: Jina v4, late_chunking=true, 512 dim MRL
       - truncate_dim REMOVED
       - token-aware batching: cap at 8K tokens per late_chunking batch
       - single-chunk optimization: skip late_chunking for batch_size=1
     → index: pgvector HNSW + tsvector FTS
       - resolveParents: auto-merge threshold >= 0.4
       - total-children count SQL query
       - cross-dedup between flatResults and parentMap
     → eval: 3-layer framework (intrinsic + retrieval + E2E)
       - Size Compliance, Intrachunk Cohesion, Block Integrity
       - Token-IoU@5 for retrieval isolation
       - RAGAS for E2E (already exists)
```

---

## Implementation Waves

### Wave 0: Bug Fixes (P0, prerequisite for everything)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 0.1 | Remove `truncate_dim` from Jina API body | `embedder/index.ts` | LOW | 5 min |
| 0.2 | Fix BPE encoder race: add warm-up `await countTokens("")` in pipeline before chunking | `pipeline.ts`, `tokenizer.ts` | LOW | 15 min |
| 0.3 | Remove diagnostic `chunkerService.chunk("hello world test", "txt")` from pipeline | `pipeline.ts` | LOW | 5 min |
| 0.4 | Remove debug logging from pipeline.ts (temporary from session 209) | `pipeline.ts` | LOW | 15 min |
| 0.5 | Fix resolveParents cross-dedup: check parentMap keys against flatResults chunk IDs | `rag/index.ts` | LOW | 30 min |

**Verification:**
```bash
# 0.1: grep for truncate_dim — should return nothing
grep -r "truncate_dim" src/services/embedder/

# 0.2: upload small TXT, check logs for BPE encoder load before chunk
curl -X POST https://api.contexter.cc/api/upload/presign ...

# 0.3-0.4: grep for "hello world test" and "DEBUG" console.log — should return nothing
grep -r "hello world test" src/services/pipeline.ts
grep -r "console.log.*DEBUG" src/services/pipeline.ts

# 0.5: query with child results sharing parent — parent should appear once, not twice
```

---

### Wave 1: Structure-Aware Block Classification (R3 core)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 1.1 | Create `block-classifier.ts` — detect HEADING, CODE_BLOCK, TABLE, LIST, PARAGRAPH | NEW `chunker/block-classifier.ts` | MED | 3h |
| 1.2 | Refactor `chunkSemantic()` to accept Block[] instead of raw text | `chunker/semantic.ts` | MED | 4h |
| 1.3 | Add soft/hard token limits to ChunkerOptions | `chunker/types.ts` | LOW | 30 min |
| 1.4 | Two-stage split: structural boundaries first, token sizing second | `chunker/semantic.ts` | MED | 3h |
| 1.5 | Code block preservation: atomic, split at function/blank-line boundaries | `chunker/semantic.ts` | LOW | 2h |
| 1.6 | Inline table preservation: atomic, reuse table.ts row-split logic | `chunker/semantic.ts`, `chunker/table.ts` | LOW | 2h |
| 1.7 | List preservation: atomic, split at top-level item boundaries | `chunker/semantic.ts` | LOW | 1h |
| 1.8 | Content-type routing: auto-detect code-heavy/table-heavy/narrative → set defaults | `chunker/index.ts` | LOW | 1h |

**New types (1.3):**
```typescript
interface ChunkerOptions {
  maxTokens?: number        // DEPRECATED, maps to hardMaxTokens
  softMaxTokens?: number    // prefer closing chunk here (default 400)
  hardMaxTokens?: number    // absolute ceiling (default 800)
  overlap?: number          // default 50 (reduced from 100, per R3 research)
  strategy?: "semantic" | "row" | "slide" | "timestamp"
  hierarchical?: boolean
}
```

**Block classifier algorithm (1.1):**
```
scan line by line:
  - triple-backtick → toggle CODE_BLOCK state
  - line starts with |...| and next line is |---|---| → TABLE
  - line starts with # → HEADING (split boundary)
  - line starts with - / * / 1. → LIST (accumulate contiguous)
  - else → PARAGRAPH (accumulate until blank line)
return Block[] with { type, content, startOffset, endOffset }
```

**Default sizing (1.3, 1.8):**
| Content type | softMax | hardMax | overlap |
|---|---|---|---|
| General | 400 | 800 | 50 |
| Code-heavy (>30% code blocks) | 800 | 1500 | 0 |
| Table-heavy (>30% tables) | 500 | 1000 | 0 |
| Narrative (no code/tables) | 400 | 600 | 80 |

**Verification:**
```bash
# Upload a markdown file with code blocks, tables, headings, lists
# Check: each code block in one chunk, each table in one chunk
# Check: headings start new chunks, not trail previous
curl -X POST https://api.contexter.cc/api/upload/presign ...
# Then query for code-related content → should return whole function
```

---

### Wave 2: Hierarchical Activation + Auto-Merge (R4)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 2.1 | Enable hierarchical=true in pipeline for docs > 1000 tokens | `pipeline.ts` | LOW | 30 min |
| 2.2 | Add total-children count SQL query | `vectorstore/index.ts` | LOW | 30 min |
| 2.3 | Implement auto-merge threshold in resolveParents() (ratio >= 0.4) | `rag/index.ts` | MED | 2h |
| 2.4 | Gap-filling: insert unretrieved siblings between retrieved children | `rag/index.ts` | LOW | 2h |
| 2.5 | Fix parentIndex bug in hierarchical.ts (use global index, not parent array index) | `chunker/hierarchical.ts` | LOW | 30 min |

**Auto-merge algorithm (2.3):**
```typescript
// In resolveParents(), after fetchParentsForChildren:
// 1. Query total children per parent:
//    SELECT parent_id, COUNT(*) FROM chunks WHERE parent_id = ANY($ids) AND chunk_type='child' GROUP BY parent_id
// 2. For each parent:
//    ratio = retrieved_children_count / total_children_count
//    if ratio >= 0.4 → merge (replace children with parent)
//    if ratio < 0.4 → keep individual children with their contextPrefix
```

**Activation heuristic (2.1):**
```typescript
// In pipeline, after chunking:
const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0)
if (totalTokens > 1000 && !options?.hierarchical) {
  chunks = chunkerService.chunk(content, sourceFormat, { hierarchical: true })
}
```

**Verification:**
```bash
# Upload a 10-page PDF → should produce parent+child chunks (check DB)
SELECT chunk_type, COUNT(*) FROM chunks WHERE document_id = $id GROUP BY chunk_type
# Expected: parent: ~4-8, child: ~20-40

# Query → check that resolveParents only merges when ratio >= 0.4
# Upload doc, query for narrow topic (1/5 children) → should return child, not parent
# Query for broad topic (3/5 children) → should return parent
```

---

### Wave 3: Embedder Hardening (R1)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 3.1 | Token-aware batching for late_chunking: cap at 8K tokens per batch | `embedder/index.ts` | MED | 3h |
| 3.2 | Skip late_chunking for single-chunk batches | `embedder/index.ts` | LOW | 15 min |
| 3.3 | Add late_chunking failure-specific logging (distinguish from rate limits) | `embedder/index.ts` | LOW | 30 min |
| 3.4 | Empirically test Jina v4 late_chunking token limit (8K vs 32K) | manual test | LOW | 1h |

**Token-aware batching algorithm (3.1):**
```typescript
// In embedBatch, when lateChunking=true:
// 1. Estimate tokens per text: countTokensSync(text) for each
// 2. Group texts into sub-batches where SUM(tokens) <= LATE_CHUNKING_TOKEN_CAP (8192)
// 3. Each sub-batch gets late_chunking=true
// 4. If a single text exceeds cap → embed WITHOUT late_chunking (individual)
// 5. Concatenate all results in original order
const LATE_CHUNKING_TOKEN_CAP = 8192 // conservative, increase to 32768 after 3.4 test
```

**Verification:**
```bash
# 3.1: Upload a large document (>8K tokens) → check logs for batch splitting
# 3.4: Send a crafted request with ~10K tokens + late_chunking=true via curl
curl -X POST https://api.jina.ai/v1/embeddings \
  -H "Authorization: Bearer $JINA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"jina-embeddings-v4","input":[{"text":"<10K tokens>"},...], "late_chunking":true, "dimensions":512}'
# Check: 200 OK or 400/500 error?
```

---

### Wave 4: Docling JSON Integration (R3 extension)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 4.1 | Parse Docling `json_content.texts[].label` for element type classification | `services/parsers/docling.ts` | MED | 2h |
| 4.2 | Create `docling-blocks.ts` — convert Docling elements to Block[] | NEW `chunker/docling-blocks.ts` | MED | 3h |
| 4.3 | Route Docling-parsed formats through docling-blocks instead of regex classifier | `chunker/index.ts` | LOW | 30 min |

**Docling element labels (from JSON):**
`title`, `section_header`, `narrative_text`, `list_item`, `table`, `code`, `caption`, `footnote`, `page_header`, `page_footer`

**Mapping:**
| Docling label | Block type | Behavior |
|---|---|---|
| title, section_header | HEADING | Split boundary |
| code | CODE_BLOCK | Atomic |
| table | TABLE | Atomic |
| list_item | LIST | Accumulate contiguous |
| narrative_text | PARAGRAPH | Normal |
| caption | PARAGRAPH | Attach to preceding block |
| footnote, page_header, page_footer | SKIP | Exclude from chunking |

**When to use:** Only for Docling-parsed formats (PDF, DOCX, PPTX, HTML, images). MD/TXT use regex block-classifier (Wave 1).

**Verification:**
```bash
# Upload a PDF with tables, code, headings → check chunk metadata
# Compare: block types detected from Docling JSON vs regex on the markdown output
# Docling should catch tables that aren't in markdown format (e.g., PDF visual tables)
```

---

### Wave 5: Evaluation Framework (R7)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 5.1 | Generate eval dataset: 50 docs, 200 QA pairs (Groq Llama 8B) | NEW `evaluation/dataset/` | LOW | 4h |
| 5.2 | Implement Size Compliance metric | NEW `evaluation/metrics/intrinsic.ts` | LOW | 1h |
| 5.3 | Implement Intrachunk Cohesion metric (batch Jina embed) | `evaluation/metrics/intrinsic.ts` | LOW | 2h |
| 5.4 | Implement Block Integrity metric | `evaluation/metrics/intrinsic.ts` | LOW | 2h |
| 5.5 | Implement Token-IoU retrieval metric | NEW `evaluation/metrics/retrieval.ts` | MED | 3h |
| 5.6 | Build A/B comparison script with Wilcoxon signed-rank test | NEW `evaluation/compare.ts` | MED | 3h |
| 5.7 | Baseline current chunking with all metrics (before Waves 1-4) | run script | LOW | 2h |
| 5.8 | Post-implementation measurement (after Waves 1-4) | run script | LOW | 2h |

**Layer 1 — Intrinsic (chunk quality):**
| Metric | Formula | Target |
|---|---|---|
| Size Compliance | count(chunks in [softMax±20%]) / total | > 0.90 |
| Intrachunk Cohesion | avg cosine(sentence_embeds, chunk_embed) | > 0.70 |
| Block Integrity | intact_blocks / total_blocks | > 0.90 |

**Layer 2 — Retrieval:**
| Metric | Formula | Target |
|---|---|---|
| Recall@5 | relevant_retrieved / total_relevant | > 0.85 |
| Token-IoU@5 | |relevant_tokens AND retrieved_tokens| / |union| | > 0.10 |
| MRR | mean(1/rank_first_relevant) | > 0.70 |

**Layer 3 — E2E (already exists via RAGAS):**
| Metric | Target |
|---|---|
| Faithfulness | > 0.85 |
| Answer Relevancy | > 0.80 |

**Statistical test:** Wilcoxon signed-rank (paired, non-parametric), alpha=0.05, on per-query metric differences between strategy A vs B.

**Verification:** Run `bun run evaluation/compare.ts --before baseline --after wave1` → output table with metrics + p-values.

---

### Wave 6: Advanced Optimizations (post-core, R2/R5)

| # | Task | Files | Risk | Effort |
|---|---|---|---|---|
| 6.1 | A/B/C/D experiment: baseline / late-only / prefix-only / both (R2) | evaluation script | LOW | 4h |
| 6.2 | PIC-Mean chunking strategy for narrative content (R5, optional) | NEW `chunker/pic.ts` | LOW | 3h |
| 6.3 | Adaptive contextual prefix: skip for short docs (< 3 chunks) | `chunker/contextual.ts` | LOW | 30 min |
| 6.4 | Increase doc truncation window for contextual prefix (4K → 8K chars on paid Groq) | `chunker/contextual.ts` | LOW | 15 min |
| 6.5 | Monitor total token count before late_chunking, warn if >28K (R2 caveat) | `embedder/index.ts` | LOW | 30 min |

**PIC-Mean algorithm (6.2, ~50 lines):**
```
1. Split document into sentences (Intl.Segmenter or regex)
2. Embed all sentences via Jina v4 (1 batch call)
3. Compute mean embedding (centroid) — this is the "pseudo-instruction"
4. Compute cosine similarity of each sentence to centroid
5. threshold = mean(similarities)
6. Group consecutive sentences with same label (above/below threshold)
7. Return chunks
```
**When to use:** Long narrative docs (>5000 tokens) without clear heading structure. Opt-in strategy, not default.

---

## Dependency Graph

```
Wave 0 (bug fixes) ─────────────────────────────────────────────→ deploy
    │
    ├── Wave 1 (structure-aware blocks) ──→ Wave 4 (Docling JSON)
    │       │
    │       └── Wave 2 (hierarchical + auto-merge)
    │
    ├── Wave 3 (embedder hardening) ──────────────────────────────→ deploy
    │
    └── Wave 5 (eval framework)
            │
            ├── 5.7 baseline BEFORE Waves 1-4
            │
            └── 5.8 measurement AFTER Waves 1-4
                    │
                    └── Wave 6 (advanced optimizations)
```

**Critical path:** Wave 0 → Wave 5.7 (baseline) → Wave 1 → Wave 2 → Wave 5.8 (measurement)

---

## Effort Summary

| Wave | Description | Effort | Priority |
|---|---|---|---|
| **Wave 0** | Bug fixes | **1.5h** | P0 |
| **Wave 1** | Structure-aware blocks | **16.5h** | P0 |
| **Wave 2** | Hierarchical + auto-merge | **5.5h** | P1 |
| **Wave 3** | Embedder hardening | **5h** | P1 |
| **Wave 4** | Docling JSON integration | **5.5h** | P2 |
| **Wave 5** | Evaluation framework | **19h** | P1 |
| **Wave 6** | Advanced optimizations | **8.5h** | P3 |
| **Total** | | **~61.5h** | |

---

## Expected Impact (quantitative, from research)

| Metric | AS-IS (estimated) | TO-BE (projected) | Source |
|---|---|---|---|
| Block Integrity | ~0.40 (code/tables split) | >0.90 | R3: 5 failure modes fixed |
| Retrieval Recall@5 | baseline | +10-15% | R3: heading-aware = "single biggest improvement" |
| Answer Accuracy | baseline | +8-12% | Clinical study: adaptive 87% vs fixed 13% (p=0.001) |
| Parent merge precision | 0% threshold (all children) | 40% threshold | R4: LlamaIndex default 50%, ours 40% (wider ratio) |
| Late chunking reliability | unknown (silent truncation) | guaranteed (token-aware batching) | R1: 8K token cap verified |
| Embedding API waste | truncate_dim sent (ignored) | clean request body | R1: phantom parameter |
| Chunk quality visibility | none | 3-layer metrics | R7: first RAG service to expose |
| Contextual+Late synergy | used together but unverified | A/B/C/D quantified | R2: +23.6 nDCG expected |

---

## Files Changed Summary

| Category | New files | Modified files |
|---|---|---|
| Wave 0 | — | embedder/index.ts, pipeline.ts, rag/index.ts, tokenizer.ts |
| Wave 1 | chunker/block-classifier.ts | chunker/semantic.ts, chunker/types.ts, chunker/index.ts |
| Wave 2 | — | pipeline.ts, vectorstore/index.ts, rag/index.ts, chunker/hierarchical.ts |
| Wave 3 | — | embedder/index.ts |
| Wave 4 | chunker/docling-blocks.ts | parsers/docling.ts, chunker/index.ts |
| Wave 5 | evaluation/dataset/, evaluation/metrics/intrinsic.ts, evaluation/metrics/retrieval.ts, evaluation/compare.ts | — |
| Wave 6 | chunker/pic.ts | chunker/contextual.ts, embedder/index.ts, evaluation/ |

---

## AC

| ID | Criteria | Wave | How to verify |
|---|---|---|---|
| AC-1 | Code blocks never split mid-function | 1 | Upload MD with 3 code blocks → each in one chunk |
| AC-2 | Tables never split mid-row | 1 | Upload MD with 2 tables → each intact |
| AC-3 | Headings start new chunks | 1 | Upload MD with 5 sections → 5+ chunks, each starts at heading |
| AC-4 | Hierarchical mode active for docs >1K tokens | 2 | Upload 10-page PDF → DB shows parent+child chunk_types |
| AC-5 | resolveParents uses 0.4 threshold | 2 | Query narrow topic → returns child, not parent |
| AC-6 | Late chunking batches capped at 8K tokens | 3 | Upload large doc → logs show batch splitting |
| AC-7 | truncate_dim removed | 0 | grep returns nothing |
| AC-8 | Eval baseline measured | 5 | evaluation/results/baseline.json exists |
| AC-9 | Post-implementation metrics improved | 5 | Wilcoxon p < 0.05 on Token-IoU |
| AC-10 | Block Integrity > 0.90 | 5 | evaluation output |
