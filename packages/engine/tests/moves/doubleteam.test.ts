import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: doubleteam raises Evasion by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["doubleteam"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["doubleteam", "sleeptalk"],
    },
  );

  env.executeAndAssert("move doubleteam, move sleeptalk", "move sleeptalk, move sleeptalk");
});
