/**
 * k6 setup script — registers a test user and uploads a small test document.
 * Run ONCE before load tests:
 *   node setup.js  (or: bun run k6/setup.js)
 * Outputs a .env file (k6-env.json) consumed by scenario scripts.
 *
 * Requirements: Node.js 18+ or Bun runtime (uses fetch API).
 */

import { writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = process.env.API_URL || "https://api.contexter.cc"

async function main() {
  console.log(`[setup] Registering test user on ${API}...`)

  // 1. Register user
  const regRes = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `k6-loadtest-${Date.now()}` }),
  })

  if (!regRes.ok) {
    const text = await regRes.text()
    throw new Error(`Registration failed (${regRes.status}): ${text}`)
  }

  const { userId, apiToken } = await regRes.json()
  console.log(`[setup] Registered user ${userId}, token: ${apiToken.slice(0, 8)}...`)

  // 2. Upload a small test document via presigned flow
  const testContent = `# Contexter Load Test Document

This document is used for k6 load testing. It contains sample content about Contexter.

## What is Contexter?

Contexter is a RAG-as-a-service platform that turns any content into an API endpoint with a knowledge base.
It supports 15 file formats including PDF, DOCX, XLSX, audio, video, and images.

## Key Features

- Universal format support (15+ formats)
- MCP-native integration (12 tools via Streamable HTTP)
- Hierarchical chunking with contextual prefixes
- Multi-provider LLM chain (Groq → NIM → DeepInfra)
- pgvector + tsvector hybrid search with convex fusion
- Cross-encoder reranking for precision
- NLI-based hallucination detection
- Confidence scoring and source attribution

## Technical Architecture

The pipeline processes documents through: parse → chunk → contextual prefix → dedup → embed → index.
Queries flow through: rewrite → embed → hybrid search → rerank → MMR diversity → context assembly → LLM answer.

## Pricing

Contexter offers three tiers: Starter ($9/mo), Pro ($29/mo), and Team ($79/mo).
Each tier includes different storage and query limits.
`

  // Upload via presigned flow (direct upload has known 415 bug)
  const fileName = "k6-test-document.txt"
  const mimeType = "text/plain"
  const fileBuffer = Buffer.from(testContent, "utf8")
  const fileSize = fileBuffer.byteLength

  console.log("[setup] Requesting presigned upload URL...")
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
    throw new Error(`Presign failed (${presignRes.status}): ${text}`)
  }

  const { uploadUrl, documentId, r2Key } = await presignRes.json()
  console.log(`[setup] Got presigned URL for document ${documentId}`)

  // PUT file to R2 directly
  console.log("[setup] Uploading file to R2...")
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  })

  if (!putRes.ok) {
    const text = await putRes.text()
    throw new Error(`R2 PUT failed (${putRes.status}): ${text}`)
  }

  // Confirm upload
  console.log("[setup] Confirming upload...")
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
    throw new Error(`Confirm failed (${confirmRes.status}): ${text}`)
  }

  console.log(`[setup] Upload confirmed, document ${documentId}`)

  // 3. Wait for pipeline to complete (poll status)
  console.log("[setup] Waiting for pipeline to complete...")
  const maxWait = 120_000
  const start = Date.now()
  let status = "pending"

  while (Date.now() - start < maxWait) {
    const statusRes = await fetch(`${API}/api/status/${documentId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    if (statusRes.ok) {
      const statusData = await statusRes.json()
      status = statusData.status || statusData.jobs?.[0]?.status || "unknown"
      if (status === "done" || status === "completed" || status === "ready") {
        console.log(`[setup] Pipeline completed in ${Math.round((Date.now() - start) / 1000)}s`)
        break
      }
      if (status === "failed" || status === "error") {
        throw new Error(`Pipeline failed: ${JSON.stringify(statusData)}`)
      }
    }

    await new Promise((r) => setTimeout(r, 3000))
  }

  if (status !== "done" && status !== "completed" && status !== "ready") {
    console.warn(`[setup] Pipeline did not complete within ${maxWait / 1000}s (status: ${status}). Proceeding anyway.`)
  }

  // 4. Write env file for k6 scripts
  const env = {
    API_URL: API,
    API_TOKEN: apiToken,
    USER_ID: userId,
    DOCUMENT_ID: documentId,
    CREATED_AT: new Date().toISOString(),
  }

  const envPath = join(__dirname, "k6-env.json")
  writeFileSync(envPath, JSON.stringify(env, null, 2))
  console.log(`[setup] Environment saved to ${envPath}`)
  console.log("[setup] Done. Run k6 scenarios with:")
  console.log(`  k6 run --env API_TOKEN=${apiToken} --env API_URL=${API} k6/scenario-1-queries.js`)
}

main().catch((err) => {
  console.error("[setup] FATAL:", err.message)
  process.exit(1)
})
