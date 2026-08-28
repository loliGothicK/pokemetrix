import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: powertrick", () => {
  it("should swap user's raw Atk and Def", () => {
    // Shuckle has 10 Atk, 230 Def
    const env = new TestEnvironment(
      [
        pokemon({ species: "forretress", moves: ["powertrick", "bugbite", "sleeptalk"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk", "bodyslam"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Turn 1: Tackle with 10 Atk
    env.executeAndAssert("move bugbite 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });

    // Turn 2: Power Trick swaps to 230 Atk
    env.executeAndAssert("move powertrick, move sleeptalk", "move sleeptalk, move sleeptalk");

    // Turn 3: Tackle with 230 Atk
    env.executeAndAssert("move bugbite 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });

    // Turn 4: Snorlax bodyslams Shuckle (hits 10 Def)
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move bodyslam 1, move sleeptalk", {
      damage_roll: "max",
    });
  });
});
