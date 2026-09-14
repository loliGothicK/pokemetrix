import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVariableValues } from "@/hooks/useVariableValues";
import { VARIABLE_LATEST_SEASON, type DashboardVariable } from "@/store/dashboard/dashboard";
import type { Season } from "@/store/battle-record/battleRecord";

describe("useVariableValues", () => {
  const mockSeasons: Season[] = [
    {
      id: "s1",
      name: "Season 1",
      format: "doubles",
      ruleMark: null,
      startedAt: "2026-01-01T00:00:00Z",
      endedAt: "2026-01-31T23:59:59Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "s2",
      name: "Season 2",
      format: "doubles",
      ruleMark: null,
      startedAt: "2026-02-01T00:00:00Z",
      endedAt: null,
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
    },
  ];

  it("resolves latest season ID when defaultSeasonId is VARIABLE_LATEST_SEASON", () => {
    const variables: DashboardVariable[] = [
      {
        id: "var-1",
        name: "season",
        label: "シーズン",
        type: "season",
        defaultSeasonId: VARIABLE_LATEST_SEASON,
      },
      {
        id: "var-2",
        name: "fixed_season",
        label: "固定シーズン",
        type: "season",
        defaultSeasonId: "s1",
      },
      {
        id: "var-3",
        name: "all_seasons",
        label: "全シーズン",
        type: "season",
        defaultSeasonId: null,
      },
    ];

    const { result } = renderHook(() => useVariableValues(variables, mockSeasons));

    expect(result.current.values).toEqual({
      "var-1": "s2", // latest season
      "var-2": "s1",
      "var-3": null,
    });
  });

  it("allows overriding variable value dynamically", () => {
    const variables: DashboardVariable[] = [
      {
        id: "var-1",
        name: "season",
        label: "シーズン",
        type: "season",
        defaultSeasonId: VARIABLE_LATEST_SEASON,
      },
    ];

    const { result } = renderHook(() => useVariableValues(variables, mockSeasons));

    expect(result.current.values["var-1"]).toBe("s2");

    act(() => {
      result.current.setVariableValue("var-1", "s1");
    });

    expect(result.current.values["var-1"]).toBe("s1");

    act(() => {
      result.current.setVariableValue("var-1", null);
    });

    expect(result.current.values["var-1"]).toBeNull();
  });
});
