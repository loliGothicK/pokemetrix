import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Lock-On", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "dragapult", moves: ["lockon"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move lockon 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
