import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { fetchTeams, saveTeam } from "@services/teams";
import { localTeamsAtom, Team } from "@/store/team/team";

export const useTeamsData = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [localTeams, setLocalTeams] = useAtom(localTeamsAtom);
  const queryClient = useQueryClient();

  // 取得用Query：ログイン時のみ有効化
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: async () => await fetchTeams(isAuthenticated),
    enabled: isAuthenticated, // 未ログイン時はリクエストを走らせない
  });

  // 更新用Mutation：サーバー保存用
  const updateTeamsMutation = useMutation({
    mutationFn: (newTeams: Team[]) => saveTeam(isAuthenticated, newTeams),
    onSuccess: async () => {
      // 必要に応じて最新データを再取得
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // データソースの切り替え
  const teams = isAuthenticated ? teamsQuery.data || [] : localTeams;

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

  return {
    teams,
    isLoading: isAuthenticated ? teamsQuery.isLoading : false,
    isError: isAuthenticated ? teamsQuery.isError : false,
    updateTeams,
  };
};
