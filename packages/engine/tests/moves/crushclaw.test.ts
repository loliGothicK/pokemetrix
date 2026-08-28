import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Crush Claw", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "excadrill", moves: ["crushclaw"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
    {
      engineConfig: { secondary: "always" },
      deterministicMoves: [{ id: "crushclaw", secondary: "always" }],
    },
  );

  env.executeAndAssert("move crushclaw 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
