import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import {
  fetchDashboardsFromServer,
  createDashboardOnServer,
  updateDashboardOnServer,
  deleteDashboardFromServer,
} from "@services/dashboards";
import type { Dashboard, DashboardInput, DashboardUpdate } from "@/store/dashboard/dashboard";

export const DASHBOARDS_QUERY_KEY = ["dashboards"] as const;

export const useDashboards = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const queryClient = useQueryClient();

  const dashboardsQuery = useQuery({
    queryKey: DASHBOARDS_QUERY_KEY,
    queryFn: fetchDashboardsFromServer,
    enabled: isAuthenticated === true,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARDS_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: (input: DashboardInput) => createDashboardOnServer(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: DashboardUpdate }) =>
      updateDashboardOnServer(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDashboardFromServer(id),
    onSuccess: async (_, id) => {
      queryClient.setQueryData<readonly Dashboard[]>(DASHBOARDS_QUERY_KEY, (prev) =>
        prev ? prev.filter((d) => d.id !== id) : [],
      );
      await invalidate();
    },
  });

  return {
    dashboards: dashboardsQuery.data ?? [],
    isLoading: isAuthenticated ? dashboardsQuery.isLoading : false,
    isError: isAuthenticated ? dashboardsQuery.isError : false,
    createDashboard: (input: DashboardInput) => createMutation.mutateAsync(input),
    updateDashboard: (id: string, input: DashboardUpdate) =>
      updateMutation.mutateAsync({ id, input }),
    removeDashboard: (id: string) => deleteMutation.mutateAsync(id),
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};
