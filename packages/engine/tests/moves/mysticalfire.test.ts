import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Mystical Fire", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["mysticalfire"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move mysticalfire 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
