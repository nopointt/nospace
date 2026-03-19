---
# HARKLY-18.3 — Schema + Extract (killer feature)
> Parent: HARKLY-18 | Status: ⬜ BLOCKED by 18.2
> Spec: `docs/research/harkly-mvp-build-plan.md` Phase 2
> Copy Map: `docs/research/harkly-mvp-copy-map.md`
---

## Required Reading (before any code)

1. `nospace/docs/research/harkly-eval-schema-extract.md` — FULL (documind, sift-kg, l1m, instructor-js patterns, Copy Map, Architecture)
2. `nospace/docs/research/harkly-mvp-architecture.md` — section 4.2 (Schema Discovery → Extraction flow)
3. `nospace/docs/research/harkly-mvp-api-spec.md` — section 4 (Schema endpoints, Extraction endpoints)
4. `nospace/docs/research/harkly-mvp-copy-map.md` — section 2 (Clone & Adapt: schema inference subsection)
5. `nospace/docs/research/harkly-mvp-data-model.md` — section 3.2 (Schema/extraction tables)

## Goal

Upload documents → AI proposes schema → user confirms/edits → structured extraction to D1 rows.

## 5-Stage Pipeline

1. **Ingest** — text already in D1 from 18.2
2. **Schema Discovery** — sample 5 chunks → LLM "schema architect" prompt → SchemaField[] tree
3. **User Confirmation** — UI shows proposed fields → user renames/removes/adds → confirm
4. **Zod Compilation** — confirmed SchemaField[] → convertToZodSchema() → live ZodObject
5. **Extraction** — per chunk: doc context + minimalSchema + LLM call (instructor-js TOOLS mode) → Zod validation → retry on failure → D1 insert

## Schema Representation

```typescript
type SchemaField = {
  name: string
  type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum"
  description?: string
  required?: boolean
  children?: SchemaField[]
  enumValues?: string[]
}
```

Serializable (D1 JSON), editable (UI), compilable (Zod).

## Tasks

- [ ] Schema discovery endpoint: sample chunks → LLM → SchemaField[]
- [ ] Discovery prompt: hybrid sift-kg architect + documind AUTO_SCHEMA
- [ ] `parse_llm_json()` — robust JSON parsing (strip fences, scan braces)
- [ ] Schema confirmation UI: editable field list, types, required toggles
- [ ] Instruction-guided mode: "I want vendor, total, line items" → two-call pipeline
- [ ] `convertToZodSchema(fields)` — port from documind
- [ ] `minimalSchema()` + `collectDescriptions()` — port from l1m
- [ ] Document context generation (1 LLM call per doc — sift-kg pattern)
- [ ] Extraction pipeline: per chunk → instructor-js → Zod safeParseAsync → retry 3x
- [ ] Dedup extracted rows (sift-kg pattern)
- [ ] Results table UI: columns from schema, rows from extraction, confidence scores
- [ ] Source link: click row → source chunk highlighted
- [ ] Export to CSV

## Clone From

| Source | What |
|---|---|
| documind | AUTO_SCHEMA_PROMPT, INSTRUCTIONS_SCHEMA_PROMPT, convertToZodSchema, baseSchema |
| sift-kg | build_discovery_prompt, _generate_doc_context, _dedupe_entities, parse_llm_json |
| l1m | minimalSchema(), collectDescriptions() |
| instructor-js | retry-with-error-feedback, TOOLS/JSON_SCHEMA mode, LLMValidator |

## Acceptance

- [ ] Upload 5 PDFs → "Discover Schema" → AI proposes reasonable fields
- [ ] Edit schema (rename, remove, add) → confirm
- [ ] Extraction produces structured rows in table
- [ ] Each row has confidence score + source link
- [ ] Instruction-guided: "name, email, company" → 3 fields → extraction works
- [ ] Export to CSV opens in Excel correctly
