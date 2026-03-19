import "@testing-library/jest-dom/vitest";

// Ensure a basic fetch polyfill is available in jsdom.
// Node 18+ ships fetch natively, so this is mainly a safety guard.
if (typeof globalThis.fetch === "undefined") {
  const { default: nodeFetch } = await import("node-fetch" as string);
  globalThis.fetch = nodeFetch as unknown as typeof fetch;
}
