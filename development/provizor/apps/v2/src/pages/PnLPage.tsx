import { useMemo, useState } from 'react';
import { type PharmacyData, computePnL, networkTotal, type PnLResult } from '../lib/mock-data';
import { formatTenge, formatPct } from '../lib/format';
import { type DateRange, periodSuffix } from '../lib/date-range';

interface PnLPageProps {
  pharmacies: PharmacyData[];
  selectedId: number;
  period: DateRange;
}

type ViewMode = 'pharmacies' | 'months';

interface PnLRow {
  label: string;
  key: keyof PnLResult;
  isBold?: boolean;
  isPct?: boolean;
  isNegative?: boolean;
  indent?: number;
  parentKey?: string; // for collapsible groups
}

const PNL_ROWS: PnLRow[] = [
  { label: 'Выручка', key: 'revenue', isBold: true },
  { label: 'Себестоимость (COGS)', key: 'cogs', isNegative: true, indent: 1 },
  { label: 'Валовая прибыль', key: 'grossProfit', isBold: true },
  { label: 'Валовая маржа %', key: 'grossMarginPct', isPct: true },
  // OPEX group - expandable
  { label: 'OPEX итого', key: 'opexTotal', isBold: true, isNegative: true },
  { label: 'ФОТ', key: 'payroll', isNegative: true, indent: 1, parentKey: 'opex' },
  { label: 'Аренда', key: 'rent', isNegative: true, indent: 1, parentKey: 'opex' },
  { label: 'Коммуналка', key: 'utilities', isNegative: true, indent: 1, parentKey: 'opex' },
  { label: 'Административные', key: 'admin', isNegative: true, indent: 1, parentKey: 'opex' },
  { label: 'ПО', key: 'software', isNegative: true, indent: 1, parentKey: 'opex' },
  { label: 'Маркетинг', key: 'marketing', isNegative: true, indent: 1, parentKey: 'opex' },
  // After OPEX
  { label: 'EBITDA', key: 'ebitda', isBold: true },
  { label: 'EBITDA %', key: 'ebitdaPct', isPct: true },
  { label: 'Амортизация', key: 'depreciation', isNegative: true, indent: 1 },
  { label: 'Проценты', key: 'interest', isNegative: true, indent: 1 },
  { label: 'Прибыль до налога', key: 'preTaxProfit' },
  { label: 'Налог', key: 'tax', isNegative: true, indent: 1 },
  { label: 'Чистая прибыль', key: 'netProfit', isBold: true },
  { label: 'Чистая маржа %', key: 'netMarginPct', isPct: true, isBold: true },
];

// Mock monthly data — 6 months of network total with variance
const MONTHS = ['Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель'];
const MONTH_FACTORS = [0.92, 0.98, 0.88, 0.95, 1.02, 1.0];

function formatCell(value: number, row: PnLRow): string {
  if (row.isPct) return formatPct(value);
  if (row.isNegative && value > 0) return `(${formatTenge(value)})`;
  return formatTenge(value);
}

