import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Wise Glasses", () => {
  it("boosts special moves by 1.1x", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "gengar",
          item: "wiseglasses",
          moves: ["shadowball"],
        }),
        pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "clefable",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
    );

    // Shadow Ball is a special move boosted by 1.1x by Wise Glasses.
    env.executeAndAssert("move shadowball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
