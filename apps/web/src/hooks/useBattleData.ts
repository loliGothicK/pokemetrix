import { useQuery } from "@tanstack/react-query";
import { fetchBattleData } from "@services/battleData";

export const useBattleData = (slug: string, format: "Singles" | "Doubles") => {
  const teamsQuery = useQuery({
    queryKey: [`battleData/${format}/${slug}`],
    queryFn: async () => await fetchBattleData(slug, format),
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ保持
    gcTime: 1000 * 60 * 120, // 2時間GC維持
  });

  return {
    battleData: teamsQuery.data,
    isLoading: teamsQuery.isLoading,
    isError: teamsQuery.isError,
  };
};
