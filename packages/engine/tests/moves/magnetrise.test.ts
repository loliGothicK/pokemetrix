import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Magnet Rise", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "forretress", moves: ["magnetrise"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move magnetrise, move sleeptalk", "move sleeptalk, move sleeptalk");
});
