import { test, expect } from "@playwright/test"
import { resolve, dirname } from "path"
import { existsSync, readFileSync } from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE = "http://localhost:8787"
const FIXTURES = resolve(__dirname, "../tests/fixtures")

// Real files from user's filesystem
const REAL_FILES: Array<{ path: string; format: string; minWords: number }> = [
  { path: "C:/Users/noadmin/Downloads/Harkly Architecture Spec.pdf", format: "pdf", minWords: 100 },
  { path: "C:/Users/noadmin/Downloads/product-brief-v2.docx", format: "docx", minWords: 10 },
  { path: "C:/Users/noadmin/Downloads/Telegram Desktop/доп запросы.xlsx", format: "xlsx", minWords: 1 },
  { path: "C:/Users/noadmin/Downloads/Telegram Desktop/Источники, сводка-2024-11-25-2026-02-24.csv", format: "csv", minWords: 1 },
  { path: "C:/Users/noadmin/Downloads/empty-room.jpg", format: "jpg", minWords: 1 },
  { path: "C:/Users/noadmin/Downloads/audio_2026-03-01_09-57-23.ogg", format: "ogg", minWords: 10 },
]

// Test fixture files
const FIXTURE_FILES: Array<{ name: string; mime: string; format: string; minWords: number }> = [
  { name: "sample.txt", mime: "text/plain", format: "txt", minWords: 10 },
  { name: "sample.md", mime: "text/markdown", format: "md", minWords: 10 },
  { name: "sample.csv", mime: "text/csv", format: "csv", minWords: 1 },
  { name: "sample.json", mime: "application/json", format: "json", minWords: 1 },
]

test.describe("Pipeline API — fixture files", () => {
  for (const file of FIXTURE_FILES) {
    test(`${file.format}: parse → chunk → embed → index`, async ({ request }) => {
      const filePath = resolve(FIXTURES, file.name)
      const response = await request.post(`${BASE}/dev/pipeline`, {
        multipart: {
          file: { name: file.name, mimeType: file.mime, buffer: readFileSync(filePath) },
        },
      })

      expect(response.ok()).toBeTruthy()
      const result = await response.json()

      // All 4 stages should complete
      for (const stage of result.stages) {
        expect(stage.status, `${file.format} stage ${stage.stage} failed: ${stage.error || ""}`).toBe("done")
      }

      // Parse should produce content
      const parseData = result.stages[0].data
      expect(parseData.wordCount).toBeGreaterThanOrEqual(file.minWords)
      expect(parseData.charCount).toBeGreaterThan(0)
      expect(parseData.warnings.length).toBe(0)

      // Chunk should produce chunks
      const chunkData = result.stages[1].data
      expect(chunkData.totalChunks).toBeGreaterThan(0)

      // Embed should produce vectors with correct dims
      const embedData = result.stages[2].data
      expect(embedData.totalEmbeddings).toBe(chunkData.totalChunks)
      expect(embedData.dimensions).toBe(1024)

      // Index should match chunk count
      const indexData = result.stages[3].data
      expect(indexData.vectorsIndexed).toBe(chunkData.totalChunks)
      expect(indexData.ftsIndexed).toBe(chunkData.totalChunks)
    })
  }
})

test.describe("Pipeline API — real files", () => {
  for (const file of REAL_FILES) {
    const fileName = file.path.split(/[/\\]/).pop()!

    test(`${file.format}: ${fileName}`, async ({ request }) => {
      if (!existsSync(file.path)) {
        test.skip()
        return
      }

      const buffer = readFileSync(file.path)
      const response = await request.post(`${BASE}/dev/pipeline`, {
        multipart: {
          file: { name: fileName, mimeType: "application/octet-stream", buffer },
        },
      })

      expect(response.ok()).toBeTruthy()
      const result = await response.json()

      // Parse must succeed
      expect(result.stages[0].status, `Parse failed: ${result.stages[0].error || ""}`).toBe("done")
      expect(result.stages[0].data.wordCount).toBeGreaterThanOrEqual(file.minWords)

      // Chunk must succeed
      expect(result.stages[1].status, `Chunk failed: ${result.stages[1].error || ""}`).toBe("done")
      expect(result.stages[1].data.totalChunks).toBeGreaterThan(0)

      // Embed must succeed
      expect(result.stages[2].status, `Embed failed: ${result.stages[2].error || ""}`).toBe("done")
      expect(result.stages[2].data.dimensions).toBe(1024)

      // Index must succeed
      expect(result.stages[3].status, `Index failed: ${result.stages[3].error || ""}`).toBe("done")

      console.log(`✅ ${file.format} (${fileName}): ${result.stages[0].data.wordCount} words → ${result.stages[1].data.totalChunks} chunks → ${result.stages[2].data.totalEmbeddings} vectors | Parse ${result.stages[0].durationMs}ms Embed ${result.stages[2].durationMs}ms`)
    })
  }
})

test.describe("RAG Query", () => {
  test("query returns answer with sources", async ({ request }) => {
    const response = await request.post(`${BASE}/dev/query`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "What is Harkly?", topK: 5 }),
    })

    expect(response.ok()).toBeTruthy()
    const result = await response.json()

    expect(result.answer).toBeTruthy()
    expect(result.answer.length).toBeGreaterThan(10)
    expect(result.sources).toBeDefined()
    expect(result.queryVariants).toBeDefined()
    expect(result.queryVariants.length).toBeGreaterThan(0)
    expect(result.tokenUsage).toBeDefined()
    expect(result.tokenUsage.embeddingTokens).toBeGreaterThan(0)

    console.log(`✅ Query answer (${result.answer.length} chars), ${result.sources.length} sources, ${result.queryVariants.length} variants`)
    console.log(`   Answer preview: ${result.answer.slice(0, 200)}`)
  })

  test("query in Russian returns Russian answer", async ({ request }) => {
    const response = await request.post(`${BASE}/dev/query`, {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ query: "что такое телос?", topK: 5 }),
    })

    expect(response.ok()).toBeTruthy()
    const result = await response.json()

    expect(result.answer).toBeTruthy()
    expect(result.sources.length).toBeGreaterThan(0)

    console.log(`✅ RU Query: ${result.answer.slice(0, 200)}`)
  })
})

test.describe("Health & State", () => {
  test("health check passes", async ({ request }) => {
    const response = await request.get(`${BASE}/health`)
    expect(response.ok()).toBeTruthy()
    const result = await response.json()
    expect(result.status).toBe("healthy")
  })

  test("state returns counts", async ({ request }) => {
    const response = await request.get(`${BASE}/dev/state`)
    expect(response.ok()).toBeTruthy()
    const result = await response.json()
    expect(result).toHaveProperty("documents")
    expect(result).toHaveProperty("chunks")
  })
})
