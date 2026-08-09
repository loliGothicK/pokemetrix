import { defineCollection, defineConfig, type Context } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { P, match } from "ts-pattern";

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
  hpCurrent: z.number().optional(), // Make optional if some puzzles don't strictly require HP to be tracked
  hpMax: z.number().optional(),
  stats: z.object({ spe: z.number().optional() }).optional(),
  moves: z.array(z.string()).optional(),
  item: z.string().optional(),
  ability: z.string().optional(),
  status: z.string().optional(),
  volatiles: z.array(z.string()).optional(),
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

const tsumeSideSchema = z.object({
  active: z.array(tsumePokemonSchema),
  bench: z.array(tsumePokemonSchema).optional(),
});

const tsumeDataSchema = z.object({
  playerSide: tsumeSideSchema,
  opponentSide: tsumeSideSchema,
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
  schema: z
    .object({
      id: z.string(),
      difficulty: z.enum(["basics", "advanced", "expert", "master"]),
      category: z.enum(["academic", "damage_calc", "tsume"]),
      format: z.enum([
        "choices",
        "multi_select",
        "ordering",
        "grouping",
        "one_way",
        "input",
        "tsume_action",
      ]),
      generation: z.number().optional(),
      question: z.string(),
      options: z.array(z.string()).optional(),

      // Answer fields (all optional; validated by refinements below)
      correctAnswer: z.string().optional(),
      correctAnswers: z.array(z.string()).optional(),
      correctOrder: z.array(z.string()).optional(),
      correctGroups: z.record(z.string(), z.array(z.string())).optional(),

      practicalData: practicalDataSchema.optional(),
      tsumeData: z.optional(tsumeDataSchema),
      reviewed: z.boolean().default(false),
      content: z.string(),
    })
    // Refinement 1: Answer field must be present and correct for the format
    .refine(
      (data) =>
        match(data.format)
          .with(
            "multi_select",
            () => data.correctAnswers !== undefined && data.correctAnswers.length > 0,
          )
          .with("ordering", () => data.correctOrder !== undefined && data.correctOrder.length === 4)
          .with(
            "grouping",
            () => data.correctGroups !== undefined && Object.keys(data.correctGroups).length >= 2,
          )
          .with(
            P.union("choices", "one_way", "input"),
            () => data.correctAnswer !== undefined && data.correctAnswer.length > 0,
          )
          .with("tsume_action", () => true)
          .exhaustive(),
      { message: "Answer field must match format type" },
    )
    // Refinement 2: Options count must satisfy per-format constraints
    .refine(
      (data) => {
        if (data.format === "input" || data.format === "tsume_action") {
          return true; // these formats do not require options
        }

        if (!data.options || data.options.length === 0) {
          return false;
        }

        const count = data.options.length;

        return match({ format: data.format, count })
          .with({ format: "multi_select", count: P.number.between(3, 4) }, () => true)
          .with({ format: "ordering", count: 4 }, () => true)
          .with({ format: "grouping", count: P.number.between(3, 5) }, () => true)
          .with({ format: "one_way", count: P.number.between(2, 6) }, () => true)
          .with({ format: "choices", count: P.number.between(2, 4) }, () => true)
          .otherwise(() => false);
      },
      { message: "Options count must match format requirements", path: ["options"] },
    )
    // Refinement 3: Only certain formats are allowed per difficulty level
    .refine(
      (data) => {
        const { difficulty, format } = data;

        if (difficulty === "basics" || difficulty === "advanced") {
          return format === "choices";
        }

        if (difficulty === "expert") {
          return ["choices", "multi_select", "ordering", "tsume_action"].includes(format);
        }

        if (difficulty === "master") {
          return [
            "choices",
            "multi_select",
            "ordering",
            "grouping",
            "one_way",
            "tsume_action",
          ].includes(format);
        }

        return false;
      },
      {
        message:
          "Format not allowed for this difficulty level. " +
          "Basics/Advanced: choices only. " +
          "Expert: choices, multi_select, ordering. " +
          "Master: all formats allowed.",
        path: ["format"],
      },
    )
    // Refinement 4: tsume_action format requirements
    .refine(
      (data) => {
        if (data.format === "tsume_action") {
          return data.category === "tsume" && data.tsumeData !== undefined;
        }
        return true;
      },
      {
        message: "tsume_action format requires category to be 'tsume' and tsumeData to be provided",
      },
    ),
  transform: transformer({ withHeadings: false }),
});

export default defineConfig({
  content: [posts, docs, quizzes],
});
