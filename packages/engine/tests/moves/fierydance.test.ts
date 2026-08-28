import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: fierydance raises user's SpA by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "volcarona", ability: "flamebody", moves: ["fierydance"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "fierydance", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move fierydance 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
