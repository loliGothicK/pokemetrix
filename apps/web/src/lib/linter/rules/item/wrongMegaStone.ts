import { TrainedPokemon } from "@/store/team/team";
import { option } from "fp-ts";
import { Option } from "fp-ts/lib/Option";
import { WrongMegaStone, wrongMegaStone } from "@/lib/linter/errors/LintError";
import { itemById } from "@/data/items";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";

export const checkWrongMegaStone = (member: TrainedPokemon): Option<WrongMegaStone> => {
  const item = member.item;

  if (!item) {
    return option.none;
  } else if (itemById.get(item)!.category !== "mega-evolution") {
    return option.none;
  } else {
    const specifiedMegaStone = championsPokemonByIdentifier
      .get(member.identifier)!
      .mega?.map(({ stone_id }) => stone_id);
    if (!specifiedMegaStone) {
      return option.some(
        wrongMegaStone(`A Pokémon that cannot Mega Evolve is holding a Mega Stone.`),
      );
    } else if (!specifiedMegaStone.includes(item)) {
      return option.some(wrongMegaStone(`This is wrong Mega Stone.`));
    } else {
      return option.none;
    }
  }
};
