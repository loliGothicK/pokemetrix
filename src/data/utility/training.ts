import { championsPokemonList } from "@/data/champions-pokemon";
import { pokemonList } from "@/data/pokemon";
import { TrainedPokemon } from "@/store/team/team";
import { match } from "ts-pattern";
import { Gender } from "@/types/pokemon";
import { ulid } from "ulid";

const MAP = (() => {
  const gender_rate = new Map(pokemonList.map((pokemon) => [pokemon.id, pokemon.gender_rate]));

  return new Map(
    championsPokemonList.map((pokemon) => {
      return [
        pokemon.identifier,
        {
          slug: pokemon.slug,
          ability: pokemon.abilities[0]!,
          gender: match<number, { fixed: boolean; specified?: Gender }>(
            gender_rate.get(pokemon.id)!,
          )
            .with(-1, () => ({
              fixed: true,
              specified: "unknown",
            }))
            .with(0, () => ({
              fixed: true,
              specified: "male",
            }))
            .with(8, () => ({
              fixed: true,
              specified: "female",
            }))
            .otherwise(() => ({
              fixed: false,
              specified: undefined,
            })),
        },
      ];
    }),
  );
})();

export const toDefault = (identifier: string | null): TrainedPokemon | null => {
  if (!identifier) {
    return null;
  }
  const basics = MAP.get(identifier)!;
  return {
    boxId: ulid(),
    identifier,
    slug: basics.slug!,
    ability: basics.ability!,
    gender: basics.gender!,
    item: null,
    moves: [null, null, null, null],
    nature: {},
    evs: {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    },
  };
};

// 完全に等価な最適化版
export const calcHp = (base: number, ev: number) => base + ev + 75;

export const calcStatus = (base: number, ev: number, nature: number = 1.0) => {
  return Math.floor((base + ev + 20) * nature);
};
