import { data } from "@data/master/pokemon.json";
import { z } from "zod";

const PokemonSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  species_id: z.number(),
  height: z.number(),
  weight: z.number(),
  gender_rate: z.number(),
  order: z.number().nullable(),
  is_default: z.boolean(),
});

type Pokemon = z.infer<typeof PokemonSchema>;

export const pokemonList: readonly Pokemon[] = data.map((memoria) => {
  return PokemonSchema.parse(memoria);
});

export const pokemonById: Map<number, Pokemon> = new Map(
  pokemonList.map((pokemon) => [pokemon.id, pokemon]),
);

export const pokemonByIdentifier: Map<string, Pokemon> = new Map(
  pokemonList.map((pokemon) => [pokemon.identifier, pokemon]),
);
