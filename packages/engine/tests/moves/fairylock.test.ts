import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Fairy Lock", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "klefki", moves: ["fairylock", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
    { deterministicMoves: ["fairylock", "sleeptalk"] },
  );

  // Turn 1: Klefki uses Fairy Lock
  env.executeAndAssert("move fairylock, move sleeptalk", "move sleeptalk, move sleeptalk");
});
