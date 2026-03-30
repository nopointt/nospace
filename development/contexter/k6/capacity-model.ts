/**
 * Contexter Capacity Model — resource projection for 10,000 users.
 * Based on actual load test baseline (2026-03-30) and production metrics.
 *
 * Run: bun run k6/capacity-model.ts
 */

// =============================================================================
// ACTUAL MEASUREMENTS (from k6 baseline + production)
// =============================================================================

const MEASURED = {
  // Query latency (single user, no contention)
  queryLatencyIdleMs: 6000,
  // Query latency (20 concurrent VUs)
  queryLatencyLoadMs: 13000,
  // LLM calls per query: 1x rewrite (8B) + 1x answer (70B)
  llmCallsPerQuery: 2,
  // Average tokens per query (rewrite input+output + answer input+output)
  tokensPerQueryRewrite: 800,   // 8B: ~500 input + ~300 output
  tokensPerQueryAnswer: 4000,   // 70B: ~2000 input (context) + ~2000 output
  // Embedding per query: 1 call (query embedding)
  embeddingCallsPerQuery: 1,
  embeddingTokensPerQuery: 50,
  // Upload pipeline
  avgDocSizeMB: 2,
  avgChunksPerDoc: 25,
  avgEmbeddingTokensPerChunk: 200,
  pipelineTimeTxtSec: 5,
  pipelineTimePdfSec: 45,
  // PG storage per chunk (content + embedding + metadata)
  pgBytesPerChunk: 4096 + 2048 + 512, // ~6.5 KB (text + 512-dim float32 vector + indexes)
  // R2 storage = original file (pass-through)
  // Current server
  currentRAM_MB: 4096,
  currentCPU: 2,
  currentDiskGB: 40,
  currentCostEUR: 4.72,
}

// =============================================================================
// USER BEHAVIOR MODEL
// =============================================================================

const USERS = 10_000

const behavior = {
  // What fraction of users are active in a given day
  dailyActiveRate: 0.15,        // 15% DAU = 1,500 DAU
  // Sessions per active user per day
  sessionsPerDay: 1.5,
  // Queries per session
  queriesPerSession: 8,
  // Uploads per user per month
  uploadsPerUserMonth: 10,
  // Average docs per user (accumulated)
  docsPerUser: 20,
  // Peak hour = 20% of daily traffic in 1 hour
  peakHourFraction: 0.20,
  // Concurrent users = fraction of peak hour users active simultaneously
  concurrentFraction: 0.10,     // 10% of peak-hour users query at the same moment
}

// =============================================================================
// CALCULATIONS
// =============================================================================

console.log("=" .repeat(70))
console.log(" CONTEXTER CAPACITY MODEL — 10,000 USERS")
console.log("=".repeat(70))

// --- Traffic ---
const dau = USERS * behavior.dailyActiveRate
const dailySessions = dau * behavior.sessionsPerDay
const dailyQueries = dailySessions * behavior.queriesPerSession
const peakHourQueries = dailyQueries * behavior.peakHourFraction
const peakMinuteQueries = peakHourQueries / 60
const concurrentQueries = Math.ceil(dau * behavior.peakHourFraction * behavior.concurrentFraction)

console.log("\n📊 TRAFFIC MODEL")
console.log(`  Registered users:         ${USERS.toLocaleString()}`)
console.log(`  DAU (${(behavior.dailyActiveRate * 100)}%):             ${dau.toLocaleString()}`)
console.log(`  Daily sessions:           ${dailySessions.toLocaleString()}`)
console.log(`  Daily queries:            ${dailyQueries.toLocaleString()}`)
console.log(`  Peak hour queries:        ${peakHourQueries.toLocaleString()}`)
console.log(`  Peak minute queries:      ${peakMinuteQueries.toFixed(0)} QPM`)
console.log(`  Concurrent queries:       ${concurrentQueries}`)

// --- LLM (Groq) ---
const dailyTokensRewrite = dailyQueries * MEASURED.tokensPerQueryRewrite
const dailyTokensAnswer = dailyQueries * MEASURED.tokensPerQueryAnswer
const dailyTokensTotal = dailyTokensRewrite + dailyTokensAnswer
const peakMinuteTokens = (peakMinuteQueries * (MEASURED.tokensPerQueryRewrite + MEASURED.tokensPerQueryAnswer))

