import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sky Attack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pidgeot-mega", moves: ["skyattack"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move skyattack 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
