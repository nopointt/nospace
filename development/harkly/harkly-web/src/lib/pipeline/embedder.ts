const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

export async function embedChunks(
  ai: Ai,
  chunks: string[],
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const result = await ai.run("@cf/baai/bge-large-en-v1.5", {
      text: batch,
    });

    if (result.data) {
      allEmbeddings.push(...result.data);
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return allEmbeddings;
}
