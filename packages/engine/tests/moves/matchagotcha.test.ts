import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Matcha Gotcha", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sinistcha", moves: ["matchagotcha", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "matchagotcha", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move matchagotcha, move sleeptalk", "move sleeptalk, move sleeptalk");
});
