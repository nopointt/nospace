import { defineCollection, z, reference } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(300),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference("authors"),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    canonical: z.string().url().optional(),
    coverImage: image().optional(),
    coverAlt: z.string().optional(),
  }),
});

const authors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    bio: z.string().min(1).max(500),
    avatar: z.string().optional(),
    github: z.string().url().optional(),
    twitter: z.string().optional(),
    website: z.string().url().optional(),
  }),
});

export const collections = { posts, authors };
