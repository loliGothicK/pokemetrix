import { defineCollection, defineConfig, type Context } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

type MDXDocument = Parameters<typeof compileMDX>[1];

const transformer =
  ({ withHeadings }: { withHeadings: boolean } = { withHeadings: true }) =>
  async <T extends MDXDocument>(document: T, context: Context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    });

    const parts = document._meta.path.replace(/\\/g, "/").split("/");
    const locale = parts[0] === "en" || parts[0] === "ja" ? parts[0] : "ja";
    const slug =
      parts[0] === "en" || parts[0] === "ja" ? parts.slice(1).join("/") : document._meta.path;

    return {
      ...document,
      slug,
      locale,
      mdx,
      ...(withHeadings && { headings: extractHeadings(document.content) }),
    };
  };

export type Heading = {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
};

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u3040-\u9FFF\uAC00-\uD7AF]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    headings.push({ id, text, level });
  }
  return headings;
}

const posts = defineCollection({
  name: "posts",
  directory: "content/blog",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    content: z.string(),
  }),
  transform: transformer({ withHeadings: true }),
});

const docs = defineCollection({
  name: "docs",
  directory: "content/docs",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
    group: z.string().optional(),
    content: z.string(),
  }),
  transform: transformer({ withHeadings: true }),
});

const tsumePokemonSchema = z.object({
  species: z.string(),
  hpCurrent: z.number(),
  hpMax: z.number(),
  moves: z.array(z.string()).optional(),
  item: z.string().optional(),
  status: z.string().optional(),
});

const practicalDataSchema = z.object({
  attacker: z.object({
    species: z.string(),
    evs: z.string(),
    item: z.string(),
    nature: z.string(),
    boosts: z.string().optional(),
  }),
  defender: z.object({
    species: z.string(),
    evs: z.string(),
    item: z.string(),
    nature: z.string(),
    hpPercent: z.number().optional(),
  }),
  ally: z
    .object({
      species: z.string(),
      item: z.string().optional(),
    })
    .optional(),
  opponentAlly: z
    .object({
      species: z.string(),
      item: z.string().optional(),
    })
    .optional(),
  move: z.string(),
  field: z
    .object({
      weather: z.string().optional(),
      terrain: z.string().optional(),
    })
    .optional(),
});

const tsumeDataSchema = z.object({
  playerSide: z.array(tsumePokemonSchema),
  opponentSide: z.array(tsumePokemonSchema),
  playerParty: z.array(tsumePokemonSchema).optional(),
  field: z
    .object({
      weather: z.string().optional(),
      terrain: z.string().optional(),
      trickRoom: z.boolean().optional(),
    })
    .optional(),
  correctMoves: z.array(z.string()),
});

const quizzes = defineCollection({
  name: "quizzes",
  directory: "content/quiz",
  include: "**/*.mdx",
  schema: z.object({
    id: z.string(),
    difficulty: z.enum(["basics", "advanced", "expert", "master"]),
    category: z.enum(["academic", "damage_calc", "tsume"]),
    format: z.enum(["choices", "input"]),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    prerequisites: z.array(z.string()).default([]),
    practicalData: practicalDataSchema.optional(),
    tsumeData: tsumeDataSchema.optional(),
    content: z.string(),
  }),
  transform: transformer({ withHeadings: false }),
});

export default defineConfig({
  content: [posts, docs, quizzes],
});
