// Provizor — RAG Benchmarks (Red/Yellow/Green zones)
// Source: DEEP-0 Section 6E — KZ 5-pharmacy chain, Almaty, OTC-heavy

export type RAGLevel = 'red' | 'yellow' | 'green';

export interface Benchmark {
  label: string;
  unit: string;
  red: { max: number };
  yellow: { min: number; max: number };
  green: { min: number };
  source: string;
  /** true = higher is better (margin), false = lower is better (DOI) */
  higherIsBetter: boolean;
}

export const BENCHMARKS: Record<string, Benchmark> = {
  grossMargin: {
    label: 'Валовая маржа',
    unit: '%',
    red: { max: 18 },
    yellow: { min: 18, max: 22 },
    green: { min: 22 },
    source: 'SEED 1 + KZ OTC-heavy model',
    higherIsBetter: true,
  },
  realizedMarkup: {
    label: 'Торговая наценка (УТН)',
    unit: '%',
    red: { max: 20 },
    yellow: { min: 20, max: 27 },
    green: { min: 27 },
    source: 'FarmBazis 2024',
    higherIsBetter: true,
  },
  cisProfitability: {
    label: 'Рентабельность (CIS)',
    unit: '%',
    red: { max: 15 },
    yellow: { min: 15, max: 25 },
    green: { min: 25 },
    source: 'FarmBazis 2024',
    higherIsBetter: true,
  },
  ebitda: {
    label: 'EBITDA',
    unit: '%',
    red: { max: 3 },
    yellow: { min: 3, max: 6 },
    green: { min: 6 },
    source: 'CIS pharmacy consensus',
    higherIsBetter: true,
  },
  netMargin: {
    label: 'Чистая прибыль',
    unit: '%',
    red: { max: 1 },
    yellow: { min: 1, max: 4 },
    green: { min: 4 },
    source: 'CIS pharmacy consensus',
    higherIsBetter: true,
  },
  daysOfInventory: {
    label: 'Дни запаса (DOI)',
    unit: 'дн.',
    red: { max: Infinity },
    yellow: { min: 25, max: 40 },
    green: { min: 0 },
    source: 'FarmBazis + CIS target',
    higherIsBetter: false,
  },
  payroll: {
    label: 'ФОТ / Выручка',
    unit: '%',
    red: { max: Infinity },
    yellow: { min: 12, max: 15 },
    green: { min: 0 },
    source: 'NCPA 2024 adapted',
    higherIsBetter: false,
  },
  rent: {
    label: 'Аренда / Выручка',
    unit: '%',
    red: { max: Infinity },
    yellow: { min: 8, max: 10 },
    green: { min: 0 },
    source: 'Almaty commercial real estate',
    higherIsBetter: false,
  },
  opex: {
    label: 'OPEX / Выручка',
    unit: '%',
    red: { max: Infinity },
    yellow: { min: 25, max: 30 },
    green: { min: 0 },
    source: 'CIS pharmacy model',
    higherIsBetter: false,
  },
};

/** Determine RAG level for a metric value */
export function getRAGLevel(benchmarkKey: string, value: number): RAGLevel {
  const b = BENCHMARKS[benchmarkKey];
  if (!b) return 'yellow';

  if (b.higherIsBetter) {
    if (value >= b.green.min) return 'green';
    if (value >= b.yellow.min) return 'yellow';
    return 'red';
  } else {
    // Lower is better (DOI, payroll%, rent%, opex%)
    if (benchmarkKey === 'daysOfInventory') {
      if (value < 25) return 'green';
      if (value <= 40) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'payroll') {
      if (value < 12) return 'green';
      if (value <= 15) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'rent') {
      if (value < 8) return 'green';
      if (value <= 10) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'opex') {
      if (value < 25) return 'green';
      if (value <= 30) return 'yellow';
      return 'red';
    }
    return 'yellow';
  }
}

/** RAG color mapping */
export const RAG_COLORS: Record<RAGLevel, string> = {
  red: '#dc2626',
  yellow: '#ca8a04',
  green: '#16a34a',
};

export const RAG_BG_COLORS: Record<RAGLevel, string> = {
  red: '#fef2f2',
  yellow: '#fefce8',
  green: '#f0fdf4',
};

// ─── Default values for demo (Almaty averages) ──────────────

export const ALMATY_DEFAULTS = {
  revenuePerPharmacy: 17_500_000, // tenge/month
  pharmacyCount: 5,
  markupPct: 30, // Alimkhan's current flat markup
  avgCostPrice: 2_500, // tenge, mid-range drug
  daysOfInventory: 30,
  creditorDays: 30, // typical supplier payment deferral
  debtorDays: 3, // marketplace payout delay
  payrollPerPharmacy: 1_750_000, // ~10% of revenue
  rentPerPharmacy: 1_225_000, // ~7% of revenue
  utilitiesPerPharmacy: 175_000, // ~1%
  adminPerPharmacy: 87_500, // ~0.5%
  softwarePerPharmacy: 50_000,
  marketingPerPharmacy: 87_500,
  depreciation: 200_000,
  interest: 0,
  taxRate: 20, // KZ corporate standard
  regulatedSharePct: 30, // post-July 2025, estimated
  avgRegulatedMarkup: 12, // weighted avg across regressive scale
  channels: {
    offline: { share: 75, commission: 0, fulfillment: 0 },
    halykMarket: { share: 15, commission: 12, fulfillment: 3 },
    wolt: { share: 5, commission: 27, fulfillment: 0 },
    iteka: { share: 5, commission: 5, fulfillment: 2 },
  },
};
