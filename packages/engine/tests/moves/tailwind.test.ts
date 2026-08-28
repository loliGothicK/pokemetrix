import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: tailwind doubles speed for 4 turns", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pidgeot", moves: ["tailwind", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    { deterministicMoves: ["tailwind", "sleeptalk"] },
  );

  env.executeAndAssert("move tailwind, move sleeptalk", "move sleeptalk, move sleeptalk");

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});
