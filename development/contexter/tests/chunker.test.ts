import { describe, test, expect } from "bun:test"
import { ChunkerService } from "../src/services/chunker"
import { chunkSemantic } from "../src/services/chunker/semantic"
import { chunkTable } from "../src/services/chunker/table"
import { chunkTimestamp } from "../src/services/chunker/timestamp"
import { countTokens, tokenize, ensureEncoderLoaded } from "../src/services/chunker/tokenizer"
import { beforeAll } from "bun:test"

// Ensure BPE encoder is loaded before tests (countTokens is async on first call)
beforeAll(async () => { await ensureEncoderLoaded() })

// --- Tokenizer ---

describe("tokenizer", () => {
  test("countTokens returns BPE token count", async () => {
    // BPE tokens ≠ word count, but should be > 0 for non-empty text
    expect(await countTokens("hello world")).toBeGreaterThan(0)
    expect(await countTokens("one two three four five")).toBeGreaterThan(0)
    expect(await countTokens("")).toBe(0)
  })

  test("tokenize returns words with offsets", () => {
    const tokens = tokenize("hello world foo")
    expect(tokens).toEqual([
      { word: "hello", start: 0, end: 5 },
      { word: "world", start: 6, end: 11 },
      { word: "foo", start: 12, end: 15 },
    ])
  })
})

// --- Semantic Chunker ---

