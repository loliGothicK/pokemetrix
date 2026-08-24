import { describe, expect, it } from "vitest";
import { run_turn, FullBattleState } from "../pkg-node";

function createEnginePokemon(
  opts: Partial<{
    ident: string;
    hp: number;
    maxhp: number;
    speed: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    type1: string;
    type2: string;
    item: string;
    ability: string;
    status: string;
    added_type: string;
  }>,
) {
  return {
    ident: opts.ident || "p1a",
    hp: opts.hp || 100,
    maxhp: opts.maxhp || 100,
    speed: opts.speed || 100,
    attack: opts.attack || 100,
    defense: opts.defense || 100,
    sp_attack: opts.sp_attack || 100,
    sp_defense: opts.sp_defense || 100,
    item: opts.item || "",
    ability: opts.ability || "none",
    status: opts.status || "",
    type1: opts.type1 || "Normal",
    type2: opts.type2 || "",
    ...opts,
  };
}

describe("Switch-In Abilities (Intimidate, Competitive, Defiant)", () => {
  it("Intimidate lowers opponent attack by 1 stage, and Competitive/Defiant react", () => {
    // p1a has Intimidate. It switches in (or starts the battle) and should trigger its ability.

    // p2a has Competitive. It gets its Attack dropped by 1, and responds by raising SpA by 2.
    let p2a = createEnginePokemon({
      ident: "p2a",
      ability: "competitive",
    });
    // p2b has Defiant. It gets its Attack dropped by 1, and responds by raising Atk by 2 (net +1).
    let p2b = createEnginePokemon({
      ident: "p2b",
      ability: "defiant",
    });

    // Simulate turn to trigger switch-ins. run_turn might not trigger it if it's the start of the battle,
    // wait, run_turn does NOT trigger start of battle switch-ins automatically?
    // Let's actually test by making p1 switch!
    let p1bench = createEnginePokemon({
      ident: "p1a",
      ability: "intimidate",
    });
    let p1starter = createEnginePokemon({
      ident: "p1a",
      ability: "",
    });

    let stateWithSwitch: FullBattleState = {
      p1: [p1starter, p1bench],
      p2: [p2a, p2b],
      weather: "",
      terrain: "",
      weather_turns_left: 0,
      terrain_turns_left: 0,
    };

    let actions = {
      p1a: "switch", // switch slot 0 with slot 1
      p1a_target: 1,
      p1b: "",
      p1b_target: 0,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "sleeptalk",
      p2b_target: 0,
    };

    let result = run_turn(stateWithSwitch, actions);

    // p2a (Competitive): Atk drops by 1, SpA rises by 2.
    expect(result.p2[0].boosts?.atk || 0).toBe(-1);
    expect(result.p2[0].boosts?.spa || 0).toBe(2);

    // p2b (Defiant): Atk drops by 1, Atk rises by 2 -> Net +1.
    expect(result.p2[1].boosts?.atk || 0).toBe(1);
  });
});

