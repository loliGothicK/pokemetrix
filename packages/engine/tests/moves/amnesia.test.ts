import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Amnesia", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["amnesia"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1, 2, 3: Amnesia 3 times to get to +6
  env.executeAndAssert("move amnesia, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move amnesia, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move amnesia, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 4: Should fail
  env.executeAndAssert("move amnesia, move sleeptalk", "move sleeptalk, move sleeptalk");
});
