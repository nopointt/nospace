import type { Sql } from "postgres"

// F-033: embedding drift detection — weekly BullMQ job
// Johnson-Lindenstrauss sketch (512d→32d) + Maximum Mean Discrepancy

const SAMPLE_SIZE = 500
const PROJECTION_DIMS = 32
const EMBEDDING_DIMS = 512
const BASELINE_TTL_DAYS = 30
const SIGMA = 1.0 // Gaussian kernel bandwidth

/** Parse a pgvector string "[0.1,0.2,...]" into a Float64Array */
function parseEmbedding(raw: string): Float64Array {
  const inner = raw.startsWith("[") ? raw.slice(1, -1) : raw
  const parts = inner.split(",")
  const out = new Float64Array(EMBEDDING_DIMS)
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    out[i] = parseFloat(parts[i] ?? "0")
  }
  return out
}

/**
 * Generate a 32×512 random projection matrix of unit vectors.
 * Uses a seeded-ish approach: generate Gaussian randoms via Box-Muller,
 * then normalize each row to unit length.
 */
function buildProjectionMatrix(): Float64Array[] {
  const rows: Float64Array[] = []
  for (let r = 0; r < PROJECTION_DIMS; r++) {
    const row = new Float64Array(EMBEDDING_DIMS)
    for (let i = 0; i < EMBEDDING_DIMS; i += 2) {
      // Box-Muller transform for Gaussian random
      const u1 = Math.random()
      const u2 = Math.random()
      const mag = Math.sqrt(-2 * Math.log(u1 + 1e-12))
      row[i] = mag * Math.cos(2 * Math.PI * u2)
      if (i + 1 < EMBEDDING_DIMS) {
        row[i + 1] = mag * Math.sin(2 * Math.PI * u2)
      }
    }
    // Normalize to unit vector
    let norm = 0
    for (let i = 0; i < EMBEDDING_DIMS; i++) norm += row[i]! * row[i]!
    norm = Math.sqrt(norm)
    if (norm > 0) for (let i = 0; i < EMBEDDING_DIMS; i++) row[i]! /= norm
    rows.push(row)
  }
  return rows
}

/** Project a single 512d vector to 32d using the projection matrix */
function projectVector(vec: Float64Array, matrix: Float64Array[]): Float64Array {
  const out = new Float64Array(PROJECTION_DIMS)
  for (let r = 0; r < PROJECTION_DIMS; r++) {
    let dot = 0
    const row = matrix[r]!
    for (let i = 0; i < EMBEDDING_DIMS; i++) dot += row[i]! * vec[i]!
    out[r] = dot
  }
  return out
}

/** Gaussian kernel k(x, y) = exp(-||x-y||² / (2σ²)) */
function gaussianKernel(x: Float64Array, y: Float64Array): number {
  let sq = 0
  for (let i = 0; i < x.length; i++) {
    const d = x[i]! - y[i]!
    sq += d * d
  }
  return Math.exp(-sq / (2 * SIGMA * SIGMA))
}

/**
 * MMD² = mean_k(X,X) - 2*mean_k(X,Y) + mean_k(Y,Y)
 * Unbiased U-statistic estimate: excludes diagonal terms for XX and YY.
 */
function computeMMD2(X: Float64Array[], Y: Float64Array[]): number {
  const nx = X.length
  const ny = Y.length

  let xxSum = 0
  let xxCount = 0
  for (let i = 0; i < nx; i++) {
    for (let j = i + 1; j < nx; j++) {
      xxSum += gaussianKernel(X[i]!, X[j]!)
      xxCount++
    }
  }

  let yySum = 0
  let yyCount = 0
  for (let i = 0; i < ny; i++) {
    for (let j = i + 1; j < ny; j++) {
      yySum += gaussianKernel(Y[i]!, Y[j]!)
      yyCount++
    }
  }

  let xySum = 0
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      xySum += gaussianKernel(X[i]!, Y[j]!)
    }
  }

  const xxMean = xxCount > 0 ? xxSum / xxCount : 0
  const yyMean = yyCount > 0 ? yySum / yyCount : 0
  const xyMean = nx * ny > 0 ? xySum / (nx * ny) : 0

  return xxMean - 2 * xyMean + yyMean
}

/** Fetch random sample of embeddings from chunks table */
async function fetchEmbeddingSample(sql: Sql): Promise<Float64Array[]> {
  const rows = await sql<{ embedding: string }[]>`
    SELECT embedding::text AS embedding
    FROM chunks
    WHERE embedding IS NOT NULL
    ORDER BY RANDOM()
    LIMIT ${SAMPLE_SIZE}
  `
  return rows.map((r) => parseEmbedding(r.embedding))
}

