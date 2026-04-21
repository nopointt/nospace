const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "https://api.nomos.contexter.cc";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json") ? ((await res.json()) as T) : ((await res.text()) as unknown as T);
}

export const apiBase = () => API_BASE;

export type Trade = {
  ts: number;
  strategy: string;
  pair: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  cost: number;
  order_id: string | null;
  virtual: boolean;
  meta: Record<string, unknown>;
};

export type Balance = {
  updated_at: number;
  usdt: number;
  btc: number;
  eth: number;
  bnb: number;
  total_usd: number;
};

export type StrategyStats = {
  name: string;
  type: "real" | "virtual";
  enabled: boolean;
  timeframe: string | null;
  pairs: string[];
  trades: number;
  buys: number;
  sells: number;
  volume_usd: number;
  last_signal_ts: number | null;
  last_signal_action: string | null;
  position_state: Record<string, "LONG" | "FLAT">;
};

export type RiskSnapshot = {
  updated_at: number;
  daily_pnl_pct: number;
  weekly_pnl_pct: number;
  total_pnl_pct: number;
  halt_active: boolean;
  halt_reason: string | null;
  daily_threshold_pct: number;
  weekly_threshold_pct: number;
  total_threshold_pct: number;
};

export type RunnerStatus = {
  running: boolean;
  state: string;
  container_id: string | null;
  started_at: number | null;
  last_tick_ts: number | null;
  image: string | null;
};

export type LivePrice = {
  pair: string;
  price: number;
  bid: number | null;
  ask: number | null;
  change_pct: number | null;
  volume: number | null;
  ts: number;
};

export type PortfolioSnapshot = {
  updated_at: number;
  total_usd: number;
  assets: Array<{
    symbol: string;
    free: number;
    locked: number;
    usd_value: number;
    allocation_pct: number;
  }>;
};

export const endpoints = {
  health: () => api<{ ok: boolean; version: string; uptime_s: number }>("/health"),
  balance: () => api<Balance>("/api/balance"),
  portfolio: () => api<PortfolioSnapshot>("/api/portfolio"),
  trades: (q: Record<string, string | number | boolean> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q).reduce<Record<string, string>>((a, [k, v]) => ((a[k] = String(v)), a), {}),
    ).toString();
    return api<Trade[]>(`/api/trades${qs ? "?" + qs : ""}`);
  },
  strategies: () => api<StrategyStats[]>("/api/strategies"),
  risk: () => api<RiskSnapshot>("/api/risk"),
  runnerStatus: () => api<RunnerStatus>("/api/runner/status"),
  livePrices: () => api<Record<string, LivePrice>>("/api/live/prices"),
  journalEvents: (q: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q).reduce<Record<string, string>>((a, [k, v]) => ((a[k] = String(v)), a), {}),
    ).toString();
    return api<Array<Record<string, unknown>>>(`/api/journal/events${qs ? "?" + qs : ""}`);
  },
  ohlcv: (pair: string, tf: string, limit = 300) =>
    api<number[][]>(`/api/charts/ohlcv?pair=${encodeURIComponent(pair)}&tf=${tf}&limit=${limit}`),
};
