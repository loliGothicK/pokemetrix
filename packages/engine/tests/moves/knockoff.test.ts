import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Knock Off", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["knockoff"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", item: "leftovers", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move knockoff 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
