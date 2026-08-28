import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: nuzzle", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["nuzzle"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "nuzzle", secondary: "always" }],
    },
  );

  env.executeAndAssert("move nuzzle 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
