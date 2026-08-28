import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: powersplit", () => {
  it("should average Atk and SpA stats", () => {
    // Snorlax Speed 30, Cofagrigus Speed 30 causes speed ties. We use Charizard (Speed 100) instead to ensure deterministic move order.
    const env = new TestEnvironment(
      [
        pokemon({ species: "cofagrigus", moves: ["powersplit", "shadowball"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "gengar", moves: ["shadowball", "sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Charizard moves first, then Cofagrigus uses Power Split
    env.executeAndAssert("move powersplit 1, move sleeptalk", "move shadowball 1, move sleeptalk", {
      damage_roll: "max",
    });

    // Turn 2: Charizard uses shadowball again, but now with averaged SpA
    env.executeAndAssert("move shadowball 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      damage_roll: "max",
    });
  });
});
