import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Facade", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["facade"], status: "brn" }),
      pokemon({ species: "scizor", ability: "technician", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move facade 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
