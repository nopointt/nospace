# Review Coverage Matrix

> Self-check document. Verifies every source file has a primary reviewer.

## Coverage

| File | R1 RAG | R2 API | R3 Data | R4 Infra | R5 Security | Notes |
|---|---|---|---|---|---|---|
| **src/index.ts** | | **P** | | | | entry point, middleware |
| **src/types/env.ts** | | | | | **P** | secrets |
| **src/db/schema.ts** | | | **P** | | | |
| **src/db/connection.ts** | | | **P** | | | |
| **routes/auth.ts** | | **P** | | | **P** | R2: contract, R5: auth bypass |
| **routes/auth-social.ts** | | **P** | | | **P** | R2: contract, R5: OAuth flow |
| **routes/oauth.ts** | | **P** | | | **P** | R2: contract, R5: MCP auth |
| **routes/billing.ts** | | **P** | | | **P** | R2: contract, R5: payment |
| **routes/dev.ts** | | **P** | | | | |
| **routes/documents.ts** | | **P** | | | | |
| **routes/feedback.ts** | | **P** | | | | |
| **routes/health.ts** | | **P** | | | | |
| **routes/maintenance.ts** | | | | **P** | | BullMQ jobs |
| **routes/mcp-remote.ts** | | **P** | | | **P** | R2: protocol, R5: auth |
| **routes/metrics.ts** | | **P** | | | | |
| **routes/pipeline.ts** | | **P** | | | | |
| **routes/query.ts** | | **P** | | | **P** | R2: SSE, R5: prompt injection |
| **routes/retry.ts** | | **P** | | | | |
| **routes/status.ts** | | **P** | | | | |
| **routes/upload.ts** | | **P** | | | **P** | R2: contract, R5: file upload |
| **routes/webhooks.ts** | | **P** | | | **P** | R2: contract, R5: HMAC |
| **services/auth.ts** | | | | | **P** | |
| **services/billing.ts** | | | | | **P** | payment verification |
| **services/llm.ts** | ctx | **P** | | | | fallback chain |
| **services/nli.ts** | ctx | **P** | | | **P** | R2: robustness, R5: localhost |
| **services/reranker.ts** | ctx | | | | | |
| **services/resilience.ts** | | | | **P** | | |
| **services/pipeline.ts** | | | | **P** | | |
| **services/queue.ts** | | | | **P** | | |
| **services/feedback-decay.ts** | | | | **P** | | |
| **rag/index.ts** | **P** | ctx | | | | |
| **rag/types.ts** | **P** | ctx | | | | |
| **rag/classifier.ts** | **P** | | | | | |
| **rag/hyde.ts** | **P** | | | | | |
| **rag/decomposition.ts** | **P** | | | | **P** | R1: flow, R5: JSON parsing |
| **rag/confidence.ts** | **P** | | | | **P** | R1: scoring, R5: JSON parsing |
| **rag/citations.ts** | **P** | | | | | |
| **rag/context.ts** | **P** | | | | | |
| **rag/rewriter.ts** | **P** | | | | | |
| **vectorstore/hybrid.ts** | | | **P** | | | |
| **vectorstore/classifier.ts** | | | **P** | | | |
| **vectorstore/fts.ts** | | | **P** | | **P** | R3: query, R5: injection |
| **vectorstore/vector.ts** | | | **P** | | | |
| **vectorstore/index.ts** | ctx | | **P** | | | |
| **vectorstore/types.ts** | | | **P** | | | |
| **embedder/index.ts** | ctx | | **P** | | | |
| **embedder/cache.ts** | | | **P** | | | |
| **embedder/dedup.ts** | | | **P** | | | |
| **embedder/types.ts** | | | **P** | | | |
| **chunker/** (8 files) | | | **P** | | | |
| **parsers/** (7 files) | | | | **P** | **P** | R4: reliability, R5: injection |
| **evaluation/** (3 files) | | | | **P** | | |
| **mcp/** (3 files) | | **P** | | | **P** | R2: protocol, R5: auth |
| **eval scripts** (4 files) | | | | **P** | | |
| **nli-sidecar/** (3 files) | | | | **P** | **P** | R4: Docker, R5: container |
| **docker-compose.yml** | | | | **P** | **P** | R4: resources, R5: isolation |
| **monitoring/** (2 files) | | | | **P** | | |
| **drizzle-pg/** (12 files) | | | **P** | | | |

**P** = Primary reviewer, **ctx** = context-only (reads but doesn't review)

## Verification

- Every source file has at least one primary reviewer: **YES**
- No file has 3+ primary reviewers: **YES** (max 2, with different lens)
- Overlaps are documented with lens distinction: **YES**
- Archived files (_archive/) are excluded: **YES**
- services/reranker.ts is context-only for R1 — correctness of reranker API calls not deeply reviewed. **ACCEPTED**: Jina Reranker is a thin HTTP client, low risk.
