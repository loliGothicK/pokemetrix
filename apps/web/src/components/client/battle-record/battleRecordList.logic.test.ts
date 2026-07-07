import { describe, it, expect } from "vitest";
import { resolveMyTeamDisplay, resolveOpponentDisplay } from "./battleRecordList.logic";
import type { BattleRecord } from "@/store/battle-record/battleRecord";

// ────────────────────────────────────────────────────────────────────
// テストフィクスチャ
// ────────────────────────────────────────────────────────────────────

const makeMyTeam = (identifiers: string[]): BattleRecord["myTeam"] =>
  identifiers.map((identifier, i) => ({
    identifier,
    slotIndex: i,
    // BattleRecord["myTeam"] は TrainedPokemon[] だが、テスト対象のロジックは
    // identifier のみを参照するため、最小限のキャストで済ませる
  })) as unknown as BattleRecord["myTeam"];

const makeOpponents = (
  entries: { slug: string; slotIndex: number; role: "lead" | "back" | null }[],
): BattleRecord["opponents"] =>
  entries.map(({ slug, slotIndex, role }) => ({
    slotIndex,
    pokemonSlug: slug,
    itemSlug: null,
    abilitySlug: null,
    moves: null,
    selectionRole: role,
    notes: null,
  }));

// ────────────────────────────────────────────────────────────────────
// resolveMyTeamDisplay
// ────────────────────────────────────────────────────────────────────

describe("resolveMyTeamDisplay", () => {
  it("mySelection が null の場合は全員のスラグを返し selectedIndices は null", () => {
    const result = resolveMyTeamDisplay({
      myTeam: makeMyTeam(["bulbasaur", "charmander", "squirtle"]),
      mySelection: null,
    });
    expect(result.slugs).toEqual(["bulbasaur", "charmander", "squirtle"]);
    expect(result.selectedIndices).toBeNull();
  });

  it("mySelection が空配列の場合は全員選出扱い（selectedIndices は null）", () => {
    const result = resolveMyTeamDisplay({
      myTeam: makeMyTeam(["bulbasaur", "charmander", "squirtle"]),
      mySelection: [],
    });
    expect(result.selectedIndices).toBeNull();
  });

  it("mySelection に値がある場合は対応するインデックスのセットを返す", () => {
    const result = resolveMyTeamDisplay({
      myTeam: makeMyTeam(["bulbasaur", "charmander", "squirtle", "pikachu", "gengar", "snorlax"]),
      mySelection: [0, 2, 4],
    });
    expect(result.slugs).toHaveLength(6);
    expect(result.selectedIndices).toEqual(new Set([0, 2, 4]));
  });

  it("選出外のインデックスは selectedIndices に含まれない", () => {
    const result = resolveMyTeamDisplay({
      myTeam: makeMyTeam(["bulbasaur", "charmander", "squirtle"]),
      mySelection: [1],
    });
    expect(result.selectedIndices!.has(0)).toBe(false);
    expect(result.selectedIndices!.has(1)).toBe(true);
    expect(result.selectedIndices!.has(2)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────
// resolveOpponentDisplay
// ────────────────────────────────────────────────────────────────────

describe("resolveOpponentDisplay", () => {
  it("全員 selectionRole null の場合は selectedIndices は null（全員選出扱い）", () => {
    const result = resolveOpponentDisplay({
      opponents: makeOpponents([
        { slug: "gengar", slotIndex: 0, role: null },
        { slug: "alakazam", slotIndex: 1, role: null },
      ]),
    });
    expect(result.slugs).toEqual(["gengar", "alakazam"]);
    expect(result.selectedIndices).toBeNull();
  });

  it("selectionRole がある場合はそのインデックスだけ selectedIndices に入る", () => {
    const result = resolveOpponentDisplay({
      opponents: makeOpponents([
        { slug: "gengar", slotIndex: 0, role: "lead" },
        { slug: "alakazam", slotIndex: 1, role: null },
        { slug: "machamp", slotIndex: 2, role: "back" },
      ]),
    });
    expect(result.slugs).toEqual(["gengar", "alakazam", "machamp"]);
    expect(result.selectedIndices).toEqual(new Set([0, 2]));
  });

  it("slotIndex 順にソートされて返る", () => {
    const result = resolveOpponentDisplay({
      opponents: makeOpponents([
        { slug: "machamp", slotIndex: 2, role: null },
        { slug: "gengar", slotIndex: 0, role: null },
        { slug: "alakazam", slotIndex: 1, role: null },
      ]),
    });
    expect(result.slugs).toEqual(["gengar", "alakazam", "machamp"]);
  });

  it("opponents が空の場合は空配列と null を返す", () => {
    const result = resolveOpponentDisplay({ opponents: [] });
    expect(result.slugs).toEqual([]);
    expect(result.selectedIndices).toBeNull();
  });
});
