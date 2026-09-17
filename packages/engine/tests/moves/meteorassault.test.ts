import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Meteor Assault deals damage and forces recharge on turn 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sirfetchd", ability: "scrappy", moves: ["meteorassault", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["meteorassault", "sleeptalk"],
    },
  );

  // Turn 1: Uses Meteor Assault, deals massive damage
  env.executeAndAssert("move meteorassault 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Meteor Assault blocked by Protect does not trigger recharge", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sirfetchd", ability: "scrappy", moves: ["meteorassault", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["protect", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["meteorassault", "protect", "sleeptalk"],
    },
  );

  // Turn 1: Target protects, Meteor Assault is blocked
  env.executeAndAssert("move meteorassault 1, move sleeptalk", "move protect, move sleeptalk");

  // Turn 2: Sirfetch'd was not forced to recharge, can act normally
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});
