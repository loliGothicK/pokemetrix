import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: nightshade", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "clefable", moves: ["nightshade"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // TODO: implement specific scenario for nightshade
    env.executeAndAssert("move nightshade 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
