import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Eruption", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "typhlosion", ability: "blaze", moves: ["eruption"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move eruption, move sleeptalk", "move sleeptalk, move sleeptalk");
});
