import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Helping Hand", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["helpinghand"] }),
      pokemon({ species: "clefable", moves: ["moonblast"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move helpinghand -2, move moonblast 1", "move sleeptalk, move sleeptalk");
});
