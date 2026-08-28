import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sweet Scent", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur", moves: ["sweetscent", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "sweetscent", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always" },
    },
  );

  env.executeAndAssert("move sweetscent, move sleeptalk", "move sleeptalk, move sleeptalk");
});