// Groq pricing (as of 2026): 8B = $0.05/1M input, $0.08/1M output; 70B = $0.59/1M input, $0.79/1M output
const groqCost8B = dailyQueries * (500 * 0.05 + 300 * 0.08) / 1_000_000
const groqCost70B = dailyQueries * (2000 * 0.59 + 2000 * 0.79) / 1_000_000
const groqDailyCost = groqCost8B + groqCost70B
const groqMonthlyCost = groqDailyCost * 30

// Groq rate limits (paid): 70B = 100K TPM, 8B = 500K TPM
const groqTPM70B_needed = peakMinuteQueries * MEASURED.tokensPerQueryAnswer
const groqTPM8B_needed = peakMinuteQueries * MEASURED.tokensPerQueryRewrite
const groqTPM70B_limit = 100_000
const groqTPM8B_limit = 500_000

console.log("\n🤖 LLM (GROQ)")
console.log(`  Daily tokens (total):     ${(dailyTokensTotal / 1_000_000).toFixed(1)}M`)
console.log(`  Peak TPM (70B answer):    ${groqTPM70B_needed.toFixed(0)} (limit: ${(groqTPM70B_limit / 1000).toFixed(0)}K)`)
console.log(`  Peak TPM (8B rewrite):    ${groqTPM8B_needed.toFixed(0)} (limit: ${(groqTPM8B_limit / 1000).toFixed(0)}K)`)
console.log(`  70B TPM headroom:         ${groqTPM70B_needed <= groqTPM70B_limit ? "✅ OK" : `❌ OVER by ${((groqTPM70B_needed / groqTPM70B_limit - 1) * 100).toFixed(0)}%`}`)
console.log(`  8B TPM headroom:          ${groqTPM8B_needed <= groqTPM8B_limit ? "✅ OK" : `❌ OVER by ${((groqTPM8B_needed / groqTPM8B_limit - 1) * 100).toFixed(0)}%`}`)
console.log(`  Daily Groq cost:          $${groqDailyCost.toFixed(2)}`)
console.log(`  Monthly Groq cost:        $${groqMonthlyCost.toFixed(2)}`)

// --- Embeddings (Jina) ---
const monthlyUploads = USERS * behavior.uploadsPerUserMonth
const monthlyNewChunks = monthlyUploads * MEASURED.avgChunksPerDoc
const monthlyEmbedTokensUpload = monthlyNewChunks * MEASURED.avgEmbeddingTokensPerChunk
const monthlyEmbedTokensQuery = dailyQueries * 30 * MEASURED.embeddingTokensPerQuery
const monthlyEmbedTokensTotal = monthlyEmbedTokensUpload + monthlyEmbedTokensQuery

// Jina v4 pricing: $0.02 per 1M tokens (as of 2026)
const jinaMonthlyCost = (monthlyEmbedTokensTotal / 1_000_000) * 0.02

// Jina rate limits (paid): 500 RPM, 2M TPM
const peakEmbedRPM = peakMinuteQueries // 1 embed call per query
const peakEmbedTPM = peakMinuteQueries * MEASURED.embeddingTokensPerQuery

console.log("\n🔍 EMBEDDINGS (JINA v4)")
console.log(`  Monthly uploads:          ${monthlyUploads.toLocaleString()} docs`)
console.log(`  Monthly new chunks:       ${monthlyNewChunks.toLocaleString()}`)
console.log(`  Monthly embed tokens:     ${(monthlyEmbedTokensTotal / 1_000_000).toFixed(1)}M`)
console.log(`  Peak RPM:                 ${peakEmbedRPM.toFixed(0)} (limit: 500)`)
console.log(`  Peak TPM:                 ${peakEmbedTPM.toFixed(0)} (limit: 2M)`)
console.log(`  Monthly Jina cost:        $${jinaMonthlyCost.toFixed(2)}`)

// --- PostgreSQL ---
const totalDocs = USERS * behavior.docsPerUser
const totalChunks = totalDocs * MEASURED.avgChunksPerDoc
const pgDataGB = (totalChunks * MEASURED.pgBytesPerChunk) / (1024 ** 3)
// HNSW index = ~2x vector data (512-dim float32 = 2048 bytes per vector)
const hnswIndexGB = (totalChunks * 2048 * 2) / (1024 ** 3)
// tsvector GIN index = ~30% of text data
const ftsIndexGB = (totalChunks * 4096 * 0.3) / (1024 ** 3)
const totalPgGB = pgDataGB + hnswIndexGB + ftsIndexGB

