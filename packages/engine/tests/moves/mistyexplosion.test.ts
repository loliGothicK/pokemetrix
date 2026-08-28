import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Misty Explosion", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["mistyexplosion"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move mistyexplosion, move sleeptalk", "move sleeptalk, move sleeptalk");
});
