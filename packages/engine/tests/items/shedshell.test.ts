import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Shed Shell", () => {
  it("allows holder to switch out freely", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "snorlax",
          item: "shedshell",
          moves: ["sleeptalk"],
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

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
