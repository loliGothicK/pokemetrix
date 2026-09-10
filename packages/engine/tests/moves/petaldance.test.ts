import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: petaldance", () => {
  it("should match Showdown logs", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "venusaur-mega", moves: ["petaldance"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );

    // petaldance targets random opponent, providing a target fails in Showdown
    env.executeAndAssert("move petaldance, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