// PG connections needed: concurrent queries * 2 (query + pipeline)
const pgConnectionsNeeded = concurrentQueries * 2
// shared_buffers should be ~25% of RAM dedicated to PG
const pgSharedBuffersMB = Math.ceil(totalPgGB * 1024 * 0.25) // 25% of data in memory

console.log("\n🗄️  POSTGRESQL")
console.log(`  Total documents:          ${totalDocs.toLocaleString()}`)
console.log(`  Total chunks:             ${totalChunks.toLocaleString()}`)
console.log(`  Data size:                ${pgDataGB.toFixed(1)} GB`)
console.log(`  HNSW index size:          ${hnswIndexGB.toFixed(1)} GB`)
console.log(`  FTS index size:           ${ftsIndexGB.toFixed(1)} GB`)
console.log(`  Total PG storage:         ${totalPgGB.toFixed(1)} GB`)
console.log(`  PG connections needed:    ${pgConnectionsNeeded} (current: 10)`)
console.log(`  shared_buffers:           ${pgSharedBuffersMB} MB`)

// --- R2 Storage ---
const totalR2GB = (totalDocs * MEASURED.avgDocSizeMB) / 1024
// CF R2: $0.015/GB/month (storage) + $0.36/million Class A + $0.036/million Class B
const r2MonthlyCost = totalR2GB * 0.015

console.log("\n☁️  R2 STORAGE")
console.log(`  Total files:              ${totalDocs.toLocaleString()}`)
console.log(`  Total storage:            ${totalR2GB.toFixed(0)} GB`)
console.log(`  Monthly R2 cost:          $${r2MonthlyCost.toFixed(2)}`)

// --- RAM Requirements ---
// App (Bun): base 80MB + 2MB per concurrent request
const appRAM = 80 + concurrentQueries * 2
// PG: shared_buffers + work_mem per connection
const pgRAM = Math.max(pgSharedBuffersMB, 512) + pgConnectionsNeeded * 32
// Redis: base 64MB + cached embeddings
const redisRAM = 64 + Math.min(200, totalChunks * 0.001) // ~1KB per cached entry, cap 200MB
// Docling: ML model in memory
const doclingRAM = 1536
// NLI sidecar: ML model
const nliRAM = 1536
// Caddy: minimal
const caddyRAM = 64
// Netdata: monitoring
const netdataRAM = 128
const totalRAM = appRAM + pgRAM + redisRAM + doclingRAM + nliRAM + caddyRAM + netdataRAM

console.log("\n🧠 RAM REQUIREMENTS")
console.log(`  App (Bun):                ${appRAM} MB`)
console.log(`  PostgreSQL:               ${pgRAM} MB`)
console.log(`  Redis:                    ${redisRAM.toFixed(0)} MB`)
console.log(`  Docling:                  ${doclingRAM} MB`)
console.log(`  NLI Sidecar:              ${nliRAM} MB`)
console.log(`  Caddy + Netdata:          ${caddyRAM + netdataRAM} MB`)
console.log(`  ─────────────────────────────────`)
console.log(`  TOTAL RAM NEEDED:         ${totalRAM.toFixed(0)} MB (${(totalRAM / 1024).toFixed(1)} GB)`)
console.log(`  Current server:           ${MEASURED.currentRAM_MB} MB (${(MEASURED.currentRAM_MB / 1024).toFixed(0)} GB)`)
console.log(`  Verdict:                  ${totalRAM <= MEASURED.currentRAM_MB ? "✅ Fits" : `❌ Need ${Math.ceil(totalRAM / 1024)} GB`}`)

// --- CPU ---
// Each query: ~50ms CPU (DB + routing), rest is waiting for Groq/Jina
// Pipeline: Docling = CPU-heavy (single-threaded Python)
const queryCPU_perSec = (peakMinuteQueries / 60) * 0.05 // 50ms per query
const pipelineCPU = 0.5 // Docling uses ~50% of 1 core when active
const totalCPU = queryCPU_perSec + pipelineCPU + 0.2 // +0.2 for OS/monitoring
const cpuCoresNeeded = Math.ceil(totalCPU * 1.5) // 1.5x headroom

