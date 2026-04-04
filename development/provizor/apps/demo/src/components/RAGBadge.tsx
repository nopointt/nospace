import { type RAGLevel, RAG_COLORS, RAG_BG_COLORS } from '../lib/benchmarks';

interface Props {
  level: RAGLevel;
  label?: string;
}

export function RAGBadge({ level, label }: Props) {
  const text = label ?? (level === 'green' ? 'Норма' : level === 'yellow' ? 'Внимание' : 'Критично');
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color: RAG_COLORS[level], backgroundColor: RAG_BG_COLORS[level] }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: RAG_COLORS[level] }}
      />
      {text}
    </span>
  );
}
