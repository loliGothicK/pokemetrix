import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Smart Strike", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["smartstrike"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move smartstrike 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
