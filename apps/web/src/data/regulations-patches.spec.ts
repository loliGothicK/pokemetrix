import { describe, it, expect } from "vitest";
import { getPokemonMoves, isMoveAllowedForPokemon, isPokemonAllowedInRegulation } from "@pokemetrix/data";
import { getChampionsPokemonById, getChampionsPokemonByIdentifier } from "./champions-pokemon";

describe("Regulation M-C Move Patches", () => {
  it("should verify Archaludon moves in M-A, M-B vs M-C", () => {
    // Archaludon: ID 1018, Mirror Coat: 243, Metal Burst: 368
    expect(isMoveAllowedForPokemon(1018, 243, "M-A")).toBe(true);
    expect(isMoveAllowedForPokemon(1018, 368, "M-A")).toBe(true);

    expect(isMoveAllowedForPokemon(1018, 243, "M-B")).toBe(true);
    expect(isMoveAllowedForPokemon(1018, 368, "M-B")).toBe(true);

    expect(isMoveAllowedForPokemon(1018, 243, "M-C")).toBe(false);
    expect(isMoveAllowedForPokemon(1018, 368, "M-C")).toBe(false);

    // Archaludon should still have other moves like Flash Cannon (430)
    expect(isMoveAllowedForPokemon(1018, 430, "M-C")).toBe(true);

    const mcMoves = getPokemonMoves("archaludon", "M-C");
    expect(mcMoves).not.toContain(243);
    expect(mcMoves).not.toContain(368);
  });

  it("should verify Politoed moves in M-A, M-B vs M-C", () => {
    // Politoed: ID 186, Pound: 1
    expect(isMoveAllowedForPokemon(186, 1, "M-A")).toBe(true);
    expect(isMoveAllowedForPokemon(186, 1, "M-B")).toBe(true);
    expect(isMoveAllowedForPokemon(186, 1, "M-C")).toBe(false);

    const mcMoves = getPokemonMoves("politoed", "M-C");
    expect(mcMoves).not.toContain(1);
  });

  it("should reflect patches in getChampionsPokemonById and Identifier", () => {
    const byIdMC = getChampionsPokemonById("M-C");
    const archaludonMC = byIdMC.get(1018);
    expect(archaludonMC).toBeDefined();
    expect(archaludonMC?.moves).not.toContain(243);
    expect(archaludonMC?.moves).not.toContain(368);

    const politoedMC = byIdMC.get(186);
    expect(politoedMC).toBeDefined();
    expect(politoedMC?.moves).not.toContain(1);

    const byIdMB = getChampionsPokemonById("M-B");
    expect(byIdMB.get(1018)?.moves).toContain(243);
    expect(byIdMB.get(186)?.moves).toContain(1);

    const byIdentMC = getChampionsPokemonByIdentifier("M-C");
    expect(byIdentMC.get("archaludon")?.moves).not.toContain(243);
  });

  it("should check pokemon legality across regulations", () => {
    // Archaludon (1018) is legal in all
    expect(isPokemonAllowedInRegulation(1018, "M-A")).toBe(true);
    expect(isPokemonAllowedInRegulation(1018, "M-B")).toBe(true);
    expect(isPokemonAllowedInRegulation(1018, "M-C")).toBe(true);

    // Metagross (376) is legal in M-B and M-C, but not M-A
    expect(isPokemonAllowedInRegulation(376, "M-A")).toBe(false);
    expect(isPokemonAllowedInRegulation(376, "M-B")).toBe(true);
    expect(isPokemonAllowedInRegulation(376, "M-C")).toBe(true);
  });

  it("should verify inherit fields are properly resolved for mega and alternate forms", () => {
    // Venusaur Mega (10033) inherits types and moves from Venusaur (3)
    const byId = getChampionsPokemonById();
    const venusaur = byId.get(3)!;
    const venusaurMega = byId.get(10033)!;

    expect(venusaurMega).toBeDefined();
    expect(venusaurMega.species_id).toBe(3);
    expect(venusaurMega.types).toEqual(venusaur.types);
    expect(venusaurMega.moves).toEqual(venusaur.moves);
    // Abilities should NOT be inherited since Mega Venusaur has Thick Fat [47]
    expect(venusaurMega.abilities).toEqual([47]);
  });
});
