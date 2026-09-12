import { describe, expect, it } from "vitest";
import { optimizeSurvival, type SurvivalTuningContext } from "./survivalCalc";

describe("optimizeSurvival", () => {
  it("calculates minimum EVs for guaranteed survival (16/16 rolls) vs physical attack", async () => {
    // Defender: Garchomp (HP: 108, Def: 95, SpD: 85)
    // Attacker: Incineroar (Flare Blitz)
    const ctx: SurvivalTuningContext = {
      attacker: {
        identifier: "incineroar",
        move: "flare-blitz",
        ability: "blaze",
        item: null,
        boosts: {},
        evHp: 0,
        evAtk: 32, // max Champions Atk
        evDef: 0,
        evSpa: 0,
        evSpd: 0,
        evSpe: 0,
        hpPercent: 100,
        conditions: {},
        moveConditions: {},
        itemConditions: {},
        natures: { atk: 1.1 },
      },
      defenderBase: {
        identifier: "garchomp",
        nature: { plus: null, minus: null },
        baseStats: { hp: 108, def: 95, spd: 85 },
        ability: "rough-skin",
      },
      environment: {
        isDoubles: false,
      },
      availablePool: 64,
      options: {
        minSurvivingRolls: 16, // guaranteed survival
      },
    };

    const res = await optimizeSurvival(ctx);
    expect(res.achieved).toBe(true);
    expect(res.best).not.toBeNull();
    expect(res.best!.survivingRolls).toBe(16);
    expect(res.best!.hpStat).toBeGreaterThan(res.best!.maxDamage);
  });

  it("calculates minimum EVs for highest roll excluded (15/16 rolls) with fewer or equal EVs", async () => {
    // Attacker: Tyranitar (Stone Edge) vs Zapdos or similar
    const ctxGuaranteed: SurvivalTuningContext = {
      attacker: {
        identifier: "tyranitar",
        move: "stone-edge",
        ability: "sand-stream",
        item: "choice-band",
        boosts: {},
        evHp: 0,
        evAtk: 32,
        evDef: 0,
        evSpa: 0,
        evSpd: 0,
        evSpe: 0,
        hpPercent: 100,
        conditions: {},
        moveConditions: {},
        itemConditions: {},
        natures: { atk: 1.1 },
      },
      defenderBase: {
        identifier: "snorlax",
        nature: { plus: null, minus: null },
        baseStats: { hp: 160, def: 65, spd: 110 },
      },
      environment: {
        isDoubles: false,
      },
      availablePool: 64,
      options: {
        minSurvivingRolls: 16,
      },
    };

    const resGuaranteed = await optimizeSurvival(ctxGuaranteed);

    const ctx15Rolls: SurvivalTuningContext = {
      ...ctxGuaranteed,
      options: {
        minSurvivingRolls: 15,
      },
    };

    const res15Rolls = await optimizeSurvival(ctx15Rolls);

    if (resGuaranteed.achieved && res15Rolls.achieved) {
      expect(res15Rolls.best!.totalUsed).toBeLessThanOrEqual(resGuaranteed.best!.totalUsed);
      expect(res15Rolls.best!.survivingRolls).toBeGreaterThanOrEqual(15);
    }
  });

  it("respects existing HBD EVs as minimum constraints (minEvs)", async () => {
    const ctx: SurvivalTuningContext = {
      attacker: {
        identifier: "incineroar",
        move: "flare-blitz",
        ability: "blaze",
        item: null,
        boosts: {},
        evHp: 0,
        evAtk: 32,
        evDef: 0,
        evSpa: 0,
        evSpd: 0,
        evSpe: 0,
        hpPercent: 100,
        conditions: {},
        moveConditions: {},
        itemConditions: {},
        natures: { atk: 1.1 },
      },
      defenderBase: {
        identifier: "garchomp",
        nature: { plus: null, minus: null },
        baseStats: { hp: 108, def: 95, spd: 85 },
      },
      environment: {
        isDoubles: false,
      },
      availablePool: 64,
      options: {
        minSurvivingRolls: 16,
        minEvs: { hp: 10, def: 15, spd: 5 },
      },
    };

    const res = await optimizeSurvival(ctx);
    expect(res.achieved).toBe(true);
    expect(res.best!.evs.hp).toBeGreaterThanOrEqual(10);
    expect(res.best!.evs.def).toBeGreaterThanOrEqual(15);
    expect(res.best!.evs.spd).toBeGreaterThanOrEqual(5);
  });
});
