import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stealth Rock", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["stealthrock"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move stealthrock, move sleeptalk", "move sleeptalk, move sleeptalk");
});
