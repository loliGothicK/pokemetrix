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
    enabled: isAuthenticated,
  });



  // 削除用Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeamFromServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const serverTeams = teamsQuery.data ?? [];

  // データソースの切り替え: サーバーデータにローカルデータをマージ（ローカル優先）
  const teams = isAuthenticated 
    ? [
        ...serverTeams.map((st) => localTeams.find((lt) => lt.id === st.id) ?? st),
        ...localTeams.filter((lt) => !serverTeams.some((st) => st.id === lt.id))
      ]
    : localTeams;

  // 更新ロジックの切り替え
  const updateTeams = (newTeams: readonly Team[]) => {
    if (!isAuthenticated) {
      setLocalTeams(newTeams);
      return;
    }

    // ログイン状態では、サーバーのデータと参照が同じ（変更されていない）ものは localTeams から除外する
    const unsavedTeams = newTeams.filter((nt) => {
      const st = serverTeams.find((s) => s.id === nt.id);
      // サーバーから取得したオブジェクトと参照が一致する場合は、ローカルに変更がないとみなす
      return st !== nt;
    });
    setLocalTeams(unsavedTeams);
  };

  // 削除ロジックの切り替え
  const removeTeam = (teamId: string) => {
    const newLocalTeams = localTeams.filter((t) => t.id !== teamId);
    setLocalTeams(newLocalTeams);

    if (isAuthenticated) {
      // 楽観的UI更新：サーバーキャッシュからも除去して即座に反映
      const currentServerTeams = queryClient.getQueryData<readonly Team[]>(["teams"]) ?? [];
      queryClient.setQueryData(["teams"], currentServerTeams.filter((t) => t.id !== teamId));
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
