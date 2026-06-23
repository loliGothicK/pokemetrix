import { TrainedPokemon } from "@/store/team/team";

import { option } from "fp-ts";

import { Option } from "fp-ts/Option";
import { remainingEvs, RemainingEvs } from "@/lib/linter/errors/LintError";
import { MAX_EV_TOTAL } from "@/store/team/lint";
import { match } from "ts-pattern";

export const checkRemainingEVs = (member: TrainedPokemon): Option<RemainingEvs> => {
  const remaining = MAX_EV_TOTAL - Object.values(member.evs).reduce((a, b) => a + b, 0 as number);

  return match(remaining)
    .with(0, () => option.none)
    .otherwise((remaining) =>
      option.some(remainingEvs(`${member.identifier} has ${remaining} remaining EVs.`)),
    );
};
