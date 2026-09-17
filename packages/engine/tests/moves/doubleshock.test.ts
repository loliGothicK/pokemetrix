import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Double Shock deals damage and removes Electric type on Turn 1, then fails on Turn 2", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pawmot", ability: "naturalcure", moves: ["doubleshock", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["doubleshock", "sleeptalk"],
    },
  );

  // Turn 1: Pawmot uses Double Shock successfully and loses Electric typing
  env.executeAndAssert("move doubleshock 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 2: Double Shock fails because Pawmot is no longer Electric type
  env.executeAndAssert("move doubleshock 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Double Shock is boosted by Iron Fist", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pawmot", ability: "ironfist", moves: ["doubleshock", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["doubleshock", "sleeptalk"],
    },
  );

  env.executeAndAssert("move doubleshock 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
