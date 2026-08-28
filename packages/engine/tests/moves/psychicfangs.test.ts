import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: psychicfangs", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "arbok", moves: ["psychicfangs"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // TODO: implement specific scenario for psychicfangs
    env.executeAndAssert("move psychicfangs 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
