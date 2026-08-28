import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Mean Look", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["meanlook"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move meanlook 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
