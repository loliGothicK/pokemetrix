import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Iron Ball", () => {
  it("halves speed and allows Ground moves to hit Flying-type Pokemon", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "swampert",
          ability: "torrent",
          moves: ["earthquake", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "skarmory",
          ability: "sturdy",
          item: "ironball",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move earthquake, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
