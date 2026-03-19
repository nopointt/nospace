interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

interface Chunk {
  content: string;
  index: number;
}

export function chunkText(
  text: string,
  options: ChunkOptions = {},
): Chunk[] {
  const { chunkSize = 500, overlap = 100 } = options;

  if (text.length <= chunkSize) {
    return [{ content: text, index: 0 }];
  }

  // Split by paragraphs first, then sentences
  const segments = text
    .split(/\n\n+/)
    .flatMap((para) => {
      if (para.length <= chunkSize) return [para];
      // Split long paragraphs by sentences
      return para.split(/(?<=[.!?])\s+/);
    })
    .filter((s) => s.trim().length > 0);

  const chunks: Chunk[] = [];
  let current = "";
  let index = 0;

  for (const segment of segments) {
    // If single segment exceeds chunkSize, force-split
    if (segment.length > chunkSize) {
      if (current.trim()) {
        chunks.push({ content: current.trim(), index: index++ });
        current = "";
      }
      for (let i = 0; i < segment.length; i += chunkSize - overlap) {
        const slice = segment.slice(i, i + chunkSize);
        chunks.push({ content: slice.trim(), index: index++ });
      }
      continue;
    }

    const combined = current ? `${current} ${segment}` : segment;

    if (combined.length > chunkSize) {
      if (current.trim()) {
        chunks.push({ content: current.trim(), index: index++ });
      }
      // Start new chunk with overlap from end of previous
      const overlapText = current.length > overlap
        ? current.slice(-overlap)
        : current;
      current = overlapText ? `${overlapText} ${segment}` : segment;
    } else {
      current = combined;
    }
  }

  if (current.trim()) {
    chunks.push({ content: current.trim(), index: index++ });
  }

  return chunks;
}
