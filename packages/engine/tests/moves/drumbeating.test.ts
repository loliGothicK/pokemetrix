import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Drum Beating deals damage and lowers target Speed by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "rillaboom", ability: "overgrow", moves: ["drumbeating", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "drumbeating", secondary: "always" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );
  env.executeAndAssert("move drumbeating 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Drum Beating is not a sound move and is not blocked by Soundproof", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "rillaboom", ability: "overgrow", moves: ["drumbeating", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "kommo-o", ability: "soundproof", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "drumbeating", secondary: "always" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );
  env.executeAndAssert("move drumbeating 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
