import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Wide Lens", () => {
  it("boosts move accuracy by 1.1x", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "widelens",
          moves: ["playrough", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "snorlax",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move playrough 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
