import { useState } from 'react';
import { getRAGLevel, RAG_COLORS, RAG_BG_COLORS, type RAGLevel } from '../lib/benchmarks';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  benchmarkKey?: string;
  numericValue?: number;
  delta?: number; // % change vs benchmark target
  color?: string;
  info?: string; // tooltip explanation
}

export function MetricCard({ title, value, subtitle, benchmarkKey, numericValue, delta, color, info }: MetricCardProps) {
  const [showInfo, setShowInfo] = useState(false);
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
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs text-text-secondary uppercase tracking-wide">{title}</span>
        {info && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              onClick={() => setShowInfo(v => !v)}
              className="w-4.5 h-4.5 rounded-full border border-text-muted/40 text-text-muted hover:text-accent hover:border-accent/60 flex items-center justify-center transition-colors shrink-0"
            >
              <span className="text-[10px] font-bold leading-none">?</span>
            </button>
            {showInfo && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 px-3 py-2 bg-navy-light border border-border rounded-lg shadow-xl z-50">
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-2 h-2 bg-navy-light border-l border-t border-border rotate-45 mb-[-5px]" />
                <p className="text-[11px] text-text-secondary leading-relaxed">{info}</p>
              </div>
            )}
          </div>
        )}
      </div>
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
