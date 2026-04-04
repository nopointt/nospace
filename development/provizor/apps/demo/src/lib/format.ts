/** Format number as tenge with thousand separators */
export function formatTenge(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
}

/** Format percentage with 1 decimal */
export function formatPct(value: number): string {
  return value.toFixed(1) + '%';
}

/** Format large number with M/K suffix */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M ₸';
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(0) + 'K ₸';
  }
  return Math.round(value) + ' ₸';
}
