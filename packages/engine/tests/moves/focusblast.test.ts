import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Focus Blast", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", moves: ["focusblast"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    { deterministicMoves: [{ id: "focusblast", secondary: "always" }] },
  );

  env.executeAndAssert("move focusblast 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    secondary: "always",
  });
});
