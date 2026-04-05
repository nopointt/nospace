import { useState, useMemo } from 'react';
import { MetricCard } from '../components/MetricCard';
import { type PharmacyData } from '../lib/mock-data';
import { type DateRange } from '../lib/date-range';
import { formatTenge, formatPct } from '../lib/format';
import { getRAGLevel, RAG_COLORS } from '../lib/benchmarks';
import {
  TURNOVER_BY_PHARMACY,
  ABC_XYZ_MATRIX,
  EXPIRY_RISK_ENTRIES,
  aggregateExpiryRisk,
  type TurnoverByPharmacy,
  type AbcXyzCell,
  type ExpiryHorizon,
} from '../lib/turnover-mock';

type SortKey = keyof Pick<TurnoverByPharmacy, 'doi' | 'itr' | 'deadStockPct' | 'expiryRiskValue' | 'gmroi'>;
type SortDir = 'asc' | 'desc';

interface TurnoverPageProps {
  data: PharmacyData;
  allPharmacies: PharmacyData[];
  period: DateRange;
}

// ABC/XYZ cell color classes — dark navy theme, per spec
const CELL_COLORS: Record<AbcXyzCell, string> = {
  AX: 'bg-green-900/50 border-green-500/30',
  AY: 'bg-green-900/30 border-green-500/20',
  AZ: 'bg-yellow-900/30 border-yellow-500/20',
  BX: 'bg-green-900/20 border-green-500/15',
  BY: 'bg-yellow-900/20 border-yellow-500/15',
  BZ: 'bg-orange-900/20 border-orange-500/15',
  CX: 'bg-yellow-900/15 border-yellow-500/10',
  CY: 'bg-orange-900/15 border-orange-500/10',
  CZ: 'bg-red-900/30 border-red-500/20',
};

const CELL_LABELS: Record<AbcXyzCell, string> = {
  AX: 'Ядро (AX)',
  AY: 'Ключевые (AY)',
  AZ: 'Риск (AZ)',
  BX: 'Стабильные (BX)',
  BY: 'Переменные (BY)',
  BZ: 'Проблемные (BZ)',
  CX: 'Хвост (CX)',
  CY: 'Слабые (CY)',
  CZ: 'Аутсайдеры (CZ)',
};

const HORIZON_STYLES: Record<ExpiryHorizon, string> = {
  30: 'bg-red-900/20 border-l-2 border-l-danger',
  60: 'bg-yellow-900/10 border-l-2 border-l-warning',
  90: '',
};

const HORIZON_LABELS: Record<ExpiryHorizon, string> = {
  30: '≤ 30 дней',
  60: '≤ 60 дней',
  90: '≤ 90 дней',
};

/** Colored RAG dot */
function RagDot({ benchmarkKey, value }: { benchmarkKey: string; value: number }) {
  const rag = getRAGLevel(benchmarkKey, value);
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0 align-middle"
      style={{ backgroundColor: RAG_COLORS[rag] }}
    />
  );
}

