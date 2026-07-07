import { useQuery } from "@tanstack/react-query";
import { fetchBattleData } from "@services/battleData";

export const useBattleData = (slug: string, format: "Singles" | "Doubles") => {
  const teamsQuery = useQuery({
    queryKey: [`battleData/${format}/${slug}`],
    queryFn: async () => await fetchBattleData(slug, format),
  });

  return {
    battleData: teamsQuery.data,
    isLoading: teamsQuery.isLoading,
    isError: teamsQuery.isError,
  };
};
