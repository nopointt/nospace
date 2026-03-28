import type { Chunk } from "./types"

/**
 * F-020: Contextual prefix generation.
 *
 * For each "child" or "flat" chunk, calls Groq to produce a 2-3 sentence
 * context that situates the chunk within the full document.
 * The prefix is prepended to chunk.content (for embedding) and stored in
 * chunk.contextPrefix. Parent chunks are passed through unchanged.
 *
 * Immutable: returns a new array; input chunks are not mutated.
 */
export async function addContextualPrefixes(
  documentText: string,
  chunks: Chunk[],
  groqApiUrl: string,
  groqApiKey: string,
  model: string = "llama-3.1-8b-instant"
): Promise<Chunk[]> {
  const BATCH_SIZE = 10

  // Separate embeddable (child/flat) from non-embeddable (parent/untyped)
  const targets: Array<{ originalIndex: number; chunk: Chunk }> = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const ct = chunk.chunkType
    if (ct === "child" || ct === "flat" || ct === undefined) {
      targets.push({ originalIndex: i, chunk })
    }
  }

  // Build result array as shallow copies (immutable)
  const result: Chunk[] = chunks.map((c) => ({ ...c }))

  // Process targets in batches of BATCH_SIZE
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE)

    let prefixes: Array<string | null>
    try {
      prefixes = await Promise.all(
        batch.map(({ chunk }) =>
          callGroqForPrefix(documentText, chunk.content, groqApiUrl, groqApiKey, model).catch(
            (err: unknown) => {
              console.warn(
                "contextual prefix failed for chunk",
                chunk.index,
                ":",
                err instanceof Error ? err.message : String(err)
              )
              return null
            }
          )
        )
      )
    } catch (err: unknown) {
      console.warn(
        "contextual prefix batch failed:",
        err instanceof Error ? err.message : String(err)
      )
      continue
    }

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j]!
      const prefix = prefixes[j]
      if (!prefix) continue

      const original = item.chunk.content
      result[item.originalIndex] = {
        ...result[item.originalIndex]!,
        contextPrefix: prefix,
        content: `${prefix}\n\n${original}`,
      }
    }
  }

  return result
}

async function callGroqForPrefix(
  documentText: string,
  chunkContent: string,
  groqApiUrl: string,
  groqApiKey: string,
  model: string
): Promise<string> {
  // Truncate to ~3000 tokens (approx 12000 chars at ~4 chars/token) to stay within context limits
  const truncDoc = documentText.slice(0, 12000)
  const body = {
    model,
    messages: [
      {
        role: "user",
        content:
          `<document>\n${truncDoc}\n</document>\n\n` +
          `<chunk>\n${chunkContent}\n</chunk>\n\n` +
          `Write a short context (2-3 sentences) that situates this chunk within the document. ` +
          `Include: document type, main topic, and any entities or timeframes referenced in the chunk. ` +
          `Be specific and factual.`,
      },
    ],
    max_tokens: 150,
    temperature: 0.1,
  }

  const signal = AbortSignal.timeout(15_000)

  const response = await fetch(`${groqApiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Groq API error ${response.status}: ${text}`)
  }

  const json = (await response.json()) as GroqChatResponse
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("Groq returned empty content")
  }
  return content.trim()
}

interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}
