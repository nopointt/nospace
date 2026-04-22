/**
 * Theme state: "system" | "light" | "dark"
 * - system: respect prefers-color-scheme
 * - light: force light (remove .dark class)
 * - dark: force dark (add .dark class)
 * Persistence: localStorage["contexter-theme"]
 */

export type ThemeMode = "system" | "light" | "dark";

export const THEME_KEY = "contexter-theme";

export function readStoredTheme(): ThemeMode {
  if (typeof localStorage === "undefined") return "dark";
  const value = localStorage.getItem(THEME_KEY);
  if (value === "system" || value === "light" || value === "dark") return value;
  return "dark"; // default per D-CTX14-05
}

export function writeStoredTheme(mode: ThemeMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(THEME_KEY, mode);
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function cycleTheme(current: ThemeMode): ThemeMode {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}
