All write-capable tools (Edit, Write, Bash) are denied in this session. I cannot apply the fixes without file write permissions.

Here is what I found and what each fix does, so you can either grant permissions or apply them manually:

---

## Phase Zero Report

### What I read

- `/src/services/rag/index.ts` — 508 lines, main RAG orchestrator
- `/src/services/rag/decomposition.ts` — 160 lines, sub-question decomposition
- `/src/services/rag/confidence.ts` — 202 lines, Tier 1/2/3 confidence scoring
- `/src/services/rag/rewriter.ts` — 31 lines, query rewriter
- `/src/services/rag/types.ts` — confirmed `RagAnswer.context?: string` field already exists
- `/src/services/vectorstore/classifier.ts` — `classifyQuery()` returns `{ queryType, alpha, wordCount }`
- `/src/services/chunker/tokenizer.ts` — `countTokensSync()` exported, sync-safe

### What needs to happen

All 16 fixes are well-scoped and non-conflicting. My complete analysis per fix:

**FIX 1** — `query()` in `index.ts` line 59: empty/whitespace query guard before `classifyQueryEnhancement` call. Early-return with zero-cost `RagAnswer`.

**FIX 2** — `buildAnswerMessages()` at line 485: currently calls `buildFullContext(context)` only when `context.length === 0`, which is the opposite of what's needed. The `generateAnswer()` call at line 469 pre-wraps context via `buildFullContext()` and then passes the result to `buildAnswerMessages()` — so `buildAnswerMessages` double-wraps when called from `generateAnswer`. But `queryStream()` at line 278 calls `buildAnswerMessages(query, context)` directly with raw context. Fix: always call `buildFullContext(context)` inside `buildAnswerMessages`, remove the `buildFullContext` call from `generateAnswer`.

**FIX 3** — `queryStandard()` line 102: the `""` FTS arg is already there. Add the comment block directly above the `search()` call.

**FIX 4** — `queryStandard()` lines 107-111: replace `allResults.push(result)` mutation with immutable `hydeUnique` + spread. `allResultsWithHyde` then passes to `rankResults`.

**FIX 5** — `answerSubQuestions()` in `decomposition.ts` line 92: add `classifyQuery` import from `../../vectorstore/classifier`, call it per sub-question, pass `alpha` to `vectorStore.search`.

**FIX 6** — `queryDecomposed()` in `index.ts` line 236: after `buildCitations`, add parallel `verifyClaimsNli` call alongside `computeFaithfulnessNli`.

**FIX 7** — `synthesizeAnswers()` in `decomposition.ts` line 138: append the grounding JSON instruction block from `DEFAULT_SYSTEM_PROMPT` to the synthesis prompt.

**FIX 8** — `assembleConfidence()` in `confidence.ts` line 150: `if (groundingScore === 0.0)` → `if (groundingScore !== undefined && groundingScore <= 0.0)`.

**FIX 9** — After `generateAnswer()` in `queryStandard()` line 124: check `rawAnswer.trim().length === 0` and return abstention answer.

**FIX 10** — Add JSDoc comment block before `queryStream()` at line 256.

**FIX 11** — Add `context: context` field to both `queryStandard()` return (line 156) and `queryDecomposed()` return (line 238). The `RagAnswer` type already has `context?: string`.

**FIX 12** — `fetchResults()` lines 430-448: replace sequential `for` loop with `Promise.all()` over `queryVariants.map(...)`.

**FIX 13** — `computeFaithfulnessNli()` in `confidence.ts`: import `countTokensSync` from `../chunker/tokenizer`, replace `context.slice(0,1500)` / `answer.slice(0,500)` with token-aware truncation.

**FIX 14** — `queryDecomposed()`: wrap phases with `Date.now()` timers, replace hardcoded `0` for `retrievalLatencyMs` and `generationLatencyMs`.

**FIX 15** — `synthesizeAnswers()` prompt: add `"Use [N] markers to cite which sub-answer each claim comes from."` instruction.

**FIX 16** — `rewriteQuery()` in `rewriter.ts`: add JSDoc `"Returns [originalQuery, ...variants] — array length is count + 1."`.

---

## Blocker

**Read is permitted, but Edit, Write, and Bash are all denied.** I cannot write to any file in this session. To proceed I need you to either:

1. Grant **Edit** permission (preferred — minimal diffs), or
2. Grant **Write** permission (full file rewrites), or
3. Grant **Bash** permission (can use heredoc approach)

Please grant the necessary tool permissions and I will apply all 16 fixes and run the build check.