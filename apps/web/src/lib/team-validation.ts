import { z } from "zod";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";

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
    for (let i = 0; i < data.moves.length; i++) {
      const move = data.moves[i];
      if (move !== null && !pokemonData.moves.includes(move)) {
        ctx.addIssue({
          code: "custom",
          message: `Move ${move} is not valid for ${data.identifier}`,
          path: ["moves", i],
        });
      }
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
    const evTotal = data.evs.hp + data.evs.atk + data.evs.def + data.evs.spa + data.evs.spd + data.evs.spe;
    if (evTotal > 64) {
      ctx.addIssue({
        code: "custom",
        message: `Total EVs exceed 64`,
        path: ["evs"],
      });
    }
  });

export const teamSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    members: z.array(trainedPokemonSchema.nullable()).length(6),
  })
  .superRefine((team, ctx) => {
    const items = new Set<number>();
    for (let i = 0; i < team.members.length; i++) {
      const member = team.members[i];
      if (member && member.item !== null) {
        if (items.has(member.item)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate item found: ${member.item}. Each Pokemon must have a unique item.`,
            path: ["members", i, "item"],
          });
        }
        items.add(member.item);
      }
    }
  });

export const teamsSchema = z.array(teamSchema);
