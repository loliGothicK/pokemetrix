import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Endure leaves Pokemon at 1 HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["endure", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "machamp", ability: "noguard", moves: ["closecombat", "sleeptalk"] }),
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "closecombat", damage_roll: "max" }, "endure", "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Close Combat from Machamp will easily OHKO Snorlax
  env.executeAndAssert("move endure, move sleeptalk", "move closecombat 1, move sleeptalk");
});
