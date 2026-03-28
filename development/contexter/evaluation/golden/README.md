# Golden Test Set — Format Documentation

## Directory Structure

```
evaluation/golden/
  README.md          -- this file
  index.json         -- manifest of all pair IDs
  manual/            -- hand-crafted Q&A pairs
    NNN.json
  synthetic/         -- LLM-generated pairs, human-reviewed
    NNN.json
```

## Q&A Pair File Format

Each `.json` file in `manual/` or `synthetic/` must match this schema:

```json
{
  "id": "gq-001",
  "question": "What document formats does Contexter support?",
  "expected_answer": "Contexter supports PDF, DOCX, TXT, and Markdown files.",
  "expected_sources": ["doc_abc123"],
  "tags": ["capabilities", "formats"],
  "added_by": "manual",
  "added_at": "2026-03-28",
  "reviewed": true
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | `gq-NNN` for manual, `gs-NNN` for synthetic |
| `question` | string | yes | Test query string |
| `expected_answer` | string | yes | Reference answer for relevancy evaluation |
| `expected_sources` | string[] | no | Document IDs expected in retrieval sources |
| `tags` | string[] | yes | Free-form tags for filtering |
| `added_by` | "manual" \| "synthetic" | yes | Origin of the pair |
| `added_at` | string | yes | ISO date (YYYY-MM-DD) |
| `reviewed` | boolean | yes | Must be `true` for CI inclusion |

## CI Gate

Pairs with `reviewed: false` are excluded from `run-eval.ts`.

Thresholds (fail build if not met):
- `mean_faithfulness >= 0.70`
- `mean_relevancy >= 0.65`

## Target Set Size

20 manual pairs + 30 synthetic reviewed pairs = 50 total minimum for stable CI gate.

## Stale Pair Management

When documents change, run `evaluation/check-stale.ts` to flag pairs where the API
no longer retrieves `expected_sources`. Set `reviewed: false` on stale pairs until re-verified.
