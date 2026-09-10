import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Giga Impact", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["gigaimpact"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move gigaimpact 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
