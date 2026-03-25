import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // Default timeout 2 minutes. CJM pipeline tests may run longer due to
  // Vectorize eventual consistency (2-5 min lag). Override per-test as needed.
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:8787",
  },
  reporter: [["list"]],
})
