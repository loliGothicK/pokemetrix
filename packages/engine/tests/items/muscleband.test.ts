import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Muscle Band", () => {
  it("boosts physical moves by 1.1x", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "snorlax",
          item: "muscleband",
          moves: ["bodyslam"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "clefable",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
      ],
    );

    // Body Slam is a physical move boosted by 1.1x by Muscle Band.
    env.executeAndAssert("move bodyslam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
