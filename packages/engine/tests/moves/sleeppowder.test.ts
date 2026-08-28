import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sleep Powder", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["sleeppowder"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sleeppowder 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
