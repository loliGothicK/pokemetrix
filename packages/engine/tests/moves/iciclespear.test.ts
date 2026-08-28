import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Icicle Spear", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-ninetales", moves: ["iciclespear"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move iciclespear 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
