import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { type PharmacyData } from '../lib/mock-data';
import { type DateRange } from '../lib/date-range';
import { formatTenge, formatPct, formatCompact } from '../lib/format';
import {
  DEFECTURA_LOG,
  RECURRENT_MISSES,
  DAILY_DEFECTURA,
  PHARMACY_DEFECTURA,
  type DefecturaLogEntry,
} from '../lib/defectura-mock';

type SourceFilter = 'all' | 'walk-in' | 'phone' | 'whatsapp' | 'halyk' | 'wolt';
type StatusFilter = 'all' | 'ordered' | 'pending' | 'unavailable';
type PeriodToggle = 'days' | 'weeks';
type PageSize = 10 | 20 | 50;

interface DefecturaPageProps {
  data: PharmacyData;
  allPharmacies: PharmacyData[];
  period: DateRange;
}

// Source badge color mapping
const SOURCE_COLORS: Record<DefecturaLogEntry['source'], string> = {
  'walk-in': 'bg-slate-700 text-slate-200',
  'phone': 'bg-blue-900 text-blue-200',
  'whatsapp': 'bg-green-900 text-green-200',
  'halyk': 'bg-orange-900 text-orange-200',
  'wolt': 'bg-purple-900 text-purple-200',
};

const SOURCE_LABELS: Record<DefecturaLogEntry['source'], string> = {
  'walk-in': 'Очно',
  'phone': 'Телефон',
  'whatsapp': 'WhatsApp',
  'halyk': 'Halyk',
  'wolt': 'Wolt',
};

const STATUS_COLORS: Record<DefecturaLogEntry['status'], string> = {
  ordered: 'text-success',
  pending: 'text-warning',
  unavailable: 'text-danger',
};

const STATUS_LABELS: Record<DefecturaLogEntry['status'], string> = {
  ordered: 'Заказан',
  pending: 'В ожидании',
  unavailable: 'Нет в наличии',
};

const ABC_COLORS: Record<'A' | 'B' | 'C', string> = {
  A: 'text-danger font-semibold',
  B: 'text-warning',
  C: 'text-text-secondary',
};

// Aggregate weekly data from daily
function aggregateWeekly(daily: typeof DAILY_DEFECTURA) {
  const weeks: { date: string; count: number; defecturaRatePct: number; fillRatePct: number }[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const totalCount = chunk.reduce((s, d) => s + d.count, 0);
    const avgDefectura = chunk.reduce((s, d) => s + d.defecturaRatePct, 0) / chunk.length;
    const avgFill = chunk.reduce((s, d) => s + d.fillRatePct, 0) / chunk.length;
    weeks.push({
      date: `Нед. ${Math.floor(i / 7) + 1}`,
      count: totalCount,
      defecturaRatePct: parseFloat(avgDefectura.toFixed(1)),
      fillRatePct: parseFloat(avgFill.toFixed(1)),
    });
  }
  return weeks;
}