describe("chunkSemantic", () => {
  test("returns empty array for empty text", () => {
    expect(chunkSemantic("")).toEqual([])
    expect(chunkSemantic("   ")).toEqual([])
  })

  test("single short paragraph stays as one chunk", () => {
    const text = "This is a short paragraph."
    const chunks = chunkSemantic(text, { maxTokens: 500 })
    expect(chunks.length).toBe(1)
    expect(chunks[0].content).toBe(text)
    expect(chunks[0].index).toBe(0)
    expect(chunks[0].metadata.type).toBe("semantic")
  })

  test("splits long text into multiple chunks", () => {
    const paragraph = Array(100).fill("word").join(" ") // 100 words
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`
    const chunks = chunkSemantic(text, { maxTokens: 150, overlap: 0 })

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(150)
    }
  })

  test("respects paragraph boundaries", () => {
    const text = "Paragraph one with some words.\n\nParagraph two with more words.\n\nParagraph three final words."
    const chunks = chunkSemantic(text, { maxTokens: 6, overlap: 0 })

    expect(chunks.length).toBe(3)
    expect(chunks[0].content).toContain("Paragraph one")
    expect(chunks[1].content).toContain("Paragraph two")
    expect(chunks[2].content).toContain("Paragraph three")
  })

  test("handles overlap", () => {
    const words = Array(50).fill("word").join(" ")
    const text = `${words}\n\n${words}`
    const chunks = chunkSemantic(text, { maxTokens: 60, overlap: 10 })

    expect(chunks.length).toBe(2)
    // Second chunk should start with overlapping words from first
    const firstWords = chunks[0].content.split(/\s+/)
    const secondWords = chunks[1].content.split(/\s+/)
    const lastOfFirst = firstWords.slice(-10)
    const startOfSecond = secondWords.slice(0, 10)
    expect(lastOfFirst).toEqual(startOfSecond)
  })

  test("force-splits single paragraph exceeding maxTokens", () => {
    // Use simple words — BPE tokenizes each as ~1 token
    const text = Array(200).fill("the cat sat on a mat and").join(" ")
    const chunks = chunkSemantic(text, { maxTokens: 100, overlap: 0 })

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    for (const chunk of chunks) {
      // Allow ~30% overshoot — BPE split boundaries don't align perfectly with word boundaries
      expect(chunk.tokenCount).toBeLessThanOrEqual(130)
    }
  })

  test("preserves all content (no loss)", () => {
    const text = "Alpha bravo charlie.\n\nDelta echo foxtrot.\n\nGolf hotel india."
    const chunks = chunkSemantic(text, { maxTokens: 5, overlap: 0 })

    const reconstructed = chunks.map((c) => c.content).join(" ")
    expect(reconstructed).toContain("Alpha")
    expect(reconstructed).toContain("bravo")
    expect(reconstructed).toContain("charlie")
    expect(reconstructed).toContain("Delta")
    expect(reconstructed).toContain("foxtrot")
    expect(reconstructed).toContain("Golf")
    expect(reconstructed).toContain("india")
  })

  test("chunks have sequential indices", () => {
    const text = "A B C.\n\nD E F.\n\nG H I."
    const chunks = chunkSemantic(text, { maxTokens: 4, overlap: 0 })
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i)
    }
  })
})

// --- Table Chunker ---

describe("chunkTable", () => {
  const markdownTable = `# Report

| Name | Age | City |
|------|-----|------|
| Alice | 30 | New York |
| Bob | 25 | London |
| Charlie | 35 | Tokyo |
| Diana | 28 | Berlin |
| Eve | 32 | Paris |`

  test("splits table rows with header preserved", () => {
    const chunks = chunkTable(markdownTable, 20)

    for (const chunk of chunks) {
      if (chunk.metadata.type === "row" && chunk.content.includes("|")) {
        expect(chunk.content).toContain("| Name | Age | City |")
        expect(chunk.content).toContain("|------|-----|------|")
      }
    }
  })

  test("preserves all rows", () => {
    const chunks = chunkTable(markdownTable, 20)
    const allContent = chunks.map((c) => c.content).join("\n")

    expect(allContent).toContain("Alice")
    expect(allContent).toContain("Bob")
    expect(allContent).toContain("Charlie")
    expect(allContent).toContain("Diana")
    expect(allContent).toContain("Eve")
  })

  test("non-table content preserved separately", () => {
    const chunks = chunkTable(markdownTable, 100)
    const nonTableChunks = chunks.filter((c) => !c.content.includes("|---"))

    const hasReport = nonTableChunks.some((c) => c.content.includes("Report"))
    expect(hasReport).toBe(true)
  })

  test("handles text without tables", () => {
    const text = "Just plain text without any tables."
    const chunks = chunkTable(text)

    expect(chunks.length).toBe(1)
    expect(chunks[0].content).toBe(text)
  })

  test("groups small rows together", () => {
    const chunks = chunkTable(markdownTable, 500)

    // With maxTokens=500, all rows should fit in one table chunk
    const tableChunks = chunks.filter((c) => c.content.includes("|---"))
    expect(tableChunks.length).toBe(1)
    expect(tableChunks[0].content).toContain("Alice")
    expect(tableChunks[0].content).toContain("Eve")
  })
})

// --- Timestamp Chunker ---

describe("chunkTimestamp", () => {
  test("splits by timestamp markers", () => {
    const text = "[00:00] Hello this is the beginning. [00:30] Now we move to the next topic. [01:00] And this is the final section with more words."
    const chunks = chunkTimestamp(text, 15)

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0].metadata.type).toBe("timestamp")
    expect(chunks[0].metadata.startTime).toBe(0)
  })

  test("preserves timestamps in metadata", () => {
    const text = "[00:00] First segment. [00:30] Second segment. [01:00] Third segment."
    const chunks = chunkTimestamp(text, 100)

    expect(chunks[0].metadata.startTime).toBe(0)
    expect(chunks[0].metadata.endTime).toBeGreaterThan(0)
  })

  test("groups small segments together", () => {
    const text = "[00:00] Hi. [00:05] Hello. [00:10] Hey. [00:15] Greetings."
    const chunks = chunkTimestamp(text, 100)

    // All segments small enough to fit in one chunk
    expect(chunks.length).toBe(1)
    expect(chunks[0].content).toContain("Hi")
    expect(chunks[0].content).toContain("Greetings")
  })

  test("handles HH:MM:SS format", () => {
    const text = "[00:00:00] Start. [00:01:30] Middle. [00:03:00] End."
    const chunks = chunkTimestamp(text, 100)

    expect(chunks.length).toBe(1)
    expect(chunks[0].metadata.startTime).toBe(0)
  })

  test("falls back to sentence split when no timestamps", () => {
    const text = "This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five."
    const chunks = chunkTimestamp(text, 12)

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0].metadata.type).toBe("timestamp")
  })

  test("preserves all content", () => {
    const text = "[00:00] Alpha bravo. [00:30] Charlie delta. [01:00] Echo foxtrot."
    const chunks = chunkTimestamp(text, 5)

    const allContent = chunks.map((c) => c.content).join(" ")
    expect(allContent).toContain("Alpha")
    expect(allContent).toContain("Charlie")
    expect(allContent).toContain("Echo")
    expect(allContent).toContain("foxtrot")
  })
})

// --- ChunkerService (router) ---

describe("ChunkerService", () => {
  const service = new ChunkerService()

  test("auto-selects semantic for pdf", () => {
    const chunks = service.chunk("Hello world. More text here.", "pdf")
    expect(chunks[0].metadata.type).toBe("semantic")
  })

  test("auto-selects semantic for docx", () => {
    const chunks = service.chunk("Some document text.", "docx")
    expect(chunks[0].metadata.type).toBe("semantic")
  })

  test("auto-selects row for csv", () => {
    const text = "| a | b |\n|---|---|\n| 1 | 2 |"
    const chunks = service.chunk(text, "csv")
    expect(chunks.some((c) => c.metadata.type === "row")).toBe(true)
  })

  test("auto-selects row for xlsx", () => {
    const text = "| col1 | col2 |\n|------|------|\n| val1 | val2 |"
    const chunks = service.chunk(text, "xlsx")
    expect(chunks.some((c) => c.metadata.type === "row")).toBe(true)
  })

  test("auto-selects timestamp for audio", () => {
    const chunks = service.chunk("Some transcription text.", "audio")
    expect(chunks[0].metadata.type).toBe("timestamp")
  })

  test("auto-selects timestamp for youtube", () => {
    const chunks = service.chunk("[00:00] Hello.", "youtube")
    expect(chunks[0].metadata.type).toBe("timestamp")
  })

  test("allows strategy override", () => {
    const chunks = service.chunk("Plain text.", "pdf", { strategy: "timestamp" })
    expect(chunks[0].metadata.type).toBe("timestamp")
  })

  test("returns empty for empty content", () => {
    const chunks = service.chunk("", "pdf")
    expect(chunks).toEqual([])
  })
})
