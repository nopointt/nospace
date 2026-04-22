import { getCollection, getEntry } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const sorted = [...posts].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  const siteUrl = context.site?.toString().replace(/\/$/, "") ?? "https://blog.contexter.cc";

  const items = await Promise.all(
    sorted.map(async (post) => {
      const author = await getEntry(post.data.author);
      return {
        id: `${siteUrl}/${post.slug}/`,
        url: `${siteUrl}/${post.slug}/`,
        title: post.data.title,
        summary: post.data.description,
        content_text: post.data.description,
        date_published: post.data.pubDate.toISOString(),
        tags: post.data.tags,
        authors: author
          ? [{ name: author.data.name, url: author.data.website ?? author.data.github }]
          : [],
      };
    }),
  );

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "contexter blog",
    home_page_url: siteUrl + "/",
    feed_url: siteUrl + "/feed.json",
    description:
      "Technical writing on Contexter (RAG-as-a-service), contexter-vault, and self-hosted AI infrastructure.",
    language: "en-US",
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/feed+json" },
  });
}
