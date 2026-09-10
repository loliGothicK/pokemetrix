import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rain Dance", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["raindance"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move raindance, move sleeptalk", "move sleeptalk, move sleeptalk");
});
