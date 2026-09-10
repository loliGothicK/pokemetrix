import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Gastro Acid", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["gastroacid"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move gastroacid 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
