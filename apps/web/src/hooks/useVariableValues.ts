"use client";

import { useState, useCallback } from "react";
import type { DashboardVariable } from "@/store/dashboard/dashboard";

export interface VariableValues {
  /** variableId → 現在選択中の seasonId（null = 全シーズン） */
  readonly values: Readonly<Record<string, string | null>>;
  readonly setVariableValue: (variableId: string, seasonId: string | null) => void;
}

/**
 * ダッシュボード変数の現在値を管理する hook。
 * 初期値は各 Variable の `defaultSeasonId`。
 * ユーザーが VariableBar でシーズンを切り替えると上書きされる。
 */
export function useVariableValues(variables: readonly DashboardVariable[]): VariableValues {
  const [overrides, setOverrides] = useState<Readonly<Record<string, string | null>>>({});

  const values = Object.fromEntries(
    variables.map((v) => [
      v.id,
      overrides[v.id] !== undefined ? overrides[v.id] : v.defaultSeasonId,
    ]),
  ) as Readonly<Record<string, string | null>>;

  const setVariableValue = useCallback((variableId: string, seasonId: string | null) => {
    setOverrides((prev) => ({ ...prev, [variableId]: seasonId }));
  }, []);

  return { values, setVariableValue };
}
