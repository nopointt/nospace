# VECTOR SEARCH REGULATION — Semantic Retrieval Security
> Applies to: all agents and systems using vector/semantic search under /nospace.
> Authority: Senior Architect. Review: when vector search is introduced.
> Status: PROACTIVE — vector search not yet deployed. This regulation establishes pre-conditions.
> Tags: [vector-search, rag, embedding, retrieval, llm08, semantic-context]

---

## § 1 — Why This Exists Now

**LLM08 (Vector and Embedding Weaknesses)** — When a RAG (Retrieval-Augmented Generation) system is introduced, it creates a new attack surface: an attacker who can write to the knowledge base can inject documents that are semantically similar to legitimate queries, causing the retrieval system to return poisoned context to agents.

This regulation defines the security pre-conditions that MUST be met before any vector search system is enabled in /nospace.

---

## § 2 — Pre-Conditions for Vector Search Activation

No vector/embedding search system may be activated in /nospace until ALL of the following are in place:

| Pre-condition | Status | Owner |
|---|---|---|
| Source corpus integrity: all indexed files have sha256 hashes in memory-regulation.md §6 format | ⏳ Pending | Senior Architect |
| Write-access audit: only verified agents (with valid SIT per agent-identity-regulation.md) can add documents to the corpus | ⏳ Pending | Assistant |
| Retrieval result logging: every retrieval query + returned chunks logged for audit | ⏳ Pending | DevOps Lead |
| Query sanitization: user/agent queries stripped before embedding (output_sanitization rules apply) | ⏳ Pending | DevOps Lead |
| Namespace isolation: tLOS corpus and harkly corpus are in separate namespaces, not mixed | ⏳ Pending | Senior Architect |

---

## § 3 — Corpus Integrity

### Rule 3.1 — Source of Truth
Only files that exist in `/nospace` with a valid sha256 integrity header (per memory-regulation.md §6) may be indexed into a vector store.

### Rule 3.2 — Index Immutability
Once a document is embedded and stored in the vector index, it MUST NOT be updated in-place. Update = delete old embedding + insert new embedding with new hash. This creates an audit trail.

### Rule 3.3 — Provenance Metadata
Every vector chunk MUST carry provenance metadata:
```json
{
  "chunk_id": "<uuid>",
  "source_file": "/nospace/rules/regulations/rbac-regulation.md",
  "source_sha256": "<hash>",
  "indexed_at": "2026-02-23T...",
  "indexed_by": "<agent-id>"
}
```

Agents receiving retrieval results MUST log the provenance, not just the content.

---

## § 4 — Retrieval Security Rules

### Rule 4.1 — Query Isolation
Agent queries MUST be scoped to their RBAC-allowed namespaces. A `senior-coder` agent scoped to branch `feat-actor-lifecycle` CANNOT query the global knowledge base.

```
Query scope = intersection(agent RBAC read permissions, requested namespace)
```

### Rule 4.2 — Result Validation
Retrieved chunks MUST be validated before injection into agent context:
1. Verify `source_sha256` against the live file hash.
2. If mismatch: discard chunk, log as integrity violation, do not inject into context.
3. Apply `output_sanitization` (L4-guardrails.yaml) to retrieved text before injecting.

### Rule 4.3 — Similarity Score Threshold
Chunks below a minimum similarity score MUST be discarded, not injected:
- Default threshold: `0.75` (cosine similarity).
- Below threshold = likely retrieval hallucination or injection attempt.
- Threshold is configurable per project but CANNOT be set below `0.60`.

### Rule 4.4 — Result Count Cap
Maximum retrieved chunks per query: **5**. Prevents context flooding (LLM10 variant).

---

## § 5 — Prohibited Patterns

| Pattern | Risk | Mitigation |
|---|---|---|
| Indexing files from `.archive/` without explicit flag | Poisoning with stale/removed content | Archive namespace isolated from active corpus |
| Indexing `scratchpad.md` files (Tier 0 raw memory) | Raw unvalidated content enters RAG | Only Tier 2 (semantic-context) files indexed by default |
| Agent writes to corpus without SIT verification | Corpus poisoning | All writes require valid SIT + Assistant audit |
| Embedding user-supplied text without sanitization | Embedding injection | Strip comments and zero-width chars before embedding |
| Cross-project namespace retrieval | Information leakage between projects | Namespace ACL enforced at vector store level |

---

## § 6 — Recommended Implementation Stack

When vector search is introduced, the following stack is recommended:

| Component | Recommended | Rationale |
|---|---|---|
| Vector store | Qdrant (self-hosted) | Open-source, namespace isolation, payload filtering, access control |
| Embedding model | Local (Ollama) or Anthropic Embeddings | Avoids sending sensitive code to third-party embedding APIs |
| Retrieval wrapper | Custom MCP tool (`query-mcp-ts/`) | Enforces all rules in this regulation at the tool layer |

The MCP tool `query-mcp-ts` (listed in L3-mcp-tools.json) is the designated retrieval interface. No agent may query a vector store directly — only through this tool.

---

## § 7 — Threat Covered

**LLM08 — Vector and Embedding Weaknesses:**
1. **Corpus poisoning:** Adversarial documents injected into the knowledge base to manipulate retrieval results → mitigated by integrity checks (§3) and write-access control (§2).
2. **Embedding inversion:** Extracting sensitive information by querying similar documents → mitigated by namespace isolation and retrieval logging (§4).
3. **Retrieval hallucination exploitation:** Attacker crafts queries to retrieve low-relevance chunks as "evidence" → mitigated by similarity threshold (Rule 4.3).
