import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Solar Blade", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "leafeon", moves: ["solarblade", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["solarblade", "sleeptalk"],
    },
  );

  env.executeAndAssert("move solarblade 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
