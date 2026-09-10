import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Jet Punch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "palafin-zero", moves: ["jetpunch"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move jetpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
