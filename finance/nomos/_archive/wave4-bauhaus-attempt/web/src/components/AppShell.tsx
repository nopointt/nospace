import { A, useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createResource, type ParentComponent, Show } from "solid-js";
import { getToken, setToken, isAuthenticated } from "../lib/auth";
import { endpoints } from "../lib/api";
import { Pill } from "./primitives";
import { HaltBanner } from "./HaltBanner";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/trades", label: "Trades" },
  { href: "/strategies", label: "Strategies" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/charts", label: "Charts" },
  { href: "/risk", label: "Risk" },
  { href: "/remizov", label: "Remizov ODE" },
  { href: "/settings", label: "Settings" },
];

export const AppShell: ParentComponent = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    if (!isAuthenticated()) navigate("/login", { replace: true });
  });

  const [risk] = createResource(getToken, () => endpoints.risk().catch(() => null));
  const [runner] = createResource(getToken, () => endpoints.runnerStatus().catch(() => null));

  const logout = () => {
    setToken(null);
    navigate("/login", { replace: true });
  };

  return (
    <Show when={isAuthenticated()}>
      <div class="min-h-screen flex flex-col">
        {/* header */}
        <header class="h-14 px-4 flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 64 64" class="shrink-0">
                <rect x="0" y="0" width="32" height="32" fill="var(--color-yellow)" />
                <rect x="32" y="0" width="32" height="32" fill="var(--color-red)" />
                <rect x="0" y="32" width="32" height="32" fill="var(--color-blue)" />
                <rect x="32" y="32" width="32" height="32" fill="var(--color-ink-primary)" />
              </svg>
              <span class="text-lg font-bold">Nomos</span>
            </div>
            <Pill tone={runner()?.running ? "success" : "neutral"}>
              {runner.loading
                ? "…"
                : runner()?.running
                  ? `runner · ${runner()?.state ?? "running"}`
                  : "runner · stopped"}
            </Pill>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] transition"
              onClick={logout}
            >
              logout
            </button>
          </div>
        </header>

        {/* halt banner if active */}
        <Show when={risk()?.halt_active}>
          <HaltBanner reason={risk()?.halt_reason ?? "(no reason)"} />
        </Show>

        {/* main layout: sidebar + content */}
        <div class="flex-1 flex">
          <nav class="w-56 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)] py-4 hidden md:block">
            <ul class="space-y-1">
              {navItems.map((item) => {
                const active = () =>
                  location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href));
                return (
                  <li>
                    <A
                      href={item.href}
                      class="block px-4 py-2 text-sm transition"
                      classList={{
                        "bg-[var(--color-elevated)] text-[var(--color-ink-primary)] border-l-4 border-[var(--color-accent)]":
                          active(),
                        "text-[var(--color-ink-secondary)] hover:bg-[var(--color-elevated)] border-l-4 border-transparent":
                          !active(),
                      }}
                    >
                      {item.label}
                    </A>
                  </li>
                );
              })}
            </ul>
          </nav>
          <main class="flex-1 p-6 overflow-x-auto">{props.children}</main>
        </div>
      </div>
    </Show>
  );
};
