import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";
describe("Ability: Sap Sipper (そうしょく) Differential Test", () => {
  it("blocks damaging Grass-type moves and raises Attack by 1 stage", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["gigadrain", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Bouffalant", ability: "sapsipper", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Venusaur", ability: "overgrow", moves: ["gigadrain"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12"); // send out

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "gigadrain",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });

      battle.makeChoices("move sleeptalk, move sleeptalk", "move gigadrain 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p1[0].boosts?.atk || 0).toBe(battle.p1.active[0].boosts.atk || 0);
    });
  });

  it("blocks Grass-type status moves (e.g. Leech Seed) and raises Attack", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["leechseed", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Bouffalant", ability: "sapsipper", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Venusaur", ability: "overgrow", moves: ["leechseed"] }),
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
        p2a: "leechseed",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0, // Target p1a (slot 0)
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move leechseed 1, move sleeptalk");

      expect(result.p1[0]?.boosts?.atk || 0).toBe(battle.p1.active[0]?.boosts?.atk || 0);
      expect(result.p1[0]?.volatile_status?.includes("leechseed")).toBe(
        Object.keys(battle.p1.active[0]?.volatiles || {}).includes("leechseed"),
      );
    });
  });

  it("still blocks the move completely even if Attack is already at +6", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["energyball", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Bouffalant", ability: "sapsipper", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Venusaur", ability: "overgrow", moves: ["energyball"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      battle.p1.active[0].boostBy({ atk: 6 });

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "energyball",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move energyball 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p1[0].boosts?.atk || 0).toBe(battle.p1.active[0].boosts.atk || 0);
    });
  });

  it("stops multi-hit Grass-type moves (e.g. Bullet Seed) on the first hit, boosting Attack only once", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["bulletseed", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Bouffalant", ability: "sapsipper", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Breloom", ability: "technician", moves: ["bulletseed"] }),
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
        p2a: "bulletseed",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move bulletseed 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p1[0].boosts?.atk || 0).toBe(battle.p1.active[0].boosts.atk || 0);
    });
  });
});
