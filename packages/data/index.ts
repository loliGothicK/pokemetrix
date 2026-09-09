import rawPokemonData from "./champions/pokemon.json" with { type: "json" };
import movesData from "./champions/moves.json" with { type: "json" };
import itemsData from "./champions/items.json" with { type: "json" };
import abilitiesData from "./master/abilities.json" with { type: "json" };
import { resolvePokemonInheritance } from "./champions/patches";

const pokemonData = {
  data: resolvePokemonInheritance(rawPokemonData.data),
};

export { rawPokemonData, pokemonData, movesData, itemsData, abilitiesData };

export * from "./champions/regulations";
export * from "./champions/patches";