// Format date label for chart (dd.mm)
function fmtDateLabel(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

// CSV export for log
function exportLogCSV(entries: DefecturaLogEntry[]) {
  const headers = ['Дата', 'Аптека', 'Препарат (МНН)', 'Торговое название', 'Категория', 'Кол-во', 'Источник', 'Замена предложена', 'Статус'];
  const rows = entries.map(e => [
    e.date,
    `Аптека ${e.pharmacyId}`,
    e.inn,
    e.skuName,
    e.category,
    e.quantityRequested,
    SOURCE_LABELS[e.source],
    e.substituteOffered ? 'Да' : 'Нет',
    STATUS_LABELS[e.status],
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'provizor-defectura-log.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const DARK_TOOLTIP = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f8fafc',
};

export function DefecturaPage({ data, allPharmacies, period: _period }: DefecturaPageProps) {
  const [periodToggle, setPeriodToggle] = useState<PeriodToggle>('days');
  const [pharmFilter, setPharmFilter] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [logPage, setLogPage] = useState(0);
  const [logPageSize, setLogPageSize] = useState<PageSize>(10);

  // Sync pharmacy switcher with internal pharma filter
  const selectedPharmacyId = data.id;
  useEffect(() => {
    setPharmFilter(selectedPharmacyId);
    setLogPage(0);
  }, [selectedPharmacyId]);

  // Hero metrics — filtered by selected pharmacy
  const relevantPharmacies = useMemo(
    () => selectedPharmacyId === 0
      ? PHARMACY_DEFECTURA
      : PHARMACY_DEFECTURA.filter(p => p.pharmacyId === selectedPharmacyId),
    [selectedPharmacyId],
  );

  const totalLostRevenue = useMemo(
    () => relevantPharmacies.reduce((s, p) => s + p.lostRevenue, 0),
    [relevantPharmacies],
  );
  const avgDefecturaRate = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.defecturaRatePct, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const avgFillRate = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.fillRatePct, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const recidivistCount = RECURRENT_MISSES.filter(r => r.missCount >= 3).length;

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const unique = [...new Set(DEFECTURA_LOG.map(e => e.category))];
    return unique.sort();
  }, []);

  // Chart data
  const chartData = useMemo(() => {
    if (periodToggle === 'weeks') {
      return aggregateWeekly(DAILY_DEFECTURA);
    }
    return DAILY_DEFECTURA.map(d => ({
      ...d,
      date: fmtDateLabel(d.date),
    }));
  }, [periodToggle]);

  // Log filters
  const filteredLog = useMemo(() => {
    return DEFECTURA_LOG.filter(e => {
      if (pharmFilter !== 0 && e.pharmacyId !== pharmFilter) return false;
      if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (periodFilter > 0) {
        const cutoff = new Date('2026-04-04');
        cutoff.setDate(cutoff.getDate() - periodFilter);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        if (e.date < cutoffStr) return false;
      }
      return true;
    });
  }, [pharmFilter, sourceFilter, statusFilter, categoryFilter, periodFilter]);

  const totalLogPages = Math.ceil(filteredLog.length / logPageSize);
  const pagedLog = filteredLog.slice(logPage * logPageSize, (logPage + 1) * logPageSize);

  // Worst pharmacy for insights — scoped to selected pharmacy
  const worstPharmacy = useMemo(
    () => relevantPharmacies.reduce((w, p) => p.defecturaRatePct > w.defecturaRatePct ? p : w),
    [relevantPharmacies],
  );
  const worstName = allPharmacies.find(p => p.id === worstPharmacy.pharmacyId)?.name ?? `Аптека ${worstPharmacy.pharmacyId}`;
  const topRecidivists = RECURRENT_MISSES.slice(0, 3).map(r => r.skuName);

  return (
    <div className="space-y-6">
      {/* Hero MetricCards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Дефектура"
          value={formatPct(avgDefecturaRate)}
          subtitle="средняя по сети"
          benchmarkKey="defecturaRate"
          numericValue={avgDefecturaRate}
          info="Процент незакрытых запросов. 43% покупателей уходят к конкуренту при дефектуре (AMRA & ELMA). Журнал обязателен по закону КЗ."
        />
        <MetricCard
          title="Упущенная выручка"
          value={formatCompact(totalLostRevenue)}
          subtitle="за 30 дней"
          color="#ef4444"
          info="Потерянные продажи из-за отсутствия товара. Формула: дни OOS × ср.дневные продажи × цена."
        />
        <MetricCard
          title="Fill Rate"
          value={formatPct(avgFillRate)}
          subtitle="средний по сети"
          benchmarkKey="fillRate"
          numericValue={avgFillRate}
          info="Процент выполненных запросов (100% − Дефектура). Экономически обоснованный компромисс: 94-97%."
        />
        <MetricCard
          title="Рецидивисты"
          value={String(recidivistCount)}
          subtitle="SKU с 3+ пропусками"
          color="#eab308"
          info="SKU с хроническим дефицитом (3+ пропусков за 30 дней). Группа A = zero defectura обязательна."
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
            Динамика дефектуры
            {selectedPharmacyId !== 0 && (
              <span className="text-text-muted font-normal normal-case ml-2 text-xs">(данные по сети — детализация после интеграции с 1С)</span>
            )}
          </h2>
          <div className="flex items-center gap-1 bg-navy rounded-lg p-1">
            <button
              onClick={() => setPeriodToggle('days')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                periodToggle === 'days'
                  ? 'bg-accent text-navy'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              По дням
            </button>
            <button
              onClick={() => setPeriodToggle('weeks')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                periodToggle === 'weeks'
                  ? 'bg-accent text-navy'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              По неделям
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Кол-во', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: unknown) => `${Number(v)}%`}
              domain={[0, 15]}
            />
            <Tooltip
              contentStyle={DARK_TOOLTIP}
              labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              formatter={(value: unknown, name: string) => {
                if (name === 'count') return [`${Number(value)} событий`, 'Дефектура (шт.)'];
                if (name === 'defecturaRatePct') return [`${Number(value).toFixed(1)}%`, 'Уровень дефектуры'];
                if (name === 'fillRatePct') return [`${Number(value).toFixed(1)}%`, 'Fill Rate'];
                return [String(value), name];
              }}
            />
            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: 11 }}
              formatter={(value: string) => {
                if (value === 'count') return 'Дефектура (шт.)';
                if (value === 'defecturaRatePct') return 'Уровень %';
                if (value === 'fillRatePct') return 'Fill Rate %';
                return value;
              }}
            />
            <Bar yAxisId="left" dataKey="count" fill="#f87171" opacity={0.7} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="defecturaRatePct" stroke="#eab308" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="fillRatePct" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Recidivists Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Рецидивисты — топ SKU по частоте пропусков</h2>
          <p className="text-xs text-text-muted mt-1">SKU с 3+ пропусками за 30 дней · сортировка по упущенной выручке</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy text-text-secondary text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Препарат</th>
              <th className="px-4 py-3 text-left font-medium">Категория</th>
              <th className="px-4 py-3 text-right font-medium">Пропусков (30д)</th>
              <th className="px-4 py-3 text-right font-medium">Упущ. выручка</th>
              <th className="px-4 py-3 text-right font-medium">Последнее наличие</th>
              <th className="px-4 py-3 text-center font-medium">ABC</th>
            </tr>
          </thead>
          <tbody>
            {RECURRENT_MISSES.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-border transition-colors ${
                  row.abcClass === 'A'
                    ? 'bg-danger/5 hover:bg-danger/10'
                    : 'hover:bg-navy/30'
                }`}
              >
                <td className="px-4 py-3 text-text font-medium">{row.skuName}</td>
                <td className="px-4 py-3 text-text-secondary">{row.category}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-danger font-semibold">{row.missCount}</span>
                </td>
                <td className="px-4 py-3 text-right text-text">{formatTenge(row.lostRevenue)}</td>
                <td className="px-4 py-3 text-right text-text-secondary text-xs">{row.lastInStock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={ABC_COLORS[row.abcClass]}>{row.abcClass}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Journal Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Журнал дефектуры</h2>
              <p className="text-xs text-text-muted mt-1">Обязателен по приказу КР ДСМ-15</p>
            </div>
            <button
              onClick={() => exportLogCSV(filteredLog)}
              className="flex items-center gap-2 px-3 py-1.5 bg-navy border border-border rounded-lg text-xs text-text-secondary hover:text-text hover:border-accent transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Экспорт CSV
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <select
              value={pharmFilter}
              onChange={e => { setPharmFilter(Number(e.target.value)); setLogPage(0); }}
              className="bg-navy border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value={0}>Все аптеки</option>
              {allPharmacies.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={periodFilter}
              onChange={e => { setPeriodFilter(Number(e.target.value)); setLogPage(0); }}
              className="bg-navy border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value={0}>Все даты</option>
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setLogPage(0); }}
              className="bg-navy border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value="all">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value as SourceFilter); setLogPage(0); }}
              className="bg-navy border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value="all">Все источники</option>
              <option value="walk-in">Очно</option>
              <option value="phone">Телефон</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="halyk">Halyk</option>
              <option value="wolt">Wolt</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); setLogPage(0); }}
              className="bg-navy border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
            >
              <option value="all">Все статусы</option>
              <option value="ordered">Заказан</option>
              <option value="pending">В ожидании</option>
              <option value="unavailable">Нет в наличии</option>
            </select>

            <span className="text-xs text-text-muted ml-auto">{filteredLog.length} записей</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-text-secondary text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Дата</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Препарат (МНН)</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Категория</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Аптека</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Кол-во</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Источник</th>
                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Замена</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Статус</th>
              </tr>
            </thead>
            <tbody>
              {pagedLog.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted text-xs">
                    Записей не найдено
                  </td>
                </tr>
              ) : (
                pagedLog.map(entry => (
                  <tr key={entry.id} className="border-t border-border hover:bg-navy/30 transition-colors">
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">{entry.date}</td>
                    <td className="px-4 py-3">
                      <div className="text-text font-medium text-xs">{entry.inn}</div>
                      <div className="text-text-muted text-[10px] mt-0.5">{entry.skuName}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{entry.category}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">Аптека {entry.pharmacyId}</td>
                    <td className="px-4 py-3 text-right text-text text-xs">{entry.quantityRequested}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${SOURCE_COLORS[entry.source]}`}>
                        {SOURCE_LABELS[entry.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {entry.substituteOffered ? (
                        <span className="text-success">Да</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Строк:</span>
            {([10, 20, 50] as PageSize[]).map(size => (
              <button
                key={size}
                onClick={() => { setLogPageSize(size); setLogPage(0); }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  logPageSize === size
                    ? 'bg-accent text-navy font-medium'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {logPage * logPageSize + 1}–{Math.min((logPage + 1) * logPageSize, filteredLog.length)} из {filteredLog.length}
            </span>
            <button
              onClick={() => setLogPage(p => Math.max(0, p - 1))}
              disabled={logPage === 0}
              className="p-1 rounded text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setLogPage(p => Math.min(totalLogPages - 1, p + 1))}
              disabled={logPage >= totalLogPages - 1}
              className="p-1 rounded text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-4">Инсайты</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="text-text font-medium">43%</span> покупателей уходят к конкуренту при дефектуре
              {' '}<span className="text-text-muted text-xs">(AMRA &amp; ELMA, 2025)</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
            <p className="text-sm text-text-secondary leading-relaxed">
              Журнал дефектуры{' '}
              <span className="text-text font-medium">обязателен по закону КЗ</span>
              {' '}<span className="text-text-muted text-xs">(приказ КР ДСМ-15)</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                worstPharmacy.defecturaRatePct > 7 ? 'bg-danger' : 'bg-warning'
              }`}
            />
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="text-text font-medium">{worstName}</span>
              {' '}— уровень дефектуры{' '}
              <span className={worstPharmacy.defecturaRatePct > 7 ? 'text-danger font-semibold' : 'text-warning font-semibold'}>
                {formatPct(worstPharmacy.defecturaRatePct)}
              </span>
              {worstPharmacy.defecturaRatePct > 7 ? ' (критично)' : ' (внимание)'}
              {'. '}Топ-3 рецидивиста:{' '}
              <span className="text-text">{topRecidivists.join(', ')}</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
            <p className="text-sm text-text-secondary leading-relaxed">
              Упущенная выручка по сети:{' '}
              <span className="text-danger font-semibold">{formatTenge(totalLostRevenue)}</span>
              {' '}за 30 дней. Устранение топ-3 рецидивистов вернёт до{' '}
              <span className="text-text font-medium">
                {formatTenge(RECURRENT_MISSES.slice(0, 3).reduce((s, r) => s + r.lostRevenue, 0))}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
