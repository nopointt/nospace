import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { maxRegulatedMarkup, maxRegulatedPrice, isRegulatedViolation, blendedMarginPct, KZ_MARKUP_SCALE } from '../lib/formulas';
import { ALMATY_DEFAULTS } from '../lib/benchmarks';
import { formatTenge, formatPct } from '../lib/format';
import { pctFormatter } from '../lib/chart-helpers';
import { InputField } from '../components/InputField';
import { SettingsPanel } from '../components/SettingsPanel';

export function MarkupCheckerSection() {
  const [costPrice, setCostPrice] = useState(ALMATY_DEFAULTS.avgCostPrice);
  const [sellingPrice, setSellingPrice] = useState(Math.round(ALMATY_DEFAULTS.avgCostPrice * 1.3));
  const [freeMarkup, setFreeMarkup] = useState(ALMATY_DEFAULTS.markupPct);

  const maxMarkup = maxRegulatedMarkup(costPrice);
  const maxPrice = maxRegulatedPrice(costPrice);
  const isViolation = isRegulatedViolation(costPrice, sellingPrice);
  const actualMarkup = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;

  const scenarios = [10, 20, 30, 40, 50, 60].map(regShare => ({
    regSharePct: regShare,
    blendedMargin: blendedMarginPct(regShare, maxMarkup, freeMarkup),
    label: `${regShare}%`,
  }));

  const scaleData = KZ_MARKUP_SCALE.filter(t => t.maxCost !== Infinity).map(t => ({
    name: t.maxCost <= 1000 ? `≤${t.maxCost}` : `≤${(t.maxCost / 1000).toFixed(1)}K`,
    markup: t.markupPct,
    maxCost: t.maxCost,
  }));
  scaleData.push({ name: '>100K', markup: 5.0, maxCost: 100001 });

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Наценки КЗ — регуляция</h2>
      <p className="text-sm text-slate-500">Регрессивная шкала предельных наценок (Приказ МЗ РК, март 2025). Штраф за нарушение: до 3.9M ₸.</p>

      {/* Results — immediately visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-sm text-slate-500">Закупочная</div>
          <div className="text-xl font-semibold">{formatTenge(costPrice)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-sm text-slate-500">Макс. наценка</div>
          <div className="text-xl font-semibold">{formatPct(maxMarkup)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-sm text-slate-500">Предельная цена</div>
          <div className="text-xl font-semibold">{formatTenge(maxPrice)}</div>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${isViolation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className={`text-sm ${isViolation ? 'text-red-500' : 'text-green-500'}`}>Статус</div>
          <div className={`text-xl font-semibold ${isViolation ? 'text-red-700' : 'text-green-700'}`}>
            {isViolation ? 'Нарушение' : 'Норма'}
          </div>
        </div>
      </div>

      {/* Regressive scale chart — always visible */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Регрессивная шкала наценок</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={scaleData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 16]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={pctFormatter} />
            <Bar dataKey="markup" radius={[4, 4, 0, 0]}>
              {scaleData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={costPrice <= entry.maxCost && (index === 0 || costPrice > (scaleData[index - 1]?.maxCost ?? 0))
                    ? '#3b82f6'
                    : '#cbd5e1'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400">Закупочная цена {formatTenge(costPrice)} → категория с наценкой {formatPct(maxMarkup)}. Фактическая наценка: {formatPct(actualMarkup)}.</p>
      </div>

      {/* Blended margin scenarios — always visible */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Блендированная маржа</h3>
        <p className="text-xs text-slate-400 mb-4">Как доля регулируемых препаратов в выручке влияет на общую маржу. Наценка на свободные: {freeMarkup}%.</p>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={scenarios} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} label={{ value: 'Доля регулируемых в выручке', position: 'bottom', fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip formatter={pctFormatter} />
            <Line type="monotone" dataKey="blendedMargin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} name="Блендированная маржа" />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-center">
          {scenarios.map(s => (
            <div key={s.regSharePct} className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-500">Регул. {s.regSharePct}%</div>
              <div className="font-semibold text-slate-700">{formatPct(s.blendedMargin)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings — collapsed */}
      <SettingsPanel label="Настроить параметры проверки">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InputField label="Закупочная цена" value={costPrice} onChange={setCostPrice} suffix="₸" step={100} />
          <InputField label="Цена продажи" value={sellingPrice} onChange={setSellingPrice} suffix="₸" step={100} />
          <InputField label="Наценка на свободные" value={freeMarkup} onChange={setFreeMarkup} suffix="%" />
        </div>
      </SettingsPanel>
    </section>
  );
}
