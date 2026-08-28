import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Flower Trick", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "meowscarada", ability: "overgrow", moves: ["flowertrick"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move flowertrick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
