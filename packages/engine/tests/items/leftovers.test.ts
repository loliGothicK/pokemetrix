import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Leftovers", () => {
  it("recovers 1/16 max HP at the end of turn", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "snorlax",
          item: "leftovers",
          moves: ["sleeptalk"],
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

    // Pikachu hits Snorlax with Quick Attack to chip HP. At end of turn, Leftovers recovers 1/16 HP.
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move quickattack 1, move sleeptalk");
  });
});
