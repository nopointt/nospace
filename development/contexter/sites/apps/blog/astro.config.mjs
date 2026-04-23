import { defineConfig } from "astro/config";
import solidJs from "@astrojs/solid-js";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// CF Web Analytics site tag — public beacon ID, not a secret
// (client-visible in HTML; same ID served to every visitor)
const CF_ANALYTICS_TOKEN = "8ba18d1ecb2a4b1b9859f950acd1ea11";

export default defineConfig({
  site: "https://blog.contexter.cc",
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
