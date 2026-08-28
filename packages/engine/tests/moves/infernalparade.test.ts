import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Infernal Parade", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hisuian-typhlosion", moves: ["infernalparade"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move infernalparade 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
