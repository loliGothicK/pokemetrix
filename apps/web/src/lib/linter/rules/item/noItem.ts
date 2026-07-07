import { TrainedPokemon } from "@/store/team/team";
import { option } from "fp-ts";
import { Option } from "fp-ts/Option";
import { NoItem, noItem } from "@/lib/linter/errors/LintError";
import { moveById } from "@/data/moves";

export const checkNoItem = (member: TrainedPokemon): Option<NoItem> => {
  const item = member.item;

  if (item) {
    return option.none;
  } else {
    const moves = member.moves
      .filter((id) => id !== null)
      .map((id) => moveById.get(id)!.identifier);

    if (moves.includes("acrobatics")) {
      return option.none;
    } else {
      return option.some(noItem(`No item`));
    }
  }
};
