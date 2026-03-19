# Harkly Eval — Schema Extraction Repos
> Date: 2026-03-19
> Evaluator: Lead/TechResearch
> Scope: AI schema inference + structured extraction for Harkly's killer feature (upload data → AI proposes schema → user confirms → structured extraction to DB)

---

## 1. documind

**Repo:** `DocumindHQ/documind` — 1.5K stars
**Language:** TypeScript (JS with JSDoc in extractor package, TypeScript in core)
**License:** MIT
**Last active:** 2025 (active maintenance)

### 1.1 Schema Inference

documind has a dedicated `autoschema` module. Three modes:

**Mode A — blanket (fully automatic):**
Prompt: `AUTO_SCHEMA_PROMPT(markdown)` — reads the entire markdown content of the document and asks the LLM to produce a schema of useful fields. The prompt is minimal:
```
Read the following markdown content and generate a schema of useful structured data that can be extracted from it. Follow these rules strictly:
- The `children` field must only be present if the `type` is `object` or `array`. It should never exist for other types.
- `description` fields should be concise, no longer than one sentence.
"""${markdown}"""
```

**Mode B — instruction-guided:**
User provides natural language like "give me vendor name, invoice total, and line items". The system runs two LLM calls: first extracts field names from the instruction text, then asks the LLM to generate a schema for exactly those fields from the document content.

**Mode C — user-provided schema:**
User passes a JSON schema definition directly; no LLM schema inference needed.

Schema output format (Zod-enforced):
```typescript
// Recursive tree of field descriptors
{
  name: string,
  type: "string" | "number" | "array" | "object",
  description?: string,
  children?: SchemaField[]  // only for array/object types
}
```

This intermediate schema representation is then compiled to a live Zod schema via `convertToZodSchema()` — a tree-walk that handles string, number, boolean, enum, object (recursive), and array (recursive).

### 1.2 schema_free mode

Yes — `autoSchema: true` activates blanket schema. `autoSchema: { instructions: "..." }` activates instruction-guided mode. Both bypass pre-defined schema entirely. The user never needs to know what fields exist.

### 1.3 Extraction Pipeline

```
file path
  → convertFile()
      → documind core: download → convert to PDF → PDF to PNG images
      → per-page: LLM vision call (GPT-4o / Gemini / Llama3.2-vision) → markdown
      → aggregate all page markdowns
  → (if autoSchema) autogenerateSchema(markdown, model)
      → LLM call → intermediate SchemaField[] tree
  → convertToZodSchema(schemaFields) → live ZodObject
  → extraction LLM call:
      system: BASE_EXTRACTION_PROMPT ("extract info, null for missing")
      user: combined markdown text
      response_format: zodResponseFormat(zodSchema, "event")
  → parsed JSON result
```

Key architecture insight: **two LLM calls minimum** — one for schema discovery (auto mode), one for extraction. For multi-page documents, there is also one LLM vision call per page for OCR/markdown generation, parallelized with `p-limit(concurrency=10)`.

### 1.4 Output Format

JSON object shaped exactly by the generated Zod schema. No envelope — raw extracted object. Example for an invoice: `{ vendor_name: "Acme Corp", total: 1500.00, line_items: [...] }`. The schema structure becomes the JSON structure.

### 1.5 LLM Integration

- **OpenAI:** gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini — uses `openai.beta.chat.completions.parse()` with `zodResponseFormat()` for guaranteed structured output
- **Google:** gemini-2.0-flash-001, gemini-1.5-flash, gemini-1.5-pro, gemini-1.5-flash-8b — uses `@google/generative-ai` structured generation
- **Local:** llama3.2-vision via Ollama — uses OpenAI-compatible API with BASE_URL env var
- **Configurability:** model passed per-call, provider determined by model name. Adding a new provider requires writing a new extractor function.
- **Note:** Schema inference and extraction use the same model. No provider mixing in one pipeline run.

### 1.6 Validation

