import { describe, expect, it } from "vitest";
import { optimizeBulk } from "./optimizeBulk";

describe("optimizeBulk", () => {
  it("Blissey (extreme HP, low Def/SpD) prefers B/D over H for balanced bulk", () => {
    // Blissey base stats: HP 255, Def 10, SpD 135
    const baseStats = { hp: 255, def: 10, spd: 135 };
    const nature = { plus: null, minus: null };
    const pool = 32; // limited pool

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.5 });

    // Since H is already massive (255+75 = 330), B is tiny (10+20 = 30).
    // Adding to B gives huge % increases in physical bulk, so B should get all 32 EVs, and H should be 0.
    expect(result.evs.def).toBe(32);
    expect(result.evs.hp).toBe(0);
  });

  it("Rotom / Shuckle (low HP, high Def/SpD) prioritizes H investment", () => {
    // Rotom-Wash base stats: HP 50, Def 107, SpD 107
    const baseStats = { hp: 50, def: 107, spd: 107 };
    const nature = { plus: null, minus: null };
    const pool = 64;

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.5 });

    // Rotom has low HP (50+75=125) compared to B+D (127+127=254).
    // H < B + D -> H should be maxed out to 32!
    expect(result.evs.hp).toBe(32);
    // Remaining 32 should be distributed between Def and SpD
    expect(result.evs.def + result.evs.spd).toBe(32);
    // B and D base are equal, so Def and SpD should be equally split
    expect(result.evs.def).toBe(16);
    expect(result.evs.spd).toBe(16);
  });

  it("Physical specialization (physicalRatio = 1.0) maximizes H * B", () => {
    const baseStats = { hp: 100, def: 100, spd: 100 };
    const nature = { plus: null, minus: null };
    const pool = 64;

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 1.0 });

    // Should invest 32 in H and 32 in Def, 0 in SpD
    expect(result.evs.hp).toBe(32);
    expect(result.evs.def).toBe(32);
    expect(result.evs.spd).toBe(0);
  });

  it("Special specialization (physicalRatio = 0.0) maximizes H * D", () => {
    const baseStats = { hp: 100, def: 100, spd: 100 };
    const nature = { plus: null, minus: null };
    const pool = 64;

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.0 });

    // Should invest 32 in H and 32 in SpD, 0 in Def
    expect(result.evs.hp).toBe(32);
    expect(result.evs.def).toBe(0);
    expect(result.evs.spd).toBe(32);
  });

  it("Respects small available EV pool and clamps to available pool", () => {
    const baseStats = { hp: 80, def: 80, spd: 80 };
    const nature = { plus: null, minus: null };
    const pool = 10;

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.5 });
    const totalUsed = result.evs.hp + result.evs.def + result.evs.spd;

    expect(totalUsed).toBeLessThanOrEqual(10);
    expect(result.evs.hp).toBeGreaterThanOrEqual(0);
    expect(result.evs.def).toBeGreaterThanOrEqual(0);
    expect(result.evs.spd).toBeGreaterThanOrEqual(0);
  });

  it("Accounts for nature multipliers (+Def, -SpD etc.)", () => {
    const baseStats = { hp: 80, def: 80, spd: 80 };
    const nature = { plus: "def", minus: "spa" }; // Bold nature (+Def)
    const pool = 64;

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.5 });

    expect(result.evs.hp).toBe(32);
    // B has 1.1x multiplier, so raw stats differ slightly, optimizing accordingly
    expect(result.evs.def + result.evs.spd).toBe(32);
  });

  it("Respects already allocated HBD EVs as minimum constraints", () => {
    const baseStats = { hp: 80, def: 80, spd: 80 };
    const nature = { plus: null, minus: null };
    // Already allocated 20 in def, 10 in spd, 0 in hp. Pool is 20+10+14 = 44
    const pool = 44;
    const minEvs = { hp: 0, def: 20, spd: 10 };

    const result = optimizeBulk(baseStats, nature, pool, { physicalRatio: 0.5, minEvs });

    // Must not reduce existing allocations
    expect(result.evs.def).toBeGreaterThanOrEqual(20);
    expect(result.evs.spd).toBeGreaterThanOrEqual(10);
    expect(result.evs.hp).toBeGreaterThanOrEqual(0);
    expect(result.evs.hp + result.evs.def + result.evs.spd).toBeLessThanOrEqual(44);
  });
});
