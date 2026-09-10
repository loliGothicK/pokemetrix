import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Shell Bell", () => {
  it("restores HP equal to 1/8 of damage dealt", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "snorlax",
          item: "shellbell",
          moves: ["bodyslam", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "pikachu",
          moves: ["quickattack", "sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Turn 1: Pikachu damages Snorlax with Quick Attack so Snorlax's HP is below max.
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move quickattack 1, move sleeptalk");

    // Turn 2: Snorlax attacks Clefable with Body Slam, dealing damage and healing 1/8 of damage dealt via Shell Bell.
    env.executeAndAssert("move bodyslam 2, move sleeptalk", "move sleeptalk, move sleeptalk", {
      secondary: "never",
    });
  });
});
