import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Hex deals double damage to status targets", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["hex", "willowisp"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "hex", damage_roll: "max" }, "willowisp", "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // Turn 1: Will-o-Wisp on Vaporeon
  env.executeAndAssert("move willowisp 2, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 2: Hex on Vaporeon
  env.executeAndAssert("move hex 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
