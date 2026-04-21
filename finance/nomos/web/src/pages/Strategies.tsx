import { createResource, For, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { usd, tsShort } from "../lib/format";

export default function Strategies() {
  const [list] = createResource(() => endpoints.strategies());

  return (
    <div class="space-y-6">
      <h1 class="text-[32px] font-medium tracking-tight">Strategies</h1>

      <Show when={list()} fallback={<div class="text-[13px] text-[var(--color-text-tertiary)]">Loading…</div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[var(--color-border-subtle)] divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-subtle)]">
          <For each={list()}>{(s) => (
            <div class="p-6">
              <div class="flex items-baseline justify-between mb-4">
                <div>
                  <h3 class="text-[18px] font-medium">{s.name}</h3>
                  <div class="text-[11px] uppercase text-[var(--color-text-tertiary)] tracking-wider mt-1">
                    {s.type} · {s.timeframe ?? "—"} · {s.enabled ? "enabled" : "disabled"}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[24px] font-mono font-medium tabular-nums">{s.trades}</div>
                  <div class="text-[11px] uppercase text-[var(--color-text-tertiary)] tracking-wider">trades</div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 text-[12px] font-mono mb-4">
                <div>
                  <div class="text-[10px] uppercase text-[var(--color-text-tertiary)] tracking-wider mb-1">Buys</div>
                  <div class="text-[15px] text-[var(--color-accent)] tabular-nums">{s.buys}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase text-[var(--color-text-tertiary)] tracking-wider mb-1">Sells</div>
                  <div class="text-[15px] text-[var(--color-signal-error)] tabular-nums">{s.sells}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase text-[var(--color-text-tertiary)] tracking-wider mb-1">Volume</div>
                  <div class="text-[15px] tabular-nums">{usd(s.volume_usd, 0)}</div>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="text-[10px] uppercase text-[var(--color-text-tertiary)] tracking-wider">Positions</div>
                <For each={s.pairs}>{(pair) => (
                  <div class="flex justify-between text-[12px] font-mono">
                    <span>{pair}</span>
                    <span
                      classList={{
                        "text-[var(--color-accent)]": s.position_state[pair] === "LONG",
                        "text-[var(--color-text-tertiary)]": s.position_state[pair] !== "LONG",
                      }}
                    >
                      {s.position_state[pair] ?? "—"}
                    </span>
                  </div>
                )}</For>
              </div>

              <Show when={s.last_signal_ts}>
                <div class="mt-4 pt-4 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-tertiary)] font-mono">
                  last signal {tsShort(s.last_signal_ts)} · {s.last_signal_action}
                </div>
              </Show>
            </div>
          )}</For>
        </div>
      </Show>
    </div>
  );
}
