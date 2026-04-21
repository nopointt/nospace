import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTEXTER_WEB = resolve(__dirname, "../../../development/contexter/web/src");

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  resolve: {
    alias: {
      "@contexter": CONTEXTER_WEB,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "https://api.nomos.contexter.cc", changeOrigin: true },
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: false,
  },
});
