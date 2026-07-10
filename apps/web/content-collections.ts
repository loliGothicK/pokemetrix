import { defineCollection, defineConfig } from "@content-collections/core";
import type { Context, Meta } from "@content-collections/core";
import {compileMDX} from "@content-collections/mdx";
import {z} from "zod";

const transform = async (document: { _meta: Meta; content: string; }, context: Pick<Context, "cache">) => {
  const mdx = await compileMDX(context, document);
  return {
    ...document,
    slug: document._meta.path,
    mdx,
  };
};

const posts = defineCollection({
  name: "posts",
  directory: "content/blog",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    content: z.string(),
  }),
  transform,
});

const docs = defineCollection({
  name: "docs",
  directory: "content/docs",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
    content: z.string(),
  }),
  transform,
});

export default defineConfig({
  content: [posts, docs],
});
