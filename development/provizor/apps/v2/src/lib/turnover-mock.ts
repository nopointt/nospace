// Provizor — Inventory Turnover Mock Data
// 5 pharmacies, ABC/XYZ matrix, expiry risk entries

// DOI values sourced from mock-data.ts PHARMACIES[].daysOfInventory
// Pharmacy 1: 25d, Pharmacy 2: 32d, Pharmacy 3: 35d, Pharmacy 4: 28d, Pharmacy 5: 38d

export interface TurnoverByPharmacy {
  pharmacyId: number;
  pharmacyName: string;
  doi: number;          // Days of Inventory
  itr: number;          // Inventory Turnover Ratio (365 / doi)
  deadStockPct: number; // % of inventory with no movement 90+ days
  gmroi: number;        // Gross Margin Return on Investment
  expiryRiskValue: number; // ₸ value of expiring stock (≤90 days)
}

export const TURNOVER_BY_PHARMACY: TurnoverByPharmacy[] = [
  {
    pharmacyId: 1,
    pharmacyName: 'Аптека 1 (Алмалы)',
    doi: 25,
    itr: parseFloat((365 / 25).toFixed(1)),  // 14.6
    deadStockPct: 8.2,
    gmroi: 4.1,
    expiryRiskValue: 127_000,
  },
  {
    pharmacyId: 2,
    pharmacyName: 'Аптека 2 (Бостандык)',
    doi: 32,
    itr: parseFloat((365 / 32).toFixed(1)),  // 11.4
    deadStockPct: 12.5,
    gmroi: 3.2,
    expiryRiskValue: 198_000,
  },
  {
    pharmacyId: 3,
    pharmacyName: 'Аптека 3 (Медеу)',
    doi: 35,
    itr: parseFloat((365 / 35).toFixed(1)),  // 10.4
    deadStockPct: 15.8,
    gmroi: 2.7,
    expiryRiskValue: 243_000,
  },
  {
    pharmacyId: 4,
    pharmacyName: 'Аптека 4 (Ауэзов)',
    doi: 28,
    itr: parseFloat((365 / 28).toFixed(1)),  // 13.0
    deadStockPct: 10.1,
    gmroi: 3.6,
    expiryRiskValue: 156_000,
  },
  {
    pharmacyId: 5,
    pharmacyName: 'Аптека 5 (Наурызбай)',
    doi: 38,
    itr: parseFloat((365 / 38).toFixed(1)),  // 9.6
    deadStockPct: 17.3,
    gmroi: 2.3,
    expiryRiskValue: 298_000,
  },
];

// ─── ABC/XYZ Matrix ────────────────────────────────────────────

export type AbcClass = 'A' | 'B' | 'C';
export type XyzClass = 'X' | 'Y' | 'Z';
export type AbcXyzCell = `${AbcClass}${XyzClass}`;

export interface AbcXyzEntry {
  cell: AbcXyzCell;
  abcClass: AbcClass;
  xyzClass: XyzClass;
  skuCount: number;
  revenuePct: number; // % of total network revenue
}

// Distribution: 15 total SKUs
// A-class (3 SKUs, ~80% of revenue), B-class (5 SKUs, ~15%), C-class (7 SKUs, ~5%)
// X-stable (5 SKUs), Y-variable (6 SKUs), Z-unpredictable (4 SKUs)
export const ABC_XYZ_MATRIX: AbcXyzEntry[] = [
  { cell: 'AX', abcClass: 'A', xyzClass: 'X', skuCount: 2, revenuePct: 52.3 },
  { cell: 'AY', abcClass: 'A', xyzClass: 'Y', skuCount: 1, revenuePct: 27.7 },
  { cell: 'AZ', abcClass: 'A', xyzClass: 'Z', skuCount: 0, revenuePct: 0.0 },
  { cell: 'BX', abcClass: 'B', xyzClass: 'X', skuCount: 2, revenuePct: 6.8 },
  { cell: 'BY', abcClass: 'B', xyzClass: 'Y', skuCount: 2, revenuePct: 5.4 },
  { cell: 'BZ', abcClass: 'B', xyzClass: 'Z', skuCount: 1, revenuePct: 2.8 },
  { cell: 'CX', abcClass: 'C', xyzClass: 'X', skuCount: 1, revenuePct: 1.8 },
  { cell: 'CY', abcClass: 'C', xyzClass: 'Y', skuCount: 3, revenuePct: 2.1 },
  { cell: 'CZ', abcClass: 'C', xyzClass: 'Z', skuCount: 3, revenuePct: 1.1 },
];

