import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: icywind hits all adjacent foes and lowers speed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["icywind"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "icywind", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move icywind, move sleeptalk", "move sleeptalk, move sleeptalk");
});
