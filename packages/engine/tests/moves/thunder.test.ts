import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: thunder", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["thunder"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move thunder 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
