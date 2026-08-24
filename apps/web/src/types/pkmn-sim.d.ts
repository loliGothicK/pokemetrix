import "@pkmn/sim";

declare module "@pkmn/sim" {
  export interface PRNG {
    seed: number[];
  }

  export interface Battle {}

  export interface Pokemon {
    volatiles: Record<string, unknown>;
    boosts: Record<string, number>;
    baseAbility: string;
    ability: string;
    item: string;
    types: string[];
    lastMove: import("@pkmn/sim").ActiveMove | import("@pkmn/sim").Move | null;
  }

  export interface ChoiceRequest {
    active?: {
      canMegaEvo?: boolean;
      moves: { id?: string; move?: string; disabled?: boolean; target?: string }[];
    }[];
    forceSwitch?: boolean[];
    noSwitch?: boolean[];
  }

  export interface MoveRequest {
    active?: {
      canMegaEvo?: boolean;
      moves: { id?: string; move?: string; disabled?: boolean; target?: string }[];
    }[];
    forceSwitch?: boolean[];
    noSwitch?: boolean[];
  }
}