/** Load active baseline (not expired) — returns null if none exists */
async function loadBaseline(sql: Sql): Promise<{ projections: Float64Array[]; matrix: Float64Array[] } | null> {
  const rows = await sql<{ projections: unknown; projection_matrix: unknown }[]>`
    SELECT projections, projection_matrix
    FROM eval_drift_baseline
    WHERE expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `
  if (rows.length === 0) return null

  const rawP = rows[0]!.projections as number[][]
  const rawM = rows[0]!.projection_matrix as number[][] | null
  if (!rawM) return null  // baseline missing matrix — treat as absent, will recreate
  return {
    projections: rawP.map((arr) => new Float64Array(arr)),
    matrix: rawM.map((arr) => new Float64Array(arr)),
  }
}

/**
 * Create a new baseline snapshot from the current embedding corpus.
 * Called on first run and monthly refresh.
 */
export async function createBaseline(sql: Sql): Promise<void> {
  const embeddings = await fetchEmbeddingSample(sql)
  if (embeddings.length === 0) {
    console.warn(JSON.stringify({ event: "drift_baseline_skip", reason: "no_embeddings" }))
    return
  }

  const matrix = buildProjectionMatrix()
  const projections = embeddings.map((e) => Array.from(projectVector(e, matrix)))

  const expiresAt = new Date()
  expiresAt.setUTCDate(expiresAt.getUTCDate() + BASELINE_TTL_DAYS)

  const id = crypto.randomUUID()
  await sql`
    INSERT INTO eval_drift_baseline (id, sample_size, projection_dims, projections, projection_matrix, expires_at)
    VALUES (
      ${id},
      ${embeddings.length},
      ${PROJECTION_DIMS},
      ${JSON.stringify(projections)}::jsonb,
      ${JSON.stringify(matrix.map((r) => Array.from(r)))}::jsonb,
      ${expiresAt.toISOString()}
    )
  `

  console.log(JSON.stringify({
    event: "drift_baseline_created",
    id,
    sampleSize: embeddings.length,
    expiresAt: expiresAt.toISOString(),
  }))
}

/**
 * Run weekly drift check.
 * Fetches current sample, projects to 32d, computes MMD² vs baseline.
 * Creates baseline if none exists.
 */
export async function runDriftCheck(sql: Sql): Promise<void> {
  const threshold = parseFloat(process.env.DRIFT_MMD_THRESHOLD ?? "0.05")

  const embeddings = await fetchEmbeddingSample(sql)
  if (embeddings.length === 0) {
    console.warn(JSON.stringify({ event: "drift_check_skip", reason: "no_embeddings" }))
    return
  }

  let baselineData = await loadBaseline(sql)
  if (!baselineData) {
    console.log(JSON.stringify({ event: "drift_no_baseline", action: "creating_baseline" }))
    await createBaseline(sql)
    // First run — no comparison possible yet, insert a neutral record
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO eval_drift_checks (
        id, sample_size, mmd_score, mmd_threshold, drift_detected, projection_dims, notes
      ) VALUES (
        ${id}, ${embeddings.length}, ${0.0}, ${threshold}, ${false}, ${PROJECTION_DIMS},
        ${"baseline_created_this_run"}
      )
    `
    return
  }

  // Reuse the stored projection matrix from baseline — MUST be the same space
  const current = embeddings.map((e) => projectVector(e, baselineData.matrix))

  const mmd2 = computeMMD2(current, baselineData.projections)
  const driftDetected = mmd2 > threshold

  const id = crypto.randomUUID()
  await sql`
    INSERT INTO eval_drift_checks (
      id, sample_size, mmd_score, mmd_threshold, drift_detected, projection_dims
    ) VALUES (
      ${id}, ${embeddings.length}, ${mmd2}, ${threshold}, ${driftDetected}, ${PROJECTION_DIMS}
    )
  `

  console.log(JSON.stringify({
    event: "drift_check_complete",
    id,
    sampleSize: embeddings.length,
    mmdScore: mmd2,
    threshold,
    driftDetected,
  }))

  if (driftDetected) {
    console.error(JSON.stringify({
      event: "drift_alert",
      mmdScore: mmd2,
      threshold,
      message: "Embedding distribution drift detected — review recent ingestion pipeline",
    }))
  }
}