export function TurnoverPage({ data, allPharmacies: _allPharmacies, period: _period }: TurnoverPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>('doi');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const selectedPharmacyId = data.id; // 0 = network

  // ─── Hero metrics: filtered by pharmacy switcher ──────────────
  const relevantPharmacies = useMemo(
    () => selectedPharmacyId === 0
      ? TURNOVER_BY_PHARMACY
      : TURNOVER_BY_PHARMACY.filter(p => p.pharmacyId === selectedPharmacyId),
    [selectedPharmacyId],
  );

  const avgDoi = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.doi, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const avgItr = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.itr, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const avgDeadStock = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.deadStockPct, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const avgGmroi = useMemo(
    () => relevantPharmacies.length > 0
      ? relevantPharmacies.reduce((s, p) => s + p.gmroi, 0) / relevantPharmacies.length
      : 0,
    [relevantPharmacies],
  );
  const totalExpiryRisk = useMemo(
    () => relevantPharmacies.reduce((s, p) => s + p.expiryRiskValue, 0),
    [relevantPharmacies],
  );

  // ─── Table: sorted by column ───────────────────────────────────
  const sortedRows = useMemo(() => {
    return [...TURNOVER_BY_PHARMACY].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [sortKey, sortDir]);

  // Network average row
  const networkRow: TurnoverByPharmacy = useMemo(() => ({
    pharmacyId: 0,
    pharmacyName: 'Сеть (среднее)',
    doi: parseFloat(avgDoi.toFixed(1)),
    itr: parseFloat(avgItr.toFixed(1)),
    deadStockPct: parseFloat(avgDeadStock.toFixed(1)),
    gmroi: parseFloat(avgGmroi.toFixed(2)),
    expiryRiskValue: totalExpiryRisk,
  }), [avgDoi, avgItr, avgDeadStock, avgGmroi, totalExpiryRisk]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) {
      return <span className="text-text-muted ml-1 text-[10px]">↕</span>;
    }
    return <span className="text-accent ml-1 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  // ─── ABC/XYZ matrix data ───────────────────────────────────────
  const matrixData = useMemo(() => {
    const map = new Map(ABC_XYZ_MATRIX.map(e => [e.cell, e]));
    return map;
  }, []);

  // ─── Expiry risk sorted ascending by days ─────────────────────
  const expiryRisk = useMemo(
    () => [...EXPIRY_RISK_ENTRIES].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    [],
  );

  const expiryTotals = useMemo(() => aggregateExpiryRisk(), []);

  const ABC_ROWS: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
  const XYZ_COLS: Array<'X' | 'Y' | 'Z'> = ['X', 'Y', 'Z'];

  return (
    <div className="space-y-6">
      {/* ── Hero MetricCards ─────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="DOI (дни запаса)"
          value={`${avgDoi.toFixed(0)} дн.`}
          subtitle="среднее по сети"
          benchmarkKey="doiKZ"
          numericValue={avgDoi}
          info="За сколько дней продаётся средний запас. Бенчмарк КЗ: <35 дней (поправка на lead times 7-21 дней у дистрибьюторов)."
        />
        <MetricCard
          title="Оборачиваемость (ITR)"
          value={`${avgItr.toFixed(1)}×`}
          subtitle="раз в год"
          benchmarkKey="itr"
          numericValue={avgItr}
          info="Inventory Turnover Ratio — сколько раз за год полностью оборачивается запас. ITR = 365 / DOI. Цель: >14× в год."
        />
        <MetricCard
          title="Мёртвый запас"
          value={formatPct(avgDeadStock)}
          subtitle="среднее по сети"
          benchmarkKey="deadStock"
          numericValue={avgDeadStock}
          info="Процент SKU без движения 90+ дней. Замороженный капитал. Ручной заказ создаёт 30-36% избыточных запасов."
        />
        <MetricCard
          title="GMROI"
          value={avgGmroi.toFixed(2)}
          subtitle="среднее по сети"
          benchmarkKey="gmroi"
          numericValue={avgGmroi}
          info="Gross Margin Return on Investment. Валовая маржа на каждый тенге вложенный в запасы. Цель: >3.0."
        />
      </div>

      {/* ── Таблица по аптекам ───────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Оборачиваемость по аптекам</h2>
          <p className="text-xs text-text-muted mt-1">Клик по заголовку колонки — сортировка</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-text-secondary text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Аптека</th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:text-text transition-colors select-none"
                  onClick={() => handleSort('doi')}
                >
                  DOI <SortIcon col="doi" />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:text-text transition-colors select-none"
                  onClick={() => handleSort('itr')}
                >
                  ITR <SortIcon col="itr" />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:text-text transition-colors select-none"
                  onClick={() => handleSort('deadStockPct')}
                >
                  Мёртвый запас <SortIcon col="deadStockPct" />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:text-text transition-colors select-none"
                  onClick={() => handleSort('expiryRiskValue')}
                >
                  Риск просрочки <SortIcon col="expiryRiskValue" />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer hover:text-text transition-colors select-none"
                  onClick={() => handleSort('gmroi')}
                >
                  GMROI <SortIcon col="gmroi" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(row => (
                <tr key={row.pharmacyId} className="border-t border-border hover:bg-navy/30 transition-colors">
                  <td className="px-4 py-3 text-text font-medium text-xs">{row.pharmacyName}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <RagDot benchmarkKey="doiKZ" value={row.doi} />
                    <span className="text-text">{row.doi} дн.</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <RagDot benchmarkKey="itr" value={row.itr} />
                    <span className="text-text">{row.itr}×</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <RagDot benchmarkKey="deadStock" value={row.deadStockPct} />
                    <span className="text-text">{formatPct(row.deadStockPct)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text">{formatTenge(row.expiryRiskValue)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <RagDot benchmarkKey="gmroi" value={row.gmroi} />
                    <span className="text-text">{row.gmroi.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {/* Network average row */}
              <tr className="border-t-2 border-border bg-navy/40">
                <td className="px-4 py-3 text-text-secondary font-semibold text-xs uppercase tracking-wide">
                  {networkRow.pharmacyName}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <RagDot benchmarkKey="doiKZ" value={networkRow.doi} />
                  <span className="text-text font-semibold">{networkRow.doi} дн.</span>
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <RagDot benchmarkKey="itr" value={networkRow.itr} />
                  <span className="text-text font-semibold">{networkRow.itr}×</span>
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <RagDot benchmarkKey="deadStock" value={networkRow.deadStockPct} />
                  <span className="text-text font-semibold">{formatPct(networkRow.deadStockPct)}</span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-text font-semibold">
                  {formatTenge(networkRow.expiryRiskValue)}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <RagDot benchmarkKey="gmroi" value={networkRow.gmroi} />
                  <span className="text-text font-semibold">{networkRow.gmroi.toFixed(2)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ABC/XYZ Матрица ──────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-1">ABC/XYZ Матрица</h2>
        <p className="text-xs text-text-muted mb-5">
          A = 80% выручки · B = 15% · C = 5% · X = стабильный спрос · Y = переменный · Z = непредсказуемый
        </p>

        {/* Column headers */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div /> {/* row label placeholder */}
          {XYZ_COLS.map(x => (
            <div key={x} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-widest py-1">
              {x}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {ABC_ROWS.map(abc => (
          <div key={abc} className="grid grid-cols-4 gap-2 mb-2">
            <div className="flex items-center justify-center text-xs font-semibold text-text-secondary uppercase tracking-widest">
              {abc}
            </div>
            {XYZ_COLS.map(xyz => {
              const cell = `${abc}${xyz}` as AbcXyzCell;
              const entry = matrixData.get(cell);
              return (
                <button
                  key={cell}
                  onClick={() => { console.log('ABC/XYZ cell clicked:', cell, entry); }}
                  className={`rounded-lg border p-3 text-left transition-opacity hover:opacity-80 ${CELL_COLORS[cell]}`}
                >
                  <div className="text-[10px] text-text-muted mb-1 leading-tight">{CELL_LABELS[cell]}</div>
                  {entry && entry.skuCount > 0 ? (
                    <>
                      <div className="text-lg font-bold text-text leading-none">{entry.skuCount}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">SKU</div>
                      <div className="text-xs text-text-secondary mt-1 font-medium">
                        {entry.revenuePct.toFixed(1)}% выручки
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-text-muted leading-none">0</div>
                      <div className="text-[10px] text-text-muted mt-0.5">SKU</div>
                      <div className="text-xs text-text-muted mt-1">—</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Таблица риска просрочки ──────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">Риск просрочки</h2>
          <p className="text-xs text-text-muted mt-1">Товары со сроком годности ≤ 90 дней · сортировка по срочности</p>
          {/* Horizon summary badges */}
          <div className="flex items-center gap-4 mt-3">
            {([30, 60, 90] as ExpiryHorizon[]).map(h => (
              <div key={h} className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: h === 30 ? 'rgba(239,68,68,0.15)' : h === 60 ? 'rgba(234,179,8,0.15)' : 'rgba(148,163,184,0.1)',
                    color: h === 30 ? '#ef4444' : h === 60 ? '#eab308' : '#94a3b8',
                  }}
                >
                  {HORIZON_LABELS[h]}
                </span>
                <span className="text-xs text-text font-semibold">{formatTenge(expiryTotals[h])}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-text-secondary text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Срок годности</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Остаток (шт.)</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Стоимость (₸)</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Дней до просрочки</th>
              </tr>
            </thead>
            <tbody>
              {expiryRisk.map(entry => (
                <tr
                  key={entry.id}
                  className={`border-t border-border transition-colors hover:opacity-90 ${HORIZON_STYLES[entry.horizon]}`}
                >
                  <td className="px-4 py-3 text-text font-medium text-xs">{entry.skuName}</td>
                  <td className="px-4 py-3 text-right text-text-secondary text-xs whitespace-nowrap">{entry.expiryDate}</td>
                  <td className="px-4 py-3 text-right text-text text-xs">{entry.quantity}</td>
                  <td className="px-4 py-3 text-right text-text text-xs">{formatTenge(entry.value)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span
                      className="font-semibold"
                      style={{
                        color: entry.horizon === 30 ? '#ef4444' : entry.horizon === 60 ? '#eab308' : '#94a3b8',
                      }}
                    >
                      {entry.daysUntilExpiry} дн.
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
