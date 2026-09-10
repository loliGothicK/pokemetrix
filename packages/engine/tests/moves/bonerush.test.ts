import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bonerush hits 2 to 5 times", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["bonerush"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bonerush", multihit: 5, basePower: 30 }, "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
      },
    },
  );

  // Lucario uses Bone Rush on Pikachu (super effective).
  env.executeAndAssert("move bonerush 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
