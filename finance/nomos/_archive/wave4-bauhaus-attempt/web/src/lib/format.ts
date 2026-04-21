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

export const pct = (n: number, dp = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`;

export const ts = (t: number | null | undefined) => {
  if (!t) return "—";
  return new Date(t * 1000).toLocaleString("en-GB", { hour12: false });
};

export const tsShort = (t: number | null | undefined) => {
  if (!t) return "—";
  const d = new Date(t * 1000);
  return d.toLocaleTimeString("en-GB", { hour12: false });
};

export const pnlColor = (n: number) =>
  n > 0 ? "text-[var(--color-pnl-up)]" : n < 0 ? "text-[var(--color-pnl-down)]" : "text-[var(--color-pnl-zero)]";