`zodResponseFormat()` (OpenAI) / equivalent (Google) enforces the schema at the API level — the model is constrained to produce valid JSON matching the Zod schema. No separate post-hoc validation step. For local models (Ollama), the same `zodResponseFormat` call is made but enforcement depends on the local model's support.

Schema validation before extraction: `validateSchema(schema)` checks user-supplied schemas for structural integrity (type correctness, required children fields, etc.) before any LLM calls.

### 1.7 Multi-document

No native batch API. The caller must loop over documents and call `extract()` per document. The schema can be reused across multiple documents by passing `schema` (or the result of a prior auto-schema run). Pre-built templates (`templates/invoice.json`, `templates/bank_statement.json`, `templates/drivers_license_uk.json`) allow domain-specific reuse without re-running schema inference.

### 1.8 What to Steal

- **`convertToZodSchema(fields)`** — the recursive field-to-Zod compiler (`extractor/src/utils/convertToZodSchema.js`). Clean, complete, handles nested objects and typed arrays. Directly usable in Harkly.
- **`AUTO_SCHEMA_PROMPT` + `INSTRUCTIONS_SCHEMA_PROMPT`** — the two prompts for schema inference. The instruction-based two-call pipeline (extract field names from instruction → generate schema for those fields) is a clean UX pattern.
- **`cleanSchemaFields`** — likely cleans up LLM output (field name normalization, null removal). Worth reading.
- **`baseSchema` (Zod recursive)** — the Zod definition used to constrain the schema-generation LLM call is elegant: `z.lazy()` for recursive field trees.
- **Template pattern** — pre-built JSON schema templates for common document types. Good starting point for Harkly's "common entity types" presets.
- **Two-stage extraction** — schema first, extraction second with Zod-constrained output. This is the right architecture for Harkly's "propose → confirm → extract" flow.

### 1.9 What to Skip

- **PDF-to-image OCR pipeline** — Harkly handles files via its own ingestion; the `core/` module (PDF → PNG → vision LLM → markdown) is not needed.
- **Per-page concurrent processing** — only relevant for large PDFs. Harkly's MVP scope is simpler.
- **Template JSON files** — documind's templates are document-type specific (invoices, licenses). Harkly's schema is user-driven, not template-driven.
- **Ollama local model support** — not in Harkly stack.

### 1.10 Language

TypeScript. Zero porting work. Native Bun/Node.js compatible.

---

## 2. sift-kg

**Repo:** `juanceresa/sift-kg` — 444 stars
**Language:** Python 3.11+
**License:** MIT
**Last active:** 2025 (active)

### 2.1 Schema Inference

sift-kg implements a two-phase schema discovery system that is the most sophisticated of the four repos evaluated:

**Phase 1 — Discovery (schema_free mode):**
Takes up to 5 document samples (first 3000 chars each), sends to LLM with `build_discovery_prompt()`. The prompt asks the LLM to design a full knowledge graph schema: 5-15 entity types with descriptions, 8-20 relation types with source/target type constraints. Output is a JSON object with `entity_types` and `relation_types` dictionaries.

The discovery prompt (verbatim, load-bearing):
```
You are a knowledge graph architect. Analyze the document samples below and design a schema (entity types + relation types) that best captures the information in this corpus.

TASK: Design a schema with:
- 5-15 entity types that cover the key concepts in these documents
- 8-20 relation types that capture the important relationships

REQUIREMENTS:
- All type names must be UPPERCASE_SNAKE_CASE (e.g. PERSON, GOVERNMENT_AGENCY, FUNDED_BY)
- Each entity type needs a brief description
- Each relation type needs a description and source_types / target_types lists
...
Return ONLY valid JSON matching this schema: { "entity_types": {...}, "relation_types": {...} }
```

**Phase 2 — Extraction using discovered schema:**
The discovered schema is saved as `discovered_domain.yaml` and cached. Subsequent runs reload from cache (no repeated LLM calls for schema). Each document is then chunked (default 10000 chars) and processed chunk-by-chunk with the discovered schema as constraints.

