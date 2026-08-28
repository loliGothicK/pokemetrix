import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: White Herb", () => {
  it("restores lowered stats to 0 and is consumed", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "lucario",
          item: "whiteherb",
          moves: ["closecombat", "sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "snorlax",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Lucario uses Close Combat on Snorlax.
    // Close Combat lowers Lucario's Def and SpD by 1 stage.
    // White Herb triggers and restores them to 0, consuming White Herb.
    env.executeAndAssert("move closecombat 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
