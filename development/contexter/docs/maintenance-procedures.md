# Contexter — Maintenance Procedures

## 1. Golden Test Set Growth (#23)

**Goal:** 100 reviewed QA pairs within first month of production.

**Current state:** 10 manual + 15 synthetic = 25 pairs. 17 chunking eval pairs.

### Add pairs from user feedback

When a user reports a bad answer (thumbs-down or support email):
1. Record the query and expected answer
2. Create `evaluation/golden/manual/g-XXX.json`:
```json
{
  "id": "g-XXX",
  "question": "user's query",
  "expected_answer": "correct answer based on their documents",
  "expected_sources": ["relevant passage excerpt"],
  "tags": ["user-reported", "domain"],
  "added_by": "axis",
  "added_at": "2026-MM-DD",
  "reviewed": true
}
```
3. Update `evaluation/golden/index.json` pairs array
4. Run canary to verify: `bun run evaluation/canary.ts --api-url https://api.contexter.cc --token $TOKEN`

### Generate synthetic pairs (batch)

```bash
GROQ_API_KEY=$(cat ~/.tLOS/groq-key) \
bun run evaluation/generate-synthetic.ts \
  --api-url https://api.contexter.cc \
  --token $TOKEN \
  --count 20
```

Review generated pairs: set `reviewed: true` on good ones, delete bad ones.

### Check for stale pairs

```bash
bun run evaluation/check-stale.ts \
  --api-url https://api.contexter.cc \
  --token $TOKEN
```

Flags pairs where the source document has been re-indexed and the expected answer may be outdated.

### Run full evaluation

```bash
GROQ_API_KEY=$(cat ~/.tLOS/groq-key) \
bun run evaluation/run-eval.ts \
  --api-url https://api.contexter.cc \
  --token $TOKEN
```

Results saved to `evaluation/results/eval-{timestamp}.json`.
Thresholds: faithfulness ≥ 0.70, relevancy ≥ 0.65.

---

## 2. Monthly Load Test (#24)

**Goal:** Track performance trends, detect degradation before users notice.

### Run baseline comparison

```bash
# Scenario 1: Query load (4.5 min)
k6 run --env API_TOKEN=$TOKEN k6/scenario-1-queries.js

# Scenario 3: Mixed workload (4 min)
k6 run --env API_TOKEN=$TOKEN k6/scenario-3-mixed.js

# Smoke (30 sec — quick sanity)
k6 run --env API_TOKEN=$TOKEN k6/smoke.js
```

### Compare with baseline

Baseline (2026-03-30): `k6/BASELINE-2026-03-30.md`

| Metric | Baseline | This month | Trend |
|---|---|---|---|
| Query p95 (smoke) | 6.81s | ? | |
| Query p95 (load, 20 VU) | 23.88s | ? | |
| Error rate (load) | 84.55% (rate limits) | ? | |
| Document list avg | 223ms | ? | |

If query latency increases >20% from baseline → investigate (model change? data growth? API limits?).

### Setup (first time only)

```bash
# Register test user
node k6/setup.js

# Token saved in k6/k6-env.json
```

---

## 3. Automated Processes (already running)

| Process | Schedule | Script |
|---|---|---|
| PG backup → R2 | Daily 3:00 UTC | `/opt/contexter/backup.sh` |
| Health check → Telegram | Every 5 min | `/opt/contexter/health-check.sh` |
| WAL archive → R2 | Hourly | `/opt/contexter/wal-upload.sh` |
| Drift detection | Weekly Monday 3:00 UTC | BullMQ maintenance queue |
| Eval metrics aggregation | Daily 2:00 UTC | BullMQ maintenance queue |
