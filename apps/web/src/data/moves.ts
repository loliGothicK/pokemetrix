import { data } from "@pokemetrix/data/champions/moves.json";
import { moveCategories, moveClassifications, moveRanges, types } from "@/types/pokemon";
import { z as zod } from "zod";
import { toValidationError, ValidationError } from "zod-validation-error";
import { Either, tryCatch } from "fp-ts/lib/Either";

export function parse(value: zod.input<typeof schema>): Either<ValidationError, Move> {
  return tryCatch(() => schema.parse(value), toValidationError());
}

const schema = zod
  .object({
    id: zod.number(),
    identifier: zod.string(),
    type: zod.enum(types, {
      error: (iss) => `${String(iss.input)}" is invalid`,
    }),
    category: zod.enum(moveCategories),
    power: zod.number().nullable(),
    accuracy: zod.number().nullable(),
    range: zod.enum(moveRanges, {
      error: (iss) => `${String(iss.input)}" is invalid`,
    }),
    pp: zod.number(),
    priority: zod.number().nullable(),

    classifications: zod.array(
      zod.enum(moveClassifications, {
        error: (iss) => `"${String(iss.input)}" is invalid`,
      }),
    ),
    secondary: zod
      .object({
        chance: zod.number(),
        status: zod.enum(["brn", "par", "psn", "tox", "slp", "frz"]).optional(),
        volatileStatus: zod.enum(["flinch", "confusion"]).optional(),
        boosts: zod
          .object({
            atk: zod.number().optional(),
            def: zod.number().optional(),
            spa: zod.number().optional(),
            spd: zod.number().optional(),
            spe: zod.number().optional(),
            accuracy: zod.number().optional(),
            evasion: zod.number().optional(),
          })
          .optional(),
      })
      .nullable()
      .optional(),
  })
  .readonly()
  .brand<"Move">();

type Move = zod.infer<typeof schema>;

export const MoveList: readonly Move[] = data.map((move) => {
  // Override spit-up to be a special move (since it's erroneously marked as status with null power in pokeapi)
  const isSpitUp = move.identifier === "spit-up";
  const category = isSpitUp ? "special" : move.category;

  return schema.parse({ ...move, type: move.type.toLocaleLowerCase(), category });
});

export const moveById = new Map(MoveList.map((move) => [move.id, move]));
export const moveByIdentifier = new Map(MoveList.map((move) => [move.identifier, move]));
