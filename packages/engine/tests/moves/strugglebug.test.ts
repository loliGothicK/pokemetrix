import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Struggle Bug hits all opponents and lowers SpA", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["strugglebug"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["strugglebug", "sleeptalk"],
    },
  );

  env.executeAndAssert("move strugglebug, move sleeptalk", "move sleeptalk, move sleeptalk");
});
