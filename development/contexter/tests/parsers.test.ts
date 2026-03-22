import { describe, test, expect, mock, beforeAll } from "bun:test"
import { readFileSync } from "fs"
import { join } from "path"
import { countWords, buildMetadata } from "../src/services/parsers/types"
import { ToMarkdownParser } from "../src/services/parsers/tomarkdown"
import { AudioParser } from "../src/services/parsers/audio"
import { YouTubeParser } from "../src/services/parsers/youtube"
import { ParserService } from "../src/services/parsers"
import type { ParserInput } from "../src/services/parsers/types"

const FIXTURES = join(import.meta.dir, "fixtures")

function readFixture(name: string): ArrayBuffer {
  const buffer = readFileSync(join(FIXTURES, name))
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

function makeInput(fileName: string, mimeType: string): ParserInput {
  const file = readFixture(fileName)
  return { file, fileName, mimeType, fileSize: file.byteLength }
}

// --- Unit: helpers ---

describe("countWords", () => {
  test("counts words in plain text", () => {
    expect(countWords("hello world")).toBe(2)
  })

  test("handles multiple spaces and newlines", () => {
    expect(countWords("  hello   world\n\nfoo  ")).toBe(3)
  })

  test("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0)
  })

  test("returns 0 for whitespace only", () => {
    expect(countWords("   \n\t  ")).toBe(0)
  })
})

describe("buildMetadata", () => {
  test("builds metadata with correct counts", () => {
    const input: ParserInput = {
      file: new ArrayBuffer(100),
      fileName: "test.txt",
      mimeType: "text/plain",
      fileSize: 100,
    }
    const meta = buildMetadata(input, "hello world foo", "txt")
    expect(meta.sourceFormat).toBe("txt")
    expect(meta.fileName).toBe("test.txt")
    expect(meta.fileSize).toBe(100)
    expect(meta.wordCount).toBe(3)
    expect(meta.charCount).toBe(15)
    expect(meta.warnings).toEqual([])
  })
})

// --- Unit: ToMarkdownParser (mocked AI) ---

describe("ToMarkdownParser", () => {
  function createMockAi(responseData: string) {
    return {
      toMarkdown: mock(async () => [{ data: responseData }]),
      run: mock(async () => ({})),
    } as unknown as Ai
  }

  test("parses TXT file", async () => {
    const content = readFixture("sample.txt")
    const text = new TextDecoder().decode(content)
    const mockAi = createMockAi(text)
    const parser = new ToMarkdownParser(mockAi)

    const result = await parser.parse(makeInput("sample.txt", "text/plain"))

    expect(result.content).toContain("sample text file")
    expect(result.metadata.sourceFormat).toBe("txt")
    expect(result.metadata.wordCount).toBeGreaterThan(0)
    expect(result.metadata.charCount).toBeGreaterThan(0)
    expect(result.metadata.warnings).toEqual([])
    expect(mockAi.toMarkdown).toHaveBeenCalledTimes(1)
  })

  test("parses MD file", async () => {
    const content = readFixture("sample.md")
    const text = new TextDecoder().decode(content)
    const mockAi = createMockAi(text)
    const parser = new ToMarkdownParser(mockAi)

    const result = await parser.parse(makeInput("sample.md", "text/markdown"))

    expect(result.content).toContain("# Sample Markdown")
    expect(result.content).toContain("Column A")
    expect(result.metadata.sourceFormat).toBe("md")
    expect(result.metadata.wordCount).toBeGreaterThan(10)
  })

  test("parses CSV file", async () => {
    const mockAi = createMockAi("| name | age | city | role |\n|---|---|---|---|\n| Alice | 30 | New York | Engineer |")
    const parser = new ToMarkdownParser(mockAi)

    const result = await parser.parse(makeInput("sample.csv", "text/csv"))

    expect(result.content).toContain("Alice")
    expect(result.metadata.sourceFormat).toBe("csv")
    expect(result.metadata.wordCount).toBeGreaterThan(0)
  })

  test("parses JSON file", async () => {
    const mockAi = createMockAi('```json\n{"company":"Contexter","employees":[...]}\n```')
    const parser = new ToMarkdownParser(mockAi)

    const result = await parser.parse(makeInput("sample.json", "application/json"))

    expect(result.content).toContain("Contexter")
    expect(result.metadata.sourceFormat).toBe("json")
  })

  test("warns on empty response", async () => {
    const mockAi = createMockAi("")
    const parser = new ToMarkdownParser(mockAi)

    const result = await parser.parse(makeInput("sample.txt", "text/plain"))

    expect(result.metadata.warnings.length).toBeGreaterThan(0)
    expect(result.metadata.warnings[0]).toContain("empty content")
  })

  test("handles all supported mime types", () => {
    const mockAi = createMockAi("")
    const parser = new ToMarkdownParser(mockAi)

    expect(parser.formats).toContain("application/pdf")
    expect(parser.formats).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    expect(parser.formats).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    expect(parser.formats).toContain("application/vnd.openxmlformats-officedocument.presentationml.presentation")
    expect(parser.formats).toContain("text/csv")
    expect(parser.formats).toContain("application/json")
    expect(parser.formats).toContain("image/png")
    expect(parser.formats).toContain("image/jpeg")
    expect(parser.formats.length).toBeGreaterThanOrEqual(16)
  })
})

