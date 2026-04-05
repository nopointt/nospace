// Provizor — Defectura Mock Data
// 5 pharmacies, 30 days, realistic KZ pharmacy patterns

export interface DefecturaLogEntry {
  id: number;
  date: string;              // ISO date
  pharmacyId: number;
  skuName: string;           // trade name
  inn: string;               // МНН (international non-proprietary name)
  category: string;
  quantityRequested: number;
  source: 'walk-in' | 'phone' | 'whatsapp' | 'halyk' | 'wolt';
  substituteOffered: boolean;
  status: 'ordered' | 'pending' | 'unavailable';
}

export interface RecurrentMiss {
  skuName: string;
  category: string;
  missCount: number;         // times missed in 30 days
  lostRevenue: number;       // estimated ₸
  lastInStock: string;       // ISO date
  abcClass: 'A' | 'B' | 'C';
}

export interface DailyDefectura {
  date: string;
  count: number;             // number of defectura events
  defecturaRatePct: number;  // F-21
  fillRatePct: number;       // F-23
}

export interface PharmacyDefectura {
  pharmacyId: number;
  defecturaRatePct: number;
  lostRevenue: number;
  fillRatePct: number;
  recurrentMissCount: number;
}

// Produce a date string offset from today
function daysAgo(n: number): string {
  const d = new Date('2026-04-04');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DEFECTURA_LOG: DefecturaLogEntry[] = [
  {
    id: 1, date: daysAgo(1), pharmacyId: 1,
    skuName: 'Амоксициллин 500 мг', inn: 'Амоксициллин',
    category: 'Антибиотики', quantityRequested: 2,
    source: 'walk-in', substituteOffered: true, status: 'ordered',
  },
  {
    id: 2, date: daysAgo(2), pharmacyId: 2,
    skuName: 'Метформин 850 мг', inn: 'Метформин',
    category: 'Диабет', quantityRequested: 3,
    source: 'walk-in', substituteOffered: false, status: 'pending',
  },
  {
    id: 3, date: daysAgo(2), pharmacyId: 1,
    skuName: 'Лозартан 50 мг', inn: 'Лозартан',
    category: 'Кардиология', quantityRequested: 1,
    source: 'phone', substituteOffered: true, status: 'ordered',
  },
  {
    id: 4, date: daysAgo(3), pharmacyId: 3,
    skuName: 'Омепразол 20 мг', inn: 'Омепразол',
    category: 'Гастроэнтерология', quantityRequested: 2,
    source: 'whatsapp', substituteOffered: true, status: 'ordered',
  },
  {
    id: 5, date: daysAgo(4), pharmacyId: 4,
    skuName: 'Аторвастатин 20 мг', inn: 'Аторвастатин',
    category: 'Кардиология', quantityRequested: 1,
    source: 'walk-in', substituteOffered: false, status: 'unavailable',
  },
  {
    id: 6, date: daysAgo(5), pharmacyId: 5,
    skuName: 'Лоратадин 10 мг', inn: 'Лоратадин',
    category: 'Аллергология', quantityRequested: 4,
    source: 'halyk', substituteOffered: true, status: 'ordered',
  },
  {
    id: 7, date: daysAgo(5), pharmacyId: 2,
    skuName: 'Цефтриаксон 1 г', inn: 'Цефтриаксон',
    category: 'Антибиотики', quantityRequested: 1,
    source: 'walk-in', substituteOffered: false, status: 'unavailable',
  },
  {
    id: 8, date: daysAgo(6), pharmacyId: 1,
    skuName: 'Ибупрофен 400 мг', inn: 'Ибупрофен',
    category: 'НПВС', quantityRequested: 3,
    source: 'walk-in', substituteOffered: true, status: 'pending',
  },
  {
    id: 9, date: daysAgo(7), pharmacyId: 3,
    skuName: 'Ацикловир 200 мг', inn: 'Ацикловир',
    category: 'Противовирусные', quantityRequested: 2,
    source: 'whatsapp', substituteOffered: false, status: 'pending',
  },
  {
    id: 10, date: daysAgo(8), pharmacyId: 4,
    skuName: 'Левотироксин 50 мкг', inn: 'Левотироксин',
    category: 'Эндокринология', quantityRequested: 1,
    source: 'walk-in', substituteOffered: false, status: 'unavailable',
  },
  {
    id: 11, date: daysAgo(9), pharmacyId: 5,
    skuName: 'Диклофенак 75 мг', inn: 'Диклофенак',
    category: 'НПВС', quantityRequested: 2,
    source: 'walk-in', substituteOffered: true, status: 'ordered',
  },
  {
    id: 12, date: daysAgo(10), pharmacyId: 1,
    skuName: 'Метформин 500 мг', inn: 'Метформин',
    category: 'Диабет', quantityRequested: 2,
    source: 'phone', substituteOffered: true, status: 'ordered',
  },
  {
    id: 13, date: daysAgo(11), pharmacyId: 2,
    skuName: 'Амоксициллин 250 мг', inn: 'Амоксициллин',
    category: 'Антибиотики', quantityRequested: 3,
    source: 'walk-in', substituteOffered: true, status: 'pending',
  },
  {
    id: 14, date: daysAgo(12), pharmacyId: 3,
    skuName: 'Парацетамол 500 мг', inn: 'Парацетамол',
    category: 'Анальгетики', quantityRequested: 5,
    source: 'walk-in', substituteOffered: true, status: 'ordered',
  },
  {
    id: 15, date: daysAgo(14), pharmacyId: 4,
    skuName: 'Лозартан 100 мг', inn: 'Лозартан',
    category: 'Кардиология', quantityRequested: 1,
    source: 'phone', substituteOffered: false, status: 'pending',
  },
  {
    id: 16, date: daysAgo(16), pharmacyId: 5,
    skuName: 'Омепразол 40 мг', inn: 'Омепразол',
    category: 'Гастроэнтерология', quantityRequested: 2,
    source: 'wolt', substituteOffered: true, status: 'ordered',
  },
  {
    id: 17, date: daysAgo(18), pharmacyId: 1,
    skuName: 'Аторвастатин 40 мг', inn: 'Аторвастатин',
    category: 'Кардиология', quantityRequested: 1,
    source: 'walk-in', substituteOffered: false, status: 'unavailable',
  },
  {
    id: 18, date: daysAgo(20), pharmacyId: 2,
    skuName: 'Цефтриаксон 0.5 г', inn: 'Цефтриаксон',
    category: 'Антибиотики', quantityRequested: 2,
    source: 'walk-in', substituteOffered: false, status: 'unavailable',
  },
  {
    id: 19, date: daysAgo(23), pharmacyId: 3,
    skuName: 'Ибупрофен 200 мг', inn: 'Ибупрофен',
    category: 'НПВС', quantityRequested: 4,
    source: 'halyk', substituteOffered: true, status: 'ordered',
  },
  {
    id: 20, date: daysAgo(27), pharmacyId: 4,
    skuName: 'Левотироксин 100 мкг', inn: 'Левотироксин',
    category: 'Эндокринология', quantityRequested: 1,
    source: 'walk-in', substituteOffered: false, status: 'pending',
  },
];

export const RECURRENT_MISSES: RecurrentMiss[] = [
  {
    skuName: 'Метформин 850 мг',
    category: 'Диабет',
    missCount: 7,
    lostRevenue: 184_000,
    lastInStock: daysAgo(18),
    abcClass: 'A',
  },
  {
    skuName: 'Аторвастатин 20 мг',
    category: 'Кардиология',
    missCount: 6,
    lostRevenue: 156_000,
    lastInStock: daysAgo(14),
    abcClass: 'A',
  },
  {
    skuName: 'Цефтриаксон 1 г',
    category: 'Антибиотики',
    missCount: 5,
    lostRevenue: 143_000,
    lastInStock: daysAgo(12),
    abcClass: 'A',
  },
  {
    skuName: 'Левотироксин 50 мкг',
    category: 'Эндокринология',
    missCount: 5,
    lostRevenue: 121_000,
    lastInStock: daysAgo(22),
    abcClass: 'B',
  },
  {
    skuName: 'Лозартан 50 мг',
    category: 'Кардиология',
    missCount: 4,
    lostRevenue: 98_000,
    lastInStock: daysAgo(9),
    abcClass: 'A',
  },
  {
    skuName: 'Омепразол 20 мг',
    category: 'Гастроэнтерология',
    missCount: 4,
    lostRevenue: 87_000,
    lastInStock: daysAgo(11),
    abcClass: 'B',
  },
  {
    skuName: 'Амоксициллин 500 мг',
    category: 'Антибиотики',
    missCount: 3,
    lostRevenue: 64_000,
    lastInStock: daysAgo(7),
    abcClass: 'B',
  },
  {
    skuName: 'Ибупрофен 400 мг',
    category: 'НПВС',
    missCount: 3,
    lostRevenue: 42_000,
    lastInStock: daysAgo(5),
    abcClass: 'C',
  },
];

// 30 days of daily data with realistic variation
export const DAILY_DEFECTURA: DailyDefectura[] = Array.from({ length: 30 }, (_, i) => {
  const dayIndex = 29 - i; // oldest first
  // Simulate slight upward trend with noise
  const baseCount = 3 + Math.round(Math.sin(i * 0.4) * 1.5 + i * 0.08);
  const count = Math.max(1, baseCount);
  // Total requests ~150/day, defectura ~2-8%
  const totalRequests = 145 + Math.round(Math.sin(i * 0.7) * 15);
  const defecturaRatePct = parseFloat(((count / totalRequests) * 100).toFixed(1));
  const fillRatePct = parseFloat((100 - defecturaRatePct).toFixed(1));
  return {
    date: daysAgo(dayIndex),
    count,
    defecturaRatePct,
    fillRatePct,
  };
});

export const PHARMACY_DEFECTURA: PharmacyDefectura[] = [
  { pharmacyId: 1, defecturaRatePct: 6.2, lostRevenue: 187_000, fillRatePct: 93.8, recurrentMissCount: 3 },
  { pharmacyId: 2, defecturaRatePct: 8.1, lostRevenue: 243_000, fillRatePct: 91.9, recurrentMissCount: 4 },
  { pharmacyId: 3, defecturaRatePct: 4.7, lostRevenue: 141_000, fillRatePct: 95.3, recurrentMissCount: 2 },
  { pharmacyId: 4, defecturaRatePct: 5.3, lostRevenue: 159_000, fillRatePct: 94.7, recurrentMissCount: 3 },
  { pharmacyId: 5, defecturaRatePct: 3.9, lostRevenue: 117_000, fillRatePct: 96.1, recurrentMissCount: 2 },
];
