/**
 * BPE tokenizer using cl100k_base (GPT-3.5/4 vocabulary).
 * Replaces whitespace word-count which had 8–69% error on code and CJK content.
 * cl100k_base is a close proxy for Jina v4 tokenization.
 */
let _encode: ((text: string) => number[]) | null = null

async function getEncoder(): Promise<(text: string) => number[]> {
  if (_encode) return _encode
  try {
    const { encode } = await import("gpt-tokenizer/encoding/cl100k_base")
    _encode = encode
    return encode
  } catch (e) {
    console.warn("[tokenizer] gpt-tokenizer failed to load, falling back to word count * 1.4:", e instanceof Error ? e.message : String(e))
    _encode = (text: string) => new Array(Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.4))
    return _encode
  }
}

/**
 * Ensure BPE encoder is loaded before any synchronous token counting.
 * Must be called (and awaited) once before using countTokensSync.
 */
export async function ensureEncoderLoaded(): Promise<void> {
  await getEncoder()
}

/**
 * Count BPE tokens in text using cl100k_base.
 * Async because encoder loads lazily on first call.
 */
export async function countTokens(text: string): Promise<number> {
  const encode = await getEncoder()
  return encode(text).length
}

/**
 * Synchronous token count — uses cached encoder if already loaded, else falls back.
 * Safe to call after the first async countTokens() call has completed.
 */
export function countTokensSync(text: string): number {
  if (_encode) return _encode(text).length
  // Fallback if encoder not yet loaded (conservative overestimate)
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.4)
}

/**
 * Split text into tokens (words). Returns array of words with their character offsets.
 * Used by semantic chunker for overlap calculation.
 */
export function tokenize(text: string): Array<{ word: string; start: number; end: number }> {
  const tokens: Array<{ word: string; start: number; end: number }> = []
  const regex = /\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return tokens
}
