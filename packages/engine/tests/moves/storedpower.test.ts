import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stored Power", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["storedpower", "cosmicpower", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["storedpower", "cosmicpower", "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  env.executeTurn("move cosmicpower, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move storedpower 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
