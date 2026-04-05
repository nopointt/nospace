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
  defecturaRate: {
    label: 'Уровень дефектуры',
    unit: '%',
    red: { max: Infinity },
    yellow: { min: 3, max: 7 },
    green: { min: 0 },
    source: 'ECR + KPI Depot',
    higherIsBetter: false,
  },
  fillRate: {
    label: 'Fill Rate',
    unit: '%',
    red: { max: 93 },
    yellow: { min: 93, max: 97 },
    green: { min: 97 },
    source: 'Industry consensus',
    higherIsBetter: true,
  },
  doiKZ: {
    label: 'Дни запаса (DOI, KZ)',
    unit: 'дн.',
    red: { max: Infinity },
    yellow: { min: 35, max: 55 },
    green: { min: 0 },
    source: 'DEEP-7',
    higherIsBetter: false,
  },
  itr: {
    label: 'Оборачиваемость запасов (ITR)',
    unit: 'раз/год',
    red: { max: 9 },
    yellow: { min: 9, max: 14 },
    green: { min: 14 },
    source: 'DEEP-7',
    higherIsBetter: true,
  },
  deadStock: {
    label: 'Мёртвый запас',
    unit: '%',
    red: { max: Infinity },
    yellow: { min: 5, max: 15 },
    green: { min: 0 },
    source: 'DEEP-7',
    higherIsBetter: false,
  },
  gmroi: {
    label: 'GMROI',
    unit: '',
    red: { max: 2 },
    yellow: { min: 2, max: 3 },
    green: { min: 3 },
    source: 'DEEP-7',
    higherIsBetter: true,
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
    if (benchmarkKey === 'daysOfInventory') {
      if (value < 25) return 'green';
      if (value <= 40) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'defecturaRate') {
      if (value < 3) return 'green';
      if (value <= 7) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'doiKZ') {
      if (value < 35) return 'green';
      if (value <= 55) return 'yellow';
      return 'red';
    }
    if (benchmarkKey === 'deadStock') {
      if (value < 5) return 'green';
      if (value <= 15) return 'yellow';
      return 'red';
    }
    return 'yellow';
  }
}

/** RAG color mapping — dark theme friendly */
export const RAG_COLORS: Record<RAGLevel, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
};

export const RAG_BG_COLORS: Record<RAGLevel, string> = {
  red: 'rgba(239,68,68,0.15)',
  yellow: 'rgba(234,179,8,0.15)',
  green: 'rgba(34,197,94,0.15)',
};
