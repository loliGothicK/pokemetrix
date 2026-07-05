import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Gender, EV } from "@/types/pokemon";
import { Lens } from "monocle-ts";

export interface TrainedPokemon {
  boxId: string; // box_pokemon.id (ULID) — individual instance identifier
  identifier: string;
  slug: string;
  item: number | null;
  ability: number;
  gender: {
    fixed: boolean;
    specified?: Gender;
  };
  nature: {
    plus?: "hp" | "atk" | "def" | "spa" | "spd" | "spe" | null;
    minus?: "hp" | "atk" | "def" | "spa" | "spd" | "spe" | null;
  };
  moves: [number | null, number | null, number | null, number | null];
  evs: {
    hp: EV;
    atk: EV;
    def: EV;
    spa: EV;
    spd: EV;
    spe: EV;
  };
}

// 1. まず、TrainedPokemon から `evs` プロパティへフォーカスするLensを作る
const evsLens = Lens.fromProp<TrainedPokemon>()("evs");

// 2. ループ内で動的に適用するためのLensファクトリ（関数）を作る
export const getStatLens = (stat: keyof TrainedPokemon["evs"]) =>
  evsLens.compose(Lens.fromProp<TrainedPokemon["evs"]>()(stat));

// --- 型定義 ---
export interface Team {
  id: string;
  name: string;
  members: (TrainedPokemon | null)[];
}

export const activeSlotIndexAtom = atom(0);

// =====================================================================
// 未ログイン時のオフラインデータ（localStorageに永続化）
// ログイン時は TanStack Query の ["teams"] キャッシュがデータソースになる
// =====================================================================
export const localTeamsAtom = atomWithStorage<Team[]>("pokemon_teams_v2", []);

// =====================================================================
// 【一生残るAtom（純粋なクライアント状態）】
// ユーザーが「今どのチームを見ているか」はUIの状態であり、DBには保存しない。
// したがって、これは将来も Jotai が担当し続ける。
// =====================================================================
export const activeTeamIdAtom = atom<string | null>(null);
