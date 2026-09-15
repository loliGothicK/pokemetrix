import { describe, it, expect } from "vitest";
import { validateInsertBattleRecord } from "./validators";
import { isRight, isLeft } from "fp-ts/Either";

describe("insertBattleRecordSchema & validateInsertBattleRecord", () => {
  const baseData = {
    id: "01JABCDEF0123456789ABCDEFG",
    userId: "11111111-1111-1111-1111-111111111111",
    seasonId: "01JSEASON0123456789ABCDEFG",
    teamId: "01JTEAM00123456789ABCDEFG",
    result: "win" as const,
    myTeam: [{ boxId: "01JBOX1" }],
    mySelection: [0],
    rating: 1600.5,
    tags: ["tailwind", "trick-room"],
    notes: "Good game",
    playedAt: new Date("2026-09-15T00:00:00Z"),
  };

  it("validates and preserves tags correctly", () => {
    const result = validateInsertBattleRecord(baseData);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.tags).toEqual(["tailwind", "trick-room"]);
      expect(result.right.teamId).toBe("01JTEAM00123456789ABCDEFG");
      expect(result.right.seasonId).toBe("01JSEASON0123456789ABCDEFG");
      expect(result.right.rating).toBe(1600.5);
    }
  });

  it("allows null teamId and nullish tags", () => {
    const withoutTeamAndTags = {
      ...baseData,
      teamId: null,
      tags: null,
    };
    const result = validateInsertBattleRecord(withoutTeamAndTags);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.teamId).toBeNull();
      expect(result.right.tags).toBeNull();
    }
  });

  it("rejects invalid result enum", () => {
    const invalidResult = {
      ...baseData,
      result: "drawish",
    };
    const result = validateInsertBattleRecord(invalidResult);
    expect(isLeft(result)).toBe(true);
  });

  it("rejects empty seasonId", () => {
    const invalidSeason = {
      ...baseData,
      seasonId: "",
    };
    const result = validateInsertBattleRecord(invalidSeason);
    expect(isLeft(result)).toBe(true);
  });
});
