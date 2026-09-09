import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test.skip("Move: Lash Out", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["lashout"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move lashout 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
