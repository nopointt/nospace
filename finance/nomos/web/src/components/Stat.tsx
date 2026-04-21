import type { Component, JSX } from "solid-js";

export const Stat: Component<{
  label: string;
  value: JSX.Element;
  sub?: JSX.Element;
}> = (props) => (
  <div class="border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-5">
    <div class="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
      {props.label}
    </div>
    <div class="text-[28px] font-mono font-medium text-[var(--color-text-primary)] leading-none tabular-nums">
      {props.value}
    </div>
    {props.sub !== undefined && (
      <div class="text-[12px] text-[var(--color-text-tertiary)] mt-2 font-mono">{props.sub}</div>
    )}
  </div>
);
