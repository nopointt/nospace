/**
 * A/B strategy comparison using the Wilcoxon signed-rank test.
 *
 * Takes per-query or per-chunk metric scores for two strategies, runs a
 * paired Wilcoxon signed-rank test, and returns the comparison result.
 *
 * The Wilcoxon test is appropriate here because:
 *   - We have paired observations (same queries measured under both strategies).
 *   - We cannot assume normal distribution of differences.
 *   - n is typically small (10–200 eval pairs).
 *
 * Implementation is from scratch — no external stats library required.
 *
 * Algorithm (two-sided):
 *   1. Compute differences d_i = b_i − a_i for each pair.
 *   2. Remove pairs where d_i = 0 (ties).
 *   3. Rank |d_i| in ascending order (average ranks for ties).
 *   4. W+ = sum of ranks where d_i > 0.
 *   5. W− = sum of ranks where d_i < 0.
 *   6. W  = min(W+, W−).
 *   7. For n ≤ 10: exact critical value lookup.
 *      For n > 10: normal approximation with continuity correction.
 *
 * References:
 *   Wilcoxon (1945), "Individual Comparisons by Ranking Methods"
 *   Zar (2010), Biostatistical Analysis §8.
 */

import type { MetricResult, ComparisonResult } from "./types"

// ─── Exact critical values for W (n ≤ 10, α=0.05, two-sided) ────────────────
// W_crit[n] is the largest W statistic that achieves p ≤ 0.05.
// n=1..4 are always non-significant (too few pairs).
const W_CRIT_EXACT: Record<number, number> = {
  5: 0,
  6: 2,
  7: 3,
  8: 5,
  9: 8,
  10: 10,
}

// ─── Rank assignment ─────────────────────────────────────────────────────────

/**
 * Assign ranks to absolute differences, averaging ties.
 * Input is already sorted ascending.
 *
 * @param absDiffs - Absolute differences |d_i|, sorted ascending.
 * @returns Rank for each input position (1-based, averaged for ties).
 */
function assignRanks(absDiffs: number[]): number[] {
  const ranks = new Array<number>(absDiffs.length)
  let i = 0

  while (i < absDiffs.length) {
    let j = i
    // Find extent of tie group
    while (j < absDiffs.length && absDiffs[j] === absDiffs[i]) j++
    // Average rank for the group: (i+1 + j) / 2  (1-based)
    const avgRank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank
    }
    i = j
  }

  return ranks
}

// ─── Normal approximation p-value ─────────────────────────────────────────────

/**
 * Approximate two-sided p-value for W statistic via normal distribution.
 * Uses Wald continuity correction.
 *
 * μ_W = n(n+1)/4
 * σ_W = sqrt(n(n+1)(2n+1)/24)
 * z = (W + 0.5 − μ) / σ   (continuity correction)
 * p = 2 * (1 − Φ(|z|))
 *
 * Φ is approximated using the Hart/Abramowitz formula (accurate to ~10^-7).
 */
function wilcoxonPValueNormal(W: number, n: number): number {
  const mu = (n * (n + 1)) / 4
  const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)

  if (sigma === 0) return 1

  // Continuity correction: move W toward mu by 0.5
  const Wadj = W < mu ? W + 0.5 : W - 0.5
  const z = Math.abs((Wadj - mu) / sigma)

  // Φ(z) via rational approximation (Abramowitz & Stegun 26.2.17)
  const t = 1 / (1 + 0.2316419 * z)
  const poly =
    t * (0.319381530 +
      t * (-0.356563782 +
        t * (1.781477937 +
          t * (-1.821255978 +
            t * 1.330274429))))
  const phi = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly

  // Two-sided p-value
  return 2 * (1 - phi)
}

// ─── Wilcoxon signed-rank test ────────────────────────────────────────────────

/**
 * Run a two-sided Wilcoxon signed-rank test on paired observations.
 *
 * @param valuesA - Per-observation scores for strategy A.
 * @param valuesB - Per-observation scores for strategy B (same length as A).
 * @returns { W, pValue } where W = min(W+, W−) and pValue is two-sided.
 */
