import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Darkest Lariat", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "incineroar", moves: ["darkestlariat"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "incineroar", moves: ["bulkup", "sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Incineroar uses Bulk Up (+1 Def), Incineroar attacks
  env.executeAndAssert("move darkestlariat 1, move sleeptalk", "move bulkup, move sleeptalk");

  // Turn 2: Incineroar uses Bulk Up (+1 Def), Incineroar attacks
  env.executeAndAssert("move darkestlariat 1, move sleeptalk", "move bulkup, move sleeptalk");
});
