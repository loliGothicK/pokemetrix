import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Light Clay", () => {
  it("extends Reflect to 8 turns when used by holder", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "clefable",
          item: "lightclay",
          moves: ["reflect", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "snorlax",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move reflect, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
