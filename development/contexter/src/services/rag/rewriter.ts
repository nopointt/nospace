/**
 * Query rewriter: generates N alternative phrasings of the user query
 * to improve recall in hybrid search.
 */
export async function rewriteQuery(
  query: string,
  count: number,
  ai: Ai
): Promise<string[]> {
  if (count <= 0) return [query]

  const prompt = `Generate ${count} alternative search queries for a knowledge base search. Rules:
- Keep ALL proper nouns, brand names, product names, and technical terms EXACTLY as they appear
- Only rephrase the question structure and common words
- Do NOT interpret, translate, or "correct" unfamiliar terms — they may be product names
- Return ONLY the alternatives, one per line, no numbering, no explanations

Query: "${query}"`

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 256,
  }) as { response?: string }

  const text = response?.response || ""
  const variants = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length < 500)
    .slice(0, count)

  return [query, ...variants]
}
