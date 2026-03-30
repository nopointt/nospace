// DeepInfra pricing: Llama 3.1 70B = $0.23/M input + $0.40/M output
// DeepInfra pricing: Llama 3.1 8B  = $0.03/M input + $0.05/M output
// No TPM limits (serverless, auto-scale)

const USERS = 10_000
const dau = USERS * 0.15
const dailyQueries = dau * 1.5 * 8 // 18,000

// Per query: 8B rewrite (500 in + 300 out) + 70B answer (2000 in + 2000 out)
const daily8B_input = dailyQueries * 500
const daily8B_output = dailyQueries * 300
const daily70B_input = dailyQueries * 2000
const daily70B_output = dailyQueries * 2000

const cost8B = (daily8B_input * 0.03 + daily8B_output * 0.05) / 1_000_000
const cost70B = (daily70B_input * 0.23 + daily70B_output * 0.40) / 1_000_000
const dailyCost = cost8B + cost70B
const monthlyCost = dailyCost * 30

// Groq for comparison
const groq8B = (daily8B_input * 0.05 + daily8B_output * 0.08) / 1_000_000
const groq70B = (daily70B_input * 0.59 + daily70B_output * 0.79) / 1_000_000
const groqDaily = groq8B + groq70B
const groqMonthly = groqDaily * 30

const serverEUR = 30.72
const serverUSD = serverEUR * 1.08
const jina = 10.54
const r2 = 5.86

const totalDeepInfra = monthlyCost + serverUSD + jina + r2
const totalGroq = groqMonthly + serverUSD + jina + r2

console.log("=".repeat(60))
console.log(" DEEPINFRA vs GROQ — 10,000 USERS")
console.log("=".repeat(60))
console.log()
console.log("                    DeepInfra        Groq")
console.log("-".repeat(60))
console.log(`  8B daily:         $${cost8B.toFixed(2).padStart(8)}       $${groq8B.toFixed(2).padStart(8)}`)
console.log(`  70B daily:        $${cost70B.toFixed(2).padStart(8)}       $${groq70B.toFixed(2).padStart(8)}`)
console.log(`  LLM daily:        $${dailyCost.toFixed(2).padStart(8)}       $${groqDaily.toFixed(2).padStart(8)}`)
console.log(`  LLM monthly:      $${monthlyCost.toFixed(0).padStart(8)}       $${groqMonthly.toFixed(0).padStart(8)}`)
console.log("-".repeat(60))
console.log(`  Server (CAX41):   $${serverUSD.toFixed(0).padStart(8)}       $${serverUSD.toFixed(0).padStart(8)}`)
console.log(`  Jina:             $${jina.toFixed(0).padStart(8)}       $${jina.toFixed(0).padStart(8)}`)
console.log(`  R2:               $${r2.toFixed(0).padStart(8)}       $${r2.toFixed(0).padStart(8)}`)
console.log("-".repeat(60))
console.log(`  TOTAL monthly:    $${totalDeepInfra.toFixed(0).padStart(8)}       $${totalGroq.toFixed(0).padStart(8)}`)
const savingsPct = ((1 - totalDeepInfra / totalGroq) * 100).toFixed(0)
console.log(`  Savings:          $${(totalGroq - totalDeepInfra).toFixed(0)}/mo (${savingsPct}% cheaper)`)
console.log()
console.log(`  Cost per user:    $${(totalDeepInfra / USERS).toFixed(3)}/mo     $${(totalGroq / USERS).toFixed(3)}/mo`)
console.log()
console.log("  TPM limits:       None (serverless)  100K (70B)")
console.log("  Latency:          ~2-4s              ~1-3s (faster)")
console.log()

// Revenue
const revenue = 2000 * 9 + 800 * 29 + 200 * 79
console.log("=".repeat(60))
console.log(" UNIT ECONOMICS (DeepInfra)")
console.log("=".repeat(60))
const margin = revenue - totalDeepInfra
const marginPct = ((1 - totalDeepInfra / revenue) * 100).toFixed(0)
console.log(`  Revenue:          $${revenue.toLocaleString()}/mo`)
console.log(`  Cost:             $${totalDeepInfra.toFixed(0)}/mo`)
console.log(`  Margin:           $${margin.toFixed(0)}/mo (${marginPct}%)`)
console.log(`  Cost/revenue:     ${(totalDeepInfra / revenue * 100).toFixed(1)}%`)
console.log()

// Scaling table
console.log("=".repeat(60))
console.log(" DEEPINFRA COST BY SCALE")
console.log("=".repeat(60))
const scales = [50, 100, 500, 1000, 5000, 10000, 50000]
console.log("  Users    DAU    Daily Q    LLM/mo    Total/mo   per user")
console.log("-".repeat(60))
for (const u of scales) {
  const d = u * 0.15
  const q = d * 1.5 * 8
  const llm =
    ((q * 500 * 0.03 + q * 300 * 0.05 + q * 2000 * 0.23 + q * 2000 * 0.40) / 1_000_000) * 30
  const srv = u <= 100 ? 5 : u <= 1000 ? 8 : u <= 5000 ? 16 : u <= 10000 ? 33 : 70
  const total = llm + srv + jina * (u / 10000) + r2 * (u / 10000)
  console.log(
    `  ${u.toString().padStart(6)}  ${d.toFixed(0).padStart(5)}   ${q.toFixed(0).padStart(7)}   $${llm.toFixed(0).padStart(6)}    $${total.toFixed(0).padStart(6)}    $${(total / u).toFixed(3)}`
  )
}
console.log()
console.log("=".repeat(60))
console.log(" DEEPINFRA ADVANTAGE")
console.log("=".repeat(60))
console.log(`
  1. No TPM limits — serverless auto-scale, no 429 errors
  2. 60% cheaper than Groq for 70B
  3. Provider chain preserved: Groq (free, fast) → DeepInfra (paid, no limits)
  4. OpenAI-compatible API — zero code changes (already implemented)
  5. Latency trade-off: ~2-4s vs Groq ~1-3s (acceptable for RAG)
`)
