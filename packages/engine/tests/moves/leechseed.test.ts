import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Leech Seed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["leechseed"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move leechseed 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
