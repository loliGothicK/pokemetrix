import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Snap Trap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "galarian-stunfisk", moves: ["snaptrap"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move snaptrap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