/** Get a single matrix cell entry by cell key */
export function getMatrixCell(cell: AbcXyzCell): AbcXyzEntry | undefined {
  return ABC_XYZ_MATRIX.find(e => e.cell === cell);
}

// ─── Expiry Risk ───────────────────────────────────────────────

export type ExpiryHorizon = 30 | 60 | 90;

export interface ExpiryRiskEntry {
  id: number;
  skuName: string;
  expiryDate: string;       // ISO date
  quantity: number;         // units on hand
  value: number;            // ₸ cost value
  daysUntilExpiry: number;
  horizon: ExpiryHorizon;   // which warning bucket
}

function daysFromNow(n: number): string {
  const d = new Date('2026-04-05');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const EXPIRY_RISK_ENTRIES: ExpiryRiskEntry[] = [
  {
    id: 1,
    skuName: 'Цефтриаксон 1г №1 (фл)',
    expiryDate: daysFromNow(8),
    quantity: 14,
    value: 75_600,
    daysUntilExpiry: 8,
    horizon: 30,
  },
  {
    id: 2,
    skuName: 'Инсулин Хумалог 100МЕ/мл',
    expiryDate: daysFromNow(15),
    quantity: 7,
    value: 182_000,
    daysUntilExpiry: 15,
    horizon: 30,
  },
  {
    id: 3,
    skuName: 'Амоксициллин 500мг №20',
    expiryDate: daysFromNow(22),
    quantity: 31,
    value: 37_200,
    daysUntilExpiry: 22,
    horizon: 30,
  },
  {
    id: 4,
    skuName: 'Дексаметазон 4мг/мл амп.',
    expiryDate: daysFromNow(38),
    quantity: 45,
    value: 54_000,
    daysUntilExpiry: 38,
    horizon: 60,
  },
  {
    id: 5,
    skuName: 'Фуросемид 40мг №50',
    expiryDate: daysFromNow(45),
    quantity: 20,
    value: 16_000,
    daysUntilExpiry: 45,
    horizon: 60,
  },
  {
    id: 6,
    skuName: 'Метформин 850мг №60',
    expiryDate: daysFromNow(53),
    quantity: 18,
    value: 32_400,
    daysUntilExpiry: 53,
    horizon: 60,
  },
  {
    id: 7,
    skuName: 'Лозартан 50мг №30',
    expiryDate: daysFromNow(59),
    quantity: 12,
    value: 28_800,
    daysUntilExpiry: 59,
    horizon: 60,
  },
  {
    id: 8,
    skuName: 'Витамин D3 2000МЕ №60',
    expiryDate: daysFromNow(67),
    quantity: 55,
    value: 154_000,
    daysUntilExpiry: 67,
    horizon: 90,
  },
  {
    id: 9,
    skuName: 'Омега-3 1000мг №90',
    expiryDate: daysFromNow(74),
    quantity: 38,
    value: 171_000,
    daysUntilExpiry: 74,
    horizon: 90,
  },
  {
    id: 10,
    skuName: 'Коллаген порошок 300г',
    expiryDate: daysFromNow(82),
    quantity: 9,
    value: 76_500,
    daysUntilExpiry: 82,
    horizon: 90,
  },
];

/** Total expiry risk value grouped by horizon */
export function aggregateExpiryRisk(): Record<ExpiryHorizon, number> {
  return EXPIRY_RISK_ENTRIES.reduce<Record<ExpiryHorizon, number>>(
    (acc, entry) => {
      return { ...acc, [entry.horizon]: (acc[entry.horizon] ?? 0) + entry.value };
    },
    { 30: 0, 60: 0, 90: 0 },
  );
}
