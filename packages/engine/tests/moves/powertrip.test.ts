import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: powertrip", () => {
  it("should increase base power with stat boosts", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "empoleon", moves: ["powertrip", "swordsdance"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
    );

    // Turn 1: 0 boosts, 20 BP
    env.executeAndAssert("move powertrip 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });

    // Turn 2: +2 Atk
    env.executeTurn("move swordsdance, move sleeptalk", "move sleeptalk, move sleeptalk");

    // Turn 3: 2 boosts, 60 BP
    env.executeAndAssert("move powertrip 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });
  });
});
