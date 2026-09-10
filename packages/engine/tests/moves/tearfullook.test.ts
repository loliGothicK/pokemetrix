import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Tearful Look", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "floette", moves: ["tearfullook", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "tearfullook", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move tearfullook 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
