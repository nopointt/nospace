import { createResource, For, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { usd, num, pct } from "../lib/format";

export default function Portfolio() {
  const [snap] = createResource(() => endpoints.portfolio());

  return (
    <div class="space-y-6">
      <h1 class="text-[32px] font-medium tracking-tight">Portfolio</h1>

      <Show when={snap()} fallback={<div class="text-[13px] text-[var(--color-text-tertiary)]">Loading…</div>}>
        <div class="border border-[var(--color-border-subtle)] p-8 text-center">
          <div class="text-[11px] uppercase text-[var(--color-text-tertiary)] tracking-wider mb-2">Total equity</div>
          <div class="text-[48px] font-mono font-medium tabular-nums">{usd(snap()!.total_usd)}</div>
        </div>

        <div class="border border-[var(--color-border-subtle)]">
          <table class="w-full text-[13px] font-mono tabular-nums">
            <thead>
              <tr class="text-left text-[10px] uppercase text-[var(--color-text-tertiary)] border-b border-[var(--color-border-subtle)] tracking-wider">
                <th class="px-5 py-3">Asset</th>
                <th class="px-5 py-3 text-right">Free</th>
                <th class="px-5 py-3 text-right">USD value</th>
                <th class="px-5 py-3 text-right">Allocation</th>
                <th class="px-5 py-3">Bar</th>
              </tr>
            </thead>
            <tbody>
              <For each={snap()!.assets}>{(a) => (
                <tr class="border-b border-[var(--color-border-subtle)] last:border-b-0">
                  <td class="px-5 py-3 font-medium">{a.symbol}</td>
                  <td class="px-5 py-3 text-right">{num(a.free, 6)}</td>
                  <td class="px-5 py-3 text-right">{usd(a.usd_value, 2)}</td>
                  <td class="px-5 py-3 text-right">{pct(a.allocation_pct, 1)}</td>
                  <td class="px-5 py-3 w-64">
                    <div class="h-2 bg-[var(--color-bg-elevated)]">
                      <div
                        class="h-full bg-[var(--color-accent)]"
                        style={{ width: `${Math.min(Math.max(a.allocation_pct, 0), 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
}
