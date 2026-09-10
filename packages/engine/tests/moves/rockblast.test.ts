import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rock Blast", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["rockblast"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move rockblast 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
