import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "../sim-utils.js";

describe("Ability: Pixilate", () => {
  it("changes Normal-type moves to Fairy-type and boosts power by 1.2x", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "sylveon", ability: "pixilate", moves: ["bodyslam"] }),
        pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move bodyslam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
