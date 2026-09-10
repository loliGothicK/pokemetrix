import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Morning Sun", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["morningsun"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move morningsun, move sleeptalk", "move sleeptalk, move sleeptalk");
});
