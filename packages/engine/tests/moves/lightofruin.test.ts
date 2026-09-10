import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Light of Ruin", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "floette", moves: ["lightofruin"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move lightofruin 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
