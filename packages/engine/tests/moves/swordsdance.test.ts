import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Swords Dance", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "scizor", moves: ["swordsdance", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move swordsdance, move sleeptalk", "move sleeptalk, move sleeptalk");
});