console.log("\n⚡ CPU")
console.log(`  Query CPU load:           ${(queryCPU_perSec * 100).toFixed(1)}% of 1 core`)
console.log(`  Pipeline CPU (Docling):   ${(pipelineCPU * 100).toFixed(0)}% of 1 core`)
console.log(`  Total CPU load:           ${(totalCPU * 100).toFixed(0)}% of 1 core`)
console.log(`  Cores needed (1.5x):      ${cpuCoresNeeded}`)
console.log(`  Current server:           ${MEASURED.currentCPU} ARM vCPU`)

// --- Disk ---
const diskNeeded = totalPgGB + 5 // +5GB for OS, logs, docker images
console.log("\n💾 DISK")
console.log(`  PG data + indexes:        ${totalPgGB.toFixed(1)} GB`)
console.log(`  OS + Docker + Logs:       ~5 GB`)
console.log(`  Total needed:             ${diskNeeded.toFixed(0)} GB`)
console.log(`  Current server:           ${MEASURED.currentDiskGB} GB`)
console.log(`  Verdict:                  ${diskNeeded <= MEASURED.currentDiskGB ? "✅ Fits" : `❌ Need ${Math.ceil(diskNeeded)} GB`}`)

// --- Pipeline throughput ---
const dailyUploads = monthlyUploads / 30
const peakHourUploads = dailyUploads * behavior.peakHourFraction
const avgPipelineSec = (MEASURED.pipelineTimeTxtSec + MEASURED.pipelineTimePdfSec) / 2
// Max pipeline throughput (1 Docling worker)
const maxPipelinePerHour = 3600 / avgPipelineSec

console.log("\n📥 PIPELINE THROUGHPUT")
console.log(`  Daily uploads:            ${dailyUploads.toFixed(0)}`)
console.log(`  Peak hour uploads:        ${peakHourUploads.toFixed(0)}`)
console.log(`  Max pipeline/hour (1w):   ${maxPipelinePerHour.toFixed(0)}`)
console.log(`  Verdict:                  ${peakHourUploads <= maxPipelinePerHour ? "✅ 1 worker enough" : `❌ Need ${Math.ceil(peakHourUploads / maxPipelinePerHour)} workers`}`)

// =============================================================================
// RECOMMENDED INFRASTRUCTURE
// =============================================================================

console.log("\n" + "=".repeat(70))
console.log(" RECOMMENDED INFRASTRUCTURE FOR 10,000 USERS")
console.log("=".repeat(70))

// Hetzner pricing (Helsinki, ARM)
const hetznerOptions = [
  { name: "CAX11", cpu: 2, ram: 4, disk: 40, cost: 3.99 },
  { name: "CAX21", cpu: 4, ram: 8, disk: 80, cost: 7.49 },
  { name: "CAX31", cpu: 8, ram: 16, disk: 160, cost: 14.99 },
  { name: "CAX41", cpu: 16, ram: 32, disk: 320, cost: 29.99 },
]

const recommended = hetznerOptions.find(h =>
  h.ram * 1024 >= totalRAM && h.cpu >= cpuCoresNeeded && h.disk >= diskNeeded
) || hetznerOptions[hetznerOptions.length - 1]

const ipv4Cost = 0.73
const totalServerCost = recommended.cost + ipv4Cost

console.log(`\n  Server:    Hetzner ${recommended.name}`)
console.log(`             ${recommended.cpu} ARM vCPU / ${recommended.ram} GB RAM / ${recommended.disk} GB NVMe`)
console.log(`             €${recommended.cost}/mo + €${ipv4Cost} IPv4 = €${totalServerCost.toFixed(2)}/mo`)

console.log(`\n  Groq:      $${groqMonthlyCost.toFixed(2)}/mo (paid tier, 70B + 8B)`)
console.log(`  Jina:      $${jinaMonthlyCost.toFixed(2)}/mo (embedding API)`)
console.log(`  R2:        $${r2MonthlyCost.toFixed(2)}/mo (file storage)`)
console.log(`  CF Pages:  $0/mo (free tier, static frontend)`)

