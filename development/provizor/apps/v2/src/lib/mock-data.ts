// Mock data for 5 pharmacies — variations from Almaty benchmarks

export interface PharmacyData {
  id: number;
  name: string;
  revenue: number;
  markupPct: number;
  payroll: number;
  rent: number;
  utilities: number;
  admin: number;
  software: number;
  marketing: number;
  depreciation: number;
  interest: number;
  taxRate: number;
  daysOfInventory: number;
  creditorDays: number;
  debtorDays: number;
  regulatedSharePct: number;
  avgRegulatedMarkup: number;
  channels: {
    offline: number;
    halyk: number;
    wolt: number;
    iteka: number;
  };
  // Traffic & sales
  dailyTraffic: number;     // walk-in visitors per day
  dailySales: number;       // completed sales per day
  repeatCustomerPct: number; // % returning customers
  avgCheckTenge: number;    // average receipt in tenge
  pharmacistsOnShift: number;
  areaSqm: number;          // pharmacy floor area
}

export const PHARMACIES: PharmacyData[] = [
  {
    id: 1, name: 'Аптека 1 (Алмалы)',
    revenue: 19_200_000, markupPct: 32,
    payroll: 1_900_000, rent: 1_400_000, utilities: 185_000,
    admin: 95_000, software: 50_000, marketing: 100_000,
    depreciation: 220_000, interest: 0, taxRate: 20,
    daysOfInventory: 25, creditorDays: 30, debtorDays: 3,
    regulatedSharePct: 28, avgRegulatedMarkup: 12,
    channels: { offline: 78, halyk: 12, wolt: 4, iteka: 6 },
    dailyTraffic: 220, dailySales: 150, repeatCustomerPct: 35,
    avgCheckTenge: 4_267, pharmacistsOnShift: 3, areaSqm: 85,
  },
  {
    id: 2, name: 'Аптека 2 (Бостандык)',
    revenue: 18_500_000, markupPct: 30,
    payroll: 1_800_000, rent: 1_350_000, utilities: 170_000,
    admin: 90_000, software: 50_000, marketing: 85_000,
    depreciation: 200_000, interest: 0, taxRate: 20,
    daysOfInventory: 32, creditorDays: 30, debtorDays: 3,
    regulatedSharePct: 30, avgRegulatedMarkup: 12,
    channels: { offline: 75, halyk: 15, wolt: 5, iteka: 5 },
    dailyTraffic: 200, dailySales: 135, repeatCustomerPct: 32,
    avgCheckTenge: 4_568, pharmacistsOnShift: 3, areaSqm: 78,
  },
  {
    id: 3, name: 'Аптека 3 (Медеу)',
    revenue: 15_800_000, markupPct: 29,
    payroll: 1_650_000, rent: 1_100_000, utilities: 155_000,
    admin: 80_000, software: 50_000, marketing: 75_000,
    depreciation: 180_000, interest: 0, taxRate: 20,
    daysOfInventory: 35, creditorDays: 28, debtorDays: 5,
    regulatedSharePct: 35, avgRegulatedMarkup: 11,
    channels: { offline: 80, halyk: 10, wolt: 3, iteka: 7 },
    dailyTraffic: 170, dailySales: 110, repeatCustomerPct: 28,
    avgCheckTenge: 4_788, pharmacistsOnShift: 2, areaSqm: 65,
  },
  {
    id: 4, name: 'Аптека 4 (Ауэзов)',
    revenue: 16_500_000, markupPct: 30,
    payroll: 1_700_000, rent: 1_000_000, utilities: 160_000,
    admin: 85_000, software: 50_000, marketing: 80_000,
    depreciation: 190_000, interest: 0, taxRate: 20,
    daysOfInventory: 28, creditorDays: 30, debtorDays: 2,
    regulatedSharePct: 32, avgRegulatedMarkup: 12,
    channels: { offline: 72, halyk: 18, wolt: 6, iteka: 4 },
    dailyTraffic: 190, dailySales: 125, repeatCustomerPct: 30,
    avgCheckTenge: 4_400, pharmacistsOnShift: 2, areaSqm: 72,
  },
  {
    id: 5, name: 'Аптека 5 (Наурызбай)',
    revenue: 14_000_000, markupPct: 28,
    payroll: 1_500_000, rent: 900_000, utilities: 140_000,
    admin: 75_000, software: 50_000, marketing: 60_000,
    depreciation: 160_000, interest: 0, taxRate: 20,
    daysOfInventory: 38, creditorDays: 25, debtorDays: 5,
    regulatedSharePct: 33, avgRegulatedMarkup: 11,
    channels: { offline: 82, halyk: 8, wolt: 3, iteka: 7 },
    dailyTraffic: 160, dailySales: 95, repeatCustomerPct: 25,
    avgCheckTenge: 4_912, pharmacistsOnShift: 2, areaSqm: 60,
  },
];

