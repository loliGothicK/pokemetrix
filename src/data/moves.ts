import { data } from "@data/champions/moves.json";
import { moveCategories, moveClassifications, moveRanges, types } from "@/types/pokemon";
import { z as zod } from "zod";
import { toValidationError, ValidationError } from "zod-validation-error";
import { Either, tryCatch } from "fp-ts/Either";

export function parse(value: zod.input<typeof schema>): Either<ValidationError, Move> {
  return tryCatch(() => schema.parse(value), toValidationError());
}

const schema = zod
  .object({
    id: zod.number(),
    identifier: zod.string(),
    type: zod.enum(types, {
      error: (iss) => `${iss.input}" is invalid`,
    }),
    category: zod.enum(moveCategories),
    power: zod.number().nullable(),
    accuracy: zod.number().nullable(),
    range: zod.enum(moveRanges, {
      error: (iss) => `${iss.input}" is invalid`,
    }),
    pp: zod.number(),
    priority: zod.number().nullable(),
    effect: zod.string().nullable(),
    classifications: zod.array(
      zod.enum(moveClassifications, {
        error: (iss) => `"${iss.input}" is invalid`,
      }),
    ),
  })
  .brand<"Move">();

type Move = zod.infer<typeof schema>;

export const MoveList: Move[] = data.map((move) => {
  return schema.parse({ ...move, type: move.type.toLocaleLowerCase() });
});

export const moveById = new Map(MoveList.map((move) => [move.id, move]));
export const moveByIdentifier = new Map(MoveList.map((move) => [move.identifier, move]));
