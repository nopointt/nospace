/**
 * Stress Test Setup — Register 110 test users, seed each with a document.
 *
 * Run ONCE before stress-100.js:
 *   bun run k6/stress-setup.js
 *
 * Output: k6/fixtures/users.json — array of { userId, apiToken, documentId }
 */

import { writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = process.env.API_URL || "https://api.contexter.cc"
const USER_COUNT = 110
const CONCURRENCY = 10 // register 10 users in parallel batches

const SEED_CONTENT = `# Stress Test Seed Document
This document is used for k6 stress testing of the Contexter RAG pipeline.
It contains information about machine learning, vector embeddings, and retrieval-augmented generation.

## Key Topics
- Semantic search uses dense vector representations to find similar content
- Document chunking splits large texts into manageable pieces for embedding
- Hybrid search combines vector similarity with keyword matching (BM25)
- Reranking uses cross-encoders to improve precision after initial retrieval
- The pipeline stages are: parse, chunk, embed, index

## Architecture
Contexter processes uploads through a 4-stage pipeline and answers queries using
a multi-step RAG flow: rewrite, embed, search, rerank, generate.
`

async function registerUser(index) {
  const email = `stress-${index}-${Date.now().toString(36)}@test.contexter.dev`
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `stress-user-${index}`, email }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Register user ${index} failed (${res.status}): ${text}`)
  }

  return res.json()
}

async function uploadSeedDoc(apiToken, userId, index) {
  const fileName = `stress-seed-${index}.txt`
  const mimeType = "text/plain"
  const content = SEED_CONTENT + `\nUser index: ${index}\nTimestamp: ${new Date().toISOString()}\n`
  const fileSize = Buffer.byteLength(content, "utf8")

  // Presign
  const presignRes = await fetch(`${API}/api/upload/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  })

  if (!presignRes.ok) {
    const text = await presignRes.text()
    throw new Error(`Presign failed for user ${index} (${presignRes.status}): ${text}`)
  }

  const { uploadUrl, documentId, r2Key } = await presignRes.json()

  // PUT to R2
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: Buffer.from(content, "utf8"),
  })

  if (!putRes.ok) {
    throw new Error(`R2 PUT failed for user ${index} (${putRes.status})`)
  }

  // Confirm
  const confirmRes = await fetch(`${API}/api/upload/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ documentId, r2Key, fileName, mimeType, fileSize }),
  })

  if (!confirmRes.ok && confirmRes.status !== 202) {
    const text = await confirmRes.text()
    throw new Error(`Confirm failed for user ${index} (${confirmRes.status}): ${text}`)
  }

  return documentId
}

async function waitPipeline(apiToken, documentId, maxWaitMs = 90_000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${API}/api/status/${documentId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.status === "ready") return true
      if (data.status === "error" || data.status === "failed") return false
    }

    await new Promise((r) => setTimeout(r, 3000))
  }
  return false
}

async function setupUser(index) {
  const { userId, apiToken } = await registerUser(index)
  const documentId = await uploadSeedDoc(apiToken, userId, index)
  const ok = await waitPipeline(apiToken, documentId)

  return { userId, apiToken, documentId, index, pipelineOk: ok }
}

async function main() {
  console.log(`[stress-setup] Registering ${USER_COUNT} users on ${API}...`)
  console.log(`[stress-setup] Concurrency: ${CONCURRENCY}`)

  const users = []
  let completed = 0
  let failed = 0

  for (let batch = 0; batch < USER_COUNT; batch += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, USER_COUNT - batch)
    const promises = []

    for (let i = 0; i < batchSize; i++) {
      const index = batch + i
      promises.push(
        setupUser(index)
          .then((user) => {
            completed++
            const status = user.pipelineOk ? "OK" : "PIPELINE_FAILED"
            console.log(`  [${completed}/${USER_COUNT}] user ${index}: ${status} (token: ${user.apiToken.slice(0, 8)}...)`)
            return user
          })
          .catch((err) => {
            failed++
            completed++
            console.error(`  [${completed}/${USER_COUNT}] user ${index}: FAILED — ${err.message}`)
            return null
          })
      )
    }

    const results = await Promise.all(promises)
    users.push(...results.filter(Boolean))

    // Brief pause between batches to avoid overwhelming the server
    if (batch + CONCURRENCY < USER_COUNT) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  console.log(`\n[stress-setup] Done: ${users.length} OK, ${failed} failed`)

  if (users.length < 10) {
    console.error("[stress-setup] FATAL: Too few users registered. Aborting.")
    process.exit(1)
  }

  // Save user pool
  const usersPath = join(__dirname, "fixtures", "users.json")
  writeFileSync(usersPath, JSON.stringify(users, null, 2))
  console.log(`[stress-setup] Saved ${users.length} users to ${usersPath}`)

  // Verify one user can query
  const testUser = users[0]
  const queryRes = await fetch(`${API}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUser.apiToken}`,
    },
    body: JSON.stringify({ query: "What is Contexter?" }),
  })

  if (queryRes.ok) {
    const data = await queryRes.json()
    console.log(`[stress-setup] Query verification: ${data.answer ? "OK" : "NO ANSWER"} (${data.answer?.slice(0, 80)}...)`)
  } else {
    console.warn(`[stress-setup] Query verification failed: ${queryRes.status}`)
  }

  console.log("\n[stress-setup] Ready. Run stress test:")
  console.log(`  k6 run k6/stress-100.js`)
}

main().catch((err) => {
  console.error("[stress-setup] FATAL:", err.message)
  process.exit(1)
})
