import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { fetchTeamsFromServer, saveTeamsToServer, deleteTeamFromServer } from "@services/teams";
import { localTeamsAtom, Team } from "@/store/team/team";

export const useTeamsData = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const queryClient = useQueryClient();

  // 取得用Query：ログイン時のみ有効化
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeamsFromServer,
    enabled: isAuthenticated,
  });

  // 更新用Mutation：サーバー保存用
  const updateTeamsMutation = useMutation({
    mutationFn: saveTeamsToServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // 削除用Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeamFromServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // データソースの切り替え
  const teams = isAuthenticated ? (teamsQuery.data ?? []) : localTeams;

  // 更新ロジックの切り替え
  const updateTeams = (newTeams: Team[]) => {
    if (isAuthenticated) {
      // ログイン時：TanStack Queryのキャッシュを直接更新（楽観的UI更新）し、サーバーへMutation
      queryClient.setQueryData(["teams"], newTeams);
      updateTeamsMutation.mutate(newTeams);
    } else {
      // 未ログイン時：Jotai (localStorage) を更新
      setLocalTeams(newTeams);
    }
  };

  // 削除ロジックの切り替え
  const removeTeam = (teamId: string) => {
    const newTeams = teams.filter((t) => t.id !== teamId);
    if (isAuthenticated) {
      // 楽観的UI更新：先にキャッシュから除去してからサーバーへ
      queryClient.setQueryData(["teams"], newTeams);
      deleteTeamMutation.mutate(teamId);
    } else {
      // 未ログイン時：フィルタ済みのリストをそのままローカルストレージへ保存
      setLocalTeams(newTeams);
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