const totalMonthlyCostEUR = totalServerCost
const totalMonthlyCostUSD = groqMonthlyCost + jinaMonthlyCost + r2MonthlyCost
const totalMonthly = totalMonthlyCostEUR * 1.08 + totalMonthlyCostUSD // EUR→USD rough

console.log(`\n  ─────────────────────────────────────────`)
console.log(`  TOTAL:     ~$${totalMonthly.toFixed(0)}/mo`)
console.log(`             (€${totalServerCost.toFixed(2)} server + $${totalMonthlyCostUSD.toFixed(2)} APIs)`)

// --- Cost per user ---
const costPerUser = totalMonthly / USERS
const costPer1000 = totalMonthly / (USERS / 1000)

console.log(`\n  Cost per user:     $${costPerUser.toFixed(4)}/mo`)
console.log(`  Cost per 1K users: $${costPer1000.toFixed(2)}/mo`)

// --- Revenue model ---
console.log("\n" + "=".repeat(70))
console.log(" REVENUE vs COST (at 10K users)")
console.log("=".repeat(70))

const tiers = [
  { name: "Free",    price: 0,  pct: 0.70 },
  { name: "Starter", price: 9,  pct: 0.20 },
  { name: "Pro",     price: 29, pct: 0.08 },
  { name: "Team",    price: 79, pct: 0.02 },
]

let monthlyRevenue = 0
console.log("\n  Tier distribution (assumption):")
for (const t of tiers) {
  const users = Math.round(USERS * t.pct)
  const rev = users * t.price
  monthlyRevenue += rev
  console.log(`    ${t.name.padEnd(8)} ${(t.pct * 100).toFixed(0).padStart(3)}% = ${users.toLocaleString().padStart(6)} users × $${t.price.toString().padStart(2)} = $${rev.toLocaleString().padStart(8)}/mo`)
}

console.log(`\n  Monthly revenue:   $${monthlyRevenue.toLocaleString()}/mo`)
console.log(`  Monthly cost:      $${totalMonthly.toFixed(0)}/mo`)
console.log(`  Margin:            $${(monthlyRevenue - totalMonthly).toFixed(0)}/mo (${((1 - totalMonthly / monthlyRevenue) * 100).toFixed(0)}%)`)

// --- Scaling milestones ---
console.log("\n" + "=".repeat(70))
console.log(" SCALING MILESTONES")
console.log("=".repeat(70))

const milestones = [
  { users: 50,     server: "CAX11 (current)", groq: "Free tier", cost: "€5/mo" },
  { users: 100,    server: "CAX11 (current)", groq: "Free tier (tight)", cost: "€5/mo" },
  { users: 500,    server: "CAX21 (8GB)", groq: "Paid ($5-10/mo)", cost: "~$20/mo" },
  { users: 1000,   server: "CAX21 (8GB)", groq: "Paid ($15-20/mo)", cost: "~$30/mo" },
  { users: 5000,   server: "CAX31 (16GB)", groq: "Paid ($50-80/mo)", cost: "~$100/mo" },
  { users: 10000,  server: `${recommended.name} (${recommended.ram}GB)`, groq: `Paid ($${groqMonthlyCost.toFixed(0)}/mo)`, cost: `~$${totalMonthly.toFixed(0)}/mo` },
  { users: 50000,  server: "2× CAX41 + managed PG", groq: "Dedicated ($500+/mo)", cost: "~$700-1000/mo" },
]

console.log("")
for (const m of milestones) {
  console.log(`  ${m.users.toLocaleString().padStart(7)} users → ${m.server.padEnd(30)} ${m.groq.padEnd(25)} ${m.cost}`)
}

console.log("\n" + "=".repeat(70))
console.log(" KEY BOTTLENECK ORDER (what breaks first as users grow)")
console.log("=".repeat(70))
console.log(`
  1. Groq TPM limits         → solved by paid tier ($0.59-0.79/M tokens)
  2. RAM (4GB over-committed) → solved by CAX21 (8GB, +€3/mo)
  3. Docling single-thread    → solved by 2nd worker or queue priority
  4. PG connections (10)      → solved by pool increase (pgbouncer at 5K+)
  5. HNSW index in memory     → solved by more RAM or IVFFlat at 1M+ chunks
  6. Single server SPOF       → solved by replica + load balancer at 10K+
`)
