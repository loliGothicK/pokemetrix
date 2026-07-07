import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { fetchBoxFromServer, saveToBox, updateBoxPokemon, deleteFromBox } from "@services/box";
import type { TrainedPokemon } from "@/store/team/team";

export const useBoxData = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const queryClient = useQueryClient();

  const boxQuery = useQuery({
    queryKey: ["box"],
    queryFn: fetchBoxFromServer,
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: saveToBox,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["box"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBoxPokemon,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["box"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFromBox,
    onSuccess: async (_, boxId) => {
      // 楽観的UI更新: キャッシュからも即座に除去
      queryClient.setQueryData<readonly TrainedPokemon[]>(["box"], (prev) =>
        prev ? prev.filter((p) => p.boxId !== boxId) : [],
      );
      // teams キャッシュも無効化（BOX削除でスロットが空になる可能性があるため）
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const saveToBoxFn = (pokemon: TrainedPokemon) => {
    saveMutation.mutate(pokemon);
  };

  const updateInBox = (pokemon: TrainedPokemon) => {
    updateMutation.mutate(pokemon);
  };

  const removeFromBox = (boxId: string) => {
    deleteMutation.mutate(boxId);
  };

  return {
    box: boxQuery.data ?? [],
    isLoading: isAuthenticated ? boxQuery.isLoading : false,
    isError: isAuthenticated ? boxQuery.isError : false,
    saveToBox: saveToBoxFn,
    updateInBox,
    removeFromBox,
  };
};
