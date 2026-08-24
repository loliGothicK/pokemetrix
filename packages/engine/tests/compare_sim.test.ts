import { describe, it, expect } from "vitest";
import * as engine from "../pkg-node/engine.js";
import { pkmn, createSimBattle, withDeterministicMoves } from "./sim-utils";

describe("Rust Engine vs @pkmn/sim Comparison", () => {
  it("should calculate the exact same damage as @pkmn/sim for Black Belt Close Combat", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["closecombat", "psychic", "stoneedge", "moonblast"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({
            species: "Machamp",
            ability: "noguard",
            item: "blackbelt",
            moves: ["closecombat"],
            level: 50,
            evs: { atk: 32 },
          }),
          pkmn({
            species: "Alakazam",
            ability: "synchronize",
            item: "lifeorb",
            moves: ["psychic"],
            level: 50,
            evs: { spa: 32 },
          }),
        ],
      });

      battle.setPlayer("p2", {
        team: [
          pkmn({
            species: "Tyranitar",
            ability: "unnerve",
            item: "leftovers",
            moves: ["stoneedge"],
            level: 50,
            evs: { hp: 32, def: 32 },
          }),
          pkmn({
            species: "Clefable",
            ability: "magicguard",
            moves: ["moonblast"],
            level: 50,
          }),
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
            item: "blackbelt",
            ability: "noguard",
            type1: "Fighting",
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
            item: "lifeorb",
            ability: "synchronize",
            type1: "Psychic",
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
            item: "leftovers",
            ability: "unnerve",
            type1: "Rock",
            type2: "Dark",
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
            ability: "magicguard",
            type1: "Fairy",
          },
        ],
      };

      const engineActions = {
        p1a: "closecombat",
        p1a_target: 0,
        p1b: "psychic",
        p1b_target: 1,
        p2a: "stoneedge",
        p2a_target: 0,
        p2b: "moonblast",
        p2b_target: 1,
      };

      battle.makeChoices(
        "move closecombat 1, move psychic 2",
        "move stoneedge 2, move moonblast 1",
      );

      const simP2aHp = battle.p2.active[0].hp;

      const rustResult = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      const rustP2aHp = rustResult.p2[0].hp;

      console.log("--- BATTLE LOG ---");
      console.log(battle.log.join("\n"));
      console.log("------------------");
      expect(rustP2aHp).toBe(simP2aHp);
    });
  });

  it("should correctly apply Intimidate and recalculate damage when switching mid-turn", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["psychic", "stoneedge", "moonblast"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Machamp", ability: "noguard", moves: ["closecombat"], level: 50 }),
          pkmn({ species: "Alakazam", ability: "synchronize", moves: ["psychic"], level: 50 }),
          pkmn({ species: "Arcanine", ability: "intimidate", moves: ["flareblitz"], level: 50 }),
        ],
      });

      battle.setPlayer("p2", {
        team: [
          pkmn({
            species: "Tyranitar",
            ability: "unnerve",
            moves: ["stoneedge"],
            level: 50,
            evs: { atk: 32 },
          }),
          pkmn({ species: "Clefable", ability: "magicguard", moves: ["moonblast"], level: 50 }),
        ],
      });

      battle.makeChoices("team 123", "team 12");

      const initialState = {
        p1: [
          {
            ident: "p1a: Machamp",
            hp: battle.p1.active[0].hp,
            maxhp: battle.p1.active[0].maxhp,
            speed: battle.p1.active[0].speed,
            attack: battle.p1.active[0].storedStats.atk,
            defense: battle.p1.active[0].storedStats.def,
            sp_attack: battle.p1.active[0].storedStats.spa,
            sp_defense: battle.p1.active[0].storedStats.spd,
            ability: "noguard",
            type1: "Fighting",
          },
          {
            ident: "p1b: Alakazam",
            hp: battle.p1.active[1].hp,
            maxhp: battle.p1.active[1].maxhp,
            speed: battle.p1.active[1].speed,
            attack: battle.p1.active[1].storedStats.atk,
            defense: battle.p1.active[1].storedStats.def,
            sp_attack: battle.p1.active[1].storedStats.spa,
            sp_defense: battle.p1.active[1].storedStats.spd,
            ability: "synchronize",
            type1: "Psychic",
          },
          {
            ident: "p1c: Arcanine",
            hp: battle.p1.pokemon[2].hp,
            maxhp: battle.p1.pokemon[2].maxhp,
            speed: battle.p1.pokemon[2].speed,
            attack: battle.p1.pokemon[2].storedStats.atk,
            defense: battle.p1.pokemon[2].storedStats.def,
            sp_attack: battle.p1.pokemon[2].storedStats.spa,
            sp_defense: battle.p1.pokemon[2].storedStats.spd,
            ability: "intimidate",
            type1: "Fire",
          },
        ],
        p2: [
          {
            ident: "p2a: Tyranitar",
            hp: battle.p2.active[0].hp,
            maxhp: battle.p2.active[0].maxhp,
            speed: battle.p2.active[0].speed,
            attack: battle.p2.active[0].storedStats.atk,
            defense: battle.p2.active[0].storedStats.def,
            sp_attack: battle.p2.active[0].storedStats.spa,
            sp_defense: battle.p2.active[0].storedStats.spd,
            ability: "unnerve",
            type1: "Rock",
            type2: "Dark",
          },
          {
            ident: "p2b: Clefable",
            hp: battle.p2.active[1].hp,
            maxhp: battle.p2.active[1].maxhp,
            speed: battle.p2.active[1].speed,
            attack: battle.p2.active[1].storedStats.atk,
            defense: battle.p2.active[1].storedStats.def,
            sp_attack: battle.p2.active[1].storedStats.spa,
            sp_defense: battle.p2.active[1].storedStats.spd,
            ability: "magicguard",
            type1: "Fairy",
          },
        ],
      };

      const engineActions = {
        p1a: "switch",
        p1a_target: 2,
        p1b: "psychic",
        p1b_target: 1,
        p2a: "stoneedge",
        p2a_target: 0,
        p2b: "moonblast",
        p2b_target: 1,
      };

      battle.makeChoices("switch 3, move psychic 2", "move stoneedge 1, move moonblast 2");
      const finalArcanineHp = battle.p1.active[0].hp;

      const resultState = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });

      expect(resultState.p2[0].boosts!.atk).toBe(-1);
      console.log(battle.log.join("\n"));
      expect(resultState.p1[0].hp).toBe(finalArcanineHp);
    });
  });

  it("should correctly apply spread targeting (0.75x) to both foes", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["rockslide", "yawn"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({
            species: "Tyranitar",
            ability: "unnerve",
            moves: ["rockslide"],
            level: 50,
            evs: { atk: 32 },
          }),
          pkmn({ species: "Alakazam", ability: "synchronize", moves: ["yawn"], level: 50 }),
        ],
      });

      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Arcanine", ability: "intimidate", moves: ["yawn"], level: 50 }),
          pkmn({ species: "Clefable", ability: "magicguard", moves: ["yawn"], level: 50 }),
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
            ability: "unnerve",
            type1: "Rock",
            type2: "Dark",
            boosts: { atk: -1, def: 0, spa: 0, spd: 0, spe: 0 },
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
            ability: "synchronize",
            type1: "Psychic",
            boosts: { atk: -1, def: 0, spa: 0, spd: 0, spe: 0 },
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
            ability: "intimidate",
            type1: "Fire",
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
            ability: "magicguard",
            type1: "Fairy",
          },
        ],
      };

      const engineActions = {
        p1a: "rockslide",
        p1a_target: 1,
        p1b: "yawn",
        p1b_target: 0,
        p2a: "yawn",
        p2a_target: 0,
        p2b: "yawn",
        p2b_target: 0,
      };

      battle.makeChoices("move rockslide, move yawn 1", "move yawn 1, move yawn 1");

      const resultState = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });

      expect(resultState.p2[0].hp).toBe(battle.p2.active[0].hp);
      expect(resultState.p2[1].hp).toBe(battle.p2.active[1].hp);
    });
  });

  it("should correctly apply Unaware and Flash Fire", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["moonblast", "yawn", "stoneedge", "flareblitz"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({
            species: "Clefable",
            ability: "unaware",
            moves: ["moonblast"],
            level: 50,
            evs: { spa: 32 },
          }),
          pkmn({ species: "Heatran", ability: "flashfire", moves: ["yawn"], level: 50 }),
        ],
      });

      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Tyranitar", ability: "unnerve", moves: ["stoneedge"], level: 50 }),
          pkmn({ species: "Arcanine", ability: "intimidate", moves: ["flareblitz"], level: 50 }),
        ],
      });

      battle.makeChoices("team 12", "team 12");

      battle.p1.active[0].boosts.spa = -2;
      battle.p2.active[0].boosts.spd = -2;

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
            ability: "unaware",
            type1: "Fairy",
            boosts: { atk: -1, def: 0, spa: -2, spd: 0, spe: 0 },
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
            ability: "flashfire",
            type1: "Fire",
            type2: "Steel",
            boosts: { atk: -1, def: 0, spa: 0, spd: 0, spe: 0 },
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
            ability: "unnerve",
            type1: "Rock",
            type2: "Dark",
            boosts: { atk: 0, def: 0, spa: 0, spd: -2, spe: 0 },
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
            ability: "intimidate",
            type1: "Fire",
          },
        ],
      };

      const engineActions = {
        p1a: "moonblast",
        p1a_target: 0,
        p1b: "yawn",
        p1b_target: 1,
        p2a: "stoneedge",
        p2a_target: 0,
        p2b: "flareblitz",
        p2b_target: 1,
      };

      battle.makeChoices("move moonblast 1, move yawn 2", "move stoneedge 1, move flareblitz 2");

      const resultState = engine.run_turn(initialState, engineActions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });

      expect(resultState.p2[0].hp).toBe(battle.p2.active[0].hp);
      expect(resultState.p1[1].hp).toBe(battle.p1.active[1].hp);
    });
  });
});
