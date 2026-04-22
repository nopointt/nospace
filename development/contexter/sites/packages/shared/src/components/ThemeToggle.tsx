import { createSignal, onMount } from "solid-js";
import { type ThemeMode, readStoredTheme, writeStoredTheme, applyTheme, cycleTheme } from "../lib/theme";

export default function ThemeToggle() {
  const [mode, setMode] = createSignal<ThemeMode>("dark");

  onMount(() => {
    const stored = readStoredTheme();
    setMode(stored);
    applyTheme(stored);

    // React to system preference changes when mode = "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (mode() === "system") applyTheme("system");
    };
    mq.addEventListener("change", listener);
  });

  const handleClick = () => {
    const next = cycleTheme(mode());
    setMode(next);
    writeStoredTheme(next);
    applyTheme(next);
  };

  const label = () => {
    if (mode() === "system") return "theme: system";
    if (mode() === "light") return "theme: light";
    return "theme: dark";
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="font-mono text-xs px-3 py-1 border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-hover)] transition-colors"
      aria-label={`Current theme: ${mode()}. Click to cycle.`}
    >
      {label()}
    </button>
  );
}
