import { getCollection, getEntry } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import fs from "node:fs";
import path from "node:path";

// Resolve font paths via process.cwd() which is stable during astro build.
// Astro sets cwd to the app root (apps/blog/) during static generation.
// Fonts live at: sites/packages/shared/src/fonts/
// From apps/blog/: ../../packages/shared/src/fonts
const fontsDir = path.resolve(
  process.cwd(),
  "../../packages/shared/src/fonts",
);

// satori does NOT support WOFF2 — it requires raw TTF/OTF buffers.
// We ship companion TTF files alongside the WOFF2 files.
async function loadFont(filePath: string): Promise<Buffer> {
  try {
    return await fs.promises.readFile(filePath);
  } catch {
    return Buffer.alloc(0);
  }
}

// Satori element helpers — all container divs MUST have display:flex
// to avoid "Expected <div> to have explicit display" errors.
function div(style: Record<string, unknown>, children: unknown): {
  type: "div";
  props: { style: Record<string, unknown>; children: unknown };
} {
  return { type: "div", props: { style, children } };
}

export async function getStaticPaths() {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export async function GET({ props }: { props: { post: any } }) {
  const { post } = props;
  const author = await getEntry(post.data.author);

  // Load TTF files — satori requires TTF/OTF, not WOFF2
  const monoFont = await loadFont(
    path.join(fontsDir, "jetbrains-mono-latin-700-normal.ttf"),
  );
  const sansFont = await loadFont(
    path.join(fontsDir, "inter-latin-500-normal.ttf"),
  );

  const monoFamily = monoFont.byteLength > 0 ? "JetBrains Mono" : "sans-serif";
  const sansFamily = sansFont.byteLength > 0 ? "Inter" : "sans-serif";

  const title: string =
    post.data.title.length > 90
      ? post.data.title.slice(0, 87) + "..."
      : post.data.title;

  const authorName: string = author?.data.name ?? "contexter";
  const dateStr: string = post.data.pubDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Build element tree.
  // Rules enforced by satori:
  //  - All container nodes must have display:"flex"
  //  - Leaf nodes must have a string child, not an array
  //  - Empty arrays are not valid children
  const element = div(
    {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "80px",
      backgroundColor: "#333333",
      color: "#FAFAFA",
      fontFamily: monoFamily,
    },
    [
      // Header: yellow square + brand name
      div(
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "16px",
        },
        [
          // Yellow square — leaf: empty string child so satori treats it as text leaf
          div(
            {
              display: "flex",
              width: "24px",
              height: "24px",
              backgroundColor: "#F5F501",
            },
            "",
          ),
          // Brand name
          div(
            {
              display: "flex",
              fontSize: "28px",
              color: "#F5F501",
              textTransform: "lowercase",
              fontFamily: monoFamily,
            },
            "contexter blog",
          ),
        ],
      ),
      // Body: title + author/date meta
      div(
        {
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        },
        [
          // Post title
          div(
            {
              display: "flex",
              fontSize: "56px",
              color: "#FAFAFA",
              lineHeight: "1.2",
              fontFamily: monoFamily,
              textTransform: "lowercase",
            },
            title,
          ),
          // Author + date
          div(
            {
              display: "flex",
              fontSize: "24px",
              color: "#CCCCCC",
              fontFamily: sansFamily,
              textTransform: "lowercase",
            },
            `by ${authorName}  ·  ${dateStr}`,
          ),
        ],
      ),
    ],
  );

  const fonts: {
    name: string;
    data: Buffer;
    weight: 400 | 500 | 700;
    style: "normal";
  }[] = [];
  if (monoFont.byteLength > 0) {
    fonts.push({ name: "JetBrains Mono", data: monoFont, weight: 700, style: "normal" });
  }
  if (sansFont.byteLength > 0) {
    fonts.push({ name: "Inter", data: sansFont, weight: 500, style: "normal" });
  }

  // Satori requires at least one font — use JetBrains Mono as fallback
  if (fonts.length === 0) {
    throw new Error(
      "No fonts loaded for OG image generation. Expected TTF files at " + fontsDir,
    );
  }

  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const pngBuffer = resvg.render().asPng();

  return new Response(pngBuffer, {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}
