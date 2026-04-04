import { formatTenge, formatPct, formatCompact } from './format';

/** Type-safe Recharts Tooltip formatter for tenge values */
export function tengeFormatter(value: unknown): string {
  return formatTenge(Number(value));
}

/** Type-safe Recharts Tooltip formatter for percentage values */
export function pctFormatter(value: unknown): string {
  return formatPct(Number(value));
}

/** Type-safe Recharts Tooltip formatter for compact values */
export function compactFormatter(value: unknown): string {
  return formatCompact(Number(value));
}

/** Type-safe Recharts YAxis tick formatter */
export function pctTickFormatter(v: unknown): string {
  return `${Number(v)}%`;
}