describe("Ability Modifiers", () => {
  it("applies -ate abilities (Aerilate, Pixilate, Refrigerate, Galvanize)", () => {
    let p1 = createEnginePokemon({
      ident: "p1a",
      type1: "Dragon",
      type2: "Flying",
      item: "",
      ability: "aerilate",
    });
    let p2 = createEnginePokemon({ ident: "p2a", type1: "Psychic", item: "", ability: "" });
    let dummy = createEnginePokemon({ ident: "p1b" });
    let dummy2 = createEnginePokemon({ ident: "p2b" });

    let actions = {
      p1a: "hypervoice",
      p1a_target: 0,
      p1b: "",
      p1b_target: 1,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "",
      p2b_target: 1,
    };

    let state = run_turn({ p1: [p1, dummy], p2: [p2, dummy2] }, actions, {
      damage_roll: "max",
      crits: "never",
    });
    expect(state.p2[0].hp).toBeLessThan(100);
  });

  it("Clear Body blocks Intimidate and Parting Shot", () => {
    let p1bench = createEnginePokemon({
      ident: "p1a",
      ability: "intimidate",
    });
    let p1a = createEnginePokemon({
      ident: "p1a",
      ability: "",
    });
    let p1b = createEnginePokemon({ ident: "dummy" });

    let p2a = createEnginePokemon({
      ident: "p2a",
      ability: "clearbody",
    });
    let p2b = createEnginePokemon({ ident: "dummy2" });

    let state = { p1: [p1a, p1b, p1bench], p2: [p2a, p2b] };

    // P1 switches to Intimidate
    let actions = {
      p1a: "switch",
      p1a_target: 2,
      p1b: "sleeptalk",
      p1b_target: 1,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "sleeptalk",
      p2b_target: 1,
    };
    let res = run_turn(state, actions, { damage_roll: "max", crits: "never" });

    // Clear Body blocks Intimidate
    expect(res.p2[0]!.boosts!.atk).toBe(0);

    // Now P1 uses Parting Shot
    let actions2 = {
      p1a: "parting-shot",
      p1a_target: 0,
      p1b: "sleeptalk",
      p1b_target: 1,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "sleeptalk",
      p2b_target: 1,
    };
    let res2 = run_turn(res, actions2, { damage_roll: "max", crits: "never" });

    // Clear Body blocks Parting Shot stats
    expect(res2.p2[0]!.boosts!.atk).toBe(0);
    expect(res2.p2[0]!.boosts!.spa).toBe(0);
  });

  it("Contrary inverts stat drops and boosts", () => {
    let p1a = createEnginePokemon({
      ident: "p1a",
    });
    let p1b = createEnginePokemon({ ident: "dummy" });

    let p2a = createEnginePokemon({
      ident: "p2a",
      ability: "contrary",
    });
    let p2b = createEnginePokemon({ ident: "dummy2" });

    let state = { p1: [p1a, p1b], p2: [p2a, p2b] };

    let actions = {
      p1a: "parting-shot", // drops Atk and SpA by 1
      p1a_target: 0,
      p1b: "sleeptalk",
      p1b_target: 1,
      p2a: "sleeptalk",
      p2a_target: 0,
      p2b: "sleeptalk",
      p2b_target: 1,
    };
    let res = run_turn(state, actions, { damage_roll: "max", crits: "never" });

    // Contrary inverts Parting Shot to +1 Atk, +1 SpA
    expect(res.p2[0]!.boosts!.atk).toBe(1);
    expect(res.p2[0]!.boosts!.spa).toBe(1);
  });

  it("applies damage reduction abilities (Thick Fat, Purifying Salt, Ice Scales, Multiscale)", () => {
    let p1 = createEnginePokemon({ ident: "p1a", type1: "Normal", item: "", ability: "thickfat" });
    let p2 = createEnginePokemon({ ident: "p2a", type1: "Fire", item: "", ability: "" });
    let dummy = createEnginePokemon({ ident: "p1b" });
    let dummy2 = createEnginePokemon({ ident: "p2b" });

    let actions1 = {
      p1a: "sleeptalk",
      p1a_target: 0,
      p1b: "",
      p1b_target: 1,
      p2a: "flamethrower",
      p2a_target: 0,
      p2b: "",
      p2b_target: 1,
    };

    let stateWithThickFat = run_turn({ p1: [p1, dummy], p2: [p2, dummy2] }, actions1, {
      damage_roll: "max",
      crits: "never",
    });
    let p1NoAbility = createEnginePokemon({ ident: "p1a", type1: "Normal", item: "", ability: "" });
    let stateWithoutThickFat = run_turn({ p1: [p1NoAbility, dummy], p2: [p2, dummy2] }, actions1, {
      damage_roll: "max",
      crits: "never",
    });

    let dmgWith = stateWithThickFat.p1[0].maxhp - stateWithThickFat.p1[0].hp;
    let dmgWithout = stateWithoutThickFat.p1[0].maxhp - stateWithoutThickFat.p1[0].hp;

    expect(dmgWith).toBeLessThan(dmgWithout);
  });

  it("applies Fur Coat (halves physical damage)", () => {
    let p1 = createEnginePokemon({ ident: "p1a", type1: "Normal", item: "", ability: "furcoat" });
    let p2 = createEnginePokemon({ ident: "p2a", type1: "Psychic", item: "", ability: "" });
    let dummy = createEnginePokemon({ ident: "p1b" });
    let dummy2 = createEnginePokemon({ ident: "p2b" });

    let actions = {
      p1a: "sleeptalk",
      p1a_target: 0,
      p1b: "",
      p1b_target: 1,
      p2a: "tackle",
      p2a_target: 0,
      p2b: "",
      p2b_target: 1,
    };

    let stateFurCoat = run_turn({ p1: [p1, dummy], p2: [p2, dummy2] }, actions, {
      damage_roll: "max",
      crits: "never",
    });
    let p1NoAbility = createEnginePokemon({ ident: "p1a", type1: "Normal", item: "", ability: "" });
    let stateNoFurCoat = run_turn({ p1: [p1NoAbility, dummy], p2: [p2, dummy2] }, actions, {
      damage_roll: "max",
      crits: "never",
    });

    let dmgFurCoat = stateFurCoat.p1[0].maxhp - stateFurCoat.p1[0].hp;
    let dmgNoFurCoat = stateNoFurCoat.p1[0].maxhp - stateNoFurCoat.p1[0].hp;
    expect(dmgFurCoat).toBeLessThan(dmgNoFurCoat);
  });

  it("applies Solid Rock/Filter/Prism Armor (reduces super effective damage)", () => {
    let p1 = createEnginePokemon({
      ident: "p1a",
      type1: "Ground",
      type2: "Rock",
      item: "",
      ability: "solidrock",
    });
    let p2 = createEnginePokemon({ ident: "p2a", type1: "Water", item: "", ability: "" });
    let dummy = createEnginePokemon({ ident: "p1b" });
    let dummy2 = createEnginePokemon({ ident: "p2b" });

    let actions = {
      p1a: "sleeptalk",
      p1a_target: 0,
      p1b: "",
      p1b_target: 1,
      p2a: "watergun",
      p2a_target: 0,
      p2b: "",
      p2b_target: 1,
    };

    let stateSolidRock = run_turn({ p1: [p1, dummy], p2: [p2, dummy2] }, actions, {
      damage_roll: "max",
      crits: "never",
    });
    let p1NoAbility = createEnginePokemon({
      ident: "p1a",
      type1: "Ground",
      type2: "Rock",
      item: "",
      ability: "",
    });
    let stateNoSolidRock = run_turn({ p1: [p1NoAbility, dummy], p2: [p2, dummy2] }, actions, {
      damage_roll: "max",
      crits: "never",
    });

    let dmgSolidRock = stateSolidRock.p1[0].maxhp - stateSolidRock.p1[0].hp;
    let dmgNoSolidRock = stateNoSolidRock.p1[0].maxhp - stateNoSolidRock.p1[0].hp;
    expect(dmgSolidRock).toBeLessThan(dmgNoSolidRock);
  });
});

