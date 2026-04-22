import rss from "@astrojs/rss";
import { getCollection, getEntry } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const sorted = [...posts].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  const items = await Promise.all(
    sorted.map(async (post) => {
      const author = await getEntry(post.data.author);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${post.slug}/`,
        categories: post.data.tags,
        author: author?.data.name ?? "contexter",
      };
    }),
  );

  return rss({
    title: "contexter blog",
    description:
      "Technical writing on Contexter (RAG-as-a-service), contexter-vault, and self-hosted AI infrastructure.",
    site: context.site ?? "https://blog.contexter.cc",
    items,
    customData: "<language>en-us</language>",
  });
}
