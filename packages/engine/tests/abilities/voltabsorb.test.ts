import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";

describe("Ability: Volt Absorb (ちくでん) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Electric-type move", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["thundershock", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Raichu", ability: "static", moves: ["thundershock"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      battle.p1.active[0].sethp(50);

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "thundershock",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move thundershock 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("blocks Electric-type status moves (e.g., Thunder Wave / でんじは) and heals", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["thunderwave", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Raichu", ability: "static", moves: ["thunderwave"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      battle.p1.active[0].sethp(50);

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "thunderwave",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move thunderwave 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p1[0].status || "").toBe(battle.p1.active[0].status || "");
    });
  });

  it("completely nullifies the move even at Max HP", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["thunder", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Raichu", ability: "static", moves: ["thunder"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "thunder",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move thunder 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("triggers when hit by an ally's move (e.g. Discharge)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["discharge", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Jolteon", ability: "voltabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["discharge"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Squirtle", ability: "torrent", moves: ["sleeptalk"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      battle.p1.active[0].sethp(50);

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "discharge",
        p1b_target: 0,
        p2a: "sleeptalk",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move discharge", "move sleeptalk, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p2[0].hp).toBe(battle.p2.active[0].hp);
      expect(result.p2[1].hp).toBe(battle.p2.active[1].hp);
    });
  });
});
