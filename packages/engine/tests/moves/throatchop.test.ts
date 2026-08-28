import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Throat Chop", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["throatchop", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "throatchop", accuracy: true }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  env.executeAndAssert("move throatchop 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
