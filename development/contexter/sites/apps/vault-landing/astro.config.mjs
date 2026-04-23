import { defineConfig } from "astro/config";
import solidJs from "@astrojs/solid-js";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// CF Web Analytics site tag — public beacon ID, not a secret
// (client-visible in HTML; same ID served to every visitor)
const CF_ANALYTICS_TOKEN = "9522e36dfa2242ad9a89ea8d88690101";

export default defineConfig({
  site: "https://vault.contexter.cc",
  output: "static",
  integrations: [solidJs(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@contexter/shared"],
    },
    define: {
      "import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN": JSON.stringify(CF_ANALYTICS_TOKEN),
    },
  },
  build: {
    format: "directory",
  },
});
