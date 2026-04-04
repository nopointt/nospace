import { getRAGLevel } from '../lib/benchmarks';
import { RAGBadge } from './RAGBadge';

interface Props {
  title: string;
  value: string;
  benchmarkKey?: string;
  numericValue?: number;
  subtitle?: string;
}

export function MetricCard({ title, value, benchmarkKey, numericValue, subtitle }: Props) {
  const rag = benchmarkKey && numericValue !== undefined
    ? getRAGLevel(benchmarkKey, numericValue)
    : undefined;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-500">{title}</span>
        {rag && <RAGBadge level={rag} />}
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}