**Predefined domains (no discovery needed):**
YAML domain files: `general/`, `academic/`, `osint/`, `schema-free/`. Users can provide custom `domain.yaml`. Each domain specifies entity_types with descriptions and extraction_hints, relation_types with source/target type constraints.

### 2.2 schema_free mode

Yes — first-class citizen. Set `schema_free: true` in the domain config. The system:
1. Samples first chunks from up to 5 documents
2. Asks LLM to design schema from scratch
3. Saves discovered schema to `discovered_domain.yaml` (cached between runs)
4. Switches `schema_free=False` and uses the concrete discovered schema for all extraction

Important nuance: even in schema_free mode, the actual extraction prompt does NOT ask the LLM to invent types on-the-fly per chunk. Discovery runs once up front, then extraction is constrained. This prevents "type drift" across chunks (the core challenge in per-chunk free extraction).

Hybrid mode: provide some entity type hints in the schema_free domain config — the discovery prompt includes them as guidance but allows discovery of additional types.

### 2.3 Extraction Pipeline

```
documents
  → read_document() [pdfplumber / kreuzberg / OCR backends]
  → chunk_text(chunk_size=10000)
  → (schema_free) discover_domain(samples[:5])
      → build_discovery_prompt(samples)
      → LLM call → entity_types + relation_types dict
      → save discovered_domain.yaml
  → _generate_doc_context(first_chunk)
      → LLM call: 2-3 sentence summary of document
      → used as context prefix for every chunk
  → asyncio.gather(*[_aextract_chunk(chunk) for chunk in chunks])
      → build_combined_prompt(chunk_text, doc_id, domain, doc_context)
          → single prompt extracts BOTH entities AND relations
      → LLM call → {"entities": [...], "relations": [...]}
      → parse ExtractedEntity/ExtractedRelation Pydantic objects
  → _dedupe_entities() — keeps highest confidence, merges contexts
  → DocumentExtraction (Pydantic model, saved as JSON)
  → graph/builder.py — merge extractions into knowledge graph
  → graph/postprocessor.py — dedup/merge nodes
  → graph/communities.py — community detection
  → export.py — HTML visualization + JSON graph_data
```

LLM calls per document: 1 (doc context) + N_chunks (extraction). Schema discovery: 1 call total across all documents.

### 2.4 Output Format

Graph triples + rich entity attributes:
```json
{
  "entities": [
    { "name": "Sam Bankman-Fried", "entity_type": "PERSON",
      "attributes": {"role": "CEO", "organization": "FTX"},
      "confidence": 0.95, "context": "...quote from text..." }
  ],
  "relations": [
    { "relation_type": "FOUNDED", "source_entity": "Sam Bankman-Fried",
      "target_entity": "FTX", "confidence": 0.9, "evidence": "...quote..." }
  ]
}
```

Final graph: NetworkX graph serialized to JSON. Also generates HTML visualization (pyvis).

### 2.5 LLM Integration

**LiteLLM** as the abstraction layer — supports any LiteLLM-compatible provider: OpenAI, Anthropic, Groq, Ollama, Mistral, etc. Model string format: `openai/gpt-4o`, `anthropic/claude-3-opus`, `groq/llama3-70b`, etc.

Built-in:
- Sliding-window RPM rate limiter (async-safe, token-bucket)
- Exponential backoff on rate limit errors (up to 8 retries)
- Cost tracking (`litellm.completion_cost()`)
- Timeout handling

Highly configurable. Model is a CLI argument.

### 2.6 Validation

No schema-level output validation (no Zod/Pydantic on LLM output). Instead:
- JSON parsing with fallback (strip markdown fences, scan for balanced braces)
- Per-entity/relation graceful error handling (malformed entries skipped, not crashing)
- Confidence scores (0.0–1.0) on every entity and relation
- Deduplication by name+type with confidence-based priority

### 2.7 Multi-document

Excellent native multi-document support:
- `extract_all()` processes a list of documents with shared concurrency semaphore (4 concurrent LLM calls by default)
- Incremental: skips already-extracted documents unless model/domain/chunk_size changed
- Schema discovery runs once across all documents (samples from first 5)
- Budget cap (`max_cost`) to stop processing if cost exceeds limit
- Progress bar (rich)

