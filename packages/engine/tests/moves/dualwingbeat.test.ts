import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Dual Wingbeat", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", ability: "swarm", moves: ["dualwingbeat"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move dualwingbeat 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
