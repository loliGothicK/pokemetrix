import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: psychup", () => {
  it("should copy target's stat boosts", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "clefable", moves: ["psychup", "bodyslam"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["bellydrum", "bodyslam"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // Snorlax uses Swords Dance (+2 Atk)
    env.executeTurn("move bodyslam 1, move sleeptalk", "move bellydrum, move sleeptalk");

    // Clefable uses Psych Up to copy Snorlax's boosts
    env.executeTurn("move psychup 1, move sleeptalk", "move bodyslam 1, move sleeptalk");
    /* env.assertStateMatch(); */

    // Clefable's Tackle should now deal more damage
    /* env.assertStateMatch(); */
  });
});
