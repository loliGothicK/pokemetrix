import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";

describe("Ability: Water Absorb (ちょすい) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Water-type move", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["watergun", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Squirtle", ability: "torrent", moves: ["watergun"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      // Set HP to 50
      battle.p1.active[0].sethp(50);

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "watergun",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });

      battle.makeChoices("move sleeptalk, move sleeptalk", "move watergun 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("blocks Water-type status moves (e.g., Soak / みずびたし) and heals", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["soak", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Squirtle", ability: "torrent", moves: ["soak"] }),
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
        p2a: "soak",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move soak 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      // Both should not have the Water type added by Soak
      expect(result.p1[0].added_type || "").toBe(battle.p1.active[0].addedType || "");
    });
  });

  it("stops multi-hit Water-type moves (e.g., Water Shuriken) on the very first hit and only heals once", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["watershuriken", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Greninja", ability: "torrent", moves: ["watershuriken"] }),
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
        p2a: "watershuriken",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move watershuriken 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("completely nullifies the move even at Max HP", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["hydrocannon", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Blastoise", ability: "torrent", moves: ["hydrocannon"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      // HP is already max

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "sleeptalk",
        p1b_target: 0,
        p2a: "hydrocannon",
        p2a_target: 0,
        p2b: "sleeptalk",
        p2b_target: 0,
      };

      const result = run_turn(initialState, actions, {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
      });
      battle.makeChoices("move sleeptalk, move sleeptalk", "move hydrocannon 1, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
    });
  });

  it("triggers when hit by an ally's move (e.g. Surf)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["surf", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["surf"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Charmander", ability: "blaze", moves: ["sleeptalk"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12");
      battle.p1.active[0].sethp(50);

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "sleeptalk",
        p1a_target: 0,
        p1b: "surf",
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
      battle.makeChoices("move sleeptalk, move surf", "move sleeptalk, move sleeptalk");

      expect(result.p1[0].hp).toBe(battle.p1.active[0].hp);
      expect(result.p2[0].hp).toBe(battle.p2.active[0].hp);
      expect(result.p2[1].hp).toBe(battle.p2.active[1].hp);
    });
  });
});
