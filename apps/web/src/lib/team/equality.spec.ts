import { describe, it, expect } from "vitest";
import { isPokemonEqual, isTeamEqual } from "./equality";
import type { Team, TrainedPokemon } from "@/store/team/team";

const createSamplePokemon = (): TrainedPokemon => ({
  boxId: "01HXYZ00000000000000000001",
  identifier: "pikachu",
  slug: "pikachu",
  item: 1,
  ability: 10,
  gender: {
    fixed: false,
    specified: "male",
  },
  nature: {
    plus: "spe",
    minus: "atk",
  },
  moves: [1, 2, 3, 4],
  evs: {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 32,
    spd: 0,
    spe: 32,
  },
});

const createSampleTeam = (): Team => ({
  id: "team-1",
  name: "Sample Team",
  members: [createSamplePokemon(), null, null, null, null, null],
});

describe("isPokemonEqual", () => {
  it("returns true for identical pokemon references or values", () => {
    const p1 = createSamplePokemon();
    const p2 = createSamplePokemon();
    expect(isPokemonEqual(p1, p2)).toBe(true);
    expect(isPokemonEqual(p1, p1)).toBe(true);
    expect(isPokemonEqual(null, null)).toBe(true);
  });

  it("returns false if one is null and one is not", () => {
    const p = createSamplePokemon();
    expect(isPokemonEqual(p, null)).toBe(false);
    expect(isPokemonEqual(null, p)).toBe(false);
  });

  it("returns true even when object keys have different ordering", () => {
    const p1 = createSamplePokemon();
    // Reorder properties manually
    const p2 = {
      evs: { ...p1.evs },
      moves: [...p1.moves] as [number, number, number, number],
      gender: { ...p1.gender },
      nature: { ...p1.nature },
      ability: p1.ability,
      item: p1.item,
      slug: p1.slug,
      identifier: p1.identifier,
      boxId: p1.boxId,
    } as TrainedPokemon;

    // JSON.stringify would fail here
    expect(JSON.stringify(p1)).not.toBe(JSON.stringify(p2));
    // But isPokemonEqual succeeds
    expect(isPokemonEqual(p1, p2)).toBe(true);
  });

  it("handles null vs undefined equivalence for optional properties", () => {
    const p1: TrainedPokemon = {
      ...createSamplePokemon(),
      item: null,
      gender: { fixed: true, specified: undefined },
      nature: { plus: null, minus: undefined },
    };
    const p2: TrainedPokemon = {
      ...createSamplePokemon(),
      item: null,
      gender: { fixed: true },
      nature: { plus: undefined, minus: null },
    };

    expect(isPokemonEqual(p1, p2)).toBe(true);
  });

  it("detects changes in EVs", () => {
    const p1 = createSamplePokemon();
    const p2: TrainedPokemon = {
      ...p1,
      evs: { ...p1.evs, spe: 30 },
    };
    expect(isPokemonEqual(p1, p2)).toBe(false);
  });

  it("detects changes in moves", () => {
    const p1 = createSamplePokemon();
    const p2: TrainedPokemon = {
      ...p1,
      moves: [1, 2, 3, 99],
    };
    expect(isPokemonEqual(p1, p2)).toBe(false);
  });

  it("detects changes in nature", () => {
    const p1 = createSamplePokemon();
    const p2: TrainedPokemon = {
      ...p1,
      nature: { plus: "atk", minus: "spa" },
    };
    expect(isPokemonEqual(p1, p2)).toBe(false);
  });

  it("detects changes in item", () => {
    const p1 = createSamplePokemon();
    const p2: TrainedPokemon = {
      ...p1,
      item: 2,
    };
    expect(isPokemonEqual(p1, p2)).toBe(false);
  });
});

describe("isTeamEqual", () => {
  it("returns true for identical teams", () => {
    const t1 = createSampleTeam();
    const t2 = createSampleTeam();
    expect(isTeamEqual(t1, t2)).toBe(true);
    expect(isTeamEqual(null, null)).toBe(true);
  });

  it("returns false if name or id differs", () => {
    const t1 = createSampleTeam();
    const t2: Team = { ...t1, name: "Other Name" };
    const t3: Team = { ...t1, id: "team-2" };
    expect(isTeamEqual(t1, t2)).toBe(false);
    expect(isTeamEqual(t1, t3)).toBe(false);
  });

  it("returns false if any member slot differs", () => {
    const t1 = createSampleTeam();
    const t2: Team = {
      ...t1,
      members: [t1.members[0], createSamplePokemon(), null, null, null, null],
    };
    expect(isTeamEqual(t1, t2)).toBe(false);
  });
});
