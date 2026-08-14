import { championsPokemonList, championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { describe, it } from "vitest";
import { exportSet, importSet } from "./pokepaste";
import { toDefault } from "@/data/utility/training";
import { right } from "fp-ts/lib/Either.js";
import { TrainedPokemon } from "@/store/team/team";

const data = championsPokemonList
  .filter(({ slug }) => slug !== null)
  .map((pokemon) => toDefault(pokemon.identifier)!)
  .map((pokemon): TrainedPokemon => ({
    ...pokemon,
    nature: {
      plus: "atk",
      minus: "spa",
    },
    moves: championsPokemonByIdentifier.get(pokemon.identifier)!.moves.slice(0, 4) as TrainedPokemon["moves"],
    evs: {
      hp: 32,
      atk: 32,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 2,
    } as TrainedPokemon["evs"],
  }));

describe("exportSet for All Pokémon", () => {
  it.concurrent.for(data)("exportSet( $identifier )", (input, { expect }) => {
    const exported = exportSet(input);
    expect(exported).toMatchSnapshot();
    const reversed = importSet(exported);
    expect(reversed).toEqual(right(expect.anything()));
  });
});
