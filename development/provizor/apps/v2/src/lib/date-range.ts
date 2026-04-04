export type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  label: string;
  days: number;       // how many days the period covers
  multiplier: number; // scale monthly data: today=1/30, week=7/30, month=1, year=12
}

export const DATE_RANGES: Record<DateRangePreset, DateRange> = {
  today:  { preset: 'today',  label: 'Сегодня',    days: 1,   multiplier: 1 / 30 },
  week:   { preset: 'week',   label: '7 дней',     days: 7,   multiplier: 7 / 30 },
  month:  { preset: 'month',  label: 'Месяц',      days: 30,  multiplier: 1 },
  year:   { preset: 'year',   label: 'Год',         days: 365, multiplier: 12 },
  all:    { preset: 'all',    label: 'Всё время',   days: 1095, multiplier: 36 }, // 3 years
  custom: { preset: 'custom', label: 'Период...',   days: 30,  multiplier: 1 },
};

/** Scale a monthly value by date range */
export function scaleByPeriod(monthlyValue: number, range: DateRange): number {
  return monthlyValue * range.multiplier;
}

/** Label suffix for the period */
export function periodSuffix(range: DateRange): string {
  switch (range.preset) {
    case 'today': return '/день';
    case 'week': return '/нед';
    case 'month': return '/мес';
    case 'year': return '/год';
    case 'all': return ' (всё время)';
    case 'custom': return '';
  }
}
