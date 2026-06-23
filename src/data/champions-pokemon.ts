import { data } from "@data/champions/pokemon.json";
import { data as typesData } from "@data/master/pokemon_types.json";
import { data as typeData } from "@data/master/types.json";
import { z } from "zod";
import { Type } from "@/types/pokemon";

const ChampionsPokemonSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  slug: z.string().nullable(),
  abilities: z.array(z.number()),
  status: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
  moves: z.array(z.number()),
  mega: z
    .array(
      z.object({
        mega_id: z.number(),
        stone_id: z.number(),
      }),
      {
        error: (iss) => `${iss.input}" is invalid`,
      },
    )
    .optional(),
  form: z.number().optional(),
});

export type ChampionsPokemon = z.infer<typeof ChampionsPokemonSchema> & {
  types: Type[];
};

export const championsPokemonList: ChampionsPokemon[] = data
  .map((entry) => ChampionsPokemonSchema.parse(entry))
  .map((entry) => ({
    ...entry,
    types: typesData
      .filter(({ pokemon_id }) => pokemon_id === entry.id)
      .map(({ type_id }) => {
        return typeData.find(({ id }) => id === type_id)!.identifier as Type;
      }),
  }));

export const championsPokemonById = new Map(
  championsPokemonList.map((pokemon) => [pokemon.id, pokemon]),
);

export const championsPokemonByIdentifier = new Map(
  championsPokemonList.map((pokemon) => [pokemon.identifier, pokemon]),
);
