import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Metronome", () => {
  it("boosts power of consecutively used moves", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "clefable",
          ability: "magicguard",
          item: "metronome",
          moves: ["moonblast", "sleeptalk"],
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

    env.executeAndAssert("move moonblast 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
