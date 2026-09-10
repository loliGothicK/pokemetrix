import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Charge Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["chargebeam"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  // Use with deterministic secondary effect
  env.executeAndAssert("move chargebeam 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    secondary: "always",
  });
});
