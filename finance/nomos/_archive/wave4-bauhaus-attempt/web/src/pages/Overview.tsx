import { createResource, For, Show } from "solid-js";
import { endpoints } from "../lib/api";
import { getToken } from "../lib/auth";
import { Button, Card, Pill, Stat } from "../components/primitives";
import { useLiveStream } from "../lib/sse";
import { usd, pct, pnlColor, tsShort } from "../lib/format";

export default function Overview() {
  const [balance, { refetch: refetchBalance }] = createResource(getToken, () =>
    endpoints.balance(),
  );
  const [risk, { refetch: refetchRisk }] = createResource(getToken, () =>
    endpoints.risk(),
  );
  const [runner, { refetch: refetchRunner }] = createResource(getToken, () =>
    endpoints.runnerStatus(),
  );
  const [strategies] = createResource(getToken, () => endpoints.strategies());

  const { events, connected } = useLiveStream({ replay: 50 });

  const stop = async () => {
    await endpoints.runnerStop();
    refetchRunner();
  };
  const start = async () => {
    await endpoints.runnerStart();
    refetchRunner();
  };

  const haltClick = async () => {
    const reason = prompt("Halt reason?");
    if (!reason) return;
    await endpoints.halt(reason);
    refetchRisk();
  };

  const resumeClick = async () => {
    await endpoints.resume();
    refetchRisk();
  };

  // Auto-refresh on SSE events
  setInterval(() => {
    refetchBalance();
    refetchRisk();
    refetchRunner();
  }, 15_000);

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2>Overview</h2>
        <div class="flex items-center gap-2">
          <Pill tone={connected() ? "success" : "neutral"}>
            stream · {connected() ? "live" : "offline"}
          </Pill>
          <Show when={runner()?.running} fallback={
            <Button onClick={start} variant="primary" size="sm">Start runner</Button>
          }>
            <Button onClick={stop} variant="ghost" size="sm">Stop runner</Button>
          </Show>
          <Show when={!risk()?.halt_active} fallback={
            <Button onClick={resumeClick} variant="warning" size="sm">Resume</Button>
          }>
            <Button onClick={haltClick} variant="danger" size="sm">Halt</Button>
          </Show>
        </div>
      </div>

      {/* Stat cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat
          label="Total Balance"
          value={balance() ? usd(balance()!.total_usd) : "…"}
          sub={balance() ? `USDT ${usd(balance()!.usdt, 2)}` : ""}
        />
        <Stat
          label="Daily P&L"
          value={
            <span class={risk() ? pnlColor(risk()!.daily_pnl_pct) : ""}>
              {risk() ? pct(risk()!.daily_pnl_pct) : "…"}
            </span>
          }
          sub={risk() ? `threshold ±${risk()!.daily_threshold_pct}%` : ""}
        />
        <Stat
          label="Weekly P&L"
          value={
            <span class={risk() ? pnlColor(risk()!.weekly_pnl_pct) : ""}>
              {risk() ? pct(risk()!.weekly_pnl_pct) : "…"}
            </span>
          }
          sub={risk() ? `threshold ±${risk()!.weekly_threshold_pct}%` : ""}
        />
        <Stat
          label="Total P&L"
          value={
            <span class={risk() ? pnlColor(risk()!.total_pnl_pct) : ""}>
              {risk() ? pct(risk()!.total_pnl_pct) : "…"}
            </span>
          }
          sub={risk() ? `threshold ±${risk()!.total_threshold_pct}%` : ""}
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Strategies quick list */}
        <div class="lg:col-span-2 space-y-4">
          <Card>
            <h3 class="text-lg font-bold mb-3">Strategies</h3>
            <Show when={strategies()} fallback={<div class="text-xs text-[var(--color-ink-tertiary)]">Loading…</div>}>
              <div class="space-y-2">
                <For each={strategies()}>{(s) => (
                  <div class="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 last:border-b-0 last:pb-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{s.name}</span>
                      <Pill tone={s.type === "virtual" ? "warning" : "info"}>{s.type}</Pill>
                      <Pill tone={s.enabled ? "success" : "neutral"}>
                        {s.enabled ? "enabled" : "disabled"}
                      </Pill>
                    </div>
                    <div class="text-xs text-[var(--color-ink-tertiary)]">
                      {s.trades} trades · {s.buys}B / {s.sells}S
                    </div>
                  </div>
                )}</For>
              </div>
            </Show>
          </Card>
        </div>

        {/* Live feed */}
        <Card>
          <h3 class="text-lg font-bold mb-3">Live feed</h3>
          <Show when={events().length > 0} fallback={
            <div class="text-xs text-[var(--color-ink-tertiary)]">Waiting for events…</div>
          }>
            <ul class="space-y-1.5 text-xs font-mono max-h-96 overflow-y-auto">
              <For each={events().slice(0, 50)}>{(e) => (
                <li class="flex gap-2">
                  <span class="text-[var(--color-ink-tertiary)] shrink-0 w-14">
                    {tsShort(e.ts)}
                  </span>
                  <Pill tone={toneForEvent(e.event)}>{e.event}</Pill>
                  <span class="truncate text-[var(--color-ink-secondary)]">
                    {formatEvent(e)}
                  </span>
                </li>
              )}</For>
            </ul>
          </Show>
        </Card>
      </div>
    </div>
  );
}

function toneForEvent(ev: string) {
  if (ev === "trade") return "info" as const;
  if (ev === "runner_state") return "success" as const;
  if (ev === "halt_changed") return "danger" as const;
  return "neutral" as const;
}

function formatEvent(e: { event: string; data: Record<string, unknown> }): string {
  const d = e.data;
  const strategy = d.strategy as string | undefined;
  const pair = d.pair as string | undefined;
  const side = d.side as string | undefined;
  const event = d.event as string | undefined;
  const parts: string[] = [];
  if (strategy) parts.push(strategy);
  if (pair) parts.push(pair);
  if (side) parts.push(side);
  if (event && event !== e.event) parts.push(event);
  return parts.join(" · ") || e.event;
}
