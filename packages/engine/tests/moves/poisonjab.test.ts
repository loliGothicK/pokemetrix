import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Poison Jab", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["poisonjab"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move poisonjab 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
