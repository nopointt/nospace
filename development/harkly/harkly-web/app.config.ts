import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  server: {
    preset: isTauri ? "static" : "cloudflare-pages",
    rollupConfig: {
      external: isTauri ? [] : ["node:async_hooks"],
    },
  },
  middleware: "./src/middleware/index.ts",
  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 1420,
      strictPort: true,
    },
  },
  ssr: !isTauri,
});