export function wilcoxonTest(
  valuesA: number[],
  valuesB: number[],
): { W: number; pValue: number } {
  if (valuesA.length !== valuesB.length) {
    throw new Error(
      `wilcoxonTest: arrays must have the same length (got ${valuesA.length} vs ${valuesB.length})`,
    )
  }

  // 1. Compute differences
  const diffs = valuesA.map((a, i) => valuesB[i]! - a)

  // 2. Remove zeros (ties in the difference)
  const nonZero = diffs.filter((d) => d !== 0)
  const n = nonZero.length

  // All tied → no information, return p=1
  if (n === 0) return { W: 0, pValue: 1 }

  // 3. Sort by |d| for rank assignment
  const indexed = nonZero.map((d, i) => ({ d, absD: Math.abs(d), orig: i }))
  indexed.sort((a, b) => a.absD - b.absD)

  const sortedAbsDiffs = indexed.map((x) => x.absD)
  const ranks = assignRanks(sortedAbsDiffs)

  // 4. Sum positive / negative ranks
  let Wplus = 0
  let Wminus = 0
  for (let i = 0; i < indexed.length; i++) {
    if (indexed[i]!.d > 0) {
      Wplus += ranks[i]!
    } else {
      Wminus += ranks[i]!
    }
  }

  const W = Math.min(Wplus, Wminus)

  // 5. Compute p-value
  let pValue: number

  if (n <= 10) {
    // Exact test: compare W against critical value table
    const crit = W_CRIT_EXACT[n]
    if (crit === undefined) {
      // n < 5: always non-significant
      pValue = 1
    } else {
      // p ≤ 0.05 iff W ≤ critical value
      pValue = W <= crit ? 0.05 : 1
    }
  } else {
    // Normal approximation
    pValue = wilcoxonPValueNormal(W, n)
  }

  return { W, pValue }
}

// ─── Median ───────────────────────────────────────────────────────────────────

/**
 * Compute the median of an array of numbers.
 * Returns 0 for empty arrays.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

// ─── Public comparison API ────────────────────────────────────────────────────

/**
 * Compare two strategies on a single metric using the Wilcoxon signed-rank test.
 *
 * @param metricName - Name of the metric being compared.
 * @param scoresA    - Per-query/per-chunk scores for strategy A.
 * @param scoresB    - Per-query/per-chunk scores for strategy B.
 */
export function compareMetric(
  metricName: string,
  scoresA: number[],
  scoresB: number[],
): ComparisonResult {
  if (scoresA.length !== scoresB.length) {
    throw new Error(
      `compareMetric(${metricName}): score arrays must be same length ` +
      `(got ${scoresA.length} vs ${scoresB.length})`,
    )
  }

  const medianA = median(scoresA)
  const medianB = median(scoresB)
  const medianDiff = medianB - medianA

  const { pValue } = wilcoxonTest(scoresA, scoresB)

  return {
    metricName,
    medianA,
    medianB,
    medianDiff,
    pValue,
    significant: pValue < 0.05,
  }
}

/**
 * Compare two strategies across multiple metrics.
 *
 * @param metricsA - Array of MetricResult from strategy A (details contain per-item scores).
 * @param metricsB - Array of MetricResult from strategy B (same metrics in same order).
 */
export function compareStrategies(
  metricsA: MetricResult[],
  metricsB: MetricResult[],
): ComparisonResult[] {
  if (metricsA.length !== metricsB.length) {
    throw new Error(
      `compareStrategies: metric arrays must be same length ` +
      `(got ${metricsA.length} vs ${metricsB.length})`,
    )
  }

  const results: ComparisonResult[] = []

  for (let i = 0; i < metricsA.length; i++) {
    const mA = metricsA[i]!
    const mB = metricsB[i]!

    if (!mA.details || !mB.details) {
      // No per-item breakdown — skip paired test, report aggregate difference only
      results.push({
        metricName: mA.name,
        medianA: mA.value,
        medianB: mB.value,
        medianDiff: mB.value - mA.value,
        pValue: 1,
        significant: false,
      })
      continue
    }

    // Align per-item scores by shared keys
    const keysA = Object.keys(mA.details)
    const keysB = new Set(Object.keys(mB.details))
    const sharedKeys = keysA.filter((k) => keysB.has(k))

    if (sharedKeys.length === 0) {
      results.push({
        metricName: mA.name,
        medianA: mA.value,
        medianB: mB.value,
        medianDiff: mB.value - mA.value,
        pValue: 1,
        significant: false,
      })
      continue
    }

    const scoresA = sharedKeys.map((k) => mA.details![k]!)
    const scoresB = sharedKeys.map((k) => mB.details![k]!)

    results.push(compareMetric(mA.name, scoresA, scoresB))
  }

  return results
}
