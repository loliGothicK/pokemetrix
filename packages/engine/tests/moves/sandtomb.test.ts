import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sand Tomb", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "forretress", moves: ["sandtomb"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sandtomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
