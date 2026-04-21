import { A, useLocation } from "@solidjs/router";
import { createResource, type ParentComponent, Show } from "solid-js";
import { endpoints } from "./lib/api";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/trades", label: "Trades" },
  { href: "/strategies", label: "Strategies" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/charts", label: "Charts" },
  { href: "/risk", label: "Risk" },
];

export const AppShell: ParentComponent = (props) => {
  const location = useLocation();
  const [risk] = createResource(() => endpoints.risk().catch(() => null));
  const [runner] = createResource(() => endpoints.runnerStatus().catch(() => null));

  const linkClass = (path: string) => {
    const active =
      location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
    return `text-[14px] tracking-wide transition-colors duration-[80ms] ${
      active
        ? "text-[var(--color-text-primary)] font-medium"
        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
    }`;
  };

  return (
    <div class="min-h-screen flex flex-col">
      {/* top nav: mimics Contexter nav */}
      <header class="h-14 px-6 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)]">
        <div class="flex items-center gap-6">
          <A href="/" class="flex items-center gap-2 text-[var(--color-text-primary)]">
            <svg width="28" height="28" viewBox="0 0 64 64">
              <rect width="64" height="64" fill="var(--color-bg-canvas)" />
              <circle cx="32" cy="32" r="20" fill="var(--color-black)" />
              <circle cx="32" cy="32" r="8" fill="var(--color-accent)" />
            </svg>
            <span class="text-[15px] font-medium tracking-wide">Nomos</span>
            <span class="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Vault</span>
          </A>
          <nav class="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <A href={item.href} class={linkClass(item.href)}>
                {item.label}
              </A>
            ))}
          </nav>
        </div>
        <div class="flex items-center gap-3 text-[12px] text-[var(--color-text-tertiary)]">
          <Show when={runner()}>
            <span class="flex items-center gap-1.5">
              <span
                class="w-2 h-2 rounded-full"
                classList={{
                  "bg-[var(--color-signal-success)]": !!runner()?.running,
                  "bg-[var(--color-text-tertiary)]": !runner()?.running,
                }}
              />
              runner {runner()?.running ? "running" : "stopped"}
            </span>
          </Show>
          <Show when={risk()?.halt_active}>
            <span class="text-[var(--color-signal-error)] font-medium uppercase">halted</span>
          </Show>
        </div>
      </header>

      {/* halt banner */}
      <Show when={risk()?.halt_active}>
        <div class="bg-[var(--color-signal-error)] text-[var(--color-white)] px-6 py-2 text-[13px] font-medium">
          HALTED — {risk()?.halt_reason ?? "(no reason)"}
        </div>
      </Show>

      <main class="flex-1 p-6 max-w-[1440px] w-full mx-auto">{props.children}</main>

      <footer class="px-6 py-4 text-[11px] text-[var(--color-text-tertiary)] border-t border-[var(--color-border-subtle)]">
        Nomos Vault · opensource paper trading — <a href="https://contexter.cc" class="hover:text-[var(--color-text-primary)]">part of Contexter</a>
      </footer>
    </div>
  );
};
