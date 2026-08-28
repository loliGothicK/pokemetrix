import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: nastyplot", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "pikachu", moves: ["nastyplot"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // TODO: implement specific scenario for nastyplot
    env.executeAndAssert("move nastyplot, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
