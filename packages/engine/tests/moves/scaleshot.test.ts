import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Scale Shot", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", moves: ["scaleshot", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "scaleshot", accuracy: true, multihit: 5 }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move scaleshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
