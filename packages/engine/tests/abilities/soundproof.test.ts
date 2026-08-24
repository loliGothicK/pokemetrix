import { describe, expect, it } from "vitest";
import { run_turn } from "../../pkg-node";
import {
  pkmn,
  createSimBattle,
  withDeterministicMoves,
  buildEngineStateFromSim,
} from "../sim-utils";

describe("Ability: Soundproof (ぼうおん) Differential Test", () => {
  it("blocks damage and effects from sound-based moves", () => {
    const battle = createSimBattle();
    // Pikachu uses Bug Buzz, which is a sound move.
    withDeterministicMoves(battle, ["bugbuzz", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Incineroar", ability: "blaze", moves: ["bugbuzz"] }),
          pkmn({ species: "Charizard", ability: "blaze", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          // Abomasnow has Soundproof, which blocks Bug Buzz.
          pkmn({ species: "Abomasnow", ability: "soundproof", moves: ["sleeptalk"] }),
          pkmn({ species: "Blastoise", ability: "torrent", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12"); // send out

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "bugbuzz",
        p1a_target: 1, // Target Abomasnow (p2a)
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
      battle.makeChoices("move bugbuzz 1, move sleeptalk", "move sleeptalk, move sleeptalk");

      const p2aSim = battle.p2.active[0];
      const p2aEngine = result.p2[0];

      // P2A (Abomasnow) should take 0 damage because of Soundproof
      expect(p2aEngine.hp).toBe(p2aSim.hp);
      expect(p2aEngine.hp).toBe(p2aEngine.maxhp); // Took no damage
    });
  });

  it("blocks Parting Shot (すてゼリフ), preventing stat drops and switching", () => {
    const battle = createSimBattle();
    withDeterministicMoves(battle, ["partingshot", "sleeptalk"], () => {
      battle.setPlayer("p1", {
        team: [
          pkmn({ species: "Incineroar", ability: "intimidate", moves: ["partingshot"] }),
          pkmn({ species: "Charizard", ability: "blaze", moves: ["sleeptalk"] }),
        ],
      });
      battle.setPlayer("p2", {
        team: [
          // Abomasnow has Soundproof, which blocks Parting Shot.
          pkmn({ species: "Abomasnow", ability: "soundproof", moves: ["sleeptalk"] }),
          pkmn({ species: "Blastoise", ability: "torrent", moves: ["sleeptalk"] }),
        ],
      });
      battle.makeChoices("team 12", "team 12"); // send out

      const initialState = buildEngineStateFromSim(battle);
      let actions = {
        p1a: "partingshot",
        p1a_target: 1, // Target Abomasnow
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
      battle.makeChoices("move partingshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");

      const p2aSim = battle.p2.active[0];
      const p2aEngine = result.p2[0];

      // Intimidate triggers on switch-in, lowering Attack to -1.
      // Parting Shot fails due to Soundproof, so Attack stays at -1 and Sp. Atk stays at 0.
      expect(p2aEngine.boosts?.atk || 0).toBe(-1); // Only Intimidate applied
      expect(p2aEngine.boosts?.spa || 0).toBe(0); // Parting Shot failed, no Sp. Atk drop

      // Verify the Engine perfectly matches the Sim's state
      expect(p2aEngine.boosts?.atk || 0).toBe(p2aSim.boosts?.atk || 0);
      expect(p2aEngine.boosts?.spa || 0).toBe(p2aSim.boosts?.spa || 0);
    });
  });
});
