import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: flashcannon lowers target SpD", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["flashcannon"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "flashcannon", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  env.executeAndAssert("move flashcannon 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
