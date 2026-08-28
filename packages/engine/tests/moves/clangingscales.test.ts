import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Clanging Scales", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kommoo", ability: "soundproof", moves: ["clangingscales"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move clangingscales, move sleeptalk", "move sleeptalk, move sleeptalk");
});
