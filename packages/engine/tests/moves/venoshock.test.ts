import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Venoshock deals double damage to poisoned targets", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["venoshock", "toxic"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "venoshock", damage_roll: "max" }, "toxic", "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Toxic on Vaporeon
  env.executeAndAssert("move toxic 2, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 2: Venoshock on Vaporeon
  env.executeAndAssert("move venoshock 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
