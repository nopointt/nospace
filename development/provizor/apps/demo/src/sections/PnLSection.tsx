import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  cogsFromMarkup, grossProfit, grossMarginPct,
  opexTotal, opexPct, ebitda, ebitdaPct,
  netProfit, netMarginPct,
} from '../lib/formulas';
import { ALMATY_DEFAULTS } from '../lib/benchmarks';
import { formatTenge, formatPct, formatCompact } from '../lib/format';
import { tengeFormatter, compactFormatter } from '../lib/chart-helpers';
import { MetricCard } from '../components/MetricCard';
import { InputField } from '../components/InputField';
import { SettingsPanel } from '../components/SettingsPanel';

export function PnLSection() {
  const d = ALMATY_DEFAULTS;
  const [revenue, setRevenue] = useState(d.revenuePerPharmacy);
  const [markupPct, setMarkupPct] = useState(d.markupPct);
  const [payroll, setPayroll] = useState(d.payrollPerPharmacy);
  const [rent, setRent] = useState(d.rentPerPharmacy);
  const [utilities, setUtilities] = useState(d.utilitiesPerPharmacy);
  const [admin, setAdmin] = useState(d.adminPerPharmacy);
  const [software, setSoftware] = useState(d.softwarePerPharmacy);
  const [marketing, setMarketing] = useState(d.marketingPerPharmacy);
  const [depreciation, setDepreciation] = useState(d.depreciation);
  const [interest, setInterest] = useState(d.interest);
  const [taxRate, setTaxRate] = useState(d.taxRate);

  const calc = useMemo(() => {
    const cogsVal = cogsFromMarkup(revenue, markupPct);
    const gpVal = grossProfit(revenue, cogsVal);
    const gmPct = grossMarginPct(revenue, cogsVal);
    const opex = opexTotal(payroll, rent, utilities, admin, software, marketing);
    const opPct = opexPct(opex, revenue);
    const ebitdaVal = ebitda(gpVal, opex);
    const ebitdaPctVal = ebitdaPct(ebitdaVal, revenue);
    const npVal = netProfit(ebitdaVal, depreciation, interest, taxRate);
    const nmPct = netMarginPct(npVal, revenue);

    return { cogsVal, gpVal, gmPct, opex, opPct, ebitdaVal, ebitdaPctVal, npVal, nmPct };
  }, [revenue, markupPct, payroll, rent, utilities, admin, software, marketing, depreciation, interest, taxRate]);

  const waterfallBars = useMemo(() => {
    const data = [
      { name: 'Выручка', value: revenue, total: revenue, color: '#3b82f6' },
      { name: 'Себестоимость', value: -calc.cogsVal, total: revenue - calc.cogsVal, color: '#ef4444' },
      { name: 'Валовая прибыль', value: calc.gpVal, total: calc.gpVal, color: '#10b981' },
      { name: 'ФОТ', value: -payroll, total: calc.gpVal - payroll, color: '#f97316' },
      { name: 'Аренда', value: -rent, total: calc.gpVal - payroll - rent, color: '#f97316' },
      { name: 'Прочие', value: -(utilities + admin + software + marketing), total: calc.ebitdaVal, color: '#f97316' },
      { name: 'EBITDA', value: calc.ebitdaVal, total: calc.ebitdaVal, color: calc.ebitdaVal >= 0 ? '#10b981' : '#ef4444' },
      { name: 'Чистая', value: calc.npVal, total: calc.npVal, color: calc.npVal >= 0 ? '#16a34a' : '#dc2626' },
    ];
    return data.map((item, i) => {
      if (i === 0 || item.name === 'Валовая прибыль' || item.name === 'EBITDA' || item.name === 'Чистая') {
        return { ...item, base: 0, height: Math.abs(item.value) };
      }
      return { ...item, base: Math.max(0, item.total), height: Math.abs(item.value) };
    });
  }, [revenue, calc, payroll, rent, utilities, admin, software, marketing]);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">P&L — 1 аптека / месяц</h2>
      <p className="text-sm text-slate-500">Бенчмарки средней аптеки Алматы (~17.5M ₸/мес). Выручка {formatCompact(revenue)}, наценка {markupPct}%.</p>

      {/* Metric cards — immediately visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Валовая маржа" value={formatPct(calc.gmPct)} benchmarkKey="grossMargin" numericValue={calc.gmPct} subtitle={formatTenge(calc.gpVal)} />
        <MetricCard title="OPEX / Выручка" value={formatPct(calc.opPct)} benchmarkKey="opex" numericValue={calc.opPct} subtitle={formatTenge(calc.opex)} />
        <MetricCard title="EBITDA" value={formatPct(calc.ebitdaPctVal)} benchmarkKey="ebitda" numericValue={calc.ebitdaPctVal} subtitle={formatTenge(calc.ebitdaVal)} />
        <MetricCard title="Чистая прибыль" value={formatPct(calc.nmPct)} benchmarkKey="netMargin" numericValue={calc.nmPct} subtitle={formatTenge(calc.npVal)} />
      </div>

      {/* Waterfall chart — immediately visible */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Водопадная диаграмма P&L</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={waterfallBars} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tickFormatter={compactFormatter} tick={{ fontSize: 11 }} />
            <Tooltip formatter={tengeFormatter} labelStyle={{ fontWeight: 600 }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="base" stackId="stack" fill="transparent" />
            <Bar dataKey="height" stackId="stack" radius={[4, 4, 0, 0]}>
              {waterfallBars.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* P&L table — collapsible */}
      <SettingsPanel label="Детальный P&L (таблица)">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-slate-500 font-medium">Статья</th>
              <th className="text-right py-2 text-slate-500 font-medium">Сумма</th>
              <th className="text-right py-2 text-slate-500 font-medium">% выручки</th>
            </tr>
          </thead>
          <tbody>
            <PnlRow label="Выручка" value={revenue} pct={100} bold />
            <PnlRow label="Себестоимость (COGS)" value={-calc.cogsVal} pct={-(calc.cogsVal / revenue * 100)} />
            <PnlRow label="Валовая прибыль" value={calc.gpVal} pct={calc.gmPct} bold color="#10b981" />
            <PnlRow label="  ФОТ" value={-payroll} pct={-(payroll / revenue * 100)} indent />
            <PnlRow label="  Аренда" value={-rent} pct={-(rent / revenue * 100)} indent />
            <PnlRow label="  Коммуналка" value={-utilities} pct={-(utilities / revenue * 100)} indent />
            <PnlRow label="  Администрирование" value={-admin} pct={-(admin / revenue * 100)} indent />
            <PnlRow label="  Софт / IT" value={-software} pct={-(software / revenue * 100)} indent />
            <PnlRow label="  Маркетинг" value={-marketing} pct={-(marketing / revenue * 100)} indent />
            <PnlRow label="EBITDA" value={calc.ebitdaVal} pct={calc.ebitdaPctVal} bold color={calc.ebitdaVal >= 0 ? '#10b981' : '#ef4444'} />
            <PnlRow label="  Амортизация" value={-depreciation} pct={-(depreciation / revenue * 100)} indent />
            <PnlRow label="  Проценты" value={-interest} pct={-(interest / revenue * 100)} indent />
            <PnlRow label={`  Налог (${taxRate}%)`} value={-(calc.ebitdaVal - depreciation - interest) * taxRate / 100} pct={-((calc.ebitdaVal - depreciation - interest) * taxRate / 100 / revenue * 100)} indent />
            <PnlRow label="Чистая прибыль" value={calc.npVal} pct={calc.nmPct} bold color={calc.npVal >= 0 ? '#16a34a' : '#dc2626'} />
          </tbody>
        </table>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
          На 5 аптек: выручка {formatCompact(revenue * 5)}, чистая прибыль {formatCompact(calc.npVal * 5)} / мес
        </div>
      </SettingsPanel>

      {/* Insights */}
      <InsightsBlock calc={calc} revenue={revenue} payroll={payroll} rent={rent} />

      {/* Settings — collapsed at bottom */}
      <SettingsPanel label="Настроить входные данные">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField label="Выручка" value={revenue} onChange={setRevenue} suffix="₸" step={100000} />
          <InputField label="Наценка" value={markupPct} onChange={setMarkupPct} suffix="%" />
          <InputField label="ФОТ" value={payroll} onChange={setPayroll} suffix="₸" step={50000} />
          <InputField label="Аренда" value={rent} onChange={setRent} suffix="₸" step={50000} />
          <InputField label="Коммуналка" value={utilities} onChange={setUtilities} suffix="₸" step={10000} />
          <InputField label="Администрирование" value={admin} onChange={setAdmin} suffix="₸" step={10000} />
          <InputField label="Софт / IT" value={software} onChange={setSoftware} suffix="₸" step={10000} />
          <InputField label="Маркетинг" value={marketing} onChange={setMarketing} suffix="₸" step={10000} />
          <InputField label="Амортизация" value={depreciation} onChange={setDepreciation} suffix="₸" step={10000} />
          <InputField label="Проценты по кредиту" value={interest} onChange={setInterest} suffix="₸" step={10000} />
          <InputField label="Ставка налога" value={taxRate} onChange={setTaxRate} suffix="%" />
        </div>
      </SettingsPanel>
    </section>
  );
}

function InsightsBlock({ calc, revenue, payroll, rent }: {
  calc: { gmPct: number; opPct: number; ebitdaPctVal: number; nmPct: number; npVal: number };
  revenue: number; payroll: number; rent: number;
}) {
  const insights: string[] = [];

  if (calc.gmPct < 22) {
    insights.push(`Валовая маржа ${formatPct(calc.gmPct)} — в жёлтой/красной зоне. Для КЗ аптеки с OTC-фокусом целевая: >22%. Рычаг: увеличить наценку на свободные препараты.`);
  }

  const payPct = (payroll / revenue) * 100;
  if (payPct > 12) {
    insights.push(`ФОТ ${formatPct(payPct)} от выручки — выше бенчмарка (12%). Оптимизация графиков или автоматизация процессов могут снизить на 2-3pp.`);
  }

  const rentP = (rent / revenue) * 100;
  if (rentP > 8) {
    insights.push(`Аренда ${formatPct(rentP)} — выше бенчмарка (8%). В Алматы это нормально для центральных локаций, но влияет на чистую прибыль.`);
  }

  if (calc.nmPct >= 4) {
    insights.push(`Чистая маржа ${formatPct(calc.nmPct)} — в зелёной зоне. Аптека работает эффективнее среднего по рынку (бенчмарк: 3-6%).`);
  }

  insights.push(`На 5 аптек чистая прибыль ${formatCompact(calc.npVal * 5)}/мес. Увеличение наценки на 2pp даст дополнительно ~${formatCompact(revenue * 0.02 * 5 * 0.8)}/мес по сети.`);

  if (insights.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-blue-800 mb-3">Выводы</h3>
      <div className="space-y-2">
        {insights.map((text, i) => (
          <p key={i} className="text-sm text-blue-700 flex items-start gap-2">
            <span className="shrink-0 text-blue-400 mt-0.5">—</span>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}

function PnlRow({ label, value, pct, bold, color, indent }: {
  label: string; value: number; pct: number; bold?: boolean; color?: string; indent?: boolean;
}) {
  return (
    <tr className="border-t border-slate-50">
      <td className={`py-1.5 ${bold ? 'font-semibold' : ''} ${indent ? 'text-slate-500' : 'text-slate-700'}`} style={{ color: bold ? color : undefined }}>
        {label}
      </td>
      <td className={`py-1.5 text-right ${bold ? 'font-semibold' : ''}`} style={{ color: bold ? color : undefined }}>
        {formatTenge(value)}
      </td>
      <td className="py-1.5 text-right text-slate-400">
        {formatPct(Math.abs(pct))}
      </td>
    </tr>
  );
}
