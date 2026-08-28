import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Mental Herb", () => {
  it("cures Taunt immediately and is consumed", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "clefable",
          item: "mentalherb",
          moves: ["moonblast", "sleeptalk"],
        }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "gengar",
          moves: ["taunt", "sleeptalk"],
        }),
        pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
      ],
    );

    // Gengar uses Taunt on Clefable.
    // Clefable's Mental Herb cures Taunt immediately and is consumed.
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move taunt 1, move sleeptalk");
  });
});
