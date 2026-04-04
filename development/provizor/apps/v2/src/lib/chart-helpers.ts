import { formatTenge, formatPct, formatCompact } from './format';

/** Recharts Tooltip formatter for tenge values */
export function tengeFormatter(value: unknown): string {
  return formatTenge(Number(value));
}

/** Recharts Tooltip formatter for percentage values */
export function pctFormatter(value: unknown): string {
  return formatPct(Number(value));
}

/** Recharts Tooltip formatter for compact values */
export function compactFormatter(value: unknown): string {
  return formatCompact(Number(value));
}

/** Recharts YAxis tick formatter */
export function pctTickFormatter(v: unknown): string {
  return `${Number(v)}%`;
}

/** Dark theme chart colors */
export const CHART_COLORS = {
  revenue: '#38bdf8',
  costs: '#f87171',
  profit: '#22c55e',
  margin: '#eab308',
  cogs: '#f97316',
  payroll: '#a78bfa',
  rent: '#38bdf8',
  utilities: '#2dd4bf',
  marketing: '#f472b6',
  admin: '#94a3b8',
  software: '#818cf8',
  grid: '#334155',
  text: '#94a3b8',
} as const;

/** Donut chart segments */
export const COST_COLORS = [
  '#f97316', // COGS - orange
  '#a78bfa', // Payroll - purple
  '#38bdf8', // Rent - sky
  '#2dd4bf', // Utilities - teal
  '#f472b6', // Marketing - pink
  '#94a3b8', // Other - slate
] as const;
