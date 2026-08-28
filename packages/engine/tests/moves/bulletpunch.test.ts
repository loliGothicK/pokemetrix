import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bulletpunch has +1 priority", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "scizor", ability: "technician", moves: ["bulletpunch"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["bulletpunch", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Scizor uses Bullet Punch, hitting Venusaur (p2b) with priority.
  env.executeAndAssert("move bulletpunch 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
