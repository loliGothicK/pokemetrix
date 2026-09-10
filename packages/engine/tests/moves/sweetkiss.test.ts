import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sweet Kiss", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "raichu", moves: ["sweetkiss", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "sweetkiss", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always" },
    },
  );

  env.executeAndAssert("move sweetkiss 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
