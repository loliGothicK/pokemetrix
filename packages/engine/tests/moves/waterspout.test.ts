import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Water Spout", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", ability: "torrent", moves: ["waterspout"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move waterspout, move sleeptalk", "move sleeptalk, move sleeptalk");
});