### 2.8 What to Steal

- **`build_discovery_prompt()`** — the full prompt text in `discovery.py` (lines 48-81). This is the cleanest "schema architect" prompt found in any evaluated repo. The requirement for UPPERCASE_SNAKE_CASE, specific counts (5-15 entity types, 8-20 relation types), and `source_types`/`target_types` constraints produces consistent, usable schemas.
- **Discovery-then-constrain pattern** — run discovery once on corpus samples, cache the schema, use it as constraints for all extraction. Prevents type drift. This is exactly what Harkly needs for the "AI proposes schema → user confirms → extract" flow.
- **`_build_schema_free_prompt()` + `build_combined_prompt()`** — the combined entity+relation extraction prompt (one LLM call per chunk instead of two) with confidence scores and evidence quotes.
- **`_generate_doc_context()`** — one LLM call per document generates a 2-3 sentence summary. This summary is prepended to every chunk's extraction prompt, giving the model document-level context. Cheap, effective.
- **`_dedupe_entities()`** — deduplication by name+type with highest-confidence priority and context aggregation (pipe-separated). Clean pattern.
- **`parse_llm_json()`** — robust JSON parsing that strips markdown fences and scans for balanced braces. Handles real-world LLM output quirks.
- **`DomainConfig` + YAML domain spec** — declarative domain schemas in YAML. Entity types with `extraction_hints` and `canonical_names`. Relation types with `source_types`/`target_types` directional constraints. This is a reusable Harkly schema representation format.
- **Incremental extraction metadata** — `domain_name`, `chunk_size`, `model_used`, `extracted_at` stored with each extraction for staleness detection.

### 2.9 What to Skip

- **Knowledge graph output** — Harkly wants structured relational data (rows/columns/foreign keys), not NetworkX graphs with community detection. The graph layer (graph/builder.py, communities.py, postprocessor.py) is out of scope.
- **Narrative generator** — `narrate/` module generates prose summaries from graphs. Not Harkly.
- **OSINT domain templates** — epstein/FTX examples are too niche. General/schema-free domains are the relevant ones.
- **PyVis HTML visualization** — Harkly has its own UI.

### 2.10 Language

Python 3.11+. Porting key logic to TypeScript for Harkly would require:
- `build_discovery_prompt()` — pure string template, trivial to port
- `build_combined_prompt()` — same, trivial
- `parse_llm_json()` — ~30 lines, trivial to port
- `LLMClient` — replace with NVIDIA NIM direct calls or use openai SDK

The Pydantic models (`ExtractedEntity`, `ExtractedRelation`, `DocumentExtraction`) map cleanly to Zod schemas.

---

## 3. l1m

**Repo:** `l1m-io/l1m` — 55 stars
**Language:** TypeScript (core library + Node.js API server)
**License:** MIT
**Last active:** 2025

### 3.1 Schema Inference

l1m does NOT do schema inference. It is a structured extraction library that requires a pre-defined JSON Schema. The user must supply the schema; l1m extracts data conforming to it.

No auto-schema, no discovery, no natural language → schema translation. This is a deliberate design choice — l1m's value proposition is a provider-agnostic extraction API, not schema generation.

### 3.2 schema_free mode

No. l1m requires a `schema` in every call. Without a schema, the call fails. There is no unsupervised schema discovery mode.

### 3.3 Extraction Pipeline

```
input (text or base64 image) + JSON Schema
  → structured()
      → minimalSchema(schema): convert JSON Schema → compact human-readable type string
          e.g. { name: string, age: float, tags: string[] }
      → collectDescriptions(schema): extract field descriptions as path: description lines
      → build prompt: "Answer in JSON using this schema:\n{minimalSchema}\n{descriptions}"
      → route to provider (Google / Anthropic / OpenAI / custom function)
      → LLM call → raw text
      → parseJsonSubstring(raw) — regex extraction of JSON from any text
      → validateResult(schema, data) — AJV JSON Schema validation
      → if validation fails AND attempts < maxAttempts:
          feed errors back to LLM: "You previously responded: X which produced errors: Y"
          retry
  → { raw, structured, attempts, valid, errors }
```

