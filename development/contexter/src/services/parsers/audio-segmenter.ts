/**
 * audio-segmenter.ts
 * Splits large audio files at silence boundaries and transcribes in parallel.
 * Used when audio WAV exceeds 23MB (Whisper 25MB limit with 2MB reserve).
 */

import { randomUUID } from "crypto"
import { writeFile, readFile, unlink, stat } from "fs/promises"
import { existsSync } from "fs"

// WAV 16kHz mono: 16-bit = 2 bytes/sample * 16000 samples/sec = 32000 bytes/sec
const WAV_BYTES_PER_SEC = 32_000
const MAX_SEGMENT_BYTES = 23 * 1024 * 1024
const TARGET_SEGMENT_SECS = Math.floor(MAX_SEGMENT_BYTES / WAV_BYTES_PER_SEC) // ~671 sec = ~11 min
const MIN_SEGMENT_SECS = 0.5
const WHISPER_CONCURRENCY = 3
const WHISPER_RETRIES = 2

export interface SegmenterInput {
  inputPath: string   // path to original audio file (any format)
  ext: string         // file extension without dot, e.g. "mp3"
  groqApiUrl: string
  groqApiKey: string
}

export interface SegmenterResult {
  text: string
  language?: string
  duration?: number
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function segmentAndTranscribe(input: SegmenterInput): Promise<SegmenterResult> {
  const id = randomUUID()
  const wavPath = `/tmp/${id}-full.wav`
  const tempPaths: string[] = [wavPath]

  try {
    await convertToWav(input.inputPath, wavPath)

    const wavSize = (await stat(wavPath)).size
    if (wavSize <= MAX_SEGMENT_BYTES) {
      // Small enough — transcribe directly
      return transcribeSingleFile(wavPath, input.groqApiUrl, input.groqApiKey)
    }

    const duration = await getAudioDuration(wavPath)
    const silences = await detectSilences(wavPath)
    const splitPoints = buildSplitPoints(duration, silences)

    const segments = await splitIntoSegments(wavPath, id, splitPoints, duration)
    tempPaths.push(...segments.map((s) => s.path))

    const { text, language, totalDuration, warnings } = await transcribeSegments(
      segments,
      input.groqApiUrl,
      input.groqApiKey
    )

    return { text, language, duration: totalDuration, warnings }
  } finally {
    await cleanupFiles(tempPaths)
  }
}

// ---------------------------------------------------------------------------
// ffmpeg helpers
// ---------------------------------------------------------------------------

async function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  const proc = Bun.spawn(
    ["ffmpeg", "-y", "-i", inputPath, "-ar", "16000", "-ac", "1", outputPath],
    { stdout: "pipe", stderr: "pipe" }
  )
  const exitCode = await withTimeout(proc.exited, 10 * 60 * 1000, "ffmpeg convert timed out")
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`ffmpeg convert failed (${exitCode}): ${stderr.slice(0, 400)}`)
  }
}

async function getAudioDuration(wavPath: string): Promise<number> {
  const proc = Bun.spawn(
    ["ffmpeg", "-i", wavPath, "-f", "null", "-"],
    { stdout: "pipe", stderr: "pipe" }
  )
  await proc.exited
  const stderr = await new Response(proc.stderr).text()
  // Duration line: "  Duration: HH:MM:SS.ss,"
  const match = stderr.match(/Duration:\s+(\d+):(\d+):(\d+\.\d+)/)
  if (!match) throw new Error("Could not parse audio duration from ffmpeg output")
  const [, h, m, s] = match
  return parseInt(h!) * 3600 + parseInt(m!) * 60 + parseFloat(s!)
}

async function detectSilences(wavPath: string): Promise<SilenceInterval[]> {
  const proc = Bun.spawn(
    ["ffmpeg", "-i", wavPath, "-af", "silencedetect=noise=-30dB:d=0.3", "-f", "null", "-"],
    { stdout: "pipe", stderr: "pipe" }
  )
  await proc.exited
  const stderr = await new Response(proc.stderr).text()
  return parseSilences(stderr)
}

function parseSilences(stderr: string): SilenceInterval[] {
  const silences: SilenceInterval[] = []
  const startRe = /silence_start:\s*([\d.]+)/g
  const endRe = /silence_end:\s*([\d.]+)/g

  const starts: number[] = []
  const ends: number[] = []

  let m: RegExpExecArray | null
  while ((m = startRe.exec(stderr)) !== null) starts.push(parseFloat(m[1]!))
  while ((m = endRe.exec(stderr)) !== null) ends.push(parseFloat(m[1]!))

  const count = Math.min(starts.length, ends.length)
  for (let i = 0; i < count; i++) {
    silences.push({ start: starts[i]!, end: ends[i]! })
  }
  return silences
}

// ---------------------------------------------------------------------------
// Split point logic
// ---------------------------------------------------------------------------

interface SilenceInterval {
  start: number
  end: number
}

interface SplitPoint {
  startSec: number
  endSec: number
}

function buildSplitPoints(duration: number, silences: SilenceInterval[]): SplitPoint[] {
  const points: SplitPoint[] = []
  let cursor = 0

  while (cursor < duration) {
    const target = cursor + TARGET_SEGMENT_SECS
    if (target >= duration) {
      points.push({ startSec: cursor, endSec: duration })
      break
    }

    // Find the latest silence mid-point that falls within [cursor+60, target]
    // (give at least 60s before looking for a split — avoids tiny first segments)
    const earliest = cursor + 60
    const best = silences
      .filter((s) => s.start >= earliest && s.start <= target)
      .map((s) => ({ mid: (s.start + s.end) / 2, s }))
      .sort((a, b) => b.mid - a.mid) // latest first
      .at(0)

    const splitAt = best ? best.mid : target
    points.push({ startSec: cursor, endSec: splitAt })
    cursor = splitAt
  }

  return points
}

