import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Healing Wish", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["healingwish"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move healingwish, move sleeptalk", "move sleeptalk, move sleeptalk");
});
