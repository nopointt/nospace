import { useMemo, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { type PharmacyData, computePnL, PHARMACIES } from '../lib/mock-data';
import { cisProfitability } from '../lib/formulas';
import { formatCompact, formatPct, formatTenge } from '../lib/format';
import { CHART_COLORS, COST_COLORS, pctTickFormatter } from '../lib/chart-helpers';
import { type DateRange, scaleByPeriod, periodSuffix } from '../lib/date-range';

// Benchmark targets for delta calculation
const TARGETS = {
  grossMarginPct: 22,
  ebitdaPct: 6,
  netMarginPct: 4,
  cisProfitability: 25,
  daysOfInventory: 30,
  conversionPct: 65,
  avgCheck: 4_500,
};

interface DashboardPageProps {
  data: PharmacyData;
  allPharmacies: PharmacyData[];
  period: DateRange;
}

export function DashboardPage({ data, allPharmacies, period }: DashboardPageProps) {
  const s = (v: number) => scaleByPeriod(v, period);
  const suffix = periodSuffix(period);
  const pnl = useMemo(() => computePnL(data), [data]);
  const cisProf = useMemo(() =>
    cisProfitability(data.markupPct, data.daysOfInventory, data.creditorDays, data.debtorDays),
    [data],
  );

  const conversionPct = data.dailyTraffic > 0 ? (data.dailySales / data.dailyTraffic) * 100 : 0;
  const monthlySales = data.dailySales * 30;

  // Performance chart data — per pharmacy
  const perfData = useMemo(() =>
    allPharmacies.map(p => {
      const r = computePnL(p);
      return {
        name: `Аптека ${p.id}`,
        revenue: Math.round(r.revenue / 1_000_000 * 10) / 10,
        costs: Math.round((r.cogs + r.opexTotal) / 1_000_000 * 10) / 10,
        netMargin: Math.round(r.netMarginPct * 10) / 10,
      };
    }),
    [allPharmacies],
  );

  // Cost breakdown donut data
  const costData = useMemo(() => [
    { name: 'COGS', value: Math.round(pnl.cogs) },
    { name: 'ФОТ', value: pnl.payroll },
    { name: 'Аренда', value: pnl.rent },
    { name: 'Коммуналка', value: pnl.utilities },
    { name: 'Маркетинг', value: pnl.marketing },
    { name: 'Прочее', value: pnl.admin + pnl.software },
  ], [pnl]);

  const totalCosts = costData.reduce((s, d) => s + d.value, 0);

  // Insights
  const insights = useMemo(() => {
    const items: string[] = [];
    if (pnl.netMarginPct < 4) {
      items.push(`Чистая маржа ${formatPct(pnl.netMarginPct)} ниже целевых 4%. Основные рычаги: снижение OPEX (${formatCompact(pnl.opexTotal)}) или рост наценки на свободные препараты.`);
    } else {
      items.push(`Чистая маржа ${formatPct(pnl.netMarginPct)} — в зелёной зоне. Текущий OPEX: ${formatCompact(pnl.opexTotal)}.`);
    }
    if (cisProf < 25) {
      items.push(`Рентабельность (РВС) ${formatPct(cisProf)} ниже целевой (25%). Ускорение оборачиваемости с ${data.daysOfInventory.toFixed(0)} до 20 дней даст ${formatPct(cisProfitability(data.markupPct, 20, data.creditorDays, data.debtorDays))}.`);
    }
    items.push(`Скидки могут незаметно снизить реальную наценку с ${data.markupPct.toFixed(0)}% до ${(data.markupPct - 4).toFixed(0)}%. Отслеживание фактической УТН — критично.`);
    const worstP = allPharmacies.reduce((w, p) => {
      const r = computePnL(p);
      return r.netMarginPct < w.margin ? { name: p.name, margin: r.netMarginPct } : w;
    }, { name: '', margin: 100 });
    if (worstP.margin < 2) {
      items.push(`${worstP.name} — самая слабая точка (${formatPct(worstP.margin)}). Рассмотрите оптимизацию аренды или ассортимента.`);
    }
    if (conversionPct < 65) {
      items.push(`Конверсия ${formatPct(conversionPct)} ниже среднего (65%). Возможные причины: отсутствие товара (дефектура), длинные очереди, недостаточная консультация.`);
    }
    return items;
  }, [pnl, cisProf, data, allPharmacies, conversionPct]);

  return (
    <div className="space-y-6">
      {/* Row 1: Main Financial Metrics — 5 cards, scrollable on small screens */}
      <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
        <MetricCard
          title="Выручка"
          value={formatCompact(s(pnl.revenue))}
          subtitle={data.id === 0 ? `5 аптек${suffix}` : suffix}
          color="#38bdf8"
          delta={0}
          info="Общий объём продаж за период. Включает все каналы: оффлайн, Halyk, Wolt, iTeka."
        />
        <MetricCard
          title="COGS"
          value={formatCompact(s(pnl.cogs))}
          subtitle={`${formatPct(pnl.cogs / pnl.revenue * 100)} от выручки`}
          color="#f97316"
          delta={-((pnl.cogs / pnl.revenue * 100) - 77)}
          info="Себестоимость проданных товаров. Закупочная стоимость по средневзвешенной цене (WAC)."
        />
        <MetricCard
          title="Валовая маржа"
          value={formatPct(pnl.grossMarginPct)}
          subtitle={formatCompact(s(pnl.grossProfit))}
          benchmarkKey="grossMargin"
          numericValue={pnl.grossMarginPct}
          delta={pnl.grossMarginPct - TARGETS.grossMarginPct}
          info="Процент выручки после вычета себестоимости. Цель для КЗ аптеки с OTC-миксом: >22%."
        />
        <MetricCard
          title="EBITDA"
          value={formatPct(pnl.ebitdaPct)}
          subtitle={formatCompact(s(pnl.ebitda))}
          benchmarkKey="ebitda"
          numericValue={pnl.ebitdaPct}
          delta={pnl.ebitdaPct - TARGETS.ebitdaPct}
          info="Прибыль до амортизации, процентов и налогов. Операционная эффективность бизнеса. Цель: >6%."
        />
        <MetricCard
          title="Чистая прибыль"
          value={formatCompact(s(pnl.netProfit))}
          subtitle={`${formatPct(pnl.netMarginPct)} от выручки`}
          benchmarkKey="netMargin"
          numericValue={pnl.netMarginPct}
          delta={pnl.netMarginPct - TARGETS.netMarginPct}
          info="Финальная прибыль после всех расходов, амортизации и налогов."
        />
      </div>

      {/* Row 2: Operational Metrics — 5 cards, scrollable on small screens */}
      <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
        <MetricCard
          title="Рентабельность (РВС)"
          value={formatPct(cisProf)}
          subtitle={`Наценка ${data.markupPct.toFixed(0)}% × DOI ${data.daysOfInventory.toFixed(0)} дн.`}
          benchmarkKey="cisProfitability"
          numericValue={cisProf}
          delta={cisProf - TARGETS.cisProfitability}
          info="Рентабельность вложенных средств = Наценка × (365/DOI) × Коэф.кредита. Эффективность использования капитала. Цель: >25%."
        />
        <MetricCard
          title="Оборачиваемость"
          value={`${data.daysOfInventory.toFixed(0)} дн.`}
          subtitle="Дни запаса (DOI)"
          benchmarkKey="daysOfInventory"
          numericValue={data.daysOfInventory}
          delta={TARGETS.daysOfInventory - data.daysOfInventory}
          info="Дни запаса — за сколько дней продаётся средний запас. Меньше = лучше. Цель для КЗ: <30 дней."
        />
        <MetricCard
          title="Средний чек"
          value={formatTenge(data.avgCheckTenge)}
          subtitle={`${monthlySales.toLocaleString('ru-RU')} продаж/мес`}
          color="#a78bfa"
          delta={((data.avgCheckTenge - TARGETS.avgCheck) / TARGETS.avgCheck) * 100}
          info="Средняя сумма одной покупки. Рост ср.чека — ключевой рычаг увеличения выручки без роста трафика."
        />
        <MetricCard
          title="Конверсия"
          value={formatPct(conversionPct)}
          subtitle={`${data.dailyTraffic} вход. → ${data.dailySales} продаж/день`}
          color={conversionPct >= 65 ? '#22c55e' : '#eab308'}
          delta={conversionPct - TARGETS.conversionPct}
          info="Процент входящих посетителей, совершивших покупку. Низкая конверсия = дефектура, очереди или слабая консультация."
        />
        <MetricCard
          title="К выводу (FCFE)"
          value={formatCompact(s(pnl.netProfit + pnl.depreciation))}
          subtitle={`${formatPct((pnl.netProfit + pnl.depreciation) / pnl.revenue * 100)} от выручки`}
          color="#2dd4bf"
          info="Свободный денежный поток собственника. Чистая прибыль + амортизация. Сколько денег можно безопасно забрать из бизнеса без ущерба операциям."
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Performance Chart with toggle */}
        <PerformanceChart perfData={perfData} />

        {/* Cost Breakdown Donut */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Структура затрат</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {costData.map((_, i) => (
                    <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
                  formatter={(value: unknown) => [formatTenge(Number(value)), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: -10 }}>
              <div className="text-center">
                <div className="text-xs text-text-muted">Итого затрат</div>
                <div className="text-lg font-bold text-text">{formatCompact(totalCosts)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {costData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }} />
                <span className="text-text-secondary truncate">{d.name}</span>
                <span className="text-text-muted ml-auto">{((d.value / totalCosts) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary sections row — like TrueProfit Order Summary + Customer Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Summary */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Продажи</h3>
          <div className="space-y-3">
            <SummaryRow label="Продаж / день" value={data.dailySales.toString()} delta={data.dailySales > 120 ? 5.2 : -3.1} />
            <SummaryRow label="Продаж / месяц" value={monthlySales.toLocaleString('ru-RU')} />
            <SummaryRow label="Средний чек" value={formatTenge(data.avgCheckTenge)} delta={((data.avgCheckTenge - TARGETS.avgCheck) / TARGETS.avgCheck) * 100} />
            <SummaryRow label="Выручка / продажу" value={formatTenge(Math.round(pnl.revenue / monthlySales))} />
            <SummaryRow label="Прибыль / продажу" value={formatTenge(Math.round(pnl.netProfit / monthlySales))} delta={pnl.netProfit > 0 ? 0 : -100} />
          </div>
        </div>

        {/* Traffic Summary */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Трафик</h3>
          <div className="space-y-3">
            <SummaryRow label="Входящих / день" value={data.dailyTraffic.toString()} />
            <SummaryRow label="Конверсия" value={formatPct(conversionPct)} delta={conversionPct - TARGETS.conversionPct} />
            <SummaryRow label="Повторные клиенты" value={formatPct(data.repeatCustomerPct)} delta={data.repeatCustomerPct - 30} />
            <SummaryRow label="Фармацевтов в смене" value={data.pharmacistsOnShift.toString()} />
            <SummaryRow label="Площадь" value={`${data.areaSqm} м²`} />
          </div>
        </div>

        {/* Operational Summary */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Операционные</h3>
          <div className="space-y-3">
            <SummaryRow label="OPEX / выручка" value={formatPct(pnl.opexTotal / pnl.revenue * 100)} delta={-(pnl.opexTotal / pnl.revenue * 100 - 25)} />
            <SummaryRow label="ФОТ / выручка" value={formatPct(pnl.payroll / pnl.revenue * 100)} delta={-(pnl.payroll / pnl.revenue * 100 - 12)} />
            <SummaryRow label="Аренда / выручка" value={formatPct(pnl.rent / pnl.revenue * 100)} delta={-(pnl.rent / pnl.revenue * 100 - 8)} />
            <SummaryRow label="Выручка / м²" value={formatTenge(Math.round(pnl.revenue / data.areaSqm))} />
            <SummaryRow label="Выручка / фармацевт" value={formatCompact(pnl.revenue / data.pharmacistsOnShift)} />
          </div>
        </div>
      </div>

      {/* Pharmacy Comparison Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Сравнение аптек</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2 pr-4">Аптека</th>
                <th className="text-right py-2 px-3">Выручка</th>
                <th className="text-right py-2 px-3">GM%</th>
                <th className="text-right py-2 px-3">EBITDA%</th>
                <th className="text-right py-2 px-3">Чистая прибыль</th>
                <th className="text-right py-2 px-3">NM%</th>
                <th className="text-right py-2 px-3">DOI</th>
                <th className="text-right py-2 px-3">Ср. чек</th>
                <th className="text-right py-2 pl-3">Конверсия</th>
              </tr>
            </thead>
            <tbody>
              {PHARMACIES.map(p => {
                const r = computePnL(p);
                const conv = p.dailyTraffic > 0 ? (p.dailySales / p.dailyTraffic) * 100 : 0;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-navy/50">
                    <td className="py-2.5 pr-4 text-text">{p.name}</td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{formatCompact(r.revenue)}</td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{formatPct(r.grossMarginPct)}</td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{formatPct(r.ebitdaPct)}</td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{formatCompact(r.netProfit)}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${r.netMarginPct >= 4 ? 'text-success' : r.netMarginPct >= 1 ? 'text-warning' : 'text-danger'}`}>
                      {formatPct(r.netMarginPct)}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${p.daysOfInventory > 35 ? 'text-warning' : 'text-text-secondary'}`}>
                      {p.daysOfInventory} дн.
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{formatTenge(p.avgCheckTenge)}</td>
                    <td className={`py-2.5 pl-3 text-right ${conv >= 65 ? 'text-success' : 'text-warning'}`}>
                      {formatPct(conv)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-3">Рекомендации</h3>
        <div className="space-y-3">
          {insights.map((text, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-text-secondary">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Row Component ────────────────────────────────

interface SummaryRowProps {
  label: string;
  value: string;
  delta?: number;
}

// ─── Performance Chart with toggle ────────────────────────

type ChartView = 'pharmacies' | 'daily';

const DAILY_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 2_800_000;
  const variance = Math.sin(day * 0.5) * 400_000 + (Math.random() - 0.5) * 200_000;
  const rev = Math.round((base + variance) / 100_000) / 10;
  const costs = Math.round(rev * 0.78 * 10) / 10;
  const margin = Math.round(((rev - costs) / rev) * 1000) / 10;
  return {
    name: `${day} апр`,
    revenue: rev,
    costs,
    netMargin: margin,
  };
});

function PerformanceChart({ perfData }: { perfData: { name: string; revenue: number; costs: number; netMargin: number }[] }) {
  const [view, setView] = useState<ChartView>('pharmacies');
  const chartData = view === 'pharmacies' ? perfData : DAILY_DATA;

  return (
    <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">Performance</h3>
        <div className="flex gap-1 bg-navy rounded-lg p-0.5">
          <button
            onClick={() => setView('pharmacies')}
            className={`px-2.5 py-1 text-[10px] rounded-md transition-colors ${
              view === 'pharmacies' ? 'bg-accent/20 text-accent font-medium' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            По аптекам
          </button>
          <button
            onClick={() => setView('daily')}
            className={`px-2.5 py-1 text-[10px] rounded-md transition-colors ${
              view === 'daily' ? 'bg-accent/20 text-accent font-medium' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            По дням
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: view === 'daily' ? 9 : 11 }} axisLine={false} interval={view === 'daily' ? 4 : 0} />
          <YAxis yAxisId="left" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} unit="M" />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickFormatter={pctTickFormatter} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              if (name === 'netMargin') return [formatPct(v), 'Net Margin'];
              return [v + 'M ₸', name === 'revenue' ? 'Выручка' : 'Затраты'];
            }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="revenue" name="Выручка" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="costs" name="Затраты" fill="#475569" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" dataKey="netMargin" name="Net Margin" type="monotone" stroke={CHART_COLORS.margin} strokeWidth={2} dot={view === 'pharmacies' ? { fill: CHART_COLORS.margin, r: 4 } : false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Summary Row Component ────────────────────────────────

function SummaryRow({ label, value, delta }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text">{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[10px] font-medium ${delta > 0 ? 'text-success' : 'text-danger'}`}>
            {delta > 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
