import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Vacuum Wave (priority Fighting-type special move)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", moves: ["vacuumwave"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move vacuumwave 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
