import { expect, it, describe } from "vitest";
import * as engine from "../pkg-node/engine.js";
import { createSimBattle, withDeterministicMoves, pkmn } from "./sim-utils.js";

describe("Volatile Effects Tests", () => {
  it("should process Trick-or-Treat (addedType)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["trickortreat", "tackle", "shadowball"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Gourgeist", moves: ["trickortreat", "shadowball"] }),
          pkmn({ species: "Arcanine", moves: ["tackle"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Tyranitar", moves: ["tackle"] }),
          pkmn({ species: "Clefable", moves: ["tackle"] }),
        ],
      });

      battle.makeChoices("team 12", "team 12");
      // Turn 1: Gourgeist uses Trick-or-Treat on Tyranitar
      battle.makeChoices("move trickortreat 1, move tackle 2", "move tackle 1, move tackle 1");

      const initialState = {
        p1: [
          {
            ident: "p1a",
            hp: battle.p1.active[0].hp,
            maxhp: battle.p1.active[0].maxhp,
            speed: battle.p1.active[0].speed,
            attack: battle.p1.active[0].storedStats.atk,
            defense: battle.p1.active[0].storedStats.def,
            sp_attack: battle.p1.active[0].storedStats.spa,
            sp_defense: battle.p1.active[0].storedStats.spd,
            type1: battle.p1.active[0].types[0],
            type2: battle.p1.active[0].types[1] || "",
            added_type: battle.p1.active[0].addedType || undefined,
          },
          {
            ident: "p1b",
            hp: battle.p1.active[1].hp,
            maxhp: battle.p1.active[1].maxhp,
            speed: battle.p1.active[1].speed,
            attack: 1,
            defense: 1,
            sp_attack: 1,
            sp_defense: 1,
            type1: "Electric",
          },
        ],
        p2: [
          {
            ident: "p2a",
            hp: battle.p2.active[0].hp,
            maxhp: battle.p2.active[0].maxhp,
            speed: battle.p2.active[0].speed,
            attack: battle.p2.active[0].storedStats.atk,
            defense: battle.p2.active[0].storedStats.def,
            sp_attack: battle.p2.active[0].storedStats.spa,
            sp_defense: battle.p2.active[0].storedStats.spd,
            type1: battle.p2.active[0].types[0],
            type2: battle.p2.active[0].types[1] || "",
            added_type: battle.p2.active[0].addedType || undefined,
          },
          {
            ident: "p2b",
            hp: battle.p2.active[1].hp,
            maxhp: battle.p2.active[1].maxhp,
            speed: battle.p2.active[1].speed,
            attack: 1,
            defense: 1,
            sp_attack: 1,
            sp_defense: 1,
            type1: "Electric",
          },
        ],
      };

      const engineActions = {
        p1a: "shadowball",
        p1a_target: 0,
        p1b: "tackle",
        p1b_target: 0,
        p2a: "tackle",
        p2a_target: 0,
        p2b: "tackle",
        p2b_target: 0,
      };

      // Turn 2: Shadow Ball on Snorlax. Because of Trick-or-Treat, Snorlax has addedType Ghost, making it weak to Ghost! (Wait, Normal is immune, Ghost is weak... Normal+Ghost takes 2x!)
      battle.makeChoices("move shadowball 1, move tackle 2", "move tackle 1, move tackle 1");
      const resultState = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      expect(resultState.p2[0].hp).toBe(battle.p2.active[0].hp);
    });
  });

  it("should process recoil (Flare Blitz)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["flareblitz", "swordsdance"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Charizard", moves: ["flareblitz"] }),
          pkmn({ species: "Pikachu", moves: ["swordsdance"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Venusaur", moves: ["swordsdance"] }),
          pkmn({ species: "Eevee", moves: ["swordsdance"] }),
        ],
      });

      battle.makeChoices("team 12", "team 12");

      const initialState = {
        p1: [
          {
            ident: "p1a",
            hp: battle.p1.active[0].hp,
            maxhp: battle.p1.active[0].maxhp,
            speed: battle.p1.active[0].speed,
            attack: battle.p1.active[0].storedStats.atk,
            defense: battle.p1.active[0].storedStats.def,
            sp_attack: battle.p1.active[0].storedStats.spa,
            sp_defense: battle.p1.active[0].storedStats.spd,
            type1: "Fire",
          },
          {
            ident: "p1b",
            hp: battle.p1.active[1].hp,
            maxhp: battle.p1.active[1].maxhp,
            speed: battle.p1.active[1].speed,
            attack: battle.p1.active[1].storedStats.atk,
            defense: battle.p1.active[1].storedStats.def,
            sp_attack: battle.p1.active[1].storedStats.spa,
            sp_defense: battle.p1.active[1].storedStats.spd,
            type1: "Electric",
          },
        ],
        p2: [
          {
            ident: "p2a",
            hp: battle.p2.active[0].hp,
            maxhp: battle.p2.active[0].maxhp,
            speed: battle.p2.active[0].speed,
            attack: battle.p2.active[0].storedStats.atk,
            defense: battle.p2.active[0].storedStats.def,
            sp_attack: battle.p2.active[0].storedStats.spa,
            sp_defense: battle.p2.active[0].storedStats.spd,
            type1: "Grass",
            type2: "Poison",
          },
          {
            ident: "p2b",
            hp: battle.p2.active[1].hp,
            maxhp: battle.p2.active[1].maxhp,
            speed: battle.p2.active[1].speed,
            attack: battle.p2.active[1].storedStats.atk,
            defense: battle.p2.active[1].storedStats.def,
            sp_attack: battle.p2.active[1].storedStats.spa,
            sp_defense: battle.p2.active[1].storedStats.spd,
            type1: "Normal",
          },
        ],
      };

      battle.makeChoices(
        "move flareblitz 1, move swordsdance",
        "move swordsdance, move swordsdance",
      );

      const engineActions = {
        p1a: "flareblitz",
        p1a_target: 0,
        p1b: "swordsdance",
        p1b_target: 0,
        p2a: "swordsdance",
        p2a_target: 0,
        p2b: "swordsdance",
        p2b_target: 0,
      };
      const rustResult = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      expect(rustResult.p1[0].hp).toBe(battle.p1.active[0].hp); // check recoil
      expect(rustResult.p2[0].hp).toBe(battle.p2.active[0].hp); // check damage
    });
  });
});
