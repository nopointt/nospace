/**
 * Content Filter Service — prompt injection detection for uploaded documents.
 *
 * Scans parsed document text for patterns commonly used in indirect prompt injection.
 * Flags documents but does NOT block them (avoids false positives on legitimate content
 * about prompt engineering, security research, etc.).
 *
 * Integration point: after parse, before chunk in pipeline.ts
 *
 * References:
 * - OWASP LLM01:2025 Prompt Injection
 * - arxiv.org/abs/2511.15759 (Securing AI Agents Against Prompt Injection)
 */

export interface InjectionMatch {
  pattern: string
  category: InjectionCategory
  weight: number
  /** Character offset in original text where match was found */
  offset: number
  /** The matched text snippet (truncated to 100 chars) */
  snippet: string
}

export interface ContentFilterResult {
  /** Aggregate risk score (0 = clean, higher = more suspicious) */
  riskScore: number
  /** Individual pattern matches */
  matches: InjectionMatch[]
  /** Whether the document should be flagged for review */
  flagged: boolean
}

type InjectionCategory =
  | "instruction_override"
  | "role_manipulation"
  | "system_prompt_leak"
  | "exfiltration"
  | "tool_directive"

interface PatternDef {
  regex: RegExp
  category: InjectionCategory
  weight: number
  name: string
}

/**
 * Patterns are case-insensitive and match common prompt injection techniques.
 * Weights: 1 = low signal (common in legitimate text), 3 = high signal (almost always injection).
 *
 * IMPORTANT: These patterns WILL match in documents about AI safety, prompt engineering,
 * security research, etc. That's why we FLAG, not BLOCK.
 */
const PATTERNS: PatternDef[] = [
  // --- Instruction override (most common injection vector) ---
  { regex: /ignore\s+(all\s+)?previous\s+(instructions?|context|rules|guidelines)/gi, category: "instruction_override", weight: 3, name: "ignore_previous" },
  { regex: /disregard\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|context|text|information)/gi, category: "instruction_override", weight: 3, name: "disregard_previous" },
  { regex: /forget\s+(everything|all|what)\s+(you|I)\s+(know|said|told|were)/gi, category: "instruction_override", weight: 3, name: "forget_everything" },
  { regex: /override\s+(your|the|all)\s+(instructions?|rules|guidelines|constraints)/gi, category: "instruction_override", weight: 3, name: "override_instructions" },
  { regex: /new\s+instructions?\s*:/gi, category: "instruction_override", weight: 2, name: "new_instructions" },
  { regex: /from\s+now\s+on\s*,?\s*(you|ignore|always|never|only)/gi, category: "instruction_override", weight: 2, name: "from_now_on" },
  { regex: /do\s+not\s+follow\s+(the\s+)?(previous|above|original|system)\s+(instructions?|prompt|rules)/gi, category: "instruction_override", weight: 3, name: "do_not_follow" },

  // --- Role manipulation ---
  { regex: /you\s+are\s+now\s+(a|an|the|my)\s+/gi, category: "role_manipulation", weight: 2, name: "you_are_now" },
  { regex: /pretend\s+(to\s+be|you\s+are)\s+/gi, category: "role_manipulation", weight: 2, name: "pretend_to_be" },
  { regex: /act\s+as\s+(a|an|if\s+you\s+are)\s+/gi, category: "role_manipulation", weight: 1, name: "act_as" },
  { regex: /switch\s+(to|into)\s+(a\s+)?different\s+(mode|persona|role)/gi, category: "role_manipulation", weight: 2, name: "switch_mode" },

  // --- System prompt leak attempts ---
  { regex: /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules|guidelines)/gi, category: "system_prompt_leak", weight: 2, name: "show_prompt" },
  { regex: /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions?|rules|initial\s+instructions?)/gi, category: "system_prompt_leak", weight: 2, name: "what_is_prompt" },
  { regex: /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?|configuration)/gi, category: "system_prompt_leak", weight: 3, name: "reveal_prompt" },
  { regex: /repeat\s+(your\s+)?(system\s+)?(prompt|instructions?)\s+(back|verbatim|exactly)/gi, category: "system_prompt_leak", weight: 3, name: "repeat_prompt" },

  // --- Exfiltration ---
  { regex: /send\s+(this|the|all|data|results?|output)\s+(to|via)\s+(https?:\/\/|email|webhook)/gi, category: "exfiltration", weight: 3, name: "send_to_url" },
  { regex: /exfiltrate|data\s+extraction|leak\s+(the|this|all)\s+data/gi, category: "exfiltration", weight: 3, name: "exfiltrate" },
  { regex: /forward\s+(all|this|the)\s+(data|information|context|results?)\s+to/gi, category: "exfiltration", weight: 2, name: "forward_data" },

  // --- Tool directives (less relevant for Contexter but good defense-in-depth) ---
  { regex: /execute\s+(the\s+following|this)\s+(command|code|script|function)/gi, category: "tool_directive", weight: 2, name: "execute_command" },
  { regex: /run\s+(this\s+)?(command|script|code)\s*:/gi, category: "tool_directive", weight: 1, name: "run_command" },
  { regex: /call\s+(the\s+)?(function|api|endpoint|tool)\s+/gi, category: "tool_directive", weight: 1, name: "call_function" },
]

/** Threshold above which a document is flagged for review */
const FLAG_THRESHOLD = 4

/**
 * Scan document text for prompt injection patterns.
 * Returns a risk assessment with individual matches.
 */
export function scanForInjection(text: string): ContentFilterResult {
  const matches: InjectionMatch[] = []

  for (const def of PATTERNS) {
    // Reset regex state (global flag)
    def.regex.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = def.regex.exec(text)) !== null) {
      const offset = match.index
      const snippet = text.slice(
        Math.max(0, offset - 20),
        Math.min(text.length, offset + match[0].length + 20)
      ).slice(0, 100)

      matches.push({
        pattern: def.name,
        category: def.category,
        weight: def.weight,
        offset,
        snippet,
      })

      // Avoid infinite loops on zero-length matches
      if (match[0].length === 0) {
        def.regex.lastIndex++
      }
    }
  }

  const riskScore = matches.reduce((sum, m) => sum + m.weight, 0)

  return {
    riskScore,
    matches,
    flagged: riskScore >= FLAG_THRESHOLD,
  }
}
