import { getPokemonData, Regulation, RawPokemon } from "@pokemetrix/data";
import { data as typesData } from "@pokemetrix/data/master/pokemon_types.json";
import { data as typeData } from "@pokemetrix/data/master/types.json";
import { z } from "zod";
import { Type } from "@/types/pokemon";

const ChampionsPokemonSchema = z
  .object({
    id: z.number(),
    identifier: z.string(),
    slug: z.string().nullable(),
    abilities: z.array(z.number()),
    status: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
    moves: z.array(z.number()).readonly(),
    species_id: z.number().optional(),
    mega: z
      .array(
        z.object({
          mega_id: z.number(),
          stone_id: z.number(),
        }),
        {
          error: (iss) => `${String(iss.input)}" is invalid`,
        },
      )
      .optional(),
    form: z.number().optional(),
  })
  .readonly();

export type ChampionsPokemon = z.infer<typeof ChampionsPokemonSchema> & {
  readonly types: readonly Type[];
};

export const championsPokemonList: readonly ChampionsPokemon[] = getPokemonData()
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

const regulationListCache = new Map<string, readonly ChampionsPokemon[]>();

export function getChampionsPokemonList(
  regulation?: Regulation | string,
): readonly ChampionsPokemon[] {
  if (!regulation) {
    return championsPokemonList;
  }
  const cached = regulationListCache.get(regulation);
  if (cached) {
    return cached;
  }

  const rawList = getPokemonData(regulation);
  const result: readonly ChampionsPokemon[] = rawList
    .map((entry) => ChampionsPokemonSchema.parse(entry))
    .map((entry) => ({
      ...entry,
      types: typesData
        .filter(({ pokemon_id }) => pokemon_id === entry.id)
        .map(({ type_id }) => {
          return typeData.find(({ id }) => id === type_id)!.identifier as Type;
        }),
    }));

  regulationListCache.set(regulation, result);
  return result;
}

export function getChampionsPokemonById(
  regulation?: Regulation | string,
): Map<number, ChampionsPokemon> {
  const list = getChampionsPokemonList(regulation);
  return new Map(list.map((pokemon) => [pokemon.id, pokemon]));
}

export function getChampionsPokemonByIdentifier(
  regulation?: Regulation | string,
): Map<string, ChampionsPokemon> {
  const list = getChampionsPokemonList(regulation);
  return new Map(list.map((pokemon) => [pokemon.identifier, pokemon]));
}
