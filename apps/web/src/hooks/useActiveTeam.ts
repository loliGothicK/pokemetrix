import { useAtom, useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, activeTeamIdAtom, Team, TrainedPokemon } from "@/store/team/team";

export const useActiveTeam = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const activeId = useAtomValue(activeTeamIdAtom);
  const queryClient = useQueryClient();

  const serverTeams = queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];
  const teams = isAuthenticated
    ? [
        ...serverTeams.map((st) => localTeams.find((lt) => lt.id === st.id) ?? st),
        ...localTeams.filter((lt) => !serverTeams.some((st) => st.id === lt.id))
      ]
    : localTeams;



  const team = teams.find(({ id }) => id === activeId);

  const applyLocalUpdate = (updater: (team: Team) => Team) => {
    if (!activeId) return;
    setLocalTeams((prev) => {
      const existingLocal = prev.find((t) => t.id === activeId);
      if (existingLocal) {
        return prev.map((t) => (t.id === activeId ? updater(t) : t));
      } else {
        const serverTeam = teams.find((t) => t.id === activeId);
        if (!serverTeam) return prev;
        return [...prev, updater(serverTeam)];
      }
    });
  };

  // 共通の更新ロジック（スロット更新）
  const updateSlot = (slotIndex: number, trained: TrainedPokemon | null) => {
    applyLocalUpdate((t) => ({
      ...t,
      members: t.members.map((m, i) => (i === slotIndex ? trained : m)),
    }));
  };

  const updateTeamName = (name: string) => {
    applyLocalUpdate((t) => ({ ...t, name }));
  };

  // スロットの並べ替え（DnD 用）
  const reorderMembers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    applyLocalUpdate((t) => {
      const next = [...t.members];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...t, members: next };
    });
  };

  return [team, updateSlot, updateTeamName, reorderMembers] as const;
};
