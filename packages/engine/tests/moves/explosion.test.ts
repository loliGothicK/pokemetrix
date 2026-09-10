import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Explosion", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "forretress", ability: "sturdy", moves: ["explosion"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move explosion, move sleeptalk", "move sleeptalk, move sleeptalk");
});
