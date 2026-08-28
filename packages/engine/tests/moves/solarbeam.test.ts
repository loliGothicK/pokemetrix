import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Solar Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["solarbeam"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move solarbeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
