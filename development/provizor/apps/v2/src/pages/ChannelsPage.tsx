import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type PharmacyData, computePnL } from '../lib/mock-data';
import { channelNetMarginPct, blendedChannelMargin, type ChannelData } from '../lib/formulas';
import { formatPct, formatCompact, formatTenge } from '../lib/format';
import { CHART_COLORS, pctTickFormatter } from '../lib/chart-helpers';
import { type DateRange, scaleByPeriod, periodSuffix } from '../lib/date-range';

interface ChannelsPageProps {
  data: PharmacyData;
  period: DateRange;
}

interface ChannelRow {
  name: string;
  share: number;
  commission: number;
  fulfillment: number;
  revenue: number;
  netMargin: number;
}

export function ChannelsPage({ data, period }: ChannelsPageProps) {
  const pnl = useMemo(() => computePnL(data), [data]);
  const gmPct = pnl.grossMarginPct;

  const channels: ChannelRow[] = useMemo(() => {
    const ch = [
      { name: 'Оффлайн', share: data.channels.offline, commission: 0, fulfillment: 0 },
      { name: 'Halyk Market', share: data.channels.halyk, commission: 12, fulfillment: 3 },
      { name: 'Wolt Apteka', share: data.channels.wolt, commission: 27, fulfillment: 0 },
      { name: 'iTeka', share: data.channels.iteka, commission: 5, fulfillment: 2 },
    ];

    return ch.map(c => ({
      ...c,
      revenue: data.revenue * (c.share / 100),
      netMargin: channelNetMarginPct(gmPct, c.commission, c.fulfillment),
    }));
  }, [data, gmPct]);

  const channelDataForFormula: ChannelData[] = channels.map(c => ({
    name: c.name,
    revenue: c.revenue,
    commissionPct: c.commission,
    fulfillmentCostPct: c.fulfillment,
  }));

  const blendedMargin = blendedChannelMargin(channelDataForFormula, gmPct);

  const chartData = channels.map(c => ({
    name: c.name,
    netMargin: Math.round(c.netMargin * 10) / 10,
  }));

  const unprofitable = channels.filter(c => c.netMargin < 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map(c => (
          <div key={c.name} className={`bg-card rounded-xl border p-4 ${c.netMargin < 0 ? 'border-danger/30' : 'border-border'}`}>
            <div className="text-xs text-text-muted uppercase tracking-wide mb-1">{c.name}</div>
            <div className={`text-2xl font-bold ${c.netMargin < 0 ? 'text-danger' : c.netMargin >= gmPct * 0.8 ? 'text-success' : 'text-warning'}`}>
              {formatPct(c.netMargin)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {c.share.toFixed(0)}% выручки · {formatCompact(scaleByPeriod(c.revenue, period))}{periodSuffix(period)}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Чистая маржа по каналам</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickFormatter={pctTickFormatter} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
                formatter={(value: unknown) => [formatPct(Number(value)), 'Net Margin']}
              />
              <ReferenceLine x={0} stroke={CHART_COLORS.grid} />
              <Bar dataKey="netMargin" radius={[0, 4, 4, 0]} fill={CHART_COLORS.revenue}>
                {/* Color each bar based on positive/negative */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detail table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Детализация</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2">Канал</th>
                <th className="text-right py-2">Доля</th>
                <th className="text-right py-2">Комиссия</th>
                <th className="text-right py-2">Фулфилм.</th>
                <th className="text-right py-2">Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(c => (
                <tr key={c.name} className="border-t border-border">
                  <td className="py-2.5 text-text">{c.name}</td>
                  <td className="py-2.5 text-right text-text-secondary">{c.share.toFixed(0)}%</td>
                  <td className="py-2.5 text-right text-text-muted">{c.commission > 0 ? `${c.commission}%` : '—'}</td>
                  <td className="py-2.5 text-right text-text-muted">{c.fulfillment > 0 ? `${c.fulfillment}%` : '—'}</td>
                  <td className={`py-2.5 text-right font-medium ${c.netMargin < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatPct(c.netMargin)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2.5 text-accent">Блендированная маржа</td>
                <td className="py-2.5 text-right text-text-secondary">100%</td>
                <td className="py-2.5" colSpan={2} />
                <td className="py-2.5 text-right text-accent">{formatPct(blendedMargin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      {unprofitable.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-danger mb-2">Убыточные каналы</h3>
          <div className="space-y-2">
            {unprofitable.map(c => (
              <p key={c.name} className="text-sm text-text-secondary">
                <span className="font-medium text-danger">{c.name}</span> — чистая маржа {formatPct(c.netMargin)}.
                Комиссия {c.commission}% + фулфилмент {c.fulfillment}% = {c.commission + c.fulfillment}% превышает валовую маржу {formatPct(gmPct)}.
                Потери: {formatTenge(Math.abs(c.netMargin / 100 * c.revenue))}/мес.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Blended impact */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-2">Влияние каналов на общую маржу</h3>
        <p className="text-sm text-text-secondary">
          Валовая маржа (оффлайн): <span className="text-success font-medium">{formatPct(gmPct)}</span>.
          После учёта комиссий всех каналов, блендированная маржа: <span className="text-accent font-medium">{formatPct(blendedMargin)}</span>.
          Разница: <span className="text-warning font-medium">{formatPct(gmPct - blendedMargin)}</span> — это цена мультиканальности.
        </p>
      </div>
    </div>
  );
}
