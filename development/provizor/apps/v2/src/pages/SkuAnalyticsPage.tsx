import { useState, useMemo } from 'react';
import { MOCK_SKUS, type SkuData } from '../lib/mock-data';
import { maxRegulatedMarkup, maxRegulatedPrice, isRegulatedViolation } from '../lib/formulas';
import { formatTenge, formatPct } from '../lib/format';
import type { DateRange } from '../lib/date-range';

type Filter = 'all' | 'regulated' | 'free';
type SortKey = 'revenue' | 'markup' | 'units' | 'grossProfit' | 'netProfit';

// Column definitions
interface ColumnDef {
  key: string;
  label: string;
  group: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Препарат', group: 'Основные', defaultVisible: true },
  { key: 'category', label: 'Категория', group: 'Основные', defaultVisible: true },
  { key: 'costPrice', label: 'Себестоимость', group: 'Основные', defaultVisible: true },
  { key: 'sellingPrice', label: 'Цена', group: 'Основные', defaultVisible: true },
  { key: 'markup', label: 'Наценка %', group: 'Маржа', defaultVisible: true },
  { key: 'margin', label: 'Маржа %', group: 'Маржа', defaultVisible: true },
  { key: 'unitsSold', label: 'Продажи (шт.)', group: 'Продажи', defaultVisible: true },
  { key: 'revenue', label: 'Выручка', group: 'Продажи', defaultVisible: true },
  { key: 'grossProfit', label: 'Вал. прибыль', group: 'Маржа', defaultVisible: false },
  { key: 'netProfit', label: 'Чистая прибыль', group: 'Маржа', defaultVisible: false },
  { key: 'revenueShare', label: 'Доля выручки', group: 'Продажи', defaultVisible: false },
  { key: 'regulated', label: 'Регулируемый', group: 'Основные', defaultVisible: true },
];

function skuMarkupPct(sku: SkuData): number {
  return ((sku.sellingPrice - sku.costPrice) / sku.costPrice) * 100;
}
function skuMarginPct(sku: SkuData): number {
  return ((sku.sellingPrice - sku.costPrice) / sku.sellingPrice) * 100;
}
function skuRevenue(sku: SkuData): number {
  return sku.sellingPrice * sku.unitsSold;
}
function skuGrossProfit(sku: SkuData): number {
  return (sku.sellingPrice - sku.costPrice) * sku.unitsSold;
}
function skuNetProfit(sku: SkuData): number {
  return skuGrossProfit(sku) * 0.8; // simplified: 20% tax
}

