import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { fetchTeamsFromServer, deleteTeamFromServer } from "@services/teams";
import { localTeamsAtom, Team } from "@/store/team/team";

export const useTeamsData = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const queryClient = useQueryClient();

  // 取得用Query：ログイン時のみ有効化
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeamsFromServer,
    enabled: isAuthenticated === true,
    staleTime: 1000 * 60 * 5, // 5分キャッシュ保持
    gcTime: 1000 * 60 * 30, // 30分保持
  });

  // 削除用Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeamFromServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const serverTeams = teamsQuery.data ?? queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];

  // データソースの切り替え: ローカルデータをベースにし、サーバーデータにしか存在しないものを追加（ローカル完全優先）
  const teams = isAuthenticated
    ? [...localTeams, ...serverTeams.filter((st) => !localTeams.some((lt) => lt.id === st.id))]
    : localTeams;

  // 更新ロジック: 常に全チームをローカルストレージに即時反映し、クエリキャッシュも同期
  const updateTeams = (newTeams: readonly Team[]) => {
    setLocalTeams(newTeams);
    if (isAuthenticated) {
      queryClient.setQueryData(["teams"], newTeams);
    }
  };

  // 削除ロジック: ローカルストレージとクエリキャッシュの両方から即座に除去
  const removeTeam = (teamId: string) => {
    const newLocalTeams = localTeams.filter((t) => t.id !== teamId);
    setLocalTeams(newLocalTeams);

    if (isAuthenticated) {
      queryClient.setQueryData(["teams"], newLocalTeams);
      deleteTeamMutation.mutate(teamId);
    }
  };

  return {
    teams,
    isLoading: isAuthenticated ? teamsQuery.isLoading : false,
    isError: isAuthenticated ? teamsQuery.isError : false,
    updateTeams,
    removeTeam,
  };
};
