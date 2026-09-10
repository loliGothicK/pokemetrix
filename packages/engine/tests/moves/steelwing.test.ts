import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Steel Wing deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "skarmory", ability: "sturdy", moves: ["steelwing"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move steelwing 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
