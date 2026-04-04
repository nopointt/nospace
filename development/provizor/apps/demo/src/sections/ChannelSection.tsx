import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { channelSharePct, channelNetMarginPct } from '../lib/formulas';
import { ALMATY_DEFAULTS } from '../lib/benchmarks';
import { formatPct, formatCompact } from '../lib/format';
import { pctFormatter } from '../lib/chart-helpers';
import { SettingsPanel } from '../components/SettingsPanel';

interface ChannelInput {
  name: string;
  label: string;
  revenue: number;
  commissionPct: number;
  fulfillmentPct: number;
}

export function ChannelSection() {
  const d = ALMATY_DEFAULTS;
  const totalRev = d.revenuePerPharmacy;

  const [grossMargin, setGrossMargin] = useState(23);
  const [channels, setChannels] = useState<ChannelInput[]>([
    { name: 'offline', label: 'Оффлайн', revenue: totalRev * d.channels.offline.share / 100, commissionPct: d.channels.offline.commission, fulfillmentPct: d.channels.offline.fulfillment },
    { name: 'halyk', label: 'Halyk Market', revenue: totalRev * d.channels.halykMarket.share / 100, commissionPct: d.channels.halykMarket.commission, fulfillmentPct: d.channels.halykMarket.fulfillment },
    { name: 'wolt', label: 'Wolt Apteka', revenue: totalRev * d.channels.wolt.share / 100, commissionPct: d.channels.wolt.commission, fulfillmentPct: d.channels.wolt.fulfillment },
    { name: 'iteka', label: 'iTeka', revenue: totalRev * d.channels.iteka.share / 100, commissionPct: d.channels.iteka.commission, fulfillmentPct: d.channels.iteka.fulfillment },
  ]);

  const updateChannel = (index: number, field: keyof ChannelInput, value: number) => {
    const updated = channels.map((ch, i) =>
      i === index ? { ...ch, [field]: value } : ch
    );
    setChannels(updated);
  };

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);

  const analysis = useMemo(() => {
    return channels.map(ch => {
      const share = channelSharePct(ch.revenue, totalRevenue);
      const netMargin = channelNetMarginPct(grossMargin, ch.commissionPct, ch.fulfillmentPct);
      const netProfit = ch.revenue * netMargin / 100;
      const isProfitable = netMargin > 0;
      return {
        ...ch,
        share,
        netMargin,
        netProfit,
        isProfitable,
        grossProfit: ch.revenue * grossMargin / 100,
        commissionCost: ch.revenue * ch.commissionPct / 100,
        fulfillmentCost: ch.revenue * ch.fulfillmentPct / 100,
      };
    });
  }, [channels, grossMargin, totalRevenue]);

  const barData = analysis.map(a => ({
    name: a.label,
    netMargin: a.netMargin,
    color: a.netMargin >= 15 ? '#16a34a' : a.netMargin >= 5 ? '#ca8a04' : a.netMargin >= 0 ? '#f97316' : '#dc2626',
  }));

  const unprofitable = analysis.filter(a => !a.isProfitable);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Маржа по каналам продаж</h2>
      <p className="text-sm text-slate-500">
        Оффлайн vs маркетплейсы. Валовая маржа {grossMargin}%. Ни один конкурент не показывает эту аналитику.
      </p>

      {/* Unprofitable alert — top, immediately visible */}
      {unprofitable.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm font-medium text-red-700">
            Убыточные каналы: {unprofitable.map(u => u.label).join(', ')}
          </div>
          <p className="text-xs text-red-500 mt-1">
            Комиссии маркетплейса превышают валовую маржу. Рекомендация: исключить низкомаржинальные SKU или пересмотреть ценообразование.
          </p>
        </div>
      )}

      {/* Chart — immediately visible */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Чистая маржа по каналам</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={pctFormatter} />
            <Bar dataKey="netMargin" radius={[6, 6, 0, 0]} name="Чистая маржа">
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Results table — immediately visible */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Экономика каналов</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-slate-500">Канал</th>
              <th className="text-right py-2 text-slate-500">Выручка</th>
              <th className="text-right py-2 text-slate-500">Доля</th>
              <th className="text-right py-2 text-slate-500">Валовая</th>
              <th className="text-right py-2 text-slate-500">Комиссия</th>
              <th className="text-right py-2 text-slate-500">Чистая маржа</th>
              <th className="text-right py-2 text-slate-500">Чистая прибыль</th>
            </tr>
          </thead>
          <tbody>
            {analysis.map(a => (
              <tr key={a.name} className={`border-t border-slate-50 ${!a.isProfitable ? 'bg-red-50' : ''}`}>
                <td className="py-2 font-medium text-slate-700">{a.label}</td>
                <td className="py-2 text-right">{formatCompact(a.revenue)}</td>
                <td className="py-2 text-right">{formatPct(a.share)}</td>
                <td className="py-2 text-right">{formatCompact(a.grossProfit)}</td>
                <td className="py-2 text-right text-red-500">-{formatCompact(a.commissionCost + a.fulfillmentCost)}</td>
                <td className={`py-2 text-right font-semibold ${a.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPct(a.netMargin)}
                </td>
                <td className={`py-2 text-right font-semibold ${a.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCompact(a.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-semibold">
              <td className="py-2 text-slate-700">Итого</td>
              <td className="py-2 text-right">{formatCompact(totalRevenue)}</td>
              <td className="py-2 text-right">100%</td>
              <td className="py-2 text-right">{formatCompact(analysis.reduce((s, a) => s + a.grossProfit, 0))}</td>
              <td className="py-2 text-right text-red-500">-{formatCompact(analysis.reduce((s, a) => s + a.commissionCost + a.fulfillmentCost, 0))}</td>
              <td className="py-2 text-right">{formatPct(analysis.reduce((s, a) => s + a.share * a.netMargin / 100, 0))}</td>
              <td className="py-2 text-right">{formatCompact(analysis.reduce((s, a) => s + a.netProfit, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">Выводы</h3>
        <div className="space-y-2">
          {unprofitable.length > 0 && (
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <span className="shrink-0 text-blue-400 mt-0.5">—</span>
              {unprofitable.map(u => u.label).join(', ')} убыточн{unprofitable.length > 1 ? 'ы' : ''} при текущей марже. Выход: убрать низкомаржинальные SKU (дешевле 3,000₸) или поднять цену на этих каналах.
            </p>
          )}
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <span className="shrink-0 text-blue-400 mt-0.5">—</span>
            Ни один конкурент (SmartApteka, Опора, М-Аптека) не показывает маржу по каналам. Это ваш эксклюзивный инструмент для принятия решений.
          </p>
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <span className="shrink-0 text-blue-400 mt-0.5">—</span>
            Оффлайн канал ({formatPct(analysis[0]?.netMargin ?? 0)} маржа) — самый рентабельный. Рост оффлайн трафика даёт максимальный ROI.
          </p>
        </div>
      </div>

      {/* Settings — collapsed */}
      <SettingsPanel label="Настроить каналы и комиссии">
        <div className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-sm text-slate-600 mb-1">Валовая маржа (GM%)</label>
            <input
              type="number"
              value={grossMargin}
              onChange={e => setGrossMargin(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              step={0.5}
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-500 font-medium">Канал</th>
                <th className="text-right py-2 text-slate-500 font-medium">Выручка/мес</th>
                <th className="text-right py-2 text-slate-500 font-medium">Комиссия %</th>
                <th className="text-right py-2 text-slate-500 font-medium">Фулфилмент %</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr key={ch.name} className="border-t border-slate-50">
                  <td className="py-2 font-medium text-slate-700">{ch.label}</td>
                  <td className="py-2">
                    <input type="number" value={ch.revenue} onChange={e => updateChannel(i, 'revenue', Number(e.target.value))} className="w-32 px-2 py-1 text-right rounded border border-slate-200 text-sm" step={100000} />
                  </td>
                  <td className="py-2">
                    <input type="number" value={ch.commissionPct} onChange={e => updateChannel(i, 'commissionPct', Number(e.target.value))} className="w-20 px-2 py-1 text-right rounded border border-slate-200 text-sm" step={0.5} />
                  </td>
                  <td className="py-2">
                    <input type="number" value={ch.fulfillmentPct} onChange={e => updateChannel(i, 'fulfillmentPct', Number(e.target.value))} className="w-20 px-2 py-1 text-right rounded border border-slate-200 text-sm" step={0.5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsPanel>
    </section>
  );
}