describe("Ability Triggers (Offensive, Immunity, On-Hit)", () => {
  // Offensive Multipliers
  it("Iron Fist boosts punching moves", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "ironfist" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "firepunch",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1NoAbil = createEnginePokemon({ ident: "p1a", ability: "none" });
    let resBase = run_turn(
      { p1: [p1NoAbil], p2: [p2] },
      {
        p1a: "firepunch",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(200 - res.p2[0].hp).toBeGreaterThan(200 - resBase.p2[0].hp);
  });

  it("Strong Jaw boosts biting moves", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "strongjaw" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "bite",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1NoAbil = createEnginePokemon({ ident: "p1a", ability: "none" });
    let resBase = run_turn(
      { p1: [p1NoAbil], p2: [p2] },
      {
        p1a: "bite",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(200 - res.p2[0].hp).toBeGreaterThan(200 - resBase.p2[0].hp);
  });

  it("Sharpness boosts slicing moves", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "sharpness" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "psycho-cut",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1NoAbil = createEnginePokemon({ ident: "p1a", ability: "none" });
    let resBase = run_turn(
      { p1: [p1NoAbil], p2: [p2] },
      {
        p1a: "psycho-cut",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(200 - res.p2[0].hp).toBeGreaterThan(200 - resBase.p2[0].hp);
  });

  it("Technician boosts low BP moves", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "technician" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "bullet-punch",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1NoAbil = createEnginePokemon({ ident: "p1a", ability: "none" });
    let resBase = run_turn(
      { p1: [p1NoAbil], p2: [p2] },
      {
        p1a: "bullet-punch",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(200 - res.p2[0].hp).toBeGreaterThan(200 - resBase.p2[0].hp);
  });

  // Immunities & Healing
  it("Water Absorb heals instead of taking damage", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "waterabsorb", hp: 50, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "water-gun",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p2[0].hp).toBe(100);
  });

  it("Sap Sipper boosts Attack instead of taking damage", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "sapsipper", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "bullet-seed",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(res.p2[0].hp).toBe(200); // 0 damage
    expect(res.p2[0].boosts?.atk).toBe(1); // Atk +1
  });

  it("Sap Sipper grants immunity to Grass status moves and boosts Attack", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({
      ident: "p2a",
      type1: "Normal",
      ability: "sapsipper",
      hp: 200,
      maxhp: 200,
    });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "spore",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { accuracy: "always" },
    );
    expect(res.p2[0].status).toBeUndefined(); // no sleep
    expect(res.p2[0].boosts?.atk).toBe(1); // Atk +1
  });

  it("Lightning Rod boosts SpA instead of taking damage", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "lightningrod", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "thunder-shock",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p2[0].hp).toBe(200);
    expect(res.p2[0].boosts?.spa).toBe(1);
  });

  it("Motor Drive boosts Spe instead of taking damage", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "motordrive", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "thunder-shock",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p2[0].hp).toBe(200);
    expect(res.p2[0].boosts?.spe).toBe(1);
  });

  // Status immunities
  it("Limber grants immunity to Paralysis", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "limber" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "thunder-wave",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { accuracy: "always" },
    );
    expect(res.p2[0].status).toBeUndefined(); // No paralysis
  });

  it("Own Tempo grants immunity to Confusion", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "owntempo" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "confuse-ray",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { accuracy: "always" },
    );
    expect(res.p2[0].volatile_status).not.toContain("confusion");
  });

  // Status-driven Abilities & Moves
  it("Guts boosts Attack by 1.5x when statused and ignores Burn drop", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "guts", status: "brn" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 300, maxhp: 300 });
    let resGuts = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1Base = createEnginePokemon({ ident: "p1a", ability: "none" }); // No status, no guts
    let resBase = run_turn(
      { p1: [p1Base], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    expect(300 - resGuts.p2[0].hp).toBeGreaterThan(300 - resBase.p2[0].hp); // Guts out-damages base tackle
  });

  it("Facade doubles BP when statused and ignores Burn drop", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "none", status: "brn" });
    let p2 = createEnginePokemon({ ident: "p2a", hp: 300, maxhp: 300 });
    let resFacade = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "facade",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    let p1Base = createEnginePokemon({ ident: "p1a", ability: "none" }); // No status
    let resBase = run_turn(
      { p1: [p1Base], p2: [p2] },
      {
        p1a: "facade",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );

    expect(300 - resFacade.p2[0].hp).toBeGreaterThan(300 - resBase.p2[0].hp); // Burned facade out-damages base facade
  });

  // On-Hit Effects
  it("Gooey drops attacker speed on contact", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "gooey" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p1[0].boosts?.spe).toBe(-1);
  });
  it("Rough Skin damages attacker on contact", () => {
    let p1 = createEnginePokemon({ ident: "p1a", hp: 100, maxhp: 100 });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "roughskin" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p1[0].hp).toBeLessThan(100);
  });

  // Mold Breaker
  it("Mold Breaker ignores Levitate", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "moldbreaker" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "levitate", hp: 300, maxhp: 300 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "earthquake",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { damage_roll: "max" },
    );
    expect(res.p2[0].hp).toBeLessThan(300); // Hit by Earthquake!
  });

  it("Mold Breaker ignores Sap Sipper for Status moves", () => {
    let p1 = createEnginePokemon({ ident: "p1a", ability: "moldbreaker" });
    let p2 = createEnginePokemon({ ident: "p2a", type1: "Normal", ability: "sapsipper" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "spore",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
      { accuracy: "always" },
    );
    expect(res.p2[0].status).toBe("slp"); // Put to sleep!
    expect(res.p2[0].boosts?.atk || 0).toBe(0); // No boost
  });

  it("Justified boosts Attack when hit by Dark type", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "justified", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "bite",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p2[0].hp).toBeLessThan(200); // takes damage
    expect(res.p2[0].boosts?.atk || 0).toBe(1);
  });

  it("Stamina boosts Defense on any hit", () => {
    let p1 = createEnginePokemon({ ident: "p1a" });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "stamina", hp: 200, maxhp: 200 });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );
    expect(res.p2[0].boosts?.def || 0).toBe(1);
  });

  it("Rough Skin damages attacker on contact", () => {
    let p1 = createEnginePokemon({ ident: "p1a", hp: 100, maxhp: 100 });
    let p2 = createEnginePokemon({ ident: "p2a", ability: "roughskin" });
    let res = run_turn(
      { p1: [p1], p2: [p2] },
      {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      },
    );

    // 1/8 of maxhp(100) is 12 (integer division). Wait, max hp of p1?
    // Rough skin deals damage based on ATTACKER'S max hp. 100 / 8 = 12.
    // So p1 should have 100 - 12 = 88 hp. Wait, std::cmp::max(1, max_hp / 8) -> 100 / 8 = 12.
    // Let's just check it's strictly less than 100.
    expect(res.p1[0].hp).toBeLessThan(100);
  });
});

