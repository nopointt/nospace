# Coach Review — TLOS-09 Turn B (zep-client.js full API + domain seeding)
Date: 2026-03-10

## REQ-004 — Full API

| Check | Result | Notes |
|-------|--------|-------|
| ensureDomain — handles no /api/v2/users endpoint | PASS | Correctly documented as no-op check + seedDomainIfEmpty; no attempt to POST to non-existent endpoint |
| ensureDomain — idempotent | PASS | seedDomainIfEmpty skips if facts exist; ensureDomain returns same shape on repeated calls |
| ensureDomain — zero-throw | PASS | Full body in try/catch, returns null on exception |
| addFact — uses POST /api/v2/users/{domain}/facts | PASS | Path matches backend exactly |
| addFact — body uses "content" field | PASS | `{ content, metadata }` matches backend FactIn model |
| addFact — zero-throw | PASS | try/catch wraps full body, returns false on error |
| addFact — returns bool | PASS | `result !== null` |
| getFacts — GET /api/v2/users/{domain}/facts | PASS | Path and method correct |
| getFacts — unwraps .facts array | PASS | `data.facts \|\| []` — matches backend response `{ facts: [...] }` |
| getFacts — returns [] on error | PASS | Both catch and null data path return [] |
| searchFacts — POST /api/v2/users/{domain}/search | PASS | Adapted from spec (which specified /api/v2/graph/search) to actual backend |
| searchFacts — body {query, limit} | PASS | Matches backend SearchIn model exactly |
| searchFacts — returns array | PASS | `data.facts \|\| data.results \|\| []` |
| getContext — calls getFacts | PASS | `getFacts(domain, 10)` |
| getContext — numbered list format | PASS | `.map((f, i) => \`${i + 1}. ...\`).join('\n')` |
| getContext — uses f.content field | PASS | `f.content || f.fact` — primary is correct, fallback appropriate |
| getContext — returns '' on empty | PASS | Early return if facts.length === 0 |
| All zero-throw | PASS | Every exported function has full try/catch wrapping |

## REQ-005 — Development domain seeding

| Check | Result | Notes |
|-------|--------|-------|
| DEVELOPMENT_DOMAIN_SEED array exists | PASS | Line 137, 12 entries |
| Facts describe tLOS state | PASS | Covers stack, NATS, Letta, LangGraph, G3, bridge, sessions, grid.ps1, identity, Eidolon |
| seedDomainIfEmpty checks count > 0 | PASS | `getFacts(domain, 1)` → early return if length > 0 |
| Seeding if empty → adds all facts | PASS | Iterates seed array, calls addFact for each |
| Idempotent | PASS | Early return on existing facts |
| Called from ensureDomain | PASS | Line 67 |
| Non-fatal | PASS | Wrapped in try/catch; catch swallowed; ensureDomain continues |
| Not exported | PASS | Neither DEVELOPMENT_DOMAIN_SEED nor seedDomainIfEmpty in module.exports |

## module.exports

Exactly 6 exports: isAvailable, ensureDomain, addFact, getFacts, searchFacts, getContext. No internal functions or constants exported. PASS.

## Issues Found

**LOW — searchFacts: dead code in response unwrapping (line 114)**
`Array.isArray(data) ? data : (data.facts || data.results || [])` — backend always returns `{ facts: [...] }`, never bare array or `results`. The primary path (`data.facts`) is always taken. No correctness impact.

**LOW — addFact metadata merging silently overwrites caller `added` field (line 82)**
`{ ...metadata, added: new Date().toISOString() }` — if caller passes `{ added: '...' }`, it's overwritten. Not a spec violation; cosmetic concern.

## Verdict

TURN_B_APPROVED ✅

All REQ-004 and REQ-005 checks pass. API endpoints, request body fields, response unwrapping,
zero-throw guarantees, seeding logic, idempotency, and export surface are all correctly
implemented and aligned with the actual mem0-wrapper.py backend.
