import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Magic Powder", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hatterene", moves: ["magicpowder"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move magicpowder 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
