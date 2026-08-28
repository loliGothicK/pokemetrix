import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Ice Punch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["icepunch"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move icepunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