function exportCSV(data: SkuData[]) {
  const headers = ['Препарат', 'Категория', 'Себестоимость', 'Цена', 'Наценка%', 'Маржа%', 'Продажи', 'Выручка', 'Вал.прибыль', 'Регулируемый'];
  const rows = data.map(sku => [
    sku.name,
    sku.category,
    sku.costPrice,
    sku.sellingPrice,
    skuMarkupPct(sku).toFixed(1),
    skuMarginPct(sku).toFixed(1),
    sku.unitsSold,
    skuRevenue(sku),
    skuGrossProfit(sku),
    sku.regulated ? 'Да' : 'Нет',
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'provizor-sku-analytics.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function SkuAnalyticsPage({ period: _period }: { period: DateRange }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showCustomize, setShowCustomize] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );

  const filtered = useMemo(() => {
    let items = MOCK_SKUS;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    if (filter === 'regulated') items = items.filter(s => s.regulated);
    if (filter === 'free') items = items.filter(s => !s.regulated);

    const sorted = [...items];
    if (sortBy === 'revenue') sorted.sort((a, b) => skuRevenue(b) - skuRevenue(a));
    if (sortBy === 'markup') sorted.sort((a, b) => skuMarkupPct(b) - skuMarkupPct(a));
    if (sortBy === 'units') sorted.sort((a, b) => b.unitsSold - a.unitsSold);
    if (sortBy === 'grossProfit') sorted.sort((a, b) => skuGrossProfit(b) - skuGrossProfit(a));
    if (sortBy === 'netProfit') sorted.sort((a, b) => skuNetProfit(b) - skuNetProfit(a));
    return sorted;
  }, [search, filter, sortBy]);

  const totalRevenue = filtered.reduce((s, sk) => s + skuRevenue(sk), 0);
  const totalCost = filtered.reduce((s, sk) => s + sk.costPrice * sk.unitsSold, 0);
  const totalUnits = filtered.reduce((s, sk) => s + sk.unitsSold, 0);
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleCol = (key: string) => {
    const next = new Set(visibleCols);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisibleCols(next);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-3 py-2.5 text-xs text-text-secondary hover:text-text bg-card border border-border rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-1 bg-card rounded-lg border border-border p-0.5">
          {([['all', 'Все'], ['regulated', 'Регулируемые'], ['free', 'Свободные']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilter(id); setPage(0); }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === id ? 'bg-accent/20 text-accent font-medium' : 'text-text-secondary hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-secondary focus:outline-none focus:border-accent"
        >
          <option value="revenue">По выручке</option>
          <option value="markup">По наценке</option>
          <option value="units">По продажам</option>
          <option value="grossProfit">По вал. прибыли</option>
          <option value="netProfit">По чистой прибыли</option>
        </select>

        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg border transition-colors ${
            showCustomize ? 'bg-accent/20 text-accent border-accent/30' : 'text-text-secondary hover:text-text bg-card border-border'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Customize
        </button>
      </div>

      {/* Customize panel */}
      {showCustomize && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-xs text-text-muted uppercase tracking-wide mb-3">Видимые колонки</div>
          <div className="flex flex-wrap gap-2">
            {ALL_COLUMNS.filter(c => c.key !== 'name').map(col => (
              <button
                key={col.key}
                onClick={() => toggleCol(col.key)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  visibleCols.has(col.key)
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'text-text-muted border-border hover:text-text-secondary'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {visibleCols.has('name') && <th className="text-left py-3 px-4 text-xs text-text-muted uppercase tracking-wide font-medium">Препарат</th>}
                {visibleCols.has('category') && <th className="text-left py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Категория</th>}
                {visibleCols.has('costPrice') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Себест.</th>}
                {visibleCols.has('sellingPrice') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Цена</th>}
                {visibleCols.has('markup') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Наценка</th>}
                {visibleCols.has('margin') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Маржа</th>}
                {visibleCols.has('unitsSold') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Прод.</th>}
                {visibleCols.has('revenue') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Выручка</th>}
                {visibleCols.has('grossProfit') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Вал.приб.</th>}
                {visibleCols.has('netProfit') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Чист.приб.</th>}
                {visibleCols.has('revenueShare') && <th className="text-right py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Доля</th>}
                {visibleCols.has('regulated') && <th className="text-center py-3 px-3 text-xs text-text-muted uppercase tracking-wide font-medium">Статус</th>}
              </tr>
            </thead>
            <tbody>
              {/* Totals */}
              <tr className="bg-navy/50 border-b border-border font-semibold">
                {visibleCols.has('name') && <td className="py-2.5 px-4 text-text">Итого ({filtered.length})</td>}
                {visibleCols.has('category') && <td />}
                {visibleCols.has('costPrice') && <td />}
                {visibleCols.has('sellingPrice') && <td />}
                {visibleCols.has('markup') && <td />}
                {visibleCols.has('margin') && <td className="py-2.5 px-3 text-right text-accent">{formatPct(avgMargin)}</td>}
                {visibleCols.has('unitsSold') && <td className="py-2.5 px-3 text-right text-text-secondary">{totalUnits.toLocaleString('ru-RU')}</td>}
                {visibleCols.has('revenue') && <td className="py-2.5 px-3 text-right text-accent">{formatTenge(totalRevenue)}</td>}
                {visibleCols.has('grossProfit') && <td className="py-2.5 px-3 text-right text-accent">{formatTenge(totalRevenue - totalCost)}</td>}
                {visibleCols.has('netProfit') && <td className="py-2.5 px-3 text-right text-accent">{formatTenge((totalRevenue - totalCost) * 0.8)}</td>}
                {visibleCols.has('revenueShare') && <td className="py-2.5 px-3 text-right text-text-muted">100%</td>}
                {visibleCols.has('regulated') && <td />}
              </tr>

              {paged.map(sku => {
                const markup = skuMarkupPct(sku);
                const margin = skuMarginPct(sku);
                const rev = skuRevenue(sku);
                const gp = skuGrossProfit(sku);
                const np = skuNetProfit(sku);
                const violation = sku.regulated && isRegulatedViolation(sku.costPrice, sku.sellingPrice);
                const maxMarkup = sku.regulated ? maxRegulatedMarkup(sku.costPrice) : null;

                return (
                  <tr key={sku.id} className={`border-t border-border hover:bg-navy/30 ${violation ? 'bg-danger/5' : ''}`}>
                    {visibleCols.has('name') && <td className="py-2.5 px-4 text-text">{sku.name}</td>}
                    {visibleCols.has('category') && <td className="py-2.5 px-3 text-text-muted text-xs">{sku.category}</td>}
                    {visibleCols.has('costPrice') && <td className="py-2.5 px-3 text-right text-text-secondary">{formatTenge(sku.costPrice)}</td>}
                    {visibleCols.has('sellingPrice') && (
                      <td className={`py-2.5 px-3 text-right ${violation ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                        {formatTenge(sku.sellingPrice)}
                        {violation && <div className="text-[10px] text-danger">макс: {formatTenge(maxRegulatedPrice(sku.costPrice))}</div>}
                      </td>
                    )}
                    {visibleCols.has('markup') && (
                      <td className={`py-2.5 px-3 text-right ${violation ? 'text-danger' : 'text-text-secondary'}`}>
                        {formatPct(markup)}
                        {maxMarkup !== null && <div className="text-[10px] text-text-muted">макс: {formatPct(maxMarkup)}</div>}
                      </td>
                    )}
                    {visibleCols.has('margin') && <td className="py-2.5 px-3 text-right text-text-secondary">{formatPct(margin)}</td>}
                    {visibleCols.has('unitsSold') && <td className="py-2.5 px-3 text-right text-text-secondary">{sku.unitsSold}</td>}
                    {visibleCols.has('revenue') && <td className="py-2.5 px-3 text-right text-text-secondary">{formatTenge(rev)}</td>}
                    {visibleCols.has('grossProfit') && <td className="py-2.5 px-3 text-right text-success">{formatTenge(gp)}</td>}
                    {visibleCols.has('netProfit') && <td className="py-2.5 px-3 text-right text-success">{formatTenge(np)}</td>}
                    {visibleCols.has('revenueShare') && <td className="py-2.5 px-3 text-right text-text-muted">{formatPct(rev / totalRevenue * 100)}</td>}
                    {visibleCols.has('regulated') && (
                      <td className="py-2.5 px-3 text-center">
                        {sku.regulated ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning/20 text-warning">Регул.</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-success/20 text-success">Своб.</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="bg-navy border border-border rounded px-2 py-1 text-xs text-text-secondary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-text-muted">записей</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-xs text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Пред.
            </button>
            <span className="text-xs text-text-muted">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} из {filtered.length}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            >
              След. →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
