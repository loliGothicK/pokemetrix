import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Big Root", () => {
  it("boosts draining moves and Leech Seed recovery by 30%", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "venusaur",
          ability: "overgrow",
          item: "bigroot",
          moves: ["gigadrain", "leechseed", "sleeptalk"],
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

    env.executeAndAssert("move gigadrain 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
