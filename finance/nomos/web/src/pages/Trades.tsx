import { createResource, createSignal, For, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { apiBase } from "../lib/api";
import { usd, num, tsShort } from "../lib/format";

export default function Trades() {
  const [strategy, setStrategy] = createSignal<string>("");
  const [pair, setPair] = createSignal<string>("");
  const [side, setSide] = createSignal<string>("");
  const [includeVirtual, setIncludeVirtual] = createSignal(true);
  const [limit, setLimit] = createSignal(200);

  const [trades] = createResource(
    () => ({ strategy: strategy(), pair: pair(), side: side(), include_virtual: includeVirtual(), limit: limit() }),
    (q) => {
      const params: Record<string, string | number | boolean> = { limit: q.limit, include_virtual: q.include_virtual };
      if (q.strategy) params.strategy = q.strategy;
      if (q.pair) params.pair = q.pair;
      if (q.side) params.side = q.side;
      return endpoints.trades(params);
    },
  );

  const downloadCsv = () => {
    const qs = new URLSearchParams({
      limit: String(limit()),
      include_virtual: String(includeVirtual()),
      ...(strategy() && { strategy: strategy() }),
      ...(pair() && { pair: pair() }),
      ...(side() && { side: side() }),
    }).toString();
    window.open(`${apiBase()}/api/trades.csv?${qs}`, "_blank");
  };

  const inputCls = "px-3 py-1.5 text-[13px] font-mono bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] focus:border-[var(--color-accent)] focus:outline-none";

  return (
    <div class="space-y-6">
      <h1 class="text-[32px] font-medium tracking-tight">Trades</h1>

      <div class="flex flex-wrap gap-3 items-center border border-[var(--color-border-subtle)] p-4">
        <input class={inputCls} placeholder="strategy" value={strategy()} onInput={(e) => setStrategy(e.currentTarget.value)} />
        <select class={inputCls} value={pair()} onChange={(e) => setPair(e.currentTarget.value)}>
          <option value="">all pairs</option>
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
        </select>
        <select class={inputCls} value={side()} onChange={(e) => setSide(e.currentTarget.value)}>
          <option value="">both sides</option>
          <option value="buy">buy</option>
          <option value="sell">sell</option>
        </select>
        <label class="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={includeVirtual()} onChange={(e) => setIncludeVirtual(e.currentTarget.checked)} />
          include virtual (Cramer)
        </label>
        <button class="px-3 py-1.5 text-[13px] bg-[var(--color-accent)] text-[var(--color-white)] hover:bg-[var(--color-accent-hover)] ml-auto" onClick={downloadCsv}>
          export CSV
        </button>
      </div>

      <div class="border border-[var(--color-border-subtle)] overflow-x-auto">
        <Show when={trades()} fallback={<div class="p-4 text-[13px] text-[var(--color-text-tertiary)]">Loading…</div>}>
          <Show when={trades()!.length > 0} fallback={
            <div class="p-8 text-[13px] text-[var(--color-text-tertiary)] text-center">No trades yet. Runner emits tick_hold and signal_dedup until a strategy opens a position.</div>
          }>
            <table class="w-full text-[12px] font-mono tabular-nums">
              <thead>
                <tr class="text-left text-[10px] uppercase text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)] tracking-wider">
                  <th class="px-4 py-2">Time</th>
                  <th class="px-4 py-2">Strategy</th>
                  <th class="px-4 py-2">Pair</th>
                  <th class="px-4 py-2">Side</th>
                  <th class="px-4 py-2 text-right">Amount</th>
                  <th class="px-4 py-2 text-right">Price</th>
                  <th class="px-4 py-2 text-right">Cost</th>
                  <th class="px-4 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                <For each={trades()!}>{(t) => (
                  <tr class="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-surface)]">
                    <td class="px-4 py-2 text-[var(--color-text-tertiary)]">{tsShort(t.ts)}</td>
                    <td class="px-4 py-2">{t.strategy}</td>
                    <td class="px-4 py-2">{t.pair}</td>
                    <td class="px-4 py-2">
                      <span class={t.side === "buy" ? "text-[var(--color-accent)]" : "text-[var(--color-signal-error)]"}>
                        {t.side}
                      </span>
                    </td>
                    <td class="px-4 py-2 text-right">{num(t.amount, 6)}</td>
                    <td class="px-4 py-2 text-right">{usd(t.price, 2)}</td>
                    <td class="px-4 py-2 text-right">{usd(t.cost, 2)}</td>
                    <td class="px-4 py-2 text-[var(--color-text-tertiary)]">{t.virtual ? "virtual" : "real"}</td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </Show>
        </Show>
      </div>
    </div>
  );
}
