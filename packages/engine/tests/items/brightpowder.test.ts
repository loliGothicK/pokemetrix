import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Bright Powder", () => {
  it("decreases attacker accuracy by 0.9x", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "snorlax",
          item: "brightpowder",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "pikachu",
          moves: ["quickattack", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move quickattack 1, move sleeptalk");
  });
});
