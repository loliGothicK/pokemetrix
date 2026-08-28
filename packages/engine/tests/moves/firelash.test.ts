import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Fire Lash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "salazzle", moves: ["firelash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    { deterministicMoves: [{ id: "firelash", secondary: "always" }] },
  );

  env.executeAndAssert("move firelash 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    secondary: "always",
  });
});
