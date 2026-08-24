import { describe, it } from "vitest";
import { pkmn, createSimBattle } from "./sim-utils";

describe("Engine Comprehensive Scenario Test", () => {
  it("should correctly simulate Weather, Terrain, and complex Item/Ability modifiers", () => {
    const battle = createSimBattle("gen9customgame");

    battle.setPlayer("p1", {
      team: [
        pkmn({
          species: "Charizard",
          ability: "blaze",
          item: "charcoal",
          moves: ["flamethrower"],
          level: 50,
          evs: { spa: 32 },
        }),
        pkmn({
          species: "Azumarill",
          ability: "hugepower",
          item: "mysticwater",
          moves: ["liquidation"],
          level: 50,
          evs: { atk: 32 },
        }),
      ],
    });

    battle.setPlayer("p2", {
      team: [
        pkmn({
          species: "Scizor",
          ability: "technician",
          item: "",
          moves: ["protect"],
          level: 50,
          evs: { hp: 32, spd: 32 },
        }),
        pkmn({
          species: "Snorlax",
          ability: "thickfat",
          item: "",
          moves: ["protect"],
          level: 50,
          evs: { hp: 32, def: 32 },
        }),
      ],
    });

    battle.makeChoices("team 12", "team 12");

    battle.field.setWeather("sunnyday", battle.p1.active[0]);
    battle.field.setTerrain("psychicterrain", battle.p1.active[0]);

    // Trigger Blaze
    battle.p1.active[0].sethp(1);

    // Wait! We can't let them use Protect in showdown otherwise damage is blocked!
    // Oh right, if they use Protect, the damage won't go through.
    // What's a move they can use? Scizor learns Swords Dance. Snorlax learns Belly Drum or Rest or Yawn.
  });
});
