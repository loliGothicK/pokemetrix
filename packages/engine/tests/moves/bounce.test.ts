import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Bounce", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["bounce"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "bounce", secondary: "inherit" }, "sleeptalk"],
      engineConfig: { secondary: "always", accuracy: "always", crits: "never", damage_roll: "max" },
    },
  );

  // Turn 1: Spring up
  env.executeAndAssert("move bounce 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 2: Hit and Paralyze
  env.executeAndAssert("move bounce 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