### 3.4 Output Format

Plain JSON object matching the provided schema. The API returns `{ data: Record<string, any> }`. The core library returns `{ raw, structured, attempts, valid, errors }`.

### 3.5 LLM Integration

Three native providers + custom function:
- **OpenAI-compatible** (default): any URL + key + model. Uses chat completions without structured output enforcement (just prompt engineering + JSON parsing).
- **Google (Gemini)**: detected by URL containing `generativelanguage.googleapis.com`
- **Anthropic**: detected by URL containing `api.anthropic.com`
- **Custom function**: pass a function `(params, prompt, previousAttempts) => Promise<string>` — full control

Provider detection is URL-based (not model-name based), which means NVIDIA NIM (OpenAI-compatible) works without any changes. Multi-attempt feedback loop is implemented: previous raw output + AJV errors are fed back to the model.

Configuration is per-call via HTTP headers (API server mode): `x-provider-model`, `x-provider-url`, `x-provider-key`, `x-max-attempts`, `x-cache-ttl`.

### 3.6 Validation

**AJV JSON Schema validation** (not Zod). `validateResult(schema, data)` uses `ajv.compile(schema)` to validate extracted data. Validation errors are fed back to the LLM for retry.

Intentional limitations on schema: `minLength`, `minimum`, `maxLength`, `maximum`, `oneOf`, `anyOf`, `allOf`, `pattern` are all disallowed (to keep the minimal schema representation simple). Only basic types + enums + nested objects/arrays supported.

### 3.7 Multi-document

No multi-document concept. Single-call design. The API server adds Redis-based caching (`x-cache-ttl` header) — same input+schema → returns cached result. Suitable for deduplication across multiple document processing calls but not batch orchestration.

### 3.8 What to Steal

- **`minimalSchema(schema)`** — the compact type printer (`core/src/schema.ts`). Converts JSON Schema to a minimal inline type notation for use in prompts: `{ name: string, items: [ { id: float, label: string } ] }`. This is the most useful single function in l1m. Much better than dumping raw JSON Schema into prompts.
- **`collectDescriptions(schema)`** — walks JSON Schema and extracts all descriptions as `path: description` lines. Used alongside `minimalSchema` to give the LLM semantic context without overwhelming it with the full schema JSON.
- **Multi-attempt feedback loop** — the pattern of feeding previous raw output + validation errors back to the LLM in subsequent attempts is clean. Implemented in ~20 lines, works with any provider.
- **Custom provider function** — the escape hatch `provider: (params, prompt, previousAttempts) => Promise<string>` makes the library adaptable to any LLM backend.
- **`parseJsonSubstring(raw)`** — regex JSON extraction from free text. Similar to sift-kg's `parse_llm_json()` but uses regex `/{.*}/s` + standalone match scan. Good reference for TS implementation.

### 3.9 What to Skip

- **API server** (`api/`) — Harkly runs its own server. The ts-rest contract API layer is interesting but not needed.
- **Redis caching** — managed separately in Harkly.
- **CLI (Go)** — not relevant.
- **AJV validation** — Zod is already in Harkly's stack, prefer Zod over AJV.
- **Schema limitations** — l1m intentionally disallows `oneOf`, `anyOf`, etc. Harkly may need these for complex schemas.

### 3.10 Language

TypeScript. Zero porting work.

---

## 4. instructor-js

**Repo:** `567-labs/instructor-js` — 781 stars
**Language:** TypeScript (Bun-first, also Node.js)
**License:** MIT
**Last active:** 2025

### 4.1 Schema Inference

instructor-js does NOT do schema inference. Like l1m, it requires pre-defined schemas (Zod schemas specifically). The user defines the Zod schema; instructor ensures the LLM output conforms to it.

