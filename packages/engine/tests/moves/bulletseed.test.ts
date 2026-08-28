import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Bullet Seed", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["bulletseed"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move bulletseed 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
