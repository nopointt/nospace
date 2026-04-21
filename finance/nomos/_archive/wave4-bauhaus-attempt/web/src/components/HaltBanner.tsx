import type { Component } from "solid-js";

export const HaltBanner: Component<{ reason: string }> = (props) => (
  <div class="bg-[var(--color-danger)] text-[var(--color-ink-on-accent)] px-4 py-3 text-sm font-bold flex items-center gap-3">
    <span class="text-lg">🛑</span>
    <span class="uppercase tracking-wider">HALTED</span>
    <span class="font-normal opacity-90">— {props.reason}</span>
  </div>
);
