import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rage Powder", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["ragepowder"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move ragepowder, move sleeptalk", "move sleeptalk, move sleeptalk");
});