instructor-js is a wrapper/interceptor on top of the OpenAI SDK (and OpenAI-compatible APIs) that injects schema-based response formatting and validation into the standard chat completion interface.

### 4.2 schema_free mode

No. Schema is mandatory — it is the entire value proposition. However, instructor-js demonstrates an important pattern: Zod schemas can include `.describe()` annotations, and these descriptions flow into the tool-calling/JSON schema that the LLM receives. Rich schema description = better extraction.

### 4.3 Extraction Pipeline

```
Zod schema + messages
  → withResponseModel({ params, mode, response_model })
      → converts Zod schema to JSON Schema
      → injects into completion params as:
          MODE.TOOLS → function_call with schema as parameters
          MODE.JSON → response_format: { type: "json_object" } + system prompt
          MODE.JSON_SCHEMA → response_format: { type: "json_schema", schema: ... }
          MODE.MD_JSON → system prompt "Return JSON in markdown code block"
  → LLM call (standard OpenAI API)
  → parse response per mode (OAIResponseParser / thinkingJsonParser)
  → JSON.parse result
  → response_model.schema.safeParseAsync(data) — Zod validation
  → if validation fails AND attempts < max_retries:
      append assistant message (bad JSON) + user message ("Please correct the function call; errors encountered: ${zodError}")
      retry
  → { ...zodValidatedData, _meta: { usage, thinking } }
```

Streaming is also supported: `zod-stream` library for partial object streaming. Partial objects are yielded as they build up.

### 4.4 Output Format

TypeScript object typed as `z.infer<YourSchema>` — fully typed, validated. No envelope wrapper. The `_meta` property (usage stats, thinking tokens) is merged in.

### 4.5 LLM Integration

Supports any OpenAI-like client. Provider detection by base URL:
- OAI (api.openai.com)
- Anthropic (api.anthropic.com) — TOOLS and MD_JSON modes
- Groq (api.groq.com) — TOOLS, FUNCTIONS, MD_JSON
- Anyscale, Together — JSON_SCHEMA, MD_JSON
- OTHER — all text modes work

NVIDIA NIM is OpenAI-compatible → works as PROVIDERS.OTHER with TOOLS or JSON_SCHEMA mode.

Per-provider parameter transformers handle quirks: Groq streams + tools warning, Anyscale removes `additionalProperties` from schemas, etc.

Modes breakdown:
- `TOOLS` — uses OpenAI function calling (most reliable structured output)
- `JSON_SCHEMA` — OpenAI native structured output (JSON schema enforcement)
- `JSON` — `response_format: {type: "json_object"}` (less reliable)
- `MD_JSON` — markdown code block extraction (works with any model)
- `THINKING_MD_JSON` — extended thinking + JSON (for deepseek-r1, Claude thinking)

### 4.6 Validation

Zod `safeParseAsync()` — the gold standard. Validation errors converted to human-readable strings via `zod-validation-error`. Error feedback loop: bad output + Zod error message → next LLM attempt message. Clean retry mechanism.

`LLMValidator` DSL: attach a `.superRefine(LLMValidator(instructor, "statement", params))` to any Zod field — the LLM validates field values against natural language statements. Powerful for semantic validation beyond structural correctness (e.g., "the date must be in the future").

### 4.7 Multi-document

No concept of multi-document batch processing. Single-completion design. Calling code loops over documents. No caching, no incremental processing.

### 4.8 What to Steal

