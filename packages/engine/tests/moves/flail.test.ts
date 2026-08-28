import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Flail", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", ability: "torrent", moves: ["flail"], hp: 1 }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move flail 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
