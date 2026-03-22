/**
 * Simple whitespace tokenizer.
 * Approximation: 1 token ≈ 1 word (close enough for chunking, avoids tiktoken dependency).
 * For production accuracy, swap with a proper BPE tokenizer.
 */
export function countTokens(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

/**
 * Split text into tokens (words). Returns array of words with their character offsets.
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
