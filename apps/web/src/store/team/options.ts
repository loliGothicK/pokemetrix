import { atom } from "jotai";
import { activeTeamIdAtom } from "@/store/team/team";

export const lintAtom = atom<Record<string, boolean>>({});

export const activeTeamLintAtom = atom(
  (get) => {
    const activeTeamId = get(activeTeamIdAtom);

    if (!activeTeamId) {
      return false;
    }

    return get(lintAtom)[activeTeamId] || false;
  },
  (get, set, state: boolean) => {
    const activeTeamId = get(activeTeamIdAtom);
    if (!activeTeamId) {
      return;
    }

    set(lintAtom, (prev) => ({ ...prev, [activeTeamId]: state }));
  },
);
