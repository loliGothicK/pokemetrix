import { data } from "@data/champions/moves.json";
import { z } from "zod";
import { moveCategories, moveClassifications, moveRanges, types } from "@/types/pokemon";

const toZodUnion = <const T extends readonly string[]>(tuple: T) => {
  return z.union(tuple.map((item) => z.literal(item)));
};

const MoveSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  type: toZodUnion(types),
  category: toZodUnion(moveCategories),
  power: z.number().nullable(),
  accuracy: z.number().nullable(),
  range: toZodUnion(moveRanges),
  pp: z.number(),
  priority: z.number().nullable(),
  effect: z.string().nullable(),
  classifications: z.array(toZodUnion(moveClassifications)),
});

type Move = z.infer<typeof MoveSchema>;

export const MoveList: Move[] = data.map((move) => {
  return MoveSchema.parse(move);
});
