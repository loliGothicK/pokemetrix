import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";

describe("Ability: Earth Eater (どしょく) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Ground-type move", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["mudslap", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Sandshrew", ability: "sandveil", moves: ["mudslap"] }),
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
        p2a: "mudslap",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move mudslap 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("stops multi-hit Ground-type moves (e.g., Bone Rush) on the very first hit and only heals once", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["bonerush", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Lucario", ability: "steadfast", moves: ["bonerush"] }),
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
        p2a: "bonerush",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move bonerush 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("completely nullifies the move even at Max HP", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["earthquake", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Golem", ability: "sturdy", moves: ["earthquake"] }),
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
        p2a: "earthquake",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move earthquake, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("triggers when hit by an ally's move (e.g. Earthquake)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["earthquake", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
          pkmn({ species: "Golem", ability: "sturdy", moves: ["earthquake"] }),
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
        p1b: "earthquake",
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
      battle.makeChoices("move sleeptalk, move earthquake", "move sleeptalk, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p2[0].hp).toBe(battle.p2.active[0].hp);
      expect(result.p2[1].hp).toBe(battle.p2.active[1].hp);
    });
  });
});
