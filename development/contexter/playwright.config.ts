import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // Default 3 minutes. Audio pipeline tests override to 5 minutes.
  timeout: 180_000,
  retries: 0,
  use: {
    // Production frontend for browser tests
    baseURL: "https://contexter.cc",
    screenshot: "only-on-failure",
    video: "off",
    trace: "off",
  },
  reporter: [["list"]],
  // Run suites in parallel where possible (serial suites self-manage)
  fullyParallel: false,
})