/** Aggregate all pharmacies into a network total */
export function networkTotal(): PharmacyData {
  const sum = (fn: (p: PharmacyData) => number) => PHARMACIES.reduce((s, p) => s + fn(p), 0);
  const weightedAvg = (fn: (p: PharmacyData) => number) => {
    const totalRev = sum(p => p.revenue);
    return PHARMACIES.reduce((s, p) => s + fn(p) * (p.revenue / totalRev), 0);
  };

  return {
    id: 0, name: 'Вся сеть',
    revenue: sum(p => p.revenue),
    markupPct: weightedAvg(p => p.markupPct),
    payroll: sum(p => p.payroll),
    rent: sum(p => p.rent),
    utilities: sum(p => p.utilities),
    admin: sum(p => p.admin),
    software: sum(p => p.software),
    marketing: sum(p => p.marketing),
    depreciation: sum(p => p.depreciation),
    interest: sum(p => p.interest),
    taxRate: 20,
    daysOfInventory: weightedAvg(p => p.daysOfInventory),
    creditorDays: weightedAvg(p => p.creditorDays),
    debtorDays: weightedAvg(p => p.debtorDays),
    regulatedSharePct: weightedAvg(p => p.regulatedSharePct),
    avgRegulatedMarkup: weightedAvg(p => p.avgRegulatedMarkup),
    channels: {
      offline: weightedAvg(p => p.channels.offline),
      halyk: weightedAvg(p => p.channels.halyk),
      wolt: weightedAvg(p => p.channels.wolt),
      iteka: weightedAvg(p => p.channels.iteka),
    },
    dailyTraffic: sum(p => p.dailyTraffic),
    dailySales: sum(p => p.dailySales),
    repeatCustomerPct: weightedAvg(p => p.repeatCustomerPct),
    avgCheckTenge: weightedAvg(p => p.avgCheckTenge),
    pharmacistsOnShift: sum(p => p.pharmacistsOnShift),
    areaSqm: sum(p => p.areaSqm),
  };
}

/** Compute full P&L for a pharmacy */
export interface PnLResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  payroll: number;
  rent: number;
  utilities: number;
  admin: number;
  software: number;
  marketing: number;
  opexTotal: number;
  ebitda: number;
  ebitdaPct: number;
  depreciation: number;
  interest: number;
  preTaxProfit: number;
  tax: number;
  netProfit: number;
  netMarginPct: number;
}

export function computePnL(p: PharmacyData): PnLResult {
  const cogsVal = p.revenue / (1 + p.markupPct / 100);
  const gp = p.revenue - cogsVal;
  const gmPct = (gp / p.revenue) * 100;
  const opex = p.payroll + p.rent + p.utilities + p.admin + p.software + p.marketing;
  const ebitdaVal = gp - opex;
  const ebitdaPctVal = (ebitdaVal / p.revenue) * 100;
  const preTax = ebitdaVal - p.depreciation - p.interest;
  const taxVal = preTax > 0 ? preTax * (p.taxRate / 100) : 0;
  const np = preTax - taxVal;
  const nmPct = (np / p.revenue) * 100;

  return {
    revenue: p.revenue,
    cogs: cogsVal,
    grossProfit: gp,
    grossMarginPct: gmPct,
    payroll: p.payroll,
    rent: p.rent,
    utilities: p.utilities,
    admin: p.admin,
    software: p.software,
    marketing: p.marketing,
    opexTotal: opex,
    ebitda: ebitdaVal,
    ebitdaPct: ebitdaPctVal,
    depreciation: p.depreciation,
    interest: p.interest,
    preTaxProfit: preTax,
    tax: taxVal,
    netProfit: np,
    netMarginPct: nmPct,
  };
}

// ─── SKU Mock Data ─────────────────────────────────────────

export interface SkuData {
  id: number;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  unitsSold: number;
  regulated: boolean;
}

export const MOCK_SKUS: SkuData[] = [
  { id: 1, name: 'Парацетамол 500мг №20', category: 'Анальгетики', costPrice: 280, sellingPrice: 350, unitsSold: 450, regulated: true },
  { id: 2, name: 'Ибупрофен 400мг №30', category: 'Анальгетики', costPrice: 620, sellingPrice: 810, unitsSold: 320, regulated: true },
  { id: 3, name: 'Амоксициллин 500мг №20', category: 'Антибиотики', costPrice: 1_200, sellingPrice: 1_560, unitsSold: 180, regulated: true },
  { id: 4, name: 'Омепразол 20мг №30', category: 'ЖКТ', costPrice: 850, sellingPrice: 1_105, unitsSold: 250, regulated: true },
  { id: 5, name: 'Лоратадин 10мг №10', category: 'Антигистаминные', costPrice: 350, sellingPrice: 455, unitsSold: 200, regulated: true },
  { id: 6, name: 'Витамин D3 2000МЕ №60', category: 'Витамины', costPrice: 2_800, sellingPrice: 3_640, unitsSold: 380, regulated: false },
  { id: 7, name: 'Омега-3 1000мг №90', category: 'БАД', costPrice: 4_500, sellingPrice: 5_850, unitsSold: 210, regulated: false },
  { id: 8, name: 'Мультивитамины №30', category: 'Витамины', costPrice: 3_200, sellingPrice: 4_160, unitsSold: 280, regulated: false },
  { id: 9, name: 'Метформин 850мг №60', category: 'Диабет', costPrice: 1_800, sellingPrice: 2_160, unitsSold: 120, regulated: true },
  { id: 10, name: 'Аторвастатин 20мг №30', category: 'Кардио', costPrice: 2_500, sellingPrice: 3_000, unitsSold: 95, regulated: true },
  { id: 11, name: 'Крем для рук 75мл', category: 'Косметика', costPrice: 1_500, sellingPrice: 1_950, unitsSold: 340, regulated: false },
  { id: 12, name: 'Подгузники детские №64', category: 'Гигиена', costPrice: 5_800, sellingPrice: 7_540, unitsSold: 160, regulated: false },
  { id: 13, name: 'Цефтриаксон 1г №1 (фл)', category: 'Антибиотики', costPrice: 450, sellingPrice: 540, unitsSold: 85, regulated: true },
  { id: 14, name: 'Коллаген порошок 300г', category: 'БАД', costPrice: 8_500, sellingPrice: 11_050, unitsSold: 70, regulated: false },
  { id: 15, name: 'Маска медицинская №50', category: 'Расходники', costPrice: 600, sellingPrice: 780, unitsSold: 520, regulated: false },
];
