import { FUSION_ALPHA, FUSION_ALPHA_KEYWORD, FUSION_ALPHA_SEMANTIC, FUSION_ALPHA_CODE } from "./types"

/**
 * Query type classification for adaptive alpha selection in CC fusion.
 *
 * Rules (applied in order — first match wins):
 *
 * | Rule    | Condition                                                              | Alpha | Rationale                         |
 * |---------|------------------------------------------------------------------------|-------|-----------------------------------|
 * | CODE    | Contains code indicators (backtick, ::, ->, =>, parens, braces, etc.)  | 0.2   | Exact FTS match >> vector         |
 * | KEYWORD | Word count <= 3 AND no question words                                  | 0.3   | Short keyword = BM25/FTS wins     |
 * | SEMANTIC| Word count >= 10 OR contains question words                            | 0.7   | Long natural language = vector    |
 * | DEFAULT | Everything else (4–9 words, no special signal)                         | 0.5   | Balanced; conservative default    |
 *
 * Conservative design: when signal is ambiguous, fall through to DEFAULT (0.5).
 */

const QUESTION_WORDS = new Set([
  "how", "why", "what", "when", "where", "which", "who",
  "explain", "compare", "describe", "difference", "differences",
  "relationship", "between", "versus", "vs",
])

const CODE_PATTERNS = [
  /`[^`]+`/,           // backtick identifier
  /::/,                // namespace separator (C++, Rust, PHP)
  /->/,                // pointer/method arrow
  /=>/,                // fat arrow / lambda
  /\w+\s*\([^)]*\)/,   // function call parens (require identifier before parens)
  /\{[^}]*\}/,         // object/block braces
  /\w+\[[\w\d:,]+\]/,  // array brackets (require identifier before brackets)
  /^\$/,               // shell variable prefix
  /import\s+/i,        // import statement
  /function\s+\w/i,    // function keyword
  /class\s+\w/i,       // class keyword
  /def\s+\w/i,         // Python def
  /const\s+\w/i,       // const declaration
  /var\s+\w/i,         // var declaration
  /\w+\.\w+\(\)/,      // method call: obj.method()
  /https?:\/\//,       // URL
  /\w+\/\w+\/\w+/,     // path-like pattern
]

export type QueryType = "code" | "keyword" | "semantic" | "default"

export interface ClassifierResult {
  queryType: QueryType
  alpha: number
  wordCount: number
}

export function classifyQuery(query: string): ClassifierResult {
  const trimmed = query.trim()
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return { queryType: "default", alpha: FUSION_ALPHA, wordCount: 0 }
  }

  const lowerWords = new Set(words.map((w) => w.toLowerCase()))

  // Rule 1: CODE — check patterns against original query (preserve case for symbols)
  const isCode = CODE_PATTERNS.some((pattern) => pattern.test(trimmed))
  if (isCode) {
    return { queryType: "code", alpha: FUSION_ALPHA_CODE, wordCount }
  }

  // Rule 2: KEYWORD — short query with no question intent
  const hasQuestionWord = [...lowerWords].some((w) => QUESTION_WORDS.has(w))

  if (wordCount <= 3 && !hasQuestionWord) {
    return { queryType: "keyword", alpha: FUSION_ALPHA_KEYWORD, wordCount }
  }

  // Rule 3: SEMANTIC — long query OR explicit question intent
  if (wordCount >= 10 || hasQuestionWord) {
    return { queryType: "semantic", alpha: FUSION_ALPHA_SEMANTIC, wordCount }
  }

  // Rule 4: DEFAULT — 4–9 words, no special signals
  return { queryType: "default", alpha: FUSION_ALPHA, wordCount }
}