// ---------------------------------------------------------------------------
// Segment extraction
// ---------------------------------------------------------------------------

interface Segment {
  path: string
  startTime: number  // absolute offset in original file (seconds)
  endTime: number
}

async function splitIntoSegments(
  wavPath: string,
  id: string,
  splits: SplitPoint[],
  _totalDuration: number
): Promise<Segment[]> {
  const segments: Segment[] = []

  for (let i = 0; i < splits.length; i++) {
    const { startSec, endSec } = splits[i]!
    const segPath = `/tmp/${id}-seg${i}.wav`

    const proc = Bun.spawn(
      [
        "ffmpeg", "-y",
        "-i", wavPath,
        "-ss", String(startSec),
        "-to", String(endSec),
        "-c", "copy",
        segPath,
      ],
      { stdout: "pipe", stderr: "pipe" }
    )

    const exitCode = await withTimeout(proc.exited, 5 * 60 * 1000, `ffmpeg segment ${i} timed out`)
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`ffmpeg segment ${i} failed: ${stderr.slice(0, 300)}`)
    }

    const duration = endSec - startSec
    if (duration < MIN_SEGMENT_SECS) continue  // skip pure-silence micro-segments

    segments.push({ path: segPath, startTime: startSec, endTime: endSec })
  }

  return segments
}

// ---------------------------------------------------------------------------
// Transcription
// ---------------------------------------------------------------------------

interface TranscribeResult {
  text: string
  language?: string
  totalDuration: number
  warnings: string[]
}

async function transcribeSingleFile(
  path: string,
  groqApiUrl: string,
  groqApiKey: string
): Promise<SegmenterResult> {
  const buf = await readFile(path)
  const blob = new Blob([buf], { type: "audio/wav" })
  const result = await callWhisper(blob, `audio.wav`, groqApiUrl, groqApiKey, undefined)
  return {
    text: result?.text ?? "",
    language: result?.language,
    duration: result?.duration,
    warnings: result ? [] : ["Whisper returned no result for single-file transcription"],
  }
}

async function transcribeSegments(
  segments: Segment[],
  groqApiUrl: string,
  groqApiKey: string
): Promise<TranscribeResult> {
  if (segments.length === 0) {
    return { text: "", language: undefined, totalDuration: 0, warnings: ["No segments to transcribe"] }
  }

  // Detect language from first segment
  const firstBuf = await readFile(segments[0]!.path)
  const firstBlob = new Blob([firstBuf], { type: "audio/wav" })
  const firstResult = await callWhisper(firstBlob, "seg0.wav", groqApiUrl, groqApiKey, undefined)
  const language = firstResult?.language

  // Build work list for remaining segments
  const rest = segments.slice(1).map((s) => ({ segment: s, index: segments.indexOf(s) }))

  const results: Map<number, string> = new Map()
  const warnings: string[] = []

  if (firstResult) {
    results.set(0, firstResult.text)
  } else {
    const ts = formatTimestamp(segments[0]!.startTime, segments[0]!.endTime)
    results.set(0, `[не удалось распознать: ${ts}]`)
    warnings.push(`Segment 0 transcription failed`)
  }

  // Parallel transcription with concurrency limit
  await runWithConcurrency(
    rest,
    WHISPER_CONCURRENCY,
    async ({ segment, index }) => {
      const buf = await readFile(segment.path)
      const blob = new Blob([buf], { type: "audio/wav" })
      const fileName = `seg${index}.wav`

      let attempt = 0
      let whisperResult: WhisperApiResponse | null = null
      while (attempt <= WHISPER_RETRIES && whisperResult === null) {
        whisperResult = await callWhisper(blob, fileName, groqApiUrl, groqApiKey, language)
        attempt++
      }

      if (whisperResult) {
        results.set(index, whisperResult.text)
      } else {
        const ts = formatTimestamp(segment.startTime, segment.endTime)
        results.set(index, `[не удалось распознать: ${ts}]`)
        warnings.push(`Segment ${index} transcription failed after ${WHISPER_RETRIES} retries`)
      }
    }
  )

  // Merge in order
  const ordered = segments.map((_, i) => results.get(i) ?? "")
  const text = ordered.filter((t) => t.length > 0).join(" ").trim()
  const totalDuration = segments.at(-1)?.endTime ?? 0

  return { text, language, totalDuration, warnings }
}

// ---------------------------------------------------------------------------
// Whisper API call
// ---------------------------------------------------------------------------

interface WhisperApiResponse {
  text: string
  language: string
  duration: number
}

async function callWhisper(
  blob: Blob,
  fileName: string,
  groqApiUrl: string,
  groqApiKey: string,
  language: string | undefined
): Promise<WhisperApiResponse | null> {
  try {
    const formData = new FormData()
    formData.append("file", blob, fileName)
    formData.append("model", "whisper-large-v3")
    formData.append("response_format", "verbose_json")
    if (language) formData.append("language", language)

    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: formData,
      signal: AbortSignal.timeout(110_000),
    })

    if (!response.ok) return null
    return (await response.json()) as WhisperApiResponse
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Concurrency limiter (semaphore pattern)
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      await fn(items[current]!)
    }
  })
  await Promise.all(workers)
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatTimestamp(start: number, end: number): string {
  return `${toMMSS(start)} - ${toMMSS(end)}`
}

function toMMSS(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

async function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(msg)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

async function cleanupFiles(paths: string[]): Promise<void> {
  await Promise.all(
    paths
      .filter((p) => existsSync(p))
      .map((p) =>
        unlink(p).catch((e) =>
          console.error(`Cleanup failed for ${p}:`, e instanceof Error ? e.message : String(e))
        )
      )
  )
}
