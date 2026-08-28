import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: quickattack", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "pidgeot-mega", moves: ["quickattack"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // TODO: implement specific scenario for quickattack
    env.executeAndAssert("move quickattack 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
