import { useAtom, useAtomValue } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticatedAtom } from "@/store/auth";
import { localTeamsAtom, activeTeamIdAtom, Team, TrainedPokemon } from "@/store/team/team";

function TODO(_: Team[]) {
  return Promise.resolve(undefined);
}

export const useActiveTeam = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [teams, setLocalTeams] = useAtom(localTeamsAtom);
  const activeId = useAtomValue(activeTeamIdAtom);
  const queryClient = useQueryClient();

  // サーバー保存用のMutation
  const serverMutation = useMutation({
    mutationFn: (newTeams: Team[]) => TODO(newTeams),
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
      const currentServerTeams = queryClient.getQueryData<Team[]>(["teams"]) || [];
      const newTeams = currentServerTeams.map((team) =>
        team.id === activeId
          ? { ...team, members: team.members.map((m, i) => (i === slotIndex ? trained : m)) }
          : team,
      );

      // 楽観的UI更新（キャッシュを直接書き換え）
      queryClient.setQueryData(["teams"], newTeams);
      // サーバーへ永続化
      serverMutation.mutate(newTeams);
    } else {
      // 未ログイン時：Jotai (localStorage) を更新
      setLocalTeams((prev) =>
        prev.map((team) =>
          team.id === activeId
            ? { ...team, members: team.members.map((m, i) => (i === slotIndex ? trained : m)) }
            : team,
        ),
      );
    }
  };

  const updateTeamName = (name: string) => {
    if (!activeId) return;

    if (isAuthenticated) {
      // ログイン時：TanStack Queryのキャッシュを更新し、サーバーへMutation
      const currentServerTeams = queryClient.getQueryData<Team[]>(["teams"]) || [];
      const newTeams = currentServerTeams.map((team) =>
        team.id === activeId ? { ...team, name } : team,
      );

      // 楽観的UI更新（キャッシュを直接書き換え）
      queryClient.setQueryData(["teams"], newTeams);
      // サーバーへ永続化
      serverMutation.mutate(newTeams);
    } else {
      // 未ログイン時：Jotai (localStorage) を更新
      setLocalTeams((prev) =>
        prev.map((team) => (team.id === activeId ? { ...team, name } : team)),
      );
    }
  };

  return [team, updateSlot, updateTeamName] as const;
};
