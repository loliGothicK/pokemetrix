import type { Team, TrainedPokemon } from "@/store/team/team";

/**
 * 2体の TrainedPokemon が同値であるかを厳密に判定する。
 * オブジェクトのキー順序や、undefined と null の表現揺れを吸収して値ベースで比較する。
 */
export const isPokemonEqual = (
  a: TrainedPokemon | null | undefined,
  b: TrainedPokemon | null | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  if (
    a.boxId !== b.boxId ||
    a.identifier !== b.identifier ||
    a.slug !== b.slug ||
    (a.item ?? null) !== (b.item ?? null) ||
    a.ability !== b.ability
  ) {
    return false;
  }

  // gender
  if (a.gender.fixed !== b.gender.fixed) return false;
  if ((a.gender.specified ?? null) !== (b.gender.specified ?? null)) return false;

  // nature
  if (
    (a.nature.plus ?? null) !== (b.nature.plus ?? null) ||
    (a.nature.minus ?? null) !== (b.nature.minus ?? null)
  ) {
    return false;
  }

  // moves
  for (let i = 0; i < 4; i++) {
    if ((a.moves[i] ?? null) !== (b.moves[i] ?? null)) return false;
  }

  // evs
  if (
    a.evs.hp !== b.evs.hp ||
    a.evs.atk !== b.evs.atk ||
    a.evs.def !== b.evs.def ||
    a.evs.spa !== b.evs.spa ||
    a.evs.spd !== b.evs.spd ||
    a.evs.spe !== b.evs.spe
  ) {
    return false;
  }

  return true;
};

/**
 * 2つの Team が同値であるかを厳密に判定する。
 * JSON.stringify に頼らず、各スロットを isPokemonEqual で比較する。
 */
export const isTeamEqual = (a: Team | null | undefined, b: Team | null | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  if (a.id !== b.id || a.name !== b.name) return false;
  if (a.members.length !== b.members.length) return false;

  for (let i = 0; i < a.members.length; i++) {
    if (!isPokemonEqual(a.members[i], b.members[i])) {
      return false;
    }
  }

  return true;
};
