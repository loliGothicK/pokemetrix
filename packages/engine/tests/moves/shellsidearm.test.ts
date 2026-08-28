import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shell Side Arm", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "galarian-slowbro", moves: ["shellsidearm"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move shellsidearm 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
