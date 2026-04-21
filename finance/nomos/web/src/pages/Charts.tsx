import { createResource, createSignal, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { usd } from "../lib/format";

export default function Charts() {
  const [pair, setPair] = createSignal("BTC/USDT");
  const [tf, setTf] = createSignal("1h");

  const [ohlcv] = createResource(
    () => ({ p: pair(), t: tf() }),
    (k) => endpoints.ohlcv(k.p, k.t, 200),
  );

  // Simple SVG line chart of closes (lightweight, no external lib)
  const pathData = () => {
    const rows = ohlcv();
    if (!rows || rows.length === 0) return { line: "", minV: 0, maxV: 0 };
    const closes = rows.map((r) => r[4]);
    const minV = Math.min(...closes);
    const maxV = Math.max(...closes);
    const w = 1000;
    const h = 300;
    const n = closes.length;
    const xs = (i: number) => (i / (n - 1)) * w;
    const ys = (v: number) => h - ((v - minV) / (maxV - minV || 1)) * h;
    let d = `M ${xs(0).toFixed(1)} ${ys(closes[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) d += ` L ${xs(i).toFixed(1)} ${ys(closes[i]).toFixed(1)}`;
    return { line: d, minV, maxV };
  };

  const selCls = "px-3 py-1.5 text-[13px] font-mono bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]";

  return (
    <div class="space-y-6">
      <h1 class="text-[32px] font-medium tracking-tight">Charts</h1>

      <div class="flex gap-3 items-center border border-[var(--color-border-subtle)] p-4">
        <select class={selCls} value={pair()} onChange={(e) => setPair(e.currentTarget.value)}>
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
        </select>
        <select class={selCls} value={tf()} onChange={(e) => setTf(e.currentTarget.value)}>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
      </div>

      <div class="border border-[var(--color-border-subtle)] p-6">
        <Show when={ohlcv()} fallback={<div class="text-[13px] text-[var(--color-text-tertiary)] py-16 text-center">Loading candles…</div>}>
          <div class="flex justify-between text-[12px] font-mono text-[var(--color-text-tertiary)] mb-4">
            <span>min {usd(pathData().minV)}</span>
            <span>{pair()} · {tf()} · {ohlcv()!.length} bars</span>
            <span>max {usd(pathData().maxV)}</span>
          </div>
          <svg viewBox="0 0 1000 300" class="w-full h-80" preserveAspectRatio="none">
            <path d={pathData().line} fill="none" stroke="var(--color-accent)" stroke-width="1.5" />
          </svg>
        </Show>
      </div>
    </div>
  );
}
