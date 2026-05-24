import { data } from "@data/master/pokemon.json";
import { z } from "zod";

const PokemonSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  species_id: z.string(),
  height: z.number(),
  weight: z.number(),
  order: z.number(),
  is_default: z.boolean(),
});

type Pokemon = z.infer<typeof PokemonSchema>;

export const pokemonList: Pokemon[] = data.map((memoria) => {
  return PokemonSchema.parse(memoria);
});
