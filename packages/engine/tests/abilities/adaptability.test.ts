import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";

describe("Ability: Adaptability (てきおうりょく) Differential Test", () => {
  it("increases STAB modifier from 1.5x to 2x (STAB move)", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["waterfall", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          // Basculegion is Water/Ghost type, Waterfall is Water type.
          pkmn({ species: "Basculegion", ability: "adaptability", moves: ["waterfall"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Mew", ability: "synchronize", moves: ["sleeptalk"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12"); // send out

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "waterfall",
        p1a_target: 0,
        p1b: "sleeptalk",
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

      // advance sim
      battle.makeChoices("move waterfall 1, move sleeptalk", "move sleeptalk, move sleeptalk");

      const p2aSim = battle.p2.active[0];
      const p2aEngine = result.p2[0];

      console.log(`STAB MAX HP: ${p2aSim.maxhp}. Engine HP: ${p2aEngine.hp}, Sim HP: ${p2aSim.hp}`);
      console.log(
        `Engine DMG: ${p2aEngine.maxhp - p2aEngine.hp}, Sim DMG: ${p2aSim.maxhp - p2aSim.hp}`,
      );
      expect(p2aEngine.hp).toBe(p2aSim.hp);
      expect(p2aEngine.hp).toBeLessThan(p2aEngine.maxhp);
    });
  });

  it("does not increase modifier for non-STAB move", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["tackle", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          // Basculegion is Water/Ghost type, Tackle is Normal type.
          pkmn({ species: "Basculegion", ability: "adaptability", moves: ["tackle"] }),
          pkmn({ species: "Pikachu", ability: "static", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          pkmn({ species: "Mew", ability: "synchronize", moves: ["sleeptalk"] }),
          pkmn({ species: "Eevee", ability: "runaway", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12"); // send out

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "tackle",
        p1a_target: 0,
        p1b: "sleeptalk",
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

      // advance sim
      battle.makeChoices("move tackle 1, move sleeptalk", "move sleeptalk, move sleeptalk");

      const p2aSim = battle.p2.active[0];
      const p2aEngine = result.p2[0];

      console.log(
        `NON-STAB MAX HP: ${p2aSim.maxhp}. Engine HP: ${p2aEngine.hp}, Sim HP: ${p2aSim.hp}`,
      );
      console.log(
        `Engine DMG: ${p2aEngine.maxhp - p2aEngine.hp}, Sim DMG: ${p2aSim.maxhp - p2aSim.hp}`,
      );
      expect(p2aEngine.hp).toBe(p2aSim.hp);
      expect(p2aEngine.hp).toBeLessThan(p2aEngine.maxhp);
    });
  });
});
