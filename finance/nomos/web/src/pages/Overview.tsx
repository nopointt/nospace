import { createResource, For, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { Stat } from "../components/Stat";
import { useLiveStream } from "../lib/sse";
import { usd, pct, pnlTone, tsShort } from "../lib/format";

export default function Overview() {
  const [balance] = createResource(() => endpoints.balance());
  const [risk] = createResource(() => endpoints.risk());
  const [strategies] = createResource(() => endpoints.strategies());
  const { events, connected } = useLiveStream({ replay: 50 });

  return (
    <div class="space-y-8">
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-[32px] font-medium tracking-tight">Overview</h1>
          <p class="text-[13px] text-[var(--color-text-tertiary)] mt-1">
            Paper trading · Binance testnet · 3 strategies + Cramer mirror
          </p>
        </div>
        <div class="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
          stream {connected() ? "· live" : "· offline"}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-0 border border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
        <Stat
          label="Equity"
          value={balance() ? usd(balance()!.total_usd) : "—"}
          sub={balance() ? `USDT ${usd(balance()!.usdt, 0)}` : ""}
        />
        <Stat
          label="P&L Daily"
          value={
            <span class={risk() ? pnlTone(risk()!.daily_pnl_pct) : ""}>
              {risk() ? pct(risk()!.daily_pnl_pct) : "—"}
            </span>
          }
          sub={risk() ? `cap ±${risk()!.daily_threshold_pct}%` : ""}
        />
        <Stat
          label="P&L Weekly"
          value={
            <span class={risk() ? pnlTone(risk()!.weekly_pnl_pct) : ""}>
              {risk() ? pct(risk()!.weekly_pnl_pct) : "—"}
            </span>
          }
          sub={risk() ? `cap ±${risk()!.weekly_threshold_pct}%` : ""}
        />
        <Stat
          label="P&L Total"
          value={
            <span class={risk() ? pnlTone(risk()!.total_pnl_pct) : ""}>
              {risk() ? pct(risk()!.total_pnl_pct) : "—"}
            </span>
          }
          sub={risk() ? `cap ±${risk()!.total_threshold_pct}%` : ""}
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section class="lg:col-span-2 space-y-3">
          <h2 class="text-[18px] font-medium">Strategies</h2>
          <div class="border border-[var(--color-border-subtle)]">
            <Show when={strategies()} fallback={<div class="p-4 text-[13px] text-[var(--color-text-tertiary)]">Loading…</div>}>
              <table class="w-full text-[13px] font-mono tabular-nums">
                <thead>
                  <tr class="text-left text-[11px] uppercase text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)]">
                    <th class="px-4 py-2">Strategy</th>
                    <th class="px-4 py-2">Type</th>
                    <th class="px-4 py-2">TF</th>
                    <th class="px-4 py-2 text-right">Trades</th>
                    <th class="px-4 py-2 text-right">B / S</th>
                    <th class="px-4 py-2 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={strategies()}>{(s) => (
                    <tr class="border-b border-[var(--color-border-subtle)] last:border-b-0">
                      <td class="px-4 py-2">{s.name}</td>
                      <td class="px-4 py-2 text-[var(--color-text-tertiary)]">{s.type}</td>
                      <td class="px-4 py-2 text-[var(--color-text-tertiary)]">{s.timeframe ?? "—"}</td>
                      <td class="px-4 py-2 text-right">{s.trades}</td>
                      <td class="px-4 py-2 text-right">{s.buys}/{s.sells}</td>
                      <td class="px-4 py-2 text-right">{usd(s.volume_usd, 0)}</td>
                    </tr>
                  )}</For>
                </tbody>
              </table>
            </Show>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-[18px] font-medium">Live feed</h2>
          <div class="border border-[var(--color-border-subtle)] max-h-[480px] overflow-y-auto">
            <Show when={events().length > 0} fallback={
              <div class="p-4 text-[13px] text-[var(--color-text-tertiary)]">Waiting…</div>
            }>
              <ul class="divide-y divide-[var(--color-border-subtle)]">
                <For each={events().slice(0, 60)}>{(e) => (
                  <li class="px-4 py-2 text-[12px] font-mono flex gap-3">
                    <span class="text-[var(--color-text-tertiary)] shrink-0 w-16">{tsShort(e.ts)}</span>
                    <span class="shrink-0 w-24 text-[var(--color-text-secondary)] truncate">{e.event}</span>
                    <span class="truncate text-[var(--color-text-tertiary)]">{fmt(e.data)}</span>
                  </li>
                )}</For>
              </ul>
            </Show>
          </div>
        </section>
      </div>
    </div>
  );
}

function fmt(data: Record<string, unknown>): string {
  const parts: string[] = [];
  const s = data.strategy as string | undefined;
  const pair = data.pair as string | undefined;
  const side = data.side as string | undefined;
  if (s) parts.push(s);
  if (pair) parts.push(pair);
  if (side) parts.push(side);
  return parts.join(" · ");
}
