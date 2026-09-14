import { useState, useCallback, useMemo } from "react";
import { type DashboardVariable, VARIABLE_LATEST_SEASON } from "@/store/dashboard/dashboard";
import { type Season, getLatestSeason } from "@/store/battle-record/battleRecord";

export interface VariableValues {
  /** variableId → 現在選択中の seasonId（null = 全シーズン） */
  readonly values: Readonly<Record<string, string | null>>;
  readonly setVariableValue: (variableId: string, seasonId: string | null) => void;
}

/**
 * ダッシュボード変数の現在値を管理する hook。
 * 初期値は各 Variable の `defaultSeasonId`。
 * `defaultSeasonId === "__latest__"` の場合は最新シーズンの ID が初期値となる。
 * ユーザーが VariableBar でシーズンを切り替えると上書きされる。
 */
export function useVariableValues(
  variables: readonly DashboardVariable[],
  seasons: readonly Season[] = [],
): VariableValues {
  const [overrides, setOverrides] = useState<Readonly<Record<string, string | null>>>({});

  const latestSeasonId = useMemo(() => getLatestSeason(seasons)?.id ?? null, [seasons]);

  const values = useMemo(() => {
    return Object.fromEntries(
      variables.map((v) => {
        if (overrides[v.id] !== undefined) {
          return [v.id, overrides[v.id]];
        }
        if (v.defaultSeasonId === VARIABLE_LATEST_SEASON) {
          return [v.id, latestSeasonId];
        }
        return [v.id, v.defaultSeasonId];
      }),
    ) as Readonly<Record<string, string | null>>;
  }, [variables, overrides, latestSeasonId]);

  const setVariableValue = useCallback((variableId: string, seasonId: string | null) => {
    setOverrides((prev) => ({ ...prev, [variableId]: seasonId }));
  }, []);

  return { values, setVariableValue };
}