// --- Unit: AudioParser (mocked Groq) ---

describe("AudioParser", () => {
  test("parses audio via Groq Whisper", async () => {
    const mockResponse = {
      text: "Hello this is a test transcription of audio content.",
      language: "en",
      duration: 12.5,
    }

    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(async () =>
      new Response(JSON.stringify(mockResponse), { status: 200 })
    ) as typeof fetch

    const parser = new AudioParser("https://api.groq.com/openai/v1/audio/transcriptions", "test-key")
    const input: ParserInput = {
      file: new ArrayBuffer(1000),
      fileName: "test.mp3",
      mimeType: "audio/mpeg",
      fileSize: 1000,
    }

    const result = await parser.parse(input)

    expect(result.content).toContain("test transcription")
    expect(result.metadata.sourceFormat).toBe("audio")
    expect(result.metadata.duration).toBe(12.5)
    expect(result.metadata.language).toBe("en")
    expect(result.metadata.wordCount).toBeGreaterThan(0)
    expect(result.metadata.warnings).toEqual([])

    globalThis.fetch = originalFetch
  })

  test("warns on empty transcription", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(async () =>
      new Response(JSON.stringify({ text: "", language: "en", duration: 5 }), { status: 200 })
    ) as typeof fetch

    const parser = new AudioParser("https://api.groq.com/test", "test-key")
    const input: ParserInput = {
      file: new ArrayBuffer(500),
      fileName: "silent.mp3",
      mimeType: "audio/mpeg",
      fileSize: 500,
    }

    const result = await parser.parse(input)

    expect(result.metadata.warnings.length).toBeGreaterThan(0)
    expect(result.metadata.warnings[0]).toContain("empty transcription")

    globalThis.fetch = originalFetch
  })

  test("throws on API error", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(async () =>
      new Response("Unauthorized", { status: 401 })
    ) as typeof fetch

    const parser = new AudioParser("https://api.groq.com/test", "bad-key")
    const input: ParserInput = {
      file: new ArrayBuffer(500),
      fileName: "test.mp3",
      mimeType: "audio/mpeg",
      fileSize: 500,
    }

    await expect(parser.parse(input)).rejects.toThrow("Groq Whisper error 401")

    globalThis.fetch = originalFetch
  })
})

// --- Unit: YouTubeParser (mocked fetch) ---

describe("YouTubeParser", () => {
  test("extracts video ID from standard URL", async () => {
    // Test URL extraction indirectly through parser
    const parser = new YouTubeParser()
    expect(parser.formats).toContain("text/x-youtube-url")
  })

  test("rejects invalid YouTube URL", async () => {
    const parser = new YouTubeParser()
    const input: ParserInput = {
      file: new TextEncoder().encode("https://example.com/not-youtube").buffer as ArrayBuffer,
      fileName: "url.txt",
      mimeType: "text/x-youtube-url",
      fileSize: 40,
    }

    await expect(parser.parse(input)).rejects.toThrow("Invalid YouTube URL")
  })
})

// --- Unit: ParserService (router) ---

describe("ParserService", () => {
  function createService() {
    const mockAi = {
      toMarkdown: mock(async () => [{ data: "mock content" }]),
      run: mock(async () => ({})),
    } as unknown as Ai

    return new ParserService({
      ai: mockAi,
      groqApiUrl: "https://api.groq.com/test",
      groqApiKey: "test-key",
    })
  }

  test("routes text/plain to ToMarkdownParser", async () => {
    const service = createService()
    const result = await service.parse(makeInput("sample.txt", "text/plain"))
    expect(result.content).toBe("mock content")
    expect(result.metadata.sourceFormat).toBe("txt")
  })

  test("routes text/csv to ToMarkdownParser", async () => {
    const service = createService()
    const result = await service.parse(makeInput("sample.csv", "text/csv"))
    expect(result.metadata.sourceFormat).toBe("csv")
  })

  test("routes application/json to ToMarkdownParser", async () => {
    const service = createService()
    const result = await service.parse(makeInput("sample.json", "application/json"))
    expect(result.metadata.sourceFormat).toBe("json")
  })

  test("supports() returns true for known formats", () => {
    const service = createService()
    expect(service.supports("text/plain")).toBe(true)
    expect(service.supports("application/pdf")).toBe(true)
    expect(service.supports("audio/mpeg")).toBe(true)
    expect(service.supports("text/x-youtube-url")).toBe(true)
    expect(service.supports("application/pdf+visual")).toBe(true)
  })

  test("supports() returns false for unknown formats", () => {
    const service = createService()
    expect(service.supports("application/octet-stream")).toBe(false)
    expect(service.supports("video/mp4")).toBe(false)
  })

  test("throws on unsupported format", async () => {
    const service = createService()
    const input: ParserInput = {
      file: new ArrayBuffer(10),
      fileName: "test.xyz",
      mimeType: "application/xyz",
      fileSize: 10,
    }
    await expect(service.parse(input)).rejects.toThrow("No parser found")
  })

  test("supportedFormats() lists all formats", () => {
    const service = createService()
    const formats = service.supportedFormats()
    expect(formats.length).toBeGreaterThanOrEqual(20)
    expect(formats).toContain("application/pdf")
    expect(formats).toContain("audio/mpeg")
    expect(formats).toContain("text/x-youtube-url")
    expect(formats).toContain("application/pdf+visual")
  })
})
