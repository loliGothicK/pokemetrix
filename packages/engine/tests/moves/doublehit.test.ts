import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Double Hit", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kangaskhan", ability: "innerfocus", moves: ["doublehit"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move doublehit 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
