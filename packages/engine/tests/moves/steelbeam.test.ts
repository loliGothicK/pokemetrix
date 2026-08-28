import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Steel Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", moves: ["steelbeam", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "steelbeam", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move steelbeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
