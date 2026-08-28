import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Seed Bomb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["seedbomb"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move seedbomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
