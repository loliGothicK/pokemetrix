import { z } from "zod";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { MAX_EV_TOTAL, MAX_EV_PER_STAT } from "@/store/team/lint";

export const trainedPokemonSchema = z
  .object({
    boxId: z.string(),
    identifier: z.string(),
    slug: z.string(),
    item: z.number().nullable(),
    ability: z.number(),
    gender: z.object({
      fixed: z.boolean(),
      specified: z.enum(["male", "female", "unknown"]).optional(),
    }),
    nature: z.object({
      plus: z.enum(["hp", "atk", "def", "spa", "spd", "spe"]).nullable().optional(),
      minus: z.enum(["hp", "atk", "def", "spa", "spd", "spe"]).nullable().optional(),
    }),
    moves: z.tuple([
      z.number().nullable(),
      z.number().nullable(),
      z.number().nullable(),
      z.number().nullable(),
    ]),
    evs: z.object({
      hp: z.number(),
      atk: z.number(),
      def: z.number(),
      spa: z.number(),
      spd: z.number(),
      spe: z.number(),
    }),
  })
  .superRefine((data, ctx) => {
    const pokemonData = championsPokemonByIdentifier.get(data.identifier);
    if (!pokemonData) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid Pokemon identifier: ${data.identifier}`,
      });
      return;
    }

    // Validate moves
    let hasMove = false;
    for (let i = 0; i < data.moves.length; i++) {
      const move = data.moves[i];
      if (move !== null) {
        hasMove = true;
        if (!pokemonData.moves.includes(move)) {
          ctx.addIssue({
            code: "custom",
            message: `Move ${move} is not valid for ${data.identifier}`,
            path: ["moves", i],
          });
        }
      }
    }

    if (!hasMove) {
      ctx.addIssue({
        code: "custom",
        message: `Pokemon must have at least one move`,
        path: ["moves"],
      });
    }

    // Validate ability
    if (!pokemonData.abilities.includes(data.ability)) {
      ctx.addIssue({
        code: "custom",
        message: `Ability ${data.ability} is not valid for ${data.identifier}`,
        path: ["ability"],
      });
    }

    // Validate EVs
    const evKeys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
    let evTotal = 0;
    for (const key of evKeys) {
      if (data.evs[key] > MAX_EV_PER_STAT) {
        ctx.addIssue({
          code: "custom",
          message: `${key.toUpperCase()} EV exceeds ${MAX_EV_PER_STAT}`,
          path: ["evs", key],
        });
      }
      evTotal += data.evs[key];
    }

    if (evTotal > MAX_EV_TOTAL) {
      ctx.addIssue({
        code: "custom",
        message: `Total EVs exceed ${MAX_EV_TOTAL}`,
        path: ["evs"],
      });
    }
  });
