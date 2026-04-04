import { getRAGLevel, RAG_COLORS, RAG_BG_COLORS, type RAGLevel } from '../lib/benchmarks';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  benchmarkKey?: string;
  numericValue?: number;
  delta?: number; // % change vs benchmark target
  color?: string;
}

export function MetricCard({ title, value, subtitle, benchmarkKey, numericValue, delta, color }: MetricCardProps) {
  const rag: RAGLevel | undefined = benchmarkKey && numericValue !== undefined
    ? getRAGLevel(benchmarkKey, numericValue)
    : undefined;

  const accentColor = color ?? (rag ? RAG_COLORS[rag] : '#38bdf8');
  const bgTint = rag ? RAG_BG_COLORS[rag] : undefined;

  return (
    <div
      className="bg-card rounded-xl p-5 border border-border transition-all hover:border-navy-lighter min-w-[180px] shrink-0 lg:min-w-0 lg:shrink"
      style={bgTint ? { borderColor: `${accentColor}30` } : undefined}
    >
      <div className="text-xs text-text-secondary mb-2 uppercase tracking-wide">{title}</div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: accentColor }}>
        {value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {delta !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            delta >= 0 ? 'text-success' : 'text-danger'
          }`}>
            {delta >= 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-text-muted">{subtitle}</span>
        )}
      </div>
      {rag && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-[10px] text-text-muted">
            {rag === 'green' ? 'Норма' : rag === 'yellow' ? 'Внимание' : 'Критично'}
          </span>
        </div>
      )}
    </div>
  );
}
