import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: faketears lowers target SpD by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["faketears"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["faketears", "sleeptalk"],
    },
  );

  env.executeAndAssert("move faketears 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
