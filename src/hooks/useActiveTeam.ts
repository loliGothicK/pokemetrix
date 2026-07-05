import { useAtom, useAtomValue } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, activeTeamIdAtom, Team, TrainedPokemon } from "@/store/team/team";
import { saveTeamsToServer } from "@services/teams";

export const useActiveTeam = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const activeId = useAtomValue(activeTeamIdAtom);
  const queryClient = useQueryClient();

  // ログイン時のソースはQueryキャッシュ、未ログイン時はlocalTeamsAtom
  const teams = isAuthenticated ? (queryClient.getQueryData<Team[]>(["teams"]) ?? []) : localTeams;

  // サーバー保存用のMutation
  const serverMutation = useMutation({
    mutationFn: saveTeamsToServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const team = teams.find(({ id }) => id === activeId);

  // 共通の更新ロジック（スロット更新）
  const updateSlot = (slotIndex: number, trained: TrainedPokemon | null) => {
    if (!activeId) return;

    if (isAuthenticated) {
      // ログイン時：TanStack Queryのキャッシュを更新し、サーバーへMutation
      const currentServerTeams = queryClient.getQueryData<Team[]>(["teams"]) ?? [];
      const newTeams = currentServerTeams.map((t) =>
        t.id === activeId
          ? { ...t, members: t.members.map((m, i) => (i === slotIndex ? trained : m)) }
          : t,
      );
      queryClient.setQueryData(["teams"], newTeams);
      serverMutation.mutate(newTeams);
    } else {
      // 未ログイン時：Jotai (localStorage) を更新
      setLocalTeams((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, members: t.members.map((m, i) => (i === slotIndex ? trained : m)) }
            : t,
        ),
      );
    }
  };

  const updateTeamName = (name: string) => {
    if (!activeId) return;

    if (isAuthenticated) {
      const currentServerTeams = queryClient.getQueryData<Team[]>(["teams"]) ?? [];
      const newTeams = currentServerTeams.map((t) => (t.id === activeId ? { ...t, name } : t));
      queryClient.setQueryData(["teams"], newTeams);
      serverMutation.mutate(newTeams);
    } else {
      setLocalTeams((prev) => prev.map((t) => (t.id === activeId ? { ...t, name } : t)));
    }
  };

  // スロットの並べ替え（DnD 用）
  const reorderMembers = (fromIndex: number, toIndex: number) => {
    if (!activeId || fromIndex === toIndex) return;

    const applyReorder = (members: (TrainedPokemon | null)[]) => {
      const next = [...members];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    };

    if (isAuthenticated) {
      const currentServerTeams = queryClient.getQueryData<Team[]>(["teams"]) ?? [];
      const newTeams = currentServerTeams.map((t) =>
        t.id === activeId ? { ...t, members: applyReorder(t.members) } : t,
      );
      queryClient.setQueryData(["teams"], newTeams);
      serverMutation.mutate(newTeams);
    } else {
      setLocalTeams((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, members: applyReorder(t.members) } : t,
        ),
      );
    }
  };

  return [team, updateSlot, updateTeamName, reorderMembers] as const;
};
