import { createResource, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { pct, pnlTone } from "../lib/format";

export default function Risk() {
  const [risk] = createResource(() => endpoints.risk());

  return (
    <div class="space-y-6">
      <h1 class="text-[32px] font-medium tracking-tight">Risk</h1>

      <Show when={risk()} fallback={<div class="text-[13px] text-[var(--color-text-tertiary)]">Loading…</div>}>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[var(--color-border-subtle)] divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-subtle)]">
          <Gauge label="Daily P&L" value={risk()!.daily_pnl_pct} threshold={risk()!.daily_threshold_pct} />
          <Gauge label="Weekly P&L" value={risk()!.weekly_pnl_pct} threshold={risk()!.weekly_threshold_pct} />
          <Gauge label="Total P&L" value={risk()!.total_pnl_pct} threshold={risk()!.total_threshold_pct} />
        </div>

        <div class="border border-[var(--color-border-subtle)] p-6">
          <div class="flex items-baseline justify-between">
            <h2 class="text-[18px] font-medium">Halt status</h2>
            <span
              class="text-[12px] px-2 py-0.5 uppercase tracking-wider"
              classList={{
                "bg-[var(--color-signal-error)] text-[var(--color-white)]": risk()!.halt_active,
                "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]": !risk()!.halt_active,
              }}
            >
              {risk()!.halt_active ? "active" : "inactive"}
            </span>
          </div>
          <Show when={risk()!.halt_active}>
            <p class="text-[14px] text-[var(--color-text-secondary)] mt-3 font-mono">
              reason: {risk()!.halt_reason}
            </p>
          </Show>
          <p class="text-[12px] text-[var(--color-text-tertiary)] mt-3 font-mono">
            Halt is controlled via API: `POST /api/halt` with {"{reason}"}, `DELETE /api/halt` to resume.
          </p>
        </div>
      </Show>
    </div>
  );
}

function Gauge(props: { label: string; value: number; threshold: number }) {
  const share = () => Math.min(Math.abs(props.value) / props.threshold, 1);
  const over = () => Math.abs(props.value) >= props.threshold;
  return (
    <div class="p-6">
      <div class="text-[11px] uppercase text-[var(--color-text-tertiary)] tracking-wider mb-3">{props.label}</div>
      <div class={`text-[36px] font-mono font-medium tabular-nums ${pnlTone(props.value)}`}>
        {pct(props.value)}
      </div>
      <div class="mt-4 h-2 bg-[var(--color-bg-elevated)]">
        <div
          class="h-full transition-all duration-300"
          classList={{
            "bg-[var(--color-signal-error)]": over(),
            "bg-[var(--color-accent)]": !over(),
          }}
          style={{ width: `${share() * 100}%` }}
        />
      </div>
      <div class="text-[11px] text-[var(--color-text-tertiary)] mt-2 font-mono">
        cap ±{props.threshold.toFixed(1)}%
      </div>
    </div>
  );
}