- **`withResponseModel()` mode system** — the TOOLS/JSON/JSON_SCHEMA/MD_JSON mode abstraction is the right way to support multiple LLM providers with different structured output capabilities. Steal the mode selection strategy.
- **Retry-with-error-feedback pattern** — when Zod validation fails, append `assistant: {bad_json}` + `user: "Please correct; errors: {zodError}"` and retry. Simple, effective, model-agnostic. Used in both instructor-js and l1m.
- **`LLMValidator` DSL** — `.superRefine(LLMValidator(instructor, "The value must be a valid email address", { model: "..." }))` on any Zod field. Bridges structural and semantic validation. Very relevant for Harkly's schema — e.g., validate that extracted dates are real, amounts are positive, etc.
- **`zod-stream`** — streaming partial objects as they build up. Relevant for Harkly's UX — schema proposal can stream in, user sees fields appear as the LLM generates them.
- **Knowledge graph example** (`examples/knowledge-graph/index.ts`) — Zod schema for nodes + edges with `NodeSchema`, `EdgeSchema`, `KnowledgeGraphSchema`. Directly usable as a Harkly entity-relation representation.
- **Entity resolution example** (`examples/resolving-complex-entitities/index.ts`) — sophisticated schema: entities with `id`, `subquote_string[]`, `properties[]`, `dependencies[]`. The `dependencies` array (entity IDs that must be resolved first) is an excellent pattern for Harkly's relational extraction (FK resolution).

### 4.9 What to Skip

- **Streaming infrastructure** — relevant but not MVP scope. Add later.
- **Anyscale/Together provider support** — not in Harkly stack.
- **`Maybe<T>` DSL** — wraps schema to allow partial extraction with error field. Niche use case.

### 4.10 Language

TypeScript (Bun runtime, also Node.js compatible). Zero porting work.

---

## Copy Map — What to Take

| Source repo | File / Pattern | Use in Harkly |
|---|---|---|
| documind | `extractor/src/prompts.js` — `AUTO_SCHEMA_PROMPT` | Schema inference prompt: show doc → ask for schema |
| documind | `extractor/src/prompts.js` — `INSTRUCTIONS_SCHEMA_PROMPT` + two-call pipeline | Instruction-guided schema: user says "I want X, Y, Z" |
| documind | `extractor/src/utils/convertToZodSchema.js` | Compile intermediate schema representation to live Zod schema |
| documind | `extractor/src/autoschema/generation-schemas/base.js` | Zod schema for constraining schema-inference LLM output (recursive `z.lazy()`) |
| documind | `extractor/src/prompts.js` — `BASE_EXTRACTION_PROMPT` | Extraction system prompt (null for missing, no placeholders) |
| sift-kg | `src/sift_kg/domains/discovery.py` — `build_discovery_prompt()` lines 48-81 | Discovery prompt: knowledge graph architect persona, entity+relation types with constraints |
| sift-kg | `src/sift_kg/extract/prompts.py` — `_build_schema_free_prompt()` | Schema-free per-chunk extraction prompt |
| sift-kg | `src/sift_kg/extract/prompts.py` — `build_combined_prompt()` | Combined entity+relation extraction in one LLM call |
| sift-kg | `src/sift_kg/extract/extractor.py` — `_generate_doc_context()` | Document-level context generation (1 call per doc, prepended to each chunk) |
| sift-kg | `src/sift_kg/extract/extractor.py` — `_dedupe_entities()` | Deduplication by name+type, highest confidence wins |
| sift-kg | `src/sift_kg/extract/llm_client.py` — `parse_llm_json()` | Robust JSON parsing: strip fences, scan balanced braces |
| sift-kg | `src/sift_kg/extract/models.py` | Data models: `ExtractedEntity`, `ExtractedRelation`, `DocumentExtraction` → port to Zod |
| l1m | `core/src/schema.ts` — `minimalSchema()` | Compact schema-to-string printer for prompts |
| l1m | `core/src/schema.ts` — `collectDescriptions()` | Extract field descriptions as path:desc lines |
| l1m | `core/src/model.ts` — multi-attempt feedback loop | Feed previous bad output + errors back to LLM for retry |
| instructor-js | `src/instructor.ts` — retry-with-error-feedback | Append assistant+user messages on validation failure, retry |
| instructor-js | `src/dsl/validator.ts` — `LLMValidator` | Semantic field validation via LLM superRefine |
| instructor-js | `examples/resolving-complex-entitities/index.ts` | Entity schema with properties[], dependencies[] — FK resolution pattern |
| instructor-js | Mode strategy (TOOLS/JSON_SCHEMA/MD_JSON) | Provider-capability-aware mode selection |

---

## Schema Inference Architecture for Harkly

