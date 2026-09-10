import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Aerilate", () => {
  it("changes Normal-type moves to Flying-type and boosts power by 1.2x", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "pinsir-mega", ability: "aerilate", moves: ["bodyslam"] }),
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
