import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Dynamic Speed Recalculation Mid-Turn", () => {
  it("Tailwind mid-turn immediately allows slower ally to outspeed opponent in the same turn", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "whimsicott",
          ability: "prankster",
          nature: "Timid",
          moves: ["tailwind", "moonblast"],
          evs: { hp: 2, spe: 32 },
        }),
        pokemon({
          species: "torkoal",
          ability: "drought",
          nature: "Quiet",
          moves: ["heatwave", "protect"],
          evs: { hp: 2, spa: 32, spe: 0 },
        }),
      ],
      [
        pokemon({
          species: "excadrill",
          ability: "sandrush",
          nature: "Adamant",
          moves: ["earthquake", "protect"],
          evs: { hp: 2, atk: 32, spe: 32 },
        }),
        pokemon({
          species: "pidgeot",
          ability: "keeneye",
          nature: "Jolly",
          moves: ["tailwind", "protect"],
          evs: { hp: 2, spe: 32 },
        }),
      ],
      { padTeam: false },
    );

    // Initial base speeds:
    // Whimsicott: 116 (with Prankster, Tailwind is +1 priority)
    // Pidgeot: 101 (faster than Excadrill, but Whimsicott acts first due to Prankster Tailwind)
    // Excadrill: 88
    // Torkoal: 20
    //
    // Turn 1:
    // 1. Whimsicott uses Tailwind (+1 priority) -> p1 gains Tailwind (speeds doubled)
    // 2. Torkoal base speed: 20 * 2 = 40 (still slower than Excadrill 88)
    // 3. Excadrill (88) uses Earthquake
    // 4. Torkoal uses Heat Wave
    env.executeAndAssert("move tailwind, move heatwave", "move earthquake, move protect");
  });

  it("Mid-turn Tailwind allows slower ally to outspeed an opponent whose speed is between base and boosted speed", () => {
    // Whimsicott (Prankster +1 Tailwind)
    // Ally: Raichu (Base Spe 110, Evs 0 -> Speed ~130)
    // Opponent 1: Pidgeot (Base Spe 101, Evs 32 Timid -> Speed ~168)
    //
    // Initially: Pidgeot (~168) > Raichu (~130).
    // Whimsicott uses Prankster Tailwind (+1).
    // Mid-turn, Raichu's speed doubles to ~260 > Pidgeot (~168).
    // Therefore, Raichu attacks BEFORE Pidgeot!
    const env = new TestEnvironment(
      [
        pokemon({
          species: "whimsicott",
          ability: "prankster",
          nature: "Timid",
          moves: ["tailwind", "moonblast"],
          evs: { hp: 2, spe: 32 },
        }),
        pokemon({
          species: "raichu",
          ability: "lightningrod",
          nature: "Hardy",
          moves: ["thunderbolt", "protect"],
          evs: { hp: 2, spa: 32, spe: 0 },
        }),
      ],
      [
        pokemon({
          species: "pidgeot",
          ability: "keeneye",
          nature: "Timid",
          moves: ["airslash", "protect"],
          evs: { hp: 2, spe: 32 },
        }),
        pokemon({
          species: "torkoal",
          ability: "shellarmor",
          nature: "Quiet",
          moves: ["flamethrower", "protect"],
          evs: { hp: 2, spe: 0 },
        }),
      ],
      { padTeam: false },
    );

    // Turn 1:
    // Priority +1: Whimsicott uses Tailwind. P1 side gets Tailwind.
    // Order re-sorted! Raichu's speed is now doubled and surpasses Pidgeot.
    // Raichu moves next with Thunderbolt targeting Pidgeot!
    // Then Pidgeot moves.
    env.executeAndAssert("move tailwind, move thunderbolt 1", "move airslash 1, move protect");
  });
});
