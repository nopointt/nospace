export const usd = (n: number, dp = 2) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

export const num = (n: number, dp = 4) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

export const pct = (n: number, dp = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`;

export const ts = (t: number | null | undefined) =>
  t ? new Date(t * 1000).toLocaleString("en-GB", { hour12: false }) : "—";

export const tsShort = (t: number | null | undefined) =>
  t ? new Date(t * 1000).toLocaleTimeString("en-GB", { hour12: false }) : "—";

export const pnlTone = (n: number) =>
  n > 0 ? "text-[var(--color-signal-success)]" : n < 0 ? "text-[var(--color-signal-error)]" : "text-[var(--color-text-tertiary)]";
