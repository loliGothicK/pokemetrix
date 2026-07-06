import { describe, it, expect } from "vitest";
import {
  seasonInputSchema,
  seasonUpdateSchema,
  battleRecordInputSchema,
  battleRecordUpdateSchema,
  opponentInputSchema,
} from "./battleRecord";

describe("seasonInputSchema", () => {
  it("accepts a minimal valid season", () => {
    const parsed = seasonInputSchema.safeParse({
      name: "レギュレーションH S24",
      format: "singles",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a full valid season", () => {
    const parsed = seasonInputSchema.safeParse({
      id: "01JABCDEF0123456789ABCDEFG",
      name: "doubles season",
      format: "doubles",
      ruleMark: "regulation-h",
      startedAt: "2026-01-01",
      endedAt: "2026-03-31",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid format", () => {
    const parsed = seasonInputSchema.safeParse({ name: "x", format: "triples" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const parsed = seasonInputSchema.safeParse({ name: "", format: "singles" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a name longer than 100 chars", () => {
    const parsed = seasonInputSchema.safeParse({ name: "a".repeat(101), format: "singles" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const parsed = seasonInputSchema.safeParse({
      name: "x",
      format: "singles",
      startedAt: "2026/01/01",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("seasonUpdateSchema", () => {
  it("accepts an empty partial update", () => {
    expect(seasonUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a single-field update", () => {
    expect(seasonUpdateSchema.safeParse({ name: "renamed" }).success).toBe(true);
  });

  it("still validates the provided field", () => {
    expect(seasonUpdateSchema.safeParse({ format: "invalid" }).success).toBe(false);
  });
});

describe("opponentInputSchema", () => {
  it("accepts a minimal opponent (slug only)", () => {
    const parsed = opponentInputSchema.safeParse({ slotIndex: 0, pokemonSlug: "miraidon" });
    expect(parsed.success).toBe(true);
  });

  it("rejects slotIndex out of range", () => {
    expect(opponentInputSchema.safeParse({ slotIndex: 6, pokemonSlug: "x" }).success).toBe(false);
  });

  it("rejects an invalid selectionRole", () => {
    const parsed = opponentInputSchema.safeParse({
      slotIndex: 0,
      pokemonSlug: "x",
      selectionRole: "middle",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("battleRecordInputSchema", () => {
  const base = {
    seasonId: "01JABCDEF0123456789ABCDEFG",
    result: "win" as const,
    myTeam: [{ boxId: "a" }, { boxId: "b" }],
    opponents: [
      { slotIndex: 0, pokemonSlug: "miraidon", selectionRole: "lead" as const },
      { slotIndex: 1, pokemonSlug: "flutter-mane", selectionRole: "back" as const },
    ],
  };

  it("accepts a valid record", () => {
    expect(battleRecordInputSchema.safeParse(base).success).toBe(true);
  });

  it("accepts an optional ISO playedAt", () => {
    const parsed = battleRecordInputSchema.safeParse({
      ...base,
      playedAt: "2026-07-07T10:00:00+09:00",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid result", () => {
    expect(battleRecordInputSchema.safeParse({ ...base, result: "victory" }).success).toBe(false);
  });

  it("rejects more than 6 team members", () => {
    const parsed = battleRecordInputSchema.safeParse({
      ...base,
      myTeam: Array.from({ length: 7 }, (_, i) => ({ boxId: String(i) })),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate opponent slotIndex", () => {
    const parsed = battleRecordInputSchema.safeParse({
      ...base,
      opponents: [
        { slotIndex: 0, pokemonSlug: "a" },
        { slotIndex: 0, pokemonSlug: "b" },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects mySelection index out of range", () => {
    expect(battleRecordInputSchema.safeParse({ ...base, mySelection: [0, 9] }).success).toBe(false);
  });
});

describe("battleRecordUpdateSchema", () => {
  it("accepts an empty partial update", () => {
    expect(battleRecordUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a result-only update", () => {
    expect(battleRecordUpdateSchema.safeParse({ result: "loss" }).success).toBe(true);
  });

  it("omits seasonId (immutable)", () => {
    const parsed = battleRecordUpdateSchema.parse({ seasonId: "should-be-stripped" });
    expect(parsed).not.toHaveProperty("seasonId");
  });
});
