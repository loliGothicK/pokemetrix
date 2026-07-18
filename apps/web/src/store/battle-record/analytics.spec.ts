import { describe, it, expect } from "vitest";
import { tally, opponentStats, winRatePercent } from "./analytics";
import type { BattleRecord, BattleResult } from "./battleRecord";

let seq = 0;
const makeRecord = (
  result: BattleResult,
  opts: {
    readonly opponents?: readonly string[];
  } = {},
): BattleRecord => {
  seq += 1;
  return {
    id: `rec-${seq}`,
    seasonId: "season-1",
    teamId: null,
    result,
    myTeam: [],
    mySelection: null,
    rating: null,
    notes: null,
    playedAt: new Date(2026, 0, seq).toISOString(),
    opponents: (opts.opponents ?? []).map((pokemonSlug, slotIndex) => ({
      slotIndex,
      pokemonSlug,
      itemSlug: null,
      abilitySlug: null,
      moves: null,
      selectionRole: null,
      notes: null,
    })),
    createdAt: new Date(2026, 0, seq).toISOString(),
    updatedAt: new Date(2026, 0, seq).toISOString(),
  };
};

describe("tally", () => {
  it("returns an all-zero tally for no records", () => {
    expect(tally([])).toEqual({ total: 0, wins: 0, losses: 0, draws: 0, winRate: 0 });
  });

  it("counts wins, losses and draws", () => {
    const result = tally([
      makeRecord("win"),
      makeRecord("win"),
      makeRecord("loss"),
      makeRecord("draw"),
    ]);
    expect(result.total).toBe(4);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);
    expect(result.draws).toBe(1);
    expect(result.winRate).toBeCloseTo(0.5);
  });

  it("includes draws in the win-rate denominator", () => {
    const result = tally([makeRecord("win"), makeRecord("draw")]);
    expect(result.winRate).toBeCloseTo(0.5);
  });
});

describe("opponentStats", () => {
  it("aggregates per opponent species and sorts by battle count", () => {
    const stats = opponentStats([
      makeRecord("win", { opponents: ["miraidon", "flutter-mane"] }),
      makeRecord("loss", { opponents: ["miraidon", "urshifu"] }),
      makeRecord("win", { opponents: ["miraidon"] }),
    ]);

    expect(stats[0].pokemonSlug).toBe("miraidon");
    expect(stats[0].total).toBe(3);
    expect(stats[0].wins).toBe(2);
    expect(stats[0].losses).toBe(1);
    expect(stats[0].winRate).toBeCloseTo(2 / 3);
  });

  it("counts a species once per battle even if duplicated", () => {
    const stats = opponentStats([makeRecord("win", { opponents: ["ditto", "ditto"] })]);
    expect(stats).toHaveLength(1);
    expect(stats[0].total).toBe(1);
  });

  it("returns an empty array for no records", () => {
    expect(opponentStats([])).toEqual([]);
  });
});

describe("winRatePercent", () => {
  it("returns a rounded integer percentage", () => {
    expect(winRatePercent(tally([makeRecord("win"), makeRecord("win"), makeRecord("loss")]))).toBe(
      67,
    );
  });

  it("returns null when there are no battles", () => {
    expect(winRatePercent(tally([]))).toBeNull();
  });
});