import fs from "fs";
import path from "path";

describe("Comprehensive Ability Coverage", () => {
  const absJsonPath = path.resolve(__dirname, "../../data/champions/abilities.json");
  const absJson = JSON.parse(fs.readFileSync(absJsonPath, "utf8"));

  // Test every single ability in the JSON
  absJson.data.forEach((ability: { identifier: string }) => {
    it(`Ability ${ability.identifier} is parsed and does not crash`, () => {
      const p1a = createEnginePokemon({
        ident: "p1a",
        ability: ability.identifier.replace(/-/g, ""),
        hp: 100,
        maxhp: 100,
      });
      const p2a = createEnginePokemon({
        ident: "p2a",
        ability: ability.identifier.replace(/-/g, ""), // test defender too!
        hp: 100,
        maxhp: 100,
      });

      const state = { p1: [p1a], p2: [p2a] };
      const actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "switch",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "switch",
        p2b_target: 0,
      };

      expect(() =>
        run_turn(state, actions, {
          damage_roll: "max",
          crits: "never",
          accuracy: "always",
        }),
      ).not.toThrow();
    });
  });

  describe("Immunities: Soundproof, Bulletproof, Overcoat", () => {
    it("Soundproof grants immunity to sound moves", () => {
      let p1 = createEnginePokemon({ ident: "p1a" });
      let p2 = createEnginePokemon({ ident: "p2a", ability: "soundproof", hp: 100, maxhp: 100 });
      let res = run_turn(
        { p1: [p1], p2: [p2] },
        {
          p1a: "hypervoice",
          p1a_target: 0,
          p1b: "switch",
          p1b_target: 0,
          p2a: "sleeptalk",
          p2a_target: 0,
          p2b: "switch",
          p2b_target: 0,
        },
      );
      expect(res.p2[0].hp).toBe(100);
    });

    it("Bulletproof grants immunity to ball and bomb moves", () => {
      let p1 = createEnginePokemon({ ident: "p1a" });
      let p2 = createEnginePokemon({ ident: "p2a", ability: "bulletproof", hp: 100, maxhp: 100 });
      let res = run_turn(
        { p1: [p1], p2: [p2] },
        {
          p1a: "shadowball",
          p1a_target: 0,
          p1b: "switch",
          p1b_target: 0,
          p2a: "sleeptalk",
          p2a_target: 0,
          p2b: "switch",
          p2b_target: 0,
        },
      );
      expect(res.p2[0].hp).toBe(100);
    });

    it("Overcoat grants immunity to powder moves and sandstorm damage", () => {
      let p1 = createEnginePokemon({ ident: "p1a" });
      let p2 = createEnginePokemon({
        ident: "p2a",
        type1: "Normal",
        ability: "overcoat",
        hp: 100,
        maxhp: 100,
      });
      let res = run_turn(
        { p1: [p1], p2: [p2] },
        {
          p1a: "spore",
          p1a_target: 0,
          p1b: "switch",
          p1b_target: 0,
          p2a: "sleeptalk",
          p2a_target: 0,
          p2b: "switch",
          p2b_target: 0,
        },
      );
      expect(res.p2[0].status).toBeUndefined();

      let p3 = createEnginePokemon({ ident: "p1a", ability: "sandstream" });
      let p4 = createEnginePokemon({
        ident: "p2a",
        type1: "Normal",
        ability: "overcoat",
        hp: 100,
        maxhp: 100,
      });
      let res2 = run_turn(
        { p1: [p3], p2: [p4] },
        {
          p1a: "sleeptalk",
          p1a_target: 0,
          p1b: "switch",
          p1b_target: 0,
          p2a: "sleeptalk",
          p2a_target: 0,
          p2b: "switch",
          p2b_target: 0,
        },
      );
      expect(res2.p2[0].hp).toBe(100); // immune to sandstorm damage
    });

    it("Overcoat ignores Rage Powder redirection but Follow Me still redirects", () => {
      // Overcoat ignores Rage Powder
      let p1 = createEnginePokemon({ ident: "p1a", ability: "overcoat", hp: 100, maxhp: 100 });
      let p2 = createEnginePokemon({ ident: "p2a", hp: 100, maxhp: 100 }); // The one using Rage Powder
      let p3 = createEnginePokemon({ ident: "p2b", hp: 100, maxhp: 100 }); // The original target

      let res = run_turn(
        { p1: [p1], p2: [p2, p3] },
        {
          p1a: "tackle",
          p1a_target: 1, // targets p2b
          p1b: "switch",
          p1b_target: 0,
          p2a: "ragepowder", // p2a uses Rage Powder
          p2a_target: 0,
          p2b: "sleeptalk",
          p2b_target: 0,
        },
      );
      // p1a has overcoat, so it should ignore rage powder and hit p2b
      expect(res.p2[1].hp).toBeLessThan(100);
      expect(res.p2[0].hp).toBe(100); // p2a took no damage
    });

    it("Follow Me redirects attacks normally", () => {
      let p1 = createEnginePokemon({ ident: "p1a", hp: 100, maxhp: 100 });
      let p2 = createEnginePokemon({ ident: "p2a", hp: 100, maxhp: 100 }); // The one using Follow Me
      let p3 = createEnginePokemon({ ident: "p2b", hp: 100, maxhp: 100 }); // The original target

      let res = run_turn(
        { p1: [p1], p2: [p2, p3] },
        {
          p1a: "tackle",
          p1a_target: 1, // targets p2b
          p1b: "switch",
          p1b_target: 0,
          p2a: "followme", // p2a uses Follow Me
          p2a_target: 0,
          p2b: "sleeptalk",
          p2b_target: 0,
        },
      );
      // p2a used follow me, so it takes the hit!
      expect(res.p2[0].hp).toBeLessThan(100);
      expect(res.p2[1].hp).toBe(100); // p2b is safe
    });
  });
});