function cellColor(value: number, row: PnLRow): string {
  if (row.isPct) {
    if (row.key === 'netMarginPct') return value >= 4 ? 'text-success' : value >= 1 ? 'text-warning' : 'text-danger';
    if (row.key === 'grossMarginPct') return value >= 22 ? 'text-success' : value >= 18 ? 'text-warning' : 'text-danger';
    if (row.key === 'ebitdaPct') return value >= 6 ? 'text-success' : value >= 3 ? 'text-warning' : 'text-danger';
  }
  if (row.isNegative) return 'text-text-muted';
  return 'text-text-secondary';
}

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PnLPage({ pharmacies, selectedId, period }: PnLPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pharmacies');
  const [opexExpanded, setOpexExpanded] = useState(false);

  const displayPharmacies = useMemo(() => {
    if (selectedId === 0) return pharmacies;
    const found = pharmacies.find(p => p.id === selectedId);
    return found ? [found] : pharmacies;
  }, [pharmacies, selectedId]);

  const pnlResults = useMemo(() =>
    displayPharmacies.map(p => ({ pharmacy: p, pnl: computePnL(p) })),
    [displayPharmacies],
  );

  const totalPnL = useMemo(() => computePnL(networkTotal()), []);
  const showTotal = selectedId === 0 && viewMode === 'pharmacies';

  // Monthly data
  const monthlyPnLs = useMemo(() => {
    const base = networkTotal();
    return MONTH_FACTORS.map((f, i) => {
      const scaled: PharmacyData = {
        ...base,
        revenue: Math.round(base.revenue * f),
        payroll: Math.round(base.payroll * (0.98 + i * 0.005)),
        rent: base.rent,
        utilities: Math.round(base.utilities * (0.9 + i * 0.02)),
      };
      return { month: MONTHS[i], pnl: computePnL(scaled) };
    });
  }, []);

  const visibleRows = PNL_ROWS.filter(row => {
    if (row.parentKey === 'opex' && !opexExpanded) return false;
    return true;
  });

  const handleExport = () => {
    if (viewMode === 'pharmacies') {
      const headers = ['Статья', ...displayPharmacies.map(p => p.name.split('(')[0].trim()), ...(showTotal ? ['Итого'] : [])];
      const rows = visibleRows.map(row => {
        const cells = displayPharmacies.map(p => {
          const pnlData = computePnL(p);
          return formatCell(pnlData[row.key], row).replace(/\s/g, '');
        });
        if (showTotal) cells.push(formatCell(totalPnL[row.key], row).replace(/\s/g, ''));
        return [row.label, ...cells];
      });
      exportCSV(headers, rows, 'provizor-pnl-pharmacies.csv');
    } else {
      const headers = ['Статья', ...MONTHS];
      const rows = visibleRows.map(row => [
        row.label,
        ...monthlyPnLs.map(m => formatCell(m.pnl[row.key], row).replace(/\s/g, '')),
      ]);
      exportCSV(headers, rows, 'provizor-pnl-monthly.csv');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-card rounded-lg border border-border p-0.5">
          <button
            onClick={() => setViewMode('pharmacies')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'pharmacies' ? 'bg-accent/20 text-accent font-medium' : 'text-text-secondary hover:text-text'
            }`}
          >
            По аптекам
          </button>
          <button
            onClick={() => setViewMode('months')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'months' ? 'bg-accent/20 text-accent font-medium' : 'text-text-secondary hover:text-text'
            }`}
          >
            По месяцам
          </button>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text bg-card border border-border rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                <th className="text-left py-3 px-5 text-xs text-text-muted uppercase tracking-wide font-medium sticky left-0 bg-navy z-10 min-w-[200px]">
                  Статья
                </th>
                {viewMode === 'pharmacies' ? (
                  <>
                    {pnlResults.map(({ pharmacy }) => (
                      <th key={pharmacy.id} className="text-right py-3 px-4 text-xs text-text-muted uppercase tracking-wide font-medium min-w-[140px]">
                        {pharmacy.name.split('(')[0].trim()}
                      </th>
                    ))}
                    {showTotal && (
                      <th className="text-right py-3 px-5 text-xs text-accent uppercase tracking-wide font-semibold min-w-[140px] border-l border-border">
                        Итого
                      </th>
                    )}
                  </>
                ) : (
                  MONTHS.map(m => (
                    <th key={m} className="text-right py-3 px-4 text-xs text-text-muted uppercase tracking-wide font-medium min-w-[120px]">
                      {m}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => {
                const isSeparator = row.key === 'grossProfit' || row.key === 'opexTotal' || row.key === 'ebitda' || row.key === 'netProfit';
                const isOpexHeader = row.key === 'opexTotal';

                return (
                  <tr
                    key={row.key}
                    className={`border-t border-border ${isSeparator ? 'bg-navy/50' : 'hover:bg-navy/30'}`}
                  >
                    <td
                      className={`py-2.5 px-5 sticky left-0 z-10 ${isSeparator ? 'bg-navy/50' : 'bg-card'} ${row.isBold ? 'font-semibold text-text' : 'text-text-secondary'}`}
                      style={{ paddingLeft: row.indent ? `${20 + row.indent * 16}px` : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        {isOpexHeader && (
                          <button
                            onClick={() => setOpexExpanded(!opexExpanded)}
                            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                          >
                            <svg className={`w-3 h-3 transition-transform ${opexExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        {row.label}
                      </div>
                    </td>
                    {viewMode === 'pharmacies' ? (
                      <>
                        {pnlResults.map(({ pharmacy, pnl }) => (
                          <td
                            key={pharmacy.id}
                            className={`py-2.5 px-4 text-right ${row.isBold ? 'font-semibold' : ''} ${cellColor(pnl[row.key], row)}`}
                          >
                            {formatCell(pnl[row.key], row)}
                          </td>
                        ))}
                        {showTotal && (
                          <td className={`py-2.5 px-5 text-right border-l border-border ${row.isBold ? 'font-semibold text-accent' : cellColor(totalPnL[row.key], row)}`}>
                            {formatCell(totalPnL[row.key], row)}
                          </td>
                        )}
                      </>
                    ) : (
                      monthlyPnLs.map(m => (
                        <td
                          key={m.month}
                          className={`py-2.5 px-4 text-right ${row.isBold ? 'font-semibold' : ''} ${cellColor(m.pnl[row.key], row)}`}
                        >
                          {formatCell(m.pnl[row.key], row)}
                        </td>
                      ))
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-border text-xs text-text-muted flex justify-between">
          <span>{viewMode === 'pharmacies' ? `${displayPharmacies.length} аптек` : '6 месяцев'} · Период: {period.label} ({periodSuffix(period)})</span>
          <span>Данные: бенчмарки Алматы</span>
        </div>
      </div>
    </div>
  );
}
