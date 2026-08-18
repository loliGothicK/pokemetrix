import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import {
  fetchBattleRecordsFromServer,
  createBattleRecordOnServer,
  updateBattleRecordOnServer,
  deleteBattleRecordFromServer,
} from "@services/battleRecords";
import type {
  BattleRecord,
  BattleRecordInput,
  BattleRecordUpdate,
} from "@/store/battle-record/battleRecord";

export interface BattleRecordsFilter {
  readonly seasonId?: string | null;
  readonly teamId?: string | null;
}

export const battleRecordsQueryKey = (filter: BattleRecordsFilter) =>
  [
    "battle-records",
    filter.seasonId === undefined ? "all" : (filter.seasonId ?? "disabled"),
    filter.teamId ?? "all",
  ] as const;

/**
 * 指定シーズン（および任意でチーム）の対戦記録を取得・操作する。
 * seasonId が null のときはクエリを無効化し、空配列を返す。
 */
export const useBattleRecords = (filter: BattleRecordsFilter) => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const queryClient = useQueryClient();
  const enabled = isAuthenticated === true && filter.seasonId !== null;

  const recordsQuery = useQuery({
    queryKey: battleRecordsQueryKey(filter),
    queryFn: () =>
      fetchBattleRecordsFromServer({
        seasonId: filter.seasonId ?? undefined,
        teamId: filter.teamId ?? undefined,
      }),
    enabled,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["battle-records"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: BattleRecordInput) => createBattleRecordOnServer(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: BattleRecordUpdate }) =>
      updateBattleRecordOnServer(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBattleRecordFromServer(id),
    onSuccess: async (_, id) => {
      queryClient.setQueryData<readonly BattleRecord[]>(battleRecordsQueryKey(filter), (prev) =>
        prev ? prev.filter((r) => r.id !== id) : [],
      );
      await invalidate();
    },
  });

  return {
    records: recordsQuery.data ?? [],
    isLoading: enabled ? recordsQuery.isLoading : false,
    isError: enabled ? recordsQuery.isError : false,
    createRecord: (input: BattleRecordInput) => createMutation.mutateAsync(input),
    updateRecord: (id: string, input: BattleRecordUpdate) =>
      updateMutation.mutateAsync({ id, input }),
    removeRecord: (id: string) => deleteMutation.mutateAsync(id),
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};
