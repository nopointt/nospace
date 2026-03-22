import type { Chunk } from "./types"
import { countTokens } from "./tokenizer"

/**
 * Timestamp chunker: splits transcription text by time boundaries.
 * Groups segments up to maxTokens, preserving start/end timestamps.
 * Input: plain text with timestamp markers like [00:00] or (00:00:00).
 * If no timestamps found, falls back to sentence-based splitting.
 */
export function chunkTimestamp(text: string, maxTokens: number = 500): Chunk[] {
  const segments = parseTimestampedSegments(text)

  if (segments.length === 0) {
    return chunkByDuration(text, maxTokens)
  }

  const chunks: Chunk[] = []
  let currentSegments: TimestampedSegment[] = []
  let currentTokens = 0

  for (const segment of segments) {
    const segTokens = countTokens(segment.text)

    if (currentTokens + segTokens > maxTokens && currentSegments.length > 0) {
      chunks.push(buildTimestampChunk(currentSegments, chunks.length))
      currentSegments = []
      currentTokens = 0
    }

    currentSegments.push(segment)
    currentTokens += segTokens
  }

  if (currentSegments.length > 0) {
    chunks.push(buildTimestampChunk(currentSegments, chunks.length))
  }

  return chunks
}

interface TimestampedSegment {
  text: string
  startTime: number
  endTime: number
  offset: number
}

function buildTimestampChunk(segments: TimestampedSegment[], index: number): Chunk {
  const content = segments.map((s) => s.text).join(" ")
  return {
    content,
    index,
    tokenCount: countTokens(content),
    startOffset: segments[0].offset,
    endOffset: segments[segments.length - 1].offset + segments[segments.length - 1].text.length,
    metadata: {
      type: "timestamp",
      startTime: segments[0].startTime,
      endTime: segments[segments.length - 1].endTime,
    },
  }
}

function parseTimestampedSegments(text: string): TimestampedSegment[] {
  const segments: TimestampedSegment[] = []

  // Match patterns like [00:00], [00:00:00], (00:00), (00:00:00)
  const regex = /[\[\(](\d{1,2}):(\d{2})(?::(\d{2}))?[\]\)]\s*/g
  const matches: Array<{ time: number; index: number }> = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const hours = match[3] ? parseInt(match[1]) : 0
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1])
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2])
    const time = hours * 3600 + minutes * 60 + seconds
    matches.push({ time, index: match.index + match[0].length })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index - (text.slice(0, matches[i + 1].index).match(/[\[\(]\d{1,2}:\d{2}(?::\d{2})?[\]\)]\s*$/)?.[0]?.length ?? 0) : text.length
    const segText = text.slice(start, end).trim()

    if (segText.length > 0) {
      segments.push({
        text: segText,
        startTime: matches[i].time,
        endTime: i + 1 < matches.length ? matches[i + 1].time : matches[i].time + 30,
        offset: start,
      })
    }
  }

  return segments
}

/**
 * Fallback: split plain text (no timestamps) by sentences into groups.
 */
function chunkByDuration(text: string, maxTokens: number): Chunk[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  const chunks: Chunk[] = []
  let currentSentences: string[] = []
  let currentTokens = 0
  let offset = 0

  for (const sentence of sentences) {
    const sentTokens = countTokens(sentence)

    if (currentTokens + sentTokens > maxTokens && currentSentences.length > 0) {
      const content = currentSentences.join(" ")
      chunks.push({
        content,
        index: chunks.length,
        tokenCount: currentTokens,
        startOffset: offset,
        endOffset: offset + content.length,
        metadata: { type: "timestamp" },
      })
      offset += content.length + 1
      currentSentences = []
      currentTokens = 0
    }

    currentSentences.push(sentence)
    currentTokens += sentTokens
  }

  if (currentSentences.length > 0) {
    const content = currentSentences.join(" ")
    chunks.push({
      content,
      index: chunks.length,
      tokenCount: currentTokens,
      startOffset: offset,
      endOffset: offset + content.length,
      metadata: { type: "timestamp" },
    })
  }

  return chunks
}
