import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Heal Bell", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "chimecho", moves: ["healbell"], status: "brn" }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move healbell, move sleeptalk", "move sleeptalk, move sleeptalk");
});
