import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: cottonspore lowers target's Speed by 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ampharos", ability: "static", moves: ["cottonspore"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["cottonspore", "sleeptalk"],
    },
  );

  // Jumpluff uses Cotton Spore on Snorlax and Venusaur (hits both adjacent foes in Gen 9, but let's test normally)
  env.executeAndAssert("move cottonspore, move sleeptalk", "move sleeptalk, move sleeptalk");
});
