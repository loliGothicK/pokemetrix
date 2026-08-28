import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Raging Bull", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", moves: ["ragingbull", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "ragingbull", accuracy: true }, "sleeptalk"],
    },
  );

  env.executeAndAssert("move ragingbull 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
