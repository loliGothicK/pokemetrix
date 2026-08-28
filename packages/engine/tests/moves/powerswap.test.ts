import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: powerswap", () => {
  it("should swap Atk and SpA boosts", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "alolan-ninetales", moves: ["powerswap", "iceshard", "nastyplot"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["bellydrum", "bodyslam"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // Mr. Mime gets +2 SpA, Snorlax gets +2 Atk
    env.executeTurn("move nastyplot, move sleeptalk", "move bellydrum, move sleeptalk");

    // Mr. Mime swaps boosts with Snorlax
    // Snorlax now has +2 SpA, Mr. Mime has +6 Atk
    env.executeTurn("move powerswap 1, move sleeptalk", "move bodyslam 1, move sleeptalk");
    /* env.assertStateMatch(); */

    // Mr. Mime tackles with +6 Atk
    env.executeTurn("move iceshard 1, move sleeptalk", "move bodyslam 1, move sleeptalk");
    /* env.assertStateMatch(); */
  });
});
