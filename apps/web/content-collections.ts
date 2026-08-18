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
  nature: z.string().optional(),
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
  rngControl: z
    .object({
      mode: z.enum(["deterministic", "probabilistic"]),
      iterations: z.number().optional(),
      crits: z.enum(["none", "always", "vanilla"]).optional(),
      accuracy: z.enum(["perfect", "worst_case", "vanilla"]).optional(),
      secondaryEffects: z.enum(["none", "always", "vanilla"]).optional(),
      damageRoll: z.enum(["max", "min", "expected", "worst_case", "vanilla"]).optional(),
      speedTies: z.enum(["player_wins", "opponent_wins", "vanilla"]).optional(),
    })
    .optional(),
  correctMoves: z.array(z.string()),
  opponentResponses: z.record(z.string(), z.string()).optional(),
});

const quizzes = defineCollection({
  name: "quizzes",
  directory: "content/quiz",
  include: "**/*.mdx",
  schema: z
    .object({
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
      correctAnswerIndex: z.number().optional(),
      correctAnswerIndices: z.array(z.number()).optional(),
      correctAnswer: z.string().optional(), // only for 'input' format
      correctOrderIndices: z.array(z.number()).optional(),
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
            () => data.correctAnswerIndices !== undefined && data.correctAnswerIndices.length > 0,
          )
          .with(
            "ordering",
            () => data.correctOrderIndices !== undefined && data.correctOrderIndices.length === 4,
          )
          .with(
            "grouping",
            () => data.correctGroups !== undefined && Object.keys(data.correctGroups).length >= 2,
          )
          .with(
            P.union("choices", "one_way"),
            () => data.correctAnswerIndex !== undefined && data.correctAnswerIndex >= 0,
          )
          .with("input", () => data.correctAnswer !== undefined && data.correctAnswer.length > 0)
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
    ),
  transform: async (document, context) => {
    const transformed = await transformer({ withHeadings: false })(document, context);
    const parts = document._meta.path.replace(/\\/g, "/").split("/");
    const difficulty = parts[1] as "basics" | "advanced" | "expert" | "master";
    const category = parts[2] as "academic" | "damage_calc" | "tsume";
    const id = parts[parts.length - 1].replace(/\.mdx$/, "");

    // Refinement 3: Only certain formats are allowed per difficulty level
    if (difficulty === "basics" || difficulty === "advanced") {
      if (document.format !== "choices") {
        throw new Error(
          `Format ${document.format} not allowed for difficulty ${difficulty}. choices only.`,
        );
      }
    } else if (difficulty === "expert") {
      if (!["choices", "multi_select", "ordering", "tsume_action"].includes(document.format)) {
        throw new Error(`Format ${document.format} not allowed for difficulty ${difficulty}.`);
      }
    } else if (difficulty === "master") {
      if (
        !["choices", "multi_select", "ordering", "grouping", "one_way", "tsume_action"].includes(
          document.format,
        )
      ) {
        throw new Error(`Format ${document.format} not allowed for difficulty ${difficulty}.`);
      }
    } else {
      throw new Error(`Unknown difficulty: ${String(difficulty)}`);
    }

    // Refinement 4: tsume_action format requirements
    if (document.format === "tsume_action") {
      if (category !== "tsume" || document.tsumeData === undefined) {
        throw new Error(
          "tsume_action format requires category to be 'tsume' and tsumeData to be provided",
        );
      }
    }

    return {
      ...transformed,
      id,
      difficulty,
      category,
    };
  },
});

export default defineConfig({
  content: [posts, docs, quizzes],
});
