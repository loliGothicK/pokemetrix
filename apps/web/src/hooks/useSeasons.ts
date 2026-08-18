import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import {
  fetchSeasonsFromServer,
  createSeasonOnServer,
  updateSeasonOnServer,
  deleteSeasonFromServer,
} from "@services/seasons";
import type { Season, SeasonInput, SeasonUpdate } from "@/store/battle-record/battleRecord";

export const SEASONS_QUERY_KEY = ["seasons"] as const;

export const useSeasons = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const queryClient = useQueryClient();

  const seasonsQuery = useQuery({
    queryKey: SEASONS_QUERY_KEY,
    queryFn: fetchSeasonsFromServer,
    enabled: isAuthenticated === true,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: SEASONS_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: (input: SeasonInput) => createSeasonOnServer(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: SeasonUpdate }) =>
      updateSeasonOnServer(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSeasonFromServer(id),
    onSuccess: async (_, id) => {
      queryClient.setQueryData<readonly Season[]>(SEASONS_QUERY_KEY, (prev) =>
        prev ? prev.filter((s) => s.id !== id) : [],
      );
      await queryClient.invalidateQueries({ queryKey: ["battle-records"] });
    },
  });

  return {
    seasons: seasonsQuery.data ?? [],
    isLoading: isAuthenticated ? seasonsQuery.isLoading : false,
    isError: isAuthenticated ? seasonsQuery.isError : false,
    createSeason: (input: SeasonInput) => createMutation.mutateAsync(input),
    updateSeason: (id: string, input: SeasonUpdate) => updateMutation.mutateAsync({ id, input }),
    removeSeason: (id: string) => deleteMutation.mutateAsync(id),
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};