Based on all four repos, the recommended architecture for Harkly's "killer feature" is:

### Core Flow

```
Upload (any file: CSV, PDF, XLSX, JSON, text)
  ↓
Ingest → text/markdown extraction (existing Harkly pipeline)
  ↓
STAGE 1: Schema Discovery (sift-kg pattern, TS)
  Sample up to 5 representative chunks (first 3000 chars each)
  → LLM call with discovery_prompt:
      "You are a schema architect. Analyze these document samples.
       Design 3-10 entity types with fields, 5-15 relationship types.
       Return JSON: { entity_types: {...}, fields: {...}, relations: {...} }"
  → Parse response → intermediate SchemaDefinition object
  ↓
STAGE 2: User Confirmation (Harkly UI)
  Show proposed schema to user (field names, types, descriptions)
  User can: accept / rename fields / change types / remove fields / add fields
  ↓
STAGE 3: Zod Schema Compilation (documind pattern)
  user-confirmed SchemaDefinition → convertToZodSchema() → live ZodObject
  ↓
STAGE 4: Extraction (instructor-js + l1m patterns)
  For each document chunk:
    → extraction_prompt(chunk, zodSchema, doc_context)
    → LLM call with MODE=TOOLS or JSON_SCHEMA (best for NIM)
    → Zod safeParseAsync() validation
    → On failure: retry with error feedback (max 3 attempts)
    → Extract structured rows
  ↓
STAGE 5: Persist to Supabase
  Validated extracted objects → Prisma insert
  Schema definition → stored in DB as "dataset schema"
  Incremental: track which documents have been extracted with which schema version
```

### Key Architectural Decisions

**Schema representation (intermediate format):**
Use documind's field tree format as the intermediate between LLM output and Zod:
```typescript
type SchemaField = {
  name: string
  type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum"
  description?: string
  required?: boolean
  children?: SchemaField[]    // for array/object
  enumValues?: string[]       // for enum
}
```
This representation is serializable (store in DB), editable by users in UI, and compilable to Zod via `convertToZodSchema()`.

**Schema discovery prompt:**
Combine sift-kg's `build_discovery_prompt()` persona ("You are a schema architect") with documind's `AUTO_SCHEMA_PROMPT` simplicity. For Harkly, the output should be flat-ish records (entity types with fields), not graph triples.

**Extraction prompt:**
Use sift-kg's document context pattern: one LLM call to summarize the document, prepend that summary to every chunk's extraction call.
Use l1m's `minimalSchema()` + `collectDescriptions()` to represent the schema in the prompt concisely.
Use documind's `BASE_EXTRACTION_PROMPT` rule about null for missing fields.

**LLM provider:**
NVIDIA NIM (meta/llama-3.3-70b-instruct) is OpenAI-compatible. Use instructor-js's `MODE.TOOLS` or `MODE.JSON_SCHEMA` for best structured output reliability. TOOLS mode is most reliable across capable models.

**Validation:**
Zod `safeParseAsync()`. On failure, use instructor-js's retry-with-error-feedback pattern. Max 3 attempts. After 3 failures, return partial result with error markers rather than crashing.

**Multi-document:**
Adopt sift-kg's incremental pattern: store extraction metadata (schema_version, model, extracted_at) per document. On re-extraction, check staleness. Process documents in parallel with a shared async semaphore (concurrency=4 to stay within NIM rate limits).

### What NOT to do

- Do not use knowledge graph output (entities + relations as graph triples) as Harkly's primary data model. Users expect tables/rows, not graphs. Use relational extraction: entity_type → table, field → column, FK relation → foreign key.
- Do not run schema discovery on every document. Discover once per dataset (or per user trigger), cache the schema, reuse for all documents in the dataset.
- Do not use sift-kg's `schema_free: true` mode directly (per-chunk type invention). Always run discovery first, then constrain extraction to the discovered + user-confirmed schema.
- Do not skip the user confirmation step. This is Harkly's UX differentiator — the schema is proposed by AI, refined by the user, then committed. Extraction only runs on the confirmed schema.
